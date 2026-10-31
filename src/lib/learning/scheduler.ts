import { TODAY, daysBetween, frDate, isoDay, parseDay } from "@/lib/content/calendar";
import type { Evidence, MasteryState, Review } from "@/lib/curriculum/types";

/**
 * Rappels espacés : la prochaine révision dépend du résultat et de l'aide reçue, pas d'un calendrier fixe.
 * Calendrier de départ (configurable) : erreur ou aide forte → J+1 ; réussite aidée → J+3 ;
 * tout réussi seul → J+7, puis J+14 et J+30 quand la maîtrise se confirme.
 * Chaque rappel garde la raison pour laquelle il revient : elle est montrée à l'élève.
 */

const DAY_NAMES = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

export function scheduleAfterSession(unitId: string, all: Evidence[], state: MasteryState, now: Date = TODAY): Review {
  // Un approfondissement raté (facultatif) ne rapproche pas le rappel.
  const items = all.filter((e) => e.stage !== "extension" || e.result === "success");
  const fails = items.filter((e) => e.result === "fail").length;
  const heavy = items.filter((e) => e.assistance >= 2).length;
  const light = items.filter((e) => e.result === "partial" || e.assistance === 1 || e.selfAssessed).length;
  const when = DAY_NAMES[now.getDay()];

  if (fails || heavy) {
    return {
      unitId,
      due: isoDay(addDays(now, 1)),
      reason: fails ? `${cap(when)}, ${fails} question${fails > 1 ? "s ont" : " a"} résisté : on y revient demain, avant que l'erreur s'installe.` : `${cap(when)}, tu as eu besoin d'un indice fort : on vérifie demain que tu y arrives seul.`,
    };
  }
  if (light) {
    return { unitId, due: isoDay(addDays(now, 3)), reason: `${cap(when)}, tu as réussi avec un peu d'aide : rappel dans 3 jours, sans indice cette fois.` };
  }
  const gap = state === "durable" ? 30 : state === "provisoire" ? 14 : 7;
  return { unitId, due: isoDay(addDays(now, gap)), reason: `${cap(when)}, tout réussi seul : on vérifie dans ${gap} jours que ça tient, sur un exercice différent.` };
}

export function isDue(r: Review, today: Date = TODAY): boolean {
  return daysBetween(parseDay(r.due), today) >= 0;
}

export function dueLabel(r: Review, today: Date = TODAY): string {
  const d = parseDay(r.due);
  const n = daysBetween(today, d);
  if (n <= 0) return "Aujourd'hui";
  if (n === 1) return "Demain";
  return cap(frDate(d));
}

const cap = (s: string | undefined) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

/** Rappels de démonstration, cohérents avec les traces fictives. */
export const DEMO_REVIEWS: Review[] = [
  { unitId: "3e-physique-vitesse", due: "2026-10-29", reason: "Mercredi, tu as converti des km/h en m/s avec un indice : on vérifie aujourd'hui que tu y arrives seul." },
  { unitId: "4e-maths-litteral", due: "2026-10-29", reason: "Base de 4e encore fragile, et elle sert à ton chapitre en cours, Fonctions affines." },
  { unitId: "3e-anglais-voyages", due: "2026-10-31", reason: "Vendredi dernier, ago et since ont été confondus : rappel samedi." },
  { unitId: "3e-maths-affines", due: "2026-11-02", reason: "Lundi, réussi seul sur des exercices proches : on vérifie à la rentrée sur un problème différent." },
  { unitId: "3e-hg-1gm", due: "2026-11-09", reason: "Maîtrisé il y a quelques semaines : test de rétention pour que ça tienne jusqu'au brevet." },
];
