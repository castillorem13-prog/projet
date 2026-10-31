import type { NumericPart } from "@/lib/content/types";
import type { ErrorType } from "@/lib/curriculum/types";
import { diagnoseNumeric } from "./diagnose";
import { reviewWriting, type WritingCheck, type WritingReview } from "./writing";

/**
 * Point d'entrée unique du coach. Aujourd'hui, tout tourne sur l'appareil (« local ») : modèle de l'élève,
 * diagnostic, relecture, objectifs du jour. Rapide (quelques millisecondes), sans réseau, sans donnée envoyée.
 *
 * Plus tard, un fournisseur « remote » pourra s'ajouter pour ce qu'un moteur à règles ne sait pas faire :
 * corriger une rédaction en détail, dialoguer en langue étrangère, expliquer autrement. Règles pour ce fournisseur :
 *  - appel depuis le serveur de LearnWard uniquement (jamais de clé d'API dans l'appli) ;
 *  - données minimales et sans nom (pas de pseudo, pas d'e-mail) ; consentement parental avant 15 ans ;
 *  - en maths, toute réponse proposée par le modèle est revérifiée par le code (answer-checker) avant d'être montrée ;
 *  - si le service ne répond pas, le coach local prend le relais : l'appli ne ralentit jamais.
 */

export interface CoachProvider {
  readonly kind: "local" | "remote";
  diagnose(part: Pick<NumericPart, "answer"> & { errorTypes?: Record<string, ErrorType> }, value: number | undefined, matchedCode?: string): ErrorType | undefined;
  reviewWriting(text: string, checks?: WritingCheck[]): Promise<WritingReview>;
}

export const localCoach: CoachProvider = {
  kind: "local",
  diagnose: diagnoseNumeric,
  reviewWriting: async (text, checks) => reviewWriting(text, checks),
};

/** Fournisseur utilisé par l'appli. Un fournisseur distant viendra ici, avec repli automatique sur le local. */
export const coach: CoachProvider = localCoach;
