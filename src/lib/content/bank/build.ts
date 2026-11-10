import type { CognitiveOperation, ErrorType, Stage } from "@/lib/curriculum/types";
import type { AnswerSpec } from "@/lib/pedagogy/answer-checker";
import type {
  BarModel,
  ClassifyActivity,
  CompetenceId,
  McqActivity,
  NumericPart,
  OrderActivity,
  ProblemActivity,
  Stimulus,
  WorkedActivity,
} from "@/lib/content/types";
import { fr } from "./format";
import { hash, rng, type Rng } from "./rand";
import type { Generated, Generator } from "./types";

/** Opérations cognitives par défaut de chaque défi. */
const OPS: Record<Stage, CognitiveOperation[]> = {
  rappel: ["retrieve"],
  application: ["apply"],
  transfert: ["transfer", "justify"],
  extension: ["analyze"],
};

interface Common {
  id: string;
  stage: Stage;
  competence: CompetenceId;
  ops?: CognitiveOperation[];
  hint: string;
  hints?: [string, string];
  solution: string[];
  takeaway: string;
  stimulus?: Stimulus | Stimulus[];
}

/** Les trois indices (orientation, structure, début de correction) doivent être distincts. */
function hintsFor(hint: string, takeaway: string, solution: string[], given?: [string, string]): [string, string] {
  let second = given?.[0] ?? takeaway;
  let third = given?.[1] ?? solution[0] ?? takeaway;
  if (second.trim() === hint.trim()) second = `À retenir : ${takeaway}`;
  if (third.trim() === hint.trim() || third.trim() === second.trim()) third = `Début de la correction : ${solution[0] ?? takeaway}`;
  return [second, third];
}

function base(c: Common) {
  return {
    id: c.id,
    stage: c.stage,
    competence: c.competence,
    ops: c.ops ?? OPS[c.stage],
    hint: c.hint,
    hints: hintsFor(c.hint, c.takeaway, c.solution, c.hints),
    solution: c.solution,
    takeaway: c.takeaway,
    ...(c.stimulus ? { stimulus: c.stimulus } : {}),
  };
}

export interface Choice {
  text: string;
  feedback: string;
}

/** Choix distincts entre eux et de la bonne réponse (comparés sans casse ni espaces autour). */
export function distinct(answer: Choice, candidates: Choice[], n = candidates.length): Choice[] {
  const seen = new Set([answer.text.trim().toLowerCase()]);
  const out: Choice[] = [];
  for (const c of candidates) {
    const k = c.text.trim().toLowerCase();
    if (seen.has(k) || out.length >= n) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
}

/** QCM : la bonne réponse est placée au hasard (graine) ; un piège identique à un autre choix est écarté. */
export function mcq(r: Rng, c: Common & { prompt: string; answer: Choice; wrong: Choice[]; count?: number }): McqActivity {
  const options = r.shuffle([c.answer, ...distinct(c.answer, c.wrong, (c.count ?? 4) - 1)]);
  return { kind: "mcq", ...base(c), prompt: c.prompt, options, correct: options.indexOf(c.answer) };
}

/**
 * Choisit n valeurs pièges distinctes entre elles et de la bonne réponse (comparées une fois écrites),
 * d'abord parmi les erreurs classiques proposées, puis avec `fallback`.
 */
export function traps(answer: number, candidates: { value: number; feedback: string }[], n: number, fallback: (i: number) => { value: number; feedback: string }, show: (x: number) => string = fr) {
  const seen = new Set([show(answer)]);
  const out: { value: number; feedback: string }[] = [];
  const take = (c: { value: number; feedback: string }) => {
    if (!Number.isFinite(c.value) || out.length >= n) return;
    const key = show(c.value);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(c);
  };
  candidates.forEach(take);
  for (let i = 0; out.length < n && i < 50; i++) take(fallback(i));
  return out;
}

/** QCM à réponse numérique, avec ses pièges. */
export function mcqNumber(
  r: Rng,
  c: Common & { prompt: string; answer: number; right: string; wrong: { value: number; feedback: string }[]; show?: (x: number) => string; count?: number },
): McqActivity {
  const show = c.show ?? fr;
  const wrong = traps(c.answer, c.wrong, (c.count ?? 4) - 1, (i) => ({ value: c.answer + (i % 2 ? -1 : 1) * (Math.floor(i / 2) + 1) * (Math.abs(c.answer) >= 20 ? 10 : 1), feedback: "Ce n'est pas le bon résultat : refais le calcul étape par étape." }), show);
  return mcq(r, { ...c, answer: { text: show(c.answer), feedback: c.right }, wrong: wrong.map((w) => ({ text: show(w.value), feedback: w.feedback })) });
}

export interface PartSpec {
  prompt: string;
  expected: number;
  unit?: string;
  requireUnit?: boolean;
  unitMustMatch?: boolean;
  tolerance?: AnswerSpec["tolerance"];
  units?: string[];
  /** Erreurs classiques : valeur, code, retour ciblé. */
  errors?: { value: number; code: string; message: string; type?: ErrorType }[];
  hint: string;
  solution: string[];
  recap: string;
  review: string;
  competence?: CompetenceId;
}

/** Exercice à réponses numériques, en une ou plusieurs questions. */
export function problem(c: Omit<Common, "solution"> & { context: string; parts: PartSpec[]; solution?: string[]; model?: BarModel }): ProblemActivity {
  const parts: NumericPart[] = c.parts.map((p, i) => {
    const label = String.fromCharCode(97 + i);
    const seen = new Set<string>([fr(p.expected)]);
    const errors = (p.errors ?? []).filter((e) => {
      const key = fr(e.value);
      if (!Number.isFinite(e.value) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const answer: AnswerSpec = {
      expected: p.expected,
      ...(p.unit ? { unit: p.unit } : {}),
      ...(p.requireUnit ? { requireUnit: true } : {}),
      ...(p.unitMustMatch ? { unitMustMatch: true } : {}),
      ...(p.tolerance ? { tolerance: p.tolerance } : {}),
      ...(errors.length ? { knownErrors: errors.map((e) => ({ value: e.value, code: e.code })) } : {}),
    };
    const types = errors.filter((e) => e.type);
    return {
      id: `${c.id}-${label}`,
      label,
      competence: p.competence ?? c.competence,
      prompt: p.prompt,
      answer,
      ...(p.units ? { units: p.units } : {}),
      hint: p.hint.trim() === c.takeaway.trim() ? `Piste : ${p.hint}` : p.hint,
      solution: p.solution,
      ...(errors.length ? { errors: Object.fromEntries(errors.map((e) => [e.code, e.message])) } : {}),
      ...(types.length ? { errorTypes: Object.fromEntries(types.map((e) => [e.code, e.type!])) } : {}),
      recap: p.recap,
      reviewLabel: p.review,
    };
  });
  const solution = c.solution ?? [];
  return {
    kind: "problem",
    id: c.id,
    stage: c.stage,
    competence: c.competence,
    ops: c.ops ?? OPS[c.stage],
    hint: c.hint,
    solution,
    takeaway: c.takeaway,
    ...(c.stimulus ? { stimulus: c.stimulus } : {}),
    context: c.context,
    parts,
    ...(c.model ? { model: c.model } : {}),
  };
}

/** Exercice à une seule question numérique. */
export function ask(c: Omit<Common, "solution"> & Omit<PartSpec, "hint" | "review"> & { context: string; review: string; partHint?: string; model?: BarModel }): ProblemActivity {
  return problem({
    id: c.id,
    stage: c.stage,
    competence: c.competence,
    ...(c.ops ? { ops: c.ops } : {}),
    hint: c.hint,
    takeaway: c.takeaway,
    ...(c.stimulus ? { stimulus: c.stimulus } : {}),
    ...(c.model ? { model: c.model } : {}),
    context: c.context,
    parts: [
      {
        prompt: c.prompt,
        expected: c.expected,
        ...(c.unit ? { unit: c.unit } : {}),
        ...(c.requireUnit ? { requireUnit: true } : {}),
        ...(c.tolerance ? { tolerance: c.tolerance } : {}),
        ...(c.units ? { units: c.units } : {}),
        ...(c.errors ? { errors: c.errors } : {}),
        hint: c.partHint ?? c.hint,
        solution: c.solution,
        recap: c.recap,
        review: c.review,
      },
    ],
  });
}

/** Document fabriqué pour l'exercice (tableau de données fictives), signalé comme tel. */
export function mockTable(title: string, columns: string[], rows: string[][]): Stimulus {
  return { kind: "table", title, columns, rows, provenance: { authentic: false, type: "Données fictives écrites pour l'exercice", verification: "illustrative_mock" } };
}

/** Programme fabriqué pour l'exercice. */
export function mockCode(title: string, lines: string[], language = "Python"): Stimulus {
  return { kind: "code", title, language, lines, provenance: { authentic: false, type: "Programme écrit pour l'exercice", limits: "Exemple court, à lire comme le ferait l'ordinateur.", verification: "illustrative_mock" } };
}

/** Remettre des étapes dans l'ordre : l'ordre affiché n'est jamais déjà le bon. */
export function order(r: Rng, c: Common & { prompt: string; steps: string[] }): OrderActivity {
  const idx = c.steps.map((_, i) => i);
  let display = r.shuffle(idx);
  if (display.every((v, i) => v === i)) display = [...idx.slice(1), idx[0]!];
  return { kind: "order", ...base(c), prompt: c.prompt, steps: c.steps, display };
}

/** Classer des éléments dans des catégories. */
export function classify(r: Rng, c: Common & { prompt: string; categories: string[]; items: { text: string; category: number; feedback: string }[] }): ClassifyActivity {
  return { kind: "classify", ...base(c), prompt: c.prompt, categories: c.categories, items: r.shuffle(c.items) };
}

/** Exemple résolu dont une étape est à compléter. */
export function worked(r: Rng, c: Common & { prompt: string; steps: { text: string; why: string }[]; blank: number; answer: Choice; wrong: Choice[] }): WorkedActivity {
  const options = r.shuffle([c.answer, ...c.wrong]);
  const steps = c.steps.map((s, i) => (i === c.blank ? { ...s, text: "…" } : s));
  return { kind: "worked", ...base(c), prompt: c.prompt, steps, blank: c.blank, options, correct: options.indexOf(c.answer) };
}

/** Déclare un générateur : chaque graine donne un exercice et sa contre-épreuve. */
export function gen(def: { id: string; unit: string; title: string; stage: Stage; make: (r: Rng, id: string) => Generated }): Generator {
  const salt = hash(def.id);
  return {
    id: def.id,
    unitId: def.unit,
    title: def.title,
    stage: def.stage,
    make: (seed) => def.make(rng(salt + seed * 2654435761), `${def.id}~${seed}`),
  };
}
