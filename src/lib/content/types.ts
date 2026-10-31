import type { AnswerSpec } from "@/lib/pedagogy/answer-checker";
import { nb } from "@/lib/cx";
import type { Passion } from "./passions";

import type { CognitiveOperation, ErrorType, Level, Stage, SubjectId } from "@/lib/curriculum/types";
import type { WritingCheck } from "@/lib/coach/writing";

export type { Level, SubjectId, Stage, CognitiveOperation };
/** Niveau de classe (6e à terminale). */
export type Grade = Level;

/** Compétences travaillées, d'après les programmes de chaque matière (cycle 4 et seconde). */
export type MathsCompetence = "chercher" | "modeliser" | "representer" | "raisonner" | "calculer" | "communiquer";
export type PhysicsCompetence = "app" | "ana" | "rea" | "val" | "com";
export type OtherCompetence =
  | "fr-lire" | "fr-langue" | "fr-ecrire" | "fr-culture"
  | "hg-temps" | "hg-espace" | "hg-docs" | "hg-raisonner"
  | "svt-savoirs" | "svt-demarche" | "svt-donnees"
  | "te-analyser" | "te-programmer" | "te-concevoir"
  | "en-comprendre" | "en-grammaire" | "en-ecrire"
  | "es-comprendre" | "es-grammaire" | "es-ecrire"
  | "emc-regle" | "emc-argumenter" | "ar-analyser" | "ar-creer" | "mu-ecouter" | "mu-creer"
  | "ep-tactique" | "ep-securite" | "se-donnees" | "se-mecanismes" | "sn-reseaux" | "sn-donnees"
  | "ph-concepts" | "ph-argumenter";
export type CompetenceId = MathsCompetence | PhysicsCompetence | OtherCompetence;

/** Texte fixe, ou réécrit à partir de la passion de l'élève. */
export type Themed = string | ((passion: Passion) => string);

export type ActivityKind = "mcq" | "problem" | "graph" | "order" | "spot-error" | "classify" | "writing" | "dialogue" | "worked";

/** Provenance d'un document : réel (avec ses références) ou fabriqué pour l'exercice, et alors marqué comme tel. */
export interface Provenance {
  authentic: boolean;
  type: string;
  creator?: string;
  date?: string;
  context?: string;
  /** Où le vérifier (référence ou adresse). */
  source?: string;
  rights?: string;
  limits?: string;
  verification?: "cross_checked" | "needs_review" | "illustrative_mock";
}

export type Stimulus =
  | { kind: "text"; title: string; lines: string[]; provenance: Provenance }
  | { kind: "table"; title: string; columns: string[]; rows: string[][]; provenance: Provenance }
  | { kind: "timeline"; title: string; events: { date: string; label: string }[]; provenance: Provenance }
  | { kind: "code"; title: string; language: string; lines: string[]; provenance: Provenance };

interface ActivityBase {
  id: string;
  competence: CompetenceId;
  /** Défi auquel appartient l'activité : rappeler, appliquer, transférer, ou approfondissement facultatif. */
  stage: Stage;
  ops: CognitiveOperation[];
  /** Indice 1 (orientation). */
  hint: string;
  /** Indices 2 (structure) et 3 (exemple partiellement résolu). Déduits de la méthode et de la correction s'ils manquent. */
  hints?: [string, string];
  solution: string[];
  takeaway: string;
  /** Document(s) à garder sous les yeux pendant la réponse. */
  stimulus?: Stimulus | Stimulus[];
}

export interface McqActivity extends ActivityBase {
  kind: "mcq";
  prompt: Themed;
  /** Le texte des options peut dépendre de la passion (phrases d'exemple en français, en langues). */
  options: { text: Themed; feedback: Themed }[];
  correct: number;
}

/**
 * Modèle en barres (méthode de Singapour, étape « imagée » entre le concret et l'abstrait) :
 * les données de l'énoncé dessinées en longueurs, pour voir la relation avant de calculer.
 * Il ne donne jamais la réponse : les inconnues restent des « ? ».
 */
export interface BarModel {
  caption: string;
  rows: { label: string; parts: { size: number; text?: string; tone?: "given" | "unknown" | "shade" }[]; total?: string }[];
}

export interface NumericPart {
  id: string;
  label: string;
  competence: CompetenceId;
  prompt: Themed;
  answer: AnswerSpec;
  /** Unités proposées sous forme de pastilles (l'élève choisit). */
  units?: string[];
  hint: string;
  solution: string[];
  /** Retour ciblé par code d'erreur classique. */
  errors?: Record<string, string>;
  /** Type de chaque erreur classique, quand il diffère du classement par défaut (src/lib/coach/diagnose.ts). */
  errorTypes?: Record<string, ErrorType>;
  /** Résumé court affiché une fois la partie terminée (« f(4) = 14 »). */
  recap: string;
  /** Notion à revoir si la partie est ratée. */
  reviewLabel: string;
}

export interface ProblemActivity extends ActivityBase {
  kind: "problem";
  context: Themed;
  parts: NumericPart[];
  /** Représentation en barres, affichée quand la méthode « modèles en barres » est active. */
  model?: BarModel;
}

export type Curve = { type: "affine"; a: number; b: number } | { type: "quadratic"; a: number };

export interface GraphActivity extends ActivityBase {
  kind: "graph";
  prompt: Themed;
  xLabel: string;
  yLabel: string;
  domain: [number, number];
  range: [number, number];
  options: { curve: Curve; feedback: string }[];
  correct: number;
}

export interface OrderActivity extends ActivityBase {
  kind: "order";
  prompt: Themed;
  /** Étapes dans le bon ordre. */
  steps: string[];
  /** Ordre d'affichage initial (indices de `steps`), fixe pour éviter l'aléatoire au rendu. */
  display: number[];
}

export interface SpotErrorActivity extends ActivityBase {
  kind: "spot-error";
  prompt: Themed;
  author: string;
  lines: Themed[];
  wrongLine: number;
  lineFeedback: string[];
  correction: Themed;
}

/** Trier des affirmations dans des catégories (fait / déduction / non établi ; observation / hypothèse…). */
export interface ClassifyActivity extends ActivityBase {
  kind: "classify";
  prompt: Themed;
  categories: string[];
  items: { text: Themed; category: number; feedback: string }[];
}

/** Production écrite courte, relue avec une grille : jamais corrigée par comparaison de texte. */
export interface WritingActivity extends ActivityBase {
  kind: "writing";
  prompt: Themed;
  placeholder?: string;
  minWords: number;
  rubric: { criterion: string; descriptor: string }[];
  /** Indices que le coach peut repérer dans le texte, critère par critère (relecture locale, indicative). */
  checks?: WritingCheck[];
  /** Exemples de réponses recevables (plusieurs formulations valables). */
  models: string[];
}

/** Dialogue en langue vivante : plusieurs répliques peuvent convenir. */
export interface DialogueActivity extends ActivityBase {
  kind: "dialogue";
  prompt: Themed;
  setting: string;
  turns: ({ who: "them"; name: string; text: Themed } | { who: "you"; options: { text: Themed; ok: boolean; feedback: string }[] })[];
}

/** Exemple résolu dont une étape est à compléter. */
export interface WorkedActivity extends ActivityBase {
  kind: "worked";
  prompt: Themed;
  steps: { text: string; why: string }[];
  blank: number;
  options: { text: string; feedback: string }[];
  correct: number;
}

export type Activity = McqActivity | ProblemActivity | GraphActivity | OrderActivity | SpotErrorActivity | ClassifyActivity | WritingActivity | DialogueActivity | WorkedActivity;

export interface Session {
  id: string;
  subject: SubjectId;
  grade: Grade;
  /** Unité du programme travaillée (voir lib/curriculum). */
  unitId: string;
  notion: string;
  chapter: string;
  /** Objectif observable, formulé avec un verbe d'action. */
  objective: string;
  /** Ce que LearnWard ajoute au cours : précisé à l'élève (exercices fictifs, approfondissement). */
  contentNote?: string;
  /** Exemple d'énoncé montré avant de commencer, réécrit avec la passion. */
  preview?: Themed;
  /** Pourquoi l'énoncé n'est pas personnalisé (histoire : les faits ne se réécrivent pas). */
  fixedNote?: string;
  minutes: number;
  /** Contrôle blanc associé, s'il existe. */
  examId?: string;
  activities: Activity[];
  /** Libellé utilisé dans « On y revient » pour chaque activité. */
  reviewLabels: Record<string, string>;
}

export function themed(text: Themed, passion: Passion): string {
  return nb(typeof text === "string" ? text : text(passion));
}

/** Vrai si l'énoncé dépend de la passion (affiche le décor et « Autre univers »). */
export function isThemed(text: Themed): boolean {
  return typeof text !== "string";
}

const firstStep = (solution: string[]) => solution[0] ?? "";

/** Les trois indices progressifs d'une activité : orientation, structure, exemple partiellement résolu. */
export function hintsOf(a: { hint: string; hints?: [string, string]; takeaway: string; solution: string[] }): [string, string, string] {
  return [a.hint, a.hints?.[0] ?? a.takeaway, a.hints?.[1] ?? firstStep(a.solution)];
}

export const STAGES: Record<Stage, { label: string; short: string; n: number }> = {
  rappel: { label: "Rappeler et comprendre", short: "Rappeler", n: 1 },
  application: { label: "Raisonner et appliquer", short: "Appliquer", n: 2 },
  transfert: { label: "Justifier et transférer", short: "Transférer", n: 3 },
  extension: { label: "Pour aller plus loin", short: "Approfondir", n: 4 },
};
