"use client";

import { parseApiResponse } from "@republique/core";
import { Flag, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PROMPT_URL =
  "https://github.com/republique-vote/republique.vote/blob/main/src/services/summary/prompt.ts";

export interface PollSummaryData {
  changes: string[];
  context: string | null;
  model: string;
  plainTitle: string;
  promptVersion: string;
  simpleSentence: string;
  summary: string;
}

export function PollSummary({
  pollId,
  summary,
}: {
  pollId: string;
  summary: PollSummaryData;
}) {
  return (
    <section className="space-y-4 border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-medium text-sm">En clair</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="cursor-help" type="button">
              <Badge variant="outline">
                Résumé généré automatiquement
                <HelpCircle />
              </Badge>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Écrit par une intelligence artificielle ({summary.model}) à partir
              de l'exposé des motifs, le texte où les auteurs défendent leur
              proposition. Il peut contenir des erreurs : le texte officiel fait
              foi.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <p className="border-primary border-l-2 pl-3 font-medium text-lg">
        {summary.simpleSentence}
      </p>

      <div className="space-y-1">
        <h3 className="font-semibold">{summary.plainTitle}</h3>
        <p className="leading-relaxed">{summary.summary}</p>
      </div>

      {summary.context ? (
        <div className="space-y-1">
          <h3 className="font-medium text-sm">Pour comprendre</h3>
          <p className="leading-relaxed">{summary.context}</p>
        </div>
      ) : null}

      <div className="space-y-1">
        <h3 className="font-medium text-sm">
          Ce que ça changerait concrètement
        </h3>
        <ul className="list-disc space-y-1 pl-5">
          {summary.changes.map((change) => (
            <li key={change}>{change}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-border border-t pt-3 text-muted-foreground text-xs">
        <a
          className="underline"
          href={PROMPT_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          Voir les consignes données à l'IA (version {summary.promptVersion})
        </a>
        <ReportDialog pollId={pollId} />
      </div>
    </section>
  );
}

function ReportDialog({ pollId }: { pollId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const send = async () => {
    setStatus("sending");
    try {
      const res = await fetch(`/api/poll/${pollId}/summary-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      await parseApiResponse(res);
      setStatus("sent");
      setMessage("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <Dialog
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setStatus("idle");
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button size="xs" type="button" variant="ghost">
          <Flag />
          Signaler une erreur
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaler une erreur dans le résumé</DialogTitle>
          <DialogDescription>
            Une information fausse, pas claire, ou qui semble prendre parti ?
            Dites-nous ce qui ne va pas. Votre signalement est anonyme.
          </DialogDescription>
        </DialogHeader>
        {status === "sent" ? (
          <Alert variant="success">
            <AlertDescription>
              Merci, votre signalement est envoyé.
            </AlertDescription>
          </Alert>
        ) : (
          <textarea
            aria-label="Votre signalement"
            className="min-h-28 w-full border border-input bg-transparent p-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring dark:bg-input/30"
            maxLength={2000}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Par exemple : la deuxième phrase présente l'avis des auteurs comme un fait."
            value={message}
          />
        )}
        {status === "error" ? (
          <Alert variant="destructive">
            <AlertDescription>
              L'envoi a échoué. Réessayez dans un instant.
            </AlertDescription>
          </Alert>
        ) : null}
        <DialogFooter>
          {status === "sent" ? (
            <Button onClick={() => setOpen(false)} type="button">
              Fermer
            </Button>
          ) : (
            <Button
              disabled={!message.trim() || status === "sending"}
              onClick={send}
              type="button"
            >
              Envoyer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
