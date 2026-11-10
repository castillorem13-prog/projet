import { ask, gen, mcq, mcqNumber, mockTable, order, problem } from "../build";
import { evaluate } from "../evaluate";
import { close, euros, fr, gcd } from "../format";
import type { Generator } from "../types";

/** Mathématiques, 6e (cycle 3). Toutes les réponses sont recalculées par une autre voie dans `verify`. */

const U = (slug: string) => `6e-maths-${slug}`;
const PLACES = ["dixièmes", "centièmes", "millièmes"] as const;

export const MATHS_6E: Generator[] = [
  /* ——— Nombres décimaux ——— */
  gen({
    id: "m6-dec-comparer", unit: U("decimaux"), title: "Comparer deux nombres décimaux", stage: "rappel",
    make: (r, id) => {
      const n = r.int(0, 30);
      const d1 = r.int(2, 9);
      // Piège classique : le nombre qui a le plus de chiffres après la virgule n'est pas forcément le plus grand.
      const a = n * 100 + d1 * 10;
      const b = n * 100 + (d1 - 1) * 10 + r.int(1, 9);
      const [x, y] = r.chance(0.5) ? [a, b] : [b, a];
      const sx = fr(x / 100), sy = fr(y / 100);
      const sign = x > y ? ">" : "<";
      const other = sign === ">" ? "<" : ">";
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "raisonner",
          prompt: `Quel signe faut-il écrire entre ${sx} et ${sy} ?`,
          answer: { text: `${sx} ${sign} ${sy}`, feedback: `On compare d'abord les parties entières (égales), puis les dixièmes : ${sign === ">" ? `${sx} a plus de dixièmes` : `${sy} a plus de dixièmes`}.` },
          wrong: [
            { text: `${sx} ${other} ${sy}`, feedback: "Le nombre qui a le plus de chiffres après la virgule n'est pas forcément le plus grand : compare chiffre à chiffre, en commençant par les dixièmes." },
            { text: `${sx} = ${sy}`, feedback: "Les deux nombres n'ont pas les mêmes chiffres des dixièmes : ils ne sont pas égaux." },
          ],
          hint: "Compare les parties entières, puis les dixièmes, puis les centièmes.",
          solution: [`Parties entières : ${n} et ${n}, égales.`, `Dixièmes : ${Math.floor((x % 100) / 10)} et ${Math.floor((y % 100) / 10)}.`, `Donc ${sx} ${sign} ${sy}.`],
          takeaway: "Pour comparer des décimaux, on compare chiffre à chiffre de la gauche vers la droite ; on peut ajouter des zéros à droite pour avoir autant de décimales.",
        }),
        verify: () => (x > y) === (sign === ">") && close(evaluate(sx) * 100, x) && close(evaluate(sy) * 100, y),
      };
    },
  }),
  gen({
    id: "m6-dec-ranger", unit: U("decimaux"), title: "Ranger des décimaux dans l'ordre croissant", stage: "application",
    make: (r, id) => {
      const n = r.int(0, 12);
      const pool = new Set<number>();
      while (pool.size < 4) pool.add(n * 1000 + r.pick([r.int(1, 9) * 100, r.int(1, 99) * 10, r.int(1, 999)]));
      const values = [...pool].sort((a, b) => a - b);
      const steps = values.map((v) => fr(v / 1000));
      return {
        activity: order(r, {
          id, stage: "application", competence: "raisonner",
          prompt: "Range ces nombres du plus petit au plus grand.",
          steps,
          hint: "Écris-les tous avec trois chiffres après la virgule pour les comparer facilement.",
          solution: [`Avec trois décimales : ${values.map((v) => (v / 1000).toFixed(3).replace(".", ",")).join(" ; ")}.`, `Ordre croissant : ${steps.join(" < ")}.`],
          takeaway: "Ajouter des zéros à la fin de la partie décimale ne change pas un nombre : 2,5 = 2,500.",
        }),
        verify: () => steps.every((s, i) => i === 0 || evaluate(s) > evaluate(steps[i - 1]!)),
      };
    },
  }),
  gen({
    id: "m6-dec-graduation", unit: U("decimaux"), title: "Lire une abscisse sur une demi-droite graduée", stage: "application",
    make: (r, id) => {
      const start = r.int(0, 15);
      const parts = r.pick([10, 5, 4, 2]);
      const k = r.int(1, parts - 1);
      const value = start + k / parts;
      return {
        activity: ask({
          id, stage: "application", competence: "representer",
          context: `Sur une demi-droite graduée, l'unité qui va de ${start} à ${start + 1} est partagée en ${parts} parts égales.`,
          prompt: `Le point A est sur la ${k}${k === 1 ? "re" : "e"} graduation après ${start}. Quelle est son abscisse ?`,
          expected: value,
          errors: [{ value: start + k / 10, code: "dixiemes", message: `Chaque graduation ne vaut pas forcément 0,1 : ici l'unité est partagée en ${parts} parts, donc une graduation vaut 1/${parts}.` }],
          hint: `Commence par trouver ce que vaut une graduation : 1 ÷ ${parts}.`,
          solution: [`Une graduation vaut 1 ÷ ${parts} = ${fr(1 / parts)}.`, `A est à ${k} graduations après ${start} : ${start} + ${k} × ${fr(1 / parts)} = ${fr(value)}.`],
          recap: `A(${fr(value)})`,
          review: "Lire une abscisse",
          takeaway: "Sur une graduation, on cherche d'abord la valeur d'un petit intervalle, puis on compte.",
        }),
        verify: () => close(value * parts, start * parts + k),
      };
    },
  }),
  gen({
    id: "m6-dec-chiffre", unit: U("decimaux"), title: "Valeur d'un chiffre dans un nombre décimal", stage: "rappel",
    make: (r, id) => {
      const digits = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 5);
      const text = `${digits[0]}${digits[1]},${digits[2]}${digits[3]}${digits[4]}`;
      const place = r.int(0, 2);
      const right = digits[2 + place]!;
      const names = ["dizaines", "unités", ...PLACES];
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "communiquer",
          prompt: `Dans le nombre ${text}, quel est le chiffre des ${PLACES[place]} ?`,
          answer: { text: String(right), feedback: `Après la virgule : dixièmes, puis centièmes, puis millièmes. Le chiffre des ${PLACES[place]} est ${right}.` },
          wrong: [0, 1, 2, 3, 4].filter((i) => i !== 2 + place).slice(0, 3).map((i) => ({ text: String(digits[i]), feedback: `${digits[i]} est le chiffre des ${names[i]}.` })),
          hint: "Juste après la virgule viennent les dixièmes.",
          solution: [`${text} : ${digits[0]} dizaines, ${digits[1]} unités, ${digits[2]} dixièmes, ${digits[3]} centièmes, ${digits[4]} millièmes.`],
          takeaway: "Les rangs après la virgule sont, dans l'ordre : dixièmes, centièmes, millièmes.",
        }),
        verify: () => text.split(",")[1]![place] === String(right),
      };
    },
  }),
  gen({
    id: "m6-dec-x10", unit: U("decimaux"), title: "Multiplier ou diviser par 10, 100, 1 000", stage: "application",
    make: (r, id) => {
      const thousandths = r.int(1, 99) * 10 + r.int(0, 9);
      const n = r.int(1, 3);
      const p = 10 ** n;
      const divide = r.chance(0.4);
      const x = thousandths / 1000;
      const result = divide ? x / p : x * p;
      const op = divide ? "÷" : "×";
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: "Calcul mental.",
          prompt: `${fr(x)} ${op} ${fr(p)} = ?`,
          expected: Number(result.toFixed(6)),
          errors: [
            { value: Number((divide ? x * p : x / p).toFixed(6)), code: "sens", message: divide ? "Diviser rend le nombre plus petit : les chiffres glissent vers la droite." : "Multiplier rend le nombre plus grand : les chiffres glissent vers la gauche." },
            { value: Number((divide ? x / 10 ** (n === 3 ? 2 : n + 1) : x * 10 ** (n === 3 ? 2 : n + 1)).toFixed(6)), code: "rang", message: `${op} ${fr(p)} décale les chiffres de ${n} rang${n > 1 ? "s" : ""}, autant que de zéros.` },
          ],
          hint: `${op} ${fr(p)} : chaque chiffre change de ${n} rang${n > 1 ? "s" : ""}.`,
          solution: [`${op} ${fr(p)} décale chaque chiffre de ${n} rang${n > 1 ? "s" : ""} vers la ${divide ? "droite" : "gauche"}.`, `${fr(x)} ${op} ${fr(p)} = ${fr(result)}.`],
          recap: `${fr(x)} ${op} ${fr(p)} = ${fr(result)}`,
          review: "Multiplier et diviser par 10, 100, 1 000",
          takeaway: "Multiplier par 10, 100 ou 1 000 décale les chiffres de 1, 2 ou 3 rangs vers la gauche ; diviser, vers la droite.",
        }),
        verify: () => close(divide ? result * p : result / p, x),
      };
    },
  }),

  /* ——— Fractions ——— */
  gen({
    id: "m6-frac-quantite", unit: U("fractions"), title: "Calculer une fraction d'une quantité", stage: "application",
    make: (r, id) => {
      const b = r.pick([2, 3, 4, 5, 6, 8, 10]);
      const a = r.int(1, b - 1);
      const n = b * r.int(2, 15);
      const res = (n / b) * a;
      const what = r.pick(["élèves", "billes", "pages", "minutes", "euros"]);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Il y a ${n} ${what} en tout.`,
          prompt: `Combien font les ${a}/${b} de ${n} ${what} ?`,
          expected: res,
          errors: [
            { value: n / b, code: "oubli_num", message: `Tu as trouvé un ${b === 2 ? "demi" : `${b}e`} : il en faut ${a}.`, type: "procedurale" },
            { value: (n / a) * b, code: "inverse", message: "Tu as divisé par le numérateur : on divise par le dénominateur (le nombre de parts), puis on multiplie par le numérateur.", type: "conceptuelle" },
          ],
          hint: `Partage d'abord ${n} en ${b} parts égales.`,
          solution: [`Une part : ${n} ÷ ${b} = ${n / b}.`, `${a} parts : ${n / b} × ${a} = ${res}.`],
          recap: `${a}/${b} de ${n} = ${res}`,
          review: "Fraction d'une quantité",
          takeaway: "Prendre a/b d'une quantité : on la partage en b parts égales et on en prend a.",
        }),
        verify: () => res * b === n * a,
      };
    },
  }),
  gen({
    id: "m6-frac-egales", unit: U("fractions"), title: "Compléter une égalité de fractions", stage: "application",
    make: (r, id) => {
      const b = r.int(2, 9);
      let a = r.int(1, 2 * b);
      if (gcd(a, b) !== 1) a = 1;
      const k = r.int(2, 9);
      const missingTop = r.chance(0.6);
      const ans = missingTop ? a * k : b * k;
      const text = missingTop ? `${a}/${b} = ?/${b * k}` : `${a}/${b} = ${a * k}/?`;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: "Des fractions égales.",
          prompt: `Complète : ${text}`,
          expected: ans,
          errors: [{ value: missingTop ? a + (b * k - b) : b + (a * k - a), code: "ajout", message: "On ne peut pas ajouter le même nombre en haut et en bas : il faut multiplier les deux par le même nombre.", type: "conceptuelle" }],
          hint: missingTop ? `Par combien a-t-on multiplié ${b} pour obtenir ${b * k} ?` : `Par combien a-t-on multiplié ${a} pour obtenir ${a * k} ?`,
          solution: [missingTop ? `${b} × ${k} = ${b * k}.` : `${a} × ${k} = ${a * k}.`, `On multiplie aussi ${missingTop ? "le numérateur" : "le dénominateur"} par ${k} : ${ans}.`],
          recap: missingTop ? `${a}/${b} = ${ans}/${b * k}` : `${a}/${b} = ${a * k}/${ans}`,
          review: "Fractions égales",
          takeaway: "Une fraction ne change pas si on multiplie (ou divise) son numérateur et son dénominateur par le même nombre non nul.",
        }),
        verify: () => (missingTop ? ans * b === a * b * k : a * ans === a * k * b),
      };
    },
  }),
  gen({
    id: "m6-frac-quotient", unit: U("fractions"), title: "Écrire une fraction sous forme décimale", stage: "rappel",
    make: (r, id) => {
      const b = r.pick([2, 4, 5, 8, 10, 20, 25]);
      const a = r.int(1, 3 * b);
      const value = a / b;
      return {
        activity: ask({
          id, stage: "rappel", competence: "calculer",
          context: "Une fraction est un quotient.",
          prompt: `Écris ${a}/${b} sous forme décimale.`,
          expected: value,
          errors: [{ value: b / a, code: "inverse", message: `${a}/${b} veut dire ${a} ÷ ${b}, pas ${b} ÷ ${a}.`, type: "conceptuelle" }],
          hint: `${a}/${b} = ${a} ÷ ${b}.`,
          solution: [`${a}/${b} = ${a} ÷ ${b} = ${fr(value)}.`],
          recap: `${a}/${b} = ${fr(value)}`,
          review: "Fraction et quotient",
          takeaway: "La fraction a/b est le nombre qui, multiplié par b, donne a : c'est le quotient a ÷ b.",
        }),
        verify: () => close(value * b, a) && close(evaluate(fr(value)), a / b),
      };
    },
  }),
  gen({
    id: "m6-frac-reste", unit: U("fractions"), title: "Fraction d'un tout qui reste", stage: "transfert",
    make: (r, id) => {
      let b = r.int(4, 12);
      let a = r.int(1, b - 1);
      if (2 * a === b) a = a + 1 < b ? a + 1 : a - 1;
      const rest = b - a;
      const thing = r.pick(["une pizza", "un gâteau", "une tablette de chocolat", "une tarte"]);
      return {
        activity: mcq(r, {
          id, stage: "transfert", competence: "modeliser",
          prompt: `On partage ${thing} en ${b} parts égales et on en mange ${a}. Quelle fraction de ${thing} reste-t-il ?`,
          answer: { text: `${rest}/${b}`, feedback: `Il reste ${b} − ${a} = ${rest} parts sur ${b}.` },
          wrong: [
            { text: `${a}/${b}`, feedback: "C'est la fraction mangée, pas celle qui reste." },
            { text: `${rest}/${a}`, feedback: `Le dénominateur est le nombre total de parts : ${b}.` },
            { text: `${a}/${rest}`, feedback: "Le dénominateur doit être le nombre total de parts égales." },
          ],
          hint: "Combien de parts reste-t-il, et en combien de parts le tout est-il partagé ?",
          solution: [`Parts restantes : ${b} − ${a} = ${rest}.`, `Fraction restante : ${rest}/${b}.`],
          takeaway: "Le dénominateur compte les parts égales du tout ; le numérateur compte celles que l'on considère.",
        }),
        verify: () => a + rest === b && 2 * a !== b,
      };
    },
  }),

  /* ——— Calculer ——— */
  gen({
    id: "m6-calc-priorites", unit: U("calcul"), title: "Calculer en respectant les priorités", stage: "application",
    make: (r, id) => {
      const a = r.int(2, 20), b = r.int(2, 9), c = r.int(2, 9), d = r.int(2, 9);
      const forms: [string, number, number][] = [
        [`${a} + ${b} × ${c}`, a + b * c, (a + b) * c],
        [`${a} × (${b} + ${c})`, a * (b + c), a * b + c],
        [`${b * c + a} − ${b} × ${c}`, a, (b * c + a - b) * c],
        [`${a} × ${b} + ${c} × ${d}`, a * b + c * d, (a * b + c) * d],
        [`(${a} + ${b}) × ${c} − ${d}`, (a + b) * c - d, (a + b) * (c - d)],
      ];
      const [expr, value, trap] = r.pick(forms);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: "Calcule sans calculatrice.",
          prompt: `${expr} = ?`,
          expected: value,
          errors: [{ value: trap, code: "priorite", message: "La multiplication se calcule avant l'addition et la soustraction, sauf si des parenthèses disent le contraire.", type: "procedurale" }],
          hint: "Parenthèses d'abord, puis multiplications, puis additions et soustractions de gauche à droite.",
          solution: [`On respecte les priorités : ${expr} = ${value}.`],
          recap: `${expr} = ${value}`,
          review: "Priorités opératoires",
          takeaway: "Ordre de calcul : parenthèses, puis × et ÷, puis + et −.",
        }),
        verify: () => evaluate(expr) === value,
      };
    },
  }),
  gen({
    id: "m6-calc-euclide", unit: U("calcul"), title: "Division euclidienne", stage: "application",
    make: (r, id) => {
      const b = r.int(3, 25), q = r.int(3, 40), rest = r.int(0, b - 1);
      const a = b * q + rest;
      const ctx = r.pick([
        [`On range ${a} œufs dans des boîtes de ${b}.`, "Combien de boîtes pleines obtient-on ?", "Combien d'œufs restent hors des boîtes ?"],
        [`On répartit ${a} élèves en équipes de ${b}.`, "Combien d'équipes complètes forme-t-on ?", "Combien d'élèves restent sans équipe complète ?"],
        [`On partage ${a} cartes en paquets de ${b}.`, "Combien de paquets complets fait-on ?", "Combien de cartes restent ?"],
      ] as const);
      return {
        activity: problem({
          id, stage: "application", competence: "calculer",
          context: ctx[0],
          hint: `Cherche combien de fois ${b} tient dans ${a}.`,
          takeaway: "Division euclidienne : a = b × q + r, avec un reste r plus petit que b.",
          parts: [
            { prompt: ctx[1], expected: q, errors: [{ value: q + 1, code: "trop", message: `${b} × ${q + 1} = ${b * (q + 1)}, c'est plus que ${a}.` }], hint: `${b} × ${q} = ${b * q}. Et ${b} × ${q + 1} ?`, solution: [`${b} × ${q} = ${b * q} ≤ ${a} < ${b * (q + 1)} = ${b} × ${q + 1}.`, `Quotient : ${q}.`], recap: `q = ${q}`, review: "Quotient euclidien" },
            { prompt: ctx[2], expected: rest, hint: `Calcule ${a} − ${b} × ${q}.`, solution: [`${a} − ${b * q} = ${rest}.`, `On vérifie : ${b} × ${q} + ${rest} = ${a}, et ${rest} < ${b}.`], recap: `r = ${rest}`, review: "Reste euclidien" },
          ],
        }),
        verify: () => b * q + rest === a && rest >= 0 && rest < b && Math.floor(a / b) === q,
      };
    },
  }),
  gen({
    id: "m6-calc-mental", unit: U("calcul"), title: "Calcul mental astucieux", stage: "rappel",
    make: (r, id) => {
      const n = r.int(12, 99);
      const [expr, value, tip] = r.pick([
        [`${n} × 5`, n * 5, `Multiplier par 5, c'est multiplier par 10 puis diviser par 2 : ${n * 10} ÷ 2.`],
        [`${n} × 11`, n * 11, `${n} × 11 = ${n} × 10 + ${n} = ${n * 10} + ${n}.`],
        [`${n} × 9`, n * 9, `${n} × 9 = ${n} × 10 − ${n} = ${n * 10} − ${n}.`],
        [`${n * 4} × 25`, n * 100, `× 25, c'est × 100 puis ÷ 4 : ${n * 400} ÷ 4.`],
        [`${n} × 99`, n * 99, `${n} × 99 = ${n} × 100 − ${n} = ${n * 100} − ${n}.`],
      ] as [string, number, string][]);
      return {
        activity: mcqNumber(r, {
          id, stage: "rappel", competence: "calculer",
          prompt: `Calcule de tête : ${expr}`,
          answer: value,
          right: tip,
          wrong: [
            { value: value + 10, feedback: "Presque : vérifie le chiffre des dizaines." },
            { value: value - n, feedback: "Il manque une fois le nombre de départ." },
            { value: value + n, feedback: "Il y a une fois de trop le nombre de départ." },
          ],
          hint: "Décompose le multiplicateur : 5 = 10 ÷ 2, 9 = 10 − 1, 11 = 10 + 1, 25 = 100 ÷ 4.",
          solution: [tip, `${expr} = ${fr(value)}.`],
          takeaway: "En calcul mental, on remplace un multiplicateur par un calcul plus simple avec 10 ou 100.",
        }),
        verify: () => evaluate(expr) === value,
      };
    },
  }),
  gen({
    id: "m6-calc-monnaie", unit: U("calcul"), title: "Problème à étapes : la monnaie rendue", stage: "transfert",
    make: (r, id) => {
      const n = r.int(2, 6), p = r.int(2, 12) + r.pick([0, 0.5, 0.25]);
      const m = r.int(1, 4), q = r.int(1, 9) + r.pick([0, 0.5]);
      const total = n * p + m * q;
      const bill = [20, 50, 100].find((b) => b > total) ?? 200;
      const change = bill - total;
      return {
        activity: problem({
          id, stage: "transfert", competence: "modeliser",
          context: `Léa achète ${n} cahiers à ${euros(p)} l'un et ${m} stylo${m > 1 ? "s" : ""} à ${euros(q)} l'un. Elle paie avec un billet de ${bill} €.`,
          hint: "Calcule d'abord le prix total, puis ce que l'on rend.",
          takeaway: "Dans un problème à étapes, on écrit chaque calcul intermédiaire avec une phrase.",
          parts: [
            { prompt: "Combien coûtent ses achats (en €) ?", expected: total, errors: [{ value: p + q, code: "quantites", message: "Il faut tenir compte du nombre d'articles achetés." }], hint: `${n} × ${fr(p)} + ${m} × ${fr(q)}.`, solution: [`Cahiers : ${n} × ${fr(p)} = ${fr(n * p)} €.`, `Stylos : ${m} × ${fr(q)} = ${fr(m * q)} €.`, `Total : ${fr(total)} €.`], recap: `Total : ${euros(total)}`, review: "Calculer un prix total" },
            { prompt: "Combien lui rend-on (en €) ?", expected: change, hint: `${bill} − ${fr(total)}.`, solution: [`${bill} − ${fr(total)} = ${fr(change)} €.`], recap: `Monnaie : ${euros(change)}`, review: "Calculer une différence" },
          ],
        }),
        verify: () => close(evaluate(`${bill} − (${fr(n)} × ${fr(p)} + ${fr(m)} × ${fr(q)})`), change) && change > 0,
      };
    },
  }),

  /* ——— Proportionnalité ——— */
  gen({
    id: "m6-prop-quatrieme", unit: U("propor"), title: "Calculer une quatrième proportionnelle", stage: "application",
    make: (r, id) => {
      const unit = r.int(2, 15) + r.pick([0, 0.5]);
      const a = r.int(2, 9);
      let c = r.int(2, 15);
      if (c === a) c++;
      const b = a * unit, ans = c * unit;
      const item = r.pick(["places de cinéma", "kilos de pommes", "tickets de bus", "litres de jus", "livres d'occasion"]);
      return {
        activity: ask({
          id, stage: "application", competence: "modeliser",
          context: `${a} ${item} coûtent ${euros(b)}. Le prix est proportionnel à la quantité.`,
          prompt: `Combien coûtent ${c} ${item} (en €) ?`,
          expected: ans,
          errors: [
            { value: b + (c - a), code: "additif", message: "Ce n'est pas en ajoutant la même chose que l'on reste proportionnel : on multiplie.", type: "conceptuelle" },
            { value: b * c, code: "oubli_div", message: `${euros(b)}, c'est le prix de ${a} ${item}, pas d'un seul.`, type: "procedurale" },
          ],
          hint: `Cherche d'abord le prix d'une unité : ${fr(b)} ÷ ${a}.`,
          solution: [`Prix d'une unité : ${fr(b)} ÷ ${a} = ${fr(unit)} €.`, `Pour ${c} : ${c} × ${fr(unit)} = ${fr(ans)} €.`],
          recap: `${c} ${item} : ${euros(ans)}`,
          review: "Quatrième proportionnelle",
          takeaway: "Passage par l'unité : on divise pour trouver la valeur d'une unité, puis on multiplie.",
        }),
        verify: () => close(ans / c, b / a),
      };
    },
  }),
  gen({
    id: "m6-prop-reconnaitre", unit: U("propor"), title: "Reconnaître un tableau de proportionnalité", stage: "rappel",
    make: (r, id) => {
      const k = r.int(2, 9);
      const xs = r.sample([1, 2, 3, 4, 5, 6, 8, 10, 12], 4).sort((a, b) => a - b);
      const prop = r.chance(0.5);
      const shift = r.int(1, 5);
      const ys = xs.map((x) => k * x + (prop ? 0 : shift));
      const table = mockTable("Tableau", ["Quantité", ...xs.map(String)], [["Prix (€)", ...ys.map(String)]]);
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "raisonner",
          stimulus: table,
          prompt: "Ce tableau est-il un tableau de proportionnalité ?",
          answer: prop
            ? { text: `Oui : on multiplie toujours par ${k}`, feedback: `${ys.map((y, i) => `${y} ÷ ${xs[i]} = ${k}`).join(" ; ")} : le coefficient est le même.` }
            : { text: "Non : les quotients ne sont pas tous égaux", feedback: `${ys[0]} ÷ ${xs[0]} et ${ys[1]} ÷ ${xs[1]} ne sont pas égaux.` },
          wrong: prop
            ? [
              { text: "Non : les nombres ne se suivent pas", feedback: "Les quantités n'ont pas besoin de se suivre : seul compte le coefficient multiplicateur." },
              { text: "Non : les quotients ne sont pas tous égaux", feedback: `Calcule-les : ils valent tous ${k}.` },
            ]
            : [
              { text: `Oui : on multiplie toujours par ${k}`, feedback: `${xs[0]} × ${k} = ${xs[0]! * k}, pas ${ys[0]}.` },
              { text: "Oui : les deux lignes augmentent", feedback: "Augmenter ensemble ne suffit pas : il faut multiplier par le même nombre." },
            ],
          hint: "Divise chaque nombre du bas par celui du haut : obtiens-tu toujours le même résultat ?",
          solution: [`Quotients : ${ys.map((y, i) => fr(y / xs[i]!)).join(" ; ")}.`, prop ? "Ils sont égaux : c'est un tableau de proportionnalité." : "Ils ne sont pas égaux : ce n'en est pas un."],
          takeaway: "Un tableau est de proportionnalité quand on passe d'une ligne à l'autre en multipliant toujours par le même nombre.",
        }),
        verify: () => ys.every((y, i) => y / xs[i]! === ys[0]! / xs[0]!) === prop,
      };
    },
  }),
  gen({
    id: "m6-prop-pourcent", unit: U("propor"), title: "Appliquer un pourcentage simple", stage: "application",
    make: (r, id) => {
      const p = r.pick([10, 20, 25, 50, 75, 5, 30, 40]);
      const n = r.int(1, 30) * 20;
      const res = (n * p) / 100;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Dans un collège de ${n} élèves, ${p} % viennent à vélo.`,
          prompt: "Combien d'élèves viennent à vélo ?",
          expected: res,
          errors: [{ value: n / p, code: "division", message: `${p} % signifie ${p} pour 100 : on multiplie par ${p} puis on divise par 100.`, type: "conceptuelle" }],
          hint: `${p} %, c'est ${p}/100.`,
          solution: [`${p} % de ${n} = ${n} × ${p} ÷ 100.`, `= ${fr(res)}.`],
          recap: `${p} % de ${n} = ${fr(res)}`,
          review: "Appliquer un pourcentage",
          takeaway: "Prendre p % d'une quantité, c'est la multiplier par p/100.",
        }),
        verify: () => res * 100 === n * p,
      };
    },
  }),
  gen({
    id: "m6-prop-echelle", unit: U("propor"), title: "Utiliser une échelle", stage: "transfert",
    make: (r, id) => {
      const scale = r.pick([25000, 50000, 100000, 200000, 1000000]);
      const cm = r.int(2, 12) + (scale >= 100000 ? 0 : r.pick([0, 0.5]));
      const km = (cm * scale) / 100000;
      return {
        activity: ask({
          id, stage: "transfert", competence: "modeliser",
          context: `Sur une carte à l'échelle 1/${fr(scale)}, deux villages sont à ${fr(cm)} cm l'un de l'autre.`,
          prompt: "Quelle est la distance réelle en kilomètres ?",
          expected: km,
          errors: [{ value: cm * scale, code: "unite", message: `${fr(cm * scale)} est la distance en centimètres : 1 km = 100 000 cm.`, type: "procedurale" }],
          hint: `1 cm sur la carte représente ${fr(scale)} cm en vrai.`,
          solution: [`Distance réelle : ${fr(cm)} × ${fr(scale)} = ${fr(cm * scale)} cm.`, `1 km = 100 000 cm, donc ${fr(cm * scale)} cm = ${fr(km)} km.`],
          recap: `${fr(km)} km`,
          review: "Utiliser une échelle",
          takeaway: "Échelle 1/n : une longueur réelle est n fois plus grande que sur le plan, dans la même unité.",
        }),
        verify: () => close(km * 100000, cm * scale),
      };
    },
  }),

  /* ——— Grandeurs et mesures ——— */
  gen({
    id: "m6-gm-rectangle", unit: U("grandeurs"), title: "Périmètre et aire d'un rectangle", stage: "application",
    make: (r, id) => {
      const L = r.int(4, 25), l = r.int(2, L - 1);
      return {
        activity: problem({
          id, stage: "application", competence: "calculer",
          context: `Un rectangle mesure ${L} cm de long et ${l} cm de large.`,
          hint: "Le périmètre se mesure en cm (le tour), l'aire en cm² (la surface).",
          takeaway: "Rectangle : périmètre = 2 × (L + l) ; aire = L × l.",
          parts: [
            { prompt: "Quel est son périmètre (en cm) ?", expected: 2 * (L + l), errors: [{ value: L + l, code: "demi", message: "Tu as fait la moitié du tour : il y a deux longueurs et deux largeurs." }, { value: L * l, code: "aire", message: "C'est l'aire. Le périmètre est la longueur du tour." }], hint: "Fais le tour : longueur + largeur + longueur + largeur.", solution: [`P = 2 × (${L} + ${l}) = ${2 * (L + l)} cm.`], recap: `P = ${2 * (L + l)} cm`, review: "Périmètre du rectangle" },
            { prompt: "Quelle est son aire (en cm²) ?", expected: L * l, errors: [{ value: 2 * (L + l), code: "perimetre", message: "C'est le périmètre. L'aire compte les carreaux de 1 cm² à l'intérieur." }], hint: "Combien de carrés de 1 cm de côté tiennent dedans ?", solution: [`A = ${L} × ${l} = ${L * l} cm².`], recap: `A = ${L * l} cm²`, review: "Aire du rectangle" },
          ],
        }),
        verify: () => evaluate(`2 × (${L} + ${l})`) / 2 - L === l && (L * l) / L === l,
      };
    },
  }),
  gen({
    id: "m6-gm-conversion", unit: U("grandeurs"), title: "Convertir des longueurs", stage: "application",
    make: (r, id) => {
      const units = ["km", "hm", "dam", "m", "dm", "cm", "mm"];
      const i = r.int(0, 5);
      const j = Math.min(6, i + r.int(1, 3));
      const [from, to] = r.chance(0.5) ? [i, j] : [j, i];
      const mm = r.int(1, 999) * 10 ** (6 - Math.max(from, to)) * (r.chance(0.5) ? 1 : 10);
      const vFrom = mm / 10 ** (6 - from);
      const vTo = mm / 10 ** (6 - to);
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: "Conversion de longueurs.",
          prompt: `${fr(vFrom)} ${units[from]} = ? ${units[to]}`,
          expected: Number(vTo.toFixed(6)),
          errors: [{ value: Number((vFrom * 10 ** (from - to)).toFixed(6)), code: "sens", message: "Vérifie le sens : vers une unité plus petite, le nombre devient plus grand." }],
          hint: "Utilise le tableau km, hm, dam, m, dm, cm, mm : on passe d'une colonne à la suivante en multipliant ou divisant par 10.",
          solution: [`De ${units[from]} à ${units[to]}, on ${to > from ? "multiplie" : "divise"} par ${fr(10 ** Math.abs(to - from))}.`, `${fr(vFrom)} ${units[from]} = ${fr(vTo)} ${units[to]}.`],
          recap: `${fr(vFrom)} ${units[from]} = ${fr(vTo)} ${units[to]}`,
          review: "Conversions de longueurs",
          takeaway: "Dans le tableau des longueurs, chaque unité vaut 10 fois l'unité située à sa droite.",
        }),
        verify: () => close(vTo * 10 ** (6 - to), vFrom * 10 ** (6 - from)),
      };
    },
  }),
  gen({
    id: "m6-gm-durees", unit: U("grandeurs"), title: "Calculer une heure de fin", stage: "application",
    make: (r, id) => {
      const h = r.int(8, 19), m = r.int(10, 55);
      const dh = r.int(0, 2), dm = r.int(15, 55);
      const total = h * 60 + m + dh * 60 + dm;
      const H = Math.floor(total / 60), M = total % 60;
      const show = (a: number, b: number) => `${a} h ${String(b).padStart(2, "0")}`;
      const naive = show(h + dh, m + dm);
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "calculer",
          prompt: `Un film commence à ${show(h, m)} et dure ${dh ? `${dh} h ` : ""}${dm} min. À quelle heure se termine-t-il ?`,
          answer: { text: show(H, M), feedback: `${m} + ${dm} = ${m + dm} min${m + dm >= 60 ? ` = 1 h ${String(m + dm - 60).padStart(2, "0")}` : ""}.` },
          wrong: [
            ...(m + dm >= 60 ? [{ text: naive, feedback: "Une heure compte 60 minutes, pas 100 : au-delà de 60 min, on ajoute 1 h." }] : []),
            { text: show(H + 1, M), feedback: "Une heure de trop : refais l'addition des heures." },
            { text: show(H, (M + 10) % 60), feedback: "Vérifie l'addition des minutes." },
            { text: show(H - 1 < 0 ? H + 2 : H - 1, M), feedback: "Il manque une heure : n'oublie pas la retenue des minutes." },
          ].slice(0, 3),
          hint: "Ajoute d'abord les heures, puis les minutes ; 60 min = 1 h.",
          solution: [`${show(h, m)} + ${dh} h = ${show(h + dh, m)}.`, `${show(h + dh, m)} + ${dm} min = ${show(H, M)}.`],
          takeaway: "Pour ajouter des durées, on additionne heures et minutes séparément, puis on convertit 60 min en 1 h.",
        }),
        verify: () => H * 60 + M - (h * 60 + m) === dh * 60 + dm && M < 60,
      };
    },
  }),
  gen({
    id: "m6-gm-triangle", unit: U("grandeurs"), title: "Aire d'un triangle rectangle", stage: "transfert",
    make: (r, id) => {
      const a = r.int(2, 20), b = r.int(2, 20) * 2;
      const area = (a * b) / 2;
      return {
        activity: ask({
          id, stage: "transfert", competence: "raisonner",
          context: `Un triangle rectangle a des côtés de l'angle droit de ${a} cm et ${b} cm.`,
          prompt: "Quelle est son aire (en cm²) ?",
          expected: area,
          errors: [{ value: a * b, code: "rectangle", message: "a × b est l'aire du rectangle entier : le triangle en est la moitié.", type: "conceptuelle" }],
          hint: "Ce triangle est la moitié d'un rectangle.",
          solution: [`Le rectangle de côtés ${a} et ${b} a pour aire ${a * b} cm².`, `Le triangle en est la moitié : ${a * b} ÷ 2 = ${fr(area)} cm².`],
          recap: `A = ${fr(area)} cm²`,
          review: "Aire du triangle rectangle",
          takeaway: "Un triangle rectangle est la moitié d'un rectangle : aire = (a × b) ÷ 2.",
        }),
        verify: () => area * 2 === a * b,
      };
    },
  }),

  /* ——— Géométrie ——— */
  gen({
    id: "m6-geo-droites", unit: U("geometrie"), title: "Propriétés des droites parallèles et perpendiculaires", stage: "rappel",
    make: (r, id) => {
      const [d1, d2, d3] = r.sample(["(d)", "(d')", "(Δ)", "(AB)", "(CD)", "(EF)"], 3);
      const kind = r.int(0, 2);
      const premises = [`${d1} ⊥ ${d3} et ${d2} ⊥ ${d3}`, `${d1} // ${d3} et ${d2} ⊥ ${d3}`, `${d1} // ${d3} et ${d2} // ${d3}`][kind]!;
      const conclusion = [`${d1} // ${d2}`, `${d1} ⊥ ${d2}`, `${d1} // ${d2}`][kind]!;
      const wrongConc = [`${d1} ⊥ ${d2}`, `${d1} // ${d2}`, `${d1} ⊥ ${d2}`][kind]!;
      const rule = [
        "Si deux droites sont perpendiculaires à une même droite, alors elles sont parallèles entre elles.",
        "Si deux droites sont parallèles, toute droite perpendiculaire à l'une est perpendiculaire à l'autre.",
        "Si deux droites sont parallèles à une même droite, alors elles sont parallèles entre elles.",
      ][kind]!;
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "raisonner",
          prompt: `On sait que ${premises}. Que peut-on en déduire ?`,
          answer: { text: conclusion, feedback: rule },
          wrong: [
            { text: wrongConc, feedback: "Fais un schéma à main levée : la position des deux droites se voit tout de suite." },
            { text: "On ne peut rien déduire", feedback: `Une propriété du cours permet de conclure : ${rule.charAt(0).toLowerCase()}${rule.slice(1)}` },
          ],
          hint: "Fais un schéma à main levée avec les trois droites.",
          solution: [`Données : ${premises}.`, `Propriété : ${rule}`, `Conclusion : ${conclusion}.`],
          takeaway: "Une démonstration suit trois temps : ce que l'on sait, la propriété utilisée, ce que l'on conclut.",
        }),
        verify: () => (kind === 1 ? conclusion.includes("⊥") : conclusion.includes("//")),
      };
    },
  }),
  gen({
    id: "m6-geo-cercle", unit: U("geometrie"), title: "Rayon, diamètre et longueur d'un cercle", stage: "application",
    make: (r, id) => {
      const radius = r.int(2, 30);
      const fromDiameter = r.chance(0.5);
      const d = 2 * radius;
      const perim = Math.PI * d;
      return {
        activity: problem({
          id, stage: "application", competence: "calculer",
          context: fromDiameter ? `Un cercle a un diamètre de ${d} cm.` : `Un cercle a un rayon de ${radius} cm.`,
          hint: "Le diamètre vaut deux fois le rayon.",
          takeaway: "d = 2 × r, et la longueur d'un cercle vaut π × d (π ≈ 3,14).",
          parts: [
            fromDiameter
              ? { prompt: "Quel est son rayon (en cm) ?", expected: radius, errors: [{ value: 2 * d, code: "double", message: "Le rayon est la moitié du diamètre, pas le double." }], hint: "Le rayon va du centre au cercle : c'est la moitié du diamètre.", solution: [`r = d ÷ 2 = ${d} ÷ 2 = ${radius} cm.`], recap: `r = ${radius} cm`, review: "Rayon et diamètre" }
              : { prompt: "Quel est son diamètre (en cm) ?", expected: d, errors: [{ value: radius / 2, code: "moitie", message: "Le diamètre est le double du rayon." }], hint: "Le diamètre traverse le cercle en passant par le centre.", solution: [`d = 2 × r = 2 × ${radius} = ${d} cm.`], recap: `d = ${d} cm`, review: "Rayon et diamètre" },
            { prompt: "Donne sa longueur en cm, arrondie au dixième (π ≈ 3,14 suffit).", expected: Math.round(perim * 10) / 10, tolerance: { abs: 0.35 }, errors: [{ value: Math.round(Math.PI * radius * 10) / 10, code: "rayon", message: "La formule utilise le diamètre : π × d, ou 2 × π × r." }], hint: "Longueur du cercle = π × diamètre.", solution: [`L = π × ${d} ≈ ${fr(Math.round(perim * 10) / 10)} cm.`], recap: `L ≈ ${fr(Math.round(perim * 10) / 10)} cm`, review: "Longueur d'un cercle" },
          ],
        }),
        verify: () => close(perim / Math.PI, 2 * radius) && Math.abs(3.14 * d - perim) <= 0.35,
      };
    },
  }),
  gen({
    id: "m6-geo-symetrie", unit: U("geometrie"), title: "Symétrique d'un point par rapport à un axe", stage: "application",
    make: (r, id) => {
      const axis = r.int(6, 10);
      const x = axis + r.nonZero(5);
      const y = r.int(0, 9);
      const sx = 2 * axis - x;
      const pt = (a: number, b: number) => `(${fr(a)} ; ${fr(b)})`;
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "representer",
          prompt: `Sur un quadrillage, l'axe de symétrie est la droite verticale formée des points d'abscisse ${axis}. Le point A a pour coordonnées ${pt(x, y)}. Quelles sont les coordonnées de son symétrique A' ?`,
          answer: { text: pt(sx, y), feedback: `A est à ${Math.abs(x - axis)} carreaux de l'axe ; A' est à la même distance, de l'autre côté, à la même hauteur.` },
          wrong: [
            { text: pt(x, 2 * axis - y), feedback: "L'axe est vertical : le symétrique reste à la même hauteur (même ordonnée)." },
            { text: pt(-x, y), feedback: "L'axe n'est pas l'axe des ordonnées : il passe par l'abscisse " + axis + "." },
            { text: pt(sx + (x > axis ? -1 : 1), y), feedback: "Compte bien les carreaux : A' doit être à la même distance de l'axe que A." },
          ],
          hint: "Compte la distance de A à l'axe, puis reporte-la de l'autre côté.",
          solution: [`Distance de A à l'axe : |${x} − ${axis}| = ${Math.abs(x - axis)}.`, `A' : abscisse ${axis} ${x > axis ? "−" : "+"} ${Math.abs(x - axis)} = ${sx}, même ordonnée ${y}.`],
          takeaway: "Par une symétrie axiale, un point et son image sont à la même distance de l'axe, sur une perpendiculaire à l'axe.",
        }),
        verify: () => (x + sx) / 2 === axis && sx !== x,
      };
    },
  }),
  gen({
    id: "m6-geo-angles", unit: U("geometrie"), title: "Nature d'un angle", stage: "rappel",
    make: (r, id) => {
      const kind = r.int(0, 3);
      const deg = [r.int(5, 85), 90, r.int(95, 175), 180][kind]!;
      const names = ["aigu", "droit", "obtus", "plat"];
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "communiquer",
          prompt: `Un angle mesure ${deg}°. Comment est-il ?`,
          answer: { text: names[kind]!, feedback: ["Un angle aigu mesure moins de 90°.", "Un angle droit mesure exactement 90°.", "Un angle obtus mesure entre 90° et 180°.", "Un angle plat mesure 180°."][kind]! },
          wrong: names.filter((_, i) => i !== kind).map((n) => ({ text: n, feedback: `Un angle ${n} ${n === "aigu" ? "mesure moins de 90°" : n === "droit" ? "mesure 90°" : n === "obtus" ? "mesure entre 90° et 180°" : "mesure 180°"}.` })),
          hint: "Compare la mesure à 90° et à 180°.",
          solution: [`${deg}° ${kind === 0 ? "< 90°" : kind === 1 ? "= 90°" : kind === 2 ? "est entre 90° et 180°" : "= 180°"} : l'angle est ${names[kind]}.`],
          takeaway: "Aigu : moins de 90° ; droit : 90° ; obtus : entre 90° et 180° ; plat : 180°.",
        }),
        verify: () => (deg < 90 ? 0 : deg === 90 ? 1 : deg < 180 ? 2 : 3) === kind,
      };
    },
  }),

  /* ——— Problèmes et premiers pas en algèbre ——— */
  gen({
    id: "m6-pb-fois-plus", unit: U("problemes"), title: "Partage inégal avec un schéma en barres", stage: "application",
    make: (r, id) => {
      const k = r.int(2, 5), small = r.int(3, 40);
      const total = small * (k + 1);
      const [a, b] = r.pick([["Tom", "Inès"], ["le club A", "le club B"], ["la classe de 6e A", "la classe de 6e B"]] as const);
      return {
        activity: ask({
          id, stage: "application", competence: "modeliser",
          context: `${a} et ${b} ont récolté ${total} € en tout. ${b} a récolté ${k} fois plus que ${a}.`,
          prompt: `Combien ${a} a-t-il récolté (en €) ?`,
          expected: small,
          errors: [{ value: total / k, code: "parts", message: `Il y a ${k + 1} parts égales en tout : 1 pour ${a} et ${k} pour ${b}.`, type: "strategique" }],
          hint: `Dessine une barre pour ${a} et ${k} barres identiques pour ${b}.`,
          solution: [`Le total représente 1 + ${k} = ${k + 1} parts égales.`, `Une part : ${total} ÷ ${k + 1} = ${small} €.`, `${a} : ${small} € ; ${b} : ${k * small} €.`],
          recap: `${a} : ${small} €`,
          review: "Partage inégal",
          takeaway: "Avec un schéma en barres, on compte le nombre de parts égales avant de diviser.",
          model: { caption: "Le total partagé en parts égales", rows: [{ label: a, parts: [{ size: 1, tone: "unknown", text: "?" }] }, { label: b, parts: Array.from({ length: k }, () => ({ size: 1, tone: "shade" as const })) }], },
        }),
        verify: () => small + k * small === total,
      };
    },
  }),
  gen({
    id: "m6-pb-difference", unit: U("problemes"), title: "Somme et différence", stage: "transfert",
    make: (r, id) => {
      const small = r.int(5, 60), diff = r.int(2, 30);
      const total = 2 * small + diff;
      return {
        activity: ask({
          id, stage: "transfert", competence: "chercher",
          context: `Deux frères ont ${total} cartes à eux deux. L'aîné en a ${diff} de plus que le cadet.`,
          prompt: "Combien de cartes a le cadet ?",
          expected: small,
          errors: [{ value: total / 2, code: "moitie", message: "Ils n'en ont pas autant : enlève d'abord la différence, puis partage en deux.", type: "strategique" }, { value: (total + diff) / 2, code: "aine", message: "Ça, c'est la part de l'aîné." }],
          hint: `Si l'on enlève les ${diff} cartes en plus de l'aîné, que reste-t-il à partager ?`,
          solution: [`${total} − ${diff} = ${2 * small} : deux parts égales.`, `${2 * small} ÷ 2 = ${small} cartes pour le cadet, ${small + diff} pour l'aîné.`],
          recap: `Cadet : ${small} cartes`,
          review: "Problème somme-différence",
          takeaway: "Somme et différence : on enlève la différence, on partage le reste en deux.",
        }),
        verify: () => small + (small + diff) === total,
      };
    },
  }),
  gen({
    id: "m6-pb-motif", unit: U("problemes"), title: "Motif qui évolue", stage: "transfert",
    make: (r, id) => {
      const first = r.int(2, 8), step = r.int(2, 6), n = r.int(5, 20);
      const res = first + (n - 1) * step;
      return {
        activity: ask({
          id, stage: "transfert", competence: "chercher",
          context: `Un motif est construit avec des allumettes : l'étape 1 en compte ${first}, et chaque étape en ajoute ${step}.`,
          prompt: `Combien d'allumettes faut-il pour l'étape ${n} ?`,
          expected: res,
          errors: [{ value: first + n * step, code: "decalage", message: `De l'étape 1 à l'étape ${n}, on ajoute ${step} seulement ${n - 1} fois.`, type: "procedurale" }, { value: n * step, code: "depart", message: `N'oublie pas les ${first} allumettes de départ.` }],
          hint: `De l'étape 1 à l'étape ${n}, combien de fois ajoute-t-on ${step} ?`,
          solution: [`On ajoute ${step} allumettes ${n - 1} fois.`, `${first} + ${n - 1} × ${step} = ${res}.`],
          recap: `Étape ${n} : ${res} allumettes`,
          review: "Motif évolutif",
          takeaway: "Pour un motif qui augmente toujours du même nombre : départ + (n − 1) × pas.",
        }),
        verify: () => {
          let v = first;
          for (let i = 2; i <= n; i++) v += step;
          return v === res;
        },
      };
    },
  }),

  /* ——— Données et probabilités ——— */
  gen({
    id: "m6-don-tableau", unit: U("donnees"), title: "Lire et exploiter un tableau", stage: "application",
    make: (r, id) => {
      const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
      const values = r.sample(Array.from({ length: 84 }, (_, i) => i + 12), 5);
      const total = values.reduce((a, b) => a + b, 0);
      const max = Math.max(...values), min = Math.min(...values);
      const dayMax = days[values.indexOf(max)]!, dayMin = days[values.indexOf(min)]!;
      const table = mockTable("Visiteurs du CDI", ["Jour", "Visiteurs"], days.map((d, i) => [d, String(values[i])]));
      return {
        activity: problem({
          id, stage: "application", competence: "representer",
          stimulus: table,
          context: "Le tableau donne le nombre de visiteurs du CDI chaque jour d'une semaine.",
          hint: "Lis chaque ligne du tableau avant de calculer.",
          takeaway: "Pour exploiter un tableau, on repère la ligne et la colonne utiles, puis on calcule.",
          parts: [
            { prompt: "Combien de visiteurs en tout dans la semaine ?", expected: total, hint: "Additionne les cinq nombres.", solution: [`${values.join(" + ")} = ${total}.`], recap: `Total : ${total}`, review: "Calculer un total" },
            { prompt: `Combien de visiteurs de plus le jour le plus fréquenté que le jour le moins fréquenté ?`, expected: max - min, hint: "Repère le plus grand et le plus petit nombre, puis calcule leur différence.", solution: [`Le plus : ${dayMax.toLowerCase()} (${max}). Le moins : ${dayMin.toLowerCase()} (${min}).`, `${max} − ${min} = ${max - min}.`], recap: `Écart : ${max - min}`, review: "Calculer un écart" },
          ],
        }),
        verify: () => table.kind === "table" && table.rows.reduce((s, row) => s + Number(row[1]), 0) === total && table.rows.every((row) => Number(row[1]) <= max && Number(row[1]) >= min),
      };
    },
  }),
  gen({
    id: "m6-don-proba", unit: U("donnees"), title: "Probabilité dans une situation équiprobable", stage: "application",
    make: (r, id) => {
      const red = r.int(1, 9), blue = r.int(1, 9), green = r.int(1, 9);
      const total = red + blue + green;
      const color = r.pick(["rouge", "bleue", "verte"] as const);
      const n = color === "rouge" ? red : color === "bleue" ? blue : green;
      return {
        activity: ask({
          id, stage: "application", competence: "modeliser",
          context: `Un sac contient ${red} boule${red > 1 ? "s" : ""} rouge${red > 1 ? "s" : ""}, ${blue} bleue${blue > 1 ? "s" : ""} et ${green} verte${green > 1 ? "s" : ""}, indiscernables au toucher. On tire une boule au hasard.`,
          prompt: `Quelle est la probabilité de tirer une boule ${color} ? Donne une fraction.`,
          expected: n / total,
          tolerance: { rel: 1e-5 },
          errors: [{ value: n / (total - n), code: "autres", message: "Le dénominateur est le nombre total de boules, pas le nombre des autres boules.", type: "conceptuelle" }],
          hint: "Probabilité = nombre de cas favorables ÷ nombre de cas possibles.",
          solution: [`Cas favorables : ${n}. Cas possibles : ${red} + ${blue} + ${green} = ${total}.`, `Probabilité : ${n}/${total}.`],
          recap: `p = ${n}/${total}`,
          review: "Probabilité équiprobable",
          takeaway: "Quand toutes les issues ont la même chance, p = cas favorables ÷ cas possibles.",
        }),
        verify: () => close((n / total) * (red + blue + green), n),
      };
    },
  }),
  gen({
    id: "m6-don-repere", unit: U("donnees"), title: "Se déplacer dans un repère", stage: "rappel",
    make: (r, id) => {
      const x = r.int(0, 8), y = r.int(3, 9), dy = r.int(1, 3);
      let dx = r.int(1, 5);
      if (dx === dy) dx++;
      const pt = (a: number, b: number) => `(${a} ; ${b})`;
      const walk = () => {
        let [px, py] = [x, y];
        for (let i = 0; i < dx; i++) px++;
        for (let i = 0; i < dy; i++) py--;
        return pt(px, py);
      };
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "representer",
          prompt: `Le point A a pour coordonnées ${pt(x, y)}. On le déplace de ${dx} unité${dx > 1 ? "s" : ""} vers la droite et de ${dy} vers le bas. Où arrive-t-il ?`,
          answer: { text: pt(x + dx, y - dy), feedback: "Vers la droite, l'abscisse augmente ; vers le bas, l'ordonnée diminue." },
          wrong: [
            { text: pt(x + dx, y + dy), feedback: "Vers le bas, l'ordonnée diminue." },
            { text: pt(x - dx, y - dy), feedback: "Vers la droite, l'abscisse augmente." },
            { text: pt(x + dy, y - dx), feedback: "L'abscisse (premier nombre) correspond au déplacement horizontal." },
          ],
          hint: "Le premier nombre est l'abscisse (horizontal), le second l'ordonnée (vertical).",
          solution: [`Abscisse : ${x} + ${dx} = ${x + dx}.`, `Ordonnée : ${y} − ${dy} = ${y - dy}.`],
          takeaway: "Coordonnées (abscisse ; ordonnée) : on lit d'abord sur l'axe horizontal, puis sur l'axe vertical.",
        }),
        verify: () => walk() === pt(x + dx, y - dy) && dx !== dy,
      };
    },
  }),

  /* ——— Pensée informatique ——— */
  gen({
    id: "m6-algo-programme", unit: U("algo"), title: "Suivre un programme de calcul", stage: "application",
    make: (r, id) => {
      const start = r.int(2, 15), a = r.int(2, 6), b = r.int(1, 12), c = r.int(2, 5);
      const steps = [`Choisir un nombre : ${start}.`, `Le multiplier par ${a}.`, `Ajouter ${b}.`, `Multiplier le résultat par ${c}.`];
      const res = (start * a + b) * c;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: steps.join(" "),
          prompt: "Quel est le résultat ?",
          expected: res,
          errors: [{ value: start * a + b * c, code: "ordre", message: "On multiplie tout le résultat précédent par " + c + ", pas seulement le dernier nombre ajouté.", type: "procedurale" }],
          hint: "Note le résultat après chaque étape.",
          solution: [`${start} × ${a} = ${start * a}.`, `${start * a} + ${b} = ${start * a + b}.`, `${start * a + b} × ${c} = ${res}.`],
          recap: `Résultat : ${res}`,
          review: "Programme de calcul",
          takeaway: "Un programme s'exécute étape par étape : chaque instruction agit sur le résultat précédent.",
        }),
        verify: () => evaluate(`(${start} × ${a} + ${b}) × ${c}`) === res,
      };
    },
  }),
  gen({
    id: "m6-algo-deplacement", unit: U("algo"), title: "Prévoir un déplacement programmé", stage: "transfert",
    make: (r, id) => {
      const n = r.int(2, 6), step = r.pick([10, 20, 25, 50]), back = r.int(1, 3) * 5;
      const x = n * (step - back);
      return {
        activity: ask({
          id, stage: "transfert", competence: "raisonner",
          context: `Un lutin part de l'abscisse 0. Son programme : répéter ${n} fois [avancer de ${step} pas vers la droite ; reculer de ${back} pas].`,
          prompt: "À quelle abscisse arrive-t-il ?",
          expected: x,
          errors: [{ value: n * step - back, code: "boucle", message: "Le recul est dans la boucle : il est répété " + n + " fois aussi.", type: "procedurale" }],
          hint: "Calcule le déplacement d'un seul tour de boucle.",
          solution: [`Un tour : ${step} − ${back} = ${step - back} pas.`, `${n} tours : ${n} × ${step - back} = ${x}.`],
          recap: `x = ${x}`,
          review: "Boucle répéter",
          takeaway: "Dans une boucle « répéter n fois », toutes les instructions du bloc sont refaites n fois.",
        }),
        verify: () => {
          let pos = 0;
          for (let i = 0; i < n; i++) {
            pos += step;
            pos -= back;
          }
          return pos === x;
        },
      };
    },
  }),
];
