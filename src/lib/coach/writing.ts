/**
 * Relecture locale d'une réponse rédigée : le coach repère des indices observables (une citation, des connecteurs,
 * des dates, des verbes à l'imparfait…) et les relie aux critères de la grille.
 * Ce n'est pas une note ni une correction : il signale ce qu'il a trouvé (avec les mots repérés) et ce qu'il ne peut
 * pas juger. L'élève reste celui qui évalue sa réponse ; une correction rédigée par un modèle de langue passera,
 * plus tard, par une API côté serveur (voir provider.ts).
 */

export type WritingCheck =
  | { criterion: number; kind: "quote"; label?: string }
  | { criterion: number; kind: "words"; words: string[]; min?: number; label: string }
  | { criterion: number; kind: "pattern"; pattern: string; min?: number; label: string; exclude?: string[] };

export interface CriterionReview {
  criterion: number;
  status: "repere" | "a-verifier";
  detail: string;
  found: string[];
}

export interface WritingReview {
  criteria: CriterionReview[];
  /** Remarques de forme, valables pour toutes les rédactions. */
  form: string[];
  words: number;
  sentences: number;
}

export const CONNECTORS = ["ainsi", "en effet", "donc", "pourtant", "cependant", "car", "mais", "alors", "par conséquent", "de plus", "en revanche", "toutefois", "c'est pourquoi", "par exemple", "enfin", "d'abord", "ensuite"];

const norm = (t: string) => t.toLowerCase().replace(/[’]/g, "'");
const countWords = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
const splitSentences = (t: string) => t.split(/(?<=[.!?…])\s+/).map((x) => x.trim()).filter((x) => x.length > 1);

function findWords(text: string, words: string[]): string[] {
  const t = norm(text);
  return words.filter((w) => new RegExp(`(^|[^a-zà-ÿ])${norm(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-zà-ÿ])`, "i").test(t));
}

function runCheck(text: string, c: WritingCheck): { ok: boolean; found: string[]; detail: string } {
  if (c.kind === "quote") {
    const quotes = text.match(/«[^»]{2,}»|"[^"]{2,}"|“[^”]{2,}”/g) ?? [];
    return quotes.length
      ? { ok: true, found: quotes.slice(0, 2).map((q) => q.trim()), detail: `${quotes.length > 1 ? `${quotes.length} citations repérées` : "Une citation repérée"} entre guillemets.` }
      : { ok: false, found: [], detail: "Aucun passage entre guillemets : as-tu cité le texte ?" };
  }
  if (c.kind === "words") {
    const found = findWords(text, c.words);
    const min = c.min ?? 1;
    return found.length >= min
      ? { ok: true, found, detail: `${c.label} : ${found.slice(0, 4).join(", ")}.` }
      : { ok: false, found, detail: found.length ? `${c.label} : ${found.join(", ")} ; il en faudrait au moins ${min}.` : `${c.label} : rien repéré.` };
  }
  const re = new RegExp(c.pattern, "giu");
  const exclude = new Set((c.exclude ?? []).map(norm));
  const found = Array.from(new Set((text.match(re) ?? []).map((m) => m.trim()).filter((m) => !exclude.has(norm(m)))));
  const min = c.min ?? 1;
  return found.length >= min
    ? { ok: true, found, detail: `${c.label} : ${found.slice(0, 5).join(", ")}.` }
    : { ok: false, found, detail: found.length ? `${c.label} : ${found.join(", ")} ; il en faudrait au moins ${min}.` : `${c.label} : rien repéré.` };
}

export function reviewWriting(text: string, checks: WritingCheck[] = []): WritingReview {
  const sentences = splitSentences(text);
  const byCriterion = new Map<number, CriterionReview>();
  for (const c of checks) {
    const r = runCheck(text, c);
    const prev = byCriterion.get(c.criterion);
    // Plusieurs vérifications pour un même critère : il faut qu'elles soient toutes repérées.
    const status = (prev?.status ?? "repere") === "repere" && r.ok ? "repere" : "a-verifier";
    byCriterion.set(c.criterion, { criterion: c.criterion, status, detail: prev ? `${prev.detail} ${r.detail}` : r.detail, found: [...(prev?.found ?? []), ...r.found] });
  }
  const form: string[] = [];
  const trimmed = text.trim();
  if (trimmed && !/^[A-ZÀ-ÖØ-Þ«"“]/.test(trimmed)) form.push("Commence par une majuscule.");
  if (trimmed && !/[.!?…»"”]$/.test(trimmed)) form.push("Termine par un point.");
  const long = sentences.filter((s) => countWords(s) > 40);
  if (long.length) form.push(`${long.length > 1 ? `${long.length} phrases dépassent` : "Une phrase dépasse"} 40 mots : coupe-la pour qu'on suive ton idée.`);
  if (sentences.length === 1 && countWords(text) > 25) form.push("Une seule phrase : découpe ton raisonnement en plusieurs phrases.");
  return { criteria: Array.from(byCriterion.values()).sort((a, b) => a.criterion - b.criterion), form, words: countWords(text), sentences: sentences.length };
}

/* ——— Vérifications partagées ——— */

/** Verbes à l'imparfait (3e personne) : terminaisons -ait, -aient. */
export const IMPARFAIT = String.raw`(?<![a-zà-ÿ'])[a-zà-ÿ']{2,}(?:ait|aient)(?![a-zà-ÿ])`;
/** Verbes au passé simple (3e personne) : -a, -it, -ut des verbes courants d'un récit, -èrent, -irent, -urent. Repérage approximatif. */
export const PASSE_SIMPLE = String.raw`(?<![a-zà-ÿ'])(?:s'|l')?[a-zà-ÿ]{2,}(?:èrent|irent|urent|(?<![aiu])a|(?<!a)it|ut)(?![a-zà-ÿ])`;
/** Mots en -a, -it, -ut qui ne sont pas des verbes au passé simple (faux positifs fréquents). */
export const NOT_PASSE_SIMPLE = ["cela", "déjà", "voilà", "petit", "nuit", "lit", "fruit", "bruit", "esprit", "début", "salut", "but", "tout", "minuit", "produit", "circuit", "habit", "crédit", "toit", "doit", "droit", "endroit", "froid", "soit", "était", "avait", "faisait", "brillait", "saluait", "luisait", "dormait", "fumait", "attendait", "gardait", "il était", "huit", "écrit", "subit", "lui", "ici", "aussi", "délit", "appétit", "outil", "sa", "la", "ça", "via", "extra", "opéra", "cinéma", "sofa", "panorama"];
export const TIME_MARKERS = ["soudain", "soudainement", "tout à coup", "alors", "puis", "aussitôt", "ensuite", "enfin", "d'abord", "à cet instant", "brusquement", "au même moment", "quelques minutes plus tard"];
