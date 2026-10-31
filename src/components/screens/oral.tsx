"use client";

import { Check, Eye, Mic, Pause, Play, RotateCcw, Square } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useRecorder } from "@/components/bac/parts";
import { CloseHome } from "@/components/coach/close-home";
import { Button } from "@/components/ui/button";
import { FocusPage } from "@/components/ui/focus-page";
import { SpeakButton } from "@/components/ui/speak-button";
import { LANG_CODE, isLang, oralChallenge, type Lang } from "@/lib/coach/oral";
import { isoDay } from "@/lib/coach/planner";
import { demoNow } from "@/lib/content/calendar";
import { SUBJECTS } from "@/lib/content/meta";
import { findUnit } from "@/lib/curriculum";
import { studentSubjects } from "@/lib/curriculum/levels";
import type { Evidence } from "@/lib/curriculum/types";
import { nb } from "@/lib/cx";
import { logPractice, useMyPassions, useStore } from "@/lib/store";

const DURATION = 180;

/**
 * Défi oral (méthode nordique) : un sujet, des débuts de phrases, 3 minutes de parole.
 * L'enregistrement (facultatif) reste dans la page : il n'est ni envoyé, ni sauvegardé, et disparaît en quittant.
 */
export function OralScreen() {
  const { state, update } = useStore();
  const router = useRouter();
  const wanted = useSearchParams().get("langue");
  const passions = useMyPassions();
  const subjects = studentSubjects(state.profile.grade, state.profile.track).map((s) => s.subject);
  const lang: Lang | undefined = (wanted && subjects.includes(wanted as Lang) && isLang(wanted as Lang) ? (wanted as Lang) : undefined) ?? subjects.find(isLang);
  const unit = lang ? findUnit(state.progress[lang]?.current) : undefined;
  const challenge = useMemo(() => (lang ? oralChallenge(lang, passions[0]!, unit?.title ?? "", isoDay(demoNow())) : null), [lang, passions, unit?.title]);
  const [left, setLeft] = useState(DURATION);
  const [running, setRunning] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [checks, setChecks] = useState<boolean[]>([false, false, false]);
  const recorder = useRecorder();
  const { state: rec, url: audio, stop: stopRecording } = recorder;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  // Les 3 minutes sont écoulées : le chrono et l'enregistrement s'arrêtent ensemble.
  useEffect(() => {
    if (left > 0) return;
    setRunning(false);
    stopRecording();
  }, [left, stopRecording]);

  if (!lang || !challenge) {
    return (
      <FocusPage top={<><CloseHome /><span className="topbar-title">Défi oral</span></>}>
        <div className="oral"><p>Aucune langue vivante dans tes enseignements.</p></div>
      </FocusPage>
    );
  }

  const startRec = async () => {
    if ((await recorder.start()) && left > 0) setRunning(true);
  };
  const stopRec = () => {
    stopRecording();
    setRunning(false);
  };
  const restart = () => {
    recorder.clear();
    setRunning(false);
    setLeft(DURATION);
  };

  const spoken = DURATION - left;
  const finish = () => {
    const n = checks.filter(Boolean).length;
    const at = demoNow().toISOString();
    // Auto-évaluation : indicative, elle ne vaut pas une preuve autonome de maîtrise.
    const ev: Evidence[] = unit ? [{ unitId: unit.id, itemId: "oral-defi", at, stage: "transfert", result: n === 3 ? "success" : n === 2 ? "partial" : "fail", assistance: 0, selfAssessed: true, methods: ["defi-oral"] }] : [];
    update((s) => logPractice(s, "oral", Math.max(1, Math.round(Math.max(spoken, 60) / 60)), ev));
    router.push("/");
  };
  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  const code = LANG_CODE[lang];

  return (
    <FocusPage
      top={<><CloseHome /><span className="topbar-title">Défi oral en {SUBJECTS[lang].short.toLowerCase()}</span></>}
      dock={<Button block disabled={spoken < 30 && !checks.some(Boolean)} onClick={finish} icon={<Check size={18} />}>{spoken < 30 && !checks.some(Boolean) ? "Parle au moins 30 secondes" : "J'ai fini mon défi"}</Button>}
    >
      <div className="oral">
        <span className="drill-tag">Défi oral · 3 minutes</span>
        <h1 className="oral-task">{challenge.task}</h1>
        {unit ? <p className="oral-theme">Thème de ton chapitre : « {unit.title} »</p> : null}

        <section aria-labelledby="starters-title">
          <h2 id="starters-title" className="h3">Pour démarrer</h2>
          <ul className="oral-starters" lang={code}>
            {challenge.starters.map((s) => (
              <li key={s}>{s} <SpeakButton text={s.replace(/…/g, "")} lang={code} compact label={`Écouter : ${s}`} className="bubble-speak" /></li>
            ))}
          </ul>
        </section>

        <section className="oral-timer" aria-label="Chronomètre de parole">
          <p className="oral-clock" aria-live="off">{mm}</p>
          <div className="oral-controls">
            {running ? (
              <Button variant="ghost" icon={<Pause size={18} />} onClick={() => (rec === "recording" ? stopRec() : setRunning(false))}>Pause</Button>
            ) : (
              <Button icon={<Play size={18} />} onClick={() => setRunning(true)} disabled={left === 0}>{left === DURATION ? "Je parle" : "Reprendre"}</Button>
            )}
            {rec === "idle" && !audio ? <Button variant="ghost" icon={<Mic size={18} />} onClick={() => void startRec()}>M'enregistrer</Button> : null}
            {rec === "recording" ? <Button variant="ink" icon={<Square size={16} />} onClick={stopRec}>Arrêter l'enregistrement</Button> : null}
            <Button variant="ghost" icon={<RotateCcw size={18} />} onClick={restart}>Recommencer</Button>
          </div>
          {audio ? <audio controls src={audio} aria-label="Ton enregistrement" /> : null}
          <p className="oral-privacy">
            {rec === "denied" ? "Micro refusé : tu peux parler sans t'enregistrer." : rec === "unsupported" ? "Enregistrement indisponible sur cet appareil : parle à voix haute, c'est l'essentiel." : "L'enregistrement reste sur cette page : il n'est ni envoyé, ni sauvegardé."}
          </p>
        </section>

        <section aria-labelledby="model-title">
          <h2 id="model-title" className="h3">Un exemple</h2>
          <div className="oral-controls" style={{ justifyContent: "flex-start" }}>
            <SpeakButton text={challenge.model} lang={code} label="Écouter l'exemple" />
            {!showModel ? (
              <button type="button" className="speak-btn is-ghost" onClick={() => setShowModel(true)}><Eye size={18} strokeWidth={2.4} /> <span>Lire l'exemple</span></button>
            ) : null}
          </div>
          {showModel ? <p className="oral-model" lang={code}>{nb(challenge.model)}</p> : <p className="muted small">L'oral d'abord : écoute avant de lire. Ne recopie pas l'exemple, dis-le avec tes mots.</p>}
        </section>

        <section aria-labelledby="check-title">
          <h2 id="check-title" className="h3">Je me relis</h2>
          <ul className="oral-check">
            {challenge.checklist.map((c, i) => (
              <li key={c}>
                <label>
                  <input type="checkbox" checked={checks[i]} onChange={(e) => setChecks((x) => x.map((v, j) => (j === i ? e.target.checked : v)))} />
                  <span>{c}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </FocusPage>
  );
}
