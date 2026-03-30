import { exec as execCb } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { legislativeFile, poll } from "@/db/schema";
import { detectLegislature } from "./legislature";

const exec = promisify(execCb);
const BASE_URL =
  "https://data.assemblee-nationale.fr/static/openData/repository";

interface ScrutinData {
  scrutin: {
    uid: string;
    dateScrutin: string;
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

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type FileRecord = typeof legislativeFile.$inferSelect;

function findMatchingFile(
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

export async function syncScrutins(): Promise<number> {
  const legislature = await detectLegislature();
  const url = `${BASE_URL}/${legislature}/loi/scrutins/Scrutins.json.zip`;

  const dir = join(tmpdir(), "republique-vote-sync");
  await mkdir(dir, { recursive: true });

  const zipPath = join(dir, "scrutins.zip");
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download scrutins: ${res.status}`);
  }

  await writeFile(zipPath, Buffer.from(await res.arrayBuffer()));

  const extractDir = join(dir, "scrutins");
  await mkdir(extractDir, { recursive: true });
  await exec(`unzip -o -q "${zipPath}" -d "${extractDir}"`);

  const jsonDir = join(extractDir, "json");
  const files = await readdir(jsonDir);

  // Load all legislative files with their poll IDs
  const allFiles = await db.select().from(legislativeFile);
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

    // Only final votes ("l'ensemble")
    if (!s.titre.toLowerCase().includes("ensemble")) {
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

    // Close the poll
    await db
      .update(poll)
      .set({ status: "closed" })
      .where(eq(poll.id, matchedFile.pollId));

    matched++;
  }

  return matched;
}
