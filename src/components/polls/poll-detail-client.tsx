"use client";

import type { PollOption, ResultsResponse } from "@republique/core";
import { formatDate } from "@republique/core";
import { ScrollText } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { VoteDialog } from "@/components/polls/poll-detail/vote-dialog";
import { VoteOptions } from "@/components/polls/poll-detail/vote-options";
import {
  AlreadyVotedAlert,
  LoginRequiredAlert,
  VoteErrorAlert,
  VoteSuccessAlert,
} from "@/components/polls/poll-detail/vote-status-alerts";
import { VerifyVoteDialog } from "@/components/polls/verify-vote-dialog";
import { Button } from "@/components/ui/button";
import { CopyableHash } from "@/components/ui/copyable-hash";
import { useSession } from "@/services/auth/client";
import {
  blindToken,
  finalizeSignature,
  generateToken,
  toBase64,
} from "@/services/blind-signature/client";

type VoteState = "idle" | "voting" | "success" | "error";
type VoteStep = "generate" | "sign" | "submit" | "done";

function formatCountdown(diff: number) {
  if (diff <= 0) {
    return null;
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days}j`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}min`);
  }
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

function useCountdown(endDateStr: string | null) {
  const [remaining, setRemaining] = useState<string | null>(null);
  useEffect(() => {
    if (!endDateStr) {
      return;
    }
    const update = () => {
      setRemaining(
        formatCountdown(new Date(endDateStr).getTime() - Date.now())
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endDateStr]);
  return remaining;
}

function useRealtimeResults(
  pollId: string,
  initialResults: ResultsResponse | null
) {
  const [data, setData] = useState<ResultsResponse | null>(initialResults);
  useEffect(() => {
    const eventSource = new EventSource(`/api/poll/${pollId}/results/stream`);
    eventSource.onmessage = (event) => setData(JSON.parse(event.data));
    eventSource.onerror = () => eventSource.close();
    return () => eventSource.close();
  }, [pollId]);
  return data;
}

export interface PollDetailProps {
  initialHasVoted: boolean;
  initialMerkleRoot: string | null;
  initialResults: ResultsResponse | null;
  initialVoteCount: number;
  options: PollOption[];
  poll: {
    id: string;
    title: string;
    description: string;
    type: string;
    status: string;
    startDate: string;
    endDate: string;
  };
}

export function PollDetailClient({
  poll,
  options,
  initialResults,
  initialHasVoted,
  initialVoteCount,
  initialMerkleRoot,
}: PollDetailProps) {
  const { data: session } = useSession();
  const sseResults = useRealtimeResults(poll.id, initialResults);
  const countdown = useCountdown(poll.endDate);

  const [selectedOption, setSelectedOption] = useState<string>("");
  const [voteState, setVoteState] = useState<VoteState>("idle");
  const [voteStep, setVoteStep] = useState<VoteStep>("generate");
  const [errorMessage, setErrorMessage] = useState("");
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [voteToken, setVoteToken] = useState<string>("");
  const [voteProof, setVoteProof] = useState<{
    sequence: number;
    hash: string;
    createdAt: string;
  } | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [merkleRoot, setMerkleRoot] = useState<string | null>(
    initialMerkleRoot
  );

  const isOpen = poll.status === "open";
  const isAuthenticated = !!session;
  const canVote =
    isOpen && isAuthenticated && !hasVoted && voteState !== "success";

  const results = sseResults?.results || [];
  const totalVotes = sseResults?.totalVotes || initialVoteCount;

  useEffect(() => {
    if (totalVotes === 0) {
      return;
    }
    fetch(`/api/poll/${poll.id}/merkle-root`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (data?.merkleRoot) {
          setMerkleRoot(data.merkleRoot);
        }
      })
      .catch(() => undefined);
  }, [totalVotes, poll.id]);

  const handleVote = useCallback(async () => {
    if (!selectedOption) {
      return;
    }
    setVoteState("voting");
    setVoteStep("generate");
    setErrorMessage("");

    try {
      const pkRes = await fetch(`/api/poll/${poll.id}/public-key`);
      const { data: pkData } = await pkRes.json();
      const token = generateToken();
      const { blindedMsg, inv } = await blindToken(token, pkData.publicKey);

      setVoteStep("sign");
      const signRes = await fetch(`/api/poll/${poll.id}/blind-sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blindedToken: toBase64(blindedMsg) }),
      });
      if (!signRes.ok) {
        const err = await signRes.json();
        throw new Error(err.message || "blind_sign_failed");
      }

      const { data: signData } = await signRes.json();
      const blindSig = Uint8Array.from(atob(signData.blindSignature), (c) =>
        c.charCodeAt(0)
      );
      const signature = await finalizeSignature(
        pkData.publicKey,
        token,
        blindSig,
        inv
      );

      setVoteStep("submit");
      const voteRes = await fetch(`/api/poll/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({
          optionId: selectedOption,
          token: toBase64(token),
          signature: toBase64(signature),
        }),
      });
      if (!voteRes.ok) {
        const err = await voteRes.json();
        throw new Error(err.message || "vote_failed");
      }

      setVoteStep("done");
      const tokenBase64 = toBase64(token);
      const { data: voteData } = await voteRes.json();
      setVoteToken(tokenBase64);
      if (voteData.sequence && voteData.hash && voteData.createdAt) {
        setVoteProof({
          sequence: voteData.sequence,
          hash: voteData.hash,
          createdAt: voteData.createdAt,
        });
      }

      await new Promise((r) => setTimeout(r, 800));
      setVoteState("success");
      setHasVoted(true);
    } catch (err) {
      setVoteState("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Une erreur est survenue"
      );
    }
  }, [selectedOption, poll.id]);

  return (
    <>
      <p className="mb-6 text-muted-foreground text-sm">
        {totalVotes} vote{totalVotes === 1 ? "" : "s"} enregistré
        {totalVotes === 1 ? "" : "s"}
        {" · "}
        {isOpen ? (
          <>
            Jusqu&apos;au {formatDate(poll.endDate)} ·{" "}
            {countdown || "Vote terminé"}
          </>
        ) : (
          <>
            Du {formatDate(poll.startDate)} au {formatDate(poll.endDate)}
          </>
        )}
      </p>

      {voteState === "success" && (
        <VoteSuccessAlert
          onShowProof={() => setConfirmOpen(true)}
          onVerify={() => setVerifyOpen(true)}
        />
      )}

      {voteState === "error" && <VoteErrorAlert message={errorMessage} />}

      {isAuthenticated && hasVoted && voteState !== "success" && (
        <AlreadyVotedAlert onVerify={() => setVerifyOpen(true)} />
      )}

      <VerifyVoteDialog
        initialToken={voteToken}
        onOpenChange={setVerifyOpen}
        open={verifyOpen}
        pollId={poll.id}
      />

      {isOpen && !isAuthenticated && (
        <LoginRequiredAlert continueUrl={`/polls/${poll.id}`} />
      )}

      <VoteOptions
        canVote={canVote}
        onSelect={setSelectedOption}
        onVote={() => setConfirmOpen(true)}
        options={options}
        results={results}
        selectedOption={selectedOption}
        voting={voteState === "voting"}
      />

      <VoteDialog
        errorMessage={errorMessage}
        onClose={() => setConfirmOpen(false)}
        onCloseError={() => {
          setConfirmOpen(false);
          setVoteState("idle");
        }}
        onOpenChange={(open) => {
          if (voteState !== "voting") {
            setConfirmOpen(open);
          }
        }}
        onVote={handleVote}
        open={confirmOpen}
        pollId={poll.id}
        selectedOptionLabel={
          options.find((o) => o.id === selectedOption)?.label
        }
        voteProof={voteProof}
        voteState={voteState}
        voteStep={voteStep}
        voteToken={voteToken}
      />

      {merkleRoot && (
        <div className="mt-8 border-t pt-4">
          <CopyableHash
            label="Empreinte du cahier de vote"
            tooltip="Ce code est calculé mathématiquement à partir de tous les votes. Il évolue à chaque nouveau vote. Si quelqu'un modifie ou supprime un ancien vote, le calcul ne tombe plus juste et tout le monde peut le vérifier."
            value={merkleRoot}
          />
          <Button asChild className="mt-3" variant="outline">
            <Link href={`/polls/${poll.id}/board`}>
              <ScrollText className="mr-1.5 h-4 w-4" />
              Consulter le cahier de vote
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}
