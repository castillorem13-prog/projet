/**
 * Données et outils de chimie, vérifiés par les tests : lecture de formules, conservation des atomes,
 * masses molaires calculées à partir des masses atomiques (valeurs usuelles des manuels, en g/mol).
 */

export const ATOMIC_MASS: Record<string, number> = {
  H: 1.0, C: 12.0, N: 14.0, O: 16.0, Na: 23.0, Mg: 24.3, Al: 27.0, S: 32.1, Cl: 35.5, K: 39.1, Ca: 40.1, Fe: 55.8, Cu: 63.5, Zn: 65.4,
};

/** Numéro atomique Z des éléments utilisés. */
export const Z: Record<string, number> = {
  H: 1, He: 2, Li: 3, Be: 4, B: 5, C: 6, N: 7, O: 8, F: 9, Ne: 10, Na: 11, Mg: 12, Al: 13, Si: 14, P: 15, S: 16, Cl: 17, Ar: 18, K: 19, Ca: 20,
  Fe: 26, Co: 27, Ni: 28, Cu: 29, Zn: 30, Sr: 38, Y: 39, I: 53, Xe: 54, Pb: 82, Po: 84, Rn: 86, Ra: 88, Th: 90, U: 92, Np: 93, Am: 95,
};

export const NAME: Record<string, string> = {
  H: "hydrogène", He: "hélium", Li: "lithium", C: "carbone", N: "azote", O: "oxygène", F: "fluor", Ne: "néon", Na: "sodium", Mg: "magnésium",
  Al: "aluminium", Si: "silicium", P: "phosphore", S: "soufre", Cl: "chlore", Ar: "argon", K: "potassium", Ca: "calcium", Fe: "fer", Cu: "cuivre", Zn: "zinc",
};

const SUBS = "₀₁₂₃₄₅₆₇₈₉";
/** Formule écrite avec des indices : « C6H12O6 » → « C₆H₁₂O₆ ». */
export const formula = (f: string) => f.replace(/\d/g, (d) => SUBS[Number(d)]!);

/** Compte les atomes d'une formule : « Ca(OH)2 » ou « Ca(OH)₂ » → { Ca: 1, O: 2, H: 2 }. */
export function atoms(f: string): Record<string, number> {
  const s = f.replace(/[₀-₉]/g, (d) => String(SUBS.indexOf(d)));
  let i = 0;
  const num = () => {
    let j = i;
    while (j < s.length && /\d/.test(s[j]!)) j++;
    const n = j > i ? Number(s.slice(i, j)) : 1;
    i = j;
    return n;
  };
  const group = (): Record<string, number> => {
    const out: Record<string, number> = {};
    const add = (k: string, n: number) => (out[k] = (out[k] ?? 0) + n);
    while (i < s.length && s[i] !== ")") {
      if (s[i] === "(") {
        i++;
        const inner = group();
        i++;
        const k = num();
        for (const [el, n] of Object.entries(inner)) add(el, n * k);
      } else {
        const m = /^[A-Z][a-z]?/.exec(s.slice(i));
        if (!m) throw new Error(`Formule illisible : ${f}`);
        i += m[0].length;
        add(m[0], num());
      }
    }
    return out;
  };
  return group();
}

/** Masse molaire calculée à partir des masses atomiques. */
export const molarMass = (f: string) => Object.entries(atoms(f)).reduce((s, [el, n]) => s + ATOMIC_MASS[el]! * n, 0);

export interface Reaction {
  name: string;
  reactants: [coef: number, formula: string][];
  products: [coef: number, formula: string][];
}

/** Bilan d'atomes d'un côté de l'équation. */
export function side(list: [number, string][]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [c, f] of list) for (const [el, n] of Object.entries(atoms(f))) out[el] = (out[el] ?? 0) + c * n;
  return out;
}

/** Vrai si les atomes sont conservés. */
export function balanced(r: { reactants: [number, string][]; products: [number, string][] }): boolean {
  const a = side(r.reactants), b = side(r.products);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((k) => (a[k] ?? 0) === (b[k] ?? 0));
}

/** Équation écrite : « CH₄ + 2 O₂ → CO₂ + 2 H₂O ». */
export const equation = (r: Reaction, coefs?: number[]) => {
  const all = [...r.reactants, ...r.products];
  const c = coefs ?? all.map(([k]) => k);
  const term = (i: number) => `${c[i] === 1 ? "" : `${c[i]} `}${formula(all[i]![1])}`;
  return `${r.reactants.map((_, i) => term(i)).join(" + ")} → ${r.products.map((_, i) => term(r.reactants.length + i)).join(" + ")}`;
};

/** Équation avec un nombre stœchiométrique à trouver (« ? »). */
export const equationMasked = (r: Reaction, k: number) => {
  const all = [...r.reactants, ...r.products];
  const term = (i: number) => (i === k ? `? ${formula(all[i]![1])}` : `${all[i]![0] === 1 ? "" : `${all[i]![0]} `}${formula(all[i]![1])}`);
  return `${r.reactants.map((_, i) => term(i)).join(" + ")} → ${r.products.map((_, i) => term(r.reactants.length + i)).join(" + ")}`;
};

export const REACTIONS: Reaction[] = [
  { name: "combustion du méthane", reactants: [[1, "CH4"], [2, "O2"]], products: [[1, "CO2"], [2, "H2O"]] },
  { name: "combustion du propane", reactants: [[1, "C3H8"], [5, "O2"]], products: [[3, "CO2"], [4, "H2O"]] },
  { name: "combustion du butane", reactants: [[2, "C4H10"], [13, "O2"]], products: [[8, "CO2"], [10, "H2O"]] },
  { name: "combustion de l'éthanol", reactants: [[1, "C2H6O"], [3, "O2"]], products: [[2, "CO2"], [3, "H2O"]] },
  { name: "synthèse de l'eau", reactants: [[2, "H2"], [1, "O2"]], products: [[2, "H2O"]] },
  { name: "combustion du carbone", reactants: [[1, "C"], [1, "O2"]], products: [[1, "CO2"]] },
  { name: "combustion du magnésium", reactants: [[2, "Mg"], [1, "O2"]], products: [[2, "MgO"]] },
  { name: "synthèse de l'ammoniac", reactants: [[1, "N2"], [3, "H2"]], products: [[2, "NH3"]] },
  { name: "oxydation du fer", reactants: [[4, "Fe"], [3, "O2"]], products: [[2, "Fe2O3"]] },
  { name: "respiration (oxydation du glucose)", reactants: [[1, "C6H12O6"], [6, "O2"]], products: [[6, "CO2"], [6, "H2O"]] },
  { name: "synthèse du chlorure de sodium", reactants: [[2, "Na"], [1, "Cl2"]], products: [[2, "NaCl"]] },
  { name: "action de l'acide chlorhydrique sur le zinc", reactants: [[1, "Zn"], [2, "HCl"]], products: [[1, "ZnCl2"], [1, "H2"]] },
  { name: "décomposition du calcaire", reactants: [[1, "CaCO3"]], products: [[1, "CaO"], [1, "CO2"]] },
  { name: "combustion du soufre", reactants: [[1, "S"], [1, "O2"]], products: [[1, "SO2"]] },
  { name: "décomposition de l'eau oxygénée", reactants: [[2, "H2O2"]], products: [[2, "H2O"], [1, "O2"]] },
];

/** Désintégrations : (symbole, A, Z) du noyau père, type, et noyau fils connu. */
export const DECAYS: { parent: [string, number]; type: "α" | "β⁻"; child: [string, number] }[] = [
  { parent: ["U", 238], type: "α", child: ["Th", 234] },
  { parent: ["Ra", 226], type: "α", child: ["Rn", 222] },
  { parent: ["Po", 210], type: "α", child: ["Pb", 206] },
  { parent: ["Am", 241], type: "α", child: ["Np", 237] },
  { parent: ["Th", 232], type: "α", child: ["Ra", 228] },
  { parent: ["C", 14], type: "β⁻", child: ["N", 14] },
  { parent: ["I", 131], type: "β⁻", child: ["Xe", 131] },
  { parent: ["Sr", 90], type: "β⁻", child: ["Y", 90] },
  { parent: ["Co", 60], type: "β⁻", child: ["Ni", 60] },
];

/** Isotopes usuels : symbole et nombre de masse A. */
export const ISOTOPES: [string, number][] = [
  ["H", 1], ["H", 2], ["He", 4], ["C", 12], ["C", 14], ["N", 14], ["O", 16], ["O", 18], ["Na", 23], ["Mg", 24], ["Al", 27],
  ["Cl", 35], ["Cl", 37], ["K", 39], ["Ca", 40], ["Fe", 56], ["Cu", 63], ["U", 235], ["U", 238],
];

/** Ions monoatomiques usuels : symbole et charge. */
export const IONS: [string, number][] = [["Na", 1], ["K", 1], ["Mg", 2], ["Ca", 2], ["Al", 3], ["Cl", -1], ["F", -1], ["O", -2], ["S", -2], ["Fe", 2], ["Cu", 2], ["Zn", 2]];
/** Écriture d'un ion : Mg²⁺, Cl⁻. */
export const ion = (el: string, q: number) => `${el}${Math.abs(q) === 1 ? "" : "⁰¹²³⁴⁵⁶⁷⁸⁹"[Math.abs(q)]}${q > 0 ? "⁺" : "⁻"}`;
