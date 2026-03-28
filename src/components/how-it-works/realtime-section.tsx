import { AlertTriangle, SearchCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function RealtimeSection() {
  return (
    <section className="border-border border-t py-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-accent">
          <SearchCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="mb-2 font-bold text-2xl">
            Pourquoi les résultats sont visibles en direct ?
          </h2>
          <p className="max-w-2xl text-muted-foreground leading-relaxed">
            Parce que c&apos;est tout le principe. Pas de comptage secret dans
            une salle fermée. Pas de « faites-nous confiance ». Tout est
            visible, tout le temps, par tout le monde.
          </p>
          <Alert className="mt-4 max-w-2xl" variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Les résultats sont visibles en temps réel pendant le vote. Le vote
              en ligne est actuellement définitif. À terme, un mécanisme
              d&apos;annulation par vote physique est prévu.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </section>
  );
}
