import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_KEY, SUPABASE_URL, assertConfigured } from "./env";

/**
 * Client Supabase pour le serveur : routes `src/app/api/`, route de connexion, composants serveur.
 * Il agit au nom de l'élève connecté (lu dans les cookies), donc la RLS s'applique comme dans le navigateur.
 */
export async function createClient() {
  assertConfigured();
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un composant serveur, qui ne peut pas écrire de cookies : sans gravité,
          // le middleware rafraîchit la session à chaque requête.
        }
      },
    },
  });
}
