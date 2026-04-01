import { count, desc, eq, sql } from "drizzle-orm";
import { PollListClient } from "@/components/polls/poll-list-client";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { db } from "@/db";
import { poll, voteRecord } from "@/db/schema";
import { constructMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = constructMetadata({
  title: "Lois, référendums et élections citoyennes — Votes en cours",
  description:
    "Votez sur les textes de loi débattus à l'Assemblée nationale. Chaque vote est anonyme, publié publiquement et vérifiable par tous.",
});

const PAGE_SIZE = 20;

export default async function PollsPage() {
  const [counts] = await db
    .select({
      open: sql<number>`COUNT(*) FILTER (WHERE ${poll.status} = 'open')`,
      closed: sql<number>`COUNT(*) FILTER (WHERE ${poll.status} IN ('closed', 'tallied'))`,
      all: sql<number>`COUNT(*)`,
    })
    .from(poll);

  const openCount = Number(counts.open);

  const initialPolls = await db
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
    .where(eq(poll.status, "open"))
    .groupBy(poll.id)
    .orderBy(
      sql`CASE WHEN ${poll.endDate} IS NOT NULL THEN 0 ELSE 1 END`,
      desc(poll.createdAt)
    )
    .limit(PAGE_SIZE);

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
        counts={{
          open: openCount,
          closed: Number(counts.closed),
          all: Number(counts.all),
        }}
        initialData={{
          items: initialPolls.map((p) => ({
            ...p,
            voteCount: Number(p.voteCount),
          })),
          currentPage: 1,
          pageCount: Math.ceil(openCount / PAGE_SIZE),
          itemCount: openCount,
          itemLimit: PAGE_SIZE,
        }}
      />
    </>
  );
}
