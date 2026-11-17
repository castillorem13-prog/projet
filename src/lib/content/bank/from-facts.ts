import type { CompetenceId } from "@/lib/content/types";
import { findUnit } from "@/lib/curriculum";
import type { SubjectId } from "@/lib/curriculum/types";
import { ask, classify, gen, mcq, order, timeline } from "./build";
import { upper } from "./format";
import type { Rng } from "./rand";
import type { Fact, FactSet, Generator, Lang } from "./types";

/**
 * Questions tirées des faits sourcés : la bonne réponse et les pièges viennent tous de faits vérifiés,
 * et chaque piège est expliqué par le fait auquel il appartient (« 1815 est la date de Waterloo »).
 *
 * Un même fait est travaillé sous plusieurs formes, de la reconnaissance à la production :
 * choisir, écrire, classer, associer, dire vrai ou faux, trouver l'intrus, remettre dans l'ordre, calculer une durée.
 * Chaque contre-épreuve (`verify`) relit les tables de faits par un autre chemin que celui qui a fabriqué l'énoncé.
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
/** Numéro du siècle d'une année, négatif avant notre ère : 1789 → 18, −52 → −1. */
export const centuryIndex = (year: number): number => (year > 0 ? 1 : -1) * (Math.floor((Math.abs(year) - 1) / 100) + 1);
/** Nom d'un siècle : 18 → « XVIIIe siècle », −1 → « Ier siècle av. J.-C. ». */
export const centuryName = (c: number): string => `${roman(Math.abs(c))}${Math.abs(c) === 1 ? "er" : "e"} siècle${c < 0 ? " av. J.-C." : ""}`;
/** Siècle d'une année : 1789 → « XVIIIe siècle », −52 → « Ier siècle av. J.-C. ». */
export const century = (year: number): string => centuryName(centuryIndex(year));
/** Année affichée : 1789, « 52 av. J.-C. ». */
export const yearText = (y: number) => (y < 0 ? `${-y} av. J.-C.` : String(y));
/** Première et dernière année d'un siècle : 18 → [1701, 1800] ; −1 → [−100, −1]. */
export const centurySpan = (c: number): [number, number] => (c > 0 ? [(c - 1) * 100 + 1, c * 100] : [c * 100, (c + 1) * 100 - 1]);
const spanText = (c: number) => {
  const [a, b] = centurySpan(c);
  return c > 0 ? `de ${a} à ${b}` : `de ${-a} à ${-b} av. J.-C.`;
};
/** Siècle voisin, en sautant le passage à notre ère (il n'y a pas de siècle zéro). */
const shiftCentury = (c: number, by: number) => {
  const i = (c > 0 ? c - 1 : c) + by;
  return i >= 0 ? i + 1 : i;
};

const LANG: Record<Lang, string> = { en: "anglais", es: "espagnol", de: "allemand", la: "latin", grc: "grec ancien" };
const ARTICLE = /^(the|to|el|la|los|las|der|die|das) /i;
const lastInitial = (name: string) => (name.split(/[\s-]+/).filter((w) => /^[A-ZÀ-Ý]/.test(w)).pop() ?? name).charAt(0);
const when = (f: Of<"date">) => f.when ?? yearText(f.year);
/** Libellé court, utilisable comme étiquette de catégorie. */
const short = (s: string) => s.length <= 34;

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

/**
 * Pièges plausibles pour une date : les repères les plus proches dans le temps, ceux du chapitre d'abord.
 * Un piège très éloigné (l'Antiquité pour une question sur 1789) n'apprend rien.
 */
function nearDates(r: Rng, right: Of<"date">, local: Of<"date">[], pool: Of<"date">[], n = 3): Of<"date">[] {
  const mine = new Set(local.map((d) => d.id));
  const seen = new Set([right.year]);
  const ranked: { d: Of<"date">; gap: number }[] = [];
  for (const d of [...local, ...pool]) {
    if (seen.has(d.year)) continue;
    seen.add(d.year);
    ranked.push({ d, gap: Math.abs(d.year - right.year) * (mine.has(d.id) ? 0.5 : 1) });
  }
  ranked.sort((a, b) => a.gap - b.gap || a.d.id.localeCompare(b.d.id));
  return r.sample(ranked.slice(0, Math.max(n + 2, 5)).map((x) => x.d), n);
}

/** n éléments distincts selon `key`, d'abord dans l'unité, complétés par le lot. */
function pickDistinct<F>(r: Rng, local: F[], pool: F[], key: (f: F) => string, n: number, ok: (f: F) => boolean = () => true): F[] {
  const seen = new Set<string>();
  const out: F[] = [];
  for (const list of [r.shuffle(local), r.shuffle(pool)]) {
    for (const f of list) {
      if (out.length >= n) break;
      const k = key(f);
      if (seen.has(k) || !ok(f)) continue;
      seen.add(k);
      out.push(f);
    }
  }
  return out;
}

/** Deux à trois affirmations vraies ou fausses sur quatre : jamais toutes vraies, jamais toutes fausses. */
const truthPattern = (r: Rng): boolean[] => r.shuffle([true, false, r.chance(0.5), r.chance(0.5)]);

const TRUE_FALSE = ["Vrai", "Faux"];

function forUnit(set: FactSet, unitId: string): Generator[] {
  const mine = set.facts.filter((f) => f.units.includes(unitId));
  const all = <K extends Fact["kind"]>(k: K) => set.facts.filter((f): f is Of<K> => f.kind === k);
  const own = <K extends Fact["kind"]>(k: K) => mine.filter((f): f is Of<K> => f.kind === k);
  const out: Generator[] = [];
  const base = `f-${unitId}-${set.id}`;
  const know = competence(unitId, "know");
  const time = competence(unitId, "time");

  /* ——— Dates ——— */
  const dates = own("date"), allDates = all("date");
  /** Table de contrôle : l'année de chaque repère, relue indépendamment de la question posée. */
  const yearOf = new Map(allDates.map((d) => [d.label, d.year]));
  if (dates.length >= 2 && allDates.length >= 4) {
    out.push(gen({
      id: `${base}-dater`, unit: unitId, title: "Dater un événement", stage: "rappel",
      make: (r, id) => {
        const f = r.pick(dates);
        const wrong = nearDates(r, f, dates, allDates);
        return {
          activity: mcq(r, {
            id, stage: "rappel", competence: time,
            prompt: `De quelle année date ce repère ? « ${f.label} »`,
            answer: { text: yearText(f.year), feedback: `${f.label} : ${when(f)}.` },
            wrong: wrong.map((w) => ({ text: yearText(w.year), feedback: `${yearText(w.year)}, c'est : ${w.label}.` })),
            hint: "Situe d'abord l'événement dans son siècle.",
            hints: [`C'est au ${century(f.year)}.`, `L'année se termine par ${String(Math.abs(f.year)).slice(-1)}.`],
            solution: [`${f.label} : ${when(f)}.`],
            takeaway: `${f.label} : ${when(f)} (${century(f.year)}).`,
          }),
          verify: () => wrong.length === 3 && yearOf.get(f.label) === f.year && wrong.every((w) => w.year !== f.year),
        };
      },
    }));
    out.push(gen({
      id: `${base}-evenement`, unit: unitId, title: "Associer une date à un événement", stage: "application",
      make: (r, id) => {
        const f = r.pick(dates);
        const wrong = nearDates(r, f, dates, allDates).filter((w) => w.label !== f.label);
        return {
          activity: mcq(r, {
            id, stage: "application", competence: time,
            prompt: `Quel repère correspond à l'année ${yearText(f.year)} ?`,
            answer: { text: f.label, feedback: `${f.label} : ${when(f)}.` },
            wrong: wrong.map((w) => ({ text: w.label, feedback: `${w.label} : ${when(w)}.` })),
            hint: `${yearText(f.year)} se situe au ${century(f.year)} : élimine ce qui n'est pas de cette époque.`,
            hints: ["Range mentalement les propositions dans l'ordre chronologique.", `Les autres propositions datent de ${wrong.map((w) => yearText(w.year)).join(", ")}.`],
            solution: [`${yearText(f.year)} : ${f.label}.`],
            takeaway: `${f.label} : ${when(f)}.`,
          }),
          verify: () => wrong.length === 3 && wrong.every((w) => yearOf.get(w.label) !== f.year),
        };
      },
    }));
    out.push(gen({
      id: `${base}-siecle`, unit: unitId, title: "Situer un événement dans son siècle", stage: "rappel",
      make: (r, id) => {
        const f = r.pick(dates);
        const c = centuryIndex(f.year);
        const others = r.sample([-2, -1, 1, 2].map((k) => shiftCentury(c, k)), 3);
        return {
          activity: mcq(r, {
            id, stage: "rappel", competence: time,
            prompt: `À quel siècle appartient ce repère ? « ${f.label} » (${yearText(f.year)})`,
            answer: { text: centuryName(c), feedback: `${yearText(f.year)} est au ${centuryName(c)}, qui va ${spanText(c)}.` },
            wrong: others.map((o) => ({ text: centuryName(o), feedback: `Le ${centuryName(o)} va ${spanText(o)}.` })),
            hint: f.year > 0 ? "Le numéro du siècle dépasse d'une unité le nombre de centaines de l'année." : "Avant notre ère, on compte les siècles à rebours : le Ier siècle av. J.-C. va de 100 à 1 av. J.-C.",
            hints: [f.year > 0 ? "Les années 1701 à 1800 forment le XVIIIe siècle : le siècle porte le numéro de sa dernière année." : "Les années 500 à 401 av. J.-C. forment le Ve siècle av. J.-C.", `Le ${centuryName(c)} va ${spanText(c)}.`],
            solution: [`${yearText(f.year)} est compris dans la période qui va ${spanText(c)} : c'est le ${centuryName(c)}.`],
            takeaway: f.year > 0 ? "Un siècle porte le numéro de sa dernière année : 1701 à 1800, c'est le XVIIIe siècle." : "Avant notre ère, les siècles se comptent à rebours : 100 à 1 av. J.-C., c'est le Ier siècle av. J.-C.",
          }),
          verify: () => {
            const inside = (cc: number) => f.year >= centurySpan(cc)[0] && f.year <= centurySpan(cc)[1];
            return inside(c) && others.length === 3 && others.every((o) => !inside(o)) && Math.ceil(Math.abs(f.year) / 100) === Math.abs(c);
          },
        };
      },
    }));
    out.push(gen({
      id: `${base}-vraifaux-dates`, unit: unitId, title: "Vrai ou faux : les dates du chapitre", stage: "application",
      make: (r, id) => {
        const picked = pickDistinct(r, dates, allDates, (d) => d.label, 4);
        const pattern = truthPattern(r);
        const items = picked.map((f, i) => {
          const other = pattern[i] ? undefined : nearDates(r, f, dates, allDates, 1)[0];
          const year = other ? other.year : f.year;
          return {
            text: `${f.label} : ${yearText(year)}.`,
            ok: !other,
            claim: [f.label, year] as const,
            feedback: other ? `Faux : ${f.label}, c'est ${when(f)}. ${yearText(other.year)} correspond à : ${other.label}.` : `Vrai : ${f.label}, ${when(f)}.`,
          };
        });
        return {
          activity: classify(r, {
            id, stage: "application", competence: time,
            prompt: "Vrai ou faux ? Vérifie la date de chaque repère.",
            categories: TRUE_FALSE,
            items: items.map((i) => ({ text: i.text, category: i.ok ? 0 : 1, feedback: i.feedback })),
            hint: "Pour chaque repère, demande-toi d'abord dans quel siècle il se situe.",
            hints: [`Il y a ${items.filter((i) => !i.ok).length} date${items.filter((i) => !i.ok).length > 1 ? "s" : ""} fausse${items.filter((i) => !i.ok).length > 1 ? "s" : ""}.`, `Par exemple : ${picked[0]!.label}, c'est ${when(picked[0]!)}.`],
            solution: picked.map((f) => `${f.label} : ${when(f)}.`),
            takeaway: "Retenir une date, c'est l'attacher à son événement et à son siècle.",
          }),
          verify: () => items.length === 4 && items.some((i) => i.ok) && items.some((i) => !i.ok) && items.every((i) => i.ok === (yearOf.get(i.claim[0]) === i.claim[1])),
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
            id, stage: "application", competence: time,
            prompt: "Range ces événements du plus ancien au plus récent.",
            steps: sorted.map((f) => f.label),
            hint: "Cherche d'abord le plus ancien, puis le plus récent.",
            hints: ["Associe une date approximative à chaque événement.", `Le plus ancien date de ${yearText(sorted[0]!.year)}.`],
            solution: sorted.map((f) => `${yearText(f.year)} : ${f.label}.`),
            takeaway: "Une frise se lit de gauche à droite, du plus ancien au plus récent.",
          }),
          verify: () => sorted.every((f, i) => i === 0 || yearOf.get(f.label)! > yearOf.get(sorted[i - 1]!.label)!),
        };
      },
    }));
  }
  if (distinctYears >= 2 && new Set(allDates.map((d) => d.year)).size >= 4) {
    out.push(gen({
      id: `${base}-avant`, unit: unitId, title: "Repérer le plus ancien ou le plus récent", stage: "application",
      make: (r, id) => {
        const anchor = r.pick(dates);
        const picked = [anchor, ...nearDates(r, anchor, dates, allDates)];
        const oldest = r.chance(0.5);
        const sorted = [...picked].sort((a, b) => a.year - b.year);
        const answer = oldest ? sorted[0]! : sorted[sorted.length - 1]!;
        return {
          activity: mcq(r, {
            id, stage: "application", competence: time,
            prompt: `Lequel de ces événements est le plus ${oldest ? "ancien" : "récent"} ?`,
            answer: { text: answer.label, feedback: `${answer.label} : ${when(answer)}. C'est bien le plus ${oldest ? "ancien" : "récent"} des quatre.` },
            wrong: picked.filter((p) => p !== answer).map((w) => ({ text: w.label, feedback: `${w.label} : ${when(w)}, ${oldest ? "après" : "avant"} ${yearText(answer.year)}.` })),
            hint: "Donne une date, même approximative, à chaque proposition.",
            hints: ["Range les quatre propositions sur une frise.", `Les quatre dates sont : ${sorted.map((s) => yearText(s.year)).join(", ")}.`],
            solution: sorted.map((s) => `${yearText(s.year)} : ${s.label}.`),
            takeaway: "Pour comparer des événements, on les place sur une frise : le plus ancien est le plus à gauche.",
          }),
          verify: () => picked.length === 4 && picked.every((p) => (oldest ? yearOf.get(p.label)! >= yearOf.get(answer.label)! : yearOf.get(p.label)! <= yearOf.get(answer.label)!)) && picked.filter((p) => p.year === answer.year).length === 1,
        };
      },
    }));
  }
  const typed = dates.filter((d) => d.year > 0);
  if (typed.length >= 2) {
    out.push(gen({
      id: `${base}-annee`, unit: unitId, title: "Écrire la date d'un repère", stage: "rappel", capacity: typed.length,
      make: (r, id) => {
        const f = r.pick(typed);
        return {
          activity: ask({
            id, stage: "rappel", competence: time,
            context: `Repère du chapitre : « ${f.label} ».`,
            prompt: "En quelle année ? Écris l'année en chiffres.",
            expected: f.year,
            hint: `C'est au ${century(f.year)}.`,
            partHint: `L'année commence par ${String(f.year).slice(0, -2) || String(f.year).charAt(0)} et se termine par ${String(f.year).slice(-1)}.`,
            solution: [`${f.label} : ${when(f)}.`],
            recap: `${f.label} : ${f.year}`,
            review: f.label,
            takeaway: `${f.label} : ${when(f)} (${century(f.year)}).`,
          }),
          verify: () => yearOf.get(f.label) === f.year && f.year >= centurySpan(centuryIndex(f.year))[0] && f.year <= centurySpan(centuryIndex(f.year))[1],
        };
      },
    }));
  }
  /** Couples de repères d'une même ère : la durée qui les sépare se calcule par une soustraction. */
  const pairs: [Of<"date">, Of<"date">][] = [];
  for (const a of dates) for (const b of dates) if (a.year < b.year && a.year > 0 === b.year > 0) pairs.push([a, b]);
  if (pairs.length >= 1) {
    out.push(gen({
      id: `${base}-duree`, unit: unitId, title: "Calculer la durée entre deux événements", stage: "application", capacity: pairs.length,
      make: (r, id) => {
        const [a, b] = r.pick(pairs);
        const gap = b.year - a.year;
        const bc = a.year < 0;
        return {
          activity: ask({
            id, stage: "application", competence: time,
            stimulus: timeline("Deux repères du chapitre", [{ date: yearText(a.year), label: a.label }, { date: yearText(b.year), label: b.label }]),
            context: "Observe les deux repères de la frise.",
            prompt: "Combien d'années les séparent ?",
            expected: gap,
            ...(bc ? { errors: [{ value: -a.year - b.year, code: "addition", message: "Les deux dates sont avant notre ère : on soustrait le plus petit nombre du plus grand.", type: "procedurale" as const }] } : {}),
            hint: bc ? "Avant notre ère, la date la plus ancienne est le plus grand nombre." : "Une durée se calcule par une soustraction : date la plus récente − date la plus ancienne.",
            partHint: bc ? `Calcule ${-a.year} − ${-b.year}.` : `Calcule ${b.year} − ${a.year}.`,
            solution: [bc ? `${-a.year} − ${-b.year} = ${gap} ans.` : `${b.year} − ${a.year} = ${gap} ans.`],
            recap: `${gap} ans entre les deux repères`,
            review: "Calculer une durée",
            takeaway: bc ? "Avant notre ère, les années se comptent à rebours : la durée reste une soustraction." : "Durée = date la plus récente − date la plus ancienne.",
          }),
          verify: () => gap > 0 && yearOf.get(a.label)! + gap === yearOf.get(b.label)!,
        };
      },
    }));
  }
  /** Siècles représentés par au moins un repère du chapitre. */
  const byCentury = new Map<number, Of<"date">[]>();
  for (const d of dates) byCentury.set(centuryIndex(d.year), [...(byCentury.get(centuryIndex(d.year)) ?? []), d]);
  if (dates.length >= 4 && byCentury.size >= 2) {
    out.push(gen({
      id: `${base}-siecles`, unit: unitId, title: "Classer des événements par siècle", stage: "application",
      make: (r, id) => {
        // Trois siècles au plus, les mieux fournis d'abord (à égalité, le hasard décide).
        const kept = r.shuffle([...byCentury.keys()]).sort((a, b) => byCentury.get(b)!.length - byCentury.get(a)!.length).slice(0, 3).sort((a, b) => a - b);
        const candidates = dates.filter((d) => kept.includes(centuryIndex(d.year)));
        // Un repère par siècle retenu d'abord, pour que chaque catégorie serve, puis on complète.
        const first = kept.map((c) => r.pick(byCentury.get(c)!));
        const items = [...first, ...r.shuffle(candidates.filter((d) => !first.includes(d)))].slice(0, 5);
        const names = kept.map(centuryName);
        return {
          activity: classify(r, {
            id, stage: "application", competence: time,
            prompt: "Classe chaque repère dans son siècle.",
            categories: names,
            items: items.map((d) => ({ text: d.label, category: kept.indexOf(centuryIndex(d.year)), feedback: `${d.label} : ${when(d)}, donc ${century(d.year)}.` })),
            hint: "Retrouve d'abord la date de chaque repère.",
            hints: ["Un siècle porte le numéro de sa dernière année : 1801 à 1900, c'est le XIXe siècle.", `Par exemple : ${items[0]!.label}, ${yearText(items[0]!.year)}.`],
            solution: items.map((d) => `${d.label} : ${yearText(d.year)}, ${century(d.year)}.`),
            takeaway: "Situer un événement dans son siècle aide à retenir sa date.",
          }),
          verify: () => items.length >= 3 && new Set(items.map((d) => centuryIndex(d.year))).size >= 2 && new Set(items.map((d) => d.label)).size === items.length && items.every((d) => {
            const [from, to] = centurySpan(kept[kept.indexOf(centuryIndex(d.year))]!);
            const y = yearOf.get(d.label)!;
            return y >= from && y <= to;
          }),
        };
      },
    }));
  }

  /* ——— Termes et définitions ——— */
  const terms = own("term"), allTerms = all("term");
  const definitionOf = new Map(allTerms.map((t) => [t.term, t.definition]));
  if (terms.length >= 2 && allTerms.length >= 4) {
    out.push(gen({
      id: `${base}-terme`, unit: unitId, title: "Retrouver le mot qui correspond à une définition", stage: "rappel",
      make: (r, id) => {
        const f = r.pick(terms);
        const wrong = distractors(r, f, terms, allTerms, (x) => x.term.toLowerCase());
        return {
          activity: mcq(r, {
            id, stage: "rappel", competence: know,
            prompt: `Quel mot correspond à cette définition ? « ${f.definition} »`,
            answer: { text: f.term, feedback: `${f.term} : ${f.definition}.` },
            wrong: wrong.map((w) => ({ text: w.term, feedback: `${w.term} : ${w.definition}.` })),
            hint: "Relis la définition mot à mot : quel terme désigne exactement cela ?",
            hints: [`Le mot commence par « ${f.term.charAt(0).toUpperCase()} ».`, `Le terme cherché compte ${f.term.replace(/[^\p{L}]/gu, "").length} lettres.`],
            solution: [`${f.term} : ${f.definition}.`],
            takeaway: `${f.term} : ${f.definition}.`,
          }),
          verify: () => wrong.length === 3 && definitionOf.get(f.term) === f.definition && wrong.every((w) => w.term.toLowerCase() !== f.term.toLowerCase() && definitionOf.get(w.term) !== f.definition),
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
            id, stage: "application", competence: know,
            prompt: `Que désigne « ${f.term} » ?`,
            answer: { text: f.definition, feedback: `C'est bien la définition de « ${f.term} ».` },
            wrong: wrong.map((w) => ({ text: w.definition, feedback: `C'est la définition de « ${w.term} ».` })),
            hint: "Cherche la définition qui s'applique exactement à ce mot, pas à un mot voisin.",
            hints: ["Élimine les définitions qui désignent un autre mot du même chapitre.", `Pense à un exemple de « ${f.term} ».`],
            solution: [`${f.term} : ${f.definition}.`],
            takeaway: `${f.term} : ${f.definition}.`,
          }),
          verify: () => wrong.length === 3 && wrong.every((w) => w.definition !== definitionOf.get(f.term) && w.term !== f.term),
        };
      },
    }));
    out.push(gen({
      id: `${base}-vraifaux-termes`, unit: unitId, title: "Vrai ou faux : le vocabulaire du chapitre", stage: "application",
      make: (r, id) => {
        const picked = pickDistinct(r, terms, allTerms, (t) => t.term, 4);
        const pattern = truthPattern(r);
        const items = picked.map((f, i) => {
          const other = pattern[i] ? undefined : distractors(r, f, terms, allTerms, (x) => x.definition, 1)[0];
          return {
            text: `${f.term} : ${other ? other.definition : f.definition}.`,
            ok: !other,
            claim: [f.term, other ? other.definition : f.definition] as const,
            feedback: other ? `Faux : c'est la définition de « ${other.term} ». ${f.term} : ${f.definition}.` : `Vrai : ${f.term}, ${f.definition}.`,
          };
        });
        return {
          activity: classify(r, {
            id, stage: "application", competence: know,
            prompt: "Vrai ou faux ? Chaque mot est suivi d'une définition : est-ce la bonne ?",
            categories: TRUE_FALSE,
            items: items.map((i) => ({ text: i.text, category: i.ok ? 0 : 1, feedback: i.feedback })),
            hint: "Lis chaque définition jusqu'au bout : un seul détail peut la rendre fausse.",
            hints: ["Demande-toi quel autre mot du chapitre la définition pourrait désigner.", `Par exemple, ${picked[0]!.term} : ${picked[0]!.definition}.`],
            solution: picked.map((f) => `${f.term} : ${f.definition}.`),
            takeaway: "Connaître un mot, c'est pouvoir le distinguer des mots voisins.",
          }),
          verify: () => items.length === 4 && items.some((i) => i.ok) && items.some((i) => !i.ok) && items.every((i) => i.ok === (definitionOf.get(i.claim[0]) === i.claim[1])),
        };
      },
    }));
  }
  const shortTerms = terms.filter((t) => short(t.term));
  if (shortTerms.length >= 3) {
    out.push(gen({
      id: `${base}-associer-termes`, unit: unitId, title: "Associer chaque définition à son mot", stage: "application",
      make: (r, id) => {
        const picked = r.sample(shortTerms, 3);
        return {
          activity: classify(r, {
            id, stage: "application", competence: know,
            prompt: "Associe chaque définition au mot qu'elle désigne.",
            categories: picked.map((t) => t.term),
            items: picked.map((t, i) => ({ text: t.definition, category: i, feedback: `${t.term} : ${t.definition}.` })),
            hint: "Commence par la définition dont tu es le plus sûr.",
            hints: ["Procède par élimination : chaque mot ne sert qu'une fois.", `${picked[0]!.term} : ${picked[0]!.definition}.`],
            solution: picked.map((t) => `${t.term} : ${t.definition}.`),
            takeaway: picked.map((t) => `${t.term} : ${t.definition}`).join(" ; ") + ".",
          }),
          verify: () => new Set(picked.map((t) => t.term)).size === 3 && new Set(picked.map((t) => t.definition)).size === 3 && picked.every((t) => definitionOf.get(t.term) === t.definition),
        };
      },
    }));
  }

  /* ——— Œuvres et auteurs ——— */
  const works = own("work"), allWorks = all("work");
  const authorOf = new Map(allWorks.map((w) => [w.title, w.author]));
  if (works.length >= 2 && new Set(allWorks.map((w) => w.author)).size >= 4) {
    out.push(gen({
      id: `${base}-auteur`, unit: unitId, title: "Associer une œuvre à son auteur", stage: "rappel",
      make: (r, id) => {
        const f = r.pick(works);
        const wrong = distractors(r, f, works, allWorks, (x) => x.author);
        return {
          activity: mcq(r, {
            id, stage: "rappel", competence: time,
            prompt: `Qui est l'auteur de « ${f.title} »${f.year ? ` (${yearText(f.year)})` : ""} ?`,
            answer: { text: f.author, feedback: `« ${f.title} » est de ${f.author}.` },
            wrong: wrong.map((w) => ({ text: w.author, feedback: `${w.author} est l'auteur de « ${w.title} ».` })),
            hint: f.year ? `L'œuvre date du ${century(f.year)} : quel auteur écrit à cette époque ?` : "Pense au genre et à l'époque de l'œuvre.",
            hints: [`Son nom commence par « ${lastInitial(f.author)} ».`, `${f.author.split(" ").length > 1 ? "Son prénom commence par « " + f.author.charAt(0) + " »." : "Élimine les auteurs d'une autre époque."}`],
            solution: [`« ${f.title} » : ${f.author}${f.year ? `, ${yearText(f.year)}` : ""}.`],
            takeaway: `« ${f.title} » : ${f.author}.`,
          }),
          verify: () => wrong.length === 3 && authorOf.get(f.title) === f.author && wrong.every((w) => w.author !== f.author),
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
            id, stage: "application", competence: time,
            prompt: `Laquelle de ces œuvres est de ${f.author} ?`,
            answer: { text: f.title, feedback: `« ${f.title} » est bien de ${f.author}.` },
            wrong: wrong.map((w) => ({ text: w.title, feedback: `« ${w.title} » est de ${w.author}.` })),
            hint: `Pense à l'époque et au genre de ${f.author}.`,
            hints: ["Élimine les œuvres dont tu connais l'auteur.", `L'œuvre cherchée commence par « ${f.title.replace(/^(Les?|La|L'|Un|Une) /, "").charAt(0)} ».`],
            solution: [`${f.author} : « ${f.title} »${f.year ? `, ${yearText(f.year)}` : ""}.`],
            takeaway: `« ${f.title} » : ${f.author}.`,
          }),
          verify: () => wrong.length === 3 && wrong.every((w) => authorOf.get(w.title) !== f.author && w.title !== f.title),
        };
      },
    }));
    out.push(gen({
      id: `${base}-vraifaux-oeuvres`, unit: unitId, title: "Vrai ou faux : les œuvres et leurs auteurs", stage: "application",
      make: (r, id) => {
        const picked = pickDistinct(r, works, allWorks, (w) => w.title, 4);
        const pattern = truthPattern(r);
        const items = picked.map((f, i) => {
          const other = pattern[i] ? undefined : distractors(r, f, works, allWorks, (x) => x.author, 1)[0];
          const author = other ? other.author : f.author;
          return {
            text: `« ${f.title} » est de ${author}.`,
            ok: !other,
            claim: [f.title, author] as const,
            feedback: other ? `Faux : « ${f.title} » est de ${f.author}. ${other.author} est l'auteur de « ${other.title} ».` : `Vrai : « ${f.title} » est de ${f.author}.`,
          };
        });
        return {
          activity: classify(r, {
            id, stage: "application", competence: time,
            prompt: "Vrai ou faux ? Vérifie l'auteur de chaque œuvre.",
            categories: TRUE_FALSE,
            items: items.map((i) => ({ text: i.text, category: i.ok ? 0 : 1, feedback: i.feedback })),
            hint: "Pense au genre et à l'époque de chaque œuvre.",
            hints: ["Un auteur peut avoir écrit plusieurs œuvres de la liste.", `Par exemple, « ${picked[0]!.title} » est de ${picked[0]!.author}.`],
            solution: picked.map((f) => `« ${f.title} » : ${f.author}.`),
            takeaway: "Une œuvre se retient avec son auteur, son genre et son siècle.",
          }),
          verify: () => items.length === 4 && items.some((i) => i.ok) && items.some((i) => !i.ok) && items.every((i) => i.ok === (authorOf.get(i.claim[0]) === i.claim[1])),
        };
      },
    }));
  }
  const ownAuthors = [...new Set(works.map((w) => w.author))].filter(short);
  if (ownAuthors.length >= 3) {
    out.push(gen({
      id: `${base}-associer-oeuvres`, unit: unitId, title: "Associer chaque œuvre à son auteur", stage: "application",
      make: (r, id) => {
        const authors = r.sample(ownAuthors, 3);
        const first = authors.map((a) => r.pick(works.filter((w) => w.author === a)));
        const more = r.shuffle(works.filter((w) => authors.includes(w.author) && !first.includes(w))).slice(0, 1);
        const items = [...first, ...more];
        return {
          activity: classify(r, {
            id, stage: "application", competence: time,
            prompt: "Associe chaque œuvre à son auteur.",
            categories: authors,
            items: items.map((w) => ({ text: `« ${w.title} »${w.year ? ` (${yearText(w.year)})` : ""}`, category: authors.indexOf(w.author), feedback: `« ${w.title} » est de ${w.author}.` })),
            hint: "Commence par l'œuvre dont tu es le plus sûr.",
            hints: ["Un même auteur peut avoir écrit deux œuvres de la liste.", `« ${items[0]!.title} » est de ${items[0]!.author}.`],
            solution: items.map((w) => `« ${w.title} » : ${w.author}.`),
            takeaway: items.map((w) => `« ${w.title} » : ${w.author}`).join(" ; ") + ".",
          }),
          verify: () => items.length >= 3 && new Set(items.map((w) => w.title)).size === items.length && items.every((w) => authors.includes(authorOf.get(w.title)!)),
        };
      },
    }));
  }
  const dated = works.filter((w): w is Of<"work"> & { year: number } => w.year !== undefined);
  if (dated.length >= 2) {
    out.push(gen({
      id: `${base}-siecle-oeuvre`, unit: unitId, title: "Situer une œuvre dans son siècle", stage: "application", capacity: dated.length,
      make: (r, id) => {
        const f = r.pick(dated);
        const c = centuryIndex(f.year);
        const others = r.sample([-2, -1, 1, 2].map((k) => shiftCentury(c, k)), 3);
        return {
          activity: mcq(r, {
            id, stage: "application", competence: time,
            prompt: `De quel siècle date « ${f.title} », de ${f.author} ?`,
            answer: { text: centuryName(c), feedback: `« ${f.title} » date de ${yearText(f.year)} : ${centuryName(c)}.` },
            wrong: others.map((o) => ({ text: centuryName(o), feedback: `Le ${centuryName(o)} va ${spanText(o)} ; « ${f.title} » date de ${yearText(f.year)}.` })),
            hint: `Pense à l'époque où vit ${f.author}.`,
            hints: ["Un siècle porte le numéro de sa dernière année : 1601 à 1700, c'est le XVIIe siècle.", `L'œuvre date de ${yearText(f.year)}.`],
            solution: [`« ${f.title} » : ${f.author}, ${yearText(f.year)}, donc ${centuryName(c)}.`],
            takeaway: `« ${f.title} » (${f.author}) : ${yearText(f.year)}, ${centuryName(c)}.`,
          }),
          verify: () => f.year >= centurySpan(c)[0] && f.year <= centurySpan(c)[1] && others.every((o) => f.year < centurySpan(o)[0] || f.year > centurySpan(o)[1]),
        };
      },
    }));
  }
  if (new Set(dated.map((w) => w.year)).size >= 4) {
    out.push(gen({
      id: `${base}-chrono-oeuvres`, unit: unitId, title: "Ranger des œuvres dans l'ordre chronologique", stage: "application",
      make: (r, id) => {
        const picked: (typeof dated)[number][] = [];
        for (const f of r.shuffle(dated)) if (picked.length < 4 && !picked.some((p) => p.year === f.year)) picked.push(f);
        const sorted = [...picked].sort((a, b) => a.year - b.year);
        return {
          activity: order(r, {
            id, stage: "application", competence: time,
            prompt: "Range ces œuvres de la plus ancienne à la plus récente.",
            steps: sorted.map((f) => `« ${f.title} », ${f.author}`),
            hint: "Situe d'abord chaque auteur dans son siècle.",
            hints: ["Cherche l'œuvre la plus ancienne, puis la plus récente.", `La plus ancienne date de ${yearText(sorted[0]!.year)}.`],
            solution: sorted.map((f) => `${yearText(f.year)} : « ${f.title} », ${f.author}.`),
            takeaway: "Situer une œuvre dans son siècle, c'est la relier à un mouvement et à une époque.",
          }),
          verify: () => sorted.length === 4 && sorted.every((f, i) => i === 0 || f.year > sorted[i - 1]!.year),
        };
      },
    }));
  }

  /* ——— Personnes ——— */
  const people = own("person"), allPeople = all("person");
  const roleOf = new Map(allPeople.map((p) => [p.name, p.role]));
  if (people.length >= 2 && allPeople.length >= 4) {
    out.push(gen({
      id: `${base}-personne`, unit: unitId, title: "Reconnaître un acteur de l'histoire ou de la culture", stage: "rappel",
      make: (r, id) => {
        const f = r.pick(people);
        const wrong = distractors(r, f, people, allPeople, (x) => x.name);
        return {
          activity: mcq(r, {
            id, stage: "rappel", competence: know,
            prompt: `Qui correspond à cette description ? « ${upper(f.role)} »`,
            answer: { text: f.name, feedback: `${f.name} : ${f.role}.` },
            wrong: wrong.map((w) => ({ text: w.name, feedback: `${w.name} : ${w.role}.` })),
            hint: "Pense à l'époque et au domaine de la description.",
            hints: [`Son nom commence par « ${lastInitial(f.name)} ».`, "Élimine les personnes d'une autre époque ou d'un autre domaine."],
            solution: [`${f.name} : ${f.role}.`],
            takeaway: `${f.name} : ${f.role}.`,
          }),
          verify: () => wrong.length === 3 && roleOf.get(f.name) === f.role && wrong.every((w) => w.name !== f.name && roleOf.get(w.name) !== f.role),
        };
      },
    }));
    out.push(gen({
      id: `${base}-role`, unit: unitId, title: "Dire qui est un personnage", stage: "application",
      make: (r, id) => {
        const f = r.pick(people);
        const wrong = distractors(r, f, people, allPeople, (x) => x.role);
        return {
          activity: mcq(r, {
            id, stage: "application", competence: know,
            prompt: `Qui est ${f.name} ?`,
            answer: { text: upper(f.role), feedback: `C'est bien ${f.name}.` },
            wrong: wrong.map((w) => ({ text: upper(w.role), feedback: `Cette description est celle de ${w.name}.` })),
            hint: "Rattache d'abord ce nom à une époque ou à un domaine.",
            hints: ["Élimine les descriptions qui désignent quelqu'un d'autre.", `${f.name} : ${f.role.split(/[,;]/)[0]}…`],
            solution: [`${f.name} : ${f.role}.`],
            takeaway: `${f.name} : ${f.role}.`,
          }),
          verify: () => wrong.length === 3 && wrong.every((w) => w.role !== roleOf.get(f.name) && w.name !== f.name),
        };
      },
    }));
    out.push(gen({
      id: `${base}-vraifaux-personnes`, unit: unitId, title: "Vrai ou faux : les personnages du chapitre", stage: "application",
      make: (r, id) => {
        const picked = pickDistinct(r, people, allPeople, (p) => p.name, 4);
        const pattern = truthPattern(r);
        const items = picked.map((f, i) => {
          const other = pattern[i] ? undefined : distractors(r, f, people, allPeople, (x) => x.role, 1)[0];
          const role = other ? other.role : f.role;
          return {
            text: `${f.name} : ${role}.`,
            ok: !other,
            claim: [f.name, role] as const,
            feedback: other ? `Faux : cette description est celle de ${other.name}. ${f.name} : ${f.role}.` : `Vrai : ${f.name}, ${f.role}.`,
          };
        });
        return {
          activity: classify(r, {
            id, stage: "application", competence: know,
            prompt: "Vrai ou faux ? Chaque nom est suivi d'une description : est-ce la bonne ?",
            categories: TRUE_FALSE,
            items: items.map((i) => ({ text: i.text, category: i.ok ? 0 : 1, feedback: i.feedback })),
            hint: "Rattache chaque nom à son époque et à son domaine.",
            hints: ["Une description fausse appartient à quelqu'un d'autre du même chapitre.", `Par exemple, ${picked[0]!.name} : ${picked[0]!.role}.`],
            solution: picked.map((f) => `${f.name} : ${f.role}.`),
            takeaway: "Un nom se retient avec ce qui le rend célèbre et avec son époque.",
          }),
          verify: () => items.length === 4 && items.some((i) => i.ok) && items.some((i) => !i.ok) && items.every((i) => i.ok === (roleOf.get(i.claim[0]) === i.claim[1])),
        };
      },
    }));
  }
  const shortPeople = people.filter((p) => short(p.name));
  if (shortPeople.length >= 3) {
    out.push(gen({
      id: `${base}-associer-personnes`, unit: unitId, title: "Associer chaque description à son personnage", stage: "application",
      make: (r, id) => {
        const picked = r.sample(shortPeople, 3);
        return {
          activity: classify(r, {
            id, stage: "application", competence: know,
            prompt: "Associe chaque description à la bonne personne.",
            categories: picked.map((p) => p.name),
            items: picked.map((p, i) => ({ text: upper(p.role), category: i, feedback: `${p.name} : ${p.role}.` })),
            hint: "Commence par la description dont tu es le plus sûr.",
            hints: ["Procède par élimination : chaque nom ne sert qu'une fois.", `${picked[0]!.name} : ${picked[0]!.role}.`],
            solution: picked.map((p) => `${p.name} : ${p.role}.`),
            takeaway: picked.map((p) => `${p.name} : ${p.role}`).join(" ; ") + ".",
          }),
          verify: () => new Set(picked.map((p) => p.name)).size === 3 && picked.every((p) => roleOf.get(p.name) === p.role),
        };
      },
    }));
  }

  /* ——— Vocabulaire ——— */
  const words = own("word");
  for (const lang of [...new Set(words.map((w) => w.lang))]) {
    const local = words.filter((w) => w.lang === lang);
    const pool = all("word").filter((w) => w.lang === lang);
    const meaningOf = new Map(pool.map((w) => [w.word, w.fr]));
    if (local.length < 2 || pool.length < 4) continue;
    const bare = (w: string) => w.replace(ARTICLE, "");
    out.push(gen({
      id: `${base}-${lang}-traduire`, unit: unitId, title: `Traduire du français vers le ${LANG[lang]}`, stage: "rappel",
      make: (r, id) => {
        const f = r.pick(local);
        const wrong = distractors(r, f, local, pool, (x) => x.word.toLowerCase());
        return {
          activity: mcq(r, {
            id, stage: "rappel", competence: know,
            prompt: `Comment dit-on « ${f.fr} » en ${LANG[lang]} ?`,
            answer: { text: f.word, feedback: `« ${f.fr} » se dit « ${f.word} ».` },
            wrong: wrong.map((w) => ({ text: w.word, feedback: `« ${w.word} » veut dire « ${w.fr} ».` })),
            hint: "Pense à une phrase où tu as déjà rencontré ce mot.",
            hints: [`Le mot commence par « ${bare(f.word).charAt(0)} ».`, `Il compte ${bare(f.word).replace(/[^\p{L}]/gu, "").length} lettres.`],
            solution: [`« ${f.fr} » : « ${f.word} ».`],
            takeaway: `${f.word} = ${f.fr}.`,
          }),
          verify: () => wrong.length === 3 && meaningOf.get(f.word) === f.fr && wrong.every((w) => w.word.toLowerCase() !== f.word.toLowerCase() && meaningOf.get(w.word) !== f.fr),
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
            id, stage: "application", competence: know,
            prompt: `Que veut dire « ${f.word} » ?`,
            answer: { text: f.fr, feedback: `« ${f.word} » veut dire « ${f.fr} ».` },
            wrong: wrong.map((w) => ({ text: w.fr, feedback: `« ${w.fr} » se dit « ${w.word} ».` })),
            hint: "Cherche un mot de la même famille en français ou dans une autre langue que tu connais.",
            hints: ["Élimine les traductions des autres mots du thème.", `La traduction commence par « ${f.fr.charAt(0)} ».`],
            solution: [`« ${f.word} » : « ${f.fr} ».`],
            takeaway: `${f.word} = ${f.fr}.`,
          }),
          verify: () => wrong.length === 3 && wrong.every((w) => w.fr.toLowerCase() !== meaningOf.get(f.word)!.toLowerCase() && w.word !== f.word),
        };
      },
    }));
    out.push(gen({
      id: `${base}-${lang}-vraifaux`, unit: unitId, title: `Vrai ou faux : le lexique en ${LANG[lang]}`, stage: "application",
      make: (r, id) => {
        const picked = pickDistinct(r, local, pool, (w) => w.word, 4);
        const pattern = truthPattern(r);
        const items = picked.map((f, i) => {
          const other = pattern[i] ? undefined : distractors(r, f, local, pool, (x) => x.fr.toLowerCase(), 1)[0];
          const meaning = other ? other.fr : f.fr;
          return {
            text: `« ${f.word} » veut dire « ${meaning} ».`,
            ok: !other,
            claim: [f.word, meaning] as const,
            feedback: other ? `Faux : « ${f.word} » veut dire « ${f.fr} ». « ${other.fr} » se dit « ${other.word} ».` : `Vrai : « ${f.word} » veut dire « ${f.fr} ».`,
          };
        });
        return {
          activity: classify(r, {
            id, stage: "application", competence: know,
            prompt: "Vrai ou faux ? Vérifie chaque traduction.",
            categories: TRUE_FALSE,
            items: items.map((i) => ({ text: i.text, category: i.ok ? 0 : 1, feedback: i.feedback })),
            hint: "Dis chaque mot à voix haute : sa traduction te revient-elle tout de suite ?",
            hints: ["Une traduction fausse appartient à un autre mot du même thème.", `Par exemple, « ${picked[0]!.word} » veut dire « ${picked[0]!.fr} ».`],
            solution: picked.map((f) => `${f.word} = ${f.fr}.`),
            takeaway: picked.map((f) => `${f.word} = ${f.fr}`).join(" ; ") + ".",
          }),
          verify: () => items.length === 4 && items.some((i) => i.ok) && items.some((i) => !i.ok) && items.every((i) => i.ok === (meaningOf.get(i.claim[0]) === i.claim[1])),
        };
      },
    }));
    const shortWords = local.filter((w) => short(w.fr));
    if (shortWords.length >= 3) {
      out.push(gen({
        id: `${base}-${lang}-associer`, unit: unitId, title: `Associer des mots de ${LANG[lang]} à leur traduction`, stage: "application",
        make: (r, id) => {
          const picked = r.sample(shortWords, 3);
          return {
            activity: classify(r, {
              id, stage: "application", competence: know,
              prompt: "Associe chaque mot à sa traduction.",
              categories: picked.map((w) => w.fr),
              items: picked.map((w, i) => ({ text: w.word, category: i, feedback: `« ${w.word} » veut dire « ${w.fr} ».` })),
              hint: "Commence par le mot que tu connais le mieux.",
              hints: ["Procède par élimination : chaque traduction ne sert qu'une fois.", `« ${picked[0]!.word} » veut dire « ${picked[0]!.fr} ».`],
              solution: picked.map((w) => `${w.word} = ${w.fr}.`),
              takeaway: picked.map((w) => `${w.word} = ${w.fr}`).join(" ; ") + ".",
            }),
            verify: () => new Set(picked.map((w) => w.fr)).size === 3 && picked.every((w) => meaningOf.get(w.word) === w.fr),
          };
        },
      }));
    }
  }

  /* ——— Classements ——— */
  const classes = own("class");
  for (const setName of [...new Set(classes.map((c) => c.set))]) {
    const def = set.sets?.[setName];
    const local = classes.filter((c) => c.set === setName);
    const pool = all("class").filter((c) => c.set === setName);
    const categoryOf = new Map(pool.map((c) => [c.item, c.category]));
    if (!def || local.length < 4 || new Set(local.map((c) => c.category)).size < 2) continue;
    out.push(gen({
      id: `${base}-classer-${setName}`, unit: unitId, title: def.prompt, stage: "application",
      make: (r, id) => {
        let items = r.sample(local.length >= 5 ? local : pool, Math.min(5, local.length >= 5 ? local.length : pool.length));
        if (new Set(items.map((i) => i.category)).size < 2) items = [...items.slice(0, -1), local.find((c) => c.category !== items[0]!.category)!];
        return {
          activity: classify(r, {
            id, stage: "application", competence: know,
            prompt: def.prompt,
            categories: def.categories,
            items: items.map((i) => ({ text: i.item, category: def.categories.indexOf(i.category), feedback: `${i.item} : ${i.category}.` })),
            hint: "Commence par les éléments dont tu es sûr, puis réfléchis aux autres.",
            hints: [`Les catégories : ${def.categories.join(", ")}.`, `Par exemple, ${items[0]!.item} : ${items[0]!.category}.`],
            solution: items.map((i) => `${i.item} : ${i.category}.`),
            takeaway: `Classer, c'est appliquer un critère : ${def.categories.join(" / ")}.`,
          }),
          verify: () => items.every((i) => def.categories.includes(categoryOf.get(i.item)!)) && new Set(items.map((i) => i.category)).size >= 2 && new Set(items.map((i) => i.item)).size === items.length,
        };
      },
    }));
    /** Catégories assez fournies pour cacher un intrus parmi trois éléments. */
    const hosts = def.categories.filter((cat) => local.filter((c) => c.category === cat).length >= 3);
    if (hosts.length) {
      out.push(gen({
        id: `${base}-intrus-${setName}`, unit: unitId, title: `Trouver l'intrus : ${def.prompt.replace(/ ?\?$/, "").toLowerCase()}`, stage: "application",
        make: (r, id) => {
          const cat = r.pick(hosts);
          const same = r.sample(local.filter((c) => c.category === cat), 3);
          const odd = r.pick(local.filter((c) => c.category !== cat));
          return {
            activity: mcq(r, {
              id, stage: "application", competence: know,
              prompt: `Trouve l'intrus : lequel n'est pas dans la catégorie « ${cat} » ?`,
              answer: { text: odd.item, feedback: `${odd.item} : ${odd.category}. C'est bien l'intrus.` },
              wrong: same.map((s) => ({ text: s.item, feedback: `${s.item} : ${s.category}, comme deux autres propositions.` })),
              hint: "Trois propositions ont un point commun : lequel ?",
              hints: [`Les catégories possibles : ${def.categories.join(", ")}.`, `${same[0]!.item} : ${same[0]!.category}.`],
              solution: [...same.map((s) => `${s.item} : ${s.category}.`), `${odd.item} : ${odd.category}.`],
              takeaway: `Classer, c'est appliquer un critère : ${def.categories.join(" / ")}.`,
            }),
            verify: () => same.length === 3 && same.every((s) => categoryOf.get(s.item) === cat) && categoryOf.get(odd.item) !== cat,
          };
        },
      }));
    }
    if (def.categories.length >= 3) {
      out.push(gen({
        id: `${base}-categorie-${setName}`, unit: unitId, title: `Choisir la bonne catégorie : ${def.prompt.replace(/ ?\?$/, "").toLowerCase()}`, stage: "rappel", capacity: local.length,
        make: (r, id) => {
          const f = r.pick(local);
          const others = def.categories.filter((c) => c !== f.category);
          return {
            activity: mcq(r, {
              id, stage: "rappel", competence: know,
              prompt: `Dans quelle catégorie ranger « ${f.item} » ?`,
              answer: { text: f.category, feedback: `${f.item} : ${f.category}.` },
              wrong: r.sample(others, Math.min(3, others.length)).map((c) => {
                const example = pool.find((x) => x.category === c);
                return { text: c, feedback: example ? `Dans cette catégorie, on range par exemple : ${example.item}.` : `${f.item} n'appartient pas à cette catégorie.` };
              }),
              hint: def.prompt,
              hints: [`Les catégories : ${def.categories.join(", ")}.`, "Cherche le critère qui distingue les catégories, puis applique-le."],
              solution: [`${f.item} : ${f.category}.`],
              takeaway: `${f.item} : ${f.category}.`,
            }),
            verify: () => categoryOf.get(f.item) === f.category && def.categories.includes(f.category),
          };
        },
      }));
    }
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
