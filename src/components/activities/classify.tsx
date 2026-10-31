"use client";

import { Check, X } from "lucide-react";
import { useRef, useState } from "react";
import { hintsOf, themed, type ClassifyActivity as ClassifyData } from "@/lib/content/types";
import { cx, nb } from "@/lib/cx";
import type { ItemStatus } from "@/lib/session-result";
import { keepFocus } from "@/lib/use-keys";
import { Feedback, type Phase } from "./feedback";
import { ActivityFrame, CheckButton } from "./frame";
import { assistanceOf, elapsedSeconds, type ActivityProps } from "./types";

/** Trier des affirmations : chaque phrase reçoit une catégorie, puis un retour qui explique le classement. */
export function ClassifyActivity({ activity, passion, reviewLabel, seed, onComplete }: ActivityProps<ClassifyData>) {
  const start = useRef(Date.now());
  const n = activity.items.length;
  const [picks, setPicks] = useState<(number | null)[]>(() => activity.items.map(() => null));
  const [checked, setChecked] = useState(false);
  const [tries, setTries] = useState(0);
  const [hints, setHints] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "answering" });
  const [status, setStatus] = useState<ItemStatus>("first");
  const locked = phase.kind !== "answering";
  const revealed = phase.kind === "success" || phase.kind === "solution";
  const good = picks.filter((p, i) => p === activity.items[i]?.category).length;

  const check = () => {
    if (picks.some((p) => p === null)) return;
    setChecked(true);
    if (good === n) {
      setStatus(tries === 0 ? "first" : "retry");
      return setPhase({ kind: "success", message: "Tout est bien classé : relis les explications sous chaque phrase." });
    }
    const message = `${good} sur ${n} bien classées. Les phrases marquées en rouge sont à revoir.`;
    if (tries === 0) {
      setTries(1);
      setPhase({ kind: "retry", message });
    } else {
      setStatus("missed");
      setPicks(activity.items.map((it) => it.category));
      setPhase({ kind: "solution", message });
    }
  };

  const dock =
    phase.kind === "answering" ? (
      <CheckButton disabled={picks.some((p) => p === null)} onClick={check} label={picks.some((p) => p === null) ? `Encore ${picks.filter((p) => p === null).length} à classer` : "Vérifier"} />
    ) : (
      <Feedback
        phase={phase}
        seed={seed}
        steps={activity.solution}
        takeaway={activity.takeaway}
        onRetry={() => {
          setPicks((p) => p.map((v, i) => (v === activity.items[i]?.category ? v : null)));
          setChecked(false);
          setPhase({ kind: "answering" });
        }}
        onReveal={() => {
          setStatus("missed");
          setPicks(activity.items.map((it) => it.category));
          setPhase({ kind: "solution" });
        }}
        onContinue={() => onComplete([{ activityId: activity.id, competence: activity.competence, status, assistance: assistanceOf(status, hints), stage: activity.stage, seconds: elapsedSeconds(start.current), reviewLabel }])}
      />
    );

  return (
    <ActivityFrame
      kind="classify"
      competence={activity.competence}
      hints={hintsOf(activity)}
      hintLocked={locked}
      onHint={(h) => setHints((x) => Math.max(x, h))}
      stimulus={activity.stimulus}
      dock={dock}
      statement={<h1 className="prompt">{themed(activity.prompt, passion)}</h1>}
      answer={
        <ol className="sort-list">
          {activity.items.map((it, i) => {
            const pick = picks[i] ?? null;
            const right = pick === it.category;
            const state = checked || revealed ? (right ? "is-right" : "is-wrong") : "";
            return (
              <li key={i} className={cx("sort-item", state)}>
                <p className="sort-text">
                  {checked || revealed ? <span className="sort-mark">{right ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}</span> : null}
                  {themed(it.text, passion)}
                </p>
                <div className="sort-choices" role="radiogroup" aria-label={`Catégorie de la phrase ${i + 1}`}>
                  {activity.categories.map((c, k) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={pick === k}
                      disabled={locked || (checked && right)}
                      className={cx("sort-choice", pick === k && "is-on")}
                      onMouseDown={keepFocus}
                      onClick={() => {
                        setChecked(false);
                        setPicks((p) => p.map((v, j) => (j === i ? k : v)));
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                {revealed || (checked && right) ? <p className="sort-feedback">{nb(it.feedback)}</p> : null}
              </li>
            );
          })}
        </ol>
      }
    />
  );
}
