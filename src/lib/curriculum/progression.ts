import { SCHOOL_WEEKS, classWeek } from "@/lib/content/calendar";
import { unitsOf } from "./index";
import { studentSubjects, type Track } from "./levels";
import type { ClassProgress, Level, SubjectId } from "./types";

/**
 * Progression de la classe.
 * - En 3e, la démo simule un ENT relié : ordre et chapitre en cours fictifs, présentés comme tels.
 * - Ailleurs (ou si l'élève n'a pas d'ENT), LearnWard propose le chapitre probable d'après l'ordre indicatif
 *   du programme et la période de l'année, et demande à l'élève de confirmer ou de corriger.
 */

/** Démo : progression « récupérée de l'ENT » pour une classe de 3e fictive (fin octobre). */
const ENT_DEMO_3E: Partial<Record<SubjectId, { order: string[]; current: string }>> = {
  francais: { order: ["3e-francais-raconter", "3e-francais-accords", "3e-francais-denoncer", "3e-francais-subordonnees", "3e-francais-poesie", "3e-francais-agir", "3e-francais-progres", "3e-francais-brevet"], current: "3e-francais-denoncer" },
  maths: { order: ["3e-maths-arith", "3e-maths-litteral", "3e-maths-fonctions", "3e-maths-affines", "3e-maths-thales", "3e-maths-stats", "3e-maths-trigo", "3e-maths-proba", "3e-maths-transfo", "3e-maths-espace", "3e-maths-algo"], current: "3e-maths-affines" },
  hg: { order: ["3e-hg-1gm", "3e-hg-aires-urbaines", "3e-hg-totalitarismes", "3e-hg-2gm", "3e-hg-vichy", "3e-hg-productifs", "3e-hg-faible-densite", "3e-hg-independances", "3e-hg-guerre-froide", "3e-hg-europe", "3e-hg-amenager", "3e-hg-outre-mer", "3e-hg-apres-1989", "3e-hg-refonder", "3e-hg-ve-republique", "3e-hg-ue", "3e-hg-femmes-hommes", "3e-hg-france-monde"], current: "3e-hg-totalitarismes" },
  emc: { order: ["3e-emc-regles", "3e-emc-opinion", "3e-emc-engagement"], current: "3e-emc-regles" },
  anglais: { order: ["3e-anglais-langages", "3e-anglais-voyages", "3e-anglais-ecole", "3e-anglais-rencontres"], current: "3e-anglais-voyages" },
  espagnol: { order: ["3e-espagnol-langages", "3e-espagnol-voyages", "3e-espagnol-ecole", "3e-espagnol-rencontres"], current: "3e-espagnol-voyages" },
  physique: { order: ["3e-physique-atomes", "3e-physique-vitesse", "3e-physique-forces", "3e-physique-acides", "3e-physique-energie", "3e-physique-electricite", "3e-physique-signaux"], current: "3e-physique-vitesse" },
  svt: { order: ["3e-svt-genetique", "3e-svt-evolution", "3e-svt-microbes", "3e-svt-climat"], current: "3e-svt-genetique" },
  techno: { order: ["3e-techno-usages", "3e-techno-programmer", "3e-techno-chaines", "3e-techno-donnees", "3e-techno-projet"], current: "3e-techno-programmer" },
  arts: { order: ["3e-arts-oeuvre", "3e-arts-projet"], current: "3e-arts-oeuvre" },
  musique: { order: ["3e-musique-ecouter", "3e-musique-projet"], current: "3e-musique-ecouter" },
  eps: { order: ["3e-eps-affrontement", "3e-eps-sante"], current: "3e-eps-affrontement" },
};

/** Proposition : l'unité qui correspond à peu près à la période de l'année dans l'ordre indicatif. */
function proposeCurrent(order: string[]): string | null {
  if (!order.length) return null;
  const share = Math.min(0.99, classWeek() / SCHOOL_WEEKS);
  return order[Math.floor(order.length * share)] ?? order[0] ?? null;
}

export function defaultProgress(level: Level, track: Track, entLinked: boolean): Partial<Record<SubjectId, ClassProgress>> {
  const out: Partial<Record<SubjectId, ClassProgress>> = {};
  for (const { subject } of studentSubjects(level, track)) {
    const demo = level === "3e" && entLinked ? ENT_DEMO_3E[subject] : undefined;
    if (demo) {
      out[subject] = { subject, order: demo.order, current: demo.current, source: "ent_demo", confirmed: true };
      continue;
    }
    const order = unitsOf(level, subject).map((u) => u.id);
    out[subject] = { subject, order, current: proposeCurrent(order), source: "proposal", confirmed: false };
  }
  return out;
}

export const PROGRESS_SOURCE_LABEL: Record<ClassProgress["source"], string> = {
  ent_demo: "Progression de ta classe, ENT simulé (démo)",
  student: "Chapitre en cours indiqué par toi",
  proposal: "Proposition d'après le programme, à confirmer",
};
