export interface Vote {
  blindSignature: string;
  blindToken: string;
  createdAt: string;
  hash: string;
  optionId: string;
  previousHash: string | null;
  sequence: number;
}

export interface PollOption {
  id: string;
  label: string;
  position: number;
}

export interface ResultData {
  count: number;
  label: string;
  optionId: string;
  percentage: number;
}

export interface ResultsResponse {
  pollId: string;
  results: ResultData[];
  totalVotes: number;
}
