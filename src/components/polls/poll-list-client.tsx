"use client";

import { ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface PollListItem {
  description: string;
  endDate: string;
  id: string;
  startDate: string;
  status: string;
  title: string;
  type: string;
  voteCount: number;
}

const STATUS_LABELS: Record<string, string> = {
  open: "En cours",
  closed: "Terminé",
  tallied: "Dépouillé",
  draft: "Brouillon",
};

const STATUS_VARIANT: Record<
  string,
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "info"
  | "warning"
> = {
  open: "success",
  closed: "info",
  tallied: "info",
  draft: "outline",
};

function getTimeLabel(poll: PollListItem) {
  if (poll.status === "open" && poll.endDate) {
    const diff = new Date(poll.endDate).getTime() - Date.now();
    if (diff <= 0) {
      return "Terminé";
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) {
      return `${days}j restant${days > 1 ? "s" : ""}`;
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) {
      return `${hours}h restante${hours > 1 ? "s" : ""}`;
    }
    return "< 1h";
  }
  if ((poll.status === "closed" || poll.status === "tallied") && poll.endDate) {
    return `Terminé le ${new Date(poll.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  return null;
}

function PollCards({
  polls,
  votedPollIds,
}: {
  polls: PollListItem[];
  votedPollIds: string[];
}) {
  if (polls.length === 0) {
    return (
      <p className="mt-6 text-muted-foreground">Aucun vote pour le moment.</p>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      {polls.map((p) => (
        <Link
          className="group block rounded-sm border border-border bg-card transition-colors hover:border-primary/50"
          href={`/polls/${p.id}`}
          key={p.id}
        >
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Badge
                className="text-xs"
                variant={STATUS_VARIANT[p.status] || "secondary"}
              >
                {STATUS_LABELS[p.status] || p.status}
              </Badge>
              {votedPollIds.includes(p.id) && (
                <Badge
                  className="border-green-600/30 text-green-600 text-xs"
                  variant="outline"
                >
                  <CheckCircle className="mr-1 h-3 w-3" />A voté
                </Badge>
              )}
              <span className="text-muted-foreground text-xs">
                {p.voteCount} vote{p.voteCount === 1 ? "" : "s"}
              </span>
              {getTimeLabel(p) && (
                <span className="text-muted-foreground text-xs">
                  · {getTimeLabel(p)}
                </span>
              )}
            </div>
            <h3 className="font-bold text-card-foreground leading-snug transition-colors group-hover:text-primary">
              {p.title}
            </h3>
            <p className="mt-2 line-clamp-3 text-muted-foreground text-sm leading-relaxed">
              {p.description}
            </p>
          </div>
          <div className="flex justify-end border-border border-t px-5 py-3">
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
        </Link>
      ))}
    </div>
  );
}

export function PollListClient({
  polls,
  votedPollIds = [],
}: {
  polls: PollListItem[];
  votedPollIds?: string[];
}) {
  const openPolls = polls.filter((p) => p.status === "open");
  const closedPolls = polls.filter(
    (p) => p.status === "closed" || p.status === "tallied"
  );

  return (
    <Tabs className="mt-8" defaultValue="open">
      <TabsList variant="framed">
        <TabsTrigger value="open">En cours ({openPolls.length})</TabsTrigger>
        <TabsTrigger value="closed">
          Terminés ({closedPolls.length})
        </TabsTrigger>
        <TabsTrigger value="all">Tous ({polls.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="open" variant="framed">
        <PollCards polls={openPolls} votedPollIds={votedPollIds} />
      </TabsContent>
      <TabsContent value="closed" variant="framed">
        <PollCards polls={closedPolls} votedPollIds={votedPollIds} />
      </TabsContent>
      <TabsContent value="all" variant="framed">
        <PollCards
          polls={[...polls].sort((a, b) => {
            const aEnded =
              a.status === "closed" || a.status === "tallied" ? 1 : 0;
            const bEnded =
              b.status === "closed" || b.status === "tallied" ? 1 : 0;
            return aEnded - bEnded;
          })}
          votedPollIds={votedPollIds}
        />
      </TabsContent>
    </Tabs>
  );
}
