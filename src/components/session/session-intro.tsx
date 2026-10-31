"use client";

import { Check } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { FAMILIES, type Passion } from "@/lib/content/passions";
import type { SubjectId } from "@/lib/curriculum/types";
import { cx } from "@/lib/cx";

const CALC: SubjectId[] = ["maths", "maths-tc", "maths-comp", "maths-exp", "physique", "sciences", "ses", "si", "nsi", "snt", "techno"];

/**
 * Écran de préparation affiché pendant que la séance est « écrite ».
 * Dans le produit, c'est le temps de génération par l'IA (quelques secondes) : on montre ce qui se passe.
 */
export function SessionIntro({ passions, formats, subject, personal = true, onDone }: { passions: Passion[]; formats: number; subject: SubjectId; personal?: boolean; onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduce ? 250 : 520;
    const ids = [1, 2, 3].map((s) => window.setTimeout(() => setStep(s), delay * s));
    const end = window.setTimeout(onDone, delay * 3 + (reduce ? 150 : 450));
    return () => {
      ids.forEach(window.clearTimeout);
      window.clearTimeout(end);
    };
  }, [onDone]);

  const names = passions.slice(0, 3).map((p) => p.label.toLowerCase());
  const lines = [
    `On choisit ${formats} formats d'exercices`,
    personal ? `On écrit les énoncés : ${names.join(", ")}${passions.length > 3 ? "…" : ""}` : "On garde les documents tels qu'ils sont : les faits ne se réécrivent pas",
    CALC.includes(subject) ? "On vérifie chaque calcul et chaque réponse" : "On vérifie chaque réponse et chaque document",
  ];

  return (
    <div className="intro on-yellow" role="status" aria-live="polite">
      <div className="intro-inner">
        <p className="wordmark">learnward</p>
        <h1 className="display intro-title">Ta séance se prépare.</h1>
        <ul className="intro-steps">
          {lines.map((l, i) => (
            <li key={l} className={cx(step > i && "is-done", step === i && "is-current")}>
              <span className="intro-dot">{step > i ? <Check size={16} strokeWidth={3} /> : null}</span>
              {l}
            </li>
          ))}
        </ul>
        <div className="intro-passions" aria-hidden="true">
          {passions.slice(0, 6).map((p, i) => (
            <span key={p.id} className="intro-chip" style={{ "--fam": FAMILIES[p.family].color, animationDelay: `${i * 90}ms` } as CSSProperties}>
              {p.label}
            </span>
          ))}
        </div>
        <button type="button" className="text-btn intro-skip" onClick={onDone}>Passer</button>
      </div>
    </div>
  );
}
