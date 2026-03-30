import { count, desc, eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { poll, voteRecord } from "@/db/schema";
import {
  getPaginationParams,
  paginatedSuccessResponse,
} from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const { page, limit } = getPaginationParams(request.nextUrl.searchParams);
  const itemLimit = limit || 20;
  const currentPage = page || 1;
  const offset = (currentPage - 1) * itemLimit;

  const statusFilter = status
    ? eq(poll.status, status as "draft" | "open" | "closed" | "tallied")
    : undefined;

  const [{ total }] = await db
    .select({ total: sql<number>`COUNT(DISTINCT ${poll.id})` })
    .from(poll)
    .where(statusFilter);
  const itemCount = Number(total);

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
    .where(statusFilter)
    .groupBy(poll.id)
    .orderBy(
      ...(request.nextUrl.searchParams.get("sort") === "votes"
        ? [desc(count(voteRecord.id)), desc(poll.createdAt)]
        : [desc(poll.createdAt)])
    )
    .limit(itemLimit)
    .offset(offset);

  return paginatedSuccessResponse({
    items: polls.map((p) => ({ ...p, voteCount: Number(p.voteCount) })),
    currentPage,
    pageCount: Math.ceil(itemCount / itemLimit),
    itemCount,
    itemLimit,
  });
}
