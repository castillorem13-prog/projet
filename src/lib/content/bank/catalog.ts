import { GENERATORS, LESSONS } from ".";

export interface BankCatalog {
  /** Unités qui ont une fiche de cours. */
  lessons: string[];
  /** Unités entraînables et nombre de types d'exercices de chacune. */
  practice: Record<string, number>;
}

/** Ce que les écrans légers ont besoin de savoir de la banque, sans charger son contenu. */
export function buildBankCatalog(): BankCatalog {
  const practice: Record<string, number> = {};
  for (const g of GENERATORS) practice[g.unitId] = (practice[g.unitId] ?? 0) + 1;
  return {
    lessons: LESSONS.map((l) => l.unitId).sort(),
    practice: Object.fromEntries(Object.entries(practice).sort(([a], [b]) => a.localeCompare(b))),
  };
}

/** Texte de src/lib/content/bank-catalog.generated.ts. */
export function bankCatalogSource(): string {
  const c = buildBankCatalog();
  return `/* Généré par \`npm run gen:catalog\` à partir de la banque : ne pas modifier à la main. */
import type { BankCatalog } from "./bank/catalog";

export const BANK_CATALOG: BankCatalog = {
  lessons: [
${c.lessons.map((id) => `    ${JSON.stringify(id)},`).join("\n")}
  ],
  practice: {
${Object.entries(c.practice).map(([id, n]) => `    ${JSON.stringify(id)}: ${n},`).join("\n")}
  },
};
`;
}
