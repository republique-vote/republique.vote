import { NextRequest } from "next/server";
import { db } from "@/db";
import { poll, voteRecord } from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";
import { successResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");

  const polls = await db
    .select({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      type: poll.type,
      status: poll.status,
      startDate: poll.startDate,
      endDate: poll.endDate,
      createdAt: poll.createdAt,
      voteCount: count(voteRecord.id),
    })
    .from(poll)
    .leftJoin(voteRecord, eq(voteRecord.pollId, poll.id))
    .where(status ? eq(poll.status, status as "draft" | "open" | "closed" | "tallied") : undefined)
    .groupBy(poll.id)
    .orderBy(poll.createdAt);

  return successResponse(polls);
}
