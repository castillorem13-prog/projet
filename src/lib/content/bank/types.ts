import type { Activity } from "@/lib/content/types";
import type { Stage, SubjectId, VerificationStatus } from "@/lib/curriculum/types";

/**
 * Banque d'exercices et de cours de LearnWard.
 *
 * Trois sortes de contenus, chacun vérifié à sa façon :
 *  - les générateurs : un exercice par graine, avec sa contre-épreuve calculée autrement (tests/bank.test.ts) ;
 *  - les faits : dates, définitions, auteurs, vocabulaire, chacun rattaché à ses sources ; les questions en sont tirées ;
 *  - les cours : une fiche par unité du programme, dont les calculs sont refaits par les tests.
 */

/** Exercice produit par un générateur, avec sa contre-épreuve. */
export interface Generated {
  activity: Activity;
  /** Vérification indépendante de la réponse (substitution, opération inverse, recalcul par une autre voie). */
  verify: () => boolean;
}

export interface Generator {
  id: string;
  unitId: string;
  /** Ce que l'exercice fait travailler (« Comparer deux décimaux »). */
  title: string;
  stage: Stage;
  /** La même graine donne toujours le même exercice. */
  make: (seed: number) => Generated;
}

/** Une source consultée pour écrire ou recouper un contenu. */
export interface Source {
  id: string;
  label: string;
  url?: string;
}

/**
 * Statut d'un contenu de la banque :
 *  - computed : la réponse est calculée par le code et contre-vérifiée par les tests ;
 *  - les statuts du programme (`VerificationStatus`) pour les contenus de connaissance.
 */
export type BankStatus = "computed" | VerificationStatus;

export type Lang = "en" | "es" | "de" | "la" | "grc";

/** Un fait élémentaire, la plus petite unité vérifiable. Les questions en sont tirées automatiquement. */
export type Fact =
  /** Événement daté : « Prise de la Bastille », 1789, « 14 juillet 1789 ». */
  | { kind: "date"; id: string; units: string[]; label: string; year: number; when?: string }
  /** Terme et définition. */
  | { kind: "term"; id: string; units: string[]; term: string; definition: string }
  /** Œuvre et auteur. */
  | { kind: "work"; id: string; units: string[]; author: string; title: string; year?: number }
  /** Personnage ou personne et ce qui le fait connaître. */
  | { kind: "person"; id: string; units: string[]; name: string; role: string }
  /** Mot d'une langue et sa traduction. */
  | { kind: "word"; id: string; units: string[]; lang: Lang; word: string; fr: string }
  /** Élément à classer dans une catégorie (« le fer » → « conducteur »). */
  | { kind: "class"; id: string; units: string[]; set: string; item: string; category: string };

export type FactKind = Fact["kind"];

/** Un lot de faits d'une même matière, recoupés avec les mêmes sources. */
export interface FactSet {
  id: string;
  subject: SubjectId;
  title: string;
  status: BankStatus;
  /** Date du recoupement (ISO). */
  checkedAt?: string;
  sources: Source[];
  /** Ensembles de classement : leurs catégories, dans l'ordre d'affichage. */
  sets?: Record<string, { prompt: string; categories: string[] }>;
  facts: Fact[];
}

/** Calcul cité dans un cours, refait par les tests : [expression, résultat attendu]. */
export type LessonCheck = [expression: string, expected: number];

export interface LessonBlock {
  title: string;
  items: string[];
}

/** Fiche de cours d'une unité du programme. */
export interface Lesson {
  unitId: string;
  /** L'essentiel en une ou deux phrases. */
  intro: string;
  /** Définitions, propriétés, méthodes, repères. */
  blocks: LessonBlock[];
  /** Exemple résolu, étape par étape. */
  example?: { title: string; steps: string[] };
  /** Erreurs fréquentes. */
  pitfalls: string[];
  /** À retenir. */
  remember: string[];
  checks?: LessonCheck[];
}

/** Lot de cours d'une matière. */
export interface LessonSet {
  id: string;
  subject: SubjectId;
  status: BankStatus;
  sources: Source[];
  lessons: Lesson[];
}
