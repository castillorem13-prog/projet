import type { Level, SubjectId } from "@/lib/curriculum/types";
import { EAF } from "@/lib/bac/francais";
import { findExam } from "@/lib/content/catalog";

/**
 * Épreuves blanches proposées selon la classe : le format suit l'épreuve officielle (durée, parties, barème),
 * le niveau des sujets suit la classe de l'élève. Les contrôles blancs par chapitre restent dans « Programme ».
 */

export interface Epreuve {
  id: string;
  level: Level;
  subject: SubjectId;
  title: string;
  /** Nom court (carte « À venir » de l'accueil). */
  short: string;
  /** Écrit noté automatiquement, écrit à rédiger (grille), ou oral chronométré. */
  kind: "auto" | "redaction" | "oral";
  href: string;
  minutes: number;
  format: string[];
  source: string;
  verification: "cross_checked" | "single_source" | "learnward";
}

const exam = (id: string) => {
  const e = findExam(id);
  if (!e) throw new Error(`Épreuve inconnue : ${id}`);
  return e;
};

export const EPREUVES: Epreuve[] = [
  {
    id: "brevet-maths", level: "3e", subject: "maths", title: "Brevet blanc de maths", short: "Brevet de maths", kind: "auto",
    href: "/controle/brevet-blanc-maths", minutes: exam("brevet-blanc-maths").minutes,
    format: exam("brevet-blanc-maths").format?.lines ?? [], source: exam("brevet-blanc-maths").format?.source ?? "", verification: "cross_checked",
  },
  {
    id: "eaf-ecrit", level: "1re", subject: "francais", title: "Écrit de français blanc", short: "Écrit de français", kind: "redaction",
    href: "/bac-francais/ecrit-blanc", minutes: EAF.ecrit.minutes,
    format: ["4 heures, coefficient 5", "Commentaire d'un texte inconnu ou dissertation sur une œuvre du programme (voie générale)", "Corrigé avec la grille, puis pistes de correction"],
    source: "Format de l'épreuve anticipée de français, recoupé (note de l'inspection de lettres de Versailles, fiche 2026-2027 d'un lycée)", verification: "cross_checked",
  },
  {
    id: "eaf-oral", level: "1re", subject: "francais", title: "Oral de français blanc", short: "Oral de français", kind: "oral",
    href: "/bac-francais/oral-blanc", minutes: EAF.oral.preparation + EAF.oral.minutes,
    format: ["30 minutes de préparation, 20 minutes d'oral", "12 minutes sur 12 points : lecture, explication linéaire, question de grammaire", "8 minutes sur 8 points : œuvre choisie, puis entretien"],
    source: "Format de l'oral de l'épreuve anticipée de français, recoupé (note de l'inspection de lettres de Versailles, fiche d'un lycée)", verification: "cross_checked",
  },
  {
    id: "eam", level: "1re", subject: "maths", title: "Épreuve anticipée de maths blanche", short: "Maths anticipées", kind: "auto",
    href: "/controle/eam-blanc", minutes: exam("eam-blanc").minutes,
    format: exam("eam-blanc").format?.lines ?? [], source: exam("eam-blanc").format?.source ?? "", verification: "cross_checked",
  },
  {
    id: "philo", level: "Tle", subject: "philo", title: "Philosophie blanche", short: "Philo", kind: "redaction",
    href: "/epreuves/philo", minutes: 240,
    format: ["4 heures", "Au choix : une dissertation (deux sujets) ou une explication de texte", "Corrigé avec la grille, puis relecture de ton plan"],
    source: "Format de l'épreuve de philosophie : 4 heures, un sujet parmi trois (Diplomeo)", verification: "single_source",
  },
  {
    id: "grand-oral", level: "Tle", subject: "philo", title: "Grand oral blanc", short: "Grand oral", kind: "oral",
    href: "/epreuves/grand-oral", minutes: 40,
    format: ["20 minutes de préparation", "5 minutes pour présenter ta question, sans notes", "10 minutes d'échange avec le jury, 5 minutes sur ton projet d'orientation"],
    source: "Format du grand oral (20 min de préparation, 5 + 10 + 5 min) ; grille d'entraînement propre à LearnWard", verification: "learnward",
  },
];

export const epreuvesOf = (level: Level) => EPREUVES.filter((e) => e.level === level);
