"use client";

import { useEffect, useRef } from "react";

/**
 * Raccourcis clavier (ordinateur). Ignorés pendant une saisie dans un champ
 * ou quand une feuille modale est ouverte.
 */
export function useKeys(handler: (e: KeyboardEvent) => boolean | void, enabled = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled) return;
    const onDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Entrée gardée enfoncée : une seule validation, pas une suite d'exercices sautés.
      if (e.key === "Enter" && e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.isContentEditable)) return;
      // Entrée ou espace sur un bouton ciblé au clavier : on laisse le bouton agir.
      if (t && (t.tagName === "BUTTON" || t.tagName === "A") && (e.key === "Enter" || e.key === " ")) return;
      if (document.querySelector(".sheet-overlay")) return;
      if (ref.current(e) === true) e.preventDefault();
    };
    window.addEventListener("keydown", onDown);
    return () => window.removeEventListener("keydown", onDown);
  }, [enabled]);
}

/** À placer sur onMouseDown : le clic souris ne déplace pas le focus, Entrée reste disponible pour valider. */
export const keepFocus = (e: { preventDefault: () => void }) => e.preventDefault();
