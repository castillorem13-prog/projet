"use client";

import { useCallback } from "react";
import { useStore } from "@/lib/store";

/** Petits sons synthétisés (pas de fichiers audio) et vibrations courtes. */

export type FxKind = "correct" | "wrong" | "complete" | "tap";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = ctx ?? new AC();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function notes(freqs: number[], step: number, dur: number, type: OscillatorType, gain: number) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + 0.01;
  freqs.forEach((f, i) => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t0 + i * step);
    g.gain.setValueAtTime(0, t0 + i * step);
    g.gain.linearRampToValueAtTime(gain, t0 + i * step + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * step + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0 + i * step);
    osc.stop(t0 + i * step + dur + 0.02);
  });
}

const SOUNDS: Record<FxKind, () => void> = {
  correct: () => notes([784, 1175], 0.08, 0.18, "sine", 0.07),
  wrong: () => notes([311, 233], 0.1, 0.2, "triangle", 0.06),
  complete: () => notes([523, 659, 784, 1047], 0.09, 0.28, "sine", 0.06),
  tap: () => notes([1400], 0, 0.04, "sine", 0.025),
};

const VIBRATIONS: Record<FxKind, number | number[]> = {
  correct: 18,
  wrong: [30, 50, 30],
  complete: [20, 40, 20, 40, 60],
  tap: 6,
};

export function useFx() {
  const { state } = useStore();
  const { sound, haptics } = state.settings;
  return useCallback(
    (kind: FxKind) => {
      if (sound) SOUNDS[kind]();
      if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(VIBRATIONS[kind]);
        } catch {
          /* non pris en charge (iPhone) */
        }
      }
    },
    [sound, haptics],
  );
}
