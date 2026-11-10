import { mkdirSync, writeFileSync } from "node:fs";
import { FACT_SETS, GENERATORS, LESSON_SETS, SEEDS } from "../src/lib/content/bank";
import { GENERATOR_LIST } from "../src/lib/content/bank/generators";
import type { Activity } from "../src/lib/content/types";
import { findUnit, UNITS } from "../src/lib/curriculum";

/**
 * Chiffres et export de la banque d'exercices et de cours.
 * Usage : npm run banque               → affiche les chiffres
 *         npm run banque -- --export 5 → écrit aussi export/banque/*.json avec 5 exercices par générateur
 * L'export sert de base pour alimenter la future base de données (Supabase) : cours, faits, générateurs, exemples.
 */

const args = process.argv.slice(2);
const exportIndex = args.indexOf("--export");
const perGenerator = exportIndex >= 0 ? Number(args[exportIndex + 1] ?? 5) : 0;

/** Ce qui distingue vraiment deux exercices : l'énoncé, la réponse et l'ensemble des choix, sans leur ordre d'affichage. */
function signature(a: Activity): string {
  switch (a.kind) {
    case "mcq":
    case "worked":
      return JSON.stringify([a.prompt, a.options[a.correct]!.text, a.options.map((o) => String(o.text)).sort()]);
    case "order":
      return JSON.stringify([a.prompt, a.steps]);
    case "classify":
      return JSON.stringify([a.prompt, a.items.map((i) => `${String(i.text)}=${i.category}`).sort()]);
    case "problem":
      return JSON.stringify([a.context, a.stimulus ?? null, a.parts.map((p) => [p.prompt, p.answer.expected])]);
    default:
      return JSON.stringify({ ...a, id: "" });
  }
}

const computed = new Set(GENERATOR_LIST.map((g) => g.id));
let distinct = 0;
let distinctComputed = 0;
for (const g of GENERATORS) {
  const seen = new Set<string>();
  for (let s = 0; s < SEEDS; s++) seen.add(signature(g.make(s).activity));
  distinct += seen.size;
  if (computed.has(g.id)) distinctComputed += seen.size;
}

const lessons = LESSON_SETS.flatMap((s) => s.lessons);
const facts = FACT_SETS.flatMap((s) => s.facts);
const byKind = facts.reduce<Record<string, number>>((m, f) => ((m[f.kind] = (m[f.kind] ?? 0) + 1), m), {});
const unitsWithPractice = new Set(GENERATORS.map((g) => g.unitId));
const bySubject: Record<string, { cours: number; generateurs: number }> = {};
for (const u of UNITS) bySubject[u.subject] ??= { cours: 0, generateurs: 0 };
for (const l of lessons) bySubject[findUnit(l.unitId)!.subject]!.cours++;
for (const g of GENERATORS) bySubject[findUnit(g.unitId)!.subject]!.generateurs++;

const stats = {
  unites: UNITS.length,
  cours: lessons.length,
  unitesAvecEntrainement: unitsWithPractice.size,
  generateurs: GENERATORS.length,
  generateursCalcules: GENERATOR_LIST.length,
  generateursTiresDesFaits: GENERATORS.length - GENERATOR_LIST.length,
  grainesVerifiees: SEEDS,
  exercicesVerifies: GENERATORS.length * SEEDS,
  exercicesDifferents: distinct,
  exercicesDifferentsCalcules: distinctComputed,
  faits: facts.length,
  faitsParType: byKind,
  parMatiere: bySubject,
};

console.log(JSON.stringify(stats, null, 2));

if (perGenerator > 0) {
  const dir = new URL("../export/banque/", import.meta.url);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL("cours.json", dir), JSON.stringify(LESSON_SETS, null, 1));
  writeFileSync(new URL("faits.json", dir), JSON.stringify(FACT_SETS, null, 1));
  writeFileSync(new URL("generateurs.json", dir), JSON.stringify(GENERATORS.map((g) => ({ id: g.id, unitId: g.unitId, title: g.title, stage: g.stage, calcule: computed.has(g.id) })), null, 1));
  writeFileSync(new URL("exercices.json", dir), JSON.stringify(GENERATORS.flatMap((g) => Array.from({ length: Math.min(perGenerator, SEEDS) }, (_, s) => ({ generateur: g.id, unitId: g.unitId, graine: s, ...g.make(s).activity })))));
  writeFileSync(new URL("chiffres.json", dir), JSON.stringify(stats, null, 2));
  console.log(`Export écrit dans export/banque/ (${perGenerator} exercices par générateur).`);
}
