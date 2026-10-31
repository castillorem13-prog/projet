/** Parcours d'Explorer : séparés des capsules pour que l'accueil n'ait pas à charger leurs exercices. */

export type TrackId = "code" | "argent" | "ia" | "espace" | "cerveau" | "approfondir";

export interface Track {
  id: TrackId;
  title: string;
  tagline: string;
  /** Couleur vive de la carte (fond) et couleur du texte posé dessus. */
  color: string;
  ink: string;
}

export const TRACKS: Track[] = [
  { id: "code", title: "Coder en Python", tagline: "Variables, boucles, conditions : lire et corriger du vrai code.", color: "#3df2b0", ink: "#0b2a20" },
  { id: "argent", title: "Gérer son argent", tagline: "Budget, épargne, intérêts, arnaques : les bases pour être libre.", color: "#ffd60a", ink: "#1a1433" },
  { id: "ia", title: "IA et numérique", tagline: "Comment une IA apprend, ce qu'elle sait faire, tes données en ligne.", color: "#c4a1ff", ink: "#22104a" },
  { id: "espace", title: "L'espace", tagline: "Distances, lumière, Lune : l'Univers en ordres de grandeur.", color: "#4cd7ff", ink: "#04263a" },
  { id: "cerveau", title: "Apprendre à apprendre", tagline: "Ce qui marche vraiment pour retenir, d'après la recherche.", color: "#ff8ad8", ink: "#3d0a2b" },
  { id: "approfondir", title: "Aller plus loin", tagline: "Les questions que le cours n'a pas le temps de traiter.", color: "#ff8f70", ink: "#3a1206" },
];

export const getTrack = (id: TrackId) => TRACKS.find((t) => t.id === id) as Track;
