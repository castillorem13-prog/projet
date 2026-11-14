/**
 * Appels à ÉcoleDirecte. Il n'existe pas d'API officielle : on suit la méthode des applis non officielles
 * (Papillon et sa bibliothèque BlocksDirecte). Si ÉcoleDirecte change quelque chose, c'est ce fichier qu'on corrige.
 *
 * Sécurité :
 *  - l'identifiant et le mot de passe ne sont JAMAIS écrits dans un log, une erreur ou une réponse ;
 *  - on ne lit que le cahier de textes (pas de notes, de messagerie ni de vie scolaire).
 */
const API = process.env.ECOLEDIRECTE_API_URL || "https://api.ecoledirecte.com";
const VERSION = "8.0.0";
const USER_AGENT = `LearnWard/0.1 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 EDMOBILE v${VERSION}`;
const TIMEOUT_MS = 10_000;

export type EdErrorKind = "credentials" | "question" | "device" | "not-student" | "no-homework-module" | "changed" | "unavailable";

/** Erreur dont le message peut être montré à l'élève tel quel (il ne contient jamais d'identifiant). */
export class EdError extends Error {
  constructor(public kind: EdErrorKind, message: string) {
    super(message);
    this.name = "EdError";
  }
}

type EdJson = { code?: number; token?: string; message?: string; data?: unknown };

async function call(path: string, data: unknown, headers: Record<string, string> = {}): Promise<{ json: EdJson; headers: Headers }> {
  const url = new URL(API + path);
  url.searchParams.set("v", VERSION);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      // ÉcoleDirecte attend exactement ce type (sans « application/ »), avec le JSON dans un champ « data ».
      headers: { "Content-Type": "x-www-form-urlencoded", "User-Agent": USER_AGENT, ...headers },
      body: new URLSearchParams({ data: JSON.stringify(data) }).toString(),
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new EdError("unavailable", "ÉcoleDirecte ne répond pas. Réessaie dans quelques minutes.");
  }
  const text = await res.text();
  try {
    return { json: JSON.parse(text) as EdJson, headers: res.headers };
  } catch {
    throw new EdError("changed", `ÉcoleDirecte a répondu de façon inattendue (HTTP ${res.status}). L'import est peut-être à mettre à jour.`);
  }
}

const fromBase64 = (s: string) => Buffer.from(s, "base64").toString("utf-8");

export interface EdAccount {
  id: number;
  typeCompte: string;
  profile?: { classe?: { libelle?: string } };
  modules?: { code: string; enable?: boolean }[];
}

export type LoginResult =
  | { kind: "question"; token2fa: string; question: string; choices: { value: string; label: string }[] }
  | { kind: "ok"; token: string; account: EdAccount };

/** Connexion. Renvoie la question de sécurité si ÉcoleDirecte en pose une. */
export async function login(identifiant: string, motdepasse: string, uuid: string, device?: { cn: string; cv: string }): Promise<LoginResult> {
  const body: Record<string, unknown> = { identifiant, motdepasse, isReLogin: false, uuid };
  if (device) Object.assign(body, { cn: device.cn, cv: device.cv, fa: [{ cn: device.cn, cv: device.cv }] });
  const r = await call("/v3/login.awp", body);

  if (r.json.code === 505) throw new EdError("credentials", "Identifiant ou mot de passe ÉcoleDirecte incorrect.");
  if (r.json.code === 250) {
    const token2fa = r.headers.get("2fa-token") ?? r.headers.get("x-token") ?? r.json.token ?? "";
    if (!token2fa) throw new EdError("changed", "ÉcoleDirecte demande une vérification que l'appli ne sait pas encore gérer.");
    const q = await call("/v3/connexion/doubleauth.awp?verbe=get", {}, { "2fa-token": token2fa });
    const qd = q.json.data as { question?: string; propositions?: string[] } | undefined;
    if (q.json.code !== 200 || !qd?.question || !Array.isArray(qd.propositions)) {
      throw new EdError("changed", "Impossible de récupérer la question de sécurité d'ÉcoleDirecte.");
    }
    return {
      kind: "question",
      token2fa,
      question: fromBase64(qd.question),
      choices: qd.propositions.map((p) => ({ value: p, label: fromBase64(p) })),
    };
  }
  if (device && r.json.code !== 200) {
    throw new EdError("device", "La clé d'appareil ÉcoleDirecte a expiré : reconnecte-toi, la question de sécurité sera reposée.");
  }
  if (r.json.code !== 200 || !r.json.token) {
    throw new EdError("changed", `Connexion à ÉcoleDirecte refusée (code ${r.json.code ?? "?"}).`);
  }

  const accounts = ((r.json.data as { accounts?: EdAccount[] } | undefined)?.accounts ?? []) as EdAccount[];
  const account = accounts.find((a) => a.typeCompte === "E");
  if (!account) throw new EdError("not-student", "Ce compte ÉcoleDirecte n'est pas un compte élève. Connecte-toi avec tes identifiants à toi, pas ceux de tes parents.");
  if (account.modules && !account.modules.some((m) => m.code === "CAHIER_DE_TEXTES" && m.enable !== false)) {
    throw new EdError("no-homework-module", "Ton établissement n'utilise pas le cahier de textes d'ÉcoleDirecte.");
  }
  return { kind: "ok", token: r.json.token, account };
}

/** Réponse à la question de sécurité. Renvoie la clé d'appareil (cn/cv) à utiliser pour se connecter ensuite. */
export async function answerQuestion(token2fa: string, choice: string): Promise<{ cn: string; cv: string }> {
  const r = await call("/v3/connexion/doubleauth.awp?verbe=post", { choix: choice }, { "2fa-token": token2fa });
  const d = r.json.data as { cn?: string; cv?: string } | undefined;
  if (r.json.code === 505) throw new EdError("question", "Mauvaise réponse à la question de sécurité.");
  if (r.json.code === 520) throw new EdError("question", "La question de sécurité a expiré. Recommence la connexion.");
  if (r.json.code !== 200 || !d?.cn || !d?.cv) throw new EdError("changed", "ÉcoleDirecte n'a pas validé la question de sécurité.");
  return { cn: d.cn, cv: d.cv };
}

/** Jours où l'élève a des devoirs (ÉcoleDirecte renvoie aussi un peu d'historique). */
export async function homeworkDays(account: EdAccount, token: string): Promise<string[]> {
  const r = await call(`/v3/Eleves/${account.id}/cahierdetexte.awp?verbe=get`, {}, { "X-Token": token });
  if (r.json.code !== 200) throw new EdError("changed", `Cahier de textes indisponible (code ${r.json.code ?? "?"}).`);
  const data = r.json.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  return Object.keys(data).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
}

export interface EdDayItem {
  matiere: string;
  codeMatiere?: string;
  idDevoir?: number;
  interrogation: boolean;
  aFaire: string | null;
  effectue: boolean;
}

const htmlToText = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li)>/gi, "\n").replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

/** Détail d'un jour : seulement les devoirs à faire (pas le contenu des séances passées). */
export async function homeworkOfDay(account: EdAccount, token: string, day: string): Promise<EdDayItem[]> {
  const r = await call(`/v3/Eleves/${account.id}/cahierdetexte/${day}.awp?verbe=get`, {}, { "X-Token": token });
  if (r.json.code !== 200) return [];
  type M = { matiere?: string; codeMatiere?: string; interrogation?: boolean; aFaire?: { idDevoir?: number; contenu?: string; effectue?: boolean; interrogation?: boolean } };
  const matieres = ((r.json.data as { matieres?: M[] } | undefined)?.matieres ?? []) as M[];
  return matieres
    .filter((m) => m.aFaire && m.matiere)
    .map((m) => ({
      matiere: String(m.matiere),
      codeMatiere: m.codeMatiere,
      idDevoir: m.aFaire?.idDevoir,
      interrogation: Boolean(m.interrogation || m.aFaire?.interrogation),
      aFaire: m.aFaire?.contenu ? htmlToText(fromBase64(m.aFaire.contenu)) || null : null,
      effectue: Boolean(m.aFaire?.effectue),
    }));
}
