/**
 * Contrat front / back pour les devoirs importés (ÉcoleDirecte aujourd'hui, Pronote plus tard).
 * À modifier seulement à deux (voir CLAUDE.md).
 *
 * RÈGLE : l'identifiant et le mot de passe ÉcoleDirecte ne sont jamais stockés, ni par le serveur, ni dans la base,
 * ni dans le navigateur. Ils sont gardés en mémoire le temps de l'import, puis oubliés.
 * Seule la « clé d'appareil » (cn/cv) qu'ÉcoleDirecte donne après la question de sécurité peut être gardée
 * dans le navigateur de l'élève, pour ne pas lui reposer la question à chaque import.
 */
import type { SubjectId } from "@/lib/curriculum/types";

/** Un devoir tel que l'appli l'affiche. */
export interface Homework {
  id: number;
  dueDate: string; // AAAA-MM-JJ
  subjectLabel: string; // nom propre de la matière (« Mathématiques », « Italien »…)
  subject: SubjectId | null; // matière de l'appli, null si pas encore couverte
  unitId: string | null; // chapitre reconnu dans la banque, null sinon
  isTest: boolean; // contrôle, DS, interrogation
  text: string | null;
  done: boolean;
}

/** Clé d'appareil donnée par ÉcoleDirecte après la question de sécurité. */
export interface EcoleDirecteDevice {
  cn: string;
  cv: string;
}

/** POST /api/homework/ecoledirecte */
export interface EcoleDirecteLoginRequest {
  identifiant: string;
  motdepasse: string;
  /** Identifiant d'appareil tiré une fois (crypto.randomUUID()) et gardé dans le navigateur avec la clé d'appareil. */
  deviceId: string;
  device?: EcoleDirecteDevice;
}

export type EcoleDirecteLoginResponse =
  | { step: "question"; token2fa: string; question: string; choices: { value: string; label: string }[] }
  | { step: "done"; imported: number; tests: number; recognized: number; reviews: number; homework: Homework[] }
  /** reason « device » : la clé d'appareil gardée dans le navigateur ne marche plus, il faut l'oublier. */
  | { step: "error"; error: string; reason?: string };

/** POST /api/homework/ecoledirecte/question */
export interface EcoleDirecteAnswerRequest {
  token2fa: string;
  choice: string; // la `value` du choix, telle que reçue
}

export type EcoleDirecteAnswerResponse = { step: "device"; device: EcoleDirecteDevice } | { step: "error"; error: string };
