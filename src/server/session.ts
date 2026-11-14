import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

/** Client Supabase au nom de l'élève connecté, ou la réponse d'erreur à renvoyer telle quelle. */
export async function requireStudent() {
  if (!supabaseConfigured) return { error: NextResponse.json({ step: "error", error: "Supabase n'est pas configuré." }, { status: 503 }) };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { error: NextResponse.json({ step: "error", error: "Il faut être connecté à LearnWard." }, { status: 401 }) };
  return { supabase, user: data.user };
}

/** Lit un corps JSON de taille raisonnable. */
export async function readJson(request: Request, maxBytes = 10_000): Promise<{ ok: true; body: unknown } | { ok: false; response: NextResponse }> {
  const text = await request.text();
  if (text.length > maxBytes) return { ok: false, response: NextResponse.json({ step: "error", error: "Envoi trop gros." }, { status: 413 }) };
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, response: NextResponse.json({ step: "error", error: "JSON invalide." }, { status: 400 }) };
  }
}
