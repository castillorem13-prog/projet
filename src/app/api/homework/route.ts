import { NextResponse } from "next/server";
import { todayInParis } from "@/server/ecoledirecte/import";
import { listHomework } from "@/server/homework";
import { requireStudent } from "@/server/session";

/** GET /api/homework : les devoirs importés de l'élève connecté, à partir d'aujourd'hui. */
export const dynamic = "force-dynamic";

export async function GET() {
  const c = await requireStudent();
  if ("error" in c) return c.error;
  const homework = await listHomework(c.supabase, todayInParis());
  if (!homework) return NextResponse.json({ error: "Lecture impossible pour le moment." }, { status: 500 });
  return NextResponse.json({ homework });
}
