import type { Lesson, LessonCheck, Source } from "../types";

/** Écrit une fiche de cours de façon compacte. */
export function lesson(
  unitId: string,
  intro: string,
  blocks: [title: string, items: string[]][],
  pitfalls: string[],
  remember: string[],
  extra: { example?: [title: string, steps: string[]]; checks?: LessonCheck[] } = {},
): Lesson {
  return {
    unitId,
    intro,
    blocks: blocks.map(([title, items]) => ({ title, items })),
    ...(extra.example ? { example: { title: extra.example[0], steps: extra.example[1] } } : {}),
    pitfalls,
    remember,
    ...(extra.checks ? { checks: extra.checks } : {}),
  };
}

/** Textes officiels et ressources de référence, cités par les lots de cours et de faits. */
export const SRC = {
  c3: { id: "c3-2025", label: "Programmes de français et de mathématiques du cycle 3, BO n° 16 du 17 avril 2025", url: "https://education.gouv.fr/bo/2025/Hebdo16/MENE2504620A" },
  c3all: { id: "c3-2020", label: "Programmes du cycle 3 (version consolidée), BO n° 31 du 30 juillet 2020", url: "https://eduscol.education.gouv.fr/4356/j-enseigne-au-cycle-3" },
  c4: { id: "c4-2020", label: "Programmes du cycle 4 (version consolidée), BO n° 31 du 30 juillet 2020", url: "https://eduscol.education.gouv.fr/4362/enseigner-au-cycle-4" },
  c4fm: { id: "c4-fm-2026", label: "Programmes de français et de mathématiques du cycle 4, BO n° 10 du 5 mars 2026", url: "https://www.education.gouv.fr/bo/2026/Hebdo10/MENE2602912A" },
  lycee: { id: "lycee-2019", label: "Programmes de seconde et de première générales, BO spécial n° 1 du 22 janvier 2019", url: "https://eduscol.education.gouv.fr/4368/enseigner-au-lycee-generaltechnologique" },
  tle: { id: "tle-2019", label: "Programmes de terminale générale, BO spécial n° 8 du 25 juillet 2019", url: "https://eduscol.education.gouv.fr/4368/enseigner-au-lycee-generaltechnologique" },
  maths2nde: { id: "maths-2nde-2026", label: "Programme de mathématiques de seconde, BO n° 14 du 2 avril 2026", url: "https://www.education.gouv.fr/bo/2026/Hebdo14/MENE2602914A" },
  mathsTc: { id: "maths-1re-tc", label: "Enseignement de mathématiques de première (tronc commun)", url: "https://eduscol.education.gouv.fr/5817/programmes-et-ressources-en-mathematiques-voie-gt" },
  lv: { id: "lv-2025", label: "Programmes de langues vivantes, BO n° 22 du 29 mai 2025", url: "https://education.gouv.fr/bo/2025/Hebdo22/MENE2504621A" },
  emc: { id: "emc-2024", label: "Programmes d'enseignement moral et civique, BO n° 24 du 13 juin 2024", url: "https://www.education.gouv.fr/bo/2024/Hebdo24/MENE2413934A" },
  techno: { id: "techno-c4-2024", label: "Programme de technologie du cycle 4, BO n° 9 du 29 février 2024", url: "https://sti.eduscol.education.fr/sites/eduscol.education.fr.sti/files/textes//16802-programme-de-technologie-c4.pdf" },
  lca: { id: "lca-c4-2016", label: "Langues et cultures de l'Antiquité, cycle 4, BO n° 11 du 17 mars 2016", url: "https://www.education.gouv.fr/bo/16/Hebdo11/MENE1603855A.htm" },
  eppcs: { id: "eppcs-2021", label: "Spécialité EPPCS, BO n° 25 du 24 juin 2021", url: "https://www.education.gouv.fr/bo/21/Hebdo25/MENE2116606A.htm" },
} satisfies Record<string, Source>;
