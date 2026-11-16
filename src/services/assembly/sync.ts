import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq, sql } from "drizzle-orm";
import TurndownService from "turndown";
import { db } from "@/db";
import { legislativeFile, option, poll } from "@/db/schema";
import { detectLegislature } from "./legislature";

const turndown = new TurndownService({ headingStyle: "atx" });
turndown.remove(["style", "script"]);

function cleanMarkdown(md: string): string {
  return (
    md
      // Remove base64 images (AN logos repeated on each page)
      .replace(/!\[.*?\]\(data:image\/[^)]+\)/g, "")
      // Remove page numbers like "– 1 –", "– 2 –"
      .replace(/–\s*\d+\s*–/g, "")
      // Remove formal salutation
      .replace(/M(?:esdames|ESDAMES),?\s*M(?:essieurs|ESSIEURS),?\s*/g, "")
      // Collapse multiple blank lines
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

export const BASE_URL =
  "https://data.assemblee-nationale.fr/static/openData/repository";

interface ActeLegislatif {
  actesLegislatifs?: {
    acteLegislatif: ActeLegislatif | ActeLegislatif[];
  } | null;
  dateActe: string | null;
  texteAssocie?: string;
}

interface DossierData {
  dossierParlementaire: {
    "@xsi:type": string;
    uid: string;
    legislature: string;
    titreDossier: {
      titre: string;
      titreChemin: string;
      senatChemin: string | null;
    };
    procedureParlementaire: {
      libelle: string;
    };
    actesLegislatifs: {
      acteLegislatif: ActeLegislatif | ActeLegislatif[];
    } | null;
  };
}

export function findTexteAssocie(obj: unknown): string | null {
  if (typeof obj !== "object" || obj === null) {
    return null;
  }
  const record = obj as Record<string, unknown>;
  if (typeof record.texteAssocie === "string") {
    return record.texteAssocie;
  }
  for (const val of Object.values(record)) {
    const found = findTexteAssocie(val);
    if (found) {
      return found;
    }
  }
  return null;
}

function findFirstDate(obj: unknown): string | null {
  if (typeof obj !== "object" || obj === null) {
    return null;
  }
  const record = obj as Record<string, unknown>;
  if (typeof record.dateActe === "string" && record.dateActe) {
    return record.dateActe;
  }
  for (const val of Object.values(record)) {
    const found = findFirstDate(val);
    if (found) {
      return found;
    }
  }
  return null;
}

// Day of the deposit: the open data gives no time, and its dates carry the
// Paris offset ("2025-02-04T00:00:00.000+01:00"), so the first 10 characters
// are the day in Paris
function extractDepositDate(dossier: DossierData): string {
  const date = findFirstDate(dossier.dossierParlementaire.actesLegislatifs);
  return date ? date.slice(0, 10) : parisDay(new Date());
}

function parisDay(date: Date) {
  return date.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
}

// Bills imported before deposit dates were stored as days had a made-up
// midnight time: keep only the day in Paris
async function normalizeDepositDates() {
  await db.execute(sql`
    UPDATE ${poll}
    SET start_date = to_char(${poll.startDate}::timestamptz AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD')
    WHERE length(${poll.startDate}) > 10
      AND ${poll.id} IN (
        SELECT ${legislativeFile.pollId} FROM ${legislativeFile}
        WHERE ${legislativeFile.pollId} IS NOT NULL
      )
  `);
}

export async function downloadAndExtractZip(
  url: string,
  fileName = "data.zip"
): Promise<string> {
  const dir = join(tmpdir(), "republique-vote-sync");
  await mkdir(dir, { recursive: true });

  const zipPath = join(dir, fileName);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(zipPath, buffer);

  return zipPath;
}

const CONCURRENCY = 10;

// Every kind of bill citizens can vote on. Left out: resolutions, inquiry
// commissions, information missions, petitions and confidence votes (49.3)
const VOTABLE_PROCEDURES = new Set([
  "Proposition de loi ordinaire",
  "Projet de loi ordinaire",
  "Projet ou proposition de loi constitutionnelle",
  "Projet ou proposition de loi organique",
  "Projet de ratification des traités et conventions",
  "Projet de loi de finances de l'année",
  "Projet de loi de finances rectificative",
  "Projet de loi de financement de la sécurité sociale",
  "Projet de loi relative aux résultats de la gestion et portant approbation des comptes",
  // Shared initiative referendum (référendum d'initiative partagée)
  "Proposition de loi présentée en application de l'article 11 de la Constitution",
]);
const EXPOSE_START_RE = /EXPOS[ÉE] DES MOTIFS/i;
const EXPOSE_END_RE = /PROPOSITION DE LOI|PROJET DE LOI/;

function extractExpose(html: string): string | null {
  const match = html.match(EXPOSE_START_RE);
  if (!match || match.index === undefined) {
    return null;
  }
  // Skip past the heading itself
  const afterHeading = html.substring(match.index + match[0].length);
  const endMatch = afterHeading.search(EXPOSE_END_RE);
  return endMatch === -1 ? afterHeading : afterHeading.substring(0, endMatch);
}

async function fetchExpose(textUid: string): Promise<string | null> {
  if (!(textUid.startsWith("PIONANR") || textUid.startsWith("PRJLANR"))) {
    return null;
  }
  try {
    const res = await fetch(
      `https://www.assemblee-nationale.fr/dyn/opendata/${textUid}.html`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) {
      return null;
    }
    const html = await res.text();
    const exposeHtml = extractExpose(html);
    if (!exposeHtml) {
      return null;
    }
    const md = cleanMarkdown(turndown.turndown(exposeHtml));
    return md || null;
  } catch {
    return null;
  }
}

function pool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
) {
  let running = 0;
  let idx = 0;

  return new Promise<void>((resolve, reject) => {
    function next() {
      while (running < concurrency && idx < items.length) {
        const item = items[idx++];
        running++;
        fn(item)
          .then(() => {
            running--;
            next();
          })
          .catch(reject);
      }
      if (running === 0 && idx >= items.length) {
        resolve();
      }
    }
    next();
  });
}

interface PendingDossier {
  data: DossierData;
  extractDir: string;
  legislature: string;
}

async function importDossier(pending: PendingDossier): Promise<boolean> {
  const { data, legislature } = pending;
  const dp = data.dossierParlementaire;
  const proc = dp.procedureParlementaire?.libelle || "";
  const title = dp.titreDossier?.titre || "Sans titre";
  const depositDate = extractDepositDate(data);

  const dossierLegislature = dp.legislature || legislature;
  const sourceUrl = dp.titreDossier?.titreChemin
    ? `https://www.assemblee-nationale.fr/dyn/${dossierLegislature}/dossiers/${dp.titreDossier.titreChemin}`
    : null;
  const senateUrl = dp.titreDossier?.senatChemin || null;

  // Try to fetch exposé des motifs, fallback to titrePrincipal
  let description = title;
  const textUid = findTexteAssocie(dp.actesLegislatifs);
  if (textUid) {
    const expose = await fetchExpose(textUid);
    if (expose) {
      description = expose;
    } else {
      try {
        const { readFile } = await import("node:fs/promises");
        const docPath = join(
          pending.extractDir,
          "json",
          "document",
          `${textUid}.json`
        );
        const doc = JSON.parse(await readFile(docPath, "utf-8"));
        const titrePrincipal = doc?.document?.titres?.titrePrincipal;
        if (titrePrincipal) {
          description =
            titrePrincipal.charAt(0).toUpperCase() + titrePrincipal.slice(1);
        }
      } catch {
        // Document file may not exist
      }
    }
  }

  const pollId = crypto.randomUUID();
  await db.insert(poll).values({
    id: pollId,
    title,
    description,
    type: "law",
    status: "open",
    startDate: depositDate,
    endDate: null,
    sourceUrl,
    sourceRef: dp.uid,
  });

  await db.insert(option).values([
    { pollId, label: "Pour", position: 1 },
    { pollId, label: "Contre", position: 2 },
    { pollId, label: "Abstention", position: 3 },
  ]);

  await db.insert(legislativeFile).values({
    id: dp.uid,
    legislature: dp.legislature || legislature,
    title,
    procedureType: proc,
    sourceUrl,
    senateUrl,
    pollId,
  });

  return true;
}

export async function unzipTo(zipPath: string, name: string) {
  const { exec } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execAsync = promisify(exec);

  const extractDir = join(tmpdir(), "republique-vote-sync", name);
  await mkdir(extractDir, { recursive: true });
  await execAsync(`unzip -o -q "${zipPath}" -d "${extractDir}"`);
  return extractDir;
}

// Bills (dossiers) and their documents, which also list authors
// One folder per legislature: an older one must never mix with the current
// one, whose every votable dossier gets imported
export async function extractDossiersArchive(legislature: string) {
  const url = `${BASE_URL}/${legislature}/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip`;
  const zipPath = await downloadAndExtractZip(
    url,
    `dossiers-${legislature}.zip`
  );
  return unzipTo(zipPath, `dossiers-${legislature}`);
}

// Imports one dossier of any legislature, e.g. a past constitutional revision
export async function importDossierById(legislature: string, uid: string) {
  const existing = await db.query.legislativeFile.findFirst({
    where: eq(legislativeFile.id, uid),
  });
  if (existing) {
    return false;
  }
  const extractDir = await extractDossiersArchive(legislature);
  const { readFile } = await import("node:fs/promises");
  const data: DossierData = JSON.parse(
    await readFile(
      join(extractDir, "json", "dossierParlementaire", `${uid}.json`),
      "utf-8"
    )
  );
  return importDossier({ data, legislature, extractDir });
}

export async function syncDossiers(): Promise<number> {
  await normalizeDepositDates();
  const legislature = await detectLegislature();
  const extractDir = await extractDossiersArchive(legislature);

  const { readdir, readFile } = await import("node:fs/promises");
  const dossierDir = join(extractDir, "json", "dossierParlementaire");
  const files = await readdir(dossierDir);

  // Collect dossiers to import
  const pending: PendingDossier[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) {
      continue;
    }

    const raw = await readFile(join(dossierDir, file), "utf-8");
    const data: DossierData = JSON.parse(raw);
    const dp = data.dossierParlementaire;

    // Allowed by procedure name: some legislative dossiers have no type
    const proc = dp.procedureParlementaire?.libelle || "";
    if (!VOTABLE_PROCEDURES.has(proc)) {
      continue;
    }

    const existing = await db.query.legislativeFile.findFirst({
      where: eq(legislativeFile.id, dp.uid),
    });
    if (existing) {
      continue;
    }

    pending.push({ data, legislature, extractDir });
  }

  console.log(`[assembly] ${pending.length} legislative files to import`);

  let created = 0;
  await pool(pending, CONCURRENCY, async (item) => {
    await importDossier(item);
    created++;
    if (created % 50 === 0 || created === pending.length) {
      console.log(`[assembly] ${created}/${pending.length} imported`);
    }
  });

  return created;
}
