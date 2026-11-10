import { UNITS } from "@/lib/curriculum";
import type { Fact, FactSet, Lang } from "../types";

/**
 * Lexique des langues vivantes (anglais, espagnol, allemand) par thème, langues anciennes, racines,
 * mythologie et repères de l'Antiquité. Une ligne du lexique donne le même sens dans les trois langues.
 */

export type Theme = "famille" | "quotidien" | "ecole" | "loisirs" | "lieux" | "sentiments" | "contes" | "fetes" | "temps" | "environnement" | "societe" | "numerique" | "innovations" | "pouvoir";

/** [français, anglais, espagnol, allemand] */
export const LEXIQUE: Record<Theme, [string, string, string, string][]> = {
  famille: [["la mère", "mother", "la madre", "die Mutter"], ["le père", "father", "el padre", "der Vater"], ["le frère", "brother", "el hermano", "der Bruder"], ["la sœur", "sister", "la hermana", "die Schwester"], ["grand (de taille)", "tall", "alto", "groß"], ["petit (de taille)", "short", "bajo", "klein"], ["les cheveux", "hair", "el pelo", "die Haare"], ["les yeux", "eyes", "los ojos", "die Augen"], ["drôle", "funny", "gracioso", "lustig"], ["gentil", "kind", "amable", "nett"]],
  quotidien: [["se lever", "to get up", "levantarse", "aufstehen"], ["le petit-déjeuner", "breakfast", "el desayuno", "das Frühstück"], ["le matin", "morning", "la mañana", "der Morgen"], ["dormir", "to sleep", "dormir", "schlafen"], ["manger", "to eat", "comer", "essen"], ["travailler", "to work", "trabajar", "arbeiten"], ["tous les jours", "every day", "todos los días", "jeden Tag"], ["toujours", "always", "siempre", "immer"], ["jamais", "never", "nunca", "nie"]],
  ecole: [["l'école", "school", "el colegio", "die Schule"], ["le professeur", "teacher", "el profesor", "der Lehrer"], ["l'élève", "pupil", "el alumno", "der Schüler"], ["le cahier", "exercise book", "el cuaderno", "das Heft"], ["la récréation", "break", "el recreo", "die Pause"], ["les devoirs", "homework", "los deberes", "die Hausaufgaben"], ["l'emploi du temps", "timetable", "el horario", "der Stundenplan"], ["la cantine", "canteen", "el comedor", "die Mensa"]],
  loisirs: [["jouer au football", "to play football", "jugar al fútbol", "Fußball spielen"], ["lire", "to read", "leer", "lesen"], ["la musique", "music", "la música", "die Musik"], ["nager", "to swim", "nadar", "schwimmen"], ["le cinéma", "cinema", "el cine", "das Kino"], ["le jeu vidéo", "video game", "el videojuego", "das Videospiel"], ["danser", "to dance", "bailar", "tanzen"], ["le week-end", "weekend", "el fin de semana", "das Wochenende"]],
  lieux: [["la ville", "city", "la ciudad", "die Stadt"], ["la gare", "station", "la estación", "der Bahnhof"], ["la plage", "beach", "la playa", "der Strand"], ["la montagne", "mountain", "la montaña", "der Berg"], ["le voyage", "trip", "el viaje", "die Reise"], ["l'avion", "plane", "el avión", "das Flugzeug"], ["le train", "train", "el tren", "der Zug"], ["la valise", "suitcase", "la maleta", "der Koffer"], ["à gauche", "on the left", "a la izquierda", "links"], ["à droite", "on the right", "a la derecha", "rechts"], ["tout droit", "straight on", "todo recto", "geradeaus"]],
  sentiments: [["heureux", "happy", "feliz", "glücklich"], ["triste", "sad", "triste", "traurig"], ["la peur", "fear", "el miedo", "die Angst"], ["le tableau (peinture)", "painting", "el cuadro", "das Gemälde"], ["la chanson", "song", "la canción", "das Lied"], ["le musée", "museum", "el museo", "das Museum"], ["l'artiste", "artist", "el artista", "der Künstler"]],
  contes: [["le roi", "king", "el rey", "der König"], ["la reine", "queen", "la reina", "die Königin"], ["le château", "castle", "el castillo", "das Schloss"], ["la sorcière", "witch", "la bruja", "die Hexe"], ["le dragon", "dragon", "el dragón", "der Drache"], ["la forêt", "forest", "el bosque", "der Wald"], ["il était une fois", "once upon a time", "érase una vez", "es war einmal"]],
  fetes: [["la fête", "party", "la fiesta", "das Fest"], ["Noël", "Christmas", "la Navidad", "Weihnachten"], ["le cadeau", "present", "el regalo", "das Geschenk"], ["l'anniversaire", "birthday", "el cumpleaños", "der Geburtstag"], ["le gâteau", "cake", "el pastel", "der Kuchen"], ["inviter", "to invite", "invitar", "einladen"], ["fêter", "to celebrate", "celebrar", "feiern"]],
  temps: [["l'histoire (le passé)", "history", "la historia", "die Geschichte"], ["le souvenir", "memory", "el recuerdo", "die Erinnerung"], ["la guerre", "war", "la guerra", "der Krieg"], ["la paix", "peace", "la paz", "der Frieden"], ["autrefois", "in the past", "antes", "früher"], ["les grands-parents", "grandparents", "los abuelos", "die Großeltern"], ["le siècle", "century", "el siglo", "das Jahrhundert"], ["se souvenir", "to remember", "acordarse", "sich erinnern"]],
  environnement: [["l'environnement", "environment", "el medio ambiente", "die Umwelt"], ["la planète", "planet", "el planeta", "der Planet"], ["le réchauffement climatique", "global warming", "el calentamiento global", "die Erderwärmung"], ["les déchets", "waste", "los residuos", "der Müll"], ["recycler", "to recycle", "reciclar", "recyceln"], ["protéger", "to protect", "proteger", "schützen"], ["l'énergie", "energy", "la energía", "die Energie"], ["la pollution", "pollution", "la contaminación", "die Verschmutzung"]],
  societe: [["l'égalité", "equality", "la igualdad", "die Gleichheit"], ["la liberté", "freedom", "la libertad", "die Freiheit"], ["le droit", "right", "el derecho", "das Recht"], ["la langue", "language", "el idioma", "die Sprache"], ["l'étranger (les autres pays)", "abroad", "el extranjero", "das Ausland"], ["la frontière", "border", "la frontera", "die Grenze"], ["l'immigration", "immigration", "la inmigración", "die Einwanderung"], ["la diversité", "diversity", "la diversidad", "die Vielfalt"]],
  numerique: [["l'écran", "screen", "la pantalla", "der Bildschirm"], ["le réseau social", "social network", "la red social", "das soziale Netzwerk"], ["l'ordinateur", "computer", "el ordenador", "der Computer"], ["le téléphone portable", "mobile phone", "el móvil", "das Handy"], ["les informations (actualité)", "news", "las noticias", "die Nachrichten"], ["le journal (presse)", "newspaper", "el periódico", "die Zeitung"], ["partager", "to share", "compartir", "teilen"], ["la vie privée", "privacy", "la privacidad", "die Privatsphäre"]],
  innovations: [["la recherche (scientifique)", "research", "la investigación", "die Forschung"], ["la découverte", "discovery", "el descubrimiento", "die Entdeckung"], ["le chercheur", "researcher", "el investigador", "der Forscher"], ["l'intelligence artificielle", "artificial intelligence", "la inteligencia artificial", "die künstliche Intelligenz"], ["le progrès", "progress", "el progreso", "der Fortschritt"], ["inventer", "to invent", "inventar", "erfinden"]],
  pouvoir: [["le pouvoir", "power", "el poder", "die Macht"], ["le peuple", "the people", "el pueblo", "das Volk"], ["la révolte", "revolt", "la revuelta", "der Aufstand"], ["dénoncer", "to denounce", "denunciar", "anprangern"], ["l'affiche", "poster", "el cartel", "das Plakat"], ["la censure", "censorship", "la censura", "die Zensur"]],
};

/** Thème de vocabulaire de chaque axe (le suffixe de l'identifiant d'unité). */
export const AXIS_THEMES: Record<string, Theme[]> = {
  personnes: ["famille"], quotidien: ["quotidien"], pays: ["lieux"], imaginaire: ["contes"], arts: ["sentiments"],
  portrait: ["famille"], rythmes: ["quotidien"], loisirs: ["loisirs", "ecole"], reel: ["contes"], lieux: ["lieux"],
  soi: ["societe"], generations: ["temps", "famille"], passe: ["temps"], defis: ["environnement"], creer: ["sentiments", "pouvoir"],
  identites: ["societe"], diversite: ["societe"], pouvoir: ["pouvoir"], innovations: ["innovations"], nature: ["environnement"],
  espaces: ["numerique"], memoire: ["temps"], fictions: ["contes"], communication: ["numerique"], virtuel: ["numerique"],
  langages: ["societe", "numerique"], ecole: ["ecole"], voyages: ["lieux"], rencontres: ["fetes"], axe6: ["lieux", "fetes"],
  imaginaires: ["contes"], art: ["pouvoir", "sentiments"], frontieres: ["lieux", "societe"],
};

const LANG_SUBJECT: Record<"en" | "es" | "de", string[]> = { en: ["anglais", "llcer"], es: ["espagnol"], de: ["allemand"] };
const LANG_COL: Record<"en" | "es" | "de", number> = { en: 1, es: 2, de: 3 };

function vocabulary(lang: "en" | "es" | "de"): Fact[] {
  const units = UNITS.filter((u) => LANG_SUBJECT[lang].includes(u.subject));
  const out: Fact[] = [];
  for (const [theme, rows] of Object.entries(LEXIQUE) as [Theme, [string, string, string, string][]][]) {
    const forTheme = units.filter((u) => (AXIS_THEMES[u.id.split("-").slice(2).join("-")] ?? []).includes(theme)).map((u) => u.id);
    if (!forTheme.length) continue;
    rows.forEach((row, i) => out.push({ kind: "word", id: `w-${lang}-${theme}-${i}`, units: forTheme, lang, word: row[LANG_COL[lang]]!, fr: row[0] }));
  }
  return out;
}

const LV_SOURCES = [
  { id: "lv-2025", label: "Programmes de langues vivantes, BO n° 22 du 29 mai 2025", url: "https://education.gouv.fr/bo/2025/Hebdo22/MENE2504621A" },
  { id: "cecrl", label: "Cadre européen commun de référence pour les langues (Conseil de l'Europe)", url: "https://www.coe.int/fr/web/common-european-framework-reference-languages" },
];

export const VOCAB_EN: FactSet = { id: "faits-vocabulaire-anglais", subject: "anglais", title: "Anglais : lexique par thème", status: "needs_review", sources: LV_SOURCES, facts: vocabulary("en") };
export const VOCAB_ES: FactSet = { id: "faits-vocabulaire-espagnol", subject: "espagnol", title: "Espagnol : lexique par thème", status: "needs_review", sources: LV_SOURCES, facts: vocabulary("es") };
export const VOCAB_DE: FactSet = { id: "faits-vocabulaire-allemand", subject: "allemand", title: "Allemand : lexique par thème", status: "needs_review", sources: LV_SOURCES, facts: vocabulary("de") };

/* ——— Langues et cultures de l'Antiquité ——— */

const wd = (id: string, units: string[], lang: Lang, word: string, fr: string): Fact => ({ kind: "word", id, units, lang, word, fr });
const t = (id: string, units: string[], term: string, definition: string): Fact => ({ kind: "term", id, units, term, definition });
const p = (id: string, units: string[], name: string, role: string): Fact => ({ kind: "person", id, units, name, role });
const d = (id: string, units: string[], label: string, year: number, when?: string): Fact => ({ kind: "date", id, units, label, year, ...(when ? { when } : {}) });

const LA_LANGUE = ["5e-latin-langue", "4e-latin-langue", "3e-latin-langue"];
const GR_LANGUE = ["5e-grec-langue", "4e-grec-langue", "3e-grec-langue"];
const MYTHE = ["5e-latin-legende", "5e-grec-legende", "3e-grec-mythe", "2nde-latin-divin", "2nde-grec-divin", "1re-latin-dieux", "1re-grec-dieux", "1re-llca-amour", "Tle-llca-destin", "6e-francais-culture"];

const LCA_SOURCES = [
  { id: "lca-c4-2016", label: "Langues et cultures de l'Antiquité, cycle 4, BO n° 11 du 17 mars 2016", url: "https://www.education.gouv.fr/bo/16/Hebdo11/MENE1603855A.htm" },
  { id: "lca-lycee", label: "Programmes de langues et cultures de l'Antiquité du lycée (2019)", url: "https://eduscol.education.gouv.fr/4368/enseigner-au-lycee-generaltechnologique" },
  { id: "gaffiot", label: "Dictionnaires latin-français (Gaffiot) et grec-français (Bailly)", url: "https://www.lexilogos.com/latin/gaffiot.php" },
];

export const ANTIQUITE_FACTS: FactSet = {
  id: "faits-antiquite",
  subject: "latin",
  title: "Langues anciennes : lexique, racines, mythologie, repères",
  status: "needs_review",
  sources: LCA_SOURCES,
  facts: [
    wd("la-rosa", LA_LANGUE, "la", "rosa", "la rose"), wd("la-puella", LA_LANGUE, "la", "puella", "la jeune fille"), wd("la-servus", LA_LANGUE, "la", "servus", "l'esclave"),
    wd("la-dominus", LA_LANGUE, "la", "dominus", "le maître"), wd("la-deus", LA_LANGUE, "la", "deus", "le dieu"), wd("la-urbs", LA_LANGUE, "la", "urbs", "la ville"),
    wd("la-bellum", LA_LANGUE, "la", "bellum", "la guerre"), wd("la-pax", LA_LANGUE, "la", "pax", "la paix"), wd("la-rex", LA_LANGUE, "la", "rex", "le roi"),
    wd("la-aqua", LA_LANGUE, "la", "aqua", "l'eau"), wd("la-terra", LA_LANGUE, "la", "terra", "la terre"), wd("la-mare", LA_LANGUE, "la", "mare", "la mer"),
    wd("la-amicus", LA_LANGUE, "la", "amicus", "l'ami"), wd("la-populus", LA_LANGUE, "la", "populus", "le peuple"), wd("la-miles", LA_LANGUE, "la", "miles", "le soldat"),
    wd("la-via", LA_LANGUE, "la", "via", "la route"), wd("la-filius", LA_LANGUE, "la", "filius", "le fils"), wd("la-mater", LA_LANGUE, "la", "mater", "la mère"),
    wd("la-pater", LA_LANGUE, "la", "pater", "le père"), wd("la-amor", LA_LANGUE, "la", "amor", "l'amour"), wd("la-vita", LA_LANGUE, "la", "vita", "la vie"),
    wd("la-mors", LA_LANGUE, "la", "mors", "la mort"), wd("la-homo", LA_LANGUE, "la", "homo", "l'être humain"), wd("la-templum", LA_LANGUE, "la", "templum", "le temple"),
    wd("gr-anthropos", GR_LANGUE, "grc", "ἄνθρωπος (anthrôpos)", "l'être humain"), wd("gr-logos", GR_LANGUE, "grc", "λόγος (logos)", "la parole, la raison"),
    wd("gr-polis", GR_LANGUE, "grc", "πόλις (polis)", "la cité"), wd("gr-demos", GR_LANGUE, "grc", "δῆμος (dêmos)", "le peuple"), wd("gr-theos", GR_LANGUE, "grc", "θεός (theos)", "le dieu"),
    wd("gr-bios", GR_LANGUE, "grc", "βίος (bios)", "la vie"), wd("gr-ge", GR_LANGUE, "grc", "γῆ (gê)", "la terre"), wd("gr-hudor", GR_LANGUE, "grc", "ὕδωρ (hudôr)", "l'eau"),
    wd("gr-philos", GR_LANGUE, "grc", "φίλος (philos)", "l'ami"), wd("gr-sophia", GR_LANGUE, "grc", "σοφία (sophia)", "la sagesse"), wd("gr-khronos", GR_LANGUE, "grc", "χρόνος (khronos)", "le temps"),
    wd("gr-hippos", GR_LANGUE, "grc", "ἵππος (hippos)", "le cheval"), wd("gr-kosmos", GR_LANGUE, "grc", "κόσμος (kosmos)", "l'ordre du monde"), wd("gr-agora", GR_LANGUE, "grc", "ἀγορά (agora)", "la place publique"),
    wd("gr-heros", GR_LANGUE, "grc", "ἥρως (hêrôs)", "le héros"), wd("gr-muthos", GR_LANGUE, "grc", "μῦθος (muthos)", "le récit"), wd("gr-phone", GR_LANGUE, "grc", "φωνή (phônê)", "la voix"),
    wd("gr-psukhe", GR_LANGUE, "grc", "ψυχή (psukhê)", "l'âme"),

    t("ra-graph", ["4e-grec-langue", "4e-latin-langue", "6e-francais-vocabulaire"], "graph-", "Racine grecque qui signifie « écrire »"),
    t("ra-chrono", ["4e-grec-langue", "6e-francais-vocabulaire"], "chrono-", "Racine grecque qui signifie « temps »"),
    t("ra-bio", ["4e-grec-langue", "6e-francais-vocabulaire"], "bio-", "Racine grecque qui signifie « vie »"),
    t("ra-geo", ["4e-grec-langue", "6e-francais-vocabulaire"], "géo-", "Racine grecque qui signifie « terre »"),
    t("ra-hydro", ["4e-grec-langue", "6e-francais-vocabulaire"], "hydr(o)-", "Racine grecque qui signifie « eau »"),
    t("ra-philo", ["4e-grec-langue", "6e-francais-vocabulaire"], "phil(o)-", "Racine grecque qui signifie « qui aime »"),
    t("ra-logie", ["4e-grec-langue", "6e-francais-vocabulaire"], "-logie", "Racine grecque qui signifie « étude, science, discours »"),
    t("ra-demo", ["4e-grec-langue", "6e-francais-vocabulaire"], "dém(o)-", "Racine grecque qui signifie « peuple »"),
    t("ra-poly", ["4e-grec-langue", "6e-francais-vocabulaire"], "poly-", "Racine grecque qui signifie « plusieurs, nombreux »"),
    t("ra-micro", ["4e-grec-langue", "6e-francais-vocabulaire"], "micro-", "Racine grecque qui signifie « petit »"),
    t("ra-tele", ["4e-grec-langue", "6e-francais-vocabulaire"], "télé-", "Racine grecque qui signifie « loin »"),
    t("ra-phon", ["4e-grec-langue", "6e-francais-vocabulaire"], "phon-", "Racine grecque qui signifie « voix, son »"),
    t("ra-photo", ["4e-grec-langue", "6e-francais-vocabulaire"], "photo-", "Racine grecque qui signifie « lumière »"),
    t("ra-auto", ["4e-grec-langue", "6e-francais-vocabulaire"], "auto-", "Racine grecque qui signifie « soi-même »"),
    t("ra-anthropo", ["4e-grec-langue", "6e-francais-vocabulaire"], "anthrop(o)-", "Racine grecque qui signifie « être humain »"),
    t("ra-cratie", ["4e-grec-langue", "6e-francais-vocabulaire"], "-cratie", "Racine grecque qui signifie « pouvoir »"),
    t("ra-aqua", ["4e-latin-langue", "6e-francais-vocabulaire"], "aqu-", "Racine latine qui signifie « eau »"),
    t("ra-vore", ["4e-latin-langue", "6e-francais-vocabulaire"], "-vore", "Racine latine qui signifie « qui mange »"),
    t("ra-omni", ["4e-latin-langue", "6e-francais-vocabulaire"], "omni-", "Racine latine qui signifie « tout »"),
    t("ra-cide", ["4e-latin-langue", "6e-francais-vocabulaire"], "-cide", "Racine latine qui signifie « qui tue »"),
    t("ra-manu", ["4e-latin-langue", "6e-francais-vocabulaire"], "manu-", "Racine latine qui signifie « main »"),
    t("ra-bene", ["4e-latin-langue", "6e-francais-vocabulaire"], "béné-", "Racine latine qui signifie « bien »"),
    t("ra-multi", ["4e-latin-langue", "6e-francais-vocabulaire"], "multi-", "Racine latine qui signifie « nombreux »"),

    t("my-zeus", MYTHE, "Zeus", "Roi des dieux grecs, maître du ciel et de la foudre, nommé Jupiter par les Romains"),
    t("my-hera", MYTHE, "Héra", "Épouse de Zeus, protectrice du mariage, nommée Junon par les Romains"),
    t("my-athena", MYTHE, "Athéna", "Déesse grecque de la sagesse et de la guerre, protectrice d'Athènes, nommée Minerve par les Romains"),
    t("my-poseidon", MYTHE, "Poséidon", "Dieu grec de la mer, nommé Neptune par les Romains"),
    t("my-hermes", MYTHE, "Hermès", "Messager des dieux grecs, dieu des voyageurs et des marchands, nommé Mercure par les Romains"),
    t("my-aphrodite", MYTHE, "Aphrodite", "Déesse grecque de l'amour et de la beauté, nommée Vénus par les Romains"),
    t("my-ares", MYTHE, "Arès", "Dieu grec de la guerre, nommé Mars par les Romains"),
    t("my-apollon", MYTHE, "Apollon", "Dieu grec de la lumière, des arts et de la divination"),
    t("my-artemis", MYTHE, "Artémis", "Déesse grecque de la chasse, sœur jumelle d'Apollon, nommée Diane par les Romains"),
    t("my-hephaistos", MYTHE, "Héphaïstos", "Dieu grec forgeron, maître du feu, nommé Vulcain par les Romains"),
    t("my-hades", MYTHE, "Hadès", "Dieu grec des Enfers, nommé Pluton par les Romains"),
    t("my-demeter", MYTHE, "Déméter", "Déesse grecque des moissons, nommée Cérès par les Romains"),
    t("my-dionysos", MYTHE, "Dionysos", "Dieu grec de la vigne, du vin et du théâtre, nommé Bacchus par les Romains"),

    p("pa-ulysse", [...MYTHE, "2nde-latin-mediterranee", "2nde-grec-mediterranee"], "Ulysse", "roi d'Ithaque, héros rusé de l'Odyssée qui mit dix ans à rentrer chez lui"),
    p("pa-achille", MYTHE, "Achille", "héros grec de la guerre de Troie, invulnérable sauf au talon"),
    p("pa-heracles", MYTHE, "Héraclès", "héros grec aux douze travaux, nommé Hercule par les Romains"),
    p("pa-thesee", MYTHE, "Thésée", "héros athénien vainqueur du Minotaure dans le labyrinthe"),
    p("pa-persee", MYTHE, "Persée", "héros grec qui trancha la tête de la Gorgone Méduse"),
    p("pa-enee", [...MYTHE, "5e-latin-legende", "4e-latin-legende"], "Énée", "héros troyen, ancêtre légendaire des Romains, chanté par Virgile"),
    p("pa-romulus", ["5e-latin-legende", "4e-latin-legende", "6e-hg-mediterranee"], "Romulus", "fondateur légendaire de Rome, frère jumeau de Rémus"),
    p("pa-orphee", ["2nde-latin-divin", "2nde-grec-divin", "1re-llca-amour"], "Orphée", "musicien qui descendit aux Enfers pour ramener Eurydice"),
    p("pa-promethee", ["Tle-latin-inventer", "Tle-grec-inventer", "3e-grec-mythe"], "Prométhée", "titan qui vola le feu aux dieux pour le donner aux hommes"),
    p("pa-ciceron", ["3e-latin-principat", "1re-latin-cite", "1re-llca-justice"], "Cicéron", "orateur et homme politique romain, auteur des Catilinaires"),
    p("pa-hannibal", ["4e-latin-legende"], "Hannibal", "général carthaginois qui franchit les Alpes avec des éléphants pendant la deuxième guerre punique"),
    p("pa-spartacus", ["3e-latin-principat", "4e-latin-vie"], "Spartacus", "gladiateur qui mena une grande révolte d'esclaves contre Rome"),
    p("pa-alexandre", ["3e-grec-unite", "2nde-grec-autre"], "Alexandre le Grand", "roi de Macédoine qui conquit un empire jusqu'à l'Indus"),
    p("pa-herodote", ["3e-grec-unite", "3e-grec-mythe"], "Hérodote", "historien grec surnommé « le père de l'histoire »"),
    p("pa-homere", ["3e-grec-mythe", "5e-grec-legende", "6e-francais-culture"], "Homère", "poète grec auquel on attribue l'Iliade et l'Odyssée"),
    p("pa-virgile", ["5e-latin-legende", "1re-llca-amour", "Tle-llca-destin"], "Virgile", "poète latin, auteur de l'Énéide"),
    p("pa-ovide", ["2nde-latin-animal", "1re-latin-masculin"], "Ovide", "poète latin, auteur des Métamorphoses"),
    p("pa-seneque", ["Tle-latin-sagesse", "Tle-llca-croire"], "Sénèque", "philosophe stoïcien, précepteur de Néron"),
    p("pa-pline", ["Tle-latin-comprendre", "4e-latin-vie"], "Pline l'Ancien", "naturaliste romain mort lors de l'éruption du Vésuve"),
    p("pa-sappho", ["1re-grec-masculin", "1re-llca-amour"], "Sappho", "poétesse grecque de Lesbos"),
    p("pa-sophocle", ["1re-llca-justice", "1re-grec-cite"], "Sophocle", "auteur tragique athénien d'Antigone et d'Œdipe roi"),
    p("pa-archimede", ["Tle-grec-comprendre", "Tle-grec-inventer"], "Archimède", "savant de Syracuse, célèbre pour son principe sur les corps plongés dans un liquide"),
    p("pa-euclide", ["Tle-grec-comprendre"], "Euclide", "mathématicien grec, auteur des Éléments de géométrie"),
    p("pa-hippocrate", ["Tle-grec-comprendre", "Tle-latin-comprendre"], "Hippocrate", "médecin grec, à l'origine du serment que prêtent encore les médecins"),
    p("pa-nero", ["3e-latin-empire"], "Néron", "empereur romain accusé de l'incendie de Rome en 64"),

    d("a-republique", ["4e-latin-legende", "5e-latin-legende"], "Fondation de la République romaine selon la tradition", -509),
    d("a-punique", ["4e-latin-legende"], "Début de la première guerre punique", -264),
    d("a-cannes", ["4e-latin-legende"], "Victoire d'Hannibal à Cannes", -216),
    d("a-carthage", ["4e-latin-legende", "1re-latin-mediterranee"], "Destruction de Carthage par Rome", -146),
    d("a-spartacus", ["3e-latin-principat"], "Début de la révolte de Spartacus", -73),
    d("a-cesar", ["3e-latin-principat"], "Assassinat de Jules César", -44, "15 mars 44 av. J.-C."),
    d("a-actium", ["3e-latin-principat"], "Bataille d'Actium", -31),
    d("a-incendie", ["3e-latin-empire"], "Grand incendie de Rome sous Néron", 64),
    d("a-salamine", ["3e-grec-unite"], "Victoire grecque de Salamine sur les Perses", -480),
    d("a-peloponnese", ["3e-grec-unite"], "Début de la guerre du Péloponnèse", -431),
    d("a-alexandre", ["3e-grec-unite"], "Mort d'Alexandre le Grand", -323),
    d("a-marathon", ["3e-grec-unite", "5e-grec-legende"], "Bataille de Marathon", -490),
    d("a-jo", ["5e-grec-vie", "4e-grec-vie"], "Premiers Jeux olympiques selon la tradition", -776),
  ],
};
