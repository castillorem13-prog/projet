import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

/**
 * Arrivée depuis un email de Supabase (lien de connexion ou confirmation d'inscription) :
 * on échange le code reçu contre une session, puis on renvoie l'élève dans l'appli.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  // Page où revenir : seulement une adresse de l'appli (jamais un autre site).
  const asked = searchParams.get("next") ?? "/";
  const next = asked.startsWith("/") && !asked.startsWith("//") && !asked.startsWith("/\\") ? asked : "/";

  if (code && supabaseConfigured) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/test-connexion?erreur=lien`);
}
