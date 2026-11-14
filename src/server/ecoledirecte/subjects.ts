/**
 * Correspondance entre les noms de matières écrits par les écoles (ÉcoleDirecte, et plus tard Pronote)
 * et les matières de l'appli (SubjectId).
 *
 * Les écoles écrivent les matières de mille façons : « MATHEMATIQUES », « ENSEIGN.SCIENTIFIQUE »,
 * « ED.PHYS.PR.CULT.SP. », « DNL Ita. Hist. Géo »… On normalise le texte (minuscules, sans accents ni ponctuation),
 * puis on teste les règles dans l'ordre : les plus précises d'abord (EPPCS avant EPS, SNT avant technologie…).
 * Une matière que l'appli ne couvre pas encore (italien, théâtre, management…) est reconnue et nommée proprement,
 * mais sans SubjectId : le devoir est gardé, il ne sera simplement relié à aucun chapitre.
 */
import { getLevel, studentSubjects, type Track } from "@/lib/curriculum/levels";
import type { Level, SubjectId } from "@/lib/curriculum/types";

export interface SubjectGuess {
  /** Nom lisible de la matière. */
  label: string;
  /** Matières de l'appli possibles, de la plus probable à la moins probable. Vide = matière pas encore couverte. */
  candidates: SubjectId[];
}

/** Minuscules, sans accents, ponctuation remplacée par des espaces. */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

type Rule = [RegExp, string, SubjectId[]];

// Langues que l'appli ne couvre pas encore (LV, langues régionales).
const OTHER_LANGUAGES: [RegExp, string][] = [
  [/\bital(ien)?\b|\bita\b/, "Italien"], [/\bportug/, "Portugais"], [/\bchinois\b|\bmandarin\b/, "Chinois"],
  [/\barabe\b/, "Arabe"], [/\brusse\b/, "Russe"], [/\bjapon/, "Japonais"], [/\bhebreu\b/, "Hébreu"],
  [/\bneerland/, "Néerlandais"], [/\bpolonais\b/, "Polonais"], [/\bturc\b/, "Turc"], [/\bvietnam/, "Vietnamien"],
  [/\bcoreen\b/, "Coréen"], [/\bgrec moderne\b/, "Grec moderne"], [/\bbreton\b/, "Breton"], [/\bbasque\b/, "Basque"],
  [/\bcorse\b/, "Corse"], [/\boccitan/, "Occitan"], [/\bcatalan\b/, "Catalan"], [/\bcreole\b/, "Créole"],
  [/\balsac|\bregional/, "Langue régionale"], [/\btahitien\b/, "Tahitien"], [/\bsuedois\b|\bnorvegien\b|\bdanois\b/, "Langue nordique"],
];

const RULES: Rule[] = [
  // Sport : la spécialité EPPCS d'abord (« ED.PHYS.PR.CULT.SP. » = éducation physique, pratiques et cultures sportives).
  [/\beppcs\b|\bpr cult sp\b|\bpratiques? (et )?cultures? sportives?\b/, "EPPCS (spécialité)", ["eppcs"]],
  [/\beps\b|\be p s\b|\bed phys|\beduc(ation)? phys|\bsports?\b/, "EPS", ["eps"]],

  // Mathématiques
  [/\bmath\w* exp(ertes?)?\b/, "Mathématiques expertes", ["maths-exp"]],
  [/\bmath\w* comp(lementaires?)?\b/, "Mathématiques complémentaires", ["maths-comp"]],
  [/\bmath|\bmaths\b/, "Mathématiques", ["maths", "maths-tc"]],

  // Sciences et numérique (les plus précises d'abord)
  [/\bsnt\b|\bsc\w* numeri\w* (et )?techno/, "SNT", ["snt"]],
  [/\bnsi\b|\bnumeri\w* (et )?sc\w* (de l )?inform|\binformatique\b/, "NSI", ["nsi"]],
  [/\bsc\w* (de l )?ingenieur|\bsi\b/, "Sciences de l'ingénieur", ["si"]],
  [/\bens\w* scien|\benseignement scientifique\b|\bens sci\b/, "Enseignement scientifique", ["ens-sci"]],
  [/\bbiologie ecologie\b/, "Biologie-écologie", []],
  [/\bsvt\b|\bsc\w* (de la )?vie\b|\bbiologie\b|\bgeologie\b/, "SVT", ["svt"]],
  [/\bphysique|\bph ch\b|\bphys chim|\bsc\w* phys\w*|\bchimie\b/, "Physique-chimie", ["physique"]],
  [/\bsciences? (et )?techno/, "Sciences et technologie", ["sciences", "techno"]],
  [/\btechno(logie)?\b/, "Technologie", ["techno"]],
  [/\bsciences?\b$/, "Sciences", ["sciences", "physique", "svt"]],

  // Spécialités et options de sciences humaines
  [/\bhggsp\b|\bgeopol/, "HGGSP", ["hggsp"]],
  [/\bhlp\b|\bhumanites?\b/, "HLP", ["hlp"]],
  [/\bdgemc\b|\bdroit (et )?grands? enjeux\b/, "DGEMC", ["dgemc"]],
  [/\bses\b|\bsc\w* econ\w* (et )?soc/, "SES", ["ses"]],

  // Antiquité (LLCA et options LCA)
  [/\bllca\b|\blitt\w* langues? (et )?cultures? (de l )?antiquite/, "LLCA", ["llca"]],
  [/\blatin\b|\blca lat/, "Latin", ["latin"]],
  [/\bgrec\b(?! moderne)|\blca gre/, "Grec ancien", ["grec"]],

  // Histoire, géographie, EMC, philosophie, français
  [/\bhistoire des arts\b|\bhda\b/, "Histoire des arts", []],
  [/\bhist\w*|\bgeo(graphie)?\b|\bhi ge\b|\bhg\b/, "Histoire-géographie", ["hg"]],
  [/\bemc\b|\bmoral (et )?civique\b|\becjs\b/, "EMC", ["emc"]],
  [/\bphilo/, "Philosophie", ["philo"]],
  [/\bfran(c|ç)ais\b|\bfranc\b|\bfr\b|\blettres?\b/, "Français", ["francais"]],

  // Langues couvertes par l'appli
  [/\banglais\b|\bang\b|\bagl\d?\b|\benglish\b|\blv1 ang/, "Anglais", ["anglais"]],
  [/\bespagnol\b|\besp\d?\b/, "Espagnol", ["espagnol"]],
  [/\ballemand\b|\ball\d?\b/, "Allemand", ["allemand"]],

  // Arts
  [/\barts? plast/, "Arts plastiques", ["arts", "arts-spe"]],
  [/\bmusique\b|\bmusical|\bed mus|\bchorale\b/, "Éducation musicale", ["musique"]],
  [/\btheatre\b/, "Théâtre", []],
  [/\bcinema|\baudiovisuel/, "Cinéma-audiovisuel", []],
  [/\bdanse\b/, "Danse", []],
  [/\bcirque\b/, "Arts du cirque", []],
  [/\bdesign\b|\bcreation (et )?culture/, "Création et culture design", []],

  // Voie technologique (pas encore couverte)
  [/\bmanagement\b|\bsciences? de gestion\b|\bdroit (et )?econ/, "Management, gestion et droit", []],
  [/\bbiotechno/, "Biotechnologies", []],
  [/\bsante (et )?social\b|\bst2s\b/, "Santé et social", []],
  [/\blaboratoire\b|\bstl\b/, "Sciences de laboratoire", []],
  [/\bingenierie\b|\binnovation\b|\bsti2d\b|\bi2d\b/, "Ingénierie et développement durable", []],
  [/\bagronomie\b|\bterritoires?\b|\bstav\b/, "Agronomie et territoires", []],
  [/\bhotellerie\b|\brestauration\b|\bsthr\b/, "Hôtellerie-restauration", []],
  [/\becon\w* gestion\b/, "Économie-gestion", []],

  // Temps de vie scolaire
  [/\bvie de classe\b|\bhvc\b|\bvdc\b/, "Vie de classe", []],
  [/\baccomp\w* perso|\bap\b|\baide aux devoirs\b|\bdevoirs faits\b|\btutorat\b|\bsoutien\b/, "Accompagnement", []],
  [/\borientation\b/, "Orientation", []],
];

/** Ce que l'école appelle « DNL » ou section européenne : on cherche la matière enseignée derrière la langue. */
const DNL = /\bdnl\b|\bsection euro\w*\b|\beuro\b/;

/** Reconnaît une matière à partir de son nom (et de son code, si l'école en donne un). */
export function guessSubject(label: string, code?: string): SubjectGuess {
  const text = normalize(label);
  if (DNL.test(text)) {
    const rest = text.replace(DNL, " ").replace(/\b(ita|italien|ang|anglais|esp|espagnol|all|allemand|lv\d)\b/g, " ").trim();
    const inner = rest ? guessSubject(rest) : null;
    if (inner && inner.candidates.length) return { label: `${inner.label} (DNL)`, candidates: inner.candidates };
    return { label: "Section européenne (DNL)", candidates: [] };
  }
  // LLCER : l'appli ne couvre que l'anglais.
  if (/\bllcer\b|\blitt\w* (et )?cultures? etrangeres?/.test(text)) {
    return /\bang|\bagl|\banglais\b/.test(text) || !/\b(esp|all|ita|espagnol|allemand|italien)\b/.test(text)
      ? { label: "LLCER anglais", candidates: ["llcer"] }
      : { label: "LLCER (autre langue)", candidates: [] };
  }
  for (const [re, name, candidates] of RULES) if (re.test(text)) return { label: name, candidates };
  for (const [re, name] of OTHER_LANGUAGES) if (re.test(text)) return { label: name, candidates: [] };
  if (code) {
    const byCode = guessSubject(code.replace(/[-_.]/g, " "));
    if (byCode.candidates.length) return byCode;
  }
  return { label: label.trim().slice(0, 100) || "Matière inconnue", candidates: [] };
}

/**
 * Garde, parmi les matières possibles, celles qui existent au niveau de l'élève,
 * en mettant d'abord celles qu'il suit vraiment (spécialités et options déclarées).
 */
export function candidatesFor(guess: SubjectGuess, level: Level, track: Track): SubjectId[] {
  const atLevel = new Set(getLevel(level).subjects.map((s) => s.subject));
  const followed = new Set(studentSubjects(level, track).map((s) => s.subject));
  const possible = guess.candidates.filter((s) => atLevel.has(s));
  return [...possible.filter((s) => followed.has(s)), ...possible.filter((s) => !followed.has(s))];
}
