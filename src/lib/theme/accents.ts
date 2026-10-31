import type { FamilyId, Passion } from "@/lib/content/passions";

/**
 * Couleurs d'accent : toutes vives (on garde le côté flashy de LearnWard) et toutes assez claires pour porter
 * le texte sombre de la marque (#1a1433) avec un contraste AA, en clair comme en sombre (vérifié par les tests).
 */
export type AccentId = "jaune" | "citron" | "menthe" | "cyan" | "lilas" | "rose" | "corail" | "orange";

export interface Accent {
  id: AccentId;
  label: string;
  /** Couleur pleine (fonds, boutons, surbrillance). */
  base: string;
  /** Version plus soutenue (bordures, ombres portées). */
  deep: string;
}

export const ON_ACCENT = "#1a1433";

export const ACCENTS: Accent[] = [
  { id: "jaune", label: "Jaune", base: "#ffd60a", deep: "#d9b300" },
  { id: "citron", label: "Citron vert", base: "#c6f432", deep: "#97c20f" },
  { id: "menthe", label: "Menthe", base: "#3df2b0", deep: "#12c085" },
  { id: "cyan", label: "Cyan", base: "#4cd7ff", deep: "#14a6d4" },
  { id: "lilas", label: "Lilas", base: "#c4a1ff", deep: "#9a6cf0" },
  { id: "rose", label: "Rose", base: "#ff8ad8", deep: "#e055b5" },
  { id: "corail", label: "Corail", base: "#ff8f70", deep: "#e5603d" },
  { id: "orange", label: "Orange", base: "#ffa62b", deep: "#e07f00" },
];

export const getAccent = (id: AccentId) => ACCENTS.find((a) => a.id === id) ?? (ACCENTS[0] as Accent);

/** Quand l'élève le demande, l'accent suit l'univers dominant de ses passions. */
export const FAMILY_ACCENT: Record<FamilyId, AccentId> = {
  sport: "menthe",
  jeux: "lilas",
  musique: "corail",
  creation: "rose",
  sciences: "cyan",
  monde: "citron",
};

export function accentFromPassions(passions: Passion[], fallback: AccentId): AccentId {
  if (!passions.length) return fallback;
  const count = new Map<FamilyId, number>();
  for (const p of passions) count.set(p.family, (count.get(p.family) ?? 0) + 1);
  let best: FamilyId | null = null;
  let n = 0;
  // Ordre stable : la première passion départage les égalités.
  for (const p of passions) {
    const c = count.get(p.family) ?? 0;
    if (c > n) {
      best = p.family;
      n = c;
    }
  }
  return best ? FAMILY_ACCENT[best] : fallback;
}

/** Rapport de contraste WCAG entre deux couleurs hexadécimales. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const n = hex.replace("#", "");
    const [r, g, bl] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}
