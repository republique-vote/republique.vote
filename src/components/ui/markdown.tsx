"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";

const COLLAPSED_HEIGHT = 120; // ~5 lines

export function Markdown({
  children,
  collapsible = false,
}: {
  children: string;
  collapsible?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (collapsible && contentRef.current) {
      setNeedsCollapse(contentRef.current.scrollHeight > COLLAPSED_HEIGHT);
    }
  }, [collapsible]);

  if (!(collapsible && needsCollapse)) {
    return (
      <div ref={contentRef}>
        <Streamdown>{children}</Streamdown>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`relative overflow-hidden transition-all ${expanded ? "" : "max-h-[120px]"}`}
      >
        <Streamdown>{children}</Streamdown>
        {!expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-background to-transparent" />
        )}
      </div>
      <button
        className="mt-2 inline-flex items-center gap-1 text-primary text-sm hover:underline"
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        {expanded ? (
          <>
            Voir moins <ChevronUp className="h-3.5 w-3.5" />
          </>
        ) : (
          <>
            Lire la suite <ChevronDown className="h-3.5 w-3.5" />
          </>
        )}
      </button>
    </div>
  );
}
