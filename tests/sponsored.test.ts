import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getSession, SESSIONS } from "../src/lib/content/sessions";
import { NO_SPONSOR_SUBJECTS, SPONSORSHIPS, shownActivity } from "../src/lib/content/sponsored";
import { INITIAL_WALLET, PARTNERS, SPONSOR_DAILY_CAP, balance, creditSponsored, partner } from "../src/lib/rewards";
import { sampleResult } from "../src/lib/session-result";
import { INITIAL_STATE, applyResult } from "../src/lib/store";
import { allText } from "./helpers";

describe("Partenaires", () => {
  it("dix enseignes fictives, aucune dans l'alimentation", () => {
    assert.equal(PARTNERS.length, 10);
    assert.equal(new Set(PARTNERS.map((p) => p.name)).size, 10);
    for (const p of PARTNERS) assert.doesNotMatch(`${p.category} ${p.blurb}`.toLowerCase(), /aliment|boisson|snack|fast|restaurant|bonbon/);
  });
  it("au plus un exercice partenaire par séance", () => {
    const ids = SPONSORSHIPS.map((s) => s.sessionId);
    assert.equal(new Set(ids).size, ids.length);
  });
  it("chaque partenaire propose au moins un exercice", () => {
    for (const p of PARTNERS) assert.ok(SPONSORSHIPS.some((s) => s.partnerId === p.id), p.name);
  });
});

describe("Exercices partenaires", () => {
  for (const sp of SPONSORSHIPS) {
    describe(`${sp.sessionId} / ${sp.activityId}`, () => {
      const session = SESSIONS[sp.sessionId];
      it("séance, activité et partenaire existent ; bonus raisonnable", () => {
        assert.ok(session);
        assert.ok(session.activities.some((a) => a.id === sp.activityId));
        assert.ok(partner(sp.partnerId));
        assert.ok(sp.bonus >= 5 && sp.bonus <= 20);
      });
      it("jamais en histoire-géographie, EMC ou philosophie", () => {
        assert.ok(!(NO_SPONSOR_SUBJECTS as readonly string[]).includes(session!.subject));
      });
      it("même exercice : format, compétence, étape et réponses identiques ; le partenaire est nommé", () => {
        const a = session!.activities.find((x) => x.id === sp.activityId)!;
        const v = sp.build(a);
        assert.equal(v.kind, a.kind);
        assert.equal(v.id, a.id);
        assert.equal(v.stage, a.stage);
        assert.equal(v.competence, a.competence);
        assert.deepEqual(v.ops, a.ops);
        if (a.kind === "problem" && v.kind === "problem") assert.deepEqual(v.parts.map((p) => [p.id, p.answer]), a.parts.map((p) => [p.id, p.answer]));
        if ((a.kind === "mcq" || a.kind === "worked") && (v.kind === "mcq" || v.kind === "worked")) assert.equal(v.correct, a.correct);
        if (a.kind === "mcq" && v.kind === "mcq") assert.deepEqual(v.options.length, a.options.length);
        if (a.kind === "order" && v.kind === "order") {
          assert.equal(v.steps.length, a.steps.length);
          assert.deepEqual([...v.display].sort(), v.steps.map((_, i) => i));
        }
        if (a.kind === "classify" && v.kind === "classify") {
          assert.deepEqual(v.categories, a.categories);
          assert.deepEqual(v.items.map((i) => i.category), a.items.map((i) => i.category));
        }
        assert.ok(allText(v).join(" ").includes(partner(sp.partnerId).name), "le nom du partenaire doit apparaître dans l'énoncé");
        assert.ok(!allText(v).join(" ").toLowerCase().includes("achète"), "aucune incitation à acheter");
      });
    });
  }

  it("désactivés par le parent : la version sans marque est affichée", () => {
    const sp = SPONSORSHIPS[0]!;
    const s = getSession(sp.sessionId);
    const a = s.activities.find((x) => x.id === sp.activityId)!;
    assert.equal(shownActivity(s, a, false).activity, a);
    assert.equal(shownActivity(s, a, false).sponsor, undefined);
    assert.equal(shownActivity(s, a, true).sponsor?.partnerId, sp.partnerId);
  });
});

describe("Bonus partenaires dans la cagnotte", () => {
  const at = new Date(2026, 9, 29, 17).toISOString();
  const done = (activityId: string, seconds = 30, bonus = 15) => ({ partnerId: "stade", activityId, bonus, seconds, label: "Test" });

  it("versé une fois par exercice et par jour", () => {
    const first = creditSponsored(INITIAL_WALLET, [done("x-1")], at);
    assert.equal(first.credited.length, 1);
    const again = creditSponsored(first.wallet, [done("x-1")], at);
    assert.equal(again.credited.length, 0);
  });
  it("pas de bonus si l'exercice a été survolé (moins de 8 s)", () => {
    assert.equal(creditSponsored(INITIAL_WALLET, [done("x-2", 3)], at).credited.length, 0);
  });
  it(`plafond de ${SPONSOR_DAILY_CAP} points par jour`, () => {
    const many = Array.from({ length: 12 }, (_, i) => done(`x-${i + 10}`));
    const r = creditSponsored(INITIAL_WALLET, many, at);
    assert.equal(r.credited.reduce((n, c) => n + c.points, 0), SPONSOR_DAILY_CAP);
  });
  it("une séance avec un exercice partenaire crédite le bonus, à part des points de séance, sans toucher la maîtrise", () => {
    const session = getSession("fonctions-affines-3e");
    const base = sampleResult(session, INITIAL_STATE.profile.levels);
    const sponsored = { ...base, items: base.items.map((i) => (i.activityId === "fa-formules" ? { ...i, sponsor: { partnerId: "stade", bonus: 15 } } : i)) };
    const a = applyResult(INITIAL_STATE, base);
    const b = applyResult(INITIAL_STATE, sponsored);
    assert.deepEqual(b.lastGain?.sponsored, [{ partnerId: "stade", points: 15 }]);
    assert.equal(balance(b.wallet) - balance(a.wallet), 15);
    assert.equal(b.lastGain?.stateAfter, a.lastGain?.stateAfter);
  });
});
