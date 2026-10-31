/**
 * Brouillon d'une épreuve rédigée, gardé sur l'appareil : une épreuve de 4 heures survit à une page rechargée.
 * Le temps se calcule à partir des heures de début et de pause, pas d'un compteur : il reste juste après un rechargement.
 */

export type DraftMode = "eaf" | "philo";

export interface Draft {
  subjectId: string | null;
  problematique: string;
  parties: { idee: string; exemples: string }[];
  copie: string;
  startedAt: number | null;
  /** Chrono en pause depuis cet instant. */
  pausedAt: number | null;
  /** Temps déjà passé en pause, en millisecondes. */
  pausedMs: number;
}

export const EMPTY_DRAFT: Draft = { subjectId: null, problematique: "", parties: [{ idee: "", exemples: "" }, { idee: "", exemples: "" }], copie: "", startedAt: null, pausedAt: null, pausedMs: 0 };

export const draftKey = (mode: DraftMode) => `learnward:ecrit:${mode}`;
export const DRAFT_KEYS = [draftKey("eaf"), draftKey("philo")];

/** Secondes de travail, pauses déduites. */
export function draftSeconds(d: Draft, now: number): number {
  if (!d.startedAt) return 0;
  return Math.max(0, Math.round(((d.pausedAt ?? now) - d.startedAt - d.pausedMs) / 1000));
}

export function togglePause(d: Draft, now: number): Draft {
  return d.pausedAt ? { ...d, pausedAt: null, pausedMs: d.pausedMs + (now - d.pausedAt) } : { ...d, pausedAt: now };
}

/** Relit un brouillon : les champs manquants d'une ancienne version sont complétés. */
export function parseDraft(raw: string | null): Draft {
  if (!raw) return EMPTY_DRAFT;
  try {
    const d = JSON.parse(raw) as Partial<Draft>;
    return { ...EMPTY_DRAFT, ...d, parties: Array.isArray(d.parties) && d.parties.length ? d.parties : EMPTY_DRAFT.parties, pausedMs: typeof d.pausedMs === "number" ? d.pausedMs : 0 };
  } catch {
    return EMPTY_DRAFT;
  }
}
