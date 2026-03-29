"use client";

import type { Vote } from "@republique/core";
import { formatDateShort } from "@republique/core";
import { CheckCircle, Eye, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function VoteMobileList({
  votes,
  optionMap,
  voteStatus,
  loading,
  onDetail,
}: {
  votes: Vote[];
  optionMap: Map<string, string>;
  voteStatus: Map<number, "valid" | "invalid">;
  loading: boolean;
  onDetail: (vote: Vote) => void;
}) {
  return (
    <div
      className={`divide-y divide-border border border-border md:hidden ${loading ? "pointer-events-none opacity-50" : ""}`}
    >
      {votes.map((vote) => {
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
              onClick={() => onDetail(vote)}
              size="icon-sm"
              variant="ghost"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
