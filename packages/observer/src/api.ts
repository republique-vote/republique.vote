import type { PaginatedData, Vote } from "@republique/core";
import { parseApiResponse } from "@republique/core";

interface PollListItem {
  id: string;
  status: string;
  title: string;
  voteCount: number;
}

interface PollInfo {
  endDate: string;
  id: string;
  merkleRoot: string | null;
  options: { id: string; label: string }[];
  startDate: string;
  status: string;
  title: string;
  voteCount: number;
}

interface BoardData {
  chainValid: boolean;
  merkleRoot: string | null;
  options: { id: string; label: string }[];
  pollId: string;
  pollTitle: string;
  votes: PaginatedData<Vote>;
}

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async listPolls(status?: string): Promise<PollListItem[]> {
    const url = status
      ? `${this.baseUrl}/api/poll?status=${status}`
      : `${this.baseUrl}/api/poll`;
    const res = await fetch(url);
    return parseApiResponse<PollListItem[]>(res);
  }

  async getPoll(pollId: string): Promise<PollInfo> {
    const res = await fetch(`${this.baseUrl}/api/poll/${pollId}`);
    return parseApiResponse<PollInfo>(res);
  }

  async getBoardPage(
    pollId: string,
    page: number,
    limit = 50
  ): Promise<BoardData> {
    const res = await fetch(
      `${this.baseUrl}/api/poll/${pollId}/board?page=${page}&limit=${limit}&order=asc`
    );
    return parseApiResponse<BoardData>(res);
  }

  async *getAllVotesPaginated(
    pollId: string,
    limit = 50
  ): AsyncGenerator<Vote[]> {
    let page = 1;
    let pageCount = 1;

    do {
      const data = await this.getBoardPage(pollId, page, limit);
      pageCount = data.votes.pageCount;
      yield data.votes.items;
      page++;
    } while (page <= pageCount);
  }

  createSSEUrl(pollId: string): string {
    return `${this.baseUrl}/api/poll/${pollId}/board/stream`;
  }
}
