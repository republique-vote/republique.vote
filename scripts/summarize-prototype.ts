import "dotenv-flow/config";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import postgres from "postgres";
import { env } from "../env";
import { SUMMARY_PROMPT_VERSION } from "../src/services/summary/prompt";
import {
  PROTOTYPE_FILE,
  type PrototypeEntry,
  type PrototypeFile,
} from "../src/services/summary/prototype";
import {
  readabilityScore,
  summaryReadability,
} from "../src/services/summary/readability";
import {
  DEFAULT_SUMMARY_MODEL,
  summarizeBill,
} from "../src/services/summary/summarize";

const NUMBER_ARG = /^\d+$/;
// --same reruns the bills of the previous run, to compare prompt versions
const SAME_BILLS = process.argv.includes("--same");
const SAMPLE_SIZE = Number(
  process.argv.find((arg) => NUMBER_ARG.test(arg)) ?? 20
);

function readPreviousRun(): PrototypeFile | null {
  if (!existsSync(PROTOTYPE_FILE)) {
    return null;
  }
  return JSON.parse(readFileSync(PROTOTYPE_FILE, "utf8")) as PrototypeFile;
}
// Spaces requests out to stay under the free tier rate limit
const DELAY_MS = 1200;

async function main() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is missing from .env");
  }
  const model = DEFAULT_SUMMARY_MODEL;

  const previousRun = SAME_BILLS ? readPreviousRun() : null;
  if (SAME_BILLS && !previousRun) {
    throw new Error(`--same needs a previous run in ${PROTOTYPE_FILE}`);
  }
  const previousById = new Map(
    (previousRun?.entries ?? []).map((e) => [e.pollId, e])
  );

  const sql = postgres(env.DATABASE_URL);
  interface Row {
    description: string;
    id: string;
    source_url: string;
    title: string;
  }
  const polls = previousRun
    ? await sql<Row[]>`
        select id, title, description, source_url from poll
        where id in ${sql([...previousById.keys()])}
      `
    : // Random bills with a real explanatory memorandum, short and long alike
      await sql<Row[]>`
        select id, title, description, source_url from poll
        where type = 'law' and length(description) > 500
        order by random() limit ${SAMPLE_SIZE}
      `;
  await sql.end();
  const previousFor = (pollId: string) => {
    const previous = previousById.get(pollId);
    return previous && previousRun
      ? { promptVersion: previousRun.promptVersion, summary: previous.summary }
      : undefined;
  };

  console.log(`[summary] ${polls.length} bills, model ${model}`);
  const entries: PrototypeEntry[] = [];

  for (const [index, p] of polls.entries()) {
    const start = Date.now();
    try {
      const summary = await summarizeBill({
        model,
        title: p.title,
        description: p.description,
      });
      entries.push({
        pollId: p.id,
        title: p.title,
        description: p.description,
        sourceUrl: p.source_url,
        summary,
        previous: previousFor(p.id),
        error: null,
        durationMs: Date.now() - start,
      });
      console.log(
        `[summary] ${index + 1}/${polls.length} ${summary.plainTitle}`
      );
    } catch (err) {
      entries.push({
        pollId: p.id,
        title: p.title,
        description: p.description,
        sourceUrl: p.source_url,
        summary: null,
        previous: previousFor(p.id),
        error: (err as Error).message,
        durationMs: Date.now() - start,
      });
      console.error(`[summary] ${index + 1}/${polls.length} failed:`, err);
    }
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }

  mkdirSync(dirname(PROTOTYPE_FILE), { recursive: true });
  writeFileSync(
    PROTOTYPE_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        model,
        promptVersion: SUMMARY_PROMPT_VERSION,
        entries,
      },
      null,
      2
    )
  );
  console.log(`[summary] Written to ${PROTOTYPE_FILE}`);

  const average = (scores: number[]) =>
    scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
  const current = entries.flatMap((e) =>
    e.summary ? [summaryReadability(e.summary)] : []
  );
  const previous = entries.flatMap((e) =>
    e.previous?.summary ? [summaryReadability(e.previous.summary)] : []
  );
  console.log(
    `[summary] Average readability: ${average(current)} (previous run: ${average(previous) ?? "none"}), original memorandums: ${average(entries.map((e) => readabilityScore(e.description.slice(0, 3000))))}`
  );
}

main().catch((err) => {
  console.error("[summary] Failed:", err);
  process.exit(1);
});
