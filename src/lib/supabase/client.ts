"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL, assertConfigured } from "./env";

/**
 * Client Supabase pour les composants qui tournent dans le navigateur ("use client").
 * Sert à se connecter, se déconnecter et lire ou modifier ses propres données (la RLS bloque le reste).
 *
 * Exemple :
 *   const supabase = createClient();
 *   await supabase.auth.signInWithPassword({ email, password });
 */
export function createClient() {
  assertConfigured();
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
