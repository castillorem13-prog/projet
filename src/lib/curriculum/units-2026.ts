import type { Level, Unit, VerificationStatus } from "./types";
import { unit } from "./units-college";

/**
 * Unités ajoutées ou refondues en v5, d'après les textes revérifiés le 30 octobre 2026 :
 *  - langues vivantes : axes culturels du programme 2025 (6e, 5e, seconde, première, terminale) ;
 *  - EMC : thèmes annuels du programme 2024, à tous les niveaux ;
 *  - latin et grec (collège et lycée), spécialité LLCA, spécialité EPPCS, spécialité arts plastiques.
 * Les intitulés suivent les textes ; les notions proposées sous chaque intitulé sont des pistes de travail
 * de LearnWard, à valider par un enseignant.
 */

const OK: VerificationStatus = "cross_checked";
const OFF: VerificationStatus = "verified_official";
const TODO: VerificationStatus = "needs_review";

/* ——— Langues vivantes : programme 2025 ——— */

type Axis = { slug: string; title: string; topic: string };
const AXES: Partial<Record<Level, Axis[]>> = {
  "6e": [
    { slug: "personnes", title: "Personnes et personnages", topic: "Se présenter, décrire quelqu'un" },
    { slug: "quotidien", title: "Le quotidien : vivre, jouer, apprendre", topic: "Parler de ses journées et de ses activités" },
    { slug: "pays", title: "Pays et paysages", topic: "Décrire un lieu, se repérer" },
    { slug: "imaginaire", title: "Imaginaire, contes et légendes", topic: "Comprendre et raconter une histoire simple" },
    { slug: "arts", title: "Arts et expression des sentiments", topic: "Dire ce qu'on aime et ce qu'on ressent" },
  ],
  "5e": [
    { slug: "portrait", title: "Portrait, autoportrait", topic: "Se décrire, décrire un personnage" },
    { slug: "rythmes", title: "Le quotidien : lieux, rythmes et saisons", topic: "Parler du temps, des saisons, des habitudes" },
    { slug: "loisirs", title: "École et loisirs", topic: "Comparer l'école et les loisirs d'ici et d'ailleurs" },
    { slug: "reel", title: "Le réel et l'imaginaire", topic: "Raconter au passé, imaginer" },
    { slug: "lieux", title: "Des langues, des lieux, des histoires", topic: "Découvrir des lieux et leurs histoires" },
  ],
  "2nde": [
    { slug: "soi", title: "Représentation de soi et rapport à autrui", topic: "Se présenter, exprimer et nuancer une opinion" },
    { slug: "generations", title: "Vivre entre générations", topic: "Comparer hier et aujourd'hui" },
    { slug: "passe", title: "Le passé dans le présent", topic: "Raconter, situer dans le temps" },
    { slug: "defis", title: "Défis et transitions", topic: "Argumenter sur un enjeu de société" },
    { slug: "creer", title: "Créer et recréer", topic: "Analyser et réinventer une œuvre" },
  ],
  "1re": [
    { slug: "identites", title: "Identités et échanges", topic: "Comprendre un point de vue, en débattre" },
    { slug: "diversite", title: "Diversité et inclusion", topic: "Argumenter, nuancer" },
    { slug: "pouvoir", title: "Art et pouvoir", topic: "Analyser une œuvre engagée" },
    { slug: "innovations", title: "Innovations scientifiques et responsabilité", topic: "Présenter une innovation et ses limites" },
    { slug: "nature", title: "L'être humain et la nature", topic: "Débattre d'un enjeu environnemental" },
  ],
  Tle: [
    { slug: "espaces", title: "Espace privé et espace public", topic: "Débattre, synthétiser des documents" },
    { slug: "memoire", title: "Territoire et mémoire", topic: "Expliquer une mémoire collective" },
    { slug: "fictions", title: "Fictions et réalités", topic: "Analyser un récit, une image" },
    { slug: "communication", title: "Enjeux et formes de la communication", topic: "Décrypter un message médiatique" },
    { slug: "virtuel", title: "Citoyenneté et monde virtuel", topic: "Argumenter sur le numérique" },
  ],
};

/** Niveau visé (CECRL) en fin d'année, indicatif. */
const CECRL: Partial<Record<Level, string>> = { "6e": "A1 vers A2", "5e": "A2", "2nde": "A2 vers B1", "1re": "B1", Tle: "B1 vers B2" };

/** Une piste de langue par axe, propre à chaque langue et à chaque niveau. */
const GRAMMAR: Record<"anglais" | "espagnol" | "allemand", Partial<Record<Level, string[]>>> = {
  anglais: {
    "6e": ["Be et have got", "Présent simple, adverbes de fréquence", "There is / there are", "Prétérit de be et des verbes réguliers", "Like, love, hate + -ing"],
    "5e": ["Adjectifs et comparatifs", "Présent simple et présent en be + -ing", "Can, must, have to", "Prétérit des verbes irréguliers", "Le futur avec will et be going to"],
    "2nde": ["Present perfect et prétérit", "Used to, would", "Prétérit et past perfect", "Modaux d'obligation et de possibilité", "Voix passive"],
    "1re": ["Discours rapporté", "Concession : although, however", "Conditionnel", "Expression de l'hypothèse", "Expression du but et de la conséquence"],
    Tle: ["Nuancer : may, might, could", "Passif et causatif", "Structures emphatiques", "Discours rapporté complexe", "Hypothèse : if only, I wish"],
  },
  espagnol: {
    "6e": ["Ser et estar", "Présent des verbes réguliers", "Hay, estar + lieu", "Prétérit des verbes réguliers", "Gustar, encantar"],
    "5e": ["Adjectifs et accords", "Verbes pronominaux", "Tener que, hay que", "Pretérito indefinido", "Ir a + infinitif"],
    "2nde": ["Pretérito perfecto et indefinido", "Imparfait", "Indefinido et imparfait", "Subjonctif présent", "Impératif"],
    "1re": ["Subjonctif après les verbes d'opinion", "Concession : aunque", "Conditionnel", "Si + imparfait du subjonctif", "Para que + subjonctif"],
    Tle: ["Nuancer : quizás, puede que", "Passif et se impersonnel", "Mise en relief", "Concordance des temps", "Subjonctif imparfait"],
  },
  allemand: {
    "6e": ["Sein et haben", "Présent et place du verbe", "Es gibt, prépositions de lieu", "Prétérit de sein et haben", "Gern, lieber, am liebsten"],
    "5e": ["Adjectifs attributs, comparatif", "Verbes de modalité", "Müssen, dürfen, können", "Parfait des verbes faibles", "Futur avec werden"],
    "2nde": ["Parfait des verbes forts", "Subordonnées en weil, dass", "Prétérit", "Infinitive avec zu", "Passif"],
    "1re": ["Discours indirect (subjonctif I)", "Concession : obwohl", "Subjonctif II", "Hypothèse : wenn", "Damit, um … zu"],
    Tle: ["Nuancer : vielleicht, wohl", "Passif et substituts", "Relatives complexes", "Subjonctif I et II", "Participes adjectivés"],
  },
};

const PREV_LV: Partial<Record<Level, Level>> = { "5e": "6e", "1re": "2nde", Tle: "1re" };

function lvUnits(level: Level, subject: "anglais" | "espagnol" | "allemand"): Unit[] {
  const axes = AXES[level] ?? [];
  const grammar = GRAMMAR[subject][level] ?? [];
  const cecrl = CECRL[level];
  const prev = PREV_LV[level];
  const units = axes.map((a, i) =>
    unit(level, subject, a.slug, "Axes culturels (programme 2025)", a.title, [a.topic, grammar[i] ?? "Repères linguistiques de l'année", `Niveau visé : ${cecrl} (CECRL)`], OK, {
      // La 6e n'a pas de LVB : en 5e, l'espagnol et l'allemand commencent, sans prérequis de 6e.
      needs: prev && (subject === "anglais" || level !== "5e") ? [`${prev}-${subject}-${(AXES[prev] ?? [])[i]?.slug}`] : level === "2nde" ? [`3e-${subject}-${["rencontres", "ecole", "voyages", "langages", "langages"][i]}`] : undefined,
    }),
  );
  units.push(unit(level, subject, "axe6", "Axes culturels (programme 2025)", "Axe propre à la langue étudiée", ["Un pays ou une région de la langue, ses repères culturels", `Niveau visé : ${cecrl} (CECRL)`], OK));
  return units;
}

/** Allemand en 4e et en 3e : thèmes culturels du cycle 4 (version 2020), comme l'anglais et l'espagnol. */
const ALLEMAND_C4: Unit[] = (["4e", "3e"] as Level[]).flatMap((level) => [
  unit(level, "allemand", "langages", "Culture", "Langages", level === "4e" ? ["Langue et communication", "Comparatif"] : ["Médias et langages", "Subordonnées en dass, weil"], OK, { needs: level === "3e" ? ["4e-allemand-langages"] : ["5e-allemand-portrait"] }),
  unit(level, "allemand", "ecole", "Culture", "École et société", level === "4e" ? ["L'école en Allemagne", "Verbes de modalité"] : ["Engagement, vie citoyenne", "Prétérit"], OK, { needs: level === "3e" ? ["4e-allemand-ecole"] : undefined }),
  unit(level, "allemand", "voyages", "Culture", "Voyages et migrations", level === "4e" ? ["Se repérer, voyager", "Parfait"] : ["Raconter un voyage", "Parfait et prétérit"], OK, { needs: level === "3e" ? ["4e-allemand-voyages"] : undefined }),
  unit(level, "allemand", "rencontres", "Culture", "Rencontres avec d'autres cultures", level === "4e" ? ["Fêtes et traditions", "Datif"] : ["Histoire et mémoire", "Relatives"], OK, { needs: level === "3e" ? ["4e-allemand-rencontres"] : undefined }),
]);

export const LV_UNITS: Unit[] = [
  ...lvUnits("6e", "anglais"),
  ...(["5e", "2nde", "1re", "Tle"] as Level[]).flatMap((l) => (["anglais", "espagnol", "allemand"] as const).flatMap((s) => lvUnits(l, s))),
  ...ALLEMAND_C4,
];

/* ——— EMC : programme 2024 ——— */

export const EMC_UNITS: Unit[] = [
  unit("6e", "emc", "democratie", "Apprendre à vivre dans une société démocratique", "Représentation et démocratie représentative", ["Élire des représentants : délégués, conseil municipal", "La règle de la majorité et le respect de chacun"], OK),
  unit("6e", "emc", "regles", "Apprendre à vivre dans une société démocratique", "Vivre ensemble : règles, droits et laïcité à l'École", ["Le règlement intérieur", "La laïcité à l'École"], TODO),
  unit("6e", "emc", "agir", "Apprendre à vivre dans une société démocratique", "Agir pour le collectif", ["Un projet citoyen dans la classe ou le collège"], TODO),

  unit("5e", "emc", "egalite", "Égalité, fraternité et solidarité", "Égalité femmes-hommes et lutte contre les discriminations", ["Parité", "Racisme, antisémitisme", "Harcèlement"], OK, { needs: ["6e-emc-democratie"] }),
  unit("5e", "emc", "solidarite", "Égalité, fraternité et solidarité", "La solidarité et ses échelles", ["Fraternité", "Risques sociaux et Sécurité sociale", "Risques environnementaux"], OK),

  unit("4e", "emc", "droits", "Défendre les droits et les libertés", "Droits et libertés fondamentaux", ["Déclaration des droits de l'homme et du citoyen", "Convention internationale des droits de l'enfant"], OK, { needs: ["5e-emc-egalite"] }),
  unit("4e", "emc", "citoyennete", "Défendre les droits et les libertés", "Faire respecter ses droits : justice et recours", ["Le harcèlement et la loi", "Les acteurs de la justice"], TODO),

  unit("3e", "emc", "regles", "Faire vivre la démocratie", "Les principes et les règles de la démocratie", ["La Constitution de la Ve République", "Séparation des pouvoirs", "Laïcité de l'État"], OK, { needs: ["4e-emc-droits"], sessionId: "emc-regles-3e" }),
  unit("3e", "emc", "opinion", "Faire vivre la démocratie", "S'informer et débattre", ["Médias et pluralisme", "Information et désinformation"], TODO, { needs: ["4e-emc-citoyennete"] }),
  unit("3e", "emc", "engagement", "Faire vivre la démocratie", "Participer et s'engager", ["Voter", "Engagements associatif, syndical, politique"], TODO),

  unit("2nde", "emc", "etat", "Droits, libertés et responsabilité", "L'État de droit, garant des droits, des libertés et du pluralisme", ["État de droit", "Laïcité", "Pluralisme, ordre public"], OK, { needs: ["3e-emc-regles"] }),
  unit("2nde", "emc", "information", "Droits, libertés et responsabilité", "Liberté et responsabilité : l'information", ["Vecteurs et enjeux de l'information", "Liberté de la presse"], OK, { needs: ["3e-emc-opinion"] }),
  unit("2nde", "emc", "environnement", "Droits, libertés et responsabilité", "Droits et responsabilité : environnement et biodiversité", ["Protéger l'environnement", "Sauvegarder la biodiversité"], OK),

  unit("1re", "emc", "cohesion", "Cohésion et diversité dans une société démocratique", "Cohésion et diversité dans une société démocratique", ["Ce qui fait tenir une société", "Reconnaître la diversité, lutter contre les discriminations"], OK, { needs: ["2nde-emc-etat"] }),

  unit("Tle", "emc", "democratie", "La vie démocratique : débat, délibération et prise de décision", "La vie démocratique : débat, délibération et prise de décision", ["Principes et espaces du débat démocratique", "Délibérer et décider dans les institutions"], OK, { needs: ["1re-emc-cohesion"] }),
];

/* ——— Latin et grec au collège (BO n° 11 du 17 mars 2016) ——— */

const LANGUE_LCA: Record<"latin" | "grec", Record<"5e" | "4e" | "3e", string[]>> = {
  latin: {
    "5e": ["Alphabet et prononciation", "Nominatif et accusatif", "Présent de l'indicatif"],
    "4e": ["Les cas et leurs fonctions", "Imparfait et parfait", "Lexique et étymologie"],
    "3e": ["Phrase complexe", "Ablatif absolu", "Subordonnées"],
  },
  grec: {
    "5e": ["Alphabet grec et transcription", "Articles et premiers noms", "Présent de l'indicatif"],
    "4e": ["Déclinaisons", "Imparfait", "Racines grecques du français"],
    "3e": ["Phrase complexe", "Aoriste", "Subordonnées"],
  },
};

function lcaCollege(subject: "latin" | "grec"): Unit[] {
  const common = (level: "5e" | "4e") => [
    unit(level, subject, "legende", "Culture et civilisation", "De la légende à l'histoire", level === "5e" ? ["Les origines de Rome", "Mythes et héros fondateurs"] : ["La République", "Les guerres puniques"], OFF, { needs: level === "4e" ? [`5e-${subject}-legende`] : undefined }),
    unit(level, subject, "vie", "Culture et civilisation", "Vie privée et vie publique", ["Famille et éducation", "Religion et cité"], OFF),
    unit(level, subject, "mediterranee", "Culture et civilisation", "Le monde méditerranéen antique", ["Repères géographiques", "Échanges et conquêtes"], OFF),
    unit(level, subject, "langue", "Langue et textes", subject === "latin" ? "Langue latine et traduction" : "Langue grecque et traduction", LANGUE_LCA[subject][level], TODO, { needs: level === "4e" ? [`5e-${subject}-langue`] : undefined }),
  ];
  const third =
    subject === "latin"
      ? [
          unit("3e", "latin", "principat", "Culture et civilisation", "De la république au principat", ["Les crises de la République", "Auguste"], OFF, { needs: ["4e-latin-legende"] }),
          unit("3e", "latin", "empire", "Culture et civilisation", "L'empire romain", ["Romanisation", "Figures d'empereurs"], OFF),
        ]
      : [
          unit("3e", "grec", "mythe", "Culture et civilisation", "Du mythe à l'histoire", ["Époques minoenne et mycénienne", "Mythes et récits"], OFF, { needs: ["4e-grec-legende"] }),
          unit("3e", "grec", "unite", "Culture et civilisation", "La Grèce dans son unité et sa diversité", ["Athènes et Sparte", "Guerres médiques", "Alexandre"], OFF),
        ];
  return [
    ...common("5e"),
    ...common("4e"),
    ...third,
    unit("3e", subject, "vie", "Culture et civilisation", "Vie familiale, sociale et intellectuelle", ["Éducation, savoirs", "Société et statuts"], OFF, { needs: [`4e-${subject}-vie`] }),
    unit("3e", subject, "mediterranee", "Culture et civilisation", "Le monde méditerranéen", ["Circulations, influences"], OFF, { needs: [`4e-${subject}-mediterranee`] }),
    unit("3e", subject, "langue", "Langue et textes", subject === "latin" ? "Langue latine et traduction" : "Langue grecque et traduction", LANGUE_LCA[subject]["3e"], TODO, { needs: [`4e-${subject}-langue`] }),
  ];
}

/* ——— Latin et grec au lycée (options) ——— */

function lcaLycee(subject: "latin" | "grec"): Unit[] {
  return [
    unit("2nde", subject, "animal", "L'Homme et ce qui fait son humanité", "L'Homme et l'animal", ["Mutations, monstres et hybrides", "Bestiaires, regards sur l'animal"], OFF, { needs: [`3e-${subject}-vie`] }),
    unit("2nde", subject, "divin", "L'Homme et ce qui fait son humanité", "L'Homme et le divin", ["Hommes, héros et dieux", "Le voyage aux Enfers"], OFF),
    unit("2nde", subject, "autre", "L'Homme et ce qui fait son humanité", "Soi-même et l'autre", ["Grecs, Romains et barbares", "La langue de l'autre"], OFF),
    unit("2nde", subject, "mediterranee", "L'Homme et ce qui fait son humanité", "Méditerranée : voyager, explorer, découvrir", ["« Notre mer », une mosaïque de peuples", "Accueil et hospitalité"], OFF, { needs: [`3e-${subject}-mediterranee`] }),
    unit("1re", subject, "cite", "L'Homme et la cité", "Vivre dans la cité", ["Naissance de la cité", "La parole : pouvoirs et dérives"], OFF, { needs: [`2nde-${subject}-autre`] }),
    unit("1re", subject, "dieux", "L'Homme et la cité", "Les dieux dans la cité", ["Cultes, rites et fêtes", "Le politique et le sacré"], OFF, { needs: [`2nde-${subject}-divin`] }),
    unit("1re", subject, "masculin", "L'Homme et la cité", "Masculin, féminin", ["Figures mythologiques", "Représentations et préjugés"], OFF),
    unit("1re", subject, "mediterranee", "L'Homme et la cité", "Méditerranée : conflits, influences et échanges", ["Colonisation et conquêtes", "Échanges culturels"], OFF, { needs: [`2nde-${subject}-mediterranee`] }),
    unit("Tle", subject, "sagesse", "Le rapport de l'Homme au monde", "Leçons de sagesse antique", ["Philosophies antiques", "Bien vivre"], OK, { needs: [`1re-${subject}-cite`] }),
    unit("Tle", subject, "comprendre", "Le rapport de l'Homme au monde", "Comprendre le monde", ["Savoirs antiques", "Observer, expliquer"], OK),
    unit("Tle", subject, "inventer", "Le rapport de l'Homme au monde", "Inventer, créer, fabriquer, produire", ["Techniques et inventions", "Arts et artisans"], OK),
    unit("Tle", subject, "mediterranee", "Le rapport de l'Homme au monde", "Le monde méditerranéen", ["Héritages antiques"], OK, { needs: [`1re-${subject}-mediterranee`] }),
  ];
}

/* ——— Spécialités ——— */

const LLCA: Unit[] = [
  unit("1re", "llca", "cite", "LLCA", "La cité entre réalités et utopies", ["Cités idéales", "Lois et citoyenneté"], OFF, { needs: ["2nde-latin-autre"] }),
  unit("1re", "llca", "justice", "LLCA", "Justice des dieux, justice des hommes", ["Tragédie et justice", "Procès et plaidoiries"], OFF),
  unit("1re", "llca", "amour", "LLCA", "Amour, Amours", ["Poésie élégiaque", "Couples mythiques"], OFF),
  unit("1re", "llca", "mediterranee", "LLCA", "Méditerranée : conflits, influences et échanges", ["Guerres et paix", "Influences réciproques"], OFF),
  unit("Tle", "llca", "destin", "LLCA", "L'Homme, le monde, le destin", ["Fatum, fortune", "Héros face au destin"], OK, { needs: ["1re-llca-justice"] }),
  unit("Tle", "llca", "croire", "LLCA", "Croire, savoir, douter", ["Religions et philosophies", "Le doute"], OK),
  unit("Tle", "llca", "mediterranee", "LLCA", "Méditerranée : présence des mondes antiques", ["Réceptions de l'Antiquité"], OK, { needs: ["1re-llca-mediterranee"] }),
];

const EPPCS: Unit[] = [
  unit("1re", "eppcs", "corps", "EPPCS", "Le corps humain et les métiers du sport", ["Fonctionnement du corps à l'effort", "Métiers du sport et de l'animation"], OK, { needs: ["2nde-eps-entretien"] }),
  unit("1re", "eppcs", "sante", "EPPCS", "Activité physique et santé", ["Effets de l'activité physique", "Prévention et sédentarité"], OK),
  unit("1re", "eppcs", "technologie", "EPPCS", "Technologies et activités physiques, sportives et artistiques", ["Mesurer, analyser une performance", "Matériels et innovations"], OK),
  unit("1re", "eppcs", "evenement", "EPPCS", "Projet : organiser un événement sportif ou artistique", ["Planifier", "Communiquer", "Évaluer"], OK),
  unit("Tle", "eppcs", "enjeux", "EPPCS", "Enjeux de la pratique physique dans le monde contemporain", ["Sport et société", "Éthique, inclusion, environnement"], OK, { needs: ["1re-eppcs-sante"] }),
  unit("Tle", "eppcs", "technologie", "EPPCS", "Technologies appliquées aux activités physiques", ["Données, capteurs, vidéo"], OK, { needs: ["1re-eppcs-technologie"] }),
  unit("Tle", "eppcs", "animation", "EPPCS", "Projet : animation pédagogique", ["Concevoir et conduire une séance pour un groupe"], OK, { needs: ["1re-eppcs-evenement"] }),
];

const ARTS_SPE: Unit[] = [
  unit("1re", "arts-spe", "plasticiens", "Arts plastiques", "Questionnements plasticiens", ["Représentation, figuration et non-figuration", "Matière et matériaux", "Présentation et réception de l'œuvre"], OFF, { needs: ["2nde-arts-pratique"] }),
  unit("1re", "arts-spe", "interdisciplinaires", "Arts plastiques", "Questionnements artistiques interdisciplinaires", ["Architecture, design", "Cinéma, animation, jeu vidéo", "Théâtre, danse, musique"], OFF),
  unit("1re", "arts-spe", "transversaux", "Arts plastiques", "Questionnements artistiques transversaux", ["Art et société", "Art, sciences et technologies", "Mondialisation de la création"], OFF),
  unit("1re", "arts-spe", "projet", "Arts plastiques", "Pratique, projet et présentation", ["Expérimenter, produire", "Exposer et expliquer ses intentions"], OFF),
  unit("Tle", "arts-spe", "plasticiens", "Arts plastiques", "Questionnements plasticiens", ["Le processus de création", "L'œuvre et son lieu"], TODO, { needs: ["1re-arts-spe-plasticiens"] }),
  unit("Tle", "arts-spe", "transversaux", "Arts plastiques", "Questionnements interdisciplinaires et transversaux", ["Œuvres de référence du XXe siècle à nos jours"], TODO),
  unit("Tle", "arts-spe", "projet", "Arts plastiques", "Projet personnel et présentation", ["Dossier, oral, exposition"], TODO, { needs: ["1re-arts-spe-projet"] }),
];

export const UNITS_2026: Unit[] = [...LV_UNITS, ...EMC_UNITS, ...lcaCollege("latin"), ...lcaCollege("grec"), ...lcaLycee("latin"), ...lcaLycee("grec"), ...LLCA, ...EPPCS, ...ARTS_SPE];
