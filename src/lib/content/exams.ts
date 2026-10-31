import { own } from "@/lib/cx";
import type { AnswerSpec } from "@/lib/pedagogy/answer-checker";
import { motion, offerBreakEven, offerCost, offerFunction, offerSaving, offers } from "./scenarios";
import type { CompetenceId, Curve, Grade, SubjectId, Themed } from "./types";

/**
 * Contrôles blancs (30 minutes, sur un chapitre) et épreuves blanches (format officiel, plusieurs chapitres).
 * Noté sur 20, corrigé à la fin comme un vrai devoir surveillé. L'élève navigue librement et rend sa copie.
 */

interface QuestionBase {
  id: string;
  label: string;
  points: number;
  competence: CompetenceId;
  prompt: Themed;
  solution: string[];
  reviewLabel: string;
  /** Chapitre évalué par la question (épreuve blanche sur plusieurs chapitres). Par défaut : celui de la séance liée. */
  unitId?: string;
}

export type ExamQuestion =
  | (QuestionBase & { kind: "mcq"; options: string[]; correct: number })
  | (QuestionBase & { kind: "graph"; options: Curve[]; correct: number; domain: [number, number]; range: [number, number]; xLabel: string; yLabel: string })
  | (QuestionBase & { kind: "numeric"; answer: AnswerSpec; units?: string[]; expected: string })
  | (QuestionBase & { kind: "order"; steps: string[]; display: number[] })
  | (QuestionBase & { kind: "spot-error"; author: string; lines: string[]; wrongLine: number; correction: string });

export interface ExamExercise {
  id: string;
  title: string;
  context?: Themed;
  questions: ExamQuestion[];
  /** false : sans calculatrice (affiché en tête d'exercice). */
  calculator?: boolean;
  /** Durée conseillée pour cette partie, en minutes. */
  minutes?: number;
}

export interface Exam {
  id: string;
  /** Séance liée (chapitre principal, rappel espacé). */
  sessionId: string;
  subject: SubjectId;
  grade: Grade;
  notion: string;
  minutes: number;
  exercises: ExamExercise[];
  /** Épreuve blanche : titre affiché à la place de « Contrôle blanc ». */
  title?: string;
  /** Format de l'épreuve, en quelques lignes, et d'où il vient. */
  format?: { lines: string[]; source: string; verification: "cross_checked" | "single_source" };
}

/** Somme au centième : 10 questions à 0,6 point font bien 6 points, pas 5,999… */
export const round2 = (n: number) => Math.round(n * 100) / 100;
export const exercisePoints = (e: ExamExercise) => round2(e.questions.reduce((s, q) => s + q.points, 0));

const fonctions: Exam = {
  id: "controle-fonctions-affines",
  sessionId: "fonctions-affines-3e",
  subject: "maths",
  grade: "3e",
  notion: "Fonctions affines",
  minutes: 30,
  exercises: [
    {
      id: "ex1",
      title: "Exercice 1 : questions de cours",
      questions: [
        { id: "1a", label: "1", points: 1, kind: "mcq", competence: "communiquer", prompt: "Dans f(x) = −2x + 7, le coefficient directeur est :", options: ["7", "2", "−2", "−7"], correct: 2, solution: ["Dans f(x) = ax + b, a multiplie x : ici a = −2."], reviewLabel: "Le coefficient directeur" },
        { id: "1b", label: "2", points: 1, kind: "mcq", competence: "calculer", prompt: "L'image de 0 par f(x) = 5x − 3 est :", options: ["5", "−3", "3", "0"], correct: 1, solution: ["f(0) = 5 × 0 − 3 = −3 : l'image de 0 est l'ordonnée à l'origine."], reviewLabel: "L'image de 0 et l'ordonnée à l'origine" },
        { id: "1c", label: "3", points: 1, kind: "mcq", competence: "communiquer", prompt: "Laquelle de ces fonctions est linéaire ?", options: ["f(x) = 2x + 1", "g(x) = 4x", "h(x) = x²", "k(x) = 3"], correct: 1, solution: ["Une fonction linéaire s'écrit ax, sans terme constant : g(x) = 4x."], reviewLabel: "Fonction linéaire ou affine" },
        { id: "1d", label: "4", points: 1, kind: "graph", competence: "representer", prompt: "Quelle droite représente f(x) = 3x + 2 ?", options: [{ type: "affine", a: 2, b: 3 }, { type: "affine", a: 3, b: 2 }, { type: "affine", a: -3, b: 2 }], correct: 1, domain: [-2, 2.5], range: [-5, 10], xLabel: "x", yLabel: "y", solution: ["Elle passe par (0 ; 2) et monte de 3 quand x augmente de 1 : la droite B."], reviewLabel: "Reconnaître la droite d'une fonction affine" },
      ],
    },
    {
      id: "ex2",
      title: "Exercice 2 : choisir la bonne formule",
      context: offers(8, 20, 4),
      questions: [
        { id: "2a", label: "a", points: 1.5, kind: "numeric", competence: "calculer", prompt: offerCost(3, "A"), answer: { expected: 24 }, expected: "24 €", solution: ["8 × 3 = 24 €"], reviewLabel: "Calculer un prix proportionnel" },
        { id: "2b", label: "b", points: 1.5, kind: "numeric", competence: "calculer", prompt: offerCost(3, "B"), answer: { expected: 32 }, expected: "32 €", solution: ["20 + 4 × 3 = 32 €"], reviewLabel: "Calculer avec une partie fixe" },
        { id: "2c", label: "c", points: 2, kind: "mcq", competence: "modeliser", prompt: offerFunction(), options: ["g(x) = 20x + 4", "g(x) = 4x + 20", "g(x) = 24x", "g(x) = 8x"], correct: 1, solution: ["20 € une fois, plus 4 € par séance : g(x) = 4x + 20."], reviewLabel: "Traduire une offre en fonction affine" },
        { id: "2d", label: "d", points: 3, kind: "numeric", competence: "raisonner", prompt: offerBreakEven(), answer: { expected: 6 }, expected: "6", solution: ["On cherche x tel que 4x + 20 < 8x, soit 20 < 4x, donc x > 5.", "À 5 séances, égalité (40 €). B est moins chère à partir de 6."], reviewLabel: "Comparer deux formules avec une inéquation" },
        { id: "2e", label: "e", points: 2, kind: "numeric", competence: "chercher", prompt: offerSaving(10), answer: { expected: 20 }, expected: "20 €", solution: ["Formule A : 8 × 10 = 80 €. Formule B : 20 + 4 × 10 = 60 €.", "Économie : 80 − 60 = 20 €."], reviewLabel: "Calculer une économie" },
      ],
    },
    {
      id: "ex3",
      title: "Exercice 3 : rédaction",
      questions: [
        { id: "3a", label: "a", points: 3, kind: "order", competence: "raisonner", prompt: "Remets dans l'ordre la résolution de 8x = 4x + 20.", steps: ["8x = 4x + 20", "8x − 4x = 20", "4x = 20", "x = 20 ÷ 4", "x = 5"], display: [3, 0, 4, 2, 1], solution: ["On regroupe les x d'un côté : 8x − 4x = 20.", "4x = 20, donc x = 20 ÷ 4 = 5."], reviewLabel: "Résoudre une équation avec des x des deux côtés" },
        { id: "3b", label: "b", points: 3, kind: "spot-error", competence: "chercher", prompt: "Noa cherche l'antécédent de 11 par f(x) = 2x − 3. Touche la ligne qui contient l'erreur.", author: "Noa", lines: ["2x − 3 = 11", "2x = 11 − 3", "2x = 8", "x = 4"], wrongLine: 1, correction: "2x = 11 + 3 = 14, donc x = 7", solution: ["Pour enlever le − 3, on ajoute 3 des deux côtés : 2x = 14.", "x = 7. Vérification : 2 × 7 − 3 = 11."], reviewLabel: "Isoler x quand il y a une soustraction" },
      ],
    },
  ],
};

const vitesse: Exam = {
  id: "controle-vitesse-moyenne",
  sessionId: "vitesse-moyenne-3e",
  subject: "physique",
  grade: "3e",
  notion: "Vitesse moyenne",
  minutes: 30,
  exercises: [
    {
      id: "ex1",
      title: "Exercice 1 : questions de cours",
      questions: [
        { id: "1a", label: "1", points: 1, kind: "mcq", competence: "app", prompt: "La vitesse moyenne se calcule avec :", options: ["v = d × t", "v = d ÷ t", "v = t ÷ d", "v = d − t"], correct: 1, solution: ["v = d ÷ t : distance parcourue divisée par la durée."], reviewLabel: "La relation v = d ÷ t" },
        { id: "1b", label: "2", points: 1, kind: "mcq", competence: "app", prompt: "1 m/s est égal à :", options: ["3,6 km/h", "1 000 km/h", "60 km/h", "0,36 km/h"], correct: 0, solution: ["1 m/s = 3 600 m par heure = 3,6 km/h."], reviewLabel: "La conversion m/s et km/h" },
        { id: "1c", label: "3", points: 1, kind: "graph", competence: "com", prompt: "Quel graphique distance–temps correspond à une vitesse constante ?", options: [{ type: "affine", a: 0, b: 6 }, { type: "quadratic", a: 0.45 }, { type: "affine", a: 2, b: 0 }], correct: 2, domain: [0, 5], range: [0, 12], xLabel: "t", yLabel: "d", solution: ["Distance proportionnelle au temps : une droite qui passe par l'origine, le graphique C."], reviewLabel: "Lire un graphique distance–temps" },
        { id: "1d", label: "4", points: 1, kind: "mcq", competence: "app", prompt: "Un mouvement dont la trajectoire est une droite est dit :", options: ["circulaire", "rectiligne", "curviligne", "uniforme"], correct: 1, solution: ["Trajectoire droite : mouvement rectiligne. « Uniforme » concerne la vitesse, pas la trajectoire."], reviewLabel: "Le vocabulaire du mouvement" },
      ],
    },
    {
      id: "ex2",
      title: "Exercice 2 : analyser un mouvement",
      context: motion(100, 12.5),
      questions: [
        { id: "2a", label: "a", points: 2.5, kind: "numeric", competence: "rea", prompt: "Calcule la vitesse moyenne en m/s.", units: ["m/s", "km/h"], answer: { expected: 8, unit: "m/s", requireUnit: true, unitMustMatch: true }, expected: "8 m/s", solution: ["v = d ÷ t = 100 ÷ 12,5 = 8 m/s"], reviewLabel: "Calculer une vitesse" },
        { id: "2b", label: "b", points: 2.5, kind: "numeric", competence: "ana", prompt: "Exprime cette vitesse en km/h.", units: ["m/s", "km/h"], answer: { expected: 28.8, unit: "km/h", requireUnit: true, unitMustMatch: true }, expected: "28,8 km/h", solution: ["8 × 3,6 = 28,8 km/h"], reviewLabel: "Convertir des m/s en km/h" },
        { id: "2c", label: "c", points: 2.5, kind: "numeric", competence: "rea", prompt: "À cette vitesse, combien de temps pour parcourir 400 m ?", units: ["s", "min"], answer: { expected: 50, unit: "s", requireUnit: true }, expected: "50 s", solution: ["t = d ÷ v = 400 ÷ 8 = 50 s"], reviewLabel: "Calculer une durée" },
        { id: "2d", label: "d", points: 2.5, kind: "numeric", competence: "rea", prompt: "Quelle distance est parcourue en 30 s ?", units: ["m", "km"], answer: { expected: 240, unit: "m", requireUnit: true }, expected: "240 m", solution: ["d = v × t = 8 × 30 = 240 m"], reviewLabel: "Calculer une distance" },
      ],
    },
    {
      id: "ex3",
      title: "Exercice 3 : raisonner et contrôler",
      questions: [
        { id: "3a", label: "a", points: 3, kind: "order", competence: "ana", prompt: "Un train roule à 50 m/s. Remets dans l'ordre le calcul de la durée pour parcourir d = 1 200 m.", steps: ["v = d ÷ t", "v × t = d", "t = d ÷ v", "t = 1 200 ÷ 50", "t = 24 s"], display: [3, 0, 4, 2, 1], solution: ["v = d ÷ t, donc v × t = d, donc t = d ÷ v.", "t = 1 200 ÷ 50 = 24 s."], reviewLabel: "Isoler t dans v = d ÷ t" },
        { id: "3b", label: "b", points: 3, kind: "spot-error", competence: "val", prompt: "Inès convertit 54 km/h en m/s. Touche la ligne qui contient l'erreur.", author: "Inès", lines: ["v = 54 km/h", "v = 54 × 3,6 m/s", "v = 194,4 m/s"], wrongLine: 1, correction: "v = 54 ÷ 3,6 = 15 m/s", solution: ["De km/h vers m/s, on divise par 3,6 : 15 m/s.", "194 m/s ≈ 700 km/h : l'ordre de grandeur aurait dû alerter."], reviewLabel: "Convertir des km/h en m/s" },
      ],
    },
  ],
};

/* ——— Épreuves blanches ——— */

const A = 0.6;

/**
 * Brevet blanc de mathématiques, nouveau format (depuis la session 2026) : 2 heures, sur 20.
 * Partie 1 : automatismes, 20 minutes, 6 points, sans calculatrice ni justification. Partie 2 : 14 points, problèmes
 * justifiés (1 h 40). Recoupé (L'Étudiant, Digischool). Calculatrice autorisée en partie 2, « une dizaine de questions »
 * en partie 1 et rédaction notée sur 2 points : L'Étudiant seulement, à vérifier dans la note de service.
 */
const brevetMaths: Exam = {
  id: "brevet-blanc-maths",
  sessionId: "fonctions-affines-3e",
  subject: "maths",
  grade: "3e",
  notion: "Brevet de maths",
  title: "Brevet blanc de maths",
  minutes: 120,
  format: {
    lines: ["2 heures, sur 20", "Partie 1 : automatismes, 20 minutes, 6 points, sans calculatrice", "Partie 2 : trois problèmes, 14 points, calculatrice autorisée", "Au vrai brevet, la rédaction compte : ici, elle est évaluée à travers les questions de démarche"],
    source: "Format du brevet recoupé (L'Étudiant, Digischool) ; calculatrice en partie 2 : une seule source",
    verification: "cross_checked",
  },
  exercises: [
    {
      id: "p1",
      title: "Partie 1 : automatismes",
      calculator: false,
      minutes: 20,
      questions: [
        { id: "b1", label: "1", points: A, kind: "numeric", competence: "calculer", unitId: "4e-maths-propor", prompt: "Calcule 25 % de 80.", answer: { expected: 20 }, expected: "20", solution: ["25 % = un quart : 80 ÷ 4 = 20."], reviewLabel: "Prendre un pourcentage" },
        { id: "b2", label: "2", points: A, kind: "mcq", competence: "calculer", unitId: "3e-maths-arith", prompt: "La décomposition de 84 en produit de facteurs premiers est :", options: ["2 × 42", "2² × 3 × 7", "4 × 21", "2³ × 3 × 7"], correct: 1, solution: ["84 = 2 × 42 = 2 × 2 × 21 = 2² × 3 × 7.", "4, 21 et 42 ne sont pas premiers ; 2³ × 3 × 7 vaut 168."], reviewLabel: "Décomposer en facteurs premiers" },
        { id: "b3", label: "3", points: A, kind: "mcq", competence: "calculer", unitId: "3e-maths-arith", prompt: "La fraction irréductible égale à 18/24 est :", options: ["9/12", "3/4", "6/8", "2/3"], correct: 1, solution: ["PGCD(18 ; 24) = 6 : 18/24 = 3/4.", "9/12 et 6/8 sont égales, mais encore simplifiables."], reviewLabel: "Rendre une fraction irréductible" },
        { id: "b4", label: "4", points: A, kind: "mcq", competence: "calculer", unitId: "3e-maths-litteral", prompt: "(x + 3)² est égal à :", options: ["x² + 9", "x² + 6x + 9", "x² + 3x + 9", "2x + 6"], correct: 1, solution: ["(a + b)² = a² + 2ab + b² : x² + 2 × 3 × x + 9 = x² + 6x + 9."], reviewLabel: "Développer une identité remarquable" },
        { id: "b5", label: "5", points: A, kind: "numeric", competence: "calculer", unitId: "4e-maths-equations", prompt: "Résous 3x − 5 = 10. x = ?", answer: { expected: 5, knownErrors: [{ value: 5 / 3, code: "signe" }] }, expected: "5", solution: ["3x = 10 + 5 = 15, donc x = 15 ÷ 3 = 5."], reviewLabel: "Résoudre une équation du premier degré" },
        { id: "b6", label: "6", points: A, kind: "numeric", competence: "calculer", unitId: "3e-maths-fonctions", prompt: "f(x) = 2x − 1. Calcule l'image de −3 par f.", answer: { expected: -7 }, expected: "−7", solution: ["f(−3) = 2 × (−3) − 1 = −6 − 1 = −7."], reviewLabel: "Calculer une image" },
        { id: "b7", label: "7", points: A, kind: "mcq", competence: "calculer", unitId: "4e-maths-puissances", prompt: "10⁻³ est égal à :", options: ["−1 000", "0,001", "−0,001", "0,000 1"], correct: 1, solution: ["10⁻³ = 1 ÷ 10³ = 1 ÷ 1 000 = 0,001. Un exposant négatif ne rend pas le nombre négatif."], reviewLabel: "Les puissances de 10 négatives" },
        { id: "b8", label: "8", points: A, kind: "numeric", competence: "calculer", unitId: "3e-maths-stats", prompt: "Calcule la moyenne de la série 8 ; 12 ; 13.", answer: { expected: 11 }, expected: "11", solution: ["(8 + 12 + 13) ÷ 3 = 33 ÷ 3 = 11."], reviewLabel: "Calculer une moyenne" },
        { id: "b9", label: "9", points: A, kind: "mcq", competence: "raisonner", unitId: "3e-maths-proba", prompt: "On tire une carte au hasard dans un jeu de 32 cartes. La probabilité de tirer un roi est :", options: ["1/32", "1/8", "1/4", "4/52"], correct: 1, solution: ["Il y a 4 rois sur 32 cartes : 4/32 = 1/8."], reviewLabel: "Calculer une probabilité simple" },
        { id: "b10", label: "10", points: A, kind: "numeric", competence: "calculer", unitId: "3e-maths-espace", prompt: "Volume d'un cube de 3 cm d'arête, en cm³ ?", answer: { expected: 27, knownErrors: [{ value: 9, code: "aire" }] }, expected: "27 cm³", solution: ["V = 3 × 3 × 3 = 27 cm³. (9 cm², c'est l'aire d'une face.)"], reviewLabel: "Calculer le volume d'un cube" },
      ],
    },
    {
      id: "p2-thales",
      title: "Partie 2, exercice 1 : un agrandissement",
      calculator: true,
      context: "Les points A, B, D sont alignés, ainsi que A, C, E. Les droites (BC) et (DE) sont parallèles. AB = 4 cm, AD = 10 cm et BC = 3 cm.",
      questions: [
        { id: "t1", label: "a", points: 2, kind: "numeric", competence: "calculer", unitId: "3e-maths-thales", prompt: "Calcule DE, en cm.", answer: { expected: 7.5, knownErrors: [{ value: 1.2, code: "inverse" }] }, expected: "7,5 cm", solution: ["D'après le théorème de Thalès : AB/AD = BC/DE, soit 4/10 = 3/DE.", "DE = 3 × 10 ÷ 4 = 7,5 cm."], reviewLabel: "Calculer une longueur avec le théorème de Thalès" },
        { id: "t2", label: "b", points: 2, kind: "order", competence: "raisonner", unitId: "3e-maths-thales", prompt: "Remets dans l'ordre la rédaction du calcul de DE.", steps: ["Les points A, B, D et A, C, E sont alignés, et (BC) // (DE).", "D'après le théorème de Thalès : AB/AD = AC/AE = BC/DE.", "Donc 4/10 = 3/DE.", "DE = 3 × 10 ÷ 4", "DE = 7,5 cm"], display: [2, 0, 4, 1, 3], solution: ["On cite d'abord les hypothèses (alignements, parallèles), puis le théorème, puis le calcul."], reviewLabel: "Rédiger avec le théorème de Thalès" },
        { id: "t3", label: "c", points: 1, kind: "mcq", competence: "raisonner", unitId: "3e-maths-thales", prompt: "Le triangle ADE est un agrandissement du triangle ABC de rapport :", options: ["2,5", "0,4", "6", "1,5"], correct: 0, solution: ["AD ÷ AB = 10 ÷ 4 = 2,5. (0,4 est le rapport de réduction, de ADE vers ABC.)"], reviewLabel: "Trouver un rapport d'agrandissement" },
      ],
    },
    {
      id: "p2-tarifs",
      title: "Partie 2, exercice 2 : deux tarifs",
      calculator: true,
      context: "Une appli de location de vélos propose deux tarifs. Tarif A : 0,25 € la minute. Tarif B : un abonnement de 6 € par mois, puis 0,10 € la minute.",
      questions: [
        { id: "f1", label: "a", points: 1, kind: "numeric", competence: "calculer", unitId: "3e-maths-affines", prompt: "Combien coûtent 30 minutes avec le tarif A, en euros ?", answer: { expected: 7.5 }, expected: "7,50 €", solution: ["0,25 × 30 = 7,50 €."], reviewLabel: "Calculer un prix proportionnel" },
        { id: "f2", label: "b", points: 1, kind: "mcq", competence: "modeliser", unitId: "3e-maths-affines", prompt: "Quelle fonction donne le prix, en euros, pour x minutes avec le tarif B ?", options: ["g(x) = 6x + 0,10", "g(x) = 0,10x + 6", "g(x) = 6,10x", "g(x) = 0,25x"], correct: 1, solution: ["6 € une fois, plus 0,10 € par minute : g(x) = 0,10x + 6."], reviewLabel: "Traduire un tarif en fonction affine" },
        { id: "f3", label: "c", points: 2, kind: "numeric", competence: "raisonner", unitId: "3e-maths-affines", prompt: "À partir de combien de minutes (nombre entier) le tarif B devient-il strictement moins cher ?", answer: { expected: 41, knownErrors: [{ value: 40, code: "egalite" }] }, expected: "41", solution: ["0,10x + 6 < 0,25x ⇔ 6 < 0,15x ⇔ x > 40.", "À 40 minutes, les deux tarifs coûtent 10 € : B est strictement moins cher à partir de 41 minutes."], reviewLabel: "Comparer deux tarifs avec une inéquation" },
        { id: "f4", label: "d", points: 1, kind: "spot-error", competence: "chercher", unitId: "3e-maths-litteral", prompt: "Léo résout 0,25x = 0,10x + 6. Touche la ligne qui contient l'erreur.", author: "Léo", lines: ["0,25x = 0,10x + 6", "0,25x − 0,10x = 6", "0,15x = 6", "x = 6 × 0,15", "x = 0,9"], wrongLine: 3, correction: "x = 6 ÷ 0,15 = 40", solution: ["Pour isoler x dans 0,15x = 6, on divise par 0,15 : x = 40."], reviewLabel: "Isoler x en divisant" },
      ],
    },
    {
      id: "p2-stats",
      title: "Partie 2, exercice 3 : statistiques et probabilités",
      calculator: true,
      context: "Voici les cinq notes d'un élève au premier trimestre : 12 ; 16 ; 9 ; 14 ; 10.",
      questions: [
        { id: "s1", label: "a", points: 1, kind: "numeric", competence: "calculer", unitId: "3e-maths-stats", prompt: "Calcule la moyenne de ces notes.", answer: { expected: 12.2 }, expected: "12,2", solution: ["(12 + 16 + 9 + 14 + 10) ÷ 5 = 61 ÷ 5 = 12,2."], reviewLabel: "Calculer une moyenne" },
        { id: "s2", label: "b", points: 1, kind: "numeric", competence: "calculer", unitId: "3e-maths-stats", prompt: "Quelle est la médiane de ces notes ?", answer: { expected: 12, knownErrors: [{ value: 9, code: "rangement" }] }, expected: "12", solution: ["On range : 9 ; 10 ; 12 ; 14 ; 16. La valeur du milieu est 12."], reviewLabel: "Trouver une médiane" },
        { id: "s3", label: "c", points: 1, kind: "numeric", competence: "calculer", unitId: "3e-maths-stats", prompt: "Quelle est l'étendue de ces notes ?", answer: { expected: 7 }, expected: "7", solution: ["16 − 9 = 7."], reviewLabel: "Calculer une étendue" },
        { id: "s4", label: "d", points: 1, kind: "mcq", competence: "raisonner", unitId: "3e-maths-proba", prompt: "On tire une de ces notes au hasard. Quelle est la probabilité qu'elle soit supérieure ou égale à 12 ?", options: ["3/5", "2/5", "1/2", "12/20"], correct: 0, solution: ["12, 14 et 16 conviennent : 3 notes sur 5, soit 3/5."], reviewLabel: "Calculer une probabilité" },
      ],
    },
  ],
};

const H = 0.5;

/**
 * Épreuve anticipée de mathématiques (fin de première, spécialité maths) : 2 heures, sans calculatrice, sur 20.
 * Partie 1 : automatismes (QCM), 6 points. Partie 2 : exercices, 14 points. Format recoupé (L'Express, Diplomeo).
 */
const eamBlanc: Exam = {
  id: "eam-blanc",
  sessionId: "suites-1re",
  subject: "maths",
  grade: "1re",
  notion: "Épreuve anticipée de maths",
  title: "Épreuve anticipée de maths blanche",
  minutes: 120,
  format: {
    lines: ["2 heures, sur 20, sans calculatrice", "Partie 1 : automatismes en QCM, 6 points", "Partie 2 : exercices sur le programme de première, 14 points", "Version élèves de spécialité maths (il existe une version sans spécialité et une version technologique)"],
    source: "Format de l'épreuve anticipée de mathématiques, recoupé (L'Express Éducation, Diplomeo)",
    verification: "cross_checked",
  },
  exercises: [
    {
      id: "auto",
      title: "Partie 1 : automatismes",
      calculator: false,
      questions: [
        { id: "e1", label: "1", points: H, kind: "mcq", competence: "calculer", unitId: "2nde-maths-automatismes", prompt: "3/4 + 1/6 est égal à :", options: ["4/10", "11/12", "4/24", "1/2"], correct: 1, solution: ["Dénominateur commun 12 : 9/12 + 2/12 = 11/12."], reviewLabel: "Additionner des fractions" },
        { id: "e2", label: "2", points: H, kind: "mcq", competence: "calculer", unitId: "2nde-maths-automatismes", prompt: "Un prix augmente de 20 %, puis baisse de 20 %. Au total, il a :", options: ["retrouvé sa valeur", "baissé de 4 %", "augmenté de 4 %", "baissé de 40 %"], correct: 1, solution: ["1,2 × 0,8 = 0,96 : baisse globale de 4 %."], reviewLabel: "Enchaîner deux évolutions" },
        { id: "e3", label: "3", points: H, kind: "mcq", competence: "calculer", unitId: "2nde-maths-automatismes", prompt: "2⁵ × 2³ est égal à :", options: ["2¹⁵", "4⁸", "2⁸", "2²"], correct: 2, solution: ["On ajoute les exposants : 2⁵⁺³ = 2⁸."], reviewLabel: "Multiplier des puissances" },
        { id: "e4", label: "4", points: H, kind: "mcq", competence: "calculer", unitId: "2nde-maths-automatismes", prompt: "L'écriture scientifique de 0,000 52 est :", options: ["52 × 10⁻⁵", "5,2 × 10⁻⁴", "5,2 × 10⁴", "0,52 × 10⁻³"], correct: 1, solution: ["Un seul chiffre non nul avant la virgule : 5,2, et la virgule a bougé de 4 rangs : 10⁻⁴."], reviewLabel: "Écriture scientifique" },
        { id: "e5", label: "5", points: H, kind: "mcq", competence: "calculer", unitId: "2nde-maths-calcul", prompt: "La solution de 2x + 7 = 1 est :", options: ["4", "−3", "3", "−4"], correct: 1, solution: ["2x = 1 − 7 = −6, donc x = −3."], reviewLabel: "Résoudre une équation" },
        { id: "e6", label: "6", points: H, kind: "mcq", competence: "calculer", unitId: "2nde-maths-calcul", prompt: "(x − 2)(x + 2) est égal à :", options: ["x² − 4", "x² + 4", "x² − 4x + 4", "2x"], correct: 0, solution: ["(a − b)(a + b) = a² − b² : x² − 4."], reviewLabel: "Identité remarquable a² − b²" },
        { id: "e7", label: "7", points: H, kind: "mcq", competence: "calculer", unitId: "2nde-maths-automatismes", prompt: "Le coefficient multiplicateur associé à une baisse de 15 % est :", options: ["0,15", "1,15", "0,85", "−0,15"], correct: 2, solution: ["1 − 15/100 = 0,85."], reviewLabel: "Coefficient multiplicateur" },
        { id: "e8", label: "8", points: H, kind: "mcq", competence: "calculer", unitId: "2nde-maths-reperee", prompt: "Le coefficient directeur de la droite passant par (0 ; 1) et (2 ; 5) est :", options: ["2", "4", "1/2", "3"], correct: 0, solution: ["(5 − 1) ÷ (2 − 0) = 4 ÷ 2 = 2."], reviewLabel: "Coefficient directeur d'une droite" },
        { id: "e9", label: "9", points: H, kind: "mcq", competence: "calculer", unitId: "2nde-maths-automatismes", prompt: "La moyenne de la série 4 ; 8 ; 9 ; 11 est :", options: ["8", "8,5", "9", "32"], correct: 0, solution: ["(4 + 8 + 9 + 11) ÷ 4 = 32 ÷ 4 = 8."], reviewLabel: "Calculer une moyenne" },
        { id: "e10", label: "10", points: H, kind: "mcq", competence: "calculer", unitId: "2nde-maths-automatismes", prompt: "30 % de 70 est égal à :", options: ["2,1", "21", "210", "40"], correct: 1, solution: ["0,3 × 70 = 21."], reviewLabel: "Appliquer un pourcentage" },
        { id: "e11", label: "11", points: H, kind: "mcq", competence: "calculer", unitId: "2nde-maths-automatismes", prompt: "Un prix passe de 50 € à 60 €. Le taux d'évolution est :", options: ["+10 %", "+20 %", "+16,7 %", "+1,2 %"], correct: 1, solution: ["(60 − 50) ÷ 50 = 0,2 : +20 %."], reviewLabel: "Calculer un taux d'évolution" },
        { id: "e12", label: "12", points: H, kind: "mcq", competence: "calculer", unitId: "2nde-maths-fonctions", prompt: "f(x) = x² − 3. L'image de −2 par f est :", options: ["−7", "1", "7", "−1"], correct: 1, solution: ["(−2)² − 3 = 4 − 3 = 1. Attention : (−2)² = 4."], reviewLabel: "Calculer une image avec un carré" },
      ],
    },
    {
      id: "suites",
      title: "Partie 2, exercice 1 : une suite",
      calculator: false,
      context: "Une plateforme compte 2 000 abonnés en 2026 et en gagne 150 de plus chaque année. On note uₙ le nombre d'abonnés en 2026 + n (u₀ = 2 000).",
      questions: [
        { id: "u1", label: "a", points: 1, kind: "numeric", competence: "calculer", unitId: "1re-maths-suites", prompt: "Calcule u₁.", answer: { expected: 2150 }, expected: "2 150", solution: ["u₁ = 2 000 + 150 = 2 150."], reviewLabel: "Calculer un terme" },
        { id: "u2", label: "b", points: 1, kind: "mcq", competence: "modeliser", unitId: "1re-maths-suites", prompt: "La suite (uₙ) est :", options: ["arithmétique de raison 150", "géométrique de raison 150", "arithmétique de raison 2 000", "ni arithmétique ni géométrique"], correct: 0, solution: ["On ajoute 150 à chaque étape : suite arithmétique de raison 150."], reviewLabel: "Reconnaître une suite arithmétique" },
        { id: "u3", label: "c", points: 1.5, kind: "mcq", competence: "modeliser", unitId: "1re-maths-suites", prompt: "Pour tout entier naturel n :", options: ["uₙ = 2 000 × 150ⁿ", "uₙ = 2 000 + 150n", "uₙ = 150 + 2 000n", "uₙ = 2 150n"], correct: 1, solution: ["Suite arithmétique : uₙ = u₀ + n × r = 2 000 + 150n."], reviewLabel: "Terme général d'une suite arithmétique" },
        { id: "u4", label: "d", points: 2, kind: "numeric", competence: "raisonner", unitId: "1re-maths-suites", prompt: "À partir de quel rang n le nombre d'abonnés dépasse-t-il strictement 3 000 ?", answer: { expected: 7, knownErrors: [{ value: 6, code: "arrondi" }, { value: 2033, code: "annee" }] }, expected: "n = 7", solution: ["2 000 + 150n > 3 000 ⇔ 150n > 1 000 ⇔ n > 6,66…", "Le premier entier qui convient est n = 7 (en 2033)."], reviewLabel: "Résoudre une inéquation sur une suite" },
        { id: "u5", label: "e", points: 1.5, kind: "spot-error", competence: "chercher", unitId: "1re-maths-suites", prompt: "Sam calcule u₁₀. Touche la ligne qui contient l'erreur.", author: "Sam", lines: ["uₙ = 2 000 + 150n", "u₁₀ = 2 000 + 150 × 10", "u₁₀ = 2 150 × 10", "u₁₀ = 21 500"], wrongLine: 2, correction: "u₁₀ = 2 000 + 1 500 = 3 500", solution: ["La multiplication passe avant l'addition : 150 × 10 = 1 500, puis 2 000 + 1 500 = 3 500."], reviewLabel: "Priorités de calcul" },
      ],
    },
    {
      id: "second-degre",
      title: "Partie 2, exercice 2 : second degré",
      calculator: false,
      context: "On considère la fonction f définie sur ℝ par f(x) = x² − 6x + 5.",
      questions: [
        { id: "d1", label: "a", points: 1, kind: "numeric", competence: "calculer", unitId: "1re-maths-second-degre", prompt: "Calcule f(0).", answer: { expected: 5 }, expected: "5", solution: ["f(0) = 0 − 0 + 5 = 5."], reviewLabel: "Calculer une image" },
        { id: "d2", label: "b", points: 1.5, kind: "numeric", competence: "calculer", unitId: "1re-maths-second-degre", prompt: "Calcule le discriminant Δ.", answer: { expected: 16, knownErrors: [{ value: 56, code: "signe" }] }, expected: "16", solution: ["Δ = b² − 4ac = (−6)² − 4 × 1 × 5 = 36 − 20 = 16."], reviewLabel: "Calculer un discriminant" },
        { id: "d3", label: "c", points: 1, kind: "mcq", competence: "calculer", unitId: "1re-maths-second-degre", prompt: "Les solutions de f(x) = 0 sont :", options: ["1 et 5", "−1 et −5", "2 et 3", "il n'y en a pas"], correct: 0, solution: ["Δ = 16 > 0 : x = (6 − 4) ÷ 2 = 1 et x = (6 + 4) ÷ 2 = 5."], reviewLabel: "Résoudre une équation du second degré" },
        { id: "d4", label: "d", points: 1.5, kind: "mcq", competence: "calculer", unitId: "1re-maths-second-degre", prompt: "La forme factorisée de f(x) est :", options: ["(x + 1)(x + 5)", "(x − 1)(x − 5)", "(x − 3)²", "(x − 1)(x + 5)"], correct: 1, solution: ["Racines 1 et 5, a = 1 : f(x) = (x − 1)(x − 5). On vérifie : x² − 5x − x + 5 = x² − 6x + 5."], reviewLabel: "Factoriser avec les racines" },
        { id: "d5", label: "e", points: 2, kind: "order", competence: "raisonner", unitId: "1re-maths-second-degre", prompt: "Remets dans l'ordre la recherche du minimum de f.", steps: ["f(x) = x² − 6x + 5", "f(x) = (x − 3)² − 9 + 5", "f(x) = (x − 3)² − 4", "Un carré est toujours positif ou nul, donc f(x) ≥ −4", "Le minimum de f est −4, atteint en x = 3"], display: [3, 1, 4, 0, 2], solution: ["x² − 6x = (x − 3)² − 9 : c'est la forme canonique.", "f(x) = (x − 3)² − 4 ≥ −4, avec égalité pour x = 3."], reviewLabel: "Forme canonique et minimum" },
      ],
    },
  ],
};

export const EXAMS: Record<string, Exam> = { [fonctions.id]: fonctions, [vitesse.id]: vitesse, [brevetMaths.id]: brevetMaths, [eamBlanc.id]: eamBlanc };

export function getExam(id: string): Exam {
  const e = own(EXAMS, id);
  if (!e) throw new Error(`Contrôle inconnu : ${id}`);
  return e;
}
