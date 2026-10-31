"use client";

import { Check, X } from "lucide-react";
import { useRef, useState } from "react";
import { LineGraph } from "@/components/ui/line-graph";
import { hintsOf, themed, type GraphActivity, type McqActivity } from "@/lib/content/types";
import { cx } from "@/lib/cx";
import type { ItemStatus } from "@/lib/session-result";
import { keepFocus, useKeys } from "@/lib/use-keys";
import { Feedback, type Phase } from "./feedback";
import { ActivityFrame, CheckButton } from "./frame";
import { assistanceOf, elapsedSeconds, type ActivityProps } from "./types";

const LETTERS = ["A", "B", "C", "D"];

/** QCM et choix de graphique : même mécanique, rendu des options différent. */
export function ChoiceActivity({ activity, passion, reviewLabel, seed, onComplete }: ActivityProps<McqActivity | GraphActivity>) {
  const start = useRef(Date.now());
  const [selected, setSelected] = useState<number | null>(null);
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [tries, setTries] = useState(0);
  const [hints, setHints] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "answering" });
  const [status, setStatus] = useState<ItemStatus>("first");
  const locked = phase.kind !== "answering";
  const isGraph = activity.kind === "graph";
  const feedbackOf = (o: McqActivity["options"][number] | GraphActivity["options"][number]) => themed(o.feedback, passion);

  const check = () => {
    if (selected === null) return;
    const option = activity.options[selected];
    if (!option) return;
    if (selected === activity.correct) {
      setStatus(tries === 0 ? "first" : "retry");
      setPhase({ kind: "success", message: feedbackOf(option) });
    } else if (tries === 0) {
      setTries(1);
      setEliminated([selected]);
      setPhase({ kind: "retry", message: feedbackOf(option) });
    } else {
      setStatus("missed");
      setPhase({ kind: "solution", message: feedbackOf(option) });
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

  const optionState = (i: number) => {
    if (phase.kind === "success" || phase.kind === "solution") {
      if (i === activity.correct) return "is-correct";
      if (i === selected) return "is-wrong";
      return "is-dim";
    }
    if (phase.kind === "retry" && i === selected) return "is-wrong";
    if (eliminated.includes(i)) return "is-out";
    return i === selected ? "is-selected" : "";
  };

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
        onContinue={() =>
          onComplete([{ activityId: activity.id, competence: activity.competence, status, assistance: assistanceOf(status, hints), stage: activity.stage, seconds: elapsedSeconds(start.current), reviewLabel }])
        }
      />
    );

  return (
    <ActivityFrame
      kind={activity.kind}
      competence={activity.competence}
      hints={hintsOf(activity)}
      stimulus={activity.stimulus}
      hintLocked={locked}
      onHint={(n) => setHints((h) => Math.max(h, n))}
      statement={<h1 className="prompt">{themed(activity.prompt, passion)}</h1>}
      dock={dock}
      answer={
        <div className={isGraph ? "graph-options" : "options"} role="radiogroup" aria-label="Choisis une réponse">
          {activity.options.map((option, i) => {
            const state = optionState(i);
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={selected === i}
                disabled={locked || eliminated.includes(i)}
                className={cx(isGraph ? "graph-option" : "option", state)}
                onMouseDown={keepFocus}
                onClick={() => setSelected(i)}
              >
                <span className="option-letter">{LETTERS[i]}</span>
                {"text" in option ? (
                  <span className="option-text">{themed(option.text, passion)}</span>
                ) : (
                  <LineGraph
                    curve={option.curve}
                    domain={(activity as GraphActivity).domain}
                    range={(activity as GraphActivity).range}
                    xLabel={(activity as GraphActivity).xLabel}
                    yLabel={(activity as GraphActivity).yLabel}
                  />
                )}
                <span className="option-mark" aria-hidden="true">
                  {state === "is-correct" ? <Check size={20} strokeWidth={3} /> : state === "is-wrong" || state === "is-out" ? <X size={20} strokeWidth={3} /> : null}
                </span>
              </button>
            );
          })}
        </div>
      }
    />
  );
}
