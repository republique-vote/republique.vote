import { createReadStream } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { legislativeFile } from "@/db/schema";
import { downloadAndExtractZip, unzipTo } from "@/services/assembly/sync";

// Senate legislative database (Dosleg): bills, readings and public votes,
// published daily as a PostgreSQL dump under the Licence Ouverte
const DOSLEG_URL = "https://data.senat.fr/data/dosleg/dosleg.zip";

// Only the tables needed to go from a bill to its public votes
const TABLES = new Set(["loi", "lecture", "lecass", "date_seance", "scr"]);
const COPY_HEADER = /^COPY (\w+) \(([^)]+)\) FROM stdin;$/;
const ESCAPE = /\\(.)/g;
const ESCAPES: Record<string, string> = { t: "\t", n: "\n", r: "\r" };
// "Sur l'ensemble du projet de loi…", or for a single-article text "sur
// l'article unique constituant l'ensemble…", but not "sur l'ensemble de la
// troisième partie" of a budget bill
const WHOLE_TEXT =
  /^sur l['’](ensemble|article unique constituant l['’]ensemble)/i;
const PART_OF_TEXT = /^sur l['’]ensemble de la [a-zé]+ partie/i;

// Both URL forms exist: /dossier-legislatif/ and the older /dossierleg/
const SIGNET_IN_URL =
  /\/(?:dossier-legislatif|dossierleg)\/([^/]+?)(?:\.html)?$/;

type Row = Record<string, string | null>;

// Rows of COPY blocks: tab separated, \N for null, backslash escapes, and
// char(n) keys padded with spaces
async function readDump(path: string) {
  const tables = new Map<string, Row[]>();
  let current: { name: string; columns: string[]; rows: Row[] } | null = null;

  const lines = createInterface({ input: createReadStream(path, "utf-8") });
  for await (const line of lines) {
    if (current) {
      if (line === "\\.") {
        tables.set(current.name, current.rows);
        current = null;
        continue;
      }
      const values = line.split("\t");
      const row: Row = {};
      current.columns.forEach((column, i) => {
        const value = values[i];
        row[column] =
          value === undefined || value === "\\N"
            ? null
            : value.replace(ESCAPE, (_, c: string) => ESCAPES[c] ?? c).trim();
      });
      current.rows.push(row);
      continue;
    }
    const header = COPY_HEADER.exec(line);
    if (header && TABLES.has(header[1])) {
      current = {
        name: header[1],
        columns: header[2].split(", "),
        rows: [],
      };
    }
  }
  return tables;
}

interface SenateVote {
  abstentions: number;
  against: number;
  date: string;
  for: number;
  ref: string;
}

// Latest public vote on the whole text, by bill signet (e.g. "ppl23-735")
function latestWholeTextVotes(tables: Map<string, Row[]>) {
  const rows = (name: string) => tables.get(name) ?? [];
  const signetByLoi = new Map(rows("loi").map((r) => [r.loicod, r.signet]));
  const loiByLecture = new Map(
    rows("lecture").map((r) => [r.lecidt, r.loicod])
  );
  const lectureByLecass = new Map(
    rows("lecass").map((r) => [r.lecassidt, r.lecidt])
  );
  // The sitting of a scrutin points to the reading in the Senate (lecass)
  const lecassBySitting = new Map(
    rows("date_seance").map((r) => [r.code, r.lecidt])
  );

  const votes = new Map<string, SenateVote>();
  for (const scr of rows("scr")) {
    // The dump stores the apostrophe as the control character U+0092
    const label = (scr.scrint ?? "").replaceAll("\u0092", "’");
    if (!WHOLE_TEXT.test(label) || PART_OF_TEXT.test(label)) {
      continue;
    }
    const lecture = lectureByLecass.get(lecassBySitting.get(scr.code) ?? null);
    const signet = signetByLoi.get(loiByLecture.get(lecture ?? null) ?? null);
    if (!(signet && scr.scrdat)) {
      continue;
    }
    const voters = Number(scr.scrvot);
    const expressed = Number(scr.scrsuf);
    const vote: SenateVote = {
      for: Number(scr.scrpou),
      against: Number(scr.scrcon),
      // Not stored: voters who did not express a choice
      abstentions: Math.max(voters - expressed, 0),
      date: scr.scrdat.slice(0, 10),
      ref: `${scr.sesann}-${scr.scrnum}`,
    };
    const known = votes.get(signet);
    if (!known || vote.date >= known.date) {
      votes.set(signet, vote);
    }
  }
  return votes;
}

// "https://www.senat.fr/dossier-legislatif/ppl23-735.html" → "ppl23-735"
function signetFromUrl(url: string) {
  const match = SIGNET_IN_URL.exec(url.trim());
  return match?.[1] ?? null;
}

// Adds the Senate's public vote to the bills it has voted on
export async function syncSenateVotes(): Promise<number> {
  const dir = await unzipTo(
    await downloadAndExtractZip(DOSLEG_URL, "dosleg.zip"),
    "dosleg"
  );
  const dump = (await readdir(dir)).find((file) => file.endsWith(".sql"));
  if (!dump) {
    throw new Error("No SQL dump in the Senate archive");
  }
  const votes = latestWholeTextVotes(await readDump(join(dir, dump)));

  const files = await db
    .select({ id: legislativeFile.id, senateUrl: legislativeFile.senateUrl })
    .from(legislativeFile)
    .where(isNotNull(legislativeFile.senateUrl));

  let updated = 0;
  for (const file of files) {
    const signet = file.senateUrl ? signetFromUrl(file.senateUrl) : null;
    const vote = signet ? votes.get(signet) : undefined;
    if (!vote) {
      continue;
    }
    await db
      .update(legislativeFile)
      .set({
        senateFor: vote.for,
        senateAgainst: vote.against,
        senateAbstentions: vote.abstentions,
        senateScrutinDate: vote.date,
        senateScrutinRef: vote.ref,
      })
      .where(eq(legislativeFile.id, file.id));
    updated++;
  }
  return updated;
}
