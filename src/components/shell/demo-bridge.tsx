"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import type { ExamAnswer } from "@/lib/exam-result";
import type { Level, SubjectId } from "@/lib/curriculum";
import { applyResult, changeLevel, makePlan, requestReward, useStore, type AccentId, type ThemePref } from "@/lib/store";

const DEMO_SPECS: Partial<Record<Level, SubjectId[]>> = { "1re": ["maths", "physique", "ses"], Tle: ["maths", "physique"] };

const SAMPLE_EXAM: Record<string, ExamAnswer> = {
  "1a": { kind: "choice", index: 2 },
  "1b": { kind: "choice", index: 0 },
  "1c": { kind: "choice", index: 1 },
  "1d": { kind: "choice", index: 1 },
  "2a": { kind: "numeric", value: "24", unit: null },
  "2b": { kind: "numeric", value: "72", unit: null },
  "2c": { kind: "choice", index: 1 },
  "2d": { kind: "numeric", value: "5", unit: null },
  "2e": { kind: "numeric", value: "20", unit: null },
  "3a": { kind: "order", order: [0, 1, 2, 3, 4] },
  "3b": { kind: "spot", line: 2 },
};

export type DemoMessage = {
  type: "learnward-demo";
  action: "navigate" | "reset" | "preset" | "theme" | "accent" | "readable" | "sample-result" | "sample-exam" | "fresh-session" | "fresh-exam" | "level" | "request" | "jump" | "reset-today" | "plan";
  level?: Level;
  path?: string;
  passions?: string[];
  theme?: ThemePref;
  accent?: AccentId;
  value?: boolean;
  id?: string;
  /** « jump » : activité de la séance où reprendre (les précédentes reçoivent un résultat d'exemple). */
  activity?: string;
  /** « plan » : temps du jour choisi. */
  minutes?: number;
};

/** Ce que l'appli dit au panneau de /demo : où elle en est, pour qu'il reste à jour. */
export type FrameReport = { type: "learnward-frame"; path: string; level: Level; theme: ThemePref; readable: boolean };

/** Reçoit les commandes de la page /demo (même origine) : navigation, profils, thème, exemples. */
export function DemoBridge() {
  const router = useRouter();
  const { update, reset } = useStore();
  /** Les commandes s'exécutent dans l'ordre : une navigation attend l'exemple qui la précède. */
  const queue = useRef(Promise.resolve());

  useEffect(() => {
    const run = async (d: DemoMessage) => {
      if (d.action === "reset") reset(false);
      if (d.action === "preset" && d.passions) {
        const ids = d.passions;
        update((s) => ({ ...s, profile: { ...s.profile, passions: ids }, active: ids }));
      }
      if (d.action === "theme" && d.theme) {
        const theme = d.theme;
        update((s) => ({ ...s, settings: { ...s.settings, theme } }));
      }
      if (d.action === "accent" && d.accent) {
        const accent = d.accent;
        update((s) => ({ ...s, settings: { ...s.settings, accent, accentFromUniverses: false } }));
      }
      if (d.action === "readable") update((s) => ({ ...s, settings: { ...s.settings, readable: Boolean(d.value) } }));
      // Les exemples ont besoin du contenu complet : chargé seulement si la démo le demande.
      if (d.action === "sample-result" && d.id) {
        const [{ getSession }, { sampleResult }] = await Promise.all([import("@/lib/content/sessions"), import("@/lib/session-result")]);
        const session = getSession(d.id);
        update((s) => {
          const r = sampleResult(session, s.profile.levels);
          return { ...applyResult(s, r), lastResult: r };
        });
      }
      if (d.action === "sample-exam" && d.id) {
        const { getExam } = await import("@/lib/content/exams");
        const examId = getExam(d.id).id;
        update((s) => ({ ...s, lastExam: { examId, answers: SAMPLE_EXAM, seconds: 1260, overtime: false, levels: s.profile.levels, streak: s.profile.streak, pointsToday: 0 } }));
      }
      if (d.action === "fresh-session") update((s) => ({ ...s, player: null }));
      if (d.action === "reset-today") update((s) => ({ ...s, today: null }));
      if (d.action === "plan" && d.minutes) {
        const minutes = d.minutes;
        update((s) => makePlan(s, minutes));
      }
      if (d.action === "jump" && d.id && d.activity) {
        const [{ getSession }, { sampleResult }] = await Promise.all([import("@/lib/content/sessions"), import("@/lib/session-result")]);
        const session = getSession(d.id);
        const index = Math.max(0, session.activities.findIndex((a) => a.id === d.activity));
        update((s) => {
          const items = sampleResult(session, s.profile.levels).items;
          const results = session.activities.slice(0, index).map((a) => items.filter((i) => i.activityId === a.id));
          return { ...s, player: { sessionId: session.id, index, results, shifts: {}, startedAt: Date.now() } };
        });
      }
      if (d.action === "level" && d.level) {
        const level = d.level;
        update((s) => changeLevel(s, level, { ...s.profile.track, specialties: DEMO_SPECS[level] ?? [], options: [] }));
      }
      if (d.action === "request" && d.id) {
        const id = d.id;
        update((s) => (s.wallet.redemptions.some((r) => r.status === "pending") ? s : requestReward({ ...s, profile: { ...s.profile, under15: true } }, id)));
      }
      if (d.action === "fresh-exam" && d.id) {
        const examId = d.id;
        update((s) => ({ ...s, exam: { examId, answers: {}, exIndex: 0, startedAt: Date.now() } }));
      }
      if (d.action === "navigate" && d.path) router.push(d.path);
    };
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as DemoMessage | null;
      if (!d || d.type !== "learnward-demo") return;
      queue.current = queue.current.then(() => run(d)).catch((err: unknown) => console.error(err));
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [router, update, reset]);

  return (
    <Suspense>
      <FrameReporter />
    </Suspense>
  );
}

/** Dans le cadre de /demo, signale chaque changement au panneau au lieu de le laisser interroger la page. */
function FrameReporter() {
  const { state } = useStore();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const level = state.profile.grade;
  const { theme, readable } = state.settings;
  useEffect(() => {
    if (window.parent === window) return;
    const report: FrameReport = { type: "learnward-frame", path: pathname + (search ? `?${search}` : ""), level, theme, readable };
    window.parent.postMessage(report, window.location.origin);
  }, [pathname, search, level, theme, readable]);
  return null;
}
