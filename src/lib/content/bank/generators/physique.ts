import { ask, gen, mcq, order, problem } from "../build";
import { evaluate } from "../evaluate";
import { close, fr, round, sub, sup } from "../format";
import type { Generator } from "../types";
import { ATOMIC_MASS, DECAYS, IONS, ISOTOPES, NAME, REACTIONS, Z, atoms, balanced, equation, equationMasked, formula, ion, molarMass } from "./chem";

/** Physique-chimie, sciences de 6e et enseignement scientifique. Constantes : valeurs usuelles des programmes. */

const G_EARTH = 9.8;
const SOUND = 340;
const C_LIGHT = 3.0e8;

/** Notation scientifique : 1,5 × 10⁸. */
export function sci(x: number, d = 2): string {
  if (x === 0) return "0";
  let e = Math.floor(Math.log10(Math.abs(x)));
  let m = round(x / 10 ** e, d);
  if (Math.abs(m) >= 10) { m = round(m / 10, d); e += 1; }
  return e === 0 ? fr(m) : `${fr(m)} × 10${sup(e)}`;
}

export const PHYSIQUE: Generator[] = [
  /* ——— 6e : sciences ——— */
  gen({
    id: "s6-vitesse", unit: "6e-sciences-matiere", title: "Calculer une vitesse moyenne", stage: "application",
    make: (r, id) => {
      const v = r.pick([2, 4, 5, 6, 8, 10, 12, 15, 20, 25]), t = r.pick([10, 20, 30, 40, 50, 60, 90, 120]);
      const d = v * t;
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Un cycliste parcourt ${fr(d)} m en ${t} s à vitesse constante.`,
          prompt: "Quelle est sa vitesse, en mètres par seconde ?",
          expected: v, unit: "m/s",
          errors: [{ value: d * t, code: "produit", message: "La vitesse est la distance divisée par la durée : v = d ÷ t.", type: "conceptuelle" }],
          hint: "v = d ÷ t.",
          solution: [`v = ${fr(d)} ÷ ${t} = ${v} m/s.`],
          recap: `v = ${v} m/s`,
          review: "Vitesse moyenne",
          takeaway: "Vitesse moyenne = distance parcourue ÷ durée du parcours.",
        }),
        verify: () => close(v * t, d),
      };
    },
  }),
  gen({
    id: "s6-planetes", unit: "6e-sciences-terre", title: "Ranger les planètes depuis le Soleil", stage: "rappel",
    make: (r, id) => {
      const PLANETS = ["Mercure", "Vénus", "Terre", "Mars", "Jupiter", "Saturne", "Uranus", "Neptune"];
      const picked = r.sample(PLANETS.map((p, i) => [p, i] as const), 4).sort((a, b) => a[1] - b[1]);
      return {
        activity: order(r, {
          id, stage: "rappel", competence: "svt-savoirs",
          prompt: "Range ces planètes de la plus proche à la plus éloignée du Soleil.",
          steps: picked.map(([p]) => p),
          hint: "Les quatre planètes rocheuses sont les plus proches du Soleil, les géantes gazeuses les plus éloignées.",
          hints: ["Ordre complet : Mercure, Vénus, Terre, Mars, puis Jupiter, Saturne, Uranus, Neptune.", `La plus proche des quatre est ${picked[0]![0]}.`],
          solution: [`Ordre : ${picked.map(([p]) => p).join(", ")}.`],
          takeaway: "Depuis le Soleil : Mercure, Vénus, Terre, Mars (rocheuses), Jupiter, Saturne, Uranus, Neptune (géantes).",
        }),
        verify: () => picked.every(([, i], k) => k === 0 || i > picked[k - 1]![1]),
      };
    },
  }),

  /* ——— 5e ——— */
  gen({
    id: "p5-etat-eau", unit: "5e-physique-matiere", title: "État de l'eau selon la température", stage: "rappel",
    make: (r, id) => {
      const t = r.pick([-18, -5, -1, 4, 20, 37, 65, 99, 105, 120]);
      const state = t < 0 ? "Solide (glace)" : t < 100 ? "Liquide" : "Gazeux (vapeur)";
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "app",
          prompt: `À la pression atmosphérique normale, dans quel état est l'eau pure à ${fr(t)} °C ?`,
          answer: { text: state, feedback: "L'eau pure fond à 0 °C et bout à 100 °C sous la pression atmosphérique normale." },
          wrong: ["Solide (glace)", "Liquide", "Gazeux (vapeur)"].filter((s) => s !== state).map((s) => ({ text: s, feedback: "Compare la température à 0 °C (fusion) et à 100 °C (ébullition)." })),
          hint: "Compare la température à 0 °C et à 100 °C.",
          solution: [`${fr(t)} °C ${t < 0 ? "< 0 °C : l'eau est solide." : t < 100 ? "est entre 0 °C et 100 °C : l'eau est liquide." : "> 100 °C : l'eau est à l'état gazeux."}`],
          takeaway: "Eau pure, pression normale : solide sous 0 °C, liquide entre 0 °C et 100 °C, gazeuse au-dessus de 100 °C.",
        }),
        verify: () => (t < 0 ? state.startsWith("Solide") : t < 100 ? state === "Liquide" : state.startsWith("Gazeux")),
      };
    },
  }),
  gen({
    id: "p5-masse-eau", unit: "5e-physique-matiere", title: "Masse d'un volume d'eau", stage: "application",
    make: (r, id) => {
      const mL = r.pick([250, 330, 500, 750, 1500, 2000, 33, 125]);
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Une bouteille contient ${fr(mL)} mL d'eau.`,
          prompt: "Quelle est la masse de cette eau, en grammes ?",
          expected: mL,
          errors: [{ value: mL / 1000, code: "kg", message: "La réponse est demandée en grammes : 1 mL d'eau a une masse de 1 g." }],
          hint: "1 L d'eau a une masse de 1 kg, donc 1 mL a une masse de 1 g.",
          solution: [`1 mL d'eau ↔ 1 g, donc ${fr(mL)} mL ↔ ${fr(mL)} g.`],
          recap: `${fr(mL)} g`,
          review: "Masse et volume de l'eau",
          takeaway: "Pour l'eau liquide : 1 L ↔ 1 kg et 1 mL ↔ 1 g. Ce n'est pas vrai pour les autres liquides.",
        }),
        verify: () => close(mL * 1, mL),
      };
    },
  }),
  gen({
    id: "p5-orage", unit: "5e-physique-signaux", title: "Distance d'un orage", stage: "transfert",
    make: (r, id) => {
      const t = r.int(2, 15);
      return {
        activity: ask({
          id, stage: "transfert", competence: "rea",
          context: `On voit l'éclair, puis on entend le tonnerre ${t} s plus tard. Le son se propage à environ ${SOUND} m/s ; la lumière arrive presque instantanément.`,
          prompt: "À quelle distance est l'orage, en mètres ?",
          expected: SOUND * t, unit: "m",
          errors: [{ value: SOUND / t, code: "division", message: "d = v × t : on multiplie la vitesse par la durée.", type: "conceptuelle" }],
          hint: "La durée mesurée est celle du trajet du son.",
          solution: [`d = v × t = ${SOUND} × ${t} = ${fr(SOUND * t)} m.`],
          recap: `≈ ${fr(SOUND * t)} m`,
          review: "Vitesse du son",
          takeaway: "Le son se propage à environ 340 m/s dans l'air : environ 1 km toutes les 3 secondes.",
        }),
        verify: () => close((SOUND * t) / t, SOUND),
      };
    },
  }),

  /* ——— 4e ——— */
  gen({
    id: "p4-atomes", unit: "4e-physique-molecules", title: "Compter les atomes d'une molécule", stage: "rappel",
    make: (r, id) => {
      const [f, name] = r.pick([["H2O", "eau"], ["CO2", "dioxyde de carbone"], ["CH4", "méthane"], ["C6H12O6", "glucose"], ["O2", "dioxygène"], ["C3H8", "propane"], ["NH3", "ammoniac"], ["C2H6O", "éthanol"], ["C4H10", "butane"]] as const);
      const total = Object.values(atoms(f)).reduce((a, b) => a + b, 0);
      const detail = Object.entries(atoms(f)).map(([el, n]) => `${n} atome${n > 1 ? "s" : ""} de ${NAME[el]}`).join(", ");
      return {
        activity: ask({
          id, stage: "rappel", competence: "app",
          context: `La molécule de ${name} a pour formule ${formula(f)}.`,
          prompt: "Combien d'atomes contient-elle au total ?",
          expected: total,
          errors: [{ value: Object.keys(atoms(f)).length, code: "elements", message: "Tu as compté les sortes d'atomes ; il faut compter tous les atomes, grâce aux indices." }],
          hint: "L'indice en bas à droite d'un symbole donne le nombre d'atomes ; sans indice, il y en a 1.",
          solution: [`${formula(f)} : ${detail}.`, `Total : ${total} atomes.`],
          recap: `${total} atomes`,
          review: "Lire une formule chimique",
          takeaway: "Dans une formule, l'indice suit le symbole de l'atome qu'il compte ; pas d'indice signifie un seul atome.",
        }),
        verify: () => total === [...f.matchAll(/([A-Z][a-z]?)(\d*)/g)].reduce((s, m) => s + (m[2] ? Number(m[2]) : 1), 0),
      };
    },
  }),
  gen({
    id: "p4-equilibrer", unit: "4e-physique-molecules", title: "Équilibrer une équation de réaction", stage: "application",
    make: (r, id) => {
      const rx = r.pick(REACTIONS.slice(0, 12));
      const right = [...rx.reactants, ...rx.products].map(([c]) => c);
      const variants: number[][] = [];
      for (let k = 0; k < right.length && variants.length < 6; k++) {
        for (const d of [1, -1, 1]) {
          const v = [...right];
          v[k] = Math.max(1, v[k]! + d);
          const bal = balanced({ reactants: rx.reactants.map(([, f], i) => [v[i]!, f]), products: rx.products.map(([, f], i) => [v[rx.reactants.length + i]!, f]) });
          if (!bal && !variants.some((w) => w.join() === v.join()) && v.join() !== right.join()) variants.push(v);
        }
      }
      const ones = right.map(() => 1);
      if (ones.join() !== right.join()) variants.push(ones);
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "ana",
          prompt: `Quelle écriture de la ${rx.name} est équilibrée ?`,
          answer: { text: equation(rx), feedback: "Chaque sorte d'atome est en même nombre de chaque côté de la flèche." },
          wrong: r.shuffle(variants).filter((v) => v.join() !== right.join()).map((v) => ({ text: equation(rx, v), feedback: "Compte les atomes de chaque élément de chaque côté : ils ne sont pas conservés." })),
          hint: "Compte les atomes de chaque élément à gauche et à droite de la flèche.",
          solution: [`${equation(rx)}.`, "Au cours d'une transformation chimique, les atomes se conservent : on les retrouve tous dans les produits."],
          takeaway: "Une équation est équilibrée quand chaque élément est représenté par le même nombre d'atomes dans les réactifs et dans les produits.",
        }),
        verify: () => balanced(rx) && variants.every((v) => !balanced({ reactants: rx.reactants.map(([, f], i) => [v[i]!, f]), products: rx.products.map(([, f], i) => [v[rx.reactants.length + i]!, f]) })),
      };
    },
  }),
  gen({
    id: "p4-masse-volumique", unit: "4e-physique-masse", title: "Calculer une masse volumique", stage: "application",
    make: (r, id) => {
      const [name, rho] = r.pick([["aluminium", 2.7], ["fer", 7.9], ["cuivre", 8.9], ["huile", 0.92], ["glace", 0.92], ["éthanol", 0.79], ["plomb", 11.3], ["bois de chêne", 0.75]] as const);
      const V = r.pick([10, 20, 40, 50, 100, 200, 250]);
      const m = round(rho * V, 2);
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Un échantillon de ${name} a une masse de ${fr(m)} g et un volume de ${V} cm³.`,
          prompt: "Quelle est sa masse volumique, en g/cm³ ?",
          expected: rho,
          errors: [{ value: round(V / m, 4), code: "inverse", message: "ρ = m ÷ V : masse divisée par volume.", type: "procedurale" }],
          hint: "ρ = m ÷ V.",
          solution: [`ρ = ${fr(m)} ÷ ${V} = ${fr(rho)} g/cm³.`, rho < 1 ? "ρ < 1 g/cm³ : ce matériau flotte sur l'eau." : "ρ > 1 g/cm³ : ce matériau coule dans l'eau."],
          recap: `ρ = ${fr(rho)} g/cm³`,
          review: "Masse volumique",
          takeaway: "ρ = m/V. Un objet plein flotte sur l'eau si sa masse volumique est inférieure à celle de l'eau (1 g/cm³).",
        }),
        verify: () => close(m / V, rho),
      };
    },
  }),
  gen({
    id: "p4-flotter", unit: "4e-physique-masse", title: "Flotter ou couler", stage: "transfert",
    make: (r, id) => {
      const rho = r.pick([0.24, 0.5, 0.75, 0.92, 1.05, 1.3, 2.7, 7.9]);
      const floats = rho < 1;
      return {
        activity: mcq(r, {
          id, stage: "transfert", competence: "val",
          prompt: `Un objet plein a une masse volumique de ${fr(rho)} g/cm³. Que fait-il dans l'eau douce (1 g/cm³) ?`,
          answer: { text: floats ? "Il flotte" : "Il coule", feedback: floats ? "Sa masse volumique est inférieure à celle de l'eau." : "Sa masse volumique est supérieure à celle de l'eau." },
          wrong: [{ text: floats ? "Il coule" : "Il flotte", feedback: "Compare sa masse volumique à 1 g/cm³." }, { text: "Cela dépend de sa masse", feedback: "Pour un objet plein, c'est la masse volumique qui décide, pas la masse." }, { text: "Cela dépend de son volume", feedback: "Pour un objet plein, c'est la masse volumique qui décide, pas le volume." }],
          hint: "Compare sa masse volumique à celle de l'eau.",
          solution: [`${fr(rho)} ${floats ? "<" : ">"} 1 : il ${floats ? "flotte" : "coule"}.`],
          takeaway: "Un objet plein flotte si sa masse volumique est plus petite que celle du liquide.",
        }),
        verify: () => (rho < 1) === floats && rho !== 1,
      };
    },
  }),
  gen({
    id: "p4-ohm", unit: "4e-physique-ohm", title: "Appliquer la loi d'Ohm", stage: "application",
    make: (r, id) => {
      const R = r.pick([10, 22, 47, 100, 150, 220, 330, 470, 1000]);
      const ImA = r.pick([5, 10, 20, 25, 30, 40, 50]);
      const U = (R * ImA) / 1000;
      const ask3 = r.int(0, 2);
      if (ask3 === 0) {
        return {
          activity: ask({
            id, stage: "application", competence: "rea",
            context: `Un conducteur ohmique de résistance R = ${fr(R)} Ω est traversé par un courant d'intensité I = ${ImA} mA.`,
            prompt: "Quelle est la tension U à ses bornes, en volts ?",
            expected: U, unit: "V",
            errors: [{ value: R * ImA, code: "mA", message: "Convertis d'abord l'intensité en ampères : 1 mA = 0,001 A.", type: "procedurale" }],
            hint: "U = R × I, avec I en ampères.",
            solution: [`I = ${ImA} mA = ${fr(ImA / 1000)} A.`, `U = ${fr(R)} × ${fr(ImA / 1000)} = ${fr(U)} V.`],
            recap: `U = ${fr(U)} V`,
            review: "Loi d'Ohm",
            takeaway: "Loi d'Ohm : U = R × I, avec U en volts, R en ohms et I en ampères.",
          }),
          verify: () => close(U / (ImA / 1000), R),
        };
      }
      if (ask3 === 1) {
        return {
          activity: ask({
            id, stage: "application", competence: "rea",
            context: `La tension aux bornes d'un conducteur ohmique est U = ${fr(U)} V et l'intensité qui le traverse est I = ${ImA} mA.`,
            prompt: "Quelle est sa résistance, en ohms ?",
            expected: R, unit: "Ω",
            errors: [{ value: round(U / ImA, 6), code: "mA", message: "Convertis l'intensité en ampères avant de diviser.", type: "procedurale" }, { value: round(U * (ImA / 1000), 6), code: "produit", message: "R = U ÷ I.", type: "conceptuelle" }],
            hint: "R = U ÷ I, avec I en ampères.",
            solution: [`I = ${fr(ImA / 1000)} A.`, `R = ${fr(U)} ÷ ${fr(ImA / 1000)} = ${fr(R)} Ω.`],
            recap: `R = ${fr(R)} Ω`,
            review: "Loi d'Ohm",
            takeaway: "Loi d'Ohm : U = R × I, donc R = U ÷ I et I = U ÷ R.",
          }),
          verify: () => close(U / (ImA / 1000), R),
        };
      }
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Un conducteur ohmique de ${fr(R)} Ω est soumis à une tension de ${fr(U)} V.`,
          prompt: "Quelle est l'intensité du courant, en milliampères ?",
          expected: ImA, unit: "mA", unitMustMatch: false,
          errors: [{ value: round(U / R, 6), code: "A", message: "C'est la valeur en ampères : la réponse est demandée en milliampères (× 1 000)." }],
          hint: "I = U ÷ R, puis convertis en mA.",
          solution: [`I = ${fr(U)} ÷ ${fr(R)} = ${fr(U / R)} A = ${ImA} mA.`],
          recap: `I = ${ImA} mA`,
          review: "Loi d'Ohm",
          takeaway: "I = U ÷ R ; 1 A = 1 000 mA.",
        }),
        verify: () => close((U / R) * 1000, ImA),
      };
    },
  }),
  gen({
    id: "p4-vitesse-kmh", unit: "4e-physique-mouvement", title: "Vitesse moyenne d'un trajet", stage: "application",
    make: (r, id) => {
      const v = r.pick([30, 45, 50, 60, 72, 80, 90, 100, 120]);
      const minutes = r.pick([20, 30, 40, 45, 90, 120, 150].filter((m) => (v * m) % 60 === 0));
      const d = (v * minutes) / 60;
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Un car parcourt ${fr(d)} km en ${minutes} min.`,
          prompt: "Quelle est sa vitesse moyenne, en km/h ?",
          expected: v, unit: "km/h",
          errors: [{ value: round(d / minutes, 4), code: "minutes", message: "Pour obtenir des km/h, la durée doit être en heures.", type: "procedurale" }],
          hint: `${minutes} min = ${fr(minutes / 60)} h.`,
          solution: [`t = ${minutes} min = ${fr(minutes / 60)} h.`, `v = ${fr(d)} ÷ ${fr(minutes / 60)} = ${v} km/h.`],
          recap: `v = ${v} km/h`,
          review: "Vitesse moyenne",
          takeaway: "v = d ÷ t ; pour des km/h, d en km et t en heures.",
        }),
        verify: () => close(d / (minutes / 60), v),
      };
    },
  }),
  gen({
    id: "p4-lumiere", unit: "4e-physique-lumiere", title: "Durée de trajet de la lumière", stage: "transfert",
    make: (r, id) => {
      const [what, dkm] = r.pick([["du Soleil à la Terre", 1.5e8], ["de la Lune à la Terre", 3.84e5], ["du Soleil à Mars", 2.28e8], ["du Soleil à Jupiter", 7.78e8]] as const);
      const t = dkm / 3.0e5;
      return {
        activity: ask({
          id, stage: "transfert", competence: "rea",
          context: `La lumière se propage à environ 3,0 × 10⁵ km/s. La distance ${what} est d'environ ${sci(dkm, 3)} km.`,
          prompt: "Combien de temps met la lumière pour parcourir cette distance, en secondes (arrondi à l'unité) ?",
          expected: Math.round(t),
          tolerance: { abs: 0.51 },
          errors: [{ value: Math.round(dkm * 3.0e5), code: "produit", message: "t = d ÷ v : on divise la distance par la vitesse.", type: "conceptuelle" }],
          hint: "t = d ÷ v.",
          solution: [`t = ${sci(dkm, 3)} ÷ (3,0 × 10⁵) ≈ ${fr(Math.round(t))} s.`],
          recap: `≈ ${fr(Math.round(t))} s`,
          review: "Vitesse de la lumière",
          takeaway: "La lumière se propage dans le vide à environ 300 000 km/s : elle met environ 8 min 20 s pour venir du Soleil.",
        }),
        verify: () => close(t * 3.0e5, dkm),
      };
    },
  }),

  /* ——— 3e ——— */
  gen({
    id: "p3-ions", unit: "3e-physique-atomes", title: "Électrons d'un ion", stage: "application",
    make: (r, id) => {
      const [el, q] = r.pick(IONS);
      const z = Z[el]!;
      const e = z - q;
      return {
        activity: ask({
          id, stage: "application", competence: "app",
          context: `L'atome de ${NAME[el]} (Z = ${z}) devient l'ion ${ion(el, q)}.`,
          prompt: "Combien d'électrons possède cet ion ?",
          expected: e,
          errors: [{ value: z + q, code: "signe", message: q > 0 ? "Un ion positif a perdu des électrons." : "Un ion négatif a gagné des électrons.", type: "conceptuelle" }],
          hint: `Un atome neutre a autant d'électrons que de protons (${z}). ${q > 0 ? "Un ion positif a perdu des électrons." : "Un ion négatif en a gagné."}`,
          solution: [`Atome neutre : ${z} électrons.`, `${ion(el, q)} : ${q > 0 ? `il a perdu ${q}` : `il a gagné ${-q}`} électron${Math.abs(q) > 1 ? "s" : ""}, soit ${e} électrons.`],
          recap: `${e} électrons`,
          review: "Ions",
          takeaway: "Un ion positif (cation) a perdu des électrons ; un ion négatif (anion) en a gagné. Le noyau ne change pas.",
        }),
        verify: () => z - e === q,
      };
    },
  }),
  gen({
    id: "p3-conversion", unit: "3e-physique-vitesse", title: "Convertir des m/s en km/h", stage: "application",
    make: (r, id) => {
      const toKmh = r.chance(0.5);
      const ms = r.pick([5, 10, 15, 20, 25, 30, 12.5, 2.5]);
      const kmh = ms * 3.6;
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: "Conversion de vitesses.",
          prompt: toKmh ? `${fr(ms)} m/s = ? km/h` : `${fr(kmh)} km/h = ? m/s`,
          expected: toKmh ? kmh : ms, unit: toKmh ? "km/h" : "m/s", unitMustMatch: true,
          errors: [{ value: toKmh ? ms / 3.6 : kmh * 3.6, code: "sens", message: toKmh ? "Pour passer des m/s aux km/h, on multiplie par 3,6." : "Pour passer des km/h aux m/s, on divise par 3,6.", type: "procedurale" }],
          hint: "1 m/s = 3,6 km/h (3 600 s dans une heure, 1 000 m dans un kilomètre).",
          solution: [toKmh ? `${fr(ms)} × 3,6 = ${fr(kmh)} km/h.` : `${fr(kmh)} ÷ 3,6 = ${fr(ms)} m/s.`],
          recap: toKmh ? `${fr(kmh)} km/h` : `${fr(ms)} m/s`,
          review: "Conversion de vitesses",
          takeaway: "m/s → km/h : × 3,6 ; km/h → m/s : ÷ 3,6.",
        }),
        verify: () => close((ms * 3600) / 1000, kmh),
      };
    },
  }),
  gen({
    id: "p3-poids", unit: "3e-physique-forces", title: "Calculer un poids", stage: "application",
    make: (r, id) => {
      const [astre, g] = r.pick([["la Terre", 9.8], ["la Lune", 1.6], ["Mars", 3.7]] as const);
      const m = r.pick([2, 5, 10, 20, 45, 50, 60, 70, 80]);
      const P = round(m * g, 2);
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Sur ${astre}, l'intensité de la pesanteur vaut g = ${fr(g)} N/kg.`,
          prompt: `Quel est le poids d'un objet de masse ${m} kg, en newtons ?`,
          expected: P,
          errors: [{ value: m, code: "masse", message: "Le poids (en N) n'est pas la masse (en kg) : P = m × g.", type: "conceptuelle" }, { value: round(m / g, 4), code: "division", message: "P = m × g : on multiplie.", type: "procedurale" }],
          hint: "P = m × g.",
          solution: [`P = ${m} × ${fr(g)} = ${fr(P)} N.`],
          recap: `P = ${fr(P)} N`,
          review: "Poids et masse",
          takeaway: "Le poids P = m × g dépend de l'astre ; la masse m, elle, ne change pas.",
        }),
        verify: () => close(P / g, m),
      };
    },
  }),
  gen({
    id: "p3-ph", unit: "3e-physique-acides", title: "Acide, neutre ou basique", stage: "rappel",
    make: (r, id) => {
      const [name, ph] = r.pick([["Jus de citron", 2.4], ["Vinaigre", 2.9], ["Soda au cola", 2.5], ["Eau pure (25 °C)", 7], ["Eau savonneuse", 10], ["Eau de Javel", 12], ["Café", 5], ["Lait", 6.6], ["Bicarbonate en solution", 8.3]] as const);
      const kind = ph < 7 ? "Acide" : ph === 7 ? "Neutre" : "Basique";
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "app",
          prompt: `${name} : pH ≈ ${fr(ph)}. Cette solution est…`,
          answer: { text: kind, feedback: "pH < 7 : acide ; pH = 7 : neutre ; pH > 7 : basique (à 25 °C)." },
          wrong: ["Acide", "Neutre", "Basique"].filter((k) => k !== kind).map((k) => ({ text: k, feedback: "Compare le pH à 7." })),
          hint: "Compare le pH à 7.",
          solution: [`pH ${ph < 7 ? "<" : ph === 7 ? "=" : ">"} 7 : solution ${kind.toLowerCase()}.`],
          takeaway: "À 25 °C : pH < 7 acide, pH = 7 neutre, pH > 7 basique. Plus le pH est bas, plus la solution est acide.",
        }),
        verify: () => (ph < 7 ? kind === "Acide" : ph === 7 ? kind === "Neutre" : kind === "Basique"),
      };
    },
  }),
  gen({
    id: "p3-ec", unit: "3e-physique-energie", title: "Énergie cinétique", stage: "application",
    make: (r, id) => {
      const m = r.pick([60, 80, 100, 200, 500, 800, 1000, 1200]);
      const kmh = r.pick([18, 36, 54, 72, 90, 108]);
      const v = kmh / 3.6;
      const Ec = 0.5 * m * v * v;
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Un véhicule de ${fr(m)} kg roule à ${kmh} km/h.`,
          prompt: "Quelle est son énergie cinétique, en joules ?",
          expected: round(Ec, 2),
          errors: [{ value: round(0.5 * m * kmh * kmh, 2), code: "kmh", message: "La vitesse doit être en m/s : on divise les km/h par 3,6.", type: "procedurale" }, { value: round(0.5 * m * v, 2), code: "carre", message: "La vitesse est au carré : Ec = ½ × m × v².", type: "procedurale" }],
          hint: "Ec = ½ × m × v², avec v en m/s.",
          solution: [`v = ${kmh} ÷ 3,6 = ${fr(v)} m/s.`, `Ec = 0,5 × ${fr(m)} × ${fr(v)}² = ${fr(round(Ec, 2))} J.`],
          recap: `Ec = ${fr(round(Ec, 2))} J`,
          review: "Énergie cinétique",
          takeaway: "Ec = ½ m v² : si la vitesse double, l'énergie cinétique (et la distance de freinage) est multipliée par 4.",
        }),
        verify: () => close(evaluate(`0,5 × ${m} × (${kmh} ÷ 3,6)²`), Ec),
      };
    },
  }),
  gen({
    id: "p3-puissance", unit: "3e-physique-electricite", title: "Puissance et énergie électriques", stage: "application",
    make: (r, id) => {
      const U = 230, I = r.pick([0.5, 1, 2, 4, 5, 8, 10]);
      const P = U * I;
      const h = r.pick([0.5, 1, 2, 3, 5]);
      const E = (P * h) / 1000;
      return {
        activity: problem({
          id, stage: "application", competence: "rea",
          context: `Un appareil branché sur le secteur (${U} V) est traversé par un courant de ${fr(I)} A. Il fonctionne ${fr(h)} h.`,
          hint: "P = U × I, puis E = P × t.",
          takeaway: "P = U × I (en W) ; E = P × t (en Wh ou kWh si t est en heures, en J si t est en secondes).",
          parts: [
            { prompt: "Quelle est sa puissance, en watts ?", expected: P, errors: [{ value: U + I, code: "somme", message: "P = U × I : on multiplie." }], hint: `${U} × ${fr(I)}.`, solution: [`P = ${U} × ${fr(I)} = ${fr(P)} W.`], recap: `P = ${fr(P)} W`, review: "Puissance électrique" },
            { prompt: "Quelle énergie consomme-t-il, en kWh ?", expected: E, errors: [{ value: P * h, code: "Wh", message: "C'est l'énergie en Wh : 1 kWh = 1 000 Wh." }], hint: "E = P × t en Wh, puis ÷ 1 000.", solution: [`E = ${fr(P)} × ${fr(h)} = ${fr(P * h)} Wh = ${fr(E)} kWh.`], recap: `E = ${fr(E)} kWh`, review: "Énergie électrique" },
          ],
        }),
        verify: () => close((E * 1000) / h, U * I),
      };
    },
  }),
  gen({
    id: "p3-frequence", unit: "3e-physique-signaux", title: "Période et fréquence", stage: "application",
    make: (r, id) => {
      const TmS = r.pick([1, 2, 2.5, 4, 5, 10, 20, 0.5]);
      const f = 1000 / TmS;
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Un son a une période T = ${fr(TmS)} ms.`,
          prompt: "Quelle est sa fréquence, en hertz ?",
          expected: f,
          errors: [{ value: 1 / TmS, code: "ms", message: "Convertis la période en secondes : 1 ms = 0,001 s.", type: "procedurale" }],
          hint: "f = 1 ÷ T, avec T en secondes.",
          solution: [`T = ${fr(TmS)} ms = ${fr(TmS / 1000)} s.`, `f = 1 ÷ ${fr(TmS / 1000)} = ${fr(f)} Hz.`],
          recap: `f = ${fr(f)} Hz`,
          review: "Fréquence",
          takeaway: "f = 1/T. L'oreille humaine perçoit environ de 20 Hz à 20 000 Hz.",
        }),
        verify: () => close(f * (TmS / 1000), 1),
      };
    },
  }),
  gen({
    id: "p3-echo", unit: "3e-physique-signaux", title: "Mesurer une distance par écho", stage: "transfert",
    make: (r, id) => {
      const d = r.int(2, 40) * 17;
      const t = (2 * d) / SOUND;
      return {
        activity: ask({
          id, stage: "transfert", competence: "ana",
          context: `Face à une falaise, on crie et on entend l'écho ${fr(t)} s plus tard. Le son se propage à ${SOUND} m/s.`,
          prompt: "À quelle distance est la falaise, en mètres ?",
          expected: d, unit: "m",
          errors: [{ value: SOUND * t, code: "aller_retour", message: "Le son fait l'aller et le retour : on divise par 2.", type: "strategique" }],
          hint: "Pendant la durée mesurée, le son fait l'aller-retour.",
          solution: [`Distance parcourue par le son : ${SOUND} × ${fr(t)} = ${fr(SOUND * t)} m.`, `Aller-retour, donc falaise à ${fr(d)} m.`],
          recap: `${fr(d)} m`,
          review: "Écho",
          takeaway: "Pour un écho (ou un sonar), la durée mesurée correspond à un aller-retour.",
        }),
        verify: () => close((SOUND * t) / 2, d),
      };
    },
  }),

  /* ——— Seconde ——— */
  gen({
    id: "p2-concentration", unit: "2nde-physique-matiere", title: "Concentration en masse", stage: "application",
    make: (r, id) => {
      const m = r.pick([0.5, 1, 2, 2.5, 5, 10, 12, 20]), VmL = r.pick([50, 100, 200, 250, 500, 1000]);
      const C = m / (VmL / 1000);
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `On dissout ${fr(m)} g de sucre dans de l'eau pour obtenir ${VmL} mL de solution.`,
          prompt: "Quelle est la concentration en masse du sucre, en g/L ?",
          expected: C,
          errors: [{ value: m / VmL, code: "mL", message: "Le volume doit être en litres : 1 mL = 0,001 L.", type: "procedurale" }],
          hint: "Cm = m ÷ V, avec V en litres.",
          solution: [`V = ${VmL} mL = ${fr(VmL / 1000)} L.`, `Cm = ${fr(m)} ÷ ${fr(VmL / 1000)} = ${fr(C)} g/L.`],
          recap: `Cm = ${fr(C)} g/L`,
          review: "Concentration en masse",
          takeaway: "Cm = m(soluté) ÷ V(solution), en g/L.",
        }),
        verify: () => close(C * (VmL / 1000), m),
      };
    },
  }),
  gen({
    id: "p2-dilution", unit: "2nde-physique-matiere", title: "Dilution", stage: "transfert",
    make: (r, id) => {
      const C0 = r.pick([10, 20, 40, 50, 100]), F = r.pick([2, 4, 5, 10]), Vf = r.pick([50, 100, 200, 250]);
      const V0 = Vf / F;
      return {
        activity: ask({
          id, stage: "transfert", competence: "ana",
          context: `On veut préparer ${Vf} mL d'une solution de concentration ${fr(C0 / F)} g/L à partir d'une solution mère à ${C0} g/L.`,
          prompt: "Quel volume de solution mère faut-il prélever, en mL ?",
          expected: V0,
          errors: [{ value: Vf * F, code: "inverse", message: "Il faut moins de solution mère que le volume final : V₀ = Vf × Cf ÷ C₀.", type: "procedurale" }],
          hint: "La masse de soluté se conserve : C₀ × V₀ = Cf × Vf.",
          solution: [`V₀ = Cf × Vf ÷ C₀ = ${fr(C0 / F)} × ${Vf} ÷ ${C0} = ${fr(V0)} mL.`, `Facteur de dilution : ${F}.`],
          recap: `V₀ = ${fr(V0)} mL`,
          review: "Dilution",
          takeaway: "Lors d'une dilution, la masse de soluté se conserve : C₀V₀ = CfVf ; facteur de dilution F = C₀/Cf = Vf/V₀.",
        }),
        verify: () => close(C0 * V0, (C0 / F) * Vf),
      };
    },
  }),
  gen({
    id: "p2-noyau", unit: "2nde-physique-atome", title: "Composition d'un noyau", stage: "application",
    make: (r, id) => {
      const [el, A] = r.pick(ISOTOPES);
      const z = Z[el]!;
      return {
        activity: problem({
          id, stage: "application", competence: "app",
          context: `Le noyau de l'atome noté ${sup(A)}${el} a pour numéro atomique Z = ${z}.`,
          hint: "A est le nombre de nucléons (protons + neutrons) ; Z est le nombre de protons.",
          takeaway: "Noyau ᴬ_Z X : Z protons, A − Z neutrons ; l'atome neutre a Z électrons.",
          parts: [
            { prompt: "Combien de neutrons contient le noyau ?", expected: A - z, errors: [{ value: A, code: "A", message: "A compte tous les nucléons : on retire les protons." }, { value: A + z, code: "somme", message: "Neutrons = A − Z." }], hint: `${A} − ${z}.`, solution: [`N = A − Z = ${A} − ${z} = ${A - z}.`], recap: `${A - z} neutrons`, review: "Neutrons" },
            { prompt: "Combien d'électrons a l'atome neutre ?", expected: z, hint: "Un atome est électriquement neutre.", solution: [`Autant d'électrons que de protons : ${z}.`], recap: `${z} électrons`, review: "Électrons" },
          ],
        }),
        verify: () => A - z >= 0 && A >= z,
      };
    },
  }),
  gen({
    id: "p2-equilibrer", unit: "2nde-physique-transformations", title: "Ajuster une équation de réaction", stage: "application",
    make: (r, id) => {
      const rx = r.pick(REACTIONS);
      const all = [...rx.reactants, ...rx.products];
      const k = r.int(0, all.length - 1);
      const right = all[k]![0];
      const masked = equationMasked(rx, k);
      const label = formula(all[k]![1]);
      return {
        activity: ask({
          id, stage: "application", competence: "ana",
          context: `${rx.name.charAt(0).toUpperCase()}${rx.name.slice(1)} : ${masked}`,
          prompt: `Quel nombre stœchiométrique faut-il écrire devant ${label} ?`,
          expected: right,
          hint: "Compte les atomes de chaque élément de part et d'autre de la flèche.",
          solution: [`${equation(rx)}.`, "Chaque élément est conservé."],
          recap: `${right} ${label}`,
          review: "Ajuster une équation",
          takeaway: "On ajuste une équation avec les nombres stœchiométriques, sans jamais modifier les formules.",
        }),
        verify: () => balanced(rx) && masked.split("?").length === 2 && !balanced({ reactants: rx.reactants.map(([c, f], i) => [i === k ? c + 1 : c, f]), products: rx.products.map(([c, f], i) => [rx.reactants.length + i === k ? c + 1 : c, f]) }),
      };
    },
  }),
  gen({
    id: "p2-nucleaire", unit: "2nde-physique-transformations", title: "Conservation dans une désintégration", stage: "transfert",
    make: (r, id) => {
      const d = r.pick(DECAYS);
      const [pEl, pA] = d.parent, [cEl, cA] = d.child;
      const pZ = Z[pEl]!, cZ = Z[cEl]!;
      return {
        activity: ask({
          id, stage: "transfert", competence: "ana",
          context: `Le noyau ${sup(pA)}${pEl} (Z = ${pZ}) subit une désintégration ${d.type} : il donne un noyau ${sup(cA)}${cEl} et une particule ${d.type === "α" ? "α (⁴He, Z = 2)" : "β⁻ (électron, A = 0, Z = −1)"}.`,
          prompt: `Quel est le numéro atomique du noyau ${cEl} obtenu ?`,
          expected: cZ,
          errors: [{ value: d.type === "α" ? pZ + 2 : pZ - 1, code: "signe", message: "Le nombre de charge total se conserve : Z(père) = Z(fils) + Z(particule)." }],
          hint: "Lors d'une réaction nucléaire, A et Z se conservent.",
          solution: [`Conservation de Z : ${pZ} = Z + ${d.type === "α" ? "2" : "(−1)"}, donc Z = ${cZ}.`, `Conservation de A : ${pA} = ${cA} + ${d.type === "α" ? 4 : 0}.`],
          recap: `Z = ${cZ}`,
          review: "Réaction nucléaire",
          takeaway: "Dans une réaction nucléaire, le nombre de nucléons A et le nombre de charge Z se conservent.",
        }),
        verify: () => (d.type === "α" ? pA === cA + 4 && pZ === cZ + 2 : pA === cA && pZ === cZ - 1),
      };
    },
  }),
  gen({
    id: "p2-chrono", unit: "2nde-physique-mouvement", title: "Vitesse à partir d'une chronophotographie", stage: "application",
    make: (r, id) => {
      const dt = r.pick([0.04, 0.05, 0.1, 0.2]), dcm = r.pick([2, 4, 5, 6, 8, 10, 12]);
      const v = dcm / 100 / dt;
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Sur une chronophotographie, deux positions successives d'un palet sont séparées de ${dcm} cm ; les images sont prises toutes les ${fr(dt)} s.`,
          prompt: "Quelle est la vitesse du palet, en m/s ?",
          expected: round(v, 4), unit: "m/s",
          errors: [{ value: round(dcm / dt, 4), code: "cm", message: "Convertis la distance en mètres : 1 cm = 0,01 m.", type: "procedurale" }],
          hint: "v = distance entre deux positions ÷ durée entre deux images.",
          solution: [`d = ${dcm} cm = ${fr(dcm / 100)} m.`, `v = ${fr(dcm / 100)} ÷ ${fr(dt)} = ${fr(round(v, 4))} m/s.`],
          recap: `v = ${fr(round(v, 4))} m/s`,
          review: "Vitesse moyenne",
          takeaway: "Sur une chronophotographie : des positions régulièrement espacées traduisent un mouvement uniforme.",
        }),
        verify: () => close(v * dt * 100, dcm),
      };
    },
  }),
  gen({
    id: "p2-poids", unit: "2nde-physique-forces", title: "Poids et masse", stage: "rappel",
    make: (r, id) => {
      const m = r.pick([0.2, 0.5, 1, 2, 5, 10, 50]);
      const P = round(m * G_EARTH, 3);
      return {
        activity: ask({
          id, stage: "rappel", competence: "rea",
          context: "Sur Terre, g = 9,8 N/kg.",
          prompt: `Quel est le poids d'un objet de ${fr(m)} kg, en newtons ?`,
          expected: P,
          errors: [{ value: m, code: "masse", message: "Le poids est une force, en newtons : P = m × g." }],
          hint: "P = m × g.",
          solution: [`P = ${fr(m)} × 9,8 = ${fr(P)} N.`],
          recap: `P = ${fr(P)} N`,
          review: "Poids",
          takeaway: "Le poids est la force exercée par la Terre sur l'objet : vertical, vers le bas, de valeur P = m × g.",
        }),
        verify: () => close(P / G_EARTH, m),
      };
    },
  }),
  gen({
    id: "p2-periode", unit: "2nde-physique-son", title: "Période à partir de plusieurs oscillations", stage: "application",
    make: (r, id) => {
      const n = r.pick([3, 4, 5, 10]), TmS = r.pick([1, 2, 2.5, 4, 5]);
      const total = n * TmS;
      const f = 1000 / TmS;
      return {
        activity: problem({
          id, stage: "application", competence: "rea",
          context: `Sur l'écran d'un oscilloscope, ${n} périodes d'un signal sonore durent ${fr(total)} ms.`,
          hint: "Mesurer plusieurs périodes donne une mesure plus précise : on divise ensuite.",
          takeaway: "T = durée de n périodes ÷ n ; f = 1/T.",
          parts: [
            { prompt: "Quelle est la période, en ms ?", expected: TmS, errors: [{ value: total, code: "n", message: "Divise par le nombre de périodes." }], hint: `${fr(total)} ÷ ${n}.`, solution: [`T = ${fr(total)} ÷ ${n} = ${fr(TmS)} ms.`], recap: `T = ${fr(TmS)} ms`, review: "Période" },
            { prompt: "Quelle est la fréquence, en Hz ?", expected: f, errors: [{ value: 1 / TmS, code: "ms", message: "Convertis T en secondes avant de calculer 1/T." }], hint: "f = 1/T, T en secondes.", solution: [`f = 1 ÷ ${fr(TmS / 1000)} = ${fr(f)} Hz.`], recap: `f = ${fr(f)} Hz`, review: "Fréquence" },
          ],
        }),
        verify: () => close(total / n, TmS) && close(f * TmS, 1000),
      };
    },
  }),
  gen({
    id: "p2-refraction", unit: "2nde-physique-lumiere", title: "Loi de Snell-Descartes", stage: "application",
    make: (r, id) => {
      const [medium, n2] = r.pick([["l'eau", 1.33], ["le verre", 1.5], ["le diamant", 2.42], ["le plexiglas", 1.49]] as const);
      const i1 = r.pick([20, 30, 40, 45, 50, 60]);
      const i2 = (Math.asin(Math.sin((i1 * Math.PI) / 180) / n2) * 180) / Math.PI;
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Un rayon passe de l'air (n₁ = 1,00) dans ${medium} (n₂ = ${fr(n2)}) avec un angle d'incidence de ${i1}°.`,
          prompt: "Quel est l'angle de réfraction, au degré près ?",
          expected: Math.round(i2),
          tolerance: { abs: 0.5 },
          errors: [{ value: Math.round(i1 / n2), code: "angles", message: "La loi porte sur les sinus des angles : n₁ sin i₁ = n₂ sin i₂.", type: "conceptuelle" }],
          hint: "n₁ × sin i₁ = n₂ × sin i₂.",
          solution: [`sin i₂ = 1,00 × sin ${i1}° ÷ ${fr(n2)} ≈ ${fr(round(Math.sin((i1 * Math.PI) / 180) / n2, 3))}.`, `i₂ ≈ ${Math.round(i2)}°.`],
          recap: `i₂ ≈ ${Math.round(i2)}°`,
          review: "Réfraction",
          takeaway: "En entrant dans un milieu plus réfringent (n plus grand), le rayon se rapproche de la normale.",
        }),
        verify: () => close(1.0 * Math.sin((i1 * Math.PI) / 180), n2 * Math.sin((i2 * Math.PI) / 180)) && i2 < i1,
      };
    },
  }),
  gen({
    id: "p2-mailles", unit: "2nde-physique-circuits", title: "Lois des mailles et des nœuds", stage: "application",
    make: (r, id) => {
      const serie = r.chance(0.5);
      const a = r.pick([1.5, 2, 2.5, 3, 4.5]), total = a + r.pick([1.5, 3, 4.5, 6]);
      return {
        activity: ask({
          id, stage: "application", competence: "ana",
          context: serie ? `Deux lampes sont en série sur un générateur de ${fr(total)} V. La tension aux bornes de la première est ${fr(a)} V.` : `Deux lampes sont en dérivation. Le générateur débite ${fr(total)} A ; la première lampe est traversée par ${fr(a)} A.`,
          prompt: serie ? "Quelle est la tension aux bornes de la seconde lampe, en volts ?" : "Quelle intensité traverse la seconde lampe, en ampères ?",
          expected: round(total - a, 4), unit: serie ? "V" : "A",
          errors: [{ value: total, code: "meme", message: serie ? "En série, les tensions s'additionnent (loi des mailles)." : "En dérivation, les intensités s'additionnent (loi des nœuds)." }],
          hint: serie ? "Loi des mailles : la tension du générateur est la somme des tensions des dipôles en série." : "Loi des nœuds : l'intensité qui arrive à un nœud est égale à la somme des intensités qui en repartent.",
          solution: [`${fr(total)} − ${fr(a)} = ${fr(round(total - a, 4))} ${serie ? "V" : "A"}.`],
          recap: `${fr(round(total - a, 4))} ${serie ? "V" : "A"}`,
          review: serie ? "Loi des mailles" : "Loi des nœuds",
          takeaway: "Série : même intensité, tensions qui s'additionnent. Dérivation : même tension, intensités qui s'additionnent.",
        }),
        verify: () => close(a + round(total - a, 4), total),
      };
    },
  }),

  /* ——— Première ——— */
  gen({
    id: "p1-quantite", unit: "1re-physique-matiere", title: "Quantité de matière", stage: "application",
    make: (r, id) => {
      const [f, name] = r.pick([["H2O", "eau"], ["CO2", "dioxyde de carbone"], ["NaCl", "chlorure de sodium"], ["C6H12O6", "glucose"], ["CaCO3", "carbonate de calcium"], ["C2H6O", "éthanol"], ["CH4", "méthane"], ["NH3", "ammoniac"]] as const);
      const M = round(molarMass(f), 1);
      const n = r.pick([0.1, 0.2, 0.25, 0.5, 1, 2]);
      const m = round(n * M, 2);
      return {
        activity: problem({
          id, stage: "application", competence: "rea",
          context: `On pèse ${fr(m)} g de ${name} (${formula(f)}). Masses molaires atomiques : ${Object.keys(atoms(f)).map((el) => `M(${el}) = ${fr(ATOMIC_MASS[el]!)}`).join(" ; ")} g/mol.`,
          hint: "Calcule d'abord la masse molaire de la molécule.",
          takeaway: "n = m ÷ M ; la masse molaire d'une molécule est la somme des masses molaires de ses atomes.",
          parts: [
            { prompt: `Masse molaire de ${formula(f)} (g/mol) ?`, expected: M, tolerance: { abs: 0.051 }, hint: "Additionne les masses molaires de tous les atomes.", solution: [`M = ${Object.entries(atoms(f)).map(([el, k]) => `${k} × ${fr(ATOMIC_MASS[el]!)}`).join(" + ")} = ${fr(M)} g/mol.`], recap: `M = ${fr(M)} g/mol`, review: "Masse molaire" },
            { prompt: "Quantité de matière (mol) ?", expected: n, tolerance: { rel: 0.002 }, errors: [{ value: round(m * M, 2), code: "produit", message: "n = m ÷ M : on divise." }], hint: "n = m ÷ M.", solution: [`n = ${fr(m)} ÷ ${fr(M)} = ${fr(n)} mol.`], recap: `n = ${fr(n)} mol`, review: "Quantité de matière" },
          ],
        }),
        verify: () => close(molarMass(f), Object.entries(atoms(f)).reduce((s, [el, k]) => s + ATOMIC_MASS[el]! * k, 0)) && Math.abs(m / M - n) / n < 0.002,
      };
    },
  }),
  gen({
    id: "p1-gravitation", unit: "1re-physique-mouvement", title: "Force d'interaction gravitationnelle", stage: "application",
    make: (r, id) => {
      const G = 6.67e-11;
      const [what, m1, m2, d] = r.pick([["la Terre et la Lune", 5.97e24, 7.35e22, 3.84e8], ["le Soleil et la Terre", 1.99e30, 5.97e24, 1.5e11], ["la Terre et un satellite de 1 000 kg à 7 000 km du centre", 5.97e24, 1000, 7.0e6]] as const);
      const F = (G * m1 * m2) / (d * d);
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Entre ${what} : m₁ = ${sci(m1, 3)} kg, m₂ = ${sci(m2, 3)} kg, d = ${sci(d, 3)} m ; G = 6,67 × 10⁻¹¹ N·m²/kg².`,
          prompt: "Quelle est la valeur de la force d'attraction, en newtons ? (notation scientifique, 2 chiffres significatifs)",
          expected: F,
          tolerance: { rel: 0.05 },
          errors: [{ value: (G * m1 * m2) / d, code: "carre", message: "La distance est au carré dans la loi de Newton.", type: "procedurale" }],
          hint: "F = G × m₁ × m₂ ÷ d².",
          solution: [`F = 6,67 × 10⁻¹¹ × ${sci(m1, 3)} × ${sci(m2, 3)} ÷ (${sci(d, 3)})² ≈ ${sci(F, 1)} N.`],
          recap: `F ≈ ${sci(F, 1)} N`,
          review: "Loi de la gravitation",
          takeaway: "Loi de la gravitation universelle : F = G m₁ m₂ / d² ; la force est divisée par 4 quand la distance double.",
        }),
        verify: () => close(F * d * d, G * m1 * m2),
      };
    },
  }),
  gen({
    id: "p1-chute", unit: "1re-physique-energie", title: "Conservation de l'énergie mécanique", stage: "transfert",
    make: (r, id) => {
      const h = r.pick([1.25, 2.5, 5, 10, 20, 45, 80]);
      const v = Math.sqrt(2 * G_EARTH * h);
      return {
        activity: ask({
          id, stage: "transfert", competence: "ana",
          context: `Un objet est lâché sans vitesse d'une hauteur de ${fr(h)} m. On néglige les frottements ; g = 9,8 N/kg.`,
          prompt: "Quelle est sa vitesse en arrivant au sol, en m/s (au dixième) ?",
          expected: round(v, 1), unit: "m/s",
          tolerance: { abs: 0.051 },
          errors: [{ value: round(2 * G_EARTH * h, 1), code: "racine", message: "½mv² = mgh donne v² = 2gh : il reste la racine carrée.", type: "procedurale" }],
          hint: "L'énergie potentielle de pesanteur se transforme en énergie cinétique : mgh = ½mv².",
          solution: [`mgh = ½ m v², donc v = √(2gh).`, `v = √(2 × 9,8 × ${fr(h)}) ≈ ${fr(round(v, 1))} m/s.`],
          recap: `v ≈ ${fr(round(v, 1))} m/s`,
          review: "Énergie mécanique",
          takeaway: "Sans frottements, l'énergie mécanique Em = Ec + Epp se conserve ; la masse n'intervient pas dans la vitesse d'arrivée.",
        }),
        verify: () => close(0.5 * v * v, G_EARTH * h),
      };
    },
  }),
  gen({
    id: "p1-onde", unit: "1re-physique-ondes", title: "Longueur d'onde, célérité, fréquence", stage: "application",
    make: (r, id) => {
      const [what, v] = r.pick([["un son dans l'air", 340], ["une onde à la surface de l'eau", 0.5], ["un son dans l'eau", 1500]] as const);
      const f = r.pick(v < 1 ? [2, 4, 5, 10] : [170, 340, 440, 500, 1000, 1500]);
      const lambda = v / f;
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Pour ${what}, la célérité vaut ${fr(v)} m/s et la fréquence ${fr(f)} Hz.`,
          prompt: "Quelle est la longueur d'onde, en mètres ?",
          expected: round(lambda, 6), unit: "m",
          errors: [{ value: v * f, code: "produit", message: "λ = v ÷ f (ou v = λ × f).", type: "procedurale" }],
          hint: "v = λ × f.",
          solution: [`λ = v ÷ f = ${fr(v)} ÷ ${fr(f)} = ${fr(round(lambda, 6))} m.`],
          recap: `λ = ${fr(round(lambda, 6))} m`,
          review: "Longueur d'onde",
          takeaway: "Pour une onde périodique : v = λ × f ; λ est la distance parcourue par l'onde pendant une période.",
        }),
        verify: () => close(lambda * f, v),
      };
    },
  }),

  /* ——— Terminale ——— */
  gen({
    id: "pt-ph", unit: "Tle-physique-matiere", title: "Calculer un pH", stage: "application",
    make: (r, id) => {
      const k = r.int(1, 12), m = r.pick([1, 2, 2.5, 5]);
      const c = m * 10 ** -k;
      const pH = -Math.log10(c);
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Dans une solution, [H₃O⁺] = ${m === 1 ? `10${sup(-k)}` : `${fr(m)} × 10${sup(-k)}`} mol/L.`,
          prompt: "Quel est son pH, au centième ?",
          expected: round(pH, 2),
          tolerance: { abs: 0.0051 },
          errors: [{ value: round(Math.log10(c), 2), code: "signe", message: "pH = −log([H₃O⁺]) : le signe moins rend le pH positif.", type: "procedurale" }],
          hint: "pH = −log([H₃O⁺]).",
          solution: [`pH = −log(${m === 1 ? `10${sup(-k)}` : `${fr(m)} × 10${sup(-k)}`}) ≈ ${fr(round(pH, 2))}.`],
          recap: `pH ≈ ${fr(round(pH, 2))}`,
          review: "pH",
          takeaway: "pH = −log[H₃O⁺] ; quand [H₃O⁺] est divisée par 10, le pH augmente de 1.",
        }),
        verify: () => close(10 ** -pH, c),
      };
    },
  }),
  gen({
    id: "pt-newton", unit: "Tle-physique-mouvement", title: "Deuxième loi de Newton", stage: "application",
    make: (r, id) => {
      const m = r.pick([2, 5, 10, 50, 1000, 1200]), a = r.pick([0.5, 1, 2, 2.5, 3, 4]);
      const F = m * a;
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Un système de masse ${fr(m)} kg est soumis à une force résultante de ${fr(F)} N (forces de même direction).`,
          prompt: "Quelle est la valeur de son accélération, en m/s² ?",
          expected: a,
          errors: [{ value: F * m, code: "produit", message: "ΣF = m × a, donc a = ΣF ÷ m.", type: "procedurale" }],
          hint: "ΣF→ = m a→.",
          solution: [`a = ΣF ÷ m = ${fr(F)} ÷ ${fr(m)} = ${fr(a)} m/s².`],
          recap: `a = ${fr(a)} m/s²`,
          review: "Deuxième loi de Newton",
          takeaway: "Deuxième loi de Newton : ΣF→ = m a→ dans un référentiel galiléen.",
        }),
        verify: () => close(m * a, F),
      };
    },
  }),
  gen({
    id: "pt-thermo", unit: "Tle-physique-thermo", title: "Énergie pour chauffer de l'eau", stage: "application",
    make: (r, id) => {
      const m = r.pick([0.25, 0.5, 1, 1.5, 2]), T1 = r.pick([10, 15, 20]), T2 = r.pick([40, 60, 80, 100]);
      const c = 4180;
      const Q = m * c * (T2 - T1);
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `On chauffe ${fr(m)} kg d'eau de ${T1} °C à ${T2} °C. Capacité thermique massique de l'eau : c = 4 180 J·kg⁻¹·°C⁻¹.`,
          prompt: "Quelle énergie faut-il fournir, en kJ ?",
          expected: round(Q / 1000, 3),
          errors: [{ value: round((m * c * T2) / 1000, 3), code: "delta", message: "On utilise la variation de température ΔT = T₂ − T₁.", type: "procedurale" }, { value: round(Q, 3), code: "J", message: "C'est la valeur en joules ; la réponse est en kJ." }],
          hint: "Q = m × c × ΔT.",
          solution: [`Q = ${fr(m)} × 4 180 × (${T2} − ${T1}) = ${fr(Q)} J = ${fr(round(Q / 1000, 3))} kJ.`],
          recap: `Q = ${fr(round(Q / 1000, 3))} kJ`,
          review: "Transfert thermique",
          takeaway: "Pour chauffer un corps sans changement d'état : Q = m × c × ΔT.",
        }),
        verify: () => close(Q / (m * c), T2 - T1),
      };
    },
  }),
  gen({
    id: "pt-diffraction", unit: "Tle-physique-ondes", title: "Écart angulaire de diffraction", stage: "application",
    make: (r, id) => {
      const lambdaNm = r.pick([450, 532, 600, 633, 650]), aUm = r.pick([20, 40, 50, 80, 100, 200]);
      const theta = (lambdaNm * 1e-9) / (aUm * 1e-6);
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Un laser de longueur d'onde ${lambdaNm} nm éclaire une fente de largeur ${aUm} µm.`,
          prompt: "Quel est l'écart angulaire θ = λ/a, en milliradians (au dixième) ?",
          expected: round(theta * 1000, 1),
          tolerance: { abs: 0.051 },
          errors: [{ value: round((aUm * 1e-6) / (lambdaNm * 1e-9), 1), code: "inverse", message: "θ = λ ÷ a.", type: "procedurale" }],
          hint: "Convertis λ et a en mètres : 1 nm = 10⁻⁹ m, 1 µm = 10⁻⁶ m.",
          solution: [`θ = ${lambdaNm} × 10⁻⁹ ÷ (${aUm} × 10⁻⁶) = ${sci(theta, 3)} rad ≈ ${fr(round(theta * 1000, 1))} mrad.`],
          recap: `θ ≈ ${fr(round(theta * 1000, 1))} mrad`,
          review: "Diffraction",
          takeaway: "θ = λ/a : la diffraction est d'autant plus marquée que l'ouverture est petite devant la longueur d'onde.",
        }),
        verify: () => close(theta * aUm * 1e-6, lambdaNm * 1e-9),
      };
    },
  }),

  /* ——— Enseignement scientifique ——— */
  gen({
    id: "es-wien", unit: "1re-ens-sci-soleil", title: "Loi de Wien", stage: "application",
    make: (r, id) => {
      const [star, T] = r.pick([["Soleil", 5800], ["Bételgeuse", 3500], ["Sirius", 9900], ["Rigel", 12000], ["une étoile naine rouge", 3000]] as const);
      const lambda = 2.898e-3 / T;
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `La température de surface de ${star} est d'environ ${fr(T)} K. Loi de Wien : λmax × T = 2,898 × 10⁻³ m·K.`,
          prompt: "Quelle est la longueur d'onde de son maximum d'émission, en nanomètres (à l'unité) ?",
          expected: Math.round(lambda * 1e9),
          tolerance: { abs: 0.51 },
          errors: [{ value: Math.round(2.898e-3 * T), code: "produit", message: "λmax = 2,898 × 10⁻³ ÷ T.", type: "procedurale" }],
          hint: "λmax = 2,898 × 10⁻³ ÷ T, puis convertis en nm (1 nm = 10⁻⁹ m).",
          solution: [`λmax = 2,898 × 10⁻³ ÷ ${fr(T)} ≈ ${sci(lambda, 3)} m ≈ ${Math.round(lambda * 1e9)} nm.`],
          recap: `λmax ≈ ${Math.round(lambda * 1e9)} nm`,
          review: "Loi de Wien",
          takeaway: "Plus une étoile est chaude, plus son maximum d'émission est à courte longueur d'onde (étoiles bleues chaudes, rouges plus froides).",
        }),
        verify: () => close(lambda * T, 2.898e-3),
      };
    },
  }),
  gen({
    id: "es-eratosthene", unit: "1re-ens-sci-terre", title: "La mesure d'Ératosthène", stage: "transfert",
    make: (r, id) => {
      const angle = r.pick([7.2, 6, 4.8, 9]), d = r.pick([800, 667, 534, 1000]);
      const C = (360 / angle) * d;
      return {
        activity: ask({
          id, stage: "transfert", competence: "ana",
          context: `Deux villes sur le même méridien sont distantes de ${d} km. À midi le même jour, les rayons du Soleil font entre elles un écart d'angle de ${fr(angle)}°.`,
          prompt: "Quelle circonférence de la Terre en déduit-on, en km (à l'unité) ?",
          expected: Math.round(C),
          tolerance: { abs: 0.51 },
          errors: [{ value: Math.round((angle / 360) * d), code: "inverse", message: "L'arc de " + fr(angle) + "° correspond à " + d + " km : le tour complet (360°) est " + fr(round(360 / angle, 2)) + " fois plus long." }],
          hint: "La longueur d'un arc est proportionnelle à son angle : 360° correspondent à la circonférence.",
          solution: [`360 ÷ ${fr(angle)} = ${fr(round(360 / angle, 4))}.`, `C = ${fr(round(360 / angle, 4))} × ${d} ≈ ${fr(Math.round(C))} km.`],
          recap: `C ≈ ${fr(Math.round(C))} km`,
          review: "Méthode d'Ératosthène",
          takeaway: "Ératosthène (IIIe siècle av. J.-C.) a estimé la circonférence terrestre par proportionnalité entre angle et longueur d'arc.",
        }),
        verify: () => close((C * angle) / 360, d),
      };
    },
  }),
  gen({
    id: "es-octave", unit: "1re-ens-sci-son", title: "Octaves et harmoniques", stage: "application",
    make: (r, id) => {
      const f0 = r.pick([110, 220, 262, 330, 440]), kind = r.int(0, 1), n = r.int(2, 5);
      const res = kind === 0 ? f0 * 2 ** (n - 1) : f0 * n;
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: kind === 0 ? `Une note a une fréquence de ${f0} Hz.` : `Un son a une fréquence fondamentale de ${f0} Hz.`,
          prompt: kind === 0 ? `Quelle est la fréquence de la même note ${n - 1} octave${n > 2 ? "s" : ""} plus haut, en Hz ?` : `Quelle est la fréquence de son harmonique de rang ${n}, en Hz ?`,
          expected: res,
          errors: [{ value: kind === 0 ? f0 * n : f0 * 2 ** (n - 1), code: "confusion", message: kind === 0 ? "Monter d'une octave double la fréquence : on multiplie par 2 à chaque octave." : "L'harmonique de rang n a pour fréquence n × f₁." }],
          hint: kind === 0 ? "Monter d'une octave, c'est multiplier la fréquence par 2." : "fₙ = n × f₁.",
          solution: [kind === 0 ? `${f0} × 2${sup(n - 1)} = ${res} Hz.` : `f${sub(n)} = ${n} × ${f0} = ${res} Hz.`],
          recap: `${res} Hz`,
          review: kind === 0 ? "Octave" : "Harmoniques",
          takeaway: "Une octave correspond à un doublement de fréquence ; les harmoniques d'un son ont des fréquences multiples de la fondamentale.",
        }),
        verify: () => (kind === 0 ? res / f0 === 2 ** (n - 1) : res / f0 === n),
      };
    },
  }),
  gen({
    id: "es-rendement", unit: "Tle-ens-sci-energies", title: "Rendement d'une conversion", stage: "application",
    make: (r, id) => {
      const [conv, eta] = r.pick([["une centrale thermique", 35], ["un panneau photovoltaïque", 20], ["une éolienne", 40], ["un moteur électrique", 90], ["une ampoule à LED", 30]] as const);
      const Ein = r.pick([100, 200, 500, 1000, 2500]);
      const Eout = (Ein * eta) / 100;
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `${conv.charAt(0).toUpperCase()}${conv.slice(1)} reçoit ${fr(Ein)} kJ et fournit ${fr(Eout)} kJ d'énergie utile.`,
          prompt: "Quel est son rendement, en % ?",
          expected: eta,
          errors: [{ value: round((Ein / Eout) * 100, 2), code: "inverse", message: "η = énergie utile ÷ énergie reçue : il est toujours inférieur à 100 %.", type: "conceptuelle" }],
          hint: "η = E(utile) ÷ E(reçue).",
          solution: [`η = ${fr(Eout)} ÷ ${fr(Ein)} = ${fr(eta / 100)}, soit ${eta} %.`],
          recap: `η = ${eta} %`,
          review: "Rendement",
          takeaway: "Rendement = énergie utile ÷ énergie reçue ; le reste est dissipé, souvent sous forme de chaleur.",
        }),
        verify: () => close((Eout / Ein) * 100, eta),
      };
    },
  }),
];

