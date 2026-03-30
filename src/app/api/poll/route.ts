import { and, count, desc, eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { poll, voteRecord } from "@/db/schema";
import {
  getPaginationParams,
  paginatedSuccessResponse,
} from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const type = request.nextUrl.searchParams.get("type");
  const { page, limit } = getPaginationParams(request.nextUrl.searchParams);
  const itemLimit = limit || 20;
  const currentPage = page || 1;
  const offset = (currentPage - 1) * itemLimit;

  const filters = and(
    status
      ? eq(poll.status, status as "draft" | "open" | "closed" | "tallied")
      : undefined,
    type ? eq(poll.type, type as "law" | "referendum" | "election") : undefined
  );

  const [{ total }] = await db
    .select({ total: sql<number>`COUNT(DISTINCT ${poll.id})` })
    .from(poll)
    .where(filters);
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
    .where(filters)
    .groupBy(poll.id)
    .orderBy(
      ...(request.nextUrl.searchParams.get("sort") === "votes"
        ? [desc(count(voteRecord.id)), desc(poll.createdAt)]
        : [
            sql`CASE WHEN ${poll.endDate} IS NOT NULL THEN 0 ELSE 1 END`,
            desc(poll.createdAt),
          ])
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
