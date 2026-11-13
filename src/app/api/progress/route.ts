import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { parseAttempt, toSnapshot, type EvidenceRow, type ReviewRow } from "@/server/progress";

/**
 * GET  /api/progress : toute la progression enregistrée de l'élève connecté (traces + rappels).
 * POST /api/progress : enregistre une séance, un contrôle blanc ou un entraînement terminé (voir AttemptPayload).
 * Les deux exigent un élève connecté ; la base n'accepte de toute façon que ses propres lignes (RLS).
 */

export const dynamic = "force-dynamic";

const MAX_BODY = 200_000; // octets : une séance pèse quelques kilo-octets

async function connectedClient() {
  if (!supabaseConfigured) return { error: NextResponse.json({ error: "Supabase n'est pas configuré." }, { status: 503 }) };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { error: NextResponse.json({ error: "Il faut être connecté." }, { status: 401 }) };
  return { supabase, user: data.user };
}

export async function GET() {
  const c = await connectedClient();
  if ("error" in c) return c.error;
  const [evidence, reviews] = await Promise.all([
    c.supabase.from("evidence").select("unit_id, item_id, at, stage, result, assistance, self_assessed, error_type, methods").order("at").limit(10000),
    c.supabase.from("reviews").select("unit_id, due, reason"),
  ]);
  if (evidence.error || reviews.error) {
    console.error("GET /api/progress", evidence.error ?? reviews.error);
    return NextResponse.json({ error: "Lecture impossible pour le moment." }, { status: 500 });
  }
  return NextResponse.json(toSnapshot(evidence.data as EvidenceRow[], reviews.data as ReviewRow[]));
}

export async function POST(request: NextRequest) {
  const c = await connectedClient();
  if ("error" in c) return c.error;

  const text = await request.text();
  if (text.length > MAX_BODY) return NextResponse.json({ error: "Envoi trop gros." }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const parsed = parseAttempt(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { data, error } = await c.supabase.rpc("record_attempt", { payload: parsed.value });
  if (error) {
    console.error("POST /api/progress", error);
    // 23514 / 22023 / 22P02 : la base a refusé une valeur (étape, date, identifiant...).
    const refused = ["23514", "22023", "22P02", "22007", "22008"].includes(error.code ?? "");
    return NextResponse.json({ error: refused ? "Données refusées par la base." : "Enregistrement impossible pour le moment." }, { status: refused ? 400 : 500 });
  }
  return NextResponse.json({ attemptId: data as string }, { status: 201 });
}
