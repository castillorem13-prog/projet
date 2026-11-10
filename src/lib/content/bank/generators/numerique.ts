import { ask, gen, mcq, mockCode, mockTable } from "../build";
import { close, fr, round, sup } from "../format";
import type { Rng } from "../rand";
import type { Generator } from "../types";

/**
 * Numérique : NSI, SNT, technologie, sciences de l'ingénieur.
 * Les programmes Python sont simulés ici pour la contre-épreuve, et exécutés par un vrai Python
 * avec `npm run bank:python` (scripts/verify-python.ts).
 */

const py = (lines: string[]) => mockCode("Programme Python", lines);
const pyList = (t: (number | string)[]) => `[${t.map((x) => (typeof x === "string" ? `"${x}"` : String(x))).join(", ")}]`;
const NAMES = ["Léa", "Noé", "Inès", "Hugo", "Jade", "Sami", "Lina", "Tom", "Maël", "Rose"];
const CITIES = ["Lyon", "Lille", "Nantes", "Brest", "Dijon"];

function students(r: Rng, n: number) {
  return r.sample(NAMES, n).map((nom) => ({ nom, age: r.int(14, 18), ville: r.pick(CITIES), note: r.int(6, 19) }));
}

export const NUMERIQUE: Generator[] = [
  /* ——— NSI : données ——— */
  gen({
    id: "nsi-binaire-dec", unit: "1re-nsi-donnees", title: "Du binaire au décimal", stage: "application",
    make: (r, id) => {
      const n = r.int(5, 255);
      const bin = n.toString(2);
      return {
        activity: ask({
          id, stage: "application", competence: "ns-algo",
          context: "Écriture des entiers en base 2.",
          prompt: `Quelle est l'écriture décimale du nombre binaire ${bin} ?`,
          expected: n,
          errors: [{ value: Number(bin), code: "lu", message: "Ce n'est pas un nombre décimal : chaque chiffre vaut une puissance de 2." }],
          hint: "De droite à gauche, les chiffres valent 1, 2, 4, 8, 16, 32, 64, 128.",
          solution: [`${bin} = ${bin.split("").map((b, i) => (b === "1" ? `2${sup(bin.length - 1 - i)}` : null)).filter(Boolean).join(" + ")} = ${n}.`],
          recap: `${bin} = ${n}`,
          review: "Base 2",
          takeaway: "En base 2, chaque chiffre (bit) vaut une puissance de 2 : 1, 2, 4, 8, 16…",
        }),
        verify: () => parseInt(bin, 2) === n,
      };
    },
  }),
  gen({
    id: "nsi-dec-binaire", unit: "1re-nsi-donnees", title: "Du décimal au binaire", stage: "application",
    make: (r, id) => {
      const n = r.int(9, 200);
      const bin = n.toString(2);
      const flip = (s: string, k: number) => s.slice(0, k) + (s[k] === "1" ? "0" : "1") + s.slice(k + 1);
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "ns-algo",
          prompt: `Quelle est l'écriture binaire de ${n} ?`,
          answer: { text: bin, feedback: `Divisions successives par 2 : les restes, lus de bas en haut, donnent ${bin}.` },
          wrong: [
            { text: bin.split("").reverse().join("").replace(/^0+/, "") || "0", feedback: "Les restes se lisent du dernier au premier." },
            { text: flip(bin, bin.length - 1), feedback: `Ce nombre vaut ${parseInt(flip(bin, bin.length - 1), 2)}.` },
            { text: flip(bin, 1), feedback: `Ce nombre vaut ${parseInt(flip(bin, 1), 2)}.` },
            { text: flip(bin, Math.min(2, bin.length - 1)), feedback: "Vérifie en recalculant la valeur décimale." },
          ],
          hint: "Cherche la plus grande puissance de 2 inférieure ou égale au nombre, puis recommence avec le reste.",
          solution: [`${n} = ${bin.split("").map((b, i) => (b === "1" ? 2 ** (bin.length - 1 - i) : null)).filter((x) => x !== null).join(" + ")}.`, `Donc ${n} s'écrit ${bin} en binaire.`],
          takeaway: "Pour écrire un entier en base 2, on le décompose en somme de puissances de 2 (ou on divise par 2 successivement).",
        }),
        verify: () => parseInt(bin, 2) === n,
      };
    },
  }),
  gen({
    id: "nsi-hexa", unit: "1re-nsi-donnees", title: "Hexadécimal", stage: "rappel",
    make: (r, id) => {
      const n = r.int(16, 255);
      const hex = n.toString(16).toUpperCase();
      return {
        activity: ask({
          id, stage: "rappel", competence: "ns-algo",
          context: "En hexadécimal, A = 10, B = 11, …, F = 15.",
          prompt: `Que vaut ${hex} (base 16) en décimal ?`,
          expected: n,
          hint: "Le chiffre de gauche vaut 16 fois sa valeur.",
          solution: [`${hex} = ${parseInt(hex[0]!, 16)} × 16 + ${parseInt(hex[1]!, 16)} = ${n}.`],
          recap: `${hex} = ${n}`,
          review: "Base 16",
          takeaway: "Un chiffre hexadécimal code 4 bits ; un octet s'écrit avec deux chiffres hexadécimaux (00 à FF).",
        }),
        verify: () => parseInt(hex, 16) === n,
      };
    },
  }),
  gen({
    id: "nsi-liste", unit: "1re-nsi-donnees", title: "Lire une liste Python", stage: "application",
    make: (r, id) => {
      const t = Array.from({ length: r.int(4, 7) }, () => r.int(1, 30));
      const i = r.int(0, t.length - 1);
      const kind = r.int(0, 2);
      const [line, value] = kind === 0 ? [`print(t[${i}] + t[-1])`, t[i]! + t[t.length - 1]!] : kind === 1 ? ["print(len(t) * 2)", t.length * 2] : [`print(t[${i}] * t[0])`, t[i]! * t[0]!];
      const code = [`t = ${pyList(t)}`, line];
      return {
        activity: ask({
          id, stage: "application", competence: "ns-programmer",
          stimulus: py(code),
          context: "Une liste Python est indexée à partir de 0 ; t[-1] est le dernier élément.",
          prompt: "Qu'affiche ce programme ?",
          expected: value,
          errors: kind !== 1 ? [{ value: kind === 0 ? (t[i + 1] ?? t[0]!) + t[t.length - 1]! : (t[i + 1] ?? t[0]!) * t[0]!, code: "index", message: "Les indices commencent à 0 : t[0] est le premier élément." }] : [],
          hint: "Repère les éléments utilisés en comptant à partir de 0.",
          solution: [kind === 0 ? `t[${i}] = ${t[i]} et t[-1] = ${t[t.length - 1]}, donc ${value}.` : kind === 1 ? `len(t) = ${t.length}, donc ${value}.` : `t[${i}] = ${t[i]} et t[0] = ${t[0]}, donc ${value}.`],
          recap: `Affiche ${value}`,
          review: "Listes Python",
          takeaway: "t[0] est le premier élément, t[-1] le dernier, len(t) le nombre d'éléments.",
        }),
        verify: () => value === (kind === 0 ? t[i]! + t[t.length - 1]! : kind === 1 ? t.length * 2 : t[i]! * t[0]!) && t.slice(-1)[0] === t[t.length - 1],
      };
    },
  }),
  gen({
    id: "nsi-dict", unit: "1re-nsi-donnees", title: "Lire un dictionnaire Python", stage: "application",
    make: (r, id) => {
      const keys = r.sample(["pommes", "poires", "kiwis", "prunes", "figues"], 3);
      const vals = keys.map(() => r.int(2, 20));
      const k = r.int(0, 2), j = (k + 1) % 3;
      const value = vals[k]! + vals[j]!;
      const code = [`stock = {${keys.map((key, i) => `"${key}": ${vals[i]}`).join(", ")}}`, `stock["${keys[k]}"] = stock["${keys[k]}"] + stock["${keys[j]}"]`, `print(stock["${keys[k]}"])`];
      return {
        activity: ask({
          id, stage: "application", competence: "ns-programmer",
          stimulus: py(code),
          context: "Un dictionnaire associe des clés à des valeurs.",
          prompt: "Qu'affiche ce programme ?",
          expected: value,
          errors: [{ value: vals[k]!, code: "ancien", message: "La deuxième ligne modifie la valeur associée à la clé avant l'affichage." }],
          hint: "Suis la valeur associée à la clé affichée, ligne après ligne.",
          solution: [`stock["${keys[k]}"] vaut ${vals[k]}, stock["${keys[j]}"] vaut ${vals[j]}.`, `Après la ligne 2 : ${value}.`],
          recap: `Affiche ${value}`,
          review: "Dictionnaires",
          takeaway: "d[cle] = valeur crée ou remplace l'entrée associée à cette clé.",
        }),
        verify: () => {
          const d: Record<string, number> = Object.fromEntries(keys.map((key, i) => [key, vals[i]!]));
          d[keys[k]!] = d[keys[k]!]! + d[keys[j]!]!;
          return d[keys[k]!] === value;
        },
      };
    },
  }),

  /* ——— NSI : programmation ——— */
  gen({
    id: "nsi-fonction", unit: "1re-nsi-programmation", title: "Suivre une fonction avec une condition", stage: "application",
    make: (r, id) => {
      const n = r.int(3, 40);
      const f = (x: number) => (x % 2 === 0 ? Math.floor(x / 2) : 3 * x + 1);
      const value = f(f(n));
      const code = ["def suivant(x):", "    if x % 2 == 0:", "        return x // 2", "    else:", "        return 3 * x + 1", "", `print(suivant(suivant(${n})))`];
      return {
        activity: ask({
          id, stage: "application", competence: "ns-programmer",
          stimulus: py(code),
          context: "x % 2 est le reste de la division de x par 2 ; x // 2 est le quotient entier.",
          prompt: "Qu'affiche ce programme ?",
          expected: value,
          errors: [{ value: f(n), code: "une_fois", message: "La fonction est appelée deux fois : on applique suivant au résultat du premier appel." }],
          hint: "Calcule d'abord suivant(" + n + "), puis applique de nouveau la fonction.",
          solution: [`suivant(${n}) = ${f(n)}.`, `suivant(${f(n)}) = ${value}.`],
          recap: `Affiche ${value}`,
          review: "Fonctions et conditions",
          takeaway: "Pour un appel imbriqué, on évalue d'abord l'appel le plus intérieur.",
        }),
        verify: () => value === f(f(n)),
      };
    },
  }),
  gen({
    id: "nsi-chaine", unit: "1re-nsi-programmation", title: "Manipuler une chaîne de caractères", stage: "rappel",
    make: (r, id) => {
      const w = r.pick(["python", "algorithme", "bonjour", "lycee", "variable", "boucle", "fonction"]);
      const kind = r.int(0, 1);
      const [line, value] = kind === 0 ? [`print(len(mot))`, w.length] : [`print(mot.count("${w[1]}"))`, w.split(w[1]!).length - 1];
      return {
        activity: ask({
          id, stage: "rappel", competence: "ns-programmer",
          stimulus: py([`mot = "${w}"`, line]),
          context: "Chaînes de caractères en Python.",
          prompt: "Qu'affiche ce programme ?",
          expected: value,
          hint: kind === 0 ? "len renvoie le nombre de caractères." : "count compte les apparitions d'un caractère.",
          solution: [kind === 0 ? `« ${w} » compte ${value} caractères.` : `« ${w[1]} » apparaît ${value} fois dans « ${w} ».`],
          recap: `Affiche ${value}`,
          review: "Chaînes de caractères",
          takeaway: "len(chaine) donne le nombre de caractères ; chaine.count(c) compte les apparitions de c.",
        }),
        verify: () => value === (kind === 0 ? [...w].length : [...w].filter((c) => c === w[1]).length),
      };
    },
  }),

  /* ——— NSI : algorithmique ——— */
  gen({
    id: "nsi-tri-selection", unit: "1re-nsi-algorithmique", title: "Une étape du tri par sélection", stage: "application",
    make: (r, id) => {
      const t = r.sample([3, 5, 7, 8, 11, 12, 15, 19, 21, 26], 6);
      const after = [...t];
      const m = after.indexOf(Math.min(...after));
      [after[0], after[m]] = [after[m]!, after[0]!];
      const show = (a: number[]) => `[${a.join(", ")}]`;
      const sorted = [...t].sort((a, b) => a - b);
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "ns-algo",
          prompt: `On applique le tri par sélection à ${show(t)}. Quelle est la liste après le premier tour (le plus petit élément est échangé avec le premier) ?`,
          answer: { text: show(after), feedback: `Le minimum ${Math.min(...t)} est échangé avec le premier élément ${t[0]}.` },
          wrong: [
            { text: show(sorted), feedback: "C'est la liste triée à la fin : un seul tour a été fait." },
            { text: show([Math.min(...t), ...t.filter((x) => x !== Math.min(...t))]), feedback: "Le tri par sélection échange deux éléments ; il ne décale pas toute la liste." },
            { text: show([...t].reverse()), feedback: "On ne renverse pas la liste." },
          ],
          hint: "Cherche le plus petit élément et échange-le avec celui d'indice 0.",
          solution: [`Minimum : ${Math.min(...t)} (indice ${m}).`, `Échange avec t[0] : ${show(after)}.`],
          takeaway: "Tri par sélection : à chaque tour, on place le minimum de la partie non triée à sa position définitive ; coût quadratique.",
        }),
        verify: () => after[0] === Math.min(...t) && [...after].sort((a, b) => a - b).join() === sorted.join(),
      };
    },
  }),
  gen({
    id: "nsi-dichotomie", unit: "1re-nsi-algorithmique", title: "Coût de la recherche dichotomique", stage: "transfert",
    make: (r, id) => {
      const n = r.pick([7, 15, 16, 31, 100, 127, 500, 1000, 1023, 1024]);
      const worst = Math.floor(Math.log2(n)) + 1;
      return {
        activity: ask({
          id, stage: "transfert", competence: "ns-algo",
          context: `On cherche une valeur dans une liste triée de ${fr(n)} éléments par dichotomie (on compare au milieu, puis on garde une moitié).`,
          prompt: "Au pire, combien de fois compare-t-on la valeur cherchée à l'élément du milieu ?",
          expected: worst,
          errors: [{ value: n, code: "lineaire", message: "C'est le coût d'une recherche séquentielle ; la dichotomie divise la liste par 2 à chaque étape." }],
          hint: "Combien de fois peut-on diviser la taille par 2 avant d'arriver à 1 ?",
          solution: [`2${sup(worst - 1)} = ${2 ** (worst - 1)} ≤ ${fr(n)} < ${2 ** worst} = 2${sup(worst)}.`, `Au pire ${worst} comparaisons.`],
          recap: `${worst} comparaisons`,
          review: "Dichotomie",
          takeaway: "La recherche dichotomique a un coût logarithmique : environ log₂(n) étapes.",
        }),
        verify: () => {
          const t = Array.from({ length: n }, (_, i) => i);
          let max = 0;
          for (let x = -1; x <= n; x++) {
            let lo = 0, hi = n - 1, c = 0;
            while (lo <= hi) {
              const mid = Math.floor((lo + hi) / 2);
              c++;
              if (t[mid] === x) break;
              if (t[mid]! < x) lo = mid + 1;
              else hi = mid - 1;
            }
            max = Math.max(max, c);
          }
          return max === worst;
        },
      };
    },
  }),
  gen({
    id: "nsi-glouton", unit: "1re-nsi-algorithmique", title: "Rendu de monnaie glouton", stage: "application",
    make: (r, id) => {
      const coins = [200, 100, 50, 20, 10, 5, 2, 1];
      const amount = r.int(13, 389);
      const used: number[] = [];
      let rest = amount;
      for (const c of coins) while (rest >= c) { used.push(c); rest -= c; }
      return {
        activity: ask({
          id, stage: "application", competence: "ns-algo",
          context: `On rend ${fr(amount)} centimes avec les pièces et billets européens (200, 100, 50, 20, 10, 5, 2 et 1 centimes), en prenant toujours la plus grande valeur possible.`,
          prompt: "Combien de pièces et billets rend-on ?",
          expected: used.length,
          hint: "Prends la plus grande valeur qui ne dépasse pas ce qui reste à rendre, et recommence.",
          solution: [`${used.join(" + ")} = ${amount}.`, `${used.length} pièces.`],
          recap: `${used.length} pièces`,
          review: "Algorithme glouton",
          takeaway: "Un algorithme glouton fait à chaque étape le choix qui semble le meilleur ; pour le système européen, il donne le rendu optimal.",
        }),
        verify: () => {
          const best = new Array(amount + 1).fill(Infinity);
          best[0] = 0;
          for (let s = 1; s <= amount; s++) for (const c of coins) if (c <= s) best[s] = Math.min(best[s]!, best[s - c]! + 1);
          return best[amount] === used.length && used.reduce((a, b) => a + b, 0) === amount;
        },
      };
    },
  }),
  gen({
    id: "nsi-tables", unit: "1re-nsi-tables", title: "Filtrer une table de données", stage: "application",
    make: (r, id) => {
      const rows = students(r, 7);
      const city = r.pick(rows).ville;
      const minAge = r.int(15, 17);
      const count = rows.filter((x) => x.ville === city && x.age >= minAge).length;
      return {
        activity: ask({
          id, stage: "application", competence: "ns-algo",
          stimulus: mockTable("Table eleves", ["nom", "age", "ville", "note"], rows.map((x) => [x.nom, String(x.age), x.ville, String(x.note)])),
          context: "On filtre la table avec la condition : ville égale à « " + city + " » et âge supérieur ou égal à " + minAge + ".",
          prompt: "Combien de lignes vérifient cette condition ?",
          expected: count,
          hint: "Vérifie les deux conditions pour chaque ligne.",
          solution: [`Lignes retenues : ${rows.filter((x) => x.ville === city && x.age >= minAge).map((x) => x.nom).join(", ") || "aucune"}.`, `${count} ligne${count > 1 ? "s" : ""}.`],
          recap: `${count}`,
          review: "Sélection dans une table",
          takeaway: "Sélectionner des lignes, c'est garder celles qui vérifient toutes les conditions (et) ou au moins une (ou).",
        }),
        verify: () => count === rows.reduce((s, x) => s + (x.ville === city && x.age >= minAge ? 1 : 0), 0),
      };
    },
  }),

  /* ——— NSI terminale ——— */
  gen({
    id: "nsi-recursion", unit: "Tle-nsi-programmation", title: "Suivre une fonction récursive", stage: "application",
    make: (r, id) => {
      const kind = r.int(0, 2), n = r.int(3, 7);
      const code = kind === 0
        ? ["def f(n):", "    if n == 0:", "        return 1", "    return 2 * f(n - 1)", "", `print(f(${n}))`]
        : kind === 1
          ? ["def somme(n):", "    if n == 0:", "        return 0", "    return n + somme(n - 1)", "", `print(somme(${n}))`]
          : ["def fact(n):", "    if n <= 1:", "        return 1", "    return n * fact(n - 1)", "", `print(fact(${n}))`];
      const value = kind === 0 ? 2 ** n : kind === 1 ? (n * (n + 1)) / 2 : [1, 1, 2, 6, 24, 120, 720, 5040][n]!;
      return {
        activity: ask({
          id, stage: "application", competence: "ns-programmer",
          stimulus: py(code),
          context: "Une fonction récursive s'appelle elle-même jusqu'au cas de base.",
          prompt: "Qu'affiche ce programme ?",
          expected: value,
          hint: "Développe les appels jusqu'au cas de base, puis remonte.",
          solution: [kind === 0 ? `f(${n}) = 2 × f(${n - 1}) = … = 2${sup(n)} × f(0) = ${value}.` : kind === 1 ? `somme(${n}) = ${n} + ${n - 1} + … + 1 + 0 = ${value}.` : `fact(${n}) = ${Array.from({ length: n }, (_, i) => n - i).join(" × ")} = ${value}.`],
          recap: `Affiche ${value}`,
          review: "Récursivité",
          takeaway: "Toute fonction récursive a un cas de base qui arrête les appels ; chaque appel se rapproche de ce cas.",
        }),
        verify: () => {
          const f = (k: number): number => (kind === 0 ? (k === 0 ? 1 : 2 * f(k - 1)) : kind === 1 ? (k === 0 ? 0 : k + f(k - 1)) : k <= 1 ? 1 : k * f(k - 1));
          return f(n) === value;
        },
      };
    },
  }),
  gen({
    id: "nsi-pile-file", unit: "Tle-nsi-structures", title: "Pile et file", stage: "application",
    make: (r, id) => {
      const pile = r.chance(0.5);
      const pushes = r.sample([2, 3, 5, 7, 8, 9, 11, 14], 4);
      const pops = r.int(1, 3);
      const struct = [...pushes];
      let last = 0;
      for (let i = 0; i < pops; i++) last = pile ? struct.pop()! : struct.shift()!;
      return {
        activity: ask({
          id, stage: "application", competence: "ns-algo",
          context: `On ${pile ? "empile" : "enfile"} successivement ${pushes.join(", ")}, puis on ${pile ? "dépile" : "défile"} ${pops} fois.`,
          prompt: `Quelle est la dernière valeur ${pile ? "dépilée" : "défilée"} ?`,
          expected: last,
          errors: [{ value: pile ? pushes[pops - 1]! : pushes[pushes.length - pops]!, code: "ordre", message: pile ? "Une pile est « dernier entré, premier sorti » (LIFO)." : "Une file est « premier entré, premier sorti » (FIFO)." }],
          hint: pile ? "Pile : on retire toujours le dernier élément ajouté." : "File : on retire toujours le premier élément ajouté.",
          solution: [`Retraits successifs : ${(pile ? [...pushes].reverse() : pushes).slice(0, pops).join(", ")}.`, `Dernière valeur retirée : ${last}.`],
          recap: `${last}`,
          review: pile ? "Pile (LIFO)" : "File (FIFO)",
          takeaway: "Pile : dernier entré, premier sorti (LIFO). File : premier entré, premier sorti (FIFO).",
        }),
        verify: () => last === (pile ? [...pushes].reverse()[pops - 1] : pushes[pops - 1]),
      };
    },
  }),
  gen({
    id: "nsi-abr", unit: "Tle-nsi-algorithmique", title: "Arbre binaire de recherche", stage: "transfert",
    make: (r, id) => {
      const vals = r.sample([4, 7, 10, 13, 15, 18, 21, 25, 30, 34], 6);
      type Node = { v: number; l?: Node; rr?: Node };
      const root: Node = { v: vals[0]! };
      for (const v of vals.slice(1)) {
        let cur = root;
        for (;;) {
          if (v < cur.v) { if (cur.l) cur = cur.l; else { cur.l = { v }; break; } }
          else if (cur.rr) cur = cur.rr; else { cur.rr = { v }; break; }
        }
      }
      const height = (n?: Node): number => (n ? 1 + Math.max(height(n.l), height(n.rr)) : 0);
      const h = height(root);
      return {
        activity: ask({
          id, stage: "transfert", competence: "ns-algo",
          context: `On insère successivement ${vals.join(", ")} dans un arbre binaire de recherche initialement vide (plus petit à gauche, plus grand à droite).`,
          prompt: "Quelle est la hauteur de l'arbre obtenu (un arbre réduit à sa racine a pour hauteur 1) ?",
          expected: h,
          hint: "Dessine l'arbre : chaque valeur descend à gauche si elle est plus petite que le nœud, à droite sinon.",
          solution: [`Racine : ${vals[0]}.`, `En insérant les valeurs dans l'ordre, la plus longue branche compte ${h} nœuds.`],
          recap: `Hauteur ${h}`,
          review: "Arbre binaire de recherche",
          takeaway: "Dans un ABR, le parcours infixe donne les valeurs triées ; la hauteur dépend de l'ordre d'insertion.",
        }),
        verify: () => {
          const inorder: number[] = [];
          const walk = (n?: Node) => { if (!n) return; walk(n.l); inorder.push(n.v); walk(n.rr); };
          walk(root);
          return inorder.join() === [...vals].sort((a, b) => a - b).join() && h >= Math.ceil(Math.log2(vals.length + 1)) && h <= vals.length;
        },
      };
    },
  }),
  gen({
    id: "nsi-sql", unit: "Tle-nsi-bdd", title: "Résultat d'une requête SQL", stage: "application",
    make: (r, id) => {
      const rows = students(r, 8);
      const city = r.pick(rows).ville;
      const minNote = r.int(9, 14);
      const count = rows.filter((x) => x.ville === city || x.note >= minNote).length;
      return {
        activity: ask({
          id, stage: "application", competence: "ns-algo",
          stimulus: [mockTable("Table Eleve", ["nom", "age", "ville", "note"], rows.map((x) => [x.nom, String(x.age), x.ville, String(x.note)])), mockCode("Requête", [`SELECT COUNT(*) FROM Eleve`, `WHERE ville = '${city}' OR note >= ${minNote};`], "SQL")],
          context: "On exécute la requête sur la table Eleve.",
          prompt: "Quel nombre renvoie-t-elle ?",
          expected: count,
          errors: [{ value: rows.filter((x) => x.ville === city && x.note >= minNote).length, code: "et", message: "OR garde les lignes qui vérifient au moins une des deux conditions." }],
          hint: "Garde chaque ligne qui vérifie au moins une des deux conditions.",
          solution: [`Lignes retenues : ${rows.filter((x) => x.ville === city || x.note >= minNote).map((x) => x.nom).join(", ")}.`, `COUNT(*) = ${count}.`],
          recap: `${count}`,
          review: "Requêtes SQL",
          takeaway: "SELECT … FROM … WHERE … sélectionne des lignes ; AND exige les deux conditions, OR au moins une.",
        }),
        verify: () => count === rows.reduce((s, x) => s + (x.ville === city || x.note >= minNote ? 1 : 0), 0),
      };
    },
  }),
  gen({
    id: "nsi-sous-reseau", unit: "Tle-nsi-reseaux", title: "Adresses d'un sous-réseau", stage: "application",
    make: (r, id) => {
      const prefix = r.pick([24, 25, 26, 27, 28, 29, 30, 22, 20]);
      const hosts = 2 ** (32 - prefix) - 2;
      return {
        activity: ask({
          id, stage: "application", competence: "ns-algo",
          context: `Un réseau IPv4 a pour adresse 192.168.${r.int(0, 50)}.0/${prefix}.`,
          prompt: "Combien de machines peut-on y adresser (adresse du réseau et adresse de diffusion exclues) ?",
          expected: hosts,
          errors: [{ value: 2 ** (32 - prefix), code: "reservees", message: "Deux adresses sont réservées : celle du réseau et celle de diffusion." }],
          hint: `/${prefix} : ${prefix} bits pour le réseau, ${32 - prefix} pour les machines.`,
          solution: [`2${sup(32 - prefix)} − 2 = ${fr(hosts)}.`],
          recap: `${fr(hosts)} machines`,
          review: "Masque de sous-réseau",
          takeaway: "Avec un préfixe /n, il reste 32 − n bits pour les machines : 2³²⁻ⁿ − 2 adresses utilisables.",
        }),
        verify: () => hosts === Math.pow(2, 32 - prefix) - 2 && hosts > 0,
      };
    },
  }),

  /* ——— SNT ——— */
  gen({
    id: "snt-debit", unit: "2nde-snt-internet", title: "Durée d'un téléchargement", stage: "application",
    make: (r, id) => {
      const mo = r.pick([10, 25, 40, 50, 100, 250, 500]), mbps = r.pick([8, 10, 20, 40, 50, 100, 200]);
      const s = (mo * 8) / mbps;
      return {
        activity: ask({
          id, stage: "application", competence: "sn-reseaux",
          context: `On télécharge un fichier de ${mo} Mo avec un débit de ${mbps} Mbit/s (1 octet = 8 bits).`,
          prompt: "Combien de secondes dure le téléchargement ?",
          expected: s, unit: "s",
          errors: [{ value: mo / mbps, code: "bits", message: "Le débit est en bits par seconde et la taille en octets : convertis (× 8).", type: "procedurale" }],
          hint: "Convertis la taille en mégabits, puis divise par le débit.",
          solution: [`${mo} Mo = ${mo * 8} Mbit.`, `${mo * 8} ÷ ${mbps} = ${fr(s)} s.`],
          recap: `${fr(s)} s`,
          review: "Débit",
          takeaway: "Durée = quantité de données ÷ débit, avec les mêmes unités (bits ou octets).",
        }),
        verify: () => close((s * mbps) / 8, mo),
      };
    },
  }),
  gen({
    id: "snt-url", unit: "2nde-snt-web", title: "Décomposer une URL", stage: "rappel",
    make: (r, id) => {
      const domain = r.pick(["www.exemple.fr", "monlycee.education.fr", "cdi.exemple.org", "meteo.exemple.com"]);
      const path = r.pick(["/sport/foot.html", "/index.html", "/actus/2026/rentree.html", "/images/logo.png"]);
      const url = `https://${domain}${path}`;
      const kind = r.int(0, 1);
      const u = new URL(url);
      const right = kind === 0 ? u.hostname : u.protocol.replace(":", "");
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "sn-reseaux",
          prompt: `Dans l'adresse ${url}, quel est ${kind === 0 ? "le nom de domaine" : "le protocole"} ?`,
          answer: { text: right, feedback: kind === 0 ? "Le nom de domaine se trouve entre « :// » et la première barre oblique." : "Le protocole est écrit avant « :// » ; https est la version chiffrée de http." },
          wrong: [
            { text: kind === 0 ? path : "www", feedback: kind === 0 ? "C'est le chemin de la ressource sur le serveur." : "www fait partie du nom de domaine." },
            { text: kind === 0 ? domain.split(".").slice(-1)[0]! : "html", feedback: kind === 0 ? "C'est seulement le domaine de premier niveau." : "html est le format de la page, pas le protocole." },
            { text: kind === 0 ? "https" : "fr", feedback: kind === 0 ? "C'est le protocole." : "C'est une extension de domaine." },
          ],
          hint: "Une URL s'écrit protocole://nom.de.domaine/chemin.",
          solution: [`Protocole : ${u.protocol.replace(":", "")} ; nom de domaine : ${u.hostname} ; chemin : ${u.pathname}.`],
          takeaway: "Une URL indique le protocole, le nom de domaine du serveur et le chemin de la ressource.",
        }),
        verify: () => url === `${u.protocol}//${u.hostname}${u.pathname}`,
      };
    },
  }),
  gen({
    id: "snt-image", unit: "2nde-snt-photo", title: "Poids d'une image", stage: "application",
    make: (r, id) => {
      const [w, h] = r.pick([[1920, 1080], [1280, 720], [4000, 3000], [3264, 2448], [800, 600], [6000, 4000]]);
      const bytes = w! * h! * 3;
      const mo = bytes / 1e6;
      return {
        activity: ask({
          id, stage: "application", competence: "sn-donnees",
          context: `Une photo non compressée fait ${fr(w!)} × ${fr(h!)} pixels ; chaque pixel est codé sur 3 octets (rouge, vert, bleu).`,
          prompt: "Quelle est sa taille en mégaoctets (1 Mo = 10⁶ octets), arrondie au dixième ?",
          expected: round(mo, 1),
          tolerance: { abs: 0.051 },
          errors: [{ value: round((w! * h!) / 1e6, 1), code: "rvb", message: "Chaque pixel occupe 3 octets." }],
          hint: "Nombre de pixels × 3 octets.",
          solution: [`${fr(w!)} × ${fr(h!)} = ${fr(w! * h!)} pixels.`, `× 3 = ${fr(bytes)} octets ≈ ${fr(round(mo, 1))} Mo.`],
          recap: `≈ ${fr(round(mo, 1))} Mo`,
          review: "Taille d'une image",
          takeaway: "Image RVB non compressée : taille = largeur × hauteur × 3 octets ; la compression (JPEG) la réduit.",
        }),
        verify: () => close(mo * 1e6, w! * h! * 3),
      };
    },
  }),
  gen({
    id: "snt-graphe", unit: "2nde-snt-reseaux-sociaux", title: "Distance dans un graphe social", stage: "transfert",
    make: (r, id) => {
      const people = r.sample(NAMES, 6);
      const edges = new Set<string>();
      for (let i = 1; i < people.length; i++) edges.add([people[i - 1], people[i]].sort().join("—"));
      if (r.chance(0.5)) edges.add([people[0], people[3]].sort().join("—"));
      if (r.chance(0.5)) edges.add([people[2], people[5]].sort().join("—"));
      const adj = new Map(people.map((p) => [p, [] as string[]]));
      for (const e of edges) { const [a, b] = e.split("—") as [string, string]; adj.get(a)!.push(b); adj.get(b)!.push(a); }
      const from = people[0]!, to = people[5]!;
      const dist = new Map([[from, 0]]);
      const queue = [from];
      while (queue.length) { const x = queue.shift()!; for (const y of adj.get(x)!) if (!dist.has(y)) { dist.set(y, dist.get(x)! + 1); queue.push(y); } }
      const dd = dist.get(to)!;
      return {
        activity: ask({
          id, stage: "transfert", competence: "sn-reseaux",
          context: `Relations d'amitié (graphe) : ${[...edges].join(" ; ")}.`,
          prompt: `Quelle est la distance (nombre minimal de liens) entre ${from} et ${to} ?`,
          expected: dd,
          hint: "Pars de " + from + " et avance d'ami en ami en comptant les liens.",
          solution: [`Le plus court chemin de ${from} à ${to} compte ${dd} lien${dd > 1 ? "s" : ""}.`],
          recap: `Distance ${dd}`,
          review: "Graphes",
          takeaway: "Dans un graphe, la distance entre deux sommets est le nombre minimal d'arêtes d'un chemin qui les relie.",
        }),
        verify: () => {
          const idx = new Map(people.map((p2, i) => [p2, i]));
          const n = people.length;
          const D = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
          for (const e of edges) { const [a, b] = e.split("—").map((x) => idx.get(x)!) as [number, number]; D[a]![b] = 1; D[b]![a] = 1; }
          for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) D[i]![j] = Math.min(D[i]![j]!, D[i]![k]! + D[k]![j]!);
          return D[0]![n - 1] === dd;
        },
      };
    },
  }),
  gen({
    id: "snt-gps", unit: "2nde-snt-localisation", title: "Distance à un satellite GPS", stage: "application",
    make: (r, id) => {
      const ms = r.pick([66, 67, 68, 70, 72, 75]);
      const dkm = (3e5 * ms) / 1000;
      return {
        activity: ask({
          id, stage: "application", competence: "sn-reseaux",
          context: `Un signal GPS met ${ms} ms pour aller du satellite au récepteur ; il se propage à 300 000 km/s.`,
          prompt: "À quelle distance est le satellite, en km ?",
          expected: dkm,
          errors: [{ value: 3e5 * ms, code: "ms", message: "Convertis les millisecondes en secondes : 1 ms = 0,001 s.", type: "procedurale" }],
          hint: "d = v × t, avec t en secondes.",
          solution: [`t = ${ms} ms = ${fr(ms / 1000)} s.`, `d = 300 000 × ${fr(ms / 1000)} = ${fr(dkm)} km.`],
          recap: `${fr(dkm)} km`,
          review: "Principe du GPS",
          takeaway: "Le GPS calcule des distances à partir de durées de propagation ; il faut au moins trois satellites (quatre en pratique) pour se localiser.",
        }),
        verify: () => close(dkm / 3e5, ms / 1000),
      };
    },
  }),
  gen({
    id: "snt-capteur", unit: "2nde-snt-embarque", title: "Programme d'un objet connecté", stage: "application",
    make: (r, id) => {
      const seuil = r.pick([18, 20, 22, 25, 28]), temp = seuil + r.pick([-4, -2, 0, 1, 3, 6]);
      const action = temp > seuil ? "ventilateur allumé" : "ventilateur éteint";
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "sn-reseaux",
          stimulus: py(["temperature = capteur.lire()", `if temperature > ${seuil}:`, "    ventilateur.allumer()", "else:", "    ventilateur.eteindre()"]),
          prompt: `Le capteur mesure ${temp} °C. Quel est l'état du ventilateur ?`,
          answer: { text: action, feedback: `${temp} ${temp > seuil ? ">" : "≤"} ${seuil} : ${temp > seuil ? "la condition est vraie" : "la condition est fausse, on exécute le else"}.` },
          wrong: [
            { text: temp > seuil ? "ventilateur éteint" : "ventilateur allumé", feedback: `Compare ${temp} à ${seuil} : > est une inégalité stricte.` },
            { text: "Le programme s'arrête", feedback: "Le programme exécute une des deux branches." },
          ],
          hint: "Évalue la condition avec la valeur mesurée.",
          solution: [`Condition : ${temp} > ${seuil} est ${temp > seuil ? "vraie" : "fausse"}.`, `Résultat : ${action}.`],
          takeaway: "Un système embarqué lit des capteurs, applique un programme et commande des actionneurs.",
        }),
        verify: () => (temp > seuil) === (action === "ventilateur allumé"),
      };
    },
  }),
  gen({
    id: "snt-csv", unit: "2nde-snt-donnees", title: "Exploiter un fichier CSV", stage: "application",
    make: (r, id) => {
      const rows = students(r, 6);
      const lines = ["nom,age,ville,note", ...rows.map((x) => `${x.nom},${x.age},${x.ville},${x.note}`)];
      const n = r.int(10, 14);
      const count = rows.filter((x) => x.note >= n).length;
      return {
        activity: ask({
          id, stage: "application", competence: "sn-donnees",
          stimulus: mockCode("eleves.csv", lines, "CSV"),
          context: "Un fichier CSV : une ligne d'en-tête, puis un enregistrement par ligne, champs séparés par des virgules.",
          prompt: `Combien d'élèves ont une note supérieure ou égale à ${n} ?`,
          expected: count,
          hint: "Lis le 4e champ de chaque ligne (après l'en-tête).",
          solution: [`Notes : ${rows.map((x) => x.note).join(", ")}.`, `${count} note${count > 1 ? "s" : ""} ≥ ${n}.`],
          recap: `${count}`,
          review: "Données structurées",
          takeaway: "Un fichier CSV stocke une table : la première ligne nomme les descripteurs, chaque ligne suivante est un objet.",
        }),
        verify: () => count === lines.slice(1).filter((l) => Number(l.split(",")[3]) >= n).length,
      };
    },
  }),

  /* ——— Technologie ——— */
  gen({
    id: "te-octets", unit: "3e-techno-donnees", title: "Bits, octets et stockage", stage: "application",
    make: (r, id) => {
      const go = r.pick([4, 8, 16, 32, 64]), mo = r.pick([2, 4, 5, 8, 10]);
      const n = Math.floor((go * 1000) / mo);
      return {
        activity: ask({
          id, stage: "application", competence: "te-analyser",
          context: `Une clé USB de ${go} Go stocke des photos de ${mo} Mo chacune (1 Go = 1 000 Mo).`,
          prompt: "Combien de photos peut-elle contenir au maximum ?",
          expected: n,
          errors: [{ value: go / mo, code: "unites", message: "Convertis d'abord les Go en Mo." }],
          hint: "Convertis la capacité en Mo, puis divise.",
          solution: [`${go} Go = ${go * 1000} Mo.`, `${go * 1000} ÷ ${mo} = ${fr((go * 1000) / mo)}, donc ${fr(n)} photos.`],
          recap: `${fr(n)} photos`,
          review: "Unités de stockage",
          takeaway: "1 octet = 8 bits ; 1 ko = 1 000 octets ; 1 Mo = 1 000 ko ; 1 Go = 1 000 Mo.",
        }),
        verify: () => n * mo <= go * 1000 && (n + 1) * mo > go * 1000,
      };
    },
  }),
  gen({
    id: "te-programme", unit: "3e-techno-programmer", title: "Prévoir l'action d'un programme", stage: "application",
    make: (r, id) => {
      const seuil = r.pick([300, 400, 500, 600]), lum = seuil + r.pick([-150, -50, 50, 200]);
      const on = lum < seuil;
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "te-programmer",
          stimulus: mockCode("Programme de l'éclairage", ["répéter indéfiniment", `  si luminosité < ${seuil} alors`, "    allumer la lampe", "  sinon", "    éteindre la lampe"], "Pseudo-code"),
          prompt: `Le capteur de luminosité renvoie ${lum}. Que fait la lampe ?`,
          answer: { text: on ? "Elle s'allume" : "Elle s'éteint", feedback: `${lum} ${on ? "<" : "≥"} ${seuil}.` },
          wrong: [{ text: on ? "Elle s'éteint" : "Elle s'allume", feedback: `Compare ${lum} à ${seuil}.` }, { text: "Elle clignote", feedback: "Le programme ne contient pas d'instruction de clignotement." }],
          hint: "Évalue la condition de la ligne 2.",
          solution: [`${lum} < ${seuil} est ${on ? "vrai" : "faux"} : la lampe ${on ? "s'allume" : "s'éteint"}.`],
          takeaway: "Un capteur fournit une information, le programme la compare à un seuil, l'actionneur agit.",
        }),
        verify: () => on === lum < seuil,
      };
    },
  }),
  gen({
    id: "te-boucle", unit: "4e-techno-fonctionnement", title: "Modifier une boucle", stage: "transfert",
    make: (r, id) => {
      const n = r.int(3, 8), pas = r.pick([10, 15, 20, 25]);
      const target = r.int(n + 2, n + 6) * pas;
      const need = target / pas;
      return {
        activity: ask({
          id, stage: "transfert", competence: "te-programmer",
          stimulus: mockCode("Programme du robot", [`répéter ${n} fois`, `  avancer de ${pas} cm`], "Pseudo-code"),
          context: `Le robot avance de ${n * pas} cm. On veut qu'il avance de ${target} cm.`,
          prompt: "Par combien faut-il remplacer le nombre de répétitions ?",
          expected: need,
          hint: "Chaque tour fait avancer le robot du même nombre de centimètres.",
          solution: [`${target} ÷ ${pas} = ${need} répétitions.`],
          recap: `répéter ${need} fois`,
          review: "Boucle",
          takeaway: "Distance totale = nombre de répétitions × distance d'un tour.",
        }),
        verify: () => need * pas === target && Number.isInteger(need),
      };
    },
  }),
  gen({
    id: "te-sequence", unit: "5e-techno-fonctionnement", title: "Lire une suite d'instructions", stage: "rappel",
    make: (r, id) => {
      const start = r.int(0, 5), a = r.int(2, 6), b = r.int(1, 4);
      const x = (start + a) * b;
      return {
        activity: ask({
          id, stage: "rappel", competence: "te-programmer",
          stimulus: mockCode("Programme", [`mettre score à ${start}`, `ajouter ${a} à score`, `mettre score à score × ${b}`, "dire score"], "Pseudo-code"),
          context: "Les instructions s'exécutent de haut en bas.",
          prompt: "Quel nombre est affiché ?",
          expected: x,
          errors: [{ value: start + a * b, code: "ordre", message: "L'ajout se fait avant la multiplication : suis l'ordre des lignes." }],
          hint: "Note la valeur de score après chaque ligne.",
          solution: [`score = ${start}, puis ${start + a}, puis ${x}.`],
          recap: `${x}`,
          review: "Séquence d'instructions",
          takeaway: "Un programme exécute ses instructions dans l'ordre ; une variable garde sa dernière valeur.",
        }),
        verify: () => x === (start + a) * b,
      };
    },
  }),

  /* ——— Sciences de l'ingénieur ——— */
  gen({
    id: "si-rendement", unit: "1re-si-analyser", title: "Rendement d'une chaîne de puissance", stage: "application",
    make: (r, id) => {
      const etas = [r.pick([0.9, 0.95, 0.85]), r.pick([0.8, 0.9, 0.75]), r.pick([0.95, 0.9, 0.98])];
      const total = etas.reduce((a, b) => a * b, 1);
      return {
        activity: ask({
          id, stage: "application", competence: "te-analyser",
          context: `Une chaîne de puissance comporte un variateur (η₁ = ${fr(etas[0]!)}), un moteur (η₂ = ${fr(etas[1]!)}) et un réducteur (η₃ = ${fr(etas[2]!)}).`,
          prompt: "Quel est le rendement global, en % (au dixième) ?",
          expected: round(total * 100, 1),
          tolerance: { abs: 0.051 },
          errors: [{ value: round(((etas[0]! + etas[1]! + etas[2]!) / 3) * 100, 1), code: "moyenne", message: "Les rendements d'éléments en série se multiplient." }],
          hint: "η = η₁ × η₂ × η₃.",
          solution: [`η = ${etas.map((e) => fr(e)).join(" × ")} ≈ ${fr(round(total, 4))}, soit ${fr(round(total * 100, 1))} %.`],
          recap: `η ≈ ${fr(round(total * 100, 1))} %`,
          review: "Rendement global",
          takeaway: "Le rendement d'une chaîne d'éléments en série est le produit de leurs rendements : il est plus faible que chacun d'eux.",
        }),
        verify: () => total < Math.min(...etas) && close(total, etas[0]! * etas[1]! * etas[2]!),
      };
    },
  }),
  gen({
    id: "si-ecart", unit: "1re-si-experimenter", title: "Écart entre mesure et simulation", stage: "application",
    make: (r, id) => {
      const sim = r.pick([120, 150, 200, 250, 400]), mes = sim * r.pick([0.9, 0.92, 0.95, 1.04, 1.1]);
      const ecart = ((mes - sim) / sim) * 100;
      return {
        activity: ask({
          id, stage: "application", competence: "te-analyser",
          context: `La simulation prévoit une vitesse de ${fr(sim)} tr/min ; on mesure ${fr(round(mes, 2))} tr/min.`,
          prompt: "Quel est l'écart relatif de la mesure par rapport à la simulation, en % ?",
          expected: round(ecart, 2),
          tolerance: { abs: 0.051 },
          errors: [{ value: round(((mes - sim) / mes) * 100, 2), code: "reference", message: "L'écart relatif se calcule par rapport à la valeur de référence (la simulation)." }],
          hint: "Écart relatif = (mesure − simulation) ÷ simulation × 100.",
          solution: [`(${fr(round(mes, 2))} − ${fr(sim)}) ÷ ${fr(sim)} × 100 = ${fr(round(ecart, 2))} %.`],
          recap: `${fr(round(ecart, 2))} %`,
          review: "Écart modèle-réel",
          takeaway: "L'écart entre modèle et réel s'exprime en pourcentage de la valeur de référence ; on en cherche ensuite les causes.",
        }),
        verify: () => close(sim * (1 + ecart / 100), mes),
      };
    },
  }),
  gen({
    id: "si-puissance-meca", unit: "Tle-si-modeliser", title: "Puissance mécanique d'un moteur", stage: "application",
    make: (r, id) => {
      const C = r.pick([0.5, 1, 2, 5, 10]), N = r.pick([600, 1200, 1500, 3000]);
      const omega = (2 * Math.PI * N) / 60;
      const P = C * omega;
      return {
        activity: ask({
          id, stage: "application", competence: "te-analyser",
          context: `Un moteur fournit un couple de ${fr(C)} N·m à ${fr(N)} tr/min.`,
          prompt: "Quelle est sa puissance mécanique, en watts (à l'unité) ?",
          expected: Math.round(P),
          tolerance: { abs: 0.51 },
          errors: [{ value: Math.round(C * N), code: "trmin", message: "La vitesse angulaire doit être en rad/s : ω = 2πN/60." }],
          hint: "P = C × ω, avec ω = 2π × N ÷ 60 en rad/s.",
          solution: [`ω = 2π × ${fr(N)} ÷ 60 ≈ ${fr(round(omega, 2))} rad/s.`, `P = ${fr(C)} × ${fr(round(omega, 2))} ≈ ${fr(Math.round(P))} W.`],
          recap: `P ≈ ${fr(Math.round(P))} W`,
          review: "Puissance mécanique",
          takeaway: "En rotation, P = C × ω (couple en N·m, vitesse angulaire en rad/s).",
        }),
        verify: () => close(P / omega, C),
      };
    },
  }),
];
