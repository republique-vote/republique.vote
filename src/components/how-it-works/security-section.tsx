import { BookOpen, EyeOff, ShieldOff } from "lucide-react";

const securityPoints = [
  {
    icon: ShieldOff,
    title: "Impossible d'inventer de faux votes",
    description:
      "Il faudrait un code secret valide, et même le serveur ne peut pas en fabriquer après coup.",
  },
  {
    icon: BookOpen,
    title: "Impossible d'effacer des votes",
    description:
      "Le cahier de vote est public. Tout le monde peut le télécharger et vérifier que rien n'a changé.",
  },
  {
    icon: EyeOff,
    title: "Impossible de savoir qui a voté quoi",
    description:
      "Le code secret est anonyme. On sait qu'il y a un vote « Pour », mais on ne sait pas que c'est vous.",
  },
];

export function SecuritySection() {
  return (
    <section className="border-border border-t py-8">
      <h2 className="mb-2 font-bold text-2xl">Pourquoi c&apos;est sûr ?</h2>
      <p className="mb-8 text-muted-foreground">
        Même si quelqu&apos;un pirate le serveur :
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {securityPoints.map((point) => {
          const Icon = point.icon;
          return (
            <div className="border border-border p-6" key={point.title}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center bg-accent">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-bold">{point.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {point.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
