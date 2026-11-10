import type { Activity } from "@/lib/content/types";
import type { Stage } from "@/lib/curriculum/types";
import { factGenerators } from "./from-facts";
import { FACT_SETS } from "./facts";
import { GENERATOR_LIST } from "./generators";
import { LESSON_SETS } from "./lessons";
import { hash } from "./rand";
import type { Fact, FactSet, Generator, Lesson, LessonSet } from "./types";

export type { Fact, FactSet, Generator, Lesson, LessonSet };
export { FACT_SETS, LESSON_SETS };

/**
 * Graines utilisées par l'appli : les tests vérifient chacune d'elles pour chaque générateur,
 * donc tout exercice que l'élève peut voir a été contre-vérifié.
 */
export const SEEDS = 200;

/** Tous les générateurs : calculés (maths, sciences, code) et tirés des faits sourcés. */
export const GENERATORS: Generator[] = [...GENERATOR_LIST, ...factGenerators(FACT_SETS)];

const BY_UNIT = new Map<string, Generator[]>();
for (const g of GENERATORS) {
  const list = BY_UNIT.get(g.unitId);
  if (list) list.push(g);
  else BY_UNIT.set(g.unitId, [g]);
}

export const LESSONS: Lesson[] = LESSON_SETS.flatMap((s) => s.lessons);
const LESSON_OF = new Map(LESSONS.map((l) => [l.unitId, l]));
const SET_OF = new Map(LESSON_SETS.flatMap((s) => s.lessons.map((l) => [l.unitId, s] as const)));

export const generatorsOf = (unitId: string): Generator[] => BY_UNIT.get(unitId) ?? [];
export const lessonOf = (unitId: string): Lesson | undefined => LESSON_OF.get(unitId);
export const lessonSetOf = (unitId: string): LessonSet | undefined => SET_OF.get(unitId);

const RANK: Record<Stage, number> = { rappel: 0, application: 1, transfert: 2, extension: 3 };

/**
 * Exercices d'entraînement d'une unité, par séries de `per` rangées du rappel au transfert.
 * Les graines restent dans [0, SEEDS[ : uniquement des exercices vérifiés par les tests.
 */
export function practicePool(unitId: string, size = 24, per = 8): Activity[] {
  const gens = generatorsOf(unitId);
  if (!gens.length) return [];
  const salt = hash(unitId);
  const seen = new Set<string>();
  const out: Activity[] = [];
  for (let k = 0; out.length < size && k < size * 4; k++) {
    const g = gens[k % gens.length]!;
    const seed = (salt + k * 7919) % SEEDS;
    const a = g.make(seed).activity;
    const key = JSON.stringify({ ...a, id: "" });
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  const series: Activity[] = [];
  for (let i = 0; i < out.length; i += per) series.push(...out.slice(i, i + per).sort((a, b) => RANK[a.stage] - RANK[b.stage]));
  return series;
}

/** Chiffres de la banque (affichés dans la documentation et l'export). */
export function bankStats() {
  const facts = FACT_SETS.flatMap((s) => s.facts);
  return {
    lessons: LESSONS.length,
    facts: facts.length,
    generators: GENERATORS.length,
    computedGenerators: GENERATOR_LIST.length,
    unitsWithLesson: LESSON_OF.size,
    unitsWithPractice: BY_UNIT.size,
  };
}
