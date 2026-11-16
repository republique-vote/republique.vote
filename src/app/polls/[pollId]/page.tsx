import { and, eq, sql } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { OfficialResult } from "@/components/polls/poll-detail/official-result";
import { PollAuthors } from "@/components/polls/poll-detail/poll-authors";
import { PollSummary } from "@/components/polls/poll-detail/poll-summary";
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
  pollSummary,
} from "@/db/schema";
import { constructMetadata } from "@/lib/metadata";
import { findPollAuthors } from "@/services/assembly/authors";
import { auth } from "@/services/auth";
import { getPollResults } from "@/services/poll/results";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pollId: string }>;
}): Promise<Metadata> {
  const { pollId } = await params;
  const p = await db.query.poll.findFirst({ where: eq(poll.id, pollId) });
  if (!p) {
    return {};
  }
  return constructMetadata({
    title: p.title,
    description: p.description,
    ogType: "article",
    pollType: p.type,
  });
}

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

  const summary = await db.query.pollSummary.findFirst({
    where: eq(pollSummary.pollId, pollId),
  });

  const authors = await findPollAuthors(pollId);

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
  let isAuthenticated = false;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (session) {
      isAuthenticated = true;
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

      {/* Two columns on desktop: the vote stays in view while reading */}
      <div className="pb-24 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10 lg:pb-0">
        <div className="min-w-0">
          <div className="mb-6">
            <Badge className="mb-3" variant={isOpen ? "success" : "info"}>
              {isOpen ? "En cours" : "Terminé"}
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight">{p.title}</h1>
            {summary ? (
              <div className="mt-4">
                <PollSummary pollId={p.id} summary={summary} />
              </div>
            ) : null}
            {authors.length > 0 ? (
              <div className="mt-4">
                <PollAuthors authors={authors} />
              </div>
            ) : null}
            <div className="mt-4">
              {summary ? (
                <h2 className="mb-1 font-medium text-sm">
                  Le texte des auteurs (exposé des motifs)
                </h2>
              ) : null}
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

          {
            await (async () => {
              const lf = await db.query.legislativeFile.findFirst({
                where: eq(legislativeFile.pollId, pollId),
              });
              if (!lf || lf.officialFor === null) {
                return null;
              }
              const citizenFor = results?.results.find(
                (r) => r.label === "Pour"
              );
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
        </div>

        <aside className="lg:sticky lg:top-6" id="vote">
          <PollDetailClient
            initialHasVoted={hasVoted}
            initialIsAuthenticated={isAuthenticated}
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
        </aside>
      </div>
    </>
  );
}
