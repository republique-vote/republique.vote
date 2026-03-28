"use client";

import {
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  FileJson,
  FileSpreadsheet,
  HelpCircle,
  Loader2,
  Radio,
  Rss,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { VerifyVoteDialog } from "@/components/polls/verify-vote-dialog";
import { VoteDetailsCards } from "@/components/polls/vote-details-cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyableHash } from "@/components/ui/copyable-hash";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface BoardClientProps {
  initialVotes: Vote[];
  options: { id: string; label: string }[];
  poll: {
    id: string;
    title: string;
    status: string;
    merkleRoot: string | null;
  };
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

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

export function BoardClient({
  poll,
  options,
  initialVotes,
  totalVotes: initialTotalVotes,
  serverChainValid,
}: BoardClientProps) {
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [voteStatus, setVoteStatus] = useState<
    Map<number, "valid" | "invalid">
  >(new Map());

  // Vote verification
  const [verifyVoteOpen, setVerifyVoteOpen] = useState(false);

  // Vote detail dialog
  const [detailVote, setDetailVote] = useState<Vote | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedVotes, setDisplayedVotes] = useState<Vote[]>(initialVotes);
  const [loadingPage, setLoadingPage] = useState(false);
  const [totalVotes, setTotalVotes] = useState(initialTotalVotes);

  // SSE live feed
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
        // Only prepend to displayed votes if on page 1
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
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-bold text-3xl tracking-tight">
          Cahier de vote
        </h1>
        <p className="mb-4 text-lg text-muted-foreground">{poll.title}</p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant={serverChainValid ? "success" : "destructive"}>
            {serverChainValid ? (
              <>
                <CheckCircle className="mr-1 h-3 w-3" /> Chaîne intacte
                (serveur)
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
          <Button onClick={() => setVerifyVoteOpen(true)} variant="outline">
            <Search className="mr-1.5 h-4 w-4" />
            Retrouver mon vote
          </Button>
          <Button
            disabled={
              verifyState === "fetching" ||
              verifyState === "verifying" ||
              totalVotes === 0
            }
            onClick={handleVerify}
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
              <a href={`/api/poll/${poll.id}/board/export?format=json`}>
                <FileJson className="mr-1 h-3.5 w-3.5" />
                JSON
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href={`/api/poll/${poll.id}/board/export?format=csv`}>
                <FileSpreadsheet className="mr-1 h-3.5 w-3.5" />
                CSV
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a
                href={`/api/poll/${poll.id}/board/stream`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Radio className="mr-1 h-3.5 w-3.5" />
                SSE
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a
                href={`/api/poll/${poll.id}/board/feed`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Rss className="mr-1 h-3.5 w-3.5 text-orange-500" />
                RSS
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
        {poll.merkleRoot && (
          <CopyableHash
            label="Empreinte du cahier (Merkle root)"
            tooltip="Le résultat final de la chaîne de hash. Si un seul vote est modifié, cette empreinte change complètement."
            value={poll.merkleRoot}
          />
        )}
      </div>

      {/* Vote table */}
      {totalVotes === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Aucun vote enregistré pour le moment.
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div
            className={`hidden overflow-x-auto border border-border md:block ${loadingPage ? "pointer-events-none opacity-50" : ""}`}
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
                            Code unique calculé à partir du vote et du vote
                            précédent.
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
                            L&apos;empreinte du vote d&apos;avant. C&apos;est ce
                            qui crée la chaîne.
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
                            Code anonyme qui prouve le droit de vote sans
                            révéler l&apos;identité.
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
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {displayedVotes.map((vote) => {
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
                                Premier vote du cahier. Son empreinte est
                                calculée à partir de son contenu uniquement,
                                sans empreinte précédente. C&apos;est le point
                                de départ de la chaîne.
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
                      <td className="px-3 py-2.5">
                        <Button
                          onClick={() => setDetailVote(vote)}
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

          {/* Mobile list */}
          <div
            className={`divide-y divide-border border border-border md:hidden ${loadingPage ? "pointer-events-none opacity-50" : ""}`}
          >
            {displayedVotes.map((vote) => {
              const status = voteStatus.get(vote.sequence);
              return (
                <div
                  className={`flex items-center justify-between px-3 py-3 ${status === "invalid" ? "bg-destructive/5" : ""}`}
                  key={vote.sequence}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="font-bold text-sm tabular-nums">
                      #{vote.sequence}
                    </span>
                    <Badge className="shrink-0 text-xs" variant="outline">
                      {optionMap.get(vote.optionId) || vote.optionId}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {formatDateShort(vote.createdAt)}
                    </span>
                    {status === "valid" && (
                      <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-600" />
                    )}
                    {status === "invalid" && (
                      <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                    )}
                  </div>
                  <Button
                    onClick={() => setDetailVote(vote)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Vote detail dialog (mobile) */}
          <Dialog
            onOpenChange={(open) => !open && setDetailVote(null)}
            open={!!detailVote}
          >
            <DialogContent className="sm:max-w-xl">
              {detailVote && (
                <>
                  <DialogHeader>
                    <DialogTitle>
                      Vote #{detailVote.sequence} —{" "}
                      {optionMap.get(detailVote.optionId) ||
                        detailVote.optionId}
                    </DialogTitle>
                  </DialogHeader>
                  <VoteDetailsCards
                    blindSignature={detailVote.blindSignature}
                    blindToken={detailVote.blindToken}
                    createdAt={detailVote.createdAt}
                    hash={detailVote.hash}
                    optionLabel={
                      optionMap.get(detailVote.optionId) || detailVote.optionId
                    }
                    previousHash={detailVote.previousHash}
                    sequence={detailVote.sequence}
                  />
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Pagination */}
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
