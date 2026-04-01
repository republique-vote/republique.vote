# republique.vote

Plateforme de vote en ligne transparente pour les citoyens français.

## Le problème

1. **Pas de vote en ligne en France.** En 2026, il est toujours impossible de voter en ligne pour les élections et référendums. Le seul moyen est de se déplacer physiquement dans un bureau de vote.

2. **Aucune transparence sur le dépouillement.** Le processus de dépouillement est réalisé par un petit nombre de personnes. En théorie, chaque citoyen peut y assister. En pratique, quasi personne ne le fait et n'a jamais eu de visibilité sur ce processus.

## La vision

Un **proof of concept 100% fonctionnel** qui ambitionne de **compléter le vote officiel**, pas de le remplacer.

L'idée à terme : chaque projet de loi proposé par les députés, chaque référendum, chaque décision publique, les citoyens français peuvent voter dessus directement. Une démocratie directe, numérique, transparente.

### Principes fondamentaux

- **Transparence totale.** N'importe qui peut vérifier mathématiquement que le décompte est correct, sans se déplacer
- **Anonymat du vote.** Impossible de relier un vote à une personne
- **Vérification individuelle.** Chaque votant peut vérifier que son vote a bien été pris en compte
- **Anti-coercition.** Impossible de prouver à un tiers pour qui on a voté

## Stack technique

- **Frontend.** [Next.js](https://nextjs.org) + [Shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/). Design inspiré du [DSFR](https://www.systeme-de-design.gouv.fr/) mais avec des composants libres (Radix + Tailwind) pour des raisons légales. Initialement basé sur le [template Next App Router du DSFR](https://github.com/codegouvfr/react-dsfr/tree/main/test/integration/next-appdir), une migration vers le DSFR officiel serait possible en cas d'habilitation
- **Base de données.** PostgreSQL pour les données classiques (utilisateurs, votes, métadonnées)
- **Authentification.** [FranceConnect](https://franceconnect.gouv.fr/) (sandbox en développement)
- **Bulletin board public.** Log append-only avec Merkle tree pour les votes. Chaque vote est signé et publié publiquement. L'intégrité est vérifiable par tous, sans faire confiance à un serveur central
- **Transparence externe.** Chaque empreinte du cahier est publiée sur [Sigstore Rekor](https://docs.sigstore.dev/logging/overview/) (immédiat) et sur un [dépôt GitHub public](https://github.com/republique-vote/merkle-proofs) (batch toutes les 30s)

## Architecture

### Authentification

**FranceConnect** pour vérifier l'identité du citoyen (identité certifiée par l'État).

### Concept

Tout le monde peut vérifier que les résultats sont bons, mais personne ne peut savoir qui a voté quoi.

**Comment ça marche :**

1. **Vous vous connectez.** Vous prouvez qui vous êtes avec FranceConnect (le même système que pour les impôts ou la CAF). Le système sait que vous avez le droit de voter.

2. **Vous recevez un code secret.** Le système vous donne un code secret unique (techniquement : une "blind signature"). Ce code prouve que vous avez le droit de voter, mais il est **impossible de savoir à qui il appartient**. Imaginez : on vérifie votre identité à l'entrée, puis on vous donne un code sans nom. Une fois que vous l'avez, plus aucun lien entre vous et ce code. Tout ça se passe automatiquement en arrière-plan quand vous cliquez sur "Voter".

3. **Vous votez.** Vous utilisez votre code secret pour envoyer votre choix. Votre vote est affiché publiquement sur une liste ouverte que tout le monde peut voir. Les résultats bougent en direct.

4. **Vous vérifiez.** Après avoir voté, vous pouvez vérifier que votre vote est bien dans la liste. Mais vous ne pouvez pas prouver à quelqu'un d'autre ce que vous avez voté (donc personne ne peut vous forcer à voter d'une certaine façon).

**Pourquoi tout le monde voit les résultats en direct ?**

Parce que c'est tout le principe. Pas de comptage secret dans une salle fermée. Pas de "faites-nous confiance". Tout est visible, tout le temps, par tout le monde.

**Pourquoi les votes ne sont pas cachés ?**

Cacher les votes voudrait dire cacher les résultats. On fait l'inverse : tout est ouvert. Ce qui est protégé, c'est votre identité, pas votre choix. On sait qu'il y a un vote "Pour", mais on ne sait pas que c'est vous.

**Qu'est-ce qui empêche de tricher ?**

Imaginez un cahier public posé sur une table, que tout le monde peut lire. À chaque vote, une nouvelle ligne est écrite dans le cahier. Chaque ligne contient un code spécial qui dépend de toutes les lignes précédentes. Si quelqu'un essaie de modifier une ancienne ligne ou d'en arracher une, le code des lignes suivantes ne correspond plus et tout le monde voit qu'il y a eu une fraude.

Ce "cahier" (techniquement : un "Merkle tree") est téléchargeable par n'importe qui. Vous pouvez le vérifier vous-même sur votre ordinateur.

Même si quelqu'un pirate le serveur :

- Impossible d'**inventer** de faux votes (il faudrait un code secret valide, et même le serveur ne peut pas en fabriquer après coup)
- Impossible d'**effacer** des votes (le cahier est public, tout le monde peut le vérifier)
- Impossible de **modifier** un vote (le code de toutes les lignes suivantes changerait)
- Impossible de **savoir** qui a voté quoi (le code secret est anonyme)

**Comment on prouve qu'on ne triche pas ?**

En plus du cahier public, l'empreinte du cahier est envoyée automatiquement à deux endroits qu'on ne contrôle pas :

1. **Le notaire (Sigstore).** À chaque vote, l'empreinte est envoyée à [Sigstore](https://docs.sigstore.dev/logging/overview/), un service public et gratuit géré par la Linux Foundation (Google, Red Hat, GitHub...). Le notaire tamponne et horodate l'empreinte. Une fois tamponné, personne ne peut modifier ou effacer cette ligne. Ni nous, ni le notaire. Vérifiable par n'importe qui sur [search.sigstore.dev](https://search.sigstore.dev).

2. **Le tableau public (GitHub).** Toutes les 30 secondes, l'empreinte est aussi affichée sur un [tableau public sur GitHub](https://github.com/republique-vote/merkle-proofs). C'est comme un panneau d'affichage dans la rue : n'importe qui peut le lire, personne ne peut effacer ce qui a déjà été écrit, et chaque mise à jour est datée.

3. **L'observateur citoyen.** N'importe qui peut lancer un petit programme gratuit (`npx @republique/observer`) qui surveille tous les votes en temps réel, vérifie chaque bulletin indépendamment et en garde une copie locale. Pas besoin de nous faire confiance : vous vérifiez tout vous-même, depuis votre ordinateur. [Code source](https://github.com/republique-vote/republique.vote/tree/main/packages/observer).

**Pourquoi je ne peux pas changer mon vote en ligne ?**

Pour retrouver votre ancien vote et le remplacer, le système devrait pouvoir relier votre identité à votre vote. Ça casserait l'anonymat. Donc le vote en ligne est **définitif**. Si vous voulez changer d'avis, vous pouvez aller voter en bureau de vote (ou en mairie sur une borne) : le vote physique écrase le vote en ligne.

### Et si quelqu'un me force à voter ?

C'est le problème le plus difficile du vote en ligne. Aucun pays au monde ne l'a résolu avec une solution 100% en ligne. Mais une solution existe.

**Le principe : le vote en bureau de vote annule toujours le vote en ligne.**

1. Vous pouvez voter en ligne quand vous voulez pendant la période de vote
2. Le jour du vote, si vous allez au bureau de vote, votre vote physique **écrase tout** ce que vous avez fait en ligne
3. Si vous n'allez pas au bureau de vote, votre dernier vote en ligne compte

**Pourquoi ça protège :**

| Situation | Ce qui se passe |
|-----------|----------------|
| Quelqu'un vous force à voter en ligne devant lui | Vous allez au bureau de vote, vous votez ce que VOUS voulez dans l'isoloir. Le vote physique écrase le vote en ligne. |
| On vous force à voter à la dernière seconde en ligne | Le vote physique a lieu APRÈS la clôture en ligne. Vous pouvez encore tout annuler au bureau de vote. |
| On vous demande une preuve de votre vote | Vous montrez votre vote en ligne. Mais l'autre personne sait que vous avez pu aller au bureau de vote et voter autre chose. Votre "preuve" ne vaut rien. |
| Quelqu'un vous paie pour voter | Vous prenez l'argent, vous montrez votre vote en ligne, puis vous allez voter ce que vous voulez au bureau de vote. |
| Quelqu'un vous séquestre | C'est un crime (séquestration). Ça relève de la police, pas de la technologie. Aucun système de vote ne peut protéger contre ça. |

**Limite actuelle : le vote en ligne est définitif.** L'anonymat total du vote rend mathématiquement impossible l'annulation d'un vote anonyme sans information supplémentaire cachée dans le bulletin. C'est prouvé : si personne ne sait à qui appartient un vote, personne ne peut retrouver le bon vote à annuler. C'est le même choix que la Suisse.

**À terme :** un système permettrait d'annuler un vote sans que personne ne puisse savoir de quel vote il s'agit. Le bulletin contiendrait dès l'origine une information chiffrée, invisible publiquement, utilisable uniquement par le votant pour déclencher l'annulation. C'est un problème de recherche actif, documenté dans [docs/vote-override-research.md](docs/vote-override-research.md).

## Roadmap

### Phase 1 — Fondations
- [x] Initialiser le projet Next.js + DSFR
- [x] Intégrer FranceConnect (mock local, en attente d'habilitation pour la sandbox officielle)
- [x] Modéliser la base de données (PostgreSQL)
- [x] Concevoir le système de blind signatures

### Phase 2 — Vote MVP
- [x] Créer un vote avec N options
- [x] Soumission anonyme des votes via blind signatures
- [x] Page de résultats en temps réel (SSE via Redis Pub/Sub)
- [x] Implémenter le bulletin board public (log append-only + Merkle tree)

### Phase 3 — Identité & Publication
- [x] Remplacer le DSFR par un design system libre (Shadcn/ui + Tailwind)
- [x] Retirer le logo Marianne et la font gouvernementale
- [x] Ajouter un disclaimer clair sur chaque page ("Ceci n'est pas un service gouvernemental")
- [x] Page "Comment ça marche" (explication du fonctionnement, schémas, choix techniques)

### Phase 4 — Transparence & Vérification
- [x] Vérification individuelle ("mon vote a bien été compté")
- [x] Explorateur public du bulletin board (tableau paginé, vérification client-side via Web Crypto API)
- [x] Flux SSE public du cahier de vote (chaque vote diffusé en temps réel aux observateurs)
- [x] Flux RSS du cahier de vote (chaque vote = une entrée, compatible avec n'importe quel lecteur RSS)
- [x] Export du registre complet en JSON/CSV

### Phase 5 — Publication & Identité visuelle
- [x] Ajouter la licence AGPL-3.0 (le code doit rester open source, y compris pour les déploiements SaaS)
- [x] Favicon et métadonnées Open Graph
- [x] Preuve de vote visuelle (image générée avec numéro, empreinte, jeton, date — permet de retrouver et vérifier son vote plus tard)
- [x] PostgreSQL + Redis managés sur Railway
- [x] Déployer sur Railway + configurer republique.vote (DNS, certificat)
- [x] CI/CD (GitHub Actions : lint + build)

### Phase 6 — Observateurs & Confiance distribuée
- [x] CLI open source (`npx @republique/observer`) pour surveiller les votes en temps réel et stocker une copie locale
- [x] Publication automatique du Merkle root sur Sigstore Rekor (transparency log) + GitHub (batch)

### Phase 7 — Contenu réel
- [x] Intégration de l'API de l'Assemblée Nationale (data.assemblee-nationale.fr)
- [x] Synchronisation automatique des projets/propositions de loi (cron 6h)
- [x] Matching automatique des scrutins officiels avec les polls citoyens
- [x] Comparatif visuel citoyens vs députés
- [x] Exposé des motifs extrait du HTML AN et affiché en markdown
- [x] Pagination, tri (récents / plus votés) et filtre par type (Lois / Référendums / Élections)
- [x] SSR de la première page de polls (pas de spinner au premier chargement)
- [x] Migration des fetches client vers SWR (cache, déduplication, SSE via useSWRSubscription)

### Phase 8 — SEO & Référencement
- [x] Metadata dynamiques par poll (title, description, Open Graph)
- [ ] Sitemap XML dynamique (`/sitemap.xml`) avec tous les polls
- [ ] Robots.txt optimisé
- [ ] Données structurées JSON-LD (VoteAction, GovernmentOrganization)
- [ ] Canonical URLs
- [x] Meta description des polls via l'exposé des motifs (texte brut tronqué)
- [ ] Pages statiques ISR pour les polls terminés (cache long)

### Phase 9 — Scalabilité
- [ ] Exports en streaming (écriture ligne par ligne, pas de chargement mémoire complet)
- [x] Vérification de chaîne paginée côté client (vérifier page par page au lieu de tout télécharger)
- [x] Supprimer le paramètre `?all=true` et migrer vers du streaming/pagination partout
- [ ] Restructurer en monorepo propre (`apps/web`, `packages/core`, `packages/observer`) + Turborepo
- [ ] Publier les packages sur npm (`@republique/core`, `@republique/observer`) + changesets pour le versioning

### Phase 10 — Annulation de vote (recherche)
- [ ] Tag de révocation caché dans le bulletin (choix chiffré + tag dérivé du secret votant)
- [ ] Preuves à divulgation nulle (ZK) de validité du bulletin
- [ ] Comité de trustees distribué pour le matching chiffré
- [ ] Ajustement homomorphe vérifiable du décompte (sans révéler la ligne annulée)
- [ ] Documentation complète du protocole : [docs/vote-override-research.md](docs/vote-override-research.md)

### Phase 11 — Sécurité & Audit
- [ ] Build reproductible + déploiement signé (GitHub Actions + Sigstore) pour prouver que le code en prod = le code sur GitHub
- [ ] Dépouillement distribué (plusieurs autorités indépendantes)
- [ ] Ancrage du Merkle root sur une blockchain publique (Ethereum L2 ou Bitcoin OP_RETURN)
- [ ] Audit de sécurité externe

### Phase 12 — Engagement citoyen
- [ ] Notifications aux citoyens (nouveau texte déposé, résultat officiel, fin de vote)
- [ ] Intégration du Sénat (data.senat.fr) — textes déposés uniquement au Sénat, faible priorité

### Phase 13 — Applications natives
- [ ] App desktop (Tauri) pour les non-devs : interface visuelle, surveillance en tâche de fond, alertes en cas d'anomalie
- [ ] App mobile avec notifications push à chaque nouveau vote

## Site

[republique.vote](https://republique.vote)

## Auteur

Projet open source porté par [Antoine Kingue](https://github.com/antoinekm).

## Licence

[AGPL-3.0](LICENSE) — Une plateforme de vote doit être vérifiable par tous. Si quelqu'un déploie sa propre instance de republique.vote, les citoyens doivent pouvoir lire le code qui compte leurs votes. L'AGPL-3.0 garantit que le code reste ouvert, même quand il tourne sur un serveur distant.
