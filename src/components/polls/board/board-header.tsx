"use client";

import {
  CheckCircle,
  FileJson,
  FileSpreadsheet,
  GitBranch,
  HelpCircle,
  Loader2,
  Radio,
  Rss,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyableHash } from "@/components/ui/copyable-hash";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type VerifyState = "idle" | "fetching" | "verifying" | "valid" | "invalid";

export function BoardHeader({
  pollId,
  pollTitle,
  merkleRoot,
  serverChainValid,
  totalVotes,
  connected,
  verifyState,
  verifiedCount,
  onVerify,
  onSearchVote,
}: {
  pollId: string;
  pollTitle: string;
  merkleRoot: string | null;
  serverChainValid: boolean;
  totalVotes: number;
  connected: boolean;
  verifyState: VerifyState;
  verifiedCount: number;
  onVerify: () => void;
  onSearchVote: () => void;
}) {
  const verifyButtonLabel = () => {
    switch (verifyState) {
      case "fetching":
        return (
          <>
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Chargement des
            votes...
          </>
        );
      case "verifying":
        return (
          <>
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Vérification...
            ({verifiedCount}/{totalVotes})
          </>
        );
      case "valid":
        return (
          <>
            <ShieldCheck className="mr-1.5 h-4 w-4" /> Revérifier la chaîne
          </>
        );
      default:
        return (
          <>
            <ShieldCheck className="mr-1.5 h-4 w-4" /> Vérifier la chaîne
          </>
        );
    }
  };

  return (
    <div className="mb-8">
      <h1 className="mb-2 font-bold text-3xl tracking-tight">Cahier de vote</h1>
      <p className="mb-4 text-lg text-muted-foreground">{pollTitle}</p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant={serverChainValid ? "success" : "destructive"}>
          {serverChainValid ? (
            <>
              <CheckCircle className="mr-1 h-3 w-3" /> Chaîne intacte (serveur)
            </>
          ) : (
            <>
              <XCircle className="mr-1 h-3 w-3" /> Chaîne corrompue (serveur)
            </>
          )}
        </Badge>
        {verifyState === "valid" && (
          <Badge variant="success">
            <ShieldCheck className="mr-1 h-3 w-3" /> Vérifié par votre
            navigateur
          </Badge>
        )}
        {verifyState === "invalid" && (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" /> Erreur détectée par votre
            navigateur
          </Badge>
        )}
        <Badge variant="info">
          {totalVotes} vote{totalVotes === 1 ? "" : "s"}
        </Badge>
        {connected ? (
          <Badge
            className="border-green-600/30 text-green-600"
            variant="outline"
          >
            <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-green-600" />
            En direct
          </Badge>
        ) : (
          <Badge className="text-muted-foreground" variant="outline">
            Déconnecté
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button onClick={onSearchVote} variant="outline">
          <Search className="mr-1.5 h-4 w-4" />
          Retrouver mon vote
        </Button>
        <Button
          disabled={
            verifyState === "fetching" ||
            verifyState === "verifying" ||
            totalVotes === 0
          }
          onClick={onVerify}
          variant="outline"
        >
          {verifyButtonLabel()}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-4 w-4 cursor-help text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>
              Votre navigateur télécharge tous les votes puis recalcule chaque
              empreinte pour vérifier que personne n&apos;a modifié le cahier.
              Tout se passe sur votre appareil.
            </p>
          </TooltipContent>
        </Tooltip>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <a href={`/api/poll/${pollId}/board/export?format=json`}>
              <FileJson className="mr-1 h-3.5 w-3.5" />
              JSON
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={`/api/poll/${pollId}/board/export?format=csv`}>
              <FileSpreadsheet className="mr-1 h-3.5 w-3.5" />
              CSV
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a
              href={`/api/poll/${pollId}/board/stream`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Radio className="mr-1 h-3.5 w-3.5" />
              SSE
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a
              href={`/api/poll/${pollId}/board/feed`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Rss className="mr-1 h-3.5 w-3.5 text-orange-500" />
              RSS
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a
              href={`https://github.com/republique-vote/merkle-proofs/commits/main/polls/${pollId}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <GitBranch className="mr-1 h-3.5 w-3.5" />
              GitHub
            </a>
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {verifyState === "verifying" && (
        <div className="mb-6 h-1.5 w-full overflow-hidden bg-muted">
          <div
            className="h-full bg-primary transition-all duration-150"
            style={{ width: `${(verifiedCount / totalVotes) * 100}%` }}
          />
        </div>
      )}

      {/* Merkle root */}
      {merkleRoot && (
        <CopyableHash
          label="Empreinte du cahier (Merkle root)"
          tooltip="Le résultat final de la chaîne de hash. Si un seul vote est modifié, cette empreinte change complètement."
          value={merkleRoot}
        />
      )}
    </div>
  );
}
