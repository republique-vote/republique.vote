"use client";

import { Button } from "@/components/ui/button";

interface Option {
  id: string;
  label: string;
  position: number;
}

interface ResultData {
  count: number;
  optionId: string;
  percentage: number;
}

export function VoteOptions({
  options,
  results,
  selectedOption,
  canVote,
  voting,
  onSelect,
  onVote,
}: {
  options: Option[];
  results: ResultData[];
  selectedOption: string;
  canVote: boolean;
  voting: boolean;
  onSelect: (optionId: string) => void;
  onVote: () => void;
}) {
  return (
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
          disabled={!selectedOption || voting}
          onClick={onVote}
        >
          Voter
        </Button>
      )}
    </div>
  );
}
