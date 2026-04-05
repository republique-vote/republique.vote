import { eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { poll } from "@/db/schema";
import { successResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  const typeFilter = type
    ? eq(poll.type, type as "law" | "referendum" | "election")
    : undefined;

  const [counts] = await db
    .select({
      open: sql<number>`COUNT(*) FILTER (WHERE ${poll.status} = 'open' AND (${poll.endDate} IS NULL OR ${poll.endDate} > NOW()))`,
      closed: sql<number>`COUNT(*) FILTER (WHERE ${poll.status} IN ('closed', 'tallied') OR (${poll.status} = 'open' AND ${poll.endDate} <= NOW()))`,
      all: sql<number>`COUNT(*)`,
    })
    .from(poll)
    .where(typeFilter);

  return successResponse({
    open: Number(counts.open),
    closed: Number(counts.closed),
    all: Number(counts.all),
  });
}
