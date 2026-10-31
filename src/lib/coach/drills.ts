import { findUnit, levelRank, statusIn } from "@/lib/curriculum";
import type { ClassProgress, Level, SubjectId } from "@/lib/curriculum/types";
import type { AnswerSpec } from "@/lib/pedagogy/answer-checker";
import { nb } from "@/lib/cx";

/**
 * Automatismes : 5 minutes de calcul rapide sur les notions déjà vues (méthode « automatismes quotidiens »).
 * Les questions sont générées sur l'appareil, avec des nombres tirés au hasard (graine = jour), et leur réponse est
 * calculée par le même code qui écrit l'énoncé : rien n'est recopié à la main.
 * Entrelacement actif : les questions mélangent plusieurs chapitres. Sinon : un seul chapitre à la suite.
 */

export interface DrillQuestion {
  id: string;
  family: string;
  unitId: string;
  prompt: string;
  answer: AnswerSpec;
  solution: string;
}

interface Family {
  id: string;
  unitId: string;
  label: string;
  make: (r: Rng) => { prompt: string; expected: number; solution: string };
}

type Rng = { int: (a: number, b: number) => number; pick: <T>(xs: readonly T[]) => T };

export function rng(seed: string): Rng {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)), pick: (xs) => xs[Math.floor(next() * xs.length)] as (typeof xs)[number] };
}

const fr = (n: number) => nb(String(Math.round(n * 1000) / 1000).replace(".", ",").replace("-", "−"));
const par = (n: number) => (n < 0 ? `(${fr(n)})` : fr(n));
const SUP: Record<string, string> = { "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶" };
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
/** Terme signé d'une expression : « − 3x », « + 7 ». Un coefficient nul ne s'écrit pas, un coefficient 1 non plus devant x. */
const term = (n: number, x = "") => (n === 0 ? "" : ` ${n < 0 ? "−" : "+"} ${x && Math.abs(n) === 1 ? "" : Math.abs(n)}${x}`);

export const FAMILIES: Family[] = [
  { id: "tables", unitId: "6e-maths-calcul", label: "Tables de multiplication", make: (r) => { const a = r.int(6, 12), b = r.int(3, 9); return { prompt: `${a} × ${b}`, expected: a * b, solution: `${a} × ${b} = ${a * b}` }; } },
  { id: "decimaux", unitId: "6e-maths-decimaux", label: "Multiplier ou diviser par 10, 100", make: (r) => { const x = r.int(12, 98) / 10, k = r.pick([10, 100] as const), div = r.int(0, 1) === 1; const v = div ? x / k : x * k; return { prompt: `${fr(x)} ${div ? "÷" : "×"} ${k}`, expected: v, solution: `On décale la virgule de ${k === 10 ? "1 rang" : "2 rangs"} vers la ${div ? "gauche" : "droite"} : ${fr(v)}` }; } },
  { id: "fraction", unitId: "6e-maths-fractions", label: "Fraction d'une quantité", make: (r) => { const d = r.pick([3, 4, 5, 6] as const), n = r.int(1, d - 1), q = d * r.int(3, 9); return { prompt: `${n}/${d} de ${q}`, expected: (q / d) * n, solution: `${q} ÷ ${d} = ${q / d}, puis ${q / d} × ${n} = ${(q / d) * n}` }; } },
  { id: "propor", unitId: "6e-maths-propor", label: "Proportionnalité", make: (r) => { const u = r.int(2, 6), a = r.int(2, 5), b = r.int(6, 12); return { prompt: `${a} places coûtent ${a * u} €. Combien coûtent ${b} places ?`, expected: b * u, solution: `${a * u} ÷ ${a} = ${u} € la place, puis ${b} × ${u} = ${b * u} €` }; } },
  { id: "relatifs", unitId: "5e-maths-relatifs", label: "Additionner des relatifs", make: (r) => { const a = -r.int(2, 12), b = r.int(1, 15); return { prompt: `${par(a)} + ${par(b)}`, expected: a + b, solution: `Signes contraires : on soustrait les distances à zéro et on garde le signe de la plus grande. ${par(a)} + ${par(b)} = ${fr(a + b)}` }; } },
  { id: "pourcent", unitId: "5e-maths-propor", label: "Pourcentage d'une quantité", make: (r) => { const t = r.pick([10, 20, 25, 50] as const), q = r.pick([40, 60, 80, 120, 200] as const); return { prompt: `${t} % de ${q}`, expected: (q * t) / 100, solution: `${q} × ${t} ÷ 100 = ${(q * t) / 100}` }; } },
  { id: "expressions", unitId: "5e-maths-expressions", label: "Calculer une expression", make: (r) => { const a = r.int(2, 6), b = r.int(1, 9), x = r.int(2, 7); return { prompt: `Pour x = ${x}, combien vaut ${a}x + ${b} ?`, expected: a * x + b, solution: `${a} × ${x} + ${b} = ${a * x} + ${b} = ${a * x + b} (la multiplication d'abord)` }; } },
  { id: "produits", unitId: "4e-maths-relatifs", label: "Multiplier des relatifs", make: (r) => { const a = -r.int(2, 9), b = r.pick([-1, 1] as const) * r.int(2, 9); return { prompt: `${par(a)} × ${par(b)}`, expected: a * b, solution: `${a * b < 0 ? "Signes contraires : résultat négatif" : "Même signe : résultat positif"}. ${par(a)} × ${par(b)} = ${fr(a * b)}` }; } },
  { id: "puissances", unitId: "4e-maths-puissances", label: "Puissances", make: (r) => { const b = r.pick([2, 3, 10] as const), e = b === 10 ? r.int(2, 5) : r.int(2, b === 2 ? 6 : 4); return { prompt: `${b}${SUP[String(e)]}`, expected: b ** e, solution: `${Array.from({ length: e }, () => b).join(" × ")} = ${b ** e}` }; } },
  { id: "equations", unitId: "4e-maths-equations", label: "Résoudre ax + b = c", make: (r) => { const a = r.int(2, 6), x = r.int(1, 9), b = r.int(1, 12); return { prompt: `${a}x + ${b} = ${a * x + b}. Que vaut x ?`, expected: x, solution: `${a}x = ${a * x + b} − ${b} = ${a * x}, donc x = ${a * x} ÷ ${a} = ${x}` }; } },
  { id: "pythagore", unitId: "4e-maths-pythagore", label: "Pythagore", make: (r) => { const [a, b, c] = r.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]] as const); return { prompt: `Triangle rectangle : côtés de l'angle droit ${a} cm et ${b} cm. Longueur de l'hypoténuse, en cm ?`, expected: c, solution: `${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}, et √${c * c} = ${c}` }; } },
  { id: "affine", unitId: "3e-maths-affines", label: "Image par une fonction affine", make: (r) => { const a = r.int(2, 5), b = r.pick([-1, 1] as const) * r.int(1, 7), x = r.int(-3, 6); return { prompt: `f(x) = ${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}. Calcule f(${fr(x)}).`, expected: a * x + b, solution: `f(${fr(x)}) = ${a} × ${par(x)} ${b < 0 ? "−" : "+"} ${Math.abs(b)} = ${fr(a * x + b)}` }; } },
  { id: "pgcd", unitId: "3e-maths-arith", label: "Plus grand diviseur commun", make: (r) => { const g = r.int(2, 9); let m = r.int(2, 7), n = r.int(2, 7); while (n === m || gcd(m, n) !== 1) n = r.int(2, 9); return { prompt: `Plus grand diviseur commun de ${g * m} et ${g * n}`, expected: g, solution: `${g * m} = ${g} × ${m} et ${g * n} = ${g} × ${n} ; ${m} et ${n} n'ont pas d'autre diviseur commun que 1` }; } },
  { id: "evolution", unitId: "2nde-maths-automatismes", label: "Taux d'évolution", make: (r) => { const v = r.pick([40, 50, 80, 120, 200] as const), t = r.pick([10, 20, 25, 50] as const), up = r.int(0, 1) === 1; const w = up ? v * (1 + t / 100) : v * (1 - t / 100); return { prompt: `Un prix passe de ${v} € à ${fr(w)} €. Évolution en % (négative si baisse) ?`, expected: up ? t : -t, solution: `(${fr(w)} − ${v}) ÷ ${v} × 100 = ${up ? "" : "−"}${t} %` }; } },
  { id: "suites", unitId: "1re-maths-tc-suites", label: "Suite arithmétique", make: (r) => { const u0 = r.int(1, 20), q = r.int(2, 9), n = r.int(3, 8); return { prompt: `Suite arithmétique : u₀ = ${u0}, raison ${q}. Calcule u${["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈"][n]}.`, expected: u0 + n * q, solution: `uₙ = u₀ + n × r = ${u0} + ${n} × ${q} = ${u0 + n * q}` }; } },
  { id: "derivee", unitId: "1re-maths-derivation", label: "Nombre dérivé", make: (r) => { const a = r.int(1, 5), b = r.int(-4, 6), x = r.int(-2, 4); return { prompt: `f(x) = ${a === 1 ? "" : a}x²${term(b, "x")}. Calcule f′(${fr(x)}).`, expected: 2 * a * x + b, solution: `f′(x) = ${2 * a}x${term(b)}, donc f′(${fr(x)}) = ${fr(2 * a * x + b)}` }; } },
  { id: "discriminant", unitId: "1re-maths-second-degre", label: "Discriminant", make: (r) => { const x1 = r.int(-4, 4), x2 = r.int(-4, 5); const b = -(x1 + x2), c = x1 * x2; return { prompt: `Discriminant de x²${term(b, "x")}${term(c)}`, expected: b * b - 4 * c, solution: `Δ = b² − 4ac = ${par(b)}² − 4 × 1 × ${par(c)} = ${b * b - 4 * c}` }; } },
  { id: "factorielle", unitId: "Tle-maths-denombrement", label: "Dénombrement", make: (r) => { const n = r.int(3, 6); let f = 1; for (let i = 2; i <= n; i++) f *= i; return { prompt: `De combien de façons peut-on ranger ${n} livres différents sur une étagère ?`, expected: f, solution: `${n}! = ${Array.from({ length: n }, (_, i) => n - i).join(" × ")} = ${f}` }; } },
];

export interface DrillContext {
  level: Level;
  progress: Partial<Record<SubjectId, ClassProgress>>;
  /** Matières de l'élève (pour les enseignements de spécialité au lycée). */
  subjects: SubjectId[];
  /** Chapitres classés du plus fragile au plus solide (ids d'unités). */
  weakFirst: string[];
  interleave: boolean;
  seed: string;
  count?: number;
}

/** Une notion est « déjà vue » si elle appartient à une classe précédente, ou si la classe l'a vue ou la travaille. */
export function seenFamilies(level: Level, progress: DrillContext["progress"], subjects: SubjectId[]): Family[] {
  return FAMILIES.filter((f) => {
    const u = findUnit(f.unitId);
    if (!u) return false;
    const gap = levelRank(level) - levelRank(u.level);
    if (gap > 3 || gap < 0) return false;
    // Au lycée, les notions de 1re et de terminale ne valent que pour les enseignements suivis.
    const common = levelRank(u.level) <= levelRank("2nde");
    if (gap > 0) return common || subjects.includes(u.subject);
    if (!subjects.includes(u.subject)) return false;
    const st = statusIn(progress[u.subject], u.id);
    return st === "vu" || st === "en-cours";
  });
}

export function buildDrill(ctx: DrillContext): { questions: DrillQuestion[]; families: string[] } {
  const r = rng(`${ctx.seed}-${ctx.level}`);
  const count = ctx.count ?? 8;
  const pool = seenFamilies(ctx.level, ctx.progress, ctx.subjects);
  if (!pool.length) return { questions: [], families: [] };
  const rank = (f: Family) => {
    const i = ctx.weakFirst.indexOf(f.unitId);
    return i < 0 ? ctx.weakFirst.length : i;
  };
  // Les notions les plus fragiles d'abord, puis les plus récentes (niveau le plus proche).
  const sorted = [...pool].sort((a, b) => rank(a) - rank(b) || levelRank(findUnit(b.unitId)?.level ?? "6e") - levelRank(findUnit(a.unitId)?.level ?? "6e"));
  const chosen = ctx.interleave ? sorted.slice(0, Math.min(4, sorted.length)) : sorted.slice(0, 1);
  // Entrelacé : chaque chapitre revient à tour de rôle, dans un ordre mélangé à chaque tour ; bloqué : un seul chapitre.
  const order: Family[] = [];
  while (order.length < count) {
    const round = [...chosen];
    for (let i = round.length - 1; i > 0; i--) {
      const j = r.int(0, i);
      [round[i], round[j]] = [round[j] as Family, round[i] as Family];
    }
    // Pas deux fois le même chapitre à la suite d'un tour à l'autre.
    if (round.length > 1 && round[0] === order.at(-1)) round.push(round.shift() as Family);
    order.push(...round);
  }
  const questions: DrillQuestion[] = [];
  const prompts = new Set<string>();
  for (const [i, f] of order.slice(0, count).entries()) {
    let q = f.make(r);
    for (let k = 0; k < 6 && prompts.has(q.prompt); k++) q = f.make(r);
    prompts.add(q.prompt);
    questions.push({ id: `${f.id}-${i}`, family: f.id, unitId: f.unitId, prompt: q.prompt, answer: { expected: Math.round(q.expected * 1000) / 1000 }, solution: q.solution });
  }
  return { questions, families: Array.from(new Set(questions.map((q) => q.family))) };
}

export const familyLabel = (id: string) => FAMILIES.find((f) => f.id === id)?.label ?? id;
