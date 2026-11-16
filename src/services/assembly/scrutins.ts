import { exec as execCb } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import { legislativeFile, poll } from "@/db/schema";
import { detectLegislature } from "./legislature";

const exec = promisify(execCb);
const BASE_URL =
  "https://data.assemblee-nationale.fr/static/openData/repository";

export interface ScrutinData {
  scrutin: {
    uid: string;
    dateScrutin: string;
    lieuVote?: string;
    titre: string;
    sort: { code: string };
    syntheseVote: {
      decompte: {
        pour: string;
        contre: string;
        abstentions: string;
      };
    };
    objet: {
      dossierLegislatif?: {
        dossierRef: string;
      } | null;
    };
  };
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type FileRecord = typeof legislativeFile.$inferSelect;

export function findMatchingFile(
  scrutin: ScrutinData["scrutin"],
  byRef: Map<string, FileRecord>,
  byTitle: Map<string, FileRecord>
): FileRecord | undefined {
  // Method 1: direct dossierRef link
  const dossierRef = scrutin.objet?.dossierLegislatif?.dossierRef;
  if (dossierRef) {
    const found = byRef.get(dossierRef);
    if (found) {
      return found;
    }
  }

  // Method 2: title matching
  const scrutinTitle = normalizeTitle(scrutin.titre);
  for (const [title, f] of byTitle) {
    if (scrutinTitle.includes(title) || title.includes(scrutinTitle)) {
      return f;
    }
  }

  return undefined;
}

// Every scrutin of the legislature, one JSON file each, named by its uid
export async function extractScrutinsArchive(legislature: string) {
  const url = `${BASE_URL}/${legislature}/loi/scrutins/Scrutins.json.zip`;

  const dir = join(tmpdir(), "republique-vote-sync");
  await mkdir(dir, { recursive: true });

  const zipPath = join(dir, `scrutins-${legislature}.zip`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download scrutins: ${res.status}`);
  }

  await writeFile(zipPath, Buffer.from(await res.arrayBuffer()));

  const extractDir = join(dir, `scrutins-${legislature}`);
  await mkdir(extractDir, { recursive: true });
  await exec(`unzip -o -q "${zipPath}" -d "${extractDir}"`);

  return join(extractDir, "json");
}

// Matches the final vote on the whole text of each bill. A past legislature
// can be read for a few bills only, e.g. an imported constitutional revision
export async function syncScrutins(
  legislature?: string,
  onlyFileIds?: Set<string>
): Promise<number> {
  const scrutinsLegislature = legislature ?? (await detectLegislature());
  const jsonDir = await extractScrutinsArchive(scrutinsLegislature);
  const files = await readdir(jsonDir);

  // Load all legislative files with their poll IDs
  const allFiles = (await db.select().from(legislativeFile)).filter(
    (f) => !onlyFileIds || onlyFileIds.has(f.id)
  );
  const filesByRef = new Map(allFiles.map((f) => [f.id, f]));
  const filesByTitle = new Map(
    allFiles.map((f) => [normalizeTitle(f.title), f])
  );

  let matched = 0;

  for (const file of files) {
    if (!file.endsWith(".json")) {
      continue;
    }

    const raw = await readFile(join(jsonDir, file), "utf-8");
    const data: ScrutinData = JSON.parse(raw);
    const s = data.scrutin;

    // Only final votes ("l'ensemble") of the Assemblée: the Congrès votes in
    // the same archive are handled by syncCongress
    if (
      s.lieuVote === "Congrès" ||
      !s.titre.toLowerCase().includes("ensemble")
    ) {
      continue;
    }

    const matchedFile = findMatchingFile(s, filesByRef, filesByTitle);
    if (!matchedFile?.pollId) {
      continue;
    }

    // Already has official results
    if (matchedFile.scrutinUid) {
      continue;
    }

    const decompte = s.syntheseVote?.decompte;
    if (!decompte) {
      continue;
    }

    // Update legislative file with official results
    await db
      .update(legislativeFile)
      .set({
        officialFor: Number(decompte.pour),
        officialAgainst: Number(decompte.contre),
        officialAbstentions: Number(decompte.abstentions),
        scrutinDate: s.dateScrutin,
        scrutinUid: s.uid,
        syncedAt: new Date().toISOString(),
      })
      .where(eq(legislativeFile.id, matchedFile.id));

    // Close the poll on the day the deputies voted
    await db
      .update(poll)
      .set({ status: "closed", endDate: s.dateScrutin })
      .where(eq(poll.id, matchedFile.pollId));

    matched++;
  }

  // Polls closed before the end date was recorded
  await db
    .update(poll)
    .set({ endDate: legislativeFile.scrutinDate })
    .from(legislativeFile)
    .where(
      and(
        eq(legislativeFile.pollId, poll.id),
        eq(poll.status, "closed"),
        isNull(poll.endDate),
        isNotNull(legislativeFile.scrutinDate)
      )
    );

  return matched;
}
