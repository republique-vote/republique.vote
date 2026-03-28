import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { poll } from "@/db/schema";
import { errorResponse, successResponse } from "@/lib/api-response";
import {
  getOrCreateKeyPair,
  getPublicKeySpki,
} from "@/services/blind-signature";

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

  const keys = await getOrCreateKeyPair(pollId);

  const publicKeySpki = await getPublicKeySpki(keys.publicKey);

  return successResponse({ publicKey: publicKeySpki });
}
