export type ParseResult =
  | { ok: true; value: number }
  | { ok: false; reason: "empty" | "invalid" };

const SPACES = /[\s   ]/g;
const MINUS = /[−‒–]/g;
const DECIMAL = String.raw`(?:\d+(?:\.\d+)?|\.\d+)`;
const PLAIN = new RegExp(`^[+-]?${DECIMAL}(?:e[+-]?\\d+)?$`, "i");
const FRACTION = new RegExp(`^([+-]?${DECIMAL})/(${DECIMAL})$`);
const POW10 = new RegExp(`^([+-]?${DECIMAL})[x×*]10\\^([+-]?\\d+)$`, "i");

/**
 * Lit un nombre saisi par un élève : virgule décimale, signe moins typographique,
 * espaces de milliers, fractions (3/4), notation scientifique (1,5e-3 ou 1,5×10^-3).
 * Refuse les formes ambiguës (ex. « 1.000,5 »).
 */
export function parseNumber(raw: string): ParseResult {
  const s = raw.replace(SPACES, "").replace(MINUS, "-").replace(/,/g, ".");
  if (s === "") return { ok: false, reason: "empty" };
  if (s.split(".").length > 2 && !/e/i.test(s)) return { ok: false, reason: "invalid" };

  let value: number | undefined;
  let m: RegExpExecArray | null;
  if (PLAIN.test(s)) value = Number(s);
  else if ((m = FRACTION.exec(s))) {
    const den = Number(m[2]);
    if (den === 0) return { ok: false, reason: "invalid" };
    value = Number(m[1]) / den;
  } else if ((m = POW10.exec(s))) value = Number(m[1]) * 10 ** Number(m[2]);

  return value !== undefined && Number.isFinite(value)
    ? { ok: true, value }
    : { ok: false, reason: "invalid" };
}
