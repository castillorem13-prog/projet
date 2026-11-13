/**
 * Fonctions à appeler depuis l'appli pour sauvegarder ou recharger la progression de l'élève connecté.
 * Elles passent par les routes serveur /api/progress (partie back).
 */
import type { AttemptPayload, ProgressSnapshot } from "./contract";

export type SaveResult = { ok: true; attemptId: string } | { ok: false; status: number; error: string };

/** Enregistre une tentative terminée. Sans compte connecté, renvoie { ok: false, status: 401 } : rien n'est perdu côté appli. */
export async function saveAttempt(payload: AttemptPayload): Promise<SaveResult> {
  try {
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => ({}))) as { attemptId?: string; error?: string };
    if (res.ok && body.attemptId) return { ok: true, attemptId: body.attemptId };
    return { ok: false, status: res.status, error: body.error ?? "Erreur inconnue." };
  } catch {
    return { ok: false, status: 0, error: "Pas de connexion internet." };
  }
}

/** Recharge toute la progression enregistrée. Renvoie null si l'élève n'est pas connecté ou en cas d'erreur. */
export async function loadProgress(): Promise<ProgressSnapshot | null> {
  try {
    const res = await fetch("/api/progress", { cache: "no-store" });
    return res.ok ? ((await res.json()) as ProgressSnapshot) : null;
  } catch {
    return null;
  }
}
