"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string, fallback = false): boolean {
  const [match, setMatch] = useState(() => (typeof window !== "undefined" ? window.matchMedia(query).matches : fallback));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

/** Souris ou pavé tactile précis : on propose la saisie au clavier plutôt que le pavé numérique. */
export const useFinePointer = () => useMediaQuery("(hover: hover) and (pointer: fine)");
export const useDesktop = () => useMediaQuery("(min-width: 1024px)");
