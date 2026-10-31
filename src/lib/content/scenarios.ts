import { frNumber } from "@/lib/cx";
import type { Passion } from "./passions";

/**
 * Scénarios d'énoncés : les mathématiques sont fixes, la passion ne fournit que le décor.
 * Chaque fonction reçoit la passion de l'élève et renvoie une phrase.
 */

const VOWEL = /^[aeiouyhàâéèêëîïôûü]/i;
const de = (word: string) => (VOWEL.test(word) ? `d'${word}` : `de ${word}`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** f(x) = ax + b : on part de b, on gagne a à chaque fois. */
export const affineIntro = (a: number, b: number) => (p: Passion) => {
  const l = p.lex;
  if (!l.owner) {
    return `Dans ta passion (${p.label.toLowerCase()}), tu démarres avec ${b} ${l.unit}, puis tu en gagnes ${a} par ${l.event}. Après x ${l.events}, tu as f(x) = ${a}x + ${b} ${l.unit}.`;
  }
  return `${cap(l.owner)} démarre avec ${b} ${l.unit}, puis ${l.gain} ${a} ${l.unit} par ${l.event}. Après x ${l.events}, ${l.pronoun} a f(x) = ${a}x + ${b} ${l.unit}.`;
};

export const affineImage = (x: number) => (p: Passion) =>
  `Combien ${de(p.lex.unit)} après ${x} ${p.lex.events} ? Calcule f(${x}).`;

export const affineAntecedent = (y: number) => (p: Passion) => {
  const l = p.lex;
  const q = l.owner
    ? `Après combien ${de(l.events)} ${l.owner} atteint-${l.pronoun} ${y} ${l.unit} ?`
    : `Après combien ${de(l.events)} as-tu ${y} ${l.unit} ?`;
  return `${q} Trouve x tel que f(x) = ${y}.`;
};

/** Mouvement : d mètres en t secondes. */
export const motion = (d: number, t: number) => (p: Passion) =>
  p.lex.motion.replace("{d}", frNumber(d)).replace("{t}", frNumber(t));

/** Deux formules de prix : A = pA € par séance ; B = abonnement + pB € par séance. */
export const offers = (pA: number, sub: number, pB: number) => (p: Passion) =>
  `${p.lex.venue} propose deux formules. Formule A : ${pA} € par ${p.lex.session}. Formule B : un abonnement de ${sub} €, puis ${pB} € par ${p.lex.session}.`;

export const offerCost = (n: number, formula: "A" | "B") => (p: Passion) =>
  `Combien coûtent ${n} ${p.lex.sessions} avec la formule ${formula} ?`;

export const offerBreakEven = () => (p: Passion) =>
  `À partir de combien ${de(p.lex.sessions)} la formule B devient-elle strictement moins chère ?`;

export const offerSaving = (n: number) => (p: Passion) =>
  `Pour ${n} ${p.lex.sessions}, combien d'euros économise-t-on avec la formule B ?`;

export const offerFunction = () => (p: Passion) =>
  `On note x le nombre ${de(p.lex.sessions)}. Quelle fonction donne le prix avec la formule B ?`;
