import { ask, gen, mockTable, problem } from "../build";
import { close, fr, round } from "../format";
import type { Generator } from "../types";

/** Sciences économiques et sociales : outils quantitatifs du programme (taux, indices, équilibre, chômage). */

export const SES: Generator[] = [
  gen({
    id: "ses-taux", unit: "2nde-ses-richesses", title: "Calculer un taux de variation", stage: "application",
    make: (r, id) => {
      const vd = r.int(20, 90) * 100, t = r.pick([-25, -20, -12.5, -10, -5, 4, 5, 8, 10, 12.5, 20, 25, 40, 50]);
      const va = vd * (1 + t / 100);
      return {
        activity: ask({
          id, stage: "application", competence: "se-donnees",
          context: `Le chiffre d'affaires d'une entreprise passe de ${fr(vd)} € à ${fr(va)} € en un an.`,
          prompt: "Quel est son taux de variation, en % ?",
          expected: t,
          errors: [{ value: round(((va - vd) / va) * 100, 4), code: "base", message: "On divise par la valeur de départ.", type: "procedurale" }, { value: va - vd, code: "absolu", message: "C'est la variation absolue (en euros) ; le taux est en pourcentage." }],
          hint: "Taux = (valeur d'arrivée − valeur de départ) ÷ valeur de départ × 100.",
          solution: [`(${fr(va)} − ${fr(vd)}) ÷ ${fr(vd)} × 100 = ${fr(t)} %.`],
          recap: `${t > 0 ? "+" : ""}${fr(t)} %`,
          review: "Taux de variation",
          takeaway: "Taux de variation = (VA − VD)/VD × 100 ; il se lit « a augmenté (ou baissé) de … % ».",
        }),
        verify: () => close(((va - vd) / vd) * 100, t),
      };
    },
  }),
  gen({
    id: "ses-indice", unit: "Tle-ses-croissance", title: "Indice base 100", stage: "application",
    make: (r, id) => {
      const base = r.int(10, 60) * 10, idx = r.pick([80, 90, 95, 104, 110, 120, 125, 150, 180]);
      const v = (base * idx) / 100;
      const year = r.int(2005, 2015), later = year + r.int(5, 10);
      return {
        activity: problem({
          id, stage: "application", competence: "se-donnees",
          context: `Le PIB d'un pays fictif vaut ${fr(base)} milliards d'euros en ${year} et ${fr(v)} milliards en ${later}.`,
          hint: "Indice = valeur de l'année ÷ valeur de l'année de base × 100.",
          takeaway: "Un indice base 100 se lit directement en variation : indice 120 ⟺ +20 % par rapport à l'année de base.",
          parts: [
            { prompt: `Quel est l'indice de ${later}, base 100 en ${year} ?`, expected: idx, errors: [{ value: round((base / v) * 100, 4), code: "inverse", message: "On divise la valeur de l'année étudiée par celle de l'année de base." }], hint: `${fr(v)} ÷ ${fr(base)} × 100.`, solution: [`${fr(v)} ÷ ${fr(base)} × 100 = ${idx}.`], recap: `Indice ${idx}`, review: "Indice base 100" },
            { prompt: "Quel est le taux de variation correspondant, en % ?", expected: idx - 100, errors: [{ value: idx, code: "indice", message: "Le taux de variation se lit en retirant 100 à l'indice." }], hint: "Taux = indice − 100.", solution: [`${idx} − 100 = ${idx - 100} %.`], recap: `${idx - 100 > 0 ? "+" : ""}${idx - 100} %`, review: "Lire un indice" },
          ],
        }),
        verify: () => close((v / base) * 100, idx),
      };
    },
  }),
  gen({
    id: "ses-va", unit: "2nde-ses-richesses", title: "Valeur ajoutée", stage: "rappel",
    make: (r, id) => {
      const ci = r.int(10, 60) * 1000, va = r.int(5, 50) * 1000;
      const prod = ci + va;
      return {
        activity: ask({
          id, stage: "rappel", competence: "se-mecanismes",
          context: `Une boulangerie vend sa production ${fr(prod)} € dans l'année ; elle achète pour ${fr(ci)} € de farine, d'énergie et d'autres consommations intermédiaires.`,
          prompt: "Quelle est sa valeur ajoutée, en euros ?",
          expected: va,
          errors: [{ value: prod, code: "production", message: "La valeur ajoutée retire de la production les consommations intermédiaires." }],
          hint: "Valeur ajoutée = production − consommations intermédiaires.",
          solution: [`VA = ${fr(prod)} − ${fr(ci)} = ${fr(va)} €.`],
          recap: `VA = ${fr(va)} €`,
          review: "Valeur ajoutée",
          takeaway: "La valeur ajoutée mesure la richesse réellement créée par l'entreprise ; le PIB est la somme des valeurs ajoutées.",
        }),
        verify: () => va + ci === prod,
      };
    },
  }),
  gen({
    id: "ses-equilibre", unit: "2nde-ses-prix", title: "Prix d'équilibre", stage: "transfert",
    make: (r, id) => {
      const b = r.int(2, 8) * 10, d = r.int(2, 8) * 10, p = r.int(3, 20);
      const c = r.int(0, 10) * 10, q = c + d * p;
      const a = q + b * p;
      return {
        activity: problem({
          id, stage: "transfert", competence: "se-mecanismes",
          context: `Sur un marché, la demande vaut Qd = ${fr(a)} − ${b}p et l'offre Qo = ${c ? `${fr(c)} + ` : ""}${d}p (p en euros).`,
          hint: "À l'équilibre, la quantité offerte est égale à la quantité demandée.",
          takeaway: "Le prix d'équilibre égalise offre et demande ; au-dessus, il y a excédent d'offre ; en dessous, excédent de demande.",
          parts: [
            { prompt: "Quel est le prix d'équilibre, en euros ?", expected: p, hint: `Résous ${fr(a)} − ${b}p = ${c ? `${fr(c)} + ` : ""}${d}p.`, solution: [`${fr(a)} − ${b}p = ${c ? `${fr(c)} + ` : ""}${d}p ⟺ ${b + d}p = ${fr(a - c)} ⟺ p = ${p}.`], recap: `p* = ${p} €`, review: "Prix d'équilibre" },
            { prompt: "Quelle est la quantité échangée ?", expected: q, hint: "Remplace p dans l'offre ou la demande.", solution: [`Qd = ${fr(a)} − ${b} × ${p} = ${fr(q)}.`], recap: `q* = ${fr(q)}`, review: "Quantité d'équilibre" },
          ],
        }),
        verify: () => a - b * p === q && c + d * p === q && q > 0,
      };
    },
  }),
  gen({
    id: "ses-surplus", unit: "1re-ses-marche", title: "Surplus du consommateur", stage: "transfert",
    make: (r, id) => {
      const pmax = r.int(20, 60), p = r.int(5, pmax - 5), slope = r.pick([2, 4, 5, 10]);
      const q = (pmax - p) * slope;
      const s = (q * (pmax - p)) / 2;
      return {
        activity: ask({
          id, stage: "transfert", competence: "se-mecanismes",
          context: `La demande est linéaire : personne n'achète au-delà de ${pmax} €, et ${fr(q)} unités sont échangées au prix d'équilibre de ${p} €.`,
          prompt: "Quel est le surplus du consommateur, en euros (aire du triangle sous la demande et au-dessus du prix) ?",
          expected: s,
          errors: [{ value: q * (pmax - p), code: "triangle", message: "C'est l'aire d'un triangle : on divise par 2." }],
          hint: "Aire du triangle = base × hauteur ÷ 2, avec base = quantité échangée et hauteur = prix maximal − prix d'équilibre.",
          solution: [`Surplus = ${fr(q)} × (${pmax} − ${p}) ÷ 2 = ${fr(s)} €.`],
          recap: `${fr(s)} €`,
          review: "Surplus",
          takeaway: "Le surplus du consommateur est l'écart entre ce que les acheteurs étaient prêts à payer et ce qu'ils paient.",
        }),
        verify: () => close(s * 2, q * (pmax - p)),
      };
    },
  }),
  gen({
    id: "ses-chomage", unit: "Tle-ses-chomage", title: "Taux de chômage", stage: "application",
    make: (r, id) => {
      const actifs = r.int(20, 40) * 1000, taux = r.pick([5, 6, 7.5, 8, 10, 12.5]);
      const chom = (actifs * taux) / 100;
      const emploi = actifs - chom;
      return {
        activity: ask({
          id, stage: "application", competence: "se-donnees",
          stimulus: mockTable("Population d'un pays fictif (en milliers)", ["Catégorie", "Effectif"], [["Actifs occupés", fr(emploi / 1000)], ["Chômeurs", fr(chom / 1000)], ["Inactifs (élèves, retraités…)", fr(r.int(15, 30))]]),
          context: "Le tableau donne la répartition de la population en âge de travailler.",
          prompt: "Quel est le taux de chômage, en % ?",
          expected: taux,
          errors: [{ value: round((chom / emploi) * 100, 4), code: "occupes", message: "On divise par la population active (occupés + chômeurs), pas par les seuls actifs occupés.", type: "conceptuelle" }],
          hint: "Taux de chômage = chômeurs ÷ population active × 100.",
          solution: [`Population active : ${fr(emploi / 1000)} + ${fr(chom / 1000)} = ${fr(actifs / 1000)} milliers.`, `${fr(chom / 1000)} ÷ ${fr(actifs / 1000)} × 100 = ${fr(taux)} %.`],
          recap: `${fr(taux)} %`,
          review: "Taux de chômage",
          takeaway: "Population active = actifs occupés + chômeurs ; les inactifs n'entrent pas dans le calcul.",
        }),
        verify: () => close((chom / (emploi + chom)) * 100, taux),
      };
    },
  }),
  gen({
    id: "ses-part", unit: "Tle-ses-structure", title: "Part d'un groupe dans l'emploi", stage: "application",
    make: (r, id) => {
      const total = r.int(20, 30) * 1000, part = r.pick([12, 18, 20, 21, 25, 27, 30]);
      const n = (total * part) / 100;
      return {
        activity: ask({
          id, stage: "application", competence: "se-donnees",
          context: `Dans une région fictive, ${fr(n)} personnes sur ${fr(total)} en emploi sont cadres.`,
          prompt: "Quelle est la part des cadres dans l'emploi, en % ?",
          expected: part,
          errors: [{ value: round((total / n) * 100, 4), code: "inverse", message: "Part = effectif du groupe ÷ effectif total × 100." }],
          hint: "Part = effectif du groupe ÷ total × 100.",
          solution: [`${fr(n)} ÷ ${fr(total)} × 100 = ${part} %.`],
          recap: `${part} %`,
          review: "Proportion",
          takeaway: "Une proportion compare une partie au tout ; elle se lit « sur 100 personnes en emploi, … sont cadres ».",
        }),
        verify: () => close((n / total) * 100, part),
      };
    },
  }),
  gen({
    id: "ses-taxe", unit: "Tle-ses-environnement", title: "Coût d'une taxe carbone", stage: "transfert",
    make: (r, id) => {
      const tonnes = r.int(2, 50) * 100, tax = r.pick([30, 44.6, 50, 80, 100]);
      const cost = round(tonnes * tax, 2);
      return {
        activity: ask({
          id, stage: "transfert", competence: "se-mecanismes",
          context: `Une entreprise fictive émet ${fr(tonnes)} tonnes de CO₂ par an ; on applique une taxe de ${fr(tax)} € par tonne.`,
          prompt: "Combien paie-t-elle de taxe par an, en euros ?",
          expected: cost,
          hint: "Coût = quantité émise × taxe par tonne.",
          solution: [`${fr(tonnes)} × ${fr(tax)} = ${fr(cost)} €.`, "Réduire ses émissions diminue directement ce coût : c'est l'incitation recherchée."],
          recap: `${fr(cost)} €`,
          review: "Taxe environnementale",
          takeaway: "Une taxe sur la pollution donne un prix aux émissions : elle incite à les réduire (principe pollueur-payeur).",
        }),
        verify: () => close(cost / tonnes, tax),
      };
    },
  }),
  gen({
    id: "ses-mediane-salaire", unit: "2nde-ses-diplome", title: "Salaire médian", stage: "application",
    make: (r, id) => {
      const n = r.pick([5, 7, 9]);
      const sal = Array.from({ length: n }, () => r.int(14, 45) * 100);
      const sorted = [...sal].sort((a, b) => a - b);
      const med = sorted[(n - 1) / 2]!;
      const mean = sal.reduce((a, b) => a + b, 0) / n;
      return {
        activity: problem({
          id, stage: "application", competence: "se-donnees",
          context: `Salaires nets mensuels (en €) de ${n} jeunes diplômés d'une même formation (données fictives) : ${sal.map((s) => fr(s)).join(" ; ")}.`,
          hint: "Range les salaires dans l'ordre croissant.",
          takeaway: "La médiane partage les salariés en deux moitiés ; elle est moins sensible aux très hauts salaires que la moyenne.",
          parts: [
            { prompt: "Quel est le salaire médian ?", expected: med, hint: `La médiane est la ${(n + 1) / 2}e valeur de la série rangée.`, solution: [`Série rangée : ${sorted.map((s) => fr(s)).join(" ; ")}.`, `Médiane : ${fr(med)} €.`], recap: `${fr(med)} €`, review: "Médiane" },
            { prompt: "Quel est le salaire moyen (à l'euro près) ?", expected: Math.round(mean), tolerance: { abs: 0.5 }, hint: "Somme ÷ effectif.", solution: [`${fr(sal.reduce((a, b) => a + b, 0))} ÷ ${n} ≈ ${fr(Math.round(mean))} €.`], recap: `${fr(Math.round(mean))} €`, review: "Moyenne" },
          ],
        }),
        verify: () => sorted.filter((s) => s <= med).length >= (n + 1) / 2 && sorted.filter((s) => s >= med).length >= (n + 1) / 2,
      };
    },
  }),
];
