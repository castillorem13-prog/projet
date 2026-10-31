import { TODAY, daysBetween, mondayOf, sameDay, sameMonth } from "@/lib/content/calendar";
import type { Grade, SubjectId } from "@/lib/content/types";
import { uid } from "@/lib/cx";

/**
 * Cagnotte façon WeWard : on gagne des points en révisant (et avec le cashback des partenaires),
 * on les convertit en euros (1 000 points = 1 €, comme dans le cahier des charges).
 * Avant 15 ans, chaque utilisation est validée par un parent. Les points n'expirent jamais.
 * Partenaires, offres et montants : fictifs pour la démo.
 */

export const POINTS_PER_EURO = 1000;

export function frEuros(points: number, opts: { sign?: boolean } = {}): string {
  const v = points / POINTS_PER_EURO;
  const s = Math.abs(v).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sign = opts.sign ? (v < 0 ? "−" : "+") : v < 0 ? "−" : "";
  return `${sign}${s} €`;
}

export function frPoints(points: number, opts: { sign?: boolean } = {}): string {
  const sign = opts.sign ? (points < 0 ? "−" : "+") : points < 0 ? "−" : "";
  return `${sign}${Math.abs(points).toLocaleString("fr-FR")} points`;
}

export interface Partner {
  id: string;
  name: string;
  category: string;
  /** Une phrase de présentation. */
  blurb: string;
  /** Part des achats reversée dans la cagnotte (%). */
  rate: number;
  color: string;
  mark: string;
}

/**
 * Dix enseignes fictives, inventées pour la démo : aucune n'existe, aucun accord n'a été signé.
 * Pas d'alimentation ni de boissons : uniquement des achats liés aux études, à la culture, au sport et aux loisirs.
 */
export const PARTNERS: Partner[] = [
  { id: "bulle", name: "Bulle & Planche", category: "BD, manga et romans", blurb: "Librairie de BD, mangas et romans jeunesse.", rate: 6, color: "#c92a62", mark: "B&P" },
  { id: "cahier", name: "Cahier Malin", category: "Fournitures scolaires", blurb: "Cahiers, trousses et fournitures de rentrée.", rate: 8, color: "#c2410c", mark: "CM" },
  { id: "stade", name: "Côté Terrain", category: "Sport", blurb: "Matériel de sport et terrains de padel à louer.", rate: 4, color: "#007a83", mark: "CT" },
  { id: "lumiere", name: "Ciné Lumière", category: "Cinéma", blurb: "Cinéma de quartier, tarifs jeunes et carte d'abonnement.", rate: 5, color: "#6d28d9", mark: "CL" },
  { id: "note", name: "Note Bleue", category: "Musique et instruments", blurb: "Instruments, partitions et cours d'essai.", rate: 5, color: "#0072a8", mark: "NB" },
  { id: "octet", name: "Octet & Cie", category: "Informatique et calculatrices", blurb: "Calculatrices, câbles et matériel informatique d'occasion.", rate: 3, color: "#334155", mark: "O&C" },
  { id: "de", name: "Le Dé Voyageur", category: "Jeux de société", blurb: "Boutique et salon de jeux de société.", rate: 7, color: "#a35200", mark: "DV" },
  { id: "roue", name: "Roue Libre", category: "Vélo et mobilité douce", blurb: "Vélos, réparation et sorties encadrées.", rate: 5, color: "#15803d", mark: "RL" },
  { id: "curieuse", name: "Planète Curieuse", category: "Sciences et sorties", blurb: "Kits de sciences, expositions et sorties nature.", rate: 6, color: "#0e7490", mark: "PC" },
  { id: "pigment", name: "Atelier Pigment", category: "Beaux-arts et loisirs créatifs", blurb: "Peinture, carnets de croquis et ateliers créatifs.", rate: 7, color: "#a21caf", mark: "AP" },
];
export const partner = (id: string) => PARTNERS.find((p) => p.id === id) as Partner;

export type RewardKind = "gift" | "transfer" | "donation";

export interface Reward {
  id: string;
  kind: RewardKind;
  euros: number;
  partnerId?: string;
  title: string;
  detail: string;
}

export const REWARDS: Reward[] = [
  { id: "gift-bulle-5", kind: "gift", euros: 5, partnerId: "bulle", title: "Carte Bulle & Planche", detail: "En magasin et en ligne, valable un an" },
  { id: "gift-cahier-5", kind: "gift", euros: 5, partnerId: "cahier", title: "Carte Cahier Malin", detail: "Fournitures, valable un an" },
  { id: "gift-lumiere-10", kind: "gift", euros: 10, partnerId: "lumiere", title: "Carte Ciné Lumière", detail: "Environ une place et demie, valable un an" },
  { id: "gift-stade-10", kind: "gift", euros: 10, partnerId: "stade", title: "Carte Côté Terrain", detail: "En magasin et en ligne, valable un an" },
  { id: "gift-de-10", kind: "gift", euros: 10, partnerId: "de", title: "Carte Le Dé Voyageur", detail: "Jeux et soirées au salon, valable un an" },
  { id: "gift-curieuse-10", kind: "gift", euros: 10, partnerId: "curieuse", title: "Carte Planète Curieuse", detail: "Expositions et kits, valable un an" },
  { id: "gift-pigment-10", kind: "gift", euros: 10, partnerId: "pigment", title: "Carte Atelier Pigment", detail: "Matériel et ateliers, valable un an" },
  { id: "gift-note-15", kind: "gift", euros: 15, partnerId: "note", title: "Carte Note Bleue", detail: "Partitions, cordes, accessoires" },
  { id: "gift-roue-15", kind: "gift", euros: 15, partnerId: "roue", title: "Carte Roue Libre", detail: "Réparation, accessoires, sorties" },
  { id: "gift-octet-20", kind: "gift", euros: 20, partnerId: "octet", title: "Carte Octet & Cie", detail: "Calculatrices et matériel, valable un an" },
  { id: "transfer-10", kind: "transfer", euros: 10, title: "Virement à un parent", detail: "Sur le compte du parent qui a donné son accord" },
  { id: "don-1", kind: "donation", euros: 1, title: "Don à Cartables Partagés", detail: "Des fournitures pour des élèves qui en manquent (association fictive)" },
];
export const reward = (id: string) => REWARDS.find((r) => r.id === id) as Reward;
export const rewardPoints = (r: Reward) => r.euros * POINTS_PER_EURO;

export type EntryKind = "session" | "exam" | "challenge" | "cashback" | "sponsored" | "redeem" | "summary";

export interface LedgerEntry {
  id: string;
  /** Date ISO. */
  at: string;
  kind: EntryKind;
  label: string;
  detail?: string;
  points: number;
  /** Cashback en attente de validation par le partenaire. */
  pending?: boolean;
  availableOn?: string;
  subject?: SubjectId;
  grade?: Grade;
  challengeId?: string;
  /** Exercice partenaire : enseigne et exercice concernés. */
  partnerId?: string;
  activityId?: string;
  /** Durée de la séance, pour le graphique de la semaine. */
  minutes?: number;
}

export interface Redemption {
  id: string;
  rewardId: string;
  points: number;
  at: string;
  status: "pending" | "approved" | "refused";
  code?: string;
}

export interface ParentRules {
  /** Afficher les offres de cashback des partenaires (le parent peut les masquer). */
  offers: boolean;
  /** Proposer les exercices partenaires dans les séances (sinon : la version sans marque). */
  sponsored: boolean;
  /** Plafond d'utilisation par mois, en euros. */
  monthlyCap: number;
  /** Accord donné pour l'utilisation des données. */
  consent: boolean;
  /** Résumé envoyé chaque dimanche. */
  weekly: boolean;
  /** Énoncés écrits autour des univers de l'élève (sinon : vie quotidienne). */
  themed: boolean;
}

export interface Wallet {
  ledger: LedgerEntry[];
  goalId: string;
  redemptions: Redemption[];
  activeOffers: string[];
  parent: ParentRules;
}

const iso = (y: number, m: number, d: number, h = 18) => new Date(y, m - 1, d, h).toISOString();

export const INITIAL_WALLET: Wallet = {
  goalId: "gift-lumiere-10",
  activeOffers: ["bulle", "cahier"],
  redemptions: [],
  parent: { offers: true, sponsored: true, monthlyCap: 20, consent: true, weekly: true, themed: true },
  ledger: [
    { id: "l-9", at: iso(2026, 10, 28), kind: "session", label: "Vitesse moyenne", detail: "Physique-chimie", points: 34, subject: "physique", grade: "3e" },
    { id: "l-8", at: iso(2026, 10, 27), kind: "session", label: "Calcul littéral et équations", detail: "Maths", points: 29, subject: "maths", grade: "3e" },
    { id: "l-7s", at: iso(2026, 10, 28, 18), kind: "sponsored", label: "Exercice partenaire, Roue Libre", detail: "Vitesse moyenne", points: 15, partnerId: "roue", activityId: "vm-situation" },
    { id: "l-7", at: iso(2026, 10, 26, 19), kind: "session", label: "Fonctions affines", detail: "Maths", points: 27, subject: "maths", grade: "3e" },
    { id: "l-6", at: iso(2026, 10, 26, 8), kind: "challenge", label: "Défi réussi", detail: "5 séances la semaine dernière", points: 100 },
    { id: "l-5", at: iso(2026, 10, 25), kind: "cashback", label: "Cashback Cahier Malin", detail: "8 % de 18,50 € d'achats", points: 1480 },
    { id: "l-4", at: iso(2026, 10, 23), kind: "cashback", label: "Cashback Bulle & Planche", detail: "6 % de 24 € d'achats", points: 1440, pending: true, availableOn: iso(2026, 11, 22) },
    { id: "l-3", at: iso(2026, 10, 22), kind: "session", label: "Les aires urbaines", detail: "Histoire-géo", points: 30, subject: "hg", grade: "3e" },
    { id: "l-2", at: iso(2026, 10, 20), kind: "redeem", label: "Don à Cartables Partagés", detail: "Validé par ton parent", points: -1000 },
    { id: "l-1", at: iso(2026, 10, 16), kind: "summary", label: "Cashback de septembre et octobre", detail: "3 achats chez les partenaires", points: 2560 },
    { id: "l-0", at: iso(2026, 10, 16, 8), kind: "summary", label: "Séances et défis de septembre et octobre", detail: "52 séances, 6 défis", points: 2160 },
  ],
};

/** Solde disponible (le cashback en attente n'est pas encore utilisable). */
export function balance(w: Wallet): number {
  return w.ledger.reduce((s, e) => s + (e.pending ? 0 : e.points), 0);
}
export function pendingPoints(w: Wallet): number {
  return w.ledger.reduce((s, e) => s + (e.pending ? e.points : 0), 0);
}
/** Points réservés par une demande en attente de validation. */
export function reservedPoints(w: Wallet): number {
  return w.redemptions.filter((r) => r.status === "pending").reduce((s, r) => s + r.points, 0);
}
export function spendable(w: Wallet): number {
  return balance(w) - reservedPoints(w);
}
/** Euros utilisés ou demandés ce mois-ci (une demande refusée ne compte pas). */
export function usedThisMonth(w: Wallet, today = TODAY): number {
  return w.redemptions.filter((r) => r.status !== "refused" && sameMonth(new Date(r.at), today)).reduce((n, r) => n + r.points, 0) / POINTS_PER_EURO;
}
/** Ce qui empêche d'utiliser une récompense : le solde ou le plafond du parent. Règle unique, pour l'écran comme pour la demande. */
export function redeemBlock(w: Wallet, r: Reward, today = TODAY): "funds" | "cap" | null {
  if (spendable(w) < rewardPoints(r)) return "funds";
  return usedThisMonth(w, today) + r.euros > w.parent.monthlyCap ? "cap" : null;
}
export function learnedToday(w: Wallet, today = TODAY): LedgerEntry[] {
  return w.ledger.filter((e) => (e.kind === "session" || e.kind === "exam") && sameDay(new Date(e.at), today));
}
export function pointsToday(w: Wallet, today = TODAY): number {
  return w.ledger.filter((e) => (e.kind === "session" || e.kind === "exam") && sameDay(new Date(e.at), today)).reduce((s, e) => s + e.points, 0);
}

/** Rythme moyen observé, pour estimer le temps restant jusqu'à l'objectif. */
export const DAILY_PACE = 95;

/* ——— Défis de la semaine ——— */

export interface Challenge {
  id: string;
  title: (lowerGrade: Grade | null) => string;
  points: number;
  goal: number;
  measure: (week: LedgerEntry[], lowerGrade: Grade | null) => number;
}

const learning = (week: LedgerEntry[]) => week.filter((e) => e.kind === "session" || e.kind === "exam");

export const CHALLENGES: Challenge[] = [
  { id: "days-4", title: () => "Réviser 4 jours cette semaine", points: 100, goal: 4, measure: (w) => new Set(learning(w).map((e) => new Date(e.at).toDateString())).size },
  // Une capsule d'Explorer n'a pas de matière : elle ne compte pas comme une matière de plus.
  { id: "subjects-3", title: () => "Réviser 3 matières différentes", points: 60, goal: 3, measure: (w) => new Set(learning(w).flatMap((e) => e.subject ?? [])).size },
  { id: "exam-1", title: () => "Faire un contrôle blanc de 30 minutes", points: 80, goal: 1, measure: (w) => w.filter((e) => e.kind === "exam").length },
  {
    id: "base-1",
    title: (g) => (g ? `Revoir une base de ${g}` : "Revoir une notion déjà vue"),
    points: 40,
    goal: 1,
    measure: (w, g) => learning(w).filter((e) => (g ? e.grade === g : false)).length,
  },
];

export function weekEntries(w: Wallet, today = TODAY): LedgerEntry[] {
  const start = mondayOf(today);
  return w.ledger.filter((e) => {
    const t = new Date(e.at);
    return t >= start && daysBetween(start, t) < 7;
  });
}

export interface ChallengeState {
  challenge: Challenge;
  value: number;
  done: boolean;
}

export function challengeStates(w: Wallet, lowerGrade: Grade | null, today = TODAY): ChallengeState[] {
  const week = weekEntries(w, today);
  return CHALLENGES.map((c) => {
    const value = Math.min(c.goal, c.measure(week, lowerGrade));
    const done = week.some((e) => e.kind === "challenge" && e.challengeId === c.id);
    return { challenge: c, value, done };
  });
}

/** Ajoute une entrée et crédite les défis qu'elle termine. Renvoie le portefeuille et les défis réussis. */
export function credit(w: Wallet, entry: Omit<LedgerEntry, "id">, lowerGrade: Grade | null): { wallet: Wallet; completed: Challenge[] } {
  let ledger: LedgerEntry[] = [{ ...entry, id: uid("l") }, ...w.ledger];
  const completed: Challenge[] = [];
  for (const s of challengeStates({ ...w, ledger }, lowerGrade)) {
    if (!s.done && s.value >= s.challenge.goal) {
      completed.push(s.challenge);
      ledger = [
        { id: uid("l"), at: entry.at, kind: "challenge", label: "Défi réussi", detail: s.challenge.title(lowerGrade), points: s.challenge.points, challengeId: s.challenge.id },
        ...ledger,
      ];
    }
  }
  return { wallet: { ...w, ledger }, completed };
}

/* ——— Exercices partenaires ——— */

/** Plafond quotidien des bonus partenaires, à part du plafond des séances. */
export const SPONSOR_DAILY_CAP = 100;
/** Temps minimal passé sur l'exercice pour que le bonus soit versé (anti-clic). */
export const SPONSOR_MIN_SECONDS = 8;

export interface SponsoredDone {
  partnerId: string;
  activityId: string;
  bonus: number;
  seconds: number;
  label: string;
}

/**
 * Bonus des exercices partenaires terminés : versé une fois par exercice et par jour, si l'élève a pris le temps
 * de le faire, dans la limite du plafond quotidien. Le résultat (juste ou faux) ne change rien au bonus :
 * on récompense l'effort, pas la réussite, pour ne jamais pousser à tricher.
 */
export function creditSponsored(w: Wallet, done: SponsoredDone[], at: string, today = TODAY): { wallet: Wallet; credited: { partnerId: string; points: number }[] } {
  const todays = w.ledger.filter((e) => e.kind === "sponsored" && sameDay(new Date(e.at), today));
  let room = SPONSOR_DAILY_CAP - todays.reduce((n, e) => n + e.points, 0);
  const ledger = [...w.ledger];
  const credited: { partnerId: string; points: number }[] = [];
  for (const d of done) {
    if (room <= 0) break;
    if (d.seconds < SPONSOR_MIN_SECONDS) continue;
    if (ledger.some((e) => e.kind === "sponsored" && e.activityId === d.activityId && sameDay(new Date(e.at), today))) continue;
    const points = Math.min(d.bonus, room);
    room -= points;
    ledger.unshift({ id: uid("l"), at, kind: "sponsored", label: `Exercice partenaire, ${partner(d.partnerId).name}`, detail: d.label, points, partnerId: d.partnerId, activityId: d.activityId });
    credited.push({ partnerId: d.partnerId, points });
  }
  return { wallet: { ...w, ledger }, credited };
}

/** Code de carte cadeau fictif, stable pour une demande donnée. */
export function giftCode(seed: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += chars[h % chars.length];
    h = Math.floor(h / chars.length) ^ (h << 5);
    h >>>= 0;
  }
  return `LW-${out.slice(0, 4)}-${out.slice(4)}`;
}
