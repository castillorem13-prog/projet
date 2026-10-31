import type { CurriculumSource, Level, SubjectId } from "./types";

/**
 * Registre des programmes officiels, versionné par niveau et par date d'application.
 *
 * Méthode (vérification du 30 octobre 2026) :
 *  - les pages du Bulletin officiel sur education.gouv.fr et les pages d'Éduscol refusent l'accès depuis
 *    l'environnement du prototype ;
 *  - quand une académie, un syndicat ou une association disciplinaire héberge une copie intégrale du texte
 *    officiel (BO en PDF, annexe de programme), elle a été lue : statut « verified_official », la copie lue
 *    est citée dans `checkedWith` ;
 *  - sinon, la référence a été recoupée avec au moins deux sources académiques ou éditoriales : « cross_checked » ;
 *  - ce qui n'a pu être recoupé qu'une fois reste « needs_review ».
 *
 * Les dates d'application sont des données : quand l'année scolaire change, `sourceFor` choisit la bonne version.
 */

const CHECKED = "2026-10-30";
const R = (year: number) => `${year}-09-01`;

export const SOURCES: CurriculumSource[] = [
  /* ——— Cycle 3 (6e) ——— */
  {
    id: "c3-fr-maths-2025",
    title: "Programmes de français et de mathématiques du cycle 3",
    reference: "Arrêté du 10 avril 2025, BO n° 16 du 17 avril 2025",
    url: "https://education.gouv.fr/bo/2025/Hebdo16/MENE2504620A",
    subjects: ["francais", "maths"],
    applies: [{ level: "6e", from: R(2025) }],
    checkedAt: CHECKED,
    verification: "cross_checked",
    checkedWith: [
      "https://mathematiques.ac-besancon.fr/wp-content/uploads/sites/45/2025/08/Changements_dans_le_programme_6e_2025.pdf",
      "https://pedagogie.ac-orleans-tours.fr/documents/pdf/presentation_programmes_maths_c3.pdf",
    ],
    note: "En 6e dès la rentrée 2025 (académie de Besançon). Repères annuels pour le CM1, le CM2 et la 6e. Maths : nombres, calcul et résolution de problèmes ; grandeurs et mesures ; espace et géométrie ; données et probabilités ; proportionnalité ; initiation à la pensée informatique.",
  },
  {
    id: "c3-2020",
    title: "Programmes du cycle 3 (version consolidée)",
    reference: "BO n° 31 du 30 juillet 2020",
    url: "https://eduscol.education.gouv.fr/4356/j-enseigne-au-cycle-3",
    subjects: ["hg", "sciences", "arts", "musique", "eps"],
    applies: [{ level: "6e", from: R(2020), until: R(2027) }],
    checkedAt: CHECKED,
    verification: "cross_checked",
    checkedWith: ["https://preparemescours.fr/programmes", "https://www.eliott.app/blog/programme-6eme-annee-scolaire-2026-2027"],
    note: "Nouveaux programmes d'histoire-géographie et de sciences et technologie en préparation pour la 6e (projets du Conseil supérieur des programmes). À remplacer dès leur publication.",
  },
  {
    id: "lv-2025",
    title: "Programmes de langues vivantes étrangères et régionales (collège et lycée)",
    reference: "Arrêté du 5 mai 2025, BO n° 22 du 29 mai 2025",
    url: "https://education.gouv.fr/bo/2025/Hebdo22/MENE2504621A",
    subjects: ["anglais", "espagnol", "allemand"],
    applies: [
      { level: "6e", from: R(2025) },
      { level: "2nde", from: R(2025) },
      { level: "5e", from: R(2026) },
      { level: "1re", from: R(2026) },
      { level: "Tle", from: R(2026) },
      { level: "4e", from: R(2027) },
      { level: "3e", from: R(2028) },
    ],
    checkedAt: CHECKED,
    verification: "verified_official",
    checkedWith: [
      "https://www.pedagogie.ac-nantes.fr/medias/fichier/bo-n-22-du-29-mai-2025_1749496580708-pdf",
      "https://ent2d.ac-bordeaux.fr/disciplines/langues/wp-content/uploads/sites/61/2025/10/Nouveaux-programmes-clg-lycee.pdf",
    ],
    note: "Article 4 lu dans la copie du BO (académie de Nantes) : 6e et seconde en 2025-2026 ; 5e, première et terminale en 2026-2027 ; 4e en 2027-2028 ; 3e en 2028-2029. Cinq axes culturels par année, plus un axe propre à chaque langue.",
  },
  {
    id: "emc-2024",
    title: "Programmes d'enseignement moral et civique (de l'école au lycée)",
    reference: "Arrêté du 29 mai 2024, BO n° 24 du 13 juin 2024",
    url: "https://www.education.gouv.fr/bo/2024/Hebdo24/MENE2413934A",
    subjects: ["emc"],
    applies: [
      { level: "5e", from: R(2024) },
      { level: "2nde", from: R(2024) },
      { level: "4e", from: R(2025) },
      { level: "1re", from: R(2025) },
      { level: "6e", from: R(2026) },
      { level: "3e", from: R(2026) },
      { level: "Tle", from: R(2026) },
    ],
    checkedAt: CHECKED,
    verification: "cross_checked",
    checkedWith: [
      "https://ts2i.ac-besancon.fr/wp-content/uploads/sites/63/2024/10/Presentation-nouveaux-programmes-EMC-oct-2024-v-colle%cc%80ge.pdf",
      "https://ts2i.ac-besancon.fr/wp-content/uploads/sites/63/2024/10/Presentation-nouveaux-programmes-EMC-oct-2024-v-lyce%cc%81e.pdf",
      "https://www.digischool.fr/articles/college/nouveaux-programmes-college-2026/",
    ],
    note: "Calendrier et thèmes annuels recoupés (académie de Besançon). 18 h par an. Sous-parties détaillées à relire dans le texte officiel.",
  },

  /* ——— Cycle 4 (5e, 4e, 3e) ——— */
  {
    id: "c4-fr-maths-2026",
    title: "Programmes de français et de mathématiques du cycle 4 (nouvelle version)",
    reference: "Arrêté du 18 février 2026, BO n° 10 du 5 mars 2026",
    url: "https://www.education.gouv.fr/bo/2026/Hebdo10/MENE2602912A",
    subjects: ["francais", "maths"],
    applies: [
      { level: "5e", from: R(2026) },
      { level: "4e", from: R(2027) },
      { level: "3e", from: R(2028) },
    ],
    checkedAt: CHECKED,
    verification: "cross_checked",
    checkedWith: [
      "https://pedagogie.ac-toulouse.fr/mathematiques/les-nouveaux-programmes-de-cycle-4",
      "https://lettres.ac-normandie.fr/IMG/article_PDF/Programmes-cycle-4-mars-2026_a322.pdf",
      "https://www.digischool.fr/articles/college/nouveaux-programmes-college-2026/",
    ],
    note: "Organisés par repères annuels. Français 5e : « Éprouver, expérimenter : la découverte de soi, d'autrui et du monde ». Le détail des repères de 5e reste à relire dans le texte officiel.",
  },
  {
    id: "c4-2020",
    title: "Programmes du cycle 4 (version consolidée)",
    reference: "BO n° 31 du 30 juillet 2020",
    url: "https://eduscol.education.gouv.fr/4362/enseigner-au-cycle-4",
    subjects: ["hg", "physique", "svt", "arts", "musique", "eps"],
    applies: [
      { level: "5e", from: R(2020) },
      { level: "4e", from: R(2020) },
      { level: "3e", from: R(2020) },
    ],
    checkedAt: CHECKED,
    verification: "cross_checked",
    checkedWith: ["https://preparemescours.fr/programmes", "https://www.digischool.fr/articles/college/nouveaux-programmes-college-2026/"],
    note: "Inchangés en 2026-2027 pour l'histoire-géographie, la physique-chimie, les SVT, les arts et l'EPS.",
  },
  {
    id: "c4-2020-fml",
    title: "Programmes de français, mathématiques et langues vivantes du cycle 4 (version 2020)",
    reference: "BO n° 31 du 30 juillet 2020",
    url: "https://eduscol.education.gouv.fr/4362/enseigner-au-cycle-4",
    subjects: ["francais", "maths", "anglais", "espagnol", "allemand"],
    applies: [
      { level: "5e", from: R(2020), until: R(2026) },
      { level: "4e", from: R(2020), until: R(2027) },
      { level: "3e", from: R(2020), until: R(2028) },
    ],
    checkedAt: CHECKED,
    verification: "cross_checked",
    checkedWith: ["https://www.digischool.fr/articles/college/brevet/programme-brevet-2027/", "https://www.digischool.fr/articles/college/nouveaux-programmes-college-2026/"],
    note: "En 2026-2027, les élèves de 4e et de 3e suivent encore cette version ; le brevet 2027 porte dessus.",
  },
  {
    id: "techno-c4-2024",
    title: "Programme de technologie du cycle 4",
    reference: "BO n° 9 du 29 février 2024",
    url: "https://sti.eduscol.education.fr/sites/eduscol.education.fr.sti/files/textes//16802-programme-de-technologie-c4.pdf",
    subjects: ["techno"],
    applies: [
      { level: "5e", from: R(2024) },
      { level: "4e", from: R(2025) },
      { level: "3e", from: R(2026) },
    ],
    checkedAt: CHECKED,
    verification: "verified_official",
    checkedWith: ["https://sti.eduscol.education.fr/sites/eduscol.education.fr.sti/files/textes//16802-programme-de-technologie-c4.pdf"],
    note: "Texte officiel lu : trois thèmes, neuf compétences de fin de cycle, repères de progressivité de la 5e à la 3e.",
  },
  {
    id: "lca-c4-2016",
    title: "Enseignement de complément de langues et cultures de l'Antiquité (latin, grec), cycle 4",
    reference: "Arrêté du 8 février 2016, BO n° 11 du 17 mars 2016",
    url: "https://www.education.gouv.fr/bo/16/Hebdo11/MENE1603855A.htm",
    subjects: ["latin", "grec"],
    applies: [
      { level: "5e", from: R(2016) },
      { level: "4e", from: R(2016) },
      { level: "3e", from: R(2016) },
    ],
    checkedAt: CHECKED,
    verification: "verified_official",
    checkedWith: ["https://www.arretetonchar.fr/wp-content/uploads/2019/01/MENE1603855A.pdf"],
    note: "Texte lu dans une copie intégrale de l'arrêté. Trois axes : langue, textes, culture ; thèmes de civilisation communs en 5e et 4e, propres au latin et au grec en 3e.",
  },

  /* ——— Lycée ——— */
  {
    id: "lycee-2019-2nde-1re",
    title: "Programmes de seconde générale et technologique et de première générale",
    reference: "BO spécial n° 1 du 22 janvier 2019",
    url: "https://eduscol.education.gouv.fr/4368/enseigner-au-lycee-generaltechnologique",
    subjects: ["francais", "hg", "physique", "svt", "ses", "snt", "eps", "ens-sci", "hggsp", "hlp", "llcer", "nsi", "si", "maths", "arts", "arts-spe", "latin", "grec", "llca"],
    applies: [
      { level: "2nde", from: R(2019) },
      { level: "1re", from: R(2019) },
    ],
    checkedAt: CHECKED,
    verification: "cross_checked",
    checkedWith: [
      "https://www.snes.edu/IMG/pdf/llca_opt_annexe1corr_1063701.pdf",
      "https://www.snes.edu/IMG/pdf/llca_opt_annexe2_1062855.pdf",
      "https://www.snes.edu/IMG/pdf/arrete_litlca_spe_1eg_ensemble.pdf",
      "https://www.snes.edu/IMG/pdf/1e_arts_plastiques_enseignement_de_specialite_voie_generale_1025401.pdf",
      "https://www.eliott.app/blog/programme-seconde-gt-annee-scolaire-2026-2027",
    ],
    note: "Toujours en vigueur en 2026-2027, sauf mathématiques de seconde (programme 2026), langues vivantes (programme 2025) et EMC (programme 2024). Annexes lues pour les options de latin et de grec, la spécialité LLCA et la spécialité arts plastiques.",
  },
  {
    id: "maths-2nde-2026",
    title: "Programme de mathématiques de seconde générale et technologique",
    reference: "Arrêté du 26 février 2026, BO n° 14 du 2 avril 2026",
    url: "https://www.education.gouv.fr/bo/2026/Hebdo14/MENE2602914A",
    subjects: ["maths"],
    applies: [{ level: "2nde", from: R(2026) }],
    checkedAt: CHECKED,
    verification: "cross_checked",
    checkedWith: [
      "https://ent2d.ac-bordeaux.fr/disciplines/mathematiques/wp-content/uploads/sites/3/2026/06/1-Programme-denseignement-de-mathematiques-de-la-classe-de-seconde-generale-et-technologique.pdf",
      "https://groupe-reussite.fr/ressources/wp-content/uploads/2026/08/programme-maths-seconde.pdf",
    ],
    note: "Plan du programme lu dans la copie de l'académie de Bordeaux : nombres et calculs, algèbre ; géométrie ; fonctions ; statistiques et probabilités ; parties transversales (vocabulaire ensembliste et logique, algorithmique et programmation, automatismes).",
  },
  {
    id: "maths-1re-tc",
    title: "Enseignement de mathématiques de première (élèves sans spécialité mathématiques)",
    reference: "BO n° 27 du 7 juillet 2022 (selon une source secondaire)",
    url: "https://eduscol.education.gouv.fr/5817/programmes-et-ressources-en-mathematiques-voie-gt",
    subjects: ["maths-tc"],
    applies: [{ level: "1re", from: R(2025) }],
    checkedAt: CHECKED,
    verification: "needs_review",
    checkedWith: ["https://www.letudiant.fr/lycee/filiere-generale-et-technologique/article/programme-de-maths-en-premiere-tronc-commun.html"],
    note: "Épreuve anticipée de mathématiques en fin de première (lundi 21 juin 2027 pour la session 2027).",
  },
  {
    id: "eppcs-2021",
    title: "Spécialité éducation physique, pratiques et culture sportives (EPPCS)",
    reference: "Arrêté du 2 juin 2021, BO n° 25 du 24 juin 2021",
    url: "https://www.education.gouv.fr/bo/21/Hebdo25/MENE2116606A.htm",
    subjects: ["eppcs"],
    applies: [
      { level: "1re", from: R(2021) },
      { level: "Tle", from: R(2022) },
    ],
    checkedAt: CHECKED,
    verification: "verified_official",
    checkedWith: ["https://eps.dis.ac-guyane.fr/IMG/pdf/enseignement_spe_cialite_eppcs_bo_25_menjs_1413881-54-64_compressed.pdf", "https://www.digischool.fr/articles/lycee/bac/specialite-eppcs/"],
    note: "Référence et calendrier lus dans une copie du BO. Thématiques de première et de terminale recoupées avec une source éditoriale.",
  },
  {
    id: "lycee-2019-tle",
    title: "Programmes de terminale générale",
    reference: "BO spécial n° 8 du 25 juillet 2019",
    url: "https://eduscol.education.gouv.fr/4368/enseigner-au-lycee-generaltechnologique",
    subjects: ["philo", "hg", "ens-sci", "maths", "physique", "svt", "ses", "hggsp", "hlp", "llcer", "nsi", "si", "maths-comp", "maths-exp", "dgemc", "eps", "arts-spe", "latin", "grec", "llca"],
    applies: [{ level: "Tle", from: R(2020) }],
    checkedAt: CHECKED,
    verification: "cross_checked",
    checkedWith: [
      "https://lyc-pascal-orsay.ac-versailles.fr/wp-content/uploads/sites/245/2020/07/OPTION-LATIN-GREC-1.pdf",
      "https://www.cours-thales.fr/lycee/terminale/programme-specialite-litterature-langues-cultures",
      "https://www.letudiant.fr/lycee/premiere/1re-generale-quelles-matieres-au-tronc-commun.html",
    ],
    note: "Référence recoupée. Langues vivantes : programme 2025 en terminale depuis 2026. EMC : programme 2024 en terminale depuis 2026.",
  },
];

export function getSource(id: string): CurriculumSource {
  const s = SOURCES.find((x) => x.id === id);
  if (!s) throw new Error(`Source inconnue : ${id}`);
  return s;
}

/** Version de programme en vigueur pour un niveau, une matière et une rentrée donnés. */
export function sourceFor(level: Level, subject: SubjectId, schoolYearStart = "2026-09-01"): CurriculumSource | undefined {
  return SOURCES.filter((s) => s.subjects.includes(subject))
    .flatMap((s) => s.applies.filter((a) => a.level === level && a.from <= schoolYearStart && (!a.until || a.until > schoolYearStart)).map((a) => ({ s, from: a.from })))
    .sort((a, b) => b.from.localeCompare(a.from))[0]?.s;
}

export const VERIFICATION_LABEL = {
  verified_official: "Texte officiel lu",
  cross_checked: "Référence recoupée",
  needs_review: "À vérifier",
  illustrative_mock: "Exemple fictif",
  extension_not_required: "Hors programme",
} as const;
