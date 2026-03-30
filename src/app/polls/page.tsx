import { sql } from "drizzle-orm";
import { PollListClient } from "@/components/polls/poll-list-client";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { db } from "@/db";
import { poll } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function PollsPage() {
  const [counts] = await db
    .select({
      open: sql<number>`COUNT(*) FILTER (WHERE ${poll.status} = 'open')`,
      closed: sql<number>`COUNT(*) FILTER (WHERE ${poll.status} IN ('closed', 'tallied'))`,
      all: sql<number>`COUNT(*)`,
    })
    .from(poll);

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
          open: Number(counts.open),
          closed: Number(counts.closed),
          all: Number(counts.all),
        }}
      />
    </>
  );
}
