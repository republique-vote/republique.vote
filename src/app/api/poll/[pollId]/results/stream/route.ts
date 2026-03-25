import { NextRequest } from "next/server";
import { db } from "@/db";
import { poll } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPollResults } from "@/services/poll/results";
import { onVoteUpdate } from "@/services/poll/events";

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
      const initialResults = await getPollResults(pollId);
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(initialResults)}\n\n`),
      );

      const unsubscribe = onVoteUpdate(pollId, (data) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
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
