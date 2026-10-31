"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { findExam, findSession, getSessionMeta } from "@/lib/content/catalog";
import { TODAY, daysBetween, demoNow, mondayOf, sameDay } from "@/lib/content/calendar";
import { SUBJECTS } from "@/lib/content/meta";
import { INITIAL_PROFILE, type Profile } from "@/lib/content/mock";
import { EVERYDAY, findPassion, type Passion } from "@/lib/content/passions";
import { LEVEL_ORDER, findUnit, levelRank, prevLevel, type ClassProgress, type Evidence, type Level, type MasteryState, type Review, type SubjectId } from "@/lib/curriculum";
import type { Track } from "@/lib/curriculum/levels";
import { defaultProgress } from "@/lib/curriculum/progression";
import { DEMO_EVIDENCE, evidenceByUnit, masteryOf } from "@/lib/learning/mastery";
import { DEMO_REVIEWS, scheduleAfterSession } from "@/lib/learning/scheduler";
import type { ExamAnswer } from "@/lib/exam-result";
import type { CompetenceId } from "@/lib/content/types";
import { INITIAL_WALLET, REWARDS, credit, creditSponsored, giftCode, learnedToday, pointsToday, redeemBlock, reward, rewardPoints, spendable, weekEntries, type SponsoredDone, type Wallet } from "@/lib/rewards";
import type { ItemResult, SessionResult } from "@/lib/session-result";
import { autoMethods, methodsForSession, type PracticeLog } from "@/lib/coach/methods";
import { DEMO_BAC, EMPTY_BAC, isCardDue, reviewCard, type BacFrState, type BlancLog, type OralText } from "@/lib/bac/francais";
import { DRAFT_KEYS } from "@/lib/bac/draft";
import { PASSIONS } from "@/lib/content/passions";
import { isoDay, markDone, markSessionDone, planDay, type DayPlan } from "@/lib/coach/planner";
import type { DrillQuestion } from "@/lib/coach/drills";
import { HOMEWORK } from "@/lib/content/mock";
import { uid } from "@/lib/cx";
import { computePoints } from "@/lib/points";
import type { MethodId } from "@/lib/curriculum/types";
import type { AccentId } from "@/lib/theme/accents";

/**
 * État du prototype, sauvegardé dans le navigateur (localStorage).
 * Dans le produit, ces données viendront de l'API ; la forme reste la même.
 */

export type ThemePref = "system" | "light" | "dark";

export type { AccentId } from "@/lib/theme/accents";

export interface Settings {
  theme: ThemePref;
  readable: boolean;
  sound: boolean;
  haptics: boolean;
  /** Couleur d'accent de l'appli. */
  accent: AccentId;
  /** La couleur suit l'univers préféré de l'élève (sport, jeux, musique…). */
  accentFromUniverses: boolean;
}

export interface PlayerProgress {
  sessionId: string;
  index: number;
  results: ItemResult[][];
  shifts: Record<number, number>;
  startedAt: number;
}

export interface ExamProgress {
  examId: string;
  answers: Record<string, ExamAnswer>;
  exIndex: number;
  startedAt: number;
}

/** On garde les entrées de la correction, pas la correction elle-même (les énoncés sont des fonctions). */
export interface ExamSnapshot {
  examId: string;
  answers: Record<string, ExamAnswer>;
  seconds: number;
  overtime: boolean;
  levels: Record<CompetenceId, number>;
  streak: number;
  pointsToday: number;
}

/** Ce que la dernière séance a apporté : affiché dans le bilan (points et maîtrise séparés). */
export interface LastGain {
  sessionId: string;
  points: number;
  balanceBefore: number;
  challenges: { title: string; points: number }[];
  /** Bonus offerts par les partenaires pour les exercices partenaires terminés. */
  sponsored: { partnerId: string; points: number }[];
  unitId: string;
  stateBefore: MasteryState;
  stateAfter: MasteryState;
  review: Review;
}

export interface State {
  v: 8;
  onboarded: boolean;
  profile: Profile;
  /** Traces d'apprentissage : la maîtrise se calcule à partir d'elles, jamais à partir des points. */
  evidence: Evidence[];
  /** Rappels espacés programmés, avec leur raison. */
  reviews: Review[];
  /** Progression de la classe, matière par matière. */
  progress: Partial<Record<SubjectId, ClassProgress>>;
  wallet: Wallet;
  lastGain: LastGain | null;
  /** Passions retenues pour la prochaine séance. */
  active: string[];
  settings: Settings;
  player: PlayerProgress | null;
  exam: ExamProgress | null;
  lastResult: SessionResult | null;
  lastExam: ExamSnapshot | null;
  /** Objectifs du jour, choisis par le coach selon le temps que l'élève veut y consacrer. */
  today: DayPlan | null;
  /** Temps choisi la dernière fois (proposé par défaut le lendemain). */
  lastMinutes: number | null;
  /** Pratique hors séances : automatismes, VO, défi oral (minutes). */
  practice: PracticeLog[];
  /** Bac de français (première) : œuvres, descriptif de l'oral, préférences. */
  bac: BacFrState;
  /** Explorer : capsules terminées (identifiant → date). */
  explore: Record<string, string>;
}

const KEY = "learnward:v8";
/** Versions précédentes : on les reprend en ajoutant ce qui manque. */
const LEGACY_KEYS = ["learnward:v7", "learnward:v6"];
/** Les changements rapprochés (une frappe, un chrono) sont regroupés avant d'écrire dans le navigateur. */
const SAVE_DELAY = 250;

export const INITIAL_STATE: State = {
  v: 8,
  onboarded: true,
  profile: INITIAL_PROFILE,
  evidence: DEMO_EVIDENCE,
  reviews: DEMO_REVIEWS,
  progress: defaultProgress(INITIAL_PROFILE.grade, INITIAL_PROFILE.track, INITIAL_PROFILE.entLinked),
  wallet: INITIAL_WALLET,
  lastGain: null,
  active: INITIAL_PROFILE.passions,
  settings: { theme: "system", readable: false, sound: true, haptics: true, accent: "jaune", accentFromUniverses: false },
  player: null,
  exam: null,
  lastResult: null,
  lastExam: null,
  today: null,
  lastMinutes: null,
  practice: [],
  bac: EMPTY_BAC,
  explore: {},
};

/** Lit une sauvegarde : version à reprendre, champs abîmés réparés. `null` si elle est inutilisable. */
function restore(raw: string): State | null {
  try {
    const parsed = migrate(JSON.parse(raw) as Partial<State> & { v?: number });
    return parsed ? sanitize(parsed) : null;
  } catch {
    return null;
  }
}

function load(): State {
  try {
    const raw = [KEY, ...LEGACY_KEYS].map((k) => window.localStorage.getItem(k)).find((x) => x !== null);
    return (raw && restore(raw)) || INITIAL_STATE;
  } catch {
    return INITIAL_STATE;
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const listOr = <T,>(v: T[] | null | undefined, fallback: T[]): T[] => (Array.isArray(v) ? v : fallback);

/**
 * Remet d'aplomb un état venu du navigateur : champs manquants, valeurs abîmées, contenu retiré depuis la sauvegarde
 * (séance, récompense, épreuve). Une sauvegarde abîmée ne doit jamais empêcher l'appli de s'ouvrir.
 */
export function sanitize(parsed: Partial<State>): State {
  const init = INITIAL_STATE;
  const p = (isRecord(parsed.profile) ? parsed.profile : {}) as Partial<Profile>;
  const w = (isRecord(parsed.wallet) ? parsed.wallet : {}) as Partial<Wallet>;
  const b = (isRecord(parsed.bac) ? parsed.bac : {}) as Partial<BacFrState>;
  const track = (isRecord(p.track) ? p.track : {}) as Partial<Track>;
  const today = isoDay(demoNow());
  const rewardIds = new Set(REWARDS.map((r) => r.id));
  return {
    ...init,
    ...parsed,
    v: 8,
    onboarded: parsed.onboarded !== false,
    profile: {
      ...init.profile,
      ...p,
      grade: p.grade && LEVEL_ORDER.includes(p.grade) ? p.grade : init.profile.grade,
      passions: listOr(p.passions, init.profile.passions),
      mutedPassions: listOr(p.mutedPassions, []),
      customPassions: listOr(p.customPassions, []),
      levels: { ...init.profile.levels, ...(isRecord(p.levels) ? p.levels : {}) },
      track: { ...init.profile.track, ...track, specialties: listOr(track.specialties, []), options: listOr(track.options, []) },
    },
    evidence: listOr(parsed.evidence, init.evidence).filter((e) => typeof e?.unitId === "string" && typeof e.at === "string" && typeof e.itemId === "string"),
    reviews: listOr(parsed.reviews, init.reviews).filter((r) => typeof r?.unitId === "string" && typeof r.due === "string"),
    progress: isRecord(parsed.progress) ? parsed.progress : init.progress,
    wallet: {
      ...init.wallet,
      ...w,
      ledger: listOr(w.ledger, init.wallet.ledger).filter((e) => typeof e?.points === "number"),
      redemptions: listOr(w.redemptions, []).filter((r) => rewardIds.has(r?.rewardId)),
      activeOffers: listOr(w.activeOffers, init.wallet.activeOffers),
      goalId: w.goalId && rewardIds.has(w.goalId) ? w.goalId : init.wallet.goalId,
      parent: { ...init.wallet.parent, ...(isRecord(w.parent) ? w.parent : {}) },
    },
    lastGain: findSession(parsed.lastGain?.sessionId) ? (parsed.lastGain ?? null) : null,
    active: listOr(parsed.active, init.active),
    settings: { ...init.settings, ...(isRecord(parsed.settings) ? parsed.settings : {}) },
    player: validPlayer(parsed.player),
    exam: validExam(parsed.exam),
    lastResult: findSession(parsed.lastResult?.sessionId) && Array.isArray(parsed.lastResult?.items) ? (parsed.lastResult ?? null) : null,
    lastExam: findExam(parsed.lastExam?.examId) ? (parsed.lastExam ?? null) : null,
    today: Array.isArray(parsed.today?.items) && Array.isArray(parsed.today?.done) ? (parsed.today ?? null) : null,
    lastMinutes: typeof parsed.lastMinutes === "number" ? parsed.lastMinutes : null,
    practice: listOr(parsed.practice, []),
    bac: {
      ...EMPTY_BAC,
      ...b,
      oeuvres: isRecord(b.oeuvres) ? b.oeuvres : {},
      textes: listOr(b.textes, []).filter((t) => typeof t?.id === "string").map((t) => (t.card ? t : { ...t, card: { due: today, interval: 0, reps: 0 } })),
      blancs: listOr(b.blancs, []),
    },
    explore: isRecord(parsed.explore) ? (parsed.explore as State["explore"]) : {},
  };
}

/** Séance en cours : gardée seulement si elle existe encore et si l'exercice en cours aussi. */
function validPlayer(p: PlayerProgress | null | undefined): PlayerProgress | null {
  const session = findSession(p?.sessionId);
  if (!p || !session || !Number.isInteger(p.index) || p.index < 0 || p.index >= session.activityCount) return null;
  return { ...p, results: listOr(p.results, []), shifts: isRecord(p.shifts) ? p.shifts : {}, startedAt: typeof p.startedAt === "number" ? p.startedAt : Date.now() };
}

function validExam(e: ExamProgress | null | undefined): ExamProgress | null {
  const exam = findExam(e?.examId);
  if (!e || !exam || typeof e.startedAt !== "number") return null;
  const exIndex = Number.isInteger(e.exIndex) ? Math.min(Math.max(0, e.exIndex), exam.exerciseCount - 1) : 0;
  return { ...e, exIndex, answers: isRecord(e.answers) ? e.answers : {} };
}

/**
 * Reprise des versions précédentes :
 *  v6 → v7 : objectifs du jour et pratique ajoutés ;
 *  v7 → v8 : les méthodes ne se choisissent plus (choix automatique), bac de français et Explorer ajoutés.
 */
export function migrate(parsed: Partial<State> & { v?: number; methods?: unknown }): Partial<State> | null {
  if (parsed.v === 8) return parsed;
  if (parsed.v === 7 || parsed.v === 6) {
    const { methods: _drop, ...rest } = parsed;
    void _drop;
    // Un élève de première retrouve un descriptif d'exemple, qu'il peut modifier ou vider.
    return { today: null, lastMinutes: null, practice: [], ...rest, v: 8, bac: rest.profile?.grade === "1re" ? DEMO_BAC : EMPTY_BAC, explore: {} };
  }
  return null;
}

function save(s: State) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* navigation privée ou stockage plein : la démo continue sans sauvegarde */
  }
}

type Update = (recipe: (s: State) => State) => void;

interface StoreValue {
  state: State;
  update: Update;
  reset: (onboarded?: boolean) => void;
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const first = useRef(true);
  /** État pas encore écrit dans le navigateur. */
  const pending = useRef<State | null>(null);
  /** Dernier état reçu d'un autre onglet : il est déjà sauvegardé. */
  const received = useRef<State | null>(null);

  const flush = useCallback(() => {
    if (pending.current) save(pending.current);
    pending.current = null;
  }, []);

  useEffect(() => {
    setState(load());
  }, []);

  useEffect(() => {
    if (!state) return;
    if (first.current) {
      first.current = false;
      return;
    }
    if (state === received.current) return;
    pending.current = state;
    const id = window.setTimeout(flush, SAVE_DELAY);
    return () => window.clearTimeout(id);
  }, [state, flush]);

  // Rien ne se perd si la page se ferme juste après une action ; un autre onglet ouvert reste à jour.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY || !e.newValue || pending.current) return;
      const next = restore(e.newValue);
      if (!next) return;
      received.current = next;
      setState(next);
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("storage", onStorage);
    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("storage", onStorage);
    };
  }, [flush]);

  const update = useCallback<Update>((recipe) => setState((s) => (s ? recipe(s) : s)), []);
  const reset = useCallback((onboarded = true) => {
    try {
      for (const key of DRAFT_KEYS) window.localStorage.removeItem(key);
    } catch {
      /* stockage indisponible : rien à effacer */
    }
    setState({ ...INITIAL_STATE, onboarded });
  }, []);

  const value = useMemo(() => (state ? { state, update, reset } : null), [state, update, reset]);
  if (!value) return <div className="splash" aria-hidden="true"><span className="wordmark">learnward</span></div>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore hors du StoreProvider");
  return v;
}

/** Passions du profil (au moins une : la vie quotidienne par défaut). */
export function useMyPassions(): Passion[] {
  const { state } = useStore();
  const { passions, customPassions } = state.profile;
  return useMemo(() => {
    const list = passions.map((id) => findPassion(id, customPassions)).filter((p): p is Passion => Boolean(p));
    return list.length ? list : [EVERYDAY];
  }, [passions, customPassions]);
}

/**
 * Univers de la séance : les préférés de l'élève, plus deux univers de découverte tirés dans tout le catalogue
 * (spectre large). Sans préféré, la séance n'est faite que de découvertes.
 */
export function useSessionPassions(): Passion[] {
  const { state } = useStore();
  const { passions, customPassions, mutedPassions, vary } = state.profile;
  const themed = state.wallet.parent.themed !== false;
  return useMemo(() => {
    // Le parent a désactivé les énoncés personnalisés : la vie quotidienne pour tout le monde.
    if (!themed) return [EVERYDAY];
    const liked = passions.map((id) => findPassion(id, customPassions)).filter((p): p is Passion => Boolean(p) && !mutedPassions.includes(p!.id));
    const active = liked.filter((p) => state.active.includes(p.id));
    const base = active.length ? active : liked;
    const discovery = vary || !base.length ? discoveryPassions(passions, mutedPassions, isoDay(demoNow()), base.length ? 2 : 3) : [];
    const list = [...base, ...discovery];
    return list.length ? list : [EVERYDAY];
  }, [passions, customPassions, mutedPassions, vary, state.active, themed]);
}

/** Fin d'une séance ou d'un contrôle : compétences, traces de maîtrise, rappel espacé et cagnotte (séparés). */
export function applyResult(s: State, result: SessionResult, kind: "session" | "exam" = "session", opts: { label?: string; minutes?: number } = {}): State {
  const session = getSessionMeta(result.sessionId);
  const at = demoNow().toISOString();
  const before = masteryOf(s.evidence.filter((e) => e.unitId === session.unitId));
  const methods = methodsForSession(session.subject, session.unitId, s.evidence);
  const fresh: Evidence[] = result.items.map((i) => ({
    unitId: i.unitId ?? session.unitId,
    itemId: i.activityId,
    at,
    stage: i.stage,
    result: i.status === "first" ? "success" : i.status === "retry" ? "partial" : "fail",
    assistance: i.assistance,
    selfAssessed: i.selfAssessed,
    ...(i.status !== "first" && i.errorType ? { errorType: i.errorType } : {}),
    ...(methods.length ? { methods } : {}),
  }));
  const evidence = [...s.evidence, ...fresh];
  const after = masteryOf(evidence.filter((e) => e.unitId === session.unitId));
  // Une épreuve blanche couvre plusieurs chapitres : chacun reçoit son propre rappel espacé.
  const units = Array.from(new Set(fresh.map((e) => e.unitId)));
  const reviewsFor = units.map((u) => scheduleAfterSession(u, fresh.filter((e) => e.unitId === u), masteryOf(evidence.filter((e) => e.unitId === u)), demoNow()));
  const review = reviewsFor.find((r) => r.unitId === session.unitId) ?? scheduleAfterSession(session.unitId, fresh, after, demoNow());
  const lower = prevLevel(s.profile.grade);
  const { wallet, completed } =
    result.points.awarded > 0 || kind === "exam"
      ? credit(
          s.wallet,
          {
            at,
            kind,
            label: opts.label ?? (kind === "exam" ? `Contrôle blanc, ${session.notion}` : session.notion),
            detail: `${SUBJECTS[session.subject].short}${session.grade !== s.profile.grade ? `, ${session.grade}` : ""}`,
            points: result.points.awarded,
            subject: session.subject,
            grade: session.grade,
            minutes: opts.minutes ?? (kind === "exam" ? 30 : session.minutes),
          },
          lower,
        )
      : { wallet: s.wallet, completed: [] };
  // Exercices partenaires terminés : un bonus par exercice, versé à part des points de séance.
  const done = new Map<string, SponsoredDone>();
  for (const i of result.items) {
    if (!i.sponsor) continue;
    const prev = done.get(i.activityId);
    done.set(i.activityId, { partnerId: i.sponsor.partnerId, activityId: i.activityId, bonus: i.sponsor.bonus, seconds: (prev?.seconds ?? 0) + i.seconds, label: session.notion });
  }
  const sponsoredCredit = kind === "session" ? creditSponsored(wallet, Array.from(done.values()), at) : { wallet, credited: [] };
  return {
    ...s,
    profile: { ...s.profile, levels: { ...s.profile.levels, ...result.levelsAfter } },
    evidence,
    reviews: [...s.reviews.filter((r) => r.unitId !== session.unitId && !units.includes(r.unitId)), ...(units.includes(session.unitId) ? reviewsFor : [review, ...reviewsFor])],
    wallet: sponsoredCredit.wallet,
    today: markSessionDone(s.today, session.id),
    // Le bilan d'un contrôle a son propre écran : il ne doit pas se mêler au bilan de la dernière séance.
    lastGain:
      kind === "session"
        ? {
            sessionId: result.sessionId,
            points: result.points.awarded,
            balanceBefore: spendable(s.wallet),
            challenges: completed.map((c) => ({ title: c.title(lower), points: c.points })),
            sponsored: sponsoredCredit.credited,
            unitId: session.unitId,
            stateBefore: before,
            stateAfter: after,
            review,
          }
        : s.lastGain,
  };
}

const upTo = (level: Level) => (unitId: string) => {
  const u = findUnit(unitId);
  return Boolean(u) && levelRank(u?.level ?? "Tle") <= levelRank(level);
};

/**
 * Changer de niveau : la progression repart d'une proposition à confirmer (ou de l'ENT simulé en 3e),
 * et on ne garde que les traces et rappels des niveaux déjà atteints (pas de maîtrise fictive sur une classe future).
 */
export function changeLevel(s: State, level: Level, track?: Track): State {
  const nextTrack = track ?? (level === "1re" || level === "Tle" ? s.profile.track : { ...s.profile.track, specialties: [], options: [] });
  const profile = { ...s.profile, grade: level, track: nextTrack };
  const keep = upTo(level);
  const own = s.evidence.filter((e) => !e.itemId.startsWith("seed-"));
  const evidence = [...DEMO_EVIDENCE, ...own].filter((e) => keep(e.unitId));
  const mineReviews = s.reviews.filter((r) => !DEMO_REVIEWS.some((d) => d.unitId === r.unitId && d.due === r.due));
  // Les rappels de démonstration sont écrits pour la classe de 3e fictive : on ne les garde que pour elle.
  const demoReviews = level === "3e" ? DEMO_REVIEWS.filter((r) => !mineReviews.some((m) => m.unitId === r.unitId)) : [];
  const reviews = [...demoReviews, ...mineReviews].filter((r) => keep(r.unitId));
  // Démo : une élève de première arrive avec un descriptif d'oral déjà commencé (titres seulement).
  const bac = level === "1re" && !s.bac.textes.length ? DEMO_BAC : s.bac;
  return { ...s, profile, evidence, reviews, progress: defaultProgress(level, profile.track, profile.entLinked), player: null, exam: null, today: null, bac };
}

/** Changer de langue, de spécialités ou d'options : la progression déjà confirmée des autres matières est gardée. */
export function setTrack(s: State, patch: Partial<Track>): State {
  const track = { ...s.profile.track, ...patch };
  const fresh = defaultProgress(s.profile.grade, track, s.profile.entLinked);
  const progress: State["progress"] = {};
  for (const subject of Object.keys(fresh) as SubjectId[]) progress[subject] = s.progress[subject] ?? fresh[subject];
  return { ...s, profile: { ...s.profile, track }, progress };
}

/** L'élève indique son chapitre en cours : la progression devient la sienne. */
export function setCurrentUnit(s: State, subject: SubjectId, unitId: string): State {
  const p = s.progress[subject];
  if (!p) return s;
  return { ...s, progress: { ...s.progress, [subject]: { ...p, current: unitId, source: "student", confirmed: true } } };
}

export function confirmProgress(s: State, subject: SubjectId): State {
  const p = s.progress[subject];
  if (!p) return s;
  return { ...s, progress: { ...s.progress, [subject]: { ...p, source: "student", confirmed: true } } };
}

/** États de maîtrise de toutes les unités travaillées. */
export function useMastery(): (unitId: string) => MasteryState {
  const { state } = useStore();
  return useMemo(() => {
    const by = evidenceByUnit(state.evidence);
    const cache = new Map<string, MasteryState>();
    return (id: string) => {
      const hit = cache.get(id);
      if (hit) return hit;
      const m = masteryOf(by.get(id) ?? []);
      cache.set(id, m);
      return m;
    };
  }, [state.evidence]);
}

export function usePointsToday(): number {
  return pointsToday(useStore().state.wallet);
}

/**
 * Pratique hors séances qui compte comme du travail : VO, défi oral, épreuves rédigées ou orales.
 * Les automatismes sont déjà comptés dans la cagnotte, et seulement s'ils n'ont pas été faits à toute vitesse.
 */
const practiceIn = (s: State, keep: (d: Date) => boolean) => s.practice.filter((p) => p.kind !== "automatismes" && keep(new Date(p.at)));

/** Série en cours : jours d'affilée jusqu'à hier, plus aujourd'hui si l'élève a déjà travaillé. */
export function useStreak(): { days: number; today: boolean } {
  const { state } = useStore();
  const today = learnedToday(state.wallet).length > 0 || practiceIn(state, (d) => sameDay(d, TODAY)).length > 0;
  return { days: state.profile.streak + (today ? 1 : 0), today };
}

/** Minutes de travail du jour : séances, contrôles et capsules, plus la pratique hors séances. */
export function minutesToday(s: State, today: Date = TODAY): number {
  const sessions = learnedToday(s.wallet, today).reduce((n, e) => n + (e.minutes ?? 0), 0);
  return practiceIn(s, (d) => sameDay(d, today)).reduce((n, p) => n + p.minutes, sessions);
}

/** Minutes de travail de la semaine, pour l'espace parent (15 minutes pour les séances d'exemple, qui n'ont pas de durée). */
export function minutesThisWeek(s: State, today: Date = TODAY): number {
  const start = mondayOf(today);
  const sessions = weekEntries(s.wallet, today).filter((e) => e.kind === "session" || e.kind === "exam").reduce((n, e) => n + (e.minutes ?? 15), 0);
  return practiceIn(s, (d) => d >= start && daysBetween(start, d) < 7).reduce((n, p) => n + p.minutes, sessions);
}

/** Demande d'utilisation de la cagnotte : validée par un parent avant 15 ans, immédiate sinon. Refusée sans solde ou au-delà du plafond. */
export function requestReward(s: State, rewardId: string): State {
  const r = reward(rewardId);
  if (redeemBlock(s.wallet, r)) return s;
  const at = demoNow().toISOString();
  const id = uid("r");
  const redemption = { id, rewardId, points: rewardPoints(r), at, status: "pending" as const };
  const next = { ...s, wallet: { ...s.wallet, redemptions: [redemption, ...s.wallet.redemptions] } };
  return s.profile.under15 ? next : decideReward(next, id, true);
}

export function decideReward(s: State, id: string, approve: boolean): State {
  const r = s.wallet.redemptions.find((x) => x.id === id);
  if (!r || r.status !== "pending") return s;
  const rw = reward(r.rewardId);
  const redemptions = s.wallet.redemptions.map((x) => (x.id === id ? { ...x, status: approve ? ("approved" as const) : ("refused" as const), code: approve && rw.kind === "gift" ? giftCode(id) : undefined } : x));
  const ledger = approve
    ? [{ id: `l-${id}`, at: demoNow().toISOString(), kind: "redeem" as const, label: rw.kind === "gift" ? `${rw.title} ${rw.euros} €` : rw.title, detail: s.profile.under15 ? "Validé par ton parent" : undefined, points: -r.points }, ...s.wallet.ledger]
    : s.wallet.ledger;
  return { ...s, wallet: { ...s.wallet, redemptions, ledger } };
}

/* ——— Coach : objectifs du jour, méthodes, pratique ——— */

/** Devoirs connus : seulement quand un ENT est relié (simulé en 3e dans la démo). */
export function homeworkOf(s: State) {
  return s.profile.grade === "3e" && s.profile.entLinked ? HOMEWORK : [];
}

/** L'élève choisit son temps du jour : le coach construit les objectifs. Les objectifs déjà faits aujourd'hui le restent. */
export function makePlan(s: State, minutes: number, now: Date = demoNow()): State {
  const day = isoDay(now);
  const bacDue = s.profile.grade === "1re" ? s.bac.textes.filter((t) => isCardDue(t.card, day)).length : 0;
  const plan = planDay({ now, minutes, level: s.profile.grade, track: s.profile.track, progress: s.progress, evidence: s.evidence, reviews: s.reviews, homework: homeworkOf(s), methods: autoMethods(s.evidence), bacDue });
  const keep = s.today && s.today.date === plan.date ? s.today.done.filter((id) => plan.items.some((i) => i.id === id)) : [];
  return { ...s, today: { ...plan, done: keep }, lastMinutes: minutes };
}

export function togglePlanItem(s: State, itemId: string): State {
  if (!s.today) return s;
  return { ...s, today: markDone(s.today, itemId, !s.today.done.includes(itemId)) };
}

/** VO ou défi oral terminés : minutes notées, objectif du jour coché, traces auto-évaluées si l'élève s'est relu. */
export function logPractice(s: State, kind: PracticeLog["kind"], minutes: number, evidence: Evidence[] = []): State {
  const at = demoNow().toISOString();
  return { ...s, practice: [...s.practice, { kind, at, minutes }], evidence: [...s.evidence, ...evidence], today: markDone(s.today, kind) };
}

export interface DrillAnswer {
  question: DrillQuestion;
  correct: boolean;
  seconds: number;
}

/** Fin des automatismes : une trace par question (sans aide), des points de séance, l'objectif du jour coché. */
export function applyDrill(s: State, answers: DrillAnswer[]): State {
  if (!answers.length) return s;
  const at = demoNow().toISOString();
  const methods: MethodId[] = ["automatismes", ...(autoMethods(s.evidence).entrelacement ? (["entrelacement"] as MethodId[]) : [])];
  const fresh: Evidence[] = answers.map((a) => ({
    unitId: a.question.unitId,
    itemId: `auto-${a.question.family}`,
    at,
    stage: "application",
    result: a.correct ? "success" : "fail",
    assistance: 0,
    ...(a.correct ? {} : { errorType: "calcul" as const }),
    methods,
  }));
  const seconds = answers.reduce((n, a) => n + a.seconds, 0);
  const points = computePoints({ correctCount: answers.filter((a) => a.correct).length, totalQuestions: answers.length, avgSecondsPerQuestion: seconds / answers.length, streakDays: s.profile.streak, pointsEarnedToday: pointsToday(s.wallet) });
  const minutes = Math.max(1, Math.round(seconds / 60));
  const { wallet } = points.awarded > 0
    ? credit(s.wallet, { at, kind: "session", label: "Automatismes", detail: "Maths, calcul rapide", points: points.awarded, subject: "maths", grade: s.profile.grade, minutes }, prevLevel(s.profile.grade))
    : { wallet: s.wallet };
  return { ...s, evidence: [...s.evidence, ...fresh], wallet, practice: [...s.practice, { kind: "automatismes", at, minutes }], today: markDone(s.today, "automatismes") };
}

/* ——— Univers (passions) : un spectre large, sans choix obligatoire ——— */

/** Univers de découverte du jour : tirés dans tout le catalogue, hors univers écartés, stables pour la journée. */
export function discoveryPassions(liked: string[], muted: string[], seed: string, count = 2): Passion[] {
  const pool = PASSIONS.filter((p) => !liked.includes(p.id) && !muted.includes(p.id));
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: Passion[] = [];
  const taken = new Set<number>();
  for (let k = 0; k < Math.min(count, pool.length); k++) {
    let i = (h + k * 7919) % pool.length;
    while (taken.has(i)) i = (i + 1) % pool.length;
    taken.add(i);
    out.push(pool[i] as Passion);
  }
  return out;
}

/* ——— Bac de français ——— */

export function setBac(s: State, patch: Partial<BacFrState>): State {
  return { ...s, bac: { ...s.bac, ...patch } };
}

export function addOralText(s: State, t: Omit<OralText, "id" | "card">): State {
  const today = isoDay(demoNow());
  const text: OralText = { ...t, id: uid("t"), card: { due: today, interval: 0, reps: 0 } };
  return setBac(s, { textes: [...s.bac.textes, text] });
}

export function updateOralText(s: State, id: string, patch: Partial<Omit<OralText, "id">>): State {
  return setBac(s, { textes: s.bac.textes.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
}

export function removeOralText(s: State, id: string): State {
  return setBac(s, { textes: s.bac.textes.filter((t) => t.id !== id) });
}

/** Une épreuve blanche rédigée ou orale est terminée : on garde la note indicative, et le temps compte dans la semaine. */
export function logBlanc(s: State, entry: Omit<BlancLog, "date">, minutes: number): State {
  const at = demoNow().toISOString();
  const next = setBac(s, { blancs: [...(s.bac.blancs ?? []), { ...entry, date: isoDay(demoNow()) }] });
  return { ...next, practice: [...next.practice, { kind: "blanc", at, minutes }] };
}

export function rateOralText(s: State, id: string, rating: "revoir" | "bien" | "facile"): State {
  const today = isoDay(demoNow());
  const next = setBac(s, { textes: s.bac.textes.map((t) => (t.id === id ? { ...t, card: reviewCard(t.card, rating, today) } : t)) });
  // Plus aucun texte à revoir aujourd'hui : l'objectif du jour correspondant se coche.
  return next.bac.textes.some((t) => isCardDue(t.card, today)) ? next : { ...next, today: markDone(next.today, "bac-oral") };
}

/* ——— Explorer ——— */

/** Une capsule terminée pour la première fois rapporte 10 points (régularité), sans note ni maîtrise. */
export const CAPSULE_POINTS = 10;

export function completeCapsule(s: State, capsuleId: string, title: string, minutes: number): State {
  if (s.explore[capsuleId]) return s;
  const at = demoNow().toISOString();
  const { wallet } = credit(s.wallet, { at, kind: "session", label: `Explorer : ${title}`, detail: "Pour le plaisir", points: CAPSULE_POINTS, minutes }, prevLevel(s.profile.grade));
  return { ...s, wallet, explore: { ...s.explore, [capsuleId]: at } };
}
