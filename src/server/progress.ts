/**
 * Partie back de la sauvegarde de progression : vérifie ce que l'appli envoie avant de l'écrire,
 * et remet les lignes de la base dans la forme des types de la V1.
 * Toute donnée qui vient du navigateur est considérée comme non fiable : on contrôle chaque champ.
 */
import type { Assistance, ErrorType, Evidence, MethodId, Review, Stage } from "@/lib/curriculum/types";
import type { AttemptPayload, ProgressSnapshot } from "@/lib/progress/contract";

const KINDS = ["session", "exam", "entrainement"] as const satisfies readonly AttemptPayload["kind"][];
const STAGES = ["rappel", "application", "transfert", "extension"] as const satisfies readonly Stage[];
const RESULTS = ["success", "partial", "fail"] as const satisfies readonly Evidence["result"][];
const ERROR_TYPES = ["conceptuelle", "procedurale", "calcul", "strategique", "redaction"] as const satisfies readonly ErrorType[];
const METHODS = [
  "sg-modeles", "sg-demarche", "automatismes", "entrelacement",
  "oral-dabord", "vo-quotidienne", "erreur-sans-stress", "defi-oral",
] as const satisfies readonly MethodId[];

const MAX_EVIDENCE = 200;
const MAX_REVIEWS = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isId = (v: unknown): v is string => typeof v === "string" && v.length >= 1 && v.length <= 100;
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === "string" && (list as readonly string[]).includes(v);

/** Vérifie le corps d'un POST /api/progress. Renvoie la donnée propre, ou un message d'erreur en français. */
export function parseAttempt(body: unknown, now = new Date()): { ok: true; value: AttemptPayload } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  if (!isObj(body)) return fail("Le corps de la requête doit être un objet JSON.");
  const { clientId, kind, sessionId, unitId, avgSeconds, evidence, reviews } = body;

  if (typeof clientId !== "string" || !UUID.test(clientId)) return fail("clientId doit être un identifiant (crypto.randomUUID()).");
  if (!oneOf(KINDS, kind)) return fail(`kind doit valoir ${KINDS.join(", ")}.`);
  if (sessionId !== undefined && !isId(sessionId)) return fail("sessionId invalide.");
  if (kind !== "entrainement" && sessionId === undefined) return fail("sessionId est obligatoire pour une séance ou un contrôle.");
  if (!isId(unitId)) return fail("unitId invalide.");
  if (avgSeconds !== undefined && (typeof avgSeconds !== "number" || !Number.isFinite(avgSeconds) || avgSeconds < 0 || avgSeconds > 36000)) {
    return fail("avgSeconds doit être un nombre de secondes entre 0 et 36000.");
  }
  if (!Array.isArray(evidence) || evidence.length > MAX_EVIDENCE) return fail(`evidence doit être une liste de ${MAX_EVIDENCE} traces au plus.`);
  if (!Array.isArray(reviews) || reviews.length > MAX_REVIEWS) return fail(`reviews doit être une liste de ${MAX_REVIEWS} rappels au plus.`);

  // Une trace ne peut pas être datée dans le futur (on tolère un jour d'écart d'horloge).
  const latest = now.getTime() + 24 * 3600 * 1000;
  const cleanEvidence: Evidence[] = [];
  for (const [i, e] of evidence.entries()) {
    const where = `evidence[${i}]`;
    if (!isObj(e)) return fail(`${where} doit être un objet.`);
    if (!isId(e.unitId) || !isId(e.itemId)) return fail(`${where} : unitId et itemId sont obligatoires.`);
    const at = typeof e.at === "string" ? Date.parse(e.at) : NaN;
    if (Number.isNaN(at) || at > latest) return fail(`${where} : date « at » invalide.`);
    if (!oneOf(STAGES, e.stage)) return fail(`${where} : étape inconnue.`);
    if (!oneOf(RESULTS, e.result)) return fail(`${where} : résultat inconnu.`);
    if (typeof e.assistance !== "number" || !Number.isInteger(e.assistance) || e.assistance < 0 || e.assistance > 4) {
      return fail(`${where} : assistance doit être un entier de 0 à 4.`);
    }
    if (e.selfAssessed !== undefined && typeof e.selfAssessed !== "boolean") return fail(`${where} : selfAssessed doit être vrai ou faux.`);
    if (e.errorType !== undefined && !oneOf(ERROR_TYPES, e.errorType)) return fail(`${where} : type d'erreur inconnu.`);
    if (e.methods !== undefined && (!Array.isArray(e.methods) || e.methods.length > METHODS.length || !e.methods.every((m) => oneOf(METHODS, m)))) {
      return fail(`${where} : méthode inconnue.`);
    }
    cleanEvidence.push({
      unitId: e.unitId,
      itemId: e.itemId,
      at: new Date(at).toISOString(),
      stage: e.stage,
      result: e.result,
      assistance: e.assistance as Assistance,
      ...(e.selfAssessed ? { selfAssessed: true } : {}),
      ...(e.errorType ? { errorType: e.errorType as ErrorType } : {}),
      ...(Array.isArray(e.methods) && e.methods.length ? { methods: e.methods as MethodId[] } : {}),
    });
  }

  const cleanReviews: Review[] = [];
  for (const [i, r] of reviews.entries()) {
    const where = `reviews[${i}]`;
    if (!isObj(r)) return fail(`${where} doit être un objet.`);
    if (!isId(r.unitId)) return fail(`${where} : unitId invalide.`);
    if (typeof r.due !== "string" || !DAY.test(r.due) || Number.isNaN(Date.parse(r.due))) return fail(`${where} : due doit être une date AAAA-MM-JJ.`);
    if (typeof r.reason !== "string" || r.reason.length === 0 || r.reason.length > 300) return fail(`${where} : reason doit faire 1 à 300 caractères.`);
    cleanReviews.push({ unitId: r.unitId, due: r.due, reason: r.reason });
  }

  return {
    ok: true,
    value: {
      clientId: clientId.toLowerCase(),
      kind,
      ...(sessionId !== undefined ? { sessionId } : {}),
      unitId,
      ...(avgSeconds !== undefined ? { avgSeconds: Math.round(avgSeconds * 10) / 10 } : {}),
      evidence: cleanEvidence,
      reviews: cleanReviews,
    },
  };
}

/** Lignes telles que Supabase les renvoie. */
export interface EvidenceRow {
  unit_id: string;
  item_id: string;
  at: string;
  stage: Stage;
  result: Evidence["result"];
  assistance: number;
  self_assessed: boolean;
  error_type: ErrorType | null;
  methods: MethodId[] | null;
}
export interface ReviewRow {
  unit_id: string;
  due: string;
  reason: string;
}

/** Remet les lignes de la base dans la forme des types de la V1 (ce que le store attend). */
export function toSnapshot(evidence: EvidenceRow[], reviews: ReviewRow[]): ProgressSnapshot {
  return {
    evidence: evidence.map((e) => ({
      unitId: e.unit_id,
      itemId: e.item_id,
      at: new Date(e.at).toISOString(),
      stage: e.stage,
      result: e.result,
      assistance: e.assistance as Assistance,
      ...(e.self_assessed ? { selfAssessed: true } : {}),
      ...(e.error_type ? { errorType: e.error_type } : {}),
      ...(e.methods && e.methods.length ? { methods: e.methods } : {}),
    })),
    reviews: reviews.map((r) => ({ unitId: r.unit_id, due: r.due, reason: r.reason })),
  };
}
