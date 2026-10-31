/**
 * Calendrier de l'année 2026-2027 (zone A, celle de Lyon), d'après le calendrier officiel,
 * et dates du brevet 2027. Le prototype se déroule à une date fixe pour que toutes les
 * données fictives restent cohérentes : le jeudi 29 octobre 2026, pendant les vacances de la Toussaint.
 */

export const TODAY = new Date(2026, 9, 29);

/** Maintenant, à la date de la démo (l'heure est l'heure réelle). */
export function demoNow(): Date {
  const n = new Date();
  return new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate(), n.getHours(), n.getMinutes(), n.getSeconds());
}

export const SCHOOL_YEAR = "2026-2027";
export const ZONE = "A";

/** « 2026-11-02 » → date locale (sans décalage de fuseau). */
export const parseDay = (iso: string) => {
  const [y, m, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y ?? 2026, (m ?? 1) - 1, day ?? 1);
};
const d = parseDay;

/** Date locale → « 2026-11-02 ». */
export const isoDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Vacances : du premier jour sans cours au jour de la reprise. */
export const HOLIDAYS = [
  { label: "Toussaint", start: d("2026-10-17"), back: d("2026-11-02") },
  { label: "Noël", start: d("2026-12-19"), back: d("2027-01-04") },
  { label: "Hiver", start: d("2027-02-13"), back: d("2027-03-01") },
  { label: "Printemps", start: d("2027-04-10"), back: d("2027-04-26") },
];
export const YEAR_START = d("2026-09-01");
export const YEAR_END = d("2027-07-03");

/** Brevet 2027 : épreuves écrites, d'après le calendrier publié (toutes le matin). */
export const BREVET = {
  year: 2027,
  first: d("2027-06-24"),
  tests: [
    { day: d("2027-06-24"), subject: "Français", detail: "Grammaire, compréhension, dictée, rédaction" },
    { day: d("2027-06-25"), subject: "Histoire-géo et EMC", detail: "Analyse de documents, développement construit" },
    { day: d("2027-06-28"), subject: "Sciences, puis maths", detail: "Deux sciences parmi physique-chimie, SVT et technologie" },
  ],
  rule: "Épreuves finales : 60 % de la note. Contrôle continu de l'année : 40 %.",
};

/** Date fixée par le collège (fictive), récupérée depuis l'ENT. */
export const BREVET_BLANC = { day: d("2027-01-21"), label: "Brevet blanc" };

const MONDAYS: Date[] = (() => {
  const out: Date[] = [];
  const cur = d("2026-08-31");
  while (cur < YEAR_END) {
    const inHoliday = HOLIDAYS.some((h) => cur >= h.start && cur < h.back);
    if (!inHoliday) out.push(new Date(cur));
    cur.setDate(cur.getDate() + 7);
  }
  return out;
})();

/** Nombre de semaines de cours dans l'année (36). */
export const SCHOOL_WEEKS = MONDAYS.length;

/**
 * Position de la classe dans l'année, en semaines de cours.
 * Pendant une semaine de cours : son numéro. Pendant les vacances : la dernière semaine + 0,5.
 */
export function classWeek(date: Date = TODAY): number {
  let w = 0;
  for (let i = 0; i < MONDAYS.length; i++) {
    const start = MONDAYS[i] as Date;
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    if (date >= start && date < end) return i + 1;
    if (date >= end) w = i + 1.5;
  }
  return Math.min(w, SCHOOL_WEEKS);
}

export function weekStart(week: number): Date {
  return MONDAYS[Math.max(0, Math.min(MONDAYS.length - 1, Math.round(week) - 1))] ?? YEAR_START;
}

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const DAYS_SHORT = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

export function monthOf(week: number): string {
  const s = weekStart(week);
  // Une semaine qui commence le 30 ou le 31 appartient surtout au mois suivant.
  const probe = new Date(s);
  probe.setDate(probe.getDate() + 3);
  return MONTHS[probe.getMonth()] ?? "";
}

export function frDate(date: Date, opts: { weekday?: boolean; year?: boolean } = {}): string {
  const day = date.getDate() === 1 ? "1er" : String(date.getDate());
  const parts = [opts.weekday === false ? "" : DAYS[date.getDay()], day, MONTHS[date.getMonth()], opts.year ? String(date.getFullYear()) : ""];
  return parts.filter(Boolean).join(" ");
}

export function shortDay(date: Date): { day: string; num: string } {
  return { day: DAYS_SHORT[date.getDay()] ?? "", num: String(date.getDate()) };
}

export function daysBetween(a: Date, b: Date): number {
  const ms = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime() - new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  return Math.round(ms / 86_400_000);
}

export function currentHoliday(date: Date = TODAY) {
  return HOLIDAYS.find((h) => date >= h.start && date < h.back) ?? null;
}

/** Lundi de la semaine de `date` (pour les défis de la semaine). */
export function mondayOf(date: Date): Date {
  const m = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

export function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function sameDay(a: Date, b: Date): boolean {
  return sameMonth(a, b) && a.getDate() === b.getDate();
}

/** Position (0 à 1) d'une date sur l'année scolaire, pour la frise. */
export function yearPosition(date: Date): number {
  const t = (date.getTime() - YEAR_START.getTime()) / (YEAR_END.getTime() - YEAR_START.getTime());
  return Math.max(0, Math.min(1, t));
}
