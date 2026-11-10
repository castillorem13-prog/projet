import type { Fact, FactSet } from "../types";

/** Faits d'arts plastiques, d'éducation musicale, d'EPS et d'EPPCS. */

const w = (id: string, units: string[], author: string, title: string, year?: number): Fact => ({ kind: "work", id, units, author, title, ...(year ? { year } : {}) });
const t = (id: string, units: string[], term: string, definition: string): Fact => ({ kind: "term", id, units, term, definition });
const c = (id: string, units: string[], set: string, item: string, category: string): Fact => ({ kind: "class", id, units, set, item, category });
const d = (id: string, units: string[], label: string, year: number, when?: string): Fact => ({ kind: "date", id, units, label, year, ...(when ? { when } : {}) });
const p = (id: string, units: string[], name: string, role: string): Fact => ({ kind: "person", id, units, name, role });

const ARTS = ["6e-arts-representation", "5e-arts-representation", "4e-arts-oeuvre", "3e-arts-oeuvre", "2nde-arts-pratique", "1re-arts-spe-transversaux", "Tle-arts-spe-transversaux"];
const ARTS_MAT = ["6e-arts-fabrication", "6e-arts-materialite", "5e-arts-matiere", "3e-arts-projet", "1re-arts-spe-plasticiens", "Tle-arts-spe-plasticiens"];
const MUS = ["6e-musique-ecouter", "5e-musique-ecouter", "4e-musique-ecouter", "3e-musique-ecouter", "3e-musique-projet"];
const MUS_CREER = ["6e-musique-chanter", "6e-musique-creer", "5e-musique-creer"];
const EPS = ["6e-eps-performance", "5e-eps-performance", "4e-eps-sante", "3e-eps-sante", "2nde-eps-entretien", "1re-eps-entretien", "Tle-eps-entretien", "1re-eppcs-corps", "1re-eppcs-sante"];
const EPS_JEU = ["6e-eps-affrontement", "5e-eps-affrontement", "4e-eps-affrontement", "3e-eps-affrontement", "2nde-eps-affrontement"];
const EPPCS = ["1re-eppcs-corps", "1re-eppcs-sante", "1re-eppcs-technologie", "1re-eppcs-evenement", "Tle-eppcs-enjeux", "Tle-eppcs-technologie", "Tle-eppcs-animation"];

export const ARTS_FACTS: FactSet = {
  id: "faits-arts",
  subject: "arts",
  title: "Arts plastiques et éducation musicale : œuvres, notions, repères",
  status: "needs_review",
  sources: [
    { id: "c3-2020", label: "Programmes d'arts plastiques et d'éducation musicale des cycles 3 et 4, BO n° 31 du 30 juillet 2020", url: "https://eduscol.education.gouv.fr/4362/enseigner-au-cycle-4" },
    { id: "lycee-arts", label: "Programmes d'arts plastiques du lycée (2019)", url: "https://eduscol.education.gouv.fr/4368/enseigner-au-lycee-generaltechnologique" },
    { id: "musees", label: "Notices des musées conservant les œuvres (Louvre, Orsay, Reina Sofía, MoMA…)", url: "https://collections.louvre.fr" },
  ],
  sets: {
    instrument: { prompt: "À quelle famille de l'orchestre appartient cet instrument ?", categories: ["Cordes", "Bois", "Cuivres", "Percussions"] },
  },
  facts: [
    w("a-joconde", ARTS, "Léonard de Vinci", "La Joconde"),
    w("a-liberte", ARTS, "Eugène Delacroix", "La Liberté guidant le peuple", 1830),
    w("a-guernica", [...ARTS, "Tle-hggsp-guerre-paix"], "Pablo Picasso", "Guernica", 1937),
    w("a-fontaine", [...ARTS, ...ARTS_MAT], "Marcel Duchamp", "Fontaine", 1917),
    w("a-impression", ARTS, "Claude Monet", "Impression, soleil levant", 1872),
    w("a-meduse", ARTS, "Théodore Géricault", "Le Radeau de la Méduse", 1819),
    w("a-nuit-etoilee", ARTS, "Vincent van Gogh", "La Nuit étoilée", 1889),
    w("a-cri", ARTS, "Edvard Munch", "Le Cri", 1893),
    w("a-campbell", ARTS, "Andy Warhol", "Campbell's Soup Cans", 1962),
    w("a-dejeuner", ARTS, "Édouard Manet", "Le Déjeuner sur l'herbe", 1863),
    w("a-pipe", ARTS, "René Magritte", "La Trahison des images", 1929),
    w("a-perle", ARTS, "Johannes Vermeer", "La Jeune Fille à la perle"),
    w("a-pont-neuf", [...ARTS, ...ARTS_MAT], "Christo et Jeanne-Claude", "Le Pont-Neuf emballé", 1985),
    w("m-9e", MUS, "Ludwig van Beethoven", "Symphonie n° 9", 1824),
    w("m-saisons", MUS, "Antonio Vivaldi", "Les Quatre Saisons", 1725),
    w("m-bolero", MUS, "Maurice Ravel", "Boléro", 1928),
    w("m-flute", MUS, "Wolfgang Amadeus Mozart", "La Flûte enchantée", 1791),
    w("m-carnaval", MUS, "Camille Saint-Saëns", "Le Carnaval des animaux", 1886),
    w("m-pierre", MUS, "Sergueï Prokofiev", "Pierre et le Loup", 1936),
    w("m-carmen", MUS, "Georges Bizet", "Carmen", 1875),
    w("m-sacre", MUS, "Igor Stravinsky", "Le Sacre du printemps", 1913),
    w("m-messie", MUS, "Georg Friedrich Haendel", "Le Messie", 1742),
    w("m-nouveau-monde", MUS, "Antonín Dvořák", "Symphonie du Nouveau Monde", 1893),
    w("m-rhapsody", MUS, "George Gershwin", "Rhapsody in Blue", 1924),

    t("t-readymade", [...ARTS, ...ARTS_MAT], "Ready-made", "Objet manufacturé choisi par l'artiste et exposé comme œuvre d'art"),
    t("t-installation", [...ARTS_MAT, "4e-arts-oeuvre"], "Installation", "Œuvre qui occupe et transforme un espace dans lequel le spectateur peut circuler"),
    t("t-performance", [...ARTS_MAT, "1re-arts-spe-interdisciplinaires"], "Performance", "Action réalisée par un artiste devant un public, qui constitue l'œuvre"),
    t("t-collage", ARTS_MAT, "Collage", "Technique qui assemble sur un support des fragments de matériaux divers"),
    t("t-nature-morte", ARTS, "Nature morte", "Représentation d'objets inanimés : fruits, fleurs, vaisselle"),
    t("t-autoportrait", [...ARTS, "5e-arts-representation"], "Autoportrait", "Portrait que l'artiste fait de lui-même"),
    t("t-clair-obscur", ARTS, "Clair-obscur", "Contraste marqué entre des zones éclairées et des zones sombres"),
    t("t-perspective", ARTS, "Perspective", "Technique qui donne l'illusion de la profondeur sur une surface plane"),
    t("t-composition", ARTS, "Composition", "Organisation des formes, des couleurs et des lignes dans une œuvre"),
    t("t-cadrage", ["5e-arts-representation", "1re-arts-spe-interdisciplinaires"], "Cadrage", "Choix de ce qui apparaît à l'intérieur des limites de l'image"),
    t("t-plongee", ["5e-arts-representation", "1re-arts-spe-interdisciplinaires"], "Plongée", "Prise de vue du haut vers le bas"),
    t("t-contre-plongee", ["5e-arts-representation", "1re-arts-spe-interdisciplinaires"], "Contre-plongée", "Prise de vue du bas vers le haut"),
    t("t-land-art", ARTS_MAT, "Land art", "Art qui crée des œuvres dans la nature, avec ses matériaux"),
    t("t-abstraction", [...ARTS, "1re-arts-spe-plasticiens"], "Art abstrait", "Art qui ne cherche pas à représenter la réalité visible"),
    t("t-monochrome", ARTS_MAT, "Monochrome", "Œuvre réalisée avec une seule couleur"),
    t("t-tempo", [...MUS, ...MUS_CREER], "Tempo", "Vitesse d'exécution d'un morceau de musique"),
    t("t-pulsation", [...MUS, ...MUS_CREER], "Pulsation", "Battement régulier qui sert de repère au rythme"),
    t("t-timbre", MUS, "Timbre", "Couleur propre d'un son, qui permet de reconnaître un instrument ou une voix"),
    t("t-nuance", MUS, "Nuance", "Indication d'intensité sonore, du très doux (pianissimo) au très fort (fortissimo)"),
    t("t-crescendo", MUS, "Crescendo", "Augmentation progressive de l'intensité sonore"),
    t("t-ostinato", [...MUS, ...MUS_CREER], "Ostinato", "Motif mélodique ou rythmique répété de façon obstinée"),
    t("t-canon", [...MUS_CREER, ...MUS], "Canon", "Chant où plusieurs voix chantent la même mélodie en décalé"),
    t("t-refrain", MUS_CREER, "Refrain", "Partie d'une chanson qui revient à l'identique entre les couplets"),
    t("t-melodie", MUS, "Mélodie", "Suite de sons de hauteurs différentes, organisée dans le temps"),
    t("t-soliste", MUS, "Soliste", "Musicien qui joue ou chante seul une partie mise en valeur"),

    c("cl-violon", MUS, "instrument", "Le violon", "Cordes"),
    c("cl-violoncelle", MUS, "instrument", "Le violoncelle", "Cordes"),
    c("cl-contrebasse", MUS, "instrument", "La contrebasse", "Cordes"),
    c("cl-flute", MUS, "instrument", "La flûte traversière", "Bois"),
    c("cl-clarinette", MUS, "instrument", "La clarinette", "Bois"),
    c("cl-hautbois", MUS, "instrument", "Le hautbois", "Bois"),
    c("cl-basson", MUS, "instrument", "Le basson", "Bois"),
    c("cl-trompette", MUS, "instrument", "La trompette", "Cuivres"),
    c("cl-trombone", MUS, "instrument", "Le trombone", "Cuivres"),
    c("cl-cor", MUS, "instrument", "Le cor", "Cuivres"),
    c("cl-tuba", MUS, "instrument", "Le tuba", "Cuivres"),
    c("cl-timbales", MUS, "instrument", "Les timbales", "Percussions"),
    c("cl-xylophone", MUS, "instrument", "Le xylophone", "Percussions"),
    c("cl-grosse-caisse", MUS, "instrument", "La grosse caisse", "Percussions"),

    p("pa-delacroix", ARTS, "Eugène Delacroix", "peintre romantique de La Liberté guidant le peuple"),
    p("pa-monet", ARTS, "Claude Monet", "peintre dont un tableau donna son nom à l'impressionnisme"),
    p("pa-picasso", ARTS, "Pablo Picasso", "peintre espagnol, cofondateur du cubisme"),
    p("pa-duchamp", ARTS, "Marcel Duchamp", "artiste qui inventa le ready-made"),
    p("pa-mozart", MUS, "Wolfgang Amadeus Mozart", "compositeur autrichien, enfant prodige, auteur de La Flûte enchantée"),
    p("pa-beethoven", MUS, "Ludwig van Beethoven", "compositeur allemand qui continua à composer en devenant sourd"),
  ],
};

export const EPS_FACTS: FactSet = {
  id: "faits-eps",
  subject: "eps",
  title: "EPS et EPPCS : notions, repères",
  status: "needs_review",
  sources: [
    { id: "c4-2020", label: "Programmes d'EPS des cycles 3 et 4, BO n° 31 du 30 juillet 2020", url: "https://eduscol.education.gouv.fr/4362/enseigner-au-cycle-4" },
    { id: "eppcs-2021", label: "Spécialité EPPCS, BO n° 25 du 24 juin 2021", url: "https://www.education.gouv.fr/bo/21/Hebdo25/MENE2116606A.htm" },
    { id: "oms", label: "Organisation mondiale de la santé, recommandations sur l'activité physique", url: "https://www.who.int/fr/news-room/fact-sheets/detail/physical-activity" },
  ],
  sets: {
    sport: { prompt: "Sport collectif ou sport individuel ?", categories: ["Collectif", "Individuel"] },
  },
  facts: [
    t("e-echauffement", EPS, "Échauffement", "Activité progressive qui prépare le corps à l'effort et limite les blessures"),
    t("e-recuperation", EPS, "Récupération", "Période qui permet à l'organisme de revenir à son état de repos après l'effort"),
    t("e-fc", EPS, "Fréquence cardiaque", "Nombre de battements du cœur par minute"),
    t("e-endurance", EPS, "Endurance", "Capacité à maintenir un effort prolongé"),
    t("e-vma", ["4e-eps-sante", "3e-eps-sante", "2nde-eps-entretien", "1re-eppcs-corps"], "VMA", "Vitesse maximale aérobie : vitesse de course à partir de laquelle la consommation d'oxygène est maximale"),
    t("e-sedentarite", ["1re-eppcs-sante", "Tle-eps-entretien", "1re-eps-entretien"], "Sédentarité", "Temps passé en position assise ou allongée, avec une très faible dépense d'énergie"),
    t("e-fairplay", EPS_JEU, "Fair-play", "Respect des règles, de l'adversaire et de l'arbitre"),
    t("e-arbitre", EPS_JEU, "Arbitre", "Personne qui fait respecter les règles du jeu"),
    t("e-tactique", EPS_JEU, "Tactique", "Choix d'action adapté à une situation de jeu, pendant le match"),
    t("e-strategie", EPS_JEU, "Stratégie", "Plan d'action préparé avant la rencontre"),
    t("e-choregraphie", ["6e-eps-expression", "1re-arts-spe-interdisciplinaires"], "Chorégraphie", "Composition d'une suite de mouvements dansés"),
    t("e-voltigeur", ["6e-eps-expression"], "Voltigeur", "En acrosport, gymnaste porté par un ou plusieurs partenaires"),
    t("e-porteur", ["6e-eps-expression"], "Porteur", "En acrosport, gymnaste qui soutient un partenaire"),
    t("e-balise", ["6e-eps-deplacements"], "Balise", "En course d'orientation, point de passage à trouver grâce à la carte"),
    t("e-imc", ["1re-eppcs-sante", "1re-eppcs-corps"], "IMC", "Indice de masse corporelle : masse divisée par la taille au carré"),

    c("cl-handball", EPS_JEU, "sport", "Le handball", "Collectif"),
    c("cl-basket", EPS_JEU, "sport", "Le basket-ball", "Collectif"),
    c("cl-volley", EPS_JEU, "sport", "Le volley-ball", "Collectif"),
    c("cl-rugby", EPS_JEU, "sport", "Le rugby", "Collectif"),
    c("cl-natation", EPS_JEU, "sport", "La natation", "Individuel"),
    c("cl-haies", EPS_JEU, "sport", "La course de haies", "Individuel"),
    c("cl-gym", EPS_JEU, "sport", "La gymnastique au sol", "Individuel"),
    c("cl-escalade", EPS_JEU, "sport", "L'escalade", "Individuel"),

    d("e-jo1896", [...EPPCS, "6e-eps-performance"], "Premiers Jeux olympiques modernes à Athènes", 1896),
    d("e-tour", EPPCS, "Premier Tour de France cycliste", 1903),
    d("e-jo1924", EPPCS, "Jeux olympiques de Paris (deuxième édition parisienne)", 1924),
    d("e-coupe-monde", EPPCS, "Première Coupe du monde de football, en Uruguay", 1930),
    d("e-paralympiques", EPPCS, "Premiers Jeux paralympiques, à Rome", 1960),
    d("e-jo2024", [...EPPCS, "6e-eps-performance"], "Jeux olympiques et paralympiques de Paris", 2024),
    p("pe-coubertin", EPPCS, "Pierre de Coubertin", "rénovateur des Jeux olympiques modernes"),
    p("pe-guttmann", EPPCS, "Ludwig Guttmann", "médecin à l'origine des Jeux paralympiques"),
  ],
};
