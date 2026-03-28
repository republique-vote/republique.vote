import { db } from "@/db";
import {
  blindSignatureRequest,
  poll,
  pollKeyPair,
  rekorEntry,
  voteRecord,
} from "@/db/schema";

export async function resetAndSeed() {
  // Clear all vote data
  await db.delete(rekorEntry);
  await db.delete(voteRecord);
  await db.delete(blindSignatureRequest);
  await db.delete(pollKeyPair);
  await db.update(poll).set({ merkleRoot: null });

  console.log(
    `[reset] Vote data cleared, polls preserved (${new Date().toISOString()})`
  );
}
