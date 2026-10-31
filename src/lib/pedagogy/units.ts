export interface ParsedUnit {
  /** Grandeur de base normalisée (ex. "V", "m/s"). */
  base: string;
  /** Facteur vers l'unité de base (mA → 1e-3, km/h → 1/3,6). */
  factor: number;
}

const BASES: Record<string, ParsedUnit> = {
  v: { base: "V", factor: 1 }, volt: { base: "V", factor: 1 }, volts: { base: "V", factor: 1 },
  a: { base: "A", factor: 1 }, ampere: { base: "A", factor: 1 }, "ampère": { base: "A", factor: 1 },
  "ω": { base: "Ω", factor: 1 }, ohm: { base: "Ω", factor: 1 }, ohms: { base: "Ω", factor: 1 },
  m: { base: "m", factor: 1 }, s: { base: "s", factor: 1 }, min: { base: "s", factor: 60 }, h: { base: "s", factor: 3600 },
  "m/s": { base: "m/s", factor: 1 }, "km/h": { base: "m/s", factor: 1 / 3.6 },
};

const PREFIXES: Record<string, number> = {
  "µ": 1e-6, "μ": 1e-6, u: 1e-6, m: 1e-3, k: 1e3, M: 1e6,
};

/** Reconnaît V, A, Ω, m, s, m/s, km/h et les préfixes usuels (mA, kΩ, km…). */
export function parseUnit(raw: string): ParsedUnit {
  const t = raw.trim();
  const direct = BASES[t.toLowerCase()];
  if (direct) return direct;
  const prefix = PREFIXES[t.charAt(0)];
  const rest = BASES[t.slice(1).toLowerCase()];
  if (prefix !== undefined && rest) return { base: rest.base, factor: prefix * rest.factor };
  return { base: t.toLowerCase(), factor: 1 };
}
