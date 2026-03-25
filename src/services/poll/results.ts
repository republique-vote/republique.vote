import { db } from "@/db";
import { option, voteRecord } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function getPollResults(pollId: string) {
  const options = await db
    .select()
    .from(option)
    .where(eq(option.pollId, pollId))
    .orderBy(option.position);

  const votes = await db
    .select({
      optionId: voteRecord.optionId,
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(voteRecord)
    .where(eq(voteRecord.pollId, pollId))
    .groupBy(voteRecord.optionId);

  const voteCounts = new Map(votes.map((v) => [v.optionId, v.count]));
  const totalVotes = votes.reduce((sum, v) => sum + v.count, 0);

  return {
    pollId,
    totalVotes,
    results: options.map((opt) => {
      const count = voteCounts.get(opt.id) || 0;
      return {
        optionId: opt.id,
        label: opt.label,
        position: opt.position,
        count,
        percentage:
          totalVotes > 0
            ? Math.round((count / totalVotes) * 1000) / 10
            : 0,
      };
    }),
  };
}
