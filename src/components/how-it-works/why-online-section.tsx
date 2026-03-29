export function WhyOnlineSection() {
  return (
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
              <strong className="text-foreground">erreurs</strong> : ce sont des
              personnes fatiguées qui comptent des papiers à la main tard le
              soir.
            </li>
            <li>
              Dans les petites communes, il y a parfois très peu de scrutateurs,
              ce qui rend le contrôle plus difficile.
            </li>
            <li>
              Il faut se{" "}
              <strong className="text-foreground">déplacer physiquement</strong>{" "}
              pour voter, ce qui exclut de fait de nombreux citoyens : personnes
              âgées, handicapées, malades, ou vivant loin de leur bureau de
              vote.
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-2 font-bold">Ce que le vote en ligne change</h3>
          <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed">
            <li>
              Le décompte est{" "}
              <strong className="text-foreground">mathématique</strong>, pas
              humain. N&apos;importe qui peut le vérifier depuis chez soi, sans
              faire confiance à personne.
            </li>
            <li>
              Les résultats sont visibles{" "}
              <strong className="text-foreground">en temps réel</strong> par
              tout le monde. Pas de comptage secret dans une salle fermée.
            </li>
            <li>
              Chaque vote est{" "}
              <strong className="text-foreground">lié au précédent</strong> par
              un calcul. Modifier un seul vote casserait toute la chaîne et tout
              le monde le verrait.
            </li>
            <li>
              Voter depuis{" "}
              <strong className="text-foreground">n&apos;importe où</strong>, à
              n&apos;importe quel moment pendant la période de vote. Plus besoin
              de se déplacer : les personnes âgées, handicapées ou malades
              peuvent voter depuis chez elles.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
