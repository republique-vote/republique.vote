"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Download,
  Info,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { VerifyVoteDialog } from "@/components/polls/verify-vote-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CopyableHash } from "@/components/ui/copyable-hash";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "@/services/auth/client";
import {
  blindToken,
  finalizeSignature,
  generateToken,
  toBase64,
} from "@/services/blind-signature/client";

interface Option {
  id: string;
  label: string;
  position: number;
}

interface ResultData {
  count: number;
  label: string;
  optionId: string;
  percentage: number;
}

interface ResultsResponse {
  pollId: string;
  results: ResultData[];
  totalVotes: number;
}

type VoteState = "idle" | "voting" | "success" | "error";
type VoteStep = "generate" | "sign" | "submit" | "done";

const VOTE_STEPS: { key: VoteStep; label: string }[] = [
  { key: "generate", label: "Génération du code secret" },
  { key: "sign", label: "Signature aveugle" },
  { key: "submit", label: "Enregistrement du vote" },
  { key: "done", label: "Vote enregistré" },
];

function StepIcon({
  isDone,
  isCurrent,
}: {
  isDone: boolean;
  isCurrent: boolean;
}) {
  if (isDone) {
    return <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />;
  }
  if (isCurrent) {
    return <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />;
  }
  return (
    <div className="h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/30" />
  );
}

function VoteDialogContent({
  voteState,
  voteStep,
  voteToken,
  voteProof,
  errorMessage,
  pollId,
  selectedOptionLabel,
  onClose,
  onCloseError,
  onVote,
}: {
  voteState: VoteState;
  voteStep: VoteStep;
  voteToken: string;
  voteProof: { sequence: number; hash: string; createdAt: string } | null;
  errorMessage: string;
  pollId: string;
  selectedOptionLabel: string | undefined;
  onClose: () => void;
  onCloseError: () => void;
  onVote: () => void;
}) {
  if (voteState === "success") {
    return (
      <>
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Vote enregistré
            </span>
          </DialogTitle>
          <DialogDescription>
            Votre vote a été enregistré de manière anonyme et vérifiable.
            Conservez cette preuve : elle vous permet de retrouver votre vote
            dans le registre public et de vérifier qu&apos;il n&apos;a pas été
            modifié ou supprimé.
          </DialogDescription>
        </DialogHeader>
        {voteToken && (
          <div className="border border-border p-4">
            <CopyableHash
              label="Votre code de vérification"
              tooltip="Conservez ce code pour vérifier votre vote plus tard. Il permet de prouver que votre vote est bien dans le registre public."
              value={voteToken}
            />
            <p className="mt-2 text-muted-foreground text-xs">
              Conservez ce code précieusement. Il est le seul moyen de vérifier
              que votre vote a bien été pris en compte.
            </p>
          </div>
        )}
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Ne publiez pas cette preuve. Toute personne qui la voit peut
            retrouver votre vote dans le registre public et faire le lien avec
            vous.
          </AlertDescription>
        </Alert>
        {voteProof && (
          <div className="overflow-hidden border border-border">
            <Image
              alt={`Preuve de vote #${voteProof.sequence}`}
              className="w-full"
              height={630}
              src={`/api/poll/${pollId}/vote-proof?sequence=${voteProof.sequence}&hash=${encodeURIComponent(voteProof.hash)}&token=${encodeURIComponent(voteToken)}&date=${encodeURIComponent(voteProof.createdAt)}`}
              unoptimized
              width={1200}
            />
          </div>
        )}
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {voteProof && (
            <Button asChild variant="outline">
              <a
                download="preuve-vote.png"
                href={`/api/poll/${pollId}/vote-proof?sequence=${voteProof.sequence}&hash=${encodeURIComponent(voteProof.hash)}&token=${encodeURIComponent(voteToken)}&date=${encodeURIComponent(voteProof.createdAt)}`}
              >
                <Download className="mr-1.5 h-4 w-4" />
                Télécharger la preuve
              </a>
            </Button>
          )}
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </>
    );
  }

  if (voteState === "voting") {
    const currentIndex = VOTE_STEPS.findIndex((s) => s.key === voteStep);
    return (
      <>
        <DialogHeader>
          <DialogTitle>Vote en cours</DialogTitle>
          <DialogDescription>
            Votre vote pour <strong>{selectedOptionLabel}</strong> est en cours
            de traitement.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {VOTE_STEPS.map((step, i) => {
            const isDone =
              i < currentIndex || (i === currentIndex && step.key === "done");
            const isCurrent = i === currentIndex && step.key !== "done";

            let labelClass = "text-muted-foreground/50";
            if (isDone) {
              labelClass = "text-muted-foreground";
            }
            if (isCurrent) {
              labelClass = "font-medium text-foreground";
            }

            return (
              <div className="flex items-center gap-3" key={step.key}>
                <StepIcon isCurrent={isCurrent} isDone={isDone} />
                <span className={`text-sm ${labelClass}`}>{step.label}</span>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  if (voteState === "error") {
    return (
      <>
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Erreur
            </span>
          </DialogTitle>
          <DialogDescription>{errorMessage}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onCloseError} variant="outline">
            Fermer
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Confirmer votre vote</DialogTitle>
        <DialogDescription>
          Vous êtes sur le point de voter <strong>{selectedOptionLabel}</strong>
          .
        </DialogDescription>
      </DialogHeader>
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Assurez-vous d&apos;être seul et à l&apos;abri des regards. Personne
          ne doit voir votre écran pendant que vous votez.
        </AlertDescription>
      </Alert>
      <p className="text-muted-foreground text-sm">
        Cette action est définitive. Votre vote sera enregistré de manière
        anonyme et ne pourra pas être modifié.
      </p>
      <DialogFooter>
        <Button onClick={onClose} variant="outline">
          Annuler
        </Button>
        <Button onClick={onVote}>Confirmer mon vote</Button>
      </DialogFooter>
    </>
  );
}

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
      const diff = new Date(endDateStr).getTime() - Date.now();
      setRemaining(formatCountdown(diff));
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface PollDetailProps {
  initialHasVoted: boolean;
  initialResults: ResultsResponse | null;
  initialVoteCount: number;
  options: Option[];
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

  const isOpen = poll.status === "open";
  const isAuthenticated = !!session;
  const canVote =
    isOpen && isAuthenticated && !hasVoted && voteState !== "success";

  const results = sseResults?.results || [];
  const totalVotes = sseResults?.totalVotes || initialVoteCount;

  const handleVote = useCallback(async () => {
    if (!selectedOption) {
      return;
    }
    setVoteState("voting");
    setVoteStep("generate");
    setErrorMessage("");

    try {
      // Step 1: Generate token & blind it
      const pkRes = await fetch(`/api/poll/${poll.id}/public-key`);
      const { data: pkData } = await pkRes.json();
      const token = generateToken();
      const { blindedMsg, inv } = await blindToken(token, pkData.publicKey);

      // Step 2: Get blind signature
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

      // Step 3: Submit vote
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

      // Step 4: Done
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

      // Brief pause to show "done" step before transitioning
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
        <div className="mb-6">
          <Alert className="mb-3" variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Vote enregistré</AlertTitle>
            <AlertDescription>
              Votre vote a été enregistré de manière anonyme et vérifiable.
            </AlertDescription>
          </Alert>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setConfirmOpen(true)} variant="outline">
              <Download className="mr-1.5 h-4 w-4" />
              Ma preuve de vote
            </Button>
            <Button onClick={() => setVerifyOpen(true)} variant="outline">
              <Search className="mr-1.5 h-4 w-4" />
              Vérifier mon vote
            </Button>
            <Button asChild variant="outline">
              <Link href="/polls">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Voir les autres votes
              </Link>
            </Button>
          </div>
        </div>
      )}

      {voteState === "error" && (
        <Alert className="mb-6" variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {isAuthenticated && hasVoted && voteState !== "success" && (
        <div className="mb-6">
          <Alert className="mb-3" variant="info">
            <Info className="h-4 w-4" />
            <AlertTitle>Vous avez déjà voté</AlertTitle>
            <AlertDescription>
              Vous avez déjà participé à ce vote.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/polls">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Voir les autres votes
              </Link>
            </Button>
            <Button onClick={() => setVerifyOpen(true)} variant="outline">
              <Search className="mr-1.5 h-4 w-4" />
              Vérifier mon vote
            </Button>
          </div>
        </div>
      )}

      <VerifyVoteDialog
        initialToken={voteToken}
        onOpenChange={setVerifyOpen}
        open={verifyOpen}
        pollId={poll.id}
      />

      {isOpen && !isAuthenticated && (
        <div className="mb-6">
          <Alert className="mb-3" variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Connexion requise</AlertTitle>
            <AlertDescription>
              Vous devez vous identifier via FranceConnect pour voter.
            </AlertDescription>
          </Alert>
          <Button asChild>
            <Link href="/login">Se connecter</Link>
          </Button>
        </div>
      )}

      <div className="mb-6">
        {canVote && (
          <p className="mb-3 text-muted-foreground text-sm">
            Sélectionnez une option pour voter
          </p>
        )}
        <div className="flex flex-col gap-3">
          {options.map((opt) => {
            const result = results.find((r) => r.optionId === opt.id);
            const percentage = result?.percentage || 0;
            const count = result?.count || 0;
            const isSelected = selectedOption === opt.id;

            return (
              <button
                className={`relative overflow-hidden rounded-lg border p-4 text-left transition-colors ${
                  isSelected ? "border-2 border-primary" : "border-border"
                } ${canVote ? "cursor-pointer hover:border-primary/50" : "cursor-default"}`}
                disabled={!canVote}
                key={opt.id}
                onClick={() => canVote && setSelectedOption(opt.id)}
                type="button"
              >
                <div
                  className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                    isSelected ? "bg-primary/10" : "bg-muted"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {canVote && (
                      <div
                        className={`h-5 w-5 shrink-0 rounded-full border-2 transition-colors ${
                          isSelected
                            ? "border-[6px] border-primary"
                            : "border-muted-foreground"
                        }`}
                      />
                    )}
                    <span className="font-semibold">{opt.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xl">{percentage}%</span>
                    <span className="text-muted-foreground text-sm">
                      ({count} vote{count === 1 ? "" : "s"})
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {canVote && (
          <Button
            className="mt-3"
            disabled={!selectedOption || voteState === "voting"}
            onClick={() => setConfirmOpen(true)}
          >
            Voter
          </Button>
        )}
      </div>

      {/* Vote dialog (confirmation → stepper → success) */}
      <Dialog
        onOpenChange={(open) => {
          if (voteState !== "voting") {
            setConfirmOpen(open);
          }
        }}
        open={confirmOpen}
      >
        <DialogContent className="sm:max-w-xl">
          <VoteDialogContent
            errorMessage={errorMessage}
            onClose={() => setConfirmOpen(false)}
            onCloseError={() => {
              setConfirmOpen(false);
              setVoteState("idle");
            }}
            onVote={handleVote}
            pollId={poll.id}
            selectedOptionLabel={
              options.find((o) => o.id === selectedOption)?.label
            }
            voteProof={voteProof}
            voteState={voteState}
            voteStep={voteStep}
            voteToken={voteToken}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
