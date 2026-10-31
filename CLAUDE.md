# CLAUDE.md — Règles du projet LearnWard

Ce fichier est lu par les IA qui codent sur ce projet (Claude, ChatGPT, Copilot…). Donne-le-leur à chaque session.
Si une demande contredit ces règles, l'IA doit le signaler au lieu de les contourner.

## Le projet

LearnWard, le « WeWard des devoirs » : une appli mobile-first où les élèves (de la 6e à la terminale) révisent avec des
exercices adaptés à leurs passions, et gagnent des points de régularité convertibles en réductions chez des marques
partenaires. Détails : `README.md`, `PLAN.md`, `docs/ARCHITECTURE_PEDAGOGIQUE.md`, `docs/PROTOTYPE-V8.md`.

État actuel : **prototype d'interface (v8), données fictives, aucun backend.** L'état est gardé dans le navigateur
(`src/lib/store.tsx`, localStorage). Le backend (Supabase) arrive en Phase 1.

## L'équipe et qui touche quoi

| Personne | Rôle | Dossiers |
| --- | --- | --- |
| **Rémy (branche `RC`)** — Personne A | Back : base de données, API, logique, sécurité | `supabase/`, `src/app/api/`, `src/server/` |
| **Benjamin (branche `BB`)** — Personne B | Front : écrans, composants, design, mobile | `src/app/` (pages), `src/components/`, `src/styles/`, `public/` |
| Les deux, ensemble | Le contrat de données entre front et back | les types dans `src/lib/` (voir plus bas) |

Ne modifie pas les dossiers de l'autre personne sans qu'elle soit prévenue.

## La stack (ne pas en changer sans accord des deux)

- **Next.js 15.5** (App Router), **React 19**, **TypeScript** strict
- Styles : **CSS maison** dans `src/styles/` (tokens dans `tokens.css`). **Pas de Tailwind**, pas de shadcn.
- Icônes : `lucide-react`. Polices : Archivo et Atkinson Hyperlegible (fontsource).
- Base de données et connexion : **Supabase** (à brancher).
- Tests : `node --test` avec `tsx`, dans `tests/`.

N'ajoute **aucune nouvelle bibliothèque** (`npm install …`) sans le dire clairement et expliquer pourquoi.

Note : `AGENTS.md` a été généré pour Next.js 16 lors de la création initiale du projet. Le projet tourne en
Next.js 15.5, ses consignes ne s'appliquent pas.

## Organisation du code

```
src/
├── app/
│   ├── (app)/        pages avec la navigation (accueil, réviser, explorer, cagnotte, moi…)
│   ├── (focus)/      pages plein écran (séance, contrôle, oral, bac…)
│   ├── demo/         l'appli dans un cadre de téléphone / tablette
│   └── api/          (à venir) routes serveur — partie de Rémy
├── components/       composants d'interface, rangés par écran — partie de Benjamin
├── styles/           CSS — partie de Benjamin
└── lib/
    ├── store.tsx     état global de l'appli (aujourd'hui : localStorage)
    ├── content/      contenus fictifs (séances, examens, passions, mock…)
    ├── curriculum/   programmes officiels, niveaux, unités
    ├── learning/     maîtrise et rappels
    ├── pedagogy/     vérification des réponses
    ├── rewards.ts    cagnotte et récompenses
    └── points.ts     calcul des points
supabase/             (à venir) migrations SQL, seed, tests RLS — partie de Rémy
```

## Le contrat front / back

Les types exportés par `src/lib/` (par exemple `Profile`, `SessionResult`, `Wallet`, `Evidence`, `Review`) décrivent
la forme des données. **Quand le backend arrivera, il renverra des données de cette forme**, et le front n'aura qu'à
changer d'où elles viennent. Donc :

- Un changement de type partagé se fait **à deux**, dans une PR dédiée.
- Côté back, on valide toute donnée qui entre (Zod ou équivalent) avant de l'écrire en base.

## Règles qui ne se discutent pas

1. **Aucun secret dans le code.** Les clés vont dans `.env.local` (jamais commité). `.env.example` liste les noms
   sans les valeurs. Seules les variables `NEXT_PUBLIC_…` peuvent être lues par le navigateur, et seule la
   *publishable key* Supabase a le droit d'y être. La *secret key* et le mot de passe de la base, jamais.
2. **L'IA rédige, le code vérifie.** Une IA peut écrire un énoncé, un indice ou une explication. La correction d'une
   réponse est toujours calculée par du code testé (`src/lib/pedagogy/`), jamais par une IA.
3. **Points et maîtrise sont séparés.** Les points récompensent la régularité, jamais la maîtrise. Aucune fonction
   de maîtrise ne lit les points. Les séances ne mentionnent ni marque, ni cagnotte ; le contenu partenaire reste
   dans `src/lib/content/sponsored.ts`.
4. **Les points se calculent côté serveur** dès que le backend existe : le navigateur ne décide jamais combien de
   points il gagne.
5. **Les utilisateurs sont des mineurs.** Collecter le strict minimum. En dessous de 15 ans, rien sans accord
   parental. Pas de pub ciblée. Chaque table Supabase a la RLS activée : un élève ne lit que ses données.
6. **Les programmes officiels** gardent leur statut de vérification (`src/lib/curriculum/sources.ts`). Ne jamais
   présenter un contenu `needs_review` ou `illustrative_mock` comme officiel.

## Git

- `main` = la version validée. On n'y code jamais directement.
- Chacun travaille sur **sa** branche (`RC` ou `BB`), puis ouvre une Pull Request vers `main`. L'autre relit et valide.
- Avant de coder : `git checkout main`, `git pull`, retour sur sa branche, `git merge main`.
- Petites PR, une seule chose à la fois. Messages de commit clairs, en français.
- Ne jamais commiter `node_modules/`, `.next/`, `.env.local`.

## Commandes

```bash
npm install         # après chaque git pull qui change package.json
npm run dev         # http://localhost:3000 (et /demo)
npm test            # tests
npm run typecheck   # vérification TypeScript
npm run build       # régénère le catalogue puis construit l'appli
```

Avant de proposer une PR : `npm run typecheck` et `npm test` doivent passer.

## Façon de travailler avec l'IA

- Langue : **français** pour l'interface, les commentaires et les commits.
- Explique ce que tu changes et pourquoi, simplement : nous apprenons en codant.
- Ne réécris pas un fichier entier pour une petite modification.
- Si tu n'es pas sûr de l'endroit où mettre du code, demande plutôt que d'inventer un nouveau dossier.
