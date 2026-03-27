import { notFound } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { db } from "@/db";
import { poll, option, voteRecord } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { verifyChain } from "@/services/poll/merkle";
import { BoardClient } from "@/components/polls/board-client";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ pollId: string }> }): Promise<Metadata> {
	const { pollId } = await params;
	return {
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

	const p = await db.query.poll.findFirst({
		where: eq(poll.id, pollId),
	});

	if (!p) notFound();

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

	return (
		<>
			<Breadcrumb className="mb-6">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="/">Accueil</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink href="/polls">Votes</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink href={`/polls/${pollId}`}>{p.title}</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>Cahier de vote</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<BoardClient
				poll={{
					id: p.id,
					title: p.title,
					status: p.status,
					merkleRoot: p.merkleRoot,
				}}
				options={options}
				initialVotes={initialVotes}
				totalVotes={totalVotes}
				serverChainValid={integrity.valid}
			/>
		</>
	);
}
