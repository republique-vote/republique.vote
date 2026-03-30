import { formatDate } from "@republique/core";
import { ExternalLink } from "lucide-react";

interface OfficialResultProps {
  citizenResults: {
    forPercentage: number;
    againstPercentage: number;
    abstentionPercentage: number;
    totalVotes: number;
  } | null;
  officialAbstentions: number;
  officialAgainst: number;
  officialFor: number;
  scrutinDate: string;
  sourceUrl: string | null;
}

export function OfficialResult({
  officialFor,
  officialAgainst,
  officialAbstentions,
  scrutinDate,
  sourceUrl,
  citizenResults,
}: OfficialResultProps) {
  const officialTotal = officialFor + officialAgainst + officialAbstentions;
  const adopted = officialFor > officialAgainst;

  return (
    <div className="mt-6 border border-border">
      <div className="border-border border-b bg-accent/30 px-5 py-3">
        <h3 className="font-bold text-sm">Comparatif citoyens / députés</h3>
      </div>

      <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
        {/* Deputies */}
        <div className="p-5">
          <p className="mb-3 font-medium text-sm">Résultat des députés</p>
          <div className="space-y-2">
            <ResultBar
              color="bg-green-600"
              count={officialFor}
              label="Pour"
              total={officialTotal}
            />
            <ResultBar
              color="bg-red-500"
              count={officialAgainst}
              label="Contre"
              total={officialTotal}
            />
            <ResultBar
              color="bg-muted-foreground"
              count={officialAbstentions}
              label="Abstention"
              total={officialTotal}
            />
          </div>
          <p className="mt-3 text-muted-foreground text-xs">
            {adopted ? "Adopté" : "Rejeté"} le {formatDate(scrutinDate)} (
            {officialTotal} votants)
          </p>
          {sourceUrl && (
            <a
              className="mt-1 inline-flex items-center gap-1 text-primary text-xs hover:underline"
              href={sourceUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Voir sur assemblee-nationale.fr
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Citizens */}
        <div className="p-5">
          <p className="mb-3 font-medium text-sm">Résultat des citoyens</p>
          {citizenResults && citizenResults.totalVotes > 0 ? (
            <>
              <div className="space-y-2">
                <ResultBar
                  color="bg-green-600"
                  label="Pour"
                  percentage={citizenResults.forPercentage}
                />
                <ResultBar
                  color="bg-red-500"
                  label="Contre"
                  percentage={citizenResults.againstPercentage}
                />
                <ResultBar
                  color="bg-muted-foreground"
                  label="Abstention"
                  percentage={citizenResults.abstentionPercentage}
                />
              </div>
              <p className="mt-3 text-muted-foreground text-xs">
                {citizenResults.totalVotes} vote
                {citizenResults.totalVotes > 1 ? "s" : ""} citoyens
              </p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Aucun vote citoyen pour le moment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultBar({
  label,
  count,
  total,
  percentage,
  color,
}: {
  label: string;
  count?: number;
  total?: number;
  percentage?: number;
  color: string;
}) {
  const pct =
    percentage ??
    (total && count !== undefined ? Math.round((count / total) * 100) : 0);
  const displayCount = count === undefined ? "" : ` (${count})`;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span>{label}</span>
        <span className="font-mono">
          {pct}%{displayCount}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden bg-muted">
        <div
          className={`h-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
