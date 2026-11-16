import { formatDate } from "@republique/core";
import { ExternalLink } from "lucide-react";
import { VOTE_BG_CLASSES } from "@/components/polls/poll-detail/vote-colors";
import { Badge } from "@/components/ui/badge";

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

// The official result of a past referendum, in place of the vote block:
// these referendums are archives, not open to a citizen vote
export function ReferendumResult({ result }: { result: ReferendumResultData }) {
  const adopted = result.yes > result.no;

  return (
    <section className="border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-medium text-sm">Résultat officiel</h2>
        <Badge variant={adopted ? "success" : "destructive"}>
          {adopted ? "Adopté" : "Rejeté"}
        </Badge>
      </div>
      <p className="mt-1 mb-4 text-muted-foreground text-xs">
        Référendum du {formatDate(result.date)}, en pourcentage des suffrages
        exprimés
      </p>
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
        Participation de{" "}
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
    </section>
  );
}
