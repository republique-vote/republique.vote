"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BoardHeader } from "@/components/polls/board/board-header";
import { VoteDetailDialog } from "@/components/polls/board/vote-detail-dialog";
import { VoteMobileList } from "@/components/polls/board/vote-mobile-list";
import { VoteTable } from "@/components/polls/board/vote-table";
import { VerifyVoteDialog } from "@/components/polls/verify-vote-dialog";
import { Button } from "@/components/ui/button";

interface Vote {
  blindSignature: string;
  blindToken: string;
  createdAt: string;
  hash: string;
  optionId: string;
  previousHash: string | null;
  sequence: number;
}

interface BoardClientProps {
  initialVotes: Vote[];
  options: { id: string; label: string }[];
  poll: {
    id: string;
    title: string;
    status: string;
    merkleRoot: string | null;
  };
  rekorMap: Record<number, number>;
  serverChainValid: boolean;
  totalVotes: number;
}

type VerifyState = "idle" | "fetching" | "verifying" | "valid" | "invalid";

async function computeHashBrowser(
  previousHash: string | null,
  vote: {
    pollId: string;
    optionId: string;
    blindToken: string;
    blindSignature: string;
    createdAt: string;
    sequence: number;
  }
): Promise<string> {
  const data = [
    previousHash || "",
    vote.pollId,
    vote.optionId,
    vote.blindToken,
    vote.blindSignature,
    vote.createdAt,
    vote.sequence.toString(),
  ].join("|");

  const encoded = new TextEncoder().encode(data);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const PAGE_SIZE = 50;

export function BoardClient({
  poll,
  options,
  initialVotes,
  totalVotes: initialTotalVotes,
  serverChainValid,
  rekorMap,
}: BoardClientProps) {
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [voteStatus, setVoteStatus] = useState<
    Map<number, "valid" | "invalid">
  >(new Map());

  const [verifyVoteOpen, setVerifyVoteOpen] = useState(false);
  const [detailVote, setDetailVote] = useState<Vote | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [displayedVotes, setDisplayedVotes] = useState<Vote[]>(initialVotes);
  const [loadingPage, setLoadingPage] = useState(false);
  const [totalVotes, setTotalVotes] = useState(initialTotalVotes);

  const [connected, setConnected] = useState(false);
  const liveVotesRef = useRef<Vote[]>([]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/poll/${poll.id}/board/stream`);

    eventSource.onopen = () => setConnected(true);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "vote") {
        const vote: Vote = {
          sequence: data.sequence,
          optionId: data.optionId,
          blindToken: data.blindToken,
          blindSignature: data.blindSignature,
          hash: data.hash,
          previousHash: data.previousHash,
          createdAt: data.createdAt,
        };
        liveVotesRef.current = [vote, ...liveVotesRef.current];
        setTotalVotes((c) => c + 1);
        if (currentPage === 1) {
          setDisplayedVotes((prev) => [vote, ...prev].slice(0, PAGE_SIZE));
        }
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, [poll.id, currentPage]);

  const pageCount = Math.ceil(totalVotes / PAGE_SIZE);
  const optionMap = new Map(options.map((o) => [o.id, o.label]));

  const goToPage = useCallback(
    async (page: number) => {
      setLoadingPage(true);
      try {
        const res = await fetch(
          `/api/poll/${poll.id}/board?page=${page}&limit=${PAGE_SIZE}`
        );
        const { data } = await res.json();
        setDisplayedVotes(data.votes);
        setCurrentPage(page);
      } catch {
        // keep current page on error
      }
      setLoadingPage(false);
    },
    [poll.id]
  );

  const handleVerify = useCallback(async () => {
    setVerifyState("fetching");
    setVerifiedCount(0);

    let allVotes: Vote[];
    try {
      const res = await fetch(`/api/poll/${poll.id}/board?all=true`);
      const { data } = await res.json();
      allVotes = data.votes;
    } catch {
      setVerifyState("invalid");
      return;
    }

    setVerifyState("verifying");
    const statusMap = new Map<number, "valid" | "invalid">();

    const BATCH_SIZE = 50;
    for (let i = 0; i < allVotes.length; i += BATCH_SIZE) {
      const batch = allVotes.slice(
        i,
        Math.min(i + BATCH_SIZE, allVotes.length)
      );
      for (const vote of batch) {
        const expectedPreviousHash =
          vote.sequence === 1
            ? null
            : (allVotes[vote.sequence - 2]?.hash ?? null);

        if (vote.previousHash !== expectedPreviousHash) {
          statusMap.set(vote.sequence, "invalid");
          setVoteStatus(new Map(statusMap));
          setVerifiedCount(i + batch.indexOf(vote) + 1);
          setVerifyState("invalid");
          return;
        }

        const computed = await computeHashBrowser(vote.previousHash, {
          pollId: poll.id,
          optionId: vote.optionId,
          blindToken: vote.blindToken,
          blindSignature: vote.blindSignature,
          createdAt: vote.createdAt,
          sequence: vote.sequence,
        });

        if (computed !== vote.hash) {
          statusMap.set(vote.sequence, "invalid");
          setVoteStatus(new Map(statusMap));
          setVerifiedCount(i + batch.indexOf(vote) + 1);
          setVerifyState("invalid");
          return;
        }

        statusMap.set(vote.sequence, "valid");
      }
      setVoteStatus(new Map(statusMap));
      setVerifiedCount(Math.min(i + BATCH_SIZE, allVotes.length));
      await new Promise((r) => setTimeout(r, 0));
    }

    setVerifyState("valid");
  }, [poll.id]);

  return (
    <>
      <BoardHeader
        connected={connected}
        merkleRoot={poll.merkleRoot}
        onSearchVote={() => setVerifyVoteOpen(true)}
        onVerify={handleVerify}
        pollId={poll.id}
        pollTitle={poll.title}
        serverChainValid={serverChainValid}
        totalVotes={totalVotes}
        verifiedCount={verifiedCount}
        verifyState={verifyState}
      />

      {totalVotes === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Aucun vote enregistré pour le moment.
        </p>
      ) : (
        <>
          <VoteTable
            loading={loadingPage}
            onDetail={setDetailVote}
            optionMap={optionMap}
            rekorMap={rekorMap}
            voteStatus={voteStatus}
            votes={displayedVotes}
          />

          <VoteMobileList
            loading={loadingPage}
            onDetail={setDetailVote}
            optionMap={optionMap}
            voteStatus={voteStatus}
            votes={displayedVotes}
          />

          <VoteDetailDialog
            onClose={() => setDetailVote(null)}
            optionMap={optionMap}
            rekorMap={rekorMap}
            vote={detailVote}
          />

          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Page {currentPage} sur {pageCount}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  disabled={currentPage <= 1 || loadingPage}
                  onClick={() => goToPage(currentPage - 1)}
                  size="icon"
                  variant="outline"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  disabled={currentPage >= pageCount || loadingPage}
                  onClick={() => goToPage(currentPage + 1)}
                  size="icon"
                  variant="outline"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <VerifyVoteDialog
        onOpenChange={setVerifyVoteOpen}
        open={verifyVoteOpen}
        pollId={poll.id}
      />
    </>
  );
}
