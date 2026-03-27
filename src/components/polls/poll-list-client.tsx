"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, CheckCircle } from "lucide-react";

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

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "info" | "warning"> = {
	open: "success",
	closed: "info",
	tallied: "info",
	draft: "outline",
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

function PollCards({ polls, votedPollIds }: { polls: PollListItem[]; votedPollIds: string[] }) {
	if (polls.length === 0) {
		return <p className="mt-6 text-muted-foreground">Aucun vote pour le moment.</p>;
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
			{polls.map((p) => (
				<Link
					key={p.id}
					href={`/polls/${p.id}`}
					className="group block border border-border rounded-sm bg-card hover:border-primary/50 transition-colors"
				>
					<div className="p-5">
						<div className="flex items-center gap-2 mb-3">
							<Badge variant={STATUS_VARIANT[p.status] || "secondary"} className="text-xs">
								{STATUS_LABELS[p.status] || p.status}
							</Badge>
							{votedPollIds.includes(p.id) && (
								<Badge variant="outline" className="text-xs text-green-600 border-green-600/30">
									<CheckCircle className="h-3 w-3 mr-1" />
									A voté
								</Badge>
							)}
							<span className="text-xs text-muted-foreground">
								{p.voteCount} vote{p.voteCount !== 1 ? "s" : ""}
							</span>
							{getTimeLabel(p) && (
								<span className="text-xs text-muted-foreground">
									· {getTimeLabel(p)}
								</span>
							)}
						</div>
						<h3 className="font-bold text-card-foreground group-hover:text-primary transition-colors leading-snug">
							{p.title}
						</h3>
						<p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">
							{p.description}
						</p>
					</div>
					<div className="border-t border-border px-5 py-3 flex justify-end">
						<ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
					</div>
				</Link>
			))}
		</div>
	);
}

export function PollListClient({ polls, votedPollIds = [] }: { polls: PollListItem[]; votedPollIds?: string[] }) {
	const openPolls = polls.filter((p) => p.status === "open");
	const closedPolls = polls.filter((p) => p.status === "closed" || p.status === "tallied");

	return (
		<Tabs defaultValue="open" className="mt-8">
			<TabsList variant="framed">
				<TabsTrigger value="open">En cours ({openPolls.length})</TabsTrigger>
				<TabsTrigger value="closed">Terminés ({closedPolls.length})</TabsTrigger>
				<TabsTrigger value="all">Tous ({polls.length})</TabsTrigger>
			</TabsList>
			<TabsContent value="open" variant="framed">
				<PollCards polls={openPolls} votedPollIds={votedPollIds} />
			</TabsContent>
			<TabsContent value="closed" variant="framed">
				<PollCards polls={closedPolls} votedPollIds={votedPollIds} />
			</TabsContent>
			<TabsContent value="all" variant="framed">
				<PollCards polls={polls} votedPollIds={votedPollIds} />
			</TabsContent>
		</Tabs>
	);
}
