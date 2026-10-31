"use client";

import { ArrowRight, BookOpenText, Calculator, Check, Clapperboard, Mic, NotebookPen, RotateCcw, Route, Target } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { subStyle } from "@/components/ui/subject-icon";
import { isLang, voSuggestion } from "@/lib/coach/oral";
import { TIME_CHOICES, isoDay, planProgress, type PlanItem, type PlanKind } from "@/lib/coach/planner";
import { demoNow } from "@/lib/content/calendar";
import { cx, nb } from "@/lib/cx";
import { logPractice, makePlan, togglePlanItem, useSessionPassions, useStore } from "@/lib/store";

const KIND: Record<PlanKind, { label: string; Icon: typeof Target }> = {
  automatismes: { label: "Échauffement", Icon: Calculator },
  rappel: { label: "Rappel", Icon: RotateCcw },
  bac: { label: "Bac de français", Icon: BookOpenText },
  devoir: { label: "Devoir", Icon: NotebookPen },
  base: { label: "Base", Icon: Route },
  chapitre: { label: "Chapitre", Icon: Target },
  oral: { label: "Oral", Icon: Mic },
  vo: { label: "Écoute", Icon: Clapperboard },
};

/**
 * Aujourd'hui : l'élève choisit son temps, les objectifs apparaissent, un seul bouton pour démarrer.
 * Le choix des objectifs (et des méthodes) est fait par le moteur, sans explication à lire.
 */
export function TodayCard() {
  const { state, update } = useStore();
  const router = useRouter();
  const passions = useSessionPassions();
  const [vo, setVo] = useState<PlanItem | null>(null);
  const today = isoDay(demoNow());
  const plan = state.today && state.today.date === today ? state.today : null;
  const current = plan?.minutes ?? null;

  const open = (i: PlanItem) => {
    if (i.kind === "vo") setVo(i);
    else router.push(i.href);
  };
  const voLang = vo?.subject && isLang(vo.subject) ? vo.subject : null;
  const suggestion = voLang ? voSuggestion(voLang, passions[new Date().getDate() % passions.length] ?? passions[0]!) : null;

  const prog = plan ? planProgress(plan) : null;
  const next = plan?.items.find((i) => !plan.done.includes(i.id));
  const pct = prog && prog.total ? Math.round((prog.done / prog.total) * 100) : 0;
  const total = plan ? plan.items.reduce((s, i) => s + i.minutes, 0) : 0;

  const chips: ReactNode = (
    <div className="time-row" role="group" aria-label="Temps pour aujourd'hui, en minutes">
      {TIME_CHOICES.map((m) => (
        <button key={m} type="button" className={cx("time-pill", current === m && "is-on")} aria-pressed={current === m} onClick={() => update((s) => makePlan(s, m))}>
          {m}
          <span className="sr-only"> minutes</span>
        </button>
      ))}
    </div>
  );

  return (
    <section className={cx("today", !plan && "is-empty")} aria-labelledby="today-title">
      <div className="today-hero">
        <div className="today-head">
          <h2 id="today-title" className="today-title">{plan ? "Aujourd'hui" : nb("Combien de minutes aujourd'hui ?")}</h2>
          {plan && prog ? (
            <span className="today-sum num" aria-live="polite">
              {prog.done === prog.total ? <><Check size={18} strokeWidth={3} /> Bouclé</> : prog.done ? `${prog.done}/${prog.total} · ${prog.minutesLeft} min` : `${prog.total} objectif${prog.total > 1 ? "s" : ""} · ${total} min`}
            </span>
          ) : null}
        </div>
        {chips}
        {plan ? (
          <div className="today-bar" role="progressbar" aria-valuemin={0} aria-valuemax={prog?.total ?? 0} aria-valuenow={prog?.done ?? 0} aria-label="Objectifs faits">
            <span style={{ width: `${pct}%` }} />
          </div>
        ) : null}
      </div>

      {plan ? (
        <>
          <ol className="steps" key={`${plan.minutes}-${plan.items.length}`}>
            {plan.items.map((i, n) => {
              const done = plan.done.includes(i.id);
              const { Icon, label } = KIND[i.kind];
              return (
                <li key={i.id} className={cx("step", done && "is-done", next?.id === i.id && "is-next")} style={{ ...(i.subject ? (subStyle(i.subject) as CSSProperties) : {}), "--i": n } as CSSProperties}>
                  <button type="button" className="step-check" role="checkbox" aria-checked={done} aria-label={`${done ? "Fait" : "À faire"} : ${i.title}`} onClick={() => update((s) => togglePlanItem(s, i.id))}>
                    {done ? <Check size={18} strokeWidth={3.2} /> : <Icon size={18} strokeWidth={2.4} aria-hidden="true" />}
                  </button>
                  <button type="button" className="step-main" onClick={() => open(i)}>
                    <span className="step-kind">{label}</span>
                    <strong className="step-title">{nb(i.title)}</strong>
                    <span className="step-goal">{nb(i.goal)}</span>
                  </button>
                  <span className="step-min num">{i.minutes}<small> min</small></span>
                </li>
              );
            })}
          </ol>
          {next ? (
            <Button block size="lg" onClick={() => open(next)} trailing={<ArrowRight size={22} strokeWidth={2.6} />}>
              {prog?.done ? "Continuer" : "Commencer"}
            </Button>
          ) : (
            <p className="today-done">
              <Check size={18} strokeWidth={3} /> Tout est fait. <Link href="/explorer">Explorer pour le plaisir</Link>
            </p>
          )}
        </>
      ) : null}

      <Sheet open={Boolean(vo)} title="10 minutes en VO" onClose={() => setVo(null)}>
        {suggestion ? (
          <>
            <p className="sheet-text">{suggestion.idea}</p>
            <p className="muted small">{suggestion.tips[0]}</p>
            <div className="sheet-actions">
              <Button block onClick={() => { update((s) => logPractice(s, "vo", 10)); setVo(null); }} icon={<Check size={18} />}>C'est fait : 10 minutes</Button>
              <Button block variant="ghost" onClick={() => setVo(null)}>Plus tard</Button>
            </div>
          </>
        ) : null}
      </Sheet>
    </section>
  );
}
