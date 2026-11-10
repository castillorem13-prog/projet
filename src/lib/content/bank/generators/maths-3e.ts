import { ask, gen, mcq, mockCode, mockTable, problem } from "../build";
import { evaluate, sameExpression } from "../evaluate";
import { close, fr, frac, gcd, par, poly, pow, round } from "../format";
import type { Generator } from "../types";

/** Mathématiques, 3e (cycle 4, programme du brevet). */

const U = (slug: string) => `3e-maths-${slug}`;
const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};
const PRIMES = Array.from({ length: 100 }, (_, i) => i).filter(isPrime);
const deg = (x: number) => (x * Math.PI) / 180;

/** Décomposition écrite : 2² × 3 × 5. */
function factorText(n: number): string {
  const parts: string[] = [];
  for (const p of PRIMES) {
    let e = 0;
    while (n % p === 0) { n /= p; e++; }
    if (e) parts.push(e > 1 ? pow(p, e) : String(p));
  }
  return parts.join(" × ");
}

export const MATHS_3E: Generator[] = [
  /* ——— Arithmétique ——— */
  gen({
    id: "m3-ari-premier", unit: U("arith"), title: "Reconnaître un nombre premier", stage: "rappel",
    make: (r, id) => {
      const prime = r.pick(PRIMES.filter((p) => p > 10));
      const traps = r.sample([21, 27, 33, 39, 49, 51, 57, 63, 69, 77, 81, 87, 91, 93], 3);
      const why = (n: number) => { const d = PRIMES.find((p) => n % p === 0)!; return `${n} = ${d} × ${n / d} : il a d'autres diviseurs que 1 et lui-même.`; };
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "raisonner",
          prompt: "Lequel de ces nombres est premier ?",
          answer: { text: String(prime), feedback: `${prime} n'est divisible que par 1 et par lui-même.` },
          wrong: traps.map((t) => ({ text: String(t), feedback: why(t) })),
          hint: "Teste la divisibilité par 2, 3, 5, 7.",
          solution: [`${prime} n'est divisible ni par 2, ni par 3, ni par 5, ni par 7 : il est premier.`, ...traps.map(why)],
          takeaway: "Un nombre premier a exactement deux diviseurs : 1 et lui-même. Pour le vérifier, on teste les nombres premiers jusqu'à sa racine carrée.",
        }),
        verify: () => isPrime(prime) && traps.every((t) => !isPrime(t)),
      };
    },
  }),
  gen({
    id: "m3-ari-decomposer", unit: U("arith"), title: "Décomposer en facteurs premiers", stage: "application",
    make: (r, id) => {
      const factors = r.sample([2, 2, 2, 3, 3, 5, 7, 11, 13], r.int(3, 4));
      const n = factors.reduce((a, b) => a * b, 1);
      const right = factorText(n);
      const nonPrime = n % 4 === 0 ? `4 × ${factorText(n / 4)}` : n % 6 === 0 ? `6 × ${factorText(n / 6)}` : `${n / factors[0]!} × ${factors[0]}`;
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "calculer",
          prompt: `Quelle est la décomposition de ${n} en produit de facteurs premiers ?`,
          answer: { text: right, feedback: `On divise successivement par 2, 3, 5, 7… : ${n} = ${right}.` },
          wrong: [
            { text: nonPrime, feedback: "Le produit est juste, mais tous les facteurs ne sont pas premiers." },
            { text: factorText(n * 2), feedback: `Ce produit vaut ${n * 2}, pas ${n}.` },
            { text: factorText(n % 2 === 0 ? n / 2 : n * 3), feedback: `Ce produit vaut ${n % 2 === 0 ? n / 2 : n * 3}, pas ${n}.` },
          ],
          hint: "Divise par le plus petit nombre premier possible, et recommence.",
          solution: [`${n} = ${right}.`],
          takeaway: "Tout entier supérieur à 1 se décompose de façon unique en produit de facteurs premiers.",
        }),
        verify: () => close(evaluate(right), n) && !close(evaluate(factorText(n * 2)), n),
      };
    },
  }),
  gen({
    id: "m3-ari-irreductible", unit: U("arith"), title: "Rendre une fraction irréductible", stage: "application",
    make: (r, id) => {
      let a = r.int(1, 12), b = r.int(2, 15);
      while (gcd(a, b) !== 1 || a === b) { a = r.int(1, 12); b = r.int(2, 15); }
      const k = r.pick([6, 8, 9, 10, 12, 14, 15, 18, 21, 24]);
      const half = PRIMES.find((p) => k % p === 0)!;
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "calculer",
          prompt: `Écris ${frac(a * k, b * k)} sous forme irréductible.`,
          answer: { text: frac(a, b), feedback: `On divise par le PGCD ${k} : ${a * k} ÷ ${k} = ${a} et ${b * k} ÷ ${k} = ${b}.` },
          wrong: [
            { text: frac((a * k) / half, (b * k) / half), feedback: `C'est égal, mais on peut encore simplifier (par ${k / half}).` },
            { text: frac(a + 1, b), feedback: "Cette fraction n'est pas égale à celle de départ." },
            { text: frac(b, a), feedback: "Numérateur et dénominateur ont été inversés." },
          ],
          hint: "Décompose le numérateur et le dénominateur en facteurs premiers.",
          solution: [`${a * k} = ${factorText(a * k)} et ${b * k} = ${factorText(b * k)}.`, `On simplifie par ${k} : ${frac(a, b)}.`],
          takeaway: "Une fraction est irréductible quand son numérateur et son dénominateur n'ont aucun diviseur commun autre que 1.",
        }),
        verify: () => gcd(a, b) === 1 && close(a / b, (a * k) / (b * k)),
      };
    },
  }),
  gen({
    id: "m3-ari-paquets", unit: U("arith"), title: "Faire des lots identiques (diviseur commun)", stage: "transfert",
    make: (r, id) => {
      let p = r.int(2, 9), q = r.int(2, 9);
      while (gcd(p, q) !== 1 || p === q) { p = r.int(2, 9); q = r.int(2, 9); }
      const g = r.int(4, 18);
      const A = p * g, B = q * g;
      return {
        activity: problem({
          id, stage: "transfert", competence: "chercher",
          context: `Un fleuriste a ${A} roses et ${B} tulipes. Il veut faire le plus grand nombre de bouquets identiques en utilisant toutes les fleurs.`,
          hint: "Le nombre de bouquets doit diviser à la fois le nombre de roses et le nombre de tulipes.",
          takeaway: "Le plus grand diviseur commun de deux nombres se lit sur leurs décompositions en facteurs premiers.",
          parts: [
            { prompt: "Combien de bouquets peut-il faire au maximum ?", expected: g, errors: [{ value: A + B, code: "somme", message: "Chaque bouquet contient plusieurs fleurs : cherche un diviseur commun." }], hint: `Cherche le plus grand nombre qui divise ${A} et ${B}.`, solution: [`${A} = ${factorText(A)} et ${B} = ${factorText(B)}.`, `Plus grand diviseur commun : ${g}.`], recap: `${g} bouquets`, review: "Diviseur commun" },
            { prompt: "Combien de roses dans chaque bouquet ?", expected: p, hint: `${A} ÷ ${g}.`, solution: [`${A} ÷ ${g} = ${p} roses.`], recap: `${p} roses par bouquet`, review: "Quotient" },
          ],
        }),
        verify: () => A % g === 0 && B % g === 0 && gcd(A / g, B / g) === 1 && gcd(A, B) === g,
      };
    },
  }),

  /* ——— Calcul littéral ——— */
  gen({
    id: "m3-lit-identites", unit: U("litteral"), title: "Développer avec une identité remarquable", stage: "application",
    make: (r, id) => {
      const a = r.int(1, 9), k = r.int(1, 4);
      const kind = r.int(0, 2);
      const kx = k === 1 ? "x" : `${k}x`;
      const expr = [`(${kx} + ${a})²`, `(${kx} − ${a})²`, `(${kx} + ${a})(${kx} − ${a})`][kind]!;
      const answer = [poly([[k * k, "x²"], [2 * k * a, "x"], [a * a, ""]]), poly([[k * k, "x²"], [-2 * k * a, "x"], [a * a, ""]]), poly([[k * k, "x²"], [-a * a, ""]])][kind]!;
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "calculer",
          prompt: `Développe : ${expr}`,
          answer: { text: answer, feedback: ["(a + b)² = a² + 2ab + b².", "(a − b)² = a² − 2ab + b².", "(a + b)(a − b) = a² − b²."][kind]! },
          wrong: [
            { text: poly([[k * k, "x²"], [kind === 2 ? a * a : kind === 1 ? -a * a : a * a, ""]]), feedback: kind === 2 ? "Le produit de (+b) par (−b) est négatif : − b²." : "Il manque le double produit 2ab." },
            { text: poly([[k * k, "x²"], [(kind === 1 ? -1 : 1) * k * a, "x"], [a * a, ""]]), feedback: "Le terme du milieu est le double produit : 2 × a × b." },
            ...(k > 1 ? [{ text: poly([[k, "x²"], [(kind === 1 ? -2 : 2) * k * a, "x"], [a * a, ""]]), feedback: `(${kx})² = ${k * k}x² : le coefficient est aussi élevé au carré.` }] : []),
            { text: poly([[k * k, "x²"], [(kind === 1 ? 2 : -2) * k * a, "x"], [(kind === 2 ? 1 : -1) * a * a, ""]]), feedback: "Vérifie les signes : redéveloppe terme à terme." },
          ],
          hint: "Reconnais la forme (a + b)², (a − b)² ou (a + b)(a − b).",
          solution: [`${expr} = ${answer}.`],
          takeaway: "(a + b)² = a² + 2ab + b² ; (a − b)² = a² − 2ab + b² ; (a + b)(a − b) = a² − b².",
        }),
        verify: () => sameExpression(expr, answer),
      };
    },
  }),
  gen({
    id: "m3-lit-factoriser", unit: U("litteral"), title: "Factoriser", stage: "application",
    make: (r, id) => {
      const kind = r.int(0, 1);
      if (kind === 0) {
        const k = r.int(2, 9), a = r.int(1, 9), b = r.nonZero(9);
        const expr = poly([[k * a, "x"], [k * b, ""]]);
        const answer = `${k}(${poly([[a, "x"], [b, ""]])})`;
        return {
          activity: mcq(r, {
            id, stage: "application", competence: "calculer",
            prompt: `Factorise : ${expr}`,
            answer: { text: answer, feedback: `${k} est un facteur commun aux deux termes.` },
            wrong: [
              { text: `${k}(${poly([[a, "x"], [k * b, ""]])})`, feedback: "Chaque terme doit être divisé par le facteur commun." },
              { text: `${k}x(${poly([[a, ""], [b, ""]]) === "0" ? "1" : `${a} ${b < 0 ? "−" : "+"} ${Math.abs(b)}`})`, feedback: "x n'est pas un facteur du terme constant." },
              { text: `${k * a}(x ${b < 0 ? "−" : "+"} ${Math.abs(k * b)})`, feedback: "Redéveloppe pour vérifier : le second terme ne redonne pas l'expression de départ." },
            ],
            hint: "Cherche le plus grand nombre qui divise les deux coefficients.",
            solution: [`${expr} = ${k} × ${poly([[a, "x"]])} ${b < 0 ? "−" : "+"} ${k} × ${Math.abs(b)} = ${answer}.`],
            takeaway: "Factoriser, c'est transformer une somme en produit : ka + kb = k(a + b).",
          }),
          verify: () => sameExpression(expr, answer),
        };
      }
      const k = r.int(1, 3), a = r.int(1, 9);
      const kx = k === 1 ? "x" : `${k}x`;
      const expr = poly([[k * k, "x²"], [-a * a, ""]]);
      const answer = `(${kx} − ${a})(${kx} + ${a})`;
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "calculer",
          prompt: `Factorise : ${expr}`,
          answer: { text: answer, feedback: `C'est une différence de deux carrés : (${kx})² − ${a}².` },
          wrong: [
            { text: `(${kx} − ${a})²`, feedback: `(${kx} − ${a})² donne aussi un terme en x : redéveloppe pour vérifier.` },
            { text: `(${kx} + ${a})²`, feedback: "Un carré d'une somme donne + 2ab et + b² : redéveloppe pour vérifier." },
            { text: `(${kx} − ${a * a})(${kx} + ${a * a})`, feedback: `${a * a} = ${a}² : c'est ${a} qu'il faut dans les parenthèses.` },
          ],
          hint: "Reconnais a² − b².",
          solution: [`${expr} = (${kx})² − ${a}² = ${answer}.`],
          takeaway: "a² − b² = (a − b)(a + b).",
        }),
        verify: () => sameExpression(expr, answer),
      };
    },
  }),
  gen({
    id: "m3-lit-produit-nul", unit: U("litteral"), title: "Équation produit nul", stage: "transfert",
    make: (r, id) => {
      const a = r.nonZero(9);
      let b = r.nonZero(9);
      if (b === a) b = -b === a ? b + 1 : -b;
      const eq = `(x ${a < 0 ? "+" : "−"} ${Math.abs(a)})(x ${b < 0 ? "+" : "−"} ${Math.abs(b)}) = 0`;
      const show = (u: number, v: number) => `x = ${fr(Math.min(u, v))} ou x = ${fr(Math.max(u, v))}`;
      return {
        activity: mcq(r, {
          id, stage: "transfert", competence: "raisonner",
          prompt: `Résous : ${eq}`,
          answer: { text: show(a, b), feedback: "Un produit est nul si l'un de ses facteurs est nul." },
          wrong: [
            { text: show(-a, -b), feedback: `x ${a < 0 ? "+" : "−"} ${Math.abs(a)} = 0 donne x = ${fr(a)} : attention au signe.` },
            { text: `x = ${fr(a * b)}`, feedback: "On n'a pas de produit à calculer : chaque facteur peut s'annuler." },
            { text: show(a, -b), feedback: "Vérifie le second facteur." },
          ],
          hint: "Un produit de facteurs est nul si et seulement si l'un des facteurs est nul.",
          solution: [`x ${a < 0 ? "+" : "−"} ${Math.abs(a)} = 0 ou x ${b < 0 ? "+" : "−"} ${Math.abs(b)} = 0.`, `${show(a, b)}.`],
          takeaway: "A × B = 0 équivaut à A = 0 ou B = 0.",
        }),
        verify: () => evaluate(eq.replace(" = 0", ""), { x: a }) === 0 && evaluate(eq.replace(" = 0", ""), { x: b }) === 0,
      };
    },
  }),

  /* ——— Fonctions ——— */
  gen({
    id: "m3-fon-image", unit: U("fonctions"), title: "Calculer une image", stage: "application",
    make: (r, id) => {
      const a = r.nonZero(4), b = r.int(-6, 6), c = r.int(-9, 9), x = r.int(-5, 5);
      const f = poly([[a, "x²"], [b, "x"], [c, ""]]);
      const value = a * x * x + b * x + c;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `On considère la fonction f définie par f(x) = ${f}.`,
          prompt: `Calcule f(${fr(x)}).`,
          expected: value,
          errors: [{ value: -a * x * x + b * x + c, code: "carre", message: `${par(x)}² = ${x * x} : le carré d'un nombre négatif est positif.`, type: "calcul" }],
          hint: `Remplace x par ${par(x)} partout, avec des parenthèses.`,
          solution: [`f(${fr(x)}) = ${fr(a)} × ${par(x)}² ${b < 0 ? "−" : "+"} ${fr(Math.abs(b))} × ${par(x)} ${c < 0 ? "−" : "+"} ${fr(Math.abs(c))}`, `= ${fr(value)}`],
          recap: `f(${fr(x)}) = ${fr(value)}`,
          review: "Calculer une image",
          takeaway: "Calculer l'image de a par f, c'est remplacer x par a dans l'expression de f(x).",
        }),
        verify: () => evaluate(f, { x }) === value,
      };
    },
  }),
  gen({
    id: "m3-fon-tableau", unit: U("fonctions"), title: "Lire image et antécédent dans un tableau", stage: "rappel",
    make: (r, id) => {
      const xs = [-2, -1, 0, 1, 2, 3];
      const a = r.int(1, 3), b = r.int(-4, 4);
      const ys = xs.map((x) => a * x * x + b);
      const i = r.int(0, 5);
      const askImage = r.chance(0.5);
      const target = askImage ? xs[i]! : ys[i]!;
      const ants = xs.filter((_, j) => ys[j] === target);
      const answer = askImage ? fr(ys[i]!) : ants.map(fr).join(" et ");
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "representer",
          stimulus: mockTable("Tableau de valeurs de f", ["x", ...xs.map((x) => fr(x))], [["f(x)", ...ys.map((y) => fr(y))]]),
          prompt: askImage ? `D'après le tableau, quelle est l'image de ${fr(target)} par f ?` : `D'après le tableau, quel(s) antécédent(s) de ${fr(target)} par f lit-on ?`,
          answer: { text: answer, feedback: askImage ? "L'image se lit sur la seconde ligne, sous x." : "Les antécédents se lisent sur la première ligne, au-dessus de la valeur." },
          wrong: askImage
            ? [
              ...xs.filter((x, j) => ys[j] === target && x !== target).map((x) => ({ text: fr(x), feedback: "Ça, c'est un antécédent de " + fr(target) + " : l'image se lit sur la ligne f(x)." })),
              { text: fr(ys[(i + 1) % 6]!), feedback: "C'est l'image d'une autre valeur : relis la colonne de " + fr(target) + "." },
              { text: fr(ys[i]! + 1), feedback: "Relis la bonne case du tableau." },
              { text: fr(ys[(i + 2) % 6]!), feedback: "C'est l'image d'une autre valeur : relis la bonne colonne." },
              { text: fr(ys[i]! - 1), feedback: "Relis la bonne case du tableau." },
            ]
            : [
              ...(ants.length > 1 ? [{ text: fr(ants[0]!), feedback: "C'est un antécédent, mais il y en a un autre dans le tableau." }, { text: fr(ants[1]!), feedback: "C'est un antécédent, mais il y en a un autre dans le tableau." }] : []),
              ...(xs.includes(target) ? [{ text: fr(ys[xs.indexOf(target)]!), feedback: `Ça, c'est l'image de ${fr(target)}, pas un antécédent.` }] : []),
              { text: fr(xs[(xs.indexOf(ants[0]!) + 1) % 6]!), feedback: "Relis la colonne où apparaît " + fr(target) + "." },
              { text: fr(target), feedback: "On cherche x tel que f(x) = " + fr(target) + " : la réponse se lit sur la première ligne." },
              { text: fr(ants[0]! + 1), feedback: "Relis la colonne où apparaît " + fr(target) + "." },
              { text: fr(ants[0]! - 1), feedback: "Relis la colonne où apparaît " + fr(target) + "." },
            ],
          hint: "Image : on part de x (ligne du haut). Antécédent : on part de f(x) (ligne du bas).",
          solution: [askImage ? `f(${fr(target)}) = ${fr(ys[i]!)}.` : `f(x) = ${fr(target)} pour x = ${ants.map(fr).join(" et x = ")}.`],
          takeaway: "f(a) = b : b est l'image de a, a est un antécédent de b.",
        }),
        verify: () => (askImage ? ys[xs.indexOf(target)] === ys[i] : ants.every((x) => a * x * x + b === target) && ants.length >= 1),
      };
    },
  }),

  /* ——— Fonctions affines ——— */
  gen({
    id: "m3-aff-coefficient", unit: U("affines"), title: "Coefficient directeur à partir de deux points", stage: "application",
    make: (r, id) => {
      const a = r.nonZero(6), b = r.int(-8, 8), x1 = r.int(-4, 2), x2 = x1 + r.int(1, 5);
      const y1 = a * x1 + b, y2 = a * x2 + b;
      return {
        activity: problem({
          id, stage: "application", competence: "calculer",
          context: `La fonction affine f vérifie f(${fr(x1)}) = ${fr(y1)} et f(${fr(x2)}) = ${fr(y2)}.`,
          hint: "a = (f(x₂) − f(x₁)) ÷ (x₂ − x₁).",
          takeaway: "Pour une fonction affine, l'accroissement de f(x) est proportionnel à celui de x : a = Δy ÷ Δx.",
          parts: [
            { prompt: "Quel est son coefficient directeur a ?", expected: a, errors: [{ value: (x2 - x1) / (y2 - y1), code: "inverse", message: "C'est Δy ÷ Δx, pas l'inverse.", type: "procedurale" }], hint: `(${fr(y2)} − ${par(y1)}) ÷ (${fr(x2)} − ${par(x1)}).`, solution: [`a = (${fr(y2)} − ${par(y1)}) ÷ (${fr(x2)} − ${par(x1)}) = ${fr(y2 - y1)} ÷ ${x2 - x1} = ${fr(a)}.`], recap: `a = ${fr(a)}`, review: "Coefficient directeur" },
            { prompt: "Quelle est son ordonnée à l'origine b ?", expected: b, hint: `f(${fr(x1)}) = a × ${par(x1)} + b.`, solution: [`${fr(y1)} = ${fr(a)} × ${par(x1)} + b, donc b = ${fr(y1)} − ${par(a * x1)} = ${fr(b)}.`], recap: `b = ${fr(b)}`, review: "Ordonnée à l'origine" },
          ],
        }),
        verify: () => a * (x2 - x1) === y2 - y1 && a * x1 + b === y1,
      };
    },
  }),
  gen({
    id: "m3-aff-lineaire", unit: U("affines"), title: "Reconnaître une fonction linéaire ou affine", stage: "rappel",
    make: (r, id) => {
      const a = r.int(2, 9), b = r.int(1, 9);
      const kind = r.int(0, 1);
      const linear = `f(x) = ${a}x`, affine = `f(x) = ${a}x + ${b}`;
      const others = [`f(x) = ${a}x²`, `f(x) = ${a}/x`, `f(x) = x² + ${b}`];
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "communiquer",
          prompt: kind === 0 ? "Laquelle de ces fonctions est linéaire ?" : "Laquelle de ces fonctions est affine mais pas linéaire ?",
          answer: { text: kind === 0 ? linear : affine, feedback: kind === 0 ? "Linéaire : f(x) = ax, sa représentation passe par l'origine." : "Affine : f(x) = ax + b, avec ici b ≠ 0." },
          wrong: [
            { text: kind === 0 ? affine : linear, feedback: kind === 0 ? `Elle est affine (b = ${b}), mais pas linéaire : b n'est pas nul.` : "Elle est linéaire (b = 0), donc aussi affine : la question demande b ≠ 0." },
            { text: others[0]!, feedback: "x est au carré : ce n'est pas une fonction affine." },
            { text: others[1]!, feedback: "x est au dénominateur : ce n'est pas une fonction affine." },
          ],
          hint: "Une fonction affine s'écrit ax + b ; elle est linéaire si b = 0.",
          solution: [kind === 0 ? `${linear} est de la forme ax avec a = ${a}.` : `${affine} est de la forme ax + b avec b = ${b} ≠ 0.`],
          takeaway: "Linéaire : f(x) = ax (proportionnalité). Affine : f(x) = ax + b. Une fonction linéaire est un cas particulier de fonction affine.",
        }),
        verify: () => evaluate(linear.slice(7), { x: 0 }) === 0 && evaluate(affine.slice(7), { x: 0 }) === b,
      };
    },
  }),
  gen({
    id: "m3-aff-seuil", unit: U("affines"), title: "Comparer deux tarifs", stage: "transfert",
    make: (r, id) => {
      const c = r.int(6, 15), a = r.int(2, c - 2), fixed = r.int(3, 12) * 5;
      let n = 0;
      while (fixed + a * n >= c * n) n++;
      return {
        activity: ask({
          id, stage: "transfert", competence: "modeliser",
          context: `Une piscine propose deux tarifs : A, ${c} € l'entrée ; B, un abonnement de ${fixed} € puis ${a} € l'entrée.`,
          prompt: "À partir de combien d'entrées le tarif B devient-il strictement moins cher ?",
          expected: n,
          errors: [{ value: n - 1, code: "egalite", message: `Pour ${n - 1} entrées, B n'est pas encore strictement moins cher : vérifie.`, type: "procedurale" }],
          hint: `Écris le prix de chaque tarif pour x entrées, puis résous ${fixed} + ${a}x < ${c}x.`,
          solution: [`A : ${c}x ; B : ${fixed} + ${a}x.`, `${fixed} + ${a}x < ${c}x ⟺ ${fixed} < ${c - a}x ⟺ x > ${fr(round(fixed / (c - a), 2))}.`, `Le plus petit entier qui convient : ${n}.`],
          recap: `À partir de ${n} entrées`,
          review: "Comparer deux fonctions affines",
          takeaway: "Pour comparer deux tarifs, on écrit deux fonctions et on résout une inéquation, puis on interprète avec des entiers.",
        }),
        verify: () => fixed + a * n < c * n && !(fixed + a * (n - 1) < c * (n - 1)),
      };
    },
  }),

  /* ——— Thalès ——— */
  gen({
    id: "m3-tha-longueur", unit: U("thales"), title: "Calculer une longueur avec Thalès", stage: "application",
    make: (r, id) => {
      const q = r.int(3, 8), p = r.int(1, q - 1), unit = r.int(1, 4);
      const AB = q * unit * 2, AM = p * unit * 2, BC = q * r.int(2, 6);
      const MN = (BC * AM) / AB;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Dans le triangle ABC, M est sur [AB] et N sur [AC], avec (MN) parallèle à (BC). AM = ${AM} cm, AB = ${AB} cm et BC = ${BC} cm.`,
          prompt: "Calcule MN (en cm).",
          expected: MN,
          errors: [{ value: (BC * AB) / AM, code: "inverse", message: "Les rapports s'écrivent dans le même ordre : AM/AB = MN/BC, petit triangle en haut.", type: "procedurale" }],
          hint: "D'après le théorème de Thalès : AM/AB = AN/AC = MN/BC.",
          solution: [`AM/AB = MN/BC, donc MN = BC × AM ÷ AB.`, `MN = ${BC} × ${AM} ÷ ${AB} = ${fr(MN)} cm.`],
          recap: `MN = ${fr(MN)} cm`,
          review: "Théorème de Thalès",
          takeaway: "Thalès : si (MN) // (BC), alors AM/AB = AN/AC = MN/BC.",
        }),
        verify: () => close(MN / BC, AM / AB),
      };
    },
  }),
  gen({
    id: "m3-tha-reciproque", unit: U("thales"), title: "Prouver que deux droites sont parallèles", stage: "transfert",
    make: (r, id) => {
      const AB = r.int(6, 15), AC = r.int(6, 15);
      const k = r.pick([0.25, 0.4, 0.5, 0.6, 0.75]);
      const par_ = r.chance(0.5);
      const AM = round(AB * k, 2), AN = par_ ? round(AC * k, 2) : round(AC * k + 0.5, 2);
      const r1 = AM / AB, r2 = AN / AC;
      return {
        activity: mcq(r, {
          id, stage: "transfert", competence: "raisonner",
          prompt: `A, M, B sont alignés dans cet ordre, ainsi que A, N, C. AM = ${fr(AM)}, AB = ${AB}, AN = ${fr(AN)}, AC = ${AC} (en cm). Les droites (MN) et (BC) sont-elles parallèles ?`,
          answer: par_ ? { text: "Oui, car AM/AB = AN/AC", feedback: `AM/AB = ${fr(round(r1, 4))} et AN/AC = ${fr(round(r2, 4))} : d'après la réciproque du théorème de Thalès, elles sont parallèles.` } : { text: "Non, car AM/AB ≠ AN/AC", feedback: `AM/AB = ${fr(round(r1, 4))} mais AN/AC ≈ ${fr(round(r2, 4))} : si elles étaient parallèles, ces rapports seraient égaux.` },
          wrong: [
            par_ ? { text: "Non, car AM/AB ≠ AN/AC", feedback: "Calcule les deux rapports : ils sont égaux." } : { text: "Oui, car AM/AB = AN/AC", feedback: "Calcule les deux rapports : ils sont différents." },
            { text: "Oui, car M et N sont sur les côtés", feedback: "Cela ne suffit pas : il faut comparer les rapports." },
            { text: "On ne peut pas savoir sans mesurer les angles", feedback: "La comparaison des rapports suffit (réciproque ou contraposée de Thalès)." },
          ],
          hint: "Calcule AM/AB et AN/AC, puis compare.",
          solution: [`AM/AB = ${fr(AM)}/${AB} ≈ ${fr(round(r1, 4))} ; AN/AC = ${fr(AN)}/${AC} ≈ ${fr(round(r2, 4))}.`, par_ ? "Égaux, et les points sont dans le même ordre : (MN) // (BC)." : "Différents : (MN) et (BC) ne sont pas parallèles."],
          takeaway: "Réciproque de Thalès : si AM/AB = AN/AC et que les points sont alignés dans le même ordre, alors (MN) // (BC).",
        }),
        verify: () => close(r1, r2) === par_,
      };
    },
  }),
  gen({
    id: "m3-tha-agrandissement", unit: U("thales"), title: "Agrandissement et réduction", stage: "application",
    make: (r, id) => {
      const k = r.pick([2, 3, 0.5, 1.5, 4, 0.2]);
      const area = r.int(2, 30) * 4;
      const vol = r.int(2, 20) * 8;
      const which = r.int(0, 1);
      const res = which === 0 ? area * k * k : vol * k ** 3;
      return {
        activity: ask({
          id, stage: "application", competence: "raisonner",
          context: which === 0 ? `Une figure d'aire ${area} cm² est ${k > 1 ? "agrandie" : "réduite"} à l'échelle k = ${fr(k)}.` : `Un solide de volume ${vol} cm³ est ${k > 1 ? "agrandi" : "réduit"} à l'échelle k = ${fr(k)}.`,
          prompt: which === 0 ? "Quelle est l'aire de la nouvelle figure (en cm²) ?" : "Quel est le volume du nouveau solide (en cm³) ?",
          expected: round(res, 4),
          errors: [{ value: round((which === 0 ? area : vol) * k, 4), code: "lineaire", message: which === 0 ? "Les longueurs sont multipliées par k, les aires par k²." : "Les longueurs sont multipliées par k, les volumes par k³.", type: "conceptuelle" }],
          hint: which === 0 ? "Les aires sont multipliées par k²." : "Les volumes sont multipliés par k³.",
          solution: [which === 0 ? `${area} × ${fr(k)}² = ${area} × ${fr(k * k)} = ${fr(round(res, 4))} cm².` : `${vol} × ${fr(k)}³ = ${vol} × ${fr(k ** 3)} = ${fr(round(res, 4))} cm³.`],
          recap: fr(round(res, 4)),
          review: "Effet d'un agrandissement",
          takeaway: "Dans un agrandissement ou une réduction de rapport k : longueurs × k, aires × k², volumes × k³.",
        }),
        verify: () => close(res, which === 0 ? area * k * k : vol * k * k * k),
      };
    },
  }),

  /* ——— Statistiques ——— */
  gen({
    id: "m3-sta-indicateurs", unit: U("stats"), title: "Moyenne, médiane et étendue", stage: "application",
    make: (r, id) => {
      const n = r.pick([7, 9, 11]);
      const vals = Array.from({ length: n }, () => r.int(5, 40));
      const sorted = [...vals].sort((a, b) => a - b);
      const med = sorted[(n - 1) / 2]!;
      const range = sorted[n - 1]! - sorted[0]!;
      const sum = vals.reduce((a, b) => a + b, 0);
      return {
        activity: problem({
          id, stage: "application", competence: "calculer",
          context: `Températures maximales (en °C) relevées pendant ${n} jours : ${vals.join(" ; ")}.`,
          hint: "Range d'abord les valeurs dans l'ordre croissant.",
          takeaway: "La médiane partage la série en deux moitiés ; l'étendue mesure la dispersion (max − min).",
          parts: [
            { prompt: "Quelle est l'étendue de la série ?", expected: range, errors: [{ value: sorted[n - 1]!, code: "max", message: "L'étendue est la différence entre la plus grande et la plus petite valeur." }], hint: "Étendue = valeur maximale − valeur minimale.", solution: [`${sorted[n - 1]} − ${sorted[0]} = ${range}.`], recap: `Étendue : ${range}`, review: "Étendue" },
            { prompt: "Quelle est la médiane ?", expected: med, errors: [{ value: vals[(n - 1) / 2]!, code: "non_trie", message: "La médiane se lit dans la série rangée." }], hint: `Il y a ${n} valeurs : la médiane est la ${(n + 1) / 2}e.`, solution: [`Série rangée : ${sorted.join(" ; ")}.`, `Médiane : ${med}.`], recap: `Médiane : ${med}`, review: "Médiane" },
            { prompt: "Quelle est la moyenne, arrondie au dixième ?", expected: round(sum / n, 1), tolerance: { abs: 0.051 }, hint: "Somme des valeurs ÷ nombre de valeurs.", solution: [`${sum} ÷ ${n} ≈ ${fr(round(sum / n, 1))}.`], recap: `Moyenne ≈ ${fr(round(sum / n, 1))}`, review: "Moyenne" },
          ],
        }),
        verify: () => sorted.filter((v) => v <= med).length >= (n + 1) / 2 && sorted.filter((v) => v >= med).length >= (n + 1) / 2 && close(evaluate(vals.join(" + ")), sum),
      };
    },
  }),

  /* ——— Trigonométrie ——— */
  gen({
    id: "m3-tri-choisir", unit: U("trigo"), title: "Choisir le bon rapport trigonométrique", stage: "rappel",
    make: (r, id) => {
      const RATIOS: Record<string, [string, string, string]> = {
        cosinus: ["adjacent", "hypoténuse", "Le cosinus"],
        sinus: ["opposé", "hypoténuse", "Le sinus"],
        tangente: ["opposé", "adjacent", "La tangente"],
      };
      const names = Object.keys(RATIOS);
      const name = r.pick(names);
      const [p, q, label] = RATIOS[name]!;
      const side = (s: string) => (s === "hypoténuse" ? "l'hypoténuse" : `le côté ${s} à l'angle Â`);
      const [known, want] = r.chance(0.5) ? [side(p), side(q)] : [side(q), side(p)];
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "raisonner",
          prompt: `Dans un triangle rectangle, on connaît l'angle Â et ${known}. On cherche ${want}. Quel rapport utiliser ?`,
          answer: { text: label, feedback: `${label} de Â = ${p} ÷ ${q} : il relie exactement ces deux côtés.` },
          wrong: [
            ...names.filter((n) => n !== name).map((n) => ({ text: RATIOS[n]![2], feedback: `${RATIOS[n]![2]} = ${RATIOS[n]![0]} ÷ ${RATIOS[n]![1]} : ce rapport ne relie pas les deux côtés en jeu.` })),
            { text: "Le théorème de Pythagore", feedback: "Pythagore relie les trois côtés, sans utiliser d'angle." },
          ],
          hint: "Moyen mnémotechnique : SOH CAH TOA.",
          solution: [`On relie ${known} et ${want} : ${label.toLowerCase()}, qui vaut ${p} ÷ ${q}.`],
          takeaway: "cos = adjacent/hypoténuse ; sin = opposé/hypoténuse ; tan = opposé/adjacent (SOH CAH TOA).",
        }),
        verify: () => names.filter((n) => new Set(RATIOS[n]!.slice(0, 2)).size === 2 && [known, want].every((s) => RATIOS[n]!.slice(0, 2).some((w) => s.includes(w)))).length === 1,
      };
    },
  }),
  gen({
    id: "m3-tri-longueur", unit: U("trigo"), title: "Calculer une longueur avec le cosinus ou le sinus", stage: "application",
    make: (r, id) => {
      const angle = r.int(15, 75), hyp = r.int(4, 20);
      const useCos = r.chance(0.5);
      const side = hyp * (useCos ? Math.cos(deg(angle)) : Math.sin(deg(angle)));
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `ABC est rectangle en B, avec AC = ${hyp} cm et l'angle BÂC = ${angle}°.`,
          prompt: `Calcule ${useCos ? "AB" : "BC"} au dixième près (en cm).`,
          expected: round(side, 1),
          tolerance: { abs: 0.051 },
          errors: [{ value: round(hyp * (useCos ? Math.sin(deg(angle)) : Math.cos(deg(angle))), 1), code: "rapport", message: useCos ? "AB est adjacent à l'angle Â : c'est le cosinus." : "BC est opposé à l'angle Â : c'est le sinus.", type: "procedurale" }, { value: round(hyp / (useCos ? Math.cos(deg(angle)) : Math.sin(deg(angle))), 1), code: "division", message: "On multiplie l'hypoténuse par le rapport, on ne divise pas.", type: "procedurale" }],
          hint: useCos ? "AB est le côté adjacent à Â : cos Â = AB ÷ AC." : "BC est le côté opposé à Â : sin Â = BC ÷ AC.",
          solution: [useCos ? `cos ${angle}° = AB ÷ ${hyp}, donc AB = ${hyp} × cos ${angle}° ≈ ${fr(round(side, 1))} cm.` : `sin ${angle}° = BC ÷ ${hyp}, donc BC = ${hyp} × sin ${angle}° ≈ ${fr(round(side, 1))} cm.`],
          recap: `${useCos ? "AB" : "BC"} ≈ ${fr(round(side, 1))} cm`,
          review: "Calculer une longueur en trigonométrie",
          takeaway: "Côté = hypoténuse × cos (côté adjacent) ou × sin (côté opposé).",
        }),
        verify: () => {
          const other = hyp * (useCos ? Math.sin(deg(angle)) : Math.cos(deg(angle)));
          return close(side * side + other * other, hyp * hyp);
        },
      };
    },
  }),
  gen({
    id: "m3-tri-angle", unit: U("trigo"), title: "Calculer un angle", stage: "transfert",
    make: (r, id) => {
      const adj = r.int(3, 12), opp = r.int(2, 12);
      const angle = (Math.atan(opp / adj) * 180) / Math.PI;
      return {
        activity: ask({
          id, stage: "transfert", competence: "calculer",
          context: `Une rampe d'accès monte de ${opp} dm pour une avancée horizontale de ${adj} dm.`,
          prompt: "Quel angle fait-elle avec le sol ? Arrondis au degré.",
          expected: Math.round(angle),
          tolerance: { abs: 0.5 },
          errors: [{ value: Math.round((Math.atan(adj / opp) * 180) / Math.PI), code: "inverse", message: "tan = côté opposé ÷ côté adjacent : la hauteur est opposée à l'angle au sol." }],
          hint: "Tu connais le côté opposé et le côté adjacent à l'angle : utilise la tangente.",
          solution: [`tan(angle) = ${opp} ÷ ${adj}.`, `angle = arctan(${opp} ÷ ${adj}) ≈ ${Math.round(angle)}°.`],
          recap: `≈ ${Math.round(angle)}°`,
          review: "Calculer un angle",
          takeaway: "Pour trouver un angle, on calcule le rapport puis on utilise arccos, arcsin ou arctan à la calculatrice.",
        }),
        verify: () => close(Math.tan(deg(angle)), opp / adj),
      };
    },
  }),

  /* ——— Probabilités ——— */
  gen({
    id: "m3-pro-deux-epreuves", unit: U("proba"), title: "Expérience à deux épreuves", stage: "application",
    make: (r, id) => {
      const red = r.int(1, 6), blue = r.int(1, 6);
      const n = red + blue;
      const kind = r.int(0, 1);
      const outcomes: [string, string][] = [];
      const urn = [...Array(red).fill("R"), ...Array(blue).fill("B")] as string[];
      for (const a of urn) for (const b of urn) outcomes.push([a, b]);
      const fav = outcomes.filter(([a, b]) => (kind === 0 ? a === "R" && b === "R" : a !== b)).length;
      const p = fav / outcomes.length;
      return {
        activity: ask({
          id, stage: "application", competence: "modeliser",
          context: `Une urne contient ${red} boule${red > 1 ? "s" : ""} rouge${red > 1 ? "s" : ""} et ${blue} bleue${blue > 1 ? "s" : ""}. On tire une boule, on note sa couleur, on la remet, puis on en tire une seconde.`,
          prompt: kind === 0 ? "Quelle est la probabilité d'obtenir deux boules rouges ? (fraction)" : "Quelle est la probabilité d'obtenir deux boules de couleurs différentes ? (fraction)",
          expected: p,
          tolerance: { rel: 1e-5 },
          errors: [{ value: kind === 0 ? (2 * red) / n : red / n + blue / n, code: "addition", message: "Sur un chemin de l'arbre, on multiplie les probabilités ; on additionne les chemins.", type: "conceptuelle" }],
          hint: "Dessine un arbre : on multiplie le long d'un chemin, on additionne les chemins.",
          solution: kind === 0 ? [`p(R puis R) = ${red}/${n} × ${red}/${n} = ${red * red}/${n * n}.`] : [`p(R puis B) + p(B puis R) = ${red}/${n} × ${blue}/${n} + ${blue}/${n} × ${red}/${n} = ${2 * red * blue}/${n * n}.`],
          recap: kind === 0 ? `${red * red}/${n * n}` : `${2 * red * blue}/${n * n}`,
          review: "Arbre de probabilités",
          takeaway: "Dans un arbre, la probabilité d'un chemin est le produit des probabilités de ses branches.",
        }),
        verify: () => close(p, kind === 0 ? (red / n) ** 2 : (2 * red * blue) / (n * n)),
      };
    },
  }),

  /* ——— Transformations ——— */
  gen({
    id: "m3-tra-homothetie", unit: U("transfo"), title: "Homothétie : longueurs et aires", stage: "application",
    make: (r, id) => {
      const k = r.pick([-3, -2, -0.5, 0.5, 2, 3, 1.5]);
      const L = r.int(2, 12), A = r.int(2, 20) * 4;
      return {
        activity: problem({
          id, stage: "application", competence: "raisonner",
          context: `Une figure F a un côté de ${L} cm et une aire de ${A} cm². On lui applique une homothétie de rapport ${fr(k)}.`,
          hint: "Une homothétie de rapport k multiplie les longueurs par |k|.",
          takeaway: "Homothétie de rapport k : longueurs × |k|, aires × k² ; si k < 0, la figure est aussi retournée (symétrie centrale).",
          parts: [
            { prompt: "Longueur du côté image (cm) ?", expected: Math.abs(k) * L, errors: [{ value: k * L, code: "negatif", message: "Une longueur est toujours positive : on multiplie par |k|." }], hint: `${L} × |${fr(k)}|.`, solution: [`${L} × ${fr(Math.abs(k))} = ${fr(Math.abs(k) * L)} cm.`], recap: `${fr(Math.abs(k) * L)} cm`, review: "Longueur image" },
            { prompt: "Aire de la figure image (cm²) ?", expected: k * k * A, errors: [{ value: Math.abs(k) * A, code: "lineaire", message: "Les aires sont multipliées par k², pas par k." }], hint: `${A} × ${fr(k)}².`, solution: [`${A} × ${fr(k * k)} = ${fr(k * k * A)} cm².`], recap: `${fr(k * k * A)} cm²`, review: "Aire image" },
          ],
        }),
        verify: () => close((k * k * A) / (Math.abs(k) * L) ** 2, A / (L * L)),
      };
    },
  }),
  gen({
    id: "m3-tra-reconnaitre", unit: U("transfo"), title: "Reconnaître une transformation", stage: "rappel",
    make: (r, id) => {
      const items: [string, string][] = [
        ["Elle fait glisser toute la figure dans une même direction, d'une même longueur.", "Une translation"],
        ["Elle fait tourner la figure autour d'un point, d'un angle donné.", "Une rotation"],
        ["Elle retourne la figure comme un pliage le long d'une droite.", "Une symétrie axiale"],
        ["Elle agrandit ou réduit la figure à partir d'un centre, sans changer ses angles.", "Une homothétie"],
      ];
      const i = r.int(0, 3);
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "communiquer",
          prompt: `Quelle transformation est décrite ? « ${items[i]![0]} »`,
          answer: { text: items[i]![1], feedback: `${items[i]![1]} : ${items[i]![0].charAt(0).toLowerCase()}${items[i]![0].slice(1)}` },
          wrong: items.filter((_, j) => j !== i).map(([d, n]) => ({ text: n, feedback: `${n} : ${d.charAt(0).toLowerCase()}${d.slice(1)}` })),
          hint: "Demande-toi si la figure garde ses dimensions, et comment elle bouge.",
          solution: [`${items[i]![1]}.`],
          takeaway: "Translation, rotation et symétries conservent les longueurs ; l'homothétie les multiplie par |k|.",
        }),
        verify: () => items.filter(([, n]) => n === items[i]![1]).length === 1,
      };
    },
  }),

  /* ——— Espace ——— */
  gen({
    id: "m3-esp-boule", unit: U("espace"), title: "Volume d'une boule, aire d'une sphère", stage: "application",
    make: (r, id) => {
      const radius = r.int(1, 12);
      const vol = r.chance(0.5);
      const v = vol ? (4 / 3) * Math.PI * radius ** 3 : 4 * Math.PI * radius ** 2;
      return {
        activity: ask({
          id, stage: "application", competence: "calculer",
          context: `Une boule a un rayon de ${radius} cm.`,
          prompt: vol ? "Donne son volume en cm³, arrondi à l'unité." : "Donne l'aire de sa sphère en cm², arrondie à l'unité.",
          expected: Math.round(v),
          tolerance: { abs: 0.51 },
          errors: [{ value: Math.round(vol ? 4 * Math.PI * radius ** 2 : (4 / 3) * Math.PI * radius ** 3), code: "formule", message: vol ? "4πr² est l'aire de la sphère ; le volume de la boule est 4/3 × π × r³." : "4/3 πr³ est le volume ; l'aire de la sphère est 4πr².", type: "conceptuelle" }],
          hint: vol ? "V = 4/3 × π × r³." : "A = 4 × π × r².",
          solution: [vol ? `V = 4/3 × π × ${radius}³ ≈ ${Math.round(v)} cm³.` : `A = 4 × π × ${radius}² ≈ ${Math.round(v)} cm².`],
          recap: `≈ ${Math.round(v)}`,
          review: vol ? "Volume de la boule" : "Aire de la sphère",
          takeaway: "Sphère de rayon r : aire 4πr² ; boule : volume 4/3 πr³.",
        }),
        verify: () => close(v, vol ? evaluate(`4/3 × π × ${radius}³`) : evaluate(`4 × π × ${radius}²`)),
      };
    },
  }),
  gen({
    id: "m3-esp-section", unit: U("espace"), title: "Section d'un solide par un plan", stage: "rappel",
    make: (r, id) => {
      const items: [string, string, string][] = [
        ["un pavé droit coupé par un plan parallèle à une face", "Un rectangle", "La section est parallèle à une face rectangulaire : c'est un rectangle de mêmes dimensions que cette face."],
        ["une sphère coupée par un plan", "Un cercle", "Toute section plane d'une sphère est un cercle (un point si le plan est tangent)."],
        ["un cylindre coupé par un plan perpendiculaire à son axe", "Un disque", "La section reproduit la base : un disque de même rayon."],
        ["une pyramide coupée par un plan parallèle à sa base", "Une réduction de la base", "La section est un polygone de même forme que la base, réduit."],
        ["un cylindre coupé par un plan parallèle à son axe", "Un rectangle", "Un plan parallèle à l'axe coupe le cylindre selon un rectangle."],
      ];
      const i = r.int(0, items.length - 1);
      const choices = ["Un rectangle", "Un cercle", "Un disque", "Une réduction de la base", "Un triangle"];
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "representer",
          prompt: `Quelle est la section de ${items[i]![0]} ?`,
          answer: { text: items[i]![1], feedback: items[i]![2] },
          wrong: choices.filter((c) => c !== items[i]![1]).slice(0, 3).map((c) => ({ text: c, feedback: "Imagine le solide coupé et regarde la face obtenue." })),
          hint: "Imagine le solide en pâte à modeler, coupé d'un coup de couteau.",
          solution: [items[i]![2]],
          takeaway: "Pavé : sections rectangulaires ; cylindre : disque ou rectangle ; sphère : cercle ; pyramide et cône parallèles à la base : réductions de la base.",
        }),
        verify: () => choices.includes(items[i]![1]),
      };
    },
  }),

  /* ——— Algorithmique ——— */
  gen({
    id: "m3-alg-boucle", unit: U("algo"), title: "Prévoir le résultat d'une boucle", stage: "application",
    make: (r, id) => {
      const start = r.int(0, 5), n = r.int(3, 6), a = r.int(2, 3), b = r.int(1, 4);
      let x = start;
      for (let i = 0; i < n; i++) x = a * x + b;
      return {
        activity: ask({
          id, stage: "application", competence: "raisonner",
          stimulus: mockCode("Programme", [`x = ${start}`, `for i in range(${n}):`, `    x = ${a} * x + ${b}`, "print(x)"]),
          context: "Voici un programme écrit en Python.",
          prompt: "Quel nombre affiche-t-il ?",
          expected: x,
          errors: [{ value: a * start + b, code: "un_tour", message: `La boucle s'exécute ${n} fois, pas une seule.`, type: "procedurale" }],
          hint: "Fais un tableau : valeur de x après chaque tour de boucle.",
          solution: (() => {
            const lines: string[] = [];
            let v = start;
            for (let i = 1; i <= n; i++) { const w = a * v + b; lines.push(`Tour ${i} : x = ${a} × ${v} + ${b} = ${w}.`); v = w; }
            return lines;
          })(),
          recap: `Affiche ${x}`,
          review: "Boucle bornée",
          takeaway: "Pour suivre une boucle, on note la valeur des variables à la fin de chaque tour.",
        }),
        verify: () => {
          const closed = a === 1 ? start + n * b : a ** n * start + (b * (a ** n - 1)) / (a - 1);
          return close(closed, x);
        },
      };
    },
  }),
];
