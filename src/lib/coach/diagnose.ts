import type { Activity, NumericPart } from "@/lib/content/types";
import type { ErrorType, Evidence, Stage } from "@/lib/curriculum/types";

/**
 * Diagnostic des erreurs, d'après les cinq types du référentiel de mathématiques : le retour dit ce qui coince
 * (notion, étape, calcul, lecture de la question, rédaction) et propose une aide adaptée.
 * Déterministe : il s'appuie sur les erreurs classiques déclarées dans les exercices et sur quelques signatures
 * numériques (signe, virgule). Quand rien ne permet de conclure, il ne conclut pas : « probable » reste affiché.
 */

export const ERROR_TYPES: Record<ErrorType, { label: string; short: string; tip: string; remedy: string }> = {
  conceptuelle: {
    label: "Notion à revoir",
    short: "Notion",
    tip: "Ce n'est pas une étourderie : c'est le sens de la notion qui pose problème.",
    remedy: "Reprendre la notion avec une représentation (schéma, modèle en barres), puis un exemple résolu.",
  },
  procedurale: {
    label: "Étape oubliée ou mal faite",
    short: "Méthode",
    tip: "Tu connais la méthode, mais une étape a sauté ou s'est mal enchaînée.",
    remedy: "Refaire un exemple résolu en disant chaque étape, puis un exercice proche sans aide.",
  },
  calcul: {
    label: "Erreur de calcul",
    short: "Calcul",
    tip: "Le raisonnement tient : c'est le calcul (signe, virgule, opération) qui a dérapé.",
    remedy: "Vérifier l'ordre de grandeur avant de valider ; quelques automatismes de calcul chaque jour.",
  },
  strategique: {
    label: "Lecture de la question",
    short: "Question",
    tip: "Ta réponse répond à une autre question, ou utilise une donnée qui ne sert pas.",
    remedy: "Avant de calculer : que cherche-t-on, quelles données servent, quelle stratégie ?",
  },
  redaction: {
    label: "Rédaction ou justification",
    short: "Rédaction",
    tip: "L'idée est là, mais la justification, la citation ou la notation est incomplète.",
    remedy: "Relire avec la grille, critère par critère, avant de rendre.",
  },
};

/** Erreurs classiques déclarées dans les exercices, rangées par type. */
export const CODE_TYPES: Record<string, ErrorType> = {
  // Le sens de l'opération ou de la notion
  inverse: "conceptuelle", multiplie: "conceptuelle", divise: "conceptuelle", additif: "conceptuelle", addition: "conceptuelle",
  numerateur: "conceptuelle", juxtaposition: "conceptuelle", pourcent: "conceptuelle", paires: "conceptuelle", humain: "conceptuelle",
  double: "conceptuelle", un_seul: "conceptuelle", une_part: "conceptuelle", produit: "conceptuelle", croche: "conceptuelle",
  noire: "conceptuelle", image: "conceptuelle", soustraction: "conceptuelle", strict: "conceptuelle", egalite: "conceptuelle",
  fraction: "conceptuelle",
  // Une étape de la méthode oubliée ou décalée
  oubli: "procedurale", oubli_b: "procedurale", oubli_n: "procedurale", oubli_division: "procedurale", oubli_soustraction: "procedurale",
  oubli_abonnement: "procedurale", zero: "procedurale", non_converti: "procedurale", parentheses: "procedurale", priorite: "procedurale",
  decalage: "procedurale", signe: "procedurale", arrondi: "procedurale",
  // Une autre question, une autre donnée
  formule_b: "strategique", deja: "strategique", reduction: "strategique", prix: "strategique", offre: "strategique",
  offre30: "strategique", demande30: "strategique", excedent: "strategique", unite: "strategique", ajout: "strategique", division: "strategique",
};

const close = (a: number, b: number) => Math.abs(a - b) <= Math.max(1e-9, Math.abs(b) * 1e-6);

/** Erreur sur une question numérique : code déclaré d'abord, puis signatures de calcul (signe, virgule). */
export function diagnoseNumeric(part: Pick<NumericPart, "answer"> & { errorTypes?: Record<string, ErrorType> }, value: number | undefined, matchedCode?: string): ErrorType | undefined {
  if (matchedCode) return part.errorTypes?.[matchedCode] ?? CODE_TYPES[matchedCode] ?? "conceptuelle";
  if (value === undefined) return undefined;
  const expected = part.answer.expected;
  if (expected !== 0 && close(value, -expected)) return "calcul";
  for (const k of [10, 100, 1000]) if (close(value, expected * k) || close(value, expected / k)) return "calcul";
  // Un résultat proche (moins de 10 % d'écart) signale une erreur de calcul plutôt qu'une erreur de méthode.
  if (expected !== 0 && Math.abs(value - expected) / Math.abs(expected) < 0.1) return "calcul";
  return undefined;
}

/** Type d'erreur par défaut d'un exercice raté, selon son format et son étape (diagnostic « probable »). */
export function defaultErrorType(kind: Activity["kind"], stage: Stage): ErrorType {
  if (kind === "writing") return "redaction";
  if (kind === "spot-error") return "strategique";
  if (stage === "rappel") return "conceptuelle";
  if (stage === "application") return kind === "order" || kind === "worked" ? "procedurale" : "conceptuelle";
  return "strategique";
}

export interface ErrorProfile {
  /** Erreurs par type, des plus fréquentes aux plus rares. */
  counts: { type: ErrorType; n: number }[];
  total: number;
  /** Type dominant s'il représente au moins 40 % des erreurs (et au moins deux occurrences). */
  dominant?: ErrorType;
}

export function errorProfile(evidence: Evidence[]): ErrorProfile {
  const counts = new Map<ErrorType, number>();
  for (const e of evidence) if (e.errorType) counts.set(e.errorType, (counts.get(e.errorType) ?? 0) + 1);
  const list = Array.from(counts, ([type, n]) => ({ type, n })).sort((a, b) => b.n - a.n);
  const total = list.reduce((s, x) => s + x.n, 0);
  const top = list[0];
  const dominant = top && top.n >= 2 && top.n / total >= 0.4 ? top.type : undefined;
  return { counts: list, total, dominant };
}
