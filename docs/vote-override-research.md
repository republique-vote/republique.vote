# Recherche : comment annuler un vote en ligne anonyme ?

## Le problème

Un citoyen vote en ligne. Son vote est **anonyme** grace aux blind signatures : le serveur ne peut pas relier son identite a son vote.

Plus tard, le citoyen veut **annuler** son vote en ligne en allant voter en bureau de vote. Le vote physique doit ecraser le vote en ligne.

Mais comment retrouver et annuler un vote quand personne ne sait a qui il appartient ?

## Contraintes

1. **L'anonymat doit etre preserve.** Personne (ni le serveur, ni un attaquant) ne doit pouvoir relier un vote a une personne.
2. **Le votant doit pouvoir prouver qu'il a vote en ligne** pour pouvoir l'annuler.
3. **Personne d'autre ne doit pouvoir annuler le vote a sa place.**
4. **La coercition doit rester impossible.** Si quelqu'un peut forcer un votant a reveler son vote, le systeme est casse.
5. **Le registre public (Merkle tree) doit rester integre.** On ne peut pas juste "supprimer" une ligne du cahier sans casser la chaine de hash.

## Ce qui existe

### Estonie (en production depuis 2005)
- Le vote est chiffre mais l'identite reste collee dessus pendant la periode de vote
- L'anonymat n'arrive qu'APRES la periode d'ecrasement
- Probleme : si la base est compromise pendant le vote, on sait qui a vote quoi

### Norvege (essais 2011-2013, abandonne)
- Meme approche que l'Estonie
- Abandonne car les politiques n'avaient pas confiance

### VoteAgain (USENIX 2020)
- Utilise des identifiants chiffres + shuffle verifiable
- Necessite un "Tally Server" de confiance separe
- Complexe

### Nullifier (Semaphore/Vocdoni)
- Le votant genere un identifiant deterministe `Hash(secret, electionId)`
- Permet de retrouver le vote sans reveler l'identite
- Necessite des zero-knowledge proofs (zk-SNARKs)

### Homomorphic subtraction
- Ajouter un "anti-vote" qui annule mathematiquement le premier
- Necessite de changer toute l'architecture vers du chiffrement homomorphe

### Commitment-based (cancellation secret)
- Le votant recoit un code d'annulation au moment du vote
- Pour annuler, il presente ce code en mairie
- Probleme : ca cree une preuve de vote (coercition possible)

## Approches explorees et rejetees

### Double cle (identityHash + token)
- Stocker un hash de l'identite dans le voteRecord
- Probleme : les hash sont recalculables si la liste des userId est connue → anonymat casse

### Code d'annulation simple
- Donner un code secret au votant
- Probleme : si quelqu'un vole le code, il peut annuler le vote

### Code d'annulation + token
- `cancellationHash = Hash(cancellationSecret + blindToken)`
- Faut les deux pour annuler
- Probleme : en mairie le choix du vote est revele, ca cree une preuve, coercition possible

## Questions ouvertes

- Est-il possible de marquer un vote comme "annule" dans un Merkle tree sans casser la chaine ?
- Peut-on prouver qu'on possede un vote sans reveler LEQUEL via un zero-knowledge proof ?
- Existe-t-il un mecanisme ou le vote annule est remplace par un "trou" neutre dans le decompte ?
- Peut-on separer le "droit d'annuler" du "contenu du vote" de maniere cryptographique ?
- Et si l'annulation ne modifiait pas le registre en ligne mais creait un registre parallele en bureau de vote qui est fusionne au decompte final ?

## Pistes a explorer

### 1. Registre parallele
Et si le bureau de vote avait son propre registre (physique), et que le decompte final = registre en ligne - les annulations + registre physique ? Le registre en ligne n'est jamais modifie, on ajoute juste une couche par-dessus.

**Analyse :** On sait COMBIEN de votes en ligne retirer (grace a la liste d'emargement physique croisee avec blindSignatureRequest), mais pas LESQUELS. On ne peut donc pas retirer par option. Le decompte final est mathematiquement impossible sans savoir quels votes en ligne correspondent aux personnes qui se sont deplacees.

**Verdict :** Impasse. Le probleme fondamental reste : sans lien identite → vote, on ne peut pas retirer les bons votes du decompte par option.

### 2. Zero-knowledge proof d'appartenance
Le votant prouve "je possede un des votes dans cette liste" sans dire lequel. Comme Tornado Cash mais pour des votes. Necessite des zk-SNARKs.

**Analyse :** Le ZK proof pourrait aller plus loin que juste prouver l'appartenance. Il pourrait aussi reveler le CHOIX du vote (l'optionId) sans reveler la ligne dans le registre. Comme ca on ajuste le decompte par option sans toucher au registre. Le Merkle tree reste intact.

Resultat final = compteur du registre - ajustements ZKP + votes physiques.

**Avantages :** Le registre n'est jamais modifie. L'anonymat est preserve (on ne sait pas quelle ligne). Cryptographiquement solide.

**Inconvenients :** Necessite zk-SNARKs (Circom/snarkjs) — complexe a implementer. Le votant doit garder son blindToken. Le votant revele son choix en bureau de vote (acceptable car il le remplace). Risque de coercition sur le ZK proof (mais le votant peut toujours ecraser en physique apres).

**Verdict :** Prometteur mais techniquement lourd. A garder comme solution long terme.

### 3. Vote "enveloppe dans l'enveloppe"
Le vote en ligne contient le choix DANS une couche de chiffrement supplementaire. Le choix n'est dechiffre qu'au moment du decompte final. Pendant la periode de vote, personne ne connait le contenu. L'annulation supprime l'enveloppe exterieure sans jamais ouvrir l'interieure.

### 4. Systeme a deux autorites independantes
- Autorite A : connait les identites, ne connait pas les votes
- Autorite B : connait les votes, ne connait pas les identites
- L'annulation necessite la cooperation des deux, mais aucune des deux n'a le tableau complet

### 5. Le vote en ligne est toujours "provisoire"
Et si le vote en ligne n'etait jamais final ? Il ne compte que si le citoyen ne se deplace pas en bureau de vote. Au decompte, on prend : votes physiques + votes en ligne des gens qui ne se sont PAS deplaces. L'identification se fait par la liste d'emargement du bureau de vote, pas par le contenu du vote.

## Piste prometteuse : systeme a deux registres + cle citoyen

### Le concept

Trois entites qui ne doivent JAMAIS collaborer :
- **Serveur vote** (heberge le registre public) : connait les votes + publicLinkKey, mais pas les identites
- **Serveur identite** (entite separee, ex: l'Etat) : connait les identites + privateLinkKey, mais pas les votes
- **Bureau de vote** (assesseurs) : recoit le citizenSecret le jour du vote physique, mais n'a acces a aucun des deux registres

### Les registres

- **Registre Vote** (public) : `{ voteId, optionId, blindToken, blindSignature, hash, previousHash, publicLinkKey }`
- **Registre Identite** (entite separee) : `{ userId, privateLinkKey }`
- **Le citoyen** detient : `citizenSecret` (genere au moment du vote en ligne)

### Le lien

`publicLinkKey = Hash(privateLinkKey + Hash(citizenSecret))`

- Le public voit `publicLinkKey` → inutile sans les deux autres pieces
- Le serveur identite a `privateLinkKey` → inutile sans `citizenSecret`
- Le bureau de vote recoit `citizenSecret` → inutile sans `privateLinkKey`
- Seul le croisement de deux entites permet de retrouver le vote

### Flow d'annulation

1. Pendant la periode en ligne : les gens votent normalement
2. Le jour du vote physique : les citoyens vont au bureau de vote, donnent leur `citizenSecret` a l'assesseur, votent sur papier
3. Apres la cloture : le bureau de vote envoie la liste d'emargement avec `Hash(citizenSecret)` au serveur identite (PAS le citizenSecret en clair)
4. Le serveur identite calcule `Hash(privateLinkKey + Hash(citizenSecret))` = `publicLinkKey`
5. Il publie la liste des `publicLinkKey` a annuler (sans reveler les identites)
6. Le serveur vote marque ces votes comme annules dans le decompte

### Probleme : qui heberge quoi ?

Pour que la separation fonctionne, il faut que le serveur vote et le serveur identite soient des **entites independantes**.

**Scenarios d'hebergement :**
1. L'Etat host tout → pas de separation, une seule entite a tout
2. Nous on host le vote, l'Etat gere l'identite → l'Etat ne reconnaitra pas un systeme heberge par un tiers
3. Plusieurs entites independantes → serveur vote (asso/nous), serveur identite (Etat/FranceConnect), bureaux de vote (mairies). Personne n'a le tableau complet.
4. Decentralise → registre vote sur blockchain publique, identite chez l'Etat, aucun serveur central

**Pour le POC** : on est l'hebergeur unique (serveur vote + serveur identite). On assume cette limite. L'architecture est concue pour etre distribuable plus tard.

**A terme** : une autorite independante (type CNIL/ARCOM) pourrait superviser le systeme, avec une separation reelle entre les entites.

### Failles identifiees

- Si le bureau de vote leak le `citizenSecret` au serveur identite → le serveur identite peut retrouver le vote. Parade : le bureau de vote envoie seulement `Hash(citizenSecret)`, jamais le secret en clair.
- Si le serveur vote et le serveur identite sont la meme entite → la separation ne tient pas. C'est le cas du POC.
- Le serveur identite au moment de l'annulation peut retrouver le vote dans le registre public et voir le choix. C'est acceptable car ces votes sont ecrases de toute facon.

## Reflexion : hebergement et integrite des donnees

### Le probleme

Si une seule entite heberge le serveur (nous, l'Etat, un cloud provider), cette entite est un point de defaillance unique. Piratage, pression politique, faillite → tout est compromis.

### Solutions d'hebergement

1. **Classique (Vercel/Railway/AWS)** : simple, rapide, mais une seule entite controle tout. C'est le POC.
2. **IPFS/Filecoin** : donnees repliquees sur des centaines de noeuds. Impossible a censurer. Mais c'est du stockage statique, pas une API.
3. **Arweave** : stockage permanent. Une fois ecrit, c'est la pour toujours. Parfait pour le registre vote (immutable).
4. **Noeuds auto-heberges** : n'importe qui lance une copie du serveur (open source). Si un tombe, les autres continuent. Necessite un mecanisme de consensus.
5. **Federation** : plusieurs orgas independantes (assos, universites, collectivites) hebergent chacune un noeud. Synchronisation entre eux. Si un tombe, les autres continuent.

### Comment les donnees ne sont pas perdues

- Le registre vote est **public** → n'importe qui peut en garder une copie
- Le Merkle tree garantit que personne ne peut modifier une copie sans que ca se voie
- Les votes sont dans le registre public, meme si la BDD SQL est perdue les votes sont sauves

### Comment les donnees ne sont pas compromises

- Le Merkle tree : si quelqu'un modifie un vote, le hash chain casse et tout le monde le voit
- La replication : si un noeud est compromis, les autres ont la bonne version
- Les blind signatures : meme si la BDD est compromise, l'anonymat est preserve

### Strategie progressive

- **POC** : hebergement classique (Vercel/Railway). On assume le risque.
- **Phase suivante** : publier le registre vote sur IPFS apres chaque vote (copie immutable publique)
- **Long terme** : federation de noeuds heberges par des entites independantes + registre sur blockchain L2 pour la preuve d'integrite

## Conclusion : résultat de la recherche

### Le théorème fondamental

Dans un modèle de signature aveugle + cahier anonyme pur (notre modèle actuel), l'annulation exacte d'un vote est **mathématiquement impossible**.

Preuve par contre-exemple : deux électeurs (p, q), deux votes anonymes publiés (A, B). Deux mondes sont indistinguables publiquement : (f(p)=A, f(q)=B) ou (f(p)=B, f(q)=A). Si on doit annuler le vote de p, on ne sait pas s'il faut retirer A ou B. Aucun algorithme ne peut être correct dans les deux mondes sans information supplémentaire.

**En clair : si personne ne sait à qui appartient un vote, personne ne peut retrouver le bon vote à annuler.**

### La sortie : le lien latent

Pour rendre l'annulation possible, il faut accepter un **lien latent** — une information cachée dans le bulletin dès l'origine, invisible publiquement, utilisable uniquement si le votant déclenche l'annulation.

La construction la plus solide :
1. Le vote contient un **choix chiffré** + un **tag de révocation caché** dérivé du secret du votant
2. En bureau de vote, le votant fournit son secret
3. Un **comité de trustees** (plusieurs entités indépendantes) retrouve le bulletin correspondant via des tests d'égalité chiffrés, **sans révéler quelle ligne du cahier**
4. Ils calculent un **vecteur d'annulation chiffré** ajouté au décompte
5. Résultat final = votes en ligne − annulations + votes papier
6. Le cahier public n'est jamais modifié (append-only)

Nécessite : preuves à divulgation nulle (ZK), chiffrement homomorphe ou MPC, comité de trustees distribué.

### Décision pour le POC

**Le vote en ligne est définitif.** Comme la Suisse, on ne permet pas l'annulation du vote en ligne. C'est le seul choix honnête tant qu'on n'a pas implémenté le système de tag de révocation.

L'architecture de tag de révocation caché + annulation homomorphe vérifiable est documentée et prévue comme objectif long terme. Elle nécessite :
- Modifier la structure du bulletin pour inclure le tag chiffré
- Implémenter les preuves ZK de validité
- Mettre en place un comité de trustees distribué
- Modifier le processus de décompte pour intégrer les ajustements

### Les trois options possibles

| Option | Principe | Anonymat | Annulation | Complexité |
|--------|----------|----------|------------|------------|
| **A. Tag de révocation** | Lien latent caché + ZK + trustees | Préservé | Oui | Très élevée |
| **B. Anonymat différé (Estonie)** | Identité liée au vote pendant la période | Risqué pendant le vote | Oui | Moyenne |
| **C. Pas d'annulation (Suisse)** | Vote en ligne définitif | Parfait | Non | Zéro |

**Choix POC : option C.** Objectif long terme : option A.

## Notes
- La tension fondamentale : anonymat parfait vs capacité d'annulation. Les deux simultanément sans lien latent est mathématiquement impossible.
- L'Estonie accepte un compromis (anonymat différé). La Norvège a refusé ce compromis et a abandonné.
- La Suisse contourne le problème en interdisant le vote physique après un vote électronique.
- La vraie question n'est pas "est-ce possible ?" mais : **quel lien latent accepte-t-on de conserver, chez qui, jusqu'à quand, et sous quelle hypothèse de non-collusion ?**
