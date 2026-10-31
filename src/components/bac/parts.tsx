"use client";

import { Mic, Pause, Play, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cx, frNumber } from "@/lib/cx";

/* ——— Chronomètre d'épreuve ——— */

/** Secondes écoulées, avec pause. Le chrono repart de zéro quand `resetKey` change (nouvelle phase). */
export function useStopwatch(resetKey: string, autostart = true) {
  const [running, setRunning] = useState(autostart);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    setSeconds(0);
    setRunning(autostart);
  }, [resetKey, autostart]);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  return { seconds, running, setRunning };
}

export const mmss = (s: number) => {
  const a = Math.abs(Math.round(s));
  const h = Math.floor(a / 3600);
  const m = Math.floor((a % 3600) / 60);
  const sec = a % 60;
  return `${s < 0 ? "+" : ""}${h ? `${h}:${String(m).padStart(2, "0")}` : m}:${String(sec).padStart(2, "0")}`;
};

/** Grand chrono d'une phase : temps restant, barre qui se remplit, dépassement signalé sans bloquer. */
export function PhaseClock({ seconds, minutes, running, onToggle, label }: { seconds: number; minutes: number; running: boolean; onToggle: () => void; label: string }) {
  const total = minutes * 60;
  const left = total - seconds;
  const pct = Math.min(100, (seconds / total) * 100);
  return (
    <div className={cx("phase-clock", left <= 60 && left > 0 && "is-low", left <= 0 && "is-over")}>
      <div className="phase-clock-row">
        <span className="phase-clock-label">{label}</span>
        <span className="phase-clock-time num" aria-live="off">{mmss(left)}</span>
        <button type="button" className="icon-btn phase-clock-btn" onClick={onToggle} aria-label={running ? "Mettre le chrono en pause" : "Relancer le chrono"}>
          {running ? <Pause size={20} strokeWidth={2.6} /> : <Play size={20} strokeWidth={2.6} />}
        </button>
      </div>
      <span className="phase-clock-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
    </div>
  );
}

/* ——— Enregistrement (facultatif, reste sur l'appareil) ——— */

/**
 * Le micro ne reste jamais ouvert : il s'éteint à l'arrêt de l'enregistrement et quand on quitte l'écran,
 * même si l'élève n'a pas encore répondu à la demande d'accès.
 */
export function useRecorder() {
  const [state, setState] = useState<"idle" | "recording" | "denied" | "unsupported">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const mounted = useRef(true);
  /** L'enregistrement en cours est abandonné : aucun fichier à garder. */
  const discard = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) setState("unsupported");
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      discard.current = true;
      if (rec.current?.state === "recording") rec.current.stop();
      rec.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        stream.getTracks().forEach((t) => t.stop());
        return false;
      }
      const r = new MediaRecorder(stream);
      chunks.current = [];
      discard.current = false;
      r.ondataavailable = (e) => chunks.current.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (!discard.current) setUrl(URL.createObjectURL(new Blob(chunks.current, { type: r.mimeType || "audio/webm" })));
      };
      rec.current = r;
      r.start();
      setState("recording");
      return true;
    } catch {
      setState("denied");
      return false;
    }
  }, []);
  const stop = useCallback(() => {
    if (rec.current?.state === "recording") rec.current.stop();
    setState((s) => (s === "recording" ? "idle" : s));
  }, []);
  /** Repart de zéro : l'enregistrement en cours et le précédent sont oubliés. */
  const clear = useCallback(() => {
    discard.current = true;
    stop();
    setUrl(null);
  }, [stop]);
  return { state, url, start, stop, clear };
}

export function RecordButton({ recorder }: { recorder: ReturnType<typeof useRecorder> }) {
  if (recorder.state === "unsupported") return null;
  if (recorder.state === "denied") return <p className="muted small">Micro refusé : tu peux t'entraîner sans enregistrement.</p>;
  return recorder.state === "recording" ? (
    <Button variant="ink" size="md" icon={<Square size={16} />} onClick={recorder.stop}>Arrêter l'enregistrement</Button>
  ) : (
    <Button variant="ghost" size="md" icon={<Mic size={18} />} onClick={() => void recorder.start()}>{recorder.url ? "Réenregistrer" : "M'enregistrer"}</Button>
  );
}

/* ——— Grille d'auto-évaluation ——— */

export interface GridItem {
  label: string;
  points: number;
  checks?: string[];
}

const LEVELS = [
  { v: 0, label: "Pas encore" },
  { v: 0.5, label: "En partie" },
  { v: 1, label: "Oui" },
];

/** Note indicative d'un critère : niveau choisi × barème, au demi-point. */
export const gridScore = (items: GridItem[], levels: number[]) => items.reduce((s, it, i) => s + Math.round((levels[i] ?? 0) * it.points * 2) / 2, 0);

/** Grille : pour chaque critère, l'élève se situe en un geste (pas encore, en partie, oui). */
export function SelfGrid({ items, levels, onChange }: { items: GridItem[]; levels: (number | null)[]; onChange: (levels: (number | null)[]) => void }) {
  return (
    <ol className="self-grid">
      {items.map((it, i) => (
        <li key={it.label} className="self-row">
          <div className="self-head">
            <strong>{it.label}</strong>
            <span className="pts-chip pts-sm">{frNumber(it.points)} pt{it.points > 1 ? "s" : ""}</span>
          </div>
          {it.checks ? (
            <ul className="self-checks">
              {it.checks.map((c) => <li key={c}>{c}</li>)}
            </ul>
          ) : null}
          <div className="self-levels" role="radiogroup" aria-label={it.label}>
            {LEVELS.map((l) => (
              <button key={l.v} type="button" role="radio" aria-checked={levels[i] === l.v} className={cx("self-level", levels[i] === l.v && "is-on")} onClick={() => onChange(levels.map((x, k) => (k === i ? l.v : x)))}>
                {l.label}
              </button>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Résultat d'une grille : sur 20, indicatif, avec le détail par critère. */
export function GridResult({ items, levels, note }: { items: GridItem[]; levels: number[]; note: string }) {
  const score = gridScore(items, levels);
  return (
    <div className="grid-result">
      <p className="grid-score"><strong className="num">{frNumber(score)}</strong><span>/20</span></p>
      <p className="muted small">{note}</p>
    </div>
  );
}
