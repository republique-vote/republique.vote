import { readFileSync } from "node:fs";
import { notFound } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  PROTOTYPE_FILE,
  type PrototypeEntry,
  type PrototypeFile,
} from "@/services/summary/prototype";

export const dynamic = "force-dynamic";

const EXCERPT_CHARS = 1200;

function readPrototype(): PrototypeFile | null {
  try {
    return JSON.parse(readFileSync(PROTOTYPE_FILE, "utf8")) as PrototypeFile;
  } catch {
    return null;
  }
}

export default function SummariesPrototypePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const prototype = readPrototype();

  return (
    <div>
      <h1 className="font-bold text-3xl tracking-tight">
        Prototype de résumés
      </h1>
      {prototype ? (
        <>
          <p className="mt-3 text-muted-foreground">
            {prototype.entries.length} textes, modèle {prototype.model},
            consignes du {prototype.promptVersion}, générés le{" "}
            {new Date(prototype.generatedAt).toLocaleString("fr-FR")}.
          </p>
          <div className="mt-8 space-y-6">
            {prototype.entries.map((entry) => (
              <EntryRow entry={entry} key={entry.pollId} />
            ))}
          </div>
        </>
      ) : (
        <Alert className="mt-8" variant="info">
          <AlertTitle>Aucun résumé généré</AlertTitle>
          <AlertDescription>
            Ajoutez GOOGLE_GENERATIVE_AI_API_KEY dans .env puis lancez pnpm
            summarize:prototype.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function EntryRow({ entry }: { entry: PrototypeEntry }) {
  const excerpt =
    entry.description.length > EXCERPT_CHARS
      ? `${entry.description.slice(0, EXCERPT_CHARS)}…`
      : entry.description;

  return (
    <div className="grid gap-4 border border-border p-4 md:grid-cols-2">
      <section className="space-y-2">
        <p className="flex items-center gap-2 font-medium text-sm">
          Original
          <Badge variant="outline">
            {entry.description.length.toLocaleString("fr-FR")} caractères
          </Badge>
        </p>
        <h2 className="font-semibold">{entry.title}</h2>
        <p className="whitespace-pre-line text-muted-foreground text-sm">
          {excerpt}
        </p>
        {entry.sourceUrl ? (
          <a
            className="text-primary text-sm underline"
            href={entry.sourceUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Voir sur le site de l'Assemblée
          </a>
        ) : null}
      </section>
      <section className="space-y-2 border-border md:border-l md:pl-4">
        <p className="flex items-center gap-2 font-medium text-sm">
          Résumé
          <Badge variant="outline">
            {(entry.durationMs / 1000).toFixed(1)} s
          </Badge>
        </p>
        {entry.summary ? (
          <>
            <h2 className="font-semibold">{entry.summary.plainTitle}</h2>
            <p className="text-sm">{entry.summary.summary}</p>
            <p className="font-medium text-sm">
              Ce que ça changerait concrètement
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {entry.summary.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-destructive text-sm">{entry.error}</p>
        )}
      </section>
    </div>
  );
}
