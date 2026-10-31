"use client";

import { CornerDownRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { cx } from "@/lib/cx";
import { keepFocus } from "@/lib/use-keys";

const ALLOWED = /[^0-9,.\-−/ ]/g;

/**
 * Champ de réponse numérique.
 * Ordinateur : vrai champ texte (on tape au clavier, Entrée valide).
 * Écran tactile : affichage piloté par le pavé numérique intégré.
 */
export function NumericField({
  value,
  unit,
  fine,
  focused = true,
  status,
  placeholder = "Ta réponse",
  label,
  onChange,
  onFocus,
  onSubmit,
}: {
  value: string;
  unit: string | null;
  fine: boolean;
  focused?: boolean;
  status?: "correct" | "wrong";
  placeholder?: string;
  label: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onSubmit: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (fine && focused && !status) ref.current?.focus({ preventScroll: true });
  }, [fine, focused, status]);

  const cls = cx("answer-display", status === "correct" && "is-correct", status === "wrong" && "is-wrong", focused && !status && "is-focus");
  if (fine) {
    return (
      <label className={cx(cls, "answer-field")}>
        <CornerDownRight size={22} className="answer-arrow" aria-hidden="true" />
        <input
          ref={ref}
          className="answer-input"
          value={value}
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          aria-label={label}
          disabled={Boolean(status)}
          onFocus={onFocus}
          onChange={(e) => onChange(e.target.value.replace(ALLOWED, "").slice(0, 14))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (!e.repeat) onSubmit();
            }
          }}
        />
        {unit ? <span className="answer-unit">{unit}</span> : null}
      </label>
    );
  }
  return (
    <button type="button" className={cx(cls, "answer-btn")} onClick={onFocus} onMouseDown={keepFocus} aria-label={label} disabled={Boolean(status)}>
      <CornerDownRight size={22} className="answer-arrow" aria-hidden="true" />
      {value ? <span className="answer-value">{value}</span> : <span className="answer-placeholder">{placeholder}</span>}
      {focused && !status ? <span className="caret" aria-hidden="true" /> : null}
      {unit ? <span className="answer-unit">{unit}</span> : null}
    </button>
  );
}

export function UnitPicker({ units, value, onChange }: { units: string[]; value: string | null; onChange: (u: string) => void }) {
  return (
    <div className="unit-row" role="radiogroup" aria-label="Unité">
      <span>Unité</span>
      {units.map((u) => (
        <button key={u} type="button" role="radio" aria-checked={value === u} className={cx("unit-chip", value === u && "is-on")} onMouseDown={keepFocus} onClick={() => onChange(u)}>
          {u}
        </button>
      ))}
    </div>
  );
}
