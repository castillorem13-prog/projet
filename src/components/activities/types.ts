import type { Passion } from "@/lib/content/passions";
import type { Assistance } from "@/lib/curriculum/types";
import type { ItemResult, ItemStatus } from "@/lib/session-result";

export interface ActivityProps<A> {
  activity: A;
  passion: Passion;
  /** Change l'univers de l'énoncé (les nombres et la réponse restent les mêmes). */
  onSwap?: () => void;
  reviewLabel: string;
  seed: number;
  onComplete: (items: ItemResult[]) => void;
}

export function elapsedSeconds(start: number): number {
  return Math.round((Date.now() - start) / 100) / 10;
}

/** Aide reçue pour un item : la correction affichée compte comme l'aide maximale. */
export function assistanceOf(status: ItemStatus, hints: number): Assistance {
  return status === "missed" ? 4 : (Math.min(3, Math.max(0, hints)) as Assistance);
}
