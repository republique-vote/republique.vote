"use client";

import type { PollOption, ResultData } from "@republique/core";
import { Button } from "@/components/ui/button";

export function VoteOptions({
  options,
  results,
  selectedOption,
  canVote,
  voting,
  onSelect,
  onVote,
}: {
  options: PollOption[];
  results: ResultData[];
  selectedOption: string;
  canVote: boolean;
  voting: boolean;
  onSelect: (optionId: string) => void;
  onVote: () => void;
}) {
  return (
    <div className="mb-4">
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const result = results.find((r) => r.optionId === opt.id);
          const percentage = result?.percentage || 0;
          const count = result?.count || 0;
          const isSelected = selectedOption === opt.id;

          return (
            <button
              className={`relative overflow-hidden rounded-lg border px-3 py-2.5 text-left transition-colors ${
                isSelected ? "border-2 border-primary" : "border-border"
              } ${canVote ? "cursor-pointer hover:border-primary/50" : "cursor-default"}`}
              disabled={!canVote}
              key={opt.id}
              onClick={() => canVote && onSelect(opt.id)}
              type="button"
            >
              <div
                className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                  isSelected ? "bg-primary/10" : "bg-muted"
                }`}
                style={{ width: `${percentage}%` }}
              />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {canVote && (
                    <div
                      className={`h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
                        isSelected
                          ? "border-[5px] border-primary"
                          : "border-muted-foreground"
                      }`}
                    />
                  )}
                  <span className="font-medium text-sm">{opt.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-semibold">{percentage}%</span>
                  <span className="text-muted-foreground text-xs">
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
          className="mt-3 w-full"
          disabled={!selectedOption || voting}
          onClick={onVote}
        >
          Voter
        </Button>
      )}
    </div>
  );
}
