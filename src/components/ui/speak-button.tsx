"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { canSpeak, speak } from "@/lib/coach/oral";
import { cx } from "@/lib/cx";

/** Lit un texte avec la voix de synthèse de l'appareil. Rien n'est affiché si l'appareil n'en a pas. */
export function SpeakButton({ text, lang, label = "Écouter", onSpoken, className, compact }: { text: string; lang: string; label?: string; onSpoken?: () => void; className?: string; compact?: boolean }) {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(canSpeak()), []);
  if (!ok) return null;
  return (
    <button
      type="button"
      className={cx("speak-btn", compact && "is-compact", className)}
      onClick={() => {
        speak(text, lang);
        onSpoken?.();
      }}
      aria-label={compact ? label : undefined}
    >
      <Volume2 size={compact ? 16 : 18} strokeWidth={2.4} />
      {compact ? null : <span>{label}</span>}
    </button>
  );
}
