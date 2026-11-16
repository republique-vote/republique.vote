import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  deputy,
  legislativeFile,
  scrutinGroup,
  scrutinVote,
} from "@/db/schema";
import { loadActors, upsertDeputy } from "./authors";
import { detectLegislature } from "./legislature";
import { extractScrutinsArchive } from "./scrutins";

type Position = "for" | "against" | "abstention" | "nonVoting";

// Keys of the open data nominative count, mapped to our positions
const POSITION_KEYS: [string, Position][] = [
  ["pours", "for"],
  ["contres", "against"],
  ["abstentions", "abstention"],
  ["nonVotants", "nonVoting"],
];

interface RawVoter {
  acteurRef: string;
  numPlace?: string;
}

interface RawGroup {
  nombreMembresGroupe: string;
  organeRef: string;
  vote: {
    decompteNominatif: Record<
      string,
      { votant?: RawVoter | RawVoter[] } | null
    >;
  };
}

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function seatNumber(voter: RawVoter) {
  const seat = Number(voter.numPlace);
  return Number.isFinite(seat) && seat > 0 ? seat : null;
}

// Stores every member's position on the official scrutin of the polls that
// have one and no nominative votes yet
export async function syncScrutinVotes(): Promise<number> {
  const pending = await db
    .selectDistinct({
      pollId: legislativeFile.pollId,
      scrutinUid: legislativeFile.scrutinUid,
    })
    .from(legislativeFile)
    .leftJoin(scrutinGroup, eq(scrutinGroup.pollId, legislativeFile.pollId))
    .where(
      and(isNotNull(legislativeFile.scrutinUid), isNull(scrutinGroup.pollId))
    );
  const polls = pending.filter(
    (p): p is { pollId: string; scrutinUid: string } =>
      p.pollId !== null && p.scrutinUid !== null
  );
  if (polls.length === 0) {
    return 0;
  }

  const legislature = await detectLegislature();
  const scrutinsDir = await extractScrutinsArchive(legislature);
  const { actors, groups } = await loadActors(legislature);

  let filled = 0;
  for (const p of polls) {
    let rawGroups: RawGroup[];
    try {
      const { scrutin } = JSON.parse(
        await readFile(join(scrutinsDir, `${p.scrutinUid}.json`), "utf-8")
      );
      rawGroups = asArray<RawGroup>(
        scrutin.ventilationVotes?.organe?.groupes?.groupe
      );
    } catch {
      // Scrutin from another legislature, not in this archive
      continue;
    }
    if (rawGroups.length === 0) {
      continue;
    }

    await db.transaction(async (tx) => {
      for (const g of rawGroups) {
        const voters = POSITION_KEYS.flatMap(([key, position]) =>
          asArray(g.vote.decompteNominatif[key]?.votant).map((voter) => ({
            voter,
            position,
          }))
        );
        const seats = voters
          .map(({ voter }) => seatNumber(voter))
          .filter((seat): seat is number => seat !== null);
        const count = (position: Position) =>
          voters.filter((v) => v.position === position).length;
        const group = groups.get(g.organeRef);

        await tx.insert(scrutinGroup).values({
          pollId: p.pollId,
          groupRef: g.organeRef,
          name: group?.name ?? "Groupe inconnu",
          abbrev: group?.abbrev ?? null,
          color: group?.color ?? null,
          seatOrder: seats.length
            ? Math.round(seats.reduce((a, b) => a + b, 0) / seats.length)
            : 0,
          members: Number(g.nombreMembresGroupe) || voters.length,
          forCount: count("for"),
          againstCount: count("against"),
          abstentionCount: count("abstention"),
          nonVotingCount: count("nonVoting"),
        });

        for (const { voter, position } of voters) {
          const actor = actors.get(voter.acteurRef);
          if (!actor) {
            continue;
          }
          await upsertDeputy(tx, voter.acteurRef, actor);
          await tx
            .insert(scrutinVote)
            .values({
              pollId: p.pollId,
              deputyId: voter.acteurRef,
              groupRef: g.organeRef,
              position,
              seat: seatNumber(voter),
            })
            .onConflictDoNothing();
        }
      }
    });
    filled++;
  }

  return filled;
}

export async function findScrutinVotes(pollId: string) {
  const [groupRows, voteRows] = await Promise.all([
    db.select().from(scrutinGroup).where(eq(scrutinGroup.pollId, pollId)),
    db
      .select({
        id: deputy.id,
        firstName: deputy.firstName,
        lastName: deputy.lastName,
        groupRef: scrutinVote.groupRef,
        position: scrutinVote.position,
        seat: scrutinVote.seat,
      })
      .from(scrutinVote)
      .innerJoin(deputy, eq(deputy.id, scrutinVote.deputyId))
      .where(eq(scrutinVote.pollId, pollId)),
  ]);
  return { groups: groupRows, votes: voteRows };
}
