import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Vote } from "@republique/core";

export class VoteStore {
  private readonly votes: Vote[] = [];
  private readonly filePath: string;

  constructor(outputDir: string, pollId: string) {
    const dir = join(outputDir, pollId);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    this.filePath = join(dir, "votes.json");

    if (existsSync(this.filePath)) {
      const raw = readFileSync(this.filePath, "utf-8");
      this.votes = JSON.parse(raw);
    }
  }

  addVotes(votes: Vote[]) {
    for (const vote of votes) {
      if (!this.votes.some((v) => v.sequence === vote.sequence)) {
        this.votes.push(vote);
      }
    }
    this.votes.sort((a, b) => a.sequence - b.sequence);
    this.save();
  }

  addVote(vote: Vote) {
    this.addVotes([vote]);
  }

  getLastHash(): string | null {
    if (this.votes.length === 0) {
      return null;
    }
    return this.votes.at(-1)?.hash ?? null;
  }

  count(): number {
    return this.votes.length;
  }

  getPath(): string {
    return this.filePath;
  }

  private save() {
    writeFileSync(this.filePath, JSON.stringify(this.votes, null, 2));
  }
}
