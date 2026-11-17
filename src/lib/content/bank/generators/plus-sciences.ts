import { ask, classify, gen, mcq, mockTable, problem } from "../build";
import { evaluate } from "../evaluate";
import { close, fr, round } from "../format";
import type { Generator } from "../types";

/**
 * Compléments de physique-chimie, d'enseignement scientifique, de SNT, de NSI et de SI.
 * Les constantes sont les valeurs usuelles des programmes, rappelées dans chaque énoncé.
 */

const G = 9.8;

/** Coordonnées réelles de grandes villes françaises (degrés décimaux, arrondis au centième ; ouest en négatif). */
const CITIES: [name: string, lat: number, lon: number][] = [
  ["Paris", 48.86, 2.35], ["Brest", 48.39, -4.49], ["Marseille", 43.3, 5.37], ["Lille", 50.63, 3.06],
  ["Strasbourg", 48.57, 7.75], ["Bordeaux", 44.84, -0.58], ["Nice", 43.71, 7.26], ["Toulouse", 43.6, 1.44],
  ["Nantes", 47.22, -1.55], ["Lyon", 45.76, 4.84], ["Rennes", 48.11, -1.68], ["Montpellier", 43.61, 3.88],
];
const coord = (lat: number, lon: number) => `${fr(lat)}° N ; ${fr(Math.abs(lon))}° ${lon < 0 ? "O" : "E"}`;

/** Interactions de contact ou à distance. */
const INTERACTIONS: [string, number][] = [
  ["Le pied frappe le ballon", 0], ["Le vent pousse la voile d'un bateau", 0], ["La main pousse une porte", 0], ["Le sol soutient une chaise", 0],
  ["Une corde tire un traîneau", 0], ["La raquette renvoie la balle", 0], ["La Terre attire la Lune", 1], ["Un aimant attire un clou", 1],
  ["Une règle frottée attire des petits morceaux de papier", 1], ["La Terre attire une pomme qui tombe", 1], ["Le Soleil attire la Terre", 1], ["Deux aimants se repoussent sans se toucher", 1],
];

/** Masses volumiques usuelles, en g/cm³ (valeurs arrondies des tables). */
const DENSITY: [string, number][] = [["l'aluminium", 2.7], ["le fer", 7.9], ["le cuivre", 8.96], ["l'or", 19.3], ["le plomb", 11.3], ["la glace", 0.92], ["l'huile d'olive", 0.92], ["l'eau", 1]];

/** Astres : masse (kg), rayon (m), intensité de la pesanteur à la surface (N/kg, valeur de référence arrondie). */
const BODIES: [string, number, number, number][] = [
  ["la Terre", 5.97e24, 6.37e6, 9.8], ["Mars", 6.42e23, 3.39e6, 3.7], ["la Lune", 7.35e22, 1.74e6, 1.6],
  ["Vénus", 4.87e24, 6.05e6, 8.9], ["Mercure", 3.3e23, 2.44e6, 3.7],
];
const sci = (x: number, d = 2) => {
  const e = Math.floor(Math.log10(Math.abs(x)));
  const m = round(x / 10 ** e, d);
  const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
  return `${fr(m)} × 10${String(e).split("").map((c) => SUP[c]).join("")}`;
};

export const PLUS_SCIENCES: Generator[] = [
  /* ——— 3e : mouvement et vitesse ——— */
  gen({
    id: "p3-vitesse-moyenne", unit: "3e-physique-vitesse", title: "Calculer une vitesse moyenne en km/h", stage: "application",
    make: (r, id) => {
      const combos: [number, number][] = [];
      for (const d of [5, 12, 18, 30, 45, 60, 90, 150, 240]) for (const t of [15, 30, 45, 60, 90, 120]) if ((60 * d) % t === 0) combos.push([d, t]);
      const [d, t] = r.pick(combos);
      const v = (60 * d) / t;
      const [who] = r.pick([["Un cycliste"], ["Un train régional"], ["Une voiture"], ["Un coureur"], ["Un bus"]] as const);
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `${who} parcourt ${d} km en ${t} min.`,
          prompt: "Quelle est sa vitesse moyenne, en km/h ?",
          expected: v, unit: "km/h", unitMustMatch: true,
          errors: [{ value: round(d / t, 6), code: "minutes", message: "Tu as obtenu des kilomètres par minute : convertis la durée en heures.", type: "procedurale" }],
          hint: "v = d ÷ t, avec t en heures.",
          partHint: `${t} min = ${fr(t / 60)} h.`,
          solution: [`t = ${t} min = ${fr(t / 60)} h.`, `v = ${d} ÷ ${fr(t / 60)} = ${fr(v)} km/h.`],
          recap: `v = ${fr(v)} km/h`,
          review: "Vitesse moyenne",
          takeaway: "Vitesse moyenne = distance ÷ durée ; pour des km/h, la durée doit être en heures.",
        }),
        verify: () => close((v * t) / 60, d),
      };
    },
  }),
  gen({
    id: "p3-nature-mouvement", unit: "3e-physique-vitesse", title: "Reconnaître la nature d'un mouvement", stage: "rappel",
    make: (r, id) => {
      const kind = r.pick(["uniforme", "accéléré", "ralenti"] as const);
      const start = r.int(2, 6), step = r.int(1, 3);
      const gaps = Array.from({ length: 5 }, (_, i) => (kind === "uniforme" ? start + step : kind === "accéléré" ? start + i * step : start + (4 - i) * step));
      const labels = { uniforme: "Rectiligne uniforme", accéléré: "Rectiligne accéléré", ralenti: "Rectiligne ralenti" } as const;
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "ana",
          stimulus: mockTable("Chronophotographie : distance parcourue entre deux images successives (même durée entre les images)", ["Intervalle", "1", "2", "3", "4", "5"], [["Distance (cm)", ...gaps.map(String)]]),
          prompt: "Le point étudié se déplace en ligne droite. Quelle est la nature de son mouvement ?",
          answer: { text: labels[kind], feedback: kind === "uniforme" ? "Les distances sont égales pour des durées égales : la vitesse est constante." : kind === "accéléré" ? "Les distances augmentent pour des durées égales : la vitesse augmente." : "Les distances diminuent pour des durées égales : la vitesse diminue." },
          wrong: [
            ...(Object.keys(labels) as (keyof typeof labels)[]).filter((k) => k !== kind).map((k) => ({ text: labels[k], feedback: "Compare les distances parcourues pendant des durées égales." })),
            { text: "Circulaire uniforme", feedback: "La trajectoire est une droite : le mouvement est rectiligne." },
          ],
          hint: "Les images sont prises à intervalles de temps égaux : compare les distances.",
          hints: ["Distances égales : vitesse constante.", `Les distances valent ${gaps.join(" ; ")} cm.`],
          solution: [`Distances : ${gaps.join(" ; ")} cm.`, `Elles sont ${kind === "uniforme" ? "égales" : kind === "accéléré" ? "croissantes" : "décroissantes"} : mouvement ${labels[kind].toLowerCase()}.`],
          takeaway: "Sur une chronophotographie, l'écart entre deux positions successives renseigne sur la vitesse.",
        }),
        verify: () => {
          const diffs = gaps.slice(1).map((g, i) => g - gaps[i]!);
          return kind === "uniforme" ? diffs.every((x) => x === 0) : kind === "accéléré" ? diffs.every((x) => x > 0) : diffs.every((x) => x < 0);
        },
      };
    },
  }),

  /* ——— 3e : forces et poids ——— */
  gen({
    id: "p3-masse-depuis-poids", unit: "3e-physique-forces", title: "Retrouver une masse à partir d'un poids", stage: "application",
    make: (r, id) => {
      const [astre, g] = r.pick([["la Terre", 9.8], ["la Lune", 1.6], ["Mars", 3.7]] as const);
      const m = r.pick([2, 5, 10, 15, 20, 40, 50, 60, 75, 80, 100]);
      const P = round(m * g, 2);
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Sur ${astre}, l'intensité de la pesanteur vaut g = ${fr(g)} N/kg. Un objet y a un poids de ${fr(P)} N.`,
          prompt: "Quelle est sa masse, en kilogrammes ?",
          expected: m,
          errors: [{ value: round(P * g, 2), code: "produit", message: "P = m × g, donc m = P ÷ g : on divise.", type: "procedurale" }, { value: P, code: "confusion", message: "Le poids (en N) et la masse (en kg) sont deux grandeurs différentes.", type: "conceptuelle" }],
          hint: "P = m × g, donc m = P ÷ g.",
          partHint: `Calcule ${fr(P)} ÷ ${fr(g)}.`,
          solution: [`m = ${fr(P)} ÷ ${fr(g)} = ${m} kg.`],
          recap: `m = ${m} kg`,
          review: "Poids et masse",
          takeaway: "La masse d'un objet ne change pas d'un astre à l'autre ; son poids, si.",
        }),
        verify: () => close(m * g, P),
      };
    },
  }),
  gen({
    id: "p3-interactions", unit: "3e-physique-forces", title: "Interaction de contact ou à distance", stage: "rappel",
    make: (r, id) => {
      let items = r.sample(INTERACTIONS, 5);
      if (new Set(items.map((i) => i[1])).size < 2) items = [...items.slice(0, 4), INTERACTIONS.find((i) => i[1] !== items[0]![1])!];
      return {
        activity: classify(r, {
          id, stage: "rappel", competence: "app",
          prompt: "Chaque action est-elle une action de contact ou une action à distance ?",
          categories: ["Action de contact", "Action à distance"],
          items: items.map(([text, cat]) => ({ text, category: cat, feedback: cat === 0 ? "Les deux objets se touchent : action de contact." : "Les objets agissent l'un sur l'autre sans se toucher : action à distance." })),
          hint: "Demande-toi si les deux objets se touchent.",
          hints: ["Gravitation, magnétisme et électricité statique agissent à distance.", `Par exemple : « ${items[0]![0]} » est une action ${items[0]![1] === 0 ? "de contact" : "à distance"}.`],
          solution: items.map(([text, cat]) => `${text} : ${cat === 0 ? "contact" : "à distance"}.`),
          takeaway: "Une action de contact suppose que les objets se touchent ; une action à distance s'exerce sans contact.",
        }),
        verify: () => items.every(([text, cat]) => INTERACTIONS.find((i) => i[0] === text)?.[1] === cat) && new Set(items.map((i) => i[0])).size === items.length,
      };
    },
  }),

  /* ——— 3e : énergie ——— */
  gen({
    id: "p3-epp", unit: "3e-physique-energie", title: "Calculer une énergie de position", stage: "application",
    make: (r, id) => {
      const m = r.pick([0.5, 1, 2, 5, 10, 50, 60, 70]), h = r.pick([2, 3, 5, 10, 20, 50]);
      const E = round(m * G * h, 2);
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Un objet de masse ${fr(m)} kg est situé à ${h} m au-dessus du sol. On prend g = 9,8 N/kg.`,
          prompt: "Quelle est son énergie de position, en joules ? (référence : le sol)",
          expected: E,
          errors: [{ value: m * h, code: "sans_g", message: "N'oublie pas g : Ep = m × g × h.", type: "procedurale" }],
          hint: "Ep = m × g × h.",
          partHint: `Calcule ${fr(m)} × 9,8 × ${h}.`,
          solution: [`Ep = ${fr(m)} × 9,8 × ${h} = ${fr(E)} J.`],
          recap: `Ep = ${fr(E)} J`,
          review: "Énergie de position",
          takeaway: "L'énergie de position augmente avec la masse et avec l'altitude : Ep = m × g × h.",
        }),
        verify: () => close(E / (m * h), G),
      };
    },
  }),
  gen({
    id: "p3-ec-facteur", unit: "3e-physique-energie", title: "Effet de la vitesse sur l'énergie cinétique", stage: "rappel", capacity: 5,
    make: (r, id) => {
      const [k, text] = r.pick([[2, "double"], [3, "triple"], [4, "quadruple"], [0.5, "est divisée par 2"], [1.5, "est multipliée par 1,5"]] as const);
      const f = k * k;
      const verb = (x: number) => (x >= 1 ? `multipliée par ${fr(x)}` : `divisée par ${fr(1 / x)}`);
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "app",
          prompt: `La vitesse d'un véhicule ${text}. Son énergie cinétique est…`,
          answer: { text: verb(f), feedback: `Ec = ½ m v² : la vitesse est au carré, donc l'énergie est ${verb(f)}.` },
          wrong: [
            { text: verb(k), feedback: "L'énergie cinétique n'est pas proportionnelle à la vitesse : elle dépend de son carré." },
            { text: verb(k * k * k), feedback: "La vitesse est au carré dans Ec = ½ m v², pas au cube." },
            { text: "inchangée", feedback: "La masse ne change pas, mais la vitesse, si : l'énergie cinétique change." },
          ],
          hint: "Ec = ½ × m × v².",
          hints: ["Si v est multipliée par k, v² est multipliée par k².", `Ici k = ${fr(k)}.`],
          solution: [`v est multipliée par ${fr(k)}, donc v² par ${fr(f)}.`, `Ec est ${verb(f)}.`],
          takeaway: "Doubler sa vitesse multiplie par 4 son énergie cinétique, et donc la distance de freinage.",
        }),
        verify: () => close((0.5 * 1000 * (k * 20) ** 2) / (0.5 * 1000 * 20 ** 2), f),
      };
    },
  }),

  /* ——— 3e : électricité ——— */
  gen({
    id: "p3-energie-kwh", unit: "3e-physique-electricite", title: "Énergie consommée en kilowattheures", stage: "application",
    make: (r, id) => {
      const [device, P] = r.pick([["Un radiateur", 1500], ["Un four", 2500], ["Une bouilloire", 2000], ["Un sèche-cheveux", 1200], ["Une lampe", 10], ["Un téléviseur", 100], ["Un ordinateur portable", 50]] as const);
      const t = r.pick([0.5, 1, 2, 3, 4, 5, 8, 10]);
      const E = (P * t) / 1000;
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `${device} de puissance ${fr(P)} W fonctionne pendant ${fr(t)} h.`,
          prompt: "Quelle énergie consomme-t-il, en kilowattheures ?",
          expected: E,
          errors: [{ value: P * t, code: "wh", message: "Tu as obtenu des wattheures. 1 kWh = 1 000 Wh.", type: "procedurale" }],
          hint: "E = P × t, avec P en kW et t en h.",
          partHint: `${fr(P)} W = ${fr(P / 1000)} kW.`,
          solution: [`P = ${fr(P / 1000)} kW.`, `E = ${fr(P / 1000)} × ${fr(t)} = ${fr(E)} kWh.`],
          recap: `E = ${fr(E)} kWh`,
          review: "Énergie électrique",
          takeaway: "E = P × t : en kW et en h, on obtient des kWh, l'unité des factures d'électricité.",
        }),
        verify: () => close(E * 1000, P * t),
      };
    },
  }),
  gen({
    id: "p3-intensite", unit: "3e-physique-electricite", title: "Calculer une intensité à partir de la puissance", stage: "application",
    make: (r, id) => {
      const I = r.pick([0.5, 1, 2, 4, 5, 8, 10]);
      const P = 230 * I;
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Un appareil de puissance ${fr(P)} W est branché sur le secteur (U = 230 V).`,
          prompt: "Quelle est l'intensité du courant qui le traverse, en ampères ?",
          expected: I, unit: "A",
          errors: [{ value: P * 230, code: "produit", message: "P = U × I, donc I = P ÷ U.", type: "procedurale" }, { value: round(230 / P, 6), code: "inverse", message: "I = P ÷ U, pas U ÷ P.", type: "procedurale" }],
          hint: "P = U × I.",
          partHint: `I = ${fr(P)} ÷ 230.`,
          solution: [`I = P ÷ U = ${fr(P)} ÷ 230 = ${fr(I)} A.`],
          recap: `I = ${fr(I)} A`,
          review: "Puissance électrique",
          takeaway: "P = U × I : plus un appareil est puissant, plus l'intensité qui le traverse est grande.",
        }),
        verify: () => close(230 * I, P),
      };
    },
  }),

  /* ——— 4e : masse volumique ——— */
  gen({
    id: "p4-masse-depuis-volume", unit: "4e-physique-masse", title: "Calculer une masse avec la masse volumique", stage: "application",
    make: (r, id) => {
      const [name, rho] = r.pick(DENSITY);
      const V = r.pick([10, 20, 25, 50, 100, 200, 250, 500]);
      const m = round(rho * V, 2);
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `La masse volumique de ${name} vaut environ ${fr(rho)} g/cm³.`,
          prompt: `Quelle est la masse de ${V} cm³ ${name.startsWith("l'") ? `d'${name.slice(2)}` : `de ${name.replace(/^(le|la) /, "")}`}, en grammes ?`,
          expected: m,
          errors: [...(rho !== 1 ? [{ value: round(V / rho, 4), code: "division", message: "ρ = m ÷ V, donc m = ρ × V : on multiplie.", type: "procedurale" as const }] : [])],
          hint: "ρ = m ÷ V, donc m = ρ × V.",
          partHint: `Calcule ${fr(rho)} × ${V}.`,
          solution: [`m = ${fr(rho)} × ${V} = ${fr(m)} g.`],
          recap: `m = ${fr(m)} g`,
          review: "Masse volumique",
          takeaway: "La masse volumique relie masse et volume : m = ρ × V.",
        }),
        verify: () => close(m / V, rho),
      };
    },
  }),

  /* ——— 2nde : circuits ——— */
  gen({
    id: "p2-ohm-ma", unit: "2nde-physique-circuits", title: "Loi d'Ohm avec des milliampères", stage: "application",
    make: (r, id) => {
      const R = r.pick([10, 47, 100, 150, 220, 330, 470, 1000]), I = r.pick([5, 10, 20, 25, 50]);
      const U = round((R * I) / 1000, 4);
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Un conducteur ohmique de résistance ${fr(R)} Ω est parcouru par un courant de ${I} mA.`,
          prompt: "Quelle est la tension à ses bornes, en volts ?",
          expected: U, unit: "V",
          errors: [{ value: R * I, code: "milli", message: "Convertis d'abord l'intensité en ampères : 1 mA = 0,001 A.", type: "procedurale" }],
          hint: "U = R × I, avec I en ampères.",
          partHint: `${I} mA = ${fr(I / 1000)} A.`,
          solution: [`I = ${fr(I / 1000)} A.`, `U = ${fr(R)} × ${fr(I / 1000)} = ${fr(U)} V.`],
          recap: `U = ${fr(U)} V`,
          review: "Loi d'Ohm",
          takeaway: "Loi d'Ohm : U = R × I, avec U en volts, R en ohms et I en ampères.",
        }),
        verify: () => close(U / R, I / 1000),
      };
    },
  }),
  gen({
    id: "p2-serie", unit: "2nde-physique-circuits", title: "Résistance équivalente en série", stage: "rappel",
    make: (r, id) => {
      const rs = r.sample([10, 22, 33, 47, 68, 100, 150, 220, 330, 470], r.int(2, 3));
      const Req = rs.reduce((a, b) => a + b, 0);
      return {
        activity: ask({
          id, stage: "rappel", competence: "rea",
          context: `On branche en série des conducteurs ohmiques de résistances ${rs.map((x) => `${x} Ω`).join(", ")}.`,
          prompt: "Quelle est la résistance équivalente, en ohms ?",
          expected: Req,
          errors: [{ value: Math.max(...rs), code: "max", message: "En série, les résistances s'additionnent.", type: "conceptuelle" }],
          hint: "En série, les résistances s'additionnent.",
          partHint: `Additionne ${rs.join(", ")}.`,
          solution: [`R = ${rs.join(" + ")} = ${Req} Ω.`],
          recap: `R = ${Req} Ω`,
          review: "Association en série",
          takeaway: "Des conducteurs ohmiques en série équivalent à un seul, de résistance égale à la somme des résistances.",
        }),
        verify: () => evaluate(rs.join(" + ")) === Req,
      };
    },
  }),

  /* ——— SNT : localisation ——— */
  gen({
    id: "snt-trajet", unit: "2nde-snt-localisation", title: "Durée d'un trajet calculée par une application", stage: "application",
    make: (r, id) => {
      const combos: [number, number][] = [];
      for (const d of [3, 5, 6, 9, 10, 12, 15, 18, 20, 30, 45]) for (const v of [4, 5, 12, 15, 18, 20, 30, 50, 90]) if ((60 * d) % v === 0 && (100 * d) % v === 0 && (60 * d) / v <= 180) combos.push([d, v]);
      const [d, v] = r.pick(combos);
      const t = (60 * d) / v;
      const mode = v <= 5 ? "à pied" : v <= 20 ? "à vélo" : "en voiture";
      return {
        activity: ask({
          id, stage: "application", competence: "sn-donnees",
          context: `Une application de cartographie calcule un itinéraire de ${d} km ${mode}, avec une vitesse moyenne de ${v} km/h.`,
          prompt: "Quelle durée de trajet affiche-t-elle, en minutes ?",
          expected: t,
          errors: [...(round(d / v, 6) !== t ? [{ value: round(d / v, 6), code: "heures", message: "Tu as obtenu une durée en heures : convertis-la en minutes.", type: "procedurale" as const }] : [])],
          hint: "t = d ÷ v, puis on convertit les heures en minutes.",
          partHint: `${d} ÷ ${v} = ${fr(d / v)} h.`,
          solution: [`t = ${d} ÷ ${v} = ${fr(d / v)} h.`, `${fr(d / v)} × 60 = ${fr(t)} min.`],
          recap: `${fr(t)} min`,
          review: "Calcul d'itinéraire",
          takeaway: "Une application de navigation estime la durée d'un trajet à partir de la distance et d'une vitesse moyenne.",
        }),
        verify: () => close((t / 60) * v, d),
      };
    },
  }),
  gen({
    id: "snt-echelle", unit: "2nde-snt-localisation", title: "Utiliser l'échelle d'une carte", stage: "rappel",
    make: (r, id) => {
      const scale = r.pick([10000, 20000, 25000, 50000, 100000]), cm = r.pick([2, 3, 4, 5, 6, 8, 10, 12]);
      const km = (cm * scale) / 100000;
      return {
        activity: ask({
          id, stage: "rappel", competence: "sn-donnees",
          context: `Sur une carte à l'échelle 1/${fr(scale)}, deux points sont distants de ${cm} cm.`,
          prompt: "Quelle est la distance réelle, en kilomètres ?",
          expected: km,
          errors: [{ value: (cm * scale) / 100, code: "metres", message: "Tu as obtenu des mètres : 1 km = 1 000 m.", type: "procedurale" }],
          hint: `1 cm sur la carte représente ${fr(scale)} cm en réalité.`,
          partHint: `Multiplie ${cm} par ${fr(scale)}, puis convertis les centimètres en kilomètres.`,
          solution: [`${cm} × ${fr(scale)} = ${fr(cm * scale)} cm.`, `${fr(cm * scale)} cm = ${fr(km)} km.`],
          recap: `${fr(km)} km`,
          review: "Échelle d'une carte",
          takeaway: "Échelle 1/n : 1 cm sur la carte représente n cm sur le terrain ; 1 km = 100 000 cm.",
        }),
        verify: () => close(km * 100000, cm * scale),
      };
    },
  }),
  gen({
    id: "snt-coordonnees", unit: "2nde-snt-localisation", title: "Lire des coordonnées géographiques", stage: "application",
    make: (r, id) => {
      const picked = r.sample(CITIES, 4);
      const crit = r.pick(["nord", "sud", "est", "ouest"] as const);
      const score = (c: (typeof CITIES)[number]) => (crit === "nord" ? c[1] : crit === "sud" ? -c[1] : crit === "est" ? c[2] : -c[2]);
      const best = [...picked].sort((a, b) => score(b) - score(a))[0]!;
      const where = crit === "nord" ? "au nord" : crit === "sud" ? "au sud" : `à l'${crit}`;
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "sn-donnees",
          stimulus: mockTable("Coordonnées GPS (latitude ; longitude)", ["Ville", "Coordonnées"], picked.map((c) => [c[0], coord(c[1], c[2])])),
          prompt: `D'après ces coordonnées, quelle ville est la plus ${where} ?`,
          answer: { text: best[0], feedback: `${best[0]} : ${coord(best[1], best[2])}.` },
          wrong: picked.filter((c) => c !== best).map((c) => ({ text: c[0], feedback: `${c[0]} : ${coord(c[1], c[2])}.` })),
          hint: crit === "nord" || crit === "sud" ? "Le nord et le sud se lisent dans la latitude." : "L'est et l'ouest se lisent dans la longitude.",
          hints: [crit === "nord" || crit === "sud" ? "Plus la latitude nord est grande, plus le lieu est au nord." : "Une longitude ouest (O) est à l'ouest du méridien de Greenwich, une longitude est (E) à l'est.", `${best[0]} : ${coord(best[1], best[2])}.`],
          solution: [...picked.map((c) => `${c[0]} : ${coord(c[1], c[2])}.`), `La ville la plus ${where} est ${best[0]}.`],
          takeaway: "La latitude situe un lieu au nord ou au sud de l'équateur ; la longitude, à l'est ou à l'ouest du méridien de Greenwich.",
        }),
        verify: () => picked.filter((c) => score(c) === score(best)).length === 1 && picked.every((c) => score(c) <= score(best)),
      };
    },
  }),

  /* ——— Enseignement scientifique ——— */
  gen({
    id: "es-panneau", unit: "1re-ens-sci-soleil", title: "Puissance reçue par un panneau solaire", stage: "application",
    make: (r, id) => {
      const E = r.pick([200, 400, 500, 600, 800, 1000]), S = r.pick([1.5, 2, 4, 10, 20]), eta = r.pick([10, 15, 20, 25]);
      const P = E * S, Pe = (P * eta) / 100;
      return {
        activity: problem({
          id, stage: "application", competence: "rea",
          context: `Un panneau solaire de ${fr(S)} m² reçoit un rayonnement de ${E} W/m². Son rendement est de ${eta} %.`,
          hint: "La puissance reçue est proportionnelle à la surface.",
          takeaway: "Puissance reçue = puissance surfacique × surface ; puissance électrique = rendement × puissance reçue.",
          parts: [
            { prompt: "Quelle puissance lumineuse reçoit-il, en watts ?", expected: P, errors: [{ value: E, code: "surface", message: `${E} W, c'est pour 1 m² : multiplie par la surface.`, type: "procedurale" }], hint: `Calcule ${E} × ${fr(S)}.`, solution: [`P = ${E} × ${fr(S)} = ${fr(P)} W.`], recap: `P = ${fr(P)} W`, review: "Puissance solaire reçue" },
            { prompt: "Quelle puissance électrique fournit-il, en watts ?", expected: Pe, errors: [{ value: P, code: "rendement", message: "Seule une partie de la puissance reçue est convertie : applique le rendement.", type: "conceptuelle" }], hint: `Prends ${eta} % de ${fr(P)}.`, solution: [`${fr(P)} × ${eta} ÷ 100 = ${fr(Pe)} W.`], recap: `Pe = ${fr(Pe)} W`, review: "Rendement" },
          ],
        }),
        verify: () => close(Pe / P, eta / 100) && close(P / S, E),
      };
    },
  }),
  gen({
    id: "es-albedo", unit: "1re-ens-sci-soleil", title: "Calculer un albédo", stage: "rappel",
    make: (r, id) => {
      const received = r.pick([100, 200, 340, 400, 500]), alb = r.pick([0.05, 0.1, 0.3, 0.5, 0.8, 0.9]);
      const reflected = round(received * alb, 2);
      const [surface] = r.pick([["Une surface"], ["Une zone de banquise"], ["Une forêt"], ["Un océan"], ["Un désert de sable"]] as const);
      return {
        activity: ask({
          id, stage: "rappel", competence: "rea",
          context: `${surface} reçoit une puissance de ${received} W/m² et en réfléchit ${fr(reflected)} W/m².`,
          prompt: "Quel est son albédo ? (nombre décimal entre 0 et 1)",
          expected: alb,
          errors: [{ value: round(received / reflected, 6), code: "inverse", message: "Albédo = puissance réfléchie ÷ puissance reçue : il est compris entre 0 et 1.", type: "procedurale" }],
          hint: "Albédo = puissance réfléchie ÷ puissance reçue.",
          partHint: `Calcule ${fr(reflected)} ÷ ${received}.`,
          solution: [`Albédo = ${fr(reflected)} ÷ ${received} = ${fr(alb)}.`],
          recap: `Albédo : ${fr(alb)}`,
          review: "Albédo",
          takeaway: "L'albédo est la fraction de la puissance reçue qui est réfléchie : proche de 1 pour la neige, faible pour l'océan.",
        }),
        verify: () => close(reflected / received, alb),
      };
    },
  }),
  gen({
    id: "es-niveau-sonore", unit: "1re-ens-sci-son", title: "Niveau d'intensité sonore", stage: "application",
    make: (r, id) => {
      const L1 = r.pick([30, 40, 50, 60, 70, 80]), k = r.int(1, 3);
      const factor = 10 ** k;
      const L2 = L1 + 10 * k;
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Une source produit un niveau d'intensité sonore de ${L1} dB. On multiplie l'intensité sonore par ${fr(factor)} (en ajoutant des sources identiques).`,
          prompt: "Quel est le nouveau niveau d'intensité sonore, en décibels ?",
          expected: L2,
          errors: [{ value: L1 * factor, code: "proportionnel", message: "Le niveau en décibels n'est pas proportionnel à l'intensité : on ajoute 10 dB chaque fois que l'intensité est multipliée par 10.", type: "conceptuelle" }],
          hint: "L = 10 log(I ÷ I₀) : multiplier I par 10 ajoute 10 dB.",
          partHint: `Ici, l'intensité est multipliée par 10, ${k} fois de suite.`,
          solution: [`Multiplier I par ${fr(factor)} ajoute 10 × ${k} = ${10 * k} dB.`, `${L1} + ${10 * k} = ${L2} dB.`],
          recap: `${L2} dB`,
          review: "Niveau d'intensité sonore",
          takeaway: "L'échelle des décibels est logarithmique : ×10 sur l'intensité, +10 dB sur le niveau.",
        }),
        verify: () => close(10 * Math.log10(10 ** (L1 / 10) * factor), L2),
      };
    },
  }),
  gen({
    id: "es-periode-son", unit: "1re-ens-sci-son", title: "Période et fréquence d'un son", stage: "rappel",
    make: (r, id) => {
      const f = r.pick([100, 125, 200, 250, 400, 500, 800, 1000, 2000, 4000]);
      const T = 1000 / f;
      const toT = r.chance(0.5);
      return {
        activity: ask({
          id, stage: "rappel", competence: "rea",
          context: toT ? `Un son pur a une fréquence de ${fr(f)} Hz.` : `Un son pur a une période de ${fr(T)} ms.`,
          prompt: toT ? "Quelle est sa période, en millisecondes ?" : "Quelle est sa fréquence, en hertz ?",
          expected: toT ? T : f,
          errors: [{ value: toT ? round(1 / f, 6) : round(1 / T, 6), code: "unite", message: "Attention aux unités : 1 s = 1 000 ms.", type: "procedurale" }],
          hint: "f = 1 ÷ T, avec T en secondes.",
          partHint: toT ? `T = 1 ÷ ${fr(f)} s.` : `${fr(T)} ms = ${fr(T / 1000)} s.`,
          solution: toT ? [`T = 1 ÷ ${fr(f)} = ${fr(1 / f)} s.`, `Soit ${fr(T)} ms.`] : [`T = ${fr(T / 1000)} s.`, `f = 1 ÷ ${fr(T / 1000)} = ${fr(f)} Hz.`],
          recap: toT ? `T = ${fr(T)} ms` : `f = ${fr(f)} Hz`,
          review: "Fréquence et période",
          takeaway: "La fréquence est l'inverse de la période : f = 1 ÷ T, avec T en secondes et f en hertz.",
        }),
        verify: () => close(f * (T / 1000), 1),
      };
    },
  }),

  /* ——— 1re : physique-chimie ——— */
  gen({
    id: "p1-concentration-masse", unit: "1re-physique-matiere", title: "Concentration en masse d'une solution", stage: "application",
    make: (r, id) => {
      const m = r.pick([1, 2, 5, 10, 12, 15, 20, 36]), V = r.pick([50, 100, 200, 250, 500]);
      const Cm = round(m / (V / 1000), 4);
      const [solute] = r.pick([["de sucre"], ["de sel"], ["de sulfate de cuivre"], ["de glucose"]] as const);
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `On dissout ${m} g ${solute} dans de l'eau pour obtenir ${V} mL de solution.`,
          prompt: "Quelle est la concentration en masse de la solution, en g/L ?",
          expected: Cm,
          errors: [{ value: round(m / V, 6), code: "millilitres", message: "Convertis le volume en litres : 1 L = 1 000 mL.", type: "procedurale" }],
          hint: "Cm = m ÷ V, avec V en litres.",
          partHint: `${V} mL = ${fr(V / 1000)} L.`,
          solution: [`V = ${fr(V / 1000)} L.`, `Cm = ${m} ÷ ${fr(V / 1000)} = ${fr(Cm)} g/L.`],
          recap: `Cm = ${fr(Cm)} g/L`,
          review: "Concentration en masse",
          takeaway: "Concentration en masse : Cm = m(soluté) ÷ V(solution), en g/L.",
        }),
        verify: () => close(Cm * (V / 1000), m),
      };
    },
  }),
  gen({
    id: "p1-champ-pesanteur", unit: "1re-physique-mouvement", title: "Intensité de la pesanteur à la surface d'un astre", stage: "transfert", capacity: BODIES.length,
    make: (r, id) => {
      const [name, M, R, ref] = r.pick(BODIES);
      const g = (6.67e-11 * M) / (R * R);
      return {
        activity: ask({
          id, stage: "transfert", competence: "rea",
          context: `Pour ${name} : masse M = ${sci(M)} kg et rayon R = ${sci(R)} m. G = 6,67 × 10⁻¹¹ N·m²/kg².`,
          prompt: "Quelle est l'intensité de la pesanteur à sa surface, en N/kg ? (arrondie au dixième)",
          expected: round(g, 1),
          tolerance: { abs: 0.11 },
          errors: [{ value: round((6.67e-11 * M) / R, 1), code: "carre", message: "Le rayon est au carré : g = G × M ÷ R².", type: "procedurale" }],
          hint: "g = G × M ÷ R².",
          partHint: `R² = (${sci(R)})² = ${sci(R * R)} m².`,
          solution: [`g = 6,67 × 10⁻¹¹ × ${sci(M)} ÷ (${sci(R)})².`, `g ≈ ${fr(round(g, 1))} N/kg.`],
          recap: `g ≈ ${fr(round(g, 1))} N/kg`,
          review: "Champ de pesanteur",
          takeaway: "À la surface d'un astre, g = G M ÷ R² : le poids d'un objet y vaut m × g.",
        }),
        verify: () => Math.abs(g - ref) / ref < 0.03,
      };
    },
  }),
  gen({
    id: "p1-somme-forces", unit: "1re-physique-mouvement", title: "Variation de vitesse et somme des forces", stage: "application",
    make: (r, id) => {
      const m = r.pick([0.5, 2, 5, 60, 80, 1000, 1200]), dv = r.pick([1, 2, 3, 5, 10]), dt = r.pick([0.5, 1, 2, 4, 5, 10]);
      const F = round((m * dv) / dt, 4);
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Un système de masse ${fr(m)} kg se déplace en ligne droite. Sa vitesse augmente de ${dv} m/s en ${fr(dt)} s.`,
          prompt: "Quelle est la valeur de la somme des forces qui s'exercent sur lui, en newtons ? (on la suppose constante)",
          expected: F,
          errors: [{ value: round(m * dv, 4), code: "duree", message: "La variation de vitesse doit être divisée par la durée : ΣF = m × Δv ÷ Δt.", type: "procedurale" }],
          hint: "ΣF = m × Δv ÷ Δt.",
          partHint: `Δv ÷ Δt = ${dv} ÷ ${fr(dt)} = ${fr(dv / dt)} m/s².`,
          solution: [`Δv ÷ Δt = ${fr(dv / dt)} m/s².`, `ΣF = ${fr(m)} × ${fr(dv / dt)} = ${fr(F)} N.`],
          recap: `ΣF = ${fr(F)} N`,
          review: "Deuxième loi de Newton (approche)",
          takeaway: "La somme des forces a la direction et le sens de la variation de vitesse ; sa valeur vaut m × Δv ÷ Δt.",
        }),
        verify: () => close((F * dt) / m, dv),
      };
    },
  }),
  gen({
    id: "p1-retard", unit: "1re-physique-ondes", title: "Retard d'une onde", stage: "application",
    make: (r, id) => {
      const [medium, v] = r.pick([["le son dans l'air", 340], ["le son dans l'eau", 1500], ["une onde sismique P", 6000], ["une vague", 2], ["le son dans l'acier", 5000]] as const);
      const t = r.pick([0.5, 1.2, 2, 3.5, 4, 10]);
      const d = round(v * t, 2);
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `La célérité de ${medium} vaut ${fr(v)} m/s. L'onde parcourt ${fr(d)} m entre deux points.`,
          prompt: "Quel est le retard de l'onde entre ces deux points, en secondes ?",
          expected: t,
          errors: [{ value: round(v / d, 6), code: "inverse", message: "τ = d ÷ v, pas v ÷ d.", type: "procedurale" }],
          hint: "Retard τ = distance ÷ célérité.",
          partHint: `Calcule ${fr(d)} ÷ ${fr(v)}.`,
          solution: [`τ = ${fr(d)} ÷ ${fr(v)} = ${fr(t)} s.`],
          recap: `τ = ${fr(t)} s`,
          review: "Retard d'une onde",
          takeaway: "Une onde met un temps τ = d ÷ v pour parcourir la distance d : c'est le retard.",
        }),
        verify: () => close(t * v, d),
      };
    },
  }),
  gen({
    id: "p1-periode-frequence", unit: "1re-physique-ondes", title: "Fréquence d'une onde périodique", stage: "rappel",
    make: (r, id) => {
      const T = r.pick([0.5, 1, 2, 2.5, 4, 5, 10, 20, 25]);
      const f = 1000 / T;
      return {
        activity: ask({
          id, stage: "rappel", competence: "rea",
          context: `Une onde périodique a une période de ${fr(T)} ms.`,
          prompt: "Quelle est sa fréquence, en hertz ?",
          expected: f,
          errors: [{ value: round(1 / T, 6), code: "ms", message: "Convertis la période en secondes avant de calculer 1 ÷ T.", type: "procedurale" }],
          hint: "f = 1 ÷ T, avec T en secondes.",
          partHint: `${fr(T)} ms = ${fr(T / 1000)} s.`,
          solution: [`T = ${fr(T / 1000)} s.`, `f = 1 ÷ ${fr(T / 1000)} = ${fr(f)} Hz.`],
          recap: `f = ${fr(f)} Hz`,
          review: "Fréquence et période",
          takeaway: "f = 1 ÷ T : une période de quelques millisecondes correspond à des centaines de hertz.",
        }),
        verify: () => close(f * T, 1000),
      };
    },
  }),

  /* ——— SI ——— */
  gen({
    id: "si-mesures", unit: "1re-si-experimenter", title: "Moyenne de mesures et écart au modèle", stage: "application",
    make: (r, id) => {
      const base = r.pick([12, 24, 48, 100, 150]);
      const vals = Array.from({ length: 4 }, () => round(base + r.int(-15, 15) / 10, 1));
      const mean = round(vals.reduce((a, b) => a + b, 0) / vals.length, 3);
      const model = round(base * r.pick([0.95, 0.97, 1.03, 1.05]), 2);
      const gap = round((Math.abs(mean - model) / model) * 100, 1);
      const [what, unit] = r.pick([["Vitesse de rotation d'un moteur", "tr/s"], ["Tension aux bornes d'un capteur", "V"], ["Effort mesuré sur un vérin", "N"], ["Température d'un boîtier", "°C"]] as const);
      return {
        activity: problem({
          id, stage: "application", competence: "te-analyser",
          stimulus: mockTable(`${what} : quatre mesures`, ["Mesure", "1", "2", "3", "4"], [[`Valeur (${unit})`, ...vals.map((v) => fr(v))]]),
          context: `La simulation du système prévoit ${fr(model)} ${unit}.`,
          hint: "Calcule d'abord la moyenne des mesures.",
          takeaway: "On compare un modèle et le réel avec l'écart relatif : |mesure − modèle| ÷ modèle.",
          parts: [
            { prompt: `Quelle est la moyenne des mesures, en ${unit} ?`, expected: mean, hint: "Additionne les quatre valeurs, puis divise par 4.", solution: [`(${vals.map((v) => fr(v)).join(" + ")}) ÷ 4 = ${fr(mean)}.`], recap: `Moyenne : ${fr(mean)} ${unit}`, review: "Moyenne de mesures" },
            { prompt: "Quel est l'écart relatif entre cette moyenne et la simulation, en pourcentage ? (arrondi au dixième)", expected: gap, tolerance: { abs: 0.051 }, hint: "Écart relatif = |moyenne − modèle| ÷ modèle × 100.", solution: [`|${fr(mean)} − ${fr(model)}| ÷ ${fr(model)} × 100 ≈ ${fr(gap)} %.`], recap: `Écart : ${fr(gap)} %`, review: "Écart relatif" },
          ],
        }),
        verify: () => close(mean * 4, vals.reduce((a, b) => a + b, 0), 1e-6) && Math.abs((Math.abs(mean - model) / model) * 100 - gap) <= 0.05,
      };
    },
  }),
  gen({
    id: "si-energie-moteur", unit: "Tle-si-modeliser", title: "Énergie consommée par un moteur", stage: "application",
    make: (r, id) => {
      const P = r.pick([50, 120, 250, 500, 750, 1500]), t = r.pick([2, 5, 10, 15, 30, 60]);
      const E = (P * t * 60) / 1000;
      return {
        activity: ask({
          id, stage: "application", competence: "te-analyser",
          context: `Un moteur absorbe une puissance de ${P} W pendant ${t} min.`,
          prompt: "Quelle énergie consomme-t-il, en kilojoules ?",
          expected: E,
          errors: [{ value: round((P * t) / 1000, 6), code: "minutes", message: "Convertis la durée en secondes : 1 min = 60 s.", type: "procedurale" }],
          hint: "E = P × t, avec P en W et t en s : on obtient des joules.",
          partHint: `${t} min = ${t * 60} s.`,
          solution: [`E = ${P} × ${t * 60} = ${fr(P * t * 60)} J.`, `Soit ${fr(E)} kJ.`],
          recap: `E = ${fr(E)} kJ`,
          review: "Énergie et puissance",
          takeaway: "E = P × t : 1 W pendant 1 s, c'est 1 J ; 1 kJ = 1 000 J.",
        }),
        verify: () => close(E * 1000, P * t * 60),
      };
    },
  }),
  gen({
    id: "si-couple", unit: "Tle-si-modeliser", title: "Puissance mécanique, couple et vitesse angulaire", stage: "rappel",
    make: (r, id) => {
      const C = r.pick([0.5, 2, 4, 5, 10, 20]), w = r.pick([50, 100, 150, 200, 300]);
      const P = C * w;
      return {
        activity: ask({
          id, stage: "rappel", competence: "te-analyser",
          context: `L'arbre d'un moteur tourne à ${w} rad/s et transmet un couple de ${fr(C)} N·m.`,
          prompt: "Quelle puissance mécanique transmet-il, en watts ?",
          expected: P,
          errors: [{ value: round(w / C, 6), code: "division", message: "P = C × ω : on multiplie.", type: "procedurale" }],
          hint: "En rotation, P = C × ω.",
          partHint: `Calcule ${fr(C)} × ${w}.`,
          solution: [`P = ${fr(C)} × ${w} = ${fr(P)} W.`],
          recap: `P = ${fr(P)} W`,
          review: "Puissance en rotation",
          takeaway: "Pour un mouvement de rotation, P = C × ω (C en N·m, ω en rad/s, P en W).",
        }),
        verify: () => close(P / w, C),
      };
    },
  }),

  /* ——— Terminale : physique ——— */
  gen({
    id: "pt-fusion-glace", unit: "Tle-physique-thermo", title: "Énergie pour faire fondre de la glace", stage: "application",
    make: (r, id) => {
      const m = r.pick([50, 100, 150, 200, 250, 500, 1000]);
      const Q = round((m / 1000) * 334, 3);
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `L'énergie massique de fusion de la glace vaut L = 334 kJ/kg (valeur arrondie). On fait fondre ${m} g de glace à 0 °C.`,
          prompt: "Quelle énergie faut-il lui transférer, en kilojoules ?",
          expected: Q,
          errors: [{ value: m * 334, code: "grammes", message: "Convertis la masse en kilogrammes : 1 kg = 1 000 g.", type: "procedurale" }],
          hint: "Q = m × L, avec m en kilogrammes.",
          partHint: `${m} g = ${fr(m / 1000)} kg.`,
          solution: [`m = ${fr(m / 1000)} kg.`, `Q = ${fr(m / 1000)} × 334 = ${fr(Q)} kJ.`],
          recap: `Q = ${fr(Q)} kJ`,
          review: "Changement d'état",
          takeaway: "Pendant un changement d'état, la température reste constante et l'énergie échangée vaut Q = m × L.",
        }),
        verify: () => close(Q * 1000, m * 334),
      };
    },
  }),
  gen({
    id: "pt-flux-thermique", unit: "Tle-physique-thermo", title: "Flux thermique à travers une paroi", stage: "rappel",
    make: (r, id) => {
      const dT = r.pick([5, 10, 15, 20, 25]), R = r.pick([0.01, 0.02, 0.025, 0.05, 0.1, 0.2]);
      const phi = round(dT / R, 4);
      return {
        activity: ask({
          id, stage: "rappel", competence: "rea",
          context: `Une paroi a une résistance thermique de ${fr(R)} K/W. L'écart de température entre ses deux faces vaut ${dT} °C.`,
          prompt: "Quel est le flux thermique qui la traverse, en watts ?",
          expected: phi,
          errors: [{ value: round(dT * R, 6), code: "produit", message: "Φ = ΔT ÷ R : on divise par la résistance thermique.", type: "procedurale" }],
          hint: "Φ = (T₁ − T₂) ÷ Rth.",
          partHint: `Calcule ${dT} ÷ ${fr(R)}.`,
          solution: [`Φ = ${dT} ÷ ${fr(R)} = ${fr(phi)} W.`],
          recap: `Φ = ${fr(phi)} W`,
          review: "Flux thermique",
          takeaway: "Plus la résistance thermique d'une paroi est grande, plus elle isole : Φ = ΔT ÷ Rth.",
        }),
        verify: () => close(phi * R, dT),
      };
    },
  }),
  gen({
    id: "pt-photon", unit: "Tle-physique-ondes", title: "Énergie d'un photon en électronvolts", stage: "application",
    make: (r, id) => {
      const lambda = r.pick([248, 310, 400, 496, 500, 620, 800, 1240]);
      const E = round(1240 / lambda, 6);
      return {
        activity: ask({
          id, stage: "application", competence: "rea",
          context: `Une radiation lumineuse a une longueur d'onde de ${lambda} nm dans le vide. On utilise E = h c ÷ λ avec h c ≈ 1 240 eV·nm.`,
          prompt: "Quelle est l'énergie d'un photon de cette radiation, en électronvolts ?",
          expected: E,
          errors: [{ value: round(lambda / 1240, 6), code: "inverse", message: "E = h c ÷ λ : plus la longueur d'onde est grande, plus l'énergie est petite.", type: "procedurale" }],
          hint: "E = h c ÷ λ.",
          partHint: `Calcule 1 240 ÷ ${lambda}.`,
          solution: [`E = 1 240 ÷ ${lambda} = ${fr(E)} eV.`],
          recap: `E = ${fr(E)} eV`,
          review: "Énergie d'un photon",
          takeaway: "L'énergie d'un photon est inversement proportionnelle à la longueur d'onde : E = h c ÷ λ.",
        }),
        verify: () => Math.abs((6.626e-34 * 2.998e8) / (lambda * 1e-9) / 1.602e-19 - E) / E < 0.002,
      };
    },
  }),
  gen({
    id: "pt-lunette", unit: "Tle-physique-ondes", title: "Grossissement d'une lunette astronomique", stage: "rappel",
    make: (r, id) => {
      const f1 = r.pick([400, 500, 600, 750, 900, 1000, 1200]), f2 = r.pick([10, 20, 25, 50]);
      const Gr = f1 / f2;
      return {
        activity: ask({
          id, stage: "rappel", competence: "rea",
          context: `Une lunette afocale a un objectif de distance focale ${f1} mm et un oculaire de distance focale ${f2} mm.`,
          prompt: "Quel est son grossissement ?",
          expected: Gr,
          errors: [{ value: round(f2 / f1, 6), code: "inverse", message: "G = f′objectif ÷ f′oculaire : le grossissement d'une lunette est supérieur à 1.", type: "procedurale" }],
          hint: "G = f′₁ ÷ f′₂.",
          partHint: `Calcule ${f1} ÷ ${f2}.`,
          solution: [`G = ${f1} ÷ ${f2} = ${fr(Gr)}.`],
          recap: `G = ${fr(Gr)}`,
          review: "Lunette astronomique",
          takeaway: "Le grossissement d'une lunette afocale est le quotient des distances focales de l'objectif et de l'oculaire.",
        }),
        verify: () => close(Gr * f2, f1),
      };
    },
  }),

  /* ——— NSI ——— */
  gen({
    id: "nsi-dichotomie-etapes", unit: "Tle-nsi-algorithmique", title: "Nombre d'étapes d'une recherche dichotomique", stage: "application", capacity: 18,
    make: (r, id) => {
      const k = r.int(3, 20);
      const n = 2 ** k;
      return {
        activity: ask({
          id, stage: "application", competence: "ns-algo",
          context: `Une liste triée contient ${fr(n)} éléments. À chaque étape, la recherche dichotomique coupe en deux la zone où l'élément peut se trouver.`,
          prompt: "Au bout de combien d'étapes au plus la zone ne contient-elle plus qu'un seul élément ?",
          expected: k,
          errors: [{ value: n / 2, code: "lineaire", message: "On ne retire pas un élément à chaque étape : on divise la zone par deux.", type: "conceptuelle" }],
          hint: "Compte combien de fois on peut diviser le nombre d'éléments par 2 avant d'arriver à 1.",
          partHint: `${fr(n)} = 2${String(k).split("").map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(c)]).join("")}.`,
          solution: [`${fr(n)} → ${fr(n / 2)} → … → 1 : on divise ${k} fois par 2.`, `Il faut au plus ${k} étapes.`],
          recap: `${k} étapes`,
          review: "Coût de la dichotomie",
          takeaway: "La recherche dichotomique a un coût logarithmique : doubler la taille de la liste n'ajoute qu'une étape.",
        }),
        verify: () => {
          let size = n, steps = 0;
          while (size > 1) { size = Math.floor(size / 2); steps++; }
          return steps === k;
        },
      };
    },
  }),
  gen({
    id: "nsi-arbre-taille", unit: "Tle-nsi-algorithmique", title: "Taille maximale d'un arbre binaire", stage: "rappel",
    make: (r, id) => {
      const h = r.int(2, 12);
      const max = r.chance(0.6);
      const res = max ? 2 ** h - 1 : h;
      return {
        activity: ask({
          id, stage: "rappel", competence: "ns-algo",
          context: `On convient qu'un arbre binaire réduit à sa racine a une hauteur de 1. On considère un arbre binaire de hauteur ${h}.`,
          prompt: max ? "Combien de nœuds peut-il contenir au maximum ?" : "Combien de nœuds contient-il au minimum ?",
          expected: res,
          errors: max ? [{ value: 2 ** h, code: "decalage", message: "Un arbre complet de hauteur h contient 1 + 2 + … + 2ʰ⁻¹ = 2ʰ − 1 nœuds.", type: "procedurale" }] : [{ value: 2 ** h - 1, code: "maximum", message: "C'est le nombre maximal : le minimum correspond à un arbre « filiforme », un nœud par niveau.", type: "conceptuelle" }],
          hint: max ? "Chaque niveau peut contenir deux fois plus de nœuds que le précédent." : "L'arbre le plus petit a un seul nœud par niveau.",
          partHint: max ? `Niveaux : 1, 2, 4, … jusqu'à 2ʰ⁻¹ nœuds au niveau ${h}.` : `Il y a ${h} niveaux.`,
          solution: max ? [`1 + 2 + 4 + … + 2ʰ⁻¹ = 2ʰ − 1.`, `Pour h = ${h} : ${fr(res)} nœuds.`] : [`Un nœud par niveau, sur ${h} niveaux.`, `Au minimum ${h} nœuds.`],
          recap: `${fr(res)} nœuds`,
          review: "Hauteur et taille d'un arbre binaire",
          takeaway: "Un arbre binaire de hauteur h (racine seule : h = 1) a entre h et 2ʰ − 1 nœuds.",
        }),
        verify: () => {
          let total = 0;
          for (let level = 0; level < h; level++) total += 2 ** level;
          return max ? total === res : res === h;
        },
      };
    },
  }),
];
