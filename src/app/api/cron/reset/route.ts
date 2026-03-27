import { NextRequest } from "next/server";
import { db } from "@/db";
import { voteRecord, blindSignatureRequest, pollKeyPair, poll } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return errorResponse("unauthorized", 401);
  }

  await db.delete(voteRecord);
  await db.delete(blindSignatureRequest);
  await db.delete(pollKeyPair);
  await db.update(poll).set({ merkleRoot: null });

  return successResponse({ reset: true });
}
