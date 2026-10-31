import { isoDay, parseDay } from "@/lib/content/calendar";
import type { Stimulus } from "@/lib/content/types";

/**
 * Bac de français (épreuves anticipées, classe de première), session 2027.
 *
 * Programme d'œuvres : note de service du 4 juillet 2025, BO n° 30 du 24 juillet 2025 (programme renouvelé par quart
 * chaque année ; en 2026-2027, l'objet « roman et récit » change). Le texte du BO ne s'ouvre pas depuis l'environnement
 * du prototype : la liste a été recoupée dans trois sources concordantes (voir SOURCE_OEUVRES).
 *
 * Format des épreuves (voie générale), recoupé avec la note de l'inspection de lettres de Versailles et la fiche
 * 2026-2027 d'un lycée de l'académie :
 *  - écrit : 4 heures, coefficient 5, au choix un commentaire (texte inconnu) ou une dissertation (sur une œuvre du programme) ;
 *  - oral : 30 minutes de préparation, 20 minutes d'épreuve, coefficient 5 :
 *    12 minutes sur 12 points (lecture 2, explication linéaire 8, question de grammaire 2),
 *    8 minutes sur 8 points (présentation de l'œuvre choisie, puis entretien).
 */

export type Voie = "generale" | "techno";
export type ObjetId = "poesie" | "idees" | "roman" | "theatre";

export const OBJETS: Record<ObjetId, { label: string; siecles: string }> = {
  poesie: { label: "La poésie", siecles: "du XIXe au XXIe siècle" },
  idees: { label: "La littérature d'idées", siecles: "du XVIe au XVIIIe siècle" },
  roman: { label: "Le roman et le récit", siecles: "du Moyen Âge au XXIe siècle" },
  theatre: { label: "Le théâtre", siecles: "du XVIIe au XXIe siècle" },
};
export const OBJET_ORDER: ObjetId[] = ["poesie", "idees", "roman", "theatre"];

export interface Oeuvre {
  id: string;
  objet: ObjetId;
  auteur: string;
  titre: string;
  parcours: string;
  /** Partie au programme, quand l'œuvre n'est pas étudiée en entier. */
  partie?: string;
  voies: Voie[];
  /** Différences en voie technologique (parcours ou partie). */
  techno?: { parcours?: string; partie?: string };
}

export const SOURCE_OEUVRES = {
  reference: "Note de service du 4 juillet 2025, BO n° 30 du 24 juillet 2025",
  url: "https://www.education.gouv.fr/bo/2025/Hebdo30/MENE2518792N",
  verification: "cross_checked" as const,
  checkedWith: [
    "https://www.digischool.fr/articles/lycee/oeuvres-programme-bac-francais-2027/",
    "https://www.nomadeducation.fr/blog/articles/2026-09-07/bac-francais-2027-oeuvres-au-programme",
    "https://lyc-dumont-maurepas.ac-versailles.fr/IMG/pdf/bac_epreuve_anticipee_francais_2026-2027.pdf",
  ],
};

export const OEUVRES: Oeuvre[] = [
  { id: "rimbaud", objet: "poesie", auteur: "Arthur Rimbaud", titre: "Cahier de Douai", partie: "22 poèmes, de « Première soirée » à « Ma Bohème (Fantaisie) »", parcours: "Émancipations créatrices", voies: ["generale", "techno"] },
  { id: "ponge", objet: "poesie", auteur: "Francis Ponge", titre: "La rage de l'expression", parcours: "Dans l'atelier du poète", voies: ["generale", "techno"], techno: { partie: "De « Berges de la Loire » à « Le mimosa » inclus" } },
  { id: "dorion", objet: "poesie", auteur: "Hélène Dorion", titre: "Mes forêts", parcours: "La poésie, la nature, l'intime", voies: ["generale", "techno"] },
  { id: "laboetie", objet: "idees", auteur: "Étienne de La Boétie", titre: "Discours de la servitude volontaire", parcours: "« Défendre » et « entretenir » la liberté", voies: ["generale", "techno"] },
  { id: "fontenelle", objet: "idees", auteur: "Fontenelle", titre: "Entretiens sur la pluralité des mondes", parcours: "Le goût de la science", voies: ["generale", "techno"], techno: { partie: "Les trois premiers soirs" } },
  { id: "graffigny", objet: "idees", auteur: "Françoise de Graffigny", titre: "Lettres d'une Péruvienne", partie: "Avec l'introduction historique et les lettres XXVIII, XXIX, XXX et XXXIV de l'édition de 1752", parcours: "« Un nouvel univers s'est offert à mes yeux »", voies: ["generale", "techno"] },
  { id: "chretien", objet: "roman", auteur: "Chrétien de Troyes", titre: "Le Chevalier de la charrette", partie: "Édition bilingue", parcours: "Le roman et l'invention de l'amour", voies: ["generale", "techno"], techno: { parcours: "Héroïsme et amour" } },
  { id: "zola-pot", objet: "roman", auteur: "Émile Zola", titre: "Pot-Bouille", parcours: "Dévoiler les rouages de la société", voies: ["generale"] },
  { id: "zola-therese", objet: "roman", auteur: "Émile Zola", titre: "Thérèse Raquin", parcours: "Anatomie des passions", voies: ["techno"] },
  { id: "schwarzbart", objet: "roman", auteur: "Simone Schwarz-Bart", titre: "Pluie et vent sur Télumée Miracle", parcours: "Tisser les mémoires, habiter le monde", voies: ["generale", "techno"] },
  { id: "corneille", objet: "theatre", auteur: "Pierre Corneille", titre: "Le Menteur", parcours: "Mensonge et comédie", voies: ["generale", "techno"] },
  { id: "musset", objet: "theatre", auteur: "Alfred de Musset", titre: "On ne badine pas avec l'amour", parcours: "Les jeux du cœur et de la parole", voies: ["generale", "techno"] },
  { id: "sarraute", objet: "theatre", auteur: "Nathalie Sarraute", titre: "Pour un oui ou pour un non", parcours: "Théâtre et dispute", voies: ["generale", "techno"] },
];

export const getOeuvre = (id: string | null | undefined) => OEUVRES.find((o) => o.id === id);
export const oeuvresOf = (objet: ObjetId, voie: Voie) => OEUVRES.filter((o) => o.objet === objet && o.voies.includes(voie));
export const parcoursOf = (o: Oeuvre, voie: Voie) => (voie === "techno" ? o.techno?.parcours ?? o.parcours : o.parcours);
export const partieOf = (o: Oeuvre, voie: Voie) => (voie === "techno" ? o.techno?.partie ?? o.partie : o.partie);

/* ——— Format des épreuves ——— */

export const EAF = {
  ecrit: { minutes: 240, coefficient: 5, generale: ["commentaire", "dissertation"] as const, techno: ["commentaire", "contraction et essai"] as const },
  oral: { preparation: 30, minutes: 20, coefficient: 5 },
  /** Nombre de textes du descriptif (fiche d'un lycée, 2026-2027 : 6 par objet d'étude en voie générale, 4 en voie technologique). */
  textes: { generale: 24, techno: 16 },
};

/** Barème de l'oral : 12 points pour l'exposé, 8 pour l'œuvre choisie et l'entretien. */
export const ORAL_GRID: { id: string; label: string; points: number; minutes?: number; checks: string[] }[] = [
  { id: "lecture", label: "Lecture à voix haute", points: 2, checks: ["Lecture fluide, sans hésitation sur les mots", "Rythme et ponctuation respectés, ton adapté au texte"] },
  { id: "explication", label: "Explication linéaire", points: 8, checks: ["Situation du passage et projet de lecture (problématique) annoncés", "Mouvements du texte repérés", "Procédés cités avec précision et interprétés", "Conclusion qui répond à la problématique"] },
  { id: "grammaire", label: "Question de grammaire", points: 2, checks: ["Le phénomène est identifié avec le bon terme", "L'analyse est juste, appuyée sur une manipulation si besoin"] },
  { id: "entretien", label: "Œuvre choisie et entretien", points: 8, checks: ["Présentation claire de l'œuvre et des raisons du choix", "Réponses précises, appuyées sur des passages", "Capacité à nuancer et à défendre un point de vue", "Lien avec le parcours associé"] },
];

/** Questions d'entretien d'entraînement (écrites pour LearnWard, dans l'esprit de l'épreuve). */
export const ENTRETIEN_QUESTIONS = [
  "Pourquoi avez-vous choisi cette œuvre plutôt qu'une autre ?",
  "Quel passage vous a le plus marqué ? Racontez-le et dites pourquoi.",
  "Comment cette œuvre éclaire-t-elle le parcours étudié en classe ?",
  "Quel personnage, quelle image ou quelle idée retenez-vous, et pour quelle raison ?",
  "Cette œuvre vous semble-t-elle encore parler aux lecteurs d'aujourd'hui ?",
  "Y a-t-il un moment de l'œuvre qui vous a résisté ou déplu ? Qu'en avez-vous fait ?",
  "Si vous deviez convaincre un ami de la lire, que lui diriez-vous ?",
];

/* ——— Grammaire de l'oral ——— */

export type GrammarId = "negation" | "interrogation" | "subordonnees";

export const GRAMMAR: Record<GrammarId, { label: string; intro: string }> = {
  negation: { label: "L'expression de la négation", intro: "Négation totale ou partielle, adverbes, pronoms et déterminants négatifs, tournure restrictive." },
  interrogation: { label: "L'interrogation", intro: "Totale ou partielle, directe ou indirecte, et la façon dont elle est marquée." },
  subordonnees: { label: "Les propositions subordonnées", intro: "Relatives, conjonctives complétives, circonstancielles, interrogatives indirectes." },
};

/** Phrases d'entraînement : celles de Hugo viennent du texte du commentaire blanc (domaine public), les autres sont écrites pour l'exercice. */
export const GRAMMAR_ITEMS: { id: string; point: GrammarId; sentence: string; categories: string[]; answer: number; explanation: string }[] = [
  { id: "n1", point: "negation", sentence: "Je ne connais pas ce poème.", categories: ["Négation totale", "Négation partielle", "Tournure restrictive"], answer: 0, explanation: "« ne… pas » nie toute la phrase : négation totale." },
  { id: "n2", point: "negation", sentence: "Je n'ai jamais lu ce roman.", categories: ["Négation totale", "Négation partielle", "Tournure restrictive"], answer: 1, explanation: "« ne… jamais » nie seulement le temps : négation partielle, avec un adverbe." },
  { id: "n3", point: "negation", sentence: "Il ne voit personne sur le chemin.", categories: ["Négation totale", "Négation partielle", "Tournure restrictive"], answer: 1, explanation: "« ne… personne » porte sur l'objet : négation partielle, avec un pronom négatif." },
  { id: "n4", point: "negation", sentence: "Elle ne lit que des poèmes.", categories: ["Négation totale", "Négation partielle", "Tournure restrictive"], answer: 2, explanation: "« ne… que » signifie « seulement » : ce n'est pas une négation, mais une restriction." },
  { id: "n5", point: "negation", sentence: "Sans rien voir au dehors, sans entendre aucun bruit (Hugo)", categories: ["Négation totale", "Négation partielle", "Tournure restrictive"], answer: 1, explanation: "Pas de « ne » : la préposition « sans » et les mots négatifs « rien », « aucun » portent la négation, sur l'objet." },
  { id: "i1", point: "interrogation", sentence: "Viendras-tu demain ?", categories: ["Totale directe", "Partielle directe", "Totale indirecte", "Partielle indirecte"], answer: 0, explanation: "On répond par oui ou non ; point d'interrogation et inversion du sujet : interrogation totale directe." },
  { id: "i2", point: "interrogation", sentence: "Où vas-tu ce soir ?", categories: ["Totale directe", "Partielle directe", "Totale indirecte", "Partielle indirecte"], answer: 1, explanation: "Elle porte sur le lieu (« où ») : interrogation partielle, directe." },
  { id: "i3", point: "interrogation", sentence: "Je me demande s'il viendra.", categories: ["Totale directe", "Partielle directe", "Totale indirecte", "Partielle indirecte"], answer: 2, explanation: "Subordonnée introduite par « si », sans point d'interrogation : interrogation totale indirecte." },
  { id: "i4", point: "interrogation", sentence: "Dis-moi pourquoi tu pars.", categories: ["Totale directe", "Partielle directe", "Totale indirecte", "Partielle indirecte"], answer: 3, explanation: "Elle porte sur la cause (« pourquoi ») et dépend de « dis-moi » : partielle indirecte." },
  { id: "s1", point: "subordonnees", sentence: "Vois-tu, je sais que tu m'attends. (Hugo)", categories: ["Relative", "Conjonctive complétive", "Circonstancielle", "Interrogative indirecte"], answer: 1, explanation: "« que tu m'attends » est COD de « sais » : subordonnée conjonctive complétive." },
  { id: "s2", point: "subordonnees", sentence: "Demain, dès l'aube, à l'heure où blanchit la campagne (Hugo)", categories: ["Relative", "Conjonctive complétive", "Circonstancielle", "Interrogative indirecte"], answer: 0, explanation: "« où blanchit la campagne » complète le nom « heure » (antécédent) : subordonnée relative." },
  { id: "s3", point: "subordonnees", sentence: "Et quand j'arriverai, je mettrai sur ta tombe… (Hugo)", categories: ["Relative", "Conjonctive complétive", "Circonstancielle", "Interrogative indirecte"], answer: 2, explanation: "« quand j'arriverai » situe l'action dans le temps : subordonnée circonstancielle de temps." },
  { id: "s4", point: "subordonnees", sentence: "Je ne sais pas qui a écrit ce texte.", categories: ["Relative", "Conjonctive complétive", "Circonstancielle", "Interrogative indirecte"], answer: 3, explanation: "« qui a écrit ce texte » pose une question dépendant de « je ne sais pas » : interrogative indirecte (partielle)." },
];

/* ——— Écrit : sujets d'entraînement ——— */

export const HUGO_DEMAIN: Stimulus = {
  kind: "text",
  title: "Victor Hugo, « Demain, dès l'aube… », Les Contemplations (1856)",
  lines: [
    "Demain, dès l'aube, à l'heure où blanchit la campagne,",
    "Je partirai. Vois-tu, je sais que tu m'attends.",
    "J'irai par la forêt, j'irai par la montagne.",
    "Je ne puis demeurer loin de toi plus longtemps.",
    "",
    "Je marcherai les yeux fixés sur mes pensées,",
    "Sans rien voir au dehors, sans entendre aucun bruit,",
    "Seul, inconnu, le dos courbé, les mains croisées,",
    "Triste, et le jour pour moi sera comme la nuit.",
    "",
    "Je ne regarderai ni l'or du soir qui tombe,",
    "Ni les voiles au loin descendant vers Harfleur,",
    "Et quand j'arriverai, je mettrai sur ta tombe",
    "Un bouquet de houx vert et de bruyère en fleur.",
  ],
  provenance: {
    authentic: true,
    type: "Poème",
    creator: "Victor Hugo",
    date: "1856 (poème daté du 3 septembre 1847)",
    context: "Livre IV, « Pauca meae », consacré à sa fille Léopoldine, morte noyée en 1843.",
    source: "Les Contemplations, texte du domaine public (Wikisource)",
    rights: "Domaine public",
    limits: "Ponctuation à vérifier sur une édition de référence avant publication.",
    verification: "needs_review",
  },
};

export const COMMENTAIRE = {
  id: "commentaire-hugo",
  objet: "poesie" as ObjetId,
  consigne: "Vous ferez le commentaire de ce poème.",
  text: HUGO_DEMAIN,
  /** Pistes de corrigé (proposées par LearnWard, à relire par un enseignant). */
  pistes: {
    problematique: "Comment Hugo transforme-t-il ce qui ressemble à un rendez-vous amoureux en un hommage funèbre ?",
    axes: [
      "Un départ tendu vers l'autre : futur simple, tutoiement, gradation des lieux (« par la forêt, … par la montagne »), urgence du vers 4.",
      "Une marche coupée du monde : négations (« sans rien voir », « ni… ni »), antithèse « le jour… comme la nuit », portrait du marcheur en deuil.",
      "La révélation finale et le geste d'hommage : « ta tombe » au dernier quatrain, bouquet de houx (permanence) et de bruyère (souvenir).",
    ],
  },
};

/** Sujets de dissertation d'entraînement, un par œuvre (écrits par LearnWard dans le format de l'épreuve). */
export const DISSERTATIONS: Record<string, string> = {
  rimbaud: "Dans quelle mesure le Cahier de Douai fait-il de la poésie un moyen de s'émanciper ?",
  ponge: "La rage de l'expression montre-t-elle un poème achevé ou un poème en train de se faire ?",
  dorion: "Dans Mes forêts, la nature est-elle seulement un paysage, ou aussi un miroir de l'intime ?",
  laboetie: "Selon vous, le Discours de la servitude volontaire est-il davantage un réquisitoire contre les tyrans ou un appel à la liberté ?",
  fontenelle: "Les Entretiens sur la pluralité des mondes cherchent-ils d'abord à instruire ou à plaire ?",
  graffigny: "Le regard étranger de Zilia permet-il seulement de critiquer la société française ?",
  chretien: "Dans Le Chevalier de la charrette, l'amour rend-il le héros plus grand ou plus vulnérable ?",
  "zola-pot": "Pot-Bouille dévoile-t-il les rouages de la société par le rire ou par la dénonciation ?",
  "zola-therese": "Dans Thérèse Raquin, les personnages sont-ils maîtres de leurs passions ?",
  schwarzbart: "Pluie et vent sur Télumée Miracle est-il le récit d'une vie ou la mémoire d'un peuple ?",
  corneille: "Dans Le Menteur, le mensonge est-il seulement une source de comédie ?",
  musset: "On ne badine pas avec l'amour est-elle une comédie ou une tragédie ?",
  sarraute: "Pour un oui ou pour un non montre-t-il que les mots suffisent à détruire une amitié ?",
};

/** Grilles d'entraînement de l'écrit (critères inspirés des attendus de l'épreuve ; pondération de LearnWard). */
export const ECRIT_GRID: Record<"commentaire" | "dissertation", { label: string; points: number }[]> = {
  commentaire: [
    { label: "Introduction : situation du texte, problématique, annonce du plan", points: 3 },
    { label: "Plan en deux ou trois axes qui répondent à la problématique", points: 4 },
    { label: "Analyses précises : citations courtes, procédés nommés et interprétés", points: 7 },
    { label: "Conclusion : bilan et ouverture", points: 2 },
    { label: "Langue : syntaxe, orthographe, vocabulaire de l'analyse", points: 4 },
  ],
  dissertation: [
    { label: "Analyse du sujet et problématique qui en montre l'enjeu", points: 4 },
    { label: "Plan progressif (deux ou trois parties) qui répond à la question", points: 4 },
    { label: "Arguments illustrés par des exemples précis de l'œuvre et du parcours", points: 6 },
    { label: "Conclusion : réponse nette et ouverture", points: 2 },
    { label: "Langue : syntaxe, orthographe, vocabulaire de l'analyse", points: 4 },
  ],
};

/* ——— Descriptif de l'oral et révision des textes ——— */

export interface OralCard {
  /** Prochaine révision (AAAA-MM-JJ). */
  due: string;
  /** Intervalle en jours. */
  interval: number;
  reps: number;
}

export interface OralText {
  id: string;
  objet: ObjetId;
  /** Texte de l'œuvre intégrale ou du parcours associé. */
  kind: "oeuvre" | "parcours";
  title: string;
  /** Problématique, mouvements, procédés : ce que l'élève veut retenir. */
  notes: string;
  card: OralCard;
}

export interface BacFrState {
  voie: Voie;
  /** Œuvre étudiée en classe pour chaque objet d'étude. */
  oeuvres: Partial<Record<ObjetId, string>>;
  /** Œuvre choisie pour l'entretien. */
  choisie: string | null;
  /** Exercice préféré à l'écrit. */
  ecrit: "commentaire" | "dissertation";
  textes: OralText[];
  /** Épreuves blanches faites (note indicative, auto-évaluée avec la grille). */
  blancs?: BlancLog[];
}

export interface BlancLog {
  kind: "oral" | "ecrit" | "philo" | "grand-oral";
  date: string;
  label: string;
  score: number;
}

export const EMPTY_BAC: BacFrState = { voie: "generale", oeuvres: {}, choisie: null, ecrit: "commentaire", textes: [] };

const addDays = (iso: string, n: number) => {
  const d = parseDay(iso);
  d.setDate(d.getDate() + n);
  return isoDay(d);
};

/** Répétition espacée des textes de l'oral (inspirée des cartes de révision type Anki, en plus simple). */
export function reviewCard(card: OralCard, rating: "revoir" | "bien" | "facile", today: string): OralCard {
  if (rating === "revoir") return { due: addDays(today, 1), interval: 1, reps: card.reps + 1 };
  const base = Math.max(1, card.interval);
  const interval = rating === "bien" ? Math.max(2, Math.round(base * 2)) : Math.max(4, Math.round(base * 3));
  return { due: addDays(today, interval), interval, reps: card.reps + 1 };
}

export const isCardDue = (c: OralCard, today: string) => c.due <= today;

const card = (due: string): OralCard => ({ due, interval: 0, reps: 0 });

/** Descriptif de démonstration (titres seulement, pour une élève de première). */
export const DEMO_BAC: BacFrState = {
  voie: "generale",
  oeuvres: { poesie: "rimbaud", idees: "laboetie", roman: "zola-pot", theatre: "musset" },
  choisie: "musset",
  ecrit: "commentaire",
  textes: [
    { id: "t1", objet: "poesie", kind: "oeuvre", title: "Rimbaud, « Ma Bohème »", notes: "Problématique : comment le poète fait-il de la fugue une liberté créatrice ?\nMouvements : vers 1-4 le départ, 5-8 l'errance, 9-14 la création.\nProcédés : autoportrait ironique, rimes « routes / gouttes », chute « un pied près de mon cœur ».", card: card("2026-10-29") },
    { id: "t2", objet: "poesie", kind: "oeuvre", title: "Rimbaud, « Le Dormeur du val »", notes: "Problématique : comment le sonnet dénonce-t-il la guerre par une révélation finale ?\nProcédés : nature vivante, couleurs, chute « deux trous rouges au côté droit ».", card: card("2026-10-30") },
    { id: "t3", objet: "poesie", kind: "oeuvre", title: "Rimbaud, « Roman »", notes: "Ironie de l'adolescent qui joue à l'amoureux ; structure circulaire.", card: card("2026-11-02") },
    { id: "t4", objet: "idees", kind: "oeuvre", title: "La Boétie, ouverture du Discours", notes: "Le paradoxe de départ : comment un seul peut-il dominer tous ?", card: card("2026-10-29") },
    { id: "t5", objet: "roman", kind: "oeuvre", title: "Zola, Pot-Bouille, chapitre I (l'arrivée d'Octave)", notes: "Description de l'immeuble bourgeois : façade luxueuse, dessous moins nets.", card: card("2026-11-03") },
    { id: "t6", objet: "theatre", kind: "oeuvre", title: "Musset, On ne badine pas avec l'amour, acte II, scène 5", notes: "La tirade de Perdican : définition de l'amour malgré la souffrance.", card: card("2026-10-28") },
  ],
};

/* ——— Philosophie et grand oral (terminale) ——— */

export const DESCARTES_LONG: Stimulus = {
  kind: "text",
  title: "Descartes, Discours de la méthode, première partie (1637)",
  lines: [
    "Le bon sens est la chose du monde la mieux partagée : car chacun pense en être si bien pourvu, que ceux même qui sont les plus difficiles à contenter en toute autre chose n'ont point coutume d'en désirer plus qu'ils en ont. En quoi il n'est pas vraisemblable que tous se trompent ; mais plutôt cela témoigne que la puissance de bien juger et distinguer le vrai d'avec le faux, qui est proprement ce qu'on nomme le bon sens ou la raison, est naturellement égale en tous les hommes ; et ainsi que la diversité de nos opinions ne vient pas de ce que les uns sont plus raisonnables que les autres, mais seulement de ce que nous conduisons nos pensées par diverses voies, et ne considérons pas les mêmes choses. Car ce n'est pas assez d'avoir l'esprit bon, mais le principal est de l'appliquer bien.",
  ],
  provenance: {
    authentic: true,
    type: "Texte philosophique",
    creator: "René Descartes",
    date: "1637",
    context: "Début de l'ouvrage, qui expose une méthode pour bien conduire sa raison.",
    source: "Texte du domaine public (Wikisource)",
    rights: "Domaine public",
    limits: "Orthographe modernisée ; à vérifier sur une édition de référence.",
    verification: "needs_review",
  },
};

export const PHILO_SUJETS = [
  "La raison peut-elle tout expliquer ?",
  "Est-on libre quand on obéit à la loi ?",
];

export const PHILO_GRID: { label: string; points: number }[] = [
  { label: "Problème formulé : le sujet est analysé et sa difficulté apparaît", points: 5 },
  { label: "Argumentation progressive, avec des distinctions de notions", points: 6 },
  { label: "Exemples et références précis, réellement analysés", points: 5 },
  { label: "Conclusion qui répond, langue claire", points: 4 },
];

/** Grand oral : 20 minutes de préparation, puis 5 minutes d'exposé, 10 minutes d'échange, 5 minutes sur le projet d'orientation. */
export const GRAND_ORAL = {
  preparation: 20,
  steps: [
    { id: "expose", label: "Présenter ta question", minutes: 5 },
    { id: "echange", label: "Échanger avec le jury", minutes: 10 },
    { id: "orientation", label: "Ton projet d'orientation", minutes: 5 },
  ],
  grid: [
    { label: "Qualité orale : voix, débit, présence, sans lire ses notes", points: 4 },
    { label: "Prise de parole en continu : exposé construit et clair", points: 4 },
    { label: "Connaissances précises et maîtrisées", points: 4 },
    { label: "Interaction : écoute et réponses aux questions", points: 4 },
    { label: "Argumentation et projet d'orientation", points: 4 },
  ],
  questions: [
    "Pouvez-vous préciser ce que vous entendez par ce terme ?",
    "Quel est l'exemple le plus convaincant de votre exposé, et pourquoi ?",
    "Quelle objection pourrait-on faire à votre réponse ?",
    "Comment avez-vous construit cette question avec vos spécialités ?",
    "En quoi ce sujet est-il lié à votre projet d'orientation ?",
  ],
};
