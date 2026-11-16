import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { deputy, legislativeFile, pollAuthor } from "@/db/schema";
import { detectLegislature } from "./legislature";
import {
  BASE_URL,
  downloadAndExtractZip,
  extractDossiersArchive,
  findTexteAssocie,
  unzipTo,
} from "./sync";

interface GroupMandate {
  end: string | null;
  organeRef: string;
  start: string;
}

interface MinistryMandate extends GroupMandate {
  quality: string;
}

interface SeatMandate extends GroupMandate {
  seat: number;
}

interface Actor {
  firstName: string;
  groups: GroupMandate[];
  lastName: string;
  ministries: MinistryMandate[];
  photoLegislature: string | null;
  // Assigned seats in the hemicycle, one per Assemblée mandate
  seats: SeatMandate[];
}

interface Group {
  abbrev: string | null;
  color: string | null;
  name: string;
}

interface Signature {
  actorRef: string;
  role: "author" | "cosignatory";
  signedAt: string | null;
}

// Open data turns single elements into objects and repeated ones into arrays
function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

interface RawMandate {
  dateDebut: string;
  dateFin: string | null;
  infosQualite?: { libQualite?: string };
  legislature: string | null;
  mandature?: { placeHemicycle?: string | null };
  organes: { organeRef: string };
  typeOrgane: string;
}

export type ActorData = Awaited<ReturnType<typeof downloadActors>>;
export type { Actor };

// The archive is large: download it once per process run
const actorsCache = new Map<string, Promise<ActorData>>();

export function loadActors(legislature: string) {
  let cached = actorsCache.get(legislature);
  if (!cached) {
    cached = downloadActors(legislature);
    actorsCache.set(legislature, cached);
  }
  return cached;
}

// Every member of parliament and government since 1958, with their mandates
async function downloadActors(legislature: string) {
  const url = `${BASE_URL}/${legislature}/amo/tous_acteurs_mandats_organes_xi_legislature/AMO30_tous_acteurs_tous_mandats_tous_organes_historique.json.zip`;
  // One folder per legislature, like the other archives
  const dir = await unzipTo(
    await downloadAndExtractZip(url, `actors-${legislature}.zip`),
    `actors-${legislature}`
  );

  const actors = new Map<string, Actor>();
  for (const file of await readdir(join(dir, "json", "acteur"))) {
    const { acteur } = JSON.parse(
      await readFile(join(dir, "json", "acteur", file), "utf-8")
    );
    const mandates = asArray<RawMandate>(acteur.mandats?.mandat);
    const legislatures = mandates
      .filter((m) => m.typeOrgane === "ASSEMBLEE" && m.legislature)
      .map((m) => Number(m.legislature));

    actors.set(acteur.uid["#text"], {
      firstName: acteur.etatCivil.ident.prenom,
      lastName: acteur.etatCivil.ident.nom,
      photoLegislature: legislatures.length
        ? String(Math.max(...legislatures))
        : null,
      groups: mandates
        .filter((m) => m.typeOrgane === "GP")
        .map((m) => ({
          organeRef: m.organes.organeRef,
          start: m.dateDebut,
          end: m.dateFin,
        })),
      seats: mandates
        .filter((m) => m.typeOrgane === "ASSEMBLEE")
        .flatMap((m) => {
          const seat = Number(m.mandature?.placeHemicycle);
          return seat > 0
            ? [
                {
                  organeRef: m.organes.organeRef,
                  start: m.dateDebut,
                  end: m.dateFin,
                  seat,
                },
              ]
            : [];
        }),
      ministries: mandates
        .filter((m) => m.typeOrgane === "MINISTERE")
        .map((m) => ({
          organeRef: m.organes.organeRef,
          start: m.dateDebut,
          end: m.dateFin,
          quality: m.infosQualite?.libQualite ?? "Ministre",
        })),
    });
  }

  const groups = new Map<string, Group>();
  // "de la ville et du logement", to build "Ministre de la ville et du logement"
  const ministries = new Map<string, string | null>();
  for (const file of await readdir(join(dir, "json", "organe"))) {
    const { organe } = JSON.parse(
      await readFile(join(dir, "json", "organe", file), "utf-8")
    );
    // Groups of the Senate too, for the votes of the Congrès
    if (organe.codeType === "GP" || organe.codeType === "GROUPESENAT") {
      groups.set(organe.uid, {
        // Both chambers have a "Les Républicains" group, side by side at the
        // Congrès
        name:
          organe.codeType === "GROUPESENAT"
            ? `${organe.libelle} (Sénat)`
            : organe.libelle,
        abbrev: organe.libelleAbrev ?? null,
        color: organe.couleurAssociee ?? null,
      });
    }
    if (organe.codeType === "MINISTERE") {
      ministries.set(organe.uid, organe.libelleEdition ?? null);
    }
  }

  return { actors, groups, ministries };
}

function activeAt<T extends GroupMandate>(mandates: T[], date: string) {
  const day = date.slice(0, 10);
  return mandates.find(
    (m) => m.start <= day && (m.end === null || m.end >= day)
  );
}

// Seat of a member of parliament on a given day
export function seatAt(actor: Actor, date: string) {
  return activeAt(actor.seats, date)?.seat ?? null;
}

// Government role when signing, e.g. "Premier ministre" or "Ministre de la
// ville et du logement"; null for members of parliament
function functionAt(
  actor: Actor,
  ministries: Map<string, string | null>,
  date: string
) {
  const mandate = activeAt(actor.ministries, date);
  if (!mandate) {
    return null;
  }
  const edition = ministries.get(mandate.organeRef);
  return edition && mandate.quality !== "Premier ministre"
    ? `${mandate.quality} ${edition}`
    : mandate.quality;
}

function groupAt(actor: Actor, groups: Map<string, Group>, date: string) {
  const mandate = activeAt(actor.groups, date);
  return mandate ? (groups.get(mandate.organeRef) ?? null) : null;
}

interface RawSigner {
  acteur?: { acteurRef: string };
  dateCosignature?: string;
  dateRetraitCosignature?: string | null;
}

async function readSignatures(
  dossiersDir: string,
  dossierId: string
): Promise<{ signatures: Signature[]; depositDate: string | null } | null> {
  try {
    const dossier = JSON.parse(
      await readFile(
        join(dossiersDir, "json", "dossierParlementaire", `${dossierId}.json`),
        "utf-8"
      )
    );
    const textUid = findTexteAssocie(
      dossier.dossierParlementaire.actesLegislatifs
    );
    if (!textUid) {
      return null;
    }
    const { document } = JSON.parse(
      await readFile(
        join(dossiersDir, "json", "document", `${textUid}.json`),
        "utf-8"
      )
    );
    const depositDate: string | null =
      document.cycleDeVie?.chrono?.dateDepot ?? null;

    const authors = asArray<RawSigner>(document.auteurs?.auteur)
      .filter((a) => a.acteur)
      .map((a) => ({
        actorRef: a.acteur?.acteurRef as string,
        role: "author" as const,
        signedAt: depositDate,
      }));
    const cosignatories = asArray<RawSigner>(
      document.coSignataires?.coSignataire
    )
      // A withdrawn signature no longer supports the bill
      .filter((c) => c.acteur && !c.dateRetraitCosignature)
      .map((c) => ({
        actorRef: c.acteur?.acteurRef as string,
        role: "cosignatory" as const,
        signedAt: c.dateCosignature ?? depositDate,
      }));

    return { signatures: [...authors, ...cosignatories], depositDate };
  } catch {
    // Some old dossiers have no document file in the archive
    return null;
  }
}

type Executor = Pick<typeof db, "insert">;

// Keeps names and photo folder current every time someone shows up again
export async function upsertDeputy(
  executor: Executor,
  id: string,
  actor: Actor
) {
  await executor
    .insert(deputy)
    .values({
      id,
      firstName: actor.firstName,
      lastName: actor.lastName,
      photoLegislature: actor.photoLegislature,
    })
    .onConflictDoUpdate({
      target: deputy.id,
      set: {
        firstName: actor.firstName,
        lastName: actor.lastName,
        photoLegislature: actor.photoLegislature,
        syncedAt: new Date().toISOString(),
      },
    });
}

// Fills authors and cosignatories for the polls that have none yet
export async function syncAuthors(): Promise<number> {
  const pending = await db
    .select({ pollId: legislativeFile.pollId, dossierId: legislativeFile.id })
    .from(legislativeFile)
    .leftJoin(pollAuthor, eq(pollAuthor.pollId, legislativeFile.pollId))
    .where(isNull(pollAuthor.pollId));
  const polls = pending.filter(
    (p): p is { pollId: string; dossierId: string } => p.pollId !== null
  );
  if (polls.length === 0) {
    return 0;
  }

  const legislature = await detectLegislature();
  const dossiersDir = await extractDossiersArchive(legislature);
  const { actors, groups, ministries } = await loadActors(legislature);

  let filled = 0;
  for (const p of polls) {
    const result = await readSignatures(dossiersDir, p.dossierId);
    const known = (result?.signatures ?? []).filter((s) =>
      actors.has(s.actorRef)
    );
    if (known.length === 0) {
      continue;
    }

    await db.transaction(async (tx) => {
      for (const [position, s] of known.entries()) {
        const actor = actors.get(s.actorRef) as Actor;
        await upsertDeputy(tx, s.actorRef, actor);
        const date =
          s.signedAt ?? result?.depositDate ?? new Date().toISOString();
        const group = groupAt(actor, groups, date);
        await tx
          .insert(pollAuthor)
          .values({
            pollId: p.pollId,
            deputyId: s.actorRef,
            role: s.role,
            position,
            signedAt: s.signedAt,
            groupName: group?.name ?? null,
            groupAbbrev: group?.abbrev ?? null,
            groupColor: group?.color ?? null,
            functionTitle: functionAt(actor, ministries, date),
          })
          .onConflictDoNothing();
      }
    });
    filled++;
  }

  return filled;
}

export function findPollAuthors(pollId: string) {
  return db
    .select({
      id: deputy.id,
      firstName: deputy.firstName,
      lastName: deputy.lastName,
      photoLegislature: deputy.photoLegislature,
      role: pollAuthor.role,
      groupName: pollAuthor.groupName,
      functionTitle: pollAuthor.functionTitle,
      groupAbbrev: pollAuthor.groupAbbrev,
      groupColor: pollAuthor.groupColor,
    })
    .from(pollAuthor)
    .innerJoin(deputy, eq(deputy.id, pollAuthor.deputyId))
    .where(eq(pollAuthor.pollId, pollId))
    .orderBy(pollAuthor.position);
}
