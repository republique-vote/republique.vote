import { formatDate } from "@republique/core";
import { ExternalLink } from "lucide-react";
import { VOTE_BG_CLASSES } from "@/components/polls/poll-detail/vote-colors";

export interface ReferendumResultData {
  blankAndNull: number;
  date: string;
  expressed: number;
  no: number;
  registered: number;
  scopeNote: string | null;
  sourceUrl: string;
  voters: number;
  yes: number;
}

const numbers = new Intl.NumberFormat("fr-FR");
const percents = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function percent(part: number, total: number) {
  return total > 0 ? (part / total) * 100 : 0;
}

// Close results like Maastricht (51,05 %) need two decimals
function Bar({
  color,
  count,
  label,
  share,
}: {
  color: string;
  count?: number;
  label: string;
  share: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span>{label}</span>
        <span className="font-mono">
          {percents.format(share)} %
          {count === undefined ? "" : ` (${numbers.format(count)})`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden bg-muted">
        <div className={`h-full ${color}`} style={{ width: `${share}%` }} />
      </div>
    </div>
  );
}

// The official result of a past referendum next to the votes of citizens
// today on the same question
export function ReferendumResult({
  citizenResults,
  result,
}: {
  citizenResults: { label: string; percentage: number }[] | null;
  result: ReferendumResultData;
}) {
  const year = result.date.slice(0, 4);
  const adopted = result.yes > result.no;
  const hasCitizenVotes =
    citizenResults?.some((r) => r.percentage > 0) ?? false;

  return (
    <div className="mt-6 border border-border">
      <div className="border-border border-b bg-accent/30 px-5 py-3">
        <h3 className="font-bold text-sm">
          Comparatif citoyens d'aujourd'hui / électeurs de {year}
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-2">
        <div className="bg-background p-5">
          <p className="mb-3 font-medium text-sm">Résultat officiel</p>
          <div className="space-y-2">
            <Bar
              color={VOTE_BG_CLASSES.for}
              count={result.yes}
              label="Oui"
              share={percent(result.yes, result.expressed)}
            />
            <Bar
              color={VOTE_BG_CLASSES.against}
              count={result.no}
              label="Non"
              share={percent(result.no, result.expressed)}
            />
          </div>
          <p className="mt-3 text-muted-foreground text-xs leading-relaxed">
            {adopted ? "Adopté" : "Rejeté"} le {formatDate(result.date)}, en
            pourcentage des suffrages exprimés. Participation de{" "}
            {percents.format(percent(result.voters, result.registered))} % (
            {numbers.format(result.voters)} votants sur{" "}
            {numbers.format(result.registered)} inscrits),{" "}
            {numbers.format(result.blankAndNull)} bulletins blancs ou nuls.
          </p>
          {result.scopeNote ? (
            <p className="mt-2 text-muted-foreground text-xs leading-relaxed">
              {result.scopeNote}
            </p>
          ) : null}
          <a
            className="mt-2 inline-flex items-center gap-1 text-primary text-xs hover:underline"
            href={result.sourceUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Voir la proclamation des résultats
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="bg-background p-5">
          <p className="mb-3 font-medium text-sm">
            Résultat des citoyens d'aujourd'hui
          </p>
          {citizenResults && hasCitizenVotes ? (
            <div className="space-y-2">
              {citizenResults.map((r) => (
                <Bar
                  color={
                    {
                      Oui: VOTE_BG_CLASSES.for,
                      Non: VOTE_BG_CLASSES.against,
                    }[r.label] ?? "bg-muted-foreground"
                  }
                  key={r.label}
                  label={r.label}
                  share={r.percentage}
                />
              ))}
            </div>
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
