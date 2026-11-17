import { ask, gen, graph, mcq, mockCode, mockTable, problem } from "../build";
import { evaluate, sameExpression } from "../evaluate";
import { close, euros, fr, frac, gcd, par, poly, round } from "../format";
import type { Generator } from "../types";

/**
 * Compléments de mathématiques et de physique-chimie du collège : chaque chapitre propose ainsi plusieurs formes
 * d'exercices (calculer, choisir, lire un tableau ou un graphique, remonter un calcul).
 */

const M = (level: string, slug: string) => `${level}-maths-${slug}`;
/** Fraction irréductible écrite en ligne. */
const simp = (n: number, d: number) => {
  const g = gcd(n, d) || 1;
  return d / g === 1 ? fr(n / g) : frac(n / g, d / g);
};
const FRACTION = "Réponds par une fraction (par exemple 3/4) ou par un nombre décimal.";
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];

export const PLUS_COLLEGE: Generator[] = [
  /* ——— 6e : pensée informatique ——— */
  gen({
    id: "m6-algo-remonter", unit: M("6e", "algo"), title: "Remonter un programme de calcul", stage: "transfert",
    make: (r, id) => {
      const start = r.int(2, 12), a = r.int(2, 9), b = r.int(2, 5), c = r.int(1, 9);
      const res = (start + a) * b - c;
      return {
        activity: ask({
          id, stage: "transfert", competence: "raisonner",
          context: `Programme de calcul : choisir un nombre ; ajouter ${a} ; multiplier le résultat par ${b} ; soustraire ${c}. Le programme affiche ${res}.`,
          prompt: "Quel nombre avait-on choisi au départ ?",
          expected: start,
          errors: [
            { value: (res + a) * b - c, code: "sens", message: "Tu as appliqué le programme au résultat. Il faut le remonter : partir de la fin et défaire chaque étape.", type: "procedurale" },
            { value: (res + c) / b + a, code: "inverse", message: `Pour défaire « ajouter ${a} », on soustrait ${a}.`, type: "procedurale" },
          ],
          hint: "Pars du résultat et défais les étapes dans l'ordre inverse.",
          partHint: `Défais d'abord « soustraire ${c} » : ${res} + ${c}.`,
          solution: [`${res} + ${c} = ${res + c}.`, `${res + c} ÷ ${b} = ${(res + c) / b}.`, `${(res + c) / b} − ${a} = ${start}.`],
          recap: `Nombre de départ : ${start}`,
          review: "Remonter un programme de calcul",
          takeaway: "Pour remonter un programme, on part du résultat et on applique les opérations contraires, dans l'ordre inverse.",
        }),
        verify: () => evaluate(`(${start} + ${a}) × ${b} − ${c}`) === res,
      };
    },
  }),

  /* ——— 5e : fractions ——— */
  gen({
    id: "m5-frac-simplifier", unit: M("5e", "fractions"), title: "Simplifier une fraction", stage: "rappel",
    make: (r, id) => {
      let a = r.int(1, 7), b = r.int(a + 1, 9);
      while (gcd(a, b) !== 1) { a = r.int(1, 7); b = r.int(a + 1, 9); }
      const k = r.pick([2, 3, 4, 5, 6, 8, 10]);
      const p = PRIMES.find((x) => k % x === 0)!;
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "calculer",
          prompt: `Quelle fraction irréductible est égale à ${frac(a * k, b * k)} ?`,
          answer: { text: frac(a, b), feedback: `On divise le numérateur et le dénominateur par ${k} : ${frac(a * k, b * k)} = ${frac(a, b)}, qui ne se simplifie plus.` },
          wrong: [
            ...(k / p > 1 ? [{ text: frac((a * k) / p, (b * k) / p), feedback: `Cette fraction est bien égale à ${frac(a * k, b * k)}, mais elle se simplifie encore.` }] : []),
            { text: frac(a * k - k, b * k - k), feedback: "On ne soustrait pas le même nombre en haut et en bas : on divise." },
            { text: frac(a, b + 1), feedback: `${a} × ${b * k} et ${b + 1} × ${a * k} ne sont pas égaux : ces deux fractions sont différentes.` },
            { text: frac(a + 1, b + 1), feedback: "Ajouter 1 en haut et en bas change la valeur de la fraction." },
          ].filter((w) => !/\/0$|^0\//.test(w.text)),
          hint: "Cherche un nombre qui divise à la fois le numérateur et le dénominateur.",
          hints: [`${a * k} et ${b * k} sont tous les deux dans la table de ${p}.`, `Divise le numérateur et le dénominateur par ${k}.`],
          solution: [`${a * k} = ${a} × ${k} et ${b * k} = ${b} × ${k}.`, `${frac(a * k, b * k)} = ${frac(a, b)}.`],
          takeaway: "Simplifier une fraction, c'est diviser son numérateur et son dénominateur par un même nombre.",
        }),
        verify: () => a * (b * k) === b * (a * k) && gcd(a, b) === 1,
      };
    },
  }),
  gen({
    id: "m5-frac-quantite", unit: M("5e", "fractions"), title: "Prendre une fraction d'une quantité", stage: "application",
    make: (r, id) => {
      const b = r.pick([3, 4, 5, 6, 8]), a = r.int(2, b - 1), n = b * r.int(3, 9);
      const [who, what] = r.pick([["Une classe compte", "élèves"], ["Un club réunit", "adhérents"], ["Une chorale rassemble", "choristes"], ["Un camp d'été accueille", "jeunes"]] as const);
      const res = (a * n) / b;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `${who} ${n} ${what}. Les ${frac(a, b)} d'entre eux participent à une sortie.`,
          prompt: `Combien de ${what} participent à la sortie ?`,
          expected: res,
          errors: [
            { value: n / b, code: "une_part", message: `Tu as calculé ${frac(1, b)} de ${n}. Il faut ensuite prendre ${a} parts.`, type: "procedurale" },
            { value: (n * b) / a, code: "inverse", message: "Prendre une fraction d'une quantité : on divise par le dénominateur, puis on multiplie par le numérateur.", type: "procedurale" },
          ],
          hint: `Calcule d'abord ${frac(1, b)} de ${n}.`,
          partHint: `${n} ÷ ${b} = ${n / b} : c'est une part. Il en faut ${a}.`,
          solution: [`${n} ÷ ${b} = ${n / b}.`, `${n / b} × ${a} = ${res}.`],
          recap: `${frac(a, b)} de ${n} = ${res}`,
          review: "Fraction d'une quantité",
          takeaway: "Prendre a/b d'une quantité : diviser par b, puis multiplier par a.",
        }),
        verify: () => res * b === a * n && Number.isInteger(res),
      };
    },
  }),

  /* ——— 5e : expressions littérales ——— */
  gen({
    id: "m5-lit-reduire", unit: M("5e", "expressions"), title: "Réduire une expression", stage: "rappel",
    make: (r, id) => {
      const a = r.int(2, 9), c = r.int(2, 9), b = r.int(1, 9);
      const expr = `${a}x + ${b} + ${c}x`;
      const right = poly([[a + c, "x"], [b, ""]]);
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "calculer",
          prompt: `Réduis l'expression ${expr}.`,
          answer: { text: right, feedback: `${a}x + ${c}x = ${a + c}x, et ${b} reste seul : ${right}.` },
          wrong: [
            { text: `${a + b + c}x`, feedback: `${b} n'est pas un nombre de x : on ne peut pas l'ajouter à ${a + c}x.` },
            { text: `${a + c}x² + ${b}`, feedback: `${a}x + ${c}x fait ${a + c}x : on additionne des x, on ne les multiplie pas.` },
            { text: poly([[a * c, "x"], [b, ""]]), feedback: `On additionne les coefficients : ${a} + ${c}, pas ${a} × ${c}.` },
          ],
          hint: "Regroupe les termes qui contiennent x.",
          hints: [`${a}x + ${c}x : combien de x en tout ?`, `${a}x + ${c}x = ${a + c}x.`],
          solution: [`${expr} = ${a}x + ${c}x + ${b}.`, `= ${right}.`],
          takeaway: "On n'additionne que des termes de même nature : les x avec les x, les nombres avec les nombres.",
        }),
        verify: () => sameExpression(expr, right, "x") && !sameExpression(expr, `${a + b + c}x`, "x"),
      };
    },
  }),
  gen({
    id: "m5-lit-produire", unit: M("5e", "expressions"), title: "Traduire une phrase par une expression", stage: "application",
    make: (r, id) => {
      const m = r.int(2, 5), k = r.int(1, 9);
      const name = ["", "", "double", "triple", "quadruple", "quintuple"][m]!;
      const forms: { phrase: string; text: string; value: (x: number) => number }[] = [
        { phrase: `le ${name} de x, augmenté de ${k}`, text: `${m}x + ${k}`, value: (x) => m * x + k },
        { phrase: `le ${name} de la somme de x et de ${k}`, text: `${m}(x + ${k})`, value: (x) => m * (x + k) },
        { phrase: `le ${name} de x, diminué de ${k}`, text: `${m}x − ${k}`, value: (x) => m * x - k },
        { phrase: `le carré de x, augmenté de ${k}`, text: `x² + ${k}`, value: (x) => x * x + k },
      ];
      const i = r.int(0, forms.length - 1);
      const f = forms[i]!;
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "modeliser",
          prompt: `Quelle expression traduit : « ${f.phrase} » ?`,
          answer: { text: f.text, feedback: `Pour x = 3, on obtient bien ${fr(f.value(3))}.` },
          wrong: forms.filter((_, j) => j !== i).map((w) => ({ text: w.text, feedback: `Cette expression traduit : « ${w.phrase} ».` })),
          hint: "Repère l'ordre des opérations dans la phrase : que fait-on en premier ?",
          hints: ["Des parenthèses indiquent que l'on calcule d'abord une somme.", `Teste avec x = 3 : la phrase donne ${fr(f.value(3))}.`],
          solution: [`« ${f.phrase} » s'écrit ${f.text}.`, `Vérification pour x = 3 : ${fr(f.value(3))}.`],
          takeaway: "« Le double de la somme » demande des parenthèses ; « le double de x, augmenté de » n'en demande pas.",
        }),
        verify: () => [2, 3, 7, 11].every((x) => close(evaluate(f.text, { x }), f.value(x))) && forms.filter((_, j) => j !== i).every((w) => [2, 3, 7, 11].some((x) => !close(evaluate(w.text, { x }), f.value(x)))),
      };
    },
  }),

  /* ——— 5e : proportionnalité ——— */
  gen({
    id: "m5-prop-tableau", unit: M("5e", "propor"), title: "Calculer une quatrième proportionnelle", stage: "application",
    make: (r, id) => {
      const u = r.pick([1.5, 2, 2.4, 2.5, 3, 3.2, 4, 4.5]);
      const q1 = r.int(2, 6), q2 = r.int(7, 12);
      const [item, unit] = r.pick([["de pommes", "kg"], ["de tissu", "m"], ["de farine", "kg"], ["de ruban", "m"], ["de noix", "kg"]] as const);
      const p1 = round(u * q1), p2 = round(u * q2);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Le prix est proportionnel à la quantité achetée : ${q1} ${unit} ${item} coûtent ${euros(p1)}.`,
          prompt: `Combien coûtent ${q2} ${unit} ${item}, en euros ?`,
          expected: p2,
          errors: [
            { value: round(p1 + (q2 - q1)), code: "additif", message: "La proportionnalité fait multiplier, pas ajouter : cherche le prix d'une unité.", type: "conceptuelle" },
            { value: u, code: "unite", message: `${euros(u)} est le prix d'une unité. Multiplie-le par ${q2}.`, type: "procedurale" },
          ],
          hint: `Cherche d'abord le prix de 1 ${unit}.`,
          partHint: `${fr(p1)} ÷ ${q1} = ${fr(u)} : c'est le prix, en euros, de 1 ${unit}.`,
          solution: [`Prix de 1 ${unit} : ${fr(p1)} ÷ ${q1} = ${euros(u)}.`, `Prix de ${q2} ${unit} : ${fr(u)} × ${q2} = ${euros(p2)}.`],
          recap: `${q2} ${unit} : ${euros(p2)}`,
          review: "Quatrième proportionnelle",
          takeaway: "Dans une situation de proportionnalité, on passe par l'unité ou par le coefficient de proportionnalité.",
        }),
        verify: () => close(p2 * q1, p1 * q2),
      };
    },
  }),
  gen({
    id: "m5-prop-pourcentage", unit: M("5e", "propor"), title: "Calculer un pourcentage d'une quantité", stage: "rappel",
    make: (r, id) => {
      const t = r.pick([10, 20, 25, 30, 40, 50, 60, 75]), n = 20 * r.int(2, 30);
      const res = (t * n) / 100;
      return {
        activity: ask({
          id, stage: "rappel", competence: "calculer",
          context: `On veut calculer ${t} % de ${n}.`,
          prompt: `Combien font ${t} % de ${n} ?`,
          expected: res,
          errors: [{ value: n - res, code: "reste", message: `Tu as calculé ce qui reste après avoir enlevé ${t} %. La question porte sur les ${t} % eux-mêmes.`, type: "procedurale" }],
          hint: `${t} % signifie ${t} pour 100.`,
          partHint: t === 50 ? "50 %, c'est la moitié." : t === 25 ? "25 %, c'est le quart." : t === 10 ? "10 %, c'est le dixième." : `Calcule ${n} × ${t} ÷ 100.`,
          solution: [`${n} × ${t} ÷ 100 = ${fr(res)}.`],
          recap: `${t} % de ${n} = ${fr(res)}`,
          review: "Pourcentage d'une quantité",
          takeaway: "Prendre t % d'une quantité, c'est la multiplier par t et diviser par 100.",
        }),
        verify: () => res * 100 === t * n,
      };
    },
  }),

  /* ——— 5e : données et premières probabilités ——— */
  gen({
    id: "m5-stat-urne", unit: M("5e", "donnees"), title: "Calculer une probabilité simple", stage: "application",
    make: (r, id) => {
      const red = r.int(1, 6), blue = r.int(1, 6), green = r.int(1, 6);
      const total = red + blue + green;
      const [name, count] = r.pick([["rouge", red], ["bleue", blue], ["verte", green]] as const);
      const res = count / total;
      return {
        activity: ask({
          id, stage: "application", competence: "raisonner",
          context: `Une urne contient ${red} boule${red > 1 ? "s" : ""} rouge${red > 1 ? "s" : ""}, ${blue} bleue${blue > 1 ? "s" : ""} et ${green} verte${green > 1 ? "s" : ""}, indiscernables au toucher. On tire une boule au hasard.`,
          prompt: `Quelle est la probabilité de tirer une boule ${name} ? ${FRACTION}`,
          expected: res,
          tolerance: { abs: 1e-6, rel: 1e-5 },
          errors: [{ value: count / (total - count), code: "rapport", message: "On divise par le nombre total de boules, pas par le nombre des autres boules.", type: "conceptuelle" }],
          hint: "Probabilité = nombre de cas favorables ÷ nombre de cas possibles.",
          partHint: `Il y a ${total} boules en tout, dont ${count} ${name}${count > 1 ? "s" : ""}.`,
          solution: [`Nombre total de boules : ${red} + ${blue} + ${green} = ${total}.`, `Probabilité : ${simp(count, total)}.`],
          recap: `P = ${simp(count, total)}`,
          review: "Probabilité d'un événement",
          takeaway: "Quand toutes les issues ont la même chance, probabilité = cas favorables ÷ cas possibles.",
        }),
        verify: () => close(res * total, count) && res > 0 && res < 1,
      };
    },
  }),
  gen({
    id: "m5-stat-tableau", unit: M("5e", "donnees"), title: "Lire un tableau d'effectifs", stage: "application",
    make: (r, id) => {
      const total = r.pick([20, 25, 50]);
      const names = r.sample(["Football", "Natation", "Danse", "Judo", "Basket", "Tennis", "Escalade"], 4);
      let counts = [0, 0, 0, 0];
      do {
        const cuts = [r.int(2, total - 6), r.int(2, total - 6), r.int(2, total - 6)].sort((x, y) => x - y);
        counts = [cuts[0]!, cuts[1]! - cuts[0]!, cuts[2]! - cuts[1]!, total - cuts[2]!];
      } while (counts.some((c) => c < 2));
      const k = r.int(0, 3);
      const pct = (counts[k]! * 100) / total;
      return {
        activity: problem({
          id, stage: "application", competence: "representer",
          stimulus: mockTable("Sport préféré des élèves interrogés", ["Sport", "Effectif"], names.map((n, i) => [n, String(counts[i])])),
          context: "On a demandé à des élèves leur sport préféré. Chacun a donné une seule réponse.",
          hint: "L'effectif total est la somme de tous les effectifs.",
          takeaway: "Fréquence = effectif ÷ effectif total ; on la multiplie par 100 pour l'écrire en pourcentage.",
          parts: [
            { prompt: "Combien d'élèves ont été interrogés ?", expected: total, hint: "Additionne les quatre effectifs.", solution: [`${counts.join(" + ")} = ${total}.`], recap: `Effectif total : ${total}`, review: "Effectif total" },
            {
              prompt: `Quel pourcentage des élèves préfère : ${names[k]} ?`, expected: pct,
              errors: [{ value: counts[k]!, code: "effectif", message: "C'est l'effectif. Le pourcentage compare cet effectif à l'effectif total.", type: "conceptuelle" }],
              hint: `Divise ${counts[k]} par ${total}, puis multiplie par 100.`, solution: [`${counts[k]} ÷ ${total} = ${fr(counts[k]! / total)}.`, `${fr(counts[k]! / total)} × 100 = ${fr(pct)} %.`], recap: `${names[k]} : ${fr(pct)} %`, review: "Fréquence en pourcentage",
            },
          ],
        }),
        verify: () => counts.reduce((a, b) => a + b, 0) === total && close(pct * total, counts[k]! * 100),
      };
    },
  }),

  /* ——— 4e : nombres relatifs ——— */
  gen({
    id: "m4-rel-quotient", unit: M("4e", "relatifs"), title: "Diviser deux nombres relatifs", stage: "application",
    make: (r, id) => {
      const b = (r.chance(0.5) ? -1 : 1) * r.int(2, 9), q = r.nonZero(12);
      const a = b * q;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `On considère le quotient ${par(a)} ÷ ${par(b)}.`,
          prompt: "Quel est le résultat ?",
          expected: q,
          errors: [{ value: -q, code: "signe", message: "Le quotient de deux nombres de même signe est positif, celui de deux nombres de signes contraires est négatif.", type: "procedurale" }],
          hint: "Détermine d'abord le signe du résultat, puis divise les distances à zéro.",
          partHint: a * b > 0 ? "Les deux nombres ont le même signe : le quotient est positif." : "Les deux nombres sont de signes contraires : le quotient est négatif.",
          solution: [a * b > 0 ? "Même signe : quotient positif." : "Signes contraires : quotient négatif.", `${Math.abs(a)} ÷ ${Math.abs(b)} = ${Math.abs(q)}, donc ${par(a)} ÷ ${par(b)} = ${fr(q)}.`],
          recap: `${par(a)} ÷ ${par(b)} = ${fr(q)}`,
          review: "Quotient de relatifs",
          takeaway: "La règle des signes est la même pour un quotient que pour un produit.",
        }),
        verify: () => q * b === a,
      };
    },
  }),
  gen({
    id: "m4-rel-signe", unit: M("4e", "relatifs"), title: "Prévoir le signe d'un produit", stage: "rappel",
    make: (r, id) => {
      const n = r.int(3, 5);
      const factors = Array.from({ length: n }, () => r.nonZero(9));
      const negatives = factors.filter((f) => f < 0).length;
      const positive = negatives % 2 === 0;
      const text = factors.map(par).join(" × ");
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "raisonner",
          prompt: `Sans calculer, quel est le signe du produit ${text} ?`,
          answer: { text: positive ? "Positif" : "Négatif", feedback: `Il y a ${negatives} facteur${negatives > 1 ? "s" : ""} négatif${negatives > 1 ? "s" : ""}, un nombre ${positive ? "pair" : "impair"} : le produit est ${positive ? "positif" : "négatif"}.` },
          wrong: [
            { text: positive ? "Négatif" : "Positif", feedback: `Compte les facteurs négatifs : il y en a ${negatives}.` },
            { text: "Nul", feedback: "Un produit n'est nul que si l'un de ses facteurs est nul : ce n'est pas le cas ici." },
            { text: "On ne peut pas le savoir sans calculer", feedback: "Le nombre de facteurs négatifs suffit à connaître le signe." },
          ],
          hint: "Compte les facteurs négatifs.",
          hints: ["Deux facteurs négatifs se compensent : leur produit est positif.", `Il y a ${negatives} facteur${negatives > 1 ? "s" : ""} négatif${negatives > 1 ? "s" : ""}.`],
          solution: [`Facteurs négatifs : ${negatives}.`, `Ce nombre est ${positive ? "pair" : "impair"} : le produit est ${positive ? "positif" : "négatif"}.`],
          takeaway: "Un produit est positif si le nombre de ses facteurs négatifs est pair, négatif s'il est impair.",
        }),
        verify: () => factors.reduce((a, b) => a * b, 1) > 0 === positive,
      };
    },
  }),

  /* ——— 4e : fractions ——— */
  gen({
    id: "m4-frac-priorites", unit: M("4e", "fractions"), title: "Enchaîner des opérations sur les fractions", stage: "transfert",
    make: (r, id) => {
      const b = r.pick([2, 3, 4, 5]), d = r.pick([2, 3, 4, 5]), f = r.pick([2, 3, 5]);
      const a = r.int(1, b + 2), c = r.int(1, d + 2), e = r.int(1, f + 2);
      const num = a * d * f + c * e * b, den = b * d * f;
      const res = num / den;
      const wrongNum = (a * d + c * b) * e, wrongDen = b * d * f;
      return {
        activity: ask({
          id, stage: "transfert", competence: "calculer",
          context: `On veut calculer ${frac(a, b)} + ${frac(c, d)} × ${frac(e, f)}.`,
          prompt: `Quel est le résultat ? ${FRACTION}`,
          expected: res,
          tolerance: { abs: 1e-6, rel: 1e-5 },
          errors: [{ value: wrongNum / wrongDen, code: "priorite", message: "La multiplication est prioritaire : calcule d'abord le produit des deux dernières fractions.", type: "procedurale" }],
          hint: "Respecte les priorités : la multiplication passe avant l'addition.",
          partHint: `Calcule d'abord ${frac(c, d)} × ${frac(e, f)} = ${simp(c * e, d * f)}.`,
          solution: [`${frac(c, d)} × ${frac(e, f)} = ${simp(c * e, d * f)}.`, `${frac(a, b)} + ${simp(c * e, d * f)} = ${simp(num, den)}.`],
          recap: `Résultat : ${simp(num, den)}`,
          review: "Priorités avec des fractions",
          takeaway: "Avec des fractions aussi, la multiplication et la division passent avant l'addition et la soustraction.",
        }),
        verify: () => close(evaluate(`(${a} ÷ ${b}) + (${c} ÷ ${d}) × (${e} ÷ ${f})`), res),
      };
    },
  }),
  gen({
    id: "m4-frac-de", unit: M("4e", "fractions"), title: "Prendre une fraction d'une fraction", stage: "application",
    make: (r, id) => {
      const d = r.pick([3, 4, 5, 6]), c = r.int(1, d - 1), b = r.pick([2, 3, 4, 5]), a = r.int(1, b - 1);
      const res = (a * c) / (b * d);
      const [thing, verb] = r.pick([["Un réservoir est rempli aux", "On utilise les"], ["Un jardin est cultivé aux", "On arrose les"], ["Une batterie est chargée aux", "Un jeu consomme les"]] as const);
      return {
        activity: ask({
          id, stage: "application", competence: "modeliser",
          context: `${thing} ${frac(c, d)}. ${verb} ${frac(a, b)} de cette partie.`,
          prompt: `Quelle fraction du tout cela représente-t-il ? ${FRACTION}`,
          expected: res,
          tolerance: { abs: 1e-6, rel: 1e-5 },
          errors: [{ value: a / b + c / d, code: "somme", message: "« Les a/b de » se traduit par une multiplication, pas par une addition.", type: "conceptuelle" }],
          hint: "Prendre une fraction d'une quantité, c'est multiplier.",
          partHint: `Calcule ${frac(a, b)} × ${frac(c, d)}.`,
          solution: [`${frac(a, b)} × ${frac(c, d)} = ${frac(a * c, b * d)}${gcd(a * c, b * d) > 1 ? ` = ${simp(a * c, b * d)}` : ""}.`],
          recap: `${frac(a, b)} de ${frac(c, d)} = ${simp(a * c, b * d)}`,
          review: "Produit de fractions",
          takeaway: "Pour multiplier deux fractions, on multiplie les numérateurs entre eux et les dénominateurs entre eux.",
        }),
        verify: () => close(res * b * d, a * c) && res < c / d,
      };
    },
  }),

  /* ——— 4e : proportionnalité ——— */
  gen({
    id: "m4-prop-croix", unit: M("4e", "propor"), title: "Utiliser le produit en croix", stage: "application",
    make: (r, id) => {
      const k = r.pick([0.75, 0.8, 1.2, 1.5, 2.5, 3]);
      const a = 4 * r.int(1, 6), c = 4 * r.int(7, 12);
      const b = round(k * a), res = round(k * c);
      const [x, y] = r.pick([["Distance sur la carte (cm)", "Distance réelle (km)"], ["Volume d'essence (L)", "Prix (€)"], ["Masse de fruits (kg)", "Masse de sucre (kg)"], ["Durée (min)", "Distance parcourue (km)"]] as const);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          stimulus: mockTable("Tableau de proportionnalité", [x, y], [[fr(a), fr(b)], [fr(c), "?"]]),
          context: "Les deux grandeurs du tableau sont proportionnelles.",
          prompt: "Quelle est la valeur manquante ?",
          expected: res,
          errors: [{ value: round(b + (c - a)), code: "additif", message: "On ne passe pas d'une ligne à l'autre en ajoutant : utilise le produit en croix.", type: "conceptuelle" }],
          hint: "Produit en croix : valeur cherchée = (produit de la diagonale connue) ÷ le troisième nombre.",
          partHint: `Calcule ${fr(c)} × ${fr(b)} ÷ ${fr(a)}.`,
          solution: [`${fr(c)} × ${fr(b)} ÷ ${fr(a)} = ${fr(res)}.`],
          recap: `Valeur manquante : ${fr(res)}`,
          review: "Produit en croix",
          takeaway: "Dans un tableau de proportionnalité, les produits en croix sont égaux.",
        }),
        verify: () => close(a * res, b * c),
      };
    },
  }),
  gen({
    id: "m4-prop-taux", unit: M("4e", "propor"), title: "Exprimer une proportion en pourcentage", stage: "application",
    make: (r, id) => {
      const pct = r.pick([12, 15, 24, 30, 36, 45, 60, 64, 72]);
      const n = r.pick([200, 250, 400, 500, 800].filter((x) => (x * pct) % 100 === 0));
      const part = (n * pct) / 100;
      const [place, who] = r.pick([["Dans un collège de", "sont demi-pensionnaires"], ["Dans un club de", "ont moins de 15 ans"], ["Dans un village de", "se déplacent à vélo"], ["Sur un parc de", "sont électriques"]] as const);
      const noun = place.includes("parc") ? "voitures" : place.includes("village") ? "habitants" : place.includes("club") ? "membres" : "élèves";
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `${place} ${n} ${noun}, ${part} ${who}.`,
          prompt: "Quel pourcentage cela représente-t-il ?",
          expected: pct,
          errors: [{ value: part, code: "effectif", message: "C'est l'effectif. Le pourcentage compare cet effectif au total : partie ÷ tout × 100.", type: "conceptuelle" }],
          hint: "Pourcentage = partie ÷ tout × 100.",
          partHint: `Calcule ${part} ÷ ${n}.`,
          solution: [`${part} ÷ ${n} = ${fr(part / n)}.`, `${fr(part / n)} × 100 = ${pct} %.`],
          recap: `${part} sur ${n} : ${pct} %`,
          review: "Calculer un pourcentage",
          takeaway: "Pour exprimer une proportion en pourcentage : partie ÷ tout × 100.",
        }),
        verify: () => Number.isInteger(part) && pct * n === 100 * part,
      };
    },
  }),

  /* ——— 4e : statistiques ——— */
  gen({
    id: "m4-stat-pair", unit: M("4e", "stats"), title: "Médiane d'une série d'effectif pair", stage: "application",
    make: (r, id) => {
      const n = r.pick([6, 8, 10]);
      const vals = Array.from({ length: n }, () => r.int(4, 30));
      const sorted = [...vals].sort((a, b) => a - b);
      const lo = sorted[n / 2 - 1]!, hi = sorted[n / 2]!;
      const med = (lo + hi) / 2;
      const [what, unit] = r.pick([["Durées de trajet", "min"], ["Nombres de livres lus dans l'année", "livres"], ["Tailles de poissons pêchés", "cm"], ["Points marqués par match", "points"]] as const);
      return {
        activity: problem({
          id, stage: "application", competence: "calculer",
          context: `${what} (en ${unit}) : ${vals.join(" ; ")}.`,
          hint: "Range d'abord les valeurs dans l'ordre croissant.",
          takeaway: "Quand l'effectif est pair, la médiane est la demi-somme des deux valeurs centrales de la série rangée.",
          parts: [
            {
              prompt: "Quelle est la médiane de la série ?", expected: med,
              errors: lo !== hi ? [{ value: lo, code: "centrale", message: "Avec un effectif pair, il y a deux valeurs centrales : la médiane est leur demi-somme.", type: "procedurale" }] : [],
              hint: `Il y a ${n} valeurs : les deux valeurs centrales sont la ${n / 2}e et la ${n / 2 + 1}e.`,
              solution: [`Série rangée : ${sorted.join(" ; ")}.`, `Valeurs centrales : ${lo} et ${hi}.`, `Médiane : (${lo} + ${hi}) ÷ 2 = ${fr(med)}.`], recap: `Médiane : ${fr(med)}`, review: "Médiane (effectif pair)",
            },
            { prompt: "Quelle est l'étendue de la série ?", expected: sorted[n - 1]! - sorted[0]!, hint: "Étendue = plus grande valeur − plus petite valeur.", solution: [`${sorted[n - 1]} − ${sorted[0]} = ${sorted[n - 1]! - sorted[0]!}.`], recap: `Étendue : ${sorted[n - 1]! - sorted[0]!}`, review: "Étendue" },
          ],
        }),
        verify: () => sorted.filter((v) => v <= med).length >= n / 2 && sorted.filter((v) => v >= med).length >= n / 2 && Math.max(...vals) - Math.min(...vals) === sorted[n - 1]! - sorted[0]!,
      };
    },
  }),

  /* ——— 4e : probabilités ——— */
  gen({
    id: "m4-proba-urne", unit: M("4e", "proba"), title: "Probabilité d'un événement « ou »", stage: "application",
    make: (r, id) => {
      const counts = { rouge: r.int(1, 6), bleu: r.int(1, 6), vert: r.int(1, 6), jaune: r.int(1, 6) };
      const colors = Object.keys(counts) as (keyof typeof counts)[];
      const [c1, c2] = r.sample(colors, 2) as [keyof typeof counts, keyof typeof counts];
      const total = colors.reduce((s, c) => s + counts[c], 0);
      const fav = counts[c1] + counts[c2];
      const res = fav / total;
      return {
        activity: ask({
          id, stage: "application", competence: "raisonner",
          context: `Un sac contient ${colors.map((c) => `${counts[c]} jeton${counts[c] > 1 ? "s" : ""} ${c}${counts[c] > 1 ? "s" : ""}`).join(", ")}. On tire un jeton au hasard.`,
          prompt: `Quelle est la probabilité d'obtenir un jeton ${c1} ou ${c2} ? ${FRACTION}`,
          expected: res,
          tolerance: { abs: 1e-6, rel: 1e-5 },
          errors: [{ value: (counts[c1] * counts[c2]) / (total * total), code: "produit", message: "« Ou » : on additionne les cas favorables. On ne multiplie pas les probabilités.", type: "conceptuelle" }],
          hint: "Compte tous les jetons qui conviennent.",
          partHint: `${counts[c1]} + ${counts[c2]} = ${fav} jetons conviennent, sur ${total}.`,
          solution: [`Cas favorables : ${counts[c1]} + ${counts[c2]} = ${fav}.`, `Cas possibles : ${total}.`, `Probabilité : ${simp(fav, total)}.`],
          recap: `P = ${simp(fav, total)}`,
          review: "Probabilité d'un événement",
          takeaway: "Pour un événement « A ou B » sans cas commun, on additionne les cas favorables.",
        }),
        verify: () => {
          const bag = colors.flatMap((c) => Array.from({ length: counts[c] }, () => c));
          return close(bag.filter((c) => c === c1 || c === c2).length / bag.length, res);
        },
      };
    },
  }),
  gen({
    id: "m4-proba-frequence", unit: M("4e", "proba"), title: "Estimer une probabilité par une fréquence", stage: "rappel",
    make: (r, id) => {
      const n = r.pick([200, 500, 1000, 2000]), f = r.pick([0.15, 0.2, 0.35, 0.4, 0.45, 0.6, 0.65, 0.7]);
      const k = Math.round(n * f);
      const [what, event] = r.pick([["On lance une punaise", "elle retombe pointe en haut"], ["On lance un gobelet", "il retombe debout"], ["On fait tourner une roue truquée", "elle s'arrête sur le rouge"], ["On lance un dé pipé", "il donne 6"]] as const);
      return {
        activity: ask({
          id, stage: "rappel", competence: "raisonner",
          context: `${what} ${fr(n)} fois : ${fr(k)} fois, ${event}.`,
          prompt: "Par quel nombre décimal peut-on estimer la probabilité de cet événement ?",
          expected: f,
          errors: [{ value: k, code: "effectif", message: "Une probabilité est un nombre entre 0 et 1 : divise par le nombre d'essais.", type: "conceptuelle" }],
          hint: "Calcule la fréquence de l'événement.",
          partHint: `Fréquence = ${fr(k)} ÷ ${fr(n)}.`,
          solution: [`${fr(k)} ÷ ${fr(n)} = ${fr(f)}.`],
          recap: `Probabilité estimée : ${fr(f)}`,
          review: "Fréquence et probabilité",
          takeaway: "Quand on répète une expérience un grand nombre de fois, la fréquence d'un événement se rapproche de sa probabilité.",
        }),
        verify: () => close(f * n, k) && f > 0 && f < 1,
      };
    },
  }),

  /* ——— 4e : espace ——— */
  gen({
    id: "m4-esp-conversion", unit: M("4e", "espace"), title: "Convertir des volumes et des contenances", stage: "rappel",
    make: (r, id) => {
      const [from, to, factor] = r.pick([["L", "dm³", 1], ["L", "cm³", 1000], ["m³", "L", 1000], ["dm³", "cm³", 1000], ["cL", "mL", 10], ["m³", "dm³", 1000], ["L", "mL", 1000]] as const);
      const v = r.pick([0.5, 1.5, 2, 2.5, 3.2, 4, 7.5, 12, 25]);
      const res = round(v * factor, 3);
      return {
        activity: ask({
          id, stage: "rappel", competence: "calculer",
          context: `On veut convertir ${fr(v)} ${from} en ${to}.`,
          prompt: `Combien cela fait-il de ${to} ?`,
          expected: res,
          errors: factor === 1000 ? [{ value: round(v * 100, 3), code: "cent", message: "D'une unité de volume à la suivante, on multiplie par 1 000, pas par 10 ni par 100.", type: "procedurale" }] : [],
          hint: factor === 1 ? "1 L = 1 dm³." : "1 dm³ = 1 L = 1 000 cm³ ; 1 m³ = 1 000 L.",
          partHint: factor === 1 ? `Les deux unités sont égales : ${fr(v)} ${from} font autant de ${to}.` : `Multiplie ${fr(v)} par ${fr(factor)}.`,
          solution: [`1 ${from} = ${fr(factor)} ${to}.`, `${fr(v)} × ${fr(factor)} = ${fr(res)} ${to}.`],
          recap: `${fr(v)} ${from} = ${fr(res)} ${to}`,
          review: "Conversions de volumes",
          takeaway: "1 L = 1 dm³ = 1 000 cm³ ; 1 m³ = 1 000 L. Les unités de volume vont de 1 000 en 1 000.",
        }),
        verify: () => close(res / factor, v),
      };
    },
  }),
  gen({
    id: "m4-esp-hauteur", unit: M("4e", "espace"), title: "Retrouver la hauteur d'une pyramide", stage: "transfert",
    make: (r, id) => {
      const c = r.pick([3, 4, 5, 6, 9, 10, 12]);
      const h = c % 3 === 0 ? r.pick([4, 5, 7, 8, 10, 11]) : r.pick([3, 6, 9, 12, 15]);
      const v = (c * c * h) / 3;
      return {
        activity: ask({
          id, stage: "transfert", competence: "raisonner",
          context: `Une pyramide à base carrée de côté ${c} cm a un volume de ${fr(v)} cm³.`,
          prompt: "Quelle est sa hauteur, en centimètres ?",
          expected: h,
          errors: [{ value: round(v / (c * c), 4), code: "tiers", message: "N'oublie pas le facteur 1/3 dans le volume d'une pyramide : hauteur = 3 × volume ÷ aire de la base.", type: "procedurale" }],
          hint: "Volume = aire de la base × hauteur ÷ 3 : isole la hauteur.",
          partHint: `Aire de la base : ${c} × ${c} = ${c * c} cm². Puis hauteur = 3 × ${fr(v)} ÷ ${c * c}.`,
          solution: [`Aire de la base : ${c * c} cm².`, `Hauteur = 3 × ${fr(v)} ÷ ${c * c} = ${h} cm.`],
          recap: `Hauteur : ${h} cm`,
          review: "Volume d'une pyramide",
          takeaway: "V = aire de la base × hauteur ÷ 3, donc hauteur = 3 × V ÷ aire de la base.",
        }),
        verify: () => Number.isInteger(v) && close((c * c * h) / 3, v),
      };
    },
  }),

  /* ——— 3e : notion de fonction ——— */
  gen({
    id: "m3-fon-antecedent", unit: M("3e", "fonctions"), title: "Calculer un antécédent", stage: "application",
    make: (r, id) => {
      const a = r.pick([-5, -4, -3, -2, 2, 3, 4, 5]), b = r.int(-9, 9), x0 = r.int(-6, 6);
      const y = a * x0 + b;
      const f = poly([[a, "x"], [b, ""]]);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `La fonction f est définie par f(x) = ${f}.`,
          prompt: `Quel est l'antécédent de ${fr(y)} par f ?`,
          expected: x0,
          errors: [{ value: a * y + b, code: "image", message: `Tu as calculé l'image de ${fr(y)}. L'antécédent est le nombre x tel que f(x) = ${fr(y)}.`, type: "conceptuelle" }],
          hint: `Résous l'équation ${f} = ${fr(y)}.`,
          partHint: `${poly([[a, "x"]])} = ${fr(y)} ${b >= 0 ? "−" : "+"} ${Math.abs(b)}.`,
          solution: [`${f} = ${fr(y)}.`, `${poly([[a, "x"]])} = ${fr(y - b)}.`, `x = ${fr(y - b)} ÷ ${par(a)} = ${fr(x0)}.`],
          recap: `f(${fr(x0)}) = ${fr(y)}`,
          review: "Image et antécédent",
          takeaway: "Chercher un antécédent de y, c'est résoudre l'équation f(x) = y.",
        }),
        verify: () => evaluate(f, { x: x0 }) === y,
      };
    },
  }),
  gen({
    id: "m3-fon-courbe", unit: M("3e", "fonctions"), title: "Lire une image sur un graphique", stage: "rappel",
    make: (r, id) => {
      const a = r.pick([-1, -0.5, 0.5, 1]), b = r.pick([-2, -1, 1, 2, 3]);
      const others = r.sample([-3, -2, -1, 1, 2, 3].filter((v) => v !== b), 3);
      return {
        activity: graph(r, {
          id, stage: "rappel", competence: "representer",
          prompt: `Laquelle de ces courbes représente une fonction f telle que f(0) = ${fr(b)} ?`,
          domain: [-4, 4], range: [-5, 5],
          answer: { curve: { type: "affine", a, b }, feedback: `Cette courbe passe par le point (0 ; ${fr(b)}) : l'image de 0 est bien ${fr(b)}.` },
          wrong: others.map((o) => ({ curve: { type: "affine" as const, a, b: o }, feedback: `Cette courbe coupe l'axe vertical en ${fr(o)} : ici f(0) = ${fr(o)}.` })),
          hint: "L'image de 0 se lit à l'endroit où la courbe coupe l'axe vertical.",
          hints: ["Place-toi sur l'axe des abscisses en x = 0, puis lis l'ordonnée du point de la courbe.", `Cherche la courbe qui passe par le point (0 ; ${fr(b)}).`],
          solution: [`f(0) = ${fr(b)} signifie que la courbe passe par le point (0 ; ${fr(b)}).`, "On lit ce point sur l'axe vertical."],
          takeaway: "Sur un graphique, l'image de x est l'ordonnée du point de la courbe d'abscisse x.",
        }),
        verify: () => a * 0 + b === b && others.every((o) => o !== b) && new Set(others).size === 3,
      };
    },
  }),

  /* ——— 3e : statistiques ——— */
  gen({
    id: "m3-sta-ponderee", unit: M("3e", "stats"), title: "Moyenne à partir d'un tableau d'effectifs", stage: "application",
    make: (r, id) => {
      const total = r.pick([20, 25]);
      const start = r.int(6, 11);
      const values = [start, start + 2, start + 3, start + 5];
      let counts = [0, 0, 0, 0];
      do {
        const cuts = [r.int(2, total - 6), r.int(2, total - 6), r.int(2, total - 6)].sort((x, y) => x - y);
        counts = [cuts[0]!, cuts[1]! - cuts[0]!, cuts[2]! - cuts[1]!, total - cuts[2]!];
      } while (counts.some((c) => c < 2));
      const sum = values.reduce((s, v, i) => s + v * counts[i]!, 0);
      const mean = sum / total;
      const naive = values.reduce((s, v) => s + v, 0) / 4;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          stimulus: mockTable("Notes d'un contrôle", ["Note", "Nombre d'élèves"], values.map((v, i) => [String(v), String(counts[i])])),
          context: `Le tableau donne les notes des ${total} élèves d'une classe.`,
          prompt: "Quelle est la moyenne de la classe ?",
          expected: mean,
          errors: close(naive, mean) ? [] : [{ value: naive, code: "sans_effectifs", message: "Chaque note compte autant de fois qu'il y a d'élèves : multiplie chaque note par son effectif.", type: "procedurale" }],
          hint: "Multiplie chaque note par son effectif, additionne, puis divise par l'effectif total.",
          partHint: `Somme : ${values.map((v, i) => `${v} × ${counts[i]}`).join(" + ")}.`,
          solution: [`${values.map((v, i) => `${v} × ${counts[i]}`).join(" + ")} = ${sum}.`, `${sum} ÷ ${total} = ${fr(mean)}.`],
          recap: `Moyenne : ${fr(mean)}`,
          review: "Moyenne pondérée",
          takeaway: "Moyenne pondérée = somme des (valeur × effectif) ÷ effectif total.",
        }),
        verify: () => {
          const list = values.flatMap((v, i) => Array.from({ length: counts[i]! }, () => v));
          return list.length === total && close(list.reduce((s, v) => s + v, 0) / list.length, mean);
        },
      };
    },
  }),
  gen({
    id: "m3-sta-interpreter", unit: M("3e", "stats"), title: "Interpréter une médiane", stage: "rappel",
    make: (r, id) => {
      const [what, unit, who, values] = r.pick([
        ["des salaires mensuels d'une entreprise", "€", "des salariés gagnent", [1650, 1800, 1950, 2100, 2300]],
        ["des temps de trajet des élèves d'un collège", "min", "des élèves mettent", [12, 15, 18, 20, 25]],
        ["des notes d'un contrôle", "points", "des élèves ont", [9, 10, 11, 12, 13, 14]],
        ["des tailles des joueurs d'un club", "cm", "des joueurs mesurent", [158, 162, 165, 170, 174]],
        ["des âges des habitants d'un village", "ans", "des habitants ont", [34, 38, 41, 45, 52]],
      ] as const);
      const m = r.pick(values);
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "communiquer",
          prompt: `La médiane ${what} est ${fr(m)} ${unit}. Que peut-on affirmer ?`,
          answer: { text: `Au moins la moitié ${who} ${fr(m)} ${unit} ou moins`, feedback: "C'est la définition de la médiane : elle partage la série rangée en deux groupes de même effectif." },
          wrong: [
            { text: `La moyenne est de ${fr(m)} ${unit}`, feedback: "La médiane et la moyenne sont deux indicateurs différents : elles n'ont aucune raison d'être égales." },
            { text: `${fr(m)} ${unit} est la valeur la plus fréquente`, feedback: "La valeur la plus fréquente n'est pas la médiane : la médiane se repère par sa position dans la série rangée." },
            { text: `Toutes les valeurs sont proches de ${fr(m)} ${unit}`, feedback: "La médiane ne dit rien de la dispersion : pour cela, on regarde l'étendue." },
          ],
          hint: "La médiane se lit dans la série rangée par ordre croissant.",
          hints: ["Elle partage la série en deux groupes de même effectif.", "Au moins la moitié des valeurs sont inférieures ou égales à la médiane."],
          solution: ["La médiane partage la série rangée en deux groupes de même effectif.", `Donc au moins la moitié des valeurs sont inférieures ou égales à ${fr(m)} ${unit}.`],
          takeaway: "Médiane : au moins la moitié des valeurs lui sont inférieures ou égales, au moins la moitié lui sont supérieures ou égales.",
        }),
        verify: () => (values as readonly number[]).includes(m),
      };
    },
  }),

  /* ——— 3e : probabilités ——— */
  gen({
    id: "m3-pro-simple", unit: M("3e", "proba"), title: "Probabilité d'un événement sur un dé", stage: "rappel",
    make: (r, id) => {
      const faces = r.pick([6, 8, 10, 12, 20]);
      const k = r.int(3, faces - 2);
      const events: { label: string; test: (n: number) => boolean; list: number[] }[] = [
        { label: "un nombre pair", test: (n) => n % 2 === 0, list: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20] },
        { label: "un multiple de 3", test: (n) => n % 3 === 0, list: [3, 6, 9, 12, 15, 18] },
        { label: "un nombre premier", test: (n) => PRIMES.includes(n), list: [2, 3, 5, 7, 11, 13, 17, 19] },
        { label: `un nombre supérieur ou égal à ${k}`, test: (n) => n >= k, list: Array.from({ length: 21 - k }, (_, i) => k + i) },
        { label: "un multiple de 4", test: (n) => n % 4 === 0, list: [4, 8, 12, 16, 20] },
      ];
      const e = r.pick(events);
      const fav = Array.from({ length: faces }, (_, i) => i + 1).filter(e.test);
      const res = fav.length / faces;
      return {
        activity: ask({
          id, stage: "rappel", competence: "raisonner",
          context: `On lance un dé équilibré à ${faces} faces, numérotées de 1 à ${faces}.`,
          prompt: `Quelle est la probabilité d'obtenir ${e.label} ? ${FRACTION}`,
          expected: res,
          tolerance: { abs: 1e-6, rel: 1e-5 },
          hint: "Fais la liste des issues qui conviennent.",
          partHint: `Issues favorables : ${fav.join(", ")}.`,
          solution: [`Issues favorables : ${fav.join(", ")}, soit ${fav.length} issues.`, `Probabilité : ${simp(fav.length, faces)}.`],
          recap: `P = ${simp(fav.length, faces)}`,
          review: "Probabilité d'un événement",
          takeaway: "Sur un dé équilibré, probabilité = nombre d'issues favorables ÷ nombre de faces.",
        }),
        verify: () => fav.length > 0 && fav.length === e.list.filter((n) => n <= faces).length && close(res * faces, fav.length),
      };
    },
  }),
  gen({
    id: "m3-pro-sans-remise", unit: M("3e", "proba"), title: "Deux tirages sans remise", stage: "transfert",
    make: (r, id) => {
      const red = r.int(2, 5), blue = r.int(2, 5);
      const total = red + blue;
      const res = (red * (red - 1)) / (total * (total - 1));
      return {
        activity: ask({
          id, stage: "transfert", competence: "raisonner",
          context: `Une urne contient ${red} boules rouges et ${blue} boules bleues. On tire une boule, on ne la remet pas, puis on en tire une seconde.`,
          prompt: `Quelle est la probabilité d'obtenir deux boules rouges ? ${FRACTION}`,
          expected: res,
          tolerance: { abs: 1e-6, rel: 1e-5 },
          errors: [{ value: (red * red) / (total * total), code: "remise", message: "La première boule n'est pas remise : au second tirage, il reste une boule rouge de moins, et une boule de moins en tout.", type: "conceptuelle" }],
          hint: "Construis un arbre : au second tirage, la composition de l'urne a changé.",
          partHint: `Premier tirage : ${frac(red, total)}. Second tirage : ${frac(red - 1, total - 1)}.`,
          solution: [`Premier tirage rouge : ${frac(red, total)}.`, `Second tirage rouge : ${frac(red - 1, total - 1)}.`, `Produit : ${simp(red * (red - 1), total * (total - 1))}.`],
          recap: `P(deux rouges) = ${simp(red * (red - 1), total * (total - 1))}`,
          review: "Expérience à deux épreuves",
          takeaway: "Sur un arbre, la probabilité d'un chemin est le produit des probabilités de ses branches.",
        }),
        verify: () => {
          // Dénombrement de tous les couples ordonnés de boules distinctes.
          const balls = [...Array.from({ length: red }, () => "R"), ...Array.from({ length: blue }, () => "B")];
          let all = 0, ok = 0;
          balls.forEach((x, i) => balls.forEach((y, j) => { if (i !== j) { all++; if (x === "R" && y === "R") ok++; } }));
          return close(ok / all, res);
        },
      };
    },
  }),

  /* ——— 3e : transformations ——— */
  gen({
    id: "m3-tra-volume", unit: M("3e", "transfo"), title: "Agrandissement : effet sur un volume", stage: "application",
    make: (r, id) => {
      const k = r.pick([2, 3, 4, 1.5, 0.5]), v = r.pick([8, 16, 24, 40, 64, 80, 120]);
      const res = v * k ** 3;
      const verb = k > 1 ? "agrandit" : "réduit";
      return {
        activity: ask({
          id, stage: "application", competence: "raisonner",
          context: `On ${verb} un solide de volume ${v} cm³ dans le rapport ${fr(k)}.`,
          prompt: "Quel est le volume du nouveau solide, en cm³ ?",
          expected: res,
          errors: [
            { value: v * k, code: "longueur", message: "Ce sont les longueurs qui sont multipliées par k. Les volumes sont multipliés par k³.", type: "conceptuelle" },
            { value: v * k * k, code: "aire", message: "Ce sont les aires qui sont multipliées par k². Les volumes sont multipliés par k³.", type: "conceptuelle" },
          ],
          hint: "Dans un agrandissement de rapport k, les volumes sont multipliés par k³.",
          partHint: `k³ = ${fr(k)} × ${fr(k)} × ${fr(k)} = ${fr(k ** 3)}.`,
          solution: [`k³ = ${fr(k ** 3)}.`, `${v} × ${fr(k ** 3)} = ${fr(res)} cm³.`],
          recap: `Nouveau volume : ${fr(res)} cm³`,
          review: "Agrandissement et réduction",
          takeaway: "Rapport k : longueurs × k, aires × k², volumes × k³.",
        }),
        verify: () => close(Math.cbrt(res / v), k),
      };
    },
  }),
  gen({
    id: "m3-tra-translation", unit: M("3e", "transfo"), title: "Image d'un point par une translation", stage: "rappel",
    make: (r, id) => {
      const ax = r.int(-5, 5), ay = r.int(-5, 5), u = r.nonZero(6), v = r.nonZero(6), bx = r.int(-5, 5), by = r.int(-5, 5);
      return {
        activity: problem({
          id, stage: "rappel", competence: "representer",
          context: `Dans un repère, la translation t transforme A(${fr(ax)} ; ${fr(ay)}) en A′(${fr(ax + u)} ; ${fr(ay + v)}). On note B′ l'image de B(${fr(bx)} ; ${fr(by)}) par t.`,
          hint: "Une translation déplace tous les points de la même façon.",
          takeaway: "Par une translation, tous les points se déplacent du même nombre d'unités, dans la même direction et le même sens.",
          parts: [
            { prompt: "Quelle est l'abscisse de B′ ?", expected: bx + u, errors: [{ value: bx - u, code: "sens", message: "Le déplacement se fait dans le même sens que de A vers A′.", type: "procedurale" }], hint: `De A à A′, l'abscisse ${u > 0 ? "augmente" : "diminue"} de ${Math.abs(u)}.`, solution: [`${fr(ax + u)} − ${par(ax)} = ${fr(u)}.`, `${fr(bx)} ${u > 0 ? "+" : "−"} ${Math.abs(u)} = ${fr(bx + u)}.`], recap: `Abscisse de B′ : ${fr(bx + u)}`, review: "Translation" },
            { prompt: "Quelle est l'ordonnée de B′ ?", expected: by + v, errors: [{ value: by - v, code: "sens", message: "Le déplacement se fait dans le même sens que de A vers A′.", type: "procedurale" }], hint: `De A à A′, l'ordonnée ${v > 0 ? "augmente" : "diminue"} de ${Math.abs(v)}.`, solution: [`${fr(ay + v)} − ${par(ay)} = ${fr(v)}.`, `${fr(by)} ${v > 0 ? "+" : "−"} ${Math.abs(v)} = ${fr(by + v)}.`], recap: `Ordonnée de B′ : ${fr(by + v)}`, review: "Translation" },
          ],
        }),
        verify: () => evaluate(`${par(bx)} + (${par(ax + u)} − ${par(ax)})`) === bx + u && evaluate(`${par(by)} + (${par(ay + v)} − ${par(ay)})`) === by + v,
      };
    },
  }),

  /* ——— 3e : espace ——— */
  gen({
    id: "m3-esp-section-sphere", unit: M("3e", "espace"), title: "Rayon de la section d'une sphère", stage: "transfert",
    make: (r, id) => {
      const [big, d, small] = r.pick([[5, 3, 4], [5, 4, 3], [10, 6, 8], [10, 8, 6], [13, 5, 12], [13, 12, 5], [15, 9, 12], [15, 12, 9], [17, 8, 15], [17, 15, 8], [20, 12, 16], [20, 16, 12], [25, 7, 24], [25, 24, 7]] as const);
      return {
        activity: ask({
          id, stage: "transfert", competence: "raisonner",
          context: `Une sphère de centre O et de rayon ${big} cm est coupée par un plan situé à ${d} cm de O. La section est un cercle.`,
          prompt: "Quel est le rayon de ce cercle, en centimètres ?",
          expected: small,
          errors: [{ value: big - d, code: "difference", message: "On ne soustrait pas les longueurs : le triangle formé est rectangle, utilise le théorème de Pythagore.", type: "conceptuelle" }],
          hint: "Le centre de la sphère, le centre du cercle et un point du cercle forment un triangle rectangle.",
          partHint: `Le rayon de la sphère (${big} cm) est l'hypoténuse : r² = ${big}² − ${d}².`,
          solution: [`r² = ${big}² − ${d}² = ${big * big} − ${d * d} = ${small * small}.`, `r = ${small} cm.`],
          recap: `Rayon de la section : ${small} cm`,
          review: "Section d'une sphère",
          takeaway: "La section d'une sphère par un plan est un cercle ; son rayon se calcule avec le théorème de Pythagore.",
        }),
        verify: () => small * small + d * d === big * big,
      };
    },
  }),

  /* ——— 3e : algorithmique ——— */
  gen({
    id: "m3-alg-condition", unit: M("3e", "algo"), title: "Suivre une instruction conditionnelle", stage: "application",
    make: (r, id) => {
      const seuil = r.int(5, 15), a = r.int(2, 4), b = r.int(3, 9), x = r.int(1, 20);
      const res = x > seuil ? x * a : x + b;
      return {
        activity: ask({
          id, stage: "application", competence: "raisonner",
          stimulus: mockCode("Programme", [`x = ${x}`, `if x > ${seuil}:`, `    y = x * ${a}`, "else:", `    y = x + ${b}`, "print(y)"]),
          context: "Voici un programme écrit en Python.",
          prompt: "Quel nombre affiche-t-il ?",
          expected: res,
          errors: [{ value: x > seuil ? x + b : x * a, code: "branche", message: `Vérifie la condition : ${x} > ${seuil} est ${x > seuil ? "vrai" : "faux"}.`, type: "procedurale" }],
          hint: "Teste d'abord la condition : est-elle vraie ou fausse ?",
          partHint: `${x} > ${seuil} est ${x > seuil ? "vrai : on exécute la première instruction" : "faux : on exécute l'instruction qui suit else"}.`,
          solution: [`${x} > ${seuil} est ${x > seuil ? "vrai" : "faux"}.`, x > seuil ? `y = ${x} × ${a} = ${res}.` : `y = ${x} + ${b} = ${res}.`],
          recap: `Affiche ${res}`,
          review: "Instruction conditionnelle",
          takeaway: "Dans un « si… sinon », une seule des deux branches est exécutée, selon que la condition est vraie ou fausse.",
        }),
        verify: () => (x > seuil && res === x * a) || (x <= seuil && res === x + b),
      };
    },
  }),
  gen({
    id: "m3-alg-compteur", unit: M("3e", "algo"), title: "Compter avec une boucle et une condition", stage: "transfert",
    make: (r, id) => {
      const n = r.int(8, 20), d = r.pick([2, 3, 4, 5]);
      let count = 0;
      for (let i = 1; i <= n; i++) if (i % d === 0) count++;
      return {
        activity: ask({
          id, stage: "transfert", competence: "raisonner",
          stimulus: mockCode("Programme", ["c = 0", `for i in range(1, ${n + 1}):`, `    if i % ${d} == 0:`, "        c = c + 1", "print(c)"]),
          context: `Voici un programme écrit en Python. L'opération i % ${d} donne le reste de la division de i par ${d}.`,
          prompt: "Quel nombre affiche-t-il ?",
          expected: count,
          errors: [{ value: n, code: "tous", message: "Le compteur n'augmente que lorsque la condition est vraie, pas à chaque tour.", type: "procedurale" }],
          hint: `La condition est vraie quand i est un multiple de ${d}.`,
          partHint: `Compte les multiples de ${d} entre 1 et ${n}.`,
          solution: [`i prend les valeurs de 1 à ${n}.`, `Multiples de ${d} : ${Array.from({ length: count }, (_, k) => (k + 1) * d).join(", ")}.`, `Le programme affiche ${count}.`],
          recap: `Affiche ${count}`,
          review: "Boucle et condition",
          takeaway: "range(1, n + 1) parcourt les entiers de 1 à n ; un compteur n'augmente que si la condition est vraie.",
        }),
        verify: () => count === Math.floor(n / d),
      };
    },
  }),
];
