import type { Activity, ProblemActivity, Session } from "./types";

/**
 * Exercices partenaires : certaines activités existent dans une version écrite avec une enseigne partenaire
 * (fictive). Règles, vérifiées par les tests :
 *  - même format, même compétence, même étape et mêmes réponses que la version sans marque ;
 *  - jamais en histoire-géographie, en EMC, en philosophie, ni dans un contrôle blanc ;
 *  - toujours signalé à l'élève, avec le bonus de points offert par le partenaire ;
 *  - le parent peut les désactiver : l'élève voit alors la version sans marque ;
 *  - le bonus récompense l'exercice terminé, pas la réussite, et ne change jamais la maîtrise.
 */

export interface Sponsorship {
  sessionId: string;
  activityId: string;
  partnerId: string;
  /** Points offerts par le partenaire quand l'exercice est terminé. */
  bonus: number;
  /** Ce que l'élève fait dans l'exercice, dit en une ligne (affiché sur la fiche du partenaire). */
  pitch: string;
  build: (a: Activity) => Activity;
}

/** Remplace l'énoncé d'un problème et, si besoin, celui de certaines questions. */
const problem = (context: string, prompts: Record<string, string> = {}) => (a: Activity): Activity => {
  const p = a as ProblemActivity;
  return { ...p, context, parts: p.parts.map((part) => (prompts[part.id] ? { ...part, prompt: prompts[part.id] as string } : part)) };
};

export const SPONSORSHIPS: Sponsorship[] = [
  {
    sessionId: "fonctions-affines-3e",
    activityId: "fa-formules",
    partnerId: "stade",
    bonus: 15,
    pitch: "Comparer deux formules de location de terrain de padel",
    build: problem("Côté Terrain loue ses terrains de padel avec deux formules. Formule A : 8 € la séance. Formule B : un abonnement de 20 €, puis 4 € la séance.", {
      "ff-a": "Combien coûtent 3 séances avec la formule A ?",
      "ff-b": "Combien coûtent 3 séances avec la formule B ?",
      "ff-c": "À partir de combien de séances la formule B devient-elle strictement moins chère ?",
    }),
  },
  {
    sessionId: "calcul-litteral-4e",
    activityId: "cl-substituer",
    partnerId: "cahier",
    bonus: 10,
    pitch: "Calculer le prix d'un lot de cahiers personnalisés avec une expression littérale",
    build: problem("Chez Cahier Malin, un lot de n cahiers personnalisés coûte 4n + 3 euros : 4 € par cahier, plus 3 € pour la personnalisation, payés une seule fois.", {
      "cl-b": "Que vaut 4n + 3 pour n = 0 ? Ce nombre correspond aux frais de personnalisation.",
    }),
  },
  {
    sessionId: "inequations-2nde",
    activityId: "iq-formules",
    partnerId: "lumiere",
    bonus: 15,
    pitch: "Trouver à partir de combien de séances une carte de cinéma devient rentable",
    build: problem("Ciné Lumière propose deux tarifs. Tarif A : 9 € la place. Tarif B : une carte à 30 € pour l'année, puis 4 € la place.", {
      "iq-a": "Combien coûtent 6 places avec la carte (tarif B) ?",
      "iq-b": "À partir de combien de places la carte devient-elle strictement moins chère ?",
    }),
  },
  {
    sessionId: "fractions-6e",
    activityId: "fr6-situation",
    partnerId: "bulle",
    bonus: 10,
    pitch: "Calculer une fraction d'une série de 30 tomes",
    build: problem("Tu as découvert chez Bulle & Planche une série de 30 tomes. Tu en as déjà lu les 2/5.", {
      "fr6-a": "Combien de tomes as-tu déjà lus ?",
      "fr6-b": "Combien t'en reste-t-il à lire ?",
    }),
  },
  {
    sessionId: "proportionnalite-5e",
    activityId: "pr5-carnet",
    partnerId: "stade",
    bonus: 15,
    pitch: "Calculer le prix d'un carnet de séances, puis appliquer une réduction en pourcentage",
    build: problem("Côté Terrain propose un carnet de 8 séances de padel pour 48 €. Le prix est proportionnel au nombre de séances. Pour les moins de 18 ans, le carnet bénéficie d'une réduction de 25 %.", {
      "pr5-a": "Combien coûtent 5 séances, sans réduction ?",
    }),
  },
  {
    sessionId: "suites-1re",
    activityId: "su-situation",
    partnerId: "curieuse",
    bonus: 15,
    pitch: "Modéliser la fréquentation d'une exposition par une suite arithmétique",
    build: problem("L'exposition de Planète Curieuse accueille 120 visiteurs le jour de l'ouverture (jour 0), puis 15 visiteurs de plus chaque jour. On note uₙ le nombre de visiteurs le jour n.", {
      "su-a": "Calcule u₁₀.",
      "su-b": "À partir de quel jour n l'exposition accueille-t-elle au moins 300 visiteurs ?",
    }),
  },
  {
    sessionId: "vitesse-moyenne-3e",
    activityId: "vm-situation",
    partnerId: "roue",
    bonus: 15,
    pitch: "Calculer et convertir la vitesse d'un cycliste",
    build: problem("Sur la piste d'initiation de Roue Libre, Lina parcourt 60 m à vélo en 8 s."),
  },
  {
    sessionId: "snt-web-2nde",
    activityId: "sn-url",
    partnerId: "octet",
    bonus: 10,
    pitch: "Décomposer l'adresse d'une page web",
    build: (a) =>
      a.kind === "classify"
        ? {
            ...a,
            prompt: "Range chaque morceau de l'adresse d'une page du site d'Octet & Cie (site fictif) : https://www.octet-et-cie.exemple/calculatrices/graphique.html",
            items: [
              { text: "https", category: 0, feedback: "Le protocole : HTTP sécurisé." },
              { text: "www.octet-et-cie.exemple", category: 1, feedback: "Le nom de domaine du serveur." },
              { text: "/calculatrices/graphique.html", category: 2, feedback: "Le chemin de la ressource sur le serveur." },
            ],
            solution: ["Protocole : https.", "Domaine : www.octet-et-cie.exemple.", "Chemin : /calculatrices/graphique.html."],
          }
        : a,
  },
  {
    sessionId: "techno-programmation-3e",
    activityId: "te-choix",
    partnerId: "octet",
    bonus: 10,
    pitch: "Choisir une solution technique avec un cahier des charges",
    build: (a) =>
      a.kind === "mcq"
        ? { ...a, prompt: "Bureau d'étude : Octet & Cie veut éclairer sa vitrine. Le cahier des charges impose que la lumière s'allume sans contact, même les mains pleines, et que l'installation consomme peu. Quelle solution choisis-tu ?" }
        : a,
  },
  {
    sessionId: "musique-rythme-3e",
    activityId: "mu-durees",
    partnerId: "note",
    bonus: 10,
    pitch: "Compter les durées dans une partition",
    build: (a) =>
      a.kind === "problem"
        ? { ...a, context: `Note Bleue publie une partition d'exercice pour ses cours d'essai. ${a.context}` }
        : a,
  },
  {
    sessionId: "anglais-present-perfect-3e",
    activityId: "en-question",
    partnerId: "de",
    bonus: 10,
    pitch: "Poser une question au present perfect",
    build: (a) =>
      a.kind === "order"
        ? {
            ...a,
            prompt: "Au salon de jeux Le Dé Voyageur, tu joues avec une joueuse anglaise. Remets les mots dans l'ordre pour lui poser la question.",
            steps: ["Have", "you", "ever", "played", "this game?"],
            solution: ["Auxiliaire + sujet + ever + participe passé + complément.", "Have you ever played this game?"],
          }
        : a,
  },
  {
    sessionId: "arts-composition-3e",
    activityId: "ar-projet",
    partnerId: "pigment",
    bonus: 15,
    pitch: "Imaginer une affiche et justifier sa composition",
    build: (a) =>
      a.kind === "writing"
        ? { ...a, prompt: "Concours d'affiches de l'Atelier Pigment : imagine une image sur l'idée de solidarité. Décris la composition choisie, la lumière ou la couleur, et l'effet recherché sur le spectateur (4 à 6 phrases)." }
        : a,
  },
];

/** Matières où les exercices partenaires sont interdits : les faits, les valeurs et les textes ne se sponsorisent pas. */
export const NO_SPONSOR_SUBJECTS = ["hg", "emc", "philo", "hggsp", "dgemc"] as const;

export function sponsorshipFor(sessionId: string, activityId: string): Sponsorship | undefined {
  return SPONSORSHIPS.find((s) => s.sessionId === sessionId && s.activityId === activityId);
}

export function sponsorshipsOf(partnerId: string): Sponsorship[] {
  return SPONSORSHIPS.filter((s) => s.partnerId === partnerId);
}

/** L'activité telle que l'élève la voit : version partenaire si elle existe et si elle est autorisée. */
export function shownActivity(session: Session, activity: Activity, allowed: boolean): { activity: Activity; sponsor?: Sponsorship } {
  if (!allowed) return { activity };
  const s = sponsorshipFor(session.id, activity.id);
  if (!s || (NO_SPONSOR_SUBJECTS as readonly string[]).includes(session.subject)) return { activity };
  return { activity: s.build(activity), sponsor: s };
}
