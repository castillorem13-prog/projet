import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SESSIONS, ALL_SESSIONS } from "../src/lib/content/sessions";
import { UNITS, findUnit, levelRank, sourceOf, unitsOf } from "../src/lib/curriculum";
import { LEVELS, studentSubjects } from "../src/lib/curriculum/levels";
import { OBJECTIVES } from "../src/lib/curriculum/objectives";
import { defaultProgress } from "../src/lib/curriculum/progression";
import { SOURCES, getSource, sourceFor } from "../src/lib/curriculum/sources";

describe("Référentiel des programmes", () => {
  it("chaque unité a un identifiant unique", () => {
    const ids = UNITS.map((u) => u.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("chaque unité est rattachée à une version de programme existante, en vigueur pour son niveau en 2026-2027", () => {
    for (const u of UNITS) {
      const src = sourceOf(u);
      assert.ok(src, `${u.id} : aucune source`);
      const rule = src.applies.find((a) => a.level === u.level);
      assert.ok(rule, `${u.id} : la source ${src.id} ne couvre pas la ${u.level}`);
      assert.ok(rule.from <= "2026-09-01" && (!rule.until || rule.until > "2026-09-01"), `${u.id} : ${src.id} pas en vigueur`);
    }
  });

  it("les sources ont une référence, une adresse officielle et un statut honnête", () => {
    for (const s of SOURCES) {
      assert.match(s.url, /^https:\/\/([a-z.]*education\.gouv\.fr|eduscol\.education\.gouv\.fr|sti\.eduscol\.education\.fr)/, s.id);
      assert.ok(s.reference.length > 5, s.id);
      if (s.verification !== "verified_official") assert.ok(s.checkedWith.length > 0 || s.verification === "needs_review", `${s.id} : recoupement non documenté`);
    }
    // « Texte officiel lu » exige de citer la copie intégrale effectivement lue.
    for (const s of SOURCES.filter((x) => x.verification === "verified_official")) assert.ok(s.checkedWith.length > 0 && s.note, `${s.id} : copie lue non citée`);
    assert.deepEqual(
      SOURCES.filter((s) => s.verification === "verified_official").map((s) => s.id).sort(),
      ["eppcs-2021", "lca-c4-2016", "lv-2025", "techno-c4-2024"],
    );
  });

  it("la version de programme change avec la rentrée (maths en 3e : 2020 puis 2026)", () => {
    assert.equal(sourceFor("3e", "maths", "2026-09-01")?.id, "c4-2020-fml");
    assert.equal(sourceFor("3e", "maths", "2028-09-01")?.id, "c4-fr-maths-2026");
    assert.equal(sourceFor("5e", "maths", "2026-09-01")?.id, "c4-fr-maths-2026");
  });

  it("langues vivantes : le programme 2025 s'applique en 6e, 5e et au lycée, la version 2020 en 4e et 3e (article 4 de l'arrêté)", () => {
    for (const l of ["6e", "5e", "2nde", "1re", "Tle"] as const) assert.equal(sourceFor(l, "anglais", "2026-09-01")?.id, "lv-2025", l);
    for (const l of ["4e", "3e"] as const) assert.equal(sourceFor(l, "anglais", "2026-09-01")?.id, "c4-2020-fml", l);
    assert.equal(sourceFor("4e", "espagnol", "2027-09-01")?.id, "lv-2025");
    assert.equal(sourceFor("3e", "allemand", "2028-09-01")?.id, "lv-2025");
  });

  it("EMC : programme 2024 à tous les niveaux en 2026-2027", () => {
    for (const l of ["6e", "5e", "4e", "3e", "2nde", "1re", "Tle"] as const) assert.equal(sourceFor(l, "emc", "2026-09-01")?.id, "emc-2024", l);
    assert.equal(sourceFor("3e", "emc", "2025-09-01"), undefined, "en 2025-2026, la 3e suivait encore l'ancien programme (non référencé)");
  });

  it("chaque langue proposée (anglais, espagnol, allemand) et chaque option de latin et de grec a des unités", () => {
    for (const l of ["5e", "4e", "3e", "2nde", "1re", "Tle"] as const) {
      for (const s of ["anglais", "espagnol", "allemand", "latin", "grec"] as const) assert.ok(unitsOf(l, s).length >= 4, `${l} ${s}`);
    }
    for (const s of ["llca", "eppcs", "arts-spe"] as const) for (const l of ["1re", "Tle"] as const) assert.ok(unitsOf(l, s).length >= 3, `${l} ${s}`);
  });

  it("les prérequis existent et viennent du même niveau ou d'un niveau antérieur", () => {
    for (const u of UNITS) {
      for (const n of u.needs ?? []) {
        const need = findUnit(n);
        assert.ok(need, `${u.id} → ${n} introuvable`);
        assert.ok(levelRank(need.level) <= levelRank(u.level), `${u.id} dépend d'un niveau supérieur (${n})`);
      }
    }
  });

  it("chaque matière suivie a des unités à son niveau (spécialités comprises)", () => {
    for (const l of LEVELS) {
      const specs = l.subjects.filter((s) => s.role === "specialite").map((s) => s.subject);
      const options = l.subjects.filter((s) => s.role === "option").map((s) => s.subject);
      for (const lvb of ["espagnol", "allemand"] as const) {
        for (const s of studentSubjects(l.id, { lvb, specialties: specs, options })) {
          assert.ok(unitsOf(l.id, s.subject).length > 0, `${l.id} ${s.subject} : aucune unité`);
        }
      }
    }
  });

  it("les objectifs approfondis pointent vers des unités et des sources existantes", () => {
    for (const o of OBJECTIVES) {
      assert.ok(findUnit(o.unitId), o.id);
      for (const r of o.sourceRefs) assert.ok(getSource(r), `${o.id} → ${r}`);
      assert.ok(o.observableOutcome.length > 20 && o.commonMisconceptions.length >= 2, o.id);
    }
  });

  it("les séances et les unités se référencent dans les deux sens", () => {
    for (const s of ALL_SESSIONS) {
      const u = findUnit(s.unitId);
      assert.ok(u, `${s.id} → unité ${s.unitId} introuvable`);
      assert.equal(u.level, s.grade, `${s.id} : niveau différent de son unité`);
      assert.equal(u.subject, s.subject, `${s.id} : matière différente de son unité`);
    }
    for (const u of UNITS) if (u.sessionId) assert.ok(SESSIONS[u.sessionId], `${u.id} → séance ${u.sessionId} introuvable`);
  });
});

describe("Progression de la classe", () => {
  it("en 3e avec l'ENT de démo : progression confirmée, marquée comme simulée", () => {
    const p = defaultProgress("3e", { lvb: "espagnol", specialties: [], options: [] }, true);
    assert.equal(p.maths?.source, "ent_demo");
    assert.equal(p.maths?.current, "3e-maths-affines");
    for (const [subject, prog] of Object.entries(p)) {
      assert.ok(prog?.current && prog.order.includes(prog.current), `${subject} : chapitre en cours hors de l'ordre`);
      for (const id of prog?.order ?? []) assert.ok(findUnit(id), `${subject} : ${id} introuvable`);
    }
  });

  it("sans ENT : une proposition non confirmée, jamais présentée comme le chapitre du professeur", () => {
    for (const l of LEVELS) {
      const p = defaultProgress(l.id, { lvb: "allemand", specialties: [], options: [] }, false);
      for (const prog of Object.values(p)) {
        assert.equal(prog?.source, "proposal");
        assert.equal(prog?.confirmed, false);
      }
    }
  });
});
