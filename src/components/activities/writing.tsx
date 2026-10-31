"use client";

import { ArrowRight, CircleHelp, PenLine, SearchCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { coach } from "@/lib/coach/provider";
import type { WritingReview } from "@/lib/coach/writing";
import { Button } from "@/components/ui/button";
import { hintsOf, themed, type WritingActivity as WritingData } from "@/lib/content/types";
import { cx, nb } from "@/lib/cx";
import type { ItemStatus } from "@/lib/session-result";
import { ActivityFrame, CheckButton } from "./frame";
import { elapsedSeconds, type ActivityProps } from "./types";

type Rating = 0 | 0.5 | 1;
const RATINGS: { v: Rating; label: string }[] = [
  { v: 1, label: "Oui" },
  { v: 0.5, label: "En partie" },
  { v: 0, label: "Pas encore" },
];

const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

/**
 * Production écrite courte. Jamais corrigée par comparaison de texte :
 * l'élève relit sa réponse avec la grille, voit des exemples recevables, et peut retravailler un point.
 * Le résultat est indicatif et marqué comme auto-évalué dans les traces de maîtrise.
 */
export function WritingActivity({ activity, passion, reviewLabel, onComplete }: ActivityProps<WritingData>) {
  const start = useRef(Date.now());
  const [text, setText] = useState("");
  const [step, setStep] = useState<"write" | "assess" | "done">("write");
  const [ratings, setRatings] = useState<(Rating | null)[]>(() => activity.rubric.map(() => null));
  const [revised, setRevised] = useState(false);
  const [hints, setHints] = useState(0);
  const [review, setReview] = useState<WritingReview | null>(null);
  // Relecture du coach (sur l'appareil) dès que l'élève passe à la grille.
  useEffect(() => {
    if (step !== "assess") return;
    let live = true;
    void coach.reviewWriting(text, activity.checks).then((r) => live && setReview(r));
    return () => {
      live = false;
    };
  }, [step, text, activity.checks]);
  const count = words(text);
  const enough = count >= activity.minWords;
  const score = ratings.reduce<number>((s, r) => s + (r ?? 0), 0) / activity.rubric.length;
  const firstWeak = activity.rubric.findIndex((_, i) => (ratings[i] ?? 0) < 1);
  const weak = firstWeak >= 0 ? activity.rubric[firstWeak] : null;

  const finish = () => {
    const status: ItemStatus = score >= 0.75 ? (revised ? "retry" : "first") : score >= 0.4 ? "retry" : "missed";
    onComplete([{ activityId: activity.id, competence: activity.competence, status, assistance: (Math.min(3, hints) as 0 | 1 | 2 | 3), stage: activity.stage, selfAssessed: true, seconds: elapsedSeconds(start.current), reviewLabel }]);
  };

  const dock =
    step === "write" ? (
      <CheckButton disabled={!enough} onClick={() => setStep("assess")} label={enough ? "Relire avec la grille" : `Encore ${activity.minWords - count} mots environ`} />
    ) : step === "assess" ? (
      <CheckButton disabled={ratings.some((r) => r === null)} onClick={() => setStep("done")} label="Voir des réponses possibles" />
    ) : (
      <div className="feedback feedback-solution" role="status">
        <div className="feedback-title">{score >= 0.75 ? "Ta relecture est solide." : weak ? "Un point à retravailler." : "Relecture terminée."}</div>
        {weak && !revised ? (
          <p className="feedback-text">
            <strong>Conseil prioritaire : {weak.criterion}.</strong> {nb(weak.descriptor)}
          </p>
        ) : null}
        <div className="feedback-actions">
          {weak && !revised ? (
            <Button
              variant="ghost"
              icon={<PenLine size={18} />}
              onClick={() => {
                setRevised(true);
                setRatings(activity.rubric.map(() => null));
                setStep("write");
              }}
            >
              Retravailler
            </Button>
          ) : null}
          <Button variant="ink" onClick={finish} trailing={<ArrowRight size={18} />}>Continuer</Button>
        </div>
      </div>
    );

  return (
    <ActivityFrame
      kind="writing"
      competence={activity.competence}
      hints={hintsOf(activity)}
      hintLocked={step !== "write"}
      onHint={(h) => setHints((x) => Math.max(x, h))}
      stimulus={activity.stimulus}
      dock={dock}
      statement={<h1 className="prompt">{themed(activity.prompt, passion)}</h1>}
      answer={
        <div className="writing">
          {step === "write" ? (
            <label className="writing-field">
              <span className="sr-only">Ta réponse</span>
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={activity.placeholder} rows={7} spellCheck lang="fr" />
              <span className={cx("writing-count", enough && "is-ok")}>{count} mot{count > 1 ? "s" : ""} · {activity.minWords} attendus environ</span>
            </label>
          ) : (
            <>
              <blockquote className="writing-mine">{text}</blockquote>
              {review?.form.length ? (
                <ul className="coach-form">
                  {review.form.map((f) => <li key={f}>{f}</li>)}
                </ul>
              ) : null}
              <ol className="rubric">
                {activity.rubric.map((r, i) => (
                  <li key={r.criterion} className="rubric-row">
                    <span className="rubric-main">
                      <strong>{r.criterion}</strong>
                      <span>{nb(r.descriptor)}</span>
                      {(() => {
                        const c = review?.criteria.find((x) => x.criterion === i);
                        if (!c) return null;
                        return (
                          <span className={cx("coach-hit", c.status === "repere" ? "is-found" : "is-check")}>
                            {c.status === "repere" ? <SearchCheck size={15} strokeWidth={2.6} /> : <CircleHelp size={15} strokeWidth={2.6} />}
                            {c.status === "repere" ? "Repéré · " : "À vérifier · "}{nb(c.detail)}
                          </span>
                        );
                      })()}
                    </span>
                    <span className="rubric-choices" role="radiogroup" aria-label={r.criterion}>
                      {RATINGS.map((o) => (
                        <button
                          key={o.label}
                          type="button"
                          role="radio"
                          aria-checked={ratings[i] === o.v}
                          disabled={step === "done"}
                          className={cx("sort-choice", ratings[i] === o.v && "is-on")}
                          onClick={() => setRatings((rs) => rs.map((x, j) => (j === i ? o.v : x)))}
                        >
                          {o.label}
                        </button>
                      ))}
                    </span>
                  </li>
                ))}
              </ol>
              {step === "done" ? (
                <section className="models" aria-label="Réponses possibles">
                  <h2 className="models-title">{activity.models.length > 1 ? "Des réponses possibles" : "Une réponse possible"}, parmi d'autres</h2>
                  {activity.models.map((m) => (
                    <p key={m.slice(0, 20)} className="model">{nb(m)}</p>
                  ))}
                </section>
              ) : null}
            </>
          )}
        </div>
      }
    />
  );
}
