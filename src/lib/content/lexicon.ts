import type { FamilyId, Passion } from "./passions";

/**
 * Passions traduites pour les phrases d'exemple en anglais et en espagnol.
 * Une passion inventée par l'élève (sans traduction connue) prend le mot de sa famille.
 */
const EN: Record<string, string> = {
  football: "football", basket: "basketball", rugby: "rugby", tennis: "tennis", natation: "swimming", athletisme: "athletics",
  velo: "cycling", skate: "skateboarding", danse: "dancing", equitation: "horse riding",
  aventure: "adventure games", "course-auto": "racing games", construction: "building games", esport: "esports", echecs: "chess",
  rap: "rap", guitare: "rock music", piano: "piano music", batterie: "drumming", chant: "singing",
  dessin: "drawing", manga: "manga", photo: "photography", video: "video making", cuisine: "baking", mode: "fashion", theatre: "acting",
  espace: "space", animaux: "animals", dinosaures: "dinosaurs", ocean: "marine life", robotique: "robotics", jardin: "gardening",
  voitures: "cars", aviation: "planes", quotidien: "cycling",
  handball: "handball", volley: "volleyball", combat: "boxing", escalade: "climbing", glisse: "surfing", ski: "skiing", gym: "gymnastics",
  strategie: "strategy games", cartes: "trading cards", enigmes: "escape games", rpg: "role-playing games",
  electro: "electronic music", kpop: "K-pop", jazz: "jazz",
  ecriture: "writing", anime: "anime", podcast: "podcasts", bricolage: "model making", streetart: "street art",
  meteo: "weather", volcans: "volcanoes", corps: "medicine", chimie: "chemistry", trains: "trains",
  histoire: "history", mythologie: "mythology", voyages: "travelling", ecologie: "ecology", business: "business",
};
const EN_FAMILY: Record<FamilyId, string> = { sport: "sport", jeux: "video games", musique: "music", creation: "art", sciences: "science", monde: "travelling" };

const ES: Record<string, string> = {
  football: "el fútbol", basket: "el baloncesto", rugby: "el rugby", tennis: "el tenis", natation: "la natación", athletisme: "el atletismo",
  velo: "el ciclismo", skate: "el skate", danse: "el baile", equitation: "la equitación",
  aventure: "los videojuegos de aventura", "course-auto": "los videojuegos de carreras", construction: "los videojuegos de construcción", esport: "los e-sports", echecs: "el ajedrez",
  rap: "el rap", guitare: "el rock", piano: "el piano", batterie: "la batería", chant: "el canto",
  dessin: "el dibujo", manga: "el manga", photo: "la fotografía", video: "los vídeos", cuisine: "la repostería", mode: "la moda", theatre: "el teatro",
  espace: "el espacio", animaux: "los animales", dinosaures: "los dinosaurios", ocean: "el mar", robotique: "la robótica", jardin: "la jardinería",
  voitures: "los coches", aviation: "los aviones", quotidien: "la bici",
  handball: "el balonmano", volley: "el voleibol", combat: "el boxeo", escalade: "la escalada", glisse: "el surf", ski: "el esquí", gym: "la gimnasia",
  strategie: "los juegos de estrategia", cartes: "las cartas coleccionables", enigmes: "los juegos de escape", rpg: "los juegos de rol",
  electro: "la música electrónica", kpop: "el K-pop", jazz: "el jazz",
  ecriture: "la escritura", anime: "el anime", podcast: "los pódcasts", bricolage: "las maquetas", streetart: "el arte urbano",
  meteo: "el tiempo", volcans: "los volcanes", corps: "la medicina", chimie: "la química", trains: "los trenes",
  histoire: "la historia", mythologie: "la mitología", voyages: "los viajes", ecologie: "la ecología", business: "los negocios",
};
const ES_FAMILY: Record<FamilyId, string> = { sport: "el deporte", jeux: "los videojuegos", musique: "la música", creation: "el arte", sciences: "la ciencia", monde: "los viajes" };

export const en = (p: Passion) => EN[p.id] ?? EN_FAMILY[p.family];
export const es = (p: Passion) => ES[p.id] ?? ES_FAMILY[p.family];

/** « a » ou « an » devant un mot anglais. */
export const enA = (word: string) => (/^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`);

/** « sobre el fútbol » → « sobre el fútbol » ; « de el » se contracte en « del ». */
export const esDe = (noun: string) => (noun.startsWith("el ") ? `del ${noun.slice(3)}` : `de ${noun}`);

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const low = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
