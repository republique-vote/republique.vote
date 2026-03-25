"use client";

import { useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";

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
        <div className={fr.cx("fr-text--sm")} style={{ color: "var(--text-mention-grey)", margin: 0, marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
          {label}
          {tooltip && (
            <Tooltip kind="hover" title={tooltip} />
          )}
        </div>
      )}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", maxWidth: "500px" }}>
        <input
          type="text"
          readOnly
          value={value}
          className={fr.cx("fr-input")}
          style={{
            fontFamily: "monospace",
            fontSize: "0.75rem",
            color: "var(--text-mention-grey)",
            flex: 1,
            textOverflow: "ellipsis",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        />
        <button
          type="button"
          className={fr.cx("fr-btn", "fr-btn--secondary", "fr-btn--sm")}
          onClick={handleCopy}
        >
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
    </div>
  );
}
