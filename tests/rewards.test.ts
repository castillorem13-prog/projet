import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computePoints } from "../src/lib/points";
import { INITIAL_WALLET, balance, challengeStates, credit, frEuros, pendingPoints, reservedPoints, spendable } from "../src/lib/rewards";

describe("Points de séance", () => {
  const base = { correctCount: 8, totalQuestions: 10, avgSecondsPerQuestion: 30, streakDays: 4, pointsEarnedToday: 0 };
  it("répondre trop vite ne rapporte rien", () => assert.equal(computePoints({ ...base, avgSecondsPerQuestion: 5 }).awarded, 0));
  it("plafond de 150 points par jour", () => {
    const r = computePoints({ ...base, pointsEarnedToday: 140 });
    assert.equal(r.awarded, 10);
    assert.equal(r.cappedByDailyLimit, true);
  });
  it("bonus de régularité plafonné à +50 %", () => assert.equal(computePoints({ ...base, streakDays: 40 }).streakMultiplier, 1.5));
});

describe("Cagnotte", () => {
  it("1 000 points = 1 €", () => {
    assert.equal(frEuros(1000), "1,00\u00a0€");
    assert.equal(frEuros(5420), "5,42\u00a0€");
  });
  it("le cashback en attente n'est pas utilisable, une demande en attente est réservée", () => {
    const w = { ...INITIAL_WALLET, redemptions: [{ id: "r", rewardId: "gift-bulle-5", points: 5000, at: new Date().toISOString(), status: "pending" as const }] };
    assert.equal(pendingPoints(w), 1440);
    assert.equal(balance(w), INITIAL_WALLET.ledger.filter((e) => !e.pending).reduce((s, e) => s + e.points, 0));
    assert.equal(reservedPoints(w), 5000);
    assert.equal(spendable(w), balance(w) - 5000);
  });
  it("une séance créditée peut compléter un défi de la semaine, crédité une seule fois", () => {
    const at = new Date(2026, 9, 29, 17).toISOString();
    const before = challengeStates(INITIAL_WALLET, "4e");
    const days = before.find((c) => c.challenge.id === "days-4");
    assert.ok(days && !days.done);
    const { wallet, completed } = credit(INITIAL_WALLET, { at, kind: "session", label: "Test", points: 20, subject: "maths", grade: "3e" }, "4e");
    assert.ok(completed.some((c) => c.id === "days-4"));
    const again = credit(wallet, { at, kind: "session", label: "Test 2", points: 20, subject: "maths", grade: "3e" }, "4e");
    assert.ok(!again.completed.some((c) => c.id === "days-4"));
  });
});
