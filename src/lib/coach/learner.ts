import { TODAY, daysBetween } from "@/lib/content/calendar";
import type { Evidence } from "@/lib/curriculum/types";
import { day as dayOf, evidenceByUnit } from "@/lib/learning/mastery";

/**
 * Modèle de l'élève, calculé sur l'appareil en quelques millisecondes.
 *
 * 1. Probabilité de maîtrise (« traçage bayésien des connaissances », BKT) : après chaque réponse, on met à jour
 *    la probabilité que la notion soit acquise. Une réussite aidée pèse moins qu'une réussite seule ; une réponse
 *    rédigée auto-évaluée n'est pas prise en compte (indicative) ; un approfondissement raté ne pénalise pas.
 * 2. Rétention : une notion non revue s'oublie. La stabilité augmente avec le nombre de jours différents où elle
 *    a été réussie seule (effet de l'espacement).
 *
 * Ce modèle sert à classer les priorités (objectifs du jour, remédiation). Il ne remplace pas les six états de
 * maîtrise affichés à l'élève, qui restent calculés par des règles lisibles (src/lib/learning/mastery.ts).
 * Paramètres de départ, à calibrer sur de vraies données.
 */

export const BKT = { prior: 0.25, learn: 0.12, slip: 0.1, guess: 0.2 } as const;

/** Probabilité de « deviner » selon l'aide reçue : plus l'aide est forte, moins la réussite prouve la maîtrise. */
const GUESS_BY_ASSISTANCE = [BKT.guess, 0.35, 0.5, 0.6] as const;

export interface Knowledge {
  /** Probabilité estimée que la notion soit acquise (0 à 1). */
  pKnown: number;
  /** Probabilité de s'en souvenir aujourd'hui (maîtrise × rétention). */
  recall: number;
  /** Nombre de réponses prises en compte. */
  n: number;
  /** Jours depuis la dernière réussite seule (null si aucune). */
  daysSinceSuccess: number | null;
  /** Stabilité de la mémoire, en jours. */
  stability: number;
}

function step(p: number, correct: boolean, guess: number): number {
  const slip = BKT.slip;
  const posterior = correct ? (p * (1 - slip)) / (p * (1 - slip) + (1 - p) * guess) : (p * slip) / (p * slip + (1 - p) * (1 - guess));
  return posterior + (1 - posterior) * BKT.learn;
}

export function knowledgeOf(evidence: Evidence[], now: Date = TODAY): Knowledge {
  // Dates ISO : la comparaison directe suffit, et elle est bien plus rapide que localeCompare.
  const items = [...evidence].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  let p: number = BKT.prior;
  let n = 0;
  for (const e of items) {
    if (e.selfAssessed) continue;
    if (e.stage === "extension" && e.result !== "success") continue;
    if (e.assistance === 4) {
      p = step(p, false, BKT.guess);
    } else if (e.result === "fail") {
      p = step(p, false, BKT.guess);
    } else {
      // Une réussite au deuxième essai compte comme une réussite aidée.
      const help = Math.min(3, e.assistance + (e.result === "partial" ? 1 : 0));
      p = step(p, true, GUESS_BY_ASSISTANCE[help] ?? BKT.guess);
    }
    n++;
  }
  const autonomous = items.filter((e) => e.result === "success" && e.assistance === 0 && !e.selfAssessed);
  const days = new Set(autonomous.map((e) => dayOf(e.at)));
  // Stabilité de départ (à calibrer) : 3 jours, puis environ 12, 27, 48 jours après 1, 2, 3 jours de réussite seule.
  const stability = 3 * Math.pow(1 + days.size, 2);
  const last = autonomous.at(-1);
  const daysSinceSuccess = last ? Math.max(0, daysBetween(new Date(last.at), now)) : null;
  const retention = daysSinceSuccess === null ? 0.5 : Math.exp(-daysSinceSuccess / stability);
  return { pKnown: n ? p : 0, recall: n ? p * retention : 0, n, daysSinceSuccess, stability };
}

/** Connaissance de chaque unité travaillée. */
export function knowledgeByUnit(all: Evidence[], now: Date = TODAY): Map<string, Knowledge> {
  const out = new Map<string, Knowledge>();
  for (const [id, list] of evidenceByUnit(all)) out.set(id, knowledgeOf(list, now));
  return out;
}

/**
 * Ce que l'élève retient probablement aujourd'hui, en mots : jamais un pourcentage qui donnerait une illusion de
 * précision. Différent de l'état de maîtrise (qui ne baisse pas avec le temps) : ici, l'oubli compte.
 */
export function confidenceLabel(k: Knowledge): "pas encore assez de réponses" | "solide" | "à entretenir" | "à revoir" {
  if (k.n < 3) return "pas encore assez de réponses";
  if (k.recall >= 0.75) return "solide";
  if (k.recall >= 0.45) return "à entretenir";
  return "à revoir";
}
