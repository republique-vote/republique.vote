import { and, eq, sql } from "drizzle-orm";
import { ScrollText } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PollDetailClient } from "@/components/polls/poll-detail-client";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { CopyableHash } from "@/components/ui/copyable-hash";
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

  const p = await db.query.poll.findFirst({
    where: eq(poll.id, pollId),
  });

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
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/polls">Votes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{p.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <Badge className="mb-3" variant={isOpen ? "success" : "info"}>
          {isOpen ? "En cours" : "Terminé"}
        </Badge>
        <h1 className="font-bold text-3xl tracking-tight">{p.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{p.description}</p>
      </div>

      <PollDetailClient
        initialHasVoted={hasVoted}
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

      {p.merkleRoot && (
        <div className="mt-8 border-t pt-4">
          <CopyableHash
            label="Empreinte du cahier de vote"
            tooltip="Ce code est calculé mathématiquement à partir de tous les votes. Il évolue à chaque nouveau vote. Si quelqu'un modifie ou supprime un ancien vote, le calcul ne tombe plus juste et tout le monde peut le vérifier."
            value={p.merkleRoot}
          />
          <Button asChild className="mt-3" variant="outline">
            <Link href={`/polls/${p.id}/board`}>
              <ScrollText className="mr-1.5 h-4 w-4" />
              Consulter le cahier de vote
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}
