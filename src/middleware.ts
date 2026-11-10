import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/env";

/**
 * À chaque requête, rafraîchit la session Supabase de l'élève (sinon il serait déconnecté au bout d'une heure).
 * Ne bloque aucune page : l'appli reste utilisable sans compte, avec ses données fictives.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!supabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Vérifie la session auprès de Supabase et la renouvelle si besoin. Ne rien mettre entre ces deux lignes.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Toutes les pages, sauf les fichiers statiques (images, icônes, manifeste, code compilé).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
