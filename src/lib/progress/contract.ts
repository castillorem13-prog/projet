/**
 * Contrat front / back pour la sauvegarde de la progression (Phase 2).
 * À modifier seulement à deux (voir CLAUDE.md) : le serveur (src/server/progress.ts) et la base
 * (supabase/migrations/20261113170000_create_progress.sql) attendent exactement cette forme.
 */
import type { Evidence, Review } from "@/lib/curriculum/types";

/** Ce que l'appli envoie quand une séance, un contrôle blanc ou un entraînement est terminé. */
export interface AttemptPayload {
  /** Identifiant tiré au hasard (crypto.randomUUID()) une fois par tentative : renvoyer le même évite les doublons. */
  clientId: string;
  kind: "session" | "exam" | "entrainement";
  /** Identifiant de la séance dans le code. Absent pour un entraînement. */
  sessionId?: string;
  /** Chapitre principal. */
  unitId: string;
  avgSeconds?: number;
  /** Les traces créées par cette tentative (les `fresh` de applyResult / applyPractice dans store.tsx). */
  evidence: Evidence[];
  /** Les nouveaux rappels de révision (ils remplacent l'ancien rappel du même chapitre). */
  reviews: Review[];
}

/** Ce que renvoie GET /api/progress : toute la progression enregistrée de l'élève connecté. */
export interface ProgressSnapshot {
  evidence: Evidence[];
  reviews: Review[];
}
