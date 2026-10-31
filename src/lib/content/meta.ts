import type { ActivityKind, CompetenceId, SubjectId } from "./types";

export interface SubjectMeta {
  label: string;
  short: string;
  /** Couleur de la matière : fond plein sous icône blanche, déclinée automatiquement en clair et en sombre. */
  color: string;
}

export const SUBJECTS: Record<SubjectId, SubjectMeta> = {
  francais: { label: "Français", short: "Français", color: "#c2410c" },
  maths: { label: "Mathématiques", short: "Maths", color: "#2d5bff" },
  "maths-tc": { label: "Mathématiques (tronc commun)", short: "Maths", color: "#2d5bff" },
  "maths-comp": { label: "Mathématiques complémentaires", short: "Maths comp.", color: "#2d5bff" },
  "maths-exp": { label: "Mathématiques expertes", short: "Maths exp.", color: "#2d5bff" },
  hg: { label: "Histoire-géographie", short: "Histoire-géo", color: "#8a5a00" },
  emc: { label: "Enseignement moral et civique", short: "EMC", color: "#0e7490" },
  anglais: { label: "Anglais", short: "Anglais", color: "#6d28d9" },
  espagnol: { label: "Espagnol", short: "Espagnol", color: "#0f766e" },
  allemand: { label: "Allemand", short: "Allemand", color: "#475569" },
  sciences: { label: "Sciences", short: "Sciences", color: "#15803d" },
  physique: { label: "Physique-chimie", short: "Physique", color: "#d1206a" },
  svt: { label: "SVT", short: "SVT", color: "#15803d" },
  techno: { label: "Technologie", short: "Techno", color: "#4b5568" },
  arts: { label: "Arts plastiques", short: "Arts", color: "#a21caf" },
  musique: { label: "Éducation musicale", short: "Musique", color: "#4f46e5" },
  eps: { label: "EPS", short: "EPS", color: "#4d7c0f" },
  ses: { label: "Sciences économiques et sociales", short: "SES", color: "#9f1239" },
  snt: { label: "Sciences numériques et technologie", short: "SNT", color: "#4b5568" },
  "ens-sci": { label: "Enseignement scientifique", short: "Ens. scientifique", color: "#0e7490" },
  philo: { label: "Philosophie", short: "Philo", color: "#334155" },
  hggsp: { label: "Histoire-géo, géopolitique et sciences politiques", short: "HGGSP", color: "#8a5a00" },
  hlp: { label: "Humanités, littérature et philosophie", short: "HLP", color: "#9a3412" },
  llcer: { label: "Langues, littératures et cultures étrangères (anglais)", short: "LLCER anglais", color: "#6d28d9" },
  nsi: { label: "Numérique et sciences informatiques", short: "NSI", color: "#334155" },
  si: { label: "Sciences de l'ingénieur", short: "SI", color: "#57534e" },
  dgemc: { label: "Droit et grands enjeux du monde contemporain", short: "DGEMC", color: "#0e7490" },
  latin: { label: "Latin", short: "Latin", color: "#7c2d12" },
  grec: { label: "Grec ancien", short: "Grec", color: "#1e40af" },
  llca: { label: "Littérature, langues et cultures de l'Antiquité", short: "LLCA", color: "#7c2d12" },
  eppcs: { label: "Éducation physique, pratiques et culture sportives", short: "EPPCS", color: "#4d7c0f" },
  "arts-spe": { label: "Arts plastiques (spécialité)", short: "Arts plastiques", color: "#a21caf" },
};

/** Ordre d'affichage, comme sur un bulletin. */
export const SUBJECT_ORDER: SubjectId[] = [
  "francais", "philo", "maths", "maths-tc", "hg", "emc", "anglais", "espagnol", "allemand",
  "sciences", "physique", "svt", "techno", "snt", "ens-sci", "ses",
  "arts", "musique", "eps",
  "hggsp", "hlp", "llcer", "llca", "nsi", "si", "eppcs", "arts-spe", "maths-comp", "maths-exp", "dgemc", "latin", "grec",
];

export const COMPETENCES: Record<CompetenceId, { label: string; subject: SubjectId; description: string }> = {
  chercher: { label: "Chercher", subject: "maths", description: "Tester, contrôler, essayer une piste" },
  modeliser: { label: "Modéliser", subject: "maths", description: "Traduire une situation en calcul" },
  representer: { label: "Représenter", subject: "maths", description: "Passer d'une représentation à l'autre" },
  raisonner: { label: "Raisonner", subject: "maths", description: "Enchaîner des étapes justifiées" },
  calculer: { label: "Calculer", subject: "maths", description: "Calculer juste, avec méthode" },
  communiquer: { label: "Communiquer", subject: "maths", description: "Utiliser le vocabulaire et les notations exacts" },
  app: { label: "S'approprier", subject: "physique", description: "Connaître les relations du cours" },
  ana: { label: "Analyser", subject: "physique", description: "Construire un raisonnement" },
  rea: { label: "Réaliser", subject: "physique", description: "Mener un calcul avec ses unités" },
  val: { label: "Valider", subject: "physique", description: "Juger si un résultat est plausible" },
  com: { label: "Communiquer", subject: "physique", description: "Lire et choisir un graphique" },
  "fr-lire": { label: "Lire et interpréter", subject: "francais", description: "Repérer un procédé, l'interpréter, le prouver par le texte" },
  "fr-langue": { label: "Étude de la langue", subject: "francais", description: "Accords, conjugaison, construction des phrases" },
  "fr-ecrire": { label: "Écrire", subject: "francais", description: "Organiser un paragraphe, argumenter" },
  "fr-culture": { label: "Culture littéraire", subject: "francais", description: "Situer une œuvre, un genre, un mouvement" },
  "hg-temps": { label: "Se repérer dans le temps", subject: "hg", description: "Dates, chronologie, contexte" },
  "hg-espace": { label: "Se repérer dans l'espace", subject: "hg", description: "Localiser, lire une carte, changer d'échelle" },
  "hg-docs": { label: "Analyser un document", subject: "hg", description: "Nature, auteur, date, intérêt et limites" },
  "hg-raisonner": { label: "Raisonner et justifier", subject: "hg", description: "Expliquer avec des preuves, sans simplifier les causes" },
  "emc-regle": { label: "Mobiliser une règle", subject: "emc", description: "Relier une situation à un principe ou un texte" },
  "emc-argumenter": { label: "Argumenter", subject: "emc", description: "Distinguer fait, règle, valeur et opinion" },
  "svt-savoirs": { label: "Mobiliser ses connaissances", subject: "svt", description: "Utiliser le vocabulaire du vivant" },
  "svt-demarche": { label: "Démarche scientifique", subject: "svt", description: "Raisonner à partir d'observations" },
  "svt-donnees": { label: "Exploiter des données", subject: "svt", description: "Lire un caryotype, un tableau, un graphique" },
  "te-analyser": { label: "Analyser un système", subject: "techno", description: "Chaînes d'information et d'énergie" },
  "te-programmer": { label: "Programmer", subject: "techno", description: "Lire, écrire et corriger un programme" },
  "te-concevoir": { label: "Concevoir", subject: "techno", description: "Répondre à un besoin, tester une solution" },
  "en-comprendre": { label: "Comprendre", subject: "anglais", description: "Saisir le sens d'un message" },
  "en-grammaire": { label: "Choisir la bonne forme", subject: "anglais", description: "Choisir un temps selon le sens" },
  "en-ecrire": { label: "Communiquer", subject: "anglais", description: "Réagir, interagir, écrire" },
  "es-comprendre": { label: "Comprendre", subject: "espagnol", description: "Saisir le sens d'un message" },
  "es-grammaire": { label: "Choisir la bonne forme", subject: "espagnol", description: "Conjuguer, accorder" },
  "es-ecrire": { label: "Communiquer", subject: "espagnol", description: "Réagir, interagir, écrire" },
  "ar-analyser": { label: "Analyser une œuvre", subject: "arts", description: "Composition, matière, effets" },
  "ar-creer": { label: "Concevoir un projet", subject: "arts", description: "Justifier ses choix plastiques" },
  "mu-ecouter": { label: "Écouter et décrire", subject: "musique", description: "Rythme, tempo, timbre, forme" },
  "mu-creer": { label: "Créer et interpréter", subject: "musique", description: "Construire un motif, l'expliquer" },
  "ep-tactique": { label: "Choisir une tactique", subject: "eps", description: "Lire une situation de jeu, décider" },
  "ep-securite": { label: "Se préparer en sécurité", subject: "eps", description: "Échauffement, règles, récupération" },
  "se-donnees": { label: "Lire des données", subject: "ses", description: "Tableaux, indicateurs, évolutions" },
  "se-mecanismes": { label: "Expliquer un mécanisme", subject: "ses", description: "Corrélation, causalité, hypothèses" },
  "sn-reseaux": { label: "Comprendre un réseau", subject: "snt", description: "Client, serveur, requêtes" },
  "sn-donnees": { label: "Analyser des données", subject: "snt", description: "Métadonnées, formats, vie privée" },
  "ph-concepts": { label: "Distinguer les concepts", subject: "philo", description: "Définir, comparer, nuancer" },
  "ph-argumenter": { label: "Argumenter", subject: "philo", description: "Thèse, argument, objection" },
};

export const KINDS: Record<ActivityKind, { label: string }> = {
  mcq: { label: "Question de cours" },
  problem: { label: "Exercice type" },
  graph: { label: "Graphique" },
  order: { label: "Remets dans l'ordre" },
  "spot-error": { label: "Trouve l'erreur" },
  classify: { label: "Trier" },
  writing: { label: "Rédiger" },
  dialogue: { label: "Dialogue" },
  worked: { label: "Exemple à compléter" },
};

export function levelLabel(level: number): string {
  if (level < 35) return "Découverte";
  if (level < 65) return "En progrès";
  return "Solide";
}

export function competencesOf(subject: SubjectId): CompetenceId[] {
  const own = (Object.keys(COMPETENCES) as CompetenceId[]).filter((c) => COMPETENCES[c].subject === subject);
  if (own.length) return own;
  // Les spécialités et enseignements voisins reprennent les compétences de la matière d'origine.
  const parent: Partial<Record<SubjectId, SubjectId>> = {
    "maths-tc": "maths", "maths-comp": "maths", "maths-exp": "maths", sciences: "svt", "ens-sci": "svt",
    hggsp: "hg", hlp: "philo", llcer: "anglais", nsi: "snt", si: "techno", dgemc: "emc", allemand: "espagnol",
    latin: "francais", grec: "francais", llca: "francais", eppcs: "eps", "arts-spe": "arts",
  };
  const p = parent[subject];
  return p ? (Object.keys(COMPETENCES) as CompetenceId[]).filter((c) => COMPETENCES[c].subject === p) : [];
}

/** Nom court de la matière au fil d'une phrase : « en maths », mais « en SVT ». */
export function inSentence(subject: SubjectId): string {
  const short = SUBJECTS[subject].short;
  return /^[A-Z]{2,}/.test(short) ? short : short.charAt(0).toLowerCase() + short.slice(1);
}
