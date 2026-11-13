import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAttempt, toSnapshot } from "../src/server/progress";

const NOW = new Date("2026-11-13T17:00:00Z");
const valid = () => ({
  clientId: "AAAAAAAA-0000-4000-8000-000000000001",
  kind: "session",
  sessionId: "fonctions-affines-3e",
  unitId: "u1",
  avgSeconds: 42.57,
  evidence: [
    { unitId: "u1", itemId: "fa-cours", at: "2026-11-13T16:00:00Z", stage: "rappel", result: "success", assistance: 0 },
    { unitId: "u1", itemId: "fa-graphe", at: "2026-11-13T16:01:00Z", stage: "application", result: "partial", assistance: 2, errorType: "calcul", methods: ["sg-modeles"] },
  ],
  reviews: [{ unitId: "u1", due: "2026-11-16", reason: "Rappel dans 3 jours." }],
});
const refuse = (patch: (b: ReturnType<typeof valid>) => unknown) => {
  const b = valid();
  const r = parseAttempt(patch(b) ?? b, NOW);
  assert.equal(r.ok, false);
};

describe("Sauvegarde de la progression : vérification de ce que l'appli envoie", () => {
  it("accepte une séance correcte et nettoie les valeurs", () => {
    const r = parseAttempt(valid(), NOW);
    assert.ok(r.ok);
    assert.equal(r.value.clientId, "aaaaaaaa-0000-4000-8000-000000000001");
    assert.equal(r.value.avgSeconds, 42.6);
    assert.equal(r.value.evidence[0]?.at, "2026-11-13T16:00:00.000Z");
    assert.deepEqual(r.value.evidence[1]?.methods, ["sg-modeles"]);
  });
  it("accepte un entraînement sans séance", () => {
    const b: Record<string, unknown> = { ...valid(), kind: "entrainement" };
    delete b.sessionId;
    assert.ok(parseAttempt(b, NOW).ok);
  });
  it("ignore les champs inconnus au lieu de les enregistrer", () => {
    const r = parseAttempt({ ...valid(), points: 9999, evidence: [{ ...valid().evidence[0], points: 50 }] }, NOW);
    assert.ok(r.ok);
    assert.equal("points" in r.value, false);
    assert.equal("points" in (r.value.evidence[0] ?? {}), false);
  });
  it("refuse ce qui n'est pas un objet", () => {
    for (const b of [null, "texte", 3, []]) assert.equal(parseAttempt(b, NOW).ok, false);
  });
  it("refuse un clientId qui n'est pas un identifiant", () => refuse((b) => ({ ...b, clientId: "123" })));
  it("refuse un type de tentative inconnu", () => refuse((b) => ({ ...b, kind: "triche" })));
  it("exige sessionId pour une séance", () => refuse((b) => ({ ...b, sessionId: undefined })));
  it("refuse un temps négatif", () => refuse((b) => ({ ...b, avgSeconds: -1 })));
  it("refuse une étape, un résultat ou un type d'erreur inconnus", () => {
    refuse((b) => ({ ...b, evidence: [{ ...b.evidence[0], stage: "bonus" }] }));
    refuse((b) => ({ ...b, evidence: [{ ...b.evidence[0], result: "parfait" }] }));
    refuse((b) => ({ ...b, evidence: [{ ...b.evidence[0], errorType: "flemme" }] }));
    refuse((b) => ({ ...b, evidence: [{ ...b.evidence[0], methods: ["inventee"] }] }));
  });
  it("refuse une aide hors de 0 à 4", () => {
    refuse((b) => ({ ...b, evidence: [{ ...b.evidence[0], assistance: 5 }] }));
    refuse((b) => ({ ...b, evidence: [{ ...b.evidence[0], assistance: 1.5 }] }));
  });
  it("refuse une trace datée dans le futur", () => refuse((b) => ({ ...b, evidence: [{ ...b.evidence[0], at: "2026-12-25T00:00:00Z" }] })));
  it("refuse trop de traces d'un coup", () => refuse((b) => ({ ...b, evidence: Array.from({ length: 201 }, () => b.evidence[0]) })));
  it("refuse un rappel mal daté ou trop long", () => {
    refuse((b) => ({ ...b, reviews: [{ ...b.reviews[0], due: "16/11/2026" }] }));
    refuse((b) => ({ ...b, reviews: [{ ...b.reviews[0], reason: "x".repeat(301) }] }));
  });
});

describe("Sauvegarde de la progression : retour à la forme de la V1", () => {
  it("transforme les lignes de la base en Evidence et Review", () => {
    const snap = toSnapshot(
      [{ unit_id: "u1", item_id: "a", at: "2026-11-13T16:00:00+00:00", stage: "rappel", result: "fail", assistance: 4, self_assessed: false, error_type: "calcul", methods: [] }],
      [{ unit_id: "u1", due: "2026-11-14", reason: "demain" }],
    );
    assert.deepEqual(snap.evidence, [{ unitId: "u1", itemId: "a", at: "2026-11-13T16:00:00.000Z", stage: "rappel", result: "fail", assistance: 4, errorType: "calcul" }]);
    assert.deepEqual(snap.reviews, [{ unitId: "u1", due: "2026-11-14", reason: "demain" }]);
  });
});
