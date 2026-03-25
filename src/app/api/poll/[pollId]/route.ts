import { NextRequest } from "next/server";
import { db } from "@/db";
import { poll, option, blindSignatureRequest } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/services/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { headers } from "next/headers";

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

  const options = await db
    .select()
    .from(option)
    .where(eq(option.pollId, pollId))
    .orderBy(option.position);

  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(
      sql`vote_record`,
    )
    .where(sql`poll_id = ${pollId}`);

  let hasVoted = false;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (session) {
      const request = await db.query.blindSignatureRequest.findFirst({
        where: and(
          eq(blindSignatureRequest.pollId, pollId),
          eq(blindSignatureRequest.userId, session.user.id),
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
