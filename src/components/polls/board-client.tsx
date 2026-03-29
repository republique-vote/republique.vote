"use client";

import type { Vote, VoteHashInput } from "@republique/core";
import { buildVoteHashPreimage } from "@republique/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BoardHeader } from "@/components/polls/board/board-header";
import { VoteDetailDialog } from "@/components/polls/board/vote-detail-dialog";
import { VoteMobileList } from "@/components/polls/board/vote-mobile-list";
import { VoteTable } from "@/components/polls/board/vote-table";
import { VerifyVoteDialog } from "@/components/polls/verify-vote-dialog";
import { Button } from "@/components/ui/button";

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
  vote: VoteHashInput
): Promise<string> {
  const preimage = buildVoteHashPreimage(previousHash, vote);
  const encoded = new TextEncoder().encode(preimage);
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
        setDisplayedVotes(data.votes.items);
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

    const statusMap = new Map<number, "valid" | "invalid">();
    let lastHash: string | null = null;
    let verified = 0;
    let page = 1;
    let pageCount = 1;

    setVerifyState("verifying");

    try {
      do {
        const res = await fetch(
          `/api/poll/${poll.id}/board?page=${page}&limit=${PAGE_SIZE}&order=asc`
        );
        const { data } = await res.json();
        pageCount = data.votes.pageCount ?? 1;

        for (const vote of data.votes.items as Vote[]) {
          if (vote.previousHash !== lastHash) {
            statusMap.set(vote.sequence, "invalid");
            setVoteStatus(new Map(statusMap));
            setVerifiedCount(verified + 1);
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
            setVerifiedCount(verified + 1);
            setVerifyState("invalid");
            return;
          }

          statusMap.set(vote.sequence, "valid");
          lastHash = vote.hash;
          verified++;
        }

        setVoteStatus(new Map(statusMap));
        setVerifiedCount(verified);
        await new Promise((r) => setTimeout(r, 0));
        page++;
      } while (page <= pageCount);
    } catch {
      setVerifyState("invalid");
      return;
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
