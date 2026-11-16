import "dotenv-flow/config";
import { summarizePendingPolls } from "../src/services/summary/store";

const NUMBER_ARG = /^\d+$/;
// Optional maximum number of polls to summarize, e.g. `pnpm summarize 50`
const limitArg = process.argv.find((arg) => NUMBER_ARG.test(arg));

async function main() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is missing from .env");
  }

  const { done, failed, pending } = await summarizePendingPolls({
    limit: limitArg ? Number(limitArg) : undefined,
    onProgress: (message) => console.log(`[summary] ${message}`),
  });

  console.log(
    `[summary] ${done} summaries stored, ${failed} failed, ${pending} were pending`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("[summary] Failed:", err);
  process.exit(1);
});
