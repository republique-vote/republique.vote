import { formatDay } from "@republique/core";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { JourneyStep } from "@/services/assembly/journey";

type BadgeVariant = "success" | "info" | "warning" | "destructive" | "outline";

const READING = /^(AN|SN)(1|2|3|NLEC)$/;
const ADOPTED_AS_IS = /sans modification|^conforme$/i;
const ADOPTED = /^(adopt|modifi|considéré comme adopté)/i;
// "considéré comme adopté par l'Assemblée nationale en application de
// l'article 49, alinéa 3 de la Constitution"
const ARTICLE_49_3 = /^considérée? comme adoptée?.*49, alinéa 3/i;

const MODIFIED = /^modifié(e?)$/;
const OUTCOME_VARIANTS: [RegExp, BadgeVariant][] = [
  [/rejet|désaccord|non conforme/i, "destructive"],
  [/partiellement|réserve/i, "warning"],
  [/^(adopt|accord|conforme|loi promulguée|considéré)/i, "success"],
  [/^modifi/i, "info"],
];

// Open data wording, made readable: "modifiée" means adopted with changes
function outcomeLabel(outcome: string) {
  if (ARTICLE_49_3.test(outcome)) {
    return "Adopté sans vote (article 49.3)";
  }
  const label = outcome.replace(MODIFIED, "adopté$1 avec modifications");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function outcomeVariant(outcome: string): BadgeVariant {
  return (
    OUTCOME_VARIANTS.find(([pattern]) => pattern.test(outcome))?.[1] ??
    "outline"
  );
}

// The next stage when the rules of procedure make it certain: after a vote in
// one chamber the text goes to the other one, and a text adopted in the same
// words by both chambers is then promulgated
function nextStage(steps: JourneyStep[], constitutional: boolean) {
  const last = steps.at(-1);
  if (!last?.outcome || steps.some((s) => s.code === "PROM")) {
    return null;
  }
  const reading = READING.exec(last.code);
  if (reading && ADOPTED_AS_IS.test(last.outcome)) {
    // A constitutional revision adopted in the same words by both chambers
    // still needs the Congrès or a referendum
    return constitutional ? "Congrès ou référendum" : "Promulgation";
  }
  if (reading && ADOPTED.test(last.outcome)) {
    return reading[1] === "AN"
      ? "Examen par le Sénat"
      : "Examen par l'Assemblée nationale";
  }
  return null;
}

// What is happening in a stage that has no decision yet
function ongoingLabel(step: JourneyStep) {
  const labels = step.events.map((e) => e.label);
  if (labels.includes("Débat en séance")) {
    return "En discussion en séance";
  }
  if (labels.includes("Rapport de la commission")) {
    return "Examiné en commission";
  }
  // Nothing happened since the text was tabled
  if (labels.every((label) => label === "Dépôt")) {
    return "En attente d'examen";
  }
  return "En cours";
}

export function PollJourney({
  constitutional,
  steps,
}: {
  constitutional: boolean;
  steps: JourneyStep[];
}) {
  if (steps.length === 0) {
    return null;
  }
  const next = nextStage(steps, constitutional);

  return (
    <section className="mt-6 border border-border p-4">
      <h2 className="mb-4 font-medium text-sm">Parcours du texte</h2>
      <ol className="space-y-5">
        {steps.map((step, i) => {
          const isCurrent = i === steps.length - 1 && !step.outcome;
          // The decision takes its place among the dates of the stage
          const entries = [
            ...step.events,
            ...(step.outcome && step.outcomeDate
              ? [{ date: step.outcomeDate, label: "" }]
              : []),
          ].sort((a, b) => a.date.localeCompare(b.date));
          return (
            <li
              className="relative flex gap-3"
              key={`${step.code}-${step.events[0]?.date ?? step.outcomeDate}`}
            >
              <StepDot
                done={!isCurrent}
                isLast={i === steps.length - 1 && !next}
              />
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-sm">{step.title}</p>
                  {isCurrent ? (
                    <Badge variant="outline">{ongoingLabel(step)}</Badge>
                  ) : null}
                </div>
                {/* Dates in a fixed-width column, so labels line up across
                    every stage */}
                <ul className="mt-1.5 space-y-1 text-muted-foreground text-xs">
                  {entries.map((entry) => (
                    <li
                      className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-2"
                      key={`${entry.date}-${entry.label || "outcome"}`}
                    >
                      <span className="whitespace-nowrap tabular-nums">
                        {formatDay(entry.date)}
                      </span>
                      {entry.label ? (
                        <span>{entry.label}</span>
                      ) : (
                        <Badge variant={outcomeVariant(step.outcome ?? "")}>
                          {outcomeLabel(step.outcome ?? "")}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
        {next ? (
          <li className="relative flex gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 rounded-full border-2 border-muted-foreground/40 border-dashed"
            />
            <div>
              <p className="font-medium text-muted-foreground text-sm">
                {next}
              </p>
              <p className="mt-1 text-muted-foreground text-xs">À venir</p>
            </div>
          </li>
        ) : null}
      </ol>
    </section>
  );
}

// Checked dot for finished stages, ring for the current one, with a line down
// to the next stage
function StepDot({ done, isLast }: { done: boolean; isLast: boolean }) {
  return (
    <>
      {isLast ? null : (
        <span
          aria-hidden="true"
          className="absolute top-6 bottom-[-1.25rem] left-[9px] w-0.5 bg-border"
        />
      )}
      {done ? (
        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check aria-hidden="true" className="size-3" />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 rounded-full border-2 border-primary bg-background"
        />
      )}
    </>
  );
}
