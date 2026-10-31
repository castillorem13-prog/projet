"use client";

import { Delete } from "lucide-react";
import { useEffect } from "react";

const MAX = 10;

export function applyKey(value: string, key: string): string {
  if (key === "back") return value.slice(0, -1);
  if (key === "sign") return value.startsWith("−") ? value.slice(1) : `−${value}`;
  if (value.replace("−", "").length >= MAX) return value;
  if (key === ",") {
    if (value.includes(",")) return value;
    return /\d$/.test(value) ? `${value},` : `${value}0,`;
  }
  return `${value}${key}`;
}

/** Pavé numérique intégré : le clavier iOS « décimal » n'a pas de signe moins. */
export function Keypad({ onKey, onSubmit, canSubmit, submitLabel = "Vérifier" }: { onKey: (k: string) => void; onSubmit: () => void; canSubmit: boolean; submitLabel?: string }) {
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      // Une feuille ouverte, ou Entrée sur un bouton ciblé au clavier : le pavé ne doit pas agir en plus.
      if (document.querySelector(".sheet-overlay")) return;
      if (e.key === "Enter" && (e.repeat || target?.tagName === "BUTTON")) return;
      if (/^\d$/.test(e.key)) onKey(e.key);
      else if (e.key === "," || e.key === ".") onKey(",");
      else if (e.key === "-") onKey("sign");
      else if (e.key === "Backspace") onKey("back");
      else if (e.key === "Enter" && canSubmit) onSubmit();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onDown);
    return () => window.removeEventListener("keydown", onDown);
  }, [onKey, onSubmit, canSubmit]);

  const keys = ["1", "2", "3", "back", "4", "5", "6", "sign", "7", "8", "9", ","];
  return (
    <div className="keypad" role="group" aria-label="Pavé numérique">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          className={k === "back" || k === "sign" || k === "," ? "key key-alt" : "key"}
          onClick={() => onKey(k)}
          aria-label={k === "back" ? "Effacer" : k === "sign" ? "Changer le signe" : k === "," ? "Virgule" : k}
        >
          {k === "back" ? <Delete size={24} /> : k === "sign" ? "±" : k}
        </button>
      ))}
      <button type="button" className="key key-zero" onClick={() => onKey("0")}>0</button>
      <button type="button" className="key key-submit" onClick={onSubmit} disabled={!canSubmit}>{submitLabel}</button>
    </div>
  );
}
