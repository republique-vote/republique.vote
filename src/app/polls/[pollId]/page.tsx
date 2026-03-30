import { and, eq, sql } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { OfficialResult } from "@/components/polls/poll-detail/official-result";
import { PollDetailClient } from "@/components/polls/poll-detail-client";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { db } from "@/db";
import {
  blindSignatureRequest,
  legislativeFile,
  option,
  poll,
} from "@/db/schema";
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
        <div className="mt-2">
          <Markdown collapsible>{p.description}</Markdown>
        </div>
        {p.sourceUrl && (
          <Button asChild className="mt-3" variant="outline">
            <a href={p.sourceUrl} rel="noopener noreferrer" target="_blank">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Voir sur assemblee-nationale.fr
            </a>
          </Button>
        )}
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

      {
        await (async () => {
          const lf = await db.query.legislativeFile.findFirst({
            where: eq(legislativeFile.pollId, pollId),
          });
          if (!lf || lf.officialFor === null) {
            return null;
          }
          const citizenFor = results?.results.find((r) => r.label === "Pour");
          const citizenAgainst = results?.results.find(
            (r) => r.label === "Contre"
          );
          const citizenAbst = results?.results.find(
            (r) => r.label === "Abstention"
          );
          return (
            <OfficialResult
              citizenResults={
                results
                  ? {
                      forPercentage: citizenFor?.percentage || 0,
                      againstPercentage: citizenAgainst?.percentage || 0,
                      abstentionPercentage: citizenAbst?.percentage || 0,
                      totalVotes: results.totalVotes,
                    }
                  : null
              }
              officialAbstentions={lf.officialAbstentions || 0}
              officialAgainst={lf.officialAgainst || 0}
              officialFor={lf.officialFor}
              scrutinDate={lf.scrutinDate || ""}
              sourceUrl={lf.sourceUrl}
            />
          );
        })()
      }
    </>
  );
}
