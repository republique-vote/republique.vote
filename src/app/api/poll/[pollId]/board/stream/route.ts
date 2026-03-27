import { NextRequest } from "next/server";
import { db } from "@/db";
import { poll, voteRecord } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { onBoardVote } from "@/services/poll/events";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> },
) {
  const { pollId } = await params;

  const p = await db.query.poll.findFirst({
    where: eq(poll.id, pollId),
  });

  if (!p) {
    return new Response("poll not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial state
      const [{ count: rawCount }] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(voteRecord)
        .where(eq(voteRecord.pollId, pollId));
      const count = Number(rawCount);

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "init", totalVotes: count, merkleRoot: p.merkleRoot })}\n\n`),
      );

      // Subscribe to new votes
      const unsubscribe = onBoardVote(pollId, (data) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "vote", ...data as object })}\n\n`),
          );
        } catch {
          unsubscribe();
        }
      });

      request.signal.addEventListener("abort", () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
