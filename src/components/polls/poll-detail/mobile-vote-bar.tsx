"use client";

import { type RefObject, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// On phones the vote block sits at the bottom of the page: this bar keeps it
// one tap away, and hides itself once the block is on screen
export function MobileVoteBar({
  canVote,
  label,
  targetRef,
}: {
  canVote: boolean;
  label: string;
  targetRef: RefObject<HTMLElement | null>;
}) {
  const [targetVisible, setTargetVisible] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) =>
      setTargetVisible(entry.isIntersecting)
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetRef]);

  if (targetVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-border border-t bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">{label}</p>
        <Button
          onClick={() =>
            targetRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
          type="button"
          variant={canVote ? "default" : "outline"}
        >
          {canVote ? "Voter" : "Voir le vote"}
        </Button>
      </div>
    </div>
  );
}
