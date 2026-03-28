"use client";

import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CopyableHash({
  value,
  label,
  tooltip,
}: {
  value: string;
  label?: string;
  tooltip?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {label && (
        <div className="mb-2 flex items-center gap-1.5 text-muted-foreground text-sm">
          {label}
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
      <div className="flex max-w-lg items-stretch gap-0">
        <Input
          className="truncate rounded-r-none font-mono text-muted-foreground text-xs"
          readOnly
          value={value}
        />
        <Button
          className="shrink-0 rounded-l-none border-l-0"
          onClick={handleCopy}
          variant="outline"
        >
          {copied ? "Copié" : "Copier"}
        </Button>
      </div>
    </div>
  );
}
