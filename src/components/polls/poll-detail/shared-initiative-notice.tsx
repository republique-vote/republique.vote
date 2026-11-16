import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// What a shared initiative referendum (article 11, third paragraph) needs
// before citizens vote on it for real
export function SharedInitiativeNotice() {
  return (
    <Alert variant="info">
      <Info className="h-4 w-4" />
      <AlertTitle>Référendum d'initiative partagée</AlertTitle>
      <AlertDescription>
        Cette proposition de loi est portée par au moins un cinquième des
        parlementaires. Après l'accord du Conseil constitutionnel, elle doit
        recueillir le soutien d'un électeur inscrit sur dix, soit près de 5
        millions de signatures. Si le Parlement ne l'examine pas ensuite dans
        les six mois, le Président de la République la soumet au référendum.
      </AlertDescription>
    </Alert>
  );
}
