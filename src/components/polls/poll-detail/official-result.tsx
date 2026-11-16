import { formatDay } from "@republique/core";
import { ExternalLink } from "lucide-react";
import { VOTE_BG_CLASSES } from "@/components/polls/poll-detail/vote-colors";

// Final vote of one chamber on the whole text
export interface ChamberVote {
  abstentions: number;
  against: number;
  // Day of the vote: the open data gives no time
  date: string;
  for: number;
  // Page of the scrutin itself, the bill page is already linked above
  url: string | null;
}

interface OfficialResultProps {
  citizenResults: {
    forPercentage: number;
    againstPercentage: number;
    abstentionPercentage: number;
    totalVotes: number;
  } | null;
  deputies: ChamberVote | null;
  senators: ChamberVote | null;
}

const GRID_COLUMNS: Record<number, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
};

function ChamberResult({ title, vote }: { title: string; vote: ChamberVote }) {
  const total = vote.for + vote.against + vote.abstentions;
  return (
    <div className="p-5">
      <p className="mb-3 font-medium text-sm">{title}</p>
      <div className="space-y-2">
        <ResultBar
          color={VOTE_BG_CLASSES.for}
          count={vote.for}
          label="Pour"
          total={total}
        />
        <ResultBar
          color={VOTE_BG_CLASSES.against}
          count={vote.against}
          label="Contre"
          total={total}
        />
        <ResultBar
          color={VOTE_BG_CLASSES.abstention}
          count={vote.abstentions}
          label="Abstention"
          total={total}
        />
      </div>
      <p className="mt-3 text-muted-foreground text-xs">
        {vote.for > vote.against ? "Adopté" : "Rejeté"} le{" "}
        {formatDay(vote.date)} ({total} votants)
      </p>
      {vote.url && (
        <a
          className="mt-1 inline-flex items-center gap-1 text-primary text-xs hover:underline"
          href={vote.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          Voir le détail du scrutin
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

export function OfficialResult({
  deputies,
  senators,
  citizenResults,
}: OfficialResultProps) {
  const columns = 1 + (deputies ? 1 : 0) + (senators ? 1 : 0);
  const chambers = [deputies && "députés", senators && "sénateurs"].filter(
    Boolean
  );

  return (
    <div className="mt-6 border border-border">
      <div className="border-border border-b bg-accent/30 px-5 py-3">
        <h3 className="font-bold text-sm">
          Comparatif citoyens / {chambers.join(" / ")}
        </h3>
      </div>

      <div
        className={`grid grid-cols-1 divide-y divide-border md:divide-x md:divide-y-0 ${GRID_COLUMNS[columns] ?? ""}`}
      >
        {deputies ? (
          <ChamberResult title="Résultat des députés" vote={deputies} />
        ) : null}
        {senators ? (
          <ChamberResult title="Résultat des sénateurs" vote={senators} />
        ) : null}

        {/* Citizens */}
        <div className="p-5">
          <p className="mb-3 font-medium text-sm">Résultat des citoyens</p>
          {citizenResults && citizenResults.totalVotes > 0 ? (
            <>
              <div className="space-y-2">
                <ResultBar
                  color={VOTE_BG_CLASSES.for}
                  label="Pour"
                  percentage={citizenResults.forPercentage}
                />
                <ResultBar
                  color={VOTE_BG_CLASSES.against}
                  label="Contre"
                  percentage={citizenResults.againstPercentage}
                />
                <ResultBar
                  color={VOTE_BG_CLASSES.abstention}
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
