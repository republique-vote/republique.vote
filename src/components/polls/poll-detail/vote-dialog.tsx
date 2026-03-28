"use client";

import {
  AlertTriangle,
  CheckCircle,
  Download,
  Loader2,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

export function VoteDialog({
  open,
  voteState,
  voteStep,
  voteToken,
  voteProof,
  errorMessage,
  pollId,
  selectedOptionLabel,
  onOpenChange,
  onClose,
  onCloseError,
  onVote,
}: {
  open: boolean;
  voteState: VoteState;
  voteStep: VoteStep;
  voteToken: string;
  voteProof: { sequence: number; hash: string; createdAt: string } | null;
  errorMessage: string;
  pollId: string;
  selectedOptionLabel: string | undefined;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onCloseError: () => void;
  onVote: () => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <VoteDialogContent
          errorMessage={errorMessage}
          onClose={onClose}
          onCloseError={onCloseError}
          onVote={onVote}
          pollId={pollId}
          selectedOptionLabel={selectedOptionLabel}
          voteProof={voteProof}
          voteState={voteState}
          voteStep={voteStep}
          voteToken={voteToken}
        />
      </DialogContent>
    </Dialog>
  );
}
