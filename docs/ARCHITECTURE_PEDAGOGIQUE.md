# Architecture pédagogique de LearnWard (prototype v8)

Ce document explique comment le prototype organise les programmes, la progression de la classe, les séances et la
maîtrise, d'où viennent les contenus, et comment en ajouter. Il est écrit pour la personne qui reprendra le code
comme pour l'enseignant qui relira les contenus.

## 1. Trois couches qui ne se mélangent pas

| Couche | Ce que c'est | Où | Qui la fournit |
| --- | --- | --- | --- |
| **Programme national** | Versions officielles des programmes, découpées en unités (thèmes, notions) et en objectifs | `src/lib/curriculum/` | Bulletin officiel, Éduscol |
| **Progression de la classe** | Ordre réel des chapitres et chapitre en cours, matière par matière | `progress` dans l'état, `src/lib/curriculum/progression.ts` | L'ENT (simulé en 3e) ou l'élève |
| **Profil d'apprentissage** | Traces (réponses, aide reçue), états de maîtrise, rappels | `evidence`, `reviews`, `src/lib/learning/` | Calculé par LearnWard |

La cagnotte (`src/lib/rewards.ts`) est un quatrième module, volontairement séparé : les points récompensent la
régularité, **jamais** la maîtrise. Aucune fonction de maîtrise ne lit les points. Les séances elles-mêmes ne
mentionnent ni partenaire, ni cashback, ni cagnotte (vérifié par les tests) : les exercices partenaires sont des
variantes rangées à part (`src/lib/content/sponsored.ts`, section 7).

## 2. Programmes officiels versionnés

`src/lib/curriculum/sources.ts` contient le registre des textes : titre, référence de publication, adresse
officielle, matières, **dates d'application par niveau** (`from`, `until`), date de vérification, sources de
recoupement et statut. `sourceFor(niveau, matière, rentrée)` choisit la version en vigueur : en 3e, les maths
suivent le programme de 2020 en 2026-2027, puis celui du BO n° 10 du 5 mars 2026 à la rentrée 2028. Changer d'année
scolaire ne demande donc aucune modification de code.

Les unités (`units-college.ts`, `units-lycee.ts`, et `units-2026.ts` pour les programmes entrés en vigueur depuis
2024 : langues vivantes, EMC, LCA, EPPCS, arts plastiques de spécialité) reprennent les intitulés des programmes. Leur ordre est **indicatif** :
il n'est jamais présenté comme celui du professeur.

### Statuts de vérification

| Statut | Sens | Affiché |
| --- | --- | --- |
| `verified_official` | Texte officiel lu en entier, sur le site du ministère ou dans une copie intégrale citée (`checkedWith`) | « Texte officiel lu » |
| `cross_checked` | Référence officielle identifiée, contenu recoupé avec une source académique ou éditoriale | « Recoupé » |
| `needs_review` | Structure plausible, à relire dans le texte officiel avant publication | « À relire » |
| `illustrative_mock` | Contenu fictif de démonstration | « Fictif » |
| `extension_not_required` | Approfondissement hors des attendus | « Hors attendus » |

Quatre textes sont `verified_official` : langues vivantes 2025, technologie du cycle 4, langues et cultures de
l'Antiquité au collège, EPPCS. Les pages du BO sur education.gouv.fr ne s'ouvrent pas depuis l'environnement du
prototype ; leur texte intégral a été lu dans une copie publiée par une académie, un site disciplinaire ou un
syndicat, citée dans `checkedWith`. Tout le reste est au mieux « Recoupé ». **Avant une mise en production, chaque
source doit être relue sur le site du BO** et son statut mis à jour.

Une source `verified_official` ne rend pas automatiquement ses unités « Texte officiel lu » : en langues vivantes, par
exemple, le texte est lu mais la répartition des points de grammaire par langue et par niveau est une proposition de
LearnWard, donc les unités restent « Recoupé ».

### Sources consultées (30 octobre 2026)

| Texte | Référence | Application en 2026-2027 | Statut |
| --- | --- | --- | --- |
| Français et mathématiques, cycle 3 | Arrêté du 10 avril 2025, BO n° 16 du 17 avril 2025 | 6e depuis 2025 | Recoupé |
| Cycle 3, version consolidée | BO n° 31 du 30 juillet 2020 | 6e (HG, sciences, arts, musique, EPS) jusqu'en 2027 | Recoupé |
| Langues vivantes, cycles 3 et 4 et lycée | Arrêté du 5 mai 2025, BO n° 22 du 29 mai 2025 | 6e et 2nde depuis 2025 ; 5e, 1re, Tle en 2026 ; 4e en 2027 ; 3e en 2028 | Texte officiel lu |
| EMC, de l'école au lycée | Arrêté du 29 mai 2024, BO n° 24 du 13 juin 2024 | 5e et 2nde 2024 ; 4e et 1re 2025 ; 6e, 3e et Tle 2026 | Recoupé |
| Français et mathématiques, cycle 4 (nouveau) | Arrêté du 18 février 2026, BO n° 10 du 5 mars 2026 | 5e 2026, 4e 2027, 3e 2028 | Recoupé |
| Cycle 4, version consolidée | BO n° 31 du 30 juillet 2020 | 5e, 4e, 3e (français et maths jusqu'au nouveau programme) | Recoupé |
| Technologie, cycle 4 | BO n° 9 du 29 février 2024 | 5e 2024, 4e 2025, 3e 2026 | Texte officiel lu |
| Langues et cultures de l'Antiquité, cycle 4 | Arrêté du 8 février 2016, BO n° 11 du 17 mars 2016 | 5e, 4e, 3e | Texte officiel lu |
| Seconde GT et première générale | BO spécial n° 1 du 22 janvier 2019 | 2nde, 1re (dont LCA, LLCA, arts plastiques) | Recoupé |
| Mathématiques de seconde | Arrêté du 26 février 2026, BO n° 14 du 2 avril 2026 | 2nde 2026 | Recoupé |
| Mathématiques de 1re sans spécialité | BO n° 27 du 7 juillet 2022 (source secondaire) | 1re | À relire |
| EPPCS (spécialité) | Arrêté du 2 juin 2021, BO n° 25 du 24 juin 2021 | 1re 2021, Tle 2022 | Texte officiel lu |
| Terminale générale | BO spécial n° 8 du 25 juillet 2019 | Tle | Recoupé |

Les adresses exactes et les sources de recoupement sont dans `sources.ts` (`url`, `checkedWith`).

## 3. Progression de la classe

`ClassProgress` = `{ order, current, source, confirmed }`, avec trois sources :

- `ent_demo` : ordre et chapitre en cours « récupérés de l'ENT » (une classe de 3e fictive, signalée comme simulée) ;
- `proposal` : LearnWard propose le chapitre probable d'après l'ordre indicatif et la période de l'année, **non confirmé** ;
- `student` : l'élève a confirmé ou choisi son chapitre en cours (« C'est le chapitre en cours dans ma classe »).

Statut d'une unité (`statusIn`) : vue, en cours, à venir, selon sa place par rapport au chapitre en cours.

## 4. Trois modes de travail (`src/lib/curriculum/modes.ts`)

- **Mon année** : les unités du niveau de l'élève, dans l'ordre de sa classe.
- **Révision** (année précédente) : `recommendedBases` retient les prérequis de l'année d'avant dont dépendent le
  chapitre en cours et les deux suivants, et qui ne sont pas encore « en consolidation ». `revisionRows` trie tout le
  programme de l'an dernier : utile maintenant d'abord, puis du plus fragile au plus solide.
- **Avance** (année suivante) : `isUnlocked` ouvre une unité quand **tous** ses prérequis de l'année de l'élève sont
  « maîtrisés (provisoire) ». L'avance est facultative et ne compte pas dans le programme exigé.

## 5. Une séance

Chaque séance (`src/lib/content/sessions-*.ts`) est rattachée à une unité (`unitId`) et à un objectif observable.
Elle enchaîne :

1. **Rappeler et comprendre** (`stage: "rappel"`) ;
2. **Raisonner et appliquer** (`application`) ;
3. **Justifier et transférer** (`transfert`) : situation nouvelle, copie à corriger, rédaction ;
4. **Pour aller plus loin** (`extension`) : proposé après les trois défis, jamais imposé.

Chaque activité indique ses opérations cognitives (`ops`) et trois indices progressifs (`hintsOf`) : une piste, une
méthode, un début de correction. Le nombre d'indices ouverts est enregistré comme **aide** (0 à 3 ; 4 si la
correction est affichée).

### Formats

| Format | Usage | Matières |
| --- | --- | --- |
| QCM, graphique | Connaissances, lecture de courbe | Toutes |
| Problème à plusieurs questions | Calcul guidé, unités, erreurs classiques reconnues | Maths, physique, SVT, SES, musique |
| Remettre dans l'ordre | Étapes d'une méthode, chronologie | Maths, histoire, techno, SNT, EPS |
| Trouver l'erreur | Copie d'élève à corriger | Toutes |
| Trier | Fait / hypothèse / non établi, décrire / interpréter, thèse / argument / objection, premier plan / arrière-plan | Français, histoire, géo, EMC, philo, arts, SES, SNT, musique |
| Rédiger | Réponse libre, relue avec une grille critériée, exemples de réponses recevables, un retravail possible | Français, histoire, géo, EMC, philo, arts, musique, EPS, maths (bonus) |
| Dialogue | Plusieurs répliques naturelles acceptées, retour sur chaque choix | Anglais, espagnol |
| Exemple à compléter | Exemple résolu dont une étape décisive manque | Maths |

Une réponse rédigée n'est **jamais** corrigée par comparaison de texte : l'élève la relit avec la grille. Le résultat
est marqué `selfAssessed` et ne compte pas comme une preuve de maîtrise autonome.

### Documents et provenance

Un document (`Stimulus`) est un texte, un tableau ou une frise, avec sa provenance : réel (auteur, date, contexte,
où le vérifier, droits, limites) ou fictif (`authentic: false`, `illustrative_mock`), et c'est affiché à l'élève.
En histoire, EMC et philosophie, les énoncés ne sont pas réécrits par les passions (`fixedNote`) : les faits et les
textes restent ceux d'origine. Aucune citation n'est inventée. La géographie travaille sur une commune fictive
signalée comme telle.

## 6. Maîtrise et rappels (`src/lib/learning/`)

Une **trace** (`Evidence`) = un item, un résultat (réussi, partiel, raté), l'aide reçue, l'étape, la date.

| État | Règle de départ (configurable) |
| --- | --- |
| À découvrir | Aucune trace |
| En découverte | Quelques réussites, avec beaucoup d'aide |
| Fragile | Réussites partielles ou instables ; ou dernière séance réussie à moins de 50 % |
| En consolidation | Au moins une réussite seule et 60 % de réussite ; ou transfert raté lors de la dernière séance |
| Maîtrisé (provisoire) | Réussites seules sur deux jours différents, dont un transfert |
| Maîtrise durable | Idem, avec au moins 7 jours entre la première et la dernière réussite seule |

Rappels (`scheduleAfterSession`) : erreur ou indice fort → le lendemain ; aide légère ou rédaction auto-évaluée → dans
3 jours ; tout réussi seul → 7, 14 ou 30 jours selon l'état. La raison du rappel est enregistrée et affichée.

Ces seuils sont des hypothèses de départ, à tester avec des enseignants et des élèves.

## 7. Cagnotte et exercices partenaires

1 000 points = 1 €. Trois sources de points, toutes séparées de la maîtrise :

| Source | Règle |
| --- | --- |
| Séances | 10 points de base, jusqu'à 20 de plus selon la part de réponses réussies, multiplicateur de série (jusqu'à × 1,5) ; rien si le temps moyen est sous 8 s par question ; plafond de 150 points par jour |
| Défis de la semaine | Régularité (jours de révision, contrôle blanc, révision d'une base de l'année d'avant) |
| Cashback | Pourcentage des achats de la famille chez un partenaire, « en attente » puis disponible |
| **Exercices partenaires** | Bonus offert par le partenaire quand l'exercice est terminé (10 ou 15 points) |

Les dix partenaires sont **fictifs** et signalés comme tels. Un exercice partenaire est une variante d'une activité
existante (`Sponsorship.build`) : seul le contexte change (le nom de l'enseigne, son activité), jamais le format, la
compétence, l'étape, les nombres ni les réponses. Les tests comparent la variante et l'original champ par champ.

Règles :

- interdit en histoire-géographie, EMC, philosophie, HGGSP, DGEMC et dans les contrôles blancs (`NO_SPONSOR_SUBJECTS`) ;
- annoncé à l'élève avant l'exercice (bandeau et fiche « Exercice partenaire »), sur l'écran de préparation et dans la
  cagnotte ;
- bonus versé que la réponse soit juste ou non, une seule fois par exercice et par jour, s'il a été ouvert au moins
  8 secondes, dans la limite de 100 points par jour (`creditSponsored`) ;
- avant 15 ans, toute utilisation de la cagnotte (carte cadeau, virement, don) reste validée par le parent ;
- le parent peut désactiver les exercices partenaires : l'élève voit la version sans marque (`shownActivity`) ;
- aucun verbe d'achat dans l'énoncé, aucun lien vers le partenaire depuis l'exercice ; le partenaire ne reçoit ni les
  réponses, ni les résultats, ni le nom de l'élève.

**Un modèle en barres** : champ `model` d'un problème (lignes de barres, inconnues en « ? », jamais la réponse).
**Des indices pour la relecture** : champ `checks` d'une rédaction, chaque vérification visant un critère de la grille.
**Un type d'erreur** : `errorTypes` sur une question, si le classement par défaut de `CODE_TYPES` ne convient pas.

**Ajouter un exercice partenaire** : une entrée dans `SPONSORSHIPS` (séance, activité, partenaire, bonus, phrase de
présentation, fonction `build`). Les tests échouent si la variante change une réponse ou porte sur une matière
interdite.

## 8. Le coach (`src/lib/coach/`)

Le coach tourne sur l'appareil, sans réseau. C'est un moteur adaptatif, pas un modèle de langue : un modèle capable de
corriger une rédaction pèse plusieurs gigaoctets et ralentirait un téléphone. Tout passe par `provider.ts`, pour pouvoir
brancher plus tard une API côté serveur (correction détaillée, conversation), avec repli sur le coach local.

| Module | Rôle | Principe |
| --- | --- | --- |
| `learner.ts` | Modèle de l'élève | Traçage bayésien des connaissances (BKT) : probabilité de maîtrise mise à jour à chaque réponse ; une réussite aidée pèse moins ; une rédaction auto-évaluée ne compte pas. Rétention : exp(−jours / stabilité), la stabilité grandit avec les jours de réussite seule. Affiché en mots (« solide », « à entretenir », « à revoir »), jamais en pourcentage |
| `diagnose.ts` | Type d'erreur | Cinq types (notion, méthode, calcul, lecture de la question, rédaction), d'après les erreurs classiques déclarées dans les exercices et quelques signatures (signe, virgule, écart < 10 %). Sinon, type « probable » selon le format et l'étape |
| `writing.ts` | Relecture des rédactions | Indices observables par critère de la grille (citation, mots, motifs comme l'imparfait), avec les mots trouvés. Indicatif : l'élève évalue |
| `planner.ts` | Objectifs du jour | Priorités : devoir proche, rappels échus, automatismes, base qui bloque, chapitre en cours, oral, VO. Remplit le temps choisi sans le dépasser ; un même type d'objectif baisse en priorité à chaque fois qu'il est retenu ; au plus deux objectifs par matière |
| `methods.ts` | Méthodes | Définitions, niveaux de preuve, comparaison avec / sans à partir de 8 réponses de chaque côté. **v7 : choix automatique** (`autoMethods`, `methodsForSession`) chapitre par chapitre, sans réglage ni texte pour l'élève |
| `drills.ts` | Automatismes | 18 familles de calculs générés (réponse calculée par le code), notions déjà vues seulement, entrelacées ou non |
| `oral.ts` | Défi oral et VO | Sujets, débuts de phrases et exemples en anglais, espagnol, allemand ; voix de synthèse de l'appareil |

Ce que le coach ne fait pas : il ne note pas une rédaction, il ne change pas l'état de maîtrise affiché (règles de la
section 6), il n'envoie rien. **Depuis la v7, il ne parle plus à l'élève** : pas de remarques, pas de « pourquoi », pas
de diagnostic affiché. Ses décisions se voient seulement dans ce qui est proposé (objectifs du jour, présentation des
exercices) ; l'espace parent en donne le principe en une ligne. Les méthodes changent la présentation et les objectifs, jamais les réponses attendues
ni le calcul de la maîtrise (vérifié par les tests).

## 9. Ajouter du contenu

**Une unité** : dans `units-college.ts` ou `units-lycee.ts`, `unit(niveau, matière, slug, domaine, titre, notions, statut, { needs })`.
Vérifier que la matière est couverte par une source en vigueur pour ce niveau (le test « rattachée à une version de
programme » échoue sinon).

**Un objectif approfondi** : dans `objectives.ts`, avec le résultat observable, les connaissances, les savoir-faire,
les erreurs fréquentes, les preuves de maîtrise, des idées de transfert, et `sourceRefs`.

**Une séance** : un objet `Session` dans le fichier de la discipline (`sessions-maths.ts`, `sessions-lettres.ts`,
`sessions-sciences.ts`, `sessions-langues.ts`), puis `sessionId` sur l'unité. Au minimum une activité par défi.
Un document réel doit avoir un auteur ou une source, et une date. Lancer `npm test` : structure, indices, cohérence
des réponses, provenance et absence de contenu commercial sont vérifiés automatiquement. Pour un calcul, ajouter un
test qui le recalcule indépendamment (`tests/sessions.test.ts`).

**Une nouvelle version de programme** : ajouter la source avec ses dates d'application, fermer l'ancienne avec
`until`. Les unités se rattachent toutes seules à la bonne version.

## 10. Données fictives de la démo

- Date fixe : jeudi 29 octobre 2026 (vacances de la Toussaint, zone A).
- Élève : Alex, 3e, moins de 15 ans, ENT relié (simulé), passions football, jeux d'aventure, rap.
- Traces et rappels de démonstration pour la 3e et la 4e (`DEMO_EVIDENCE`, `DEMO_REVIEWS`).
- Devoirs, brevet blanc, partenaires, montants : fictifs. Dates du brevet, des épreuves anticipées de 1re et du
  baccalauréat 2027 : calendrier du ministère, relayé par L'Étudiant (source affichée sur chaque date).
- Changer de classe (Moi ou `/demo`) recalcule la progression et ne garde que les traces des niveaux déjà atteints.

## 11. À relire avant publication

- Toutes les sources « À relire » et « Recoupé » : relecture dans le texte officiel du BO.
- Les quatre sources « Texte officiel lu » : contrôle sur education.gouv.fr que la copie lue est conforme.
- Langues vivantes : répartition des points de grammaire par langue et par niveau (proposition de LearnWard).
- Repères annuels de 5e du nouveau programme de cycle 4 (séances de proportionnalité et de temps du récit).
- Données électorales et de chômage de l'Allemagne (séance d'histoire) : valeurs arrondies, à vérifier.
- Contenus de SVT et de physique-chimie (statut « À relire »).
- Programme de mathématiques de 1re sans spécialité (référence trouvée seulement dans une source secondaire).
- Dates des épreuves 2027 : à recouper sur le calendrier publié au BO.
- Exercices partenaires : avis juridique (publicité auprès des mineurs, consentement parental) avant tout partenariat réel.
- Paramètres du coach (BKT, stabilité de la mémoire, priorités du plan) : valeurs de départ, à calibrer sur de vraies données.
- Classement des erreurs classiques en types (`CODE_TYPES`) et vérifications des rédactions : à relire par des enseignants.
- Méthodes : textes de présentation et niveaux de preuve, à relire avec les sources (EEF, cadre de Singapour, OCDE).
- Bac de français : texte officiel du BO n° 30 du 24 juillet 2025 (œuvres 2027), grilles et sujets d'entraînement.
- Brevet de maths : calculatrice en partie 2, nombre de questions d'automatismes, points de rédaction (une seule source).
- Bulletin officiel spécial n° 4 du 17 septembre 2026 : non lu, à consulter pour la session 2027.
- Explorer : relecture par un enseignant de chaque capsule (notamment argent, IA et données personnelles).

## 12. Version 7 : fluidité, rigueur par niveau, apprendre pour le plaisir

### Principes d'interface

- **Une action principale par écran**, le reste accessible sans être lu. L'accueil se réduit à « combien de minutes ? »,
  la liste d'objectifs et « Commencer ».
- **Rien à comprendre pour avancer** : aucune méthode à choisir, aucun conseil à lire. L'adaptation est invisible,
  comme dans les tuteurs adaptatifs (MATHia, Lalilo) ; la transparence est donnée au parent.
- **Couleurs vives, choisies par l'élève** : 8 accents (`src/lib/theme/accents.ts`, `tokens.css`), ou l'accent de
  l'univers dominant. Contraste AA garanti par un test.
- **Transitions courtes** (moins de 0,3 s) et respect de « réduire les animations ».

### Univers

Le choix de passions devient un **spectre** : 65 univers dans 6 familles. L'élève peut en aimer (ils reviennent plus
souvent) ou en écarter (ils ne reviennent plus) ; deux univers de découverte par jour sont tirés dans tout le
catalogue (`discoveryPassions`, stable pour la journée). Les nombres et la correction ne changent jamais d'un univers
à l'autre.

### Rigueur par niveau et par matière

| Niveau | Ce qui est spécifique |
| --- | --- |
| 3e | Brevet blanc de maths au nouveau format : automatismes (6 points, 20 min, sans calculatrice) puis problèmes (14 points) |
| 1re | Bac de français : œuvres 2027 par objet d'étude et par voie, descriptif, œuvre choisie, préférence d'écrit ; révision espacée des textes ; grammaire de l'oral ; oral et écrit blancs chronométrés avec la grille de l'épreuve. Épreuve anticipée de maths blanche (2 h, sans calculatrice, QCM d'automatismes puis exercices) |
| Tle | Philosophie blanche (4 h, dissertation ou explication de texte) et grand oral blanc (20 min de préparation, 5 + 10 + 5 min) |

Les épreuves blanches de maths portent sur plusieurs chapitres : chaque question déclare son `unitId`, et la copie
corrigée nourrit la maîtrise et le rappel espacé de chaque chapitre évalué (`applyResult`). Les épreuves rédigées ou
orales sont auto-évaluées avec la grille ; la note reste indicative et est conservée (`bac.blancs`).

### Explorer

Des capsules de 3 à 5 minutes (`src/lib/explore/capsules.ts`) construites avec les formats d'exercices des séances,
dans l'esprit de Brilliant : on fait avant qu'on explique. Pas de note, pas de maîtrise, pas de rappel imposé ; 10 points
la première fois. Ajouter une capsule : un objet `Capsule` dans le parcours voulu, puis, pour toute réponse chiffrée,
une ligne de recalcul dans `tests/v7.test.ts`.

### Inspirations

| Appli | Ce qui a été repris |
| --- | --- |
| Duolingo | Une action par écran, série de jours, retours immédiats et sonores |
| Brilliant | Apprendre en résolvant (capsules d'Explorer) |
| Khan Academy | Maîtrise par compétence, chapitres à reprendre |
| Anki, Quizlet | Répétition espacée (textes de l'oral, rappels) |
| Kartable, SchoolMouv, Nomad Education | Alignement strict sur le programme français et le format des épreuves |
| Pronote | Devoirs venus de l'ENT |
| MATHia, Lalilo | Adaptation continue, sans réglage côté élève |

## 13. Version 8 : fiabilité et légèreté

La pédagogie ne change pas. Trois règles techniques s'ajoutent, à respecter en ajoutant du contenu ou un écran :

- **Le catalogue d'abord.** `src/lib/content/catalog.ts` donne titres, durées et liens, sans les exercices. Un écran
  qui n'affiche pas les exercices importe le catalogue, jamais `sessions.ts`, `exams.ts` ou `capsules.ts` : c'est ce qui
  garde l'appli légère. Après une modification du contenu : `npm run gen:catalog` (un test échoue sinon).
- **Une règle métier vit dans `src/lib`, pas dans un écran.** L'écran interroge la règle (`redeemBlock`, `minutesToday`,
  `draftSeconds`) : elle est ainsi testée sans navigateur et reste la même partout.
- **L'état venu du navigateur n'est jamais considéré comme sûr.** Tout passe par `sanitize` (`src/lib/store.tsx`). Un
  nouveau champ de l'état doit y avoir sa valeur de repli. Une valeur venue de l'adresse passe par `own` ou `safeReturn`.
