import { ask, gen, mcq, mcqNumber, mockCode, mockTable, problem } from "../build";
import { evaluate, sameExpression } from "../evaluate";
import { close, fr, frac, gcd, par, poly, round } from "../format";
import type { Generator } from "../types";

/** Mathématiques, seconde générale et technologique (programme 2019, automatismes 2023). */

const U = (slug: string) => `2nde-maths-${slug}`;
const pt = (a: number, b: number) => `(${fr(a)} ; ${fr(b)})`;
/** Intervalle écrit à la française : « [−2 ; 5[ ». */
const interval = (a: number | null, b: number | null, closedA: boolean, closedB: boolean) =>
  `${a === null ? "]−∞" : closedA ? `[${fr(a)}` : `]${fr(a)}`} ; ${b === null ? "+∞[" : closedB ? `${fr(b)}]` : `${fr(b)}[`}`;

export const MATHS_2NDE: Generator[] = [
  /* ——— Logique ——— */
  gen({
    id: "m2-log-contre-exemple", unit: U("logique"), title: "Trouver un contre-exemple", stage: "transfert",
    make: (r, id) => {
      const claims: { text: string; test: (x: number) => boolean; bad: number[]; good: number[] }[] = [
        { text: "pour tout réel x, x² ≥ x", test: (x) => x * x >= x, bad: [0.5, 0.25, 0.8], good: [2, -1, 3, 0, 1, -4] },
        { text: "pour tout réel x, 2x > x", test: (x) => 2 * x > x, bad: [-1, 0, -3], good: [1, 4, 0.5, 10] },
        { text: "pour tout réel x, √(x²) = x", test: (x) => Math.sqrt(x * x) === x, bad: [-2, -5, -1], good: [0, 3, 1, 7] },
        { text: "pour tout réel x non nul, 1/x < 1", test: (x) => 1 / x < 1, bad: [0.5, 1, 0.25], good: [2, -1, 5, -3] },
        { text: "pour tout réel x, x³ ≥ x²", test: (x) => x ** 3 >= x * x, bad: [0.5, -1, -2], good: [2, 1, 0, 3] },
      ];
      const c = r.pick(claims);
      const bad = r.pick(c.bad);
      const goods = r.sample(c.good, 3);
      return {
        activity: mcq(r, {
          id, stage: "transfert", competence: "raisonner",
          prompt: `On affirme : « ${c.text} ». Quelle valeur de x est un contre-exemple ?`,
          answer: { text: `x = ${fr(bad)}`, feedback: `Pour x = ${fr(bad)}, l'affirmation est fausse : un seul contre-exemple suffit à la réfuter.` },
          wrong: goods.map((g) => ({ text: `x = ${fr(g)}`, feedback: `Pour x = ${fr(g)}, l'affirmation est vraie : ce n'est pas un contre-exemple.` })),
          hint: "Teste chaque valeur dans l'affirmation : laquelle la rend fausse ?",
          solution: [`Pour x = ${fr(bad)}, l'affirmation « ${c.text} » est fausse.`, "Une affirmation universelle est réfutée par un seul contre-exemple."],
          takeaway: "Pour montrer qu'une affirmation « pour tout x » est fausse, il suffit d'un contre-exemple.",
        }),
        verify: () => !c.test(bad) && goods.every(c.test),
      };
    },
  }),

  /* ——— Nombres ——— */
  gen({
    id: "m2-nb-ensemble", unit: U("nombres"), title: "Le plus petit ensemble de nombres", stage: "rappel",
    make: (r, id) => {
      const kinds: [string, string, string][] = [
        [String(r.int(2, 50)), "ℕ", "C'est un entier naturel."],
        [fr(-r.int(1, 50)), "ℤ", "C'est un entier négatif : il est dans ℤ mais pas dans ℕ."],
        [fr(r.int(1, 99) / 4 + (r.chance(0.5) ? 0.25 : 0.75) - 0.25 * 0), "𝔻", "Il s'écrit avec un nombre fini de chiffres après la virgule : c'est un décimal."],
        [`${r.pick([1, 2, 4, 5, 7])}/${r.pick([3, 7, 9, 11])}`, "ℚ", "C'est un quotient d'entiers qui n'est pas décimal (son dénominateur irréductible contient d'autres facteurs que 2 et 5)."],
        [r.pick(["√2", "√3", "π", "√5"]), "ℝ", "Ce nombre est irrationnel : il n'est pas un quotient d'entiers."],
      ];
      let k = r.int(0, 4);
      let [shown, set, why] = kinds[k]!;
      if (k === 2 && Number.isInteger(evaluate(shown))) { k = 0; [shown, set, why] = kinds[0]!; }
      if (k === 3) {
        const [a, b] = shown.split("/").map(Number) as [number, number];
        if (gcd(a, b) !== 1 || a % b === 0) { shown = `1/${b}`; }
      }
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "communiquer",
          prompt: `Quel est le plus petit ensemble de nombres auquel appartient ${shown} ?`,
          answer: { text: set, feedback: why },
          wrong: ["ℕ", "ℤ", "𝔻", "ℚ", "ℝ"].filter((s) => s !== set).slice(0, 3).map((s) => ({ text: s, feedback: s === "ℝ" ? "Il est bien réel, mais il appartient à un ensemble plus petit." : `Rappel : ℕ ⊂ ℤ ⊂ 𝔻 ⊂ ℚ ⊂ ℝ. Regarde si ${shown} est dans ${s}.` })),
          hint: "ℕ ⊂ ℤ ⊂ 𝔻 ⊂ ℚ ⊂ ℝ : cherche le plus petit qui convient.",
          solution: [`${shown} : ${why}`],
          takeaway: "ℕ (entiers naturels) ⊂ ℤ (entiers relatifs) ⊂ 𝔻 (décimaux) ⊂ ℚ (rationnels) ⊂ ℝ (réels).",
        }),
        verify: () => {
          if (set === "ℝ") return true;
          const v = evaluate(shown);
          if (set === "ℕ") return Number.isInteger(v) && v >= 0;
          if (set === "ℤ") return Number.isInteger(v) && v < 0;
          if (set === "𝔻") return !Number.isInteger(v) && Number.isInteger(v * 10000);
          const [a, b] = shown.split("/").map(Number) as [number, number];
          let d = b / gcd(a, b);
          while (d % 2 === 0) d /= 2;
          while (d % 5 === 0) d /= 5;
          return d > 1;
        },
      };
    },
  }),
  gen({
    id: "m2-nb-diviseurs", unit: U("nombres"), title: "Compter les diviseurs d'un entier", stage: "application",
    make: (r, id) => {
      const n = r.pick([12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48, 50, 54, 60, 63, 72, 84, 90, 96, 100]);
      const divs = Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
      return {
        activity: ask({
          id, stage: "application", competence: "chercher",
          context: `On cherche tous les diviseurs positifs de ${n}.`,
          prompt: `Combien ${n} a-t-il de diviseurs positifs ?`,
          expected: divs.length,
          errors: [{ value: divs.length - 2, code: "bornes", message: `1 et ${n} sont aussi des diviseurs de ${n}.` }, { value: divs.length / 2, code: "paires", message: "Tu as compté des paires : chaque paire contient deux diviseurs." }],
          hint: `Cherche les paires : 1 × ${n}, 2 × …, en t'arrêtant à √${n}.`,
          solution: [`Diviseurs de ${n} : ${divs.join(", ")}.`, `Il y en a ${divs.length}.`],
          recap: `${divs.length} diviseurs`,
          review: "Diviseurs d'un entier",
          takeaway: "On trouve les diviseurs par paires (d × n/d) en testant les entiers jusqu'à √n.",
        }),
        verify: () => divs.every((d) => n % d === 0) && divs.length === new Set(divs).size && divs.includes(1) && divs.includes(n),
      };
    },
  }),
  gen({
    id: "m2-nb-intervalle", unit: U("nombres"), title: "Traduire une inégalité en intervalle", stage: "rappel",
    make: (r, id) => {
      const a = r.int(-9, 4), b = a + r.int(2, 9);
      const kind = r.int(0, 3);
      const ineq = [`${fr(a)} ≤ x < ${fr(b)}`, `${fr(a)} < x ≤ ${fr(b)}`, `x ≥ ${fr(a)}`, `x < ${fr(b)}`][kind]!;
      const right = [interval(a, b, true, false), interval(a, b, false, true), interval(a, null, true, false), interval(null, b, false, false)][kind]!;
      const test = (x: number) => [a <= x && x < b, a < x && x <= b, x >= a, x < b][kind]!;
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "communiquer",
          prompt: `Quel intervalle correspond à ${ineq} ?`,
          answer: { text: right, feedback: "Le crochet est tourné vers le nombre quand celui-ci est compris, à l'opposé sinon ; l'infini est toujours ouvert." },
          wrong: [
            { text: [interval(a, b, false, true), interval(a, b, true, false), interval(a, null, false, false), interval(null, b, false, true)][kind]!, feedback: "Regarde si chaque borne est atteinte (≤, ≥) ou non (<, >)." },
            { text: [interval(a, b, true, true), interval(a, b, false, false), interval(null, a, false, true), interval(b, null, false, false)][kind]!, feedback: kind >= 2 ? "Vérifie le sens de l'inégalité." : "Une des bornes n'est pas atteinte." },
            { text: [interval(a, b, false, false), interval(a, b, true, true), interval(null, a, false, false), interval(b, null, true, false)][kind]!, feedback: "Vérifie le crochet de chaque borne et le sens de l'inégalité." },
          ],
          hint: "≤ ou ≥ : crochet fermé (tourné vers le nombre). < ou > : crochet ouvert.",
          solution: [`${ineq} ⟺ x ∈ ${right}.`],
          takeaway: "Un crochet fermé inclut la borne, un crochet ouvert l'exclut ; en ±∞ le crochet est toujours ouvert.",
        }),
        verify: () => test(a + 0.5) && (kind === 3 ? !test(b) : kind === 2 ? test(a) : true) && (kind === 0 ? test(a) && !test(b) : kind === 1 ? !test(a) && test(b) : true),
      };
    },
  }),

  /* ——— Calcul algébrique ——— */
  gen({
    id: "m2-cal-inequation", unit: U("calcul"), title: "Résoudre une inéquation du premier degré", stage: "application",
    make: (r, id) => {
      const a = r.nonZero(6), x0 = r.int(-6, 6), b = r.nonZero(10);
      const c = a * x0 + b;
      const strict = r.chance(0.5);
      const lhs = poly([[a, "x"], [b, ""]]);
      const op = strict ? "<" : "≤";
      // ax + b < c ⟺ ax < c − b ⟺ x < x0 si a > 0, x > x0 si a < 0.
      const right = a > 0 ? interval(null, x0, false, !strict) : interval(x0, null, !strict, false);
      const wrongSide = a > 0 ? interval(x0, null, !strict, false) : interval(null, x0, false, !strict);
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "calculer",
          prompt: `Résous dans ℝ : ${lhs} ${op} ${fr(c)}`,
          answer: { text: `S = ${right}`, feedback: a < 0 ? `On divise par ${fr(a)}, un nombre négatif : le sens de l'inégalité change.` : `On divise par ${fr(a)}, positif : le sens est conservé.` },
          wrong: [
            { text: `S = ${wrongSide}`, feedback: a < 0 ? "En divisant par un nombre négatif, il faut changer le sens de l'inégalité." : "Le sens ne change que si l'on multiplie ou divise par un nombre négatif." },
            { text: `S = ${a > 0 ? interval(null, x0, false, strict) : interval(x0, null, strict, false)}`, feedback: "Regarde si la borne est atteinte : < est strict, ≤ ne l'est pas." },
            { text: `S = ${a > 0 ? interval(null, (c + b) / a, false, !strict) : interval((c + b) / a, null, !strict, false)}`, feedback: `Pour isoler ${poly([[a, "x"]])}, on soustrait ${fr(b)} aux deux membres.` },
          ],
          hint: "Isole le terme en x, puis divise par son coefficient ; attention à son signe.",
          solution: [`${poly([[a, "x"]])} ${op} ${fr(c)} ${b > 0 ? "−" : "+"} ${fr(Math.abs(b))} = ${fr(c - b)}`, `x ${a > 0 ? op : op === "<" ? ">" : "≥"} ${fr(x0)}`, `S = ${right}`],
          takeaway: "Multiplier ou diviser les deux membres d'une inéquation par un nombre négatif change le sens de l'inégalité.",
        }),
        verify: () => {
          const holds = (x: number) => (strict ? a * x + b < c : a * x + b <= c);
          const inS = (x: number) => (a > 0 ? (strict ? x < x0 : x <= x0) : (strict ? x > x0 : x >= x0));
          return [-20, -7.5, x0 - 1, x0 - 0.5, x0, x0 + 0.5, x0 + 1, 13].every((x) => holds(x) === inS(x));
        },
      };
    },
  }),
  gen({
    id: "m2-cal-developper", unit: U("calcul"), title: "Développer et réduire", stage: "application",
    make: (r, id) => {
      const a = r.int(1, 4), b = r.nonZero(6), c = r.int(1, 4), d = r.nonZero(6), k = r.nonZero(3);
      const expr = `(${poly([[a, "x"], [b, ""]])})(${poly([[c, "x"], [d, ""]])}) ${k < 0 ? "−" : "+"} ${Math.abs(k) === 1 ? "" : Math.abs(k)}x`.replace(/ \+ x$/, " + x");
      const answer = poly([[a * c, "x²"], [a * d + b * c + k, "x"], [b * d, ""]]);
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "calculer",
          prompt: `Développe et réduis : ${expr}`,
          answer: { text: answer, feedback: "Double distributivité, puis on regroupe les termes en x." },
          wrong: [
            { text: poly([[a * c, "x²"], [a * d + b * c, "x"], [b * d, ""]]), feedback: "N'oublie pas le dernier terme en x." },
            { text: poly([[a * c, "x²"], [b * d + k, "x"]]), feedback: "Il manque les produits croisés." },
            { text: poly([[a * c, "x²"], [a * d + b * c - k, "x"], [b * d, ""]]), feedback: "Vérifie le signe du terme ajouté." },
            { text: poly([[a * c, "x²"], [a * d + b * c + k, "x"], [-b * d, ""]]), feedback: "Vérifie le signe du produit des deux constantes." },
          ],
          hint: "(a + b)(c + d) = ac + ad + bc + bd.",
          solution: [`On développe le produit, on ajoute ${k < 0 ? "−" : "+"} ${Math.abs(k) === 1 ? "" : Math.abs(k)}x et on regroupe : ${answer}.`],
          takeaway: "Développer puis réduire : on distribue, puis on regroupe les termes de même degré.",
        }),
        verify: () => sameExpression(expr, answer),
      };
    },
  }),

  /* ——— Fonctions ——— */
  gen({
    id: "m2-fon-extremum", unit: U("fonctions"), title: "Extremum d'une fonction du second degré", stage: "application",
    make: (r, id) => {
      const a = r.nonZero(3), h = r.int(-5, 5), k = r.int(-9, 9);
      const f = `${a === 1 ? "" : a === -1 ? "−" : fr(a)}(x ${h < 0 ? "+" : "−"} ${Math.abs(h)})²${k === 0 ? "" : ` ${k < 0 ? "−" : "+"} ${Math.abs(k)}`}`.replace(/\(x [+−] 0\)/, "x");
      const kind = a > 0 ? "minimum" : "maximum";
      return {
        activity: problem({
          id, stage: "application", competence: "raisonner",
          context: `On considère f(x) = ${f}, définie sur ℝ.`,
          hint: "Un carré est toujours positif ou nul.",
          takeaway: "f(x) = a(x − h)² + k : extremum k atteint en x = h (minimum si a > 0, maximum si a < 0).",
          parts: [
            { prompt: `f admet un ${kind}. Pour quelle valeur de x ?`, expected: h, errors: [{ value: -h, code: "signe", message: `(x − h)² s'annule pour x = h : ici h = ${fr(h)}.` }], hint: "Pour quelle valeur de x le carré s'annule-t-il ?", solution: [`(x ${h < 0 ? "+" : "−"} ${Math.abs(h)})² = 0 pour x = ${fr(h)}.`], recap: `x = ${fr(h)}`, review: "Abscisse de l'extremum" },
            { prompt: `Quelle est la valeur de ce ${kind} ?`, expected: k, hint: `Calcule f(${fr(h)}).`, solution: [`f(${fr(h)}) = ${fr(a)} × 0 ${k < 0 ? "−" : "+"} ${Math.abs(k)} = ${fr(k)}.`, a > 0 ? "Pour tout x, a(x − h)² ≥ 0, donc f(x) ≥ k." : "Pour tout x, a(x − h)² ≤ 0, donc f(x) ≤ k."], recap: `${kind} : ${fr(k)}`, review: "Valeur de l'extremum" },
          ],
        }),
        verify: () => evaluate(f, { x: h }) === k && [-3, -1, 1, 2.5].every((t) => (a > 0 ? evaluate(f, { x: h + t }) > k : evaluate(f, { x: h + t }) < k)),
      };
    },
  }),
  gen({
    id: "m2-fon-signe", unit: U("fonctions"), title: "Signe d'une fonction affine", stage: "rappel",
    make: (r, id) => {
      const a = r.nonZero(5), x0 = r.int(-6, 6), b = -a * x0;
      const f = poly([[a, "x"], [b, ""]]);
      const pos = a > 0 ? interval(x0, null, false, false) : interval(null, x0, false, false);
      const neg = a > 0 ? interval(null, x0, false, false) : interval(x0, null, false, false);
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "raisonner",
          prompt: `Sur quel intervalle f(x) = ${f} est-elle strictement positive ?`,
          answer: { text: pos, feedback: `f s'annule en ${fr(x0)} et a = ${fr(a)} est ${a > 0 ? "positif : f est négative puis positive" : "négatif : f est positive puis négative"}.` },
          wrong: [
            { text: neg, feedback: `Le signe dépend de a = ${fr(a)} : ${a > 0 ? "a > 0, f est croissante." : "a < 0, f est décroissante."}` },
            { text: a > 0 ? interval(-x0, null, false, false) : interval(null, -x0, false, false), feedback: `f s'annule pour ${f} = 0, soit x = ${fr(x0)}.` },
            { text: a > 0 ? interval(x0, null, true, false) : interval(null, x0, false, true), feedback: `En x = ${fr(x0)}, f(x) = 0 : ce n'est pas strictement positif.` },
          ],
          hint: "Cherche où f s'annule, puis utilise le signe du coefficient directeur.",
          solution: [`${f} = 0 ⟺ x = ${fr(x0)}.`, `a = ${fr(a)} ${a > 0 ? "> 0" : "< 0"}, donc f(x) > 0 sur ${pos}.`],
          takeaway: "ax + b est du signe de a à droite de sa racine −b/a, du signe contraire à gauche.",
        }),
        verify: () => evaluate(f, { x: x0 }) === 0 && evaluate(f, { x: x0 + (a > 0 ? 1 : -1) }) > 0,
      };
    },
  }),

  /* ——— Vecteurs ——— */
  gen({
    id: "m2-vec-coordonnees", unit: U("vecteurs"), title: "Coordonnées d'un vecteur et d'un milieu", stage: "application",
    make: (r, id) => {
      const xA = r.int(-8, 8), yA = r.int(-8, 8), xB = r.int(-8, 8), yB = r.int(-8, 8);
      return {
        activity: problem({
          id, stage: "application", competence: "calculer",
          context: `Dans un repère, A${pt(xA, yA)} et B${pt(xB, yB)}.`,
          hint: "Coordonnées de AB→ : (xB − xA ; yB − yA).",
          takeaway: "AB→ (xB − xA ; yB − yA) ; milieu de [AB] : ((xA + xB)/2 ; (yA + yB)/2).",
          parts: [
            { prompt: "Abscisse du vecteur AB→ ?", expected: xB - xA, errors: [{ value: xA - xB, code: "ordre", message: "C'est l'arrivée moins le départ : xB − xA." }], hint: `${fr(xB)} − ${par(xA)}.`, solution: [`xB − xA = ${fr(xB)} − ${par(xA)} = ${fr(xB - xA)}.`], recap: `x = ${fr(xB - xA)}`, review: "Coordonnées d'un vecteur" },
            { prompt: "Ordonnée du vecteur AB→ ?", expected: yB - yA, errors: [{ value: yA - yB, code: "ordre", message: "C'est l'arrivée moins le départ : yB − yA." }], hint: `${fr(yB)} − ${par(yA)}.`, solution: [`yB − yA = ${fr(yB - yA)}.`], recap: `y = ${fr(yB - yA)}`, review: "Coordonnées d'un vecteur" },
            { prompt: "Abscisse du milieu de [AB] ?", expected: (xA + xB) / 2, errors: [{ value: (xB - xA) / 2, code: "diff", message: "Le milieu est la moyenne des abscisses : on additionne." }], hint: "Moyenne des deux abscisses.", solution: [`(${fr(xA)} + ${par(xB)}) ÷ 2 = ${fr((xA + xB) / 2)}.`], recap: `x milieu = ${fr((xA + xB) / 2)}`, review: "Milieu d'un segment" },
          ],
        }),
        verify: () => xA + (xB - xA) === xB && yA + (yB - yA) === yB,
      };
    },
  }),
  gen({
    id: "m2-vec-colineaires", unit: U("vecteurs"), title: "Tester la colinéarité", stage: "transfert",
    make: (r, id) => {
      const x = r.nonZero(6), y = r.nonZero(6), k = r.pick([-3, -2, 2, 3, 0.5, -0.5]);
      const col = r.chance(0.5);
      const x2 = k * x, y2 = col ? k * y : k * y + r.pick([-1, 1]);
      const det = x * y2 - y * x2;
      return {
        activity: mcq(r, {
          id, stage: "transfert", competence: "raisonner",
          prompt: `Les vecteurs u→${pt(x, y)} et v→${pt(x2, y2)} sont-ils colinéaires ?`,
          answer: col ? { text: "Oui, leur déterminant est nul", feedback: `det = ${fr(x)} × ${par(y2)} − ${par(y)} × ${par(x2)} = 0.` } : { text: "Non, leur déterminant n'est pas nul", feedback: `det = ${fr(x)} × ${par(y2)} − ${par(y)} × ${par(x2)} = ${fr(det)} ≠ 0.` },
          wrong: [
            col ? { text: "Non, leur déterminant n'est pas nul", feedback: "Calcule xy' − yx' : il vaut 0." } : { text: "Oui, leur déterminant est nul", feedback: `Calcule xy' − yx' : il vaut ${fr(det)}.` },
            { text: "Oui, car leurs abscisses sont proportionnelles", feedback: "Il faut que les deux coordonnées soient multipliées par le même nombre." },
            { text: "On ne peut pas le savoir sans figure", feedback: "Le calcul du déterminant suffit." },
          ],
          hint: "u→(x ; y) et v→(x' ; y') sont colinéaires si xy' − yx' = 0.",
          solution: [`det(u→, v→) = ${fr(x)} × ${par(y2)} − ${par(y)} × ${par(x2)} = ${fr(det)}.`, col ? "Il est nul : les vecteurs sont colinéaires." : "Il n'est pas nul : ils ne sont pas colinéaires."],
          takeaway: "Deux vecteurs sont colinéaires si et seulement si leur déterminant xy' − yx' est nul.",
        }),
        verify: () => close(det, 0) === col,
      };
    },
  }),

  /* ——— Droites et systèmes ——— */
  gen({
    id: "m2-dro-equation", unit: U("reperee"), title: "Équation réduite d'une droite", stage: "application",
    make: (r, id) => {
      const m = r.nonZero(4), p = r.int(-6, 6), x1 = r.int(-4, 1), x2 = x1 + r.int(1, 4);
      const y1 = m * x1 + p, y2 = m * x2 + p;
      const eq = `y = ${poly([[m, "x"], [p, ""]])}`;
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "calculer",
          prompt: `Quelle est l'équation réduite de la droite passant par A${pt(x1, y1)} et B${pt(x2, y2)} ?`,
          answer: { text: eq, feedback: `m = (${fr(y2)} − ${par(y1)}) ÷ (${fr(x2)} − ${par(x1)}) = ${fr(m)}, puis p = ${fr(y1)} − ${par(m)} × ${par(x1)} = ${fr(p)}.` },
          wrong: [
            { text: `y = ${poly([[-m, "x"], [p, ""]])}`, feedback: "Vérifie le signe du coefficient directeur : la droite monte-t-elle ou descend-elle ?" },
            { text: `y = ${poly([[m, "x"], [-p, ""]])}`, feedback: "Remplace x par l'abscisse de A : trouves-tu son ordonnée ?" },
            { text: `y = ${poly([[(x2 - x1) / (y2 - y1), "x"], [p, ""]])}`, feedback: "m = Δy ÷ Δx, pas Δx ÷ Δy." },
            { text: `y = ${poly([[m, "x"], [p + 1, ""]])}`, feedback: "Vérifie avec le point A." },
          ],
          hint: "Calcule le coefficient directeur m = (yB − yA) ÷ (xB − xA), puis p avec un point.",
          solution: [`m = ${fr(y2 - y1)} ÷ ${x2 - x1} = ${fr(m)}.`, `p = yA − m × xA = ${fr(p)}.`, `${eq}.`],
          takeaway: "Droite non verticale : y = mx + p, avec m = Δy/Δx et p trouvé grâce à un point.",
        }),
        verify: () => evaluate(poly([[m, "x"], [p, ""]]), { x: x1 }) === y1 && evaluate(poly([[m, "x"], [p, ""]]), { x: x2 }) === y2,
      };
    },
  }),
  gen({
    id: "m2-dro-systeme", unit: U("reperee"), title: "Résoudre un système de deux équations", stage: "transfert",
    make: (r, id) => {
      const x = r.int(-6, 9), y = r.int(-6, 9);
      const a = r.int(1, 5), b = r.int(1, 5), c = r.int(1, 5), d = -r.int(1, 5);
      const e1 = a * x + b * y, e2 = c * x + d * y;
      return {
        activity: problem({
          id, stage: "transfert", competence: "calculer",
          context: `Résous le système : ${poly([[a, "x"], [b, "y"]])} = ${fr(e1)} et ${poly([[c, "x"], [d, "y"]])} = ${fr(e2)}.`,
          hint: "Par combinaison : multiplie les équations pour éliminer une inconnue.",
          takeaway: "Un système de deux équations linéaires se résout par substitution ou par combinaison ; on vérifie dans les deux équations.",
          parts: [
            { prompt: "Valeur de x ?", expected: x, hint: `Élimine y : multiplie la 1re par ${Math.abs(d)} et la 2e par ${b}, puis additionne.`, solution: [`${Math.abs(d)} × (1) + ${b} × (2) : ${a * Math.abs(d) + b * c}x = ${Math.abs(d) * e1 + b * e2}.`, `x = ${fr(x)}.`], recap: `x = ${fr(x)}`, review: "Système : première inconnue" },
            { prompt: "Valeur de y ?", expected: y, hint: "Remplace x dans une des équations.", solution: [`${b}y = ${fr(e1)} − ${a} × ${par(x)} = ${fr(e1 - a * x)}, donc y = ${fr(y)}.`], recap: `y = ${fr(y)}`, review: "Système : seconde inconnue" },
          ],
        }),
        verify: () => a * x + b * y === e1 && c * x + d * y === e2 && a * d - b * c !== 0,
      };
    },
  }),

  /* ——— Statistiques ——— */
  gen({
    id: "m2-sta-croise", unit: U("stats"), title: "Fréquence conditionnelle dans un tableau croisé", stage: "application",
    make: (r, id) => {
      const [a, b, c, d] = [r.int(5, 60), r.int(5, 60), r.int(5, 60), r.int(5, 60)].map((v) => v * 2) as [number, number, number, number];
      const rowA = a + b;
      const table = mockTable("Pratique sportive selon le niveau", ["", "Sport en club", "Pas de club", "Total"], [["Seconde", String(a), String(b), String(rowA)], ["Première", String(c), String(d), String(c + d)], ["Total", String(a + c), String(b + d), String(a + b + c + d)]]);
      const f = a / rowA;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          stimulus: table,
          context: "Le tableau croise le niveau des élèves et leur pratique sportive.",
          prompt: "Parmi les élèves de seconde, quelle est la fréquence de ceux qui font du sport en club ? (en %, arrondi à l'unité)",
          expected: Math.round(f * 100),
          tolerance: { abs: 0.5 },
          errors: [{ value: Math.round((a / (a + c)) * 100), code: "colonne", message: "On se restreint aux élèves de seconde : on divise par le total de la ligne « Seconde ».", type: "conceptuelle" }, { value: Math.round((a / (a + b + c + d)) * 100), code: "total", message: "C'est une fréquence conditionnelle : on divise par l'effectif des secondes, pas par le total général." }],
          hint: "Restreins-toi à la ligne « Seconde ».",
          solution: [`${a} ÷ ${rowA} ≈ ${fr(round(f, 3))}, soit environ ${Math.round(f * 100)} %.`],
          recap: `≈ ${Math.round(f * 100)} %`,
          review: "Fréquence conditionnelle",
          takeaway: "Fréquence conditionnelle : on divise par l'effectif du sous-groupe considéré, pas par l'effectif total.",
        }),
        verify: () => table.kind === "table" && Number(table.rows[0]![1]) + Number(table.rows[0]![2]) === Number(table.rows[0]![3]) && close(Number(table.rows[0]![1]) / Number(table.rows[0]![3]), f),
      };
    },
  }),

  /* ——— Probabilités ——— */
  gen({
    id: "m2-pro-loi", unit: U("proba"), title: "Compléter une loi de probabilité", stage: "application",
    make: (r, id) => {
      const ps = [r.int(1, 30), r.int(1, 30), r.int(1, 25)];
      const last = 100 - ps.reduce((a, b) => a + b, 0);
      const all = [...ps, last];
      const k = r.int(0, 3);
      const shown = all.map((p, i) => (i === k ? "?" : fr(p / 100)));
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          stimulus: mockTable("Loi de probabilité", ["Issue", "A", "B", "C", "D"], [["Probabilité", ...shown]]),
          context: "On a la loi de probabilité d'une expérience à quatre issues.",
          prompt: "Quelle est la probabilité manquante ?",
          expected: all[k]! / 100,
          errors: [{ value: 1 - all[(k + 1) % 4]! / 100, code: "une", message: "On soustrait à 1 la somme de toutes les autres probabilités." }],
          hint: "La somme des probabilités de toutes les issues vaut 1.",
          solution: [`1 − (${all.filter((_, i) => i !== k).map((p) => fr(p / 100)).join(" + ")}) = ${fr(all[k]! / 100)}.`],
          recap: `p = ${fr(all[k]! / 100)}`,
          review: "Loi de probabilité",
          takeaway: "Dans une loi de probabilité, chaque probabilité est entre 0 et 1, et leur somme vaut 1.",
        }),
        verify: () => last > 0 && close(all.reduce((s, p) => s + p / 100, 0), 1),
      };
    },
  }),
  gen({
    id: "m2-pro-union", unit: U("proba"), title: "Probabilité d'une réunion", stage: "transfert",
    make: (r, id) => {
      const pa = r.int(2, 6) / 10, pb = r.int(2, 6) / 10;
      const pab = r.int(Math.max(0, Math.round((pa + pb - 1) * 10)), Math.round(Math.min(pa, pb) * 10) - 1) / 10;
      const res = round(pa + pb - pab, 2);
      return {
        activity: ask({
          id, stage: "transfert", competence: "raisonner",
          context: `Pour deux événements A et B : p(A) = ${fr(pa)}, p(B) = ${fr(pb)} et p(A ∩ B) = ${fr(pab)}.`,
          prompt: "Calcule p(A ∪ B).",
          expected: res,
          errors: [{ value: round(pa + pb, 2), code: "intersection", message: "Les issues de A ∩ B sont comptées deux fois : on soustrait p(A ∩ B).", type: "conceptuelle" }],
          hint: "p(A ∪ B) = p(A) + p(B) − p(A ∩ B).",
          solution: [`p(A ∪ B) = ${fr(pa)} + ${fr(pb)} − ${fr(pab)} = ${fr(res)}.`],
          recap: `p(A ∪ B) = ${fr(res)}`,
          review: "Probabilité d'une réunion",
          takeaway: "p(A ∪ B) = p(A) + p(B) − p(A ∩ B) ; si A et B sont incompatibles, p(A ∩ B) = 0.",
        }),
        verify: () => res <= 1 && close(res + pab, pa + pb),
      };
    },
  }),

  /* ——— Algorithmique ——— */
  gen({
    id: "m2-alg-fonction", unit: U("algo"), title: "Suivre une fonction Python", stage: "application",
    make: (r, id) => {
      const n = r.int(3, 12), a = r.int(1, 3);
      const kind = r.int(0, 1);
      const code = kind === 0
        ? ["def somme(n):", "    s = 0", "    for k in range(1, n + 1):", `        s = s + ${a === 1 ? "k" : `${a} * k`}`, "    return s", "", `print(somme(${n}))`]
        : ["def compte(n):", "    c = 0", "    while n > 1:", "        n = n // 2", "        c = c + 1", "    return c", "", `print(compte(${n * 8}))`];
      let res = 0;
      if (kind === 0) for (let k = 1; k <= n; k++) res += a * k;
      else for (let m = n * 8; m > 1; m = Math.floor(m / 2)) res++;
      return {
        activity: ask({
          id, stage: "application", competence: "raisonner",
          stimulus: mockCode("Programme", code),
          context: "Voici une fonction écrite en Python.",
          prompt: "Qu'affiche ce programme ?",
          expected: res,
          errors: kind === 0 ? [{ value: res - a * n, code: "borne", message: `range(1, n + 1) va jusqu'à n inclus : ${n} est compris.`, type: "procedurale" }] : [{ value: res + 1, code: "tour", message: "La boucle s'arrête dès que n vaut 1.", type: "procedurale" }],
          hint: kind === 0 ? "range(1, n + 1) donne 1, 2, …, n." : "Divise par 2 (division entière) et compte les tours tant que n > 1.",
          solution: kind === 0 ? [`s = ${a === 1 ? "" : `${a} × (`}1 + 2 + … + ${n}${a === 1 ? "" : ")"} = ${res}.`] : [`On divise ${n * 8} par 2 jusqu'à obtenir 1 : ${res} tours.`],
          recap: `Affiche ${res}`,
          review: "Boucles en Python",
          takeaway: kind === 0 ? "range(a, b) parcourt les entiers de a à b − 1." : "Une boucle while s'exécute tant que sa condition est vraie.",
        }),
        verify: () => (kind === 0 ? res === (a * n * (n + 1)) / 2 : 2 ** res <= n * 8 && n * 8 < 2 ** (res + 1)),
      };
    },
  }),

  /* ——— Automatismes ——— */
  gen({
    id: "m2-aut-evolutions", unit: U("automatismes"), title: "Évolutions successives", stage: "rappel",
    make: (r, id) => {
      const p = r.pick([10, 20, 25, 50]), q = r.pick([10, 20, 25, 50]);
      const cm = (1 + p / 100) * (1 - q / 100);
      const global = round((cm - 1) * 100, 4);
      return {
        activity: mcqNumber(r, {
          id, stage: "rappel", competence: "calculer",
          prompt: `Un prix augmente de ${p} % puis baisse de ${q} %. Quelle est l'évolution globale, en % ?`,
          answer: global,
          right: `On multiplie les coefficients : ${fr(1 + p / 100)} × ${fr(1 - q / 100)} = ${fr(round(cm, 4))}.`,
          wrong: [{ value: p - q, feedback: "Les pourcentages ne s'additionnent pas : on multiplie les coefficients multiplicateurs." }, { value: round(global + 1, 4), feedback: "Recalcule le produit des coefficients." }, { value: -global === global ? global + 5 : -global, feedback: "Vérifie le sens : le coefficient global est-il plus grand ou plus petit que 1 ?" }],
          show: (x) => `${x > 0 ? "+" : ""}${fr(x)} %`,
          hint: "Augmenter de t %, c'est multiplier par 1 + t/100.",
          solution: [`${fr(1 + p / 100)} × ${fr(1 - q / 100)} = ${fr(round(cm, 4))}.`, `Évolution globale : ${global > 0 ? "+" : ""}${fr(global)} %.`],
          takeaway: "Des évolutions successives se composent en multipliant les coefficients multiplicateurs.",
        }),
        verify: () => close(100 * (1 + p / 100) * (1 - q / 100), 100 + global),
      };
    },
  }),
  gen({
    id: "m2-aut-lecture", unit: U("automatismes"), title: "Calcul mental de fractions et pourcentages", stage: "rappel",
    make: (r, id) => {
      const kind = r.int(0, 2);
      const n = r.int(2, 20) * 20;
      const [prompt, value, tip] = kind === 0 ? [`Combien font les 3/4 de ${n} ?`, (3 * n) / 4, `${n} ÷ 4 × 3`] : kind === 1 ? [`Combien font 15 % de ${n} ?`, (15 * n) / 100, `10 % + 5 % de ${n}`] : [`Combien font 2/5 de ${n} ?`, (2 * n) / 5, `${n} ÷ 5 × 2`];
      return {
        activity: mcqNumber(r, {
          id, stage: "rappel", competence: "calculer",
          prompt,
          answer: value,
          right: `${tip} = ${fr(value)}.`,
          wrong: [{ value: value * 2, feedback: "Le double : refais le calcul." }, { value: value / 3, feedback: "Refais le calcul étape par étape." }, { value: value + 10, feedback: "Presque : vérifie la dernière étape." }],
          hint: "Calcule d'abord une fraction ou un pourcentage simple, puis multiplie.",
          solution: [`${tip} = ${fr(value)}.`],
          takeaway: "Les 3/4 : diviser par 4, multiplier par 3. 15 % = 10 % + 5 % (la moitié de 10 %).",
        }),
        verify: () => close(value, kind === 0 ? n * 0.75 : kind === 1 ? n * 0.15 : n * 0.4),
      };
    },
  }),
];
