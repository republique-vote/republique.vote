"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Download,
  Info,
  Search,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function VoteSuccessAlert({
  onShowProof,
  onVerify,
}: {
  onShowProof: () => void;
  onVerify: () => void;
}) {
  return (
    <div className="mb-4 space-y-2">
      <Alert variant="success">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Vote enregistré</AlertTitle>
        <AlertDescription>De manière anonyme et vérifiable.</AlertDescription>
      </Alert>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={onShowProof} size="sm" variant="outline">
          <Download />
          Ma preuve
        </Button>
        <Button onClick={onVerify} size="sm" variant="outline">
          <Search />
          Vérifier
        </Button>
      </div>
      <OtherPollsLink />
    </div>
  );
}

// Secondary action, kept as a link so the vote actions stand out
function OtherPollsLink() {
  return (
    <Link
      className="inline-flex items-center gap-1.5 text-muted-foreground text-xs hover:text-foreground"
      href="/polls"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Voir les autres votes
    </Link>
  );
}

export function VoteErrorAlert({ message }: { message: string }) {
  return (
    <Alert className="mb-4" variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertTitle>Erreur</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function AlreadyVotedAlert({ onVerify }: { onVerify: () => void }) {
  return (
    <div className="mb-4 space-y-2">
      <Alert variant="info">
        <Info className="h-4 w-4" />
        <AlertTitle>Vous avez déjà voté</AlertTitle>
      </Alert>
      <Button className="w-full" onClick={onVerify} size="sm" variant="outline">
        <Search />
        Vérifier mon vote
      </Button>
      <OtherPollsLink />
    </div>
  );
}

export function LoginRequiredAlert({ continueUrl }: { continueUrl: string }) {
  return (
    <div className="mb-4 space-y-2">
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Connexion requise</AlertTitle>
        <AlertDescription>
          Vous devez vous identifier avec votre carte d'identité pour voter.
        </AlertDescription>
      </Alert>
      <Button asChild className="w-full">
        <Link href={`/login?continue=${encodeURIComponent(continueUrl)}`}>
          Se connecter
        </Link>
      </Button>
    </div>
  );
}
