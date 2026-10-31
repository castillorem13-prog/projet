# LearnWard, prototype UI v8

Interface complète de LearnWard pour le téléphone, la tablette et l'ordinateur, **de la 6e à la terminale**.
Next.js 15 (App Router), React 19, TypeScript. **Données fictives, aucun backend, rien n'est envoyé.**
Le moteur d'adaptation (l'« IA interne ») tourne sur l'appareil, sans réseau, et ne se montre plus.

## Lancer

Node.js 22 ou plus.

```bash
npm install
npm run dev        # http://localhost:3000 et http://localhost:3000/demo
npm test           # 334 tests : référentiel, séances, calculs, maîtrise, rappels, cagnotte, moteur, Explorer, bac, épreuves, sauvegardes
npm run typecheck
npm run build      # régénère le catalogue, puis construit des pages entièrement statiques
```

- **/** : l'appli. Elle s'adapte à la taille de l'écran.
- **/demo** : l'appli dans un cadre de téléphone, de tablette ou d'ordinateur, avec des raccourcis vers chaque écran
  (Explorer, bac de français, épreuves blanches, couleurs, univers…) et un sélecteur de classe.

## Ce qui change par rapport à la v7

La v8 n'ajoute pas de fonctionnalité : elle corrige, fiabilise et allège. Le détail, bug par bug, est dans
[`CHANGELOG.md`](CHANGELOG.md).

- **Sécurité.** Next.js et React passent en version corrigée (`npm audit` : 0 vulnérabilité, contre plusieurs failles
  critiques en v7). Une adresse inventée donne une vraie page 404 au lieu de planter l'appli, le lien de retour ne peut
  plus mener hors de l'appli, et les réponses du serveur portent des en-têtes de sécurité.
- **Solidité.** Une sauvegarde abîmée ou ancienne est réparée à l'ouverture (`sanitize`). Une erreur dans un écran
  affiche un message et un bouton « Réessayer », jamais une page blanche. Plusieurs onglets restent synchronisés.
- **Vitesse.** Toutes les pages sont statiques, plus aucune ne passe par le serveur. Le contenu pédagogique n'est chargé
  que par les écrans qui le jouent : les autres se contentent d'un catalogue léger (`src/lib/content/catalog.ts`).
  Le chrono d'une épreuve ne redessine plus toute la copie à chaque seconde.
- **Justesse.** Cagnotte, plafond parental, temps de travail, chronos, micro : voir le journal des corrections.

## Rappel : ce qui avait changé en v7

**Une interface plus fluide.** Une action principale par écran, des transitions courtes, plus aucun texte de « coach » :
ni « Le coach a remarqué », ni « Pourquoi » sous les objectifs, ni diagnostic d'erreur à lire, ni écran « Mes méthodes ».
Les couleurs vives restent : c'est la fluidité qui s'inspire de Tesla, pas la sobriété.

- **Accueil** : une carte « Aujourd'hui » à la couleur d'accent. On touche un temps (10 à 60 min), les objectifs
  apparaissent aussitôt, un seul bouton « Commencer ». En dessous, « À venir » (devoirs, bac de français, épreuves
  blanches) en cartes qui défilent, puis « Pour le plaisir » (Explorer).
- **Navigation** : Accueil, Programme, Explorer, Cagnotte, Moi. « Programme » regroupe Matières, Progrès, Épreuves et,
  en première, Bac de français, avec des onglets en haut de page.

**Les méthodes ne se choisissent plus.** Le moteur décide, chapitre par chapitre, à partir des réponses de l'élève
(`autoMethods`, `src/lib/coach/methods.ts`) : modèles en barres pour un chapitre de maths nouveau ou fragile, trois
questions avant de calculer quand les erreurs de démarche reviennent, automatismes entrelacés dès qu'il y a assez de
chapitres à mélanger, oral d'abord en langues, erreurs sans stress quand les essais ratés s'accumulent. L'élève n'a
aucun réglage ; l'espace parent explique en une ligne ce qui est appliqué.

**Couleurs à soi.** Moi > Apparence : thème (automatique, clair, sombre), 8 couleurs d'accent vives (jaune, citron vert,
menthe, cyan, lilas, rose, corail, orange), ou « Couleur selon mes univers » (sport en menthe, jeux en lilas, musique
en corail, création en rose, sciences en cyan, monde en citron vert). Toutes portent le texte sombre avec un contraste
AA, en clair comme en sombre (vérifié par les tests et par axe-core).

**Des univers au lieu d'un choix de passions.** 65 univers dans 6 familles (29 nouveaux, dont une famille « Monde et
société » : histoire, mythologies, voyages, écologie, créer son entreprise), tous traduits pour l'anglais et l'espagnol.
Rien n'est obligatoire : chaque jour, deux univers de découverte tirés dans tout le catalogue s'ajoutent à ceux que
l'élève aime ; « Pas pour moi » en écarte un pour de bon. À l'inscription, l'étape est facultative.

**Explorer, juste pour le plaisir.** 6 parcours, 13 capsules de 3 à 5 minutes, avec les mêmes exercices que les séances
mais sans note ni maîtrise : coder en Python (variables, boucles, conditions, avec du vrai code à lire et corriger),
gérer son argent (budget, intérêts composés, arnaques), IA et numérique (comment une IA apprend, données personnelles),
l'espace, apprendre à apprendre, aller plus loin (0,999… = 1, le GPS et la lumière, diviser par zéro). Une capsule
terminée la première fois rapporte 10 points. Chaque réponse chiffrée est recalculée par les tests.

**Bac de français (première).** Les 13 œuvres du programme 2027 (BO n° 30 du 24 juillet 2025, recoupé dans trois
sources), par objet d'étude et par voie, avec parcours et parties au programme ; l'œuvre choisie pour l'entretien ;
la préférence commentaire ou dissertation ; le descriptif de l'oral (ajouter, modifier, retirer des textes,
24 en voie générale, 16 en voie technologique).
- **Mes textes** : répétition espacée façon Anki. On redit de mémoire problématique, mouvements et procédés, on compare
  avec ses notes, on dit « À revoir », « Bien » ou « Facile ». Les textes du jour entrent dans les objectifs.
- **Grammaire de l'oral** : négation, interrogation, subordonnées, avec la règle appliquée à la phrase.
- **Oral blanc** : texte tiré au sort dans le descriptif, question de grammaire, 30 minutes de préparation, 12 minutes
  (lecture, explication, grammaire) puis 8 minutes (œuvre choisie et entretien), enregistrement facultatif qui reste
  sur l'appareil, puis la grille de l'épreuve (2 + 8 + 2 + 8 points).
- **Écrit blanc** : 4 heures, commentaire de « Demain, dès l'aube… » ou dissertation sur une œuvre de la classe ;
  onglets Sujet, Plan, Copie ; à la fin, repères chiffrés (mots, paragraphes, citations, connecteurs), grille sur 20,
  puis pistes de correction et rappel du plan. Le brouillon survit à une page rechargée.

**Épreuves blanches au format officiel, au niveau de la classe.**

| Classe | Épreuve | Format |
| --- | --- | --- |
| 3e | Brevet blanc de maths | 2 h ; automatismes 6 points en 20 min sans calculatrice ; 3 problèmes sur 14 points |
| 1re | Épreuve anticipée de maths | 2 h sans calculatrice ; 12 QCM d'automatismes (6 points) ; 2 exercices de 7 points |
| 1re | Écrit et oral de français | voir ci-dessus |
| Tle | Philosophie | 4 h ; deux dissertations ou une explication de texte (Descartes) |
| Tle | Grand oral | 20 min de préparation, puis 5 + 10 + 5 min ; grille d'entraînement LearnWard |

Chaque question des épreuves de maths vise un chapitre précis : une épreuve blanche nourrit la maîtrise et les rappels
de chaque chapitre évalué, pas seulement d'un seul.

**Inspirations.** Duolingo (une action par écran, série, retours immédiats), Brilliant (capsules interactives
d'Explorer), Khan Academy (maîtrise par compétence), Anki et Quizlet (répétition espacée des textes de l'oral),
Kartable, SchoolMouv et Nomad Education (alignement sur le programme et les épreuves françaises), Pronote (devoirs
de l'ENT), Lalilo et MATHia (adaptation invisible à l'élève). Détails dans `docs/ARCHITECTURE_PEDAGOGIQUE.md`.

## Rappel : ce qui avait changé en v6

Un moteur sur l'appareil (traçage bayésien des connaissances avec oubli, diagnostic des erreurs en cinq types,
relecture des rédactions, objectifs du jour, automatismes, défi oral) et des méthodes inspirées de Singapour et des
pays nordiques. Depuis la v7, tout cela travaille toujours, mais sans rien demander ni expliquer à l'élève.

## Rappel : ce qui avait changé en v5

**Les programmes en vigueur en 2026-2027, version par version.** 14 textes officiels datés (référence du BO,
niveaux et rentrée d'application), 555 unités de la 6e à la terminale. Nouveautés :

- **Langues vivantes (BO n° 22 du 29 mai 2025)** : nouveaux axes en 6e et en seconde depuis 2025, en 5e, en 1re et en
  terminale à la rentrée 2026 ; 4e et 3e gardent l'ancien programme jusqu'en 2027 et 2028. Anglais, espagnol et
  **allemand** à tous les niveaux.
- **EMC (BO n° 24 du 13 juin 2024)** : nouveaux thèmes à tous les niveaux selon le calendrier d'entrée en vigueur.
- **Matières ajoutées** : latin et grec (5e à terminale), LLCA, EPPCS, arts plastiques en spécialité.
- **Français et maths** : programme de 6e de 2025, programme de cycle 4 de 2026 en 5e, maths de seconde de 2026.
- Quatre textes sont marqués « Texte officiel lu » (langues vivantes, technologie, LCA, EPPCS) : leur texte intégral a
  été lu dans une copie publiée par une académie ou un syndicat, citée dans `checkedWith`. Les autres restent
  « Recoupé » ou « À relire » : rien n'est présenté comme vérifié sans l'avoir été.

**Dix partenaires fictifs, des exercices partenaires dans les séances.** Bulle & Planche, Cahier Malin, Côté Terrain,
Ciné Lumière, Note Bleue, Octet & Cie, Le Dé Voyageur, Roue Libre, Planète Curieuse, Atelier Pigment : chacun a un
cashback (3 à 8 %), une carte cadeau et un ou plusieurs exercices écrits avec lui (12 au total, de la 6e à la 1re).

| Règle | Comment elle est tenue |
| --- | --- |
| Même exercice que la version sans marque | Même format, même compétence, même étape, mêmes réponses (vérifié par les tests) |
| Toujours signalé | Bandeau « Exercice partenaire » et fiche explicative dans la séance, pastille sur la préparation |
| Jamais en HG, EMC, philosophie, HGGSP, DGEMC, ni en contrôle blanc | Liste `NO_SPONSOR_SUBJECTS`, testée |
| Le bonus ne touche pas à la maîtrise | Versé à la cagnotte, juste ou non ; la maîtrise ne lit pas les points (testé) |
| Pas d'abus | Une fois par exercice et par jour, au moins 8 s passées, 100 points de bonus par jour au plus |
| Le parent décide | Interrupteur dans l'espace parent : l'élève voit alors la version sans marque |
| Aucune incitation | Pas de « achète », le partenaire ne voit ni les réponses ni le nom de l'élève |

**Deux séances de 5e**, niveau qui n'en avait pas : *proportionnalité et pourcentages* (avec sa version Côté Terrain)
et *les temps du récit* (imparfait et passé simple, suite de récit relue avec une grille). 22 séances jouables dans
15 matières, à tous les niveaux de la 6e à la terminale.

**Saisie plus tolérante** : « 30 € » et « 25 % » sont acceptés quand la réponse attendue n'a pas d'unité de mesure.

Le reste de la v4 est conservé : trois modes du programme (Mon année, Révision, Avance), séances en trois défis
avec indices progressifs, maîtrise calculée sur les traces, rappels espacés, cagnotte façon WeWard avec validation
parentale avant 15 ans, contrôle blanc, mode sombre, lecture facilitée.

La méthode pédagogique, les sources consultées et la façon d'ajouter un objectif, un exercice ou un exercice
partenaire sont dans [`docs/ARCHITECTURE_PEDAGOGIQUE.md`](docs/ARCHITECTURE_PEDAGOGIQUE.md).

## Organisation

```
src/
├── app/
│   ├── (app)/            pages avec navigation : accueil, programme (/reviser), progrès, épreuves, bac de français,
│   │                     explorer, cagnotte, moi, espace parent
│   ├── (focus)/          pages plein écran : bienvenue, univers, séance, bilan, contrôle, copie, capsule d'Explorer,
│   │                     révision des textes, grammaire, oral et écrit blancs, philosophie, grand oral
│   ├── demo/             cadres d'appareils
│   └── error.tsx         filets de sécurité : une erreur affiche un message, jamais une page blanche
├── components/
│   ├── activities/       9 formats d'exercices, documents (dont le code) et provenance, indices progressifs
│   ├── bac/              bac de français, épreuves blanches, chronos de phase, grille d'auto-évaluation
│   ├── explore/          parcours et lecteur de capsules
│   ├── home/             carte « Aujourd'hui »
│   ├── passions/         sélecteur d'univers (aimer, écarter), aperçu d'énoncé
│   ├── programme/        jauge de maîtrise, frise de l'année, fiche d'une unité, rappels
│   ├── rewards/          visuels de la cagnotte
│   ├── screens/          un fichier par écran
│   ├── shell/            navigation, onglets de Programme, thème et couleur, pont avec /demo
│   └── ui/               bouton, feuille, graphique, gabarit plein écran…
├── lib/
│   ├── bac/              bac de français : œuvres 2027, format, barèmes, grammaire, sujets, révision espacée, brouillons
│   ├── curriculum/       programmes officiels versionnés, niveaux, unités 6e → Tle, progression, modes
│   ├── coach/            moteur local : modèle de l'élève, diagnostic, relecture, objectifs du jour,
│   │                     choix automatique des méthodes, automatismes, oral, interface pour une future API
│   ├── content/          séances, exercices partenaires, contrôles et épreuves blanches, univers et lexique,
│   │                     catalogue léger (généré)
│   ├── epreuves.ts       épreuves blanches proposées selon la classe
│   ├── explore/          parcours et capsules d'Explorer
│   ├── theme/            couleurs d'accent et contraste
│   ├── learning/         états de maîtrise, rappels espacés
│   ├── pedagogy/         vérification des réponses (virgule, signe, unités, €, %, erreurs classiques)
│   ├── rewards.ts        cagnotte
│   └── store.tsx         état sauvegardé (forme identique à ce que renverra l'API), clé learnward:v8
└── styles/
    ├── tokens.css        couleurs clair / sombre, accents, lecture facilitée (tout le thème est ici)
    └── base.css, shell.css, screens.css, player.css, activities.css, programme.css, wallet.css, coach.css, v7.css
scripts/                  génération du catalogue léger
tests/                    tests node:test (lancés avec tsx) : aucun navigateur nécessaire
docs/                     architecture pédagogique
```

**Ajouter ou modifier une séance, une épreuve ou une capsule** : lancer `npm run gen:catalog` ensuite. Un test échoue
si le catalogue n'est plus à jour, et `npm run build` le régénère de toute façon.

Pour remettre la démo à zéro : Moi > « Recommencer comme un nouvel élève », ou « Première ouverture » dans `/demo`.
Les états de la v6 et de la v7 (clés `learnward:v6` et `learnward:v7`) sont repris : le réglage des méthodes disparaît,
le bac de français (avec un descriptif d'exemple en première) et Explorer sont ajoutés.

## À vérifier avant publication

- Le texte du BO n° 30 du 24 juillet 2025 (œuvres 2027) et les pages officielles des épreuves ne s'ouvrent pas depuis
  l'environnement du prototype : les listes et formats ont été recoupés dans des sources secondaires concordantes.
- Brevet de maths : la calculatrice en partie 2, la dizaine de questions d'automatismes et les 2 points de rédaction
  ne viennent que d'une source (L'Étudiant).
- Un Bulletin officiel spécial n° 4 du 17 septembre 2026 existe ; son contenu n'a pas pu être lu. À consulter pour
  vérifier qu'il ne modifie pas les épreuves de la session 2027.
- Les grilles de l'écrit, du grand oral et la pondération des critères sont celles de LearnWard (affiché dans l'appli).
- Les textes de Hugo et de Descartes sont du domaine public, ponctuation à vérifier sur une édition de référence.
