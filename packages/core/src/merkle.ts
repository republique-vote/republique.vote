export interface VoteHashInput {
  blindSignature: string;
  blindToken: string;
  createdAt: string;
  optionId: string;
  pollId: string;
  sequence: number;
}

/**
 * Build the preimage string for vote hash computation.
 * The caller is responsible for computing SHA-256 on the result.
 */
export function buildVoteHashPreimage(
  previousHash: string | null,
  vote: VoteHashInput
): string {
  return [
    previousHash || "",
    vote.pollId,
    vote.optionId,
    vote.blindToken,
    vote.blindSignature,
    vote.createdAt,
    vote.sequence.toString(),
  ].join("|");
}
