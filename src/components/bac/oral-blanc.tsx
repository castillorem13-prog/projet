"use client";

import { ArrowRight, Check, Dices, Shuffle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CloseHome } from "@/components/coach/close-home";
import { Button } from "@/components/ui/button";
import { FocusPage } from "@/components/ui/focus-page";
import { EAF, ENTRETIEN_QUESTIONS, GRAMMAR, OBJETS, ORAL_GRID, getOeuvre, type GrammarId } from "@/lib/bac/francais";
import { cx, frNumber } from "@/lib/cx";
import { useFx } from "@/lib/fx";
import { logBlanc, useStore } from "@/lib/store";
import { GridResult, PhaseClock, RecordButton, SelfGrid, gridScore, useRecorder, useStopwatch } from "./parts";

type Phase = "tirage" | "prep" | "partie1" | "partie2" | "grille" | "fin";
const POINTS: GrammarId[] = ["negation", "interrogation", "subordonnees"];
const STEPS: { id: Phase; label: string }[] = [
  { id: "prep", label: "Préparation" },
  { id: "partie1", label: "Exposé" },
  { id: "partie2", label: "Entretien" },
  { id: "grille", label: "Grille" },
];

/**
 * Oral blanc de français, au format de l'épreuve : 30 minutes de préparation, puis 12 minutes (lecture, explication,
 * grammaire) et 8 minutes (œuvre choisie, entretien). Le texte est tiré au sort dans le descriptif de l'élève.
 */
export function OralBlanc() {
  const fx = useFx();
  const { state, update } = useStore();
  const bac = state.bac;
  const [phase, setPhase] = useState<Phase>("tirage");
  const [pick, setPick] = useState(() => Math.floor(Math.random() * Math.max(1, bac.textes.length)));
  const [gram] = useState<GrammarId>(() => POINTS[Math.floor(Math.random() * POINTS.length)] as GrammarId);
  const [notes, setNotes] = useState("");
  const [step1, setStep1] = useState(0);
  const [q, setQ] = useState(0);
  const [levels, setLevels] = useState<(number | null)[]>(ORAL_GRID.map(() => null));
  const clock = useStopwatch(phase, phase === "prep" || phase === "partie1" || phase === "partie2");
  const recorder = useRecorder();
  const [questions] = useState(() => {
    const list = [...ENTRETIEN_QUESTIONS];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j] as string, list[i] as string];
    }
    return list.slice(0, 4);
  });
  const text = bac.textes[pick % Math.max(1, bac.textes.length)];
  const choisie = getOeuvre(bac.choisie);

  const top = (
    <>
      <CloseHome />
      <span className="topbar-title">Oral blanc</span>
      {phase !== "tirage" && phase !== "fin" ? (
        <ol className="phase-steps" aria-label="Étapes">
          {STEPS.map((s) => (
            <li key={s.id} className={cx(s.id === phase && "is-on", STEPS.findIndex((x) => x.id === phase) > STEPS.findIndex((x) => x.id === s.id) && "is-done")}>{s.label}</li>
          ))}
        </ol>
      ) : <span />}
    </>
  );

  if (!text) {
    return (
      <FocusPage top={top}>
        <div className="flash-done">
          <h1 className="display">Ton descriptif est vide.</h1>
          <p className="muted">Ajoute les textes étudiés en classe : le tirage se fait parmi eux.</p>
          <Link href="/bac-francais" className="btn btn-ink btn-block"><span>Ajouter mes textes</span></Link>
        </div>
      </FocusPage>
    );
  }

  const go = (p: Phase) => {
    setPhase(p);
    window.scrollTo({ top: 0 });
  };
  const finish = () => {
    const score = gridScore(ORAL_GRID, levels.map((l) => l ?? 0));
    fx("complete");
    update((s) => logBlanc(s, { kind: "oral", label: `Oral blanc : ${text.title}`, score }, EAF.oral.preparation + EAF.oral.minutes));
    go("fin");
  };

  if (phase === "tirage") {
    return (
      <FocusPage top={top} dock={<Button block onClick={() => go("prep")} trailing={<ArrowRight size={20} strokeWidth={2.6} />}>Lancer les 30 minutes</Button>}>
        <div className="oral-blanc">
          <p className="flash-kicker"><Dices size={16} strokeWidth={2.4} /> Texte tiré au sort</p>
          <h1 className="flash-title">{text.title}</h1>
          <p className="muted">{OBJETS[text.objet].label}</p>
          <div className="oral-subject">
            <p><strong>Question de grammaire :</strong> {GRAMMAR[gram].label.toLowerCase()}. Dans le passage, choisis une phrase qui la contient et analyse-la.</p>
            <p><strong>Deuxième partie :</strong> {choisie ? <>tu présentes <em>{choisie.titre}</em> ({choisie.auteur}), puis l'entretien.</> : "indique ton œuvre choisie dans Bac de français."}</p>
          </div>
          {bac.textes.length > 1 ? (
            <button type="button" className="text-btn" onClick={() => setPick(pick + 1 + Math.floor(Math.random() * (bac.textes.length - 1)))}>
              <Shuffle size={16} strokeWidth={2.4} /> Tirer un autre texte
            </button>
          ) : null}
        </div>
      </FocusPage>
    );
  }

  if (phase === "prep") {
    return (
      <FocusPage top={top} dock={<Button block onClick={() => go("partie1")} trailing={<ArrowRight size={20} strokeWidth={2.6} />}>Je suis prêt : passer l'oral</Button>}>
        <div className="oral-blanc">
          <PhaseClock seconds={clock.seconds} minutes={EAF.oral.preparation} running={clock.running} onToggle={() => clock.setRunning(!clock.running)} label="Préparation" />
          <h1 className="flash-title">{text.title}</h1>
          <label className="field">
            <span className="field-label">Brouillon</span>
            <textarea className="input textarea oral-notes" rows={10} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={"Situation du passage…\nProjet de lecture…\nMouvements…\nGrammaire : …"} />
          </label>
          {text.notes ? (
            <details className="explain">
              <summary>Mes notes de cours</summary>
              {text.notes.split("\n").map((l, k) => <p key={k}>{l}</p>)}
            </details>
          ) : null}
        </div>
      </FocusPage>
    );
  }

  if (phase === "partie1") {
    const parts = [
      { label: "Lecture à voix haute", hint: "Lis le passage, en respectant le rythme et la ponctuation." },
      { label: "Explication linéaire", hint: "Situe le passage, annonce ton projet de lecture, suis les mouvements." },
      { label: "Question de grammaire", hint: `${GRAMMAR[gram].label} : identifie, puis analyse.` },
    ];
    return (
      <FocusPage top={top} dock={<Button block onClick={() => go("partie2")} trailing={<ArrowRight size={20} strokeWidth={2.6} />}>Deuxième partie</Button>}>
        <div className="oral-blanc">
          <h1 className="sr-only">Oral blanc, première partie : {text.title}</h1>
          <PhaseClock seconds={clock.seconds} minutes={12} running={clock.running} onToggle={() => clock.setRunning(!clock.running)} label="Première partie" />
          <ol className="oral-parts">
            {parts.map((p, k) => (
              <li key={p.label} className={cx("oral-part", k === step1 && "is-on", k < step1 && "is-done")}>
                <button type="button" onClick={() => setStep1(k)}>
                  <span className="oral-part-n">{k < step1 ? <Check size={16} strokeWidth={3} /> : k + 1}</span>
                  <span><strong>{p.label}</strong><span>{p.hint}</span></span>
                  <span className="pts-chip pts-sm">{ORAL_GRID[k]?.points} pts</span>
                </button>
              </li>
            ))}
          </ol>
          {step1 < parts.length - 1 ? <Button variant="soft" onClick={() => setStep1(step1 + 1)}>Étape suivante</Button> : null}
          <div className="oral-rec">
            <RecordButton recorder={recorder} />
            {recorder.url ? <audio controls src={recorder.url} className="oral-audio" /> : null}
          </div>
        </div>
      </FocusPage>
    );
  }

  if (phase === "partie2") {
    return (
      <FocusPage top={top} dock={<Button block onClick={() => { clock.setRunning(false); recorder.stop(); go("grille"); }} trailing={<ArrowRight size={20} strokeWidth={2.6} />}>Fin de l'oral</Button>}>
        <div className="oral-blanc">
          <PhaseClock seconds={clock.seconds} minutes={8} running={clock.running} onToggle={() => clock.setRunning(!clock.running)} label="Deuxième partie" />
          <p className="flash-kicker">Œuvre choisie</p>
          <h1 className="flash-title">{choisie ? choisie.titre : "Ton œuvre choisie"}</h1>
          <p className="muted">Présente-la en quelques minutes, puis réponds aux questions.</p>
          <div className="jury-q" aria-live="polite">
            <span className="jury-q-label">Question {q + 1}</span>
            <p>{questions[q]}</p>
          </div>
          {q < questions.length - 1 ? <Button variant="soft" onClick={() => setQ(q + 1)}>Question suivante</Button> : null}
          <div className="oral-rec">
            <RecordButton recorder={recorder} />
            {recorder.url ? <audio controls src={recorder.url} className="oral-audio" /> : null}
          </div>
        </div>
      </FocusPage>
    );
  }

  if (phase === "grille") {
    const complete = levels.every((l) => l !== null);
    return (
      <FocusPage top={top} dock={<Button block disabled={!complete} onClick={finish}>{complete ? "Voir ma note" : "Situe-toi sur chaque critère"}</Button>}>
        <div className="oral-blanc">
          <h1 className="h1">Ta grille</h1>
          {recorder.url ? <audio controls src={recorder.url} className="oral-audio" /> : null}
          <SelfGrid items={ORAL_GRID} levels={levels} onChange={setLevels} />
        </div>
      </FocusPage>
    );
  }

  const history = (bac.blancs ?? []).filter((b) => b.kind === "oral");
  return (
    <FocusPage top={top}>
      <div className="flash-done">
        <h1 className="sr-only">Résultat de l'oral blanc</h1>
        <GridResult items={ORAL_GRID} levels={levels.map((l) => l ?? 0)} note="Note indicative : c'est ta propre évaluation, avec le barème de l'épreuve." />
        <ul className="grid-detail">
          {ORAL_GRID.map((g, k) => (
            <li key={g.id}><span>{g.label}</span><strong className="num">{frNumber(Math.round((levels[k] ?? 0) * g.points * 2) / 2)}/{g.points}</strong></li>
          ))}
        </ul>
        {history.length > 1 ? <p className="muted small">Oraux blancs : {history.map((h) => frNumber(h.score)).join(" · ")}</p> : null}
        <div className="sheet-actions">
          <Link href="/bac-francais" className="btn btn-ink btn-block"><span>Bac de français</span></Link>
        </div>
      </div>
    </FocusPage>
  );
}
