import { and, eq, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { poll, pollSummary } from "@/db/schema";
import { SUMMARY_PROMPT_VERSION } from "@/services/summary/prompt";
import {
  DEFAULT_SUMMARY_MODEL,
  summarizeBill,
} from "@/services/summary/summarize";

// Below this, the memorandum is too thin: a summary would mostly be invented
const MIN_DESCRIPTION_CHARS = 300;
// The Gemini free tier allows about 15 requests per minute
const DEFAULT_DELAY_MS = 4500;

function isRateLimited(err: unknown) {
  const error = err as {
    statusCode?: number;
    lastError?: { statusCode?: number };
  };
  return error.statusCode === 429 || error.lastError?.statusCode === 429;
}

// Polls with no summary yet, or one written with older instructions
function findPendingPolls(limit: number) {
  return db
    .select({
      id: poll.id,
      title: poll.title,
      description: poll.description,
    })
    .from(poll)
    .leftJoin(pollSummary, eq(pollSummary.pollId, poll.id))
    .where(
      and(
        sql`length(${poll.description}) >= ${MIN_DESCRIPTION_CHARS}`,
        or(
          isNull(pollSummary.pollId),
          ne(pollSummary.promptVersion, SUMMARY_PROMPT_VERSION)
        )
      )
    )
    .limit(limit);
}

export async function summarizePendingPolls({
  limit = Number.POSITIVE_INFINITY,
  delayMs = DEFAULT_DELAY_MS,
  onProgress,
}: {
  limit?: number;
  delayMs?: number;
  onProgress?: (message: string) => void;
} = {}) {
  const pending = await findPendingPolls(
    Number.isFinite(limit) ? limit : 100_000
  );
  let done = 0;
  let failed = 0;

  for (const p of pending) {
    try {
      const summary = await summarizeBill({
        title: p.title,
        description: p.description,
      });
      const values = {
        ...summary,
        model: DEFAULT_SUMMARY_MODEL,
        promptVersion: SUMMARY_PROMPT_VERSION,
        generatedAt: new Date().toISOString(),
      };
      await db
        .insert(pollSummary)
        .values({ pollId: p.id, ...values })
        .onConflictDoUpdate({ target: pollSummary.pollId, set: values });
      done++;
      onProgress?.(`${done}/${pending.length} ${summary.plainTitle}`);
    } catch (err) {
      // The daily free quota is spent: stop, the next run picks up from here
      if (isRateLimited(err)) {
        onProgress?.("Quota reached, stopping until the next run");
        break;
      }
      failed++;
      onProgress?.(`Failed on ${p.id}: ${(err as Error).message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return { done, failed, pending: pending.length };
}
