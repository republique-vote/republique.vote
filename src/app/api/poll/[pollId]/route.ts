import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { blindSignatureRequest, option, poll } from "@/db/schema";
import { errorResponse, successResponse } from "@/lib/api-response";
import { auth } from "@/services/auth";

export async function GET(
  _request: NextRequest,
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
    .select()
    .from(option)
    .where(eq(option.pollId, pollId))
    .orderBy(option.position);

  const [{ count: rawCount }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(sql`vote_record`)
    .where(sql`poll_id = ${pollId}`);
  const count = Number(rawCount);

  let hasVoted = false;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (session) {
      const request = await db.query.blindSignatureRequest.findFirst({
        where: and(
          eq(blindSignatureRequest.pollId, pollId),
          eq(blindSignatureRequest.userId, session.user.id)
        ),
      });
      hasVoted = !!request;
    }
  } catch {
    // Not authenticated, that's fine
  }

  return successResponse({
    ...p,
    options,
    voteCount: count,
    hasVoted,
  });
}
