"use client";

import type { PaginatedData } from "@republique/core";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Landmark,
  Loader2,
  TrendingUp,
  Users,
  Vote,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import removeMarkdown from "remove-markdown";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PollListItem {
  description: string;
  endDate: string | null;
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

const TYPE_LABELS: Record<string, string> = {
  law: "Loi",
  referendum: "Référendum",
  election: "Élection",
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  law: "Texte déposé par un député ou le gouvernement pour créer ou modifier une loi.",
  referendum: "Question soumise directement au vote des citoyens.",
  election: "Élection d'une personne à une fonction.",
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

function PollCard({ poll: p }: { poll: PollListItem }) {
  return (
    <Link
      className="group flex flex-col rounded-sm border border-border bg-card transition-colors hover:border-primary/50"
      href={`/polls/${p.id}`}
    >
      <div className="flex-1 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Badge
            className="text-xs"
            variant={STATUS_VARIANT[p.status] || "secondary"}
          >
            {STATUS_LABELS[p.status] || p.status}
          </Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className="text-xs" variant="outline">
                {TYPE_LABELS[p.type] || p.type}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{TYPE_DESCRIPTIONS[p.type]}</p>
            </TooltipContent>
          </Tooltip>
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
          {removeMarkdown(p.description)}
        </p>
      </div>
      <div className="flex justify-end border-border border-t px-5 py-3">
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
      </div>
    </Link>
  );
}

const PAGE_SIZE = 20;

function buildPollKey(
  status: string | null,
  sort: string,
  type: string | null,
  page: number
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: PAGE_SIZE.toString(),
    sort,
  });
  if (status) {
    params.set("status", status);
  }
  if (type) {
    params.set("type", type);
  }
  return `/api/poll?${params}`;
}

function usePolls(
  status: string | null,
  sort: string,
  type: string | null,
  fallbackData?: PaginatedData<PollListItem>
) {
  const [page, setPage] = useState(1);
  const [prevFilters, setPrevFilters] = useState({ status, sort, type });

  if (
    prevFilters.status !== status ||
    prevFilters.sort !== sort ||
    prevFilters.type !== type
  ) {
    setPrevFilters({ status, sort, type });
    setPage(1);
  }

  const key = buildPollKey(status, sort, type, page);
  const { data, isLoading } = useSWR<PaginatedData<PollListItem>>(key, {
    keepPreviousData: true,
    fallbackData:
      status === "open" && sort === "recent" && !type && page === 1
        ? fallbackData
        : undefined,
  });

  return { data: data ?? null, loading: isLoading, page, goToPage: setPage };
}

function PollTab({
  status,
  sort,
  type,
  fallbackData,
}: {
  status: string | null;
  sort: string;
  type: string | null;
  fallbackData?: PaginatedData<PollListItem>;
}) {
  const { data, loading, page, goToPage } = usePolls(
    status,
    sort,
    type,
    fallbackData
  );

  if (loading && !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <p className="mt-6 text-muted-foreground">Aucun vote pour le moment.</p>
    );
  }

  return (
    <>
      <div
        className={`mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 ${loading ? "pointer-events-none opacity-50" : ""}`}
      >
        {data.items.map((p) => (
          <PollCard key={p.id} poll={p} />
        ))}
      </div>
      {data.pageCount > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} sur {data.pageCount} ({data.itemCount} votes)
          </p>
          <div className="flex items-center gap-1">
            <Button
              disabled={page <= 1 || loading}
              onClick={() => goToPage(page - 1)}
              size="icon"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              disabled={page >= data.pageCount || loading}
              onClick={() => goToPage(page + 1)}
              size="icon"
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

interface PollCounts {
  all: number;
  closed: number;
  open: number;
}

const TYPE_FILTERS = [
  { value: null, label: "Tous", icon: null },
  { value: "law", label: "Lois", icon: Landmark },
  { value: "referendum", label: "Référendums", icon: Vote },
  { value: "election", label: "Élections", icon: Users },
] as const;

export function PollListClient({
  counts: initialCounts,
  initialData,
}: {
  counts: PollCounts;
  initialData?: PaginatedData<PollListItem>;
}) {
  const [sort, setSort] = useState("recent");
  const [type, setType] = useState<string | null>(null);

  const { data: fetchedCounts } = useSWR<PollCounts>(
    type ? `/api/poll/counts?type=${type}` : null,
    { keepPreviousData: true }
  );
  const counts = type ? (fetchedCounts ?? initialCounts) : initialCounts;

  const openLabel = `En cours (${counts.open})`;
  const closedLabel = `Terminés (${counts.closed})`;
  const allLabel = `Tous (${counts.all})`;

  return (
    <Tabs className="mt-8" defaultValue="open">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          {TYPE_FILTERS.map((f) => {
            const description = f.value
              ? TYPE_DESCRIPTIONS[f.value]
              : undefined;
            const btn = (
              <Button
                key={f.label}
                onClick={() => setType(f.value)}
                size="sm"
                variant={type === f.value ? "default" : "outline"}
              >
                {f.icon && <f.icon className="mr-1.5 h-3.5 w-3.5" />}
                {f.label}
              </Button>
            );
            if (!description) {
              return btn;
            }
            return (
              <Tooltip key={f.label}>
                <TooltipTrigger asChild>{btn}</TooltipTrigger>
                <TooltipContent>
                  <p>{description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Trier par</span>
          <Button
            onClick={() => setSort("recent")}
            size="sm"
            variant={sort === "recent" ? "default" : "outline"}
          >
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            Récents
          </Button>
          <Button
            onClick={() => setSort("votes")}
            size="sm"
            variant={sort === "votes" ? "default" : "outline"}
          >
            <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
            Plus votés
          </Button>
        </div>
      </div>
      <TabsList variant="framed">
        <TabsTrigger value="open">{openLabel}</TabsTrigger>
        <TabsTrigger value="closed">{closedLabel}</TabsTrigger>
        <TabsTrigger value="all">{allLabel}</TabsTrigger>
      </TabsList>
      <TabsContent value="open" variant="framed">
        <PollTab
          fallbackData={initialData}
          sort={sort}
          status="open"
          type={type}
        />
      </TabsContent>
      <TabsContent value="closed" variant="framed">
        <PollTab sort={sort} status="closed" type={type} />
      </TabsContent>
      <TabsContent value="all" variant="framed">
        <PollTab sort={sort} status={null} type={type} />
      </TabsContent>
    </Tabs>
  );
}
