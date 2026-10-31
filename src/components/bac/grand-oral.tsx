"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CloseHome } from "@/components/coach/close-home";
import { Button } from "@/components/ui/button";
import { FocusPage } from "@/components/ui/focus-page";
import { GRAND_ORAL } from "@/lib/bac/francais";
import { SUBJECTS } from "@/lib/content/meta";
import { cx, frNumber } from "@/lib/cx";
import { useFx } from "@/lib/fx";
import { logBlanc, useStore } from "@/lib/store";
import { GridResult, PhaseClock, RecordButton, SelfGrid, gridScore, useRecorder, useStopwatch } from "./parts";

type Phase = "question" | "prep" | "expose" | "echange" | "orientation" | "grille" | "fin";
const ORDER: Phase[] = ["prep", "expose", "echange", "orientation", "grille"];
const LABEL: Record<Phase, string> = { question: "", prep: "Préparation", expose: "Exposé", echange: "Échange", orientation: "Orientation", grille: "Grille", fin: "" };
const ORIENTATION = ["Comment ta question éclaire-t-elle ton projet ?", "Qu'as-tu déjà fait pour avancer vers ce projet ?", "Quelles études envisages-tu après le bac, et pourquoi ?"];

/** Grand oral blanc : 20 minutes de préparation, puis 5 + 10 + 5 minutes. La grille est celle de LearnWard, pour s'entraîner. */
export function GrandOral() {
  const fx = useFx();
  const { state, update } = useStore();
  const specs = state.profile.track.specialties;
  const [phase, setPhase] = useState<Phase>("question");
  const [question, setQuestion] = useState("");
  const [notes, setNotes] = useState("");
  const [q, setQ] = useState(0);
  const [levels, setLevels] = useState<(number | null)[]>(GRAND_ORAL.grid.map(() => null));
  const clock = useStopwatch(phase, ["prep", "expose", "echange", "orientation"].includes(phase));
  const recorder = useRecorder();
  const step = GRAND_ORAL.steps.find((s) => s.id === phase);
  const grid = GRAND_ORAL.grid;

  const go = (p: Phase) => {
    setPhase(p);
    window.scrollTo({ top: 0 });
  };
  const top = (
    <>
      <CloseHome />
      <span className="topbar-title">Grand oral blanc</span>
      {ORDER.includes(phase) ? (
        <ol className="phase-steps" aria-label="Étapes">
          {ORDER.map((p) => <li key={p} className={cx(p === phase && "is-on", ORDER.indexOf(phase) > ORDER.indexOf(p) && "is-done")}>{LABEL[p]}</li>)}
        </ol>
      ) : <span />}
    </>
  );
  const rec = (
    <div className="oral-rec">
      <RecordButton recorder={recorder} />
      {recorder.url ? <audio controls src={recorder.url} className="oral-audio" /> : null}
    </div>
  );

  if (phase === "question") {
    return (
      <FocusPage top={top} dock={<Button block disabled={question.trim().length < 8} onClick={() => go("prep")} trailing={<ArrowRight size={20} strokeWidth={2.6} />}>Lancer les {GRAND_ORAL.preparation} minutes</Button>}>
        <div className="oral-blanc">
          <p className="kicker">{specs.length ? `Spécialités : ${specs.map((s) => SUBJECTS[s].short).join(", ")}` : "Terminale"}</p>
          <h1 className="h1">Ta question</h1>
          <label className="field">
            <span className="field-label">Celle que tu présenteras au jury</span>
            <textarea className="input textarea" rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Pourquoi les modèles mathématiques ne prédisent-ils pas parfaitement une épidémie ?" />
          </label>
        </div>
      </FocusPage>
    );
  }

  if (phase === "prep") {
    return (
      <FocusPage top={top} dock={<Button block onClick={() => go("expose")} trailing={<ArrowRight size={20} strokeWidth={2.6} />}>Passer devant le jury</Button>}>
        <div className="oral-blanc">
          <PhaseClock seconds={clock.seconds} minutes={GRAND_ORAL.preparation} running={clock.running} onToggle={() => clock.setRunning(!clock.running)} label="Préparation" />
          <h1 className="flash-title">{question}</h1>
          <label className="field">
            <span className="field-label">Support (tu pourras le remettre au jury, pas le lire)</span>
            <textarea className="input textarea oral-notes" rows={10} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={"Accroche…\nDeux ou trois idées…\nConclusion et lien avec ton projet…"} />
          </label>
        </div>
      </FocusPage>
    );
  }

  if (step) {
    const nextPhase: Phase = phase === "expose" ? "echange" : phase === "echange" ? "orientation" : "grille";
    const prompts = phase === "echange" ? GRAND_ORAL.questions : phase === "orientation" ? ORIENTATION : [];
    return (
      <FocusPage top={top} dock={<Button block onClick={() => { if (nextPhase === "grille") { clock.setRunning(false); recorder.stop(); } go(nextPhase); }} trailing={<ArrowRight size={20} strokeWidth={2.6} />}>{nextPhase === "grille" ? "Fin de l'oral" : LABEL[nextPhase]}</Button>}>
        <div className="oral-blanc">
          <h1 className="sr-only">Grand oral blanc : {step.label.toLowerCase()}</h1>
          <PhaseClock seconds={clock.seconds} minutes={step.minutes} running={clock.running} onToggle={() => clock.setRunning(!clock.running)} label={step.label} />
          {phase === "expose" ? (
            <>
              <p className="flash-title">{question}</p>
              <p className="muted">Debout si tu peux, sans tes notes.</p>
            </>
          ) : (
            <>
              <div className="jury-q" aria-live="polite">
                <span className="jury-q-label">Le jury</span>
                <p>{prompts[q % prompts.length]}</p>
              </div>
              <Button variant="soft" onClick={() => setQ(q + 1)}>Question suivante</Button>
            </>
          )}
          {rec}
        </div>
      </FocusPage>
    );
  }

  if (phase === "grille") {
    const complete = levels.every((l) => l !== null);
    const finish = () => {
      fx("complete");
      update((s) => logBlanc(s, { kind: "grand-oral", label: `Grand oral : ${question}`, score: gridScore(grid, levels.map((l) => l ?? 0)) }, GRAND_ORAL.preparation + 20));
      go("fin");
    };
    return (
      <FocusPage top={top} dock={<Button block disabled={!complete} onClick={finish}>{complete ? "Voir ma note" : "Situe-toi sur chaque critère"}</Button>}>
        <div className="oral-blanc">
          <h1 className="h1">Ta grille</h1>
          {recorder.url ? <audio controls src={recorder.url} className="oral-audio" /> : null}
          <SelfGrid items={grid} levels={levels} onChange={setLevels} />
        </div>
      </FocusPage>
    );
  }

  return (
    <FocusPage top={top}>
      <div className="flash-done">
        <h1 className="sr-only">Résultat du grand oral blanc</h1>
        <GridResult items={grid} levels={levels.map((l) => l ?? 0)} note="Note indicative, sur une grille d'entraînement propre à LearnWard (critères inspirés de l'épreuve)." />
        <ul className="grid-detail">
          {grid.map((g, k) => <li key={g.label}><span>{g.label}</span><strong className="num">{frNumber(Math.round((levels[k] ?? 0) * g.points * 2) / 2)}/{g.points}</strong></li>)}
        </ul>
        <div className="sheet-actions">
          <Link href="/epreuves" className="btn btn-ink btn-block"><span>Épreuves blanches</span></Link>
        </div>
      </div>
    </FocusPage>
  );
}
