# Learnward — Plan du projet et répartition

*Dernière mise à jour : 29/10/2026*

## Avant de commencer : 4 décisions à prendre ensemble

Ce plan suit l'arborescence actuelle (Next.js + TypeScript + Supabase). Si vous changez de langage, les phases restent les mêmes, seuls les outils changent.

- [ ] **Langage** : TypeScript avec Next.js (comme l'arborescence) ou Python ? À trancher avant d'écrire la moindre ligne.
- [ ] **Comptes à créer** (gratuits) : Supabase (base de données + connexion), Vercel (mise en ligne), et une clé d'API d'**une seule** IA pour commencer (Gemini, OpenAI ou Anthropic).
- [ ] **Qui est Personne A et qui est Personne B** (voir la répartition juste en dessous).
- [ ] **Périmètre de la première version (MVP)** : une seule matière et un seul niveau pour commencer, par exemple les maths de 4e. Tout le reste vient après.

Pourquoi un MVP aussi réduit : l'arborescence décrit une grosse appli (RGPD, points, espace parent, plusieurs IA, Pronote). À deux et en apprenant, viser tout d'un coup est le meilleur moyen de ne jamais rien finir. Une version simple qui marche vaut mieux qu'une version complète à moitié codée.

## Principe de répartition

On coupe le projet en deux : **A s'occupe de ce qui tourne sur le serveur, B de ce que voit l'utilisateur.** Comme ça, vous touchez rarement les mêmes fichiers, donc peu de conflits Git.

| | Personne A — « Back » | Personne B — « Front » |
| --- | --- | --- |
| Rôle | Les données, la logique, la sécurité | Les écrans, l'ergonomie, le mobile |
| Dossiers | `supabase/`, `src/domains/`, `src/app/api/`, `src/lib/` | `src/app/(auth)`, `(student)`, `(parent)`, `src/components/`, `public/` |
| Tests | `tests/unit/` | `tests/e2e/` |
| Profil qui colle | Aime la logique, les maths, les règles | Aime le visuel, l'expérience utilisateur |

**Le pont entre vous deux : `src/lib/schemas/`.** Ce sont les contrats Zod qui décrivent la forme exacte des données échangées (un exercice, une réponse, un score…). Vous les écrivez **ensemble**, au début de chaque phase. Ensuite A s'engage à renvoyer ces données, B s'engage à les afficher, et chacun peut avancer sans attendre l'autre.

Astuce : tant que l'API de A n'est pas prête, B peut afficher des **fausses données** qui respectent le schéma, puis brancher la vraie API plus tard.

## Phase 0 — Mise en place

Objectif : un projet Next.js vide qui démarre chez vous deux, relié à Supabase. Cette phase se fait surtout **à deux, en appel**.

**Ensemble**

- [ ] Installer Node.js (version LTS) chacun, vérifier `node -v` et `npm -v`
- [ ] Remplacer le `.gitignore` Python par celui de Next.js (fait par RC)
- [ ] Écrire `CLAUDE.md` : les règles du projet que l'IA doit respecter (langage, structure, conventions)

**Personne A**

- [ ] Créer le projet Next.js **une seule fois** sur sa branche, puis PR vers `main`
- [ ] Créer le projet Supabase, noter les clés dans `.env.local` (jamais sur GitHub)
- [ ] Créer un `.env.example` avec les noms des variables, sans les valeurs, pour que B sache quoi remplir

**Personne B**

- [ ] Une fois la PR de A mergée : récupérer `main`, lancer `npm install` puis `npm run dev`, vérifier que la page s'affiche
- [ ] Installer Tailwind et shadcn/ui (souvent proposés à la création du projet)
- [ ] Créer `public/manifest.json` (nom de l'appli, icône, couleurs) pour la version mobile

**C'est fini quand** : `npm run dev` affiche la page d'accueil chez vous deux, et personne n'a de clé secrète dans GitHub.

## Phase 1 — Fondations

Objectif : un élève peut créer un compte, se connecter et arriver sur un tableau de bord vide.

**Ensemble**

- [ ] Lister les tables de la base : `users`, `notions`, `exercises`, `sessions`, `answers`, `point_ledger`, `consents`… et ce que contient chacune
- [ ] Écrire les premiers schémas Zod (utilisateur, profil élève)

**Personne A**

- [ ] Écrire la première migration SQL dans `supabase/migrations/`
- [ ] Activer les règles RLS : un élève ne voit que **ses** données
- [ ] Créer les clients Supabase dans `src/lib/supabase/` (navigateur, serveur)
- [ ] Générer `database.types.ts` avec la CLI Supabase

**Personne B**

- [ ] Pages d'inscription et de connexion dans `src/app/(auth)/`
- [ ] La navigation mobile (barre du bas) dans `src/components/layout/`
- [ ] Un tableau de bord élève vide dans `src/app/(student)/`
- [ ] Choisir les couleurs et la police de l'appli

**C'est fini quand** : vous pouvez chacun créer un compte de test, vous connecter, et voir le tableau de bord sur votre téléphone.

## Phase 2 — Le cœur : exercices et séances

Objectif : un élève choisit une notion, fait une séance de QCM, reçoit une correction juste. C'est la phase la plus longue et la plus importante.

**Ensemble**

- [ ] Choisir 5 à 10 notions de maths de 4e pour démarrer (dans `supabase/seed.sql`)
- [ ] Schémas Zod : `Exercise`, `Session`, `Answer`, `Correction`
- [ ] Décider la règle d'or : **l'IA rédige l'énoncé, mais c'est le code qui vérifie la réponse**. Une IA peut se tromper en maths, le code non.

**Personne A**

- [ ] `src/domains/pedagogy/` : des modèles d'exercices avec des nombres tirés au hasard et une vérification calculée par le code
- [ ] `src/domains/ai-adapter/` : une seule fonction qui appelle l'IA choisie (énoncés, indices, explications), avec un compteur de coût
- [ ] Les routes `POST /api/exercises`, `GET /api/exercises/[id]`, `POST /api/sessions/[id]/answers`, `/complete`
- [ ] Tests Vitest du vérificateur de réponses

**Personne B**

- [ ] Le catalogue des notions dans `src/app/(student)/`
- [ ] Le lecteur d'exercices dans `src/components/exercise-player/` : question, choix du QCM, bouton indice, correction expliquée
- [ ] L'écran de fin de séance (score, erreurs)
- [ ] Brancher tout ça sur les vraies routes de A

**C'est fini quand** : vous faites chacun une séance complète de 10 questions sans bug, et aucune correction n'est fausse.

## Phase 3 — Points, récompenses, progression

Objectif : l'élève gagne des points en fin de séance et voit sa progression par notion.

**Ensemble**

- [ ] Fixer le barème : combien de points par bonne réponse, par séance finie, par série de jours
- [ ] Schémas Zod : `Progress`, `Reward`

**Personne A**

- [ ] `src/domains/points/` : les points sont calculés **uniquement sur le serveur** (sinon n'importe qui peut tricher depuis son navigateur)
- [ ] Écriture dans `point_ledger` sans jamais modifier une ligne existante, et sans compter deux fois la même séance (clé d'idempotence)
- [ ] Routes `GET /api/progress` et `GET /api/rewards`
- [ ] Tests Vitest du calcul des points

**Personne B**

- [ ] Affichage des points et des badges sur le tableau de bord
- [ ] Une page de progression par notion (barres ou pourcentages)
- [ ] Une petite animation quand on gagne des points

**C'est fini quand** : finir une séance donne bien les points prévus, une seule fois, et la progression se met à jour.

## Phase 4 — Espace parent et RGPD

Objectif : un parent valide l'inscription de son enfant et peut voir ou retirer son accord. **Obligatoire avant d'ouvrir l'appli à de vrais élèves**, pas avant.

Pourquoi : vos utilisateurs sont des collégiens. En France, en dessous de 15 ans, l'accord d'un parent est nécessaire pour traiter les données d'un enfant en ligne. Lisez les recommandations de la CNIL sur les mineurs avant de lancer cette phase.

**Ensemble**

- [ ] Rédiger le texte de consentement (simple, compréhensible par un parent) et la politique de confidentialité
- [ ] Lister précisément les données collectées, et n'en garder que le strict nécessaire

**Personne A**

- [ ] `src/domains/consents/` : enregistrer qui a accepté quelle version du texte, et quand
- [ ] Route `POST /api/parent/consents`
- [ ] Bloquer l'accès d'un élève de moins de 15 ans tant qu'un parent n'a pas validé
- [ ] Pouvoir supprimer toutes les données d'un élève sur demande

**Personne B**

- [ ] Parcours de validation parentale (le parent reçoit un lien, accepte)
- [ ] Espace parent dans `src/app/(parent)/` : voir la progression de l'enfant, gérer les consentements

**C'est fini quand** : un compte élève de moins de 15 ans ne peut rien faire sans accord parental, et un parent peut tout retirer.

## Phase 5 — Tests, mise en ligne, bêta

Objectif : l'appli est en ligne et quelques vrais élèves l'utilisent.

**Personne A**

- [ ] Limiter le nombre de requêtes par utilisateur (`src/lib/security/`) pour éviter qu'on fasse exploser votre facture d'IA
- [ ] Tests pgTAP des règles RLS dans `supabase/tests/`
- [ ] Mettre un plafond de dépense sur le compte de l'IA

**Personne B**

- [ ] Tests Playwright des parcours complets (inscription, séance, parent) dans `tests/e2e/`
- [ ] Vérifier l'appli sur plusieurs téléphones et l'installer en PWA

**Ensemble**

- [ ] Mettre en ligne sur Vercel, relié au dépôt GitHub (chaque merge sur `main` met le site à jour)
- [ ] Faire tester par 5 à 10 élèves de votre entourage, avec l'accord des parents
- [ ] Noter les retours, corriger, recommencer

**C'est fini quand** : des élèves que vous ne connaissez pas bien utilisent l'appli sans que vous ayez à leur expliquer.

## Plus tard : Pronote / ÉcoleDirecte

Le connecteur `school-connector` est à laisser de côté tant que tout le reste ne tourne pas. Ces services n'ont pas d'accès officiel ouvert à tous, les données scolaires d'enfants sont très sensibles, et ça peut casser à tout moment. À rediscuter seulement après une bêta réussie, ainsi que les autres matières et niveaux (physique, 3e, 2nde).

## Récap : qui fait quoi

| Phase | Ensemble | Personne A (back) | Personne B (front) |
| --- | --- | --- | --- |
| 0 · Mise en place | Node.js, `.gitignore`, `CLAUDE.md` | Création du projet, Supabase, `.env.example` | Tailwind, shadcn/ui, `manifest.json` |
| 1 · Fondations | Tables de la base, premiers schémas | Migrations, RLS, clients Supabase | Connexion, navigation, tableau de bord |
| 2 · Exercices | Notions, schémas, règle « le code vérifie » | Moteur d'exercices, adaptateur IA, routes API | Catalogue, lecteur d'exercices, fin de séance |
| 3 · Points | Barème | Calcul serveur, `point_ledger`, routes | Points, badges, progression |
| 4 · Parents / RGPD | Textes légaux, données collectées | Logique de consentement, suppression | Validation parentale, espace parent |
| 5 · Mise en ligne | Vercel, bêta avec élèves | Limites, plafond IA, tests RLS | Tests e2e, tests sur téléphones |

Une phase ne commence que quand la précédente est finie. Si l'un de vous a fini sa partie avant l'autre, il aide sur les tests ou relit le code de l'autre.

## Règles pour bosser à deux

- **Un point par semaine** (15 min en appel) : ce qui est fait, ce qui bloque, ce qu'on fait ensuite.
- **Petites PR** : une PR = une seule chose (une page, une route). Plus facile à relire, moins de conflits.
- **On relit vraiment** la PR de l'autre avant d'approuver, même vite. Si on ne comprend pas un bout de code, on demande.
- **On ne touche pas aux dossiers de l'autre** sans prévenir. Les schémas Zod se modifient toujours à deux.
- **Les clés secrètes** restent dans `.env.local`, jamais dans le code, jamais dans un message.
- **Avec l'IA** : on lui donne `CLAUDE.md` et les schémas à chaque fois, et on comprend ce qu'elle a écrit avant de le pousser. Du code qu'aucun de vous ne comprend sera impossible à réparer.
- **Les tâches** : cochez les cases de ce fichier au fur et à mesure (via une PR), ou recopiez-les en *Issues* sur GitHub.
