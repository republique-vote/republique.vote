"use client";

import {
  Calendar,
  Hash,
  HelpCircle,
  Key,
  ListOrdered,
  ShieldCheck,
  Vote,
} from "lucide-react";
import { CopyableHash } from "@/components/ui/copyable-hash";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VoteDetailsCardsProps {
  blindSignature?: string;
  blindToken?: string;
  createdAt?: string;
  hash?: string;
  optionLabel?: string;
  previousHash?: string | null;
  sequence?: number;
}

function InfoCard({
  icon: Icon,
  label,
  tooltip,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 overflow-hidden border border-border bg-card p-3">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-xs">{label}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        {children}
      </div>
    </div>
  );
}

export function VoteDetailsCards({
  sequence,
  optionLabel,
  hash,
  previousHash,
  blindToken,
  blindSignature,
  createdAt,
}: VoteDetailsCardsProps) {
  return (
    <div className="space-y-2">
      {/* Compact row: choice + position + date */}
      <div className="grid grid-cols-2 gap-2">
        {optionLabel && (
          <InfoCard
            icon={Vote}
            label="Choix enregistré"
            tooltip="L'option pour laquelle ce vote a été comptabilisé dans le registre public."
          >
            <p className="font-semibold text-sm">{optionLabel}</p>
          </InfoCard>
        )}
        {sequence != null && (
          <InfoCard
            icon={ListOrdered}
            label="Position"
            tooltip="Le numéro d'ordre de votre vote dans le registre public. Chaque vote reçoit un numéro unique."
          >
            <p className="font-semibold text-sm">#{sequence}</p>
          </InfoCard>
        )}
      </div>
      {createdAt && (
        <InfoCard
          icon={Calendar}
          label="Date d'enregistrement"
          tooltip="Le moment exact où votre vote a été inscrit dans le registre public."
        >
          <p className="font-semibold text-sm">
            {new Date(createdAt).toLocaleString("fr-FR")}
          </p>
        </InfoCard>
      )}
      {/* Full-width hash fields */}
      {hash && (
        <InfoCard
          icon={Hash}
          label="Empreinte cryptographique"
          tooltip="Un code unique calculé à partir de votre vote. Si quelqu'un modifie le vote, ce code change, ce qui rend la fraude détectable."
        >
          <div className="mt-1">
            <CopyableHash value={hash} />
          </div>
        </InfoCard>
      )}
      {previousHash !== undefined &&
        (previousHash ? (
          <InfoCard
            icon={Hash}
            label="Empreinte précédente"
            tooltip="L'empreinte du vote d'avant. C'est ce qui crée la chaîne : chaque vote dépend du précédent."
          >
            <div className="mt-1">
              <CopyableHash value={previousHash} />
            </div>
          </InfoCard>
        ) : (
          <InfoCard
            icon={Hash}
            label="Empreinte précédente"
            tooltip="Premier vote du cahier. Son empreinte est calculée à partir de son contenu uniquement, sans empreinte précédente. C'est le point de départ de la chaîne."
          >
            <p className="font-semibold text-sm italic">
              genèse (premier vote)
            </p>
          </InfoCard>
        ))}
      {blindToken && (
        <InfoCard
          icon={Key}
          label="Jeton aveugle"
          tooltip="Un code aléatoire qui prouve votre droit de vote sans révéler votre identité."
        >
          <div className="mt-1">
            <CopyableHash value={blindToken} />
          </div>
        </InfoCard>
      )}
      {blindSignature && (
        <InfoCard
          icon={ShieldCheck}
          label="Signature aveugle"
          tooltip="La preuve que le serveur a validé votre jeton sans voir son contenu."
        >
          <div className="mt-1">
            <CopyableHash value={blindSignature} />
          </div>
        </InfoCard>
      )}
    </div>
  );
}
