import { NextRequest } from "next/server";
import { db } from "@/db";
import { poll, voteRecord } from "@/db/schema";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api-response";
import { verifyChain } from "@/services/poll/merkle";

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

  const votes = await db
    .select({
      sequence: voteRecord.sequence,
      optionId: voteRecord.optionId,
      blindToken: voteRecord.blindToken,
      blindSignature: voteRecord.blindSignature,
      hash: voteRecord.hash,
      previousHash: voteRecord.previousHash,
      createdAt: voteRecord.createdAt,
    })
    .from(voteRecord)
    .where(eq(voteRecord.pollId, pollId))
    .orderBy(voteRecord.sequence);

  const integrity = await verifyChain(pollId);

  return successResponse({
    pollId,
    merkleRoot: p.merkleRoot,
    totalVotes: votes.length,
    chainValid: integrity.valid,
    votes,
  });
}
