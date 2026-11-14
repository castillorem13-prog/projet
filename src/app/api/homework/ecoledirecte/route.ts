import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_TRACK, type Track } from "@/lib/curriculum/levels";
import type { Level, SubjectId } from "@/lib/curriculum/types";
import type { EcoleDirecteLoginResponse } from "@/lib/homework/contract";
import { EdError, login } from "@/server/ecoledirecte/client";
import { collectHomework, todayInParis } from "@/server/ecoledirecte/import";
import { listHomework } from "@/server/homework";
import { readJson, requireStudent } from "@/server/session";

/**
 * POST /api/homework/ecoledirecte : se connecte à ÉcoleDirecte au nom de l'élève et importe ses devoirs à venir.
 * L'identifiant et le mot de passe ne sont utilisés que pendant cette requête : jamais stockés, jamais écrits dans les logs.
 * Si ÉcoleDirecte pose sa question de sécurité, on la renvoie à l'appli (étape « question »).
 */
export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5; // par quart d'heure et par élève
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LEVELS: Level[] = ["6e", "5e", "4e", "3e", "2nde", "1re", "Tle"];

const fail = (error: string, status: number, reason?: string) =>
  NextResponse.json<EcoleDirecteLoginResponse>({ step: "error", error, ...(reason ? { reason } : {}) }, { status });
const isStr = (v: unknown, max: number): v is string => typeof v === "string" && v.length >= 1 && v.length <= max;

function toTrack(raw: unknown): Track {
  const t = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is SubjectId => typeof x === "string") : []);
  return { lvb: (typeof t.lvb === "string" ? t.lvb : DEFAULT_TRACK.lvb) as SubjectId, specialties: list(t.specialties), options: list(t.options) };
}

export async function POST(request: NextRequest) {
  const c = await requireStudent();
  if ("error" in c) return c.error;
  const read = await readJson(request);
  if (!read.ok) return read.response;

  const b = (read.body && typeof read.body === "object" ? read.body : {}) as Record<string, unknown>;
  const device = b.device as Record<string, unknown> | undefined;
  if (!isStr(b.identifiant, 100) || !isStr(b.motdepasse, 200)) return fail("Identifiant et mot de passe ÉcoleDirecte obligatoires.", 400);
  if (typeof b.deviceId !== "string" || !UUID.test(b.deviceId)) return fail("deviceId doit être un identifiant (crypto.randomUUID()).", 400);
  if (device !== undefined && (typeof device !== "object" || !isStr(device.cn, 1000) || !isStr(device.cv, 1000))) return fail("Clé d'appareil invalide.", 400);

  const { data: profile } = await c.supabase.from("profiles").select("grade, track").eq("id", c.user.id).maybeSingle();
  if (!profile) return fail("Crée d'abord ton profil LearnWard (pseudo et classe).", 409);
  const level = LEVELS.includes(profile.grade as Level) ? (profile.grade as Level) : null;
  if (!level) return fail("Classe du profil inconnue.", 409);

  // Limite d'essais : protège le compte ÉcoleDirecte de l'élève, et empêche d'utiliser LearnWard pour deviner un mot de passe.
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await c.supabase.from("ecoledirecte_attempts").select("id", { count: "exact", head: true }).gte("at", since);
  if ((count ?? 0) >= MAX_ATTEMPTS) return fail("Trop d'essais. Attends un quart d'heure avant de réessayer.", 429);
  await c.supabase.from("ecoledirecte_attempts").insert({});

  try {
    const res = await login(b.identifiant, b.motdepasse, b.deviceId, device ? { cn: device.cn as string, cv: device.cv as string } : undefined);
    if (res.kind === "question") {
      return NextResponse.json<EcoleDirecteLoginResponse>({ step: "question", token2fa: res.token2fa, question: res.question, choices: res.choices });
    }

    const today = todayInParis();
    const items = await collectHomework(res.account, res.token, level, toTrack(profile.track), today);
    const { data: counts, error } = await c.supabase.rpc("import_homework", { items, today });
    if (error) {
      console.error("import_homework", error.code);
      return fail("Les devoirs n'ont pas pu être enregistrés.", 500);
    }
    const homework = (await listHomework(c.supabase, today)) ?? [];
    return NextResponse.json<EcoleDirecteLoginResponse>({
      step: "done",
      imported: items.length,
      tests: items.filter((i) => i.isTest).length,
      recognized: items.filter((i) => i.unitId).length,
      reviews: (counts as { reviews?: number } | null)?.reviews ?? 0,
      homework,
    });
  } catch (e) {
    if (e instanceof EdError) {
      console.error("ecoledirecte", e.kind); // jamais l'identifiant ni le mot de passe
      const status = e.kind === "credentials" || e.kind === "question" || e.kind === "device" ? 400 : e.kind === "not-student" || e.kind === "no-homework-module" ? 422 : 502;
      return fail(e.message, status, e.kind);
    }
    console.error("ecoledirecte", "erreur inattendue");
    return fail("Erreur inattendue pendant l'import.", 500);
  }
}
