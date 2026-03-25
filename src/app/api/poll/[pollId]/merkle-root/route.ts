import { NextRequest } from "next/server";
import { db } from "@/db";
import { poll, voteRecord } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> },
) {
  const { pollId } = await params;

  const p = await db.query.poll.findFirst({
    where: eq(poll.id, pollId),
  });

  if (!p) {
    return errorResponse("poll_not_found", 404);
  }

  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(voteRecord)
    .where(eq(voteRecord.pollId, pollId));

  return successResponse({
    pollId,
    merkleRoot: p.merkleRoot,
    totalVotes: count,
  });
}
