/**
 * Adresse et clé publique du projet Supabase, lues dans `.env.local` (voir `.env.example`).
 * La clé « publishable » peut être vue par le navigateur : la sécurité vient des règles RLS de la base.
 * Ne jamais mettre ici la clé secrète ni le mot de passe de la base.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** Faux tant que `.env.local` n'est pas rempli : l'appli continue alors de marcher avec ses données fictives. */
export const supabaseConfigured = SUPABASE_URL !== "" && SUPABASE_KEY !== "";

export function assertConfigured(): void {
  if (!supabaseConfigured) {
    throw new Error(
      "Supabase n'est pas configuré : crée le fichier .env.local à partir de .env.example, puis relance npm run dev.",
    );
  }
}
