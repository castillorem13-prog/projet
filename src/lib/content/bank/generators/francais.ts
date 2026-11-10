import { gen, mcq } from "../build";
import type { Generator } from "../types";

/**
 * Français : conjugaison et accords. Les formes viennent d'une table de conjugaison relue ;
 * la contre-épreuve vérifie qu'une forme n'appartient qu'à un seul temps (« il finit » est écarté :
 * c'est à la fois un présent et un passé simple).
 */

type Tense = "présent" | "imparfait" | "passé simple" | "futur" | "conditionnel présent";
const TENSES: Tense[] = ["présent", "imparfait", "passé simple", "futur", "conditionnel présent"];
type Person = "il" | "nous" | "ils";

/** [il, nous, ils] pour chaque temps de l'indicatif (et le conditionnel présent). */
const TABLE: Record<string, Record<Tense, [string, string, string]>> = {
  être: { présent: ["est", "sommes", "sont"], imparfait: ["était", "étions", "étaient"], "passé simple": ["fut", "fûmes", "furent"], futur: ["sera", "serons", "seront"], "conditionnel présent": ["serait", "serions", "seraient"] },
  avoir: { présent: ["a", "avons", "ont"], imparfait: ["avait", "avions", "avaient"], "passé simple": ["eut", "eûmes", "eurent"], futur: ["aura", "aurons", "auront"], "conditionnel présent": ["aurait", "aurions", "auraient"] },
  aller: { présent: ["va", "allons", "vont"], imparfait: ["allait", "allions", "allaient"], "passé simple": ["alla", "allâmes", "allèrent"], futur: ["ira", "irons", "iront"], "conditionnel présent": ["irait", "irions", "iraient"] },
  faire: { présent: ["fait", "faisons", "font"], imparfait: ["faisait", "faisions", "faisaient"], "passé simple": ["fit", "fîmes", "firent"], futur: ["fera", "ferons", "feront"], "conditionnel présent": ["ferait", "ferions", "feraient"] },
  finir: { présent: ["finit", "finissons", "finissent"], imparfait: ["finissait", "finissions", "finissaient"], "passé simple": ["finit", "finîmes", "finirent"], futur: ["finira", "finirons", "finiront"], "conditionnel présent": ["finirait", "finirions", "finiraient"] },
  chanter: { présent: ["chante", "chantons", "chantent"], imparfait: ["chantait", "chantions", "chantaient"], "passé simple": ["chanta", "chantâmes", "chantèrent"], futur: ["chantera", "chanterons", "chanteront"], "conditionnel présent": ["chanterait", "chanterions", "chanteraient"] },
  prendre: { présent: ["prend", "prenons", "prennent"], imparfait: ["prenait", "prenions", "prenaient"], "passé simple": ["prit", "prîmes", "prirent"], futur: ["prendra", "prendrons", "prendront"], "conditionnel présent": ["prendrait", "prendrions", "prendraient"] },
  venir: { présent: ["vient", "venons", "viennent"], imparfait: ["venait", "venions", "venaient"], "passé simple": ["vint", "vînmes", "vinrent"], futur: ["viendra", "viendrons", "viendront"], "conditionnel présent": ["viendrait", "viendrions", "viendraient"] },
  pouvoir: { présent: ["peut", "pouvons", "peuvent"], imparfait: ["pouvait", "pouvions", "pouvaient"], "passé simple": ["put", "pûmes", "purent"], futur: ["pourra", "pourrons", "pourront"], "conditionnel présent": ["pourrait", "pourrions", "pourraient"] },
  voir: { présent: ["voit", "voyons", "voient"], imparfait: ["voyait", "voyions", "voyaient"], "passé simple": ["vit", "vîmes", "virent"], futur: ["verra", "verrons", "verront"], "conditionnel présent": ["verrait", "verrions", "verraient"] },
  dire: { présent: ["dit", "disons", "disent"], imparfait: ["disait", "disions", "disaient"], "passé simple": ["dit", "dîmes", "dirent"], futur: ["dira", "dirons", "diront"], "conditionnel présent": ["dirait", "dirions", "diraient"] },
  partir: { présent: ["part", "partons", "partent"], imparfait: ["partait", "partions", "partaient"], "passé simple": ["partit", "partîmes", "partirent"], futur: ["partira", "partirons", "partiront"], "conditionnel présent": ["partirait", "partirions", "partiraient"] },
  vouloir: { présent: ["veut", "voulons", "veulent"], imparfait: ["voulait", "voulions", "voulaient"], "passé simple": ["voulut", "voulûmes", "voulurent"], futur: ["voudra", "voudrons", "voudront"], "conditionnel présent": ["voudrait", "voudrions", "voudraient"] },
  mettre: { présent: ["met", "mettons", "mettent"], imparfait: ["mettait", "mettions", "mettaient"], "passé simple": ["mit", "mîmes", "mirent"], futur: ["mettra", "mettrons", "mettront"], "conditionnel présent": ["mettrait", "mettrions", "mettraient"] },
};
const PERSONS: Person[] = ["il", "nous", "ils"];
const formOf = (verb: string, tense: Tense, p: Person) => `${p} ${TABLE[verb]![tense][PERSONS.indexOf(p)]}`;
/** Temps auxquels appartient une forme (plusieurs si elle est ambiguë). */
const tensesOf = (verb: string, p: Person, form: string) => TENSES.filter((t) => formOf(verb, t, p) === form);
const PERSON_LABEL: Record<Person, string> = { il: "3e personne du singulier", nous: "1re personne du pluriel", ils: "3e personne du pluriel" };

function pickUnambiguous(r: { pick: <T>(l: readonly T[]) => T }, tenses: Tense[]) {
  for (;;) {
    const verb = r.pick(Object.keys(TABLE));
    const p = r.pick(PERSONS);
    const tense = r.pick(tenses);
    const form = formOf(verb, tense, p);
    if (tensesOf(verb, p, form).length === 1) return { verb, p, tense, form };
  }
}

const conjUnits: [string, Tense[]][] = [
  ["6e-francais-conjugaison", ["présent", "imparfait", "passé simple", "futur"]],
  ["4e-francais-conjugaison", TENSES],
  ["5e-francais-langue", ["imparfait", "passé simple", "présent"]],
];

const conjugation: Generator[] = conjUnits.flatMap(([unit, tenses]) => [
  gen({
    id: `fr-temps-${unit}`, unit, title: "Reconnaître le temps d'un verbe", stage: "rappel",
    make: (r, id) => {
      const { verb, p, tense, form } = pickUnambiguous(r, tenses);
      return {
        activity: mcq(r, {
          id, stage: "rappel", competence: "fr-langue",
          prompt: `À quel temps est conjugué « ${form} » (verbe ${verb}) ?`,
          answer: { text: tense, feedback: `« ${form} » : ${verb} au ${tense}.` },
          wrong: TENSES.filter((t) => t !== tense).map((t) => ({ text: t, feedback: `Au ${t}, on écrirait « ${formOf(verb, t, p)} ».` })),
          count: 4,
          hint: "Observe la terminaison : -ait (imparfait), -ra (futur), -rait (conditionnel), -a, -it, -ut, -èrent (passé simple).",
          hints: [`Compare avec le présent : « ${formOf(verb, "présent", p)} ».`, `Au futur, on aurait « ${formOf(verb, "futur", p)} ».`],
          solution: [`« ${form} » est ${verb} au ${tense}, ${PERSON_LABEL[p]}.`],
          takeaway: "Les terminaisons repèrent le temps : -ait/-aient (imparfait), -ra/-ront (futur), -rait/-raient (conditionnel), -a/-it/-ut et -èrent/-irent/-urent (passé simple).",
        }),
        verify: () => tensesOf(verb, p, form).length === 1 && tensesOf(verb, p, form)[0] === tense,
      };
    },
  }),
  gen({
    id: `fr-conjuguer-${unit}`, unit, title: "Choisir la bonne forme conjuguée", stage: "application",
    make: (r, id) => {
      const { verb, p, tense, form } = pickUnambiguous(r, tenses);
      const others = TENSES.filter((t) => t !== tense).map((t) => formOf(verb, t, p)).filter((f) => f !== form);
      return {
        activity: mcq(r, {
          id, stage: "application", competence: "fr-langue",
          prompt: `Conjugue le verbe ${verb} au ${tense}, ${PERSON_LABEL[p]}.`,
          answer: { text: form, feedback: `${verb} au ${tense} : « ${form} ».` },
          wrong: r.shuffle(others).map((f) => ({ text: f, feedback: `« ${f} » est ${verb} au ${tensesOf(verb, p, f).join(" ou au ")}.` })),
          count: 4,
          hint: `Rappelle-toi la terminaison du ${tense}.`,
          hints: [`Au présent : « ${formOf(verb, "présent", p)} ».`, `Ce verbe est-il régulier ? Le radical peut changer (${verb}).`],
          solution: [`${verb}, ${tense} : « ${form} ».`],
          takeaway: "Pour conjuguer, on choisit le radical du verbe et la terminaison du temps et de la personne.",
        }),
        verify: () => formOf(verb, tense, p) === form && tensesOf(verb, p, form).length === 1,
      };
    },
  }),
]);

/* ——— Accords du participe passé ——— */

type Gn = { text: string; fem: boolean; plur: boolean };
const SUBJECTS: Gn[] = [
  { text: "Elle", fem: true, plur: false }, { text: "Il", fem: false, plur: false }, { text: "Elles", fem: true, plur: true }, { text: "Ils", fem: false, plur: true },
  { text: "Mes sœurs", fem: true, plur: true }, { text: "Les garçons", fem: false, plur: true }, { text: "La voisine", fem: true, plur: false }, { text: "Mon frère", fem: false, plur: false },
];
/** Verbes conjugués avec « être » au passé composé : participe au masculin singulier. */
const ETRE_VERBS: [string, string][] = [["partir", "parti"], ["venir", "venu"], ["aller", "allé"], ["arriver", "arrivé"], ["tomber", "tombé"], ["rester", "resté"], ["entrer", "entré"], ["sortir", "sorti"], ["devenir", "devenu"], ["monter", "monté"], ["descendre", "descendu"], ["retourner", "retourné"]];
const agree = (pp: string, g: { fem: boolean; plur: boolean }) => `${pp}${g.fem ? "e" : ""}${g.plur ? (pp.endsWith("s") && !g.fem ? "" : "s") : ""}`;
const aux = (g: Gn) => (g.plur ? "sont" : "est");
/** Les quatre formes écrites d'un participe : [masc. sing., masc. plur., fém. sing., fém. plur.]. */
const forms = (pp: string) => [pp, pp.endsWith("s") ? pp : `${pp}s`, `${pp}e`, `${pp}es`];
const formIndex = (g: { fem: boolean; plur: boolean }) => (g.fem ? 2 : 0) + (g.plur ? 1 : 0);

const etre = gen({
  id: "fr-accord-etre", unit: "6e-francais-grammaire", title: "Accorder le participe passé avec être", stage: "application",
  make: (r, id) => {
    const s = r.pick(SUBJECTS);
    const [inf, pp] = r.pick(ETRE_VERBS);
    const right = agree(pp, s);
    const variants = [agree(pp, { fem: !s.fem, plur: s.plur }), agree(pp, { fem: s.fem, plur: !s.plur }), pp, agree(pp, { fem: true, plur: true })];
    return {
      activity: mcq(r, {
        id, stage: "application", competence: "fr-langue",
        prompt: `Complète au passé composé (verbe ${inf}) : « ${s.text} ${aux(s)} … hier. »`,
        answer: { text: right, feedback: `Avec l'auxiliaire être, le participe s'accorde avec le sujet « ${s.text} » (${s.fem ? "féminin" : "masculin"} ${s.plur ? "pluriel" : "singulier"}).` },
        wrong: variants.filter((v) => v !== right).map((v) => ({ text: v, feedback: `Le sujet « ${s.text} » est ${s.fem ? "féminin" : "masculin"} ${s.plur ? "pluriel" : "singulier"} : l'accord doit suivre.` })),
        count: 4,
        hint: "Avec être, le participe passé s'accorde avec le sujet.",
        hints: [`Le sujet est « ${s.text} » : est-il masculin ou féminin, singulier ou pluriel ?`, `Féminin : on ajoute -e ; pluriel : on ajoute -s.`],
        solution: [`« ${s.text} ${aux(s)} ${right} hier. »`],
        takeaway: "Au passé composé avec être, le participe passé s'accorde en genre et en nombre avec le sujet.",
      }),
      verify: () => right === forms(pp)[formIndex(s)],
    };
  },
});

type Noun = { text: string; fem: boolean; plur: boolean };
const NOUNS: Noun[] = [
  { text: "les lettres", fem: true, plur: true }, { text: "la lettre", fem: true, plur: false }, { text: "les livres", fem: false, plur: true }, { text: "le livre", fem: false, plur: false },
  { text: "les photos", fem: true, plur: true }, { text: "le gâteau", fem: false, plur: false }, { text: "les chansons", fem: true, plur: true }, { text: "la porte", fem: true, plur: false }, { text: "les devoirs", fem: false, plur: true },
];
/** Participes passés au masculin singulier, et le verbe à l'infinitif. */
const AVOIR_VERBS: [string, string, (n: Noun) => boolean][] = [
  ["écrire", "écrit", (n) => /lettre|livre|chanson|devoir/.test(n.text)], ["prendre", "pris", (n) => /photo|livre|lettre/.test(n.text)], ["voir", "vu", () => true],
  ["faire", "fait", (n) => /gâteau|devoir/.test(n.text)], ["lire", "lu", (n) => /lettre|livre/.test(n.text)], ["ouvrir", "ouvert", (n) => /porte|lettre|livre/.test(n.text)], ["chanter", "chanté", (n) => /chanson/.test(n.text)],
];
const ppAgree = (pp: string, n: Noun) => `${pp}${n.fem ? "e" : ""}${n.plur && !(pp.endsWith("s") && !n.fem) ? "s" : ""}`;

const avoir = gen({
  id: "fr-accord-avoir", unit: "3e-francais-accords", title: "Accorder le participe passé avec avoir", stage: "transfert",
  make: (r, id) => {
    let pick = r.pick(AVOIR_VERBS), n = r.pick(NOUNS);
    while (!pick[2](n)) { pick = r.pick(AVOIR_VERBS); n = r.pick(NOUNS); }
    const [inf, pp] = pick;
    const before = r.chance(0.6);
    const right = before ? ppAgree(pp, n) : pp;
    const sentence = before ? `${n.text.charAt(0).toUpperCase()}${n.text.slice(1)} que j'ai … ${n.plur ? "sont" : "est"} sur la table.` : `J'ai … ${n.text} hier.`;
    const variants = [...forms(pp), ppAgree(pp, { ...n, fem: !n.fem })];
    return {
      activity: mcq(r, {
        id, stage: "transfert", competence: "fr-langue",
        prompt: `Complète avec le participe passé du verbe ${inf} : « ${sentence} »`,
        answer: { text: right, feedback: before ? `Le COD « que », mis pour « ${n.text} », est placé avant le verbe : on accorde (${n.fem ? "féminin" : "masculin"} ${n.plur ? "pluriel" : "singulier"}).` : `Le COD « ${n.text} » est placé après le verbe : le participe passé reste invariable.` },
        wrong: variants.filter((v) => v !== right).map((v) => ({ text: v, feedback: before ? "Cherche le COD : il est placé avant le verbe (que = " + n.text + ")." : "Avec avoir, on n'accorde jamais avec le sujet ; ici le COD est après le verbe." })),
        count: 4,
        hint: "Avec avoir, on accorde seulement avec le COD, et seulement s'il est placé avant le verbe.",
        hints: ["Pose la question : j'ai … quoi ? Où se trouve la réponse ?", before ? `« que » reprend « ${n.text} ».` : `« ${n.text} » vient après le verbe.`],
        solution: [`${before ? `COD placé avant (que = ${n.text}) : accord.` : "COD placé après : pas d'accord."}`, `Réponse : ${right}.`],
        takeaway: "Avec l'auxiliaire avoir, le participe passé s'accorde avec le COD seulement si celui-ci est placé avant le verbe.",
      }),
      verify: () => right === (before ? forms(pp)[formIndex(n)] : pp) && pick[2](n),
    };
  },
});

export const FRANCAIS: Generator[] = [...conjugation, etre, avoir];
