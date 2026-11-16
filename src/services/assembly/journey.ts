import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { legislativeFile } from "@/db/schema";
import { detectLegislature } from "./legislature";
import { extractDossiersArchive } from "./sync";

// One stage of a bill's path through Parliament, e.g. the first reading at the
// Senate, with its key dates and how it ended
export interface JourneyStep {
  // Open data code of the stage, e.g. "SN1" or "CMP"
  code: string;
  events: { date: string; label: string }[];
  // Decision closing the stage, e.g. "adoptée" or "Accord", null while ongoing
  outcome: string | null;
  outcomeDate: string | null;
  title: string;
}

interface RawAct {
  actesLegislatifs?: { acteLegislatif: RawAct | RawAct[] } | null;
  codeActe: string;
  dateActe?: string | null;
  libelleActe?: { nomCanonique?: string } | null;
  statutConclusion?: { libelle?: string } | null;
}

// Readings, by the end of the stage code: AN1 is the first reading at the
// Assemblée, SNNLEC a new reading at the Senate
const READINGS: Record<string, string> = {
  "1": "1re lecture",
  "2": "2e lecture",
  "3": "3e lecture",
  NLEC: "Nouvelle lecture",
  LDEF: "Lecture définitive",
  LUNI: "Lecture unique",
};
const READING_CODE = /^(AN|SN)(1|2|3|NLEC|LDEF|LUNI)$/;
const OTHER_STAGES: Record<string, string> = {
  CMP: "Commission mixte paritaire",
  CC: "Conseil constitutionnel",
  PROM: "Promulgation",
};
// The Congrès stage carries a year: "CG22"
const CONGRESS_CODE = /^CG\d*$/;
// "adopté, dans les conditions prévues à l'article 45, alinéa 3, de la
// Constitution" only says the text comes from a joint committee
const DECISION_CODE = /-(DEBATS-DEC|DEC|CONCLUSION)$/;
const CMP_CHAMBER_VOTE = /^CMP-DEBATS-(AN|SN)-DEC$/;
const ARTICLE_45 = /, dans les conditions prévues à l'article 45.*$/;

function children(act: RawAct): RawAct[] {
  const sub = act.actesLegislatifs?.acteLegislatif;
  if (!sub) {
    return [];
  }
  return Array.isArray(sub) ? sub : [sub];
}

function descendants(act: RawAct): RawAct[] {
  return children(act).flatMap((child) => [child, ...descendants(child)]);
}

function day(date: string | null | undefined) {
  return date ? date.slice(0, 10) : null;
}

// What citizens care about in each stage, by the end of the act code
const EVENTS: [suffix: RegExp, label: string][] = [
  [/^(AN|SN)[^-]*-DEPOT$/, "Dépôt"],
  [/-PROCACC$/, "Procédure accélérée engagée par le gouvernement"],
  [/-COM-FOND-RAPPORT$/, "Rapport de la commission"],
  [/-DEBATS(-AN|-SN)?-SEANCE$/, "Débat en séance"],
  [/^CMP-SAISIE$/, "Convocation de la commission"],
  [/^CC-SAISIE/, "Saisine"],
  [/^CG\d*-CONV$/, "Convocation par le Président de la République"],
  [/-RTRINI$/, "Texte retiré par son auteur"],
];

function stageTitle(code: string, act: RawAct) {
  const reading = READING_CODE.exec(code);
  if (reading) {
    const chamber = reading[1] === "AN" ? "Assemblée nationale" : "Sénat";
    return `${chamber} · ${READINGS[reading[2]]}`;
  }
  if (CONGRESS_CODE.test(code)) {
    return "Congrès du Parlement";
  }
  return OTHER_STAGES[code] ?? act.libelleActe?.nomCanonique ?? code;
}

// The decision closing a stage: the vote in a reading, the agreement of the
// joint committee, the ruling of the Constitutional Council, the promulgation
function stageOutcome(code: string, acts: RawAct[]) {
  const decision = acts.findLast((a) =>
    code === "PROM"
      ? a.codeActe === "PROM-PUB"
      : DECISION_CODE.test(a.codeActe) && !a.codeActe.startsWith("CMP-DEBATS")
  );
  if (!decision) {
    return { outcome: null, outcomeDate: null };
  }
  const label =
    code === "PROM"
      ? "Loi promulguée"
      : (decision.statutConclusion?.libelle ?? "Décision").replace(
          ARTICLE_45,
          ""
        );
  return { outcome: label, outcomeDate: day(decision.dateActe) };
}

// Stages that matter to a reader: readings, joint committee, Constitutional
// Council and promulgation, in the order the open data lists them
export function readJourney(stages: RawAct[]): JourneyStep[] {
  return stages
    .filter(
      (s) =>
        READING_CODE.test(s.codeActe) ||
        CONGRESS_CODE.test(s.codeActe) ||
        s.codeActe in OTHER_STAGES
    )
    .map((stage) => {
      const acts = descendants(stage);
      const events = EVENTS.flatMap(([pattern, label]) => {
        // Debates often last several sittings: keep the first one
        const act = acts.find((a) => pattern.test(a.codeActe) && a.dateActe);
        const date = day(act?.dateActe);
        return date ? [{ date, label }] : [];
      }).sort((a, b) => a.date.localeCompare(b.date));
      // The joint committee's text is then voted by each chamber
      const chamberVotes =
        stage.codeActe === "CMP"
          ? acts
              .filter((a) => CMP_CHAMBER_VOTE.test(a.codeActe))
              .flatMap((a) => {
                const date = day(a.dateActe);
                const chamber = a.codeActe.includes("-AN-")
                  ? "à l'Assemblée"
                  : "au Sénat";
                const result = (a.statutConclusion?.libelle ?? "").replace(
                  ARTICLE_45,
                  ""
                );
                return date
                  ? [
                      {
                        date,
                        label: `Vote du texte de la commission ${chamber} : ${result}`,
                      },
                    ]
                  : [];
              })
          : [];
      return {
        code: stage.codeActe,
        title: stageTitle(stage.codeActe, stage),
        events: [...events, ...chamberVotes].sort((a, b) =>
          a.date.localeCompare(b.date)
        ),
        ...stageOutcome(stage.codeActe, acts),
      };
    });
}

// jsonb does not keep the key order: compare with sorted keys
function stableJson(value: unknown): string {
  return JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => a.localeCompare(b))
        )
      : v
  );
}

// Refreshes the path of every imported bill: stages move on between syncs
export async function syncJourneys(legislature?: string): Promise<number> {
  const dir = join(
    await extractDossiersArchive(legislature ?? (await detectLegislature())),
    "json",
    "dossierParlementaire"
  );
  const files = await db
    .select({ id: legislativeFile.id, journey: legislativeFile.journey })
    .from(legislativeFile)
    .where(isNotNull(legislativeFile.pollId));
  const available = new Set(await readdir(dir));

  let updated = 0;
  for (const file of files) {
    if (!available.has(`${file.id}.json`)) {
      continue;
    }
    const { dossierParlementaire } = JSON.parse(
      await readFile(join(dir, `${file.id}.json`), "utf-8")
    );
    const sub = dossierParlementaire.actesLegislatifs?.acteLegislatif;
    const journey = readJourney(sub ? [sub].flat() : []);
    if (stableJson(journey) === stableJson(file.journey)) {
      continue;
    }
    await db
      .update(legislativeFile)
      .set({ journey })
      .where(eq(legislativeFile.id, file.id));
    updated++;
  }
  return updated;
}
