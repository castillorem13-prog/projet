"use client";

import { ArrowRight, Check, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CloseHome } from "@/components/coach/close-home";
import { Button } from "@/components/ui/button";
import { FocusPage } from "@/components/ui/focus-page";
import { Segmented } from "@/components/ui/segmented";
import { GRAMMAR, GRAMMAR_ITEMS, type GrammarId } from "@/lib/bac/francais";
import { cx } from "@/lib/cx";
import { useFx } from "@/lib/fx";

type Point = GrammarId | "tout";

/** Les trois points de grammaire de l'oral, en questions rapides : on identifie, puis on lit la règle appliquée à la phrase. */
export function BacGrammar() {
  const fx = useFx();
  const [point, setPoint] = useState<Point>("tout");
  const items = useMemo(() => GRAMMAR_ITEMS.filter((g) => point === "tout" || g.point === point), [point]);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const item = items[i];

  const choose = (k: number) => {
    if (pick !== null || !item) return;
    setPick(k);
    const ok = k === item.answer;
    if (ok) setScore((s) => s + 1);
    fx(ok ? "correct" : "wrong");
  };
  const next = () => {
    setPick(null);
    setI(i + 1);
  };
  const restart = (p: Point) => {
    setPoint(p);
    setI(0);
    setPick(null);
    setScore(0);
  };

  const top = (
    <>
      <CloseHome />
      <span className="topbar-title">Grammaire de l'oral</span>
      <span className="topbar-count num">{Math.min(i + 1, items.length)}/{items.length}</span>
    </>
  );

  if (!item) {
    return (
      <FocusPage top={top}>
        <div className="flash-done">
          <span className="flash-done-icon"><Check size={30} strokeWidth={3} /></span>
          <h1 className="display"><span className="num">{score}/{items.length}</span> du premier coup.</h1>
          <div className="sheet-actions">
            <Button block onClick={() => restart(point)}>Recommencer</Button>
            <Link href="/bac-francais" className="btn btn-ghost btn-block"><span>Bac de français</span></Link>
          </div>
        </div>
      </FocusPage>
    );
  }

  const ok = pick === item.answer;
  return (
    <FocusPage
      top={top}
      dock={pick !== null ? <Button block onClick={next} trailing={<ArrowRight size={20} strokeWidth={2.6} />}>{i + 1 < items.length ? "Suivante" : "Terminer"}</Button> : undefined}
    >
      <div className="gram">
        {i === 0 && pick === null ? (
          <div className="gram-points-wrap">
            <Segmented<Point> label="Point de grammaire" value={point} onChange={restart} options={[{ id: "tout", label: "Tout" }, { id: "negation", label: "Négation" }, { id: "interrogation", label: "Interrogation" }, { id: "subordonnees", label: "Subordonnées" }]} />
          </div>
        ) : null}
        <h1 className="flash-kicker">{GRAMMAR[item.point].label}</h1>
        <blockquote className="gram-sentence">{item.sentence}</blockquote>
        <div className="options options-sm" role="radiogroup" aria-label="Ta réponse">
          {item.categories.map((c, k) => (
            <button key={c} type="button" role="radio" aria-checked={pick === k} disabled={pick !== null} className={cx("option", pick !== null && k === item.answer && "is-correct", pick === k && k !== item.answer && "is-wrong")} onClick={() => choose(k)}>
              <span className="option-letter">{pick !== null && k === item.answer ? <Check size={16} strokeWidth={3} /> : pick === k ? <X size={16} strokeWidth={3} /> : String.fromCharCode(65 + k)}</span>
              <span className="option-text">{c}</span>
              <span />
            </button>
          ))}
        </div>
        {pick !== null ? (
          <p className={cx("gram-explain", ok ? "is-ok" : "is-no")} role="status">{item.explanation}</p>
        ) : null}
      </div>
    </FocusPage>
  );
}
