export const POINTS_CONFIG = {
  base: 10,
  successBonus: 20,
  /** Sous ce temps moyen par question, la séance ne rapporte rien (anti-clic au hasard). */
  minAvgSecondsPerQuestion: 8,
  streakStep: 0.05,
  streakMax: 1.5,
  dailyCap: 150,
} as const;

export interface PointsInput {
  correctCount: number;
  totalQuestions: number;
  avgSecondsPerQuestion: number;
  streakDays: number;
  pointsEarnedToday: number;
}

export interface PointsBreakdown {
  basePoints: number;
  timeMultiplier: 0 | 1;
  streakMultiplier: number;
  rawPoints: number;
  awarded: number;
  cappedByDailyLimit: boolean;
}

/** Calcul pur des points d'une séance (dans le produit : côté serveur uniquement). */
export function computePoints(i: PointsInput, c = POINTS_CONFIG): PointsBreakdown {
  const total = Math.max(1, i.totalQuestions);
  const basePoints = c.base + (c.successBonus * Math.min(i.correctCount, total)) / total;
  const timeMultiplier = i.avgSecondsPerQuestion < c.minAvgSecondsPerQuestion ? 0 : 1;
  const streakMultiplier = Math.min(1 + c.streakStep * Math.max(0, i.streakDays), c.streakMax);
  const rawPoints = Math.floor(basePoints * timeMultiplier * streakMultiplier);
  const awarded = Math.min(rawPoints, Math.max(0, c.dailyCap - i.pointsEarnedToday));
  return { basePoints, timeMultiplier, streakMultiplier, rawPoints, awarded, cappedByDailyLimit: awarded < rawPoints };
}
