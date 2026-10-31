import { EVERYDAY, PASSIONS } from "../src/lib/content/passions";
import type { Activity } from "../src/lib/content/types";

/** Quelques passions variées pour rendre les énoncés personnalisés. */
export const SAMPLE_PASSIONS = [...PASSIONS.filter((_, i) => i % 7 === 0), EVERYDAY];

/** Tous les textes d'une activité, énoncés personnalisés rendus avec plusieurs passions. */
export function allText(a: Activity | unknown): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (typeof v === "function") for (const p of SAMPLE_PASSIONS) out.push(String((v as (x: unknown) => unknown)(p)));
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(a);
  return out;
}
