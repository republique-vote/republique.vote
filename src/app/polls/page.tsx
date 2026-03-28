import { count, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { PollListClient } from "@/components/polls/poll-list-client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { db } from "@/db";
import { blindSignatureRequest, poll, voteRecord } from "@/db/schema";
import { auth } from "@/services/auth";

export const dynamic = "force-dynamic";

export default async function PollsPage() {
  const rawPolls = await db
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
    .groupBy(poll.id)
    .orderBy(poll.createdAt);
  const polls = rawPolls.map((p) => ({ ...p, voteCount: Number(p.voteCount) }));

  let votedPollIds: string[] = [];
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session) {
      const requests = await db
        .select({ pollId: blindSignatureRequest.pollId })
        .from(blindSignatureRequest)
        .where(eq(blindSignatureRequest.userId, session.user.id));
      votedPollIds = requests.map((r) => r.pollId);
    }
  } catch {
    // Not authenticated
  }

  return (
    <>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Votes</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="font-bold text-3xl tracking-tight">Votes</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Participez aux votes en cours ou consultez les résultats des votes
        terminés.
      </p>
      <PollListClient polls={polls} votedPollIds={votedPollIds} />
    </>
  );
}
