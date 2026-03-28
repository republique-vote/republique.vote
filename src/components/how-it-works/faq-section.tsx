import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

export function FaqSection() {
  return (
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
  );
}
