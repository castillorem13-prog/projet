import { DEFAULT_TRACK, type Track } from "@/lib/curriculum/levels";
import type { Passion } from "./passions";
import type { CompetenceId, Grade, SubjectId } from "./types";

export interface Homework {
  id: string;
  subject: SubjectId;
  kind: "DM" | "Contrôle" | "Interro" | "Exercices" | "Lecture";
  title: string;
  /** Date de rendu (ISO, sans heure). */
  due: string;
  source: "ent" | "manuel";
  sessionId: string | null;
  /** Le devoir est un contrôle qui a un contrôle blanc d'entraînement. */
  examMode?: boolean;
}

export interface Profile {
  pseudo: string;
  grade: Grade;
  /** Univers préférés (catalogue ou personnalisés) : facultatifs, ils reviennent plus souvent. */
  passions: string[];
  /** Univers que l'élève ne veut plus voir. */
  mutedPassions: string[];
  /** Varier les univers dans tout le catalogue (par défaut) : les énoncés font découvrir d'autres mondes. */
  vary: boolean;
  customPassions: Passion[];
  streak: number;
  under15: boolean;
  parentEmail: string;
  entLinked: boolean;
  /** Langue vivante B, spécialités et options. */
  track: Track;
  levels: Record<CompetenceId, number>;
}

export const INITIAL_PROFILE: Profile = {
  pseudo: "Alex",
  grade: "3e",
  passions: ["football", "aventure", "rap"],
  mutedPassions: [],
  vary: true,
  customPassions: [],
  streak: 4,
  under15: true,
  parentEmail: "parent@exemple.fr",
  entLinked: true,
  track: DEFAULT_TRACK,
  levels: {
    chercher: 52, modeliser: 41, representer: 63, raisonner: 33, calculer: 71, communiquer: 48,
    app: 60, ana: 37, rea: 54, val: 28, com: 45,
    "fr-lire": 58, "fr-langue": 42, "fr-ecrire": 47, "fr-culture": 61,
    "hg-temps": 55, "hg-espace": 49, "hg-docs": 44, "hg-raisonner": 38,
    "svt-savoirs": 57, "svt-demarche": 41, "svt-donnees": 46,
    "te-analyser": 62, "te-programmer": 39, "te-concevoir": 51,
    "en-comprendre": 66, "en-grammaire": 43, "en-ecrire": 50,
    "es-comprendre": 63, "es-grammaire": 47, "es-ecrire": 45,
    "emc-regle": 52, "emc-argumenter": 49, "ar-analyser": 44, "ar-creer": 57, "mu-ecouter": 50, "mu-creer": 46,
    "ep-tactique": 58, "ep-securite": 63, "se-donnees": 40, "se-mecanismes": 35, "sn-reseaux": 42, "sn-donnees": 38,
    "ph-concepts": 30, "ph-argumenter": 30,
  },
};

/** Devoirs récupérés depuis l'ENT (fictifs), pour la rentrée des vacances de la Toussaint. */
export const HOMEWORK: Homework[] = [
  { id: "hw-1", subject: "maths", kind: "DM", title: "Fonctions affines", due: "2026-11-02", source: "ent", sessionId: "fonctions-affines-3e" },
  { id: "hw-2", subject: "hg", kind: "Interro", title: "Les régimes totalitaires", due: "2026-11-03", source: "ent", sessionId: "histoire-totalitarismes-3e" },
  { id: "hw-3", subject: "anglais", kind: "Exercices", title: "Present perfect, workbook p. 34", due: "2026-11-04", source: "ent", sessionId: "anglais-present-perfect-3e" },
  { id: "hw-4", subject: "physique", kind: "Contrôle", title: "Vitesse moyenne", due: "2026-11-05", source: "manuel", sessionId: "vitesse-moyenne-3e", examMode: true },
  { id: "hw-5", subject: "francais", kind: "Lecture", title: "Candide, chapitre 3", due: "2026-11-06", source: "ent", sessionId: "francais-denoncer-3e" },
];

/** Minutes de révision cette semaine (lundi 26 octobre au dimanche 1er novembre). */
export const WEEK = [
  { day: "L", minutes: 12 },
  { day: "M", minutes: 9 },
  { day: "M", minutes: 11 },
  { day: "J", minutes: 0 },
  { day: "V", minutes: 0 },
  { day: "S", minutes: 0 },
  { day: "D", minutes: 0 },
];
export const TODAY_INDEX = 3;
