import { NextRequest } from "next/server";
import { db } from "@/db";
import { poll, blindSignatureRequest } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/services/auth";
import { getOrCreateKeyPair, signBlindedToken } from "@/services/blind-signature";
import { successResponse, errorResponse } from "@/lib/api-response";
import { headers } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> },
) {
  const { pollId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return errorResponse("unauthorized", 401);
  }

  const p = await db.query.poll.findFirst({
    where: eq(poll.id, pollId),
  });

  if (!p) {
    return errorResponse("poll_not_found", 404);
  }

  if (p.status !== "open") {
    return errorResponse("poll_not_open", 400);
  }

  const existing = await db.query.blindSignatureRequest.findFirst({
    where: and(
      eq(blindSignatureRequest.pollId, pollId),
      eq(blindSignatureRequest.userId, session.user.id),
    ),
  });

  if (existing) {
    return errorResponse("already_requested", 409);
  }

  const body = await request.json();
  const blindedToken = body.blindedToken as string;

  if (!blindedToken) {
    return errorResponse("missing_blinded_token", 400);
  }

  try {
    await db.insert(blindSignatureRequest).values({
      pollId,
      userId: session.user.id,
    });
  } catch {
    return errorResponse("already_requested", 409);
  }

  try {
    const keys = await getOrCreateKeyPair(pollId);
    const blindedMsg = Uint8Array.from(Buffer.from(blindedToken, "base64"));
    const blindSig = await signBlindedToken(blindedMsg, keys.privateKey);

    return successResponse({
      blindSignature: Buffer.from(blindSig).toString("base64"),
    });
  } catch (err) {
    console.error("blind-sign error:", err);
    return errorResponse("blind_sign_failed", 500);
  }
}
