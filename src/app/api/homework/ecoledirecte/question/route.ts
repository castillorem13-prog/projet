import { NextResponse, type NextRequest } from "next/server";
import type { EcoleDirecteAnswerResponse } from "@/lib/homework/contract";
import { answerQuestion, EdError } from "@/server/ecoledirecte/client";
import { readJson, requireStudent } from "@/server/session";

/**
 * POST /api/homework/ecoledirecte/question : envoie la réponse à la question de sécurité d'ÉcoleDirecte.
 * Renvoie la clé d'appareil, que l'appli garde dans le navigateur et renvoie à la prochaine connexion.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const c = await requireStudent();
  if ("error" in c) return c.error;
  const read = await readJson(request);
  if (!read.ok) return read.response;
  const b = (read.body && typeof read.body === "object" ? read.body : {}) as Record<string, unknown>;
  if (typeof b.token2fa !== "string" || b.token2fa.length > 2000 || typeof b.choice !== "string" || b.choice.length > 1000 || !b.token2fa || !b.choice) {
    return NextResponse.json<EcoleDirecteAnswerResponse>({ step: "error", error: "Réponse invalide." }, { status: 400 });
  }
  try {
    const device = await answerQuestion(b.token2fa, b.choice);
    return NextResponse.json<EcoleDirecteAnswerResponse>({ step: "device", device });
  } catch (e) {
    const message = e instanceof EdError ? e.message : "Erreur inattendue.";
    console.error("ecoledirecte question", e instanceof EdError ? e.kind : "inattendue");
    return NextResponse.json<EcoleDirecteAnswerResponse>({ step: "error", error: message }, { status: e instanceof EdError && e.kind === "question" ? 400 : 502 });
  }
}
