import { desc, eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { option, poll, voteRecord } from "@/db/schema";
import {
  errorResponse,
  getPaginationParams,
  successResponse,
} from "@/lib/api-response";
import { verifyChain } from "@/services/poll/merkle";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  const { pollId } = await params;

  const p = await db.query.poll.findFirst({
    where: eq(poll.id, pollId),
  });

  if (!p) {
    return errorResponse("poll_not_found", 404);
  }

  const options = await db
    .select({ id: option.id, label: option.label })
    .from(option)
    .where(eq(option.pollId, pollId))
    .orderBy(option.position);

  const [{ count: rawCount }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(voteRecord)
    .where(eq(voteRecord.pollId, pollId));
  const totalVotes = Number(rawCount);

  const integrity = await verifyChain(pollId);

  const meta = {
    pollId,
    pollTitle: p.title,
    merkleRoot: p.merkleRoot,
    totalVotes,
    chainValid: integrity.valid,
    options,
  };

  // all=true returns all votes in ASC order (for client-side verification)
  if (request.nextUrl.searchParams.get("all") === "true") {
    const allVotes = await db
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

    return successResponse({ ...meta, votes: allVotes });
  }

  // Paginated response (DESC order — newest first)
  const { page, limit } = getPaginationParams(request.nextUrl.searchParams);
  const itemLimit = limit || 50;
  const currentPage = page || 1;
  const offset = (currentPage - 1) * itemLimit;
  const pageCount = Math.ceil(totalVotes / itemLimit);

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
    .orderBy(desc(voteRecord.sequence))
    .limit(itemLimit)
    .offset(offset);

  return successResponse({
    ...meta,
    votes,
    pagination: {
      currentPage,
      pageCount,
      itemCount: totalVotes,
      itemLimit,
    },
  });
}
