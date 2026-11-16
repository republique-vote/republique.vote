import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { poll, pollSummary, voteRecord } from "@/db/schema";

export type PollType = "law" | "referendum" | "election";
export type PollListStatus = "open" | "closed" | "draft" | "tallied" | null;
export type PollListSort = "recent" | "votes";

// A poll whose end date has passed counts as closed even before the cron
// updates its status
const OPEN = sql`${poll.status} = 'open' AND (${poll.endDate} IS NULL OR ${poll.endDate}::timestamptz > NOW())`;
const CLOSED = sql`(${poll.status} IN ('closed', 'tallied') OR (${poll.status} = 'open' AND ${poll.endDate}::timestamptz <= NOW()))`;

function statusFilter(status: PollListStatus) {
  if (status === "open") {
    return OPEN;
  }
  if (status === "closed") {
    return CLOSED;
  }
  return status ? eq(poll.status, status) : undefined;
}

export async function listPolls({
  status,
  type,
  sort,
  page,
  limit,
}: {
  status: PollListStatus;
  type: PollType | null;
  sort: PollListSort;
  page: number;
  limit: number;
}) {
  const filters = and(
    statusFilter(status),
    type ? eq(poll.type, type) : undefined
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
      simpleSentence: pollSummary.simpleSentence,
    })
    .from(poll)
    .leftJoin(voteRecord, eq(voteRecord.pollId, poll.id))
    .leftJoin(pollSummary, eq(pollSummary.pollId, poll.id))
    .where(filters)
    .groupBy(poll.id, pollSummary.simpleSentence)
    .orderBy(
      ...(sort === "votes"
        ? [desc(count(voteRecord.id)), desc(poll.createdAt)]
        : [
            sql`CASE WHEN ${poll.endDate} IS NOT NULL THEN 0 ELSE 1 END`,
            desc(poll.createdAt),
          ])
    )
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    items: polls.map((p) => ({ ...p, voteCount: Number(p.voteCount) })),
    currentPage: page,
    pageCount: Math.ceil(itemCount / limit),
    itemCount,
    itemLimit: limit,
  };
}

// Number of polls in each tab of the list
export async function countPolls(type: PollType | null) {
  const [counts] = await db
    .select({
      open: sql<number>`COUNT(*) FILTER (WHERE ${OPEN})`,
      closed: sql<number>`COUNT(*) FILTER (WHERE ${CLOSED})`,
      all: sql<number>`COUNT(*)`,
    })
    .from(poll)
    .where(type ? eq(poll.type, type) : undefined);

  return {
    open: Number(counts.open),
    closed: Number(counts.closed),
    all: Number(counts.all),
  };
}
