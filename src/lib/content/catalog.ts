import { own } from "@/lib/cx";
import type { TrackId } from "@/lib/explore/tracks";
import { CAPSULES, EXAM_LIST, SESSION_LIST } from "./catalog.generated";
import type { Grade, SubjectId } from "./types";

/**
 * Catalogue du contenu : titres, durées et liens, sans les exercices.
 * Accueil, programme, cagnotte et objectifs du jour n'ont besoin que de ça ; le contenu complet (lourd) n'est chargé
 * que par les pages qui le jouent : séance, contrôle, capsule.
 * Le fichier catalog.generated.ts est produit par `npm run gen:catalog` ; un test vérifie qu'il reste à jour.
 */

export interface SessionMeta {
  id: string;
  subject: SubjectId;
  grade: Grade;
  unitId: string;
  notion: string;
  objective: string;
  minutes: number;
  examId?: string;
  /** Nombre d'exercices de la séance. */
  activityCount: number;
}

export interface ExamMeta {
  id: string;
  sessionId: string;
  subject: SubjectId;
  grade: Grade;
  notion: string;
  title?: string;
  minutes: number;
  format?: { lines: string[]; source: string; verification: "cross_checked" | "single_source" };
  /** Nombre d'exercices de l'épreuve. */
  exerciseCount: number;
}

export interface CapsuleMeta {
  id: string;
  track: TrackId;
  title: string;
  promise: string;
  minutes: number;
}

export { CAPSULES, EXAM_LIST, SESSION_LIST };

export const SESSIONS: Record<string, SessionMeta> = Object.fromEntries(SESSION_LIST.map((s) => [s.id, s]));
export const EXAMS: Record<string, ExamMeta> = Object.fromEntries(EXAM_LIST.map((e) => [e.id, e]));

export const findSession = (id: string | null | undefined) => own(SESSIONS, id);
export const findExam = (id: string | null | undefined) => own(EXAMS, id);

export function getSessionMeta(id: string): SessionMeta {
  const s = findSession(id);
  if (!s) throw new Error(`Séance inconnue : ${id}`);
  return s;
}
