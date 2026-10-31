"use client";

import { Calculator, Check, ChevronDown, Clock3, EyeOff, RotateCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { applyKey, Keypad } from "@/components/activities/keypad";
import { NumericField, UnitPicker } from "@/components/activities/numeric-field";
import { ContextCard } from "@/components/activities/problem";
import { Copy } from "@/components/activities/spot-error";
import { Button } from "@/components/ui/button";
import { LineGraph } from "@/components/ui/line-graph";
import { Sheet } from "@/components/ui/sheet";
import { exercisePoints, getExam, type ExamQuestion } from "@/lib/content/exams";
import type { Passion } from "@/lib/content/passions";
import { themed } from "@/lib/content/types";
import { cx, frNumber, nb } from "@/lib/cx";
import { useFx } from "@/lib/fx";
import { gradeExam, isAnswered, type ExamAnswer } from "@/lib/exam-result";
import { pointsToday } from "@/lib/rewards";
import { applyResult, useSessionPassions, useStore, type ExamProgress } from "@/lib/store";
import { useFinePointer } from "@/lib/use-media";
import { keepFocus } from "@/lib/use-keys";

const LETTERS = ["A", "B", "C", "D"];
const pts = (n: number) => `${frNumber(n)} pt${n > 1 ? "s" : ""}`;

function clock(seconds: number): string {
  const s = Math.abs(Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${seconds < 0 ? "+" : ""}${h ? `${h}:${String(m).padStart(2, "0")}` : m}:${String(s % 60).padStart(2, "0")}`;
}

/** Le chrono se met à jour tout seul : le reste de la copie n'a pas à se redessiner chaque seconde. */
function ExamTimer({ deadline, hidden, onToggle }: { deadline: number; hidden: boolean; onToggle: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const remaining = (deadline - now) / 1000;
  return (
    <button type="button" className={cx("timer", remaining < 300 && "is-low", remaining < 0 && "is-over")} onClick={onToggle} aria-label={hidden ? "Afficher le chrono" : "Masquer le chrono"}>
      {hidden ? (
        <>
          <EyeOff size={18} strokeWidth={2.4} /> Chrono masqué
        </>
      ) : (
        <>
          <Clock3 size={18} strokeWidth={2.4} /> <span className="num">{clock(remaining)}</span>
        </>
      )}
    </button>
  );
}

export function ExamScreen({ examId }: { examId: string }) {
  const router = useRouter();
  const fx = useFx();
  const fine = useFinePointer();
  const exam = getExam(examId);
  const passions = useSessionPassions();
  const { state, update } = useStore();
  const saved = state.exam?.examId === examId ? state.exam : null;
  const [fallbackStart] = useState(() => Date.now());
  const progress: ExamProgress = saved ?? { examId, answers: {}, exIndex: 0, startedAt: fallbackStart };
  const { answers, exIndex, startedAt } = progress;
  const deadline = startedAt + exam.minutes * 60_000;

  const [focus, setFocus] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [sheet, setSheet] = useState<"submit" | "quit" | "timeup" | null>(null);
  const [shifts, setShifts] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Les réponses partent de l'état le plus récent : deux saisies rapprochées ne s'écrasent jamais.
  const save = useCallback(
    (recipe: (e: ExamProgress) => ExamProgress) => update((s) => (s.exam?.examId === examId ? { ...s, exam: recipe(s.exam) } : s)),
    [update, examId],
  );

  useEffect(() => {
    if (!saved) update((s) => ({ ...s, exam: progress }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (done) return;
    const id = window.setTimeout(() => {
      setFocus(null);
      setSheet("timeup");
    }, Math.max(0, deadline - Date.now()));
    return () => window.clearTimeout(id);
  }, [deadline, done]);

  const exercise = exam.exercises[exIndex];
  const all = exam.exercises.flatMap((e) => e.questions);
  const unanswered = all.filter((q) => !isAnswered(q, answers[q.id])).length;
  const setAnswer = (id: string, a: ExamAnswer) => save((e) => ({ ...e, answers: { ...e.answers, [id]: a } }));

  const focused = exercise?.questions.find((q) => q.id === focus);
  const numeric = !fine && focused && focused.kind === "numeric" ? focused : null;
  const cur = numeric ? answers[numeric.id] : undefined;
  const value = cur && cur.kind === "numeric" ? cur.value : "";
  const unit = cur && cur.kind === "numeric" ? cur.unit : null;

  const numericId = numeric?.id;
  const onKey = useCallback(
    (k: string) => {
      if (!numericId) return;
      save((e) => {
        const prev = e.answers[numericId];
        const pv = prev && prev.kind === "numeric" ? prev : { kind: "numeric" as const, value: "", unit: null };
        return { ...e, answers: { ...e.answers, [numericId]: { ...pv, value: applyKey(pv.value, k) } } };
      });
    },
    [numericId, save],
  );

  const nextNumeric = useCallback(() => {
    if (!exercise || !focus) return setFocus(null);
    const list = exercise.questions.filter((q) => q.kind === "numeric");
    const i = list.findIndex((q) => q.id === focus);
    const nxt = list.slice(i + 1).find((q) => !isAnswered(q, answers[q.id]));
    setFocus(nxt ? nxt.id : null);
  }, [exercise, focus, answers]);

  useEffect(() => {
    if (!focus) return;
    document.getElementById(`q-${focus}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setFocus(null);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [focus]);

  if (!exercise || done) return null;
  const passion = passions[(exIndex + (shifts[exercise.id] ?? 0)) % passions.length] as Passion;

  const remaining = (deadline - Date.now()) / 1000;
  const overtime = remaining < 0;
  const submit = () => {
    const seconds = Math.round((Date.now() - startedAt) / 1000);
    const snapshot = { examId, answers, seconds, overtime: Date.now() > deadline, levels: state.profile.levels, streak: state.profile.streak, pointsToday: pointsToday(state.wallet) };
    const outcome = gradeExam({ exam, ...snapshot });
    fx("complete");
    setDone(true);
    update((s) => ({ ...applyResult(s, outcome.result, "exam", { label: exam.title ?? `Contrôle blanc, ${exam.notion}`, minutes: exam.minutes }), exam: null, lastExam: snapshot }));
    router.replace(`/controle/${examId}/copie`);
  };
  const goTo = (i: number) => {
    setFocus(null);
    save((e) => ({ ...e, exIndex: i }));
    window.scrollTo({ top: 0 });
  };

  const timer = <ExamTimer deadline={deadline} hidden={hidden} onToggle={() => setHidden(!hidden)} />;

  const tabs = (
    <nav className="exam-tabs" aria-label="Exercices">
      {exam.exercises.map((e, i) => {
        const d = e.questions.filter((q) => isAnswered(q, answers[q.id])).length;
        return (
          <button key={e.id} type="button" className={cx("exam-tab", i === exIndex && "is-on", d === e.questions.length && "is-done")} onClick={() => goTo(i)} aria-current={i === exIndex ? "step" : undefined}>
            <strong>Exercice {i + 1}</strong>
            <span className="exam-tab-title">{e.title.split(" : ")[1] ?? ""}</span>
            <span className="exam-tab-count">{d === e.questions.length ? <Check size={14} strokeWidth={3} /> : null}{d}/{e.questions.length}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="focus focus-exam">
      <header className="topbar exam-topbar">
        <div className="topbar-inner">
          <button type="button" className="icon-btn" onClick={() => setSheet("quit")} aria-label="Quitter le contrôle">
            <X size={24} />
          </button>
          <span className="exam-topbar-title">{exam.title ?? `Contrôle blanc, ${exam.notion}`}</span>
          {timer}
          <Button size="md" onClick={() => setSheet("submit")}>Rendre</Button>
        </div>
        <div className="exam-tabs-wrap">{tabs}</div>
      </header>

      <div className="exam-layout">
        <aside className="exam-aside" aria-label="Sommaire du contrôle">
          <p className="exam-aside-title">{exam.title ? "Épreuve blanche" : "Contrôle blanc"}</p>
          <p className="h2">{exam.title ?? exam.notion}</p>
          {timer}
          {tabs}
          <p className="muted small">{unanswered === 0 ? "Toutes les questions ont une réponse." : `${unanswered} question${unanswered > 1 ? "s" : ""} sans réponse.`}</p>
          <Button block onClick={() => setSheet("submit")}>Rendre ma copie</Button>
        </aside>

        <main id="main" tabIndex={-1} className="exam-body" ref={bodyRef}>
          <div className="exam-head">
            <h1 className="h2">{exercise.title}</h1>
            <span className="pts-chip">{pts(exercisePoints(exercise))}</span>
          </div>
          {exercise.calculator !== undefined || exercise.minutes ? (
            <p className="exam-tags">
              {exercise.calculator === false ? <span className="exam-tag is-off"><Calculator size={15} strokeWidth={2.6} /> Sans calculatrice</span> : exercise.calculator ? <span className="exam-tag"><Calculator size={15} strokeWidth={2.6} /> Calculatrice autorisée</span> : null}
              {exercise.minutes ? <span className="exam-tag"><Clock3 size={15} strokeWidth={2.6} /> Environ {exercise.minutes} min</span> : null}
            </p>
          ) : null}
          {exercise.context ? (
            <ContextCard
              passion={passion}
              text={themed(exercise.context, passion)}
              onSwap={passions.length > 1 ? () => setShifts((s) => ({ ...s, [exercise.id]: (s[exercise.id] ?? 0) + 1 })) : undefined}
            />
          ) : null}
          <ol className="exam-qs">
            {exercise.questions.map((q) => (
              <li key={q.id} id={`q-${q.id}`} className={cx("exam-q", focus === q.id && "is-focus")}>
                <div className="exam-q-head">
                  <span className={cx("part-label", isAnswered(q, answers[q.id]) && "is-ok")}>{q.label}</span>
                  <p className="exam-q-prompt">{themed(q.prompt, passion)}</p>
                  <span className="pts-chip pts-sm">{pts(q.points)}</span>
                </div>
                <Field q={q} fine={fine} answer={answers[q.id]} focused={focus === q.id} onFocus={() => setFocus(q.id)} onAnswer={(a) => setAnswer(q.id, a)} onSubmit={nextNumeric} />
              </li>
            ))}
          </ol>
          <div className="exam-next">
            {exIndex < exam.exercises.length - 1 ? (
              <Button variant="ghost" onClick={() => goTo(exIndex + 1)}>Exercice {exIndex + 2}</Button>
            ) : (
              <Button onClick={() => setSheet("submit")}>Rendre ma copie</Button>
            )}
          </div>
        </main>
      </div>

      <footer className="dock exam-dock">
        <div className="dock-inner">
          {numeric ? (
            <div className="numeric-dock">
              <div className="unit-row-wrap">
                {numeric.units ? <UnitPicker units={numeric.units} value={unit} onChange={(u) => setAnswer(numeric.id, { kind: "numeric", value, unit: u })} /> : <span />}
                <button type="button" className="kbd-close" onClick={() => setFocus(null)} aria-label="Fermer le pavé numérique">
                  <ChevronDown size={22} strokeWidth={2.6} /> Fermer
                </button>
              </div>
              <Keypad onKey={onKey} onSubmit={nextNumeric} canSubmit submitLabel="OK" />
            </div>
          ) : (
            <div className="dock-row exam-nav">
              <Button variant="ghost" disabled={exIndex === 0} onClick={() => goTo(exIndex - 1)}>Précédent</Button>
              {exIndex < exam.exercises.length - 1 ? (
                <Button onClick={() => goTo(exIndex + 1)}>Exercice {exIndex + 2}</Button>
              ) : (
                <Button onClick={() => setSheet("submit")}>Rendre ma copie</Button>
              )}
            </div>
          )}
        </div>
      </footer>

      <Sheet open={sheet === "submit"} title="Rendre ta copie ?" onClose={() => setSheet(null)}>
        <p className="sheet-text">
          {unanswered === 0 ? "Tu as répondu à toutes les questions." : `Il reste ${unanswered} question${unanswered > 1 ? "s" : ""} sans réponse.`}{" "}
          {overtime ? "Le temps est écoulé." : `Il te reste ${Math.ceil(remaining / 60)} minute${Math.ceil(remaining / 60) > 1 ? "s" : ""}.`} Une fois rendue, la copie est corrigée tout de suite.
        </p>
        <div className="sheet-actions">
          <Button block onClick={submit}>Rendre ma copie</Button>
          <Button block variant="ghost" onClick={() => setSheet(null)}>Continuer à travailler</Button>
        </div>
      </Sheet>
      <Sheet open={sheet === "timeup"} title={`Les ${exam.minutes} minutes sont passées`} onClose={() => setSheet(null)}>
        <p className="sheet-text">Tu peux rendre ta copie maintenant, ou finir tranquillement : ta note indiquera simplement « hors temps ».</p>
        <div className="sheet-actions">
          <Button block onClick={submit}>Rendre ma copie</Button>
          <Button block variant="ghost" onClick={() => setSheet(null)}>Finir hors temps</Button>
        </div>
      </Sheet>
      <Sheet open={sheet === "quit"} title="Faire une pause ?" onClose={() => setSheet(null)}>
        <p className="sheet-text">Tes réponses sont gardées. Attention, comme dans un vrai contrôle, le chrono continue de tourner.</p>
        <div className="sheet-actions">
          <Button block onClick={() => setSheet(null)}>Continuer le contrôle</Button>
          <Button block variant="ghost" onClick={() => router.push("/")}>Quitter pour l'instant</Button>
        </div>
      </Sheet>
    </div>
  );
}

function Field({
  q,
  fine,
  answer,
  focused,
  onFocus,
  onAnswer,
  onSubmit,
}: {
  q: ExamQuestion;
  fine: boolean;
  answer: ExamAnswer | undefined;
  focused: boolean;
  onFocus: () => void;
  onAnswer: (a: ExamAnswer) => void;
  onSubmit: () => void;
}) {
  if (q.kind === "mcq") {
    const sel = answer?.kind === "choice" ? answer.index : null;
    return (
      <div className="options options-sm" role="radiogroup">
        {q.options.map((o, i) => (
          <button key={o} type="button" role="radio" aria-checked={sel === i} className={cx("option", sel === i && "is-selected")} onMouseDown={keepFocus} onClick={() => onAnswer({ kind: "choice", index: i })}>
            <span className="option-letter">{LETTERS[i]}</span>
            <span className="option-text">{nb(o)}</span>
            <span />
          </button>
        ))}
      </div>
    );
  }
  if (q.kind === "graph") {
    const sel = answer?.kind === "choice" ? answer.index : null;
    return (
      <div className="graph-row" role="radiogroup">
        {q.options.map((c, i) => (
          <button key={i} type="button" role="radio" aria-checked={sel === i} className={cx("graph-mini", sel === i && "is-selected")} onMouseDown={keepFocus} onClick={() => onAnswer({ kind: "choice", index: i })}>
            <span className="option-letter">{LETTERS[i]}</span>
            <LineGraph curve={c} domain={q.domain} range={q.range} xLabel={q.xLabel} yLabel={q.yLabel} />
          </button>
        ))}
      </div>
    );
  }
  if (q.kind === "numeric") {
    const v = answer?.kind === "numeric" ? answer : { kind: "numeric" as const, value: "", unit: null };
    return (
      <div className="exam-numeric">
        <NumericField
          value={v.value}
          unit={v.unit}
          fine={fine}
          focused={focused}
          placeholder={fine ? "Ta réponse" : "Touche pour répondre"}
          label={`Réponse à la question ${q.label}`}
          onFocus={onFocus}
          onChange={(value) => onAnswer({ ...v, value })}
          onSubmit={onSubmit}
        />
        {fine && q.units ? <UnitPicker units={q.units} value={v.unit} onChange={(u) => onAnswer({ ...v, unit: u })} /> : null}
      </div>
    );
  }
  if (q.kind === "order") {
    const placed = answer?.kind === "order" ? answer.order : [];
    const pool = q.display.filter((i) => !placed.includes(i));
    return (
      <div className="order-compact">
        {placed.length ? (
          <ol className="order-list">
            {placed.map((stepIndex, pos) => (
              <li key={`${stepIndex}`}>
                <button type="button" className="order-step" onMouseDown={keepFocus} onClick={() => onAnswer({ kind: "order", order: placed.filter((_, k) => k !== pos) })} aria-label={`Retirer l'étape ${pos + 1}`}>
                  <span className="order-num">{pos + 1}</span>
                  <span className="math">{nb(q.steps[stepIndex] ?? "")}</span>
                </button>
              </li>
            ))}
          </ol>
        ) : null}
        {pool.length ? (
          <div className="order-pool">
            {pool.map((i) => (
              <button key={i} type="button" className="pool-step math" onMouseDown={keepFocus} onClick={() => onAnswer({ kind: "order", order: [...placed, i] })}>
                {nb(q.steps[i] ?? "")}
              </button>
            ))}
          </div>
        ) : (
          <button type="button" className="text-btn order-reset" onClick={() => onAnswer({ kind: "order", order: [] })}>
            <RotateCcw size={15} /> Recommencer
          </button>
        )}
      </div>
    );
  }
  const line = answer?.kind === "spot" ? answer.line : null;
  return <Copy author={q.author} lines={q.lines} selected={line} onSelect={(i) => onAnswer({ kind: "spot", line: i })} />;
}
