import { demoNow } from "@/lib/content/calendar";
import type { Evidence, MethodId, SubjectId } from "@/lib/curriculum/types";
import { findUnit } from "@/lib/curriculum";
import { evidenceByUnit } from "@/lib/learning/mastery";
import { errorProfile } from "./diagnose";
import { knowledgeOf } from "./learner";

/**
 * Méthodes d'apprentissage activables. Chacune change réellement quelque chose dans l'appli (colonne « effect »)
 * et indique honnêtement ce que l'on sait de son efficacité :
 *  - « Solide » : effet établi par de nombreuses études (pratique de récupération, espacement, entrelacement en maths,
 *    métacognition) ;
 *  - « Prometteur » : recommandé par des synthèses de recherche, effets plus variables ;
 *  - « Observé » : pratique de systèmes éducatifs performants, sans preuve qu'elle soit à elle seule la cause des résultats.
 * Sources de départ : référentiels de conception fournis par l'équipe (mathématiques, langues vivantes), cadre de
 * mathématiques de Singapour, guides de l'Education Endowment Foundation. À relire par un enseignant avant publication.
 */

export type MethodDomain = "maths" | "langues";
export type EvidenceLevel = "Solide" | "Prometteur" | "Observé";

export interface Method {
  id: MethodId;
  domain: MethodDomain;
  origin: string;
  title: string;
  /** Ce que l'élève voit changer. */
  effect: string;
  /** Pourquoi on le propose. */
  why: string;
  evidence: EvidenceLevel;
  evidenceNote: string;
  defaultOn: boolean;
}

export const METHODS: Method[] = [
  {
    id: "sg-modeles",
    domain: "maths",
    origin: "Singapour",
    title: "Modèles en barres",
    effect: "Dans les problèmes, les données sont d'abord dessinées en barres (étape imagée), puis on passe au calcul.",
    why: "Concret, imagé, abstrait : voir la relation entre les quantités avant de manipuler les nombres.",
    evidence: "Prometteur",
    evidenceNote: "Cœur de la méthode de Singapour ; les représentations visuelles sont recommandées par les synthèses de recherche, avec des effets variables selon les notions.",
    defaultOn: true,
  },
  {
    id: "sg-demarche",
    domain: "maths",
    origin: "Singapour",
    title: "Penser sa démarche",
    effect: "Avant un problème : que cherche-t-on, quelles données servent, quelle stratégie ? Après : vérifier que le résultat est plausible.",
    why: "La métacognition (planifier, surveiller, vérifier) est l'une des cinq composantes du cadre singapourien.",
    evidence: "Solide",
    evidenceNote: "Les stratégies métacognitives font partie des approches dont l'effet est le mieux établi.",
    defaultOn: false,
  },
  {
    id: "automatismes",
    domain: "maths",
    origin: "Singapour et sciences cognitives",
    title: "Automatismes quotidiens",
    effect: "5 minutes de calcul rapide chaque jour dans tes objectifs, sur les notions déjà vues.",
    why: "Automatiser les techniques de base libère l'attention pour raisonner ; le rappel quotidien entretient la mémoire.",
    evidence: "Solide",
    evidenceNote: "La pratique de récupération et la répétition espacée sont parmi les effets les mieux établis en psychologie de l'apprentissage.",
    defaultOn: true,
  },
  {
    id: "entrelacement",
    domain: "maths",
    origin: "Sciences cognitives",
    title: "Pratique entrelacée",
    effect: "Les automatismes mélangent les chapitres déjà vus au lieu d'enchaîner les mêmes exercices.",
    why: "Reconnaître quelle méthode utiliser, et pas seulement l'appliquer quand le chapitre l'annonce.",
    evidence: "Solide",
    evidenceNote: "Effet établi en mathématiques, après une première phase d'entraînement ciblé.",
    defaultOn: true,
  },
  {
    id: "oral-dabord",
    domain: "langues",
    origin: "Pays nordiques et Canada",
    title: "L'oral d'abord",
    effect: "Dans les dialogues, tu écoutes la réplique avant de la lire (voix de synthèse de ton appareil).",
    why: "Fixer les sons et l'intonation avant l'écrit, pour ne pas lire la langue avec les sons du français.",
    evidence: "Observé",
    evidenceNote: "Pratique des pays nordiques et de l'approche neurolinguistique canadienne ; effets observés, pas de preuve qu'elle suffise seule.",
    defaultOn: true,
  },
  {
    id: "vo-quotidienne",
    domain: "langues",
    origin: "Pays nordiques",
    title: "10 minutes en VO",
    effect: "Chaque jour, une idée de vidéo, de chanson ou de série en version originale, choisie selon tes passions.",
    why: "Dans les pays nordiques, l'exposition hors de l'école (VO sous-titrée, musique, jeux) fait une grande partie du travail d'écoute.",
    evidence: "Observé",
    evidenceNote: "L'OCDE observe un lien entre exposition hors de l'école et niveau ; c'est une corrélation, pas une preuve de cause.",
    defaultOn: true,
  },
  {
    id: "erreur-sans-stress",
    domain: "langues",
    origin: "Pays nordiques",
    title: "Erreurs sans stress",
    effect: "En langues, une réponse fausse est reformulée sans croix rouge ni son d'erreur ; la correction reste la même.",
    why: "Oser parler sans peur du ridicule : la sécurité affective est un trait des classes de langues nordiques.",
    evidence: "Observé",
    evidenceNote: "S'appuie sur l'hypothèse du « filtre affectif », discutée en recherche. Ta maîtrise est mesurée exactement de la même façon.",
    defaultOn: false,
  },
  {
    id: "defi-oral",
    domain: "langues",
    origin: "Pays nordiques et Pays-Bas",
    title: "Défi oral de 3 minutes",
    effect: "Un sujet par jour, lié à ton chapitre et à tes passions : tu parles 3 minutes, tu peux t'enregistrer et t'écouter.",
    why: "En classe entière, un élève parle très peu ; s'entraîner seul augmente le temps de parole réel.",
    evidence: "Prometteur",
    evidenceNote: "Le temps de pratique orale est un levier reconnu ; l'enregistrement reste sur ton appareil et n'est jamais envoyé.",
    defaultOn: true,
  },
];

export const getMethod = (id: MethodId) => METHODS.find((m) => m.id === id) as Method;

export const DEFAULT_METHODS: Record<MethodId, boolean> = Object.fromEntries(METHODS.map((m) => [m.id, m.defaultOn])) as Record<MethodId, boolean>;

const LANGUES: SubjectId[] = ["anglais", "espagnol", "allemand", "llcer"];
const MATHS: SubjectId[] = ["maths", "maths-tc", "maths-comp", "maths-exp"];

export function domainOf(subject: SubjectId): MethodDomain | null {
  if (MATHS.includes(subject)) return "maths";
  if (LANGUES.includes(subject)) return "langues";
  return null;
}

/** Méthodes actives pour une matière, parmi celles qui sont retenues. */
export function activeMethods(subject: SubjectId, enabled: Record<MethodId, boolean>): MethodId[] {
  const d = domainOf(subject);
  return d ? METHODS.filter((m) => m.domain === d && enabled[m.id]).map((m) => m.id) : [];
}

/**
 * Choix automatique des méthodes (v7) : l'élève ne choisit rien et ne voit aucun réglage. L'analyse interne décide,
 * matière par matière et chapitre par chapitre, à partir de ses réponses :
 *  - modèles en barres : chapitre de maths nouveau ou encore fragile, ou erreurs de sens qui reviennent ;
 *  - penser sa démarche : au moins deux réponses qui répondaient à une autre question ;
 *  - automatismes : toujours, pour un élève qui fait des maths ; entrelacement dès que plusieurs chapitres sont travaillés ;
 *  - l'oral d'abord, la VO et le défi oral : toujours en langues ;
 *  - erreurs sans stress : quand les réponses à reprendre en langues sont fréquentes.
 * Les traces gardent les méthodes utilisées : l'équipe peut mesurer leur effet (analyzeMethods), l'élève ne voit rien.
 */
export function autoMethods(evidence: Evidence[], unitId?: string): Record<MethodId, boolean> {
  const maths = evidence.filter((e) => inDomain(e, "maths"));
  const langues = evidence.filter((e) => inDomain(e, "langues"));
  const own = (list: Evidence[]) => list.filter((e) => !e.itemId.startsWith("seed-"));
  const mathsErrors = errorProfile(own(maths));
  const unit = unitId ? evidence.filter((e) => e.unitId === unitId) : [];
  const k = unitId ? knowledgeOf(unit) : null;
  const unitNewOrFragile = k ? k.n < 3 || k.pKnown < 0.6 : groupWeak(maths).length > 0;
  const lvRetries = langues.filter((e) => e.result !== "success").length;
  return {
    "sg-modeles": unitNewOrFragile || countType(mathsErrors, "conceptuelle") >= 2,
    "sg-demarche": countType(mathsErrors, "strategique") >= 2,
    automatismes: true,
    entrelacement: maths.length >= 6,
    "oral-dabord": true,
    "vo-quotidienne": true,
    "erreur-sans-stress": lvRetries >= 3 && lvRetries / Math.max(1, langues.length) >= 0.3,
    "defi-oral": true,
  };
}

/** Méthodes appliquées dans une séance : celles de la matière, décidées automatiquement pour ce chapitre. */
export function methodsForSession(subject: SubjectId, unitId: string, evidence: Evidence[]): MethodId[] {
  return activeMethods(subject, autoMethods(evidence, unitId));
}

/* ——— Analyse par le coach ——— */

export interface MethodAnalysis {
  id: MethodId;
  on: boolean;
  /** Le coach conseille de l'activer (ou de la garder). */
  recommended: boolean;
  /** Pourquoi, d'après le profil de l'élève. */
  reason: string;
  /** Effet observé sur les exercices de l'élève, quand il y a assez de réponses de chaque côté. */
  observed: { withRate: number; withoutRate: number; nWith: number; nWithout: number } | null;
  /** Réponses encore nécessaires avant de comparer. */
  missing: number;
}

export const MIN_COMPARE = 8;

const success = (e: Evidence) => (e.result === "success" ? 1 : e.result === "partial" ? 0.5 : 0);
const rate = (list: Evidence[]) => (list.length ? list.reduce((s, e) => s + success(e), 0) / list.length : 0);

function inDomain(e: Evidence, d: MethodDomain): boolean {
  const u = findUnit(e.unitId);
  return Boolean(u && domainOf(u.subject) === d);
}

export interface PracticeLog {
  kind: "automatismes" | "vo" | "oral" | "blanc";
  at: string;
  minutes: number;
}

/**
 * Pour chaque méthode : faut-il l'activer, et a-t-elle un effet visible sur les résultats de l'élève ?
 * La comparaison « avec / sans » ne se fait qu'à partir de MIN_COMPARE réponses de chaque côté, et reste indicative :
 * les exercices faits avec et sans la méthode ne sont pas les mêmes.
 */
export function analyzeMethods(evidence: Evidence[], enabled: Record<MethodId, boolean>, practice: PracticeLog[] = [], now: Date = demoNow()): MethodAnalysis[] {
  const maths = evidence.filter((e) => inDomain(e, "maths"));
  const langues = evidence.filter((e) => inDomain(e, "langues"));
  const mathsProfile = errorProfile(maths);
  const fragileMaths = groupWeak(maths);
  const fragileLv = groupWeak(langues);
  const recent = (kind: PracticeLog["kind"]) => practice.filter((p) => p.kind === kind && (now.getTime() - new Date(p.at).getTime()) / 86_400_000 <= 7);
  const lvRetries = langues.filter((e) => e.result !== "success").length;

  const reasons: Record<MethodId, { recommended: boolean; reason: string }> = {
    "sg-modeles": countType(mathsProfile, "conceptuelle") >= 2
      ? { recommended: true, reason: `${countType(mathsProfile, "conceptuelle")} erreurs de sens en maths (notion à revoir) : un schéma aide à voir la relation avant de calculer.` }
      : fragileMaths.length
        ? { recommended: true, reason: `${fragileMaths.length} chapitre${fragileMaths.length > 1 ? "s" : ""} de maths encore fragile${fragileMaths.length > 1 ? "s" : ""} : la représentation aide à reconstruire le sens.` }
        : { recommended: false, reason: "Tes erreurs en maths ne portent pas sur le sens des notions : utile, mais pas prioritaire." },
    "sg-demarche": countType(mathsProfile, "strategique") >= 2
      ? { recommended: true, reason: `${countType(mathsProfile, "strategique")} réponses en maths répondaient à une autre question : planifier avant de calculer évite ce piège.` }
      : { recommended: false, reason: "Peu d'erreurs de lecture de la question pour l'instant." },
    automatismes: countType(mathsProfile, "calcul") + countType(mathsProfile, "procedurale") >= 2
      ? { recommended: true, reason: `${countType(mathsProfile, "calcul") + countType(mathsProfile, "procedurale")} erreurs de calcul ou d'étape : 5 minutes par jour les rendent plus rares.` }
      : { recommended: true, reason: "Recommandé à tous : 5 minutes par jour entretiennent ce qui est déjà acquis." },
    entrelacement: maths.length >= 6
      ? { recommended: true, reason: "Tu as déjà travaillé plusieurs chapitres : les mélanger t'entraîne à choisir la bonne méthode." }
      : { recommended: false, reason: "À activer quand plusieurs chapitres auront été travaillés." },
    "oral-dabord": fragileLv.length
      ? { recommended: true, reason: `${fragileLv.length} chapitre${fragileLv.length > 1 ? "s" : ""} de langue encore fragile${fragileLv.length > 1 ? "s" : ""} : écouter avant de lire renforce la compréhension orale.` }
      : { recommended: true, reason: "Utile à tous les niveaux pour la prononciation et la compréhension orale." },
    "vo-quotidienne": recent("vo").length >= 4
      ? { recommended: true, reason: `${recent("vo").reduce((s, p) => s + p.minutes, 0)} minutes en VO ces 7 derniers jours : continue.` }
      : { recommended: true, reason: "Moins de 4 jours en VO cette semaine : c'est l'habitude la plus simple pour progresser à l'oral." },
    "erreur-sans-stress": lvRetries >= 3 && lvRetries / Math.max(1, langues.length) >= 0.3
      ? { recommended: true, reason: `${lvRetries} réponses à reprendre en langues : moins de pression aide à oser.` }
      : { recommended: false, reason: "À activer si les erreurs en langues te découragent." },
    "defi-oral": recent("oral").length
      ? { recommended: true, reason: `${recent("oral").length} défi${recent("oral").length > 1 ? "s" : ""} oral${recent("oral").length > 1 ? "aux" : ""} cette semaine.` }
      : { recommended: true, reason: "Aucun défi oral cette semaine : 3 minutes suffisent pour commencer." },
  };

  return METHODS.map((m) => {
    const pool = m.domain === "maths" ? maths : langues;
    const withM = pool.filter((e) => e.methods?.includes(m.id));
    const withoutM = pool.filter((e) => !e.methods?.includes(m.id) && !e.itemId.startsWith("seed-"));
    const enough = withM.length >= MIN_COMPARE && withoutM.length >= MIN_COMPARE;
    return {
      id: m.id,
      on: Boolean(enabled[m.id]),
      ...reasons[m.id],
      observed: enough ? { withRate: rate(withM), withoutRate: rate(withoutM), nWith: withM.length, nWithout: withoutM.length } : null,
      missing: Math.max(0, MIN_COMPARE - withM.length) + Math.max(0, MIN_COMPARE - withoutM.length),
    };
  });
}

function countType(p: ReturnType<typeof errorProfile>, t: string): number {
  return p.counts.find((c) => c.type === t)?.n ?? 0;
}

function groupWeak(list: Evidence[]): string[] {
  return Array.from(evidenceByUnit(list)).filter(([, ev]) => knowledgeOf(ev).pKnown < 0.5).map(([id]) => id);
}
