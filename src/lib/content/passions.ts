/**
 * Univers (passions) : l'élève peut en aimer ou en écarter, mais rien n'est obligatoire : chaque jour,
 * des univers de découverte sont tirés dans tout le catalogue pour élargir le spectre.
 * Chaque passion apporte un petit lexique qui sert à réécrire les énoncés.
 * Dans le produit, c'est l'IA qui écrit l'énoncé à partir de la passion ; les nombres
 * et la vérification restent fixés par le code, donc la réponse ne change jamais.
 */

export type FamilyId = "sport" | "jeux" | "musique" | "creation" | "sciences" | "monde";

export interface Lex {
  /** Sujet de l'histoire (« ton équipe »). null : l'énoncé s'adresse à l'élève (« tu »). */
  owner: string | null;
  pronoun: "il" | "elle";
  /** Ce qu'on accumule, au pluriel (« points »). */
  unit: string;
  /** Verbe à la 3e personne (« gagne », « reçoit »). */
  gain: string;
  /** Ce qui se répète, au singulier et au pluriel (« victoire », « victoires »). */
  event: string;
  events: string;
  /** Phrase de mouvement avec {d} mètres et {t} secondes (vitesses de 7 à 9 m/s plausibles). */
  motion: string;
  /** Lieu qui propose deux formules de prix, et l'unité payée. */
  venue: string;
  session: string;
  sessions: string;
}

export interface Passion {
  id: string;
  label: string;
  family: FamilyId;
  lex: Lex;
  custom?: boolean;
}

export const FAMILIES: Record<FamilyId, { label: string; color: string }> = {
  sport: { label: "Sport", color: "#007a83" },
  jeux: { label: "Jeux", color: "#7a3cff" },
  musique: { label: "Musique", color: "#c2410c" },
  creation: { label: "Création", color: "#c92a62" },
  sciences: { label: "Sciences et nature", color: "#0072a8" },
  monde: { label: "Monde et société", color: "#4d7c0f" },
};
export const FAMILY_ORDER: FamilyId[] = ["sport", "jeux", "musique", "creation", "sciences", "monde"];

const P = (id: string, label: string, family: FamilyId, lex: Lex): Passion => ({ id, label, family, lex });

export const PASSIONS: Passion[] = [
  P("football", "Football", "sport", { owner: "ton équipe", pronoun: "elle", unit: "points", gain: "gagne", event: "victoire", events: "victoires", motion: "Lors d'une contre-attaque, une ailière sprinte sur {d} m en {t} s.", venue: "Le stade de ton club", session: "match", sessions: "matchs" }),
  P("basket", "Basket", "sport", { owner: "ton équipe", pronoun: "elle", unit: "paniers", gain: "marque", event: "quart-temps", events: "quarts-temps", motion: "À l'échauffement, un meneur enchaîne les allers-retours : {d} m en {t} s.", venue: "La salle de basket de ta ville", session: "match", sessions: "matchs" }),
  P("rugby", "Rugby", "sport", { owner: "ton équipe", pronoun: "elle", unit: "points", gain: "inscrit", event: "pénalité réussie", events: "pénalités réussies", motion: "Après une interception, un ailier file vers l'en-but : {d} m en {t} s.", venue: "Le club de rugby du quartier", session: "entraînement", sessions: "entraînements" }),
  P("tennis", "Tennis", "sport", { owner: "ta joueuse", pronoun: "elle", unit: "aces", gain: "réussit", event: "match", events: "matchs", motion: "Pendant la préparation physique, une joueuse court {d} m en {t} s.", venue: "Le club de tennis", session: "heure de court", sessions: "heures de court" }),
  P("natation", "Natation", "sport", { owner: "ton club de natation", pronoun: "il", unit: "médailles", gain: "gagne", event: "compétition", events: "compétitions", motion: "Sur la plage, un nageur sauveteur sprinte jusqu'à l'eau : {d} m en {t} s.", venue: "La piscine municipale", session: "entrée", sessions: "entrées" }),
  P("athletisme", "Athlétisme", "sport", { owner: "ton relais", pronoun: "il", unit: "points", gain: "gagne", event: "meeting", events: "meetings", motion: "Sur la piste, une sprinteuse parcourt {d} m en {t} s.", venue: "Le stade d'athlétisme", session: "séance", sessions: "séances" }),
  P("velo", "Vélo et BMX", "sport", { owner: "ton équipe cycliste", pronoun: "elle", unit: "points au classement", gain: "gagne", event: "étape", events: "étapes", motion: "Dans une descente, un coureur à vélo parcourt {d} m en {t} s.", venue: "Le vélodrome", session: "séance", sessions: "séances" }),
  P("skate", "Skate", "sport", { owner: "ta skateuse", pronoun: "elle", unit: "points", gain: "gagne", event: "figure réussie", events: "figures réussies", motion: "Au skatepark, une skateuse sort de la grande rampe et file sur {d} m en {t} s.", venue: "Le skatepark couvert", session: "session", sessions: "sessions" }),
  P("danse", "Danse", "sport", { owner: "ta troupe", pronoun: "elle", unit: "points du jury", gain: "obtient", event: "chorégraphie", events: "chorégraphies", motion: "À l'échauffement, une danseuse traverse le gymnase en courant : {d} m en {t} s.", venue: "L'école de danse", session: "cours", sessions: "cours" }),
  P("equitation", "Équitation", "sport", { owner: "ta jument", pronoun: "elle", unit: "rubans", gain: "gagne", event: "concours", events: "concours", motion: "Au galop, un cheval parcourt {d} m en {t} s.", venue: "Le centre équestre", session: "reprise", sessions: "reprises" }),

  P("aventure", "Jeux d'aventure", "jeux", { owner: "ton personnage", pronoun: "il", unit: "pièces d'or", gain: "gagne", event: "quête terminée", events: "quêtes terminées", motion: "Dans le jeu, ton personnage traverse la plaine : {d} m en {t} s.", venue: "Le magasin de jeux de ton quartier", session: "soirée de jeu", sessions: "soirées de jeu" }),
  P("course-auto", "Jeux de course", "jeux", { owner: "ta pilote", pronoun: "elle", unit: "trophées", gain: "gagne", event: "course", events: "courses", motion: "Dans la voie des stands virtuelle, ta voiture roule au ralenti : {d} m en {t} s.", venue: "La salle de simulateurs", session: "partie", sessions: "parties" }),
  P("construction", "Jeux de construction", "jeux", { owner: "ta ville virtuelle", pronoun: "elle", unit: "bâtiments", gain: "accueille", event: "jour de jeu", events: "jours de jeu", motion: "Dans ton monde, un wagonnet file sur les rails : {d} m en {t} s.", venue: "Le club d'informatique", session: "atelier", sessions: "ateliers" }),
  P("esport", "E-sport", "jeux", { owner: "ton équipe", pronoun: "elle", unit: "points de classement", gain: "gagne", event: "partie gagnée", events: "parties gagnées", motion: "Juste avant le tournoi, une joueuse court attraper son train : {d} m en {t} s.", venue: "La salle d'e-sport", session: "tournoi", sessions: "tournois" }),
  P("echecs", "Échecs et jeux de société", "jeux", { owner: "ton club d'échecs", pronoun: "il", unit: "points", gain: "gagne", event: "partie gagnée", events: "parties gagnées", motion: "En retard au tournoi, tu sprintes jusqu'au bus : {d} m en {t} s.", venue: "Le café-jeux du quartier", session: "soirée", sessions: "soirées" }),

  P("rap", "Rap", "musique", { owner: "ton morceau", pronoun: "il", unit: "milliers d'écoutes", gain: "gagne", event: "jour", events: "jours", motion: "Pour le clip, un rappeur traverse la rue à vélo : {d} m en {t} s.", venue: "Le studio d'enregistrement", session: "heure de studio", sessions: "heures de studio" }),
  P("guitare", "Guitare et rock", "musique", { owner: "ton groupe", pronoun: "il", unit: "fans", gain: "gagne", event: "concert", events: "concerts", motion: "Après le concert, le guitariste court rattraper le bus : {d} m en {t} s.", venue: "La salle de répétition", session: "répétition", sessions: "répétitions" }),
  P("piano", "Piano", "musique", { owner: "ta pianiste", pronoun: "elle", unit: "morceaux", gain: "apprend", event: "mois", events: "mois", motion: "En retard au conservatoire, une pianiste pédale à vélo : {d} m en {t} s.", venue: "Le conservatoire", session: "cours", sessions: "cours" }),
  P("batterie", "Batterie", "musique", { owner: "ton batteur", pronoun: "il", unit: "rythmes", gain: "maîtrise", event: "semaine", events: "semaines", motion: "Le batteur livre sa caisse claire à vélo cargo : {d} m en {t} s.", venue: "Le local de répétition", session: "heure", sessions: "heures" }),
  P("chant", "Chant", "musique", { owner: "ta chorale", pronoun: "elle", unit: "chansons", gain: "apprend", event: "répétition", events: "répétitions", motion: "En retard à la répétition, une chanteuse court jusqu'à la salle : {d} m en {t} s.", venue: "L'école de musique", session: "cours", sessions: "cours" }),

  P("dessin", "Dessin", "creation", { owner: "ton carnet", pronoun: "il", unit: "dessins", gain: "accueille", event: "semaine", events: "semaines", motion: "Dans ton dessin animé, un personnage court à travers la page : {d} m en {t} s.", venue: "L'atelier de dessin", session: "cours", sessions: "cours" }),
  P("manga", "Manga et BD", "creation", { owner: "ta collection", pronoun: "elle", unit: "tomes", gain: "s'agrandit de", event: "mois", events: "mois", motion: "Dans le dernier chapitre, l'héroïne s'élance sur les toits : {d} m en {t} s.", venue: "La librairie de ton quartier", session: "tome", sessions: "tomes" }),
  P("photo", "Photo", "creation", { owner: "ton album", pronoun: "il", unit: "photos", gain: "s'enrichit de", event: "sortie", events: "sorties", motion: "Tu photographies un cycliste qui parcourt {d} m en {t} s.", venue: "Le club photo", session: "sortie", sessions: "sorties" }),
  P("video", "Création de vidéos", "creation", { owner: "ta chaîne", pronoun: "elle", unit: "abonnés", gain: "gagne", event: "vidéo publiée", events: "vidéos publiées", motion: "Pour ta vidéo, tu filmes une amie à vélo qui parcourt {d} m en {t} s.", venue: "Le studio de tournage", session: "heure de location", sessions: "heures de location" }),
  P("cuisine", "Cuisine et pâtisserie", "creation", { owner: "ta pâtisserie", pronoun: "elle", unit: "commandes", gain: "reçoit", event: "jour", events: "jours", motion: "Un livreur à vélo t'apporte la farine : {d} m en {t} s.", venue: "L'atelier de cuisine", session: "cours", sessions: "cours" }),
  P("mode", "Mode et stylisme", "creation", { owner: "ta collection", pronoun: "elle", unit: "tenues", gain: "s'agrandit de", event: "mois", events: "mois", motion: "Une coursière à vélo livre les tenues du défilé : {d} m en {t} s.", venue: "L'atelier de couture", session: "atelier", sessions: "ateliers" }),
  P("theatre", "Théâtre et cinéma", "creation", { owner: "ta troupe", pronoun: "elle", unit: "spectateurs fidèles", gain: "gagne", event: "représentation", events: "représentations", motion: "Pour une scène de poursuite, une actrice sprinte sur {d} m en {t} s.", venue: "Le cinéma du quartier", session: "séance", sessions: "séances" }),

  P("espace", "Espace", "sciences", { owner: "ta station spatiale", pronoun: "elle", unit: "modules", gain: "reçoit", event: "lancement", events: "lancements", motion: "À l'entraînement, une astronaute sprinte sur {d} m en {t} s.", venue: "Le planétarium", session: "séance", sessions: "séances" }),
  P("animaux", "Animaux", "sciences", { owner: "ton refuge", pronoun: "il", unit: "adoptions", gain: "compte", event: "semaine", events: "semaines", motion: "Un chien de berger court après le troupeau : {d} m en {t} s.", venue: "Le parc animalier", session: "visite", sessions: "visites" }),
  P("dinosaures", "Dinosaures", "sciences", { owner: "ton musée", pronoun: "il", unit: "fossiles", gain: "reçoit", event: "fouille", events: "fouilles", motion: "D'après les paléontologues, un vélociraptor pouvait courir {d} m en {t} s.", venue: "Le musée d'histoire naturelle", session: "visite", sessions: "visites" }),
  P("ocean", "Océans et mer", "sciences", { owner: "ton bateau d'observation", pronoun: "il", unit: "observations", gain: "note", event: "sortie en mer", events: "sorties en mer", motion: "Un dauphin nage le long du bateau : {d} m en {t} s.", venue: "Le centre de plongée", session: "plongée", sessions: "plongées" }),
  P("robotique", "Robotique et code", "sciences", { owner: "ton robot", pronoun: "il", unit: "programmes", gain: "apprend", event: "atelier", events: "ateliers", motion: "Un drone de course file en ligne droite : {d} m en {t} s.", venue: "Le fablab", session: "atelier", sessions: "ateliers" }),
  P("jardin", "Nature et jardin", "sciences", { owner: "ton potager", pronoun: "il", unit: "plants", gain: "accueille", event: "semaine", events: "semaines", motion: "En randonnée, tu vois un chevreuil détaler : {d} m en {t} s.", venue: "La jardinerie", session: "atelier", sessions: "ateliers" }),
  P("voitures", "Voitures et moteurs", "sciences", { owner: "ton écurie", pronoun: "elle", unit: "points", gain: "marque", event: "Grand Prix", events: "Grands Prix", motion: "Dans la voie des stands, une voiture de course roule au ralenti : {d} m en {t} s.", venue: "Le circuit de karting", session: "session", sessions: "sessions" }),
  P("aviation", "Avions", "sciences", { owner: "ta compagnie aérienne", pronoun: "elle", unit: "avions", gain: "reçoit", event: "année", events: "années", motion: "Un petit avion roule vers la piste : {d} m en {t} s.", venue: "L'aéroclub", session: "visite", sessions: "visites" }),

  /* v7 : spectre élargi (les univers de découverte sont tirés dans tout ce catalogue). */
  P("handball", "Handball", "sport", { owner: "ton équipe", pronoun: "elle", unit: "buts", gain: "marque", event: "match", events: "matchs", motion: "Sur une contre-attaque, une ailière file vers le but : {d} m en {t} s.", venue: "Le gymnase de ton club", session: "match", sessions: "matchs" }),
  P("volley", "Volley", "sport", { owner: "ton équipe", pronoun: "elle", unit: "points", gain: "marque", event: "set", events: "sets", motion: "À l'échauffement, une volleyeuse sprinte le long du terrain : {d} m en {t} s.", venue: "Le club de volley", session: "séance", sessions: "séances" }),
  P("combat", "Boxe et arts martiaux", "sport", { owner: "ta boxeuse", pronoun: "elle", unit: "points", gain: "marque", event: "round", events: "rounds", motion: "Au footing de l'entraînement, une boxeuse accélère : {d} m en {t} s.", venue: "La salle de boxe", session: "cours", sessions: "cours" }),
  P("escalade", "Escalade", "sport", { owner: "ta cordée", pronoun: "elle", unit: "voies", gain: "réussit", event: "sortie", events: "sorties", motion: "Au pied de la falaise, une grimpeuse court rejoindre son groupe : {d} m en {t} s.", venue: "La salle d'escalade", session: "séance", sessions: "séances" }),
  P("glisse", "Surf et glisse", "sport", { owner: "ta surfeuse", pronoun: "elle", unit: "vagues", gain: "prend", event: "session", events: "sessions", motion: "Sur une belle vague, une surfeuse glisse sur {d} m en {t} s.", venue: "L'école de surf", session: "cours", sessions: "cours" }),
  P("ski", "Ski et snowboard", "sport", { owner: "ta skieuse", pronoun: "elle", unit: "points", gain: "gagne", event: "descente", events: "descentes", motion: "Sur une piste verte, un snowboardeur descend {d} m en {t} s.", venue: "La station de ski", session: "journée", sessions: "journées" }),
  P("gym", "Gymnastique", "sport", { owner: "ta gymnaste", pronoun: "elle", unit: "points", gain: "obtient", event: "enchaînement", events: "enchaînements", motion: "Pour son saut, une gymnaste prend son élan : {d} m en {t} s.", venue: "Le club de gym", session: "cours", sessions: "cours" }),

  P("strategie", "Jeux de stratégie", "jeux", { owner: "ton empire", pronoun: "il", unit: "territoires", gain: "conquiert", event: "tour", events: "tours", motion: "Dans le jeu, un éclaireur à cheval traverse la carte : {d} m en {t} s.", venue: "Le club de jeux de stratégie", session: "soirée", sessions: "soirées" }),
  P("cartes", "Cartes à collectionner", "jeux", { owner: "ta collection", pronoun: "elle", unit: "cartes", gain: "s'agrandit de", event: "booster", events: "boosters", motion: "Le jour de la sortie, tu cours jusqu'à la boutique : {d} m en {t} s.", venue: "La boutique de cartes", session: "tournoi", sessions: "tournois" }),
  P("enigmes", "Énigmes et escape games", "jeux", { owner: "ton équipe", pronoun: "elle", unit: "énigmes", gain: "résout", event: "salle", events: "salles", motion: "Pour sortir à temps, ton équipe court dans le couloir : {d} m en {t} s.", venue: "L'escape game de ta ville", session: "partie", sessions: "parties" }),
  P("rpg", "Jeux de rôle", "jeux", { owner: "ton héroïne", pronoun: "elle", unit: "points d'expérience", gain: "gagne", event: "combat", events: "combats", motion: "Dans le jeu, ton héroïne échappe à un dragon : {d} m en {t} s.", venue: "La boutique de jeux de rôle", session: "partie", sessions: "parties" }),

  P("electro", "Électro et DJ", "musique", { owner: "ta playlist", pronoun: "elle", unit: "titres", gain: "s'agrandit de", event: "soirée", events: "soirées", motion: "Pour son clip, une DJ traverse le pont à vélo : {d} m en {t} s.", venue: "Le studio de mixage", session: "heure", sessions: "heures" }),
  P("kpop", "K-pop", "musique", { owner: "ton groupe préféré", pronoun: "il", unit: "millions de vues", gain: "gagne", event: "semaine", events: "semaines", motion: "Pendant le tournage du clip, une danseuse traverse le plateau en courant : {d} m en {t} s.", venue: "L'école de danse", session: "cours", sessions: "cours" }),
  P("jazz", "Jazz et soul", "musique", { owner: "ton trio de jazz", pronoun: "il", unit: "concerts", gain: "donne", event: "mois", events: "mois", motion: "En retard au concert, la contrebassiste file à vélo : {d} m en {t} s.", venue: "Le club de jazz", session: "concert", sessions: "concerts" }),

  P("ecriture", "Écriture et lecture", "creation", { owner: "ton roman", pronoun: "il", unit: "pages", gain: "s'allonge de", event: "semaine", events: "semaines", motion: "Dans ton histoire, l'héroïne s'enfuit en courant : {d} m en {t} s.", venue: "La médiathèque", session: "atelier d'écriture", sessions: "ateliers d'écriture" }),
  P("anime", "Animés et séries", "creation", { owner: "ta liste de séries", pronoun: "elle", unit: "épisodes", gain: "s'allonge de", event: "semaine", events: "semaines", motion: "Dans le dernier épisode, le héros court sur les toits : {d} m en {t} s.", venue: "Le cinéma du quartier", session: "séance", sessions: "séances" }),
  P("podcast", "Podcasts et radio", "creation", { owner: "ton podcast", pronoun: "il", unit: "auditeurs", gain: "gagne", event: "épisode", events: "épisodes", motion: "Pour un reportage, tu suis une cycliste qui parcourt {d} m en {t} s.", venue: "Le studio radio de la MJC", session: "heure de studio", sessions: "heures de studio" }),
  P("bricolage", "Maquettes et bricolage", "creation", { owner: "ton atelier", pronoun: "il", unit: "maquettes", gain: "termine", event: "mois", events: "mois", motion: "Ta voiture radiocommandée file en ligne droite : {d} m en {t} s.", venue: "Le fablab", session: "atelier", sessions: "ateliers" }),
  P("streetart", "Graffiti et street art", "creation", { owner: "ton collectif", pronoun: "il", unit: "fresques", gain: "réalise", event: "festival", events: "festivals", motion: "Pour filmer la fresque, un ami passe devant à vélo : {d} m en {t} s.", venue: "L'atelier de street art", session: "atelier", sessions: "ateliers" }),

  P("meteo", "Météo et climat", "sciences", { owner: "ta station météo", pronoun: "elle", unit: "mesures", gain: "enregistre", event: "jour", events: "jours", motion: "Par grand vent, une feuille est emportée sur {d} m en {t} s.", venue: "Le centre météo", session: "visite", sessions: "visites" }),
  P("volcans", "Volcans et séismes", "sciences", { owner: "ton observatoire", pronoun: "il", unit: "secousses", gain: "enregistre", event: "semaine", events: "semaines", motion: "Sur les pentes du volcan, une coulée de boue dévale {d} m en {t} s.", venue: "Le parc des volcans", session: "visite", sessions: "visites" }),
  P("corps", "Corps humain et médecine", "sciences", { owner: "ton cabinet médical", pronoun: "il", unit: "patients", gain: "reçoit", event: "jour", events: "jours", motion: "Pendant un test d'effort, une athlète court {d} m en {t} s.", venue: "La salle de sport", session: "séance", sessions: "séances" }),
  P("chimie", "Chimie et expériences", "sciences", { owner: "ton labo", pronoun: "il", unit: "expériences", gain: "réalise", event: "semaine", events: "semaines", motion: "Une fusée à eau s'élève de {d} m en {t} s.", venue: "Le centre de sciences", session: "atelier", sessions: "ateliers" }),
  P("trains", "Trains", "sciences", { owner: "ton réseau miniature", pronoun: "il", unit: "wagons", gain: "accueille", event: "mois", events: "mois", motion: "En entrant en gare, un train roule au ralenti : {d} m en {t} s.", venue: "Le musée du train", session: "visite", sessions: "visites" }),

  P("histoire", "Histoire", "monde", { owner: "ton musée d'histoire", pronoun: "il", unit: "visiteurs", gain: "accueille", event: "jour", events: "jours", motion: "Un messager à cheval parcourait {d} m en {t} s pour porter les nouvelles.", venue: "Le château de ta région", session: "visite", sessions: "visites" }),
  P("mythologie", "Mythologies", "monde", { owner: "ton héros", pronoun: "il", unit: "exploits", gain: "accomplit", event: "épreuve", events: "épreuves", motion: "Aux Jeux olympiques antiques, un coureur parcourt {d} m en {t} s.", venue: "Le musée des Antiquités", session: "visite", sessions: "visites" }),
  P("voyages", "Voyages et pays du monde", "monde", { owner: "ton carnet de voyage", pronoun: "il", unit: "pays", gain: "s'enrichit de", event: "voyage", events: "voyages", motion: "À l'aéroport, tu cours vers ta porte d'embarquement : {d} m en {t} s.", venue: "L'auberge de jeunesse", session: "nuit", sessions: "nuits" }),
  P("ecologie", "Écologie", "monde", { owner: "ton association", pronoun: "elle", unit: "arbres plantés", gain: "ajoute", event: "sortie", events: "sorties", motion: "Une lycéenne qui va en cours à vélo parcourt {d} m en {t} s.", venue: "La ressourcerie", session: "atelier", sessions: "ateliers" }),
  P("business", "Créer son entreprise", "monde", { owner: "ta start-up", pronoun: "elle", unit: "clients", gain: "gagne", event: "mois", events: "mois", motion: "Un livreur à vélo de ta start-up parcourt {d} m en {t} s.", venue: "L'espace de coworking", session: "journée", sessions: "journées" }),
];

/** Univers par défaut quand l'élève n'a encore choisi aucune passion. */
export const EVERYDAY: Passion = P("quotidien", "Vie quotidienne", "sciences", {
  owner: "ta tirelire", pronoun: "elle", unit: "euros", gain: "reçoit", event: "semaine", events: "semaines",
  motion: "Une cycliste parcourt {d} m en {t} s sur une piste cyclable.", venue: "La salle d'escalade", session: "séance", sessions: "séances",
});

const FAMILY_DEFAULTS: Record<FamilyId, Omit<Lex, "owner" | "pronoun" | "gain">> = {
  sport: { unit: "points", event: "entraînement", events: "entraînements", motion: "Pendant l'entraînement, tu sprintes sur {d} m en {t} s.", venue: "Ton club", session: "séance", sessions: "séances" },
  jeux: { unit: "points", event: "partie", events: "parties", motion: "Dans le jeu, ton personnage traverse la carte : {d} m en {t} s.", venue: "La salle de jeux", session: "partie", sessions: "parties" },
  musique: { unit: "morceaux", event: "semaine", events: "semaines", motion: "Tu files à vélo jusqu'à ta répétition : {d} m en {t} s.", venue: "Le studio", session: "heure", sessions: "heures" },
  creation: { unit: "créations", event: "semaine", events: "semaines", motion: "Tu files à vélo jusqu'à ton atelier : {d} m en {t} s.", venue: "L'atelier", session: "atelier", sessions: "ateliers" },
  sciences: { unit: "découvertes", event: "expérience", events: "expériences", motion: "Un drone d'observation file en ligne droite : {d} m en {t} s.", venue: "Le centre de sciences", session: "visite", sessions: "visites" },
  monde: { unit: "rencontres", event: "voyage", events: "voyages", motion: "Tu cours attraper ton train : {d} m en {t} s.", venue: "La maison des associations", session: "atelier", sessions: "ateliers" },
};

function pluralize(word: string): string {
  return word
    .split(" ")
    .map((w, i) => (i === 0 && !/[sxz]$/i.test(w) ? `${w}s` : w))
    .join(" ");
}

/** Passion inventée par l'élève : on lui demande ce qu'on y compte et ce qui s'y répète. */
export function makeCustomPassion(input: { label: string; family: FamilyId; unit?: string; event?: string }): Passion {
  const base = FAMILY_DEFAULTS[input.family];
  const event = input.event?.trim() || base.event;
  return {
    id: `custom-${input.label.trim().toLowerCase().replace(/[^a-z0-9à-ÿ]+/gi, "-")}`,
    label: input.label.trim(),
    family: input.family,
    custom: true,
    lex: {
      ...base,
      owner: null,
      pronoun: "il",
      gain: "gagnes",
      unit: input.unit?.trim() || base.unit,
      event,
      events: input.event?.trim() ? pluralize(event) : base.events,
    },
  };
}

export function findPassion(id: string, customs: Passion[]): Passion | undefined {
  return PASSIONS.find((p) => p.id === id) ?? customs.find((p) => p.id === id);
}

/** Profils de démo pour montrer la personnalisation en un clic. */
export const PRESETS: { name: string; passions: string[] }[] = [
  { name: "Alex", passions: ["football", "aventure", "rap"] },
  { name: "Inès", passions: ["equitation", "manga", "espace"] },
  { name: "Sacha", passions: ["skate", "video", "robotique"] },
  { name: "Lou", passions: ["cuisine", "piano", "animaux", "danse"] },
];
