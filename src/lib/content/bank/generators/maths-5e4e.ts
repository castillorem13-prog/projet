import { ask, gen, mcq, mcqNumber, mockTable, problem, worked } from "../build";
import { evaluate, sameExpression } from "../evaluate";
import { close, fr, frac, gcd, par, poly, pow, round, sup } from "../format";
import type { Generator } from "../types";

/** Mathématiques, 5e et 4e (cycle 4). */

const U5 = (slug: string) => `5e-maths-${slug}`;
const U4 = (slug: string) => `4e-maths-${slug}`;

export const MATHS_5E: Generator[] = [
  /* ——— Nombres relatifs ——— */
  gen({
    id: "m5-rel-somme", unit: U5("relatifs"), title: "Additionner et soustraire des relatifs", stage: "application",
    make: (r, id) => {
      const a = r.nonZero(15), b = r.nonZero(15);
      const minus = r.chance(0.5);
      const expr = `${fr(a)} ${minus ? "−" : "+"} ${par(b)}`;
      const value = minus ? a - b : a + b;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: "Calcul avec des nombres relatifs.",
          prompt: `${expr} = ?`,
          expected: value,
          errors: [
            { value: minus ? a + b : a - b, code: "signe_op", message: minus ? "Soustraire un nombre, c'est ajouter son opposé : − (−3) devient + 3." : "On ajoute ici : ne change pas l'opération.", type: "procedurale" },
            { value: -value, code: "signe", message: "Le signe du résultat est celui du nombre le plus éloigné de zéro.", type: "calcul" },
          ],
          hint: minus ? "Soustraire, c'est ajouter l'opposé." : "Si les signes sont différents, on fait la différence des distances à zéro.",
          solution: minus ? [`${expr} = ${fr(a)} + ${par(-b)}`, `= ${fr(value)}`] : [`${expr} = ${fr(value)}`],
          recap: `${expr} = ${fr(value)}`,
          review: "Somme de relatifs",
          takeaway: "a − b = a + (opposé de b). Pour deux signes différents, on soustrait les distances à zéro et on garde le signe du plus éloigné.",
        }),
        verify: () => evaluate(expr) === value,
      };
    },
  }),
  gen({
    id: "m5-rel-temperature", unit: U5("relatifs"), title: "Écart entre deux températures", stage: "transfert",
    make: (r, id) => {
      const low = -r.int(2, 25), high = r.int(1, 30);
      const city = r.pick(["Moscou", "Montréal", "Oslo", "Helsinki", "Reykjavik"]);
      return {
        activity: ask({
          id, stage: "transfert", competence: "modeliser",
          context: `À ${city}, il fait ${fr(low)} °C la nuit et ${fr(high)} °C l'après-midi.`,
          prompt: "Quel est l'écart de température, en degrés ?",
          expected: high - low,
          errors: [{ value: high + low, code: "somme", message: "L'écart est la distance entre les deux nombres sur la droite graduée : haut − bas.", type: "conceptuelle" }],
          hint: "Sur une droite graduée, combien de degrés pour aller de la plus basse à la plus haute ?",
          solution: [`Écart = ${fr(high)} − ${par(low)} = ${fr(high)} + ${fr(-low)} = ${high - low} °C.`],
          recap: `Écart : ${high - low} °C`,
          review: "Distance entre deux relatifs",
          takeaway: "L'écart entre deux nombres est la différence entre le plus grand et le plus petit.",
        }),
        verify: () => evaluate(`${fr(high)} − ${par(low)}`) === high - low && high - low > 0,
      };
    },
  }),
  gen({
    id: "m5-rel-ranger", unit: U5("relatifs"), title: "Comparer des relatifs", stage: "rappel",
    make: (r, id) => {
      let [a, b] = r.sample([-12, -9, -7, -5, -3, -2, -1, 0, 1, 2, 4, 6, 8, 11], 2) as [number, number];
      if (a >= 0 && b >= 0) a = -a - 3;
      const sign = a > b ? ">" : a < b ? "<" : "=";
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "raisonner",
          prompt: `Quel signe faut-il écrire entre ${fr(a)} et ${fr(b)} ?`,
          answer: { text: `${fr(a)} ${sign} ${fr(b)}`, feedback: "Le plus grand est celui qui est le plus à droite sur la droite graduée." },
          wrong: [
            { text: `${fr(a)} ${sign === ">" ? "<" : ">"} ${fr(b)}`, feedback: "Entre deux négatifs, le plus grand est le plus proche de zéro : −2 > −7." },
            { text: `${fr(a)} = ${fr(b)}`, feedback: "Ces deux nombres sont différents." },
          ],
          hint: "Place les deux nombres sur une droite graduée.",
          solution: [`${fr(a)} est ${a > b ? "à droite" : "à gauche"} de ${fr(b)} sur la droite graduée, donc ${fr(a)} ${sign} ${fr(b)}.`],
          takeaway: "Entre deux nombres négatifs, le plus grand est celui qui est le plus proche de zéro.",
        }),
        verify: () => (a > b) === (sign === ">") && a !== b,
      };
    },
  }),

  /* ——— Fractions ——— */
  gen({
    id: "m5-frac-somme", unit: U5("fractions"), title: "Additionner des fractions (dénominateurs multiples)", stage: "application",
    make: (r, id) => {
      const d = r.int(2, 9), k = r.int(2, 4);
      const a = r.int(1, d - 1), b = r.int(1, d * k - 1);
      const D = d * k, N = a * k + b;
      const g = gcd(N, D);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: "Somme de fractions.",
          prompt: `${frac(a, d)} + ${frac(b, D)} = ? (fraction ou décimal)`,
          expected: N / D,
          tolerance: { rel: 1e-5 },
          errors: [{ value: (a + b) / (d + D), code: "tout", message: "On n'additionne pas les dénominateurs : on met d'abord les fractions au même dénominateur.", type: "conceptuelle" }, { value: (a + b) / D, code: "numerateur", message: `Il faut aussi multiplier le numérateur ${a} par ${k}.`, type: "procedurale" }],
          hint: `Écris ${frac(a, d)} avec le dénominateur ${D}.`,
          solution: [`${frac(a, d)} = ${frac(a * k, D)}.`, `${frac(a * k, D)} + ${frac(b, D)} = ${frac(N, D)}${g > 1 ? ` = ${frac(N / g, D / g)}` : ""}.`],
          recap: `${frac(N / g, D / g)}`,
          review: "Somme de fractions",
          takeaway: "Pour additionner deux fractions, on les écrit avec le même dénominateur, puis on additionne les numérateurs.",
        }),
        verify: () => close(evaluate(`${a}/${d} + ${b}/${D}`), N / D),
      };
    },
  }),
  gen({
    id: "m5-frac-comparer", unit: U5("fractions"), title: "Comparer deux fractions", stage: "rappel",
    make: (r, id) => {
      const d = r.int(2, 8), k = r.int(2, 3);
      let a = r.int(1, 2 * d), b = r.int(1, 2 * d * k);
      if (a * k === b) b++;
      const left = frac(a, d), right = frac(b, d * k);
      const sign = a * k > b ? ">" : "<";
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "raisonner",
          prompt: `Compare ${left} et ${right}.`,
          answer: { text: `${left} ${sign} ${right}`, feedback: `${left} = ${frac(a * k, d * k)}, à comparer avec ${right}.` },
          wrong: [
            { text: `${left} ${sign === ">" ? "<" : ">"} ${right}`, feedback: `Mets au même dénominateur : ${left} = ${frac(a * k, d * k)}.` },
            { text: `${left} = ${right}`, feedback: "Ces fractions ne sont pas égales : compare les numérateurs une fois au même dénominateur." },
          ],
          hint: `Écris ${left} avec le dénominateur ${d * k}.`,
          solution: [`${left} = ${frac(a * k, d * k)}.`, `${a * k} ${sign} ${b}, donc ${left} ${sign} ${right}.`],
          takeaway: "Pour comparer deux fractions, on les écrit avec le même dénominateur et on compare les numérateurs.",
        }),
        verify: () => (a / d > b / (d * k)) === (sign === ">"),
      };
    },
  }),

  /* ——— Expressions littérales ——— */
  gen({
    id: "m5-lit-substituer", unit: U5("expressions"), title: "Calculer une expression pour une valeur", stage: "application",
    make: (r, id) => {
      const a = r.int(2, 9), b = r.int(1, 15), x = r.int(1, 10);
      const forms: [string, number, string][] = [
        [poly([[a, "x"], [b, ""]]), a * x + b, `${a} × ${x} + ${b}`],
        [`${a}(x + ${b})`, a * (x + b), `${a} × (${x} + ${b})`],
        [poly([[1, "x²"], [b, ""]]), x * x + b, `${x}² + ${b}`],
      ];
      const [expr, value, filled] = r.pick(forms);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `On considère l'expression A = ${expr}.`,
          prompt: `Calcule A pour x = ${x}.`,
          expected: value,
          errors: [{ value: Number(`${a}${x}`) + b, code: "concat", message: `${a}x veut dire ${a} × x, pas le nombre ${a}${x}.`, type: "conceptuelle" }],
          hint: "Remplace x par sa valeur, en remettant le signe × .",
          solution: [`A = ${filled}`, `A = ${value}`],
          recap: `A = ${value}`,
          review: "Substituer une valeur",
          takeaway: "Pour calculer une expression, on remplace la lettre par sa valeur et on rétablit les signes ×.",
        }),
        verify: () => evaluate(expr, { x }) === value && evaluate(filled) === value,
      };
    },
  }),
  gen({
    id: "m5-lit-tester", unit: U5("expressions"), title: "Tester une égalité", stage: "transfert",
    make: (r, id) => {
      const a = r.int(2, 6), b = r.int(1, 9), c = r.int(1, 6);
      const sol = r.int(1, 8);
      const d = a * sol + b - c * sol;
      const left = poly([[a, "x"], [b, ""]]), right = poly([[c, "x"], [d, ""]]);
      const test = r.chance(0.5) ? sol : sol + r.pick([1, 2]);
      const ok = a * test + b === c * test + d;
      return {
        activity: mcq(r, {
          id, stage: "transfert", competence: "raisonner",
          prompt: `L'égalité ${left} = ${right} est-elle vraie pour x = ${test} ?`,
          answer: ok ? { text: "Oui", feedback: `Les deux membres valent ${a * test + b}.` } : { text: "Non", feedback: `${a * test + b} ≠ ${c * test + d}.` },
          wrong: ok ? [{ text: "Non", feedback: "Calcule chaque membre séparément : ils sont égaux." }, { text: "On ne peut pas savoir", feedback: "Il suffit de calculer les deux membres pour x = " + test + "." }] : [{ text: "Oui", feedback: "Calcule chaque membre séparément : les résultats diffèrent." }, { text: "On ne peut pas savoir", feedback: "Il suffit de calculer les deux membres pour x = " + test + "." }],
          hint: "Calcule le membre de gauche, puis celui de droite, et compare.",
          solution: [`Gauche : ${a} × ${test} + ${b} = ${a * test + b}.`, `Droite : ${c} × ${test} ${d < 0 ? "−" : "+"} ${Math.abs(d)} = ${c * test + d}.`, ok ? "Égaux : l'égalité est vraie." : "Différents : l'égalité est fausse pour cette valeur."],
          takeaway: "Tester une égalité : on calcule séparément les deux membres pour la valeur donnée.",
        }),
        verify: () => (evaluate(left, { x: test }) === evaluate(right, { x: test })) === ok,
      };
    },
  }),

  /* ——— Proportionnalité ——— */
  gen({
    id: "m5-prop-reduction", unit: U5("propor"), title: "Prix après une réduction", stage: "application",
    make: (r, id) => {
      const p = r.pick([10, 15, 20, 25, 30, 40, 50]);
      const price = r.int(2, 30) * 4 * (p === 15 ? 5 : 1);
      const off = (price * p) / 100;
      return {
        activity: problem({
          id, stage: "application", competence: "calculer",
          context: `Un article coûte ${fr(price)} €. Il est soldé à −${p} %.`,
          hint: `Calcule d'abord ${p} % de ${fr(price)}.`,
          takeaway: `Baisser de p %, c'est enlever p % du prix, ou multiplier par (1 − p/100).`,
          parts: [
            { prompt: "Montant de la réduction (€) ?", expected: off, errors: [{ value: price - off, code: "final", message: "Ça, c'est le prix final. On demande d'abord la réduction." }], hint: `${fr(price)} × ${p} ÷ 100.`, solution: [`${fr(price)} × ${p} ÷ 100 = ${fr(off)} €.`], recap: `Réduction : ${fr(off)} €`, review: "Calculer un pourcentage" },
            { prompt: "Prix soldé (€) ?", expected: price - off, errors: [{ value: price - p, code: "points", message: `On enlève ${p} % du prix, pas ${p} €.`, type: "conceptuelle" }], hint: "Prix de départ moins la réduction.", solution: [`${fr(price)} − ${fr(off)} = ${fr(price - off)} €.`], recap: `Prix soldé : ${fr(price - off)} €`, review: "Appliquer une réduction" },
          ],
        }),
        verify: () => close(price * (1 - p / 100), price - off),
      };
    },
  }),
  gen({
    id: "m5-prop-ratio", unit: U5("propor"), title: "Partager selon un ratio", stage: "transfert",
    make: (r, id) => {
      const a = r.int(1, 5), b = r.int(1, 5) + (r.chance(0.5) ? 0 : 1);
      const part = r.int(2, 20);
      const total = (a + b) * part;
      return {
        activity: ask({
          id, stage: "transfert", competence: "modeliser",
          context: `Pour une boisson, on mélange du sirop et de l'eau dans le ratio ${a} : ${b}. On veut ${total} cL de boisson.`,
          prompt: "Quelle quantité de sirop faut-il (en cL) ?",
          expected: a * part,
          errors: [{ value: total / a, code: "ratio", message: `Le ratio ${a} : ${b} fait ${a + b} parts en tout.`, type: "conceptuelle" }],
          hint: `Un ratio ${a} : ${b}, c'est ${a} parts de sirop pour ${b} parts d'eau.`,
          solution: [`Nombre de parts : ${a} + ${b} = ${a + b}.`, `Une part : ${total} ÷ ${a + b} = ${part} cL.`, `Sirop : ${a} × ${part} = ${a * part} cL.`],
          recap: `Sirop : ${a * part} cL`,
          review: "Ratio",
          takeaway: "Ratio a : b : le tout est partagé en a + b parts égales.",
        }),
        verify: () => a * part + b * part === total,
      };
    },
  }),

  /* ——— Géométrie ——— */
  gen({
    id: "m5-geo-angles", unit: U5("geometrie"), title: "Somme des angles d'un triangle", stage: "application",
    make: (r, id) => {
      const A = r.int(20, 100), B = r.int(20, 160 - A - 10);
      const C = 180 - A - B;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Dans un triangle ABC, l'angle Â mesure ${A}° et l'angle B̂ mesure ${B}°.`,
          prompt: "Combien mesure l'angle Ĉ (en degrés) ?",
          expected: C,
          errors: [{ value: 360 - A - B, code: "360", message: "Dans un triangle, la somme des angles vaut 180°, pas 360°.", type: "conceptuelle" }],
          hint: "Que vaut la somme des trois angles d'un triangle ?",
          solution: [`Â + B̂ + Ĉ = 180°.`, `Ĉ = 180 − ${A} − ${B} = ${C}°.`],
          recap: `Ĉ = ${C}°`,
          review: "Somme des angles d'un triangle",
          takeaway: "La somme des angles d'un triangle vaut toujours 180°.",
        }),
        verify: () => A + B + C === 180 && C > 0,
      };
    },
  }),
  gen({
    id: "m5-geo-inegalite", unit: U5("geometrie"), title: "Inégalité triangulaire", stage: "rappel",
    make: (r, id) => {
      const a = r.int(2, 12), b = r.int(2, 12);
      const kind = r.int(0, 2);
      const c = kind === 0 ? a + b + r.int(1, 4) : kind === 1 ? a + b : Math.max(Math.abs(a - b) + 1, r.int(Math.abs(a - b) + 1, a + b - 1));
      const answer = kind === 0 ? "Non, c'est impossible" : kind === 1 ? "Oui, mais il est aplati" : "Oui";
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "raisonner",
          prompt: `Peut-on construire un triangle dont les côtés mesurent ${a} cm, ${b} cm et ${c} cm ?`,
          answer: { text: answer, feedback: kind === 0 ? `${a} + ${b} = ${a + b} < ${c} : les deux petits côtés ne se rejoignent pas.` : kind === 1 ? `${a} + ${b} = ${c} : les trois points sont alignés.` : `Le plus grand côté (${Math.max(a, b, c)}) est plus petit que la somme des deux autres.` },
          wrong: ["Oui", "Non, c'est impossible", "Oui, mais il est aplati"].filter((t) => t !== answer).map((t) => ({ text: t, feedback: "Compare le plus grand côté à la somme des deux autres." })),
          hint: "Compare le plus grand côté à la somme des deux autres.",
          solution: [`Plus grand côté : ${Math.max(a, b, c)} cm ; somme des deux autres : ${a + b + c - Math.max(a, b, c)} cm.`, answer + "."],
          takeaway: "Un triangle existe si son plus grand côté est plus petit que la somme des deux autres (aplati en cas d'égalité).",
        }),
        verify: () => {
          const m = Math.max(a, b, c), s = a + b + c - m;
          return (m > s ? 0 : m === s ? 1 : 2) === kind;
        },
      };
    },
  }),
  gen({
    id: "m5-geo-symcentrale", unit: U5("geometrie"), title: "Symétrie centrale dans un repère", stage: "application",
    make: (r, id) => {
      const ox = r.int(-3, 4), oy = r.int(-3, 4);
      const x = ox + r.nonZero(5), y = oy + r.nonZero(5);
      const sx = 2 * ox - x, sy = 2 * oy - y;
      const pt = (a: number, b: number) => `(${fr(a)} ; ${fr(b)})`;
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "representer",
          prompt: `Quel est le symétrique du point A${pt(x, y)} par rapport au point O${pt(ox, oy)} ?`,
          answer: { text: pt(sx, sy), feedback: "O est le milieu de [AA'] : on fait le même déplacement de O vers A' que de A vers O." },
          wrong: [
            { text: pt(-x, -y), feedback: "C'est le symétrique par rapport à l'origine, pas par rapport à O." },
            { text: pt(sx, y), feedback: "Les deux coordonnées changent dans une symétrie centrale." },
            { text: pt(x + ox, y + oy), feedback: "O doit être le milieu de [AA'] : vérifie avec le milieu." },
            { text: pt(x, sy), feedback: "Les deux coordonnées changent dans une symétrie centrale." },
          ],
          hint: "O est le milieu du segment [AA'].",
          solution: [`De A à O : ${fr(ox - x)} en abscisse, ${fr(oy - y)} en ordonnée.`, `On refait ce déplacement à partir de O : A'${pt(sx, sy)}.`],
          takeaway: "Dans une symétrie de centre O, O est le milieu du segment qui joint un point à son image.",
        }),
        verify: () => (x + sx) / 2 === ox && (y + sy) / 2 === oy,
      };
    },
  }),

  /* ——— Aires et volumes ——— */
  gen({
    id: "m5-av-triangle", unit: U5("aires-volumes"), title: "Aire d'un triangle", stage: "application",
    make: (r, id) => {
      const b = r.int(3, 20), h = r.int(2, 15) * 2;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Un triangle a une base de ${b} cm et une hauteur relative à cette base de ${h} cm.`,
          prompt: "Quelle est son aire (en cm²) ?",
          expected: (b * h) / 2,
          errors: [{ value: b * h, code: "moitie", message: "N'oublie pas de diviser par 2 : un triangle est la moitié d'un parallélogramme.", type: "procedurale" }],
          hint: "Aire du triangle = base × hauteur ÷ 2.",
          solution: [`A = ${b} × ${h} ÷ 2 = ${(b * h) / 2} cm².`],
          recap: `A = ${(b * h) / 2} cm²`,
          review: "Aire du triangle",
          takeaway: "Aire d'un triangle = base × hauteur ÷ 2, avec la hauteur perpendiculaire à la base.",
        }),
        verify: () => evaluate(`${b} × ${h} ÷ 2`) === (b * h) / 2,
      };
    },
  }),
  gen({
    id: "m5-av-disque", unit: U5("aires-volumes"), title: "Aire d'un disque", stage: "application",
    make: (r, id) => {
      const radius = r.int(1, 15);
      const area = Math.PI * radius * radius;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Un disque a un rayon de ${radius} cm.`,
          prompt: "Donne son aire en cm², arrondie au dixième.",
          expected: round(area, 1),
          tolerance: { abs: 0.051 + 0.0016 * radius * radius },
          errors: [{ value: round(2 * Math.PI * radius, 1), code: "perimetre", message: "2 × π × r est la longueur du cercle. L'aire du disque est π × r².", type: "conceptuelle" }, { value: round(Math.PI * 2 * radius * 2 * radius, 1), code: "diametre", message: "La formule utilise le rayon, pas le diamètre.", type: "procedurale" }],
          hint: "Aire du disque = π × rayon × rayon.",
          solution: [`A = π × ${radius}² = π × ${radius * radius} ≈ ${fr(round(area, 1))} cm².`],
          recap: `A ≈ ${fr(round(area, 1))} cm²`,
          review: "Aire du disque",
          takeaway: "Aire d'un disque = π × r² ; longueur du cercle = 2 × π × r.",
        }),
        verify: () => close(evaluate(`π × ${radius}²`), area),
      };
    },
  }),
  gen({
    id: "m5-av-pave", unit: U5("aires-volumes"), title: "Volume d'un pavé droit", stage: "transfert",
    make: (r, id) => {
      const L = r.int(2, 30), l = r.int(2, 20), h = r.int(2, 15);
      const v = L * l * h;
      return {
        activity: problem({
          id, stage: "transfert", competence: "modeliser",
          context: `Un aquarium a la forme d'un pavé droit de ${L} cm × ${l} cm × ${h} cm.`,
          hint: "Volume du pavé = longueur × largeur × hauteur.",
          takeaway: "1 L = 1 dm³ = 1 000 cm³.",
          parts: [
            { prompt: "Quel est son volume en cm³ ?", expected: v, errors: [{ value: 2 * (L * l + L * h + l * h), code: "aire", message: "Tu as calculé l'aire des faces. Le volume, c'est L × l × h." }], hint: `${L} × ${l} × ${h}.`, solution: [`V = ${L} × ${l} × ${h} = ${fr(v)} cm³.`], recap: `V = ${fr(v)} cm³`, review: "Volume du pavé" },
            { prompt: "Combien de litres d'eau contient-il quand il est plein ?", expected: v / 1000, errors: [{ value: v / 100, code: "conv", message: "1 L = 1 000 cm³, pas 100." }], hint: "1 L = 1 000 cm³.", solution: [`${fr(v)} cm³ = ${fr(v / 1000)} L.`], recap: `${fr(v / 1000)} L`, review: "Conversion volume / contenance" },
          ],
        }),
        verify: () => close((v / 1000) * 1000, L * l * h),
      };
    },
  }),

  /* ——— Statistiques ——— */
  gen({
    id: "m5-stat-moyenne", unit: U5("donnees"), title: "Calculer une moyenne", stage: "application",
    make: (r, id) => {
      const n = r.int(4, 6);
      const target = r.int(8, 16);
      const notes = Array.from({ length: n - 1 }, () => r.int(Math.max(0, target - 6), Math.min(20, target + 6)));
      const last = target * n - notes.reduce((a, b) => a + b, 0);
      const list = last >= 0 && last <= 20 ? [...notes, last] : [...notes, target];
      const mean = list.reduce((a, b) => a + b, 0) / list.length;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Les notes de Sami sur 20 : ${list.join(" ; ")}.`,
          prompt: "Quelle est sa moyenne ?",
          expected: round(mean, 2),
          tolerance: { abs: 0.01 },
          errors: [{ value: list.reduce((a, b) => a + b, 0), code: "somme", message: `Il faut diviser la somme par le nombre de notes (${list.length}).`, type: "procedurale" }],
          hint: "Additionne les notes, puis divise par leur nombre.",
          solution: [`Somme : ${list.join(" + ")} = ${list.reduce((a, b) => a + b, 0)}.`, `Moyenne : ${list.reduce((a, b) => a + b, 0)} ÷ ${list.length} ≈ ${fr(round(mean, 2))}.`],
          recap: `Moyenne ≈ ${fr(round(mean, 2))}`,
          review: "Moyenne",
          takeaway: "Moyenne = somme des valeurs ÷ nombre de valeurs.",
        }),
        verify: () => close(evaluate(`(${list.join(" + ")}) ÷ ${list.length}`), mean),
      };
    },
  }),
  gen({
    id: "m5-stat-frequence", unit: U5("donnees"), title: "Calculer une fréquence", stage: "application",
    make: (r, id) => {
      const total = r.pick([20, 25, 40, 50, 80, 100, 200]);
      const n = r.int(1, total - 1);
      const f = n / total;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Sur ${total} lancers d'une pièce, on a obtenu ${n} fois « pile ».`,
          prompt: "Quelle est la fréquence de « pile », en pourcentage ?",
          expected: (n * 100) / total,
          errors: [{ value: n, code: "effectif", message: "L'effectif est " + n + " ; la fréquence le compare au total.", type: "conceptuelle" }],
          hint: "Fréquence = effectif ÷ effectif total ; × 100 pour un pourcentage.",
          solution: [`${n} ÷ ${total} = ${fr(f)}.`, `Soit ${fr((n * 100) / total)} %.`],
          recap: `${fr((n * 100) / total)} %`,
          review: "Fréquence",
          takeaway: "Fréquence = effectif de la valeur ÷ effectif total (entre 0 et 1, ou en %).",
        }),
        verify: () => close((((n * 100) / total) * total) / 100, n),
      };
    },
  }),
];

export const MATHS_4E: Generator[] = [
  /* ——— Relatifs : produits et quotients ——— */
  gen({
    id: "m4-rel-produit", unit: U4("relatifs"), title: "Règle des signes", stage: "application",
    make: (r, id) => {
      const a = r.nonZero(12), b = r.nonZero(12), c = r.nonZero(5);
      const forms: [string, number][] = [[`${fr(a)} × ${par(b)}`, a * b], [`${fr(a * b)} ÷ ${par(b)}`, a], [`${fr(a)} × ${par(b)} × ${par(c)}`, a * b * c]];
      const [expr, value] = r.pick(forms);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: "Produits et quotients de relatifs.",
          prompt: `${expr} = ?`,
          expected: value,
          errors: [{ value: -value, code: "signe", message: "Compte les facteurs négatifs : un nombre pair donne un résultat positif, un nombre impair un résultat négatif.", type: "procedurale" }],
          hint: "Détermine d'abord le signe en comptant les nombres négatifs, puis calcule avec les distances à zéro.",
          solution: [`Nombre de facteurs négatifs : ${(expr.match(/−/g) ?? []).length}.`, `${expr} = ${fr(value)}.`],
          recap: `${expr} = ${fr(value)}`,
          review: "Règle des signes",
          takeaway: "Un produit ou un quotient est positif s'il contient un nombre pair de facteurs négatifs, négatif sinon.",
        }),
        verify: () => evaluate(expr) === value,
      };
    },
  }),
  gen({
    id: "m4-rel-priorites", unit: U4("relatifs"), title: "Priorités avec des relatifs", stage: "transfert",
    make: (r, id) => {
      const a = r.nonZero(9), b = r.nonZero(9), c = r.nonZero(9), d = r.nonZero(6);
      const expr = `${fr(a)} − ${par(b)} × ${par(c)} + ${par(d)}`;
      const value = a - b * c + d;
      return {
        activity: ask({
          id, stage: "transfert", competence: "calculer",
          context: "Calcul en plusieurs étapes.",
          prompt: `${expr} = ?`,
          expected: value,
          errors: [{ value: (a - b) * c + d, code: "priorite", message: "La multiplication passe avant la soustraction.", type: "procedurale" }, { value: a + b * c + d, code: "moins", message: `− ${par(b)} × ${par(c)} : on soustrait le produit ${fr(b * c)}.`, type: "calcul" }],
          hint: "Calcule d'abord le produit.",
          solution: [`${par(b)} × ${par(c)} = ${fr(b * c)}.`, `${fr(a)} − ${par(b * c)} + ${par(d)} = ${fr(value)}.`],
          recap: `${fr(value)}`,
          review: "Priorités opératoires",
          takeaway: "Avec des relatifs, les priorités ne changent pas : × et ÷ avant + et −.",
        }),
        verify: () => evaluate(expr) === value,
      };
    },
  }),

  /* ——— Fractions : les quatre opérations ——— */
  gen({
    id: "m4-frac-produit", unit: U4("fractions"), title: "Multiplier et diviser des fractions", stage: "application",
    make: (r, id) => {
      const a = r.int(1, 9), b = r.int(2, 9), c = r.int(1, 9), d = r.int(2, 9);
      const divide = r.chance(0.5);
      const num = divide ? a * d : a * c, den = divide ? b * c : b * d;
      const g = gcd(num, den);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: divide ? "Diviser par une fraction, c'est multiplier par son inverse." : "Produit de fractions.",
          prompt: `${frac(a, b)} ${divide ? "÷" : "×"} ${frac(c, d)} = ? (fraction simplifiée ou décimal)`,
          expected: num / den,
          tolerance: { rel: 1e-5 },
          errors: [{ value: divide ? (a * c) / (b * d) : (a * d) / (b * c), code: "inverse", message: divide ? "Pour diviser, on multiplie par l'inverse de la seconde fraction." : "Pour multiplier, on multiplie les numérateurs entre eux et les dénominateurs entre eux.", type: "procedurale" }],
          hint: divide ? `L'inverse de ${frac(c, d)} est ${frac(d, c)}.` : "Numérateur × numérateur, dénominateur × dénominateur.",
          solution: [divide ? `${frac(a, b)} × ${frac(d, c)} = ${frac(num, den)}` : `${frac(a, b)} × ${frac(c, d)} = ${frac(num, den)}`, ...(g > 1 ? [`= ${frac(num / g, den / g)}`] : [])],
          recap: frac(num / g, den / g),
          review: divide ? "Diviser par une fraction" : "Produit de fractions",
          takeaway: "a/b × c/d = (a × c)/(b × d) ; diviser par c/d revient à multiplier par d/c.",
        }),
        verify: () => close(evaluate(`(${a}/${b}) ${divide ? "÷" : "×"} (${c}/${d})`), num / den),
      };
    },
  }),
  gen({
    id: "m4-frac-somme", unit: U4("fractions"), title: "Additionner des fractions quelconques", stage: "application",
    make: (r, id) => {
      const b = r.int(2, 9);
      let d = r.int(2, 9);
      if (d === b) d++;
      const a = r.int(1, 9), c = r.int(1, 9);
      const minus = r.chance(0.4);
      const num = minus ? a * d - c * b : a * d + c * b, den = b * d;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: "Somme et différence de fractions.",
          prompt: `${frac(a, b)} ${minus ? "−" : "+"} ${frac(c, d)} = ? (fraction ou décimal)`,
          expected: num / den,
          tolerance: { rel: 1e-5 },
          errors: [{ value: (minus ? a - c : a + c) / (b + d), code: "tout", message: "On n'additionne jamais les dénominateurs : on cherche un dénominateur commun.", type: "conceptuelle" }],
          hint: `Un dénominateur commun : ${b} × ${d} = ${b * d}.`,
          solution: [`${frac(a, b)} = ${frac(a * d, den)} et ${frac(c, d)} = ${frac(c * b, den)}.`, `${frac(a * d, den)} ${minus ? "−" : "+"} ${frac(c * b, den)} = ${frac(num, den)}.`],
          recap: frac(num, den),
          review: "Somme de fractions",
          takeaway: "On additionne des fractions une fois écrites avec le même dénominateur.",
        }),
        verify: () => close(evaluate(`${a}/${b} ${minus ? "−" : "+"} ${c}/${d}`), num / den),
      };
    },
  }),

  /* ——— Puissances ——— */
  gen({
    id: "m4-pui-dix", unit: U4("puissances"), title: "Puissances de 10", stage: "rappel",
    make: (r, id) => {
      const n = r.int(-6, 9);
      const value = 10 ** n;
      const P = pow(10, n);
      const text = fr(value, 8);
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "communiquer",
          prompt: `Quelle est l'écriture décimale de ${P} ?`,
          answer: { text, feedback: n >= 0 ? `${P} : 1 suivi de ${n} zéro${n > 1 ? "s" : ""}.` : `${P} = 1 ÷ ${pow(10, -n)} : le 1 est au ${-n}e rang après la virgule.` },
          wrong: [
            { text: fr(10 ** (n + 1), 8), feedback: "Compte bien les zéros : il y en a un de trop." },
            { text: fr(10 ** (n - 1), 8), feedback: "Compte bien les zéros : il en manque un." },
            n > 0 ? { text: fr(10 * n), feedback: `${P} n'est pas 10 × ${n} : c'est ${n} facteurs égaux à 10.` } : n === 0 ? { text: "0", feedback: "Tout nombre non nul à la puissance 0 vaut 1." } : { text: fr(-(10 ** -n)), feedback: "Un exposant négatif ne rend pas le nombre négatif : il donne un nombre entre 0 et 1." },
          ],
          hint: n >= 0 ? `${P} est le produit de ${n} facteur${n > 1 ? "s" : ""} égal${n > 1 ? "s" : ""} à 10.` : `${P} = 1 ÷ ${pow(10, -n)}.`,
          solution: [`${P} = ${text}.`],
          takeaway: "10ⁿ s'écrit 1 suivi de n zéros ; 10⁻ⁿ s'écrit 0,0…01 avec le 1 au n-ième rang après la virgule.",
        }),
        verify: () => close(evaluate(P), value) && close(evaluate(text), value),
      };
    },
  }),
  gen({
    id: "m4-pui-scientifique", unit: U4("puissances"), title: "Notation scientifique", stage: "application",
    make: (r, id) => {
      const mant = r.int(11, 99) / 10;
      const e = r.pick([-7, -5, -4, -3, 3, 4, 5, 6, 8]);
      const value = mant * 10 ** e;
      const decimal = fr(value, 10);
      const sci = `${fr(mant)} × ${pow(10, e)}`;
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "communiquer",
          prompt: `Quelle est la notation scientifique de ${decimal} ?`,
          answer: { text: sci, feedback: "La mantisse est entre 1 et 10 (10 exclu), multipliée par la puissance de 10 qui convient." },
          wrong: [
            { text: `${fr(mant * 10)} × ${pow(10, e - 1)}`, feedback: "C'est bien le même nombre, mais la mantisse doit être comprise entre 1 et 10." },
            { text: `${fr(mant)} × ${pow(10, -e)}`, feedback: "Le signe de l'exposant est faux : un grand nombre a un exposant positif, un petit nombre un exposant négatif." },
            { text: `${fr(mant)} × ${pow(10, e + 1)}`, feedback: "L'exposant est décalé d'un rang : compte de combien de rangs la virgule se déplace." },
          ],
          hint: "Place la virgule après le premier chiffre non nul, puis compte de combien de rangs elle a bougé.",
          solution: [`${decimal} = ${sci}.`],
          takeaway: "Notation scientifique : a × 10ⁿ, avec 1 ≤ a < 10 et n entier relatif.",
        }),
        verify: () => close(evaluate(sci), value) && mant >= 1 && mant < 10 && close(evaluate(decimal), value),
      };
    },
  }),
  gen({
    id: "m4-pui-regles", unit: U4("puissances"), title: "Calculer avec des puissances", stage: "application",
    make: (r, id) => {
      const a = r.pick([2, 3, 5, 10]), m = r.int(1, 6), n = r.int(1, 5);
      const kind = r.int(0, 2);
      const [prompt, exp, trap] = kind === 0 ? [`${pow(a, m)} × ${pow(a, n)}`, m + n, m * n] : kind === 1 ? [`(${pow(a, m)})${sup(n)}`, m * n, m + n] : [`${pow(a, m + n)} ÷ ${pow(a, n)}`, m, m + 2 * n];
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "calculer",
          prompt: `Écris sous la forme d'une seule puissance de ${a} : ${prompt}`,
          answer: { text: pow(a, exp), feedback: ["On ajoute les exposants : aᵐ × aⁿ = aᵐ⁺ⁿ.", "On multiplie les exposants : (aᵐ)ⁿ = aᵐˣⁿ.", "On soustrait les exposants : aᵐ ÷ aⁿ = aᵐ⁻ⁿ."][kind]! },
          wrong: [
            { text: pow(a, trap), feedback: kind === 0 ? "On multiplie les exposants seulement pour une puissance de puissance." : kind === 1 ? "Ici on multiplie les exposants : (aᵐ)ⁿ = aᵐ × aᵐ × … (n fois)." : "Quand on divise, on soustrait les exposants." },
            { text: pow(a * a, exp), feedback: "La base ne change pas." },
            { text: pow(a, exp + 1), feedback: "Recompte les facteurs." },
          ],
          hint: "Écris le calcul comme un produit de facteurs égaux et compte-les.",
          solution: [`${prompt} = ${pow(a, exp)}.`],
          takeaway: "aᵐ × aⁿ = aᵐ⁺ⁿ ; (aᵐ)ⁿ = aᵐˣⁿ ; aᵐ ÷ aⁿ = aᵐ⁻ⁿ.",
        }),
        verify: () => close(evaluate(prompt), a ** exp),
      };
    },
  }),

  /* ——— Calcul littéral ——— */
  gen({
    id: "m4-lit-developper", unit: U4("litteral"), title: "Développer k(a + b)", stage: "application",
    make: (r, id) => {
      const k = r.pick([-1, 1]) * r.int(2, 9), a = r.int(1, 9), b = r.nonZero(12);
      const expr = `${fr(k)}(${poly([[a, "x"], [b, ""]])})`;
      const answer = poly([[k * a, "x"], [k * b, ""]]);
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "calculer",
          prompt: `Développe : ${expr}`,
          answer: { text: answer, feedback: `On multiplie ${par(k)} par chaque terme de la parenthèse.` },
          wrong: [
            { text: poly([[k * a, "x"], [b, ""]]), feedback: "Le facteur multiplie aussi le second terme de la parenthèse." },
            { text: poly([[k + a, "x"], [k + b, ""]]), feedback: "On multiplie, on n'additionne pas." },
            { text: poly([[k * a, "x"], [-k * b, ""]]), feedback: "Attention au signe du second produit." },
          ],
          hint: "k(a + b) = k × a + k × b.",
          solution: [`${expr} = ${par(k)} × ${poly([[a, "x"]])} + ${par(k)} × ${par(b)}`, `= ${answer}`],
          takeaway: "Distributivité : k(a + b) = ka + kb.",
        }),
        verify: () => sameExpression(expr, answer),
      };
    },
  }),
  gen({
    id: "m4-lit-reduire", unit: U4("litteral"), title: "Réduire une expression", stage: "rappel",
    make: (r, id) => {
      const a = r.nonZero(9), b = r.nonZero(9), c = r.nonZero(9), d = r.nonZero(9);
      const expr = poly([[a, "x"], [b, ""], [c, "x"], [d, ""]]);
      const answer = poly([[a + c, "x"], [b + d, ""]]);
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "calculer",
          prompt: `Réduis : ${expr}`,
          answer: { text: answer, feedback: "On regroupe les termes en x entre eux, et les nombres entre eux." },
          wrong: [
            { text: poly([[a + b + c + d, "x"]]), feedback: "On ne peut pas additionner des x et des nombres seuls." },
            { text: poly([[a + c, "x²"], [b + d, ""]]), feedback: "x + x = 2x, pas x²." },
            { text: poly([[a - c, "x"], [b + d, ""]]), feedback: "Garde le signe placé devant chaque terme." },
          ],
          hint: "Regroupe les termes « en x » et les termes « sans x ».",
          solution: [`Termes en x : ${fr(a)} + ${par(c)} = ${fr(a + c)}.`, `Nombres : ${fr(b)} + ${par(d)} = ${fr(b + d)}.`, `Résultat : ${answer}.`],
          takeaway: "Réduire, c'est regrouper les termes de même nature : 3x + 5x = 8x, mais 3x + 5 ne se réduit pas.",
        }),
        verify: () => sameExpression(expr, answer),
      };
    },
  }),
  gen({
    id: "m4-lit-double", unit: U4("litteral"), title: "Développer (a + b)(c + d)", stage: "transfert",
    make: (r, id) => {
      const a = r.nonZero(6), b = r.nonZero(6);
      const expr = `(x ${a < 0 ? "−" : "+"} ${Math.abs(a)})(x ${b < 0 ? "−" : "+"} ${Math.abs(b)})`;
      const answer = poly([[1, "x²"], [a + b, "x"], [a * b, ""]]);
      return {
        activity: mcq(r, {
          id, stage: "transfert", competence: "calculer",
          prompt: `Développe et réduis : ${expr}`,
          answer: { text: answer, feedback: "Chaque terme de la première parenthèse multiplie chaque terme de la seconde." },
          wrong: [
            { text: poly([[1, "x²"], [a * b, ""]]), feedback: "Il manque les deux produits « croisés »." },
            { text: poly([[1, "x²"], [a * b, "x"], [a + b, ""]]), feedback: "Les nombres se multiplient entre eux, les termes en x s'additionnent." },
            { text: poly([[2, "x"], [a + b, ""]]), feedback: "x × x = x², pas 2x." },
          ],
          hint: "(a + b)(c + d) = ac + ad + bc + bd.",
          solution: [`${expr} = ${poly([[1, "x²"], [b, "x"], [a, "x"], [a * b, ""]])}`, `= ${answer}`],
          takeaway: "Double distributivité : (a + b)(c + d) = ac + ad + bc + bd.",
        }),
        verify: () => sameExpression(expr, answer),
      };
    },
  }),

  /* ——— Équations ——— */
  gen({
    id: "m4-eq-resoudre", unit: U4("equations"), title: "Résoudre ax + b = c", stage: "application",
    make: (r, id) => {
      const a = r.nonZero(9), x = r.int(-10, 10), b = r.nonZero(20);
      const c = a * x + b;
      const eq = `${poly([[a, "x"], [b, ""]])} = ${fr(c)}`;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: "Équation du premier degré.",
          prompt: `Résous : ${eq}`,
          expected: x,
          errors: [{ value: (c + b) / a, code: "signe", message: `Pour enlever ${signedText(b)}, on fait l'opération contraire des deux côtés.`, type: "procedurale" }, { value: (c - b) * a, code: "division", message: `Pour isoler x, on divise par ${fr(a)}.`, type: "procedurale" }],
          hint: "Isole d'abord le terme en x, puis divise.",
          solution: [`${poly([[a, "x"]])} = ${fr(c)} ${b > 0 ? "−" : "+"} ${fr(Math.abs(b))} = ${fr(c - b)}`, `x = ${fr(c - b)} ÷ ${par(a)} = ${fr(x)}`, `Vérification : ${fr(a)} × ${par(x)} ${b < 0 ? "−" : "+"} ${fr(Math.abs(b))} = ${fr(c)}.`],
          recap: `x = ${fr(x)}`,
          review: "Équation ax + b = c",
          takeaway: "On isole x en défaisant les opérations dans l'ordre inverse, en faisant la même chose des deux côtés.",
        }),
        verify: () => evaluate(poly([[a, "x"], [b, ""]]), { x }) === c,
      };
    },
  }),
  gen({
    id: "m4-eq-deux-membres", unit: U4("equations"), title: "Équation avec x dans les deux membres", stage: "transfert",
    make: (r, id) => {
      const a = r.int(2, 9), c = r.int(1, 9);
      const A = a + c;
      const x = r.int(-8, 8), b = r.nonZero(15);
      const d = A * x + b - c * x;
      const left = poly([[A, "x"], [b, ""]]), right = poly([[c, "x"], [d, ""]]);
      return {
        activity: ask({
          id, stage: "transfert", competence: "raisonner",
          context: "Résolution d'équation.",
          prompt: `Résous : ${left} = ${right}`,
          expected: x,
          errors: [{ value: (d - b) / (A + c), code: "signe_x", message: `En passant ${poly([[c, "x"]])} à gauche, on le soustrait : ${poly([[A, "x"], [-c, "x"]])}.`, type: "procedurale" }],
          hint: "Regroupe les termes en x d'un côté et les nombres de l'autre.",
          solution: [`${poly([[A, "x"], [-c, "x"]])} = ${fr(d)} ${b > 0 ? "−" : "+"} ${fr(Math.abs(b))}`, `${poly([[A - c, "x"]])} = ${fr(d - b)}`, `x = ${fr(x)}`],
          recap: `x = ${fr(x)}`,
          review: "Équation à deux membres",
          takeaway: "On regroupe les x d'un côté en soustrayant le même terme aux deux membres.",
        }),
        verify: () => evaluate(left, { x }) === evaluate(right, { x }),
      };
    },
  }),
  gen({
    id: "m4-eq-probleme", unit: U4("equations"), title: "Mettre un problème en équation", stage: "transfert",
    make: (r, id) => {
      const age = r.int(8, 15), diff = r.int(20, 35);
      const total = 2 * age + diff;
      return {
        activity: ask({
          id, stage: "transfert", competence: "modeliser",
          context: `Une mère a ${diff} ans de plus que sa fille. La somme de leurs âges est ${total} ans.`,
          prompt: "Quel est l'âge de la fille ?",
          expected: age,
          errors: [{ value: total / 2, code: "moitie", message: "Elles n'ont pas le même âge : appelle x l'âge de la fille et écris l'âge de la mère en fonction de x.", type: "strategique" }, { value: age + diff, code: "mere", message: "C'est l'âge de la mère." }],
          hint: "Appelle x l'âge de la fille : quel est l'âge de la mère ?",
          solution: [`Fille : x ; mère : x + ${diff}.`, `x + x + ${diff} = ${total}, donc 2x = ${total - diff}, x = ${age}.`, `Vérification : ${age} + ${age + diff} = ${total}.`],
          recap: `La fille a ${age} ans`,
          review: "Mettre en équation",
          takeaway: "Mettre en équation : choisir l'inconnue, traduire chaque phrase, résoudre, vérifier dans l'énoncé.",
        }),
        verify: () => age + (age + diff) === total,
      };
    },
  }),

  /* ——— Proportionnalité ——— */
  gen({
    id: "m4-prop-evolution", unit: U4("propor"), title: "Augmentation en pourcentage", stage: "application",
    make: (r, id) => {
      const p = r.pick([5, 10, 12, 15, 20, 25, 30, 40]);
      const v = r.int(2, 40) * 20;
      const res = v * (1 + p / 100);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Un abonnement coûte ${fr(v)} € par an. Son prix augmente de ${p} %.`,
          prompt: "Quel est le nouveau prix (en €) ?",
          expected: round(res, 2),
          errors: [{ value: v + p, code: "points", message: `On ajoute ${p} % du prix, pas ${p} €.`, type: "conceptuelle" }, { value: (v * p) / 100, code: "hausse", message: "Ça, c'est le montant de l'augmentation : ajoute-le au prix de départ." }],
          hint: `Augmenter de ${p} %, c'est multiplier par 1 + ${p}/100 = ${fr(1 + p / 100)}.`,
          solution: [`${fr(v)} × ${fr(1 + p / 100)} = ${fr(round(res, 2))} €.`],
          recap: `${fr(round(res, 2))} €`,
          review: "Augmenter de p %",
          takeaway: "Augmenter de p % revient à multiplier par (1 + p/100) ; baisser de p %, par (1 − p/100).",
        }),
        verify: () => close(v + (v * p) / 100, res),
      };
    },
  }),
  gen({
    id: "m4-prop-vitesse", unit: U4("propor"), title: "Vitesse, distance et durée", stage: "transfert",
    make: (r, id) => {
      const v = r.pick([4, 5, 12, 15, 18, 20, 60, 72, 80, 90, 110, 130]);
      const minutes = r.pick([15, 20, 30, 45, 90, 120, 150].filter((m) => (v * m) % 6 === 0));
      const d = (v * minutes) / 60;
      return {
        activity: ask({
          id, stage: "transfert", competence: "modeliser",
          context: `Un véhicule roule à la vitesse constante de ${v} km/h pendant ${minutes} min.`,
          prompt: "Quelle distance parcourt-il (en km) ?",
          expected: d,
          errors: [{ value: v * minutes, code: "minutes", message: "La vitesse est en km par heure : convertis la durée en heures.", type: "procedurale" }, { value: (v * minutes) / 100, code: "decimal", message: `${minutes} min ne font pas ${fr(minutes / 100)} h : une heure compte 60 minutes.`, type: "conceptuelle" }],
          hint: `${minutes} min = ${minutes}/60 h.`,
          solution: [`${minutes} min = ${minutes} ÷ 60 h.`, `d = v × t = ${v} × ${minutes} ÷ 60 = ${fr(d)} km.`],
          recap: `d = ${fr(d)} km`,
          review: "Distance = vitesse × durée",
          takeaway: "d = v × t, avec t dans l'unité de temps de la vitesse (heures pour des km/h).",
        }),
        verify: () => close(d / (minutes / 60), v),
      };
    },
  }),

  /* ——— Pythagore ——— */
  gen({
    id: "m4-pyth-hypotenuse", unit: U4("pythagore"), title: "Calculer l'hypoténuse", stage: "application",
    make: (r, id) => {
      const [p, q, h] = r.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]]);
      const k = r.pick([1, 1, 2, 3, 0.5]);
      const a = p! * k, b = q! * k, c = h! * k;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Le triangle ABC est rectangle en A, avec AB = ${fr(a)} cm et AC = ${fr(b)} cm.`,
          prompt: "Calcule BC (en cm).",
          expected: c,
          errors: [{ value: a + b, code: "somme", message: "Les longueurs ne s'additionnent pas : ce sont leurs carrés.", type: "conceptuelle" }, { value: a * a + b * b, code: "racine", message: "Tu as trouvé BC². Il reste à prendre la racine carrée.", type: "procedurale" }],
          hint: "BC est l'hypoténuse : BC² = AB² + AC².",
          solution: [`BC² = ${fr(a)}² + ${fr(b)}² = ${fr(a * a)} + ${fr(b * b)} = ${fr(c * c)}.`, `BC = √${fr(c * c)} = ${fr(c)} cm.`],
          recap: `BC = ${fr(c)} cm`,
          review: "Calculer l'hypoténuse",
          takeaway: "Dans un triangle rectangle, le carré de l'hypoténuse est égal à la somme des carrés des deux autres côtés.",
        }),
        verify: () => close(evaluate(`√(${fr(a)}² + ${fr(b)}²)`), c),
      };
    },
  }),
  gen({
    id: "m4-pyth-cote", unit: U4("pythagore"), title: "Calculer un côté de l'angle droit", stage: "application",
    make: (r, id) => {
      const a = r.int(2, 12), c = a + r.int(1, 10);
      const b = Math.sqrt(c * c - a * a);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Le triangle EFG est rectangle en E, avec EF = ${a} cm et l'hypoténuse FG = ${c} cm.`,
          prompt: "Calcule EG, arrondi au dixième (en cm).",
          expected: round(b, 1),
          tolerance: { abs: 0.051 },
          errors: [{ value: round(Math.sqrt(c * c + a * a), 1), code: "somme", message: "FG est l'hypoténuse : EG² = FG² − EF², on soustrait.", type: "conceptuelle" }],
          hint: "FG² = EF² + EG², donc EG² = FG² − EF².",
          solution: [`EG² = ${c}² − ${a}² = ${c * c} − ${a * a} = ${c * c - a * a}.`, `EG = √${c * c - a * a} ≈ ${fr(round(b, 1))} cm.`],
          recap: `EG ≈ ${fr(round(b, 1))} cm`,
          review: "Calculer un côté de l'angle droit",
          takeaway: "Pour un côté de l'angle droit : on soustrait les carrés (hypoténuse² − autre côté²).",
        }),
        verify: () => close(a * a + b * b, c * c),
      };
    },
  }),
  gen({
    id: "m4-pyth-reciproque", unit: U4("pythagore"), title: "Un triangle est-il rectangle ?", stage: "transfert",
    make: (r, id) => {
      const [p, q, h] = r.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [9, 12, 15]]);
      const right = r.chance(0.5);
      const c = right ? h! : h! + r.pick([-1, 1]);
      const sq = p! * p! + q! * q!;
      return {
        activity: mcq(r, {
          id, stage: "transfert", competence: "raisonner",
          prompt: `Un triangle a des côtés de ${p} cm, ${q} cm et ${c} cm. Est-il rectangle ?`,
          answer: right ? { text: `Oui, car ${c}² = ${p}² + ${q}²`, feedback: `${c * c} = ${p! * p!} + ${q! * q!} : d'après la réciproque du théorème de Pythagore, il est rectangle.` } : { text: `Non, car ${c}² ≠ ${p}² + ${q}²`, feedback: `${c * c} ≠ ${sq} : s'il était rectangle, l'égalité de Pythagore serait vraie.` },
          wrong: [
            right ? { text: `Non, car ${c}² ≠ ${p}² + ${q}²`, feedback: `Calcule : ${c}² = ${c * c} et ${p}² + ${q}² = ${sq}.` } : { text: `Oui, car ${c}² = ${p}² + ${q}²`, feedback: `Calcule : ${c}² = ${c * c} mais ${p}² + ${q}² = ${sq}.` },
            { text: `Oui, car ${p} + ${q} > ${c}`, feedback: "Cette inégalité prouve seulement que le triangle existe." },
            { text: "On ne peut pas savoir sans figure", feedback: "Le calcul des carrés suffit : réciproque ou contraposée du théorème de Pythagore." },
          ],
          hint: "Compare le carré du plus grand côté à la somme des carrés des deux autres.",
          solution: [`Plus grand côté : ${c} ; ${c}² = ${c * c}.`, `${p}² + ${q}² = ${sq}.`, right ? "Égalité : le triangle est rectangle." : "Pas d'égalité : il n'est pas rectangle."],
          takeaway: "Réciproque de Pythagore : si le carré du plus grand côté égale la somme des carrés des deux autres, le triangle est rectangle.",
        }),
        verify: () => (c * c === sq) === right,
      };
    },
  }),

  /* ——— Statistiques ——— */
  gen({
    id: "m4-stat-mediane", unit: U4("stats"), title: "Calculer une médiane", stage: "application",
    make: (r, id) => {
      const n = r.pick([5, 6, 7, 8, 9]);
      const vals = Array.from({ length: n }, () => r.int(2, 30));
      const sorted = [...vals].sort((a, b) => a - b);
      const med = n % 2 ? sorted[(n - 1) / 2]! : (sorted[n / 2 - 1]! + sorted[n / 2]!) / 2;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Temps (en minutes) mis par ${n} élèves pour venir au collège : ${vals.join(" ; ")}.`,
          prompt: "Quelle est la médiane de cette série ?",
          expected: med,
          errors: [{ value: vals[Math.floor(n / 2)]!, code: "non_trie", message: "Il faut d'abord ranger les valeurs dans l'ordre croissant.", type: "procedurale" }],
          hint: "Range les valeurs dans l'ordre croissant, puis cherche celle du milieu.",
          solution: [`Valeurs rangées : ${sorted.join(" ; ")}.`, n % 2 ? `Il y a ${n} valeurs : la médiane est la ${(n + 1) / 2}e, soit ${med}.` : `Il y a ${n} valeurs : la médiane est entre la ${n / 2}e et la ${n / 2 + 1}e, soit ${fr(med)}.`],
          recap: `Médiane : ${fr(med)}`,
          review: "Médiane",
          takeaway: "La médiane partage la série rangée en deux groupes de même effectif.",
        }),
        verify: () => sorted.filter((v) => v < med).length <= n / 2 && sorted.filter((v) => v > med).length <= n / 2,
      };
    },
  }),
  gen({
    id: "m4-stat-ponderee", unit: U4("stats"), title: "Moyenne pondérée", stage: "transfert",
    make: (r, id) => {
      const notes = [r.int(6, 18), r.int(6, 18), r.int(6, 18)];
      const coefs = [r.int(1, 4), r.int(1, 4), r.int(1, 4)];
      const sum = notes.reduce((s, x, i) => s + x * coefs[i]!, 0), w = coefs.reduce((a, b) => a + b, 0);
      const mean = sum / w;
      return {
        activity: ask({
          id, stage: "transfert", competence: "calculer",
          stimulus: mockTable("Notes du trimestre", ["Devoir", "Note /20", "Coefficient"], notes.map((nt, i) => [`Devoir ${i + 1}`, String(nt), String(coefs[i])])),
          context: "Le tableau donne les notes de Lina et leurs coefficients.",
          prompt: "Quelle est sa moyenne pondérée (arrondie au centième) ?",
          expected: round(mean, 2),
          tolerance: { abs: 0.006 },
          errors: [{ value: round(notes.reduce((a, b) => a + b, 0) / 3, 2), code: "simple", message: "Tu as fait la moyenne simple : chaque note compte autant de fois que son coefficient." }],
          hint: "Multiplie chaque note par son coefficient, additionne, puis divise par la somme des coefficients.",
          solution: [`${notes.map((nt, i) => `${nt} × ${coefs[i]}`).join(" + ")} = ${sum}.`, `Somme des coefficients : ${w}.`, `${sum} ÷ ${w} ≈ ${fr(round(mean, 2))}.`],
          recap: `≈ ${fr(round(mean, 2))}`,
          review: "Moyenne pondérée",
          takeaway: "Moyenne pondérée = somme des (valeur × coefficient) ÷ somme des coefficients.",
        }),
        verify: () => close(evaluate(`(${notes.map((nt, i) => `${nt} × ${coefs[i]}`).join(" + ")}) ÷ (${coefs.join(" + ")})`), mean),
      };
    },
  }),

  /* ——— Probabilités ——— */
  gen({
    id: "m4-proba-de", unit: U4("proba"), title: "Probabilité avec un dé", stage: "application",
    make: (r, id) => {
      const faces = r.pick([6, 8, 10, 12, 20]);
      const events: [string, (n: number) => boolean][] = [
        ["obtenir un nombre pair", (n) => n % 2 === 0],
        ["obtenir un multiple de 3", (n) => n % 3 === 0],
        [`obtenir un nombre supérieur ou égal à ${Math.ceil(faces / 2) + 1}`, (n) => n >= Math.ceil(faces / 2) + 1],
        ["obtenir un nombre premier", (n) => n > 1 && [2, 3, 5, 7, 11, 13, 17, 19].includes(n)],
      ];
      const [label, test] = r.pick(events);
      const fav = Array.from({ length: faces }, (_, i) => i + 1).filter(test);
      return {
        activity: ask({
          id, stage: "application", competence: "modeliser",
          context: `On lance un dé équilibré à ${faces} faces numérotées de 1 à ${faces}.`,
          prompt: `Quelle est la probabilité de ${label} ? (fraction ou décimal)`,
          expected: fav.length / faces,
          tolerance: { rel: 1e-5 },
          errors: [{ value: fav.length, code: "effectif", message: `Une probabilité est comprise entre 0 et 1 : on divise par le nombre d'issues (${faces}).`, type: "conceptuelle" }],
          hint: "Liste les issues favorables, puis compte-les.",
          solution: [`Issues favorables : ${fav.join(", ")} (${fav.length}).`, `p = ${fav.length}/${faces}.`],
          recap: `p = ${fav.length}/${faces}`,
          review: "Calculer une probabilité",
          takeaway: "Dans une situation d'équiprobabilité, p(A) = nombre d'issues favorables ÷ nombre d'issues possibles.",
        }),
        verify: () => fav.every(test) && fav.length > 0 && fav.length < faces,
      };
    },
  }),
  gen({
    id: "m4-proba-contraire", unit: U4("proba"), title: "Événement contraire", stage: "rappel",
    make: (r, id) => {
      const p = r.int(1, 19) / 20;
      return {
        activity: mcqNumber(r, {
          id, stage: "rappel", competence: "raisonner",
          prompt: `La probabilité qu'il pleuve demain est ${fr(p)}. Quelle est la probabilité qu'il ne pleuve pas ?`,
          answer: round(1 - p, 2),
          right: "La somme des probabilités d'un événement et de son contraire vaut 1.",
          wrong: [{ value: p, feedback: "C'est la probabilité qu'il pleuve." }, { value: round(p / 2, 3), feedback: "On ne divise pas : on calcule 1 − p." }, { value: round(100 - p, 2), feedback: "Les probabilités sont entre 0 et 1, pas en pourcentage ici." }],
          hint: "Il pleut ou il ne pleut pas : les deux probabilités ont pour somme 1.",
          solution: [`p(non A) = 1 − ${fr(p)} = ${fr(round(1 - p, 2))}.`],
          takeaway: "p(non A) = 1 − p(A).",
        }),
        verify: () => close(p + round(1 - p, 2), 1),
      };
    },
  }),

  /* ——— Espace ——— */
  gen({
    id: "m4-esp-pyramide", unit: U4("espace"), title: "Volume d'une pyramide ou d'un cône", stage: "application",
    make: (r, id) => {
      const cone = r.chance(0.5);
      const a = r.int(2, 12), h = r.int(1, 10) * 3;
      const v = cone ? (Math.PI * a * a * h) / 3 : (a * a * h) / 3;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: cone ? `Un cône de révolution a un rayon de base de ${a} cm et une hauteur de ${h} cm.` : `Une pyramide a pour base un carré de ${a} cm de côté et une hauteur de ${h} cm.`,
          prompt: cone ? "Donne son volume en cm³, arrondi à l'unité." : "Quel est son volume (en cm³) ?",
          expected: cone ? Math.round(v) : v,
          ...(cone ? { tolerance: { abs: 0.51 } } : {}),
          errors: [{ value: cone ? Math.round(v * 3) : v * 3, code: "tiers", message: "N'oublie pas le tiers : V = aire de la base × hauteur ÷ 3.", type: "procedurale" }],
          hint: "V = aire de la base × hauteur ÷ 3.",
          solution: cone ? [`Aire de la base : π × ${a}² = ${a * a}π cm².`, `V = ${a * a}π × ${h} ÷ 3 = ${(a * a * h) / 3}π ≈ ${Math.round(v)} cm³.`] : [`Aire de la base : ${a}² = ${a * a} cm².`, `V = ${a * a} × ${h} ÷ 3 = ${fr(v)} cm³.`],
          recap: `V ≈ ${fr(cone ? Math.round(v) : v)} cm³`,
          review: "Volume d'une pyramide ou d'un cône",
          takeaway: "Pyramide et cône : V = (aire de la base × hauteur) ÷ 3.",
        }),
        verify: () => close(v * 3, (cone ? Math.PI * a * a : a * a) * h),
      };
    },
  }),
];

const signedText = (b: number) => (b < 0 ? `− ${fr(-b)}` : `+ ${fr(b)}`);
