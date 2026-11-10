import type { Fact, FactSet } from "../types";

/** Faits de SES : notions des programmes de seconde, première et terminale. */

const t = (id: string, units: string[], term: string, definition: string): Fact => ({ kind: "term", id, units, term, definition });
const c = (id: string, units: string[], set: string, item: string, category: string): Fact => ({ kind: "class", id, units, set, item, category });

const RICH = ["2nde-ses-richesses", "Tle-ses-croissance"];
const MARCHE = ["2nde-ses-prix", "1re-ses-marche"];
const DEF = ["1re-ses-defaillances", "Tle-ses-environnement"];
const SOC = ["2nde-ses-socialisation", "1re-ses-socialisation"];
const EMPLOI = ["Tle-ses-chomage", "2nde-ses-diplome"];
const POL = ["2nde-ses-politique", "1re-ses-opinion"];

export const SES_FACTS: FactSet = {
  id: "faits-ses",
  subject: "ses",
  title: "SES : notions des programmes",
  status: "needs_review",
  sources: [
    { id: "lycee-2019", label: "Programmes de SES de seconde et de première, BO spécial n° 1 du 22 janvier 2019", url: "https://eduscol.education.gouv.fr/4368/enseigner-au-lycee-generaltechnologique" },
    { id: "tle-2019", label: "Programme de SES de terminale, BO spécial n° 8 du 25 juillet 2019", url: "https://eduscol.education.gouv.fr/4368/enseigner-au-lycee-generaltechnologique" },
    { id: "insee", label: "Insee, définitions (PIB, valeur ajoutée, chômage au sens du BIT…)", url: "https://www.insee.fr/fr/metadonnees/definitions" },
  ],
  sets: {
    production: { prompt: "Production marchande ou non marchande ?", categories: ["Marchande", "Non marchande"] },
    instrument: { prompt: "Quel instrument de politique environnementale ?", categories: ["Réglementation", "Taxation", "Marché de quotas"] },
    instance: { prompt: "Socialisation primaire ou secondaire ?", categories: ["Primaire", "Secondaire"] },
  },
  facts: [
    t("se-pib", RICH, "PIB", "Somme des valeurs ajoutées produites sur le territoire d'un pays pendant une année (plus les impôts sur les produits, moins les subventions)"),
    t("se-va", RICH, "Valeur ajoutée", "Valeur de la production diminuée des consommations intermédiaires"),
    t("se-ci", RICH, "Consommations intermédiaires", "Biens et services transformés ou détruits au cours de la production"),
    t("se-marchande", RICH, "Production marchande", "Production destinée à être vendue sur un marché à un prix couvrant au moins ses coûts"),
    t("se-non-marchande", RICH, "Production non marchande", "Production fournie gratuitement ou à un prix très inférieur à son coût, principalement par les administrations"),
    t("se-productivite", RICH, "Productivité du travail", "Quantité produite par travailleur ou par heure de travail"),
    t("se-progres", ["Tle-ses-croissance"], "Progrès technique", "Ensemble des innovations qui améliorent les produits et les méthodes de production"),
    t("se-capital-humain", ["Tle-ses-croissance", "2nde-ses-diplome", "Tle-ses-ecole"], "Capital humain", "Ensemble des connaissances, compétences et qualifications d'une personne, qui accroissent sa productivité"),
    t("se-marche", MARCHE, "Marché", "Lieu, réel ou fictif, de rencontre entre l'offre et la demande d'un bien ou d'un service"),
    t("se-equilibre", MARCHE, "Prix d'équilibre", "Prix pour lequel la quantité offerte est égale à la quantité demandée"),
    t("se-surplus", ["1re-ses-marche"], "Surplus du consommateur", "Différence entre le prix maximal que les acheteurs étaient prêts à payer et le prix effectivement payé"),
    t("se-concurrence", ["1re-ses-marche"], "Concurrence parfaite", "Situation théorique de marché où de nombreux offreurs et demandeurs échangent un produit homogène, avec une information parfaite"),
    t("se-externalite", DEF, "Externalité", "Effet positif ou négatif de l'activité d'un agent sur d'autres, sans compensation monétaire"),
    t("se-bien-commun", DEF, "Bien commun", "Bien rival mais non excluable, comme les stocks de poissons en mer"),
    t("se-bien-collectif", ["1re-ses-defaillances"], "Bien collectif", "Bien non rival et non excluable, comme l'éclairage public"),
    t("se-asymetrie", ["1re-ses-defaillances"], "Asymétrie d'information", "Situation où un agent dispose d'informations que l'autre n'a pas"),
    t("se-monnaie", ["1re-ses-monnaie"], "Monnaie", "Actif accepté par tous comme moyen de paiement, unité de compte et réserve de valeur"),
    t("se-masse-monetaire", ["1re-ses-monnaie"], "Masse monétaire", "Quantité de monnaie en circulation dans une économie"),
    t("se-creation", ["1re-ses-monnaie"], "Création monétaire", "Création de monnaie par les banques commerciales lorsqu'elles accordent des crédits"),
    t("se-taux-directeur", ["1re-ses-monnaie"], "Taux directeur", "Taux d'intérêt fixé par la banque centrale pour les prêts aux banques"),
    t("se-socialisation", SOC, "Socialisation", "Processus par lequel un individu intériorise les normes et les valeurs de la société"),
    t("se-norme", SOC, "Norme sociale", "Règle de conduite partagée dans un groupe social"),
    t("se-valeur", SOC, "Valeur", "Idéal collectif auquel adhèrent les membres d'une société"),
    t("se-instance", SOC, "Instance de socialisation", "Institution ou groupe qui participe à la socialisation : famille, école, pairs, médias"),
    t("se-chomeur-bit", EMPLOI, "Chômeur au sens du BIT", "Personne en âge de travailler, sans emploi, disponible rapidement et qui recherche activement un emploi"),
    t("se-population-active", EMPLOI, "Population active", "Ensemble des personnes en emploi et des chômeurs"),
    t("se-chomage-structurel", ["Tle-ses-chomage"], "Chômage structurel", "Chômage lié au fonctionnement durable du marché du travail (inadéquation des qualifications, rigidités)"),
    t("se-chomage-conjoncturel", ["Tle-ses-chomage"], "Chômage conjoncturel", "Chômage lié à un ralentissement de l'activité économique"),
    t("se-pcs", ["Tle-ses-structure"], "PCS", "Nomenclature de l'Insee qui classe les personnes selon leur profession et leur catégorie sociale"),
    t("se-mobilite", ["Tle-ses-structure", "Tle-ses-ecole"], "Mobilité sociale", "Changement de position sociale d'un individu par rapport à celle de ses parents"),
    t("se-democratisation", ["Tle-ses-ecole"], "Massification scolaire", "Augmentation du nombre d'élèves accédant à des niveaux d'études plus élevés"),
    t("se-opinion", ["1re-ses-opinion"], "Opinion publique", "Ensemble des opinions partagées par une partie importante de la population, souvent mesurées par des sondages"),
    t("se-sondage", ["1re-ses-opinion", "2nde-ses-methodes"], "Sondage", "Enquête réalisée auprès d'un échantillon représentatif pour estimer les opinions ou caractéristiques d'une population"),
    t("se-echantillon", ["1re-ses-opinion", "2nde-ses-methodes"], "Échantillon représentatif", "Sous-groupe qui reproduit les caractéristiques de la population étudiée"),
    t("se-abstention", POL, "Abstention", "Fait de ne pas voter lorsqu'on est inscrit sur les listes électorales"),
    t("se-parti", POL, "Parti politique", "Organisation qui cherche à conquérir et exercer le pouvoir en présentant des candidats aux élections"),
    t("se-correlation", ["2nde-ses-methodes"], "Corrélation", "Lien statistique entre deux variables, qui ne prouve pas à lui seul une relation de cause à effet"),
    t("se-quotas", ["Tle-ses-environnement"], "Marché de quotas d'émission", "Système où l'État fixe un plafond d'émissions et distribue des droits à polluer échangeables"),

    c("cl-boulangerie", RICH, "production", "Le pain vendu par une boulangerie", "Marchande"),
    c("cl-ecole-pub", RICH, "production", "L'enseignement dans un collège public", "Non marchande"),
    c("cl-coiffeur", RICH, "production", "Une coupe chez un coiffeur", "Marchande"),
    c("cl-police", RICH, "production", "La sécurité assurée par la police nationale", "Non marchande"),
    c("cl-voiture", RICH, "production", "Une voiture vendue par un constructeur", "Marchande"),
    c("cl-hopital", RICH, "production", "Les soins d'un hôpital public", "Non marchande"),
    c("cl-norme-auto", ["Tle-ses-environnement"], "instrument", "Une norme d'émission imposée aux voitures neuves", "Réglementation"),
    c("cl-interdiction", ["Tle-ses-environnement"], "instrument", "L'interdiction d'un pesticide", "Réglementation"),
    c("cl-taxe-carbone", ["Tle-ses-environnement"], "instrument", "Une taxe sur les tonnes de CO₂ émises", "Taxation"),
    c("cl-ecotaxe", ["Tle-ses-environnement"], "instrument", "Un supplément payé à l'achat d'un véhicule très polluant", "Taxation"),
    c("cl-seqe", ["Tle-ses-environnement"], "instrument", "Le système européen d'échange de droits d'émission", "Marché de quotas"),
    c("cl-droits", ["Tle-ses-environnement"], "instrument", "Des permis d'émission que les entreprises peuvent revendre", "Marché de quotas"),
    c("cl-famille", SOC, "instance", "La famille pendant l'enfance", "Primaire"),
    c("cl-ecole-elem", SOC, "instance", "L'école élémentaire", "Primaire"),
    c("cl-travail", SOC, "instance", "Le milieu professionnel", "Secondaire"),
    c("cl-couple", SOC, "instance", "La vie de couple à l'âge adulte", "Secondaire"),
    c("cl-syndicat", SOC, "instance", "L'engagement dans un syndicat", "Secondaire"),
    c("cl-jeux", SOC, "instance", "Les jeux avec les autres enfants", "Primaire"),
  ],
};
