import { TODAY, daysBetween, parseDay } from "@/lib/content/calendar";
import type { Evidence, MasteryState } from "@/lib/curriculum/types";

/**
 * Six états de maîtrise, calculés à partir des traces d'apprentissage et jamais à partir des points.
 * Règle de départ (configurable, à tester avec des enseignants) :
 *  - une réussite avec indice fort ou après correction ne vaut pas une réussite autonome ;
 *  - « maîtrisé (provisoire) » exige des réussites autonomes sur deux jours différents, dont une tâche de transfert ;
 *  - « maîtrise durable » exige en plus une réussite autonome au moins 7 jours après la première ;
 *  - une réponse libre auto-évaluée avec la grille est indicative : elle ne compte pas comme preuve autonome ;
 *  - une dernière séance réussie à moins de 50 % ramène à « fragile » ; un transfert raté ce jour-là plafonne à « en consolidation ».
 */

export const MASTERY: Record<MasteryState, { label: string; detail: string; rank: number }> = {
  "a-decouvrir": { label: "À découvrir", detail: "Pas encore de trace de travail sur ce chapitre.", rank: 0 },
  "en-decouverte": { label: "En découverte", detail: "Quelques réussites, avec beaucoup d'aide.", rank: 1 },
  fragile: { label: "Fragile", detail: "Réussites partielles ou instables : des erreurs reviennent.", rank: 2 },
  consolidation: { label: "En consolidation", detail: "Réussi seul sur des exercices proches ; le transfert reste à confirmer.", rank: 3 },
  provisoire: { label: "Maîtrisé (provisoire)", detail: "Réussi seul, sur deux jours différents, y compris en transfert.", rank: 4 },
  durable: { label: "Maîtrise durable", detail: "Réussi seul après plusieurs jours, y compris sur un problème nouveau.", rank: 5 },
};

export const MASTERY_ORDER: MasteryState[] = ["a-decouvrir", "en-decouverte", "fragile", "consolidation", "provisoire", "durable"];

/** Seuil pour ouvrir un chapitre de l'année suivante (mode Avance). */
export const UNLOCK_STATE: MasteryState = "provisoire";
/** En dessous, une base de l'année précédente est recommandée (mode Combler une lacune). */
export const WEAK_STATE: MasteryState = "consolidation";

const score = (e: Evidence) => (e.result === "success" ? 1 : e.result === "partial" ? 0.5 : 0);
/** Jour local (et non UTC) d'une date ISO. */
export const day = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function isAutonomous(e: Evidence): boolean {
  return e.result === "success" && e.assistance === 0 && !e.selfAssessed;
}

export function masteryOf(all: Evidence[]): MasteryState {
  // L'approfondissement est facultatif : une réussite compte (comme un transfert), un échec ne pénalise pas.
  const evidence = all.filter((e) => e.stage !== "extension" || e.result === "success");
  if (!evidence.length) return all.length ? "en-decouverte" : "a-decouvrir";
  const rate = evidence.reduce((s, e) => s + score(e), 0) / evidence.length;
  const auto = evidence.filter(isAutonomous);
  const autoDays = Array.from(new Set(auto.map((e) => day(e.at)))).sort();
  const transfer = auto.some((e) => e.stage === "transfert" || e.stage === "extension");
  const lastDay = evidence.map((e) => day(e.at)).sort().at(-1) as string;
  const last = evidence.filter((e) => day(e.at) === lastDay);
  const lastRate = last.reduce((s, e) => s + score(e), 0) / last.length;

  let state: MasteryState;
  if (autoDays.length >= 2 && transfer) {
    const span = daysBetween(parseDay(autoDays[0] as string), parseDay(autoDays.at(-1) as string));
    state = span >= 7 ? "durable" : "provisoire";
  } else if (auto.length >= 1 && rate >= 0.6) {
    state = "consolidation";
  } else if (evidence.some((e) => e.result === "success") && rate >= 0.35) {
    state = "fragile";
  } else {
    state = "en-decouverte";
  }
  // Une dernière séance difficile fait redescendre l'état : la maîtrise n'est pas acquise une fois pour toutes.
  if (lastRate < 0.5 && MASTERY[state].rank >= MASTERY.consolidation.rank) state = "fragile";
  // Un transfert raté lors de la dernière séance empêche de déclarer la notion maîtrisée.
  else if (MASTERY[state].rank > MASTERY.consolidation.rank && last.some((e) => e.stage === "transfert" && e.result === "fail")) state = "consolidation";
  return state;
}

export const atLeast = (s: MasteryState, min: MasteryState) => MASTERY[s].rank >= MASTERY[min].rank;

/* ——— Traces de démonstration ——— */

type Pattern = "durable" | "provisoire" | "consolidation" | "fragile" | "decouverte";

const ago = (n: number, h = 18) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

function seed(unitId: string, p: Pattern, lastDaysAgo = 3): Evidence[] {
  const e = (n: number, stage: Evidence["stage"], result: Evidence["result"], assistance: Evidence["assistance"], i: number): Evidence => ({ unitId, itemId: `seed-${i}`, at: ago(n), stage, result, assistance });
  const L = lastDaysAgo;
  switch (p) {
    case "durable":
      return [e(L + 17, "rappel", "success", 0, 1), e(L + 9, "transfert", "success", 0, 2), e(L, "application", "success", 0, 3)];
    case "provisoire":
      return [e(L + 4, "rappel", "success", 0, 1), e(L, "transfert", "success", 0, 2), e(L, "application", "success", 1, 3)];
    case "consolidation":
      return [e(L, "rappel", "success", 0, 1), e(L, "application", "success", 0, 2), e(L, "transfert", "partial", 1, 3)];
    case "fragile":
      return [e(L, "rappel", "success", 2, 1), e(L, "application", "fail", 1, 2), e(L, "transfert", "partial", 0, 3)];
    case "decouverte":
      return [e(L, "rappel", "success", 3, 1), e(L, "application", "fail", 2, 2), e(L, "transfert", "fail", 4, 3)];
  }
}

const DEMO: [string, Pattern, number?][] = [
  ["3e-francais-raconter", "provisoire", 20], ["3e-francais-accords", "fragile", 12], ["3e-francais-denoncer", "decouverte", 4],
  ["3e-maths-arith", "durable", 30], ["3e-maths-litteral", "provisoire", 15], ["3e-maths-fonctions", "consolidation", 9], ["3e-maths-affines", "consolidation", 3],
  ["3e-hg-1gm", "provisoire", 25], ["3e-hg-aires-urbaines", "consolidation", 7], ["3e-hg-totalitarismes", "decouverte", 5],
  ["3e-emc-regles", "consolidation", 9],
  ["3e-anglais-langages", "provisoire", 22], ["3e-anglais-voyages", "fragile", 6],
  ["3e-espagnol-langages", "durable", 30], ["3e-espagnol-voyages", "fragile", 8],
  ["3e-physique-atomes", "consolidation", 20], ["3e-physique-vitesse", "fragile", 1],
  ["3e-svt-genetique", "decouverte", 6],
  ["3e-techno-usages", "provisoire", 25], ["3e-techno-programmer", "fragile", 7],
  ["3e-arts-oeuvre", "decouverte", 10], ["3e-musique-ecouter", "fragile", 13], ["3e-eps-affrontement", "consolidation", 6],

  ["4e-maths-litteral", "fragile", 140], ["4e-maths-equations", "consolidation", 130], ["4e-maths-propor", "durable", 120], ["4e-maths-pythagore", "provisoire", 110],
  ["4e-maths-fractions", "provisoire", 200], ["4e-maths-stats", "consolidation", 100], ["4e-maths-proba", "fragile", 90], ["4e-maths-espace", "fragile", 80],
  ["4e-maths-relatifs", "durable", 220], ["4e-maths-puissances", "consolidation", 190],
  ["4e-francais-fonctions", "fragile", 150], ["4e-francais-informer", "consolidation", 100], ["4e-francais-fiction", "provisoire", 200], ["4e-francais-amour", "consolidation", 170], ["4e-francais-valeurs", "provisoire", 130],
  ["4e-hg-colonies", "consolidation", 160], ["4e-hg-republique", "fragile", 120], ["4e-hg-femmes", "consolidation", 110], ["4e-hg-urbanisation", "provisoire", 200], ["4e-hg-revolution", "provisoire", 230],
  ["4e-anglais-langages", "provisoire", 200], ["4e-anglais-voyages", "consolidation", 160], ["4e-anglais-ecole", "consolidation", 140], ["4e-anglais-rencontres", "fragile", 100],
  ["4e-espagnol-langages", "consolidation", 200], ["4e-espagnol-voyages", "fragile", 150], ["4e-espagnol-ecole", "provisoire", 170], ["4e-espagnol-rencontres", "consolidation", 110],
  ["4e-physique-molecules", "consolidation", 210], ["4e-physique-mouvement", "provisoire", 120], ["4e-physique-ohm", "fragile", 160], ["4e-physique-lumiere", "provisoire", 100],
  ["4e-svt-reproduction", "fragile", 200], ["4e-svt-nerveux", "consolidation", 150], ["4e-svt-tectonique", "provisoire", 100],
  ["4e-techno-usages", "provisoire", 210], ["4e-techno-fonctionnement", "fragile", 160], ["4e-techno-conception", "consolidation", 110],
  ["4e-emc-droits", "consolidation", 150], ["4e-emc-citoyennete", "fragile", 120],
  ["4e-arts-oeuvre", "consolidation", 130], ["4e-musique-ecouter", "consolidation", 140], ["4e-eps-affrontement", "provisoire", 120], ["4e-eps-sante", "consolidation", 160],
];

export const DEMO_EVIDENCE: Evidence[] = DEMO.flatMap(([id, p, d]) => seed(id, p, d));

export function evidenceByUnit(all: Evidence[]): Map<string, Evidence[]> {
  const m = new Map<string, Evidence[]>();
  for (const e of all) {
    const list = m.get(e.unitId);
    if (list) list.push(e);
    else m.set(e.unitId, [e]);
  }
  return m;
}
