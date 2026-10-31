"use client";

import { PenLine } from "lucide-react";
import { useRef, useState } from "react";
import { hintsOf, themed, type SpotErrorActivity as SpotData } from "@/lib/content/types";
import { cx, nb } from "@/lib/cx";
import type { ItemStatus } from "@/lib/session-result";
import { keepFocus, useKeys } from "@/lib/use-keys";
import { Feedback, type Phase } from "./feedback";
import { ActivityFrame, CheckButton } from "./frame";
import { assistanceOf, elapsedSeconds, type ActivityProps } from "./types";

/** Trouve l'erreur : on lit la copie d'un autre élève et on touche la ligne fautive. */
export function SpotErrorActivity({ activity, passion, reviewLabel, seed, onComplete }: ActivityProps<SpotData>) {
  const start = useRef(Date.now());
  const [selected, setSelected] = useState<number | null>(null);
  const [tries, setTries] = useState(0);
  const [hints, setHints] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "answering" });
  const [status, setStatus] = useState<ItemStatus>("first");
  const locked = phase.kind !== "answering";
  const revealed = phase.kind === "success" || phase.kind === "solution";
  const lines = activity.lines.map((l) => themed(l, passion));
  const correction = themed(activity.correction, passion);

  const check = () => {
    if (selected === null) return;
    if (selected === activity.wrongLine) {
      setStatus(tries === 0 ? "first" : "retry");
      return setPhase({ kind: "success", message: `Bien repéré. La ligne corrigée : ${correction.replace(/[.!]$/, "")}.` });
    }
    const message = activity.lineFeedback[selected] || "Cette ligne est correcte.";
    if (tries === 0) {
      setTries(1);
      setPhase({ kind: "retry", message });
    } else {
      setStatus("missed");
      setPhase({ kind: "solution", message });
    }
  };

  useKeys((e) => {
    const n = Number(e.key);
    if (Number.isInteger(n) && n >= 1 && n <= activity.lines.length) {
      setSelected(n - 1);
      return true;
    }
    if (e.key === "Enter" && selected !== null) {
      check();
      return true;
    }
  }, !locked);

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
      kind="spot-error"
      competence={activity.competence}
      hints={hintsOf(activity)}
      stimulus={activity.stimulus}
      hintLocked={locked}
      onHint={(n) => setHints((h) => Math.max(h, n))}
      dock={dock}
      statement={<h1 className="prompt">{themed(activity.prompt, passion)}</h1>}
      answer={<Copy author={activity.author} lines={lines} selected={selected} onSelect={setSelected} locked={locked} retry={phase.kind === "retry"} revealed={revealed} wrongLine={activity.wrongLine} correction={correction} />}
    />
  );
}

/** La copie d'un autre élève : marge rouge, lignes numérotées. Réutilisée par le contrôle blanc. */
export function Copy({
  author,
  lines,
  selected,
  onSelect,
  locked = false,
  retry = false,
  revealed = false,
  wrongLine,
  correction,
}: {
  author: string;
  lines: string[];
  selected: number | null;
  onSelect: (i: number) => void;
  locked?: boolean;
  retry?: boolean;
  revealed?: boolean;
  wrongLine?: number;
  correction?: string;
}) {
  return (
    <figure className="copy">
      <figcaption>
        <PenLine size={16} /> La copie de {author}
      </figcaption>
      <ol>
        {lines.map((line, i) => {
          const isWrong = i === wrongLine;
          const state = revealed ? (isWrong ? "is-wrong" : "") : retry && i === selected ? "is-checked" : i === selected ? "is-selected" : "";
          return (
            <li key={line}>
              <button type="button" className={cx("copy-line", state)} disabled={locked} onMouseDown={keepFocus} onClick={() => onSelect(i)} aria-pressed={selected === i}>
                <span className="copy-num">{i + 1}</span>
                <span className="math">{nb(line)}</span>
              </button>
              {revealed && isWrong && correction ? <p className="copy-fix math">{nb(correction)}</p> : null}
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
