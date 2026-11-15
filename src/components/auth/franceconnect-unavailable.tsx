import { Badge } from "@/components/ui/badge";

// Text only on purpose: the official FranceConnect button and logo are
// reserved to authorized services
export function FranceConnectUnavailable() {
  return (
    <div
      aria-disabled="true"
      className="space-y-2 border border-border border-dashed p-4 text-muted-foreground opacity-70"
    >
      <p className="flex items-center gap-2 font-medium text-sm">
        FranceConnect
        <Badge variant="outline">Indisponible</Badge>
      </p>
      <p className="text-xs leading-relaxed">
        Notre demande d'habilitation FranceConnect (n° 94477) a été refusée par
        la DINUM le 15 avril 2026, et notre recours gracieux a été rejeté le 27
        juin 2026. FranceConnect n'est ouvert au privé que dans des cas prévus
        par la loi. Nous utilisons donc une vérification par carte d'identité,
        qui ne dépend d'aucune autorisation.{" "}
        <a
          className="underline"
          href="https://github.com/republique-vote/republique.vote#readme"
          rel="noopener noreferrer"
          target="_blank"
        >
          En savoir plus
        </a>
      </p>
    </div>
  );
}
