import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { fr } from "@codegouvfr/react-dsfr";
import { db } from "@/db";
import { poll, option, blindSignatureRequest } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/services/auth";
import { getPollResults } from "@/services/poll/results";
import { PollDetailClient } from "@/components/polls/poll-detail-client";
import { CopyableHash } from "@/components/ui/copyable-hash";
import { StartDsfrOnHydration } from "../../../dsfr-bootstrap";

export default async function PollDetailPage({
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
		.select()
		.from(option)
		.where(eq(option.pollId, pollId))
		.orderBy(option.position);

	const [{ count }] = await db
		.select({ count: sql<number>`COUNT(*)` })
		.from(sql`vote_record`)
		.where(sql`poll_id = ${pollId}`);

	const results = await getPollResults(pollId);

	let hasVoted = false;
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		if (session) {
			const request = await db.query.blindSignatureRequest.findFirst({
				where: and(
					eq(blindSignatureRequest.pollId, pollId),
					eq(blindSignatureRequest.userId, session.user.id),
				),
			});
			hasVoted = !!request;
		}
	} catch {
		// Not authenticated
	}

	const isOpen = p.status === "open";

	return (
		<>
			<StartDsfrOnHydration />
			<Breadcrumb
				currentPageLabel={p.title}
				segments={[
					{ label: "Accueil", linkProps: { href: "/" } },
					{ label: "Votes", linkProps: { href: "/polls" } },
				]}
			/>
			<div className={fr.cx("fr-mb-4w")}>
				<Badge
					severity={isOpen ? "success" : "info"}
					className={fr.cx("fr-mb-2w")}
				>
					{isOpen ? "En cours" : "Terminé"}
				</Badge>
				<h1>{p.title}</h1>
				<p className={fr.cx("fr-text--lead")}>{p.description}</p>
			</div>

			<PollDetailClient
				poll={{
					id: p.id,
					title: p.title,
					description: p.description,
					type: p.type,
					status: p.status,
					startDate: p.startDate,
					endDate: p.endDate,
				}}
				options={options}
				initialResults={results}
				initialHasVoted={hasVoted}
				initialVoteCount={count}
			/>

			{p.merkleRoot && (
				<div className={fr.cx("fr-mt-4w")} style={{ borderTop: "1px solid var(--border-default-grey)", paddingTop: "16px" }}>
					<CopyableHash
						label="Empreinte du cahier de vote"
						tooltip="Ce code est calculé mathématiquement à partir de tous les votes. Il évolue à chaque nouveau vote. Si quelqu'un modifie ou supprime un ancien vote, le calcul ne tombe plus juste et tout le monde peut le vérifier."
						value={p.merkleRoot}
					/>
				</div>
			)}
		</>
	);
}
