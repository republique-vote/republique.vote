"use client";

import { Card } from "@codegouvfr/react-dsfr/Card";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { fr } from "@codegouvfr/react-dsfr";

export interface PollListItem {
	id: string;
	title: string;
	description: string;
	type: string;
	status: string;
	startDate: string;
	endDate: string;
	voteCount: number;
}

const STATUS_LABELS: Record<string, string> = {
	open: "En cours",
	closed: "Terminé",
	tallied: "Dépouillé",
	draft: "Brouillon",
};

const STATUS_SEVERITY: Record<string, "success" | "info" | "warning" | "error" | "new"> = {
	open: "success",
	closed: "info",
	tallied: "info",
	draft: "warning",
};

function getTimeLabel(poll: PollListItem) {
	if (poll.status === "open" && poll.endDate) {
		const diff = new Date(poll.endDate).getTime() - Date.now();
		if (diff <= 0) return "Terminé";
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		if (days > 0) return `${days}j restant${days > 1 ? "s" : ""}`;
		const hours = Math.floor(diff / (1000 * 60 * 60));
		if (hours > 0) return `${hours}h restante${hours > 1 ? "s" : ""}`;
		return "< 1h";
	}
	if ((poll.status === "closed" || poll.status === "tallied") && poll.endDate) {
		return `Terminé le ${new Date(poll.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
	}
	return null;
}

function PollCards({ polls }: { polls: PollListItem[] }) {
	if (polls.length === 0) {
		return <p className={fr.cx("fr-mt-4w")}>Aucun vote pour le moment.</p>;
	}

	return (
		<div className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mt-4w")}>
			{polls.map((p) => (
				<div key={p.id} className={fr.cx("fr-col-12", "fr-col-md-6")}>
					<Card
						title={p.title}
						desc={p.description}
						detail={
							<>
								<Badge severity={STATUS_SEVERITY[p.status] || "info"} small>
									{STATUS_LABELS[p.status] || p.status}
								</Badge>
								<span style={{ marginLeft: "8px" }}>
									{p.voteCount} vote{p.voteCount !== 1 ? "s" : ""}
								</span>
								{getTimeLabel(p) && (
									<span style={{ marginLeft: "8px", color: "var(--text-mention-grey)" }}>
										· {getTimeLabel(p)}
									</span>
								)}
							</>
						}
						enlargeLink
						linkProps={{
							href: `/polls/${p.id}`,
						}}
					/>
				</div>
			))}
		</div>
	);
}

export function PollListClient({ polls }: { polls: PollListItem[] }) {
	const openPolls = polls.filter((p) => p.status === "open");
	const closedPolls = polls.filter((p) => p.status === "closed" || p.status === "tallied");

	return (
		<Tabs
			className={fr.cx("fr-mt-4w")}
			tabs={[
				{
					label: `En cours (${openPolls.length})`,
					content: <PollCards polls={openPolls} />,
				},
				{
					label: `Terminés (${closedPolls.length})`,
					content: <PollCards polls={closedPolls} />,
				},
				{
					label: `Tous (${polls.length})`,
					content: <PollCards polls={polls} />,
				},
			]}
		/>
	);
}
