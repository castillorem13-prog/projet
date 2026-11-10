import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BANK_CATALOG } from "../src/lib/content/bank-catalog.generated";
import { buildBankCatalog } from "../src/lib/content/bank/catalog";
import { evaluate, sameExpression } from "../src/lib/content/bank/evaluate";
import { fr } from "../src/lib/content/bank/format";
import { FACT_SETS, GENERATORS, LESSON_SETS, LESSONS, SEEDS, practicePool } from "../src/lib/content/bank";
import { FACT_CHECKS } from "../src/lib/content/bank/facts/verification.generated";
import { hintsOf, type Activity } from "../src/lib/content/types";
import { findUnit, UNITS } from "../src/lib/curriculum";
import { checkAnswer } from "../src/lib/pedagogy/answer-checker";
import { PARTNERS } from "../src/lib/rewards";

/**
 * Banque d'exercices et de cours : chaque exercice que l'appli peut montrer (toutes les graines de 0 à SEEDS − 1)
 * est construit, contre-vérifié par une autre voie (`verify`) et relu par les règles de forme ci-dessous.
 */

/** Textes visibles d'une activité, sans les programmes (où « 3.5 » est une écriture normale). */
function texts(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => texts(x, out));
  else if (v && typeof v === "object") {
    for (const [k, x] of Object.entries(v)) if (k !== "stimulus" && k !== "id" && k !== "provenance") texts(x, out);
  }
  return out;
}

const BAD = [
  [/NaN|undefined|Infinity|\[object|null\b/, "valeur non calculée"],
  [/\+ ?[−-] ?\d|− ?− ?\d|[−-] ?\+/, "signes qui se suivent"],
  [/(^|[\s(])1x\b|(^|[\s(])0x\b|\^1\b|x\^0/, "écriture algébrique maladroite"],
  [/ {2}/, "double espace"],
] as const;

const FORBIDDEN = ["cashback", "cagnotte", ...PARTNERS.map((p) => p.name.toLowerCase())];

/** Problèmes de forme d'une activité (liste vide si tout va bien). */
function problems(a: Activity, code: boolean): string[] {
  const out: string[] = [];
  const all = texts(a);
  for (const t of all) {
    for (const [re, why] of BAD) if (re.test(t)) out.push(`${why} : « ${t} »`);
    if (!code && /\d\.\d/.test(t)) out.push(`point décimal au lieu de la virgule : « ${t} »`);
  }
  const low = all.join(" ").toLowerCase();
  for (const w of FORBIDDEN) if (low.includes(w)) out.push(`mot interdit dans un exercice : ${w}`);
  const hintSets = a.kind === "problem" ? a.parts.map((p) => hintsOf({ ...p, takeaway: a.takeaway })) : [hintsOf(a)];
  for (const h of hintSets) {
    if (new Set(h.map((x) => x.trim())).size !== 3) out.push(`indices en double : ${h.join(" | ")}`);
    if (h.some((x) => x.trim().length < 6)) out.push("indice vide");
  }
  if (a.takeaway.trim().length < 10) out.push("« à retenir » trop court");
  if (a.ops.length === 0) out.push("aucune opération cognitive");
  switch (a.kind) {
    case "mcq":
    case "worked": {
      if (a.options.length < 3) out.push("moins de trois choix");
      if (!a.options[a.correct]) out.push("bonne réponse hors des choix");
      if (new Set(a.options.map((o) => String(o.text).trim().toLowerCase())).size !== a.options.length) out.push(`choix en double : ${a.options.map((o) => o.text).join(" | ")}`);
      if (a.options.some((o) => String(o.feedback).trim().length < 5)) out.push("retour manquant sur un choix");
      if (a.kind === "worked" && !a.steps[a.blank]) out.push("étape à compléter introuvable");
      break;
    }
    case "order":
      if ([...a.display].sort((x, y) => x - y).join() !== a.steps.map((_, i) => i).join()) out.push("ordre d'affichage invalide");
      if (a.display.every((v, i) => v === i)) out.push("déjà dans l'ordre");
      if (new Set(a.steps).size !== a.steps.length) out.push("étapes en double");
      break;
    case "classify":
      if (a.items.some((x) => !a.categories[x.category])) out.push("catégorie inconnue");
      if (new Set(a.items.map((x) => x.category)).size < 2) out.push("une seule catégorie utilisée");
      if (new Set(a.items.map((x) => String(x.text))).size !== a.items.length) out.push("éléments en double");
      break;
    case "problem":
      if (!a.parts.length) out.push("aucune question");
      for (const p of a.parts) {
        const unit = p.answer.unit ? ` ${p.answer.unit}` : "";
        for (const raw of [`${fr(p.answer.expected)}${unit}`, `${String(p.answer.expected).replace(".", ",")}${unit}`]) {
          if (checkAnswer(p.answer, raw).status !== "correct") out.push(`${p.id} : « ${raw} » refusé`);
        }
        if (!p.answer.tolerance && Number(p.answer.expected.toFixed(6)) !== p.answer.expected) out.push(`${p.id} : réponse non décimale exacte (${p.answer.expected}) sans tolérance`);
        for (const e of p.answer.knownErrors ?? []) if (checkAnswer(p.answer, fr(e.value)).status === "correct") out.push(`${p.id} : l'erreur « ${e.code} » est acceptée comme juste`);
        for (const c of Object.keys(p.errors ?? {})) if (!p.answer.knownErrors?.some((e) => e.code === c)) out.push(`${p.id} : retour « ${c} » sans erreur associée`);
        if (!p.solution.length || !p.recap || !p.reviewLabel) out.push(`${p.id} : correction incomplète`);
      }
      break;
    default:
      break;
  }
  if (a.kind !== "problem" && !a.solution.length) out.push("pas de correction");
  return out;
}

const CODE_SUBJECTS = new Set(["nsi", "snt", "techno", "si"]);

describe("Banque : générateurs", () => {
  it("identifiants uniques, unités du programme existantes", () => {
    const ids = GENERATORS.map((g) => g.id);
    assert.equal(new Set(ids).size, ids.length, "identifiant de générateur en double");
    for (const g of GENERATORS) assert.ok(findUnit(g.unitId), `${g.id} : unité inconnue ${g.unitId}`);
  });

  for (const g of GENERATORS) {
    it(`${g.id} : ${SEEDS} exercices contre-vérifiés`, () => {
      const code = CODE_SUBJECTS.has(findUnit(g.unitId)?.subject ?? "");
      const seen = new Set<string>();
      for (let seed = 0; seed < SEEDS; seed++) {
        const { activity, verify } = g.make(seed);
        assert.equal(activity.stage, g.stage, `${g.id}#${seed} : défi différent de celui annoncé`);
        assert.ok(verify(), `${g.id}#${seed} : la contre-épreuve échoue`);
        const issues = problems(activity, code);
        assert.deepEqual(issues, [], `${g.id}#${seed}`);
        assert.deepEqual(g.make(seed).activity, activity, `${g.id}#${seed} : la même graine doit redonner le même exercice`);
        seen.add(JSON.stringify({ ...activity, id: "" }));
      }
      assert.ok(seen.size >= Math.min(8, SEEDS), `${g.id} : seulement ${seen.size} exercices différents`);
    });
  }
});

describe("Banque : faits sourcés", () => {
  const facts = FACT_SETS.flatMap((s) => s.facts);
  it("identifiants uniques, unités existantes, sources citées", () => {
    assert.equal(new Set(facts.map((f) => f.id)).size, facts.length, "identifiant de fait en double");
    for (const s of FACT_SETS) {
      assert.ok(s.sources.length > 0, `${s.id} : aucune source`);
      for (const f of s.facts) {
        assert.ok(f.units.length > 0, `${f.id} : aucune unité`);
        for (const u of f.units) assert.ok(findUnit(u), `${f.id} : unité inconnue ${u}`);
      }
    }
  });
  it("aucun piège ambigu : réponses uniques dans chaque lot", () => {
    for (const s of FACT_SETS) {
      const by = <K extends string>(kind: string, key: (f: Record<K, unknown>) => string) => {
        const list = s.facts.filter((f) => f.kind === kind).map((f) => key(f as unknown as Record<K, unknown>));
        const dup = list.filter((x, i) => list.indexOf(x) !== i);
        assert.deepEqual(dup, [], `${s.id} (${kind}) : doublons`);
      };
      by("date", (f) => String(f.label));
      by("term", (f) => String(f.term).toLowerCase());
      by("term", (f) => String(f.definition));
      by("work", (f) => String(f.title));
      by("person", (f) => String(f.name));
      by("person", (f) => String(f.role));
      by("word", (f) => `${f.lang}|${String(f.word).toLowerCase()}`);
      by("word", (f) => `${f.lang}|${String(f.fr).toLowerCase()}`);
      by("class", (f) => `${f.set}|${f.item}`);
      for (const f of s.facts) {
        if (f.kind === "class") assert.ok(s.sets?.[f.set]?.categories.includes(f.category), `${f.id} : catégorie « ${f.category} » inconnue`);
        if (f.kind === "date") assert.ok(Number.isInteger(f.year) && f.year !== 0, `${f.id} : année invalide`);
      }
    }
  });
  it("recoupement Wikidata : chaque fait recoupé existe encore avec la même année", () => {
    const byId = new Map(facts.map((f) => [f.id, f]));
    for (const [id, check] of Object.entries(FACT_CHECKS)) {
      const f = byId.get(id);
      assert.ok(f && (f.kind === "date" || f.kind === "work"), `${id} : fait recoupé introuvable (relancer npm run bank:faits)`);
      if (check.years) assert.ok(f.year !== undefined && check.years.includes(f.year), `${id} : année modifiée depuis le recoupement (relancer npm run bank:faits)`);
      assert.match(check.qid, /^Q\d+$/);
    }
  });
});

describe("Banque : cours", () => {
  it("une fiche par unité au plus, sur une unité qui existe", () => {
    const ids = LESSONS.map((l) => l.unitId);
    assert.equal(new Set(ids).size, ids.length, "deux fiches pour une même unité");
    for (const id of ids) assert.ok(findUnit(id), `fiche sur une unité inconnue : ${id}`);
    for (const s of LESSON_SETS) assert.ok(s.sources.length > 0, `${s.id} : aucune source`);
  });
  it("chaque fiche est complète et proprement écrite", () => {
    for (const l of LESSONS) {
      assert.ok(l.intro.length >= 30, `${l.unitId} : introduction trop courte`);
      assert.ok(l.blocks.length >= 1 && l.blocks.every((b) => b.items.length > 0 && b.title.length > 2), `${l.unitId} : bloc vide`);
      assert.ok(l.pitfalls.length >= 1 && l.remember.length >= 1, `${l.unitId} : erreurs fréquentes ou « à retenir » manquants`);
      for (const t of texts(l)) for (const [re, why] of BAD) assert.ok(!re.test(t), `${l.unitId} : ${why} : « ${t} »`);
    }
  });
  it("les calculs cités dans les cours sont justes", () => {
    for (const l of LESSONS) {
      for (const [expr, expected] of l.checks ?? []) {
        const v = evaluate(expr);
        assert.ok(Math.abs(v - expected) <= 1e-9 * Math.max(1, Math.abs(expected)), `${l.unitId} : ${expr} = ${v}, pas ${expected}`);
      }
    }
  });
});

describe("Banque : entraînement et catalogue", () => {
  it("le catalogue léger est à jour (npm run gen:catalog)", () => {
    assert.deepEqual(BANK_CATALOG, buildBankCatalog());
  });
  it("chaque unité entraînable propose une série de rappel à transfert sans doublon", () => {
    for (const u of Object.keys(BANK_CATALOG.practice)) {
      const pool = practicePool(u);
      assert.ok(pool.length >= 3, `${u} : trop peu d'exercices`);
      assert.equal(new Set(pool.map((a) => a.id)).size, pool.length, `${u} : exercice en double`);
    }
  });
  it("chaque unité du programme a son cours", () => {
    const missing = UNITS.filter((u) => !LESSONS.some((l) => l.unitId === u.id)).map((u) => u.id);
    assert.deepEqual(missing, [], `${missing.length} unités sans cours`);
  });
});

describe("Lecteur d'expressions (contre-épreuve)", () => {
  it("lit les écritures françaises et les priorités", () => {
    assert.equal(evaluate("3 + 4 × 2"), 11);
    assert.equal(evaluate("(3 + 4) × 2"), 14);
    assert.equal(evaluate("−3²"), -9);
    assert.equal(evaluate("2^−1"), 0.5);
    assert.equal(evaluate("1 200 ÷ 4"), 300);
    assert.equal(evaluate("4,5 × 2"), 9);
    assert.equal(evaluate("√(9 + 16)"), 5);
    assert.equal(evaluate("2x² − 3x + 1", { x: 2 }), 3);
    assert.equal(evaluate("2(x + 1)", { x: 3 }), 8);
    assert.ok(Math.abs(evaluate("πr²", { r: 2 }) - 4 * Math.PI) < 1e-12);
  });
  it("reconnaît deux expressions égales", () => {
    assert.ok(sameExpression("(x + 2)(x − 3)", "x² − x − 6"));
    assert.ok(!sameExpression("(x + 2)²", "x² + 4"));
  });
});
