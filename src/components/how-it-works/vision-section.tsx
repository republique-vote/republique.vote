export function VisionSection() {
  return (
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
        : en France, on ne peut pas voter en ligne, et le dépouillement se fait
        sans que la plupart des citoyens n&apos;aient jamais de visibilité
        dessus.
      </p>
      <div className="max-w-3xl space-y-8">
        <div className="border-primary border-l-2 pl-4">
          <h3 className="mb-1 font-bold">Phase 1 : Proof of concept</h3>
          <p className="mb-1 text-muted-foreground text-sm">
            C&apos;est là où on en est.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            On prouve que c&apos;est techniquement possible de voter en ligne de
            manière anonyme, transparente et vérifiable. Les votes sur cette
            plateforme n&apos;ont aucune valeur officielle. Le code est{" "}
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
            Les citoyens pourraient voter sur des projets de loi (les mêmes que
            les députés), des référendums citoyens, des consultations locales,
            ou n&apos;importe quel sujet de société. Ces votes n&apos;ont pas de
            valeur juridique, mais ils créent un miroir transparent de
            l&apos;opinion citoyenne.
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
            annulera le vote en ligne, sans casser l&apos;anonymat.
          </p>
        </div>
        <div className="border-border border-l-2 pl-4">
          <h3 className="mb-1 font-bold">Phase 4 : Bornes en mairie</h3>
          <p className="text-muted-foreground leading-relaxed">
            Des bornes de vote en mairie, avec un isoloir physique, connectées
            au même système. Le meilleur des deux mondes : l&apos;accessibilité
            du vote en ligne et la protection de l&apos;isoloir physique.
          </p>
        </div>
      </div>
    </section>
  );
}
