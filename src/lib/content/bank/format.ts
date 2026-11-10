const NNBSP = " ";

/** Nombre à la française : virgule décimale, moins typographique, espace fine entre les milliers. */
export function fr(n: number, decimals = 6): string {
  if (!Number.isFinite(n)) throw new Error(`Nombre invalide : ${n}`);
  let fixed = Math.abs(n).toFixed(decimals);
  if (fixed.includes(".")) fixed = fixed.replace(/0+$/, "").replace(/\.$/, "");
  const [int = "0", dec] = fixed.split(".");
  const grouped = int.length > 3 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP) : int;
  const sign = n < 0 && fixed !== "0" ? "−" : "";
  return sign + grouped + (dec ? `,${dec}` : "");
}

/** Nombre entre parenthèses s'il est négatif : « 3 × (−2) ». */
export const par = (n: number) => (n < 0 ? `(${fr(n)})` : fr(n));

/** Terme ajouté à une expression : « + 3 » ou « − 3 ». */
export const signed = (n: number) => (n < 0 ? `− ${fr(-n)}` : `+ ${fr(n)}`);

/** Somme de monômes écrite proprement : poly([[3, "x²"], [-1, "x"], [4, ""]]) → « 3x² − x + 4 ». */
export function poly(terms: [number, string][]): string {
  let out = "";
  for (const [c, v] of terms) {
    if (c === 0) continue;
    const abs = Math.abs(c);
    const body = v ? (abs === 1 ? v : `${fr(abs)}${v}`) : fr(abs);
    out += out ? `${c < 0 ? " − " : " + "}${body}` : `${c < 0 ? "−" : ""}${body}`;
  }
  return out || "0";
}

/** Somme d'argent : « 12 € », « 4,50 € ». */
export const euros = (n: number) => `${Number.isInteger(Math.round(n * 100) / 100) ? fr(n) : fr(n, 2).replace(/,(\d)$/, (_, d: string) => `,${d}0`)} €`;

/** Pourcentage : « 12,5 % ». */
export const pct = (n: number) => `${fr(n)} %`;

/** Fraction écrite en ligne : « 3/4 », « −3/4 ». */
export const frac = (num: number, den: number) => `${num < 0 ? "−" : ""}${Math.abs(num)}/${den}`;

/** Plus grand diviseur commun. */
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Arrondi à n décimales, sans les erreurs de virgule flottante (0,1 + 0,2). */
export const round = (x: number, n = 2) => Math.round((x + Number.EPSILON) * 10 ** n) / 10 ** n;

/** Égalité numérique tolérante (calculs refaits par une autre voie). */
export const close = (a: number, b: number, rel = 1e-9) => Math.abs(a - b) <= Math.max(1e-9, rel * Math.max(Math.abs(a), Math.abs(b)));

const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻", "−": "⁻", n: "ⁿ" };
/** Exposant écrit en exposant : sup(−3) → « ⁻³ », pour « 10⁻³ ». */
export const sup = (n: number | string) => String(n).split("").map((c) => SUP[c] ?? c).join("");

/** Puissance écrite proprement : pow(10, −3) → « 10⁻³ », pow("x", 2) → « x² ». */
export const pow = (base: number | string, e: number) => `${typeof base === "number" ? (base < 0 ? `(${fr(base)})` : fr(base)) : base}${sup(e)}`;

const SUB = "₀₁₂₃₄₅₆₇₈₉";
/** Indice écrit en indice : sub(12) → « ₁₂ », pour « u₁₂ ». */
export const sub = (n: number) => String(n).split("").map((c) => SUB[Number(c)] ?? c).join("");

/** Première lettre en majuscule. */
export const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
