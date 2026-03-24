import { NextRequest } from "next/server";
import { db } from "@/db";
import { poll, option, voteRecord } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateKeyPair, verifySignature } from "@/lib/blind-signature";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> },
) {
  const { pollId } = await params;

  const p = await db.query.poll.findFirst({
    where: eq(poll.id, pollId),
  });

  if (!p) {
    return errorResponse("poll_not_found", 404);
  }

  if (p.status !== "open") {
    return errorResponse("poll_not_open", 400);
  }

  const body = await request.json();
  const { optionId, token, signature } = body as {
    optionId: string;
    token: string;
    signature: string;
  };

  if (!optionId || !token || !signature) {
    return errorResponse("missing_fields", 400);
  }

  const opt = await db.query.option.findFirst({
    where: and(eq(option.id, optionId), eq(option.pollId, pollId)),
  });

  if (!opt) {
    return errorResponse("invalid_option", 400);
  }

  const keys = await getOrCreateKeyPair(pollId);
  const tokenBytes = Uint8Array.from(Buffer.from(token, "base64"));
  const sigBytes = Uint8Array.from(Buffer.from(signature, "base64"));

  const valid = await verifySignature(tokenBytes, sigBytes, keys.publicKey);
  if (!valid) {
    return errorResponse("invalid_signature", 403);
  }

  try {
    await db.insert(voteRecord).values({
      pollId,
      optionId,
      blindToken: token,
      blindSignature: signature,
    });
  } catch {
    return errorResponse("already_voted", 409);
  }

  return successResponse({ voted: true }, 201);
}
