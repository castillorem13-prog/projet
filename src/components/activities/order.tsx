"use client";

import { Check } from "lucide-react";
import { useRef, useState } from "react";
import { hintsOf, themed, type OrderActivity as OrderData } from "@/lib/content/types";
import { cx, nb } from "@/lib/cx";
import type { ItemStatus } from "@/lib/session-result";
import { keepFocus, useKeys } from "@/lib/use-keys";
import { Feedback, type Phase } from "./feedback";
import { ActivityFrame, CheckButton } from "./frame";
import { assistanceOf, elapsedSeconds, type ActivityProps } from "./types";

function prefixLength(placed: number[]): number {
  let n = 0;
  while (n < placed.length && placed[n] === n) n++;
  return n;
}

/** Remets dans l'ordre : on touche les étapes dans l'ordre (plus accessible qu'un glisser-déposer). */
export function OrderActivity({ activity, passion, reviewLabel, seed, onComplete }: ActivityProps<OrderData>) {
  const start = useRef(Date.now());
  const [placed, setPlaced] = useState<number[]>([]);
  const [tries, setTries] = useState(0);
  const [hints, setHints] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "answering" });
  const [status, setStatus] = useState<ItemStatus>("first");
  const locked = phase.kind !== "answering";
  const total = activity.steps.length;
  const pool = activity.display.filter((i) => !placed.includes(i));
  const good = prefixLength(placed);

  const check = () => {
    if (placed.length < total) return;
    if (good === total) {
      setStatus(tries === 0 ? "first" : "retry");
      return setPhase({ kind: "success", message: "Tout est dans le bon ordre." });
    }
    const message =
      good === 0
        ? "Dès le premier élément, ça coince. Par quoi commence-t-on ?"
        : good === 1
          ? "Le premier élément est bien placé, mais pas le suivant."
          : `Les ${good} premiers éléments sont bien placés, mais pas le suivant.`;
    if (tries === 0) {
      setTries(1);
      setPhase({ kind: "retry", message });
    } else {
      setStatus("missed");
      setPlaced(activity.steps.map((_, i) => i));
      setPhase({ kind: "solution", message });
    }
  };

  useKeys((e) => {
    const n = Number(e.key);
    if (Number.isInteger(n) && n >= 1 && n <= pool.length) {
      const pick = pool[n - 1];
      if (pick !== undefined) setPlaced((p) => [...p, pick]);
      return true;
    }
    if (e.key === "Backspace" && placed.length) {
      setPlaced((p) => p.slice(0, -1));
      return true;
    }
    if (e.key === "Enter" && placed.length === total) {
      check();
      return true;
    }
  }, !locked);

  const rowState = (pos: number) => {
    if (phase.kind === "success" || phase.kind === "solution") return "is-correct";
    if (phase.kind === "retry") return pos < good ? "is-correct" : pos === good ? "is-wrong" : "is-dim";
    return "";
  };

  const dock =
    phase.kind === "answering" ? (
      <CheckButton disabled={placed.length < total} onClick={check} label={placed.length < total ? `Encore ${total - placed.length} à placer` : "Vérifier"} />
    ) : (
      <Feedback
        phase={phase}
        seed={seed}
        steps={activity.solution}
        takeaway={activity.takeaway}
        onRetry={() => {
          setPlaced((p) => p.slice(0, prefixLength(p)));
          setPhase({ kind: "answering" });
        }}
        onReveal={() => {
          setStatus("missed");
          setPlaced(activity.steps.map((_, i) => i));
          setPhase({ kind: "solution" });
        }}
        onContinue={() =>
          onComplete([{ activityId: activity.id, competence: activity.competence, status, assistance: assistanceOf(status, hints), stage: activity.stage, seconds: elapsedSeconds(start.current), reviewLabel }])
        }
      />
    );

  return (
    <ActivityFrame
      kind="order"
      competence={activity.competence}
      hints={hintsOf(activity)}
      stimulus={activity.stimulus}
      hintLocked={locked}
      onHint={(n) => setHints((h) => Math.max(h, n))}
      dock={dock}
      statement={
        <>
          <h1 className="prompt">{themed(activity.prompt, passion)}</h1>
          <p className="muted small kbd-tip">Touche les étapes dans l'ordre. Touche une étape placée pour la retirer.</p>
        </>
      }
      answer={
        <>
          <ol className="order-list" aria-label="Ta résolution">
            {activity.steps.map((_, pos) => {
              const stepIndex = placed[pos];
              if (stepIndex === undefined) {
                return (
                  <li key={`slot-${pos}`} className={cx("order-slot", pos === placed.length && "is-next")}>
                    <span className="order-num">{pos + 1}</span>
                    <span className="order-empty">{pos === placed.length ? "Étape suivante" : ""}</span>
                  </li>
                );
              }
              return (
                <li key={`slot-${pos}`}>
                  <button type="button" className={cx("order-step", rowState(pos))} disabled={locked} onMouseDown={keepFocus} onClick={() => setPlaced((p) => p.filter((_, k) => k !== pos))} aria-label={`Retirer l'étape ${pos + 1}`}>
                    <span className="order-num">{rowState(pos) === "is-correct" ? <Check size={16} strokeWidth={3} /> : pos + 1}</span>
                    <span className="math">{nb(activity.steps[stepIndex] ?? "")}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          {pool.length > 0 ? (
            <div className="order-pool" aria-label="Étapes à placer">
              {pool.map((i, k) => (
                <button key={i} type="button" className="pool-step math" disabled={locked} onMouseDown={keepFocus} onClick={() => setPlaced((p) => [...p, i])}>
                  <span className="kbd kbd-hint">{k + 1}</span>
                  {nb(activity.steps[i] ?? "")}
                </button>
              ))}
            </div>
          ) : null}
        </>
      }
    />
  );
}
