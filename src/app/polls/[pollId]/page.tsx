import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PollDetailClient } from "@/components/polls/poll-detail-client";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { db } from "@/db";
import { blindSignatureRequest, option, poll } from "@/db/schema";
import { auth } from "@/services/auth";
import { getPollResults } from "@/services/poll/results";

export const dynamic = "force-dynamic";

export default async function PollDetailPage({
  params,
}: {
  params: Promise<{ pollId: string }>;
}) {
  const { pollId } = await params;

  const p = await db.query.poll.findFirst({ where: eq(poll.id, pollId) });

  if (!p) {
    notFound();
  }

  const options = await db
    .select()
    .from(option)
    .where(eq(option.pollId, pollId))
    .orderBy(option.position);

  const [{ count: rawCount }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(sql`vote_record`)
    .where(sql`poll_id = ${pollId}`);
  const count = Number(rawCount);

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
          eq(blindSignatureRequest.userId, session.user.id)
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
      <Breadcrumbs
        items={[
          { label: "Accueil", href: "/" },
          { label: "Votes", href: "/polls" },
          { label: p.title },
        ]}
      />

      <div className="mb-6">
        <Badge className="mb-3" variant={isOpen ? "success" : "info"}>
          {isOpen ? "En cours" : "Terminé"}
        </Badge>
        <h1 className="font-bold text-3xl tracking-tight">{p.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{p.description}</p>
      </div>

      <PollDetailClient
        initialHasVoted={hasVoted}
        initialMerkleRoot={p.merkleRoot}
        initialResults={results}
        initialVoteCount={count}
        options={options}
        poll={{
          id: p.id,
          title: p.title,
          description: p.description,
          type: p.type,
          status: p.status,
          startDate: p.startDate,
          endDate: p.endDate,
        }}
      />
    </>
  );
}
