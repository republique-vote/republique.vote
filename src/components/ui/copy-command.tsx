"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-w-0 items-center justify-between gap-3 bg-zinc-950 px-4 py-3 font-mono text-sm text-zinc-100">
      <div className="relative min-w-0 flex-1">
        <input
          className="w-full overflow-hidden text-ellipsis bg-transparent focus:outline-none"
          onBlur={() => setFocused(false)}
          onFocus={() => setFocused(true)}
          readOnly
          type="text"
          value={command}
        />
        {!focused && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-zinc-950 to-transparent" />
        )}
      </div>
      <button
        className="shrink-0 text-zinc-400 transition-colors hover:text-zinc-100"
        onClick={handleCopy}
        type="button"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
