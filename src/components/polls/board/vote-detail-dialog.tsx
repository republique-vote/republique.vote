"use client";

import { ExternalLink } from "lucide-react";
import { VoteDetailsCards } from "@/components/polls/vote-details-cards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Vote {
  blindSignature: string;
  blindToken: string;
  createdAt: string;
  hash: string;
  optionId: string;
  previousHash: string | null;
  sequence: number;
}

export function VoteDetailDialog({
  vote,
  optionMap,
  rekorMap,
  onClose,
}: {
  vote: Vote | null;
  optionMap: Map<string, string>;
  rekorMap: Record<number, number>;
  onClose: () => void;
}) {
  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={!!vote}>
      <DialogContent className="sm:max-w-xl">
        {vote && (
          <>
            <DialogHeader>
              <DialogTitle>
                Vote #{vote.sequence} —{" "}
                {optionMap.get(vote.optionId) || vote.optionId}
              </DialogTitle>
            </DialogHeader>
            <VoteDetailsCards
              blindSignature={vote.blindSignature}
              blindToken={vote.blindToken}
              createdAt={vote.createdAt}
              hash={vote.hash}
              optionLabel={optionMap.get(vote.optionId) || vote.optionId}
              previousHash={vote.previousHash}
              sequence={vote.sequence}
            />
            {rekorMap[vote.sequence] !== undefined && (
              <a
                className="inline-flex items-center gap-1.5 border border-border px-4 py-2.5 text-primary text-sm hover:bg-accent/30"
                href={`https://search.sigstore.dev/?logIndex=${rekorMap[vote.sequence]}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Voir le tampon du notaire (Sigstore)
              </a>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
