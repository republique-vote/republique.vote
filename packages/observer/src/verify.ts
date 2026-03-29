import { createHash } from "node:crypto";
import type { Vote } from "@republique/core";
import { buildVoteHashPreimage } from "@republique/core";

function computeVoteHash(
  previousHash: string | null,
  vote: {
    pollId: string;
    optionId: string;
    blindToken: string;
    blindSignature: string;
    createdAt: string;
    sequence: number;
  }
): string {
  const preimage = buildVoteHashPreimage(previousHash, vote);
  return createHash("sha256").update(preimage).digest("hex");
}

export function verifyVote(
  pollId: string,
  vote: Vote,
  expectedPreviousHash: string | null
): { valid: boolean; error?: string } {
  if (vote.previousHash !== expectedPreviousHash) {
    return {
      valid: false,
      error: `Vote #${vote.sequence}: previousHash mismatch (expected ${expectedPreviousHash}, got ${vote.previousHash})`,
    };
  }

  const computed = computeVoteHash(vote.previousHash, {
    pollId,
    optionId: vote.optionId,
    blindToken: vote.blindToken,
    blindSignature: vote.blindSignature,
    createdAt: vote.createdAt,
    sequence: vote.sequence,
  });

  if (computed !== vote.hash) {
    return {
      valid: false,
      error: `Vote #${vote.sequence}: hash mismatch (expected ${computed}, got ${vote.hash})`,
    };
  }

  return { valid: true };
}
