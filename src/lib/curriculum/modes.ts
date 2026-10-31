import { MASTERY, UNLOCK_STATE, WEAK_STATE, atLeast } from "@/lib/learning/mastery";
import { advanceFor, basesFor, findUnit, nextLevel, prevLevel, statusIn, type UnitStatus } from "./index";
import type { ClassProgress, Level, MasteryState, SubjectId, Unit } from "./types";

/**
 * Les trois façons de travailler le programme :
 *  - « Mon année » : les unités de son niveau, dans l'ordre de sa classe ;
 *  - « Révision » : les bases de l'année précédente, en tête celles qui servent maintenant ;
 *  - « Avance » : les unités de l'année suivante, ouvertes quand ce qui les prépare est maîtrisé.
 * Fonctions pures : elles prennent l'état de maîtrise en paramètre (testables sans interface).
 */

export type MasteryOf = (unitId: string) => MasteryState;
export type ProgressMap = Partial<Record<SubjectId, ClassProgress>>;

/** Prérequis de l'année de l'élève qui ne sont pas encore maîtrisés (provisoire au moins). */
export function blockingNeeds(unit: Unit, level: Level, mastery: MasteryOf): Unit[] {
  return (unit.needs ?? [])
    .map(findUnit)
    .filter((u): u is Unit => Boolean(u) && u?.level === level)
    .filter((u) => !atLeast(mastery(u.id), UNLOCK_STATE));
}

/** Une unité de l'année suivante s'ouvre quand tout ce qui la prépare dans l'année de l'élève est maîtrisé. */
export function isUnlocked(unit: Unit, level: Level, mastery: MasteryOf): boolean {
  const own = (unit.needs ?? []).map(findUnit).filter((u) => u?.level === level);
  return own.length > 0 && blockingNeeds(unit, level, mastery).length === 0;
}

export interface BaseReco {
  base: Unit;
  target: Unit;
  targetStatus: UnitStatus;
  state: MasteryState;
}

/**
 * Bases de l'année précédente à revoir en priorité : celles dont dépend le chapitre en cours
 * (ou les deux suivants) et qui ne sont pas encore « en consolidation ».
 */
export function recommendedBases(level: Level, progress: ProgressMap, mastery: MasteryOf): BaseReco[] {
  const prev = prevLevel(level);
  if (!prev) return [];
  const out = new Map<string, BaseReco>();
  for (const p of Object.values(progress)) {
    if (!p?.current) continue;
    const c = p.order.indexOf(p.current);
    for (const id of p.order.slice(Math.max(0, c), c + 3)) {
      const target = findUnit(id);
      const targetStatus = statusIn(p, id);
      if (!target || !targetStatus) continue;
      for (const base of (target.needs ?? []).map(findUnit)) {
        if (!base || base.level !== prev || out.has(base.id)) continue;
        const state = mastery(base.id);
        if (!atLeast(state, WEAK_STATE)) out.set(base.id, { base, target, targetStatus, state });
      }
    }
  }
  return Array.from(out.values()).sort((a, b) => Number(b.targetStatus === "en-cours") - Number(a.targetStatus === "en-cours") || MASTERY[a.state].rank - MASTERY[b.state].rank);
}

export interface RevisionRow {
  unit: Unit;
  usefulFor: Unit[];
  state: MasteryState;
  /** Sert à une unité en cours ou à venir dans la classe. */
  useful: boolean;
}

/** Tout le programme de l'année précédente pour une matière, trié : utile maintenant et fragile d'abord. */
export function revisionRows(level: Level, subject: SubjectId, progress: ClassProgress | undefined, mastery: MasteryOf): RevisionRow[] {
  return basesFor(level, subject)
    .map(({ unit, usefulFor }) => ({
      unit,
      usefulFor,
      state: mastery(unit.id),
      useful: usefulFor.some((u) => statusIn(progress, u.id) !== "vu"),
    }))
    .sort((a, b) => Number(b.useful) - Number(a.useful) || MASTERY[a.state].rank - MASTERY[b.state].rank);
}

export interface AdvanceRow {
  unit: Unit;
  /** Unités de l'année de l'élève qui la préparent. */
  after: Unit[];
  open: boolean;
  blocking: Unit[];
}

/** Unités de l'année suivante pour une matière, ouvertes d'abord. */
export function advanceRows(level: Level, subject: SubjectId, mastery: MasteryOf, allowed?: SubjectId[]): AdvanceRow[] {
  if (!nextLevel(level)) return [];
  return advanceFor(level, subject, allowed)
    .map(({ unit, after }) => ({ unit, after, open: isUnlocked(unit, level, mastery), blocking: blockingNeeds(unit, level, mastery) }))
    .sort((a, b) => Number(b.open) - Number(a.open) || a.blocking.length - b.blocking.length);
}
