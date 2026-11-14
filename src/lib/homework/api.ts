/**
 * Fonctions à appeler depuis l'appli pour importer et afficher les devoirs (partie back : /api/homework).
 * Le mot de passe ÉcoleDirecte n'est gardé que dans la variable du formulaire, le temps de l'import : jamais dans
 * localStorage. Seuls l'identifiant d'appareil et la clé d'appareil y sont gardés (voir `deviceStore`).
 */
import type {
  EcoleDirecteAnswerResponse, EcoleDirecteDevice, EcoleDirecteLoginRequest, EcoleDirecteLoginResponse, Homework,
} from "./contract";

const KEY = "learnward.ecoledirecte.appareil";

/** Identifiant et clé d'appareil ÉcoleDirecte, gardés dans le navigateur pour ne pas reposer la question de sécurité. */
export const deviceStore = {
  get(): { deviceId: string; device?: EcoleDirecteDevice } {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as { deviceId?: string; device?: EcoleDirecteDevice } | null;
      if (saved?.deviceId) return { deviceId: saved.deviceId, device: saved.device };
    } catch {
      // stockage indisponible : on repart d'un nouvel appareil
    }
    const fresh = { deviceId: crypto.randomUUID() };
    try { localStorage.setItem(KEY, JSON.stringify(fresh)); } catch { /* sans gravité */ }
    return fresh;
  },
  save(device: EcoleDirecteDevice) {
    const { deviceId } = deviceStore.get();
    try { localStorage.setItem(KEY, JSON.stringify({ deviceId, device })); } catch { /* sans gravité */ }
  },
  forget() {
    try { localStorage.removeItem(KEY); } catch { /* sans gravité */ }
  },
};

async function post<T>(url: string, body: unknown): Promise<T> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return (await res.json()) as T;
  } catch {
    return { step: "error", error: "Pas de connexion internet." } as T;
  }
}

/** Étape 1 : connexion à ÉcoleDirecte et import. Peut renvoyer une question de sécurité à poser à l'élève. */
export function connectEcoleDirecte(identifiant: string, motdepasse: string): Promise<EcoleDirecteLoginResponse> {
  const { deviceId, device } = deviceStore.get();
  const body: EcoleDirecteLoginRequest = { identifiant, motdepasse, deviceId, ...(device ? { device } : {}) };
  return post<EcoleDirecteLoginResponse>("/api/homework/ecoledirecte", body).then((res) => {
    if (res.step === "error" && res.reason === "device") deviceStore.forget();
    return res;
  });
}

/** Étape 2 (seulement si ÉcoleDirecte a posé une question) : envoie la réponse, puis relancer connectEcoleDirecte. */
export async function answerEcoleDirecte(token2fa: string, choice: string): Promise<EcoleDirecteAnswerResponse> {
  const res = await post<EcoleDirecteAnswerResponse>("/api/homework/ecoledirecte/question", { token2fa, choice });
  if (res.step === "device") deviceStore.save(res.device);
  return res;
}

/** Les devoirs déjà importés, à partir d'aujourd'hui. */
export async function loadHomework(): Promise<Homework[] | null> {
  try {
    const res = await fetch("/api/homework", { cache: "no-store" });
    return res.ok ? ((await res.json()) as { homework: Homework[] }).homework : null;
  } catch {
    return null;
  }
}
