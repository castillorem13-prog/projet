import { LEVEL_ORDER, levelRank, nextLevel, prevLevel } from "./levels";
import { getSource, sourceFor } from "./sources";
import type { ClassProgress, CurriculumSource, Level, SubjectId, Unit } from "./types";
import { COLLEGE_UNITS } from "./units-college";
import { LYCEE_UNITS } from "./units-lycee";
import { UNITS_2026 } from "./units-2026";

export * from "./types";

/** Toutes les unités, chacune rattachée à la version de programme en vigueur pour son niveau en 2026-2027. */
export const UNITS: Unit[] = [...COLLEGE_UNITS, ...LYCEE_UNITS, ...UNITS_2026].map((u) => {
  const src = sourceFor(u.level, u.subject);
  return { ...u, sourceId: src?.id ?? "" };
});

const BY_ID = new Map(UNITS.map((u) => [u.id, u]));

/** Index construits une fois : ces recherches reviennent à chaque affichage du programme. */
const BY_LEVEL_SUBJECT = new Map<string, Unit[]>();
const NEXT_OF = new Map<string, Unit[]>();
const push = <K>(map: Map<K, Unit[]>, key: K, u: Unit) => {
  const list = map.get(key);
  if (list) list.push(u);
  else map.set(key, [u]);
};
for (const u of UNITS) {
  push(BY_LEVEL_SUBJECT, `${u.level}|${u.subject}`, u);
  for (const need of u.needs ?? []) push(NEXT_OF, need, u);
}

export function getUnit(id: string): Unit {
  const u = BY_ID.get(id);
  if (!u) throw new Error(`Unité inconnue : ${id}`);
  return u;
}
export const findUnit = (id: string | null | undefined) => (id ? BY_ID.get(id) : undefined);

export function sourceOf(u: Unit): CurriculumSource | undefined {
  return u.sourceId ? getSource(u.sourceId) : undefined;
}

/** Unités d'une matière à un niveau, dans l'ordre indicatif du programme. */
export function unitsOf(level: Level, subject: SubjectId): Unit[] {
  return BY_LEVEL_SUBJECT.get(`${level}|${subject}`) ?? [];
}

export type UnitStatus = "vu" | "en-cours" | "a-venir";

/** Statut d'une unité selon la progression de la classe (et non selon une date inventée). */
export function statusIn(progress: ClassProgress | undefined, unitId: string): UnitStatus | null {
  if (!progress || !progress.current) return null;
  const i = progress.order.indexOf(unitId);
  const c = progress.order.indexOf(progress.current);
  if (i < 0 || c < 0) return null;
  return i < c ? "vu" : i === c ? "en-cours" : "a-venir";
}

/** Unités qui s'appuient sur `id` (même niveau ou niveau suivant). */
export function nextOf(id: string): Unit[] {
  return NEXT_OF.get(id) ?? [];
}

/** Matières « parentes » pour les liens entre niveaux (la SNT et la NSI prolongent la technologie…). */
const FAMILY: Partial<Record<SubjectId, SubjectId[]>> = {
  techno: ["snt", "si", "nsi"],
  snt: ["nsi"],
  hg: ["hggsp"],
  emc: ["hggsp", "dgemc"],
  francais: ["hlp", "philo"],
  anglais: ["llcer"],
  maths: ["maths-comp", "maths-exp"],
  "maths-tc": ["maths-comp"],
  sciences: ["physique", "svt"],
};

/** Bases de l'année précédente pour une matière, avec les unités de l'année qu'elles servent. */
export function basesFor(level: Level, subject: SubjectId): { unit: Unit; usefulFor: Unit[] }[] {
  const prev = prevLevel(level);
  if (!prev) return [];
  const current = unitsOf(level, subject);
  const sources: SubjectId[] = [subject, ...(Object.entries(FAMILY).filter(([, kids]) => kids?.includes(subject)).map(([k]) => k as SubjectId))];
  const prevUnits = UNITS.filter((u) => u.level === prev && sources.includes(u.subject));
  return prevUnits.map((u) => ({ unit: u, usefulFor: current.filter((c) => c.needs?.includes(u.id)) }));
}

/** Unités de l'année suivante préparées par une matière (spécialités comprises). */
export function advanceFor(level: Level, subject: SubjectId, allowed?: SubjectId[]): { unit: Unit; after: Unit[] }[] {
  const next = nextLevel(level);
  if (!next) return [];
  const mine = new Set(unitsOf(level, subject).map((u) => u.id));
  return UNITS.filter((u) => u.level === next && (!allowed || allowed.includes(u.subject)) && u.needs?.some((n) => mine.has(n))).map((unit) => ({
    unit,
    after: (unit.needs ?? []).map(getUnit).filter((n) => mine.has(n.id)),
  }));
}

export { LEVEL_ORDER, levelRank, nextLevel, prevLevel };
