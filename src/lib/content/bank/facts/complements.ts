import type { Fact, FactSet } from "../types";

/**
 * Compléments de la banque : les faits ajoutés pour que chaque unité du programme ait de quoi s'entraîner.
 *  - EXTRA_UNITS rattache un fait déjà présent à d'autres unités où il est aussi au programme ;
 *  - EXTRA_FACTS ajoute des faits aux lots existants (les pièges restent ainsi dans le même domaine) ;
 *  - NEW_SETS ouvre les lots qui manquaient (méthode en français, humanités).
 * Comme le reste de la banque, ces contenus sont au statut « à relire » tant qu'un enseignant ne les a pas validés.
 */

const d = (id: string, units: string[], label: string, year: number, when?: string): Fact => ({ kind: "date", id, units, label, year, ...(when ? { when } : {}) });
const p = (id: string, units: string[], name: string, role: string): Fact => ({ kind: "person", id, units, name, role });
const t = (id: string, units: string[], term: string, definition: string): Fact => ({ kind: "term", id, units, term, definition });
const c = (id: string, units: string[], set: string, item: string, category: string): Fact => ({ kind: "class", id, units, set, item, category });
const w = (id: string, units: string[], author: string, title: string, year?: number): Fact => ({ kind: "work", id, units, author, title, ...(year ? { year } : {}) });

/* ——— Unités ——— */
const METRO6 = "6e-hg-metropole", PROD3 = "3e-hg-productifs", AMEN3 = "3e-hg-amenager", PROD1 = "1re-hg-production", RURAL1 = "1re-hg-rural", CHINE1 = "1re-hg-chine", FRANCE_T = "Tle-hg-france";
const INFO = "1re-hggsp-informer", PATRI = "Tle-hggsp-patrimoine", CONN = "Tle-hggsp-connaissance";
const AGIR6 = "6e-emc-agir", DEPL6 = "6e-eps-deplacements";
const USAGES5 = "5e-techno-usages", USAGES4 = "4e-techno-usages", USAGES3 = "3e-techno-usages", INNOVER = "1re-si-innover", PROJET_SI = "Tle-si-projet";
const ECRIRE6 = "6e-francais-ecrire", ORAL6 = "6e-francais-oral", ECRIRE5 = "5e-francais-ecrire", ORAL5 = "5e-francais-oral", BREVET = "3e-francais-brevet", VILLE4 = "4e-francais-ville";
const PAROLE = "1re-hlp-parole", MONDE = "1re-hlp-monde", HUMANITE = "Tle-hlp-humanite";
const INCONSCIENT = "Tle-philo-inconscient", TEMPS = "Tle-philo-temps";
const PLANTES = "Tle-svt-plantes", MATIERE = "1re-ens-sci-matiere";
const PROJET_ARTS = ["1re-arts-spe-projet", "Tle-arts-spe-projet"];

const VIE_LA = ["5e-latin-vie", "3e-latin-vie"];
const VIE_GR = ["5e-grec-vie", "4e-grec-vie", "3e-grec-vie"];
const MED_LA = ["5e-latin-mediterranee", "4e-latin-mediterranee", "3e-latin-mediterranee", "2nde-latin-mediterranee", "1re-latin-mediterranee", "Tle-latin-mediterranee"];
const MED_GR = ["5e-grec-mediterranee", "4e-grec-mediterranee", "3e-grec-mediterranee", "2nde-grec-mediterranee", "1re-grec-mediterranee", "Tle-grec-mediterranee"];
const MED_LLCA = ["1re-llca-mediterranee", "Tle-llca-mediterranee"];
const MED = [...MED_LA, ...MED_GR, ...MED_LLCA];
const ANIMAL = ["2nde-latin-animal", "2nde-grec-animal"];
const AUTRE = ["2nde-latin-autre", "2nde-grec-autre"];
const CITE_LA = ["1re-latin-cite", "1re-llca-cite"];
const CITE_GR = ["1re-grec-cite", "1re-llca-cite"];
const MASCULIN = ["1re-latin-masculin", "1re-grec-masculin"];
const SAGESSE = ["Tle-latin-sagesse", "Tle-grec-sagesse", "Tle-llca-croire"];
const INVENTER = ["Tle-latin-inventer", "Tle-grec-inventer"];
const LEGENDE_GR4 = "4e-grec-legende";

/** Faits déjà présents dans la banque, rattachés à d'autres unités où ils sont aussi au programme. */
export const EXTRA_UNITS: Record<string, string[]> = {
  /* Géographie */
  "g-metropole": [METRO6], "g-megalopole": [METRO6, CHINE1], "g-periurbain": [METRO6, RURAL1], "g-ville-mondiale": [METRO6],
  "g-espace-productif": [PROD3, PROD1], "g-mondialisation": [PROD1], "g-flux": [PROD1], "g-hub": [PROD1],
  "g-amenagement": [AMEN3, FRANCE_T], "g-faible-densite": [RURAL1], "g-pekin": [CHINE1], "g-facade": [CHINE1, FRANCE_T],
  "g-metropolisation": [FRANCE_T, CHINE1], "g-schengen": [FRANCE_T],
  /* HGGSP : s'informer, patrimoine, connaissance */
  "e-desinformation": [INFO], "e-liberte-presse": [INFO], "e-pluralisme": [INFO], "e-1881": [INFO],
  "h-gutenberg": [INFO, CONN], "h-jaccuse": [INFO], "h-wikipedia": [INFO, CONN],
  "n-patrimoine": [PATRI], "n-memoire": [PATRI], "h-unesco-patrimoine": [PATRI], "h-notre-dame": [PATRI],
  "h-ferry-gratuite": [CONN], "h-spoutnik": [CONN], "h-encyclopedie": [CONN],
  /* EMC, EPS, technologie */
  "e-engagement": [AGIR6], "e-fraternite": [AGIR6], "e-deliberation": [AGIR6], "e-balise": [DEPL6],
  "nu-cycle-vie": [USAGES3, USAGES4], "nu-cahier": [USAGES4, INNOVER, PROJET_SI], "nu-prototype": [INNOVER, PROJET_SI, USAGES5],
  /* Français : la ville */
  "o-bonheur": [VILLE4], "o-goriot": [VILLE4], "o-bel-ami": [VILLE4], "o-miserables": [VILLE4], "o-assommoir": [VILLE4], "o-fleurs": [VILLE4], "o-alcools": [VILLE4],
  /* Philosophie */
  "pr-inconscient": [INCONSCIENT], "pp-freud": [INCONSCIENT], "pp-sartre": [INCONSCIENT], "ph-reve": [INCONSCIENT],
  "pp-bergson": [TEMPS], "pp-kant": [TEMPS], "ph-evolution-creatrice": [TEMPS],
  /* Sciences */
  "sv-domestication": [PLANTES], "sv-selection": [PLANTES], "sv-biodiversite": [PLANTES], "sv-agrosysteme": [PLANTES], "sv-mutation": [PLANTES],
  "ph-element": [MATIERE], "ph-fusion-nucl": [MATIERE], "ph-isotopes": [MATIERE], "ph-noyau": [MATIERE],
  "pe-mendeleiev": [MATIERE], "pe-curie": [MATIERE], "dt-mendeleiev": [MATIERE], "dt-becquerel": [MATIERE], "dt-rutherford": [MATIERE],
  /* Arts */
  "t-installation": PROJET_ARTS, "t-performance": PROJET_ARTS, "t-composition": PROJET_ARTS,
  /* Antiquité */
  "pa-achille": [LEGENDE_GR4], "pa-heracles": [LEGENDE_GR4, ...ANIMAL], "pa-thesee": [LEGENDE_GR4, ...ANIMAL], "pa-persee": [LEGENDE_GR4], "pa-homere": [LEGENDE_GR4, ...VIE_GR],
  "my-zeus": [LEGENDE_GR4], "my-athena": [LEGENDE_GR4], "my-poseidon": [LEGENDE_GR4], "my-apollon": [LEGENDE_GR4],
  "a-marathon": [LEGENDE_GR4, ...MED_GR], "a-salamine": [LEGENDE_GR4, ...MED_GR, ...MED_LLCA], "a-jo": [LEGENDE_GR4, "3e-grec-vie"],
  "a-punique": MED_LA, "a-carthage": [...MED_LA.filter((u) => u !== "1re-latin-mediterranee"), ...MED_LLCA], "a-actium": MED_LA, "a-alexandre": MED_GR,
  "a-republique": CITE_LA, "a-cesar": CITE_LA,
  "pa-ulysse": [...MED_GR.filter((u) => u !== "2nde-grec-mediterranee"), ...MED_LA.filter((u) => u !== "2nde-latin-mediterranee")],
  "pa-enee": MED_LA, "pa-hannibal": MED_LA, "pa-alexandre": MED_GR, "pa-herodote": [...AUTRE, ...MED_GR],
  "pa-pline": ["3e-latin-vie", "Tle-latin-inventer"], "pa-seneque": ["3e-latin-vie"], "pa-spartacus": ["3e-latin-vie"],
  "pa-archimede": ["Tle-latin-inventer"], "pa-ovide": ["2nde-grec-animal"], "pa-sappho": ["1re-latin-masculin"],
  "pa-ciceron": ["1re-grec-cite"], "pa-sophocle": ["1re-latin-cite"],
};

/** Faits ajoutés aux lots existants, par identifiant de lot. */
export const EXTRA_FACTS: Record<string, Fact[]> = {
  "faits-geographie": [
    t("gx-banlieue", [METRO6], "Banlieue", "Ensemble des communes urbanisées qui entourent la ville-centre"),
    t("gx-bidonville", [METRO6], "Bidonville", "Quartier d'habitat précaire, construit par ses habitants avec des matériaux de récupération"),
    t("gx-cbd", [METRO6], "Quartier des affaires", "Quartier d'une grande ville où se concentrent les bureaux et les sièges des entreprises"),
    t("gx-etalement", [METRO6, RURAL1], "Étalement urbain", "Extension d'une ville sur les espaces ruraux qui l'entourent"),
    t("gx-ecoquartier", [METRO6], "Écoquartier", "Quartier conçu pour limiter son impact sur l'environnement"),
    t("gx-technopole", [PROD3], "Technopôle", "Parc d'activités qui réunit des entreprises de haute technologie, des laboratoires de recherche et des universités"),
    t("gx-productiviste", [PROD3], "Agriculture productiviste", "Agriculture qui cherche les plus hauts rendements grâce aux machines, aux engrais et à la sélection"),
    t("gx-desindustrialisation", [PROD3], "Désindustrialisation", "Recul de la part de l'industrie dans l'emploi et la production d'un territoire"),
    t("gx-delocalisation", [PROD3, PROD1], "Délocalisation", "Transfert d'une activité vers un autre pays pour en réduire les coûts"),
    t("gx-tertiaire", [PROD3], "Secteur tertiaire", "Ensemble des activités de services : commerce, transport, santé, enseignement"),
    t("gx-reconversion", [PROD3], "Reconversion", "Passage d'un territoire en crise à de nouvelles activités"),
    t("gx-collectivite", [AMEN3], "Collectivité territoriale", "Commune, département ou région, administrés par des élus et dotés de compétences propres"),
    t("gx-enclavement", [AMEN3], "Enclavement", "Situation d'un territoire mal relié aux autres par les transports"),
    t("gx-inegalites", [AMEN3], "Inégalités territoriales", "Écarts de richesse, d'emploi ou d'accès aux services entre des territoires"),
    t("gx-decentralisation", [AMEN3], "Décentralisation", "Transfert de compétences de l'État vers les collectivités territoriales"),
    t("gx-intercommunalite", [AMEN3], "Intercommunalité", "Regroupement de communes qui gèrent ensemble certains services"),
    t("gx-chaine-valeur", [PROD1], "Chaîne de valeur", "Suite des étapes de conception, de fabrication et de vente d'un produit, réparties entre plusieurs lieux"),
    t("gx-ftn", [PROD1], "Firme transnationale", "Entreprise implantée dans plusieurs pays par ses filiales"),
    t("gx-dit", [PROD1], "Division internationale du travail", "Répartition des étapes de la production entre des pays qui se spécialisent"),
    t("gx-relocalisation", [PROD1], "Relocalisation", "Retour dans son pays d'origine d'une activité qui avait été installée à l'étranger"),
    t("gx-cluster", [PROD1], "Cluster", "Réseau d'entreprises et de centres de recherche d'un même secteur, regroupés sur un territoire"),
    t("gx-multifonction", [RURAL1], "Multifonctionnalité", "Fait pour un espace d'accueillir plusieurs fonctions : agricole, résidentielle, touristique, environnementale"),
    t("gx-neoruraux", [RURAL1], "Néoruraux", "Citadins venus s'installer à la campagne"),
    t("gx-deprise", [RURAL1], "Déprise rurale", "Recul de la population et des activités dans un espace rural"),
    t("gx-agritourisme", [RURAL1], "Agritourisme", "Tourisme pratiqué dans une exploitation agricole"),
    t("gx-conflit-usage", [RURAL1], "Conflit d'usage", "Désaccord entre des acteurs qui veulent utiliser un même espace de façons différentes"),
    t("gx-littoralisation", [CHINE1], "Littoralisation", "Concentration des habitants et des activités sur les littoraux"),
    t("gx-zes", [CHINE1], "Zone économique spéciale", "Territoire où un État accorde des avantages fiscaux et douaniers pour attirer les entreprises étrangères"),
    t("gx-hukou", [CHINE1], "Hukou", "Livret de résidence chinois, qui rattache chaque habitant à son lieu d'origine et conditionne ses droits sociaux"),
    t("gx-mingong", [CHINE1], "Mingong", "Travailleur chinois venu de la campagne pour travailler en ville"),
    t("gx-routes-soie", [CHINE1], "Nouvelles routes de la soie", "Projet chinois, lancé en 2013, de liaisons terrestres et maritimes vers l'Asie, l'Europe et l'Afrique"),
    t("gx-attractivite", [FRANCE_T], "Attractivité", "Capacité d'un territoire à attirer des habitants, des entreprises et des touristes"),
    t("gx-transfrontalier", [FRANCE_T], "Région transfrontalière", "Région dont la vie quotidienne et l'économie sont tournées vers le pays voisin"),
    t("gx-cohesion", [FRANCE_T], "Politique de cohésion", "Politique de l'Union européenne qui finance des projets pour réduire les écarts entre ses régions"),
    t("gx-diagonale", [FRANCE_T], "Diagonale des faibles densités", "Bande de territoires peu peuplés qui traverse la France du nord-est au sud-ouest"),
    t("gx-frontalier", [FRANCE_T], "Travailleur frontalier", "Personne qui habite dans un pays et travaille dans le pays voisin"),
  ],
  "faits-notions-histoire": [
    t("nx-source", [INFO], "Source", "Origine d'une information : témoin, document, institution ou média"),
    t("nx-agence", [INFO], "Agence de presse", "Entreprise qui collecte des informations et les vend aux médias"),
    t("nx-infox", [INFO], "Infox", "Fausse information fabriquée et diffusée volontairement pour tromper"),
    t("nx-lanceur", [INFO], "Lanceur d'alerte", "Personne qui révèle des faits contraires à l'intérêt général dont elle a eu connaissance"),
    t("nx-complot", [INFO], "Théorie du complot", "Récit qui explique un événement par l'action secrète d'un petit groupe, sans en apporter la preuve"),
    t("nx-ligne", [INFO], "Ligne éditoriale", "Ensemble des choix d'un média sur les sujets qu'il traite et sur la façon de les présenter"),
    t("nx-propagande", [INFO], "Propagande", "Diffusion organisée d'informations orientées pour faire adhérer à une idée ou à un pouvoir"),
    t("nx-patrimoine-mondial", [PATRI], "Patrimoine mondial", "Liste de biens culturels et naturels d'intérêt exceptionnel pour l'humanité, tenue par l'UNESCO"),
    t("nx-immateriel", [PATRI], "Patrimoine immatériel", "Pratiques, savoir-faire et traditions transmis de génération en génération"),
    t("nx-patrimonialisation", [PATRI], "Patrimonialisation", "Processus par lequel un bien est reconnu comme un héritage à protéger et à transmettre"),
    t("nx-restitution", [PATRI], "Restitution", "Retour d'un bien culturel à son pays ou à sa communauté d'origine"),
    t("nx-mecenat", [PATRI], "Mécénat", "Soutien financier apporté à la culture par une entreprise ou un particulier"),
    t("nx-societe-connaissance", [CONN], "Société de la connaissance", "Société où la production et la diffusion du savoir sont les principaux moteurs de l'économie"),
    t("nx-cerveaux", [CONN], "Fuite des cerveaux", "Départ des personnes très qualifiées d'un pays vers un autre qui leur offre de meilleures conditions"),
    t("nx-cyberespace", [CONN], "Cyberespace", "Espace formé par les réseaux numériques, leurs données et leurs infrastructures"),
    t("nx-brevet", [CONN], "Brevet", "Titre qui réserve à un inventeur l'exploitation de son invention pendant une durée limitée"),
    t("nx-communaute", [CONN], "Communauté savante", "Groupe de chercheurs qui échangent, discutent et valident les savoirs"),
    t("nx-renseignement", [CONN], "Renseignement", "Collecte d'informations utiles à la sécurité et à la puissance d'un État"),
    t("nx-alphabetisation", [CONN], "Alphabétisation", "Apprentissage de la lecture et de l'écriture par une population"),
  ],
  "faits-histoire": [
    d("hx-gazette", [INFO], "Théophraste Renaudot fonde La Gazette, premier périodique français", 1631),
    d("hx-afp", [INFO], "Création de l'Agence France-Presse", 1944),
    d("hx-watergate", [INFO], "Début de l'affaire du Watergate, révélée par la presse américaine", 1972),
    d("hx-merimee", [PATRI], "Prosper Mérimée devient inspecteur général des monuments historiques", 1834),
    d("hx-loi-1913", [PATRI], "Loi française sur les monuments historiques", 1913),
    d("hx-journees", [PATRI], "Premières Journées du patrimoine en France", 1984),
    d("hx-bamiyan", [PATRI], "Destruction des bouddhas de Bâmiyân, en Afghanistan", 2001),
    d("hx-incendie-nd", [PATRI], "Incendie de la cathédrale Notre-Dame de Paris", 2019, "15 avril 2019"),
    d("hx-royal-society", [CONN], "Fondation de la Royal Society à Londres", 1660),
    d("hx-academie", [CONN], "Fondation de l'Académie royale des sciences à Paris", 1666),
    d("hx-cnrs", [CONN], "Création du CNRS", 1939),
  ],
  "faits-emc": [
    t("ex-delegue", [AGIR6], "Délégué de classe", "Élève élu par ses camarades pour les représenter, notamment au conseil de classe"),
    t("ex-interet-general", [AGIR6], "Intérêt général", "Ce qui profite à l'ensemble de la société, au-delà des intérêts de chacun"),
    t("ex-benevolat", [AGIR6], "Bénévolat", "Activité exercée librement et sans rémunération au service des autres"),
    t("ex-association", [AGIR6], "Association", "Groupe de personnes réunies autour d'un projet commun, sans chercher à en tirer un profit"),
    t("ex-cvc", [AGIR6], "Conseil de la vie collégienne", "Instance où des élèves élus font des propositions pour améliorer la vie du collège"),
    t("ex-eco-delegue", [AGIR6], "Éco-délégué", "Élève élu pour proposer et mener des actions en faveur de l'environnement dans son établissement"),
    t("ex-solidarite", [AGIR6], "Solidarité", "Entraide entre les membres d'un groupe ou d'une société"),
  ],
  "faits-eps": [
    t("epx-orientation", [DEPL6], "Course d'orientation", "Activité où l'on rejoint des postes de contrôle le plus vite possible en lisant une carte"),
    t("epx-legende", [DEPL6], "Légende", "Liste des symboles d'une carte et de leur signification"),
    t("epx-echelle", [DEPL6], "Échelle", "Rapport entre une distance sur la carte et la distance réelle sur le terrain"),
    t("epx-boussole", [DEPL6], "Boussole", "Instrument dont l'aiguille aimantée indique le nord"),
    t("epx-savoir-nager", [DEPL6], "Attestation du savoir-nager", "Document scolaire qui certifie qu'un élève sait nager en sécurité"),
    t("epx-flottaison", [DEPL6], "Flottaison", "Fait de rester à la surface de l'eau sans couler"),
    t("epx-immersion", [DEPL6], "Immersion", "Fait de mettre tout le corps sous l'eau, tête comprise"),
    t("epx-apnee", [DEPL6], "Apnée", "Arrêt volontaire de la respiration"),
  ],
  "faits-numerique": [
    t("nux-besoin", [USAGES5, USAGES4], "Besoin", "Ce qu'un utilisateur attend d'un objet technique"),
    t("nux-usage", [USAGES5, USAGES4], "Fonction d'usage", "Ce à quoi sert un objet technique"),
    t("nux-estime", [USAGES5, USAGES4], "Fonction d'estime", "Ce qui plaît dans un objet : sa forme, sa couleur, son image"),
    t("nux-contrainte", [USAGES5, USAGES4], "Contrainte", "Limite à respecter quand on conçoit un objet : coût, sécurité, environnement"),
    t("nux-invention", [USAGES5, INNOVER], "Invention", "Création d'un objet ou d'un procédé qui n'existait pas"),
    t("nux-innovation", [USAGES5, USAGES3, INNOVER], "Innovation", "Nouveauté technique qui se diffuse dans la société et change les usages"),
    t("nux-norme", [USAGES4, USAGES3], "Norme", "Règle technique commune qui garantit la sécurité ou la compatibilité des produits"),
    t("nux-obsolescence", [USAGES4, USAGES3], "Obsolescence", "Fait pour un objet de devenir dépassé ou inutilisable"),
    t("nux-ecoconception", [USAGES3, INNOVER], "Écoconception", "Conception d'un produit qui réduit son impact sur l'environnement à chaque étape de sa vie"),
    t("nux-recyclage", [USAGES3], "Recyclage", "Transformation des matériaux d'un objet usagé pour en fabriquer de nouveaux"),
    t("nux-analyse-fonctionnelle", [INNOVER, PROJET_SI], "Analyse fonctionnelle", "Méthode qui recense les fonctions qu'un produit doit remplir avant de le concevoir"),
    t("nux-maquette", [INNOVER, PROJET_SI], "Maquette numérique", "Modèle en trois dimensions d'un objet, réalisé avec un logiciel de conception"),
    t("nux-gantt", [PROJET_SI], "Diagramme de Gantt", "Planning qui représente les tâches d'un projet par des barres sur un calendrier"),
    t("nux-revue", [PROJET_SI], "Revue de projet", "Réunion où l'équipe présente l'avancement d'un projet et décide de la suite"),
    t("nux-impression-3d", [PROJET_SI], "Impression 3D", "Fabrication d'un objet par dépôt de couches successives de matière"),
  ],
  "faits-oeuvres": [
    w("ox-notre-dame", [VILLE4], "Victor Hugo", "Notre-Dame de Paris", 1831),
    w("ox-spleen", [VILLE4], "Charles Baudelaire", "Le Spleen de Paris", 1869),
    w("ox-villes", [VILLE4], "Émile Verhaeren", "Les Villes tentaculaires", 1895),
    w("ox-zazie", [VILLE4], "Raymond Queneau", "Zazie dans le métro", 1959),
  ],
  "faits-philosophie": [
    t("phx-refoulement", [INCONSCIENT], "Refoulement", "Mécanisme par lequel le psychisme repousse hors de la conscience un désir ou un souvenir jugé inacceptable"),
    t("phx-lapsus", [INCONSCIENT], "Lapsus", "Mot dit ou écrit à la place d'un autre, où Freud voit l'expression d'un désir inconscient"),
    t("phx-acte-manque", [INCONSCIENT], "Acte manqué", "Action qui dévie de son but, où Freud voit la réussite d'une intention inconsciente"),
    t("phx-surmoi", [INCONSCIENT], "Surmoi", "Instance du psychisme qui a intériorisé les interdits des parents et de la société"),
    t("phx-pulsion", [INCONSCIENT], "Pulsion", "Poussée venue du corps qui cherche à se satisfaire, à la frontière du corps et du psychisme"),
    t("phx-psychanalyse", [INCONSCIENT], "Psychanalyse", "Méthode d'exploration de l'inconscient par la parole, fondée par Freud"),
    t("phx-mauvaise-foi", [INCONSCIENT], "Mauvaise foi", "Chez Sartre, mensonge à soi-même par lequel on fuit sa liberté"),
    p("ppx-alain", [INCONSCIENT], "Alain", "philosophe français qui refuse de faire de l'inconscient « un autre moi » et y voit une excuse commode"),
    t("phx-duree", [TEMPS], "Durée", "Chez Bergson, temps vécu par la conscience, continu et indivisible, que l'horloge ne mesure pas"),
    t("phx-irreversibilite", [TEMPS], "Irréversibilité", "Caractère du temps, qui ne s'écoule que dans un sens : on ne peut ni revenir en arrière ni refaire le passé"),
    t("phx-instant", [TEMPS], "Instant", "Limite sans épaisseur entre le passé et l'avenir"),
    t("phx-eternite", [TEMPS], "Éternité", "Ce qui échappe au temps : sans commencement, sans fin et sans succession"),
    t("phx-finitude", [TEMPS], "Finitude", "Condition de l'être humain, limité dans le temps et promis à la mort"),
    t("phx-temps-objectif", [TEMPS], "Temps objectif", "Temps mesuré par les horloges, le même pour tous"),
    p("ppx-augustin", [TEMPS], "Augustin", "penseur chrétien de l'Antiquité tardive qui se demande, dans les Confessions, ce qu'est le temps"),
    w("phx-donnees", [TEMPS], "Henri Bergson", "Essai sur les données immédiates de la conscience", 1889),
    w("phx-etre-temps", [TEMPS], "Martin Heidegger", "Être et Temps", 1927),
    w("phx-confessions", [TEMPS], "Augustin", "Confessions"),
  ],
  "faits-svt": [
    t("svx-selection-artificielle", [PLANTES], "Sélection artificielle", "Choix par l'être humain des plantes ou des animaux qui se reproduiront, d'après les caractères qui l'intéressent"),
    t("svx-variete", [PLANTES], "Variété", "Ensemble de plantes cultivées d'une même espèce qui partagent des caractères choisis"),
    t("svx-hybride", [PLANTES], "Hybride F1", "Plante issue du croisement de deux lignées pures, souvent plus vigoureuse que ses parents"),
    t("svx-syndrome", [PLANTES], "Syndrome de domestication", "Ensemble des caractères qui distinguent une plante cultivée de son ancêtre sauvage"),
    t("svx-teosinte", [PLANTES], "Téosinte", "Plante sauvage du Mexique, ancêtre du maïs"),
    t("svx-transgenese", [PLANTES], "Transgénèse", "Transfert d'un gène d'une espèce dans le génome d'une autre"),
    t("svx-banque-graines", [PLANTES], "Banque de graines", "Lieu où l'on conserve des semences pour préserver la diversité des plantes cultivées"),
  ],
  "faits-physique": [
    t("phyx-nucleosynthese", [MATIERE], "Nucléosynthèse", "Formation de noyaux atomiques, dans les premières minutes de l'Univers puis au cœur des étoiles"),
    t("phyx-demi-vie", [MATIERE], "Demi-vie", "Durée au bout de laquelle la moitié des noyaux radioactifs d'un échantillon s'est désintégrée"),
    t("phyx-cristal", [MATIERE], "Cristal", "Solide dont les atomes, les ions ou les molécules sont rangés de façon régulière et répétée"),
    t("phyx-maille", [MATIERE], "Maille", "Motif élémentaire dont la répétition dans l'espace forme un cristal"),
    t("phyx-amorphe", [MATIERE], "Solide amorphe", "Solide dont les constituants ne sont pas rangés régulièrement, comme le verre"),
    t("phyx-mineral", [MATIERE], "Minéral", "Solide naturel de composition chimique définie, le plus souvent cristallisé"),
  ],
  "faits-arts": [
    t("artx-demarche", PROJET_ARTS, "Démarche artistique", "Cheminement d'un artiste, de l'intention à la réalisation, avec ses choix et ses essais"),
    t("artx-intention", PROJET_ARTS, "Intention", "Ce que l'artiste cherche à dire ou à faire éprouver"),
    t("artx-croquis", PROJET_ARTS, "Croquis", "Dessin rapide qui note l'essentiel d'une idée ou d'une forme"),
    t("artx-carnet", PROJET_ARTS, "Carnet de travail", "Support où l'on garde la trace de ses recherches, de ses essais et de ses références"),
    t("artx-accrochage", PROJET_ARTS, "Accrochage", "Manière de disposer les œuvres dans un lieu d'exposition"),
    t("artx-scenographie", PROJET_ARTS, "Scénographie", "Mise en espace d'une exposition : parcours, lumière, supports"),
    t("artx-cartel", PROJET_ARTS, "Cartel", "Étiquette placée près d'une œuvre, qui donne son auteur, son titre, sa date et sa technique"),
    t("artx-commissaire", PROJET_ARTS, "Commissaire d'exposition", "Personne qui conçoit une exposition : choix des œuvres, propos, parcours"),
    t("artx-medium", PROJET_ARTS, "Médium", "Matériau ou technique qu'emploie un artiste : peinture, photographie, vidéo"),
    t("artx-in-situ", PROJET_ARTS, "In situ", "Se dit d'une œuvre conçue pour le lieu précis où elle est présentée"),
  ],
  "faits-antiquite": [
    /* Vie quotidienne à Rome */
    t("at-domus", VIE_LA, "Domus", "Maison de ville d'une famille romaine aisée, organisée autour de l'atrium"),
    t("at-insula", VIE_LA, "Insula", "Immeuble de plusieurs étages où logent les Romains modestes"),
    t("at-pater", VIE_LA, "Pater familias", "Chef de la famille romaine, qui a autorité sur tous ses membres"),
    t("at-toge", ["5e-latin-vie"], "Toge", "Vêtement de laine drapé que porte le citoyen romain"),
    t("at-thermes", VIE_LA, "Thermes", "Bains publics romains, lieu de toilette, de sport et de rencontre"),
    t("at-forum", [...VIE_LA, ...CITE_LA], "Forum", "Place publique, centre de la vie politique, religieuse et commerciale d'une ville romaine"),
    t("at-lares", ["5e-latin-vie"], "Lares", "Divinités protectrices du foyer, honorées dans chaque maison romaine"),
    t("at-affranchi", ["3e-latin-vie", ...AUTRE], "Affranchi", "Ancien esclave à qui son maître a rendu la liberté"),
    t("at-patricien", ["3e-latin-vie", ...CITE_LA], "Patricien", "Membre des grandes familles nobles de Rome"),
    t("at-plebeien", ["3e-latin-vie", ...CITE_LA], "Plébéien", "Citoyen romain qui n'appartient pas aux familles nobles"),
    t("at-grammaticus", ["3e-latin-vie"], "Grammaticus", "Maître qui enseigne la langue et les grands auteurs aux adolescents romains"),
    t("at-cursus", ["3e-latin-vie", ...CITE_LA], "Cursus honorum", "Suite des magistratures que parcourt un homme politique romain, de questeur à consul"),
    /* Vie quotidienne en Grèce */
    t("at-oikos", VIE_GR, "Oikos", "Maison grecque, au sens de la famille et de ses biens"),
    t("at-gynecee", [...VIE_GR, ...MASCULIN], "Gynécée", "Partie de la maison grecque réservée aux femmes"),
    t("at-pedagogue", VIE_GR, "Pédagogue", "Esclave qui accompagne l'enfant grec à l'école et surveille son éducation"),
    t("at-ephebie", VIE_GR, "Éphébie", "Formation militaire et civique des jeunes Athéniens avant de devenir citoyens"),
    t("at-symposion", VIE_GR, "Symposion", "Banquet grec où les hommes boivent, discutent et écoutent de la poésie"),
    t("at-meteque", [...VIE_GR, ...AUTRE, ...CITE_GR], "Métèque", "Étranger libre installé dans une cité grecque, sans droits politiques"),
    t("at-panathenees", VIE_GR, "Panathénées", "Grande fête athénienne en l'honneur d'Athéna"),
    t("at-oracle", VIE_GR, "Oracle", "Réponse d'un dieu à une question des hommes, rendue dans un sanctuaire comme celui de Delphes"),
    t("at-palestre", VIE_GR, "Palestre", "Lieu où les jeunes Grecs s'entraînent à la lutte et aux exercices du corps"),
    /* Méditerranée */
    t("at-mare-nostrum", MED, "Mare Nostrum", "« Notre mer » : nom que les Romains donnent à la Méditerranée"),
    t("at-carthage", [...MED_LA, ...MED_LLCA], "Carthage", "Cité fondée par les Phéniciens en Afrique du Nord, grande rivale de Rome"),
    t("at-massalia", [...MED_GR, ...MED_LLCA], "Massalia", "Cité fondée vers 600 av. J.-C. par des Grecs venus de Phocée, aujourd'hui Marseille"),
    t("at-alexandrie", MED_GR, "Alexandrie", "Ville d'Égypte fondée par Alexandre le Grand, célèbre pour son phare et sa bibliothèque"),
    t("at-ostie", MED_LA, "Ostie", "Port de Rome, à l'embouchure du Tibre"),
    t("at-colonnes", MED, "Colonnes d'Hercule", "Nom antique du détroit de Gibraltar, limite occidentale du monde connu"),
    t("at-colonie", MED, "Colonie", "Cité nouvelle fondée au loin par des habitants venus d'une cité mère"),
    t("at-pheniciens", MED, "Phéniciens", "Peuple de marins et de marchands du Levant, à l'origine de l'alphabet repris par les Grecs"),
    t("at-via-appia", MED_LA, "Via Appia", "Première grande voie romaine, qui relie Rome au sud de l'Italie"),
    t("at-romanisation", [...MED_LA, ...MED_LLCA], "Romanisation", "Adoption de la langue, des lois et du mode de vie romains par les peuples conquis"),
    t("at-hellenisme", [...MED_GR, ...MED_LLCA], "Hellénisme", "Diffusion de la langue et de la culture grecques en Orient après les conquêtes d'Alexandre"),
    t("at-thalassocratie", MED_GR, "Thalassocratie", "Puissance fondée sur la maîtrise de la mer, comme Athènes au Ve siècle av. J.-C."),
    t("at-province", MED_LA, "Province", "Territoire conquis hors d'Italie, administré par un gouverneur romain"),
    d("ad-massalia", [...MED_GR, ...MED_LLCA], "Fondation de Massalia par des Grecs de Phocée", -600, "vers 600 av. J.-C."),
    d("ad-carthage", [...MED_LA, ...MED_LLCA], "Fondation de Carthage selon la tradition", -814),
    d("ad-alexandrie", MED_GR, "Fondation d'Alexandrie par Alexandre le Grand", -331),
    d("ad-alesia", MED_LA, "Victoire de Jules César à Alésia", -52),
    /* L'Homme et l'animal */
    t("at-minotaure", ANIMAL, "Minotaure", "Monstre au corps d'homme et à tête de taureau, enfermé dans le labyrinthe de Crète"),
    t("at-centaure", ANIMAL, "Centaure", "Créature au buste d'homme et au corps de cheval"),
    t("at-sphinx", ANIMAL, "Sphinx", "Monstre à tête de femme et corps de lion, qui pose une énigme aux voyageurs devant Thèbes"),
    t("at-chimere", ANIMAL, "Chimère", "Monstre qui tient du lion, de la chèvre et du serpent, et qui crache du feu"),
    t("at-cerbere", ANIMAL, "Cerbère", "Chien à trois têtes qui garde l'entrée des Enfers"),
    t("at-sirenes", [...ANIMAL, "2nde-latin-mediterranee", "2nde-grec-mediterranee"], "Sirènes", "Créatures mi-femmes, mi-oiseaux, dont le chant attire les marins vers la mort"),
    t("at-hydre", ANIMAL, "Hydre de Lerne", "Serpent à plusieurs têtes qui repoussent quand on les coupe, tué par Héraclès"),
    t("at-metamorphose", ANIMAL, "Métamorphose", "Transformation d'un être en un autre : animal, plante ou pierre"),
    t("at-hybride", ANIMAL, "Hybride", "Être formé de parties empruntées à plusieurs espèces"),
    t("at-bestiaire", ANIMAL, "Bestiaire", "Recueil qui décrit des animaux réels ou fabuleux et leur prête un sens moral"),
    p("ap-esope", ANIMAL, "Ésope", "fabuliste grec à qui l'on attribue des fables où les animaux parlent"),
    p("ap-phedre", ANIMAL, "Phèdre", "fabuliste latin qui adapte en vers les fables d'Ésope"),
    p("ap-arachne", ANIMAL, "Arachné", "tisseuse changée en araignée par Athéna"),
    p("ap-acteon", ANIMAL, "Actéon", "chasseur changé en cerf par Artémis et dévoré par ses propres chiens"),
    p("ap-circe", [...ANIMAL, "2nde-latin-mediterranee", "2nde-grec-mediterranee"], "Circé", "magicienne qui change les compagnons d'Ulysse en porcs"),
    p("ap-lycaon", ANIMAL, "Lycaon", "roi d'Arcadie changé en loup par Zeus"),
    /* Soi-même et l'autre */
    t("at-barbare", [...AUTRE, ...MED], "Barbare", "Pour les Grecs, celui qui ne parle pas grec ; puis tout étranger au monde gréco-romain"),
    t("at-xenia", [...AUTRE, "2nde-latin-mediterranee", "2nde-grec-mediterranee"], "Xénia", "Hospitalité grecque, devoir sacré d'accueillir l'étranger, placé sous la protection de Zeus"),
    t("at-hospitium", [...AUTRE, "2nde-latin-mediterranee"], "Hospitium", "Lien d'hospitalité qui unit un Romain à un hôte étranger et à sa famille"),
    t("at-limes", AUTRE, "Limes", "Frontière fortifiée de l'Empire romain"),
    t("at-peregrin", AUTRE, "Pérégrin", "Homme libre de l'Empire romain qui n'a pas la citoyenneté romaine"),
    t("at-ethnographie", AUTRE, "Ethnographie", "Description des mœurs et des coutumes d'un peuple"),
    p("ap-tacite", AUTRE, "Tacite", "historien romain qui décrit les peuples germains dans La Germanie"),
    p("ap-vercingetorix", [...AUTRE, ...MED_LA], "Vercingétorix", "chef gaulois vaincu par César à Alésia"),
    p("ap-xerxes", [...AUTRE, ...MED_GR], "Xerxès", "roi des Perses vaincu par les Grecs à Salamine"),
    p("ap-cesar", [...AUTRE, ...MED_LA, ...CITE_LA], "Jules César", "général romain, auteur de La Guerre des Gaules"),
    /* Vivre dans la cité */
    t("at-ecclesia", CITE_GR, "Ecclésia", "Assemblée des citoyens athéniens, qui vote les lois et décide de la guerre"),
    t("at-boule", CITE_GR, "Boulè", "Conseil de cinq cents citoyens tirés au sort, qui prépare les lois à Athènes"),
    t("at-ostracisme", CITE_GR, "Ostracisme", "Vote par lequel les Athéniens exilent pour dix ans un citoyen jugé dangereux"),
    t("at-isonomie", CITE_GR, "Isonomie", "Égalité des citoyens devant la loi, principe de la démocratie athénienne"),
    t("at-demagogue", [...CITE_GR, ...CITE_LA], "Démagogue", "Orateur qui flatte le peuple pour obtenir le pouvoir"),
    t("at-senat", CITE_LA, "Sénat", "Assemblée des anciens magistrats, qui dirige la politique de la République romaine"),
    t("at-consul", CITE_LA, "Consul", "L'un des deux magistrats élus pour un an à la tête de la République romaine"),
    t("at-tribun", CITE_LA, "Tribun de la plèbe", "Magistrat romain chargé de défendre le peuple, qui peut s'opposer aux décisions des autres magistrats"),
    t("at-res-publica", CITE_LA, "Res publica", "« La chose publique » : l'État romain, affaire de tous les citoyens"),
    p("ap-pericles", CITE_GR, "Périclès", "stratège athénien du Ve siècle av. J.-C., figure de l'apogée de la démocratie"),
    p("ap-solon", CITE_GR, "Solon", "législateur athénien qui abolit l'esclavage pour dettes"),
    p("ap-clisthene", CITE_GR, "Clisthène", "réformateur athénien considéré comme le fondateur de la démocratie"),
    p("ap-demosthene", CITE_GR, "Démosthène", "orateur athénien qui appelle à résister à Philippe de Macédoine"),
    p("ap-catilina", CITE_LA, "Catilina", "sénateur romain dont Cicéron dénonce la conjuration"),
    p("ap-platon", ["1re-llca-cite", "1re-grec-cite"], "Platon", "philosophe grec qui imagine une cité idéale gouvernée par les philosophes"),
    d("ad-clisthene", CITE_GR, "Réformes de Clisthène à Athènes", -508),
    d("ad-socrate", CITE_GR, "Procès et mort de Socrate", -399),
    d("ad-catilina", CITE_LA, "Conjuration de Catilina", -63),
    /* Masculin, féminin */
    t("at-amazones", MASCULIN, "Amazones", "Peuple légendaire de femmes guerrières"),
    t("at-matrone", MASCULIN, "Matrone", "Épouse et mère de famille romaine, respectée pour sa dignité"),
    t("at-vestale", [...MASCULIN, "5e-latin-vie"], "Vestale", "Prêtresse romaine chargée d'entretenir le feu sacré de Vesta"),
    t("at-pythie", [...MASCULIN, "5e-grec-vie"], "Pythie", "Prêtresse d'Apollon qui rend les oracles à Delphes"),
    t("at-virtus", MASCULIN, "Virtus", "Courage et valeur, qualité attendue de l'homme romain"),
    p("ap-penelope", MASCULIN, "Pénélope", "épouse d'Ulysse, modèle de fidélité, qui défait chaque nuit la toile tissée le jour"),
    p("ap-medee", MASCULIN, "Médée", "magicienne qui tue ses propres enfants pour se venger de Jason"),
    p("ap-antigone", [...MASCULIN, ...CITE_GR], "Antigone", "fille d'Œdipe qui enterre son frère malgré l'interdiction du roi Créon"),
    p("ap-atalante", MASCULIN, "Atalante", "chasseuse qui n'accepte d'épouser que celui qui la battra à la course"),
    p("ap-clytemnestre", MASCULIN, "Clytemnestre", "reine de Mycènes qui tue son époux Agamemnon à son retour de Troie"),
    /* Sagesses antiques */
    t("at-stoicisme", SAGESSE, "Stoïcisme", "École philosophique qui enseigne à accepter ce qui ne dépend pas de nous"),
    t("at-epicurisme", SAGESSE, "Épicurisme", "École philosophique qui cherche le bonheur dans des plaisirs simples et l'absence de trouble"),
    t("at-scepticisme", SAGESSE, "Scepticisme", "École philosophique qui suspend son jugement, faute de certitude"),
    t("at-cynisme", SAGESSE, "Cynisme", "École philosophique qui rejette les conventions sociales pour vivre selon la nature"),
    t("at-ataraxie", SAGESSE, "Ataraxie", "Tranquillité de l'âme que rien ne vient troubler"),
    t("at-carpe-diem", SAGESSE, "Carpe diem", "« Cueille le jour » : invitation du poète Horace à profiter du présent"),
    t("at-otium", SAGESSE, "Otium", "Loisir studieux, temps libre consacré à l'étude et à la réflexion"),
    t("at-maieutique", SAGESSE, "Maïeutique", "Méthode de Socrate, qui fait naître la vérité par des questions"),
    p("ap-epictete", SAGESSE, "Épictète", "philosophe stoïcien, ancien esclave, auteur du Manuel"),
    p("ap-marc-aurele", SAGESSE, "Marc Aurèle", "empereur romain et philosophe stoïcien, auteur des Pensées pour moi-même"),
    p("ap-epicure", SAGESSE, "Épicure", "philosophe grec, fondateur de l'école du Jardin"),
    p("ap-diogene", SAGESSE, "Diogène", "philosophe cynique qui vivait, dit-on, dans une jarre"),
    p("ap-socrate", [...SAGESSE, ...CITE_GR], "Socrate", "philosophe athénien condamné à boire la ciguë"),
    p("ap-horace", SAGESSE, "Horace", "poète latin, auteur des Odes"),
    /* Inventer, créer, fabriquer */
    t("at-aqueduc", INVENTER, "Aqueduc", "Ouvrage qui conduit l'eau jusqu'à la ville, parfois porté par des arches"),
    t("at-voute", INVENTER, "Voûte", "Ouvrage de maçonnerie cintré qui couvre un espace"),
    t("at-beton", ["Tle-latin-inventer"], "Béton romain", "Mélange de chaux, de sable volcanique et de pierres, qui permet aux Romains de bâtir vite et grand"),
    t("at-hypocauste", ["Tle-latin-inventer"], "Hypocauste", "Chauffage par le sol des thermes et des riches maisons romaines"),
    t("at-vis", INVENTER, "Vis d'Archimède", "Machine en forme d'hélice qui sert à élever l'eau"),
    t("at-mosaique", INVENTER, "Mosaïque", "Décor fait de petits cubes de pierre ou de verre assemblés"),
    t("at-fresque", INVENTER, "Fresque", "Peinture réalisée sur un enduit encore frais"),
    p("ap-vitruve", ["Tle-latin-inventer"], "Vitruve", "architecte romain, auteur du traité De l'architecture"),
    p("ap-dedale", INVENTER, "Dédale", "architecte légendaire du labyrinthe de Crète, père d'Icare"),
  ],
};

const FR = ["Temps", "Cause", "Conséquence", "Opposition"];

/** Lots qui manquaient à la banque. */
export const NEW_SETS: FactSet[] = [
  {
    id: "faits-methode-francais",
    subject: "francais",
    title: "Français : écrire, dire, préparer le brevet",
    status: "needs_review",
    sources: [
      { id: "c3-fr-2025", label: "Programme de français du cycle 3, BO n° 16 du 17 avril 2025", url: "https://education.gouv.fr/bo/2025/Hebdo16/MENE2504620A" },
      { id: "c4-fr", label: "Programmes de français du cycle 4 (2020 et 2026)", url: "https://eduscol.education.gouv.fr/4362/enseigner-au-cycle-4" },
    ],
    sets: {
      connecteur: { prompt: "Que marque ce connecteur ?", categories: FR },
      sujet: { prompt: "Sujet d'imagination ou sujet de réflexion ?", categories: ["Sujet d'imagination", "Sujet de réflexion"] },
    },
    facts: [
      t("mf-brouillon", [ECRIRE6, ECRIRE5], "Brouillon", "Premier jet d'un texte, que l'on rature et améliore avant de le recopier"),
      t("mf-initiale", [ECRIRE6, ECRIRE5], "Situation initiale", "Début d'un récit, qui présente les personnages, le lieu et l'époque avant que l'action commence"),
      t("mf-declencheur", [ECRIRE6, ECRIRE5], "Élément déclencheur", "Événement qui rompt l'équilibre du début et lance l'action d'un récit"),
      t("mf-peripeties", [ECRIRE6, ECRIRE5], "Péripéties", "Suite des actions et des obstacles que rencontre le héros"),
      t("mf-resolution", [ECRIRE6, ECRIRE5], "Élément de résolution", "Événement qui met fin aux péripéties et règle le problème du héros"),
      t("mf-finale", [ECRIRE6, ECRIRE5], "Situation finale", "Fin d'un récit, qui montre le nouvel équilibre après l'action"),
      t("mf-paragraphe", [ECRIRE6, ECRIRE5, BREVET], "Paragraphe", "Bloc de texte qui développe une seule idée et commence par un retour à la ligne"),
      t("mf-connecteur", [ECRIRE6, ECRIRE5, BREVET], "Connecteur", "Mot qui relie deux phrases ou deux idées : mais, donc, ensuite, car"),
      t("mf-narrateur", [ECRIRE6, ECRIRE5], "Narrateur", "Celui qui raconte l'histoire, à ne pas confondre avec l'auteur"),
      t("mf-description", [ECRIRE5], "Description", "Passage qui fait voir un lieu, un objet ou un personnage"),
      t("mf-reprise", [ECRIRE5, BREVET], "Reprise pronominale", "Emploi d'un pronom pour désigner, sans le répéter, un élément déjà nommé"),
      t("mf-expose", [ORAL6, ORAL5], "Exposé", "Présentation orale, préparée et organisée, d'un sujet devant un public"),
      t("mf-debat", [ORAL6, ORAL5], "Débat", "Échange organisé où chacun défend son avis et écoute celui des autres"),
      t("mf-argument", [ORAL6, ORAL5, BREVET], "Argument", "Raison que l'on donne pour justifier son avis"),
      t("mf-exemple", [ORAL5, BREVET], "Exemple", "Cas précis qui illustre et appuie une idée"),
      t("mf-reformuler", [ORAL6, ORAL5], "Reformuler", "Redire avec ses propres mots ce que quelqu'un vient de dire, pour vérifier qu'on a compris"),
      t("mf-articulation", [ORAL6, ORAL5], "Articulation", "Prononciation nette de chaque syllabe"),
      t("mf-debit", [ORAL6, ORAL5], "Débit", "Vitesse à laquelle on parle"),
      t("mf-intonation", [ORAL6, ORAL5], "Intonation", "Variations de la hauteur de la voix, qui donnent son ton à une phrase"),
      t("mf-tour", [ORAL6], "Tour de parole", "Moment où chacun, l'un après l'autre, a le droit de parler"),
      t("mf-moderateur", [ORAL5], "Modérateur", "Personne qui distribue la parole et veille au respect des règles d'un débat"),
      t("mf-dictee", [BREVET], "Dictée", "Exercice où l'on écrit sans faute un texte lu à voix haute"),
      t("mf-reecriture", [BREVET], "Réécriture", "Exercice où l'on transforme un passage, par exemple en changeant le temps ou la personne, avec tous les accords nécessaires"),
      t("mf-imagination", [BREVET], "Sujet d'imagination", "Sujet de rédaction qui demande d'écrire un récit, une suite de texte ou une scène"),
      t("mf-reflexion", [BREVET], "Sujet de réflexion", "Sujet de rédaction qui demande de défendre un avis avec des raisons et des cas précis"),
      t("mf-paratexte", [BREVET], "Paratexte", "Informations qui entourent un texte : titre, auteur, date, chapeau, notes"),
      t("mf-citation", [BREVET], "Citation", "Passage du texte recopié exactement, entre guillemets, pour justifier une réponse"),
      ...([
        ["ensuite", "Temps"], ["puis", "Temps"], ["soudain", "Temps"], ["car", "Cause"], ["parce que", "Cause"], ["puisque", "Cause"],
        ["donc", "Conséquence"], ["c'est pourquoi", "Conséquence"], ["par conséquent", "Conséquence"], ["mais", "Opposition"], ["pourtant", "Opposition"], ["cependant", "Opposition"],
      ] as const).map(([item, category], i) => c(`mf-co-${i}`, [ECRIRE6, ECRIRE5, BREVET], "connecteur", `« ${item} »`, category)),
      ...([
        ["Racontez la suite de ce texte.", "Sujet d'imagination"],
        ["Imaginez la lettre que le personnage écrit à son ami après cette scène.", "Sujet d'imagination"],
        ["Racontez un moment où vous avez dû surmonter une difficulté, en exprimant vos émotions.", "Sujet d'imagination"],
        ["Réécrivez la scène du point de vue d'un autre personnage.", "Sujet d'imagination"],
        ["Pensez-vous que les livres soient indispensables ? Vous développerez votre point de vue.", "Sujet de réflexion"],
        ["Faut-il, selon vous, toujours dire la vérité ?", "Sujet de réflexion"],
        ["Selon vous, la ville est-elle un lieu de liberté ?", "Sujet de réflexion"],
        ["Le progrès technique rend-il toujours la vie meilleure ? Vous justifierez votre réponse.", "Sujet de réflexion"],
      ] as const).map(([item, category], i) => c(`mf-su-${i}`, [BREVET], "sujet", item, category)),
    ],
  },
  {
    id: "faits-humanites",
    subject: "hlp",
    title: "Humanités, littérature et philosophie : notions, auteurs et œuvres",
    status: "needs_review",
    sources: [
      { id: "hlp-2019", label: "Programme d'humanités, littérature et philosophie de première et de terminale, BO spécial n° 1 du 22 janvier 2019 et n° 8 du 25 juillet 2019", url: "https://eduscol.education.gouv.fr/4368/enseigner-au-lycee-generaltechnologique" },
      { id: "bnf", label: "Bibliothèque nationale de France, notices bibliographiques (dates de première publication)", url: "https://catalogue.bnf.fr" },
    ],
    facts: [
      /* Les pouvoirs de la parole */
      t("hl-rhetorique", [PAROLE], "Rhétorique", "Art de bien parler pour persuader, codifié dans l'Antiquité"),
      t("hl-eloquence", [PAROLE], "Éloquence", "Talent de celui qui parle bien et touche son auditoire"),
      t("hl-persuader", [PAROLE], "Persuader", "Faire adhérer quelqu'un en s'adressant à ses émotions"),
      t("hl-convaincre", [PAROLE], "Convaincre", "Faire adhérer quelqu'un en s'adressant à sa raison"),
      t("hl-ethos", [PAROLE], "Ethos", "Image que l'orateur donne de lui-même pour inspirer confiance"),
      t("hl-pathos", [PAROLE], "Pathos", "Émotions que l'orateur cherche à éveiller chez son auditoire"),
      t("hl-logos", [PAROLE], "Logos", "Raisonnement et preuves du discours"),
      t("hl-sophiste", [PAROLE], "Sophiste", "Maître de rhétorique de la Grèce antique, que Platon accuse de préférer l'efficacité du discours à la vérité"),
      t("hl-plaidoyer", [PAROLE], "Plaidoyer", "Discours qui défend une personne ou une cause"),
      t("hl-requisitoire", [PAROLE], "Réquisitoire", "Discours qui accuse une personne ou dénonce une idée"),
      p("hl-demosthene", [PAROLE], "Démosthène", "orateur athénien du IVe siècle av. J.-C., célèbre pour ses discours contre Philippe de Macédoine"),
      p("hl-ciceron", [PAROLE], "Cicéron", "orateur romain, auteur du traité De l'orateur"),
      p("hl-aristote", [PAROLE], "Aristote", "philosophe grec dont la Rhétorique distingue l'ethos, le pathos et le logos"),
      p("hl-quintilien", [PAROLE], "Quintilien", "professeur de rhétorique romain, auteur de l'Institution oratoire"),
      p("hl-gorgias", [PAROLE], "Gorgias", "sophiste grec, auteur d'un Éloge d'Hélène"),
      /* Les représentations du monde */
      t("hl-humanisme", [MONDE], "Humanisme", "Mouvement de la Renaissance qui place l'être humain et l'étude des textes antiques au centre du savoir"),
      t("hl-alterite", [MONDE], "Altérité", "Fait d'être autre ; reconnaissance de l'autre dans sa différence"),
      t("hl-ethnocentrisme", [MONDE], "Ethnocentrisme", "Tendance à juger les autres cultures d'après la sienne, prise pour modèle"),
      t("hl-relativisme", [MONDE], "Relativisme culturel", "Idée que chaque culture doit être comprise selon ses propres valeurs"),
      t("hl-utopie", [MONDE], "Utopie", "Récit qui décrit une société idéale, située dans un lieu imaginaire"),
      t("hl-bon-sauvage", [MONDE], "Mythe du bon sauvage", "Idée que l'homme qui vit près de la nature serait meilleur que l'homme civilisé"),
      t("hl-recit-voyage", [MONDE], "Récit de voyage", "Texte où un voyageur raconte ce qu'il a vu et vécu dans un pays lointain"),
      t("hl-encyclopedie", [MONDE], "Encyclopédie", "Ouvrage qui cherche à rassembler et à ordonner l'ensemble des connaissances"),
      w("hl-essais", [MONDE], "Michel de Montaigne", "Essais", 1580),
      w("hl-utopia", [MONDE], "Thomas More", "L'Utopie", 1516),
      w("hl-lery", [MONDE], "Jean de Léry", "Histoire d'un voyage fait en la terre du Brésil", 1578),
      w("hl-persanes", [MONDE], "Montesquieu", "Lettres persanes", 1721),
      w("hl-gulliver", [MONDE], "Jonathan Swift", "Les Voyages de Gulliver", 1726),
      w("hl-polo", [MONDE], "Marco Polo", "Le Devisement du monde", 1298),
      w("hl-tropiques", [MONDE], "Claude Lévi-Strauss", "Tristes Tropiques", 1955),
      w("hl-bougainville", [MONDE], "Louis-Antoine de Bougainville", "Voyage autour du monde", 1771),
      /* L'Humanité en question */
      t("hl-deshumanisation", [HUMANITE], "Déshumanisation", "Fait de traiter des êtres humains comme s'ils n'en étaient pas"),
      t("hl-temoignage", [HUMANITE], "Témoignage", "Récit de celui qui a vu ou vécu un événement et veut en garder la trace"),
      t("hl-devoir-memoire", [HUMANITE], "Devoir de mémoire", "Obligation morale de se souvenir des victimes pour que le crime ne se reproduise pas"),
      t("hl-transhumanisme", [HUMANITE], "Transhumanisme", "Courant qui veut dépasser les limites du corps humain grâce aux sciences et aux techniques"),
      t("hl-dystopie", [HUMANITE], "Dystopie", "Récit qui décrit une société imaginaire oppressante, pour mettre en garde le lecteur"),
      t("hl-banalite", [HUMANITE], "Banalité du mal", "Expression de Hannah Arendt : des crimes immenses peuvent être commis par des hommes ordinaires qui obéissent sans réfléchir"),
      t("hl-anthropocene", [HUMANITE], "Anthropocène", "Époque où les activités humaines transforment la planète à l'échelle géologique"),
      t("hl-barbarie", [HUMANITE], "Barbarie", "Cruauté ou violence qui nie l'humanité de l'autre"),
      w("hl-levi", [HUMANITE], "Primo Levi", "Si c'est un homme", 1947),
      w("hl-antelme", [HUMANITE], "Robert Antelme", "L'Espèce humaine", 1947),
      w("hl-orwell", [HUMANITE], "George Orwell", "1984", 1949),
      w("hl-huxley", [HUMANITE], "Aldous Huxley", "Le Meilleur des mondes", 1932),
      w("hl-arendt", [HUMANITE], "Hannah Arendt", "Eichmann à Jérusalem", 1963),
      w("hl-peste", [HUMANITE], "Albert Camus", "La Peste", 1947),
      w("hl-frankenstein", [HUMANITE], "Mary Shelley", "Frankenstein", 1818),
    ],
  },
];

/**
 * Applique les compléments aux lots : rattachements, faits ajoutés, nouveaux lots.
 * Un identifiant inconnu arrête tout : un complément ne doit jamais se perdre en silence.
 */
export function complete(sets: FactSet[]): FactSet[] {
  const known = new Set(sets.flatMap((s) => s.facts.map((f) => f.id)));
  for (const id of Object.keys(EXTRA_UNITS)) if (!known.has(id)) throw new Error(`Complément : fait inconnu « ${id} »`);
  for (const id of Object.keys(EXTRA_FACTS)) if (!sets.some((s) => s.id === id)) throw new Error(`Complément : lot inconnu « ${id} »`);
  const out = sets.map((s) => ({
    ...s,
    facts: [
      ...s.facts.map((f) => (EXTRA_UNITS[f.id] ? { ...f, units: [...new Set([...f.units, ...EXTRA_UNITS[f.id]!])] } : f)),
      ...(EXTRA_FACTS[s.id] ?? []),
    ],
  }));
  return [...out, ...NEW_SETS];
}
