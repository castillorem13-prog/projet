import { ask, classify, gen, graph, mcq, mockCode, mockTable, problem } from "../build";
import { evaluate, sameExpression } from "../evaluate";
import { close, fr, frac, gcd, par, poly, pow, round, sub } from "../format";
import type { Generator } from "../types";

/**
 * Compléments de mathématiques du lycée (seconde, première de spécialité et de tronc commun) :
 * chaque chapitre propose plusieurs formes d'exercices, de l'automatisme au problème.
 */

const simp = (n: number, d: number) => {
  const g = gcd(n, d) || 1;
  const [a, b] = d < 0 ? [-n / g, -d / g] : [n / g, d / g];
  return b === 1 ? fr(a) : frac(a, b);
};
const pt = (x: number, y: number) => `(${fr(x)} ; ${fr(y)})`;
const FRACTION = "Réponds par une fraction (par exemple 3/4) ou par un nombre décimal.";
const sign = (r: { chance: (p: number) => boolean }) => (r.chance(0.5) ? -1 : 1);

/** Implications usuelles, rédigées en toutes lettres : énoncé direct, réciproque, contraposée, et deux pièges. */
const IMPLICATIONS: { direct: string; converse: string; contrapositive: string; inverse: string; denied: string; verdict: string }[] = [
  { direct: "Si un entier est un multiple de 6, alors il est un multiple de 3", converse: "Si un entier est un multiple de 3, alors il est un multiple de 6", contrapositive: "Si un entier n'est pas un multiple de 3, alors il n'est pas un multiple de 6", inverse: "Si un entier n'est pas un multiple de 6, alors il n'est pas un multiple de 3", denied: "Si un entier est un multiple de 6, alors il n'est pas un multiple de 3", verdict: "Elle est fausse : 9 est un multiple de 3, mais pas de 6." },
  { direct: "Si un quadrilatère est un carré, alors c'est un rectangle", converse: "Si un quadrilatère est un rectangle, alors c'est un carré", contrapositive: "Si un quadrilatère n'est pas un rectangle, alors ce n'est pas un carré", inverse: "Si un quadrilatère n'est pas un carré, alors ce n'est pas un rectangle", denied: "Si un quadrilatère est un carré, alors ce n'est pas un rectangle", verdict: "Elle est fausse : un rectangle n'est pas toujours un carré." },
  { direct: "Si un triangle est équilatéral, alors il est isocèle", converse: "Si un triangle est isocèle, alors il est équilatéral", contrapositive: "Si un triangle n'est pas isocèle, alors il n'est pas équilatéral", inverse: "Si un triangle n'est pas équilatéral, alors il n'est pas isocèle", denied: "Si un triangle est équilatéral, alors il n'est pas isocèle", verdict: "Elle est fausse : un triangle isocèle n'a pas toujours trois côtés égaux." },
  { direct: "Si un entier se termine par 5, alors il est divisible par 5", converse: "Si un entier est divisible par 5, alors il se termine par 5", contrapositive: "Si un entier n'est pas divisible par 5, alors il ne se termine pas par 5", inverse: "Si un entier ne se termine pas par 5, alors il n'est pas divisible par 5", denied: "Si un entier se termine par 5, alors il n'est pas divisible par 5", verdict: "Elle est fausse : 10 est divisible par 5 et se termine par 0." },
  { direct: "Si un nombre est supérieur à 2, alors son carré est supérieur à 4", converse: "Si le carré d'un nombre est supérieur à 4, alors ce nombre est supérieur à 2", contrapositive: "Si le carré d'un nombre n'est pas supérieur à 4, alors ce nombre n'est pas supérieur à 2", inverse: "Si un nombre n'est pas supérieur à 2, alors son carré n'est pas supérieur à 4", denied: "Si un nombre est supérieur à 2, alors son carré n'est pas supérieur à 4", verdict: "Elle est fausse : le carré de −3 est 9, supérieur à 4, alors que −3 n'est pas supérieur à 2." },
  { direct: "Si un entier est pair, alors son carré est pair", converse: "Si le carré d'un entier est pair, alors cet entier est pair", contrapositive: "Si le carré d'un entier n'est pas pair, alors cet entier n'est pas pair", inverse: "Si un entier n'est pas pair, alors son carré n'est pas pair", denied: "Si un entier est pair, alors son carré n'est pas pair", verdict: "Elle est vraie : le carré d'un entier impair est impair, donc un carré pair vient d'un entier pair." },
  { direct: "Si un triangle a deux angles de 60°, alors il est équilatéral", converse: "Si un triangle est équilatéral, alors il a deux angles de 60°", contrapositive: "Si un triangle n'est pas équilatéral, alors il n'a pas deux angles de 60°", inverse: "Si un triangle n'a pas deux angles de 60°, alors il n'est pas équilatéral", denied: "Si un triangle a deux angles de 60°, alors il n'est pas équilatéral", verdict: "Elle est vraie : un triangle équilatéral a trois angles de 60°." },
  { direct: "Si un quadrilatère est un losange, alors ses diagonales sont perpendiculaires", converse: "Si les diagonales d'un quadrilatère sont perpendiculaires, alors c'est un losange", contrapositive: "Si les diagonales d'un quadrilatère ne sont pas perpendiculaires, alors ce n'est pas un losange", inverse: "Si un quadrilatère n'est pas un losange, alors ses diagonales ne sont pas perpendiculaires", denied: "Si un quadrilatère est un losange, alors ses diagonales ne sont pas perpendiculaires", verdict: "Elle est fausse : un cerf-volant a des diagonales perpendiculaires sans être un losange." },
  { direct: "Si un nombre est égal à 3, alors son carré est égal à 9", converse: "Si le carré d'un nombre est égal à 9, alors ce nombre est égal à 3", contrapositive: "Si le carré d'un nombre n'est pas égal à 9, alors ce nombre n'est pas égal à 3", inverse: "Si un nombre n'est pas égal à 3, alors son carré n'est pas égal à 9", denied: "Si un nombre est égal à 3, alors son carré n'est pas égal à 9", verdict: "Elle est fausse : le carré de −3 est aussi égal à 9." },
];

const RADIANS: [deg: number, text: string, num: number, den: number][] = [[30, "π/6", 1, 6], [45, "π/4", 1, 4], [60, "π/3", 1, 3], [90, "π/2", 1, 2], [120, "2π/3", 2, 3], [135, "3π/4", 3, 4], [150, "5π/6", 5, 6], [180, "π", 1, 1], [270, "3π/2", 3, 2], [360, "2π", 2, 1]];

export const PLUS_LYCEE: Generator[] = [
  /* ——— 2nde : logique et ensembles ——— */
  gen({
    id: "m2-log-intervalle", unit: "2nde-maths-logique", title: "Appartenance à un intervalle", stage: "application",
    make: (r, id) => {
      const a = r.int(-6, 4), b = a + r.int(2, 6);
      const closedA = r.chance(0.5), closedB = r.chance(0.5);
      const text = `${closedA ? "[" : "]"}${fr(a)} ; ${fr(b)}${closedB ? "]" : "["}`;
      const numbers = [a, b, (a + b) / 2, a - r.int(1, 3), b + r.int(1, 3)];
      const inside = (x: number) => (closedA ? x >= a : x > a) && (closedB ? x <= b : x < b);
      return {
        activity: classify(r, {
          id, stage: "application", competence: "raisonner",
          prompt: `Chaque nombre appartient-il à l'intervalle I = ${text} ?`,
          categories: ["Appartient à I", "N'appartient pas à I"],
          items: numbers.map((x) => ({
            text: fr(x), category: inside(x) ? 0 : 1,
            feedback: x === a ? `${fr(a)} est la borne de gauche : le crochet est ${closedA ? "fermé, elle est comprise" : "ouvert, elle est exclue"}.` : x === b ? `${fr(b)} est la borne de droite : le crochet est ${closedB ? "fermé, elle est comprise" : "ouvert, elle est exclue"}.` : inside(x) ? `${fr(x)} est strictement compris entre ${fr(a)} et ${fr(b)}.` : `${fr(x)} n'est pas compris entre ${fr(a)} et ${fr(b)}.`,
          })),
          hint: "Regarde le sens de chaque crochet : tourné vers l'intérieur, la borne est comprise.",
          hints: [`I contient les nombres x tels que ${fr(a)} ${closedA ? "≤" : "<"} x ${closedB ? "≤" : "<"} ${fr(b)}.`, `${fr((a + b) / 2)} est compris entre ${fr(a)} et ${fr(b)} : il appartient à I.`],
          solution: numbers.map((x) => `${fr(x)} : ${inside(x) ? "appartient à I" : "n'appartient pas à I"}.`),
          takeaway: "Crochet tourné vers l'intérieur : la borne est comprise. Crochet tourné vers l'extérieur : elle est exclue.",
        }),
        verify: () => numbers.every((x) => inside(x) === ((x > a || (closedA && x === a)) && (x < b || (closedB && x === b)))) && new Set(numbers).size === 5 && inside((a + b) / 2),
      };
    },
  }),
  gen({
    id: "m2-log-reciproque", unit: "2nde-maths-logique", title: "Écrire la réciproque d'une implication", stage: "rappel", capacity: IMPLICATIONS.length,
    make: (r, id) => {
      const s = r.pick(IMPLICATIONS);
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "raisonner",
          prompt: `Quelle est la réciproque de l'implication : « ${s.direct} » ?`,
          answer: { text: s.converse, feedback: `On échange l'hypothèse et la conclusion. ${s.verdict}` },
          wrong: [
            { text: s.contrapositive, feedback: "C'est la contraposée : elle dit la même chose que l'implication de départ." },
            { text: s.inverse, feedback: "On a nié l'hypothèse et la conclusion sans les échanger : ce n'est pas la réciproque." },
            { text: s.denied, feedback: "C'est l'implication de départ avec une conclusion niée." },
          ],
          hint: "La réciproque échange l'hypothèse et la conclusion.",
          hints: ["Repère ce qui suit « si » et ce qui suit « alors ».", "La réciproque de « si A, alors B » est « si B, alors A »."],
          solution: ["La réciproque de « si A, alors B » est « si B, alors A ».", `Ici : « ${s.converse} ». ${s.verdict}`],
          takeaway: "Une implication et sa réciproque sont deux affirmations différentes : l'une peut être vraie et l'autre fausse.",
        }),
        verify: () => new Set([s.direct, s.converse, s.contrapositive, s.inverse, s.denied]).size === 5 && /^Elle est (vraie|fausse)/.test(s.verdict),
      };
    },
  }),

  /* ——— 2nde : calcul algébrique ——— */
  gen({
    id: "m2-cal-factoriser", unit: "2nde-maths-calcul", title: "Factoriser une différence de deux carrés", stage: "application",
    make: (r, id) => {
      const a = r.int(1, 5), b = r.int(2, 9);
      const expr = poly([[a * a, "x²"], [-b * b, ""]]);
      const ax = a === 1 ? "x" : `${a}x`;
      const right = `(${ax} − ${b})(${ax} + ${b})`;
      const wrong = [
        { text: `(${ax} − ${b})²`, feedback: `(${ax} − ${b})² contient un terme en x : ce n'est pas ${expr}.` },
        { text: `(${ax} + ${b})²`, feedback: `(${ax} + ${b})² contient un terme en x : ce n'est pas ${expr}.` },
        { text: `(${ax} − ${b * b})(${ax} + 1)`, feedback: `${b * b} est le carré de ${b} : c'est ${b} qui apparaît dans chaque facteur.` },
      ];
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "calculer",
          prompt: `Factorise ${expr}.`,
          answer: { text: right, feedback: `${expr} = (${ax})² − ${b}² : on reconnaît a² − b² = (a − b)(a + b).` },
          wrong,
          hint: "Reconnais une différence de deux carrés.",
          hints: ["a² − b² = (a − b)(a + b).", `${a * a === 1 ? "x²" : `${a * a}x²`} est le carré de ${ax} et ${b * b} est le carré de ${b}.`],
          solution: [`${expr} = (${ax})² − ${b}².`, `= ${right}.`],
          takeaway: "Identité remarquable : a² − b² = (a − b)(a + b).",
        }),
        verify: () => sameExpression(expr, right, "x") && wrong.every((w) => !sameExpression(expr, w.text, "x")),
      };
    },
  }),
  gen({
    id: "m2-cal-produit-nul", unit: "2nde-maths-calcul", title: "Résoudre une équation produit nul", stage: "application",
    make: (r, id) => {
      const a = r.pick([1, 2, 3]);
      let p = r.int(-9, 9), q = r.int(-9, 9);
      while (p === q) q = r.int(-9, 9);
      const f1 = poly([[a, "x"], [-a * p, ""]]), f2 = poly([[1, "x"], [-q, ""]]);
      const lo = Math.min(p, q), hi = Math.max(p, q);
      return {
        activity: problem({
          id, stage: "application", competence: "calculer",
          context: `On résout l'équation (${f1})(${f2}) = 0.`,
          hint: "Un produit est nul si, et seulement si, l'un de ses facteurs est nul.",
          takeaway: "A × B = 0 équivaut à A = 0 ou B = 0.",
          parts: [
            { prompt: "Quelle est la plus petite solution ?", expected: lo, errors: [{ value: -lo, code: "signe", message: "Résous chaque équation : attention au signe en isolant x.", type: "procedurale" }], hint: `Résous ${f1} = 0, puis ${f2} = 0.`, solution: [`${f1} = 0 donne x = ${fr(p)}.`, `${f2} = 0 donne x = ${fr(q)}.`, `La plus petite solution est ${fr(lo)}.`], recap: `Plus petite solution : ${fr(lo)}`, review: "Équation produit nul" },
            { prompt: "Quelle est la plus grande solution ?", expected: hi, errors: [{ value: -hi, code: "signe", message: "Résous chaque équation : attention au signe en isolant x.", type: "procedurale" }], hint: "Compare les deux solutions trouvées.", solution: [`Les solutions sont ${fr(lo)} et ${fr(hi)}.`], recap: `Plus grande solution : ${fr(hi)}`, review: "Équation produit nul" },
          ],
        }),
        verify: () => evaluate(`(${f1})(${f2})`, { x: p }) === 0 && evaluate(`(${f1})(${f2})`, { x: q }) === 0 && evaluate(`(${f1})(${f2})`, { x: hi + 1 }) !== 0,
      };
    },
  }),

  /* ——— 2nde : fonctions ——— */
  gen({
    id: "m2-fon-variations", unit: "2nde-maths-fonctions", title: "Lire un tableau de variations", stage: "rappel",
    make: (r, id) => {
      const x1 = r.int(-6, -1), x2 = x1 + r.int(2, 5), x3 = x2 + r.int(2, 5);
      const up = r.chance(0.5);
      const top = r.int(3, 9), y1 = top - r.int(2, 8), y3 = top - r.int(2, 8);
      const [f1, f2, f3] = up ? [y1, top, y3] : [-y1, -top, -y3];
      const extremum = f2;
      return {
        activity: problem({
          id, stage: "rappel", competence: "representer",
          stimulus: mockTable("Tableau de variations de f", ["x", fr(x1), fr(x2), fr(x3)], [["f(x)", fr(f1), fr(f2), fr(f3)], ["Variations", up ? "croissante" : "décroissante", "puis", up ? "décroissante" : "croissante"]]),
          context: `La fonction f est définie sur [${fr(x1)} ; ${fr(x3)}]. Elle est ${up ? "croissante" : "décroissante"} sur [${fr(x1)} ; ${fr(x2)}], puis ${up ? "décroissante" : "croissante"} sur [${fr(x2)} ; ${fr(x3)}].`,
          hint: up ? "Une fonction croissante puis décroissante passe par un maximum." : "Une fonction décroissante puis croissante passe par un minimum.",
          takeaway: "L'extremum d'une fonction se lit dans le tableau de variations, là où le sens de variation change.",
          parts: [
            { prompt: `Quel est le ${up ? "maximum" : "minimum"} de f sur cet intervalle ?`, expected: extremum, errors: [{ value: x2, code: "abscisse", message: `${fr(x2)} est la valeur de x où l'extremum est atteint. L'extremum est une valeur de f(x).`, type: "conceptuelle" }], hint: `Lis la valeur de f(x) là où le sens de variation change.`, solution: [`f change de sens de variation en x = ${fr(x2)}.`, `Le ${up ? "maximum" : "minimum"} est f(${fr(x2)}) = ${fr(extremum)}.`], recap: `${up ? "Maximum" : "Minimum"} : ${fr(extremum)}`, review: "Extremum d'une fonction" },
            { prompt: "Pour quelle valeur de x est-il atteint ?", expected: x2, errors: [{ value: extremum, code: "ordonnee", message: `${fr(extremum)} est la valeur de l'extremum. La question porte sur la valeur de x.`, type: "conceptuelle" }], hint: "Lis la première ligne du tableau.", solution: [`Il est atteint en x = ${fr(x2)}.`], recap: `Atteint en x = ${fr(x2)}`, review: "Extremum d'une fonction" },
          ],
        }),
        verify: () => (up ? f2 > f1 && f2 > f3 : f2 < f1 && f2 < f3) && x1 < x2 && x2 < x3,
      };
    },
  }),
  gen({
    id: "m2-fon-parabole", unit: "2nde-maths-fonctions", title: "Reconnaître la courbe d'une fonction carré", stage: "rappel",
    make: (r, id) => {
      const a = r.pick([-2, -1, -0.5, 0.5, 1, 2]);
      const other = Math.abs(a) === 2 ? a / 4 : a * (Math.abs(a) === 1 ? 2 : 4);
      const f = `f(x) = ${poly([[a, "x²"]])}`;
      return {
        activity: graph(r, {
          id, stage: "rappel", competence: "representer",
          prompt: `Quelle courbe représente la fonction ${f} ?`,
          domain: [-3, 3], range: [-6, 6],
          answer: { curve: { type: "quadratic", a }, feedback: `La parabole est tournée vers le ${a > 0 ? "haut" : "bas"} et passe par le point (1 ; ${fr(a)}).` },
          wrong: [
            { curve: { type: "quadratic", a: -a }, feedback: `Cette parabole est tournée vers le ${a > 0 ? "bas" : "haut"} : le coefficient de x² y est ${a > 0 ? "négatif" : "positif"}.` },
            { curve: { type: "quadratic", a: other }, feedback: `Cette parabole passe par le point (1 ; ${fr(other)}) : elle représente ${poly([[other, "x²"]])}.` },
            { curve: { type: "affine", a, b: 0 }, feedback: "C'est une droite : elle représente une fonction linéaire, pas une fonction du second degré." },
          ],
          hint: "Le signe du coefficient de x² donne le sens de la parabole.",
          hints: ["Coefficient positif : parabole tournée vers le haut ; négatif : vers le bas.", `Calcule f(1) = ${fr(a)}, puis cherche la courbe qui passe par (1 ; ${fr(a)}).`],
          solution: [`Le coefficient de x² est ${fr(a)} : la parabole est tournée vers le ${a > 0 ? "haut" : "bas"}.`, `f(1) = ${fr(a)} : la courbe passe par (1 ; ${fr(a)}).`],
          takeaway: "La courbe de x ↦ ax² est une parabole de sommet l'origine, tournée vers le haut si a > 0, vers le bas si a < 0.",
        }),
        verify: () => other !== a && other !== -a && evaluate(poly([[a, "x²"]]), { x: 1 }) === a,
      };
    },
  }),

  /* ——— 2nde : vecteurs ——— */
  gen({
    id: "m2-vec-norme", unit: "2nde-maths-vecteurs", title: "Calculer une distance dans un repère", stage: "application",
    make: (r, id) => {
      const [p, q, h] = r.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20]] as const);
      const [dx, dy] = r.chance(0.5) ? [p * sign(r), q * sign(r)] : [q * sign(r), p * sign(r)];
      const xa = r.int(-6, 6), ya = r.int(-6, 6);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Dans un repère orthonormé, on donne A${pt(xa, ya)} et B${pt(xa + dx, ya + dy)}.`,
          prompt: "Quelle est la distance AB ?",
          expected: h,
          errors: [
            { value: Math.abs(dx) + Math.abs(dy), code: "somme", message: "On n'additionne pas les écarts : AB = √((x_B − x_A)² + (y_B − y_A)²).", type: "procedurale" },
            { value: dx * dx + dy * dy, code: "racine", message: "Tu as calculé AB². Il reste à prendre la racine carrée.", type: "procedurale" },
          ],
          hint: "AB = √((x_B − x_A)² + (y_B − y_A)²).",
          partHint: `Calcule d'abord AB² = ${par(dx)}² + ${par(dy)}².`,
          solution: [`x_B − x_A = ${fr(dx)} et y_B − y_A = ${fr(dy)}.`, `AB² = ${par(dx)}² + ${par(dy)}² = ${dx * dx + dy * dy}.`, `AB = ${h}.`],
          recap: `AB = ${h}`,
          review: "Distance dans un repère",
          takeaway: "Dans un repère orthonormé, AB = √((x_B − x_A)² + (y_B − y_A)²).",
        }),
        verify: () => close(Math.hypot(dx, dy), h),
      };
    },
  }),
  gen({
    id: "m2-vec-operations", unit: "2nde-maths-vecteurs", title: "Coordonnées d'une combinaison de vecteurs", stage: "rappel",
    make: (r, id) => {
      const a = r.int(-6, 6), b = r.int(-6, 6), c = r.int(-6, 6), d = r.int(-6, 6), k = r.pick([-3, -2, 2, 3, 4]);
      const x = k * a + c, y = k * b + d;
      return {
        activity: problem({
          id, stage: "rappel", competence: "calculer",
          context: `On donne les vecteurs u${pt(a, b)} et v${pt(c, d)}. On note w = ${fr(k)}u + v.`,
          hint: "On calcule séparément les abscisses et les ordonnées.",
          takeaway: "Les coordonnées de ku + v sont (k × x_u + x_v ; k × y_u + y_v).",
          parts: [
            { prompt: "Quelle est l'abscisse de w ?", expected: x, errors: [{ value: k * (a + c), code: "distribue", message: `Le coefficient ${fr(k)} ne multiplie que u, pas v.`, type: "procedurale" }], hint: `Calcule ${fr(k)} × ${par(a)} + ${par(c)}.`, solution: [`${fr(k)} × ${par(a)} + ${par(c)} = ${fr(x)}.`], recap: `Abscisse de w : ${fr(x)}`, review: "Opérations sur les vecteurs" },
            { prompt: "Quelle est l'ordonnée de w ?", expected: y, errors: [{ value: k * (b + d), code: "distribue", message: `Le coefficient ${fr(k)} ne multiplie que u, pas v.`, type: "procedurale" }], hint: `Calcule ${fr(k)} × ${par(b)} + ${par(d)}.`, solution: [`${fr(k)} × ${par(b)} + ${par(d)} = ${fr(y)}.`], recap: `Ordonnée de w : ${fr(y)}`, review: "Opérations sur les vecteurs" },
          ],
        }),
        verify: () => evaluate(`${fr(k)} × ${par(a)} + ${par(c)}`) === x && evaluate(`${fr(k)} × ${par(b)} + ${par(d)}`) === y,
      };
    },
  }),

  /* ——— 2nde : droites ——— */
  gen({
    id: "m2-dro-pente", unit: "2nde-maths-reperee", title: "Calculer un coefficient directeur", stage: "rappel",
    make: (r, id) => {
      const m = r.pick([-3, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 3]);
      const dx = Number.isInteger(m) ? r.pick([1, 2, 3, 4]) : r.pick([2, 4]);
      const xa = r.int(-5, 3), ya = r.int(-5, 5);
      const xb = xa + dx, yb = ya + m * dx;
      return {
        activity: ask({
          id, stage: "rappel", competence: "calculer",
          context: `La droite (AB) passe par A${pt(xa, ya)} et B${pt(xb, yb)}.`,
          prompt: "Quel est son coefficient directeur ?",
          expected: m,
          errors: [
            { value: round(dx / (m * dx), 4), code: "inverse", message: "On divise la différence des ordonnées par celle des abscisses, pas l'inverse.", type: "procedurale" },
            { value: -m, code: "signe", message: "Garde le même ordre des points au numérateur et au dénominateur.", type: "procedurale" },
          ],
          hint: "m = (y_B − y_A) ÷ (x_B − x_A).",
          partHint: `y_B − y_A = ${fr(yb - ya)} et x_B − x_A = ${fr(dx)}.`,
          solution: [`m = (${fr(yb)} − ${par(ya)}) ÷ (${fr(xb)} − ${par(xa)}) = ${fr(yb - ya)} ÷ ${fr(dx)} = ${fr(m)}.`],
          recap: `m = ${fr(m)}`,
          review: "Coefficient directeur",
          takeaway: "Coefficient directeur de (AB) : m = (y_B − y_A) ÷ (x_B − x_A).",
        }),
        verify: () => close(ya + m * (xb - xa), yb) && xb !== xa,
      };
    },
  }),
  gen({
    id: "m2-dro-appartenance", unit: "2nde-maths-reperee", title: "Tester si un point est sur une droite", stage: "application",
    make: (r, id) => {
      const a = r.pick([-3, -2, -1, 2, 3, 4]), b = r.nonZero(6);
      const xs = r.sample([-3, -2, -1, 1, 2, 3, 4], 4) as [number, number, number, number];
      const line = poly([[a, "x"], [b, ""]]);
      const on = (x: number, y: number) => y === a * x + b;
      const wrong: [number, number][] = [[xs[1], a * xs[1] + b + r.pick([-2, -1, 1, 2])], [xs[2], -a * xs[2] + b], [xs[3], a * xs[3] - b]];
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "raisonner",
          prompt: `Lequel de ces points appartient à la droite d'équation y = ${line} ?`,
          answer: { text: pt(xs[0], a * xs[0] + b), feedback: `Pour x = ${fr(xs[0])}, on trouve y = ${fr(a * xs[0] + b)} : les coordonnées vérifient l'équation.` },
          wrong: wrong.map(([x, y]) => ({ text: pt(x, y), feedback: `Pour x = ${fr(x)}, l'équation donne y = ${fr(a * x + b)}, pas ${fr(y)}.` })),
          hint: "Remplace x par l'abscisse du point et compare le résultat à son ordonnée.",
          hints: ["Un point est sur la droite si ses coordonnées vérifient l'équation.", `Pour x = ${fr(xs[0])} : ${fr(a)} × ${par(xs[0])} ${b > 0 ? "+" : "−"} ${Math.abs(b)} = ${fr(a * xs[0] + b)}.`],
          solution: [`Pour x = ${fr(xs[0])} : y = ${fr(a * xs[0] + b)}.`, `Le point ${pt(xs[0], a * xs[0] + b)} est sur la droite.`],
          takeaway: "Un point appartient à une droite si, et seulement si, ses coordonnées vérifient l'équation de la droite.",
        }),
        verify: () => on(xs[0], evaluate(line, { x: xs[0] })) && wrong.every(([x, y]) => !on(x, y)),
      };
    },
  }),

  /* ——— 2nde : statistiques ——— */
  gen({
    id: "m2-sta-marginale", unit: "2nde-maths-stats", title: "Fréquence marginale dans un tableau croisé", stage: "application",
    make: (r, id) => {
      const total = r.pick([100, 200, 400]);
      const girls = (total * r.pick([40, 45, 50, 52, 60])) / 100;
      const boys = total - girls;
      const gDp = Math.round((girls * r.pick([50, 60, 70, 80])) / 100), bDp = Math.round((boys * r.pick([40, 50, 60, 75])) / 100);
      const dp = gDp + bDp;
      const res = round((dp * 100) / total, 2);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          stimulus: mockTable("Régime des élèves de seconde", ["", "Demi-pensionnaires", "Externes", "Total"], [["Filles", String(gDp), String(girls - gDp), String(girls)], ["Garçons", String(bDp), String(boys - bDp), String(boys)], ["Total", String(dp), String(total - dp), String(total)]]),
          context: `Le tableau décrit les ${total} élèves de seconde d'un lycée.`,
          prompt: "Quel pourcentage des élèves de seconde est demi-pensionnaire ?",
          expected: res,
          errors: [{ value: round((gDp * 100) / girls, 2), code: "conditionnelle", message: "Tu as calculé la part des demi-pensionnaires parmi les filles. La question porte sur tous les élèves.", type: "conceptuelle" }],
          hint: "La fréquence marginale se lit dans la ligne ou la colonne « Total ».",
          partHint: `Il y a ${dp} demi-pensionnaires sur ${total} élèves.`,
          solution: [`${dp} ÷ ${total} = ${fr(dp / total)}.`, `Soit ${fr(res)} %.`],
          recap: `Demi-pensionnaires : ${fr(res)} %`,
          review: "Fréquence marginale",
          takeaway: "Une fréquence marginale compare un total de ligne ou de colonne à l'effectif total.",
        }),
        verify: () => gDp + bDp + (girls - gDp) + (boys - bDp) === total && close(res * total, dp * 100),
      };
    },
  }),

  /* ——— 2nde : probabilités ——— */
  gen({
    id: "m2-pro-cartes", unit: "2nde-maths-proba", title: "Probabilité avec un jeu de cartes", stage: "rappel",
    make: (r, id) => {
      const size = r.pick([32, 52]);
      const perSuit = size / 4;
      const events: { label: string; count: number; why: string }[] = [
        { label: "un as", count: 4, why: "Il y a un as par couleur, soit 4 as." },
        { label: "un cœur", count: perSuit, why: `Chaque couleur compte ${perSuit} cartes.` },
        { label: "une figure (valet, dame ou roi)", count: 12, why: "Il y a 3 figures par couleur, soit 12 figures." },
        { label: "un roi rouge", count: 2, why: "Les rois rouges sont le roi de cœur et le roi de carreau." },
        { label: "une carte noire", count: size / 2, why: "La moitié des cartes sont noires (pique et trèfle)." },
        { label: "le valet de pique", count: 1, why: "Cette carte est unique dans le jeu." },
      ];
      const e = r.pick(events);
      const res = e.count / size;
      return {
        activity: ask({
          id, stage: "rappel", competence: "raisonner",
          context: `On tire au hasard une carte dans un jeu de ${size} cartes.`,
          prompt: `Quelle est la probabilité d'obtenir ${e.label} ? ${FRACTION}`,
          expected: res,
          tolerance: { abs: 1e-6, rel: 1e-5 },
          hint: "Compte les cartes favorables, puis divise par le nombre de cartes du jeu.",
          partHint: e.why,
          solution: [`${e.why} Il y a donc ${e.count} carte${e.count > 1 ? "s" : ""} favorable${e.count > 1 ? "s" : ""} sur ${size}.`, `Probabilité : ${simp(e.count, size)}.`],
          recap: `P = ${simp(e.count, size)}`,
          review: "Situation d'équiprobabilité",
          takeaway: "En situation d'équiprobabilité, P(A) = nombre d'issues favorables ÷ nombre d'issues possibles.",
        }),
        verify: () => e.count >= 1 && e.count <= size && close(res * size, e.count),
      };
    },
  }),

  /* ——— 2nde : algorithmique ——— */
  gen({
    id: "m2-alg-boucle", unit: "2nde-maths-algo", title: "Prévoir le résultat d'une boucle bornée", stage: "application",
    make: (r, id) => {
      const n = r.int(4, 10), k = r.int(1, 4), start = r.int(0, 10);
      let s = start;
      for (let i = 1; i <= n; i++) s += k * i;
      return {
        activity: ask({
          id, stage: "application", competence: "raisonner",
          stimulus: mockCode("Programme", [`s = ${start}`, `for i in range(1, ${n + 1}):`, `    s = s + ${k} * i`, "print(s)"]),
          context: "Voici un programme écrit en Python.",
          prompt: "Quel nombre affiche-t-il ?",
          expected: s,
          errors: [{ value: start + k * n, code: "dernier", message: "À chaque tour, on ajoute au total : il faut cumuler tous les tours, pas seulement le dernier.", type: "procedurale" }],
          hint: `i prend successivement les valeurs 1, 2, …, ${n}.`,
          partHint: `On ajoute ${k} × 1, puis ${k} × 2, et ainsi de suite jusqu'à ${k} × ${n}.`,
          solution: [`Somme ajoutée : ${k} × (1 + 2 + … + ${n}) = ${k} × ${(n * (n + 1)) / 2} = ${(k * n * (n + 1)) / 2}.`, `${start} + ${(k * n * (n + 1)) / 2} = ${s}.`],
          recap: `Affiche ${s}`,
          review: "Boucle bornée",
          takeaway: "range(1, n + 1) fait prendre à i les valeurs de 1 à n ; une variable d'accumulation garde le total d'un tour à l'autre.",
        }),
        verify: () => s === start + (k * n * (n + 1)) / 2,
      };
    },
  }),
  gen({
    id: "m2-alg-condition", unit: "2nde-maths-algo", title: "Suivre une fonction avec un test", stage: "rappel",
    make: (r, id) => {
      const seuil = r.int(0, 10), b = r.int(1, 9), c = r.int(2, 5), x = r.int(-5, 15);
      const res = x < seuil ? x + b : c * x;
      return {
        activity: ask({
          id, stage: "rappel", competence: "raisonner",
          stimulus: mockCode("Fonction", ["def f(x):", `    if x < ${seuil}:`, `        return x + ${b}`, "    else:", `        return ${c} * x`]),
          context: "Voici une fonction écrite en Python.",
          prompt: `Que renvoie f(${x}) ?`,
          expected: res,
          errors: [{ value: x < seuil ? c * x : x + b, code: "branche", message: `Vérifie le test : ${fr(x)} < ${seuil} est ${x < seuil ? "vrai" : "faux"}.`, type: "procedurale" }],
          hint: "Évalue d'abord le test, puis exécute une seule des deux branches.",
          partHint: `${fr(x)} < ${seuil} est ${x < seuil ? "vrai : la fonction renvoie x + " + b : "faux : la fonction renvoie " + c + " fois x"}.`,
          solution: [`${fr(x)} < ${seuil} est ${x < seuil ? "vrai" : "faux"}.`, x < seuil ? `f(${fr(x)}) = ${fr(x)} + ${b} = ${fr(res)}.` : `f(${fr(x)}) = ${c} × ${par(x)} = ${fr(res)}.`],
          recap: `f(${fr(x)}) = ${fr(res)}`,
          review: "Instruction conditionnelle",
          takeaway: "Dans un « if… else », le test décide de la seule branche exécutée ; « return » renvoie le résultat et termine la fonction.",
        }),
        verify: () => (x < seuil ? res - b === x : res / c === x),
      };
    },
  }),

  /* ——— 2nde : automatismes ——— */
  gen({
    id: "m2-aut-puissances", unit: "2nde-maths-automatismes", title: "Règles de calcul sur les puissances", stage: "rappel",
    make: (r, id) => {
      const a = r.pick([2, 3, 5, 7, 10]), m = r.int(2, 9), n = r.int(2, 6);
      const kind = r.int(0, 2);
      const [expr, k, rule] = kind === 0 ? [`${pow(a, m)} × ${pow(a, n)}`, m + n, "aᵐ × aⁿ = aᵐ⁺ⁿ : on additionne les exposants."] : kind === 1 ? [`${pow(a, m + n)} ÷ ${pow(a, n)}`, m, "aᵐ ÷ aⁿ = aᵐ⁻ⁿ : on soustrait les exposants."] : [`(${pow(a, m)})${pow("", n)}`, m * n, "(aᵐ)ⁿ = aᵐⁿ : on multiplie les exposants."];
      const trap = kind === 0 ? m * n : kind === 1 ? (m + n) / n : m + n;
      return {
        activity: ask({
          id, stage: "rappel", competence: "calculer",
          context: `On écrit ${expr} sous la forme d'une seule puissance de ${a}.`,
          prompt: "Quel est l'exposant ?",
          expected: k,
          errors: Number.isInteger(trap) ? [{ value: trap, code: "regle", message: rule, type: "procedurale" }] : [],
          hint: "Produit : on additionne les exposants. Quotient : on les soustrait. Puissance de puissance : on les multiplie.",
          partHint: rule,
          solution: [`${expr} = ${pow(a, k)}, car ${rule.charAt(0).toLowerCase()}${rule.slice(1)}`],
          recap: `${expr} = ${pow(a, k)}`,
          review: "Puissances",
          takeaway: "aᵐ × aⁿ = aᵐ⁺ⁿ ; aᵐ ÷ aⁿ = aᵐ⁻ⁿ ; (aᵐ)ⁿ = aᵐⁿ.",
        }),
        verify: () => (kind === 0 ? a ** m * a ** n : kind === 1 ? a ** (m + n) / a ** n : (a ** m) ** n) === a ** k,
      };
    },
  }),
  gen({
    id: "m2-aut-fraction-pourcentage", unit: "2nde-maths-automatismes", title: "Passer d'une fraction à un pourcentage", stage: "rappel",
    make: (r, id) => {
      const [n, d] = r.pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10], [1, 20], [3, 20], [7, 20], [1, 8], [3, 8], [1, 25], [3, 25], [1, 50]] as const);
      const pct = (n * 100) / d;
      return {
        activity: ask({
          id, stage: "rappel", competence: "calculer",
          context: `On veut écrire la fraction ${frac(n, d)} sous forme de pourcentage.`,
          prompt: `À quel pourcentage ${frac(n, d)} est-il égal ?`,
          expected: pct,
          errors: [{ value: n / d, code: "decimal", message: "C'est l'écriture décimale. Pour un pourcentage, multiplie par 100.", type: "procedurale" }],
          hint: "Calcule le quotient, puis multiplie par 100.",
          partHint: `${frac(n, d)} = ${fr(n / d)}.`,
          solution: [`${n} ÷ ${d} = ${fr(n / d)}.`, `${fr(n / d)} × 100 = ${fr(pct)} %.`],
          recap: `${frac(n, d)} = ${fr(pct)} %`,
          review: "Fractions et pourcentages",
          takeaway: "À connaître : 1/2 = 50 %, 1/4 = 25 %, 3/4 = 75 %, 1/5 = 20 %, 1/10 = 10 %.",
        }),
        verify: () => close(pct * d, n * 100),
      };
    },
  }),

  /* ——— 1re spécialité : exponentielle ——— */
  gen({
    id: "m1-exp-equation", unit: "1re-maths-exponentielle", title: "Résoudre une équation avec l'exponentielle", stage: "application",
    make: (r, id) => {
      const a = r.pick([-4, -3, -2, 2, 3, 4, 5]), x0 = r.int(-5, 5), b = r.int(-6, 6);
      const c = a * x0 + b;
      const left = poly([[a, "x"], [b, ""]]);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `On résout dans ℝ l'équation e^(${left}) = ${c === 0 ? "1" : c === 1 ? "e" : `e^(${fr(c)})`}.`,
          prompt: "Quelle est la solution ?",
          expected: x0,
          errors: [{ value: c - b, code: "division", message: `Il reste à diviser par ${fr(a)} pour isoler x.`, type: "procedurale" }],
          hint: "eᵃ = eᵇ équivaut à a = b.",
          partHint: `L'équation équivaut à ${left} = ${fr(c)}.`,
          solution: [`${c === 0 ? "1 = e^(0), donc " : c === 1 ? "e = e^(1), donc " : ""}${left} = ${fr(c)}.`, `${poly([[a, "x"]])} = ${fr(c - b)}.`, `x = ${fr(x0)}.`],
          recap: `x = ${fr(x0)}`,
          review: "Équations avec l'exponentielle",
          takeaway: "La fonction exponentielle est strictement croissante : eᵃ = eᵇ équivaut à a = b.",
        }),
        verify: () => close(Math.exp(evaluate(left, { x: x0 })), Math.exp(c)),
      };
    },
  }),
  gen({
    id: "m1-exp-derivee", unit: "1re-maths-exponentielle", title: "Dériver une fonction x ↦ k e^(ax)", stage: "application",
    make: (r, id) => {
      const k = r.pick([-3, -2, 2, 3, 4, 5]), a = r.pick([-3, -2, 2, 3, 4]);
      const ax = poly([[a, "x"]]);
      const e = (coef: number) => `${poly([[coef, ""]])}e^(${ax})`;
      const f = (x: number) => k * Math.exp(a * x);
      const wrong = [
        { text: e(k), feedback: "On a oublié de multiplier par la dérivée de l'exposant.", value: (x: number) => k * Math.exp(a * x) },
        { text: `${poly([[k * a, "x"]])}e^(${ax})`, feedback: "On multiplie par le coefficient de x, pas par x lui-même.", value: (x: number) => k * a * x * Math.exp(a * x) },
        { text: e(-k * a), feedback: "Vérifie le signe : on multiplie le coefficient par celui de x dans l'exposant.", value: (x: number) => -k * a * Math.exp(a * x) },
      ];
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "calculer",
          prompt: `f est définie sur ℝ par f(x) = ${e(k)}. Quelle est sa dérivée f′(x) ?`,
          answer: { text: e(k * a), feedback: `La dérivée de e^(${ax}) est ${fr(a)}e^(${ax}) ; on multiplie par ${fr(k)}.` },
          wrong: wrong.map(({ text, feedback }) => ({ text, feedback })),
          hint: "La dérivée de x ↦ e^(ax + b) est x ↦ a e^(ax + b).",
          hints: ["Le coefficient de x dans l'exposant « descend » en facteur.", `${fr(k)} × ${par(a)} = ${fr(k * a)}.`],
          solution: [`(e^(${ax}))′ = ${fr(a)}e^(${ax}).`, `f′(x) = ${fr(k)} × ${par(a)} e^(${ax}) = ${e(k * a)}.`],
          takeaway: "(e^(ax + b))′ = a e^(ax + b).",
        }),
        verify: () => {
          const d = (f(0.3 + 1e-6) - f(0.3 - 1e-6)) / 2e-6;
          return close(d, k * a * Math.exp(a * 0.3), 1e-5) && wrong.every((w) => !close(w.value(0.3), d, 1e-5));
        },
      };
    },
  }),

  /* ——— 1re spécialité : trigonométrie ——— */
  gen({
    id: "m1-tri-radians", unit: "1re-maths-trigo", title: "Convertir des degrés en radians", stage: "rappel", capacity: RADIANS.length,
    make: (r, id) => {
      const i = r.int(0, RADIANS.length - 1);
      const [deg, text, num, den] = RADIANS[i]!;
      const near = RADIANS.filter((_, j) => j !== i).sort((x, y) => Math.abs(x[0] - deg) - Math.abs(y[0] - deg)).slice(0, 4);
      const wrong = r.sample(near, 3);
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "calculer",
          prompt: `Combien de radians mesure un angle de ${deg}° ?`,
          answer: { text, feedback: `${deg} × π ÷ 180 = ${text}.` },
          wrong: wrong.map((w) => ({ text: w[1], feedback: `${w[1]} radians correspondent à ${w[0]}°.` })),
          hint: "180° correspondent à π radians.",
          hints: ["Multiplie la mesure en degrés par π, puis divise par 180.", `${deg} ÷ 180 = ${simp(deg, 180)}.`],
          solution: [`${deg}° = ${deg} × π ÷ 180 radians.`, `${deg} ÷ 180 = ${simp(deg, 180)}, donc l'angle mesure ${text}.`],
          takeaway: "π radians = 180° : pour convertir des degrés en radians, on multiplie par π ÷ 180.",
        }),
        verify: () => deg * den === 180 * num && wrong.every((w) => w[0] !== deg),
      };
    },
  }),
  gen({
    id: "m1-tri-relation", unit: "1re-maths-trigo", title: "Utiliser cos² x + sin² x = 1", stage: "application",
    make: (r, id) => {
      const [p, q, h] = r.pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17], [7, 24, 25], [24, 7, 25]] as const);
      const second = r.chance(0.5);
      const res = (second ? -q : q) / h;
      return {
        activity: ask({
          id, stage: "application", competence: "raisonner",
          context: `x est un réel de l'intervalle ${second ? "]π/2 ; π[" : "]0 ; π/2["} tel que sin x = ${frac(p, h)}.`,
          prompt: `Que vaut cos x ? ${FRACTION}`,
          expected: res,
          tolerance: { abs: 1e-6, rel: 1e-5 },
          errors: [
            { value: -res, code: "signe", message: `Sur ${second ? "]π/2 ; π[" : "]0 ; π/2["}, le cosinus est ${second ? "négatif" : "positif"}.`, type: "conceptuelle" },
            { value: 1 - p / h, code: "sans_carres", message: "La relation porte sur les carrés : cos² x = 1 − sin² x.", type: "procedurale" },
          ],
          hint: "cos² x + sin² x = 1, puis le signe du cosinus dépend de l'intervalle.",
          partHint: `cos² x = 1 − ${frac(p * p, h * h)} = ${frac(q * q, h * h)}.`,
          solution: [`cos² x = 1 − sin² x = 1 − ${frac(p * p, h * h)} = ${frac(q * q, h * h)}.`, `Donc cos x = ${frac(q, h)} ou cos x = ${frac(-q, h)}.`, `Sur ${second ? "]π/2 ; π[" : "]0 ; π/2["}, le cosinus est ${second ? "négatif" : "positif"} : cos x = ${frac(second ? -q : q, h)}.`],
          recap: `cos x = ${frac(second ? -q : q, h)}`,
          review: "Relation entre cosinus et sinus",
          takeaway: "Pour tout réel x, cos² x + sin² x = 1 ; le signe se lit sur le cercle trigonométrique.",
        }),
        verify: () => close(res * res + (p / h) ** 2, 1) && res < 0 === second,
      };
    },
  }),

  /* ——— 1re spécialité : produit scalaire ——— */
  gen({
    id: "m1-ps-angle", unit: "1re-maths-produit-scalaire", title: "Produit scalaire avec les normes et l'angle", stage: "application",
    make: (r, id) => {
      const [deg, cos, name] = r.pick([[0, 1, "1"], [60, 0.5, "1/2"], [90, 0, "0"], [120, -0.5, "−1/2"], [180, -1, "−1"]] as const);
      const nu = r.int(2, 8), nv = r.int(2, 8);
      const res = nu * nv * cos;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Les vecteurs u et v ont pour normes ‖u‖ = ${nu} et ‖v‖ = ${nv}, et forment un angle de ${deg}°.`,
          prompt: "Que vaut le produit scalaire u · v ?",
          expected: res,
          errors: [
            ...(cos !== 1 ? [{ value: nu * nv, code: "sans_cos", message: "N'oublie pas le cosinus de l'angle : u · v = ‖u‖ × ‖v‖ × cos(u, v).", type: "procedurale" as const }] : []),
            ...(cos < 0 ? [{ value: -res, code: "signe", message: `Le cosinus de ${deg}° est négatif.`, type: "procedurale" as const }] : []),
          ],
          hint: "u · v = ‖u‖ × ‖v‖ × cos(u, v).",
          partHint: `cos(${deg}°) = ${name}.`,
          solution: [`u · v = ${nu} × ${nv} × cos(${deg}°) = ${nu} × ${nv} × ${par(cos)} = ${fr(res)}.`],
          recap: `u · v = ${fr(res)}`,
          review: "Produit scalaire",
          takeaway: "u · v = ‖u‖ × ‖v‖ × cos(u, v) : il est nul quand les vecteurs sont orthogonaux.",
        }),
        verify: () => Math.abs(nu * nv * Math.cos((deg * Math.PI) / 180) - res) < 1e-9,
      };
    },
  }),
  gen({
    id: "m1-ps-al-kashi", unit: "1re-maths-produit-scalaire", title: "Formule d'Al-Kashi", stage: "transfert",
    make: (r, id) => {
      const [deg, twoCos] = r.pick([[60, 1], [120, -1], [90, 0]] as const);
      const b = r.int(3, 9), c = r.int(3, 9);
      const res = b * b + c * c - twoCos * b * c;
      return {
        activity: ask({
          id, stage: "transfert", competence: "raisonner",
          context: `Dans le triangle ABC, AB = ${c}, AC = ${b} et l'angle en A mesure ${deg}°.`,
          prompt: "Que vaut BC² ?",
          expected: res,
          errors: twoCos !== 0 ? [{ value: b * b + c * c, code: "pythagore", message: "Le triangle n'est pas rectangle en A : il faut le terme −2 × AB × AC × cos(A).", type: "conceptuelle" }, { value: b * b + c * c + twoCos * b * c, code: "signe", message: `Attention au signe : cos(${deg}°) = ${twoCos > 0 ? "1/2" : "−1/2"}, et le terme est précédé d'un signe moins.`, type: "procedurale" }] : [],
          hint: "BC² = AB² + AC² − 2 × AB × AC × cos(A).",
          partHint: `cos(${deg}°) = ${twoCos === 1 ? "1/2" : twoCos === -1 ? "−1/2" : "0"}, donc 2 × ${c} × ${b} × cos(A) = ${fr(twoCos * b * c)}.`,
          solution: [`BC² = ${c}² + ${b}² − 2 × ${c} × ${b} × cos(${deg}°).`, `BC² = ${c * c} + ${b * b} − ${par(twoCos * b * c)} = ${res}.`],
          recap: `BC² = ${res}`,
          review: "Formule d'Al-Kashi",
          takeaway: "Al-Kashi : a² = b² + c² − 2bc cos(A). Pour un angle droit, on retrouve le théorème de Pythagore.",
        }),
        verify: () => Math.abs(b * b + c * c - 2 * b * c * Math.cos((deg * Math.PI) / 180) - res) < 1e-9,
      };
    },
  }),

  /* ——— 1re spécialité : géométrie repérée ——— */
  gen({
    id: "m1-rep-centre", unit: "1re-maths-reperee", title: "Retrouver le centre et le rayon d'un cercle", stage: "transfert",
    make: (r, id) => {
      const a = r.nonZero(5), b = r.nonZero(5), rad = r.int(2, 7);
      const eq = `${poly([[1, "x²"], [1, "y²"], [-2 * a, "x"], [-2 * b, "y"], [a * a + b * b - rad * rad, ""]])} = 0`;
      return {
        activity: problem({
          id, stage: "transfert", competence: "raisonner",
          context: `Un cercle a pour équation ${eq}.`,
          hint: "Regroupe les termes en x et les termes en y, puis complète les carrés.",
          takeaway: "(x − a)² + (y − b)² = r² est l'équation du cercle de centre (a ; b) et de rayon r.",
          parts: [
            { prompt: "Quelle est l'abscisse du centre ?", expected: a, errors: [{ value: -2 * a, code: "coefficient", message: "Le coefficient de x vaut −2a : divise-le par −2.", type: "procedurale" }, { value: -a, code: "signe", message: "Dans (x − a)², le centre a pour abscisse a : attention au signe.", type: "procedurale" }], hint: `Le coefficient de x est ${fr(-2 * a)} : il vaut −2a.`, solution: [`x² ${-2 * a >= 0 ? "+" : "−"} ${Math.abs(2 * a)}x est le début de (x − ${par(a)})².`, `L'abscisse du centre est ${fr(a)}.`], recap: `Abscisse du centre : ${fr(a)}`, review: "Équation de cercle" },
            { prompt: "Quel est le rayon du cercle ?", expected: rad, errors: [{ value: rad * rad, code: "carre", message: "C'est r². Le rayon est sa racine carrée.", type: "procedurale" }], hint: `(x − ${par(a)})² + (y − ${par(b)})² = r².`, solution: [`L'équation s'écrit (x − ${par(a)})² + (y − ${par(b)})² = ${rad * rad}.`, `Le rayon est ${rad}.`], recap: `Rayon : ${rad}`, review: "Équation de cercle" },
          ],
        }),
        verify: () => [[a + rad, b], [a, b - rad], [a - rad, b]].every(([x, y]) => x! * x! + y! * y! - 2 * a * x! - 2 * b * y! + a * a + b * b - rad * rad === 0),
      };
    },
  }),
  gen({
    id: "m1-rep-normal", unit: "1re-maths-reperee", title: "Lire un vecteur normal à une droite", stage: "rappel",
    make: (r, id) => {
      let a = r.nonZero(6), b = r.nonZero(6);
      while (Math.abs(a) === Math.abs(b)) b = r.nonZero(6);
      const c = r.int(-9, 9);
      const eq = `${poly([[a, "x"], [b, "y"], [c, ""]])} = 0`;
      const wrong = [
        { v: [-b, a], feedback: "C'est un vecteur directeur de la droite : il est orthogonal au vecteur normal." },
        { v: [b, a], feedback: "Les coordonnées sont échangées : le vecteur normal se lit dans l'ordre des coefficients de x et de y." },
        { v: [a, c === b ? c + 1 : c], feedback: "Le terme constant ne donne pas de coordonnée : on lit les coefficients de x et de y." },
      ];
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "representer",
          prompt: `Quel vecteur est normal à la droite d'équation ${eq} ?`,
          answer: { text: pt(a, b), feedback: `Une droite d'équation ax + by + c = 0 a pour vecteur normal n(a ; b), ici ${pt(a, b)}.` },
          wrong: wrong.map((w) => ({ text: pt(w.v[0]!, w.v[1]!), feedback: w.feedback })),
          hint: "Lis les coefficients de x et de y.",
          hints: ["Pour ax + by + c = 0, le vecteur n(a ; b) est normal à la droite.", `Coefficient de x : ${fr(a)} ; coefficient de y : ${fr(b)}.`],
          solution: [`Le coefficient de x est ${fr(a)} et celui de y est ${fr(b)}.`, `Un vecteur normal est n${pt(a, b)}.`],
          takeaway: "La droite d'équation ax + by + c = 0 a pour vecteur normal n(a ; b) et pour vecteur directeur u(−b ; a).",
        }),
        verify: () => a * -b + b * a === 0 && wrong.every((w) => a * w.v[1]! - b * w.v[0]! !== 0),
      };
    },
  }),

  /* ——— 1re spécialité : probabilités conditionnelles ——— */
  gen({
    id: "m1-pro-conditionnelle", unit: "1re-maths-proba", title: "Calculer une probabilité conditionnelle", stage: "application",
    make: (r, id) => {
      const pa = r.pick([0.2, 0.25, 0.4, 0.5, 0.8]), cond = r.pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.75]);
      const pab = round(pa * cond, 4);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `A et B sont deux événements tels que P(A) = ${fr(pa)} et P(A ∩ B) = ${fr(pab)}.`,
          prompt: "Que vaut la probabilité de B sachant A ?",
          expected: cond,
          errors: [
            { value: round(pa * pab, 6), code: "produit", message: "On divise P(A ∩ B) par P(A) : on ne les multiplie pas.", type: "procedurale" },
            { value: round(pa - pab, 6), code: "difference", message: "La probabilité conditionnelle est un quotient, pas une différence.", type: "procedurale" },
          ],
          hint: "P_A(B) = P(A ∩ B) ÷ P(A).",
          partHint: `Calcule ${fr(pab)} ÷ ${fr(pa)}.`,
          solution: [`P_A(B) = ${fr(pab)} ÷ ${fr(pa)} = ${fr(cond)}.`],
          recap: `P_A(B) = ${fr(cond)}`,
          review: "Probabilité conditionnelle",
          takeaway: "P_A(B) = P(A ∩ B) ÷ P(A) : on restreint l'univers à l'événement A.",
        }),
        verify: () => close(cond * pa, pab),
      };
    },
  }),
  gen({
    id: "m1-pro-independance", unit: "1re-maths-proba", title: "Tester l'indépendance de deux événements", stage: "rappel",
    make: (r, id) => {
      const pa = r.pick([0.2, 0.3, 0.4, 0.5, 0.6]), pb = r.pick([0.1, 0.25, 0.4, 0.5, 0.7]);
      const product = round(pa * pb, 4);
      // Écarts possibles : P(A ∩ B) doit rester positive et ne pas dépasser P(A) ni P(B).
      const shifts = [-0.02, 0.03, 0.05].filter((d) => product + d > 0.005 && product + d <= Math.min(pa, pb));
      const independent = !shifts.length || r.chance(0.5);
      const pab = independent ? product : round(product + r.pick(shifts), 4);
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "raisonner",
          prompt: `P(A) = ${fr(pa)}, P(B) = ${fr(pb)} et P(A ∩ B) = ${fr(pab)}. Les événements A et B sont-ils indépendants ?`,
          answer: independent
            ? { text: "Oui, car P(A ∩ B) = P(A) × P(B)", feedback: `${fr(pa)} × ${fr(pb)} = ${fr(product)} : c'est bien P(A ∩ B).` }
            : { text: "Non, car P(A ∩ B) ≠ P(A) × P(B)", feedback: `${fr(pa)} × ${fr(pb)} = ${fr(product)}, alors que P(A ∩ B) = ${fr(pab)}.` },
          wrong: [
            independent ? { text: "Non, car P(A ∩ B) ≠ P(A) × P(B)", feedback: `Refais le produit : ${fr(pa)} × ${fr(pb)} = ${fr(product)}.` } : { text: "Oui, car P(A ∩ B) = P(A) × P(B)", feedback: `Refais le produit : ${fr(pa)} × ${fr(pb)} = ${fr(product)}, pas ${fr(pab)}.` },
            { text: "Oui, car P(A ∩ B) n'est pas nulle", feedback: "Une intersection de probabilité non nulle signifie seulement que A et B ne sont pas incompatibles." },
            { text: "Non, car P(A) et P(B) sont différentes", feedback: "L'indépendance ne compare pas P(A) et P(B) : elle compare P(A ∩ B) au produit P(A) × P(B)." },
          ],
          hint: "Compare P(A ∩ B) au produit P(A) × P(B).",
          hints: ["A et B sont indépendants si, et seulement si, P(A ∩ B) = P(A) × P(B).", `${fr(pa)} × ${fr(pb)} = ${fr(product)}.`],
          solution: [`P(A) × P(B) = ${fr(pa)} × ${fr(pb)} = ${fr(product)}.`, independent ? "C'est égal à P(A ∩ B) : les événements sont indépendants." : `Ce n'est pas égal à P(A ∩ B) = ${fr(pab)} : les événements ne sont pas indépendants.`],
          takeaway: "A et B sont indépendants si, et seulement si, P(A ∩ B) = P(A) × P(B).",
        }),
        verify: () => close(pab, pa * pb) === independent && pab > 0 && pab <= Math.min(pa, pb),
      };
    },
  }),

  /* ——— 1re spécialité : variables aléatoires ——— */
  gen({
    id: "m1-va-equitable", unit: "1re-maths-variables", title: "Rendre un jeu équitable", stage: "application",
    make: (r, id) => {
      const g1 = r.pick([10, 20, 50]), g2 = r.pick([2, 4, 5]);
      const p1 = r.pick([0.05, 0.1, 0.2]), p2 = r.pick([0.2, 0.25, 0.3, 0.4]);
      const esp = round(g1 * p1 + g2 * p2, 4);
      return {
        activity: ask({
          id, stage: "application", competence: "modeliser",
          stimulus: mockTable("Loi du gain (hors mise)", ["Gain (€)", String(g1), String(g2), "0"], [["Probabilité", fr(p1), fr(p2), fr(round(1 - p1 - p2, 4))]]),
          context: "Pour jouer, on paie une mise. Le tableau donne la loi de la somme reçue à la fin de la partie.",
          prompt: "Quelle mise, en euros, rend le jeu équitable ?",
          expected: esp,
          errors: [{ value: g1 + g2, code: "somme", message: "Chaque gain compte en proportion de sa probabilité : calcule l'espérance.", type: "conceptuelle" }],
          hint: "Un jeu est équitable quand la mise est égale à l'espérance de la somme reçue.",
          partHint: `Calcule ${g1} × ${fr(p1)} + ${g2} × ${fr(p2)}.`,
          solution: [`Espérance : ${g1} × ${fr(p1)} + ${g2} × ${fr(p2)} + 0 × ${fr(round(1 - p1 - p2, 4))} = ${fr(esp)}.`, `Le jeu est équitable pour une mise de ${fr(esp)} €.`],
          recap: `Mise équitable : ${fr(esp)} €`,
          review: "Espérance et jeu équitable",
          takeaway: "Un jeu est équitable lorsque l'espérance du gain algébrique (somme reçue − mise) est nulle.",
        }),
        verify: () => close(g1 * p1 + g2 * p2 + 0 * (1 - p1 - p2) - esp, 0) && p1 + p2 < 1,
      };
    },
  }),
  gen({
    id: "m1-va-variance", unit: "1re-maths-variables", title: "Calculer une variance", stage: "transfert",
    make: (r, id) => {
      const values = [0, r.int(1, 3), r.int(4, 6)];
      const [p0, p1] = r.pick([[0.5, 0.25], [0.2, 0.5], [0.4, 0.4], [0.25, 0.5], [0.1, 0.6], [0.3, 0.5]] as const);
      const probs = [p0, p1, round(1 - p0 - p1, 4)];
      const e = round(values.reduce((s, v, i) => s + v * probs[i]!, 0), 6);
      const e2 = round(values.reduce((s, v, i) => s + v * v * probs[i]!, 0), 6);
      const variance = round(e2 - e * e, 6);
      return {
        activity: problem({
          id, stage: "transfert", competence: "calculer",
          stimulus: mockTable("Loi de X", ["Valeur", ...values.map(String)], [["Probabilité", ...probs.map((p) => fr(p))]]),
          context: "La variable aléatoire X suit la loi donnée dans le tableau.",
          hint: "V(X) = E(X²) − E(X)².",
          takeaway: "Variance : V(X) = E(X²) − (E(X))² ; l'écart type est sa racine carrée.",
          parts: [
            { prompt: "Que vaut l'espérance E(X) ?", expected: e, hint: "Multiplie chaque valeur par sa probabilité, puis additionne.", solution: [`E(X) = ${values.map((v, i) => `${v} × ${fr(probs[i]!)}`).join(" + ")} = ${fr(e)}.`], recap: `E(X) = ${fr(e)}`, review: "Espérance" },
            { prompt: "Que vaut la variance V(X) ?", expected: variance, errors: [{ value: e2, code: "sans_carre", message: "C'est E(X²). Il faut encore soustraire le carré de l'espérance.", type: "procedurale" }], hint: "Calcule d'abord E(X²), avec les carrés des valeurs.", solution: [`E(X²) = ${values.map((v, i) => `${v * v} × ${fr(probs[i]!)}`).join(" + ")} = ${fr(e2)}.`, `V(X) = ${fr(e2)} − ${fr(e)}² = ${fr(variance)}.`], recap: `V(X) = ${fr(variance)}`, review: "Variance" },
          ],
        }),
        verify: () => close(values.reduce((s, v, i) => s + (v - e) ** 2 * probs[i]!, 0), variance, 1e-6) && close(probs.reduce((s, p) => s + p, 0), 1),
      };
    },
  }),

  /* ——— 1re tronc commun ——— */
  gen({
    id: "mtc-don-taux", unit: "1re-maths-tc-donnees", title: "Calculer un taux d'évolution", stage: "application",
    make: (r, id) => {
      const v0 = r.pick([80, 120, 200, 250, 400, 500]), t = r.pick([-40, -25, -20, -10, 5, 10, 15, 20, 25, 50]);
      const v1 = (v0 * (100 + t)) / 100;
      const [what, unit] = r.pick([["Le prix d'un article", "€"], ["Le nombre d'abonnés d'un compte", "abonnés"], ["La fréquentation d'un musée", "visiteurs par jour"], ["La production d'une usine", "pièces par heure"]] as const);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `${what} passe de ${fr(v0)} à ${fr(v1)} ${unit}.`,
          prompt: "Quel est le taux d'évolution, en pourcentage ? (négatif pour une baisse)",
          expected: t,
          errors: [
            { value: round(((v1 - v0) * 100) / v1, 2), code: "reference", message: "On divise la variation par la valeur de départ, pas par la valeur d'arrivée.", type: "conceptuelle" },
            { value: v1 - v0, code: "absolue", message: "C'est la variation absolue. Le taux la compare à la valeur de départ.", type: "conceptuelle" },
          ],
          hint: "Taux d'évolution = (valeur d'arrivée − valeur de départ) ÷ valeur de départ.",
          partHint: `Variation : ${fr(v1)} − ${fr(v0)} = ${fr(v1 - v0)}.`,
          solution: [`(${fr(v1)} − ${fr(v0)}) ÷ ${fr(v0)} = ${fr((v1 - v0) / v0)}.`, `Soit ${fr(t)} %.`],
          recap: `Taux d'évolution : ${fr(t)} %`,
          review: "Taux d'évolution",
          takeaway: "Taux d'évolution = (V₁ − V₀) ÷ V₀ ; il est négatif pour une baisse.",
        }),
        verify: () => close(v0 * (1 + t / 100), v1),
      };
    },
  }),
  gen({
    id: "mtc-don-indice", unit: "1re-maths-tc-donnees", title: "Calculer un indice base 100", stage: "transfert",
    make: (r, id) => {
      const v0 = r.pick([40, 50, 80, 125, 200, 250]), idx = r.pick([80, 90, 104, 110, 112, 120, 125, 150]);
      const v1 = (v0 * idx) / 100;
      const year = r.int(2015, 2020);
      return {
        activity: ask({
          id, stage: "transfert", competence: "modeliser",
          context: `Une grandeur vaut ${fr(v0)} en ${year} et ${fr(v1)} en ${year + 5}. On prend l'année ${year} pour base 100.`,
          prompt: `Quel est l'indice de cette grandeur en ${year + 5} ?`,
          expected: idx,
          errors: [{ value: idx - 100, code: "taux", message: "C'est le taux d'évolution en pourcentage. L'indice, lui, part de 100.", type: "conceptuelle" }],
          hint: "Indice = valeur ÷ valeur de l'année de base × 100.",
          partHint: `Calcule ${fr(v1)} ÷ ${fr(v0)} × 100.`,
          solution: [`${fr(v1)} ÷ ${fr(v0)} = ${fr(v1 / v0)}.`, `Indice : ${fr(v1 / v0)} × 100 = ${fr(idx)}.`],
          recap: `Indice en ${year + 5} : ${fr(idx)}`,
          review: "Indice base 100",
          takeaway: "Un indice base 100 se lit comme une évolution : l'indice 112 correspond à une hausse de 12 % depuis l'année de base.",
        }),
        verify: () => close(v1 * 100, idx * v0),
      };
    },
  }),
  gen({
    id: "mtc-pro-arbre", unit: "1re-maths-tc-proba", title: "Lire un arbre pondéré", stage: "application",
    make: (r, id) => {
      const pa = r.pick([0.2, 0.3, 0.4, 0.6, 0.7]), pb = r.pick([0.1, 0.25, 0.5, 0.8, 0.9]);
      const res = round(pa * pb, 4);
      const [a, b] = r.pick([["l'élève est en première", "il déjeune à la cantine"], ["le client a une carte de fidélité", "il achète un article en promotion"], ["la pièce vient de la machine A", "elle est sans défaut"], ["le voyageur prend le train", "il arrive à l'heure"]] as const);
      return {
        activity: ask({
          id, stage: "application", competence: "modeliser",
          context: `On note A l'événement « ${a} » et B l'événement « ${b} ». On sait que P(A) = ${fr(pa)} et que la probabilité de B sachant A vaut ${fr(pb)}.`,
          prompt: "Que vaut P(A ∩ B) ?",
          expected: res,
          errors: [{ value: round(pa + pb, 4), code: "somme", message: "Le long d'un chemin de l'arbre, les probabilités se multiplient.", type: "procedurale" }],
          hint: "Sur un arbre pondéré, on multiplie les probabilités le long d'un chemin.",
          partHint: `Calcule ${fr(pa)} × ${fr(pb)}.`,
          solution: [`P(A ∩ B) = P(A) × P_A(B) = ${fr(pa)} × ${fr(pb)} = ${fr(res)}.`],
          recap: `P(A ∩ B) = ${fr(res)}`,
          review: "Arbre pondéré",
          takeaway: "P(A ∩ B) = P(A) × P_A(B) : c'est le produit des probabilités du chemin.",
        }),
        verify: () => close(res / pa, pb),
      };
    },
  }),
  gen({
    id: "mtc-pro-notation", unit: "1re-maths-tc-proba", title: "Traduire une phrase par une probabilité conditionnelle", stage: "rappel",
    make: (r, id) => {
      const [group, a, aName, b, bName] = r.pick([
        ["Dans un lycée", "l'élève est une fille", "F", "l'élève étudie l'allemand", "A"],
        ["Dans un club", "l'adhérent est majeur", "M", "l'adhérent pratique la natation", "N"],
        ["Dans une usine", "la pièce vient de l'atelier 1", "U", "la pièce a un défaut", "D"],
        ["Dans une ville", "l'habitant a moins de 25 ans", "J", "l'habitant se déplace à vélo", "V"],
        ["Dans une bibliothèque", "le livre est un roman", "R", "le livre est emprunté", "E"],
      ] as const);
      const swap = r.chance(0.5);
      const [given, target] = swap ? [bName, aName] : [aName, bName];
      const [gText, tText] = swap ? [b, a] : [a, b];
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "communiquer",
          prompt: `${group}, on note ${aName} l'événement « ${a} » et ${bName} l'événement « ${b} ». Comment note-t-on la probabilité que ${tText}, sachant que ${gText} ?`,
          answer: { text: `P_${given}(${target})`, feedback: `L'événement connu, ${given}, s'écrit en indice : on calcule la probabilité de ${target} parmi les cas où ${given} est réalisé.` },
          wrong: [
            { text: `P_${target}(${given})`, feedback: `C'est la probabilité de ${given} sachant ${target} : la condition et l'événement cherché sont inversés.` },
            { text: `P(${given} ∩ ${target})`, feedback: "C'est la probabilité que les deux événements soient réalisés ensemble, sans condition." },
            { text: `P(${given} ∪ ${target})`, feedback: "C'est la probabilité que l'un au moins des deux événements soit réalisé." },
          ],
          hint: "Repère ce qui est déjà connu : c'est ce qui suit « sachant que ».",
          hints: ["L'événement connu se place en indice.", `Ici, on sait que ${gText}.`],
          solution: [`On sait que ${gText} : l'événement ${given} est la condition.`, `On note P_${given}(${target}).`],
          takeaway: "P_A(B) se lit « probabilité de B sachant A » : A est la condition, B l'événement dont on cherche la probabilité.",
        }),
        verify: () => given !== target && [aName, bName].includes(given) && [aName, bName].includes(target),
      };
    },
  }),
  gen({
    id: "mtc-sui-arithmetique", unit: "1re-maths-tc-suites", title: "Terme d'une suite arithmétique", stage: "rappel",
    make: (r, id) => {
      const u0 = r.int(-10, 20), q = r.nonZero(7), n = r.int(5, 30);
      const res = u0 + n * q;
      return {
        activity: ask({
          id, stage: "rappel", competence: "calculer",
          context: `La suite (uₙ) est arithmétique, de premier terme u₀ = ${fr(u0)} et de raison ${fr(q)}.`,
          prompt: `Que vaut u${sub(n)} ?`,
          expected: res,
          errors: [{ value: u0 + (n - 1) * q, code: "decalage", message: `De u₀ à u${sub(n)}, on ajoute ${n} fois la raison, pas ${n - 1} fois.`, type: "procedurale" }],
          hint: "uₙ = u₀ + n × r.",
          partHint: `Calcule ${fr(u0)} + ${n} × ${par(q)}.`,
          solution: [`u${sub(n)} = ${fr(u0)} + ${n} × ${par(q)} = ${fr(res)}.`],
          recap: `u${sub(n)} = ${fr(res)}`,
          review: "Suite arithmétique",
          takeaway: "Suite arithmétique de raison r : uₙ = u₀ + n × r.",
        }),
        verify: () => {
          let u = u0;
          for (let i = 0; i < n; i++) u += q;
          return u === res;
        },
      };
    },
  }),
  gen({
    id: "mtc-sui-geometrique", unit: "1re-maths-tc-suites", title: "Terme d'une suite géométrique", stage: "application",
    make: (r, id) => {
      const q = r.pick([2, 3, 10, 0.5]), n = r.int(2, 6);
      const u0 = q === 0.5 ? r.pick([64, 128, 320, 640]) : r.int(1, 9);
      const res = u0 * q ** n;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `La suite (uₙ) est géométrique, de premier terme u₀ = ${fr(u0)} et de raison ${fr(q)}.`,
          prompt: `Que vaut u${sub(n)} ?`,
          expected: res,
          errors: [{ value: u0 * q * n, code: "lineaire", message: `On multiplie ${n} fois par la raison : c'est une puissance, pas un produit par ${n}.`, type: "conceptuelle" }],
          hint: "uₙ = u₀ × qⁿ.",
          partHint: `${fr(q)}${pow("", n)} = ${fr(q ** n)}.`,
          solution: [`u${sub(n)} = ${fr(u0)} × ${fr(q)}${pow("", n)} = ${fr(u0)} × ${fr(q ** n)} = ${fr(res)}.`],
          recap: `u${sub(n)} = ${fr(res)}`,
          review: "Suite géométrique",
          takeaway: "Suite géométrique de raison q : uₙ = u₀ × qⁿ.",
        }),
        verify: () => {
          let u = u0;
          for (let i = 0; i < n; i++) u *= q;
          return close(u, res);
        },
      };
    },
  }),
  gen({
    id: "mtc-aut-coefficient", unit: "1re-maths-tc-automatismes", title: "Taux d'évolution et coefficient multiplicateur", stage: "rappel",
    make: (r, id) => {
      const t = r.pick([2, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50]);
      const up = r.chance(0.5);
      const k = round(up ? 1 + t / 100 : 1 - t / 100, 4);
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "calculer",
          prompt: `Une ${up ? "hausse" : "baisse"} de ${t} % revient à multiplier par…`,
          answer: { text: fr(k), feedback: `${up ? "1 +" : "1 −"} ${t}/100 = ${fr(k)}.` },
          wrong: [
            { text: fr(round(up ? 1 - t / 100 : 1 + t / 100, 4)), feedback: `Ce coefficient correspond à une ${up ? "baisse" : "hausse"} de ${t} %.` },
            { text: fr(t / 100), feedback: `Multiplier par ${fr(t / 100)}, c'est prendre ${t} % de la valeur, pas l'${up ? "augmenter" : "abaisser"} de ${t} %.` },
            { text: fr(t), feedback: "Le coefficient multiplicateur est proche de 1 pour une petite évolution." },
          ],
          hint: `Une ${up ? "hausse" : "baisse"} de t % multiplie par ${up ? "1 + t/100" : "1 − t/100"}.`,
          hints: [`${t} % = ${fr(t / 100)}.`, `${up ? "1 +" : "1 −"} ${fr(t / 100)} = ${fr(k)}.`],
          solution: [`${t} % = ${fr(t / 100)}.`, `Coefficient multiplicateur : ${up ? "1 +" : "1 −"} ${fr(t / 100)} = ${fr(k)}.`],
          takeaway: "Hausse de t % : × (1 + t/100). Baisse de t % : × (1 − t/100).",
        }),
        verify: () => close((k - 1) * 100, up ? t : -t),
      };
    },
  }),
  gen({
    id: "mtc-aut-equation", unit: "1re-maths-tc-automatismes", title: "Résoudre une équation du premier degré", stage: "application",
    make: (r, id) => {
      const a = r.pick([-5, -4, -3, -2, 2, 3, 4, 5, 6]), x0 = r.int(-8, 8), b = r.int(-9, 9);
      const c = a * x0 + b;
      const left = poly([[a, "x"], [b, ""]]);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `On résout l'équation ${left} = ${fr(c)}.`,
          prompt: "Quelle est la solution ?",
          expected: x0,
          errors: [{ value: c - b, code: "division", message: `Il reste à diviser par ${fr(a)}.`, type: "procedurale" }],
          hint: "Isole le terme en x, puis divise par son coefficient.",
          partHint: `${poly([[a, "x"]])} = ${fr(c)} ${b >= 0 ? "−" : "+"} ${Math.abs(b)} = ${fr(c - b)}.`,
          solution: [`${poly([[a, "x"]])} = ${fr(c - b)}.`, `x = ${fr(c - b)} ÷ ${par(a)} = ${fr(x0)}.`],
          recap: `x = ${fr(x0)}`,
          review: "Équation du premier degré",
          takeaway: "Pour résoudre ax + b = c : soustraire b des deux membres, puis diviser par a.",
        }),
        verify: () => evaluate(left, { x: x0 }) === c,
      };
    },
  }),
];
