import { desc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoardClient } from "@/components/polls/board-client";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { db } from "@/db";
import { option, poll, rekorEntry, voteRecord } from "@/db/schema";
import { constructMetadata } from "@/lib/metadata";
import { verifyChain } from "@/services/poll/merkle";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pollId: string }>;
}): Promise<Metadata> {
  const { pollId } = await params;
  const p = await db.query.poll.findFirst({ where: eq(poll.id, pollId) });
  if (!p) {
    return {};
  }
  return {
    ...constructMetadata({
      title: `Cahier de vote — ${p.title}`,
      description: `Registre public des votes pour : ${p.title}`,
    }),
    robots: { index: false },
    alternates: {
      types: {
        "application/rss+xml": `/api/poll/${pollId}/board/feed`,
      },
    },
  };
}

const PAGE_SIZE = 50;

export default async function BoardPage({
  params,
}: {
  params: Promise<{ pollId: string }>;
}) {
  const { pollId } = await params;

  const p = await db.query.poll.findFirst({ where: eq(poll.id, pollId) });

  if (!p) {
    notFound();
  }

  const options = await db
    .select({ id: option.id, label: option.label })
    .from(option)
    .where(eq(option.pollId, pollId))
    .orderBy(option.position);

  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(voteRecord)
    .where(eq(voteRecord.pollId, pollId));
  const totalVotes = Number(count);

  const initialVotes = await db
    .select({
      sequence: voteRecord.sequence,
      optionId: voteRecord.optionId,
      blindToken: voteRecord.blindToken,
      blindSignature: voteRecord.blindSignature,
      hash: voteRecord.hash,
      previousHash: voteRecord.previousHash,
      createdAt: voteRecord.createdAt,
    })
    .from(voteRecord)
    .where(eq(voteRecord.pollId, pollId))
    .orderBy(desc(voteRecord.sequence))
    .limit(PAGE_SIZE);

  const integrity = await verifyChain(pollId);

  const rekorEntries = await db
    .select({
      sequence: rekorEntry.sequence,
      logIndex: rekorEntry.logIndex,
    })
    .from(rekorEntry)
    .where(eq(rekorEntry.pollId, pollId));

  const rekorMap: Record<number, number> = {};
  for (const entry of rekorEntries) {
    rekorMap[entry.sequence] = entry.logIndex;
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Accueil", href: "/" },
          { label: "Votes", href: "/polls" },
          { label: p.title, href: `/polls/${pollId}` },
          { label: "Cahier de vote" },
        ]}
      />

      <BoardClient
        initialVotes={initialVotes}
        options={options}
        poll={{
          id: p.id,
          title: p.title,
          status: p.status,
          merkleRoot: p.merkleRoot,
        }}
        rekorMap={rekorMap}
        serverChainValid={integrity.valid}
        totalVotes={totalVotes}
      />
    </>
  );
}
