import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  EyeOff,
  KeyRound,
  SearchCheck,
  Shield,
  ShieldOff,
  UserCheck,
  Vote,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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

const faqItems = [
  {
    question: "Pourquoi je ne peux pas changer mon vote en ligne ?",
    answer:
      "Votre vote est anonyme : personne ne sait à qui il appartient, même pas le serveur. Pour le modifier, il faudrait le retrouver dans le cahier public. Mais c'est mathématiquement impossible sans casser l'anonymat. Donc le vote en ligne est définitif. C'est le même choix que la Suisse.",
  },
  {
    question: "Est-ce que le vote physique peut annuler mon vote en ligne ?",
    answer:
      "Pas encore. C'est un problème de recherche ouvert. Pour annuler un vote anonyme, il faudrait cacher une information de révocation dans le bulletin dès l'origine, puis utiliser de la cryptographie avancée pour retrouver le bon vote sans révéler sa position dans le cahier. On travaille dessus pour une future version.",
  },
  {
    question: "C'est quoi un « Merkle tree » ?",
    answer:
      "Imaginez un cahier public posé sur une table. À chaque vote, une nouvelle ligne est écrite. Chaque ligne contient un code spécial qui dépend de toutes les lignes précédentes. Si quelqu'un essaie de modifier une ancienne ligne, le code des lignes suivantes ne correspond plus et tout le monde voit qu'il y a eu une fraude. C'est ce cahier qu'on appelle un « Merkle tree ».",
  },
  {
    question: "C'est quoi une « blind signature » ?",
    answer:
      "Imaginez qu'on vous donne un tampon sur une enveloppe fermée. La personne qui tamponne prouve que vous avez le droit de voter, mais elle ne voit pas ce qu'il y a à l'intérieur. Une fois que vous avez le tampon, plus aucun lien entre vous et l'enveloppe. C'est exactement ce qui se passe avec votre code secret.",
  },
  {
    question: "Qui peut voir les résultats ?",
    answer:
      "Tout le monde. Les résultats sont visibles en temps réel, par tout le monde, pendant que le vote est ouvert. C'est le cœur du projet : pas de comptage secret dans une salle fermée. Tout est visible, tout le temps.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Comment ça marche</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Hero ── */}
      <section className="py-8 md:py-14">
        <h1 className="font-bold text-3xl leading-tight tracking-tight md:text-5xl">
          Comment ça marche ?
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          Voter en ligne, de manière anonyme, avec des résultats que tout le
          monde peut vérifier. Voici comment on fait, étape par étape.
        </p>
      </section>

      {/* ── Pourquoi voter en ligne ? ── */}
      <section className="border-border border-t py-8">
        <h2 className="mb-6 font-bold text-2xl">Pourquoi voter en ligne ?</h2>
        <div className="grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 font-bold">Les limites du vote physique</h3>
            <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed">
              <li>
                Le dépouillement repose sur la{" "}
                <strong className="text-foreground">confiance</strong> : on fait
                confiance aux personnes qui comptent les bulletins. En théorie,
                tout citoyen peut y assister. En pratique, quasi personne ne le
                fait.
              </li>
              <li>
                Un bureau de vote peut faire des{" "}
                <strong className="text-foreground">erreurs</strong> : ce sont
                des personnes fatiguées qui comptent des papiers à la main tard
                le soir.
              </li>
              <li>
                Dans les petites communes, il y a parfois très peu de
                scrutateurs, ce qui rend le contrôle plus difficile.
              </li>
              <li>
                Il faut se{" "}
                <strong className="text-foreground">
                  déplacer physiquement
                </strong>{" "}
                pour voter, ce qui exclut de fait de nombreux citoyens.
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-bold">Ce que le vote en ligne change</h3>
            <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed">
              <li>
                Le décompte est{" "}
                <strong className="text-foreground">mathématique</strong>, pas
                humain. N&apos;importe qui peut le vérifier depuis chez soi,
                sans faire confiance à personne.
              </li>
              <li>
                Les résultats sont visibles{" "}
                <strong className="text-foreground">en temps réel</strong> par
                tout le monde. Pas de comptage secret dans une salle fermée.
              </li>
              <li>
                Chaque vote est{" "}
                <strong className="text-foreground">lié au précédent</strong>{" "}
                par un calcul. Modifier un seul vote casserait toute la chaîne
                et tout le monde le verrait.
              </li>
              <li>
                Voter depuis{" "}
                <strong className="text-foreground">n&apos;importe où</strong>,
                à n&apos;importe quel moment pendant la période de vote.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Les 4 étapes ── */}
      <section className="border-border border-t py-8">
        <h2 className="mb-10 font-bold text-2xl">Les 4 étapes du vote</h2>
        <div className="grid grid-cols-1 border border-border md:grid-cols-2">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                className={`group relative p-6 md:p-8 ${i % 2 === 0 ? "" : "border-border md:border-l"} ${i >= 2 ? "border-border border-t" : ""}`}
                key={step.number}
              >
                {/* Step number */}
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
                {/* Connector arrow for non-last items */}
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
          Tout ça se passe automatiquement quand vous cliquez sur « Voter ».
          Vous n&apos;avez rien à faire de technique.
        </p>
      </section>

      {/* ── Pourquoi c'est sûr ? ── */}
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

      {/* ── Résultats en direct ── */}
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
                Les résultats sont visibles en temps réel pendant le vote. Le
                vote en ligne est actuellement définitif. À terme, un mécanisme
                d&apos;annulation par vote physique est prévu.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </section>

      {/* ── Anti-coercition ── */}
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
            impossible sans information supplémentaire cachée dans le bulletin.
            On travaille sur un système de révocation qui permettrait au vote
            physique d&apos;écraser le vote en ligne, sans casser
            l&apos;anonymat.
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

      {/* ── Vision ── */}
      <section className="border-border border-t py-8">
        <h2 className="mb-6 font-bold text-2xl">La vision</h2>
        <p className="mb-6 max-w-3xl text-muted-foreground leading-relaxed">
          Ce projet est né d&apos;un constat simple d&apos;
          <a
            className="font-medium text-primary hover:underline"
            href="https://antoinek.fr/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Antoine Kingue
          </a>{" "}
          : en France, on ne peut pas voter en ligne, et le dépouillement se
          fait sans que la plupart des citoyens n&apos;aient jamais de
          visibilité dessus.
        </p>
        <div className="max-w-3xl space-y-8">
          <div className="border-primary border-l-2 pl-4">
            <h3 className="mb-1 font-bold">Phase 1 : Proof of concept</h3>
            <p className="mb-1 text-muted-foreground text-sm">
              C&apos;est là où on en est.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              On prouve que c&apos;est techniquement possible de voter en ligne
              de manière anonyme, transparente et vérifiable. Les votes sur
              cette plateforme n&apos;ont aucune valeur officielle. Le code est{" "}
              <a
                className="text-primary hover:underline"
                href="https://github.com/republique-vote/republique.vote"
                rel="noopener noreferrer"
                target="_blank"
              >
                open source
              </a>
              , tout le monde peut le lire et le vérifier.
            </p>
          </div>
          <div className="border-border border-l-2 pl-4">
            <h3 className="mb-1 font-bold">Phase 2 : Votes consultatifs</h3>
            <p className="text-muted-foreground leading-relaxed">
              Les citoyens pourraient voter sur des projets de loi (les mêmes
              que les députés), des référendums citoyens, des consultations
              locales, ou n&apos;importe quel sujet de société. Ces votes
              n&apos;ont pas de valeur juridique, mais ils créent un miroir
              transparent de l&apos;opinion citoyenne. On verrait si les
              décisions des élus correspondent à ce que le peuple aurait voté.
              Aujourd&apos;hui ce miroir n&apos;existe pas.
            </p>
          </div>
          <div className="border-border border-l-2 pl-4">
            <h3 className="mb-1 font-bold">
              Phase 3 : Vote en ligne + bureau de vote
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Les citoyens votent en ligne. Grâce à un système de tag de
              révocation caché dans le bulletin, ceux qui veulent changer leur
              choix pourront aller voter en bureau de vote. Le vote physique
              annulera le vote en ligne, sans casser l&apos;anonymat. C&apos;est
              un problème de recherche cryptographique sur lequel on travaille
              activement.
            </p>
          </div>
          <div className="border-border border-l-2 pl-4">
            <h3 className="mb-1 font-bold">Phase 4 : Bornes en mairie</h3>
            <p className="text-muted-foreground leading-relaxed">
              Des bornes de vote en mairie, avec un isoloir physique, connectées
              au même système. Le meilleur des deux mondes :
              l&apos;accessibilité du vote en ligne et la protection de
              l&apos;isoloir physique.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-border border-t py-8">
        <h2 className="mb-6 font-bold text-2xl">Questions fréquentes</h2>
        <Accordion className="border border-border" collapsible type="single">
          {faqItems.map((item) => (
            <AccordionItem
              className="border-border border-b last:border-b-0"
              key={item.question}
              value={item.question}
            >
              <AccordionTrigger className="px-6 py-4 text-left font-bold hover:bg-accent/30 hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-muted-foreground leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </>
  );
}
