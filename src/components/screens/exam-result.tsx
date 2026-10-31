"use client";

import { Check, ChevronDown, Minus, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { FocusPage } from "@/components/ui/focus-page";
import { subStyle } from "@/components/ui/subject-icon";
import { getExam } from "@/lib/content/exams";
import { COMPETENCES, levelLabel } from "@/lib/content/meta";
import type { Passion } from "@/lib/content/passions";
import { themed, type CompetenceId } from "@/lib/content/types";
import { cx, nb } from "@/lib/cx";
import { frScore, gradeExam, type GradedQuestion } from "@/lib/exam-result";
import { useSessionPassions, useStore } from "@/lib/store";
import { EmptyResult, useGrow } from "./summary";

const headline = (n: number) => (n >= 16 ? "Excellent travail." : n >= 12 ? "Bon contrôle." : n >= 10 ? "La moyenne est là." : "On a de quoi travailler.");

export function ExamResultScreen({ examId }: { examId: string }) {
  const exam = getExam(examId);
  const { state } = useStore();
  const passions = useSessionPassions();
  const passion = passions[1 % passions.length] as Passion;
  const grown = useGrow();
  const [open, setOpen] = useState<string | null>(null);
  const snap = state.lastExam?.examId === examId ? state.lastExam : null;
  if (!snap) {
    return <EmptyResult title="Pas encore de copie corrigée." text="Fais le contrôle blanc pour voir ta note et ta copie corrigée ici." href={exam.title ? `/controle/${exam.id}` : `/seance/${exam.sessionId}?mode=controle`} cta={exam.title ? "Commencer l'épreuve" : "Préparer le contrôle"} />;
  }
  const outcome = gradeExam({ exam, ...snap });
  const minutes = Math.max(1, Math.round(outcome.seconds / 60));
  const r = outcome.result;
  const competences = Object.keys(r.levelsAfter) as CompetenceId[];

  return (
    <FocusPage
      wide
      className="result-page"
      dock={
        <div className="dock-row">
          <Link href={`/seance/${exam.sessionId}`} className="btn btn-ghost">S'entraîner</Link>
          <Link href="/" className="btn btn-ink">Terminer</Link>
        </div>
      }
    >
      <div className="result-layout">
        <div className="result-main">
        <section className="summary-hero on-yellow">
          <p className="summary-kicker">{exam.title ?? `Contrôle blanc, ${exam.notion}`}</p>
          <p className={cx("summary-score", frScore(outcome.score).length > 2 && "is-long")} aria-label={`${frScore(outcome.score)} sur 20`}>
            {frScore(outcome.score)}<span>/20</span>
          </p>
          <h1 className="h1">{headline(outcome.score)}</h1>
          <p className="summary-sub">
            Copie rendue en {minutes} minute{minutes > 1 ? "s" : ""}{outcome.overtime ? ", hors temps" : ""}.
          </p>
        </section>

        <section className="block" aria-labelledby="ex-title">
          <h2 id="ex-title" className="h2">Par exercice</h2>
          <ul className="ex-scores">
            {outcome.perExercise.map((e) => (
              <li key={e.id}>
                <div className="skill-head">
                  <strong>{e.title}</strong>
                  <span className="ex-score">{frScore(e.earned)}/{frScore(e.points)}</span>
                </div>
                <div className="skill-bar" style={{ "--before": "0%", "--after": `${grown ? (e.earned / e.points) * 100 : 0}%` } as CSSProperties}>
                  <span className="skill-gain" />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="points-row">
          <span className="points-icon"><Sparkles size={26} strokeWidth={2.4} /></span>
          <div>
            <p className="points-value">+{r.points.awarded}</p>
            <p className="muted small">points ajoutés à ta cagnotte (1 000 points = 1 €). Ils ne changent pas ta maîtrise.</p>
          </div>
        </section>

        <section className="block" aria-labelledby="sk-title">
          <h2 id="sk-title" className="h2">Tes compétences</h2>
          <ul className="skill-list">
            {competences.map((c) => {
              const before = r.levelsBefore[c] ?? 0;
              const after = r.levelsAfter[c] ?? before;
              return (
                <li key={c} className="skill" style={subStyle(COMPETENCES[c].subject)}>
                  <div className="skill-head">
                    <strong>{COMPETENCES[c].label}</strong>
                    <span className="skill-delta">+{after - before}</span>
                  </div>
                  <div className="skill-bar" style={{ "--before": `${before}%`, "--after": `${grown ? after : before}%` } as CSSProperties}>
                    <span className="skill-gain" />
                    <span className="skill-base" />
                  </div>
                  <span className="skill-level">{levelLabel(after)}</span>
                </li>
              );
            })}
          </ul>
        </section>
        </div>
        <div className="result-side">
        <section className="block block-first" aria-labelledby="copy-title">
          <h2 id="copy-title" className="h2">Ta copie corrigée</h2>
          {exam.exercises.map((ex) => (
            <div key={ex.id} className="graded-group">
              <h3 className="graded-title">{ex.title}</h3>
              <ul className="graded-list">
                {outcome.graded
                  .filter((g) => g.exerciseId === ex.id)
                  .map((g) => (
                    <GradedRow key={g.question.id} g={g} passion={passion} open={open === g.question.id} onToggle={() => setOpen(open === g.question.id ? null : g.question.id)} />
                  ))}
              </ul>
            </div>
          ))}
        </section>

        </div>
      </div>
    </FocusPage>
  );
}

function GradedRow({ g, passion, open, onToggle }: { g: GradedQuestion; passion: Passion; open: boolean; onToggle: () => void }) {
  const Icon = g.status === "ok" ? Check : g.status === "blank" ? Minus : g.status === "partial" ? Check : X;
  return (
    <li className={cx("graded", `is-${g.status}`)}>
      <button type="button" className="graded-main" onClick={onToggle} aria-expanded={open}>
        <span className="graded-icon"><Icon size={16} strokeWidth={3} /></span>
        <span className="graded-text">
          <strong>{g.question.label}. {themed(g.question.prompt, passion)}</strong>
          <span>Ta réponse : {nb(g.given)}</span>
          {g.status !== "ok" ? <span className="graded-expected">Attendu : {nb(g.expected)}</span> : null}
        </span>
        <span className="graded-pts">{frScore(g.earned)}/{frScore(g.question.points)}</span>
        <ChevronDown size={20} className={cx("chev", open && "is-open")} />
      </button>
      {open ? (
        <ol className="solution-steps graded-solution">
          {g.question.solution.map((s) => (
            <li key={s}>{nb(s)}</li>
          ))}
        </ol>
      ) : null}
    </li>
  );
}
