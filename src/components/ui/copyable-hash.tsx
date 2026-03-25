"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

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
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
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
      <div className="flex gap-2 items-center max-w-lg">
        <Input
          readOnly
          value={value}
          className="font-mono text-xs text-muted-foreground truncate"
        />
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? "Copié" : "Copier"}
        </Button>
      </div>
    </div>
  );
}
