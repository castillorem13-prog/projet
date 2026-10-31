"use client";

import { useEffect } from "react";
import { useNavTracker } from "@/lib/nav";
import { useMyPassions, useStore } from "@/lib/store";
import { accentFromPassions } from "@/lib/theme/accents";

/** Applique le thème, la couleur d'accent et la lecture facilitée sur <html>, et suit la navigation interne. */
export function ThemeSync() {
  const { state } = useStore();
  const { theme, readable, accent: chosen, accentFromUniverses } = state.settings;
  const passions = useMyPassions();
  const liked = state.profile.passions.length ? passions : [];
  const accent = accentFromUniverses ? accentFromPassions(liked, chosen) : chosen;
  useNavTracker();
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;
    root.dataset.readable = readable ? "true" : "false";
    if (accent === "jaune") delete root.dataset.accent;
    else root.dataset.accent = accent;
    try {
      window.localStorage.setItem("learnward:theme", JSON.stringify({ theme, readable, accent }));
    } catch {
      /* ignore */
    }
  }, [theme, readable, accent]);
  return null;
}

/** Script exécuté avant l'affichage pour éviter un flash (thème sombre, couleur d'accent). */
export const THEME_BOOT = `try{var t=JSON.parse(localStorage.getItem("learnward:theme")||"{}");if(t.theme&&t.theme!=="system")document.documentElement.dataset.theme=t.theme;if(t.readable)document.documentElement.dataset.readable="true";if(t.accent&&t.accent!=="jaune")document.documentElement.dataset.accent=t.accent}catch(e){}`;
