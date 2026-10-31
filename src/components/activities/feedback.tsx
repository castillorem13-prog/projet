"use client";

import { Check, MessageCircle, RotateCcw, X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cx, nb } from "@/lib/cx";
import { useFx } from "@/lib/fx";
import { useKeys } from "@/lib/use-keys";
import type { ErrorType } from "@/lib/curriculum/types";
import { useMethodOn } from "./env";

export type Phase =
  | { kind: "answering" }
  | { kind: "retry"; message: string }
  | { kind: "success"; message: string }
  | { kind: "solution"; message?: string };

const SUCCESS_TITLES = ["Exact !", "Bien vu !", "C'est ça !", "Parfait !"];

export function Feedback({
  phase,
  steps,
  takeaway,
  seed = 0,
  onRetry,
  onReveal,
  onContinue,
  continueLabel = "Continuer",
  diagnosis,
  note,
}: {
  phase: Exclude<Phase, { kind: "answering" }>;
  steps: string[];
  takeaway?: string;
  seed?: number;
  onRetry: () => void;
  onReveal: () => void;
  onContinue: () => void;
  continueLabel?: string;
  /** Type d'erreur probable repéré par le coach. */
  diagnosis?: ErrorType;
  /** Remarque ajoutée au retour (ex. « Vérifie que ton résultat est plausible »). */
  note?: string;
}) {
  const fx = useFx();
  // Erreurs sans stress (langues) : pas de croix ni de son d'erreur ; la correction et la trace restent les mêmes.
  const gentle = useMethodOn("erreur-sans-stress");
  const fxKind = phase.kind === "success" ? "correct" : (phase.kind === "retry" || phase.message) && !gentle ? "wrong" : null;
  // Le type d'erreur probable reste une donnée interne (choix des objectifs et des méthodes) : rien à lire pour l'élève.
  const diag = null;
  useEffect(() => {
    if (fxKind) fx(fxKind);
    // Le son ne joue qu'à l'apparition du retour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.kind]);

  useKeys((e) => {
    if (e.key === "Enter") {
      if (phase.kind === "retry") onRetry();
      else onContinue();
      return true;
    }
    if (phase.kind === "retry" && e.key.toLowerCase() === "c") {
      onReveal();
      return true;
    }
  });

  if (phase.kind === "success") {
    return (
      <div className="feedback feedback-success" role="status">
        <div className="feedback-title">
          <span className="feedback-badge"><Check size={22} strokeWidth={3} /></span>
          {SUCCESS_TITLES[seed % SUCCESS_TITLES.length]}
        </div>
        <p className="feedback-text">{nb(phase.message)}</p>
        {note ? <p className="feedback-note">{nb(note)}</p> : null}
        <Button variant="green" block onClick={onContinue} trailing={<span className="kbd kbd-hint">Entrée</span>}>{continueLabel}</Button>
      </div>
    );
  }
  if (phase.kind === "retry") {
    return (
      <div className={cx("feedback feedback-retry", gentle && "is-gentle")} role="status">
        <div className="feedback-title">
          <span className="feedback-badge">{gentle ? <MessageCircle size={20} strokeWidth={2.6} /> : <X size={22} strokeWidth={3} />}</span>
          {gentle ? "Presque ! On essaie autrement." : "Pas encore."}
        </div>
        <p className="feedback-text">{nb(phase.message)}</p>
        {diag}
        <div className="feedback-actions">
          <Button variant="ink" onClick={onRetry} icon={<RotateCcw size={18} />}>Réessayer</Button>
          <Button variant="ghost" onClick={onReveal} trailing={<span className="kbd kbd-hint">C</span>}>Voir le corrigé</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="feedback feedback-solution" role="status">
      <div className="feedback-title">Le corrigé</div>
      {phase.message ? <p className="feedback-text">{nb(phase.message)}</p> : null}
      {diag}
      <ol className="solution-steps">
        {steps.map((s) => (
          <li key={s}>{nb(s)}</li>
        ))}
      </ol>
      {takeaway ? <p className="takeaway"><strong>À retenir</strong> {nb(takeaway)}</p> : null}
      <Button variant="ink" block onClick={onContinue} trailing={<span className="kbd kbd-hint">Entrée</span>}>{continueLabel}</Button>
    </div>
  );
}
