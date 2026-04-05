import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  blindSignatureRequest,
  poll,
  pollKeyPair,
  rekorEntry,
  voteRecord,
} from "@/db/schema";

function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(20, 0, 0, 0);
  return date.toISOString();
}

export async function resetAndSeed() {
  const now = new Date().toISOString();

  // Clear all vote data
  await db.delete(rekorEntry);
  await db.delete(voteRecord);
  await db.delete(blindSignatureRequest);
  await db.delete(pollKeyPair);
  await db.update(poll).set({ merkleRoot: null });

  // Reset dates on open polls so they don't expire
  const openPolls = await db.query.poll.findMany({
    where: eq(poll.status, "open"),
  });

  for (const p of openPolls) {
    if (!p.endDate) {
      continue;
    }
    const originalDuration =
      new Date(p.endDate).getTime() - new Date(p.startDate).getTime();
    const days = Math.round(originalDuration / (1000 * 60 * 60 * 24));
    await db
      .update(poll)
      .set({ startDate: now, endDate: addDays(days) })
      .where(eq(poll.id, p.id));
  }

  console.log(`[reset] Vote data cleared, poll dates refreshed (${now})`);
}
