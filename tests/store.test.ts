import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getSession } from "../src/lib/content/sessions";
import { findUnit, levelRank } from "../src/lib/curriculum";
import { balance } from "../src/lib/rewards";
import { sampleResult } from "../src/lib/session-result";
import { INITIAL_STATE, applyResult, changeLevel, decideReward, requestReward } from "../src/lib/store";

describe("Fin de séance : maîtrise, rappel et cagnotte restent séparés", () => {
  it("les traces sont ajoutées, un rappel est programmé, les points vont dans la cagnotte", () => {
    const session = getSession("fonctions-affines-3e");
    const result = sampleResult(session, INITIAL_STATE.profile.levels);
    const s = applyResult(INITIAL_STATE, result);
    assert.equal(s.evidence.length, INITIAL_STATE.evidence.length + result.items.length);
    assert.ok(s.reviews.some((r) => r.unitId === session.unitId && r.reason.length > 10));
    assert.ok(s.lastGain);
    assert.equal(balance(s.wallet), balance(INITIAL_STATE.wallet) + s.lastGain.points + s.lastGain.challenges.reduce((n, c) => n + c.points, 0));
  });

  it("une séance sans point (réponses trop rapides) laisse la cagnotte intacte mais garde les traces", () => {
    const session = getSession("calcul-litteral-4e");
    const fast = { ...sampleResult(session, INITIAL_STATE.profile.levels) };
    fast.points = { ...fast.points, awarded: 0, timeMultiplier: 0 };
    const s = applyResult(INITIAL_STATE, fast);
    assert.equal(balance(s.wallet), balance(INITIAL_STATE.wallet));
    assert.ok(s.evidence.length > INITIAL_STATE.evidence.length);
  });
});

describe("Changer de classe", () => {
  it("la progression repart d'une proposition, sans traces sur des classes pas encore atteintes", () => {
    const s = changeLevel(INITIAL_STATE, "5e");
    assert.equal(s.profile.grade, "5e");
    for (const p of Object.values(s.progress)) assert.equal(p?.source, "proposal");
    for (const e of s.evidence) assert.ok(levelRank(findUnit(e.unitId)!.level) <= levelRank("5e"), e.unitId);
    for (const r of s.reviews) assert.ok(levelRank(findUnit(r.unitId)!.level) <= levelRank("5e"), r.unitId);
  });
  it("revenir en 3e retrouve la démo", () => {
    const s = changeLevel(changeLevel(INITIAL_STATE, "6e"), "3e");
    assert.equal(s.progress.maths?.source, "ent_demo");
    assert.equal(s.evidence.length, INITIAL_STATE.evidence.length);
  });
});

describe("Utiliser la cagnotte", () => {
  it("avant 15 ans, la demande attend le parent ; validée, elle débite et donne un code", () => {
    const asked = requestReward(INITIAL_STATE, "gift-bulle-5");
    const r = asked.wallet.redemptions[0]!;
    assert.equal(r.status, "pending");
    assert.equal(balance(asked.wallet), balance(INITIAL_STATE.wallet));
    const ok = decideReward(asked, r.id, true);
    assert.equal(ok.wallet.redemptions[0]?.status, "approved");
    assert.ok(ok.wallet.redemptions[0]?.code);
    assert.equal(balance(ok.wallet), balance(INITIAL_STATE.wallet) - 5000);
  });
  it("refusée, rien n'est débité", () => {
    const asked = requestReward(INITIAL_STATE, "gift-bulle-5");
    const no = decideReward(asked, asked.wallet.redemptions[0]!.id, false);
    assert.equal(balance(no.wallet), balance(INITIAL_STATE.wallet));
  });
  it("à 15 ans ou plus, l'utilisation est immédiate", () => {
    const s = requestReward({ ...INITIAL_STATE, profile: { ...INITIAL_STATE.profile, under15: false } }, "gift-bulle-5");
    assert.equal(s.wallet.redemptions[0]?.status, "approved");
  });
});
