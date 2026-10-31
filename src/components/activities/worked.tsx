"use client";

import { Check, X } from "lucide-react";
import { useRef, useState } from "react";
import { hintsOf, themed, type WorkedActivity as WorkedData } from "@/lib/content/types";
import { cx, nb } from "@/lib/cx";
import type { ItemStatus } from "@/lib/session-result";
import { keepFocus, useKeys } from "@/lib/use-keys";
import { Feedback, type Phase } from "./feedback";
import { ActivityFrame, CheckButton } from "./frame";
import { assistanceOf, elapsedSeconds, type ActivityProps } from "./types";

const LETTERS = ["A", "B", "C", "D"];

/** Exemple résolu à compléter : la méthode est visible, une étape décisive reste à trouver. */
export function WorkedActivity({ activity, passion, reviewLabel, seed, onComplete }: ActivityProps<WorkedData>) {
  const start = useRef(Date.now());
  const [selected, setSelected] = useState<number | null>(null);
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [tries, setTries] = useState(0);
  const [hints, setHints] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "answering" });
  const [status, setStatus] = useState<ItemStatus>("first");
  const locked = phase.kind !== "answering";
  const solved = phase.kind === "success" || phase.kind === "solution";

  const check = () => {
    if (selected === null) return;
    const o = activity.options[selected];
    if (!o) return;
    if (selected === activity.correct) {
      setStatus(tries === 0 ? "first" : "retry");
      setPhase({ kind: "success", message: o.feedback });
    } else if (tries === 0) {
      setTries(1);
      setEliminated([selected]);
      setPhase({ kind: "retry", message: o.feedback });
    } else {
      setStatus("missed");
      setPhase({ kind: "solution", message: o.feedback });
    }
  };

  useKeys((e) => {
    const k = e.key.toLowerCase();
    const idx = "abcd".indexOf(k) >= 0 ? "abcd".indexOf(k) : "1234".indexOf(k);
    if (idx >= 0 && idx < activity.options.length && !eliminated.includes(idx)) {
      setSelected(idx);
      return true;
    }
    if (e.key === "Enter" && selected !== null) {
      check();
      return true;
    }
  }, !locked);

  const filled = activity.options[activity.correct]?.text ?? "";
  const dock =
    phase.kind === "answering" ? (
      <CheckButton disabled={selected === null} onClick={check} />
    ) : (
      <Feedback
        phase={phase}
        seed={seed}
        steps={activity.solution}
        takeaway={activity.takeaway}
        onRetry={() => {
          setSelected(null);
          setPhase({ kind: "answering" });
        }}
        onReveal={() => {
          setStatus("missed");
          setPhase({ kind: "solution" });
        }}
        onContinue={() => onComplete([{ activityId: activity.id, competence: activity.competence, status, assistance: assistanceOf(status, hints), stage: activity.stage, seconds: elapsedSeconds(start.current), reviewLabel }])}
      />
    );

  return (
    <ActivityFrame
      kind="worked"
      competence={activity.competence}
      hints={hintsOf(activity)}
      hintLocked={locked}
      onHint={(h) => setHints((x) => Math.max(x, h))}
      stimulus={activity.stimulus}
      dock={dock}
      statement={
        <>
          <h1 className="prompt">{themed(activity.prompt, passion)}</h1>
          <ol className="worked">
            {activity.steps.map((s, i) => (
              <li key={i} className={cx("worked-step", i === activity.blank && "is-blank", i === activity.blank && solved && "is-filled")}>
                <span className="worked-n">{i + 1}</span>
                <span className="worked-main">
                  <span className="math worked-text">{i === activity.blank ? (solved ? nb(filled) : "Étape à compléter") : nb(s.text)}</span>
                  <span className="worked-why">{nb(s.why)}</span>
                </span>
              </li>
            ))}
          </ol>
        </>
      }
      answer={
        <div className="options" role="radiogroup" aria-label="Choisis l'étape manquante">
          {activity.options.map((o, i) => {
            const st = solved ? (i === activity.correct ? "is-correct" : i === selected ? "is-wrong" : "is-dim") : phase.kind === "retry" && i === selected ? "is-wrong" : eliminated.includes(i) ? "is-out" : i === selected ? "is-selected" : "";
            return (
              <button key={i} type="button" role="radio" aria-checked={selected === i} disabled={locked || eliminated.includes(i)} className={cx("option", st)} onMouseDown={keepFocus} onClick={() => setSelected(i)}>
                <span className="option-letter">{LETTERS[i]}</span>
                <span className="option-text math">{nb(o.text)}</span>
                <span className="option-mark" aria-hidden="true">{st === "is-correct" ? <Check size={20} strokeWidth={3} /> : st === "is-wrong" || st === "is-out" ? <X size={20} strokeWidth={3} /> : null}</span>
              </button>
            );
          })}
        </div>
      }
    />
  );
}
