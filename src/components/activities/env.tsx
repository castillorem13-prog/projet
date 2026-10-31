"use client";

import { createContext, useContext } from "react";
import type { MethodId } from "@/lib/curriculum/types";

/**
 * Ce que la séance transmet aux exercices : les méthodes actives pour cette matière (vide en contrôle blanc)
 * et la langue à faire entendre (langues vivantes).
 */
export interface ActivityEnv {
  methods: MethodId[];
  speechLang?: string;
}

export const ActivityEnvContext = createContext<ActivityEnv>({ methods: [] });

export function useActivityEnv(): ActivityEnv {
  return useContext(ActivityEnvContext);
}

export function useMethodOn(id: MethodId): boolean {
  return useActivityEnv().methods.includes(id);
}
