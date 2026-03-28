"use client";

import { InfoIcon } from "lucide-react";
import { useEffect, useState } from "react";

const INTERVAL = 10 * 60 * 1000; // 10 minutes

function getSecondsUntilReset() {
  const msIntoInterval = Date.now() % INTERVAL;
  return Math.ceil((INTERVAL - msIntoInterval) / 1000);
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function DemoBanner() {
  const [seconds, setSeconds] = useState(getSecondsUntilReset);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(getSecondsUntilReset());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="border-border border-b bg-accent/50">
      <div className="mx-auto flex max-w-[1200px] items-center gap-2 px-6 py-2 text-accent-foreground/80 text-sm">
        <InfoIcon className="h-3.5 w-3.5 shrink-0" />
        <span>
          republique.vote est un projet de recherche{" "}
          <a
            className="underline hover:text-foreground"
            href="https://github.com/republique-vote/republique.vote"
            rel="noopener noreferrer"
            target="_blank"
          >
            open source
          </a>
          . Ce site n&apos;est pas un service officiel du gouvernement français.
          Réinitialisation des votes dans{" "}
          <strong className="font-mono">{formatTime(seconds)}</strong>
        </span>
      </div>
    </div>
  );
}
