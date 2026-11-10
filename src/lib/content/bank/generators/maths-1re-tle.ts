import { ask, gen, mcq, mcqNumber, mockTable, problem } from "../build";
import { evaluate, sameExpression } from "../evaluate";
import { close, fr, gcd, par, poly, pow, round, sub, sup } from "../format";
import type { Generator } from "../types";

/** Mathématiques de première et de terminale : spécialité, tronc commun, complémentaires, expertes. */

const U = (slug: string) => slug;
const pt = (a: number, b: number) => `(${fr(a)} ; ${fr(b)})`;
const deriv = (f: (x: number) => number, x: number) => (f(x + 1e-5) - f(x - 1e-5)) / 2e-5;
const binom = (n: number, k: number): number => {
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - i + 1)) / i;
  return Math.round(c);
};
const simpson = (f: (x: number) => number, a: number, b: number, n = 200) => {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
};

export const MATHS_1RE_TLE: Generator[] = [
  /* ——— 1re : suites ——— */
  gen({
    id: "m1-sui-arith", unit: U("1re-maths-suites"), title: "Terme d'une suite arithmétique", stage: "application",
    make: (r, id) => {
      const u0 = r.int(-20, 50), rr = r.nonZero(12), n = r.int(5, 40);
      const un = u0 + n * rr;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `(uₙ) est arithmétique de premier terme u₀ = ${fr(u0)} et de raison ${fr(rr)}.`,
          prompt: `Calcule u${sub(n)}.`,
          expected: un,
          errors: [{ value: u0 + (n - 1) * rr, code: "decalage", message: "Depuis u₀, on ajoute la raison n fois (et non n − 1).", type: "procedurale" }],
          hint: "uₙ = u₀ + n × r.",
          solution: [`uₙ = ${fr(u0)} + n × ${par(rr)}.`, `Pour n = ${n} : ${fr(u0)} + ${n} × ${par(rr)} = ${fr(un)}.`],
          recap: `= ${fr(un)}`,
          review: "Suite arithmétique",
          takeaway: "Suite arithmétique : uₙ = u₀ + n r ; on passe d'un terme au suivant en ajoutant r.",
        }),
        verify: () => {
          let u = u0;
          for (let i = 0; i < n; i++) u += rr;
          return u === un;
        },
      };
    },
  }),
  gen({
    id: "m1-sui-geom", unit: U("1re-maths-suites"), title: "Suite géométrique : un placement", stage: "transfert",
    make: (r, id) => {
      const c = r.int(2, 30) * 100, t = r.pick([1, 1.5, 2, 2.5, 3, 4, 5]), n = r.int(2, 15);
      const q = 1 + t / 100;
      const val = round(c * q ** n, 2);
      return {
        activity: ask({
          id, stage: "transfert", competence: "modeliser",
          context: `On place ${fr(c)} € à ${fr(t)} % par an, à intérêts composés.`,
          prompt: `Quel est le capital au bout de ${n} ans (en €, au centime) ?`,
          expected: val,
          tolerance: { abs: 0.011 },
          errors: [{ value: round(c * (1 + (n * t) / 100), 2), code: "simple", message: "Les intérêts composés s'ajoutent au capital chaque année : on multiplie par le coefficient chaque année.", type: "conceptuelle" }],
          hint: `Chaque année, le capital est multiplié par 1 + ${fr(t)}/100 = ${fr(q)}.`,
          solution: [`Cₙ = ${fr(c)} × ${fr(q)}ⁿ (suite géométrique de raison ${fr(q)}).`, `C${sub(n)} = ${fr(c)} × ${fr(q)}${sup(n)} ≈ ${fr(val)} €.`],
          recap: `≈ ${fr(val)} €`,
          review: "Suite géométrique",
          takeaway: "Une hausse de t % par an fait une suite géométrique de raison 1 + t/100 : Cₙ = C₀ × qⁿ.",
        }),
        verify: () => {
          let v = c;
          for (let i = 0; i < n; i++) v *= q;
          return close(round(v, 2), val, 1e-12) || Math.abs(v - val) < 0.006;
        },
      };
    },
  }),
  gen({
    id: "m1-sui-somme", unit: U("1re-maths-suites"), title: "Somme de termes consécutifs", stage: "application",
    make: (r, id) => {
      const n = r.int(10, 100);
      const kind = r.int(0, 1);
      const q = 2, k = r.int(5, 12);
      const value = kind === 0 ? (n * (n + 1)) / 2 : q ** (k + 1) - 1;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: kind === 0 ? "Somme des premiers entiers." : "Somme de puissances de 2.",
          prompt: kind === 0 ? `Calcule 1 + 2 + 3 + … + ${n}.` : `Calcule 1 + 2 + 2² + … + ${pow(2, k)}.`,
          expected: value,
          errors: kind === 0 ? [{ value: n * n / 2, code: "formule", message: "1 + 2 + … + n = n(n + 1)/2." }] : [{ value: q ** k - 1, code: "rang", message: "Il y a k + 1 termes de 2⁰ à 2ᵏ : la somme vaut 2ᵏ⁺¹ − 1." }],
          hint: kind === 0 ? "1 + 2 + … + n = n(n + 1) ÷ 2." : "1 + q + … + qᵏ = (qᵏ⁺¹ − 1) ÷ (q − 1).",
          solution: [kind === 0 ? `${n} × ${n + 1} ÷ 2 = ${fr(value)}.` : `(${pow(2, k + 1)} − 1) ÷ (2 − 1) = ${fr(value)}.`],
          recap: fr(value),
          review: "Somme de termes",
          takeaway: "1 + 2 + … + n = n(n + 1)/2 ; 1 + q + … + qⁿ = (qⁿ⁺¹ − 1)/(q − 1) pour q ≠ 1.",
        }),
        verify: () => {
          let s = 0;
          if (kind === 0) for (let i = 1; i <= n; i++) s += i;
          else for (let i = 0; i <= k; i++) s += 2 ** i;
          return s === value;
        },
      };
    },
  }),

  /* ——— 1re : second degré ——— */
  gen({
    id: "m1-deg2-racines", unit: U("1re-maths-second-degre"), title: "Résoudre une équation du second degré", stage: "application",
    make: (r, id) => {
      const a = r.pick([1, 1, 2, -1, 3]), x1 = r.int(-7, 6);
      let x2 = r.int(-7, 7);
      if (x2 === x1) x2 = x1 + r.int(1, 4);
      const b = -a * (x1 + x2), c = a * x1 * x2;
      const p = poly([[a, "x²"], [b, "x"], [c, ""]]);
      const delta = b * b - 4 * a * c;
      const show = (u: number, v: number) => `x = ${fr(Math.min(u, v))} ou x = ${fr(Math.max(u, v))}`;
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "calculer",
          prompt: `Résous dans ℝ : ${p} = 0`,
          answer: { text: show(x1, x2), feedback: `Δ = ${fr(delta)} > 0 : deux racines, (−b ± √Δ) ÷ 2a.` },
          wrong: [
            { text: show(-x1, -x2), feedback: "Vérifie le signe : les racines sont (−b ± √Δ)/(2a)." },
            { text: show(x1 * a, x2 * a), feedback: "N'oublie pas de diviser par 2a." },
            { text: "Pas de solution réelle", feedback: `Δ = ${fr(delta)} est positif : il y a deux solutions.` },
            { text: `x = ${fr(x1 + x2)}`, feedback: "Δ > 0 donne deux solutions distinctes." },
          ],
          hint: "Calcule Δ = b² − 4ac.",
          solution: [`Δ = ${par(b)}² − 4 × ${par(a)} × ${par(c)} = ${fr(delta)} = ${fr(Math.sqrt(delta))}².`, `x = (${fr(-b)} ± ${fr(Math.sqrt(delta))}) ÷ ${fr(2 * a)}, soit ${show(x1, x2)}.`],
          takeaway: "ax² + bx + c = 0 : si Δ > 0, x = (−b ± √Δ)/(2a) ; si Δ = 0, x = −b/(2a) ; si Δ < 0, pas de solution réelle.",
        }),
        verify: () => evaluate(p, { x: x1 }) === 0 && evaluate(p, { x: x2 }) === 0 && delta > 0,
      };
    },
  }),
  gen({
    id: "m1-deg2-delta", unit: U("1re-maths-second-degre"), title: "Nombre de solutions selon le discriminant", stage: "rappel",
    make: (r, id) => {
      const a = r.nonZero(4), b = r.int(-8, 8), c = r.int(-9, 9);
      const delta = b * b - 4 * a * c;
      const n = delta > 0 ? 2 : delta === 0 ? 1 : 0;
      const p = poly([[a, "x²"], [b, "x"], [c, ""]]);
      const label = ["Aucune solution réelle", "Une seule solution", "Deux solutions"];
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "raisonner",
          prompt: `Combien de solutions réelles l'équation ${p} = 0 admet-elle ?`,
          answer: { text: label[n]!, feedback: `Δ = ${fr(delta)} ${delta > 0 ? "> 0" : delta === 0 ? "= 0" : "< 0"}.` },
          wrong: label.filter((_, i) => i !== n).map((t) => ({ text: t, feedback: `Calcule Δ = b² − 4ac = ${fr(delta)}.` })).concat([{ text: "Trois solutions", feedback: "Une équation du second degré a au plus deux solutions." }]),
          hint: "Le signe de Δ = b² − 4ac donne le nombre de solutions.",
          solution: [`Δ = ${par(b)}² − 4 × ${par(a)} × ${par(c)} = ${fr(delta)}.`, `${label[n]}.`],
          takeaway: "Δ > 0 : deux solutions ; Δ = 0 : une solution double ; Δ < 0 : aucune solution réelle.",
        }),
        verify: () => {
          const vertex = evaluate(p, { x: -b / (2 * a) });
          if (n === 0) return a * vertex > 0;
          if (n === 1) return Math.abs(vertex) < 1e-9;
          const r1 = (-b - Math.sqrt(delta)) / (2 * a), r2 = (-b + Math.sqrt(delta)) / (2 * a);
          return Math.abs(evaluate(p, { x: r1 })) < 1e-6 && Math.abs(evaluate(p, { x: r2 })) < 1e-6 && r1 !== r2;
        },
      };
    },
  }),
  gen({
    id: "m1-deg2-canonique", unit: U("1re-maths-second-degre"), title: "Forme canonique et sommet", stage: "transfert",
    make: (r, id) => {
      const a = r.nonZero(3), al = r.int(-5, 5), be = r.int(-9, 9);
      const b = -2 * a * al, c = a * al * al + be;
      const p = poly([[a, "x²"], [b, "x"], [c, ""]]);
      return {
        activity: mcq(r, {
          id, stage: "transfert", competence: "raisonner",
          prompt: `Quelles sont les coordonnées du sommet de la parabole d'équation y = ${p} ?`,
          answer: { text: pt(al, be), feedback: `α = −b/(2a) = ${fr(al)} et β = f(α) = ${fr(be)}.` },
          wrong: [
            { text: pt(-al, be), feedback: "α = −b/(2a) : attention au signe." },
            { text: pt(al, c), feedback: "β est f(α), pas le terme constant c." },
            { text: pt(-b, be), feedback: "Il faut diviser −b par 2a." },
            { text: pt(be, al), feedback: "Les coordonnées ont été inversées." },
            { text: pt(al, be + 1), feedback: "β = f(α) : recalcule cette image." },
            { text: pt(al + 1, be), feedback: "α = −b/(2a) : recalcule." },
          ],
          hint: "α = −b ÷ (2a), puis β = f(α).",
          solution: [`α = ${fr(-b)} ÷ ${fr(2 * a)} = ${fr(al)}.`, `β = f(${fr(al)}) = ${fr(be)}.`, `Forme canonique : ${fr(a)}(x ${al < 0 ? "+" : "−"} ${Math.abs(al)})² ${be < 0 ? "−" : "+"} ${Math.abs(be)}.`],
          takeaway: "f(x) = a(x − α)² + β avec α = −b/(2a) et β = f(α) ; le sommet est S(α ; β).",
        }),
        verify: () => evaluate(p, { x: al }) === be && close(deriv((x) => evaluate(p, { x }), al), 0),
      };
    },
  }),

  /* ——— 1re : dérivation ——— */
  gen({
    id: "m1-der-nombre", unit: U("1re-maths-derivation"), title: "Calculer un nombre dérivé", stage: "application",
    make: (r, id) => {
      const a = r.nonZero(4), b = r.int(-6, 6), c = r.int(-9, 9), d = r.int(-5, 5), x0 = r.int(-3, 3);
      const f = poly([[a, "x³"], [b, "x²"], [c, "x"], [d, ""]]);
      const fp = 3 * a * x0 * x0 + 2 * b * x0 + c;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `f(x) = ${f}.`,
          prompt: `Calcule f′(${fr(x0)}).`,
          expected: fp,
          errors: [{ value: a * x0 ** 3 + b * x0 * x0 + c * x0 + d, code: "image", message: "Ça, c'est f(" + fr(x0) + "). On demande la dérivée en ce point." }, { value: a * x0 * x0 + b * x0 + c, code: "exposant", message: "La dérivée de xⁿ est n xⁿ⁻¹ : on multiplie par l'exposant.", type: "procedurale" }],
          hint: "Dérive terme à terme : (xⁿ)′ = n xⁿ⁻¹.",
          solution: [`f′(x) = ${poly([[3 * a, "x²"], [2 * b, "x"], [c, ""]])}.`, `f′(${fr(x0)}) = ${fr(fp)}.`],
          recap: `f′(${fr(x0)}) = ${fr(fp)}`,
          review: "Nombre dérivé",
          takeaway: "(xⁿ)′ = n xⁿ⁻¹ ; la dérivée d'une somme est la somme des dérivées.",
        }),
        verify: () => Math.abs(deriv((x) => evaluate(f, { x }), x0) - fp) < 1e-4,
      };
    },
  }),
  gen({
    id: "m1-der-tangente", unit: U("1re-maths-derivation"), title: "Équation d'une tangente", stage: "transfert",
    make: (r, id) => {
      const a = r.nonZero(3), b = r.int(-5, 5), c = r.int(-6, 6), x0 = r.int(-3, 3);
      const f = poly([[a, "x²"], [b, "x"], [c, ""]]);
      const y0 = a * x0 * x0 + b * x0 + c, m = 2 * a * x0 + b;
      const p = y0 - m * x0;
      const eq = `y = ${poly([[m, "x"], [p, ""]])}`;
      return {
        activity: mcq(r, {
          id, stage: "transfert", competence: "calculer",
          prompt: `Quelle est l'équation de la tangente à la courbe de f(x) = ${f} au point d'abscisse ${fr(x0)} ?`,
          answer: { text: eq, feedback: `y = f′(a)(x − a) + f(a), avec f(${fr(x0)}) = ${fr(y0)} et f′(${fr(x0)}) = ${fr(m)}.` },
          wrong: [
            { text: `y = ${poly([[m, "x"], [y0, ""]])}`, feedback: "On ne prend pas f(a) comme ordonnée à l'origine : développe f′(a)(x − a) + f(a)." },
            { text: `y = ${poly([[y0, "x"], [m - y0 * x0, ""]])}`, feedback: "Le coefficient directeur est f′(a), pas f(a)." },
            { text: `y = ${poly([[m, "x"], [-p, ""]])}`, feedback: "Vérifie que la droite passe bien par le point de la courbe." },
            { text: `y = ${poly([[m + 1, "x"], [p, ""]])}`, feedback: "Recalcule f′(a)." },
            { text: `y = ${poly([[m, "x"], [p - 1, ""]])}`, feedback: "Vérifie que la droite passe par le point de la courbe." },
            { text: `y = ${poly([[m - 1, "x"], [p, ""]])}`, feedback: "Recalcule f′(a)." },
          ],
          hint: "y = f′(a)(x − a) + f(a).",
          solution: [`f′(x) = ${poly([[2 * a, "x"], [b, ""]])}, f′(${fr(x0)}) = ${fr(m)}, f(${fr(x0)}) = ${fr(y0)}.`, `y = ${fr(m)}(x − ${par(x0)}) + ${par(y0)}, soit ${eq}.`],
          takeaway: "Tangente en a : y = f′(a)(x − a) + f(a).",
        }),
        verify: () => evaluate(poly([[m, "x"], [p, ""]]), { x: x0 }) === y0 && Math.abs(deriv((x) => evaluate(f, { x }), x0) - m) < 1e-4,
      };
    },
  }),
  gen({
    id: "m1-der-fonction", unit: U("1re-maths-derivation"), title: "Fonction dérivée d'un polynôme", stage: "rappel",
    make: (r, id) => {
      const a = r.nonZero(5), b = r.int(-7, 7), c = r.int(-9, 9), d = r.int(-9, 9);
      const f = poly([[a, "x³"], [b, "x²"], [c, "x"], [d, ""]]);
      const fp = poly([[3 * a, "x²"], [2 * b, "x"], [c, ""]]);
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "calculer",
          prompt: `Quelle est la dérivée de f(x) = ${f} ?`,
          answer: { text: `f′(x) = ${fp}`, feedback: "(xⁿ)′ = n xⁿ⁻¹, et la dérivée d'une constante est nulle." },
          wrong: [
            { text: `f′(x) = ${poly([[3 * a, "x²"], [2 * b, "x"], [c, ""], [d, ""]])}`, feedback: "La dérivée d'une constante est 0." },
            { text: `f′(x) = ${poly([[a, "x²"], [b, "x"], [c, ""]])}`, feedback: "On multiplie par l'exposant : (x³)′ = 3x²." },
            { text: `f′(x) = ${poly([[3 * a, "x³"], [2 * b, "x²"], [c, "x"]])}`, feedback: "L'exposant diminue de 1." },
          ],
          hint: "Dérive chaque terme séparément.",
          solution: [`f′(x) = ${fp}.`],
          takeaway: "(xⁿ)′ = n xⁿ⁻¹ ; (k)′ = 0 ; (ku)′ = k u′.",
        }),
        verify: () => [-2, 0.5, 3].every((x) => Math.abs(deriv((t) => evaluate(f, { x: t }), x) - evaluate(fp, { x })) < 1e-4),
      };
    },
  }),

  /* ——— 1re : exponentielle ——— */
  gen({
    id: "m1-exp-proprietes", unit: U("1re-maths-exponentielle"), title: "Propriétés algébriques de l'exponentielle", stage: "rappel",
    make: (r, id) => {
      const a = r.nonZero(6), b = r.nonZero(6);
      const kind = r.int(0, 2);
      const [prompt, exp, calc] = kind === 0 ? [`e${pow("", a)} × e${pow("", b)}`, a + b, `e^${a} × e^${b}`] : kind === 1 ? [`e${pow("", a)} ÷ e${pow("", b)}`, a - b, `e^${a} ÷ e^${b}`] : [`(e${pow("", a)})${pow("", b)}`, a * b, `(e^${a})^${b}`];
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "calculer",
          prompt: `Simplifie : ${prompt}`,
          answer: { text: `e${pow("", exp)}`, feedback: ["eᵃ × eᵇ = eᵃ⁺ᵇ.", "eᵃ ÷ eᵇ = eᵃ⁻ᵇ.", "(eᵃ)ᵇ = eᵃᵇ."][kind]! },
          wrong: [
            { text: `e${pow("", kind === 0 ? a * b : kind === 1 ? a + b : a + b)}`, feedback: "Revois la règle : produit → somme des exposants ; quotient → différence ; puissance → produit." },
            { text: `e${pow("", kind === 1 ? b - a : -exp)}`, feedback: "Vérifie le signe de l'exposant." },
            { text: `e${pow("", exp + 1)}`, feedback: "Recalcule l'exposant." },
            { text: `e${pow("", exp - 1)}`, feedback: "Recalcule l'exposant." },
          ],
          hint: "Les règles de l'exponentielle sont celles des puissances.",
          solution: [`${prompt} = e${pow("", exp)}.`],
          takeaway: "eᵃ × eᵇ = eᵃ⁺ᵇ ; eᵃ/eᵇ = eᵃ⁻ᵇ ; (eᵃ)ᵇ = eᵃᵇ ; e⁰ = 1.",
        }),
        verify: () => close(evaluate(calc), Math.exp(exp)),
      };
    },
  }),
  gen({
    id: "m1-exp-croissance", unit: U("1re-maths-exponentielle"), title: "Modèle de croissance exponentielle", stage: "transfert",
    make: (r, id) => {
      const n0 = r.int(1, 20) * 100, k = r.pick([0.05, 0.1, 0.2, 0.3]), t = r.int(2, 12);
      const n = Math.round(n0 * Math.exp(k * t));
      return {
        activity: ask({
          id, stage: "transfert", competence: "modeliser",
          context: `Une population de bactéries suit le modèle N(t) = ${fr(n0)} × e^(${fr(k)}t), t en heures.`,
          prompt: `Combien de bactéries au bout de ${t} h ? (arrondi à l'unité)`,
          expected: n,
          tolerance: { abs: 0.5 },
          errors: [{ value: Math.round(n0 * (1 + k * t)), code: "lineaire", message: "Le modèle est exponentiel : on calcule e^(kt), pas 1 + kt.", type: "conceptuelle" }],
          hint: `Calcule ${fr(k)} × ${t}, puis l'exponentielle.`,
          solution: [`N(${t}) = ${fr(n0)} × e^(${fr(round(k * t, 2))}) ≈ ${fr(n)}.`],
          recap: `≈ ${fr(n)} bactéries`,
          review: "Modèle exponentiel",
          takeaway: "Dans un modèle N(t) = N₀ eᵏᵗ avec k > 0, la quantité est multipliée par le même facteur sur des durées égales.",
        }),
        verify: () => close(Math.log(n0 * Math.exp(k * t) / n0), k * t) && Math.abs(n0 * Math.exp(k * t) - n) <= 0.5,
      };
    },
  }),

  /* ——— 1re : trigonométrie ——— */
  gen({
    id: "m1-tri-remarquables", unit: U("1re-maths-trigo"), title: "Cosinus et sinus des angles remarquables", stage: "rappel",
    make: (r, id) => {
      const angles: [string, number][] = [["π/6", Math.PI / 6], ["π/4", Math.PI / 4], ["π/3", Math.PI / 3], ["π/2", Math.PI / 2], ["2π/3", (2 * Math.PI) / 3], ["3π/4", (3 * Math.PI) / 4], ["5π/6", (5 * Math.PI) / 6], ["π", Math.PI], ["−π/3", -Math.PI / 3], ["−π/6", -Math.PI / 6]];
      const VALUES: [string, number][] = [["0", 0], ["1/2", 0.5], ["√2/2", Math.SQRT2 / 2], ["√3/2", Math.sqrt(3) / 2], ["1", 1], ["−1/2", -0.5], ["−√2/2", -Math.SQRT2 / 2], ["−√3/2", -Math.sqrt(3) / 2], ["−1", -1]];
      const [name, x] = r.pick(angles);
      const useCos = r.chance(0.5);
      const v = useCos ? Math.cos(x) : Math.sin(x);
      const right = VALUES.find(([, w]) => close(w, v, 1e-9) || Math.abs(w - v) < 1e-12)!;
      const wrong = r.sample(VALUES.filter(([t, w]) => t !== right[0] && Math.abs(w - v) > 1e-9), 3);
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "communiquer",
          prompt: `Que vaut ${useCos ? "cos" : "sin"}(${name}) ?`,
          answer: { text: right[0], feedback: `Sur le cercle trigonométrique, le point associé à ${name} a pour ${useCos ? "abscisse" : "ordonnée"} ${right[0]}.` },
          wrong: wrong.map(([t]) => ({ text: t, feedback: useCos ? "Le cosinus se lit sur l'axe horizontal du cercle trigonométrique." : "Le sinus se lit sur l'axe vertical du cercle trigonométrique." })),
          hint: "Place le point sur le cercle trigonométrique ; cos = abscisse, sin = ordonnée.",
          solution: [`${useCos ? "cos" : "sin"}(${name}) = ${right[0]}.`],
          takeaway: "cos(π/6) = √3/2, cos(π/4) = √2/2, cos(π/3) = 1/2 ; sin(π/6) = 1/2, sin(π/4) = √2/2, sin(π/3) = √3/2.",
        }),
        verify: () => close(evaluate(right[0].replace("−", "-")), v) || Math.abs(evaluate(right[0]) - v) < 1e-12,
      };
    },
  }),

  /* ——— 1re : produit scalaire ——— */
  gen({
    id: "m1-ps-coordonnees", unit: U("1re-maths-produit-scalaire"), title: "Produit scalaire en coordonnées", stage: "application",
    make: (r, id) => {
      const x = r.int(-6, 6), y = r.int(-6, 6), x2 = r.int(-6, 6), y2 = r.int(-6, 6);
      const ps = x * x2 + y * y2;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Dans un repère orthonormé, u→${pt(x, y)} et v→${pt(x2, y2)}.`,
          prompt: "Calcule u→ · v→.",
          expected: ps,
          errors: [{ value: x * y2 + y * x2, code: "croise", message: "On multiplie abscisse par abscisse et ordonnée par ordonnée.", type: "procedurale" }],
          hint: "u→ · v→ = xx′ + yy′.",
          solution: [`u→ · v→ = ${fr(x)} × ${par(x2)} + ${par(y)} × ${par(y2)} = ${fr(ps)}.`],
          recap: `u→ · v→ = ${fr(ps)}`,
          review: "Produit scalaire",
          takeaway: "En repère orthonormé : u→ · v→ = xx′ + yy′ ; il est nul si et seulement si les vecteurs sont orthogonaux.",
        }),
        verify: () => close(ps, ((x + x2) ** 2 + (y + y2) ** 2 - (x * x + y * y) - (x2 * x2 + y2 * y2)) / 2),
      };
    },
  }),
  gen({
    id: "m1-ps-orthogonal", unit: U("1re-maths-produit-scalaire"), title: "Vecteurs orthogonaux", stage: "transfert",
    make: (r, id) => {
      const x = r.nonZero(6), y = r.nonZero(6), k = r.nonZero(3);
      const ortho = r.chance(0.5);
      const [x2, y2] = ortho ? [-k * y, k * x] : [k * y + 1, k * x];
      const ps = x * x2 + y * y2;
      return {
        activity: mcq(r, {
          id, stage: "transfert", competence: "raisonner",
          prompt: `u→${pt(x, y)} et v→${pt(x2, y2)} sont-ils orthogonaux ?`,
          answer: ortho ? { text: "Oui, car u→ · v→ = 0", feedback: `${fr(x)} × ${par(x2)} + ${par(y)} × ${par(y2)} = 0.` } : { text: "Non, car u→ · v→ ≠ 0", feedback: `u→ · v→ = ${fr(ps)} ≠ 0.` },
          wrong: [
            ortho ? { text: "Non, car u→ · v→ ≠ 0", feedback: "Calcule xx′ + yy′ : on trouve 0." } : { text: "Oui, car u→ · v→ = 0", feedback: `Calcule xx′ + yy′ : on trouve ${fr(ps)}.` },
            { text: "Oui, car ils ont la même norme", feedback: "La norme ne dit rien de l'angle entre les vecteurs." },
            { text: "Non, car ils ne sont pas colinéaires", feedback: "Non colinéaires ne veut pas dire non orthogonaux." },
          ],
          hint: "Deux vecteurs sont orthogonaux si leur produit scalaire est nul.",
          solution: [`u→ · v→ = ${fr(ps)}.`, ortho ? "Il est nul : u→ ⊥ v→." : "Il n'est pas nul : ils ne sont pas orthogonaux."],
          takeaway: "u→ ⊥ v→ ⟺ u→ · v→ = 0.",
        }),
        verify: () => (ps === 0) === ortho,
      };
    },
  }),

  /* ——— 1re : géométrie repérée ——— */
  gen({
    id: "m1-rep-cercle", unit: U("1re-maths-reperee"), title: "Équation d'un cercle", stage: "application",
    make: (r, id) => {
      const a = r.int(-5, 5), b = r.int(-5, 5), rad = r.int(1, 7);
      const sq = (u: number, v: string) => (u === 0 ? `${v}²` : `(${v} ${u < 0 ? "+" : "−"} ${Math.abs(u)})²`);
      const eq = `${sq(a, "x")} + ${sq(b, "y")} = ${rad * rad}`;
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "communiquer",
          prompt: `Quelle est une équation du cercle de centre Ω${pt(a, b)} et de rayon ${rad} ?`,
          answer: { text: eq, feedback: "(x − a)² + (y − b)² = r²." },
          wrong: [
            { text: `${sq(-a, "x")} + ${sq(-b, "y")} = ${rad * rad}`, feedback: "Le centre (a ; b) donne (x − a)² : attention aux signes." },
            { text: `${sq(a, "x")} + ${sq(b, "y")} = ${rad}`, feedback: "Le second membre est le carré du rayon." },
            { text: `${sq(b, "x")} + ${sq(a, "y")} = ${rad * rad}`, feedback: "Les coordonnées du centre ont été inversées." },
            { text: `${sq(a, "x")} + ${sq(b, "y")} = ${2 * rad}`, feedback: "Le second membre est r², pas 2r." },
          ],
          hint: "M(x ; y) est sur le cercle si ΩM = r, soit ΩM² = r².",
          solution: [`ΩM² = (x − ${par(a)})² + (y − ${par(b)})² = ${rad}².`, eq],
          takeaway: "Cercle de centre Ω(a ; b) et de rayon r : (x − a)² + (y − b)² = r².",
        }),
        verify: () => close(evaluate(eq.split(" = ")[0]!.replace(/y/g, "Y"), { x: a + rad, Y: b }), rad * rad),
      };
    },
  }),

  /* ——— 1re : probabilités conditionnelles ——— */
  gen({
    id: "m1-pro-totales", unit: U("1re-maths-proba"), title: "Formule des probabilités totales", stage: "transfert",
    make: (r, id) => {
      const pa = r.int(2, 8) / 10, pba = r.int(1, 9) / 10, pbna = r.int(1, 9) / 10;
      const pb = round(pa * pba + (1 - pa) * pbna, 4);
      const people = 1000;
      const nA = pa * people, nBA = nA * pba, nBnA = (people - nA) * pbna;
      return {
        activity: ask({
          id, stage: "transfert", competence: "modeliser",
          context: `Dans un lycée, ${fr(pa * 100)} % des élèves sont internes. Parmi les internes, ${fr(pba * 100)} % font du sport le soir ; parmi les externes, ${fr(pbna * 100)} %.`,
          prompt: "Quelle est la probabilité qu'un élève choisi au hasard fasse du sport le soir ?",
          expected: pb,
          errors: [{ value: round(pba + pbna, 4), code: "somme", message: "On pondère chaque cas par sa probabilité : p(A) × p_A(B) + p(Ā) × p_Ā(B).", type: "conceptuelle" }, { value: round(pa * pba, 4), code: "partiel", message: "Il manque les externes qui font du sport." }],
          hint: "Fais un arbre : internes / externes, puis sport / pas de sport.",
          solution: [`p(S) = ${fr(pa)} × ${fr(pba)} + ${fr(round(1 - pa, 1))} × ${fr(pbna)} = ${fr(pb)}.`],
          recap: `p(S) = ${fr(pb)}`,
          review: "Probabilités totales",
          takeaway: "Probabilités totales : p(B) = p(A) × p_A(B) + p(Ā) × p_Ā(B).",
        }),
        verify: () => close((nBA + nBnA) / people, pb, 1e-9),
      };
    },
  }),

  /* ——— 1re : variables aléatoires ——— */
  gen({
    id: "m1-va-esperance", unit: U("1re-maths-variables"), title: "Espérance d'une variable aléatoire", stage: "application",
    make: (r, id) => {
      const gains = [r.int(-10, -1), 0, r.int(1, 10), r.int(11, 50)];
      const ps = [r.int(20, 45), r.int(10, 25), r.int(5, 20)];
      const all = [...ps, 100 - ps.reduce((a, b) => a + b, 0)];
      const e = round(gains.reduce((s, g, i) => s + (g * all[i]!) / 100, 0), 4);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          stimulus: mockTable("Loi de X (gain en euros)", ["Gain xᵢ", ...gains.map((g) => fr(g))], [["p(X = xᵢ)", ...all.map((p) => fr(p / 100))]]),
          context: "X est le gain algébrique d'un jeu.",
          prompt: "Calcule l'espérance E(X).",
          expected: e,
          errors: [{ value: round(gains.reduce((a, b) => a + b, 0) / 4, 4), code: "moyenne", message: "On pondère chaque gain par sa probabilité : E(X) = Σ xᵢ pᵢ.", type: "conceptuelle" }],
          hint: "E(X) = somme des produits gain × probabilité.",
          solution: [`E(X) = ${gains.map((g, i) => `${par(g)} × ${fr(all[i]! / 100)}`).join(" + ")} = ${fr(e)}.`, e < 0 ? "Le jeu est défavorable au joueur." : e > 0 ? "Le jeu est favorable au joueur." : "Le jeu est équitable."],
          recap: `E(X) = ${fr(e)}`,
          review: "Espérance",
          takeaway: "E(X) = Σ xᵢ p(X = xᵢ) : c'est la moyenne des gains sur un grand nombre de parties.",
        }),
        verify: () => all.every((p) => p > 0) && close(evaluate(gains.map((g, i) => `${par(g)} × ${fr(all[i]! / 100)}`).join(" + ")), e),
      };
    },
  }),

  /* ——— Terminale : suites et limites ——— */
  gen({
    id: "mt-sui-limite", unit: U("Tle-maths-suites-limites"), title: "Limite d'une suite", stage: "application",
    make: (r, id) => {
      const kind = r.int(0, 1);
      if (kind === 0) {
        const a = r.nonZero(9), b = r.int(-9, 9), c = r.int(1, 9), d = r.int(1, 9);
        const lim = a / c;
        return {
          activity: mcqNumber(r, {
            id, stage: "application", competence: "raisonner",
            prompt: `Quelle est la limite de uₙ = (${poly([[a, "n"], [b, ""]])}) / (${poly([[c, "n"], [d, ""]])}) quand n tend vers +∞ ?`,
            answer: round(lim, 6),
            right: "On factorise par n en haut et en bas : le quotient tend vers le rapport des coefficients de n.",
            wrong: [{ value: b / d, feedback: "Les constantes deviennent négligeables devant n." }, { value: 0, feedback: "Numérateur et dénominateur tendent vers l'infini à la même vitesse." }, { value: round(lim + 1, 6), feedback: "Recalcule le rapport des coefficients de n." }],
            show: (x) => fr(round(x, 4)),
            hint: "Factorise par n le numérateur et le dénominateur.",
            solution: [`uₙ = (${fr(a)} + ${par(b)}/n) / (${fr(c)} + ${par(d)}/n) → ${fr(round(lim, 4))}.`],
            takeaway: "Pour un quotient de polynômes en n de même degré, la limite est le rapport des coefficients dominants.",
          }),
          verify: () => Math.abs((a * 1e7 + b) / (c * 1e7 + d) - lim) < 1e-5,
        };
      }
      const q = r.pick([0.2, 0.5, 0.8, -0.5, 1.5, 2, 3]);
      const res = Math.abs(q) < 1 ? "0" : "+∞";
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "raisonner",
          prompt: `Quelle est la limite de ${fr(q)}ⁿ quand n tend vers +∞ ?`,
          answer: { text: res, feedback: Math.abs(q) < 1 ? "Si −1 < q < 1, qⁿ tend vers 0." : "Si q > 1, qⁿ tend vers +∞." },
          wrong: ["0", "+∞", "1", "Pas de limite"].filter((t) => t !== res).map((t) => ({ text: t, feedback: "Compare q à 1 et à −1." })),
          hint: "Compare q à 1.",
          solution: [`${fr(q)} ${Math.abs(q) < 1 ? "est entre −1 et 1" : "est plus grand que 1"}, donc ${fr(q)}ⁿ → ${res}.`],
          takeaway: "qⁿ → 0 si −1 < q < 1 ; qⁿ → +∞ si q > 1 ; pas de limite si q ≤ −1.",
        }),
        verify: () => (Math.abs(q) < 1 ? Math.abs(q ** 200) < 1e-10 : q ** 200 > 1e10),
      };
    },
  }),
  gen({
    id: "mt-sui-recurrence", unit: U("Tle-maths-suites-limites"), title: "Suite définie par récurrence", stage: "transfert",
    make: (r, id) => {
      const a = r.pick([0.5, 0.8, 0.9, 0.6]), b = r.int(1, 20) * 2, u0 = r.int(0, 50);
      const l = b / (1 - a);
      return {
        activity: ask({
          id, stage: "transfert", competence: "raisonner",
          context: `uₙ₊₁ = ${fr(a)} uₙ + ${fr(b)}, avec u₀ = ${u0}. On admet que (uₙ) converge.`,
          prompt: "Quelle est sa limite ℓ ?",
          expected: round(l, 6),
          tolerance: { rel: 1e-6 },
          errors: [{ value: b, code: "b", message: "La limite vérifie ℓ = aℓ + b : on résout cette équation.", type: "procedurale" }],
          hint: "Si (uₙ) converge vers ℓ, alors ℓ = aℓ + b.",
          solution: [`ℓ = ${fr(a)}ℓ + ${fr(b)} ⟺ ${fr(round(1 - a, 2))}ℓ = ${fr(b)} ⟺ ℓ = ${fr(round(l, 6))}.`],
          recap: `ℓ = ${fr(round(l, 4))}`,
          review: "Limite d'une suite récurrente",
          takeaway: "Pour uₙ₊₁ = f(uₙ) convergente et f continue, la limite ℓ vérifie ℓ = f(ℓ).",
        }),
        verify: () => {
          let u = u0;
          for (let i = 0; i < 2000; i++) u = a * u + b;
          return Math.abs(u - l) < 1e-6;
        },
      };
    },
  }),

  /* ——— Terminale : continuité ——— */
  gen({
    id: "mt-con-tvi", unit: U("Tle-maths-continuite"), title: "Encadrer une solution (valeurs intermédiaires)", stage: "transfert",
    make: (r, id) => {
      const root = r.int(-4, 5) + r.int(1, 9) / 10;
      const c = r.int(1, 5);
      const f = (x: number) => x ** 3 + c * x - (root ** 3 + c * root);
      const k = Math.floor(root);
      const text = poly([[1, "x³"], [c, "x"], [-round(root ** 3 + c * root, 3), ""]]);
      return {
        activity: ask({
          id, stage: "transfert", competence: "raisonner",
          context: `f(x) = ${text} est continue et strictement croissante sur ℝ ; l'équation f(x) = 0 a une unique solution α.`,
          prompt: "Quel entier n vérifie n < α < n + 1 ?",
          expected: k,
          errors: [{ value: k + 1, code: "borne", message: "Cherche le changement de signe : f(n) < 0 < f(n + 1).", type: "procedurale" }],
          hint: "Calcule f en quelques entiers et cherche le changement de signe.",
          solution: [`f(${k}) ≈ ${fr(round(f(k), 2))} < 0 et f(${k + 1}) ≈ ${fr(round(f(k + 1), 2))} > 0.`, `D'après le théorème des valeurs intermédiaires (f continue, strictement croissante), ${k} < α < ${k + 1}.`],
          recap: `n = ${k}`,
          review: "Théorème des valeurs intermédiaires",
          takeaway: "Si f est continue et strictement monotone sur [a ; b] et que f(a) et f(b) sont de signes contraires, f(x) = 0 a une unique solution dans [a ; b].",
        }),
        verify: () => {
          const g = (x: number) => evaluate(text, { x });
          return g(k) < 0 && g(k + 1) > 0;
        },
      };
    },
  }),

  /* ——— Terminale : convexité ——— */
  gen({
    id: "mt-cvx-inflexion", unit: U("Tle-maths-convexite"), title: "Point d'inflexion", stage: "application",
    make: (r, id) => {
      const a = r.nonZero(3), x0 = r.int(-4, 4), c = r.int(-6, 6), d = r.int(-5, 5);
      const b = -3 * a * x0;
      const f = poly([[a, "x³"], [b, "x²"], [c, "x"], [d, ""]]);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `f(x) = ${f}.`,
          prompt: "En quelle abscisse la courbe de f a-t-elle un point d'inflexion ?",
          expected: x0,
          errors: [{ value: -x0, code: "signe", message: "f″(x) = 6ax + 2b s'annule en x = −b/(3a) : attention au signe." }],
          hint: "Un point d'inflexion est un point où f″ s'annule en changeant de signe.",
          solution: [`f′(x) = ${poly([[3 * a, "x²"], [2 * b, "x"], [c, ""]])} ; f″(x) = ${poly([[6 * a, "x"], [2 * b, ""]])}.`, `f″(x) = 0 ⟺ x = ${fr(x0)}, et f″ change de signe en ce point.`],
          recap: `x = ${fr(x0)}`,
          review: "Point d'inflexion",
          takeaway: "f est convexe là où f″ ≥ 0, concave là où f″ ≤ 0 ; un point d'inflexion est un point où la convexité change.",
        }),
        verify: () => {
          const g = (x: number) => evaluate(f, { x });
          const second = (x: number) => (g(x + 1e-3) - 2 * g(x) + g(x - 1e-3)) / 1e-6;
          return Math.sign(second(x0 - 0.5)) !== Math.sign(second(x0 + 0.5)) && Math.abs(second(x0)) < 1e-2;
        },
      };
    },
  }),

  /* ——— Terminale : logarithme ——— */
  gen({
    id: "mt-ln-equation", unit: U("Tle-maths-logarithme"), title: "Résoudre une équation avec ln", stage: "application",
    make: (r, id) => {
      const k = r.int(2, 50), a = r.int(1, 5);
      const x = Math.log(k) / a;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: "Équation exponentielle.",
          prompt: `Résous ${a === 1 ? "eˣ" : `e^(${a}x)`} = ${k}. Donne x arrondi au centième.`,
          expected: round(x, 2),
          tolerance: { abs: 0.0051 },
          errors: [{ value: round(Math.log(k) * a, 2), code: "multiplie", message: `On divise ln(${k}) par ${a}.`, type: "procedurale" }, { value: round(k / a, 2), code: "ln", message: "On applique ln aux deux membres : ln(eᵘ) = u." }],
          hint: "Applique ln aux deux membres : ln(eᵘ) = u.",
          solution: [`${a === 1 ? "x" : `${a}x`} = ln(${k})`, `x = ln(${k})${a === 1 ? "" : ` ÷ ${a}`} ≈ ${fr(round(x, 2))}.`],
          recap: `x ≈ ${fr(round(x, 2))}`,
          review: "Équation exponentielle",
          takeaway: "Pour k > 0 : eᵘ = k ⟺ u = ln k.",
        }),
        verify: () => close(Math.exp(a * x), k),
      };
    },
  }),
  gen({
    id: "mt-ln-proprietes", unit: U("Tle-maths-logarithme"), title: "Propriétés algébriques du logarithme", stage: "rappel",
    make: (r, id) => {
      const a = r.int(2, 9), b = r.int(2, 9), n = r.int(2, 5);
      const kind = r.int(0, 2);
      const [prompt, res, calc] = kind === 0 ? [`ln(${a}) + ln(${b})`, `ln(${a * b})`, a * b] : kind === 1 ? [`ln(${a * b}) − ln(${b})`, `ln(${a})`, a] : [`${n} ln(${a})`, `ln(${a ** n})`, a ** n];
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "calculer",
          prompt: `Écris sous la forme ln(k) : ${prompt}`,
          answer: { text: res, feedback: ["ln a + ln b = ln(ab).", "ln a − ln b = ln(a/b).", "n ln a = ln(aⁿ)."][kind]! },
          wrong: [
            { text: `ln(${kind === 0 ? a + b : kind === 1 ? a * b - b : n * a})`, feedback: "Le logarithme transforme les produits en sommes, pas l'inverse." },
            { text: `ln(${kind === 2 ? a * a : calc + 1})`, feedback: "Recalcule l'argument." },
            { text: `ln(${kind === 1 ? b : calc * 2})`, feedback: "Vérifie la règle utilisée." },
            { text: `ln(${calc + 2})`, feedback: "Recalcule l'argument." },
            { text: `ln(${calc + 3})`, feedback: "Recalcule l'argument." },
          ],
          hint: "ln transforme un produit en somme : ln(ab) = ln a + ln b.",
          solution: [`${prompt} = ${res}.`],
          takeaway: "ln(ab) = ln a + ln b ; ln(a/b) = ln a − ln b ; ln(aⁿ) = n ln a.",
        }),
        verify: () => close(evaluate(prompt.replace(/ln/g, "ln")), Math.log(calc)),
      };
    },
  }),

  /* ——— Terminale : primitives et équations différentielles ——— */
  gen({
    id: "mt-pri-polynome", unit: U("Tle-maths-primitives"), title: "Primitive d'un polynôme", stage: "rappel",
    make: (r, id) => {
      const a = r.int(1, 4) * 3, b = r.int(-4, 4) * 2, c = r.nonZero(7);
      const f = poly([[a, "x²"], [b, "x"], [c, ""]]);
      const F = poly([[a / 3, "x³"], [b / 2, "x²"], [c, "x"]]);
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "calculer",
          prompt: `Laquelle est une primitive de f(x) = ${f} ?`,
          answer: { text: `F(x) = ${F}`, feedback: "Une primitive de xⁿ est xⁿ⁺¹/(n + 1)." },
          wrong: [
            { text: `F(x) = ${poly([[2 * a, "x"], [b, ""]])}`, feedback: "Ça, c'est la dérivée de f, pas une primitive." },
            { text: `F(x) = ${poly([[a, "x³"], [b, "x²"], [c, "x"]])}`, feedback: "On divise par le nouvel exposant : (x³/3)′ = x²." },
            { text: `F(x) = ${poly([[a / 3, "x³"], [b / 2, "x²"], [c, ""]])}`, feedback: "Une primitive de la constante c est cx." },
          ],
          hint: "Vérifie en dérivant : F′ doit redonner f.",
          solution: [`F′(x) = ${f} = f(x).`],
          takeaway: "F est une primitive de f si F′ = f ; une primitive de xⁿ est xⁿ⁺¹/(n + 1).",
        }),
        verify: () => [-2, 0.5, 3].every((x) => Math.abs(deriv((t) => evaluate(F, { x: t }), x) - evaluate(f, { x })) < 1e-4),
      };
    },
  }),
  gen({
    id: "mt-pri-equadiff", unit: U("Tle-maths-primitives"), title: "Équation y′ = ay + b", stage: "application",
    make: (r, id) => {
      const a = r.nonZero(5), b = r.nonZero(12) * a;
      const yp = -b / a;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `On considère l'équation différentielle y′ = ${poly([[a, "y"], [b, ""]])}.`,
          prompt: "Quelle est sa solution constante ?",
          expected: yp,
          errors: [{ value: b / a, code: "signe", message: "La solution constante vérifie 0 = ay + b, donc y = −b/a.", type: "procedurale" }],
          hint: "Une fonction constante a une dérivée nulle.",
          solution: [`0 = ${poly([[a, "y"], [b, ""]])} ⟺ y = ${fr(yp)}.`, `Solutions générales : y(x) = C ${a === 1 ? "eˣ" : a === -1 ? "e^(−x)" : `e^(${fr(a)}x)`} ${yp < 0 ? "−" : "+"} ${fr(Math.abs(yp))}, C réel.`],
          recap: `y = ${fr(yp)}`,
          review: "Équation différentielle y′ = ay + b",
          takeaway: "Les solutions de y′ = ay + b sont x ↦ C eᵃˣ − b/a.",
        }),
        verify: () => {
          const y = (x: number) => 2 * Math.exp(a * x) + yp;
          const x = 0.3;
          return Math.abs(deriv(y, x) - (a * y(x) + b)) < 1e-4 * Math.max(1, Math.abs(a * y(x) + b)) && a * yp + b === 0;
        },
      };
    },
  }),

  /* ——— Terminale : intégration ——— */
  gen({
    id: "mt-int-polynome", unit: U("Tle-maths-integration"), title: "Calculer une intégrale", stage: "application",
    make: (r, id) => {
      const a = r.int(1, 4) * 3, b = r.int(-3, 3) * 2, c = r.int(-5, 5), lo = r.int(-2, 1), hi = lo + r.int(1, 3);
      const f = poly([[a, "x²"], [b, "x"], [c, ""]]);
      const F = (x: number) => (a / 3) * x ** 3 + (b / 2) * x * x + c * x;
      const I = F(hi) - F(lo);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `f(x) = ${f}.`,
          prompt: `Calcule l'intégrale de f entre ${fr(lo)} et ${fr(hi)}.`,
          expected: I,
          errors: [{ value: F(lo) - F(hi), code: "ordre", message: "∫ₐᵇ f = F(b) − F(a) : borne du haut moins borne du bas.", type: "procedurale" }, { value: evaluate(f, { x: hi }) - evaluate(f, { x: lo }), code: "f", message: "On calcule la différence des valeurs d'une primitive F, pas de f." }],
          hint: "Trouve une primitive F, puis calcule F(b) − F(a).",
          solution: [`F(x) = ${poly([[a / 3, "x³"], [b / 2, "x²"], [c, "x"]])}.`, `F(${fr(hi)}) − F(${fr(lo)}) = ${fr(F(hi))} − ${par(F(lo))} = ${fr(I)}.`],
          recap: `I = ${fr(I)}`,
          review: "Calcul intégral",
          takeaway: "∫ₐᵇ f(x) dx = F(b) − F(a), où F est une primitive de f.",
        }),
        verify: () => close(simpson((x) => evaluate(f, { x }), lo, hi), I, 1e-9) || Math.abs(simpson((x) => evaluate(f, { x }), lo, hi) - I) < 1e-9,
      };
    },
  }),

  /* ——— Terminale : dénombrement ——— */
  gen({
    id: "mt-den-combinaisons", unit: U("Tle-maths-denombrement"), title: "Combinaisons et k-uplets", stage: "application",
    make: (r, id) => {
      const kind = r.int(0, 2);
      const n = r.int(4, 12), k = r.int(2, Math.min(4, n - 1));
      const value = kind === 0 ? binom(n, k) : kind === 1 ? n ** k : Array.from({ length: k }, (_, i) => n - i).reduce((a, b) => a * b, 1);
      const context = [
        `Dans une classe de ${n} élèves, on choisit ${k} délégués (sans ordre).`,
        `Un code est formé de ${k} symboles choisis parmi ${n}, avec répétition possible.`,
        `On attribue ${k} médailles différentes (or, argent…) à ${k} des ${n} finalistes.`,
      ][kind]!;
      return {
        activity: ask({
          id, stage: "application", competence: "modeliser",
          context,
          prompt: "Combien de possibilités ?",
          expected: value,
          errors: [
            { value: kind === 0 ? Array.from({ length: k }, (_, i) => n - i).reduce((a, b) => a * b, 1) : binom(n, k), code: "ordre", message: kind === 0 ? "L'ordre ne compte pas : on divise par k!." : "L'ordre compte ici.", type: "conceptuelle" },
            { value: kind === 1 ? Array.from({ length: k }, (_, i) => n - i).reduce((a, b) => a * b, 1) : n ** k, code: "repetition", message: kind === 1 ? "Les répétitions sont permises : chaque symbole a n choix." : "Un même élément ne peut pas être choisi deux fois." },
          ],
          hint: "L'ordre compte-t-il ? Les répétitions sont-elles possibles ?",
          solution: [kind === 0 ? `C(${n}, ${k}) = ${value}.` : kind === 1 ? `${n}${sup(k)} = ${value}.` : `${Array.from({ length: k }, (_, i) => n - i).join(" × ")} = ${value}.`],
          recap: fr(value),
          review: "Dénombrement",
          takeaway: "k-uplets : nᵏ ; arrangements (ordre, sans répétition) : n!/(n − k)! ; combinaisons (sans ordre) : C(n, k).",
        }),
        verify: () => {
          if (kind === 1) return value === n ** k;
          let count = 0;
          const rec = (start: number, depth: number, used: number[]) => {
            if (depth === k) { count++; return; }
            for (let i = kind === 0 ? start : 0; i < n; i++) if (!used.includes(i)) rec(i + 1, depth + 1, [...used, i]);
          };
          rec(0, 0, []);
          return count === value;
        },
      };
    },
  }),

  /* ——— Terminale : géométrie dans l'espace ——— */
  gen({
    id: "mt-esp-orthogonal", unit: U("Tle-maths-espace"), title: "Produit scalaire dans l'espace", stage: "application",
    make: (r, id) => {
      const u = [r.int(-5, 5), r.int(-5, 5), r.nonZero(5)], v = [r.int(-5, 5), r.int(-5, 5), r.int(-5, 5)];
      const ps = u[0]! * v[0]! + u[1]! * v[1]! + u[2]! * v[2]!;
      const t = (w: number[]) => `(${w.map(fr).join(" ; ")})`;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Dans un repère orthonormé de l'espace, u→${t(u)} et v→${t(v)}.`,
          prompt: "Calcule u→ · v→.",
          expected: ps,
          hint: "u→ · v→ = xx′ + yy′ + zz′.",
          solution: [`${u.map((x, i) => `${par(x)} × ${par(v[i]!)}`).join(" + ")} = ${fr(ps)}.`, ps === 0 ? "Le produit scalaire est nul : u→ et v→ sont orthogonaux." : "Il n'est pas nul : u→ et v→ ne sont pas orthogonaux."],
          recap: `u→ · v→ = ${fr(ps)}`,
          review: "Produit scalaire dans l'espace",
          takeaway: "Dans l'espace, en repère orthonormé : u→ · v→ = xx′ + yy′ + zz′.",
        }),
        verify: () => close(ps, (u.reduce((s, x, i) => s + (x + v[i]!) ** 2, 0) - u.reduce((s, x) => s + x * x, 0) - v.reduce((s, x) => s + x * x, 0)) / 2),
      };
    },
  }),

  /* ——— Terminale : loi binomiale ——— */
  gen({
    id: "mt-bin-proba", unit: U("Tle-maths-binomiale"), title: "Probabilité avec la loi binomiale", stage: "application",
    make: (r, id) => {
      const n = r.int(4, 12), p = r.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6]);
      let k = r.int(0, Math.min(n, 5));
      if (binom(n, k) * p ** k * (1 - p) ** (n - k) < 0.002) k = Math.round(n * p);
      const pk = binom(n, k) * p ** k * (1 - p) ** (n - k);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `X suit la loi binomiale de paramètres n = ${n} et p = ${fr(p)}.`,
          prompt: `Calcule p(X = ${k}), arrondie au millième.`,
          expected: round(pk, 3),
          tolerance: { abs: 0.00051 },
          errors: [{ value: round(p ** k * (1 - p) ** (n - k), 3), code: "coef", message: `Il y a C(${n}, ${k}) chemins réalisant ${k} succès : multiplie par ce coefficient.`, type: "procedurale" }],
          hint: `p(X = k) = C(n, k) × pᵏ × (1 − p)ⁿ⁻ᵏ.`,
          solution: [`p(X = ${k}) = C(${n}, ${k}) × ${fr(p)}${pow("", k)} × ${fr(round(1 - p, 2))}${pow("", n - k)} ≈ ${fr(round(pk, 3))}.`],
          recap: `≈ ${fr(round(pk, 3))}`,
          review: "Loi binomiale",
          takeaway: "Si X suit B(n, p) : p(X = k) = C(n, k) pᵏ (1 − p)ⁿ⁻ᵏ, et E(X) = np.",
        }),
        verify: () => {
          const all = Array.from({ length: n + 1 }, (_, i) => binom(n, i) * p ** i * (1 - p) ** (n - i));
          const mean = all.reduce((s, q, i) => s + i * q, 0);
          return close(all.reduce((a, b) => a + b, 0), 1) && close(mean, n * p) && close(all[k]!, pk);
        },
      };
    },
  }),
  gen({
    id: "mt-bin-esperance", unit: U("Tle-maths-binomiale"), title: "Espérance d'une loi binomiale", stage: "rappel",
    make: (r, id) => {
      const n = r.int(10, 200), p = r.pick([0.05, 0.1, 0.2, 0.25, 0.4, 0.5]);
      const e = round(n * p, 4);
      return {
        activity: ask({
          id, stage: "rappel", competence: "calculer",
          context: `Un QCM compte ${n} questions ; un élève répond au hasard et a une probabilité ${fr(p)} de bien répondre à chacune, de façon indépendante.`,
          prompt: "En moyenne, combien de bonnes réponses obtient-il ?",
          expected: e,
          errors: [{ value: round(n * (1 - p), 4), code: "echec", message: "On compte les succès : E(X) = n × p." }],
          hint: "X suit une loi binomiale : E(X) = np.",
          solution: [`E(X) = ${n} × ${fr(p)} = ${fr(e)}.`],
          recap: `E(X) = ${fr(e)}`,
          review: "Espérance binomiale",
          takeaway: "Pour X ~ B(n, p) : E(X) = np et V(X) = np(1 − p).",
        }),
        verify: () => close(e, n * p),
      };
    },
  }),

  /* ——— Terminale : concentration ——— */
  gen({
    id: "mt-con-bienayme", unit: U("Tle-maths-concentration"), title: "Inégalité de Bienaymé-Tchebychev", stage: "transfert",
    make: (r, id) => {
      const v = r.int(1, 20), t = r.int(2, 10);
      const bound = v / (t * t);
      return {
        activity: ask({
          id, stage: "transfert", competence: "raisonner",
          context: `Une variable aléatoire X a pour espérance μ et pour variance V(X) = ${v}.`,
          prompt: `Donne le majorant de p(|X − μ| ≥ ${t}) fourni par l'inégalité de Bienaymé-Tchebychev (fraction ou décimal à 10⁻⁴ près).`,
          expected: bound,
          tolerance: { abs: 0.00005 },
          errors: [{ value: round(v / t, 4), code: "carre", message: "On divise la variance par t², pas par t.", type: "procedurale" }],
          hint: "p(|X − μ| ≥ t) ≤ V(X) / t².",
          solution: [`p(|X − μ| ≥ ${t}) ≤ ${v} / ${t}² = ${v}/${t * t} ≈ ${fr(round(bound, 4))}.`],
          recap: `≤ ${v}/${t * t}`,
          review: "Bienaymé-Tchebychev",
          takeaway: "Inégalité de Bienaymé-Tchebychev : p(|X − E(X)| ≥ t) ≤ V(X)/t² pour tout t > 0.",
        }),
        verify: () => close(bound * t * t, v),
      };
    },
  }),

  /* ——— Tronc commun ——— */
  gen({
    id: "mtc-don-proportion", unit: U("1re-maths-tc-donnees"), title: "Proportion de proportion", stage: "application",
    make: (r, id) => {
      const p1 = r.pick([20, 25, 40, 50, 60, 75, 80]), p2 = r.pick([10, 20, 25, 30, 40, 50]);
      const res = (p1 * p2) / 100;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Dans une ville, ${p1} % des habitants ont un vélo ; parmi eux, ${p2} % l'utilisent tous les jours.`,
          prompt: "Quel pourcentage des habitants utilise un vélo tous les jours ?",
          expected: res,
          errors: [{ value: p1 + p2, code: "somme", message: "Une proportion de proportion se calcule en multipliant les proportions." }, { value: p2, code: "sous_groupe", message: `${p2} % concerne seulement les possesseurs de vélo.` }],
          hint: "Multiplie les deux proportions.",
          solution: [`${fr(p1 / 100)} × ${fr(p2 / 100)} = ${fr(res / 100)}, soit ${fr(res)} %.`],
          recap: `${fr(res)} %`,
          review: "Proportion de proportion",
          takeaway: "Si A représente p₁ de E et B représente p₂ de A, alors B représente p₁ × p₂ de E.",
        }),
        verify: () => close((res / 100) * 10000, p1 * p2),
      };
    },
  }),
  gen({
    id: "mtc-pro-conditionnelle", unit: U("1re-maths-tc-proba"), title: "Probabilité conditionnelle dans un tableau", stage: "application",
    make: (r, id) => {
      const a = r.int(10, 80), b = r.int(10, 80), c = r.int(10, 80), d = r.int(10, 80);
      const table = mockTable("Résultats d'un test", ["", "Test positif", "Test négatif", "Total"], [["Malades", String(a), String(b), String(a + b)], ["Non malades", String(c), String(d), String(c + d)], ["Total", String(a + c), String(b + d), String(a + b + c + d)]]);
      const p = a / (a + c);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          stimulus: table,
          context: "Le tableau croise l'état de santé et le résultat d'un test (données fictives).",
          prompt: "Sachant que le test est positif, quelle est la probabilité d'être malade ? (au centième)",
          expected: round(p, 2),
          tolerance: { abs: 0.0051 },
          errors: [{ value: round(a / (a + b), 2), code: "inverse", message: "p_T(M) n'est pas p_M(T) : on se restreint à la colonne « Test positif ».", type: "conceptuelle" }],
          hint: "Restreins-toi aux tests positifs.",
          solution: [`p_T(M) = ${a} ÷ ${a + c} ≈ ${fr(round(p, 2))}.`],
          recap: `≈ ${fr(round(p, 2))}`,
          review: "Probabilité conditionnelle",
          takeaway: "p_A(B) = p(A ∩ B) / p(A) : on se restreint à l'événement A.",
        }),
        verify: () => close(p, (a / (a + b + c + d)) / ((a + c) / (a + b + c + d))),
      };
    },
  }),
  gen({
    id: "mtc-sui-evolution", unit: U("1re-maths-tc-suites"), title: "Évolution en pourcentage répétée", stage: "transfert",
    make: (r, id) => {
      const v0 = r.int(10, 90) * 100, t = r.pick([2, 3, 4, 5, 10]), n = r.int(2, 8);
      const down = r.chance(0.4);
      const q = down ? 1 - t / 100 : 1 + t / 100;
      const vn = Math.round(v0 * q ** n);
      return {
        activity: ask({
          id, stage: "transfert", competence: "modeliser",
          context: `Un réseau compte ${fr(v0)} abonnés ; ce nombre ${down ? "baisse" : "augmente"} de ${t} % chaque année.`,
          prompt: `Combien d'abonnés dans ${n} ans ? (arrondi à l'unité)`,
          expected: vn,
          tolerance: { abs: 0.5 },
          errors: [{ value: Math.round(v0 * (1 + ((down ? -1 : 1) * n * t) / 100)), code: "lineaire", message: "Chaque année, le pourcentage s'applique à la nouvelle valeur : on multiplie par q chaque année.", type: "conceptuelle" }],
          hint: `Chaque année, on multiplie par ${fr(q)}.`,
          solution: [`uₙ = ${fr(v0)} × ${fr(q)}ⁿ (suite géométrique).`, `Dans ${n} ans : ${fr(v0)} × ${fr(q)}${pow("", n)} ≈ ${fr(vn)}.`],
          recap: `≈ ${fr(vn)}`,
          review: "Suite géométrique",
          takeaway: "Une évolution de t % répétée donne une suite géométrique de raison 1 ± t/100.",
        }),
        verify: () => {
          let v = v0;
          for (let i = 0; i < n; i++) v = v * q;
          return Math.abs(v - vn) <= 0.5;
        },
      };
    },
  }),
  gen({
    id: "mtc-aut-reciproque", unit: U("1re-maths-tc-automatismes"), title: "Évolution réciproque", stage: "rappel",
    make: (r, id) => {
      const t = r.pick([20, 25, 50, 100]);
      const recip = round((1 / (1 + t / 100) - 1) * 100, 4);
      return {
        activity: mcqNumber(r, {
          id, stage: "rappel", competence: "calculer",
          prompt: `Un prix augmente de ${t} %. De quel pourcentage doit-il baisser pour revenir à sa valeur de départ ?`,
          answer: -recip,
          right: `On divise par ${fr(1 + t / 100)} : le coefficient réciproque est ${fr(round(1 / (1 + t / 100), 4))}.`,
          wrong: [{ value: t, feedback: "Le pourcentage s'applique à une valeur plus grande : il faut baisser de moins de " + t + " %." }, { value: t / 2, feedback: "Calcule le coefficient réciproque 1/(1 + t/100)." }, { value: -recip + 5, feedback: "Calcule le coefficient réciproque." }],
          show: (x) => `${fr(round(x, 2))} %`,
          hint: "Le coefficient réciproque de c est 1/c.",
          solution: [`1 ÷ ${fr(1 + t / 100)} = ${fr(round(1 / (1 + t / 100), 4))}, soit une baisse de ${fr(round(-recip, 2))} %.`],
          takeaway: "L'évolution réciproque d'une hausse de t % n'est pas une baisse de t % : son coefficient est 1/(1 + t/100).",
        }),
        verify: () => Math.abs((1 + t / 100) * (1 + recip / 100) - 1) < 1e-5,
      };
    },
  }),

  /* ——— Maths complémentaires ——— */
  gen({
    id: "mco-dis-point-fixe", unit: U("Tle-maths-comp-modeles-discrets"), title: "Modèle discret : valeur d'équilibre", stage: "application",
    make: (r, id) => {
      const a = r.pick([0.5, 0.6, 0.75, 0.8, 0.9]), b = r.int(1, 30) * 10;
      const l = round(b / (1 - a), 4);
      return {
        activity: ask({
          id, stage: "application", competence: "modeliser",
          context: `Chaque année, un lac conserve ${fr(a * 100)} % de ses poissons et on en ajoute ${b} : pₙ₊₁ = ${fr(a)} pₙ + ${b}.`,
          prompt: "Vers quelle population se stabilise-t-il ?",
          expected: l,
          tolerance: { rel: 1e-6 },
          errors: [{ value: b, code: "b", message: "L'équilibre vérifie p = a p + b." }],
          hint: "À l'équilibre, pₙ₊₁ = pₙ = p.",
          solution: [`p = ${fr(a)} p + ${b} ⟺ ${fr(round(1 - a, 2))} p = ${b} ⟺ p = ${fr(l)}.`],
          recap: `p = ${fr(l)}`,
          review: "Suite arithmético-géométrique",
          takeaway: "Pour uₙ₊₁ = a uₙ + b avec 0 < a < 1, la suite tend vers b/(1 − a).",
        }),
        verify: () => {
          let p = 0;
          for (let i = 0; i < 3000; i++) p = a * p + b;
          return Math.abs(p - l) < 1e-3;
        },
      };
    },
  }),
  gen({
    id: "mco-con-doublement", unit: U("Tle-maths-comp-modeles-continus"), title: "Temps de doublement", stage: "transfert",
    make: (r, id) => {
      const k = r.pick([0.02, 0.03, 0.05, 0.07, 0.1, 0.15]);
      const t = Math.log(2) / k;
      return {
        activity: ask({
          id, stage: "transfert", competence: "modeliser",
          context: `Une quantité évolue selon Q(t) = Q₀ e^(${fr(k)}t).`,
          prompt: "Au bout de combien de temps double-t-elle ? (arrondi au dixième)",
          expected: round(t, 1),
          tolerance: { abs: 0.051 },
          errors: [{ value: round(2 / k, 1), code: "ln", message: "On résout e^(kt) = 2, donc t = ln 2 / k." }],
          hint: "Résous Q₀ e^(kt) = 2 Q₀.",
          solution: [`e^(${fr(k)}t) = 2 ⟺ t = ln 2 ÷ ${fr(k)} ≈ ${fr(round(t, 1))}.`],
          recap: `≈ ${fr(round(t, 1))}`,
          review: "Croissance exponentielle",
          takeaway: "Pour Q(t) = Q₀ eᵏᵗ, le temps de doublement vaut ln 2 / k et ne dépend pas de Q₀.",
        }),
        verify: () => close(Math.exp(k * t), 2),
      };
    },
  }),
  gen({
    id: "mco-pro-binomiale", unit: U("Tle-maths-comp-proba"), title: "Au moins un succès", stage: "application",
    make: (r, id) => {
      const n = r.int(2, 10), p = r.pick([0.05, 0.1, 0.2, 0.3, 0.5]);
      const res = 1 - (1 - p) ** n;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `On répète ${n} fois, de façon indépendante, une épreuve qui réussit avec la probabilité ${fr(p)}.`,
          prompt: "Quelle est la probabilité d'obtenir au moins un succès ? (au millième)",
          expected: round(res, 3),
          tolerance: { abs: 0.00051 },
          errors: [{ value: round(n * p, 3), code: "somme", message: "On ne peut pas additionner : on passe par l'événement contraire « aucun succès »." }],
          hint: "Passe par l'événement contraire : aucun succès.",
          solution: [`p(aucun succès) = ${fr(round(1 - p, 2))}${pow("", n)}.`, `p(au moins un) = 1 − ${fr(round(1 - p, 2))}${pow("", n)} ≈ ${fr(round(res, 3))}.`],
          recap: `≈ ${fr(round(res, 3))}`,
          review: "Événement contraire",
          takeaway: "p(au moins un succès) = 1 − p(aucun succès) = 1 − (1 − p)ⁿ.",
        }),
        verify: () => {
          let atLeastOne = 0;
          for (let mask = 1; mask < 2 ** n; mask++) {
            const s = mask.toString(2).split("").filter((c) => c === "1").length;
            atLeastOne += p ** s * (1 - p) ** (n - s);
          }
          return close(atLeastOne, res);
        },
      };
    },
  }),

  /* ——— Maths expertes ——— */
  gen({
    id: "mex-cpx-produit", unit: U("Tle-maths-exp-complexes"), title: "Calculer avec des nombres complexes", stage: "application",
    make: (r, id) => {
      const a = r.int(-5, 5), b = r.nonZero(5), c = r.int(-5, 5), d = r.nonZero(5);
      const re = a * c - b * d, im = a * d + b * c;
      const z = (x: number, y: number) => `${x === 0 ? "" : fr(x)}${y < 0 ? (x === 0 ? "−" : " − ") : x === 0 ? "" : " + "}${Math.abs(y) === 1 ? "" : fr(Math.abs(y))}i`.replace(/^$/, "0");
      const show = (x: number, y: number) => (y === 0 ? fr(x) : z(x, y));
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "calculer",
          prompt: `Calcule (${z(a, b)})(${z(c, d)}).`,
          answer: { text: show(re, im), feedback: "On développe et on utilise i² = −1." },
          wrong: [
            { text: show(a * c + b * d, im), feedback: "i² = −1 : le produit des parties imaginaires change de signe." },
            { text: show(a * c, b * d), feedback: "Il faut développer complètement : (a + bi)(c + di) = ac + adi + bci + bdi²." },
            { text: show(re, a * d - b * c), feedback: "Vérifie la partie imaginaire : ad + bc." },
            { text: show(-re, im), feedback: "Vérifie la partie réelle : ac − bd." },
          ],
          hint: "Développe comme d'habitude, puis remplace i² par −1.",
          solution: [`(${z(a, b)})(${z(c, d)}) = ${fr(a * c)} + ${par(a * d)}i + ${par(b * c)}i + ${par(b * d)}i².`, `= ${show(re, im)}.`],
          takeaway: "(a + bi)(c + di) = (ac − bd) + (ad + bc)i, car i² = −1.",
        }),
        verify: () => {
          const mod2 = (x: number, y: number) => x * x + y * y;
          const turn = (t: number) => ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
          const angle = turn(Math.atan2(b, a) + Math.atan2(d, c)) - turn(Math.atan2(im, re));
          return mod2(re, im) === mod2(a, b) * mod2(c, d) && (re === 0 && im === 0 ? true : Math.abs(Math.sin(angle)) < 1e-9 && Math.cos(angle) > 0);
        },
      };
    },
  }),
  gen({
    id: "mex-cpx-module", unit: U("Tle-maths-exp-complexes"), title: "Module d'un nombre complexe", stage: "rappel",
    make: (r, id) => {
      const [p, q, h] = r.pick([[3, 4, 5], [5, 12, 13], [8, 6, 10], [6, 8, 10], [12, 5, 13], [1, 0, 1], [0, 7, 7]]);
      const sa = r.pick([-1, 1]), sb = r.pick([-1, 1]);
      const a = sa * p!, b = sb * q!;
      return {
        activity: ask({
          id, stage: "rappel", competence: "calculer",
          context: "Module d'un nombre complexe.",
          prompt: `Calcule le module de z = ${b === 0 ? fr(a) : `${a === 0 ? "" : fr(a)}${b < 0 ? (a === 0 ? "−" : " − ") : a === 0 ? "" : " + "}${Math.abs(b) === 1 ? "" : fr(Math.abs(b))}i`}.`,
          expected: h!,
          errors: [{ value: Math.abs(a) + Math.abs(b), code: "somme", message: "|a + bi| = √(a² + b²), pas |a| + |b|." }, { value: a * a + b * b, code: "racine", message: "N'oublie pas la racine carrée." }],
          hint: "|a + bi| = √(a² + b²).",
          solution: [`|z| = √(${par(a)}² + ${par(b)}²) = √${a * a + b * b} = ${h}.`],
          recap: `|z| = ${h}`,
          review: "Module",
          takeaway: "Le module |a + bi| = √(a² + b²) est la distance de l'origine au point d'affixe z.",
        }),
        verify: () => a * a + b * b === h! * h!,
      };
    },
  }),
  gen({
    id: "mex-ari-congruence", unit: U("Tle-maths-exp-arithmetique"), title: "Congruences et restes", stage: "application",
    make: (r, id) => {
      const m = r.pick([3, 4, 5, 7, 9, 10, 11]), a = r.int(2, 9), n = r.int(5, 40);
      let res = 1;
      for (let i = 0; i < n; i++) res = (res * a) % m;
      return {
        activity: ask({
          id, stage: "application", competence: "raisonner",
          context: "Calcul de reste avec les congruences.",
          prompt: `Quel est le reste de la division euclidienne de ${pow(a, n)} par ${m} ?`,
          expected: res,
          errors: [{ value: (a * n) % m, code: "produit", message: `${pow(a, n)} n'est pas ${a} × ${n} : on cherche la période des puissances de ${a} modulo ${m}.` }],
          hint: `Calcule ${a}¹, ${a}², ${a}³… modulo ${m} jusqu'à retrouver 1 (ou un cycle).`,
          solution: (() => {
            const seq: number[] = [];
            let v = 1;
            for (let i = 1; i <= 6; i++) { v = (v * a) % m; seq.push(v); }
            return [`Puissances de ${a} modulo ${m} : ${seq.join(", ")}…`, `${pow(a, n)} ≡ ${res} (mod ${m}).`];
          })(),
          recap: `Reste : ${res}`,
          review: "Congruences",
          takeaway: "Si a ≡ b (mod n), alors aᵏ ≡ bᵏ (mod n) : on cherche un cycle dans les puissances.",
        }),
        verify: () => Number(BigInt(a) ** BigInt(n) % BigInt(m)) === res,
      };
    },
  }),
  gen({
    id: "mex-ari-pgcd", unit: U("Tle-maths-exp-arithmetique"), title: "PGCD par l'algorithme d'Euclide", stage: "rappel",
    make: (r, id) => {
      const g = r.int(2, 30), p = r.int(2, 20), q = r.int(2, 20);
      const A = g * p, B = g * q;
      const real = gcd(A, B);
      return {
        activity: ask({
          id, stage: "rappel", competence: "calculer",
          context: "Algorithme d'Euclide.",
          prompt: `Calcule PGCD(${A}, ${B}).`,
          expected: real,
          hint: "PGCD(a, b) = PGCD(b, r) où r est le reste de a par b.",
          solution: (() => {
            const lines: string[] = [];
            let [x, y] = [Math.max(A, B), Math.min(A, B)];
            while (y) { lines.push(`${x} = ${y} × ${Math.floor(x / y)} + ${x % y}`); [x, y] = [y, x % y]; }
            return [...lines, `Le dernier reste non nul est ${real}.`];
          })(),
          recap: `PGCD = ${real}`,
          review: "Algorithme d'Euclide",
          takeaway: "Dans l'algorithme d'Euclide, le PGCD est le dernier reste non nul.",
        }),
        verify: () => A % real === 0 && B % real === 0 && gcd(A / real, B / real) === 1,
      };
    },
  }),
  gen({
    id: "mex-gra-degres", unit: U("Tle-maths-exp-graphes"), title: "Degrés et arêtes d'un graphe", stage: "application",
    make: (r, id) => {
      const n = r.int(4, 7);
      const edges = new Set<string>();
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (r.chance(0.5)) edges.add(`${i}-${j}`);
      if (edges.size === 0) edges.add("0-1");
      const deg = Array.from({ length: n }, (_, i) => [...edges].filter((e) => e.split("-").map(Number).includes(i)).length);
      const names = "ABCDEFG".slice(0, n).split("");
      const table = mockTable("Degré de chaque sommet", ["Sommet", ...names], [["Degré", ...deg.map(String)]]);
      return {
        activity: ask({
          id, stage: "application", competence: "raisonner",
          stimulus: table,
          context: "Le tableau donne le degré de chaque sommet d'un graphe simple non orienté.",
          prompt: "Combien ce graphe a-t-il d'arêtes ?",
          expected: edges.size,
          errors: [{ value: deg.reduce((a, b) => a + b, 0), code: "double", message: "Chaque arête relie deux sommets : elle est comptée deux fois dans la somme des degrés.", type: "conceptuelle" }],
          hint: "La somme des degrés vaut le double du nombre d'arêtes.",
          solution: [`Somme des degrés : ${deg.join(" + ")} = ${deg.reduce((a, b) => a + b, 0)}.`, `Nombre d'arêtes : ${deg.reduce((a, b) => a + b, 0)} ÷ 2 = ${edges.size}.`],
          recap: `${edges.size} arêtes`,
          review: "Lemme des poignées de main",
          takeaway: "Dans un graphe, la somme des degrés des sommets est égale au double du nombre d'arêtes.",
        }),
        verify: () => deg.reduce((a, b) => a + b, 0) === 2 * edges.size,
      };
    },
  }),
  gen({
    id: "mex-gra-matrice", unit: U("Tle-maths-exp-graphes"), title: "Compter des chemins avec une matrice", stage: "transfert",
    make: (r, id) => {
      const M = [[0, 1, 1], [1, 0, 1], [r.int(0, 1), 1, 0]];
      const i = r.int(0, 2), j = r.int(0, 2);
      let count = 0;
      for (let k = 0; k < 3; k++) count += M[i]![k]! * M[k]![j]!;
      const names = ["A", "B", "C"];
      return {
        activity: ask({
          id, stage: "transfert", competence: "raisonner",
          stimulus: mockTable("Matrice d'adjacence M (graphe orienté)", ["", ...names], M.map((row, k) => [names[k]!, ...row.map(String)])),
          context: "M est la matrice d'adjacence d'un graphe orienté : le coefficient ligne X, colonne Y vaut 1 s'il y a un arc de X vers Y.",
          prompt: `Combien de chemins de longueur 2 vont de ${names[i]} à ${names[j]} ?`,
          expected: count,
          hint: "Le nombre de chemins de longueur 2 est un coefficient de M².",
          solution: [`(M²) ligne ${names[i]}, colonne ${names[j]} = ${M[i]!.map((v, k) => `${v} × ${M[k]![j]}`).join(" + ")} = ${count}.`],
          recap: `${count} chemin${count > 1 ? "s" : ""}`,
          review: "Matrice d'adjacence",
          takeaway: "Le coefficient (i, j) de Mⁿ compte les chemins de longueur n de i à j.",
        }),
        verify: () => {
          let paths = 0;
          for (let k = 0; k < 3; k++) if (M[i]![k] && M[k]![j]) paths++;
          return paths === count;
        },
      };
    },
  }),
];
