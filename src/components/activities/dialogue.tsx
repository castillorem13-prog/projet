"use client";

import { Check, Ear, Eye, MessageCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SpeakButton } from "@/components/ui/speak-button";
import { canSpeak } from "@/lib/coach/oral";
import { Button } from "@/components/ui/button";
import { hintsOf, themed, type DialogueActivity as DialogueData } from "@/lib/content/types";
import { cx, nb } from "@/lib/cx";
import { useFx } from "@/lib/fx";
import type { ItemStatus } from "@/lib/session-result";
import { keepFocus } from "@/lib/use-keys";
import { ActivityFrame } from "./frame";
import { useActivityEnv } from "./env";
import { elapsedSeconds, type ActivityProps } from "./types";

type Said = { turn: number; option: number };

/** Dialogue en langue vivante : à chaque réplique, plusieurs réponses peuvent convenir. */
export function DialogueActivity({ activity, passion, reviewLabel, onComplete }: ActivityProps<DialogueData>) {
  const fx = useFx();
  const start = useRef(Date.now());
  const youTurns = activity.turns.map((t, i) => (t.who === "you" ? i : -1)).filter((i) => i >= 0);
  const [said, setSaid] = useState<Said[]>([]);
  const [wrong, setWrong] = useState<Record<number, number[]>>({});
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [hints, setHints] = useState(0);
  const env = useActivityEnv();
  const lang = env.speechLang;
  const gentle = env.methods.includes("erreur-sans-stress");
  // L'oral d'abord : la réplique s'écoute avant de se lire (si l'appareil a une voix de synthèse).
  const [speechOk, setSpeechOk] = useState(false);
  useEffect(() => setSpeechOk(canSpeak()), []);
  const oralFirst = Boolean(lang) && speechOk && env.methods.includes("oral-dabord");
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [listened, setListened] = useState<Record<number, boolean>>({});
  const step = said.length;
  const current = youTurns[step];
  const done = current === undefined;
  const visibleUntil = done ? activity.turns.length : current;

  const choose = (turn: number, k: number) => {
    const t = activity.turns[turn];
    if (!t || t.who !== "you") return;
    const o = t.options[k];
    if (!o) return;
    if (o.ok) {
      fx("correct");
      setNote({ ok: true, text: o.feedback });
      setSaid((s) => [...s, { turn, option: k }]);
    } else {
      if (!gentle) fx("wrong");
      const tried = [...(wrong[turn] ?? []), k];
      setWrong((w) => ({ ...w, [turn]: tried }));
      const remaining = t.options.filter((x, i) => !x.ok && !tried.includes(i)).length;
      setNote({ ok: false, text: remaining ? `${o.feedback} Essaie une autre réponse.` : o.feedback });
    }
  };

  const mistakes = Object.values(wrong).reduce((s, w) => s + w.length, 0);
  const status: ItemStatus = mistakes === 0 ? "first" : mistakes <= 1 ? "retry" : "missed";

  const dock = done ? (
    <div className={cx("feedback", status === "first" ? "feedback-success" : "feedback-solution")} role="status">
      <div className="feedback-title">{status === "first" ? "Échange réussi !" : "Échange terminé."}</div>
      <p className="feedback-text">{status === "first" ? "Tes réponses étaient naturelles et correctes du début à la fin." : `${mistakes} réponse${mistakes > 1 ? "s" : ""} à revoir : relis les explications dans la conversation.`}</p>
      <p className="takeaway"><strong>À retenir</strong> {nb(activity.takeaway)}</p>
      <Button variant={status === "first" ? "green" : "ink"} block onClick={() => onComplete([{ activityId: activity.id, competence: activity.competence, status, assistance: status === "missed" ? 3 : (Math.min(3, hints) as 0 | 1 | 2 | 3), stage: activity.stage, seconds: elapsedSeconds(start.current), reviewLabel }])}>
        Continuer
      </Button>
    </div>
  ) : (
    <p className="dialogue-cue"><MessageCircle size={18} strokeWidth={2.4} /> Choisis ta réplique ci-dessus. Plusieurs peuvent convenir.</p>
  );

  return (
    <ActivityFrame
      kind="dialogue"
      competence={activity.competence}
      hints={hintsOf(activity)}
      hintLocked={done}
      onHint={(h) => setHints((x) => Math.max(x, h))}
      dock={dock}
      statement={
        <>
          <h1 className="prompt">{themed(activity.prompt, passion)}</h1>
          <p className="dialogue-setting">{activity.setting}</p>
        </>
      }
      answer={
        <div className="dialogue" aria-live="polite">
          {activity.turns.slice(0, visibleUntil).map((t, i) => {
            if (t.who === "them") {
              const text = themed(t.text, passion);
              if (oralFirst && !revealed[i] && lang) {
                return (
                  <div key={i} className="bubble is-them is-audio">
                    <span className="bubble-name">{t.name}</span>
                    <span className="bubble-audio">
                      <Ear size={18} strokeWidth={2.4} /> {listened[i] ? "Tu as compris ? Lis pour vérifier." : "Écoute d'abord, sans lire."}
                    </span>
                    <span className="bubble-actions">
                      <SpeakButton text={text} lang={lang} label={listened[i] ? "Réécouter" : "Écouter"} onSpoken={() => setListened((l) => ({ ...l, [i]: true }))} />
                      <button type="button" className="speak-btn is-ghost" onClick={() => setRevealed((r) => ({ ...r, [i]: true }))}>
                        <Eye size={18} strokeWidth={2.4} /> <span>Lire le texte</span>
                      </button>
                    </span>
                  </div>
                );
              }
              return (
                <p key={i} className="bubble is-them" lang={lang ?? "und"}>
                  <span className="bubble-name">{t.name}</span>
                  {text}
                  {lang ? <SpeakButton text={text} lang={lang} compact label="Écouter la réplique" className="bubble-speak" /> : null}
                </p>
              );
            }
            const s = said.find((x) => x.turn === i);
            const o = s ? t.options[s.option] : undefined;
            return o ? (
              <p key={i} className="bubble is-you" lang={lang ?? "und"}>
                <span className="bubble-name">Toi</span>
                {themed(o.text, passion)}
                {lang ? <SpeakButton text={themed(o.text, passion)} lang={lang} compact label="Écouter ta réplique" className="bubble-speak" /> : null}
              </p>
            ) : null;
          })}
          {note ? (
            <p className={cx("dialogue-note", note.ok ? "is-ok" : gentle ? "is-soft" : "is-ko")} role="status">
              {note.ok ? <Check size={16} strokeWidth={3} /> : gentle ? <MessageCircle size={16} strokeWidth={2.6} /> : <X size={16} strokeWidth={3} />} {nb(note.text)}
            </p>
          ) : null}
          {!done && current !== undefined ? (
            <div className="dialogue-options" role="group" aria-label="Ta réplique">
              {(() => {
                const t = activity.turns[current];
                if (!t || t.who !== "you") return null;
                return t.options.map((o, k) => (
                  <button key={k} type="button" className={cx("option", "dialogue-option", wrong[current]?.includes(k) && "is-out")} disabled={wrong[current]?.includes(k)} onMouseDown={keepFocus} onClick={() => choose(current, k)} lang="und">
                    <span className="option-text">{themed(o.text, passion)}</span>
                  </button>
                ));
              })()}
            </div>
          ) : null}
        </div>
      }
    />
  );
}
