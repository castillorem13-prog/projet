import { ask, gen, mcq, mockTable, problem } from "../build";
import { evaluate } from "../evaluate";
import { close, fr, frac, gcd, par, poly, pow, round, sub } from "../format";
import type { Generator } from "../types";

/**
 * Compléments de mathématiques de terminale : spécialité, mathématiques complémentaires et expertes.
 * Chaque contre-épreuve recalcule le résultat par un autre chemin (dérivée numérique, intégration approchée,
 * énumération, arithmétique exacte sur les grands entiers).
 */

/** Coefficient placé devant une expression : 1 ne s'écrit pas, −1 s'écrit « − ». */
const coef = (c: number) => (c === 1 ? "" : c === -1 ? "−" : fr(c));
const simp = (n: number, d: number) => {
  const g = gcd(n, d) || 1;
  return d / g === 1 ? fr(n / g) : frac(n / g, d / g);
};
/** Intégrale approchée par la méthode de Simpson (contre-épreuve des calculs exacts). */
function simpson(f: (x: number) => number, a: number, b: number, n = 400): number {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}
const deriv = (f: (x: number) => number, x: number, h = 1e-4) => (f(x + h) - f(x - h)) / (2 * h);
const deriv2 = (f: (x: number) => number, x: number, h = 1e-3) => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
const binom = (n: number, k: number) => {
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
  return Math.round(c);
};
const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};
const factor = (n: number) => {
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return `${d} × ${n / d}`;
  return String(n);
};
const pt3 = (x: number, y: number, z: number) => `(${fr(x)} ; ${fr(y)} ; ${fr(z)})`;

export const PLUS_TLE: Generator[] = [
  /* ——— Suites et limites ——— */
  gen({
    id: "mt-sui-geo-limite", unit: "Tle-maths-suites-limites", title: "Limite d'une suite géométrique", stage: "rappel",
    make: (r, id) => {
      const a = r.int(1, 9);
      const q = r.pick([0.2, 0.5, 0.8, 0.9, -0.5, -0.9, 1.5, 2, 3, -2, -3]);
      const kind = Math.abs(q) < 1 ? "0" : q > 1 ? "+∞" : "none";
      const choices = [
        { key: "0", text: "0", feedback: Math.abs(q) < 1 ? `−1 < ${fr(q)} < 1 : qⁿ tend vers 0, donc uₙ aussi.` : `${fr(q)} n'est pas compris entre −1 et 1 : qⁿ ne tend pas vers 0.` },
        { key: "+∞", text: "+∞", feedback: q > 1 ? `${fr(q)} > 1 et ${a} > 0 : uₙ tend vers +∞.` : "Une suite géométrique tend vers +∞ seulement si sa raison est strictement supérieure à 1 (et son premier terme positif)." },
        { key: "-∞", text: "−∞", feedback: "Le premier terme est positif : la suite ne peut pas tendre vers −∞." },
        { key: "none", text: "Elle n'a pas de limite", feedback: q <= -1 ? `La raison ${fr(q)} est inférieure à −1 : les termes changent de signe et leur distance à zéro grandit.` : "Cette suite a bien une limite." },
      ];
      const answer = choices.find((c) => c.key === kind)!;
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "raisonner",
          prompt: `La suite (uₙ) est définie par uₙ = ${a === 1 ? "" : `${a} × `}${par(q)}ⁿ. Quelle est sa limite ?`,
          answer: { text: answer.text, feedback: answer.feedback },
          wrong: choices.filter((c) => c !== answer).map((c) => ({ text: c.text, feedback: c.feedback })),
          hint: "Tout dépend de la position de la raison q par rapport à −1 et à 1.",
          hints: ["Si −1 < q < 1, qⁿ tend vers 0 ; si q > 1, qⁿ tend vers +∞ ; si q ≤ −1, qⁿ n'a pas de limite.", `Ici q = ${fr(q)}.`],
          solution: [`La raison vaut ${fr(q)}.`, kind === "0" ? "−1 < q < 1 : la suite tend vers 0." : kind === "+∞" ? "q > 1 et le premier terme est positif : la suite tend vers +∞." : "q < −1 : la suite n'a pas de limite."],
          takeaway: "Limite de qⁿ : 0 si −1 < q < 1, +∞ si q > 1, pas de limite si q ≤ −1.",
        }),
        verify: () => {
          const u = (n: number) => a * q ** n;
          if (kind === "0") return Math.abs(u(400)) < 1e-6;
          if (kind === "+∞") return u(60) > 1e9 && u(61) > u(60);
          return Math.sign(u(60)) !== Math.sign(u(61)) && Math.abs(u(61)) > 1e9;
        },
      };
    },
  }),
  gen({
    id: "mt-sui-seuil", unit: "Tle-maths-suites-limites", title: "Déterminer un rang à partir duquel une suite dépasse un seuil", stage: "transfert",
    make: (r, id) => {
      const a = r.pick([100, 200, 500, 1000]), q = r.pick([1.05, 1.1, 1.2, 1.5, 2]), m = r.pick([2, 3, 5, 10]);
      const S = a * m;
      let n = 0, u = a;
      while (u <= S) { u *= q; n++; }
      return {
        activity: ask({
          id, stage: "transfert", competence: "chercher",
          context: `Une suite géométrique (uₙ) a pour premier terme u₀ = ${fr(a)} et pour raison ${fr(q)}.`,
          prompt: `Quel est le plus petit entier n tel que uₙ > ${fr(S)} ?`,
          expected: n,
          errors: [{ value: n - 1, code: "large", message: `Pour n = ${n - 1}, uₙ ne dépasse pas encore ${fr(S)} : vérifie l'inégalité stricte.`, type: "procedurale" }],
          hint: "Calcule les termes successifs, ou résous l'inéquation avec le logarithme.",
          partHint: `Cherche n tel que ${fr(q)}ⁿ > ${fr(m)}.`,
          solution: [`uₙ = ${fr(a)} × ${fr(q)}ⁿ > ${fr(S)} équivaut à ${fr(q)}ⁿ > ${fr(m)}.`, `n > ln(${fr(m)}) ÷ ln(${fr(q)}) ≈ ${fr(round(Math.log(m) / Math.log(q), 2))}.`, `Le plus petit entier qui convient est ${n}.`],
          recap: `n = ${n}`,
          review: "Seuil d'une suite géométrique",
          takeaway: "qⁿ > m équivaut à n > ln(m) ÷ ln(q) quand q > 1 : on prend le premier entier qui convient.",
        }),
        verify: () => a * q ** (n - 1) <= S + 1e-9 && a * q ** n > S && n === Math.floor(Math.log(m) / Math.log(q) + 1e-12) + 1,
      };
    },
  }),

  /* ——— Limites de fonctions et continuité ——— */
  gen({
    id: "mt-con-limite-quotient", unit: "Tle-maths-continuite", title: "Limite en l'infini d'un quotient de polynômes", stage: "application",
    make: (r, id) => {
      const a = r.nonZero(9), d = r.pick([1, 2, 4, 5]), b = r.int(-9, 9), c = r.int(-9, 9), e = r.int(1, 9);
      const num = poly([[a, "x²"], [b, "x"], [c, ""]]), den = poly([[d, "x²"], [e, ""]]);
      const res = a / d;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `f est définie sur ℝ par f(x) = (${num}) ÷ (${den}).`,
          prompt: "Quelle est la limite de f(x) quand x tend vers +∞ ?",
          expected: res,
          errors: [...(d !== 1 ? [{ value: a, code: "denominateur", message: `Le terme dominant du dénominateur est ${poly([[d, "x²"]])} : on divise par ${d}.`, type: "procedurale" as const }] : []), ...(c !== 0 && !close(c / e, res) ? [{ value: c / e, code: "constantes", message: "En l'infini, ce sont les termes de plus haut degré qui l'emportent, pas les constantes.", type: "conceptuelle" as const }] : [])],
          hint: "En l'infini, un polynôme se comporte comme son terme de plus haut degré.",
          partHint: `Factorise x² au numérateur et au dénominateur.`,
          solution: [`f(x) = x²(${fr(a)} + …) ÷ x²(${fr(d)} + …).`, `La limite est ${fr(a)} ÷ ${fr(d)} = ${fr(res)}.`],
          recap: `Limite : ${fr(res)}`,
          review: "Limite d'un quotient",
          takeaway: "Pour un quotient de polynômes de même degré, la limite en l'infini est le quotient des coefficients dominants.",
        }),
        verify: () => close(evaluate(`(${num}) ÷ (${den})`, { x: 1e5 }), res, 1e-3),
      };
    },
  }),
  gen({
    id: "mt-con-tvi-nombre", unit: "Tle-maths-continuite", title: "Nombre de solutions avec le théorème des valeurs intermédiaires", stage: "application",
    make: (r, id) => {
      const a = r.int(-5, 0), b = a + r.int(2, 6);
      const up = r.chance(0.5);
      const lo = r.int(-9, 2), hi = lo + r.int(3, 12);
      const [fa, fb] = up ? [lo, hi] : [hi, lo];
      const k = r.chance(0.65) ? r.int(lo + 1, hi - 1) : r.chance(0.5) ? hi + r.int(1, 4) : lo - r.int(1, 4);
      const one = (fa - k) * (fb - k) < 0;
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "raisonner",
          prompt: `f est continue et strictement ${up ? "croissante" : "décroissante"} sur [${fr(a)} ; ${fr(b)}], avec f(${fr(a)}) = ${fr(fa)} et f(${fr(b)}) = ${fr(fb)}. Combien de solutions l'équation f(x) = ${fr(k)} a-t-elle sur cet intervalle ?`,
          answer: one ? { text: "Exactement une", feedback: `${fr(k)} est compris entre ${fr(fa)} et ${fr(fb)} et f est strictement monotone : une seule solution.` } : { text: "Aucune", feedback: `f prend ses valeurs entre ${fr(Math.min(fa, fb))} et ${fr(Math.max(fa, fb))} : ${fr(k)} n'est pas atteint.` },
          wrong: [
            one ? { text: "Aucune", feedback: `${fr(k)} est compris entre ${fr(fa)} et ${fr(fb)} : il est atteint, par le théorème des valeurs intermédiaires.` } : { text: "Exactement une", feedback: `${fr(k)} n'est pas compris entre ${fr(fa)} et ${fr(fb)}.` },
            { text: "Au moins deux", feedback: "Une fonction strictement monotone ne prend jamais deux fois la même valeur." },
            { text: "On ne peut pas conclure", feedback: "Continuité et stricte monotonie suffisent pour conclure." },
          ],
          hint: "Regarde si la valeur cherchée est comprise entre f(a) et f(b).",
          hints: ["Continue : toutes les valeurs entre f(a) et f(b) sont atteintes.", "Strictement monotone : chacune n'est atteinte qu'une fois."],
          solution: [`f(${fr(a)}) = ${fr(fa)} et f(${fr(b)}) = ${fr(fb)}.`, one ? `${fr(k)} est entre ces deux valeurs : une unique solution (corollaire du théorème des valeurs intermédiaires).` : `${fr(k)} n'est pas entre ces deux valeurs : aucune solution.`],
          takeaway: "Si f est continue et strictement monotone sur [a ; b], toute valeur comprise entre f(a) et f(b) est atteinte exactement une fois.",
        }),
        verify: () => {
          // Fonction affine qui respecte l'énoncé : son unique antécédent de k est-il dans ]a ; b[ ?
          const x = a + ((k - fa) * (b - a)) / (fb - fa);
          return one === (x > a && x < b) && k !== fa && k !== fb;
        },
      };
    },
  }),

  /* ——— Convexité ——— */
  gen({
    id: "mt-cvx-derivee-seconde", unit: "Tle-maths-convexite", title: "Calculer une dérivée seconde", stage: "application",
    make: (r, id) => {
      const a = r.nonZero(4), b = r.int(-6, 6), c = r.int(-9, 9), d = r.int(-9, 9), x0 = r.int(-3, 3);
      const f = poly([[a, "x³"], [b, "x²"], [c, "x"], [d, ""]]);
      const res = 6 * a * x0 + 2 * b;
      const first = 3 * a * x0 * x0 + 2 * b * x0 + c;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `f est définie sur ℝ par f(x) = ${f}.`,
          prompt: `Que vaut f″(${fr(x0)}) ?`,
          expected: res,
          errors: first !== res ? [{ value: first, code: "derivee_premiere", message: "C'est f′. Il faut dériver une seconde fois.", type: "procedurale" }] : [],
          hint: "Dérive deux fois de suite.",
          partHint: "Calcule d'abord f′(x), puis dérive-la à nouveau.",
          solution: [`f′(x) = ${poly([[3 * a, "x²"], [2 * b, "x"], [c, ""]])}.`, `f″(x) = ${poly([[6 * a, "x"], [2 * b, ""]])}.`, `f″(${fr(x0)}) = ${fr(res)}.`],
          recap: `f″(${fr(x0)}) = ${fr(res)}`,
          review: "Dérivée seconde",
          takeaway: "La dérivée seconde f″ est la dérivée de f′ ; son signe donne la convexité de f.",
        }),
        verify: () => Math.abs(deriv2((x) => evaluate(f, { x }), x0) - res) < 1e-3,
      };
    },
  }),
  gen({
    id: "mt-cvx-intervalle", unit: "Tle-maths-convexite", title: "Lire la convexité dans le signe de f″", stage: "rappel",
    make: (r, id) => {
      const a = r.nonZero(5), root = r.int(-6, 6);
      const second = poly([[a, "x"], [-a * root, ""]]);
      const right = a > 0 ? `[${fr(root)} ; +∞[` : `]−∞ ; ${fr(root)}]`;
      const other = a > 0 ? `]−∞ ; ${fr(root)}]` : `[${fr(root)} ; +∞[`;
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "raisonner",
          prompt: `f est deux fois dérivable sur ℝ et f″(x) = ${second}. Sur quel intervalle f est-elle convexe ?`,
          answer: { text: right, feedback: `f″(x) ≥ 0 sur ${right} : f y est convexe.` },
          wrong: [
            { text: other, feedback: `Sur ${other}, f″(x) ≤ 0 : f y est concave.` },
            { text: "ℝ", feedback: "f″ change de signe : f n'est pas convexe sur tout ℝ." },
            ...(root !== 0 ? [{ text: a > 0 ? `[${fr(-root)} ; +∞[` : `]−∞ ; ${fr(-root)}]`, feedback: `f″ s'annule en ${fr(root)}, pas en ${fr(-root)}.` }] : [{ text: "Aucun", feedback: "f″ est positive sur une demi-droite : f y est convexe." }]),
          ],
          hint: "f est convexe là où f″ est positive.",
          hints: [`Résous ${second} ≥ 0.`, `f″ s'annule en x = ${fr(root)}.`],
          solution: [`${second} ≥ 0 équivaut à x ${a > 0 ? "≥" : "≤"} ${fr(root)}.`, `f est convexe sur ${right}.`],
          takeaway: "f″ ≥ 0 : f convexe ; f″ ≤ 0 : f concave ; f″ change de signe : point d'inflexion.",
        }),
        verify: () => evaluate(second, { x: root + 1 }) * a > 0 && evaluate(second, { x: root }) === 0,
      };
    },
  }),

  /* ——— Logarithme ——— */
  gen({
    id: "mt-ln-seuil", unit: "Tle-maths-logarithme", title: "Résoudre une inéquation qⁿ > S avec le logarithme", stage: "transfert",
    make: (r, id) => {
      const q = r.pick([1.1, 1.5, 2, 3, 5]), S = r.pick([10, 50, 100, 1000, 5000, 10000, 1000000]);
      const n = Math.floor(Math.log(S) / Math.log(q)) + 1;
      return {
        activity: ask({
          id, stage: "transfert", competence: "calculer",
          context: `On cherche les entiers naturels n tels que ${fr(q)}ⁿ > ${fr(S)}.`,
          prompt: "Quel est le plus petit entier qui convient ?",
          expected: n,
          errors: [{ value: n - 1, code: "inegalite", message: `${fr(q)}${pow("", n - 1)} ne dépasse pas ${fr(S)} : prends l'entier suivant.`, type: "procedurale" }],
          hint: "La fonction ln est strictement croissante : on peut l'appliquer aux deux membres.",
          partHint: `n × ln(${fr(q)}) > ln(${fr(S)}).`,
          solution: [`n > ln(${fr(S)}) ÷ ln(${fr(q)}) ≈ ${fr(round(Math.log(S) / Math.log(q), 3))}.`, `Le plus petit entier qui convient est ${n}.`],
          recap: `n = ${n}`,
          review: "Inéquation et logarithme",
          takeaway: "Pour q > 1, qⁿ > S équivaut à n > ln(S) ÷ ln(q).",
        }),
        verify: () => q ** n > S && q ** (n - 1) <= S,
      };
    },
  }),
  gen({
    id: "mt-ln-derivee", unit: "Tle-maths-logarithme", title: "Nombre dérivé d'une fonction ln(ax + b)", stage: "application",
    make: (r, id) => {
      const a = r.int(1, 5), den = r.pick([1, 2, 4, 5, 8, 10]), x0 = r.int(-3, 4);
      const b = den - a * x0;
      const inside = poly([[a, "x"], [b, ""]]);
      const res = a / den;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `f est définie par f(x) = ln(${inside}) là où ${inside} > 0.`,
          prompt: `Que vaut f′(${fr(x0)}) ?`,
          expected: res,
          errors: a !== 1 ? [{ value: 1 / den, code: "facteur", message: `La dérivée de ln(u) est u′ ÷ u : n'oublie pas u′ = ${a}.`, type: "procedurale" }] : [],
          hint: "(ln u)′ = u′ ÷ u.",
          partHint: `u(x) = ${inside} et u′(x) = ${a}.`,
          solution: [`f′(x) = ${a} ÷ (${inside}).`, `f′(${fr(x0)}) = ${a} ÷ ${den} = ${fr(res)}.`],
          recap: `f′(${fr(x0)}) = ${fr(res)}`,
          review: "Dérivée de ln(u)",
          takeaway: "Si u est dérivable et strictement positive, (ln u)′ = u′ ÷ u.",
        }),
        verify: () => den > 0 && close(deriv((x) => Math.log(a * x + b), x0, 1e-6), res, 1e-5),
      };
    },
  }),

  /* ——— Primitives ——— */
  gen({
    id: "mt-pri-exp", unit: "Tle-maths-primitives", title: "Primitive d'une fonction exponentielle", stage: "rappel",
    make: (r, id) => {
      const a = r.pick([-4, -3, -2, 2, 3, 4, 5]), m = r.nonZero(5);
      const k = a * m;
      const ax = poly([[a, "x"]]);
      const E = (c: number) => `${coef(c)}e^(${ax})`;
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "calculer",
          prompt: `Quelle fonction est une primitive de f(x) = ${E(k)} sur ℝ ?`,
          answer: { text: `F(x) = ${E(m)}`, feedback: `F′(x) = ${fr(m)} × ${par(a)}e^(${ax}) = ${E(k)} : c'est bien f.` },
          wrong: [
            { text: `F(x) = ${E(k * a)}`, feedback: "C'est la dérivée de f, pas une primitive : on divise par le coefficient de x." },
            { text: `F(x) = ${E(k)}`, feedback: `Sa dérivée vaut ${E(k * a)}, pas f.` },
            { text: `F(x) = ${E(-m)}`, feedback: "Vérifie le signe : dérive ta réponse pour contrôler." },
          ],
          hint: "Une primitive de e^(ax) est e^(ax) ÷ a.",
          hints: [`Divise le coefficient ${fr(k)} par ${fr(a)}.`, "Contrôle en dérivant ta réponse."],
          solution: [`Une primitive de e^(${ax}) est e^(${ax}) ÷ ${par(a)}.`, `F(x) = ${fr(k)} ÷ ${par(a)} × e^(${ax}) = ${E(m)}.`],
          takeaway: "Pour a ≠ 0, x ↦ e^(ax) ÷ a est une primitive de x ↦ e^(ax).",
        }),
        verify: () => close(deriv((x) => m * Math.exp(a * x), 0.2, 1e-6), k * Math.exp(a * 0.2), 1e-5) && !close(deriv((x) => k * a * Math.exp(a * x), 0.2, 1e-6), k * Math.exp(a * 0.2), 1e-3),
      };
    },
  }),
  gen({
    id: "mt-pri-condition", unit: "Tle-maths-primitives", title: "Primitive vérifiant une condition", stage: "application",
    make: (r, id) => {
      const a = r.nonZero(4), b = r.int(-6, 6), k = r.int(-9, 9), x1 = r.int(-3, 4);
      const f = poly([[2 * a, "x"], [b, ""]]);
      const F = (x: number) => a * x * x + b * x + k;
      const res = F(x1);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `F est la primitive de f(x) = ${f} sur ℝ telle que F(0) = ${fr(k)}.`,
          prompt: `Que vaut F(${fr(x1)}) ?`,
          expected: res,
          errors: [...(res - k !== res ? [{ value: res - k, code: "constante", message: `N'oublie pas la constante : F(0) = ${fr(k)}.`, type: "procedurale" as const }] : []), ...(2 * a * x1 + b !== res ? [{ value: 2 * a * x1 + b, code: "image_f", message: "C'est f(x), pas F(x).", type: "conceptuelle" as const }] : [])],
          hint: "Cherche d'abord toutes les primitives, puis la constante avec F(0).",
          partHint: `Les primitives de f sont F(x) = ${poly([[a, "x²"], [b, "x"]])} + C.`,
          solution: [`F(x) = ${poly([[a, "x²"], [b, "x"]])} + C.`, `F(0) = C = ${fr(k)}.`, `F(${fr(x1)}) = ${fr(res)}.`],
          recap: `F(${fr(x1)}) = ${fr(res)}`,
          review: "Primitive et condition initiale",
          takeaway: "Deux primitives d'une même fonction diffèrent d'une constante, fixée par une condition comme F(0).",
        }),
        verify: () => Math.abs(k + simpson((x) => 2 * a * x + b, 0, x1) - res) < 1e-6,
      };
    },
  }),

  /* ——— Calcul intégral ——— */
  gen({
    id: "mt-int-moyenne", unit: "Tle-maths-integration", title: "Valeur moyenne d'une fonction", stage: "application",
    make: (r, id) => {
      const k = 3 * r.int(1, 3), m = r.int(-5, 5), c = r.int(1, 4);
      const f = poly([[k, "x²"], [m, ""]]);
      const integral = (k * c ** 3) / 3 + m * c;
      const res = integral / c;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `f est définie sur [0 ; ${c}] par f(x) = ${f}.`,
          prompt: `Quelle est la valeur moyenne de f sur [0 ; ${c}] ?`,
          expected: res,
          errors: [...(integral !== res ? [{ value: integral, code: "sans_division", message: `C'est l'intégrale. La valeur moyenne la divise par la longueur de l'intervalle, ${c}.`, type: "procedurale" as const }] : []), ...(k * c * c + m !== res ? [{ value: k * c * c + m, code: "image", message: "La valeur moyenne n'est pas l'image de la borne.", type: "conceptuelle" as const }] : [])],
          hint: "Valeur moyenne = (1 ÷ (b − a)) × intégrale de a à b.",
          partHint: `Une primitive de f est F(x) = ${poly([[k / 3, "x³"], [m, "x"]])}.`,
          solution: [`Intégrale : F(${c}) − F(0) = ${fr(integral)}.`, `Valeur moyenne : ${fr(integral)} ÷ ${c} = ${fr(res)}.`],
          recap: `Valeur moyenne : ${fr(res)}`,
          review: "Valeur moyenne",
          takeaway: "La valeur moyenne de f sur [a ; b] est l'intégrale de f divisée par b − a.",
        }),
        verify: () => Math.abs(simpson((x) => k * x * x + m, 0, c) / c - res) < 1e-8,
      };
    },
  }),
  gen({
    id: "mt-int-linearite", unit: "Tle-maths-integration", title: "Linéarité et relation de Chasles", stage: "rappel",
    make: (r, id) => {
      const p = r.int(-9, 12), q = r.int(-9, 12), al = r.pick([-3, -2, 2, 3, 4]), be = r.pick([-2, 1, 2, 3]);
      const chasles = r.chance(0.5);
      const res = chasles ? p + q : al * p + be * q;
      const lin = `${coef(al)}f(x) ${be < 0 ? "−" : "+"} ${Math.abs(be) === 1 ? "" : fr(Math.abs(be))}g(x)`;
      return {
        activity: ask({
          id, stage: "rappel", competence: "calculer",
          context: chasles ? `f est continue sur [0 ; 5]. L'intégrale de f de 0 à 2 vaut ${fr(p)} et celle de 2 à 5 vaut ${fr(q)}.` : `f et g sont continues sur [1 ; 4]. L'intégrale de f de 1 à 4 vaut ${fr(p)} et celle de g vaut ${fr(q)}.`,
          prompt: chasles ? "Que vaut l'intégrale de f de 0 à 5 ?" : `Que vaut l'intégrale de 1 à 4 de ${lin} ?`,
          expected: res,
          errors: chasles ? (p - q !== res ? [{ value: p - q, code: "soustraction", message: "Relation de Chasles : les intégrales sur des intervalles qui se suivent s'additionnent.", type: "procedurale" }] : []) : (al * p + q !== res ? [{ value: al * p + q, code: "coefficient", message: `Le coefficient ${fr(be)} multiplie aussi l'intégrale de g.`, type: "procedurale" }] : []),
          hint: chasles ? "Relation de Chasles : de 0 à 5, c'est de 0 à 2 puis de 2 à 5." : "Linéarité : l'intégrale d'une combinaison est la combinaison des intégrales.",
          partHint: chasles ? `Additionne ${fr(p)} et ${par(q)}.` : `Calcule ${fr(al)} × ${par(p)} + ${par(be)} × ${par(q)}.`,
          solution: [chasles ? `${fr(p)} + ${par(q)} = ${fr(res)}.` : `${fr(al)} × ${par(p)} + ${par(be)} × ${par(q)} = ${fr(res)}.`],
          recap: `Intégrale : ${fr(res)}`,
          review: chasles ? "Relation de Chasles" : "Linéarité de l'intégrale",
          takeaway: "Linéarité : ∫(αf + βg) = α∫f + β∫g. Chasles : ∫ de a à c = ∫ de a à b + ∫ de b à c.",
        }),
        verify: () => res === evaluate(chasles ? `${fr(p)} + ${par(q)}` : `${fr(al)} × ${par(p)} + ${par(be)} × ${par(q)}`),
      };
    },
  }),

  /* ——— Dénombrement ——— */
  gen({
    id: "mt-den-arrangements", unit: "Tle-maths-denombrement", title: "Compter des k-uplets d'éléments distincts", stage: "application",
    make: (r, id) => {
      const n = r.int(5, 10), k = r.int(2, 4);
      let res = 1;
      for (let i = 0; i < k; i++) res *= n - i;
      const [ctx, ask_] = r.pick([
        [`${n} coureurs participent à une course. On s'intéresse au classement des ${k} premiers (sans ex aequo).`, `Combien de classements des ${k} premiers sont possibles ?`],
        [`Un club de ${n} membres élit un bureau de ${k} personnes aux rôles différents (président, secrétaire${k > 2 ? ", trésorier" : ""}${k > 3 ? ", vice-président" : ""}).`, "Combien de bureaux différents peut-on former ?"],
        [`On forme un code de ${k} chiffres tous différents, choisis parmi ${n} touches.`, "Combien de codes sont possibles ?"],
      ] as const);
      return {
        activity: ask({
          id, stage: "application", competence: "modeliser",
          context: ctx,
          prompt: ask_,
          expected: res,
          errors: [{ value: binom(n, k), code: "ordre", message: "L'ordre compte ici : ce sont des k-uplets, pas des combinaisons.", type: "conceptuelle" }, { value: n ** k, code: "repetition", message: "Un même élément ne peut pas être choisi deux fois.", type: "conceptuelle" }],
          hint: "Compte les choix possibles place par place.",
          partHint: `${n} choix pour la première place, ${n - 1} pour la deuxième…`,
          solution: [`${Array.from({ length: k }, (_, i) => n - i).join(" × ")} = ${fr(res)}.`],
          recap: `${fr(res)} possibilités`,
          review: "k-uplets d'éléments distincts",
          takeaway: "Nombre de k-uplets d'éléments distincts d'un ensemble à n éléments : n × (n − 1) × … × (n − k + 1).",
        }),
        verify: () => {
          let count = 0;
          const walk = (used: number[]) => {
            if (used.length === k) { count++; return; }
            for (let i = 0; i < n; i++) if (!used.includes(i)) walk([...used, i]);
          };
          walk([]);
          return count === res;
        },
      };
    },
  }),
  gen({
    id: "mt-den-parties", unit: "Tle-maths-denombrement", title: "Compter des parties ou des mots", stage: "rappel",
    make: (r, id) => {
      const words = r.chance(0.5);
      const n = words ? r.pick([2, 3, 4, 10, 26]) : r.int(3, 12);
      const k = words ? r.int(2, n === 26 ? 3 : 5) : 0;
      const res = words ? n ** k : 2 ** n;
      return {
        activity: ask({
          id, stage: "rappel", competence: "calculer",
          context: words ? `On écrit des mots de ${k} lettres avec un alphabet de ${n} symboles ; un symbole peut être répété.` : `Un ensemble E contient ${n} éléments.`,
          prompt: words ? "Combien de mots différents peut-on écrire ?" : "Combien de parties (sous-ensembles) E possède-t-il, en comptant l'ensemble vide et E lui-même ?",
          expected: res,
          errors: words ? (n * k !== res ? [{ value: n * k, code: "produit", message: `Chaque lettre a ${n} choix : on multiplie ${k} fois ${n}.`, type: "conceptuelle" }] : []) : [{ value: 2 * n, code: "double", message: "Chaque élément est dans la partie ou non : on multiplie 2 par lui-même autant de fois qu'il y a d'éléments.", type: "conceptuelle" }],
          hint: words ? "Chaque position se remplit indépendamment des autres." : "Pour construire une partie, on décide pour chaque élément s'il en fait partie ou non.",
          partHint: words ? `${n} choix pour chacune des ${k} positions.` : `2 choix pour chacun des ${n} éléments.`,
          solution: [words ? `${n}${pow("", k)} = ${fr(res)}.` : `2${pow("", n)} = ${fr(res)}.`],
          recap: `${fr(res)}`,
          review: words ? "k-uplets avec répétition" : "Parties d'un ensemble",
          takeaway: "Un ensemble à n éléments a 2ⁿ parties ; il y a nᵏ k-uplets d'éléments d'un ensemble à n éléments.",
        }),
        verify: () => {
          if (!words) {
            let count = 0;
            for (let mask = 0; mask < 1 << n; mask++) count++;
            return count === res;
          }
          let count = 0;
          const walk = (len: number) => { if (len === k) { count++; return; } for (let i = 0; i < n; i++) walk(len + 1); };
          walk(0);
          return count === res;
        },
      };
    },
  }),

  /* ——— Géométrie dans l'espace ——— */
  gen({
    id: "mt-esp-plan", unit: "Tle-maths-espace", title: "Tester si un point appartient à un plan", stage: "application",
    make: (r, id) => {
      const a = r.nonZero(4), b = r.nonZero(4), c = r.nonZero(4);
      const shown = [r.int(-4, 4), r.int(-4, 4), r.int(-4, 4)] as const;
      const d = -(a * shown[0] + b * shown[1] + c * shown[2]);
      const eq = `${poly([[a, "x"], [b, "y"], [c, "z"], [d, ""]])} = 0`;
      const val = (x: number, y: number, z: number) => a * x + b * y + c * z + d;
      const wrongs: [number, number, number][] = [[shown[0] + 1, shown[1], shown[2]], [shown[0], shown[1] - 1, shown[2]], [shown[0], shown[1], shown[2] + 1]];
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "raisonner",
          prompt: `Lequel de ces points appartient au plan d'équation ${eq} ?`,
          answer: { text: pt3(shown[0], shown[1], shown[2]), feedback: `${fr(a)} × ${par(shown[0])} + ${par(b)} × ${par(shown[1])} + ${par(c)} × ${par(shown[2])} + ${par(d)} = 0.` },
          wrong: wrongs.map(([x, y, z]) => ({ text: pt3(x, y, z), feedback: `En remplaçant, on obtient ${fr(val(x, y, z))}, pas 0.` })),
          hint: "Remplace x, y et z par les coordonnées du point.",
          hints: ["Le point est dans le plan si le résultat vaut 0.", `Teste ${pt3(shown[0], shown[1], shown[2])}.`],
          solution: [`Pour ${pt3(shown[0], shown[1], shown[2])} : le premier membre vaut 0.`, "Les autres points donnent un résultat non nul."],
          takeaway: "Un point appartient au plan d'équation ax + by + cz + d = 0 si ses coordonnées vérifient l'équation.",
        }),
        verify: () => evaluate(poly([[a, "x"], [b, "y"], [c, "z"], [d, ""]]), { x: shown[0], y: shown[1], z: shown[2] }) === 0 && wrongs.every(([x, y, z]) => val(x, y, z) !== 0),
      };
    },
  }),
  gen({
    id: "mt-esp-distance", unit: "Tle-maths-espace", title: "Distance entre deux points de l'espace", stage: "rappel",
    make: (r, id) => {
      const [p, q, s, h] = r.pick([[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [2, 6, 9, 11], [4, 4, 7, 9], [3, 4, 12, 13], [2, 10, 11, 15], [6, 6, 7, 11], [1, 12, 12, 17], [8, 9, 12, 17]] as const);
      const d = r.shuffle([p, q, s]).map((v) => v * (r.chance(0.5) ? -1 : 1)) as [number, number, number];
      const A = [r.int(-5, 5), r.int(-5, 5), r.int(-5, 5)] as const;
      return {
        activity: ask({
          id, stage: "rappel", competence: "calculer",
          context: `Dans un repère orthonormé de l'espace, A${pt3(A[0], A[1], A[2])} et B${pt3(A[0] + d[0], A[1] + d[1], A[2] + d[2])}.`,
          prompt: "Quelle est la distance AB ?",
          expected: h,
          errors: [{ value: h * h, code: "racine", message: "C'est AB². Prends la racine carrée.", type: "procedurale" }, { value: Math.abs(d[0]) + Math.abs(d[1]) + Math.abs(d[2]), code: "somme", message: "On n'additionne pas les écarts : on additionne leurs carrés, puis on prend la racine.", type: "procedurale" }],
          hint: "AB = √((x_B − x_A)² + (y_B − y_A)² + (z_B − z_A)²).",
          partHint: `Les écarts valent ${fr(d[0])}, ${fr(d[1])} et ${fr(d[2])}.`,
          solution: [`AB² = ${par(d[0])}² + ${par(d[1])}² + ${par(d[2])}² = ${h * h}.`, `AB = ${h}.`],
          recap: `AB = ${h}`,
          review: "Distance dans l'espace",
          takeaway: "Dans un repère orthonormé de l'espace, AB² = (x_B − x_A)² + (y_B − y_A)² + (z_B − z_A)².",
        }),
        verify: () => close(Math.hypot(d[0], d[1], d[2]), h),
      };
    },
  }),

  /* ——— Loi binomiale ——— */
  gen({
    id: "mt-bin-variance", unit: "Tle-maths-binomiale", title: "Variance et écart type d'une loi binomiale", stage: "application",
    make: (r, id) => {
      const [n, p] = r.pick([[10, 0.5], [20, 0.5], [16, 0.5], [100, 0.5], [25, 0.2], [50, 0.2], [100, 0.1], [36, 0.5], [64, 0.5], [12, 0.25], [48, 0.25], [100, 0.2], [400, 0.5]] as const);
      const v = round(n * p * (1 - p), 6);
      return {
        activity: problem({
          id, stage: "application", competence: "calculer",
          context: `X suit la loi binomiale de paramètres n = ${n} et p = ${fr(p)}.`,
          hint: "V(X) = n × p × (1 − p).",
          takeaway: "Pour une loi binomiale : E(X) = np, V(X) = np(1 − p), σ(X) = √V(X).",
          parts: [
            { prompt: "Que vaut la variance V(X) ?", expected: v, errors: [{ value: n * p, code: "esperance", message: "C'est l'espérance. La variance vaut np(1 − p).", type: "conceptuelle" }], hint: `Calcule ${n} × ${fr(p)} × ${fr(1 - p)}.`, solution: [`V(X) = ${n} × ${fr(p)} × ${fr(1 - p)} = ${fr(v)}.`], recap: `V(X) = ${fr(v)}`, review: "Variance d'une loi binomiale" },
            { prompt: "Quel est son écart type, arrondi au centième ?", expected: round(Math.sqrt(v), 2), tolerance: { abs: 0.0051 }, hint: "L'écart type est la racine carrée de la variance.", solution: [`σ(X) = √${fr(v)} ≈ ${fr(round(Math.sqrt(v), 2))}.`], recap: `σ(X) ≈ ${fr(round(Math.sqrt(v), 2))}`, review: "Écart type" },
          ],
        }),
        verify: () => {
          let e = 0, e2 = 0;
          for (let k = 0; k <= n; k++) {
            const pk = binom(n, k) * p ** k * (1 - p) ** (n - k);
            e += k * pk;
            e2 += k * k * pk;
          }
          return close(e2 - e * e, v, 1e-6);
        },
      };
    },
  }),
  gen({
    id: "mt-bin-au-moins", unit: "Tle-maths-binomiale", title: "Probabilité d'obtenir au moins un succès", stage: "transfert",
    make: (r, id) => {
      const n = r.int(3, 12), p = r.pick([0.05, 0.1, 0.15, 0.2, 0.25, 0.3]);
      const res = round(1 - (1 - p) ** n, 3);
      const [ctx, what] = r.pick([["Un composant est défectueux avec la probabilité", "composants"], ["Un tir au but est réussi avec la probabilité", "tirs"], ["Une graine germe avec la probabilité", "graines"]] as const);
      return {
        activity: ask({
          id, stage: "transfert", competence: "modeliser",
          context: `${ctx} ${fr(p)}. On considère ${n} ${what}, de façon indépendante.`,
          prompt: "Quelle est la probabilité d'obtenir au moins un succès ? (arrondie au millième)",
          expected: res,
          tolerance: { abs: 0.0006 },
          errors: Math.abs(round((1 - p) ** n, 3) - res) > 0.002 ? [{ value: round((1 - p) ** n, 3), code: "complementaire", message: "C'est la probabilité de n'avoir aucun succès. On cherche son contraire.", type: "conceptuelle" }] : [],
          hint: "Passe par l'événement contraire : aucun succès.",
          partHint: `P(aucun succès) = ${fr(1 - p)}${pow("", n)}.`,
          solution: [`P(X = 0) = ${fr(1 - p)}${pow("", n)} ≈ ${fr(round((1 - p) ** n, 4))}.`, `P(X ≥ 1) = 1 − P(X = 0) ≈ ${fr(res)}.`],
          recap: `P(X ≥ 1) ≈ ${fr(res)}`,
          review: "Au moins un succès",
          takeaway: "P(X ≥ 1) = 1 − P(X = 0) = 1 − (1 − p)ⁿ.",
        }),
        verify: () => {
          let s = 0;
          for (let k = 1; k <= n; k++) s += binom(n, k) * p ** k * (1 - p) ** (n - k);
          return Math.abs(s - res) < 0.0006;
        },
      };
    },
  }),

  /* ——— Sommes de variables aléatoires ——— */
  gen({
    id: "mt-con-somme", unit: "Tle-maths-concentration", title: "Espérance et variance de aX + bY", stage: "application",
    make: (r, id) => {
      const ex = r.int(-5, 10), vx = r.int(1, 9), ey = r.int(-5, 10), vy = r.int(1, 9), a = r.pick([2, 3, -2, -1, 4]), b = r.pick([1, 2, -1, 3, -3]);
      const e = a * ex + b * ey, v = a * a * vx + b * b * vy;
      const comb = `${coef(a)}X ${b < 0 ? "−" : "+"} ${Math.abs(b) === 1 ? "" : fr(Math.abs(b))}Y`;
      return {
        activity: problem({
          id, stage: "application", competence: "calculer",
          context: `X et Y sont deux variables aléatoires indépendantes : E(X) = ${fr(ex)}, V(X) = ${vx}, E(Y) = ${fr(ey)}, V(Y) = ${vy}. On pose Z = ${comb}.`,
          hint: "L'espérance est linéaire ; la variance d'une somme de variables indépendantes est la somme des variances.",
          takeaway: "E(aX + bY) = aE(X) + bE(Y) ; si X et Y sont indépendantes, V(aX + bY) = a²V(X) + b²V(Y).",
          parts: [
            { prompt: "Que vaut E(Z) ?", expected: e, hint: `Calcule ${fr(a)} × ${par(ex)} + ${par(b)} × ${par(ey)}.`, solution: [`E(Z) = ${fr(a)} × ${par(ex)} + ${par(b)} × ${par(ey)} = ${fr(e)}.`], recap: `E(Z) = ${fr(e)}`, review: "Linéarité de l'espérance" },
            { prompt: "Que vaut V(Z) ?", expected: v, errors: [...(a * vx + b * vy !== v ? [{ value: a * vx + b * vy, code: "lineaire", message: "Les coefficients sont élevés au carré dans la variance.", type: "conceptuelle" as const }] : [])], hint: `Calcule ${par(a)}² × ${vx} + ${par(b)}² × ${vy}.`, solution: [`V(Z) = ${par(a)}² × ${vx} + ${par(b)}² × ${vy} = ${v}.`], recap: `V(Z) = ${v}`, review: "Variance d'une somme" },
          ],
        }),
        verify: () => v > 0 && v === a ** 2 * vx + b ** 2 * vy && e === evaluate(`${fr(a)} × ${par(ex)} + ${par(b)} × ${par(ey)}`),
      };
    },
  }),
  gen({
    id: "mt-con-moyenne", unit: "Tle-maths-concentration", title: "Variance de la moyenne d'un échantillon", stage: "rappel",
    make: (r, id) => {
      const s2 = r.pick([4, 9, 16, 25, 36, 100]), n = r.pick([2, 4, 5, 10, 20, 25, 50, 100]);
      const res = s2 / n;
      return {
        activity: ask({
          id, stage: "rappel", competence: "calculer",
          context: `X₁, …, X${sub(n)} sont ${n} variables aléatoires indépendantes de même loi, de variance ${s2}. On note Mₙ leur moyenne.`,
          prompt: "Que vaut la variance de Mₙ ?",
          expected: res,
          errors: [{ value: s2, code: "meme", message: "La moyenne fluctue moins qu'une seule variable : sa variance est divisée par n.", type: "conceptuelle" }, { value: s2 / (n * n), code: "carre", message: "La variance de la moyenne vaut V ÷ n, pas V ÷ n².", type: "procedurale" }],
          hint: "V(Mₙ) = V(X) ÷ n.",
          partHint: `Divise ${s2} par ${n}.`,
          solution: [`V(Mₙ) = ${s2} ÷ ${n} = ${fr(res)}.`],
          recap: `V(Mₙ) = ${fr(res)}`,
          review: "Moyenne d'un échantillon",
          takeaway: "La moyenne de n variables indépendantes de même loi a la même espérance et une variance divisée par n.",
        }),
        verify: () => close(res * n, s2),
      };
    },
  }),

  /* ——— Maths complémentaires ——— */
  gen({
    id: "mco-dis-recurrence", unit: "Tle-maths-comp-modeles-discrets", title: "Calculer les termes d'une suite uₙ₊₁ = a uₙ + b", stage: "application",
    make: (r, id) => {
      const a = r.pick([0.5, 0.8, 0.9, 1.1, 1.2, 2]), b = r.int(-20, 40), u0 = r.int(10, 200);
      const u1 = round(a * u0 + b, 6), u2 = round(a * u1 + b, 6), u3 = round(a * u2 + b, 6);
      const [ctx] = r.pick([["Chaque année, une population est multipliée par"], ["Chaque mois, un stock est multiplié par"], ["Chaque semaine, le nombre d'abonnés est multiplié par"]] as const);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `${ctx} ${fr(a)}, puis on ${b >= 0 ? "ajoute" : "retire"} ${Math.abs(b)}. On pose u₀ = ${u0} et uₙ₊₁ = ${fr(a)}uₙ ${b >= 0 ? "+" : "−"} ${Math.abs(b)}.`,
          prompt: "Que vaut u₃ ?",
          expected: u3,
          errors: [{ value: u2, code: "rang", message: "C'est u₂ : il faut encore appliquer la relation une fois.", type: "procedurale" }],
          hint: "Calcule u₁, puis u₂, puis u₃.",
          partHint: `u₁ = ${fr(a)} × ${u0} ${b >= 0 ? "+" : "−"} ${Math.abs(b)} = ${fr(u1)}.`,
          solution: [`u₁ = ${fr(u1)}.`, `u₂ = ${fr(a)} × ${par(u1)} ${b >= 0 ? "+" : "−"} ${Math.abs(b)} = ${fr(u2)}.`, `u₃ = ${fr(a)} × ${par(u2)} ${b >= 0 ? "+" : "−"} ${Math.abs(b)} = ${fr(u3)}.`],
          recap: `u₃ = ${fr(u3)}`,
          review: "Suite arithmético-géométrique",
          takeaway: "Une relation uₙ₊₁ = a uₙ + b se calcule de proche en proche, à partir du premier terme.",
        }),
        verify: () => close(a ** 3 * u0 + b * (a * a + a + 1), u3, 1e-9),
      };
    },
  }),
  gen({
    id: "mco-con-demi-vie", unit: "Tle-maths-comp-modeles-continus", title: "Temps de demi-vie d'une décroissance exponentielle", stage: "application",
    make: (r, id) => {
      const k = r.pick([0.01, 0.02, 0.04, 0.05, 0.08, 0.1, 0.2, 0.25, 0.5]), q0 = r.pick([100, 200, 500, 1000]);
      const t = round(Math.log(2) / k, 1);
      const [what, unit] = r.pick([["La masse d'un médicament dans le sang", "heures"], ["L'activité d'un échantillon radioactif", "années"], ["La température d'écart avec la pièce", "minutes"]] as const);
      return {
        activity: ask({
          id, stage: "application", competence: "modeliser",
          context: `${what} vaut Q(t) = ${q0}e^(${fr(-k)}t), t en ${unit}.`,
          prompt: `Au bout de combien de ${unit} a-t-elle diminué de moitié ? (arrondi au dixième)`,
          expected: t,
          tolerance: { abs: 0.051 },
          errors: [{ value: round(1 / (2 * k), 1), code: "inverse", message: "Résous e^(−kt) = 1/2 avec le logarithme : t = ln 2 ÷ k.", type: "procedurale" }],
          hint: "Résous Q(t) = Q(0) ÷ 2.",
          partHint: `e^(${fr(-k)}t) = 1/2, donc ${fr(-k)}t = −ln 2.`,
          solution: [`${q0}e^(${fr(-k)}t) = ${q0 / 2} équivaut à e^(${fr(-k)}t) = 1/2.`, `t = ln 2 ÷ ${fr(k)} ≈ ${fr(t)}.`],
          recap: `Demi-vie ≈ ${fr(t)} ${unit}`,
          review: "Demi-vie",
          takeaway: "Pour Q(t) = Q₀e^(−kt), la demi-vie vaut ln 2 ÷ k : elle ne dépend pas de Q₀.",
        }),
        verify: () => Math.abs(t - Math.log(2) / k) <= 0.05 && close(q0 * Math.exp(-k * (Math.log(2) / k)), q0 / 2),
      };
    },
  }),
  gen({
    id: "mco-con-croissance", unit: "Tle-maths-comp-modeles-continus", title: "Calculer une valeur d'un modèle exponentiel", stage: "rappel",
    make: (r, id) => {
      const q0 = r.pick([50, 100, 200, 500, 1000]), k = r.pick([0.02, 0.03, 0.05, 0.1, 0.15]), t = r.pick([2, 5, 8, 10, 20]);
      const res = round(q0 * Math.exp(k * t), 1);
      return {
        activity: ask({
          id, stage: "rappel", competence: "calculer",
          context: `Une population de bactéries est modélisée par N(t) = ${q0}e^(${fr(k)}t), t en heures.`,
          prompt: `Que vaut N(${t}) ? (arrondi au dixième)`,
          expected: res,
          tolerance: { abs: 0.051 },
          hint: "Remplace t par sa valeur, puis calcule à la calculatrice.",
          partHint: `Calcule ${q0} × e^(${fr(round(k * t, 4))}).`,
          solution: [`N(${t}) = ${q0} × e^(${fr(k)} × ${t}) = ${q0} × e^(${fr(round(k * t, 4))}) ≈ ${fr(res)}.`],
          recap: `N(${t}) ≈ ${fr(res)}`,
          review: "Modèle exponentiel",
          takeaway: "Dans N(t) = N₀e^(kt), N₀ est la valeur initiale et k le taux de croissance instantané.",
        }),
        verify: () => Math.abs(q0 * Math.exp(k * t) - res) <= 0.05,
      };
    },
  }),
  gen({
    id: "mco-pro-uniforme", unit: "Tle-maths-comp-proba", title: "Loi uniforme sur un intervalle", stage: "application",
    make: (r, id) => {
      const a = r.int(0, 10), L = r.pick([2, 4, 5, 8, 10, 20]), b = a + L;
      const c = a + r.int(0, L - 1), d = c + r.int(1, b - c);
      const res = (d - c) / L;
      const [ctx] = r.pick([["Le temps d'attente d'un bus, en minutes,"], ["L'heure d'arrivée d'un colis, en heures après 8 h,"], ["La durée d'un appel, en minutes,"]] as const);
      return {
        activity: problem({
          id, stage: "application", competence: "modeliser",
          context: `${ctx} suit la loi uniforme sur [${a} ; ${b}].`,
          hint: "Pour une loi uniforme, la probabilité est proportionnelle à la longueur de l'intervalle.",
          takeaway: `Loi uniforme sur [a ; b] : P(c ≤ X ≤ d) = (d − c) ÷ (b − a) et E(X) = (a + b) ÷ 2.`,
          parts: [
            { prompt: `Quelle est la probabilité que X soit compris entre ${c} et ${d} ?`, expected: res, errors: [{ value: d - c, code: "longueur", message: `Divise la longueur ${d - c} par la longueur totale ${L}.`, type: "procedurale" }], hint: `Longueur favorable : ${d - c} ; longueur totale : ${L}.`, solution: [`P(${c} ≤ X ≤ ${d}) = (${d} − ${c}) ÷ (${b} − ${a}) = ${fr(res)}.`], recap: `P = ${fr(res)}`, review: "Loi uniforme" },
            { prompt: "Quelle est l'espérance de X ?", expected: (a + b) / 2, errors: [{ value: L, code: "longueur", message: "L'espérance est le milieu de l'intervalle, pas sa longueur.", type: "conceptuelle" }], hint: "L'espérance est au milieu de l'intervalle.", solution: [`E(X) = (${a} + ${b}) ÷ 2 = ${fr((a + b) / 2)}.`], recap: `E(X) = ${fr((a + b) / 2)}`, review: "Espérance d'une loi uniforme" },
          ],
        }),
        verify: () => close(simpson(() => 1 / L, c, d, 10), res) && close(simpson((x) => x / L, a, b, 10), (a + b) / 2),
      };
    },
  }),

  /* ——— Maths expertes ——— */
  gen({
    id: "mex-cpx-conjugue", unit: "Tle-maths-exp-complexes", title: "Produit d'un complexe par son conjugué", stage: "application",
    make: (r, id) => {
      const a = r.nonZero(9), b = r.nonZero(9);
      const z = poly([[a, ""], [b, "i"]]);
      const res = a * a + b * b;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `On donne z = ${z}. On note z̄ son conjugué.`,
          prompt: "Que vaut z × z̄ ?",
          expected: res,
          errors: [{ value: a * a - b * b, code: "signe", message: "i × (−i) = −i² = 1 : les deux carrés s'additionnent.", type: "procedurale" }],
          hint: "z × z̄ = a² + b², où a et b sont les parties réelle et imaginaire.",
          partHint: `z̄ = ${poly([[a, ""], [-b, "i"]])}.`,
          solution: [`z × z̄ = (${z})(${poly([[a, ""], [-b, "i"]])}) = ${par(a)}² + ${par(b)}².`, `= ${res}.`],
          recap: `z × z̄ = ${res}`,
          review: "Conjugué d'un complexe",
          takeaway: "Pour z = a + ib, z × z̄ = a² + b² = |z|² : c'est un réel positif.",
        }),
        verify: () => a * a - b * -b === res,
      };
    },
  }),
  gen({
    id: "mex-cpx-carre", unit: "Tle-maths-exp-complexes", title: "Carré d'un nombre complexe", stage: "rappel",
    make: (r, id) => {
      const a = r.nonZero(6), b = r.nonZero(6);
      const re = a * a - b * b, im = 2 * a * b;
      const z = poly([[a, ""], [b, "i"]]);
      return {
        activity: problem({
          id, stage: "rappel", competence: "calculer",
          context: `On donne z = ${z}.`,
          hint: "Développe (a + ib)² en utilisant i² = −1.",
          takeaway: "(a + ib)² = a² − b² + 2abi.",
          parts: [
            { prompt: "Quelle est la partie réelle de z² ?", expected: re, errors: [...(a * a + b * b !== re ? [{ value: a * a + b * b, code: "i_carre", message: "i² = −1 : le carré de ib vaut −b².", type: "procedurale" as const }] : [])], hint: "Partie réelle : a² − b².", solution: [`${par(a)}² − ${par(b)}² = ${fr(re)}.`], recap: `Re(z²) = ${fr(re)}`, review: "Calcul dans ℂ" },
            { prompt: "Quelle est la partie imaginaire de z² ?", expected: im, errors: [...(a * b !== im ? [{ value: a * b, code: "double", message: "Le double produit vaut 2ab.", type: "procedurale" as const }] : [])], hint: "Partie imaginaire : 2ab.", solution: [`2 × ${par(a)} × ${par(b)} = ${fr(im)}.`], recap: `Im(z²) = ${fr(im)}`, review: "Calcul dans ℂ" },
          ],
        }),
        verify: () => {
          // Produit (a + ib)(a + ib) calculé composante par composante.
          const x = a * a - b * b, y = a * b + b * a;
          return x === re && y === im;
        },
      };
    },
  }),
  gen({
    id: "mex-ari-dernier-chiffre", unit: "Tle-maths-exp-arithmetique", title: "Dernier chiffre d'une grande puissance", stage: "transfert",
    make: (r, id) => {
      const a = r.int(2, 9), n = r.int(10, 99);
      const cycle: number[] = [];
      let x = a % 10;
      while (!cycle.includes(x)) { cycle.push(x); x = (x * a) % 10; }
      const res = cycle[(n - 1) % cycle.length]!;
      return {
        activity: ask({
          id, stage: "transfert", competence: "chercher",
          context: `On s'intéresse à l'entier ${a}${pow("", n)}.`,
          prompt: "Quel est son chiffre des unités ?",
          expected: res,
          ...((a * n) % 10 !== res ? { errors: [{ value: (a * n) % 10, code: "produit", message: `On cherche ${a}${pow("", n)} modulo 10, pas ${a} × ${n}.`, type: "conceptuelle" as const }] } : {}),
          hint: "Travaille modulo 10 et cherche une période dans les restes.",
          partHint: `Les derniers chiffres des puissances de ${a} : ${cycle.join(", ")}, puis cela recommence.`,
          solution: [`Les restes modulo 10 des puissances de ${a} se répètent avec une période ${cycle.length} : ${cycle.join(", ")}.`, `${n} = ${cycle.length} × ${Math.floor((n - 1) / cycle.length)} + ${((n - 1) % cycle.length) + 1}, donc le chiffre des unités est ${res}.`],
          recap: `Chiffre des unités : ${res}`,
          review: "Congruences et puissances",
          takeaway: "Les restes des puissances d'un entier modulo n finissent toujours par se répéter : on exploite cette période.",
        }),
        verify: () => Number(BigInt(a) ** BigInt(n) % BigInt(10)) === res,
      };
    },
  }),
  gen({
    id: "mex-ari-premier", unit: "Tle-maths-exp-arithmetique", title: "Reconnaître un nombre premier", stage: "rappel",
    make: (r, id) => {
      const primes = [53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149];
      const tricky = [51, 57, 87, 91, 111, 117, 119, 121, 133, 143, 161, 169, 187, 203, 209, 217, 221];
      const p = r.pick(primes);
      const wrong = r.sample(tricky, 3);
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "raisonner",
          prompt: "Lequel de ces nombres est premier ?",
          answer: { text: String(p), feedback: `${p} n'est divisible par aucun nombre premier inférieur ou égal à √${p} ≈ ${fr(round(Math.sqrt(p), 1))}.` },
          wrong: wrong.map((w) => ({ text: String(w), feedback: `${w} = ${factor(w)} : il n'est pas premier.` })),
          hint: "Teste la divisibilité par les nombres premiers 2, 3, 5, 7, 11, 13.",
          hints: ["Il suffit de tester les diviseurs premiers inférieurs ou égaux à la racine carrée du nombre.", "Pense aux pièges : 91 = 7 × 13, 51 = 3 × 17."],
          solution: [...wrong.map((w) => `${w} = ${factor(w)}.`), `${p} est premier.`],
          takeaway: "Un entier n ≥ 2 est premier s'il n'a aucun diviseur premier inférieur ou égal à √n.",
        }),
        verify: () => isPrime(p) && wrong.every((w) => !isPrime(w)),
      };
    },
  }),
  gen({
    id: "mex-gra-euler", unit: "Tle-maths-exp-graphes", title: "Chaîne et cycle eulériens", stage: "application",
    make: (r, id) => {
      const n = r.int(5, 7);
      const names = "ABCDEFG".slice(0, n).split("");
      // Graphe connexe : un arbre couvrant, puis quelques arêtes en plus, sans arête en double.
      const edges: [number, number][] = [];
      const has = (u: number, v: number) => edges.some(([x, y]) => (x === u && y === v) || (x === v && y === u));
      for (let i = 1; i < n; i++) edges.push([r.int(0, i - 1), i]);
      const extra = r.int(1, 4);
      for (let k = 0; k < extra; k++) {
        const u = r.int(0, n - 1), v = r.int(0, n - 1);
        if (u !== v && !has(u, v)) edges.push([u, v]);
      }
      const deg = names.map((_, i) => edges.filter(([x, y]) => x === i || y === i).length);
      const odd = deg.filter((d) => d % 2 === 1).length;
      const verdict = odd === 0 ? "cycle" : odd === 2 ? "chaine" : "aucune";
      const options = {
        cycle: { text: "Il admet un cycle eulérien", feedback: "Tous les sommets sont de degré pair : le graphe connexe admet un cycle eulérien." },
        chaine: { text: "Il admet une chaîne eulérienne, mais pas de cycle eulérien", feedback: "Exactement deux sommets sont de degré impair : une chaîne eulérienne relie ces deux sommets." },
        aucune: { text: "Il n'admet ni chaîne ni cycle eulériens", feedback: `${odd} sommets sont de degré impair : c'est plus que deux.` },
      };
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "raisonner",
          stimulus: mockTable("Degrés des sommets d'un graphe connexe", ["Sommet", ...names], [["Degré", ...deg.map(String)]]),
          prompt: "Que peut-on dire de ce graphe connexe ?",
          answer: options[verdict],
          wrong: (Object.keys(options) as (keyof typeof options)[]).filter((k) => k !== verdict).map((k) => ({ text: options[k].text, feedback: `Compte les sommets de degré impair : il y en a ${odd}.` })),
          hint: "Compte les sommets de degré impair.",
          hints: ["Théorème d'Euler : 0 sommet impair, cycle eulérien ; 2 sommets impairs, chaîne eulérienne.", `Degrés : ${deg.join(", ")}.`],
          solution: [`Sommets de degré impair : ${odd}.`, options[verdict].feedback],
          takeaway: "Un graphe connexe admet un cycle eulérien si tous ses sommets sont de degré pair, une chaîne eulérienne s'il en a 0 ou 2 de degré impair.",
        }),
        verify: () => deg.reduce((s, d) => s + d, 0) === 2 * edges.length && odd % 2 === 0,
      };
    },
  }),
];
