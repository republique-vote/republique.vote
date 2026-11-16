import { PollListClient } from "@/components/polls/poll-list-client";
import {
  parsePollListParams,
  tabStatus,
} from "@/components/polls/poll-list-params";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { constructMetadata } from "@/lib/metadata";
import { countPolls, listPolls } from "@/services/poll/list";

export const dynamic = "force-dynamic";

export const metadata = constructMetadata({
  title: "Lois, référendums et élections citoyennes — Votes en cours",
  description:
    "Votez sur les textes de loi débattus à l'Assemblée nationale. Chaque vote est anonyme, publié publiquement et vérifiable par tous.",
});

const PAGE_SIZE = 20;

export default async function PollsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Filters and page come from the URL, so a shared link shows the same list
  const filters = parsePollListParams(await searchParams);
  const [counts, initialData] = await Promise.all([
    countPolls(filters.type),
    listPolls({
      status: tabStatus(filters.tab),
      type: filters.type,
      sort: filters.sort,
      page: filters.page,
      limit: PAGE_SIZE,
    }),
  ]);

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Accueil", href: "/" }, { label: "Votes" }]}
      />
      <h1 className="font-bold text-3xl tracking-tight">Votes</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Participez aux votes en cours ou consultez les résultats des votes
        terminés.
      </p>
      <PollListClient
        counts={counts}
        initialData={initialData}
        initialFilters={filters}
      />
    </>
  );
}
