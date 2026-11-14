/**
 * Reconnaît le chapitre de la banque dont parle un devoir (« DS sur le second degré », « Contrôle probas »…).
 *
 * Méthode volontairement simple et prudente :
 *  - on compare les mots du devoir avec ceux du titre et des notions de chaque chapitre du niveau et de la matière ;
 *  - un mot partagé par beaucoup de chapitres compte peu (« équations », « fonctions »), un mot rare compte beaucoup
 *    (« discriminant », « probabilités ») ;
 *  - en cas de doute (score trop faible ou égalité), on ne relie à rien : mieux vaut aucun chapitre qu'un faux.
 */
import { unitsOf } from "@/lib/curriculum";
import type { Level, SubjectId, Unit } from "@/lib/curriculum/types";
import { normalize } from "./subjects";

/** Façons courantes d'écrire un chapitre, ramenées aux mots du programme. */
const SYNONYMS: [RegExp, string][] = [
  [/\b(degre 2|2nd degre|2 nd degre|second degre|trinome|polynome du 2)\b/g, "second degre discriminant"],
  [/\bproba(s)?\b/g, "probabilites"],
  [/\btrigo\b/g, "trigonometriques"],
  [/\bstats?\b/g, "statistiques"],
  [/\bexpo\b/g, "exponentielle"],
  [/\bvecteurs?\b/g, "vectoriel vecteurs"],
  [/\bderivees?\b/g, "derivation derivee"],
  [/\b(14 18|grande guerre)\b/g, "premiere guerre mondiale"],
  [/\b(39 45|seconde guerre)\b/g, "seconde guerre mondiale"],
  [/\bpytha(gore)?\b/g, "pythagore"],
  [/\bthales\b/g, "thales"],
];

/** Mots trop généraux pour désigner un chapitre. */
const STOP = new Set([
  "pour", "avec", "dans", "sans", "sous", "entre", "leur", "leurs", "cette", "celui", "celle", "tous", "toutes", "tout",
  "faire", "finir", "revoir", "reviser", "apprendre", "lire", "rendre", "ramener", "travail", "travailler",
  "cours", "chapitre", "partie", "seance", "seances", "lecon", "lecons", "exercice", "exercices", "probleme", "problemes",
  "controle", "devoir", "devoirs", "evaluation", "interrogation", "classe", "page", "pages", "fiche", "fiches", "notions",
  "methode", "methodes", "etude", "etudes", "question", "questions", "texte", "textes", "document", "documents",
  "notion", "definition", "definitions", "propriete", "proprietes", "type", "types", "ensemble", "plusieurs",
  // mots de question : « Comment » ne doit pas faire croire à « commentaire »
  "comment", "pourquoi", "quand", "quel", "quelle", "quels", "quelles", "combien",
]);

const stem = (w: string) => (w.length >= 6 ? w.slice(0, 6) : w);

function stems(text: string): Set<string> {
  let t = normalize(text);
  for (const [re, rep] of SYNONYMS) t = t.replace(re, ` ${rep} `);
  const out = new Set<string>();
  for (const w of t.split(" ")) if (w.length >= 4 && !STOP.has(w)) out.add(stem(w));
  return out;
}

type Index = { units: { unit: Unit; stems: Set<string> }[]; df: Map<string, number> };
const CACHE = new Map<string, Index>();

function indexFor(level: Level, subject: SubjectId): Index {
  const key = `${level}|${subject}`;
  const hit = CACHE.get(key);
  if (hit) return hit;
  const units = unitsOf(level, subject).map((unit) => ({ unit, stems: stems([unit.title, ...unit.notions].join(" ")) }));
  const df = new Map<string, number>();
  for (const u of units) for (const s of u.stems) df.set(s, (df.get(s) ?? 0) + 1);
  const idx = { units, df };
  CACHE.set(key, idx);
  return idx;
}

export interface UnitMatch {
  unit: Unit;
  score: number;
}

/** Chapitre le plus probable pour ce devoir, ou null si rien n'est assez sûr. */
export function matchUnit(text: string | null | undefined, level: Level, subject: SubjectId): UnitMatch | null {
  if (!text) return null;
  const words = stems(text);
  if (words.size === 0) return null;
  const { units, df } = indexFor(level, subject);
  const scored = units
    .map(({ unit, stems: us }) => {
      let score = 0;
      for (const w of words) if (us.has(w)) score += 1 / (df.get(w) ?? 1);
      return { unit, score };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);
  const [best, second] = scored;
  if (!best || best.score < 1) return null;
  if (second && second.score >= best.score) return null;
  return best;
}

/** Essaie chaque matière possible et garde le chapitre le plus sûr (utile quand « Mathématiques » peut être la spé ou le tronc commun). */
export function matchAcross(text: string | null | undefined, level: Level, subjects: SubjectId[]): { subject: SubjectId; match: UnitMatch } | null {
  let best: { subject: SubjectId; match: UnitMatch } | null = null;
  for (const subject of subjects) {
    const match = matchUnit(text, level, subject);
    if (match && (!best || match.score > best.match.score)) best = { subject, match };
  }
  return best;
}
