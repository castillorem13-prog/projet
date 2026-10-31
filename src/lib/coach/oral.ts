import { en, es } from "@/lib/content/lexicon";
import type { Passion } from "@/lib/content/passions";
import type { SubjectId } from "@/lib/curriculum/types";
import { rng } from "./drills";

/**
 * Défi oral et VO du jour (méthodes nordiques). Tout est préparé sur l'appareil : sujet lié au chapitre en cours et
 * aux passions, débuts de phrases, réponse modèle lue par la voix de synthèse de l'appareil.
 * L'enregistrement éventuel reste dans la page (jamais envoyé, jamais sauvegardé).
 */

export type Lang = "anglais" | "espagnol" | "allemand";
export const LANG_CODE: Record<Lang, string> = { anglais: "en-GB", espagnol: "es-ES", allemand: "de-DE" };
export const LANG_LABEL: Record<Lang, string> = { anglais: "anglais", espagnol: "espagnol", allemand: "allemand" };

export const isLang = (s: SubjectId): s is Lang => s === "anglais" || s === "espagnol" || s === "allemand";

export interface OralChallenge {
  lang: Lang;
  task: string;
  theme: string;
  starters: string[];
  model: string;
  checklist: string[];
}

const TASKS: Record<Lang, { task: string; starters: string[]; model: (p: Passion) => string; checklist: string[] }[]> = {
  anglais: [
    {
      task: "Présente ta passion à un correspondant : depuis quand, pourquoi, un souvenir précis.",
      starters: ["I've been into … since …", "What I like most about it is …", "I'll never forget the day when …"],
      model: (p) => `I've been into ${en(p)} for three years. What I like most is that I'm always learning something new. I'll never forget the day when I tried it for the first time: I was so nervous, but it was amazing.`,
      checklist: ["J'ai parlé sans lire mes notes", "J'ai utilisé le present perfect (I've been, I've…)", "J'ai raconté un souvenir au prétérit"],
    },
    {
      task: "Raconte ton dernier week-end, puis dis ce que tu vas faire le prochain.",
      starters: ["Last weekend, I …", "Then, …", "Next weekend, I'm going to …"],
      model: (p) => `Last weekend, I watched a documentary about ${en(p)} and I went out with my friends. Then, I helped my parents at home. Next weekend, I'm going to practise a lot, because I want to get better.`,
      checklist: ["J'ai parlé sans lire mes notes", "J'ai utilisé le prétérit pour le passé", "J'ai utilisé going to pour le futur"],
    },
    {
      task: "Donne ton avis sur le thème de ton chapitre : une idée, une raison, un exemple.",
      starters: ["In my opinion, …", "The main reason is that …", "For example, …"],
      model: () => "In my opinion, it's a really interesting topic. The main reason is that it changes the way we live every day. For example, my friends and I talk about it all the time.",
      checklist: ["J'ai parlé sans lire mes notes", "J'ai donné une raison (because, the reason is…)", "J'ai donné un exemple"],
    },
  ],
  espagnol: [
    {
      task: "Présente ta passion : depuis quand, pourquoi, un souvenir précis.",
      starters: ["Me encanta … porque …", "Desde hace … años, …", "Un día, …"],
      model: (p) => `Me ${/^(los|las) /.test(es(p)) ? "encantan" : "encanta"} ${es(p)} porque siempre aprendo algo nuevo. Desde hace tres años, practico con mis amigos. Un día, gané un pequeño torneo y fue genial.`,
      checklist: ["J'ai parlé sans lire mes notes", "J'ai utilisé gustar ou encantar correctement", "J'ai raconté un souvenir au passé"],
    },
    {
      task: "Raconte ton dernier week-end, puis ce que tu vas faire le prochain.",
      starters: ["El fin de semana pasado, …", "Después, …", "El próximo fin de semana, voy a …"],
      model: () => "El fin de semana pasado, fui al cine con mi familia. Después, cené en casa de mis abuelos. El próximo fin de semana, voy a descansar y a ver una serie en versión original.",
      checklist: ["J'ai parlé sans lire mes notes", "J'ai utilisé le pretérito indefinido", "J'ai utilisé ir a + infinitif pour le futur"],
    },
    {
      task: "Donne ton avis sur le thème de ton chapitre : une idée, une raison, un exemple.",
      starters: ["En mi opinión, …", "Porque …", "Por ejemplo, …"],
      model: () => "En mi opinión, es un tema muy importante. Porque nos afecta a todos en la vida diaria. Por ejemplo, en mi colegio hablamos mucho de eso.",
      checklist: ["J'ai parlé sans lire mes notes", "J'ai donné une raison (porque…)", "J'ai donné un exemple"],
    },
  ],
  allemand: [
    {
      task: "Présente ta passion : depuis quand, pourquoi, un souvenir précis.",
      starters: ["Ich interessiere mich für …", "Seit … Jahren …", "Einmal habe ich …"],
      model: () => "Ich interessiere mich sehr für mein Hobby. Seit drei Jahren mache ich das jeden Samstag. Einmal habe ich ein kleines Turnier gewonnen, das war super.",
      checklist: ["J'ai parlé sans lire mes notes", "J'ai mis le verbe en deuxième position", "J'ai raconté un souvenir au parfait (habe … gewonnen)"],
    },
    {
      task: "Raconte ton dernier week-end.",
      starters: ["Am Wochenende habe ich …", "Dann bin ich …", "Am Abend …"],
      model: () => "Am Wochenende habe ich Fußball gespielt. Dann bin ich ins Kino gegangen. Am Abend habe ich mit meiner Familie gegessen.",
      checklist: ["J'ai parlé sans lire mes notes", "J'ai utilisé le parfait (haben ou sein)", "J'ai mis le participe à la fin"],
    },
    {
      task: "Donne ton avis sur le thème de ton chapitre.",
      starters: ["Meiner Meinung nach …", "…, weil …", "Zum Beispiel …"],
      model: () => "Meiner Meinung nach ist das Thema wichtig, weil es uns alle betrifft. Zum Beispiel sprechen wir in der Schule oft darüber.",
      checklist: ["J'ai parlé sans lire mes notes", "J'ai mis le verbe à la fin après weil", "J'ai donné un exemple"],
    },
  ],
};

export function oralChallenge(lang: Lang, passion: Passion, theme: string, seed: string): OralChallenge {
  const r = rng(`${seed}-${lang}`);
  const t = r.pick(TASKS[lang]);
  return { lang, task: t.task, theme, starters: t.starters, model: t.model(passion), checklist: t.checklist };
}

/* ——— VO du jour ——— */

export interface VoSuggestion {
  lang: Lang;
  idea: string;
  tips: string[];
}

const VO_BY_FAMILY: Record<Passion["family"], (lang: string, p: Passion) => string> = {
  sport: (l, p) => `Le résumé d'un match ou d'une compétition de ${p.label.toLowerCase()}, commenté en ${l}.`,
  jeux: (l, p) => `Une vidéo de partie commentée en ${l} (${p.label.toLowerCase()}), sous-titres en ${l}.`,
  musique: (l) => `Une chanson en ${l} : écoute-la une fois, puis réécoute en lisant les paroles.`,
  creation: (l, p) => `Un tutoriel en ${l} sur ${p.label.toLowerCase()} : suis-le comme si tu devais le refaire.`,
  sciences: (l, p) => `Une courte vidéo de vulgarisation en ${l} sur ${p.label.toLowerCase()}.`,
  monde: (l, p) => `Un reportage ou un podcast en ${l} sur ${p.label.toLowerCase()}, sous-titres en ${l}.`,
};

export function voSuggestion(lang: Lang, passion: Passion): VoSuggestion {
  const l = LANG_LABEL[lang];
  return {
    lang,
    idea: VO_BY_FAMILY[passion.family](l, passion),
    tips: [`Sous-titres en ${l}, pas en français : tu entends et tu lis la même langue.`, "Note trois expressions que tu aimerais réutiliser.", "10 minutes suffisent : la régularité compte plus que la durée."],
  };
}

/** Voix de synthèse de l'appareil (aucune donnée envoyée par LearnWard). */
export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
}

export function speak(text: string, lang: string, rate = 0.95): boolean {
  if (!canSpeak()) return false;
  const u = new window.SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
  if (voice) u.voice = voice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return true;
}
