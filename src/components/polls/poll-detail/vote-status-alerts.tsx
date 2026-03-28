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
    <div className="mb-6">
      <Alert className="mb-3" variant="success">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Vote enregistré</AlertTitle>
        <AlertDescription>
          Votre vote a été enregistré de manière anonyme et vérifiable.
        </AlertDescription>
      </Alert>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onShowProof} variant="outline">
          <Download className="mr-1.5 h-4 w-4" />
          Ma preuve de vote
        </Button>
        <Button onClick={onVerify} variant="outline">
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
  );
}

export function VoteErrorAlert({ message }: { message: string }) {
  return (
    <Alert className="mb-6" variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertTitle>Erreur</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function AlreadyVotedAlert({ onVerify }: { onVerify: () => void }) {
  return (
    <div className="mb-6">
      <Alert className="mb-3" variant="info">
        <Info className="h-4 w-4" />
        <AlertTitle>Vous avez déjà voté</AlertTitle>
        <AlertDescription>Vous avez déjà participé à ce vote.</AlertDescription>
      </Alert>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href="/polls">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Voir les autres votes
          </Link>
        </Button>
        <Button onClick={onVerify} variant="outline">
          <Search className="mr-1.5 h-4 w-4" />
          Vérifier mon vote
        </Button>
      </div>
    </div>
  );
}

export function LoginRequiredAlert({ continueUrl }: { continueUrl: string }) {
  return (
    <div className="mb-6">
      <Alert className="mb-3" variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Connexion requise</AlertTitle>
        <AlertDescription>
          Vous devez vous identifier via FranceConnect pour voter.
        </AlertDescription>
      </Alert>
      <Button asChild>
        <Link href={`/login?continue=${encodeURIComponent(continueUrl)}`}>
          Se connecter
        </Link>
      </Button>
    </div>
  );
}
