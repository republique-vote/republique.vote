import "dotenv-flow/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import postgres from "postgres";
import { env } from "../env";
import { summarizeBill } from "../src/services/summary/mistral";
import { SUMMARY_PROMPT_VERSION } from "../src/services/summary/prompt";
import {
  PROTOTYPE_FILE,
  type PrototypeEntry,
} from "../src/services/summary/prototype";

const SAMPLE_SIZE = Number(process.argv[2] ?? 20);
// Stays under the free tier limit of about one request per second
const DELAY_MS = 1200;

async function main() {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY is missing from .env");
  }
  const model = process.env.MISTRAL_MODEL ?? "mistral-small-latest";

  const sql = postgres(env.DATABASE_URL);
  // Random bills with a real explanatory memorandum, short and long alike
  const polls = await sql<
    { id: string; title: string; description: string; source_url: string }[]
  >`
    select id, title, description, source_url from poll
    where type = 'law' and length(description) > 500
    order by random() limit ${SAMPLE_SIZE}
  `;
  await sql.end();

  console.log(`[summary] ${polls.length} bills, model ${model}`);
  const entries: PrototypeEntry[] = [];

  for (const [index, p] of polls.entries()) {
    const start = Date.now();
    try {
      const summary = await summarizeBill({
        apiKey,
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
}

main().catch((err) => {
  console.error("[summary] Failed:", err);
  process.exit(1);
});
