# AGENTS.md

Les règles du projet LearnWard sont dans **[CLAUDE.md](CLAUDE.md)** : lis-le en entier avant de toucher au code.
Ce fichier existe pour les outils qui cherchent `AGENTS.md` (Codex, Copilot, Cursor…) : les consignes sont les mêmes
pour toutes les IA.

En bref :
- Next.js **15.5** (App Router), React 19, TypeScript strict, CSS maison (pas de Tailwind).
- Rémy (`RC`) = back : `supabase/`, `src/app/api/`, `src/server/`. Benjamin (`BB`) = front : pages, `src/components/`,
  `src/styles/`. Les types partagés de `src/lib/` se modifient à deux.
- Aucun secret dans le code, aucune bibliothèque ajoutée sans le dire, points calculés côté serveur.
- Avant une PR : `npm run typecheck` et `npm test` doivent passer.
