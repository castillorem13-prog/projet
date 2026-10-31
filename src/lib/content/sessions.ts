import { own } from "@/lib/cx";
import { LANGUES_ARTS_SESSIONS } from "./sessions-langues";
import { LETTRES_SESSIONS } from "./sessions-lettres";
import { MATHS_SESSIONS } from "./sessions-maths";
import { SCIENCES_SESSIONS } from "./sessions-sciences";
import type { Session } from "./types";

/**
 * Registre des séances jouables du prototype.
 * Contenu rédigé à la main, à faire valider par des enseignants ; dans le produit, les séances sont générées
 * à partir d'objectifs vérifiés, puis contrôlées (calculs, sources, consignes) avant d'être montrées.
 */
export const ALL_SESSIONS: Session[] = [...MATHS_SESSIONS, ...LETTRES_SESSIONS, ...SCIENCES_SESSIONS, ...LANGUES_ARTS_SESSIONS];

export const SESSIONS: Record<string, Session> = Object.fromEntries(ALL_SESSIONS.map((s) => [s.id, s]));

export function findSession(id: string | undefined): Session | undefined {
  return own(SESSIONS, id);
}

export function getSession(id: string): Session {
  const s = own(SESSIONS, id);
  if (!s) throw new Error(`Séance inconnue : ${id}`);
  return s;
}
