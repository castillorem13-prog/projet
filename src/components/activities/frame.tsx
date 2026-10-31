"use client";

import { Lightbulb } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { subStyle } from "@/components/ui/subject-icon";
import { COMPETENCES, KINDS } from "@/lib/content/meta";
import type { ActivityKind, CompetenceId, Stimulus } from "@/lib/content/types";
import { cx, nb } from "@/lib/cx";
import { StimulusView } from "./stimulus";

const HINT_NAMES = ["Piste", "Méthode", "Début de la correction"];

/**
 * Structure commune d'un exercice : énoncé, documents éventuels (la question d'abord, pour lire les documents avec un but),
 * indices progressifs, zone de réponse, dock d'action.
 * Téléphone et tablette : une colonne. Ordinateur : document et énoncé à gauche, réponse et action à droite.
 * Les indices s'ouvrent un par un ; l'aide utilisée est enregistrée (elle compte dans la maîtrise, pas dans les points).
 */
export function ActivityFrame({
  kind,
  competence,
  hints,
  hintLocked,
  onHint,
  stimulus,
  statement,
  answer,
  dock,
}: {
  kind: ActivityKind;
  competence: CompetenceId;
  hints: [string, string, string];
  hintLocked?: boolean;
  onHint: (level: number) => void;
  stimulus?: Stimulus | Stimulus[];
  statement: ReactNode;
  answer: ReactNode;
  dock: ReactNode;
}) {
  const [shown, setShown] = useState(0);
  const lastRef = useRef<HTMLLIElement>(null);
  const comp = COMPETENCES[competence];
  useEffect(() => {
    if (shown) lastRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [shown]);

  const reveal = () => {
    const next = Math.min(3, shown + 1);
    setShown(next);
    onHint(next);
  };
  const docs = stimulus ? (Array.isArray(stimulus) ? stimulus : [stimulus]) : [];

  return (
    <div className="activity">
      <div className="activity-col activity-col-left">
        <div className="activity-statement">
          <div className="activity-tags">
            <span className="chip chip-outline">{KINDS[kind].label}</span>
            <span className="chip chip-sub" style={subStyle(comp.subject)}>{comp.label}</span>
          </div>
          {statement}
          {docs.length ? (
            <div className="stimuli">
              {docs.map((d) => (
                <StimulusView key={d.title} s={d} />
              ))}
            </div>
          ) : null}
        </div>
        <div className="activity-hint">
          {shown ? (
            <ol className="hint-list" aria-label="Indices">
              {hints.slice(0, shown).map((h, i) => (
                <li key={i} ref={i === shown - 1 ? lastRef : undefined} className="hint-card">
                  <span className="hint-name">Indice {i + 1} · {HINT_NAMES[i]}</span>
                  {nb(h)}
                </li>
              ))}
            </ol>
          ) : null}
          {hintLocked || shown >= 3 ? null : (
            <button type="button" className={cx("hint-btn", shown > 0 && "is-open")} onClick={reveal}>
              <Lightbulb size={18} strokeWidth={2.4} />
              {shown === 0 ? "Besoin d'un coup de pouce ?" : "Un indice de plus"}
              <span className="hint-count">{shown}/3</span>
            </button>
          )}
          {shown > 0 && !hintLocked ? <p className="hint-note">Un indice t'aide maintenant ; la prochaine fois, on te proposera d'essayer sans.</p> : null}
        </div>
      </div>
      <div className="activity-col activity-col-right">
        <div className="activity-answer">{answer}</div>
        <div className="dock activity-dock">
          <div className="dock-inner">{dock}</div>
        </div>
      </div>
    </div>
  );
}

/** Bouton « Vérifier » commun, avec l'indication de la touche Entrée sur ordinateur. */
export function CheckButton({ disabled, onClick, label = "Vérifier" }: { disabled?: boolean; onClick: () => void; label?: string }) {
  return (
    <button type="button" className="btn btn-ink btn-block" disabled={disabled} onClick={onClick}>
      <span>{label}</span>
      {!disabled ? <span className="kbd kbd-hint">Entrée</span> : null}
    </button>
  );
}
