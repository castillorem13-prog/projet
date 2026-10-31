import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { ALL_SESSIONS, getSession } from "../src/lib/content/sessions";
import { hintsOf, type Activity, type ProblemActivity, type Stimulus } from "../src/lib/content/types";
import { checkAnswer } from "../src/lib/pedagogy/answer-checker";
import { PARTNERS } from "../src/lib/rewards";
import { allText } from "./helpers";

const CORE = ["rappel", "application", "transfert"] as const;
const stimuli = (a: Activity): Stimulus[] => (a.stimulus ? (Array.isArray(a.stimulus) ? a.stimulus : [a.stimulus]) : []);

describe("Séances : structure pédagogique", () => {
  for (const s of ALL_SESSIONS) {
    describe(s.id, () => {
      it("trois défis (rappel, application, transfert) dans l'ordre, l'approfondissement facultatif à la fin", () => {
        const stages = s.activities.map((a) => a.stage);
        for (const st of CORE) assert.ok(stages.includes(st), `aucune activité « ${st} »`);
        const rank = { rappel: 0, application: 1, transfert: 2, extension: 3 } as const;
        for (let i = 1; i < stages.length; i++) assert.ok(rank[stages[i]!] >= rank[stages[i - 1]!], `ordre des défis : ${stages.join(", ")}`);
      });

      it("trois indices distincts et non vides par activité", () => {
        // Dans un exercice à plusieurs questions, les indices sont donnés question par question.
        const sets = s.activities.flatMap((a) => (a.kind === "problem" ? a.parts.map((p) => ({ id: p.id, h: hintsOf({ ...p, takeaway: a.takeaway }) })) : [{ id: a.id, h: hintsOf(a) }]));
        for (const { id, h } of sets) {
          assert.equal(new Set(h.map((x) => x.trim())).size, 3, `${id} : indices en double`);
          for (const x of h) assert.ok(x.trim().length > 5, `${id} : indice vide`);
        }
      });

      it("chaque activité a un objectif d'opération cognitive, une correction et un « à retenir »", () => {
        assert.ok(s.objective.length > 15);
        for (const a of s.activities) {
          assert.ok(a.ops.length > 0, a.id);
          assert.ok(a.takeaway.length > 10, a.id);
          if (a.kind !== "problem") assert.ok(a.solution.length > 0, `${a.id} : pas de correction`);
        }
      });

      it("les réponses attendues sont cohérentes avec les choix proposés", () => {
        for (const a of s.activities) {
          if (a.kind === "mcq" || a.kind === "graph" || a.kind === "worked") assert.ok(a.options[a.correct], `${a.id} : bonne réponse hors des choix`);
          if (a.kind === "worked") assert.ok(a.steps[a.blank], `${a.id} : étape à compléter introuvable`);
          if (a.kind === "order") assert.deepEqual([...a.display].sort(), a.steps.map((_, i) => i), `${a.id} : ordre d'affichage invalide`);
          if (a.kind === "spot-error") {
            assert.ok(a.lines[a.wrongLine] !== undefined, `${a.id} : ligne fausse introuvable`);
            assert.equal(a.lineFeedback.length, a.lines.length, `${a.id} : un retour par ligne`);
          }
          if (a.kind === "classify") {
            for (const it2 of a.items) assert.ok(a.categories[it2.category], `${a.id} : catégorie inconnue`);
            assert.ok(new Set(a.items.map((x) => x.category)).size >= 2, `${a.id} : une seule catégorie utilisée`);
          }
          if (a.kind === "dialogue") {
            for (const t of a.turns) if (t.who === "you") assert.ok(t.options.some((o) => o.ok) && t.options.some((o) => !o.ok), `${a.id} : chaque réplique doit avoir une bonne et une mauvaise option`);
          }
          if (a.kind === "writing") {
            assert.ok(a.rubric.length >= 3, `${a.id} : grille trop courte`);
            assert.ok(a.models.length >= 1 && a.minWords > 0, a.id);
          }
          if (a.kind === "problem") {
            for (const p of a.parts) {
              const raw = `${String(p.answer.expected).replace(".", ",")}${p.answer.unit ? ` ${p.answer.unit}` : ""}`;
              assert.equal(checkAnswer(p.answer, raw).status, "correct", `${p.id} : la réponse attendue n'est pas acceptée`);
              for (const e of p.answer.knownErrors ?? []) assert.notEqual(e.value, p.answer.expected, `${p.id} : erreur classique égale à la réponse`);
              for (const code of Object.keys(p.errors ?? {})) assert.ok(p.answer.knownErrors?.some((e) => e.code === code), `${p.id} : retour « ${code} » sans erreur associée`);
            }
          }
        }
      });

      it("aucun partenaire, cashback ni cagnotte dans les exercices", () => {
        const text = allText(s.activities).join("\n").toLowerCase();
        for (const word of ["cashback", "cagnotte", ...PARTNERS.map((p) => p.name.toLowerCase())]) assert.ok(!text.includes(word), `« ${word} » trouvé`);
      });

      it("chaque document indique s'il est réel ou fictif ; un document réel dit d'où il vient", () => {
        for (const a of s.activities) {
          for (const d of stimuli(a)) {
            const p = d.provenance;
            if (p.authentic) {
              assert.ok(p.creator || p.source, `${a.id} « ${d.title} » : auteur ou source manquants`);
              assert.ok(p.date, `${a.id} « ${d.title} » : date manquante`);
            } else {
              assert.equal(p.verification, "illustrative_mock", `${a.id} « ${d.title} » : document fictif non marqué`);
            }
          }
        }
      });
    });
  }

  it("en histoire, EMC et philosophie : documents réels, énoncés non réécrits par les passions", () => {
    for (const id of ["histoire-totalitarismes-3e", "emc-regles-3e", "philo-raison-tle"]) {
      const s = getSession(id);
      assert.ok(s.fixedNote, `${id} : pas d'explication sur l'absence de personnalisation`);
      const docs = s.activities.flatMap(stimuli);
      assert.ok(docs.some((d) => d.provenance.authentic), `${id} : aucun document réel`);
      for (const a of s.activities) {
        const prompt = "prompt" in a ? a.prompt : undefined;
        assert.notEqual(typeof prompt, "function", `${id} ${a.id} : énoncé personnalisé dans une matière où les faits ne se réécrivent pas`);
      }
    }
  });

  it("la géographie utilise une commune fictive clairement signalée", () => {
    const docs = getSession("geographie-aires-3e").activities.flatMap(stimuli);
    assert.ok(docs.length > 0 && docs.every((d) => !d.provenance.authentic));
  });
});

describe("Calculs recalculés indépendamment", () => {
  const part = (sessionId: string, partId: string) => {
    for (const a of getSession(sessionId).activities) if (a.kind === "problem") for (const p of (a as ProblemActivity).parts) if (p.id === partId) return p.answer.expected;
    throw new Error(`${partId} introuvable`);
  };
  const firstInt = (min: number, ok: (n: number) => boolean) => {
    let n = min;
    while (!ok(n)) n++;
    return n;
  };

  it("fonctions affines : f(x) = 3x + 2 et deux formules 8x contre 20 + 4x", () => {
    const f = (x: number) => 3 * x + 2;
    assert.equal(part("fonctions-affines-3e", "fa-a"), f(4));
    assert.equal(part("fonctions-affines-3e", "fa-b"), (26 - 2) / 3);
    assert.equal(part("fonctions-affines-3e", "ff-a"), 8 * 3);
    assert.equal(part("fonctions-affines-3e", "ff-b"), 20 + 4 * 3);
    assert.equal(part("fonctions-affines-3e", "ff-c"), firstInt(0, (n) => 20 + 4 * n < 8 * n));
  });

  it("calcul littéral : 4n + 3", () => {
    assert.equal(part("calcul-litteral-4e", "cl-a"), 4 * 5 + 3);
    assert.equal(part("calcul-litteral-4e", "cl-b"), 4 * 0 + 3);
  });

  it("inéquations : 9x contre 30 + 4x", () => {
    assert.equal(part("inequations-2nde", "iq-a"), 30 + 4 * 6);
    assert.equal(part("inequations-2nde", "iq-b"), firstInt(0, (n) => 30 + 4 * n < 9 * n));
  });

  it("fractions : les 2/5 de 30", () => {
    assert.equal(part("fractions-6e", "fr6-a"), (30 / 5) * 2);
    assert.equal(part("fractions-6e", "fr6-b"), 30 - (30 / 5) * 2);
  });

  it("proportionnalité 5e : 8 pour 48 €, 5 au même prix unitaire, réduction de 25 %", () => {
    assert.equal(part("proportionnalite-5e", "pr5-a"), (48 / 8) * 5);
    assert.equal(part("proportionnalite-5e", "pr5-b"), (48 * 25) / 100);
    assert.equal(part("proportionnalite-5e", "pr5-c"), 48 * (1 - 25 / 100));
  });

  it("5e : les choix corrigés sont justes (4 cahiers à 6 €, hausse puis baisse de 10 %)", () => {
    const s = getSession("proportionnalite-5e");
    const worked = s.activities.find((a) => a.id === "pr5-exemple");
    assert.ok(worked?.kind === "worked");
    assert.equal(worked.options[worked.correct]!.text, `10 × ${String(6 / 4).replace(".", ",")} = ${(6 / 4) * 10}`);
    const ext = s.activities.find((a) => a.id === "pr5-hausse-baisse");
    assert.ok(ext?.kind === "mcq");
    assert.equal(ext.options[ext.correct]!.text, `${Math.round(100 * 1.1 * 0.9)} €`);
  });

  it("suites arithmétiques : u₀ = 120, r = 15", () => {
    const u = (n: number) => 120 + 15 * n;
    assert.equal(part("suites-1re", "su-a"), u(10));
    assert.equal(part("suites-1re", "su-b"), firstInt(0, (n) => u(n) >= 300));
  });

  it("SES : équilibre d'un marché linéaire (demande 1300 − 20p, offre 20p − 100)", () => {
    const D = (p: number) => 900 - 20 * (p - 20);
    const S = (p: number) => 300 + 20 * (p - 20);
    assert.equal(part("ses-marche-2nde", "se-a"), D(30));
    const p = firstInt(20, (x) => D(x) <= S(x));
    assert.equal(part("ses-marche-2nde", "se-b"), p);
    assert.equal(part("ses-marche-2nde", "se-c"), D(p));
  });

  it("SVT : 23 paires de chromosomes chez l'humain, 19 paires chez le chat", () => {
    assert.equal(part("svt-genetique-3e", "sv-a"), 23);
    assert.equal(part("svt-genetique-3e", "sv-b"), 46);
    assert.equal(part("svt-genetique-3e", "sv-chat-a"), 38 / 2);
  });
});

describe("Saisie des réponses", () => {
  it("une réponse sans unité de mesure accepte « € » et « % » écrits par l'élève", () => {
    for (const raw of ["30", "30 €", "30€", "30 euros", "30 %", "30%"]) assert.equal(checkAnswer({ expected: 30 }, raw).status, "correct", raw);
    assert.equal(checkAnswer({ expected: 4.5 }, "4,50 €").status, "correct");
    assert.equal(checkAnswer({ expected: 30 }, "25 %").matchedErrorCode, undefined);
  });

  it("une réponse avec unité de mesure reste vérifiée sur son unité", () => {
    assert.equal(checkAnswer({ expected: 7.5, unit: "m/s", requireUnit: true }, "7,5 €").status, "invalid_format");
    assert.equal(checkAnswer({ expected: 7.5, unit: "m/s", requireUnit: true }, "7,5 m/s").status, "correct");
  });
});

describe("Interface", () => {
  it("le lecteur de séance garde « Signaler une erreur dans l'exercice »", () => {
    const src = readFileSync(new URL("../src/components/screens/player.tsx", import.meta.url), "utf8");
    assert.ok(src.includes("Signaler une erreur dans l'exercice"));
  });
});
