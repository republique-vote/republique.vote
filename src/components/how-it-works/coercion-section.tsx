import { Shield } from "lucide-react";

const coercionScenarios = [
  {
    situation: "Quelqu'un vous regarde voter en ligne",
    response:
      "Aujourd'hui, le vote en ligne est définitif. Votez seul, dans un endroit calme. À terme, le vote physique en bureau pourra écraser le vote en ligne.",
  },
  {
    situation: "On vous demande une preuve de votre vote",
    response:
      "Votre code de vérification prouve que vous avez voté, mais pas pour qui. Personne ne peut prouver le contenu de votre vote à un tiers.",
  },
  {
    situation: "Quelqu'un vous force à voter devant lui",
    response:
      "C'est un délit (contrainte, violence). Aucun système de vote, en ligne ou physique, ne peut empêcher la contrainte physique. Ça relève de la police.",
  },
  {
    situation: "Objectif futur : le vote physique écrase le vote en ligne",
    response:
      "On travaille sur un système de tag de révocation caché qui permettrait d'annuler un vote en ligne en allant voter en bureau, sans casser l'anonymat. C'est un problème de recherche ouvert.",
  },
];

export function CoercionSection() {
  return (
    <section className="border-border border-t py-8">
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-accent">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="mb-2 font-bold text-2xl">
            Et si quelqu&apos;un me force à voter ?
          </h2>
          <p className="max-w-2xl text-muted-foreground leading-relaxed">
            C&apos;est le problème le plus difficile du vote en ligne. Aucun
            pays au monde ne l&apos;a résolu avec une solution 100% en ligne.
            Mais une solution existe.
          </p>
        </div>
      </div>
      <div className="mb-6 border border-border bg-accent/30 p-6">
        <p className="mb-1 font-bold text-lg">
          Aujourd&apos;hui, le vote en ligne est définitif.
        </p>
        <p className="text-muted-foreground text-sm">
          L&apos;anonymat total rend l&apos;annulation mathématiquement
          impossible sans information supplémentaire cachée dans le bulletin. On
          travaille sur un système de révocation qui permettrait au vote
          physique d&apos;écraser le vote en ligne, sans casser l&apos;anonymat.
        </p>
      </div>
      <div className="overflow-hidden border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b bg-muted">
              <th className="p-4 text-left font-bold">Situation</th>
              <th className="p-4 text-left font-bold">Ce qui se passe</th>
            </tr>
          </thead>
          <tbody>
            {coercionScenarios.map((scenario) => (
              <tr
                className="border-border border-b last:border-b-0"
                key={scenario.situation}
              >
                <td className="w-1/3 p-4 align-top font-medium">
                  {scenario.situation}
                </td>
                <td className="p-4 text-muted-foreground">
                  {scenario.response}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
