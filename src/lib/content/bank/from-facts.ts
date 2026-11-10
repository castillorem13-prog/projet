import type { CompetenceId } from "@/lib/content/types";
import { findUnit } from "@/lib/curriculum";
import type { SubjectId } from "@/lib/curriculum/types";
import { classify, gen, mcq, order } from "./build";
import type { Rng } from "./rand";
import type { Fact, FactSet, Generator, Lang } from "./types";

/**
 * Questions tirées des faits sourcés : la bonne réponse et les pièges viennent tous de faits vérifiés,
 * et chaque piège est expliqué par le fait auquel il appartient (« 1815 est la date de Waterloo »).
 */

type Of<K extends Fact["kind"]> = Extract<Fact, { kind: K }>;

const COMPETENCE: Partial<Record<SubjectId, { know: CompetenceId; time?: CompetenceId; space?: CompetenceId }>> = {
  hg: { know: "hg-raisonner", time: "hg-temps", space: "hg-espace" },
  hggsp: { know: "hg-raisonner", time: "hg-temps", space: "hg-espace" },
  emc: { know: "emc-regle" }, dgemc: { know: "emc-regle" },
  francais: { know: "fr-langue", time: "fr-culture" }, hlp: { know: "fr-culture" },
  philo: { know: "ph-concepts" },
  svt: { know: "svt-savoirs" }, "ens-sci": { know: "svt-savoirs" },
  sciences: { know: "app" }, physique: { know: "app" },
  techno: { know: "te-analyser" }, si: { know: "te-analyser" },
  snt: { know: "sn-reseaux" }, nsi: { know: "ns-algo" },
  ses: { know: "se-mecanismes" },
  anglais: { know: "en-comprendre" }, llcer: { know: "en-comprendre" },
  espagnol: { know: "es-comprendre" }, allemand: { know: "de-comprendre" },
  latin: { know: "an-langue", time: "an-culture" }, grec: { know: "an-langue", time: "an-culture" }, llca: { know: "an-culture" },
  arts: { know: "ar-analyser" }, "arts-spe": { know: "ar-analyser" }, musique: { know: "mu-ecouter" },
  eps: { know: "ep-securite" }, eppcs: { know: "ep-securite" },
  maths: { know: "raisonner" }, "maths-tc": { know: "raisonner" }, "maths-comp": { know: "raisonner" }, "maths-exp": { know: "raisonner" },
};

const competence = (unitId: string, kind: "know" | "time" | "space"): CompetenceId => {
  const c = COMPETENCE[findUnit(unitId)?.subject ?? "maths"] ?? { know: "raisonner" as CompetenceId };
  return c[kind] ?? c.know;
};

const ROMAN: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
export function roman(n: number): string {
  let out = "";
  for (const [v, s] of ROMAN) while (n >= v) { out += s; n -= v; }
  return out;
}
/** Siècle d'une année : 1789 → « XVIIIe siècle », −52 → « Ier siècle av. J.-C. ». */
export function century(year: number): string {
  const c = Math.floor((Math.abs(year) - 1) / 100) + 1;
  return `${roman(c)}${c === 1 ? "er" : "e"} siècle${year < 0 ? " av. J.-C." : ""}`;
}
/** Année affichée : 1789, « 52 av. J.-C. ». */
export const yearText = (y: number) => (y < 0 ? `${-y} av. J.-C.` : String(y));

const LANG: Record<Lang, string> = { en: "anglais", es: "espagnol", de: "allemand", la: "latin", grc: "grec ancien" };
const lastInitial = (name: string) => (name.split(/[\s-]+/).filter((w) => /^[A-ZÀ-Ý]/.test(w)).pop() ?? name).charAt(0);

/** Pièges : d'abord dans l'unité, puis dans tout le lot ; jamais deux fois le même texte, jamais la bonne réponse. */
function distractors<F>(r: Rng, right: F, local: F[], pool: F[], key: (f: F) => string, n = 3): F[] {
  const taken = new Set([key(right)]);
  const out: F[] = [];
  for (const list of [r.shuffle(local), r.shuffle(pool)]) {
    for (const f of list) {
      if (out.length >= n) break;
      const k = key(f);
      if (taken.has(k)) continue;
      taken.add(k);
      out.push(f);
    }
  }
  return out;
}

function forUnit(set: FactSet, unitId: string): Generator[] {
  const mine = set.facts.filter((f) => f.units.includes(unitId));
  const all = <K extends Fact["kind"]>(k: K) => set.facts.filter((f): f is Of<K> => f.kind === k);
  const own = <K extends Fact["kind"]>(k: K) => mine.filter((f): f is Of<K> => f.kind === k);
  const out: Generator[] = [];
  const base = `f-${unitId}-${set.id}`;

  /* ——— Dates ——— */
  const dates = own("date"), allDates = all("date");
  if (dates.length >= 2 && allDates.length >= 4) {
    out.push(gen({
      id: `${base}-dater`, unit: unitId, title: "Dater un événement", stage: "rappel",
      make: (r, id) => {
        const f = r.pick(dates);
        const wrong = distractors(r, f, dates, allDates, (x) => String(x.year));
        return {
          activity: mcq(r, {
            id, stage: "rappel", competence: competence(unitId, "time"),
            prompt: `En quelle année : ${f.label} ?`,
            answer: { text: yearText(f.year), feedback: `${f.label} : ${f.when ?? yearText(f.year)}.` },
            wrong: wrong.map((w) => ({ text: yearText(w.year), feedback: `${yearText(w.year)}, c'est : ${w.label}.` })),
            hint: "Situe d'abord l'événement dans son siècle.",
            hints: [`C'est au ${century(f.year)}.`, `L'année se termine par ${String(Math.abs(f.year)).slice(-1)}.`],
            solution: [`${f.label} : ${f.when ?? yearText(f.year)}.`],
            takeaway: `${f.label} : ${f.when ?? yearText(f.year)} (${century(f.year)}).`,
          }),
          verify: () => wrong.length === 3 && wrong.every((w) => w.year !== f.year),
        };
      },
    }));
    out.push(gen({
      id: `${base}-evenement`, unit: unitId, title: "Associer une date à un événement", stage: "application",
      make: (r, id) => {
        const f = r.pick(dates);
        const wrong = distractors(r, f, dates, allDates, (x) => String(x.year)).filter((w) => w.label !== f.label);
        return {
          activity: mcq(r, {
            id, stage: "application", competence: competence(unitId, "time"),
            prompt: `Quel événement date de ${yearText(f.year)} ?`,
            answer: { text: f.label, feedback: `${f.label} : ${f.when ?? yearText(f.year)}.` },
            wrong: wrong.map((w) => ({ text: w.label, feedback: `${w.label} : ${w.when ?? yearText(w.year)}.` })),
            hint: `${yearText(f.year)} se situe au ${century(f.year)} : élimine ce qui n'est pas de cette époque.`,
            hints: ["Range mentalement les propositions dans l'ordre chronologique.", `Les autres propositions datent de ${wrong.map((w) => yearText(w.year)).join(", ")}.`],
            solution: [`${yearText(f.year)} : ${f.label}.`],
            takeaway: `${f.label} : ${f.when ?? yearText(f.year)}.`,
          }),
          verify: () => wrong.length === 3 && wrong.every((w) => w.year !== f.year),
        };
      },
    }));
  }
  const distinctYears = new Set(dates.map((d) => d.year)).size;
  if (distinctYears >= 4) {
    out.push(gen({
      id: `${base}-chrono`, unit: unitId, title: "Ranger des événements dans l'ordre chronologique", stage: "application",
      make: (r, id) => {
        const picked: Of<"date">[] = [];
        for (const f of r.shuffle(dates)) if (picked.length < 4 && !picked.some((p) => p.year === f.year)) picked.push(f);
        const sorted = [...picked].sort((a, b) => a.year - b.year);
        return {
          activity: order(r, {
            id, stage: "application", competence: competence(unitId, "time"),
            prompt: "Range ces événements du plus ancien au plus récent.",
            steps: sorted.map((f) => f.label),
            hint: "Cherche d'abord le plus ancien, puis le plus récent.",
            hints: ["Associe une date approximative à chaque événement.", `Le plus ancien date de ${yearText(sorted[0]!.year)}.`],
            solution: sorted.map((f) => `${yearText(f.year)} : ${f.label}.`),
            takeaway: "Une frise se lit de gauche à droite, du plus ancien au plus récent.",
          }),
          verify: () => sorted.every((f, i) => i === 0 || f.year > sorted[i - 1]!.year),
        };
      },
    }));
  }

  /* ——— Termes et définitions ——— */
  const terms = own("term"), allTerms = all("term");
  if (terms.length >= 2 && allTerms.length >= 4) {
    out.push(gen({
      id: `${base}-terme`, unit: unitId, title: "Retrouver le mot qui correspond à une définition", stage: "rappel",
      make: (r, id) => {
        const f = r.pick(terms);
        const wrong = distractors(r, f, terms, allTerms, (x) => x.term.toLowerCase());
        return {
          activity: mcq(r, {
            id, stage: "rappel", competence: competence(unitId, "know"),
            prompt: `Quel mot correspond à cette définition : « ${f.definition} » ?`,
            answer: { text: f.term, feedback: `${f.term} : ${f.definition}.` },
            wrong: wrong.map((w) => ({ text: w.term, feedback: `${w.term} : ${w.definition}.` })),
            hint: "Relis la définition mot à mot : quel terme désigne exactement cela ?",
            hints: [`Le mot commence par « ${f.term.charAt(0).toUpperCase()} ».`, `Le terme cherché compte ${f.term.replace(/[^\p{L}]/gu, "").length} lettres.`],
            solution: [`${f.term} : ${f.definition}.`],
            takeaway: `${f.term} : ${f.definition}.`,
          }),
          verify: () => wrong.length === 3 && wrong.every((w) => w.term.toLowerCase() !== f.term.toLowerCase() && w.definition !== f.definition),
        };
      },
    }));
    out.push(gen({
      id: `${base}-definition`, unit: unitId, title: "Choisir la bonne définition", stage: "application",
      make: (r, id) => {
        const f = r.pick(terms);
        const wrong = distractors(r, f, terms, allTerms, (x) => x.definition);
        return {
          activity: mcq(r, {
            id, stage: "application", competence: competence(unitId, "know"),
            prompt: `Que désigne « ${f.term} » ?`,
            answer: { text: f.definition, feedback: `C'est bien la définition de « ${f.term} ».` },
            wrong: wrong.map((w) => ({ text: w.definition, feedback: `C'est la définition de « ${w.term} ».` })),
            hint: "Cherche la définition qui s'applique exactement à ce mot, pas à un mot voisin.",
            hints: ["Élimine les définitions qui désignent un autre mot du même chapitre.", `Pense à un exemple de « ${f.term} ».`],
            solution: [`${f.term} : ${f.definition}.`],
            takeaway: `${f.term} : ${f.definition}.`,
          }),
          verify: () => wrong.length === 3 && wrong.every((w) => w.definition !== f.definition && w.term !== f.term),
        };
      },
    }));
  }

  /* ——— Œuvres et auteurs ——— */
  const works = own("work"), allWorks = all("work");
  if (works.length >= 2 && new Set(allWorks.map((w) => w.author)).size >= 4) {
    out.push(gen({
      id: `${base}-auteur`, unit: unitId, title: "Associer une œuvre à son auteur", stage: "rappel",
      make: (r, id) => {
        const f = r.pick(works);
        const wrong = distractors(r, f, works, allWorks, (x) => x.author);
        return {
          activity: mcq(r, {
            id, stage: "rappel", competence: competence(unitId, "time"),
            prompt: `Qui est l'auteur de « ${f.title} »${f.year ? ` (${yearText(f.year)})` : ""} ?`,
            answer: { text: f.author, feedback: `« ${f.title} » est de ${f.author}.` },
            wrong: wrong.map((w) => ({ text: w.author, feedback: `${w.author} est l'auteur de « ${w.title} ».` })),
            hint: f.year ? `L'œuvre date du ${century(f.year)} : quel auteur écrit à cette époque ?` : "Pense au genre et à l'époque de l'œuvre.",
            hints: [`Son nom commence par « ${lastInitial(f.author)} ».`, `${f.author.split(" ").length > 1 ? "Son prénom commence par « " + f.author.charAt(0) + " »." : "Élimine les auteurs d'une autre époque."}`],
            solution: [`« ${f.title} » : ${f.author}${f.year ? `, ${yearText(f.year)}` : ""}.`],
            takeaway: `« ${f.title} » : ${f.author}.`,
          }),
          verify: () => wrong.length === 3 && wrong.every((w) => w.author !== f.author),
        };
      },
    }));
    out.push(gen({
      id: `${base}-oeuvre`, unit: unitId, title: "Retrouver une œuvre d'un auteur", stage: "application",
      make: (r, id) => {
        const f = r.pick(works);
        const wrong = distractors(r, f, works, allWorks, (x) => x.author);
        return {
          activity: mcq(r, {
            id, stage: "application", competence: competence(unitId, "time"),
            prompt: `Laquelle de ces œuvres est de ${f.author} ?`,
            answer: { text: f.title, feedback: `« ${f.title} » est bien de ${f.author}.` },
            wrong: wrong.map((w) => ({ text: w.title, feedback: `« ${w.title} » est de ${w.author}.` })),
            hint: `Pense à l'époque et au genre de ${f.author}.`,
            hints: ["Élimine les œuvres dont tu connais l'auteur.", `L'œuvre cherchée commence par « ${f.title.replace(/^(Les?|La|L'|Un|Une) /, "").charAt(0)} ».`],
            solution: [`${f.author} : « ${f.title} »${f.year ? `, ${yearText(f.year)}` : ""}.`],
            takeaway: `« ${f.title} » : ${f.author}.`,
          }),
          verify: () => wrong.length === 3 && wrong.every((w) => w.author !== f.author && w.title !== f.title),
        };
      },
    }));
  }

  /* ——— Personnes ——— */
  const people = own("person"), allPeople = all("person");
  if (people.length >= 2 && allPeople.length >= 4) {
    out.push(gen({
      id: `${base}-personne`, unit: unitId, title: "Reconnaître un acteur de l'histoire ou de la culture", stage: "rappel",
      make: (r, id) => {
        const f = r.pick(people);
        const wrong = distractors(r, f, people, allPeople, (x) => x.name);
        return {
          activity: mcq(r, {
            id, stage: "rappel", competence: competence(unitId, "know"),
            prompt: `Qui correspond à cette description : ${f.role} ?`,
            answer: { text: f.name, feedback: `${f.name} : ${f.role}.` },
            wrong: wrong.map((w) => ({ text: w.name, feedback: `${w.name} : ${w.role}.` })),
            hint: "Pense à l'époque et au domaine de la description.",
            hints: [`Son nom commence par « ${lastInitial(f.name)} ».`, "Élimine les personnes d'une autre époque ou d'un autre domaine."],
            solution: [`${f.name} : ${f.role}.`],
            takeaway: `${f.name} : ${f.role}.`,
          }),
          verify: () => wrong.length === 3 && wrong.every((w) => w.name !== f.name && w.role !== f.role),
        };
      },
    }));
  }

  /* ——— Vocabulaire ——— */
  const words = own("word");
  for (const lang of [...new Set(words.map((w) => w.lang))]) {
    const local = words.filter((w) => w.lang === lang);
    const pool = all("word").filter((w) => w.lang === lang);
    if (local.length < 2 || pool.length < 4) continue;
    out.push(gen({
      id: `${base}-${lang}-traduire`, unit: unitId, title: `Traduire du français vers le ${LANG[lang]}`, stage: "rappel",
      make: (r, id) => {
        const f = r.pick(local);
        const wrong = distractors(r, f, local, pool, (x) => x.word.toLowerCase());
        return {
          activity: mcq(r, {
            id, stage: "rappel", competence: competence(unitId, "know"),
            prompt: `Comment dit-on « ${f.fr} » en ${LANG[lang]} ?`,
            answer: { text: f.word, feedback: `« ${f.fr} » se dit « ${f.word} ».` },
            wrong: wrong.map((w) => ({ text: w.word, feedback: `« ${w.word} » veut dire « ${w.fr} ».` })),
            hint: "Pense à une phrase où tu as déjà rencontré ce mot.",
            hints: [`Le mot commence par « ${f.word.replace(/^(the|to|el|la|los|las|der|die|das) /i, "").charAt(0)} ».`, `Il compte ${f.word.replace(/^(the|to|el|la|los|las|der|die|das) /i, "").replace(/[^\p{L}]/gu, "").length} lettres.`],
            solution: [`« ${f.fr} » : « ${f.word} ».`],
            takeaway: `${f.word} = ${f.fr}.`,
          }),
          verify: () => wrong.length === 3 && wrong.every((w) => w.word.toLowerCase() !== f.word.toLowerCase() && w.fr !== f.fr),
        };
      },
    }));
    out.push(gen({
      id: `${base}-${lang}-comprendre`, unit: unitId, title: `Comprendre un mot de ${LANG[lang]}`, stage: "application",
      make: (r, id) => {
        const f = r.pick(local);
        const wrong = distractors(r, f, local, pool, (x) => x.fr.toLowerCase());
        return {
          activity: mcq(r, {
            id, stage: "application", competence: competence(unitId, "know"),
            prompt: `Que veut dire « ${f.word} » ?`,
            answer: { text: f.fr, feedback: `« ${f.word} » veut dire « ${f.fr} ».` },
            wrong: wrong.map((w) => ({ text: w.fr, feedback: `« ${w.fr} » se dit « ${w.word} ».` })),
            hint: "Cherche un mot de la même famille en français ou dans une autre langue que tu connais.",
            hints: ["Élimine les traductions des autres mots du thème.", `La traduction commence par « ${f.fr.charAt(0)} ».`],
            solution: [`« ${f.word} » : « ${f.fr} ».`],
            takeaway: `${f.word} = ${f.fr}.`,
          }),
          verify: () => wrong.length === 3 && wrong.every((w) => w.fr.toLowerCase() !== f.fr.toLowerCase() && w.word !== f.word),
        };
      },
    }));
  }

  /* ——— Classements ——— */
  const classes = own("class");
  for (const setName of [...new Set(classes.map((c) => c.set))]) {
    const def = set.sets?.[setName];
    const local = classes.filter((c) => c.set === setName);
    const pool = all("class").filter((c) => c.set === setName);
    if (!def || local.length < 4 || new Set(local.map((c) => c.category)).size < 2) continue;
    out.push(gen({
      id: `${base}-classer-${setName}`, unit: unitId, title: def.prompt, stage: "application",
      make: (r, id) => {
        let items = r.sample(local.length >= 5 ? local : pool, Math.min(5, local.length >= 5 ? local.length : pool.length));
        if (new Set(items.map((i) => i.category)).size < 2) items = [...items.slice(0, -1), local.find((c) => c.category !== items[0]!.category)!];
        return {
          activity: classify(r, {
            id, stage: "application", competence: competence(unitId, "know"),
            prompt: def.prompt,
            categories: def.categories,
            items: items.map((i) => ({ text: i.item, category: def.categories.indexOf(i.category), feedback: `${i.item} : ${i.category}.` })),
            hint: "Commence par les éléments dont tu es sûr, puis réfléchis aux autres.",
            hints: [`Les catégories : ${def.categories.join(", ")}.`, `Par exemple, ${items[0]!.item} : ${items[0]!.category}.`],
            solution: items.map((i) => `${i.item} : ${i.category}.`),
            takeaway: `Classer, c'est appliquer un critère : ${def.categories.join(" / ")}.`,
          }),
          verify: () => items.every((i) => def.categories.includes(i.category)) && new Set(items.map((i) => i.category)).size >= 2 && new Set(items.map((i) => i.item)).size === items.length,
        };
      },
    }));
  }
  return out;
}

/** Tous les générateurs tirés des faits, unité par unité. */
export function factGenerators(sets: FactSet[]): Generator[] {
  const out: Generator[] = [];
  for (const set of sets) {
    const units = [...new Set(set.facts.flatMap((f) => f.units))];
    for (const u of units) out.push(...forUnit(set, u));
  }
  return out;
}
