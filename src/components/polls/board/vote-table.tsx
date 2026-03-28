"use client";

import {
  Check,
  CheckCircle,
  Copy,
  ExternalLink,
  Eye,
  HelpCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Vote {
  blindSignature: string;
  blindToken: string;
  createdAt: string;
  hash: string;
  optionId: string;
  previousHash: string | null;
  sequence: number;
}

function VerificationStatusIcon({ status }: { status: string | undefined }) {
  if (status === "valid") {
    return <CheckCircle className="mx-auto h-4 w-4 text-green-600" />;
  }
  if (status === "invalid") {
    return <XCircle className="mx-auto h-4 w-4 text-destructive" />;
  }
  return <ShieldCheck className="mx-auto h-4 w-4 text-muted-foreground/30" />;
}

function HashCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const truncated = `${value.slice(0, 12)}…`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      className="inline-flex cursor-pointer items-center gap-1 font-mono text-muted-foreground text-xs transition-colors hover:text-foreground"
      onClick={handleCopy}
      title={value}
      type="button"
    >
      <span>{truncated}</span>
      {copied ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VoteTable({
  votes,
  optionMap,
  voteStatus,
  rekorMap,
  loading,
  onDetail,
}: {
  votes: Vote[];
  optionMap: Map<string, string>;
  voteStatus: Map<number, "valid" | "invalid">;
  rekorMap: Record<number, number>;
  loading: boolean;
  onDetail: (vote: Vote) => void;
}) {
  return (
    <div
      className={`hidden overflow-x-auto border border-border md:block ${loading ? "pointer-events-none opacity-50" : ""}`}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-border border-b bg-muted/50">
            <th className="w-10 px-3 py-2.5 text-left font-medium text-muted-foreground">
              #
            </th>
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
              Choix
            </th>
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
              <span className="flex items-center gap-1">
                Empreinte
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Code unique calculé à partir du vote et du vote précédent.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </span>
            </th>
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
              <span className="flex items-center gap-1">
                Empreinte préc.
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      L&apos;empreinte du vote d&apos;avant. C&apos;est ce qui
                      crée la chaîne.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </span>
            </th>
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
              <span className="flex items-center gap-1">
                Jeton
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Code anonyme qui prouve le droit de vote sans révéler
                      l&apos;identité.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </span>
            </th>
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
              Date
            </th>
            <th className="w-10 px-3 py-2.5 text-center font-medium text-muted-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <ShieldCheck className="mx-auto h-3.5 w-3.5 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Résultat de la vérification par votre navigateur.</p>
                </TooltipContent>
              </Tooltip>
            </th>
            <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-xs">Rekor</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Tampon du « notaire numérique » (Sigstore). Prouve que
                    l&apos;empreinte existait à cette date, sur un système
                    qu&apos;on ne contrôle pas.
                  </p>
                </TooltipContent>
              </Tooltip>
            </th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {votes.map((vote) => {
            const status = voteStatus.get(vote.sequence);
            return (
              <tr
                className={`border-border border-b transition-colors last:border-b-0 hover:bg-muted/30 ${
                  status === "invalid" ? "bg-destructive/5" : ""
                }`}
                key={vote.sequence}
              >
                <td className="px-3 py-2.5 font-bold tabular-nums">
                  {vote.sequence}
                </td>
                <td className="px-3 py-2.5">
                  <Badge className="text-xs" variant="outline">
                    {optionMap.get(vote.optionId) || vote.optionId}
                  </Badge>
                </td>
                <td className="px-3 py-2.5">
                  <HashCell value={vote.hash} />
                </td>
                <td className="px-3 py-2.5">
                  {vote.previousHash ? (
                    <HashCell value={vote.previousHash} />
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help border-muted-foreground border-b border-dotted text-muted-foreground text-xs italic">
                          genèse
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Premier vote du cahier. Son empreinte est calculée à
                          partir de son contenu uniquement, sans empreinte
                          précédente. C&apos;est le point de départ de la
                          chaîne.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <HashCell value={vote.blindToken} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground text-xs">
                  {formatDateShort(vote.createdAt)}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <VerificationStatusIcon status={status} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  {rekorMap[vote.sequence] === undefined ? (
                    <span className="text-muted-foreground/30 text-xs">—</span>
                  ) : (
                    <a
                      className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
                      href={`https://search.sigstore.dev/?logIndex=${rekorMap[vote.sequence]}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <Button
                    onClick={() => onDetail(vote)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
