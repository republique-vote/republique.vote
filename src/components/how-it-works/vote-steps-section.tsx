import {
  ChevronDown,
  KeyRound,
  SearchCheck,
  UserCheck,
  Vote,
} from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Vous vous connectez",
    icon: UserCheck,
    description:
      "Vous prouvez qui vous êtes avec FranceConnect (le même système que pour les impôts ou la CAF). Le système sait que vous avez le droit de voter.",
  },
  {
    number: 2,
    title: "Vous recevez un code secret",
    icon: KeyRound,
    description:
      "Le système sait que vous avez voté (pour ne pas voter deux fois), mais il ne sait pas pour qui. Il vous donne un code secret unique qui prouve votre droit de voter, sans pouvoir être relié à vous. On vérifie votre identité à l'entrée, puis on vous donne un code sans nom. Plus aucun lien entre vous et ce code.",
    technical: "blind signature",
  },
  {
    number: 3,
    title: "Vous votez",
    icon: Vote,
    description:
      "Vous utilisez votre code secret pour envoyer votre choix. Votre vote est affiché publiquement sur une liste ouverte que tout le monde peut voir. Les résultats bougent en direct.",
  },
  {
    number: 4,
    title: "Tout le monde vérifie",
    icon: SearchCheck,
    description:
      "Le cahier de vote est téléchargeable par n'importe qui. Chaque ligne dépend de toutes les lignes précédentes. Si quelqu'un modifie une seule ligne, le calcul ne tombe plus juste et tout le monde le voit.",
    technical: "Merkle tree",
  },
];

export function VoteStepsSection() {
  return (
    <section className="border-border border-t py-8">
      <h2 className="mb-10 font-bold text-2xl">Les 4 étapes du vote</h2>
      <div className="grid grid-cols-1 border border-border md:grid-cols-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              className={`group relative p-6 md:p-8 ${i % 2 === 0 ? "" : "border-border md:border-l"} ${i >= 1 ? "border-border border-t" : ""} ${i >= 1 && i < 2 ? "md:border-t-0" : ""}`}
              key={step.number}
            >
              <div className="mb-4 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary font-bold text-lg text-primary-foreground">
                  {step.number}
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <h3 className="mb-2 font-bold text-lg">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
              {step.technical && (
                <p className="mt-3 text-muted-foreground text-xs italic">
                  Techniquement : « {step.technical} »
                </p>
              )}
              {i < steps.length - 1 && (
                <div className="absolute top-1/2 -right-3 z-10 hidden -translate-y-1/2 md:block">
                  {i % 2 === 0 && (
                    <div className="flex h-6 w-6 items-center justify-center border border-border bg-background">
                      <ChevronDown className="h-4 w-4 -rotate-90 text-primary" />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-muted-foreground text-xs">
        Tout ça se passe automatiquement quand vous cliquez sur « Voter ». Vous
        n&apos;avez rien à faire de technique.
      </p>
    </section>
  );
}
