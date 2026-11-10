/**
 * Évalue une expression écrite comme à l'écran : « 3 × (−2) + 4,5 », « 2x² − 3x + 1 », « √(9 + 16) », « 2^−3 ».
 * Sert de contre-épreuve : on recalcule le texte montré à l'élève, sans passer par le code qui a fabriqué l'exercice.
 * Multiplication implicite (« 3x », « 2(x + 1) », « πr² »), fonctions √ sqrt exp ln log sin cos tan abs, constantes π et e.
 */

type Token = { t: "num"; v: number } | { t: "id"; v: string } | { t: "op"; v: string } | { t: "(" } | { t: ")" };

const FUNCS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt, "√": Math.sqrt, exp: Math.exp, ln: Math.log, log: Math.log10,
  sin: Math.sin, cos: Math.cos, tan: Math.tan, abs: Math.abs,
};

/** Chiffres en exposant, puis le moins en exposant (rang 10). */
const SUPERS = "⁰¹²³⁴⁵⁶⁷⁸⁹⁻";

function tokenize(src: string): Token[] {
  const s = src.replace(/[\s   ]/g, (m, i: number) => {
    // Une espace entre deux chiffres sépare les milliers (« 1 200 ») ; ailleurs, elle ne compte pas.
    const before = src[i - 1] ?? "";
    const after = src[i + 1] ?? "";
    return /\d/.test(before) && /\d/.test(after) ? "" : " ";
  });
  const out: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i]!;
    if (c === " ") { i++; continue; }
    if (/[\d,.]/.test(c)) {
      let j = i;
      while (j < s.length && /[\d,.]/.test(s[j]!)) j++;
      out.push({ t: "num", v: Number(s.slice(i, j).replace(",", ".")) });
      i = j;
      continue;
    }
    if (SUPERS.includes(c)) {
      let j = i;
      while (j < s.length && SUPERS.includes(s[j]!)) j++;
      const run = s.slice(i, j).split("").map((ch) => (ch === "⁻" ? "-" : String(SUPERS.indexOf(ch)))).join("");
      out.push({ t: "op", v: "^" });
      if (run.startsWith("-")) out.push({ t: "op", v: "-" });
      out.push({ t: "num", v: Number(run.replace("-", "")) });
      i = j;
      continue;
    }
    if (c === "(" || c === "[") { out.push({ t: "(" }); i++; continue; }
    if (c === ")" || c === "]") { out.push({ t: ")" }); i++; continue; }
    if ("+-−×*÷/^:".includes(c)) {
      const v = c === "−" ? "-" : c === "×" ? "*" : c === "÷" || c === ":" ? "/" : c;
      out.push({ t: "op", v });
      i++;
      continue;
    }
    if (c === "√" || c === "π") { out.push({ t: "id", v: c }); i++; continue; }
    if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z]/.test(s[j]!)) j++;
      const word = s.slice(i, j);
      if (FUNCS[word] || word === "pi") out.push({ t: "id", v: word });
      else for (const ch of word) out.push({ t: "id", v: ch });
      i = j;
      continue;
    }
    throw new Error(`Caractère inattendu « ${c} » dans « ${src} »`);
  }
  return out;
}

export function evaluate(src: string, vars: Record<string, number> = {}): number {
  const tokens = tokenize(src);
  let pos = 0;
  const peek = () => tokens[pos];
  const startsValue = (t: Token | undefined) => !!t && (t.t === "num" || t.t === "id" || t.t === "(");

  const atom = (): number => {
    const t = tokens[pos++];
    if (!t) throw new Error(`Expression incomplète : « ${src} »`);
    if (t.t === "num") return t.v;
    if (t.t === "(") {
      const v = sum();
      if (tokens[pos++]?.t !== ")") throw new Error(`Parenthèse non fermée : « ${src} »`);
      return v;
    }
    if (t.t === "id") {
      const f = FUNCS[t.v];
      if (f) return f(unary());
      if (t.v === "π" || t.v === "pi") return Math.PI;
      if (t.v in vars) return vars[t.v]!;
      if (t.v === "e") return Math.E;
      throw new Error(`Inconnue « ${t.v} » dans « ${src} »`);
    }
    throw new Error(`Symbole inattendu dans « ${src} »`);
  };
  const power = (): number => {
    const b = atom();
    if (peek()?.t === "op" && (peek() as { v: string }).v === "^") {
      pos++;
      return b ** unary();
    }
    return b;
  };
  const unary = (): number => {
    const t = peek();
    if (t?.t === "op" && (t.v === "-" || t.v === "+")) {
      pos++;
      const v = unary();
      return t.v === "-" ? -v : v;
    }
    return power();
  };
  const product = (): number => {
    let v = unary();
    for (;;) {
      const t = peek();
      if (t?.t === "op" && (t.v === "*" || t.v === "/")) {
        pos++;
        const r = unary();
        v = t.v === "*" ? v * r : v / r;
      } else if (startsValue(t)) {
        v *= power();
      } else return v;
    }
  };
  const sum = (): number => {
    let v = product();
    for (;;) {
      const t = peek();
      if (t?.t === "op" && (t.v === "+" || t.v === "-")) {
        pos++;
        const r = product();
        v = t.v === "+" ? v + r : v - r;
      } else return v;
    }
  };
  const v = sum();
  if (pos !== tokens.length) throw new Error(`Fin d'expression inattendue dans « ${src} »`);
  return v;
}

/** Deux expressions sont égales pour toutes les valeurs essayées de la variable (développement, factorisation). */
export function sameExpression(a: string, b: string, variable = "x", tries: number[] = [-3, -1.5, 0, 0.5, 2, 7]): boolean {
  return tries.every((x) => {
    const u = evaluate(a, { [variable]: x });
    const v = evaluate(b, { [variable]: x });
    return Math.abs(u - v) <= 1e-9 * Math.max(1, Math.abs(u), Math.abs(v));
  });
}
