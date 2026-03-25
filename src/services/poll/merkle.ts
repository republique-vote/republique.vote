import { createHash } from "crypto";
import { db } from "@/db";
import { voteRecord, poll } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

interface VoteData {
  pollId: string;
  optionId: string;
  blindToken: string;
  blindSignature: string;
  createdAt: string;
  sequence: number;
}

export function computeVoteHash(previousHash: string | null, vote: VoteData): string {
  const data = [
    previousHash || "",
    vote.pollId,
    vote.optionId,
    vote.blindToken,
    vote.blindSignature,
    vote.createdAt,
    vote.sequence.toString(),
  ].join("|");

  return createHash("sha256").update(data).digest("hex");
}

export async function getLastVoteInChain(pollId: string) {
  const [last] = await db
    .select({
      hash: voteRecord.hash,
      sequence: voteRecord.sequence,
    })
    .from(voteRecord)
    .where(eq(voteRecord.pollId, pollId))
    .orderBy(desc(voteRecord.sequence))
    .limit(1);

  return last || null;
}

export async function updateMerkleRoot(pollId: string, newHash: string) {
  await db
    .update(poll)
    .set({ merkleRoot: newHash })
    .where(eq(poll.id, pollId));
}

export async function verifyChain(pollId: string): Promise<{ valid: boolean; error?: string }> {
  const votes = await db
    .select()
    .from(voteRecord)
    .where(eq(voteRecord.pollId, pollId))
    .orderBy(voteRecord.sequence);

  for (let i = 0; i < votes.length; i++) {
    const vote = votes[i];
    const expectedPreviousHash = i === 0 ? null : votes[i - 1].hash;

    if (vote.previousHash !== expectedPreviousHash) {
      return { valid: false, error: `Vote #${vote.sequence}: previousHash mismatch` };
    }

    const expectedHash = computeVoteHash(vote.previousHash, {
      pollId: vote.pollId,
      optionId: vote.optionId,
      blindToken: vote.blindToken,
      blindSignature: vote.blindSignature,
      createdAt: vote.createdAt,
      sequence: vote.sequence,
    });

    if (vote.hash !== expectedHash) {
      return { valid: false, error: `Vote #${vote.sequence}: hash mismatch` };
    }
  }

  return { valid: true };
}
