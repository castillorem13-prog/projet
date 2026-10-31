import type { Cycle, Level, SubjectId, SubjectRole } from "./types";

export interface LevelSubject {
  subject: SubjectId;
  role: SubjectRole;
  /** Horaire hebdomadaire indicatif, seulement quand il a été recoupé. */
  hours?: string;
  note?: string;
}

export interface LevelInfo {
  id: Level;
  label: string;
  cycle: Cycle;
  school: "Collège" | "Lycée";
  subjects: LevelSubject[];
  /** Nombre de spécialités à choisir (lycée). */
  specialtyCount?: number;
  /** Enseignements non couverts par le prototype, affichés pour être honnête sur le périmètre. */
  notCovered?: string[];
  /** Examens de l'année, avec la date publiée (ou à confirmer) et la source du calendrier. */
  exams?: { label: string; when: string; detail: string; verified: boolean; source?: string }[];
}

const C = (subject: SubjectId, hours?: string, note?: string): LevelSubject => ({ subject, role: "commun", hours, note });
const S = (subject: SubjectId): LevelSubject => ({ subject, role: "specialite", hours: undefined });
const O = (subject: SubjectId, note?: string): LevelSubject => ({ subject, role: "option", note });

/** Langues : l'anglais en LVA, l'espagnol ou l'allemand en LVB (à partir de la 5e). */
export const LVB_CHOICES: SubjectId[] = ["espagnol", "allemand"];

export const LEVELS: LevelInfo[] = [
  {
    id: "6e",
    label: "6e",
    cycle: "Cycle 3",
    school: "Collège",
    subjects: [C("francais", "4 h 30"), C("maths", "4 h 30"), C("hg", "3 h, EMC compris"), C("emc"), C("anglais", "4 h"), C("sciences", "3 h"), C("arts", "1 h"), C("musique", "1 h"), C("eps", "4 h")],
    notCovered: ["Classes bilangues", "Chant choral"],
  },
  {
    id: "5e",
    label: "5e",
    cycle: "Cycle 4",
    school: "Collège",
    subjects: [C("francais"), C("maths"), C("hg"), C("emc"), C("anglais"), C("espagnol", undefined, "LVB"), C("physique"), C("svt"), C("techno"), C("arts"), C("musique"), C("eps"), O("latin", "Option LCA"), O("grec", "Option LCA")],
    notCovered: ["Langues et cultures européennes", "Chant choral"],
  },
  {
    id: "4e",
    label: "4e",
    cycle: "Cycle 4",
    school: "Collège",
    subjects: [C("francais"), C("maths"), C("hg"), C("emc"), C("anglais"), C("espagnol", undefined, "LVB"), C("physique"), C("svt"), C("techno"), C("arts"), C("musique"), C("eps"), O("latin", "Option LCA"), O("grec", "Option LCA")],
    notCovered: ["Langues et cultures européennes", "Chant choral"],
  },
  {
    id: "3e",
    label: "3e",
    cycle: "Cycle 4",
    school: "Collège",
    subjects: [
      C("francais", "4 h"), C("maths", "3 h 30"), C("hg", "3 h 30, EMC compris"), C("emc"), C("anglais", "3 h"), C("espagnol", "2 h 30", "LVB"),
      C("physique", "1 h 30"), C("svt", "1 h 30"), C("techno", "1 h 30"), C("arts", "1 h"), C("musique", "1 h"), C("eps", "3 h"),
      O("latin", "Option LCA"), O("grec", "Option LCA"),
    ],
    notCovered: ["Langues et cultures européennes", "Chant choral"],
    exams: [
      { label: "Brevet blanc", when: "2027-01-21", detail: "Date fixée par le collège (fictive, ENT simulé)", verified: false },
      { label: "Brevet", when: "2027-06-24", detail: "Français jeu. 24 juin, histoire-géo-EMC ven. 25, sciences et maths lun. 28 juin, toutes le matin. Épreuves finales : 60 % de la note.", verified: true, source: "Calendrier 2027 du ministère, relayé par L'Étudiant" },
    ],
  },
  {
    id: "2nde",
    label: "2nde",
    cycle: "Lycée général et technologique",
    school: "Lycée",
    subjects: [
      C("francais", "4 h"), C("maths", "4 h"), C("hg", "3 h"), C("emc", "18 h par an"), C("anglais"), C("espagnol", undefined, "LVB"),
      C("physique", "3 h"), C("svt", "1 h 30"), C("ses", "1 h 30"), C("snt", "1 h 30"), C("eps", "2 h"),
      O("arts", "Option générale"), O("latin", "Option LCA"), O("grec", "Option LCA"),
    ],
    notCovered: ["Options technologiques (management et gestion, santé et social, biotechnologies, sciences et laboratoire, sciences de l'ingénieur, création et innovation technologiques)", "LVC", "Option EPS"],
  },
  {
    id: "1re",
    label: "1re",
    cycle: "Lycée général et technologique",
    school: "Lycée",
    specialtyCount: 3,
    subjects: [
      C("francais", "4 h"), C("hg", "3 h"), C("emc", "18 h par an"), C("anglais"), C("espagnol", undefined, "LVB"), C("ens-sci"), C("eps", "2 h"),
      C("maths-tc", undefined, "Pour les élèves sans spécialité mathématiques"),
      S("maths"), S("physique"), S("svt"), S("ses"), S("hggsp"), S("hlp"), S("llcer"), S("llca"), S("nsi"), S("si"), S("eppcs"), S("arts-spe"),
      O("latin", "Option LCA"), O("grec", "Option LCA"),
    ],
    notCovered: ["Spécialités arts autres que les arts plastiques (cinéma-audiovisuel, danse, histoire des arts, musique, théâtre, arts du cirque)", "Biologie-écologie (lycées agricoles)", "LVC", "Voie technologique et voie professionnelle"],
    exams: [
      { label: "Français écrit (anticipé)", when: "2027-06-15", detail: "Mardi 15 juin 2027 au matin ; oral de français à partir du 21 juin.", verified: true, source: "Calendrier 2027 du ministère, relayé par L'Étudiant" },
      { label: "Mathématiques (anticipée)", when: "2027-06-21", detail: "Lundi 21 juin 2027 au matin.", verified: true, source: "Calendrier 2027 du ministère, relayé par L'Étudiant" },
    ],
  },
  {
    id: "Tle",
    label: "Terminale",
    cycle: "Lycée général et technologique",
    school: "Lycée",
    specialtyCount: 2,
    subjects: [
      C("philo", "4 h"), C("hg", "3 h"), C("emc", "18 h par an"), C("anglais"), C("espagnol", undefined, "LVB"), C("ens-sci"), C("eps", "2 h"),
      S("maths"), S("physique"), S("svt"), S("ses"), S("hggsp"), S("hlp"), S("llcer"), S("llca"), S("nsi"), S("si"), S("eppcs"), S("arts-spe"),
      O("maths-comp", "Pour ceux qui arrêtent la spécialité mathématiques"), O("maths-exp", "Avec la spécialité mathématiques"), O("dgemc"),
      O("latin", "Option LCA"), O("grec", "Option LCA"),
    ],
    notCovered: ["Spécialités arts autres que les arts plastiques", "Biologie-écologie (lycées agricoles)", "LVC", "Voie technologique et voie professionnelle"],
    exams: [
      { label: "Philosophie", when: "2027-06-14", detail: "Lundi 14 juin 2027 au matin.", verified: true, source: "Calendrier 2027 du ministère, relayé par L'Étudiant" },
      { label: "Spécialités", when: "2027-06-16", detail: "Du mercredi 16 au vendredi 18 juin 2027.", verified: true, source: "Calendrier 2027 du ministère, relayé par L'Étudiant" },
      { label: "Grand oral", when: "2027-06-21", detail: "Du 21 juin au 2 juillet 2027. Résultats le 6 juillet.", verified: true, source: "Calendrier 2027 du ministère, relayé par L'Étudiant" },
    ],
  },
];

export const LEVEL_ORDER: Level[] = ["6e", "5e", "4e", "3e", "2nde", "1re", "Tle"];

export function getLevel(id: Level): LevelInfo {
  return LEVELS.find((l) => l.id === id) as LevelInfo;
}

export const levelRank = (l: Level) => LEVEL_ORDER.indexOf(l);
export const prevLevel = (l: Level): Level | null => LEVEL_ORDER[levelRank(l) - 1] ?? null;
export const nextLevel = (l: Level): Level | null => LEVEL_ORDER[levelRank(l) + 1] ?? null;

export interface Track {
  /** Deuxième langue (LVB). */
  lvb: SubjectId;
  /** Spécialités choisies (1re : 3, terminale : 2). */
  specialties: SubjectId[];
  options: SubjectId[];
}

export const DEFAULT_TRACK: Track = { lvb: "espagnol", specialties: [], options: [] };

/** Matières suivies par l'élève à un niveau, selon ses choix (langue, spécialités, options). */
export function studentSubjects(level: Level, track: Track): LevelSubject[] {
  const info = getLevel(level);
  const lvb = LVB_CHOICES.includes(track.lvb) ? track.lvb : "espagnol";
  const hasMathsSpe = track.specialties.includes("maths");
  return info.subjects
    .filter((s) => {
      if (LVB_CHOICES.includes(s.subject)) return true;
      if (s.role === "specialite") return track.specialties.includes(s.subject);
      if (s.role === "option") return track.options.includes(s.subject);
      if (s.subject === "maths-tc") return !hasMathsSpe;
      return true;
    })
    .map((s) => (LVB_CHOICES.includes(s.subject) ? { ...s, subject: lvb } : s));
}
