export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

let sequence = 0;
/** Identifiant unique, même pour deux créations dans la même milliseconde. */
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(sequence++).toString(36)}`;

/** Accès à un dictionnaire par une valeur venue de l'extérieur : « constructor » n'est pas une clé du contenu. */
export const own = <T>(dict: Record<string, T>, key: string | null | undefined): T | undefined => (key && Object.hasOwn(dict, key) ? dict[key] : undefined);

/** Lien de retour interne : refuse les adresses externes (« //exemple.fr », « /\exemple.fr »). */
export const safeReturn = (path: string | null | undefined, fallback: string) => (path && /^\/(?![/\\])/.test(path) ? path : fallback);

/** Écrit un nombre à la française (virgule, moins typographique). */
export function frNumber(n: number): string {
  const rounded = Math.round(n * 1000) / 1000;
  return String(rounded).replace(".", ",").replace("-", "−");
}

/** Empêche une formule ou un nombre de se couper en fin de ligne (« 3x + 2 », « 1 200 »). */
export function nb(text: string): string {
  return text
    .replace(/(\d) (\d{3})\b/g, "$1\u202F$2")
    .replace(/(\S) ([=+−×÷]) (?=\S)/g, "$1\u00A0$2\u00A0")
    .replace(/ ([?!:;»])/g, "\u202F$1")
    .replace(/(\d) (?=(?:km\/h|m\/s|km|min|m|s|h|€|%|V|A|Ω)(?![\p{L}]))/gu, "$1\u00A0")
    .replace(/« /g, "«\u202F");
}
