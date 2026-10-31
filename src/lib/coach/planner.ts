import { findSession } from "@/lib/content/catalog";
import { TODAY, daysBetween, frDate, isoDay, parseDay } from "@/lib/content/calendar";
import { inSentence } from "@/lib/content/meta";
import type { Homework } from "@/lib/content/mock";
import { findUnit, prevLevel } from "@/lib/curriculum";
import { getLevel, studentSubjects, type Track } from "@/lib/curriculum/levels";
import { recommendedBases } from "@/lib/curriculum/modes";
import type { ClassProgress, Evidence, Level, MethodId, Review, SubjectId } from "@/lib/curriculum/types";
import { MASTERY, evidenceByUnit, masteryOf } from "@/lib/learning/mastery";
import { isDue } from "@/lib/learning/scheduler";
import { knowledgeByUnit } from "./learner";
import { domainOf } from "./methods";
import { isLang } from "./oral";

/**
 * Objectifs du jour : à partir du temps que l'élève veut y consacrer, le coach choisit quoi faire, dans quel ordre,
 * et dit pourquoi. Fonction pure et déterministe (mêmes données, même plan), testée sans interface.
 *
 * Priorités de départ (configurables) :
 *  1. un devoir à rendre bientôt ;
 *  2. les rappels espacés arrivés à échéance (plus tôt si la notion est fragile) ;
 *  2 bis. en première, les textes de l'oral de français à revoir ce jour-là ;
 *  3. les automatismes (échauffement de 5 minutes) ;
 *  4. une base de l'année d'avant qui bloque le chapitre en cours ;
 *  5. le chapitre en cours en classe, d'autant plus qu'il est fragile ;
 *  6. en langues, le défi oral puis la VO, s'ils sont activés.
 * On remplit le temps choisi sans le dépasser, avec au plus deux objectifs par matière.
 */

export type PlanKind = "devoir" | "rappel" | "bac" | "automatismes" | "base" | "chapitre" | "oral" | "vo";

export interface PlanItem {
  id: string;
  kind: PlanKind;
  title: string;
  /** Ce que l'élève saura faire à la fin (objectif observable) ou ce qu'il va faire. */
  goal: string;
  minutes: number;
  /** Pourquoi le coach l'a choisi. */
  reason: string;
  href: string;
  subject?: SubjectId;
  sessionId?: string;
  unitId?: string;
  method?: MethodId;
}

export interface DayPlan {
  date: string;
  minutes: number;
  items: PlanItem[];
  done: string[];
}

export interface PlanInput {
  now?: Date;
  minutes: number;
  level: Level;
  track: Track;
  progress: Partial<Record<SubjectId, ClassProgress>>;
  evidence: Evidence[];
  reviews: Review[];
  homework: Homework[];
  methods: Record<MethodId, boolean>;
  /** Première : nombre de textes de l'oral de français à revoir aujourd'hui (répétition espacée). */
  bacDue?: number;
}

export const TIME_CHOICES = [10, 15, 20, 30, 45, 60] as const;

const PHASE: Record<PlanKind, number> = { automatismes: 0, rappel: 1, bac: 1, devoir: 2, base: 2, chapitre: 2, oral: 3, vo: 4 };

interface Candidate extends PlanItem {
  priority: number;
  /** Clé de doublon : une même séance ou un même chapitre ne revient pas deux fois. */
  key: string;
}

/** « de maths », mais « d'anglais ». */
export const deSubject = (subject: SubjectId) => {
  const w = inSentence(subject);
  return /^[aeiouyhéè]/i.test(w) ? `d'${w}` : `de ${w}`;
};

export { isoDay };

export function planDay(input: PlanInput): DayPlan {
  const now = input.now ?? TODAY;
  const subjects = studentSubjects(input.level, input.track).map((s) => s.subject);
  const know = knowledgeByUnit(input.evidence, now);
  const byUnit = evidenceByUnit(input.evidence);
  const mastery = (id: string) => masteryOf(byUnit.get(id) ?? []);
  const out: Candidate[] = [];

  // 1. Devoirs à venir (ENT relié)
  for (const hw of input.homework) {
    const s = findSession(hw.sessionId ?? undefined);
    if (!s) continue;
    const days = daysBetween(now, parseDay(hw.due));
    if (days < 0 || days > 7) continue;
    out.push({
      id: `devoir-${hw.id}`, kind: "devoir", key: s.id, priority: 100 - days * 3,
      title: `${hw.kind} ${deSubject(hw.subject)} : ${hw.title}`, goal: s.objective, minutes: s.minutes,
      reason: `À rendre ${days === 0 ? "aujourd'hui" : days === 1 ? "demain" : frDate(parseDay(hw.due))} : on le prépare d'abord.`,
      href: `/seance/${s.id}`, subject: hw.subject, sessionId: s.id, unitId: s.unitId,
    });
  }

  // 2. Rappels arrivés à échéance
  for (const r of input.reviews) {
    if (!isDue(r, now)) continue;
    const u = findUnit(r.unitId);
    if (!u || !subjects.concat(prevSubjects(input.level, input.track)).includes(u.subject)) continue;
    const k = know.get(u.id);
    const s = findSession(u.sessionId);
    out.push({
      id: `rappel-${u.id}`, kind: "rappel", key: s?.id ?? u.id, priority: 85 + (k && k.recall < 0.5 ? 5 : 0),
      title: `Rappel : ${u.title}`, goal: s ? s.objective : `Refaire de mémoire l'essentiel de « ${u.title} », sans regarder le cours.`,
      minutes: s ? Math.min(s.minutes, 10) : 5, reason: r.reason,
      href: s ? `/seance/${s.id}` : `/reviser/${u.subject}?unite=${u.id}`, subject: u.subject, sessionId: s?.id, unitId: u.id,
    });
  }

  // 2 bis. Bac de français (première) : textes du descriptif à revoir aujourd'hui
  const bacDue = input.bacDue ?? 0;
  if (input.level === "1re" && bacDue > 0) {
    out.push({
      id: "bac-oral", kind: "bac", key: "bac-oral", priority: 82,
      title: `Oral de français : ${bacDue} texte${bacDue > 1 ? "s" : ""} à revoir`, goal: "Redire de mémoire la problématique et les mouvements de chaque texte.",
      minutes: Math.min(10, 3 * bacDue), reason: "Répétition espacée des textes de ton descriptif.",
      href: "/bac-francais/revision", subject: "francais",
    });
  }

  // 3. Automatismes (maths)
  if (input.methods.automatismes && subjects.some((x) => domainOf(x) === "maths")) {
    out.push({
      id: "automatismes", kind: "automatismes", key: "automatismes", priority: 80, method: "automatismes",
      title: "Automatismes de calcul", goal: "8 calculs rapides sur des notions déjà vues, sans indice.", minutes: 5,
      reason: input.methods.entrelacement ? "Échauffement : 5 minutes, chapitres mélangés pour apprendre à choisir la méthode." : "Échauffement : 5 minutes sur la notion la plus fragile.",
      href: "/automatismes", subject: "maths",
    });
  }

  // 4. Bases de l'année d'avant qui bloquent le chapitre en cours
  const prev = prevLevel(input.level);
  for (const b of recommendedBases(input.level, input.progress, mastery).slice(0, 2)) {
    const s = findSession(b.base.sessionId);
    out.push({
      id: `base-${b.base.id}`, kind: "base", key: s?.id ?? b.base.id, priority: 70,
      title: `Base de ${prev ? getLevel(prev).label : ""} : ${b.base.title}`, goal: s ? s.objective : `Consolider « ${b.base.title} », utile pour le chapitre en cours.`,
      minutes: s ? s.minutes : 8,
      reason: `${MASTERY[b.state].label} pour l'instant, et ton chapitre « ${b.target.title} » en a besoin.`,
      href: s ? `/seance/${s.id}` : `/reviser/${b.base.subject}?unite=${b.base.id}`, subject: b.base.subject, sessionId: s?.id, unitId: b.base.id,
    });
  }

  // 5. Chapitre en cours en classe
  for (const subject of subjects) {
    const p = input.progress[subject];
    const u = findUnit(p?.current);
    if (!u) continue;
    const s = findSession(u.sessionId);
    const k = know.get(u.id);
    const fragile = k ? 1 - k.pKnown : 1;
    out.push({
      id: `chapitre-${u.id}`, kind: "chapitre", key: s?.id ?? u.id, priority: (s ? 50 : 30) + Math.round(fragile * 15),
      title: u.title, goal: s ? s.objective : `Revoir le cours de « ${u.title} » et noter ce qui n'est pas clair.`,
      minutes: s ? s.minutes : 10,
      reason: `En cours en classe${p && !p.confirmed ? " (à confirmer)" : ""} : ${k && k.n >= 3 ? (k.pKnown < 0.5 ? "encore fragile, on le travaille maintenant" : "on consolide pendant que c'est frais") : "on le travaille pendant que c'est frais"}.`,
      href: s ? `/seance/${s.id}` : `/reviser/${subject}?unite=${u.id}`, subject, sessionId: s?.id, unitId: u.id,
    });
  }

  // 6. Langues : défi oral et VO
  const lang = subjects.find(isLang);
  if (lang) {
    const u = findUnit(input.progress[lang]?.current);
    if (input.methods["defi-oral"]) {
      out.push({
        id: "oral", kind: "oral", key: "oral", priority: 55, method: "defi-oral",
        title: `Défi oral en ${inSentence(lang)}`, goal: "Parler 3 minutes sans lire, sur un sujet lié à ton chapitre et à tes passions.", minutes: 5,
        reason: u ? `Thème de ton chapitre : « ${u.title} ». Parler seul augmente ton temps de parole réel.` : "Parler seul augmente ton temps de parole réel.",
        href: `/oral?langue=${lang}`, subject: lang,
      });
    }
    if (input.methods["vo-quotidienne"]) {
      out.push({
        id: "vo", kind: "vo", key: "vo", priority: 45, method: "vo-quotidienne",
        title: `10 minutes en VO (${inSentence(lang)})`, goal: "Écouter une vidéo ou une chanson en version originale, sous-titres dans la même langue.", minutes: 10,
        reason: "Comme dans les pays nordiques : l'écoute quotidienne hors de l'école fait progresser l'oral.",
        href: "#vo", subject: lang,
      });
    }
  }

  return { date: isoDay(now), minutes: input.minutes, items: select(out, input.minutes, input.methods.entrelacement), done: [] };
}

/** Chaque objectif du même type déjà retenu fait baisser la priorité du suivant : le plan reste varié. */
const SAME_KIND_PENALTY = 12;

function select(all: Candidate[], budget: number, interleave: boolean): PlanItem[] {
  const seen = new Set<string>();
  const unique = [...all].sort((a, b) => b.priority - a.priority || a.minutes - b.minutes).filter((c) => (seen.has(c.key) ? false : (seen.add(c.key), true)));
  const picked: Candidate[] = [];
  const perSubject = new Map<string, number>();
  const perKind = new Map<PlanKind, number>();
  let used = 0;
  for (;;) {
    const fits = unique.filter((c) => !picked.includes(c) && used + c.minutes <= budget && (c.method || (perSubject.get(c.subject ?? c.id) ?? 0) < 2));
    if (!fits.length) break;
    const score = (c: Candidate) => c.priority - SAME_KIND_PENALTY * (perKind.get(c.kind) ?? 0);
    const c = fits.reduce((best, x) => (score(x) > score(best) ? x : best));
    picked.push(c);
    used += c.minutes;
    perKind.set(c.kind, (perKind.get(c.kind) ?? 0) + 1);
    if (!c.method) perSubject.set(c.subject ?? c.id, (perSubject.get(c.subject ?? c.id) ?? 0) + 1);
  }
  // Toujours au moins un objectif : le plus prioritaire parmi les plus courts.
  if (!picked.length && unique.length) picked.push([...unique].sort((a, b) => a.minutes - b.minutes || b.priority - a.priority)[0] as Candidate);
  const ordered = picked.sort((a, b) => PHASE[a.kind] - PHASE[b.kind] || b.priority - a.priority);
  return (interleave ? alternate(ordered) : ordered).map(({ priority: _p, key: _k, ...item }) => item);
}

/** Entrelacement : dans le bloc principal, on évite deux objectifs de la même matière à la suite. */
function alternate(items: Candidate[]): Candidate[] {
  const main = items.filter((i) => PHASE[i.kind] === 2);
  if (main.length < 3) return items;
  const out: Candidate[] = [];
  const rest = [...main];
  while (rest.length) {
    const last = out.at(-1)?.subject;
    const i = rest.findIndex((x) => x.subject !== last);
    out.push(...rest.splice(i < 0 ? 0 : i, 1));
  }
  const before = items.filter((i) => PHASE[i.kind] < 2);
  const after = items.filter((i) => PHASE[i.kind] > 2);
  return [...before, ...out, ...after];
}

function prevSubjects(level: Level, track: Track): SubjectId[] {
  const p = prevLevel(level);
  return p ? studentSubjects(p, track).map((s) => s.subject) : [];
}

/** Objectifs du plan terminés par une séance : ceux qui pointent vers cette séance. */
export function markSessionDone(plan: DayPlan | null, sessionId: string): DayPlan | null {
  if (!plan) return plan;
  const ids = plan.items.filter((i) => i.sessionId === sessionId && !plan.done.includes(i.id)).map((i) => i.id);
  return ids.length ? { ...plan, done: [...plan.done, ...ids] } : plan;
}

export function markDone(plan: DayPlan | null, itemId: string, done = true): DayPlan | null {
  if (!plan) return plan;
  const has = plan.done.includes(itemId);
  if (done === has) return plan;
  return { ...plan, done: done ? [...plan.done, itemId] : plan.done.filter((x) => x !== itemId) };
}

export function planProgress(plan: DayPlan): { done: number; total: number; minutesLeft: number } {
  const left = plan.items.filter((i) => !plan.done.includes(i.id));
  return { done: plan.items.length - left.length, total: plan.items.length, minutesLeft: left.reduce((s, i) => s + i.minutes, 0) };
}
