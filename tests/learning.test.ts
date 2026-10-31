import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Evidence, MasteryState } from "../src/lib/curriculum";
import { findUnit } from "../src/lib/curriculum";
import { isUnlocked, recommendedBases, revisionRows } from "../src/lib/curriculum/modes";
import { defaultProgress } from "../src/lib/curriculum/progression";
import { DEMO_EVIDENCE, isAutonomous, masteryOf } from "../src/lib/learning/mastery";
import { DEMO_REVIEWS, scheduleAfterSession } from "../src/lib/learning/scheduler";

const at = (day: number, h = 18) => new Date(2026, 9, day, h).toISOString();
const ev = (day: number, stage: Evidence["stage"], result: Evidence["result"], assistance: Evidence["assistance"] = 0, selfAssessed = false): Evidence => ({
  unitId: "u",
  itemId: `i-${day}-${stage}-${result}`,
  at: at(day),
  stage,
  result,
  assistance,
  selfAssessed,
});

describe("États de maîtrise (indépendants des points)", () => {
  it("sans trace : à découvrir", () => assert.equal(masteryOf([]), "a-decouvrir"));

  it("une réussite avec indice fort n'est pas une réussite autonome", () => {
    assert.equal(isAutonomous(ev(1, "rappel", "success", 2)), false);
    assert.equal(isAutonomous(ev(1, "rappel", "success", 0)), true);
    const s = masteryOf([ev(1, "rappel", "success", 3), ev(1, "application", "success", 2), ev(1, "transfert", "success", 4)]);
    assert.ok(["en-decouverte", "fragile"].includes(s), s);
  });

  it("une rédaction auto-évaluée reste indicative", () => {
    assert.equal(isAutonomous(ev(1, "transfert", "success", 0, true)), false);
    assert.equal(masteryOf([ev(1, "rappel", "success"), ev(1, "application", "success"), ev(8, "transfert", "success", 0, true)]), "consolidation");
  });

  it("réussi seul un seul jour, transfert compris : en consolidation, pas encore maîtrisé", () => {
    assert.equal(masteryOf([ev(1, "rappel", "success"), ev(1, "application", "success"), ev(1, "transfert", "success")]), "consolidation");
  });

  it("réussi seul sur deux jours, dont un transfert : maîtrisé (provisoire)", () => {
    assert.equal(masteryOf([ev(1, "rappel", "success"), ev(3, "transfert", "success"), ev(3, "application", "success")]), "provisoire");
  });

  it("encore réussi seul au moins 7 jours après : maîtrise durable", () => {
    assert.equal(masteryOf([ev(1, "rappel", "success"), ev(4, "transfert", "success"), ev(12, "application", "success")]), "durable");
  });

  it("une dernière séance ratée fait redescendre à fragile", () => {
    const base = [ev(1, "rappel", "success"), ev(4, "transfert", "success"), ev(12, "application", "success")];
    assert.equal(masteryOf([...base, ev(20, "rappel", "fail"), ev(20, "application", "fail"), ev(20, "transfert", "partial")]), "fragile");
  });

  it("un transfert raté lors de la dernière séance empêche de déclarer la notion maîtrisée", () => {
    const s = masteryOf([ev(1, "rappel", "success"), ev(3, "rappel", "success"), ev(3, "application", "success"), ev(3, "transfert", "success"), ev(3, "transfert", "fail")]);
    assert.equal(s, "consolidation");
  });

  it("les traces de démonstration donnent des états variés", () => {
    const byUnit = new Map<string, Evidence[]>();
    for (const e of DEMO_EVIDENCE) byUnit.set(e.unitId, [...(byUnit.get(e.unitId) ?? []), e]);
    const states = new Set(Array.from(byUnit.values()).map(masteryOf));
    for (const s of ["en-decouverte", "fragile", "consolidation", "provisoire", "durable"] as MasteryState[]) assert.ok(states.has(s), s);
    for (const id of byUnit.keys()) assert.ok(findUnit(id), `trace sur une unité inconnue : ${id}`);
  });
});

describe("Rappels espacés", () => {
  const now = new Date(2026, 9, 29, 18);
  it("erreur : on revient demain, avec la raison", () => {
    const r = scheduleAfterSession("u", [ev(29, "rappel", "success"), ev(29, "application", "fail")], "fragile", now);
    assert.equal(r.due, "2026-10-30");
    assert.match(r.reason, /demain/);
  });
  it("aide forte : demain aussi", () => {
    assert.equal(scheduleAfterSession("u", [ev(29, "rappel", "success", 2)], "fragile", now).due, "2026-10-30");
  });
  it("aide légère ou réponse auto-évaluée : dans 3 jours", () => {
    assert.equal(scheduleAfterSession("u", [ev(29, "rappel", "success", 1)], "consolidation", now).due, "2026-11-01");
    assert.equal(scheduleAfterSession("u", [ev(29, "transfert", "success", 0, true)], "consolidation", now).due, "2026-11-01");
  });
  it("tout réussi seul : 7, 14 ou 30 jours selon la maîtrise", () => {
    const ok = [ev(29, "rappel", "success"), ev(29, "transfert", "success")];
    assert.equal(scheduleAfterSession("u", ok, "consolidation", now).due, "2026-11-05");
    assert.equal(scheduleAfterSession("u", ok, "provisoire", now).due, "2026-11-12");
    assert.equal(scheduleAfterSession("u", ok, "durable", now).due, "2026-11-28");
  });
  it("les rappels de démonstration portent sur des unités existantes et ont une raison", () => {
    for (const r of DEMO_REVIEWS) {
      assert.ok(findUnit(r.unitId), r.unitId);
      assert.ok(r.reason.length > 20);
    }
  });
});

describe("Modes révision et avance", () => {
  const track = { lvb: "espagnol", specialties: [], options: [] } as const;
  const progress = defaultProgress("3e", { ...track, specialties: [], options: [] }, true);

  it("un chapitre de 2nde s'ouvre seulement quand ses bases de 3e sont maîtrisées", () => {
    const algebra = findUnit("2nde-maths-calcul");
    assert.ok(algebra);
    const needs3e = (algebra.needs ?? []).filter((id) => id.startsWith("3e-"));
    assert.ok(needs3e.length > 0);
    assert.equal(isUnlocked(algebra, "3e", () => "consolidation"), false);
    assert.equal(isUnlocked(algebra, "3e", () => "provisoire"), true);
    assert.equal(isUnlocked(algebra, "3e", (id) => (id === needs3e[0] ? "fragile" : "durable")), false);
  });

  it("les bases conseillées viennent de l'année précédente et ne sont pas encore consolidées", () => {
    const recos = recommendedBases("3e", progress, () => "fragile");
    assert.ok(recos.length > 0);
    for (const r of recos) assert.equal(r.base.level, "4e");
    assert.equal(recommendedBases("3e", progress, () => "provisoire").length, 0);
  });

  it("la révision met en tête ce qui sert maintenant", () => {
    const rows = revisionRows("3e", "maths", progress.maths, () => "consolidation");
    const firstNotUseful = rows.findIndex((r) => !r.useful);
    assert.ok(rows.slice(firstNotUseful === -1 ? rows.length : firstNotUseful).every((r) => !r.useful));
    assert.ok(rows.some((r) => r.useful));
  });
});

describe("Approfondissement facultatif", () => {
  it("un bonus raté ne fait pas baisser la maîtrise ni rapprocher le rappel", () => {
    const base = [ev(1, "rappel", "success"), ev(3, "transfert", "success"), ev(3, "application", "success")];
    assert.equal(masteryOf([...base, ev(3, "extension", "fail", 4)]), masteryOf(base));
    const now = new Date(2026, 9, 29, 18);
    const ok = [ev(29, "rappel", "success"), ev(29, "transfert", "success")];
    assert.equal(scheduleAfterSession("u", [...ok, ev(29, "extension", "fail", 4)], "consolidation", now).due, scheduleAfterSession("u", ok, "consolidation", now).due);
  });
  it("un bonus réussi seul compte comme un transfert", () => {
    assert.equal(masteryOf([ev(1, "rappel", "success"), ev(3, "application", "success"), ev(3, "extension", "success")]), "provisoire");
  });
});
