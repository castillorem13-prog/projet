import type { Assistance, ErrorType, Stage } from "@/lib/curriculum/types";
import type { CompetenceId, Session } from "@/lib/content/types";
import { computePoints, type PointsBreakdown } from "@/lib/points";
import { defaultErrorType } from "@/lib/coach/diagnose";

export type ItemStatus = "first" | "retry" | "missed";

export interface ItemResult {
  activityId: string;
  competence: CompetenceId;
  status: ItemStatus;
  /** Aide reçue : 0 aucune, 1 à 3 indices, 4 correction affichée. */
  assistance: Assistance;
  stage: Stage;
  /** Réponse libre auto-évaluée avec la grille (indicatif). */
  selfAssessed?: boolean;
  /** Exercice partenaire : enseigne et bonus offert (versé à la cagnotte, sans effet sur la maîtrise). */
  sponsor?: { partnerId: string; bonus: number };
  /** Type d'erreur probable repéré par le coach. */
  errorType?: ErrorType;
  seconds: number;
  reviewLabel: string;
  /** Chapitre évalué, quand il diffère de celui de la séance (épreuves blanches sur plusieurs chapitres). */
  unitId?: string;
}

export interface SessionResult {
  sessionId: string;
  items: ItemResult[];
  points: PointsBreakdown;
  avgSeconds: number;
  levelsBefore: Partial<Record<CompetenceId, number>>;
  levelsAfter: Partial<Record<CompetenceId, number>>;
}

const GAIN: Record<ItemStatus, number> = { first: 8, retry: 4, missed: 1 };

export function buildResult(args: {
  sessionId: string;
  items: ItemResult[];
  levels: Record<CompetenceId, number>;
  streak: number;
  pointsToday: number;
}): SessionResult {
  const { sessionId, items, levels, streak, pointsToday } = args;
  const correct = items.filter((i) => i.status !== "missed").length;
  const totalSeconds = items.reduce((s, i) => s + i.seconds, 0);
  const avgSeconds = items.length ? totalSeconds / items.length : 0;
  const points = computePoints({
    correctCount: correct,
    totalQuestions: items.length,
    avgSecondsPerQuestion: avgSeconds,
    streakDays: streak,
    pointsEarnedToday: pointsToday,
  });
  const levelsBefore: Partial<Record<CompetenceId, number>> = {};
  const levelsAfter: Partial<Record<CompetenceId, number>> = {};
  for (const item of items) {
    const before = levelsBefore[item.competence] ?? levels[item.competence];
    levelsBefore[item.competence] = before;
    const current = levelsAfter[item.competence] ?? before;
    levelsAfter[item.competence] = Math.min(100, current + GAIN[item.status]);
  }
  return { sessionId, items, points, avgSeconds, levelsBefore, levelsAfter };
}

/** Résultat d'exemple pour ouvrir directement l'écran de bilan depuis le panneau démo. */
export function sampleResult(session: Session, levels: Record<CompetenceId, number>): SessionResult {
  const statuses: ItemStatus[] = ["first", "first", "retry", "first", "first", "retry", "missed", "first", "first"];
  const items: ItemResult[] = [];
  let k = 0;
  for (const a of session.activities) {
    if (a.kind === "problem") {
      for (const p of a.parts) {
        const st = statuses[k++] ?? "first";
        items.push({ activityId: a.id, competence: p.competence, status: st, assistance: 0, stage: a.stage, seconds: 40, reviewLabel: p.reviewLabel, ...(st !== "first" ? { errorType: defaultErrorType(a.kind, a.stage) } : {}) });
      }
    } else {
      const st = statuses[k++] ?? "first";
      items.push({ activityId: a.id, competence: a.competence, status: st, assistance: st === "retry" ? 1 : st === "missed" ? 4 : 0, stage: a.stage, seconds: 25, reviewLabel: session.reviewLabels[a.id] ?? a.id, ...(st !== "first" ? { errorType: defaultErrorType(a.kind, a.stage) } : {}) });
    }
  }
  return buildResult({ sessionId: session.id, items, levels, streak: 4, pointsToday: 0 });
}
