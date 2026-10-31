import { parseNumber } from "./number-parser";
import { parseUnit } from "./units";

export interface AnswerSpec {
  expected: number;
  /** Unité attendue (ex. "m/s"). Absente pour une réponse sans unité. */
  unit?: string;
  tolerance?: { abs?: number; rel?: number };
  /** Une réponse sans unité n'est pas évaluée (statut "unit_missing"). */
  requireUnit?: boolean;
  /** L'unité saisie doit être exactement celle demandée (ex. « exprime en km/h »). */
  unitMustMatch?: boolean;
  /** Erreurs classiques : valeur piège + code pour un retour ciblé. */
  knownErrors?: { value: number; code: string }[];
}

export type CheckStatus = "correct" | "incorrect" | "invalid_format" | "wrong_unit" | "unit_missing";

export interface CheckResult {
  status: CheckStatus;
  value?: number;
  matchedErrorCode?: string;
}

const DEFAULT_REL = 1e-6;
const KNOWN_ERROR_REL = 0.03;

function isClose(a: number, b: number, tol?: AnswerSpec["tolerance"]): boolean {
  const abs = tol?.abs ?? 0;
  const rel = tol?.rel ?? DEFAULT_REL;
  return Math.abs(a - b) <= Math.max(abs, rel * Math.abs(b), 1e-12);
}

function split(raw: string): { num: string; unit?: string } {
  const m = /^(.*?)\s*([A-Za-zµμΩωéè][A-Za-zµμΩωéè./]*)?$/.exec(raw.trim());
  return { num: m?.[1] ?? raw, unit: m?.[2] || undefined };
}

/** Vérifie une réponse numérique. Fonction pure : côté serveur dans le produit réel. */
export function checkAnswer(spec: AnswerSpec, raw: string): CheckResult {
  // Une réponse sans unité de mesure accepte le symbole qu'un élève écrit naturellement : « 12 € », « 30 % ».
  const cleaned = spec.unit ? raw : raw.trim().replace(/\s*(€|%|euros?|pour ?cent)$/i, "");
  const { num, unit } = split(cleaned);
  const parsed = parseNumber(num);
  if (!parsed.ok) return { status: "invalid_format" };
  let value = parsed.value;

  if (spec.unit) {
    const expected = parseUnit(spec.unit);
    if (unit) {
      const given = parseUnit(unit);
      if (given.base !== expected.base) return { status: "wrong_unit", value };
      if (spec.unitMustMatch && given.factor !== expected.factor) return { status: "wrong_unit", value };
      value = (value * given.factor) / expected.factor;
    } else if (spec.requireUnit) {
      return { status: "unit_missing", value };
    }
  }

  if (isClose(value, spec.expected, spec.tolerance)) return { status: "correct", value };
  const hit = spec.knownErrors?.find(
    (e) => Math.abs(value - e.value) <= Math.max(KNOWN_ERROR_REL * Math.abs(e.value), 1e-9),
  );
  return hit ? { status: "incorrect", value, matchedErrorCode: hit.code } : { status: "incorrect", value };
}
