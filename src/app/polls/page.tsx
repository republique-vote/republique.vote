import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { fr } from "@codegouvfr/react-dsfr";
import { db } from "@/db";
import { poll, voteRecord } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { PollListClient } from "@/components/polls/poll-list-client";
import { StartDsfrOnHydration } from "../../dsfr-bootstrap";

export default async function PollsPage() {
	const polls = await db
		.select({
			id: poll.id,
			title: poll.title,
			description: poll.description,
			type: poll.type,
			status: poll.status,
			startDate: poll.startDate,
			endDate: poll.endDate,
			createdAt: poll.createdAt,
			voteCount: count(voteRecord.id),
		})
		.from(poll)
		.leftJoin(voteRecord, eq(voteRecord.pollId, poll.id))
		.groupBy(poll.id)
		.orderBy(poll.createdAt);

	return (
		<>
			<StartDsfrOnHydration />
			<Breadcrumb
				currentPageLabel="Votes"
				segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
			/>
			<h1>Votes</h1>
			<p className={fr.cx("fr-text--lead")}>
				Participez aux votes en cours ou consultez les résultats des votes terminés.
			</p>
			<PollListClient polls={polls} />
		</>
	);
}
