/**
 * Modèle pédagogique de LearnWard (prototype frontend, données locales).
 *
 * Trois couches restent distinctes :
 *  1. le programme national (CurriculumSource → Unit → LearningObjective) ;
 *  2. la progression réelle de la classe (ClassProgress), fournie par l'ENT ou par l'élève ;
 *  3. le profil d'apprentissage (Evidence → MasteryState, Review).
 */

export type Level = "6e" | "5e" | "4e" | "3e" | "2nde" | "1re" | "Tle";
export type Cycle = "Cycle 3" | "Cycle 4" | "Lycée général et technologique";

export type SubjectId =
  | "francais" | "maths" | "hg" | "emc" | "anglais" | "espagnol" | "allemand"
  | "sciences" | "physique" | "svt" | "techno" | "arts" | "musique" | "eps"
  | "ses" | "snt" | "ens-sci" | "maths-tc" | "philo"
  | "hggsp" | "hlp" | "llcer" | "nsi" | "si"
  | "maths-comp" | "maths-exp" | "dgemc"
  | "latin" | "grec" | "llca" | "eppcs" | "arts-spe";

/** Place d'un enseignement dans la scolarité de l'élève. */
export type SubjectRole = "commun" | "specialite" | "option";

/**
 * Statut éditorial (repris du cahier des charges pédagogique) :
 *  - cross_checked : référence officielle identifiée et contenu recoupé avec une source académique ou éditoriale ;
 *  - needs_review : structure plausible, à relire dans le texte officiel avant publication ;
 *  - illustrative_mock : contenu fictif de démonstration ;
 *  - extension_not_required : approfondissement distinct du socle attendu.
 * « verified_official » signifie que le texte officiel a été lu, directement ou dans une copie intégrale
 * hébergée par une académie ou une association disciplinaire (citée dans la source).
 */
export type VerificationStatus = "verified_official" | "cross_checked" | "needs_review" | "illustrative_mock" | "extension_not_required";

/** Version de programme officielle, avec ses dates d'application par niveau. */
export interface CurriculumSource {
  id: string;
  title: string;
  /** Référence de publication (« BO n° 14 du 2 avril 2026 »). */
  reference: string;
  /** Adresse officielle (education.gouv.fr, eduscol.education.gouv.fr). */
  url: string;
  subjects: SubjectId[];
  /** Rentrée d'entrée en vigueur pour chaque niveau (« 2026-09-01 »). */
  applies: { level: Level; from: string; until?: string }[];
  checkedAt: string;
  verification: VerificationStatus;
  /** Sources secondaires ayant servi au recoupement. */
  checkedWith: string[];
  note?: string;
}

/**
 * Unité du programme : un thème ou une notion officielle (pas un chapitre de professeur).
 * Son ordre dans la liste est un ordre indicatif, jamais présenté comme celui de la classe.
 */
export interface Unit {
  id: string;
  level: Level;
  subject: SubjectId;
  sourceId: string;
  domain: string;
  title: string;
  notions: string[];
  /** Unités qui servent de base (même niveau ou niveau précédent). */
  needs?: string[];
  /** Séance jouable dans le prototype. */
  sessionId?: string;
  objectiveIds?: string[];
  verification: VerificationStatus;
}

export type CognitiveOperation = "retrieve" | "interpret" | "apply" | "analyze" | "justify" | "transfer" | "produce" | "evaluate";

/** Objectif observable et testable, rattaché à une unité. */
export interface LearningObjective {
  id: string;
  unitId: string;
  title: string;
  observableOutcome: string;
  knowledge: string[];
  skills: string[];
  prerequisiteIds: string[];
  commonMisconceptions: string[];
  evidenceOfMastery: string[];
  transferIdeas: string[];
  sourceRefs: string[];
  verification: VerificationStatus;
}

/**
 * Progression de la classe dans une matière.
 * source : ENT (simulé dans la démo), indiquée par l'élève, ou simple proposition à confirmer.
 */
export interface ClassProgress {
  subject: SubjectId;
  order: string[];
  current: string | null;
  source: "ent_demo" | "student" | "proposal";
  confirmed: boolean;
}

/** Les étapes d'une séance : trois défis, plus un approfondissement facultatif. */
export type Stage = "rappel" | "application" | "transfert" | "extension";

/** Aide utilisée : 0 aucune, 1 à 3 indices, 4 correction affichée. */
export type Assistance = 0 | 1 | 2 | 3 | 4;

/** Une trace d'apprentissage : un item travaillé, avec le résultat et l'aide reçue. */
export interface Evidence {
  unitId: string;
  itemId: string;
  at: string;
  stage: Stage;
  result: "success" | "partial" | "fail";
  assistance: Assistance;
  /** Réponse libre auto-évaluée avec la grille : indicatif, ne vaut pas une preuve autonome. */
  selfAssessed?: boolean;
  /** Type d'erreur probable repéré par le coach (seulement si la réponse n'était pas juste du premier coup). */
  errorType?: ErrorType;
  /** Méthodes d'apprentissage actives pour cette matière au moment de l'exercice (pour mesurer leur effet). */
  methods?: MethodId[];
}

/**
 * Cinq types de difficulté (diagnostic) : le retour dit ce qui coince, pas seulement « faux ».
 * conceptuelle : la notion n'est pas comprise ; procedurale : méthode connue mais étape oubliée ou mal faite ;
 * calcul : erreur de calcul ou de manipulation ; strategique : mauvaise question, mauvaise donnée, difficulté à démarrer ;
 * redaction : justification, rédaction ou notation incomplète.
 */
export type ErrorType = "conceptuelle" | "procedurale" | "calcul" | "strategique" | "redaction";

/** Méthodes d'apprentissage activables (maths : Singapour et sciences cognitives ; langues : pays nordiques). */
export type MethodId =
  | "sg-modeles" | "sg-demarche" | "automatismes" | "entrelacement"
  | "oral-dabord" | "vo-quotidienne" | "erreur-sans-stress" | "defi-oral";

/** Six états de maîtrise, indépendants des points. */
export type MasteryState = "a-decouvrir" | "en-decouverte" | "fragile" | "consolidation" | "provisoire" | "durable";

export interface Review {
  unitId: string;
  due: string;
  reason: string;
}
