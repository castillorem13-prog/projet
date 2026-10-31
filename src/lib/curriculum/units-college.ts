import type { Level, SubjectId, Unit, VerificationStatus } from "./types";

/**
 * Unités du programme du collège (6e à 3e).
 * Ce sont les thèmes et notions du programme, dans un ordre indicatif : jamais l'ordre d'un professeur.
 * `verification` : cross_checked quand l'intitulé suit le programme recoupé, needs_review sinon.
 */

type Extra = Partial<Pick<Unit, "needs" | "sessionId" | "objectiveIds">>;
export const unit = (level: Level, subject: SubjectId, slug: string, domain: string, title: string, notions: string[], verification: VerificationStatus, extra: Extra = {}): Unit => ({
  id: `${level}-${subject}-${slug}`,
  level,
  subject,
  sourceId: "",
  domain,
  title,
  notions,
  verification,
  ...extra,
});

const OK: VerificationStatus = "cross_checked";
const TODO: VerificationStatus = "needs_review";

/* ——— 6e (cycle 3) ——— */
const G6: Unit[] = [
  unit("6e", "francais", "lire", "Lecture", "Lire et comprendre des textes variés", ["Lire au moins trois œuvres complètes", "Comprendre l'implicite", "Justifier une interprétation"], TODO),
  unit("6e", "francais", "culture", "Culture littéraire et artistique", "Récits, mythes et contes", ["Récits de création et récits fondateurs", "Contes et récits d'aventures", "Poésie"], TODO),
  unit("6e", "francais", "ecrire", "Écriture", "Écrire et réviser un texte", ["Planifier un récit", "Réviser à l'aide de critères"], TODO),
  unit("6e", "francais", "oral", "Oral", "Écouter, dire, échanger", ["Raconter, lire à voix haute", "Débattre en respectant la parole"], TODO),
  unit("6e", "francais", "grammaire", "Grammaire et orthographe", "Classes et fonctions des mots", ["Nom, verbe, adjectif, déterminant", "Sujet et verbe", "Accord du participe passé avec être"], OK),
  unit("6e", "francais", "conjugaison", "Grammaire et orthographe", "Conjuguer au présent et au passé", ["Présent, imparfait, passé simple, futur", "Passé composé"], TODO),
  unit("6e", "francais", "vocabulaire", "Vocabulaire", "Enrichir son vocabulaire", ["Familles de mots", "Synonymes et antonymes", "Sens propre et figuré"], TODO),

  unit("6e", "maths", "decimaux", "Nombres et calcul", "Nombres décimaux", ["Écrire, comparer, ranger", "Repérer sur une demi-droite graduée"], OK),
  unit("6e", "maths", "fractions", "Nombres et calcul", "Fractions", ["Fraction d'une quantité", "Fractions égales", "Fraction et quotient"], OK, { sessionId: "fractions-6e", objectiveIds: ["obj-6e-fraction-quantite"] }),
  unit("6e", "maths", "calcul", "Nombres et calcul", "Calculer avec les quatre opérations", ["Calcul mental et posé", "Priorités", "Division euclidienne"], OK),
  unit("6e", "maths", "propor", "Proportionnalité", "Proportionnalité", ["Reconnaître une situation de proportionnalité", "Pourcentages simples", "Échelles"], OK, { needs: ["6e-maths-fractions"] }),
  unit("6e", "maths", "grandeurs", "Grandeurs et mesures", "Longueurs, aires et durées", ["Périmètre et aire", "Conversions", "Durées"], OK),
  unit("6e", "maths", "geometrie", "Espace et géométrie", "Figures et constructions", ["Parallèles et perpendiculaires", "Cercle", "Symétrie axiale"], OK),
  unit("6e", "maths", "problemes", "Nombres, calcul et résolution de problèmes", "Résoudre des problèmes, premiers pas en algèbre", ["Schémas en barres", "Structure d'un motif évolutif"], OK, { needs: ["6e-maths-calcul"] }),
  unit("6e", "maths", "donnees", "Organisation et gestion de données, probabilités", "Données et probabilités", ["Lire et filtrer des données", "Représenter des points dans un repère", "Probabilité d'un événement équiprobable"], OK),
  unit("6e", "maths", "algo", "Pensée informatique", "Initiation à la pensée informatique", ["Suivre et écrire un algorithme simple", "Programmer un déplacement"], OK),

  unit("6e", "hg", "humanite", "Histoire", "La longue histoire de l'humanité et des migrations", ["Les débuts de l'humanité", "La révolution néolithique", "Premiers États, premières écritures"], OK),
  unit("6e", "hg", "mediterranee", "Histoire", "Récits fondateurs, croyances et citoyenneté dans la Méditerranée antique", ["Le monde des cités grecques", "Rome, du mythe à l'histoire", "La naissance du monothéisme juif"], OK),
  unit("6e", "hg", "rome", "Histoire", "L'Empire romain dans le monde antique", ["Conquêtes, paix romaine et romanisation", "Des chrétiens dans l'Empire", "Relations avec les autres mondes anciens"], OK),
  unit("6e", "hg", "metropole", "Géographie", "Habiter une métropole", ["Les métropoles et leurs habitants", "La ville de demain"], OK),
  unit("6e", "hg", "faible-densite", "Géographie", "Habiter un espace de faible densité", ["Espace à fortes contraintes", "Espace agricole"], OK),
  unit("6e", "hg", "littoraux", "Géographie", "Habiter les littoraux", ["Littoral industrialo-portuaire", "Littoral touristique"], OK),
  unit("6e", "hg", "monde", "Géographie", "Le monde habité", ["La répartition de la population mondiale", "La variété des formes d'occupation"], OK),



  unit("6e", "sciences", "matiere", "Sciences", "Matière, mouvement, énergie, information", ["États et constitution de la matière", "Décrire un mouvement", "Sources et conversions d'énergie"], OK),
  unit("6e", "sciences", "vivant", "Sciences", "Le vivant, sa diversité et les fonctions qui le caractérisent", ["Classer les êtres vivants", "Développement et reproduction", "Besoins des végétaux et des animaux"], OK),
  unit("6e", "sciences", "terre", "Sciences", "La planète Terre, les êtres vivants dans leur environnement", ["La Terre dans le système solaire", "Peuplement d'un milieu"], OK),

  unit("6e", "arts", "representation", "Arts plastiques", "La représentation plastique et les dispositifs de présentation", ["Ressemblance et écart", "Mettre en scène une production"], TODO),
  unit("6e", "arts", "fabrication", "Arts plastiques", "Les fabrications et la relation entre l'objet et l'espace", ["Objet et volume", "Installation"], TODO),
  unit("6e", "arts", "materialite", "Arts plastiques", "La matérialité de la production plastique", ["Matériaux, outils, gestes", "Effets de la couleur"], TODO),

  unit("6e", "musique", "chanter", "Éducation musicale", "Chanter et interpréter", ["Justesse, respiration", "Interpréter une intention"], TODO),
  unit("6e", "musique", "ecouter", "Éducation musicale", "Écouter, comparer et commenter", ["Tempo, nuances, timbres", "Vocabulaire de l'écoute"], TODO),
  unit("6e", "musique", "creer", "Éducation musicale", "Explorer, imaginer et créer", ["Inventer un motif rythmique"], TODO),

  unit("6e", "eps", "performance", "EPS", "Produire une performance optimale", ["Courir, sauter, lancer", "Mesurer ses progrès"], TODO),
  unit("6e", "eps", "deplacements", "EPS", "Adapter ses déplacements à des environnements variés", ["Savoir nager", "Course d'orientation"], TODO),
  unit("6e", "eps", "expression", "EPS", "S'exprimer devant les autres", ["Danse, acrosport", "Juger une prestation"], TODO),
  unit("6e", "eps", "affrontement", "EPS", "Conduire et maîtriser un affrontement", ["Jeux collectifs", "Règles et arbitrage"], TODO),
];

/* ——— 5e (cycle 4) — français, maths et langues : programme 2026, détail à importer ——— */
const G5: Unit[] = [
  unit("5e", "francais", "eprouver", "Programme 2026", "Éprouver, expérimenter : la découverte de soi, d'autrui et du monde", ["Récits d'aventure et de découverte", "Lire des œuvres intégrales"], OK, { needs: ["6e-francais-culture"] }),
  unit("5e", "francais", "lire", "Lecture et culture littéraire", "Lire des œuvres et des textes variés", ["Œuvres intégrales", "Interpréter en s'appuyant sur le texte"], TODO, { needs: ["6e-francais-lire"] }),
  unit("5e", "francais", "ecrire", "Écriture", "Écrire pour raconter, décrire, expliquer", ["Planifier, rédiger, réviser"], TODO, { needs: ["6e-francais-ecrire"] }),
  unit("5e", "francais", "oral", "Oral", "Prendre la parole et échanger", ["Exposé", "Débat"], TODO),
  unit("5e", "francais", "langue", "Étude de la langue", "Grammaire, orthographe et vocabulaire", ["Fonctions dans la phrase", "Accords", "Temps du récit"], TODO, { needs: ["6e-francais-grammaire", "6e-francais-conjugaison"], sessionId: "temps-recit-5e", objectiveIds: ["obj-5e-temps-recit"] }),

  unit("5e", "maths", "relatifs", "Nombres et calcul", "Nombres relatifs", ["Repérage", "Addition et soustraction"], TODO, { needs: ["6e-maths-decimaux"] }),
  unit("5e", "maths", "fractions", "Nombres et calcul", "Fractions : comparer et additionner", ["Même dénominateur", "Multiples"], TODO, { needs: ["6e-maths-fractions"] }),
  unit("5e", "maths", "expressions", "Nombres et calcul", "Premières expressions littérales", ["Utiliser une lettre", "Tester une égalité"], TODO, { needs: ["6e-maths-calcul"] }),
  unit("5e", "maths", "propor", "Proportionnalité", "Proportionnalité et pourcentages", ["Coefficient de proportionnalité", "Ratios"], TODO, { needs: ["6e-maths-propor"], sessionId: "proportionnalite-5e", objectiveIds: ["obj-5e-proportionnalite"] }),
  unit("5e", "maths", "geometrie", "Espace et géométrie", "Triangles et parallélogrammes", ["Somme des angles", "Inégalité triangulaire", "Symétrie centrale"], TODO, { needs: ["6e-maths-geometrie"] }),
  unit("5e", "maths", "aires-volumes", "Grandeurs et mesures", "Aires et volumes", ["Aire du triangle et du disque", "Volume du pavé et du prisme"], TODO, { needs: ["6e-maths-grandeurs"] }),
  unit("5e", "maths", "donnees", "Données", "Statistiques et premières probabilités", ["Moyenne", "Fréquences"], TODO, { needs: ["6e-maths-donnees"] }),

  unit("5e", "hg", "chretientes", "Histoire", "Chrétientés et islam (VIe-XIIIe siècles), des mondes en contact", ["Byzance et l'Europe carolingienne", "L'islam, débuts et expansion"], OK, { needs: ["6e-hg-rome"] }),
  unit("5e", "hg", "feodal", "Histoire", "Société, Église et pouvoir politique dans l'Occident féodal", ["L'ordre seigneurial", "L'émergence d'une nouvelle société urbaine", "L'affirmation de l'État monarchique"], OK),
  unit("5e", "hg", "renaissance", "Histoire", "Transformations de l'Europe et ouverture sur le monde (XVIe-XVIIe siècles)", ["Le monde au temps de Charles Quint", "Humanisme, réformes et conflits religieux", "Du Prince de la Renaissance au roi absolu"], OK),
  unit("5e", "hg", "demographie", "Géographie", "La question démographique et l'inégal développement", ["Croissance démographique", "Inégalités de développement"], OK, { needs: ["6e-hg-monde"] }),
  unit("5e", "hg", "ressources", "Géographie", "Des ressources limitées, à gérer et à renouveler", ["L'énergie", "L'eau", "L'alimentation"], OK),
  unit("5e", "hg", "risques", "Géographie", "Prévenir les risques, s'adapter au changement global", ["Changement climatique", "Risques industriels et technologiques"], OK),



  unit("5e", "physique", "matiere", "Matière", "États et constitution de la matière", ["Changements d'état", "Mélanges et corps purs", "Masse et volume"], TODO, { needs: ["6e-sciences-matiere"] }),
  unit("5e", "physique", "mouvement", "Mouvement et interactions", "Décrire un mouvement", ["Trajectoire", "Vitesse"], TODO, { needs: ["6e-sciences-matiere"] }),
  unit("5e", "physique", "energie", "Énergie", "Sources d'énergie et circuits électriques", ["Circuit en série", "Conducteurs et isolants"], TODO),
  unit("5e", "physique", "signaux", "Signaux", "Lumière et son", ["Propagation de la lumière", "Émission d'un son"], TODO),
  unit("5e", "svt", "planete", "Planète Terre", "Météo, climats et paysages", ["Phénomènes météorologiques", "Érosion et paysages"], TODO, { needs: ["6e-sciences-terre"] }),
  unit("5e", "svt", "vivant", "Le vivant", "Nutrition et organisation du vivant", ["Respiration", "Besoins des cellules"], TODO, { needs: ["6e-sciences-vivant"] }),
  unit("5e", "svt", "corps", "Corps et santé", "Alimentation, digestion et activité physique", ["Digestion", "Effort et adaptation"], TODO),

  unit("5e", "techno", "usages", "Thème 1", "Objets et systèmes techniques : usages et interactions", ["Usages et évolutions", "Interactions avec l'environnement et l'utilisateur"], "verified_official"),
  unit("5e", "techno", "fonctionnement", "Thème 2", "Structure et fonctionnement d'un objet", ["Organisation interne", "Repérer un dysfonctionnement", "Lire un programme"], "verified_official"),
  unit("5e", "techno", "conception", "Thème 3", "Imaginer et réaliser une solution", ["Démarche de créativité", "Tester une solution"], "verified_official"),

  unit("5e", "arts", "representation", "Arts plastiques", "La représentation : images, réalité et fiction", ["Ressemblance, narration", "Cadrage"], TODO, { needs: ["6e-arts-representation"] }),
  unit("5e", "arts", "matiere", "Arts plastiques", "La matérialité de l'œuvre", ["Matière, support, couleur"], TODO, { needs: ["6e-arts-materialite"] }),
  unit("5e", "musique", "ecouter", "Éducation musicale", "Écouter, comparer, construire une culture", ["Formes musicales", "Timbres"], TODO, { needs: ["6e-musique-ecouter"] }),
  unit("5e", "musique", "creer", "Éducation musicale", "Réaliser des projets musicaux", ["Interpréter", "Arranger"], TODO),
  unit("5e", "eps", "affrontement", "EPS", "Conduire et maîtriser un affrontement", ["Sports collectifs et de raquette", "Arbitrer"], TODO, { needs: ["6e-eps-affrontement"] }),
  unit("5e", "eps", "performance", "EPS", "Produire une performance optimale", ["Athlétisme", "Planifier ses efforts"], TODO, { needs: ["6e-eps-performance"] }),
];

/* ——— 4e (cycle 4) ——— */
const G4: Unit[] = [
  unit("4e", "francais", "amour", "Littérature", "Dire l'amour", ["La poésie lyrique", "Figures de style"], OK),
  unit("4e", "francais", "valeurs", "Littérature", "Individu et société : confrontations de valeurs ?", ["Le théâtre classique", "Le dilemme"], OK),
  unit("4e", "francais", "fiction", "Littérature", "La fiction pour interroger le réel", ["La nouvelle réaliste", "Le fantastique"], OK, { needs: ["5e-francais-lire"] }),
  unit("4e", "francais", "informer", "Littérature", "Informer, s'informer, déformer ?", ["Fait ou opinion", "Lire la presse"], OK),
  unit("4e", "francais", "ville", "Littérature", "La ville, lieu de tous les possibles ?", ["Représentations de la ville"], OK),
  unit("4e", "francais", "fonctions", "Langue", "Les fonctions dans la phrase", ["Sujet, COD, COI", "Attribut du sujet"], TODO, { needs: ["5e-francais-langue"] }),
  unit("4e", "francais", "conjugaison", "Langue", "Les temps de l'indicatif", ["Temps simples et composés", "Concordance des temps"], TODO, { needs: ["5e-francais-langue"] }),

  unit("4e", "maths", "relatifs", "Nombres et calcul", "Nombres relatifs : produits et quotients", ["Règle des signes", "Priorités opératoires"], OK, { needs: ["5e-maths-relatifs"] }),
  unit("4e", "maths", "fractions", "Nombres et calcul", "Fractions : les quatre opérations", ["Additionner, multiplier, diviser"], OK, { needs: ["5e-maths-fractions"] }),
  unit("4e", "maths", "puissances", "Nombres et calcul", "Puissances et notation scientifique", ["Puissances de 10", "Ordres de grandeur"], OK),
  unit("4e", "maths", "litteral", "Nombres et calcul", "Calcul littéral : réduire, développer", ["Substituer une valeur", "Réduire", "Développer k(a + b)"], OK, { needs: ["5e-maths-expressions"], sessionId: "calcul-litteral-4e", objectiveIds: ["obj-4e-distributivite"] }),
  unit("4e", "maths", "equations", "Nombres et calcul", "Équations du premier degré", ["Tester une égalité", "Résoudre ax + b = c"], OK, { needs: ["4e-maths-litteral"] }),
  unit("4e", "maths", "propor", "Proportionnalité", "Proportionnalité et pourcentages", ["Quatrième proportionnelle", "Appliquer un pourcentage"], OK, { needs: ["5e-maths-propor"] }),
  unit("4e", "maths", "pythagore", "Espace et géométrie", "Théorème de Pythagore", ["Calculer une longueur", "Prouver qu'un triangle est rectangle"], OK, { needs: ["5e-maths-geometrie"] }),
  unit("4e", "maths", "stats", "Données", "Statistiques", ["Moyenne pondérée", "Médiane"], OK, { needs: ["5e-maths-donnees"] }),
  unit("4e", "maths", "proba", "Données", "Probabilités", ["Issues, événements", "Fréquence et probabilité"], OK, { needs: ["5e-maths-donnees"] }),
  unit("4e", "maths", "espace", "Grandeurs et mesures", "Pyramides et cônes", ["Volumes", "Patrons"], OK, { needs: ["5e-maths-aires-volumes"] }),

  unit("4e", "hg", "xviiie", "Histoire", "Bourgeoisies marchandes, négoces internationaux et traites négrières au XVIIIe siècle", ["Commerce triangulaire", "Ports et bourgeoisies"], OK),
  unit("4e", "hg", "lumieres", "Histoire", "L'Europe des Lumières", ["Circulation des idées", "Contestation de l'absolutisme"], OK, { needs: ["5e-hg-renaissance"] }),
  unit("4e", "hg", "revolution", "Histoire", "La Révolution française et l'Empire", ["1789 : la fin de l'Ancien Régime", "Nouvel ordre politique", "L'Empire en Europe"], OK, { needs: ["4e-hg-lumieres"] }),
  unit("4e", "hg", "industrie", "Histoire", "L'Europe de la « révolution industrielle »", ["Industrialisation", "Le monde ouvrier"], OK),
  unit("4e", "hg", "colonies", "Histoire", "Conquêtes et sociétés coloniales", ["L'expansion coloniale", "La société coloniale"], OK),
  unit("4e", "hg", "voter", "Histoire", "Une difficile conquête : voter de 1815 à 1870", ["Suffrage censitaire", "1848 : suffrage universel masculin"], OK, { needs: ["4e-hg-revolution"] }),
  unit("4e", "hg", "republique", "Histoire", "La Troisième République", ["Les grandes lois républicaines", "L'école, la laïcité"], OK, { needs: ["4e-hg-voter"] }),
  unit("4e", "hg", "femmes", "Histoire", "Conditions féminines dans une société en mutation", ["Droits et inégalités", "Le combat pour l'égalité"], OK),
  unit("4e", "hg", "urbanisation", "Géographie", "L'urbanisation du monde", ["Espaces et paysages de l'urbanisation", "Des villes inégalement connectées"], OK, { needs: ["5e-hg-demographie"] }),
  unit("4e", "hg", "mobilites", "Géographie", "Les mobilités humaines transnationales", ["Migrations", "Tourisme"], OK),
  unit("4e", "hg", "mondialisation", "Géographie", "Des espaces transformés par la mondialisation", ["Mers et océans", "Les dynamiques d'un grand ensemble"], OK),


  unit("4e", "anglais", "langages", "Culture", "Langages", ["Expressions, langues et communication", "Comparatifs"], OK, { needs: ["5e-anglais-portrait"] }),
  unit("4e", "anglais", "ecole", "Culture", "École et société", ["Modaux : can, must", "Règles et opinions"], OK),
  unit("4e", "anglais", "voyages", "Culture", "Voyages et migrations", ["Prétérit des verbes irréguliers", "Raconter un voyage"], OK, { needs: ["5e-anglais-lieux"] }),
  unit("4e", "anglais", "rencontres", "Culture", "Rencontres avec d'autres cultures", ["Futur", "Décrire des traditions"], OK),
  unit("4e", "espagnol", "langages", "Culture", "Langages", ["Gustar", "Présent des irréguliers"], OK, { needs: ["5e-espagnol-portrait"] }),
  unit("4e", "espagnol", "ecole", "Culture", "École et société", ["Obligation : tener que, hay que", "La journée (verbes pronominaux)"], OK),
  unit("4e", "espagnol", "voyages", "Culture", "Voyages et migrations", ["Se repérer", "Décrire un lieu"], OK),
  unit("4e", "espagnol", "rencontres", "Culture", "Rencontres avec d'autres cultures", ["Fêtes et traditions", "Comparer"], OK),

  unit("4e", "physique", "molecules", "Matière", "Molécules et transformations chimiques", ["Atomes et molécules", "Équation de réaction"], TODO, { needs: ["5e-physique-matiere"] }),
  unit("4e", "physique", "masse", "Matière", "Masse volumique", ["ρ = m ÷ V", "Flotter ou couler"], TODO, { needs: ["5e-physique-matiere"] }),
  unit("4e", "physique", "ohm", "Énergie", "Circuits électriques et loi d'Ohm", ["Tension et intensité", "U = R × I"], TODO, { needs: ["5e-physique-energie"] }),
  unit("4e", "physique", "mouvement", "Mouvement et interactions", "Mouvement et vitesse", ["Vitesse constante ou variable", "Relativité du mouvement"], TODO, { needs: ["5e-physique-mouvement"] }),
  unit("4e", "physique", "lumiere", "Signaux", "La lumière", ["Vitesse de la lumière", "Spectres"], TODO, { needs: ["5e-physique-signaux"] }),
  unit("4e", "svt", "reproduction", "Corps et santé", "Reproduction et puberté", ["Cellules reproductrices", "Fécondation"], TODO),
  unit("4e", "svt", "nerveux", "Corps et santé", "Système nerveux et comportement", ["Message nerveux", "Effort physique"], TODO, { needs: ["5e-svt-corps"] }),
  unit("4e", "svt", "tectonique", "Planète Terre", "Séismes, volcans et tectonique", ["Plaques lithosphériques", "Risques naturels"], TODO, { needs: ["5e-svt-planete"] }),

  unit("4e", "techno", "usages", "Thème 1", "Choisir un objet selon différents critères", ["Usages et évolutions", "Critères de choix"], "verified_official", { needs: ["5e-techno-usages"] }),
  unit("4e", "techno", "fonctionnement", "Thème 2", "Chaînes d'énergie et d'information, programmes", ["Échanges d'énergie et de données", "Modifier un programme"], "verified_official", { needs: ["5e-techno-fonctionnement"] }),
  unit("4e", "techno", "conception", "Thème 3", "Concevoir, simuler, tester", ["Modéliser", "Protocoles de tests"], "verified_official", { needs: ["5e-techno-conception"] }),

  unit("4e", "arts", "oeuvre", "Arts plastiques", "L'œuvre, l'espace, l'auteur, le spectateur", ["Présentation de l'œuvre", "Rôle du spectateur"], TODO),
  unit("4e", "musique", "ecouter", "Éducation musicale", "Écouter et analyser", ["Rythme, tempo, timbre, forme"], TODO, { needs: ["5e-musique-ecouter"] }),
  unit("4e", "eps", "affrontement", "EPS", "Conduire et maîtriser un affrontement", ["Choix tactiques", "Rôles sociaux"], TODO, { needs: ["5e-eps-affrontement"] }),
  unit("4e", "eps", "sante", "EPS", "S'entraîner et préserver sa santé", ["Échauffement", "Récupération"], TODO),
];

/* ——— 3e (cycle 4) ——— */
const G3: Unit[] = [
  unit("3e", "francais", "raconter", "Littérature", "Se raconter, se représenter", ["Le pacte autobiographique", "Narrateur et point de vue", "Le récit au passé"], OK, { needs: ["4e-francais-fiction"] }),
  unit("3e", "francais", "accords", "Langue", "Les accords du participe passé", ["Avec être", "Avec avoir et le COD placé avant"], TODO, { needs: ["4e-francais-fonctions"] }),
  unit("3e", "francais", "denoncer", "Littérature", "Dénoncer les travers de la société", ["Satire et ironie", "Thèse, arguments, exemples", "Connecteurs logiques"], OK, { needs: ["4e-francais-informer"], sessionId: "francais-denoncer-3e", objectiveIds: ["obj-3e-ironie-preuve"] }),
  unit("3e", "francais", "subordonnees", "Langue", "Les propositions subordonnées", ["Relatives", "Conjonctives", "Circonstancielles"], TODO, { needs: ["4e-francais-fonctions"] }),
  unit("3e", "francais", "poesie", "Littérature", "Visions poétiques du monde", ["Vers, strophes, rimes", "Images poétiques"], OK, { needs: ["4e-francais-amour"] }),
  unit("3e", "francais", "agir", "Littérature", "Agir dans la cité : individu et pouvoir", ["Récits de guerre et d'engagement", "Témoigner"], OK, { needs: ["4e-francais-valeurs"] }),
  unit("3e", "francais", "progres", "Littérature", "Progrès et rêves scientifiques", ["Science-fiction", "Débattre du progrès"], OK),
  unit("3e", "francais", "brevet", "Brevet", "Préparer l'épreuve de français", ["Dictée et réécriture", "Compréhension", "Rédaction"], OK),

  unit("3e", "maths", "arith", "Nombres et calcul", "Arithmétique", ["Nombres premiers", "Décomposition en facteurs premiers", "Fractions irréductibles"], OK, { needs: ["4e-maths-fractions"] }),
  unit("3e", "maths", "litteral", "Nombres et calcul", "Calcul littéral et équations", ["Développer et factoriser", "Identités remarquables", "Équation produit nul"], OK, { needs: ["4e-maths-litteral", "4e-maths-equations"] }),
  unit("3e", "maths", "fonctions", "Fonctions", "Notion de fonction", ["Image et antécédent", "Tableau de valeurs", "Lecture graphique"], OK, { needs: ["4e-maths-propor"] }),
  unit("3e", "maths", "affines", "Fonctions", "Fonctions linéaires et affines", ["f(x) = ax + b", "Coefficient directeur et ordonnée à l'origine", "Représentation graphique"], OK, { needs: ["4e-maths-litteral", "4e-maths-propor"], sessionId: "fonctions-affines-3e", objectiveIds: ["obj-3e-affine-modele"] }),
  unit("3e", "maths", "thales", "Espace et géométrie", "Théorème de Thalès", ["Calculer une longueur", "Réciproque", "Agrandissement et réduction"], OK, { needs: ["4e-maths-propor"] }),
  unit("3e", "maths", "stats", "Données", "Statistiques", ["Moyenne, médiane, étendue"], OK, { needs: ["4e-maths-stats"] }),
  unit("3e", "maths", "trigo", "Espace et géométrie", "Trigonométrie", ["Cosinus, sinus, tangente"], OK, { needs: ["4e-maths-pythagore"] }),
  unit("3e", "maths", "proba", "Données", "Probabilités", ["Expériences à deux épreuves"], OK, { needs: ["4e-maths-proba"] }),
  unit("3e", "maths", "transfo", "Espace et géométrie", "Transformations et homothéties", ["Translation, rotation, homothétie"], OK),
  unit("3e", "maths", "espace", "Grandeurs et mesures", "Géométrie dans l'espace", ["Sphère et boule", "Sections de solides"], OK, { needs: ["4e-maths-espace"] }),
  unit("3e", "maths", "algo", "Algorithmique", "Algorithmique et programmation", ["Boucles, conditions, variables"], OK),

  unit("3e", "hg", "1gm", "Histoire", "Civils et militaires dans la Première Guerre mondiale", ["Une guerre totale", "Violence de masse", "Le génocide des Arméniens"], OK, { needs: ["4e-hg-colonies"] }),
  unit("3e", "hg", "totalitarismes", "Histoire", "Démocraties fragilisées et expériences totalitaires dans l'Europe de l'entre-deux-guerres", ["La crise de 1929", "L'Allemagne nazie, l'URSS de Staline", "Le Front populaire"], OK, { needs: ["4e-hg-republique"], sessionId: "histoire-totalitarismes-3e", objectiveIds: ["obj-3e-nazis-pouvoir"] }),
  unit("3e", "hg", "2gm", "Histoire", "La Deuxième Guerre mondiale, une guerre d'anéantissement", ["Guerre mondiale", "La Shoah"], OK),
  unit("3e", "hg", "vichy", "Histoire", "La France défaite et occupée. Régime de Vichy, collaboration, Résistance", ["Vichy", "Collaboration", "Résistance"], OK),
  unit("3e", "hg", "independances", "Histoire", "Indépendances et construction de nouveaux États", ["Décolonisation"], OK, { needs: ["4e-hg-colonies"] }),
  unit("3e", "hg", "guerre-froide", "Histoire", "Un monde bipolaire au temps de la guerre froide", ["Deux modèles", "Crises"], OK),
  unit("3e", "hg", "europe", "Histoire", "Affirmation et mise en œuvre du projet européen", ["De la CECA à l'UE"], OK),
  unit("3e", "hg", "apres-1989", "Histoire", "Enjeux et conflits dans le monde après 1989", ["Nouvelles conflictualités"], OK),
  unit("3e", "hg", "refonder", "Histoire", "1944-1947, refonder la République, redéfinir la démocratie", ["Droit de vote des femmes", "Préambule de 1946"], OK, { needs: ["4e-hg-republique"] }),
  unit("3e", "hg", "ve-republique", "Histoire", "La Ve République, de la République gaullienne à l'alternance et à la cohabitation", ["Constitution de 1958", "Alternance"], OK),
  unit("3e", "hg", "femmes-hommes", "Histoire", "Femmes et hommes dans la société des années 1950 aux années 1980", ["Évolutions sociales", "Réponses politiques"], OK, { needs: ["4e-hg-femmes"] }),
  unit("3e", "hg", "aires-urbaines", "Géographie", "Les aires urbaines, une nouvelle géographie d'une France mondialisée", ["Pôle et couronne", "Périurbanisation", "Métropolisation"], OK, { needs: ["4e-hg-urbanisation"], sessionId: "geographie-aires-3e" }),
  unit("3e", "hg", "productifs", "Géographie", "Les espaces productifs et leurs évolutions", ["Industrie, agriculture, services"], OK),
  unit("3e", "hg", "faible-densite", "Géographie", "Les espaces de faible densité et leurs atouts", ["Espaces ruraux, montagnes"], OK),
  unit("3e", "hg", "amenager", "Géographie", "Aménager pour répondre aux inégalités entre territoires", ["Acteurs de l'aménagement"], OK),
  unit("3e", "hg", "outre-mer", "Géographie", "Les territoires ultramarins français", ["Une problématique spécifique"], OK),
  unit("3e", "hg", "ue", "Géographie", "L'Union européenne, un nouveau territoire de référence et d'appartenance", ["Frontières, mobilités"], OK),
  unit("3e", "hg", "france-monde", "Géographie", "La France et l'Europe dans le monde", ["Influence, puissance"], OK),


  unit("3e", "anglais", "langages", "Culture", "Langages", ["Langues et expressions", "Le passif"], OK, { needs: ["4e-anglais-langages"] }),
  unit("3e", "anglais", "ecole", "Culture", "École et société", ["Must, have to, should", "Donner son opinion"], OK, { needs: ["4e-anglais-ecole"] }),
  unit("3e", "anglais", "voyages", "Culture", "Voyages et migrations", ["Present perfect ou prétérit", "Raconter une expérience"], OK, { needs: ["4e-anglais-voyages"], sessionId: "anglais-present-perfect-3e" }),
  unit("3e", "anglais", "rencontres", "Culture", "Rencontres avec d'autres cultures", ["Imaginer l'avenir : will, would", "Discours indirect"], OK, { needs: ["4e-anglais-rencontres"] }),
  unit("3e", "espagnol", "langages", "Culture", "Langages", ["Exprimer ses goûts", "Ser et estar"], OK, { needs: ["4e-espagnol-langages"] }),
  unit("3e", "espagnol", "ecole", "Culture", "École et société", ["Imparfait", "Comparer hier et aujourd'hui"], OK, { needs: ["4e-espagnol-ecole"] }),
  unit("3e", "espagnol", "voyages", "Culture", "Voyages et migrations", ["Raconter au pretérito indefinido", "Marqueurs du passé"], OK, { needs: ["4e-espagnol-voyages"], sessionId: "espagnol-passe-3e" }),
  unit("3e", "espagnol", "rencontres", "Culture", "Rencontres avec d'autres cultures", ["Futur", "Projets"], OK, { needs: ["4e-espagnol-rencontres"] }),

  unit("3e", "physique", "atomes", "Matière", "Atomes et ions", ["Structure de l'atome", "Ions", "Tests d'identification"], TODO, { needs: ["4e-physique-molecules"] }),
  unit("3e", "physique", "vitesse", "Mouvement et interactions", "Mouvement et vitesse", ["Vitesse moyenne", "Conversions m/s et km/h"], TODO, { needs: ["4e-physique-mouvement"], sessionId: "vitesse-moyenne-3e" }),
  unit("3e", "physique", "forces", "Mouvement et interactions", "Interactions et forces, poids", ["Modéliser par une force", "P = m × g"], TODO),
  unit("3e", "physique", "acides", "Matière", "Acides, bases et pH", ["Mesurer un pH", "Réaction acide–métal"], TODO, { needs: ["4e-physique-molecules"] }),
  unit("3e", "physique", "energie", "Énergie", "Énergie cinétique et sécurité routière", ["Ec = ½ m v²", "Distance de freinage"], TODO),
  unit("3e", "physique", "electricite", "Énergie", "Puissance et énergie électriques", ["P = U × I", "E = P × t"], TODO, { needs: ["4e-physique-ohm"] }),
  unit("3e", "physique", "signaux", "Signaux", "Signaux sonores et lumineux", ["Vitesse du son", "Fréquence"], TODO, { needs: ["4e-physique-lumiere"] }),
  unit("3e", "svt", "genetique", "Le vivant", "L'information génétique", ["Chromosomes et ADN", "Gènes et allèles", "Caryotype"], TODO, { needs: ["4e-svt-reproduction"], sessionId: "svt-genetique-3e" }),
  unit("3e", "svt", "evolution", "Le vivant", "L'évolution des êtres vivants", ["Sélection naturelle", "Parentés"], TODO),
  unit("3e", "svt", "microbes", "Corps et santé", "Le monde microbien et notre santé", ["Réactions immunitaires", "Vaccins et antibiotiques"], TODO, { needs: ["4e-svt-nerveux"] }),
  unit("3e", "svt", "climat", "Planète Terre", "Climat et activités humaines", ["Météo ou climat", "Réchauffement climatique"], TODO, { needs: ["4e-svt-tectonique"] }),

  unit("3e", "techno", "usages", "Thème 1", "Objets et systèmes : usages, impacts, cycle de vie", ["Comparer des principes techniques", "Incidence sur la société", "Cycle de vie et développement durable"], "verified_official", { needs: ["4e-techno-usages"] }),
  unit("3e", "techno", "chaines", "Thème 2", "Chaînes d'information et d'énergie", ["Acquérir, traiter, communiquer", "Alimenter, distribuer, convertir"], "verified_official", { needs: ["4e-techno-fonctionnement"] }),
  unit("3e", "techno", "programmer", "Thème 2", "Programmer une nouvelle fonctionnalité", ["Capteurs et actionneurs", "Algorithme", "Blocs et programmation textuelle"], "verified_official", { needs: ["4e-techno-fonctionnement"], sessionId: "techno-programmation-3e" }),
  unit("3e", "techno", "donnees", "Thème 2", "Numérisation des données et circulation sur Internet", ["Données numériques", "Réseaux"], "verified_official"),
  unit("3e", "techno", "projet", "Thème 3", "Mener un projet de conception en équipe", ["Processus de conception", "Sous-programmes et fonctions", "Tests"], "verified_official", { needs: ["4e-techno-conception"] }),

  unit("3e", "arts", "oeuvre", "Arts plastiques", "Analyser une œuvre : composition et intention", ["Composition, lumière, couleur", "Intention et réception"], TODO, { needs: ["4e-arts-oeuvre"], sessionId: "arts-composition-3e" }),
  unit("3e", "arts", "projet", "Arts plastiques", "Concevoir un projet plastique", ["Choix de matériaux", "Justifier une intention"], TODO),
  unit("3e", "musique", "ecouter", "Éducation musicale", "Écouter, décrire, comparer", ["Rythme et tempo", "Timbres et formes"], TODO, { needs: ["4e-musique-ecouter"], sessionId: "musique-rythme-3e" }),
  unit("3e", "musique", "projet", "Éducation musicale", "Projet musical et histoire des arts", ["Interpréter", "Contextualiser"], TODO),
  unit("3e", "eps", "affrontement", "EPS", "Conduire et maîtriser un affrontement", ["Lire le rapport de force", "Choisir une tactique"], TODO, { needs: ["4e-eps-affrontement"], sessionId: "eps-tactique-3e" }),
  unit("3e", "eps", "sante", "EPS", "S'entraîner et préserver sa santé", ["Échauffement progressif", "Fixer un objectif personnel"], TODO, { needs: ["4e-eps-sante"] }),
];

export const COLLEGE_UNITS: Unit[] = [...G6, ...G5, ...G4, ...G3];
