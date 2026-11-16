import { and, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  type ChamberVote,
  OfficialResult,
} from "@/components/polls/poll-detail/official-result";
import { OfficialSources } from "@/components/polls/poll-detail/official-sources";
import { ParliamentVotes } from "@/components/polls/poll-detail/parliament-votes";
import { PollAuthors } from "@/components/polls/poll-detail/poll-authors";
import { PollJourney } from "@/components/polls/poll-detail/poll-journey";
import { PollSummary } from "@/components/polls/poll-detail/poll-summary";
import { PollDetailClient } from "@/components/polls/poll-detail-client";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
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
import { deputyPhotoUrl } from "@/services/assembly/photo";
import { findScrutinVotes } from "@/services/assembly/votes";
import { auth } from "@/services/auth";
import { getPollResults } from "@/services/poll/results";
import { findSenateVotes } from "@/services/senate/votes";

export const dynamic = "force-dynamic";

const SCRUTIN_UID = /^VTANR5L(\d+)V(\d+)$/;

// "VTANR5L17V9807" is scrutin 9807 of the 17th legislature
function scrutinPageUrl(uid: string | null) {
  const match = uid ? SCRUTIN_UID.exec(uid) : null;
  return match
    ? `https://www.assemblee-nationale.fr/dyn/${match[1]}/scrutins/${match[2]}`
    : null;
}

// "2025-95" → page of the 95th public vote of the 2025-2026 session
function senateScrutinUrl(ref: string | null) {
  const [session, number] = ref?.split("-") ?? [];
  return session && number
    ? `https://www.senat.fr/scrutin-public/${session}/scr${session}-${number}.html`
    : null;
}

type LegislativeFile = typeof legislativeFile.$inferSelect;

function deputiesVote(lf: LegislativeFile): ChamberVote | null {
  if (lf.officialFor === null) {
    return null;
  }
  return {
    for: lf.officialFor,
    against: lf.officialAgainst ?? 0,
    abstentions: lf.officialAbstentions ?? 0,
    date: lf.scrutinDate ?? "",
    url: scrutinPageUrl(lf.scrutinUid),
  };
}

function senatorsVote(lf: LegislativeFile): ChamberVote | null {
  if (lf.senateFor === null) {
    return null;
  }
  return {
    for: lf.senateFor,
    against: lf.senateAgainst ?? 0,
    abstentions: lf.senateAbstentions ?? 0,
    date: lf.senateScrutinDate ?? "",
    url: senateScrutinUrl(lf.senateScrutinRef),
  };
}

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
  const lf = await db.query.legislativeFile.findFirst({
    where: eq(legislativeFile.pollId, pollId),
  });
  const [scrutinVotes, senateVotes] = await Promise.all([
    findScrutinVotes(pollId),
    findSenateVotes(pollId),
  ]);

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
      <div className="pb-24 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6 lg:pb-0">
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
                <PollAuthors
                  authors={authors}
                  byGovernment={authors.some(
                    (a) => a.role === "author" && a.functionTitle !== null
                  )}
                />
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
          </div>

          {
            await (async () => {
              const deputies = lf ? deputiesVote(lf) : null;
              const senators = lf ? senatorsVote(lf) : null;
              if (!(deputies || senators)) {
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
                  deputies={deputies}
                  senators={senators}
                />
              );
            })()
          }
          <ParliamentVotes
            deputies={
              scrutinVotes.groups.length > 0
                ? {
                    groups: scrutinVotes.groups,
                    votes: scrutinVotes.votes.map((v) => ({
                      ...v,
                      photoUrl: deputyPhotoUrl(v.id, v.photoLegislature),
                    })),
                  }
                : null
            }
            senators={senateVotes.votes.length > 0 ? senateVotes : null}
          />
          {lf?.journey ? <PollJourney steps={lf.journey} /> : null}
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
          <OfficialSources
            assemblyUrl={p.sourceUrl}
            senateUrl={lf?.senateUrl ?? null}
          />
        </aside>
      </div>
    </>
  );
}
