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

- **Frontend.** [Next.js](https://nextjs.org) + [DSFR](https://www.systeme-de-design.gouv.fr/) via [`@codegouvfr/react-dsfr`](https://github.com/codegouvfr/react-dsfr)
- **Base de données.** PostgreSQL pour les données classiques (utilisateurs, votes, métadonnées)
- **Authentification.** [FranceConnect](https://franceconnect.gouv.fr/) (sandbox en développement)
- **Bulletin board public.** Log append-only avec Merkle tree pour les votes. Chaque vote est chiffré, signé et publié publiquement. L'intégrité est vérifiable par tous, sans faire confiance à un serveur central.

## Architecture

### Authentification

**FranceConnect** pour vérifier l'identité du citoyen (identité certifiée par l'État).

### Anonymat + Transparence : vote vérifiable de bout en bout (E2E)

Le gros défi du vote électronique : prouver que le décompte est correct **sans** pouvoir relier un vote à une personne.

1. **Inscription.** FranceConnect authentifie le citoyen, puis le système lui délivre un **jeton cryptographique anonyme** via un mécanisme de "blind signature". Le système sait qu'un citoyen éligible a reçu un jeton, mais **ne peut pas relier le jeton à l'identité**.

2. **Vote.** Le citoyen utilise son jeton anonyme pour voter. Le vote est chiffré et publié sur le **bulletin board public** (registre ouvert, consultable par tous).

3. **Dépouillement.** Les votes sont déchiffrés collectivement (via plusieurs autorités indépendantes) et le résultat est publié. **N'importe qui** peut vérifier mathématiquement que le décompte correspond aux votes chiffrés.

4. **Vérification individuelle.** Chaque votant peut vérifier que son vote a bien été comptabilisé, sans pouvoir prouver à un tiers pour qui il a voté.

### Sécurité des votes

Les votes ne sont pas stockés dans une base de données classique. Ils sont publiés sur un **log append-only** où chaque entrée est hashée avec la précédente (Merkle tree). Même en cas de compromission du serveur :

- Les votes sont **chiffrés** (illisibles sans les clés de dépouillement)
- Impossible d'en **ajouter** de faux (pas de blind signature valide)
- Impossible d'en **supprimer** (le registre est public et vérifiable par tous)

## Roadmap

### Phase 1 — Fondations
- [x] Initialiser le projet Next.js + DSFR
- [x] Intégrer FranceConnect (mock local, en attente d'habilitation pour la sandbox officielle)
- [x] Modéliser la base de données (SQLite en dev, PostgreSQL en prod)
- [x] Concevoir le système de blind signatures

### Phase 2 — Vote MVP
- [ ] Créer un vote avec N options
- [ ] Implémenter le bulletin board public (log append-only + Merkle tree)
- [ ] Chiffrement et soumission des votes
- [ ] Page de résultats en temps réel

### Phase 3 — Transparence & Vérification
- [ ] Dépouillement vérifiable (preuves cryptographiques)
- [ ] Vérification individuelle ("mon vote a bien été compté")
- [ ] Explorateur public du bulletin board

### Phase 4 — Contenu réel
- [ ] Intégration de l'API de l'Assemblée Nationale / Sénat
- [ ] Synchronisation automatique des projets de loi et votes
- [ ] Notifications aux citoyens

### Phase 5 — Confiance distribuée
- [ ] Dépouillement distribué (plusieurs autorités indépendantes)
- [ ] Ancrage du Merkle root sur une blockchain publique (optionnel)
- [ ] Audit de sécurité externe

## Site

[republique.vote](https://republique.vote)

## Auteur

Projet open source porté par [Antoine Kingue](https://github.com/antoinekm).

## Licence

À définir.
