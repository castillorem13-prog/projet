import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GENERATORS, SEEDS } from "../src/lib/content/bank";
import type { Stimulus } from "../src/lib/content/types";

/**
 * Seconde vérification des exercices de programmation : chaque programme Python de la banque (toutes les graines)
 * est exécuté par un vrai interpréteur Python, et sa sortie comparée à la réponse attendue.
 * Usage : npm run bank:python (Python 3 doit être installé).
 */

interface Case { id: string; code: string; expected: number }
const cases: Case[] = [];
for (const g of GENERATORS) {
  for (let seed = 0; seed < SEEDS; seed++) {
    const a = g.make(seed).activity;
    if (a.kind !== "problem") continue;
    const stimuli: Stimulus[] = a.stimulus ? (Array.isArray(a.stimulus) ? a.stimulus : [a.stimulus]) : [];
    const code = stimuli.find((s) => s.kind === "code" && s.language === "Python");
    if (!code || code.kind !== "code" || !code.lines.some((l) => l.includes("print("))) continue;
    cases.push({ id: a.id, code: code.lines.join("\n"), expected: a.parts[0]!.answer.expected });
  }
}

const dir = mkdtempSync(join(tmpdir(), "learnward-py-"));
writeFileSync(join(dir, "cases.json"), JSON.stringify(cases));
writeFileSync(join(dir, "run.py"), `import io, json, sys, contextlib
cases = json.load(open(sys.argv[1], encoding="utf-8"))
out = []
for c in cases:
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        exec(c["code"], {})
    out.append(buf.getvalue().strip())
json.dump(out, sys.stdout)
`);

const candidates = process.platform === "win32" ? ["python", "py", "python3"] : ["python3", "python"];
let raw = "";
for (const exe of candidates) {
  try {
    raw = execFileSync(exe, ["-I", join(dir, "run.py"), join(dir, "cases.json")], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    break;
  } catch {
    /* interpréteur suivant */
  }
}
if (!raw) {
  console.error("Python 3 introuvable : installe-le pour lancer cette vérification.");
  process.exit(1);
}
const outputs: string[] = JSON.parse(raw);
const wrong = cases.filter((c, i) => Number(outputs[i]) !== c.expected);
for (const c of wrong.slice(0, 20)) console.error(`✗ ${c.id} : Python affiche ${outputs[cases.indexOf(c)]}, la banque attend ${c.expected}`);
console.log(`${cases.length - wrong.length}/${cases.length} programmes Python exécutés donnent la réponse attendue.`);
process.exit(wrong.length ? 1 : 0);
