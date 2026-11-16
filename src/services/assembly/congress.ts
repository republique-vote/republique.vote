import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  congressGroup,
  congressVote,
  deputy,
  legislativeFile,
  poll,
} from "@/db/schema";
import { loadActors, upsertDeputy } from "./authors";
import { detectLegislature } from "./legislature";
import {
  extractScrutinsArchive,
  findMatchingFile,
  normalizeTitle,
  type ScrutinData,
} from "./scrutins";

type Position = "for" | "against" | "abstention" | "nonVoting";

// The Congrès uses singular keys in its nominative count
const POSITION_KEYS: [string, Position][] = [
  ["pour", "for"],
  ["contre", "against"],
  ["abstention", "abstention"],
  ["nonVotant", "nonVoting"],
];

interface RawVoter {
  acteurRef: string;
}

interface CongressScrutin {
  scrutin: ScrutinData["scrutin"] & {
    syntheseVote: { nbrSuffragesRequis?: string };
    ventilationVotes?: {
      organe?: {
        groupes?: {
          groupe:
            | {
                nombreMembresGroupe: string;
                organeRef: string;
                vote: {
                  decompteNominatif: Record<
                    string,
                    { votant?: RawVoter | RawVoter[] } | null
                  >;
                };
              }[]
            | undefined;
        };
      };
    };
  };
}

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

// Results and nominative votes of the Congrès on constitutional revisions.
// It meets rarely: most runs find nothing new
export async function syncCongress(legislature?: string): Promise<number> {
  const scrutinsLegislature = legislature ?? (await detectLegislature());
  const dir = await extractScrutinsArchive(scrutinsLegislature);

  const scrutins: CongressScrutin["scrutin"][] = [];
  for (const file of await readdir(dir)) {
    if (!file.endsWith(".json")) {
      continue;
    }
    const { scrutin }: CongressScrutin = JSON.parse(
      await readFile(join(dir, file), "utf-8")
    );
    if (scrutin.lieuVote === "Congrès") {
      scrutins.push(scrutin);
    }
  }
  if (scrutins.length === 0) {
    return 0;
  }

  const files = await db.select().from(legislativeFile);
  const byRef = new Map(files.map((f) => [f.id, f]));
  const byTitle = new Map(files.map((f) => [normalizeTitle(f.title), f]));
  const actorData = await loadActors(scrutinsLegislature);

  let stored = 0;
  for (const s of scrutins) {
    const file = findMatchingFile(s, byRef, byTitle);
    const pollId = file?.pollId;
    if (!(file && pollId) || file.congressScrutinUid === s.uid) {
      continue;
    }
    const decompte = s.syntheseVote.decompte;
    const groups = asArray(s.ventilationVotes?.organe?.groupes?.groupe);

    await db.transaction(async (tx) => {
      await tx.delete(congressVote).where(eq(congressVote.pollId, pollId));
      await tx.delete(congressGroup).where(eq(congressGroup.pollId, pollId));

      for (const g of groups) {
        const voters = POSITION_KEYS.flatMap(([key, position]) =>
          asArray(g.vote.decompteNominatif[key]?.votant).map((voter) => ({
            voter,
            position,
          }))
        );
        const count = (position: Position) =>
          voters.filter((v) => v.position === position).length;
        const group = actorData.groups.get(g.organeRef);
        await tx.insert(congressGroup).values({
          id: `${pollId}:${g.organeRef}`,
          pollId,
          groupRef: g.organeRef,
          name: group?.name ?? "Groupe inconnu",
          color: group?.color ?? null,
          members: Number(g.nombreMembresGroupe) || voters.length,
          forCount: count("for"),
          againstCount: count("against"),
          abstentionCount: count("abstention"),
          nonVotingCount: count("nonVoting"),
        });

        for (const { voter, position } of voters) {
          const actor = actorData.actors.get(voter.acteurRef);
          if (!actor) {
            continue;
          }
          await upsertDeputy(tx, voter.acteurRef, actor);
          await tx
            .insert(congressVote)
            .values({
              id: `${pollId}:${voter.acteurRef}`,
              pollId,
              actorId: voter.acteurRef,
              groupRef: g.organeRef,
              position,
            })
            .onConflictDoNothing();
        }
      }

      await tx
        .update(legislativeFile)
        .set({
          congressFor: Number(decompte.pour),
          congressAgainst: Number(decompte.contre),
          congressAbstentions: Number(decompte.abstentions),
          congressRequired: Number(s.syntheseVote.nbrSuffragesRequis) || null,
          congressScrutinDate: s.dateScrutin,
          congressScrutinUid: s.uid,
        })
        .where(eq(legislativeFile.id, file.id));
      // The Congrès ends the path of a constitutional revision: close the
      // citizen vote if the deputies' vote has not already done it
      await tx
        .update(poll)
        .set({ status: "closed", endDate: s.dateScrutin })
        .where(and(eq(poll.id, pollId), eq(poll.status, "open")));
    });
    stored++;
  }
  return stored;
}

export async function findCongressVotes(pollId: string) {
  const [groups, votes] = await Promise.all([
    db.select().from(congressGroup).where(eq(congressGroup.pollId, pollId)),
    db
      .select({
        id: deputy.id,
        firstName: deputy.firstName,
        lastName: deputy.lastName,
        photoLegislature: deputy.photoLegislature,
        groupRef: congressVote.groupRef,
        position: congressVote.position,
      })
      .from(congressVote)
      .innerJoin(deputy, eq(deputy.id, congressVote.actorId))
      .where(eq(congressVote.pollId, pollId)),
  ]);
  return { groups, votes };
}
