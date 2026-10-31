"use client";

import { Check, ListChecks, Shuffle, X } from "lucide-react";
import { useCallback, useRef, useState, type CSSProperties } from "react";
import { FamilyIcon } from "@/components/ui/family-icon";
import { FAMILIES, type Passion } from "@/lib/content/passions";
import { hintsOf, isThemed, themed, type ProblemActivity as ProblemData } from "@/lib/content/types";
import { cx } from "@/lib/cx";
import { checkAnswer } from "@/lib/pedagogy/answer-checker";
import type { ItemResult, ItemStatus } from "@/lib/session-result";
import { useFinePointer } from "@/lib/use-media";
import { Feedback, type Phase } from "./feedback";
import { ActivityFrame, CheckButton } from "./frame";
import { applyKey, Keypad } from "./keypad";
import { NumericField, UnitPicker } from "./numeric-field";
import { assistanceOf, elapsedSeconds, type ActivityProps } from "./types";
import { BarModelView } from "./bar-model";
import { useMethodOn } from "./env";
import { coach } from "@/lib/coach/provider";
import type { ErrorType } from "@/lib/curriculum/types";

/** Méthode « Penser sa démarche » (Singapour) : trois questions avant de calculer. */
const PLAN_STEPS = ["Je sais ce que l'on cherche.", "J'ai repéré les données utiles (et celles qui ne servent pas).", "J'ai une idée de stratégie : quelle opération, dans quel ordre."];

const GENERIC = "Ce n'est pas le bon résultat. Relis la question et refais ton calcul étape par étape.";

/** Exercice type : un énoncé écrit autour d'une passion, et plusieurs questions à saisir. */
export function ProblemActivity({ activity, passion, onSwap, seed, onComplete }: ActivityProps<ProblemData>) {
  const fine = useFinePointer();
  const partStart = useRef(Date.now());
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [hints, setHints] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "answering" });
  const [status, setStatus] = useState<ItemStatus>("first");
  const [notice, setNotice] = useState<{ text: string; n: number } | null>(null);
  const [results, setResults] = useState<ItemResult[]>([]);
  const [errType, setErrType] = useState<ErrorType | undefined>(undefined);
  const showModel = useMethodOn("sg-modeles") && Boolean(activity.model);
  const demarche = useMethodOn("sg-demarche");
  const [ticks, setTicks] = useState<boolean[]>(() => PLAN_STEPS.map(() => false));
  const [planned, setPlanned] = useState(!demarche);
  const part = activity.parts[index];

  const onKey = useCallback((k: string) => {
    setNotice(null);
    setValue((v) => applyKey(v, k));
  }, []);

  const check = useCallback(() => {
    if (!part || phase.kind !== "answering") return;
    const raw = unit ? `${value} ${unit}` : value;
    const r = checkAnswer(part.answer, raw);
    const say = (text: string) => setNotice((n) => ({ text, n: (n?.n ?? 0) + 1 }));
    if (r.status === "invalid_format") return say("Écris un nombre, par exemple 12 ou 7,5.");
    if (r.status === "unit_missing") return say("Choisis l'unité de ton résultat.");
    if (r.status === "wrong_unit") return say(`La question demande un résultat en ${part.answer.unit}.`);
    if (r.status === "correct") {
      setStatus(tries === 0 ? "first" : "retry");
      return setPhase({ kind: "success", message: `Bonne réponse : ${part.recap}.` });
    }
    const message = (r.matchedErrorCode && part.errors?.[r.matchedErrorCode]) || GENERIC;
    setErrType(coach.diagnose(part, r.value, r.matchedErrorCode));
    if (tries === 0) {
      setTries(1);
      setPhase({ kind: "retry", message });
    } else {
      setStatus("missed");
      setPhase({ kind: "solution", message });
    }
  }, [part, unit, value, tries, phase.kind]);

  if (!part) return null;
  const isLast = index + 1 >= activity.parts.length;

  const next = () => {
    const item: ItemResult = { activityId: activity.id, competence: part.competence, status, assistance: assistanceOf(status, hints), stage: activity.stage, seconds: elapsedSeconds(partStart.current), reviewLabel: part.reviewLabel, ...(status !== "first" && errType ? { errorType: errType } : {}) };
    const all = [...results, item];
    if (isLast) return onComplete(all);
    setResults(all);
    setIndex(index + 1);
    setValue("");
    setUnit(null);
    setTries(0);
    setHints(0);
    setStatus("first");
    setNotice(null);
    setErrType(undefined);
    setPhase({ kind: "answering" });
    partStart.current = Date.now();
  };

  const answering = phase.kind === "answering";
  const canSubmit = value.replace("−", "").replace("-", "").length > 0;

  const dock = !planned ? (
    <CheckButton disabled={ticks.some((x) => !x)} onClick={() => setPlanned(true)} label={ticks.every(Boolean) ? "J'ai mon plan, je calcule" : "Coche les trois étapes"} />
  ) : answering ? (
    <div className="numeric-dock">
      {part.units ? <UnitPicker units={part.units} value={unit} onChange={(u) => { setUnit(u); setNotice(null); }} /> : null}
      {fine ? <CheckButton disabled={!canSubmit} onClick={check} /> : <Keypad onKey={onKey} onSubmit={check} canSubmit={canSubmit} />}
    </div>
  ) : (
    <Feedback
      phase={phase}
      seed={seed + index}
      steps={part.solution}
      takeaway={isLast ? activity.takeaway : undefined}
      continueLabel={isLast ? "Continuer" : `Question ${activity.parts[index + 1]?.label})`}
      diagnosis={phase.kind === "success" ? undefined : errType}
      note={demarche && phase.kind === "success" ? "Contrôle : ton résultat est-il plausible (ordre de grandeur, unité) ? Si oui, tu peux continuer." : undefined}
      onRetry={() => {
        setValue("");
        setPhase({ kind: "answering" });
      }}
      onReveal={() => {
        setStatus("missed");
        setPhase({ kind: "solution" });
      }}
      onContinue={next}
    />
  );

  return (
    <ActivityFrame
      key={part.id}
      kind="problem"
      competence={part.competence}
      hints={hintsOf({ ...part, takeaway: activity.takeaway })}
      stimulus={activity.stimulus}
      hintLocked={!answering}
      onHint={(n) => setHints((h) => Math.max(h, n))}
      dock={dock}
      statement={
        <>
          <ContextCard passion={passion} text={themed(activity.context, passion)} onSwap={onSwap} personal={isThemed(activity.context)} />
          {showModel && activity.model ? <BarModelView model={activity.model} /> : null}
          <ol className="parts">
            {activity.parts.slice(0, index).map((p, i) => {
              const r = results[i];
              return (
                <li key={p.id} className="part part-done">
                  <span className={cx("part-label", r?.status === "missed" ? "is-missed" : "is-ok")}>
                    {r?.status === "missed" ? <X size={16} strokeWidth={3} /> : <Check size={16} strokeWidth={3} />}
                  </span>
                  <span className="part-recap">{p.recap}</span>
                </li>
              );
            })}
            <li className="part part-active">
              <span className="part-label">{part.label}</span>
              <h1 className="prompt prompt-sm">{themed(part.prompt, passion)}</h1>
            </li>
          </ol>
        </>
      }
      answer={
        !planned ? (
          <section className="plan-first" aria-labelledby="plan-first-title">
            <h2 id="plan-first-title" className="plan-first-title"><ListChecks size={18} strokeWidth={2.4} /> Avant de calculer</h2>
            <ul className="plan-first-list">
              {PLAN_STEPS.map((step, i) => (
                <li key={step}>
                  <label className="plan-first-check">
                    <input type="checkbox" checked={ticks[i]} onChange={(e) => setTicks((p) => p.map((x, j) => (j === i ? e.target.checked : x)))} />
                    <span>{step}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="muted small">Rien n'est noté ici.</p>
          </section>
        ) : <>
          <NumericField
            value={value}
            unit={unit}
            fine={fine}
            label={`Ta réponse à la question ${part.label}`}
            status={phase.kind === "success" ? "correct" : phase.kind === "retry" || phase.kind === "solution" ? "wrong" : undefined}
            onChange={(v) => { setNotice(null); setValue(v); }}
            onSubmit={check}
          />
          {notice ? (
            <p key={notice.n} className="notice answer-notice" role="alert">
              {notice.text}
            </p>
          ) : null}
          {activity.parts.length > index + 1 ? (
            <ol className="parts parts-next" aria-label="Questions suivantes">
              {activity.parts.slice(index + 1).map((p) => (
                <li key={p.id} className="part part-next">
                  <span className="part-label">{p.label}</span>
                  <span>{themed(p.prompt, passion)}</span>
                </li>
              ))}
            </ol>
          ) : null}
        </>
      }
    />
  );
}

/** Décor de l'énoncé : la passion utilisée, et un bouton pour en changer sans changer les maths. */
export function ContextCard({ passion, text, onSwap, personal = true }: { passion: Passion; text: string; onSwap?: () => void; personal?: boolean }) {
  if (!personal) {
    return (
      <div className="context-card is-plain">
        <p>{text}</p>
      </div>
    );
  }
  return (
    <div className="context-card fam" style={{ "--fam": FAMILIES[passion.family].color } as CSSProperties}>
      <div className="context-head">
        <span className="context-theme">
          <FamilyIcon family={passion.family} size={16} /> {passion.label}
        </span>
        {onSwap ? (
          <button type="button" className="swap-btn" onClick={onSwap}>
            <Shuffle size={15} strokeWidth={2.6} /> Autre passion
          </button>
        ) : null}
      </div>
      <p key={passion.id}>{text}</p>
    </div>
  );
}
