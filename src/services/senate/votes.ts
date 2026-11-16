import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { legislativeFile, senateVote, senator } from "@/db/schema";

const SENATORS_URL = "https://data.senat.fr/data/senateurs/ODSEN_GENERAL.json";
const GROUPS_URL =
  "https://data.senat.fr/data/senateurs/ODSEN_HISTOGROUPES.json";
// Sitting senators, with their photo and the full name of their group
const SITTING_URL = "https://www.senat.fr/api-senat/senateurs.json";
const SENAT_URL = "https://www.senat.fr";
// "Groupe Les Républicains" → "Les Républicains"
const GROUP_PREFIX = /^Groupe (du |de la |des )?/;

const POSITIONS = {
  p: "for",
  c: "against",
  a: "abstention",
  n: "nonVoting",
} as const;

interface GroupMembership {
  code: string;
  end: string | null;
  name: string;
  start: string | null;
}

interface SenatorData {
  firstName: string;
  groups: GroupMembership[];
  lastName: string;
  photoUrl: string | null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// "2001/03/02 00:00:00" → "2001-03-02"
function day(value: string | null) {
  return value ? value.slice(0, 10).replaceAll("/", "-") : null;
}

// Every senator since 1958, with their dated political groups
async function loadSenators() {
  const [general, groups, sitting] = await Promise.all([
    fetchJson<{
      results: { Matricule: string; Nom_usuel: string; Prenom_usuel: string }[];
    }>(SENATORS_URL),
    fetchJson<{
      results: {
        Code_du_groupe_politique: string;
        Date_de_debut_d_appartenance: string | null;
        Date_de_fin_d_appartenance: string | null;
        Matricule: string;
        Nom_court_du_groupe_politique: string;
      }[];
    }>(GROUPS_URL),
    fetchJson<
      {
        groupe: { code: string; libelle: string };
        matricule: string;
        urlAvatar: string | null;
      }[]
    >(SITTING_URL),
  ]);

  // Current groups have a fuller name in the sitting senators list
  const currentGroupNames = new Map(
    sitting.map((s) => [s.groupe.code, s.groupe.libelle])
  );
  const photos = new Map(
    sitting.map((s) => [
      s.matricule,
      s.urlAvatar ? `${SENAT_URL}${s.urlAvatar}` : null,
    ])
  );

  const senators = new Map<string, SenatorData>();
  for (const s of general.results) {
    senators.set(s.Matricule, {
      firstName: s.Prenom_usuel,
      lastName: s.Nom_usuel,
      photoUrl: photos.get(s.Matricule) ?? null,
      groups: [],
    });
  }
  for (const g of groups.results) {
    const name =
      currentGroupNames.get(g.Code_du_groupe_politique) ??
      g.Nom_court_du_groupe_politique;
    senators.get(g.Matricule)?.groups.push({
      code: g.Code_du_groupe_politique,
      name: name.replace(GROUP_PREFIX, ""),
      start: day(g.Date_de_debut_d_appartenance),
      end: day(g.Date_de_fin_d_appartenance),
    });
  }
  return senators;
}

function groupAt(data: SenatorData | undefined, date: string) {
  const group = data?.groups.find(
    (g) =>
      (g.start === null || g.start <= date) && (g.end === null || g.end >= date)
  );
  return group ?? { code: "AUCUN", name: "Sans groupe" };
}

interface RawVote {
  matricule: string;
  siege?: number;
  vote: keyof typeof POSITIONS;
}

// Stores each senator's vote on the Senate scrutin of the bills, again when a
// later reading brings a new scrutin
export async function syncSenateNominativeVotes(): Promise<number> {
  const files = await db
    .select({
      pollId: legislativeFile.pollId,
      ref: legislativeFile.senateScrutinRef,
      date: legislativeFile.senateScrutinDate,
      storedRef: senateVote.scrutinRef,
    })
    .from(legislativeFile)
    .leftJoin(senateVote, eq(senateVote.pollId, legislativeFile.pollId))
    .where(
      and(
        isNotNull(legislativeFile.pollId),
        isNotNull(legislativeFile.senateScrutinRef)
      )
    )
    .groupBy(
      legislativeFile.pollId,
      legislativeFile.senateScrutinRef,
      legislativeFile.senateScrutinDate,
      senateVote.scrutinRef
    );
  const pending = files.filter((f) => f.storedRef !== f.ref);
  if (pending.length === 0) {
    return 0;
  }

  const senators = await loadSenators();
  let filled = 0;
  for (const file of pending) {
    const [session, number] = (file.ref ?? "").split("-");
    const res = await fetch(
      `${SENAT_URL}/scrutin-public/${session}/scr${session}-${number}.json`
    );
    if (!(res.ok && file.pollId)) {
      continue;
    }
    const { votes } = (await res.json()) as { votes: RawVote[] };
    const pollId = file.pollId;
    const date = file.date ?? "";

    await db.transaction(async (tx) => {
      await tx.delete(senateVote).where(eq(senateVote.pollId, pollId));
      for (const vote of votes) {
        const data = senators.get(vote.matricule);
        const position = POSITIONS[vote.vote];
        if (!(data && position)) {
          continue;
        }
        await tx
          .insert(senator)
          .values({
            id: vote.matricule,
            firstName: data.firstName,
            lastName: data.lastName,
            photoUrl: data.photoUrl,
          })
          .onConflictDoUpdate({
            target: senator.id,
            set: {
              firstName: data.firstName,
              lastName: data.lastName,
              photoUrl: data.photoUrl,
              syncedAt: new Date().toISOString(),
            },
          });
        const group = groupAt(data, date);
        await tx.insert(senateVote).values({
          id: `${pollId}:${vote.matricule}`,
          pollId,
          scrutinRef: file.ref ?? "",
          senatorId: vote.matricule,
          groupCode: group.code,
          groupName: group.name,
          position,
          // Only published on recent scrutins
          seat: vote.siege ?? null,
        });
      }
    });
    filled++;
  }
  return filled;
}

// Senators' votes and the count of each group, shaped like the Assemblée ones
export async function findSenateVotes(pollId: string) {
  const votes = await db
    .select({
      id: senator.id,
      firstName: senator.firstName,
      lastName: senator.lastName,
      photoUrl: senator.photoUrl,
      groupRef: senateVote.groupCode,
      groupName: senateVote.groupName,
      position: senateVote.position,
      seat: senateVote.seat,
    })
    .from(senateVote)
    .innerJoin(senator, eq(senator.id, senateVote.senatorId))
    .where(eq(senateVote.pollId, pollId));

  const groups = new Map<
    string,
    {
      groupRef: string;
      name: string;
      color: null;
      members: number;
      forCount: number;
      againstCount: number;
      abstentionCount: number;
      nonVotingCount: number;
    }
  >();
  for (const vote of votes) {
    const group = groups.get(vote.groupRef) ?? {
      groupRef: vote.groupRef,
      name: vote.groupName,
      color: null,
      members: 0,
      forCount: 0,
      againstCount: 0,
      abstentionCount: 0,
      nonVotingCount: 0,
    };
    group.members++;
    group[`${vote.position}Count`]++;
    groups.set(vote.groupRef, group);
  }
  return { groups: [...groups.values()], votes };
}
