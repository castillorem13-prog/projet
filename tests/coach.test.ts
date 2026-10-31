import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CODE_TYPES, defaultErrorType, diagnoseNumeric, errorProfile } from "../src/lib/coach/diagnose";
import { FAMILIES, buildDrill, rng } from "../src/lib/coach/drills";
import { knowledgeOf } from "../src/lib/coach/learner";
import { DEFAULT_METHODS, METHODS, MIN_COMPARE, activeMethods, analyzeMethods, methodsForSession } from "../src/lib/coach/methods";
import { oralChallenge, voSuggestion } from "../src/lib/coach/oral";
import { markDone, markSessionDone, planDay, type DayPlan } from "../src/lib/coach/planner";
import { IMPARFAIT, NOT_PASSE_SIMPLE, PASSE_SIMPLE, TIME_MARKERS, reviewWriting } from "../src/lib/coach/writing";
import { TODAY } from "../src/lib/content/calendar";
import { HOMEWORK } from "../src/lib/content/mock";
import { EVERYDAY, PASSIONS } from "../src/lib/content/passions";
import { ALL_SESSIONS, getSession } from "../src/lib/content/sessions";
import { findUnit } from "../src/lib/curriculum";
import { studentSubjects } from "../src/lib/curriculum/levels";
import type { Evidence, MethodId } from "../src/lib/curriculum/types";
import { checkAnswer } from "../src/lib/pedagogy/answer-checker";
import { sampleResult } from "../src/lib/session-result";
import { masteryOf } from "../src/lib/learning/mastery";
import { INITIAL_STATE, applyDrill, applyResult, logPractice, makePlan, migrate, togglePlanItem } from "../src/lib/store";

const at = (daysAgo: number) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(18);
  return d.toISOString();
};
const ev = (result: Evidence["result"], daysAgo: number, assistance: Evidence["assistance"] = 0, extra: Partial<Evidence> = {}): Evidence => ({ unitId: "3e-maths-affines", itemId: `t-${daysAgo}-${result}`, at: at(daysAgo), stage: "application", result, assistance, ...extra });
const S = INITIAL_STATE;
const base = { level: S.profile.grade, track: S.profile.track, progress: S.progress, evidence: S.evidence, reviews: S.reviews, homework: HOMEWORK, methods: DEFAULT_METHODS };

describe("Coach : modèle de l'élève", () => {
  it("des réussites seules font monter la maîtrise estimée ; des échecs la font baisser", () => {
    const up = knowledgeOf([ev("success", 3), ev("success", 2), ev("success", 1)]);
    const down = knowledgeOf([ev("fail", 3), ev("fail", 2), ev("fail", 1)]);
    assert.ok(up.pKnown > 0.8, String(up.pKnown));
    assert.ok(down.pKnown < 0.3, String(down.pKnown));
  });
  it("une réussite aidée pèse moins qu'une réussite seule", () => {
    assert.ok(knowledgeOf([ev("success", 1, 0)]).pKnown > knowledgeOf([ev("success", 1, 3)]).pKnown);
  });
  it("une rédaction auto-évaluée et un approfondissement raté ne comptent pas", () => {
    const k = knowledgeOf([ev("success", 1, 0, { selfAssessed: true }), ev("fail", 1, 0, { stage: "extension" })]);
    assert.equal(k.n, 0);
  });
  it("le souvenir s'efface avec le temps, moins vite après des révisions espacées", () => {
    const once = knowledgeOf([ev("success", 30)]);
    const spaced = knowledgeOf([ev("success", 50), ev("success", 40), ev("success", 30)]);
    assert.ok(knowledgeOf([ev("success", 1)]).recall > once.recall);
    assert.ok(spaced.stability > once.stability);
  });
});

describe("Coach : diagnostic des erreurs", () => {
  const part = { answer: { expected: 12 } };
  it("les erreurs classiques déclarées sont rangées par type", () => {
    assert.equal(diagnoseNumeric(part, 15, "numerateur"), "conceptuelle");
    assert.equal(diagnoseNumeric(part, 20, "oubli_b"), "procedurale");
    assert.equal(diagnoseNumeric(part, 18, "deja"), "strategique");
  });
  it("un type précisé dans l'exercice l'emporte sur le classement par défaut", () => {
    assert.equal(diagnoseNumeric({ ...part, errorTypes: { numerateur: "calcul" } }, 15, "numerateur"), "calcul");
  });
  it("signe inversé, virgule décalée ou résultat très proche : erreur de calcul", () => {
    assert.equal(diagnoseNumeric(part, -12), "calcul");
    assert.equal(diagnoseNumeric(part, 1.2), "calcul");
    assert.equal(diagnoseNumeric(part, 12.5), "calcul");
    assert.equal(diagnoseNumeric(part, 40), undefined);
  });
  it("chaque erreur classique des exercices a un type", () => {
    const codes = new Set<string>();
    for (const s of ALL_SESSIONS) for (const a of s.activities) if (a.kind === "problem") for (const p of a.parts) for (const e of p.answer.knownErrors ?? []) codes.add(e.code);
    for (const c of codes) assert.ok(CODE_TYPES[c], `code « ${c} » sans type`);
  });
  it("type par défaut selon le format : rédaction, copie à corriger, rappel", () => {
    assert.equal(defaultErrorType("writing", "transfert"), "redaction");
    assert.equal(defaultErrorType("spot-error", "transfert"), "strategique");
    assert.equal(defaultErrorType("mcq", "rappel"), "conceptuelle");
  });
  it("le profil d'erreurs repère un type dominant", () => {
    const p = errorProfile([ev("fail", 1, 0, { errorType: "calcul" }), ev("fail", 2, 0, { errorType: "calcul" }), ev("partial", 3, 0, { errorType: "strategique" })]);
    assert.equal(p.dominant, "calcul");
    assert.equal(p.total, 3);
  });
});

describe("Coach : relecture d'une rédaction", () => {
  const checks = [
    { criterion: 0, kind: "pattern" as const, pattern: IMPARFAIT, min: 2, label: "Imparfait" },
    { criterion: 1, kind: "pattern" as const, pattern: PASSE_SIMPLE, min: 3, label: "Passé simple", exclude: NOT_PASSE_SIMPLE },
    { criterion: 2, kind: "words" as const, words: TIME_MARKERS, label: "Indicateurs" },
    { criterion: 3, kind: "quote" as const },
  ];
  it("repère imparfait, passé simple et indicateurs de temps, en montrant les mots trouvés", () => {
    const r = reviewWriting("Une cabane se dressait au bord du lac. Les volets étaient fermés. Léo s'approcha, frappa, puis entra. Soudain, un chien aboya.", checks);
    const c = (i: number) => r.criteria.find((x) => x.criterion === i)!;
    assert.equal(c(0).status, "repere");
    assert.ok(c(0).found.includes("étaient"));
    assert.equal(c(1).status, "repere");
    for (const w of ["s'approcha", "frappa", "entra", "aboya"]) assert.ok(c(1).found.includes(w), w);
    assert.ok(!c(1).found.includes("dressait"), "un imparfait n'est pas un passé simple");
    assert.equal(c(2).status, "repere");
    assert.equal(c(3).status, "a-verifier");
  });
  it("une citation entre guillemets est repérée ; la forme est relue", () => {
    const r = reviewWriting("voltaire écrit « boucherie héroïque » pour dénoncer la guerre", [{ criterion: 0, kind: "quote" }]);
    assert.equal(r.criteria[0]?.status, "repere");
    assert.ok(r.form.some((f) => f.includes("majuscule")));
    assert.ok(r.form.some((f) => f.includes("point")));
  });
  it("chaque vérification vise un critère qui existe dans la grille", () => {
    for (const s of ALL_SESSIONS) for (const a of s.activities) if (a.kind === "writing") for (const c of a.checks ?? []) assert.ok(a.rubric[c.criterion], `${a.id} : critère ${c.criterion}`);
  });
});

describe("Coach : automatismes", () => {
  const subjects = studentSubjects("3e", S.profile.track).map((s) => s.subject);
  const ctx = { level: "3e" as const, progress: S.progress, subjects, weakFirst: [], seed: "2026-10-29" };
  it("chaque famille calcule une réponse juste, acceptée par le correcteur", () => {
    for (const f of FAMILIES) {
      const r = rng(f.id);
      for (let i = 0; i < 25; i++) {
        const q = f.make(r);
        assert.ok(Number.isFinite(q.expected), `${f.id} : ${q.prompt}`);
        assert.equal(checkAnswer({ expected: Math.round(q.expected * 1000) / 1000 }, String(Math.round(q.expected * 1000) / 1000).replace(".", ",")).status, "correct", `${f.id} : ${q.prompt}`);
      }
      assert.ok(findUnit(f.unitId), `${f.id} → ${f.unitId}`);
    }
  });
  it("quelques réponses recalculées à la main", () => {
    const calc = (id: string) => FAMILIES.find((f) => f.id === id)!;
    const r = rng("x");
    const t = calc("tables").make(r);
    const [a, b] = t.prompt.split(" × ").map(Number);
    assert.equal(t.expected, a! * b!);
    const eq = calc("equations").make(r);
    const m = /^(\d+)x \+ (\d+) = (\d+)/.exec(eq.prompt)!;
    assert.equal(Number(m[1]) * eq.expected + Number(m[2]), Number(m[3]));
  });
  it("même jour, même tirage ; pas deux fois la même question", () => {
    const a = buildDrill({ ...ctx, interleave: true });
    const b = buildDrill({ ...ctx, interleave: true });
    assert.deepEqual(a.questions.map((q) => q.prompt), b.questions.map((q) => q.prompt));
    assert.equal(new Set(a.questions.map((q) => q.prompt)).size, a.questions.length);
  });
  it("entrelacement : plusieurs chapitres mélangés ; sinon, un seul chapitre", () => {
    assert.ok(buildDrill({ ...ctx, interleave: true }).families.length >= 2);
    assert.equal(buildDrill({ ...ctx, interleave: false }).families.length, 1);
  });
  it("seulement des notions déjà vues : rien de la classe suivante, rien de pas encore commencé", () => {
    const d = buildDrill({ ...ctx, interleave: true, count: 40 });
    for (const q of d.questions) {
      const u = findUnit(q.unitId)!;
      assert.notEqual(u.level, "2nde", q.prompt);
    }
    assert.equal(buildDrill({ ...ctx, level: "6e", progress: {}, subjects: ["maths"], interleave: true }).questions.length, 0);
  });
});

describe("Coach : objectifs du jour", () => {
  for (const minutes of [10, 20, 30, 45, 60]) {
    it(`${minutes} min : le plan tient dans le temps choisi, sans doublon`, () => {
      const p = planDay({ ...base, minutes });
      const total = p.items.reduce((s, i) => s + i.minutes, 0);
      assert.ok(p.items.length >= 1);
      assert.ok(total <= minutes || p.items.length === 1, `${total} > ${minutes}`);
      assert.equal(new Set(p.items.map((i) => i.id)).size, p.items.length);
      for (const i of p.items) assert.ok(i.reason.length > 10 && i.goal.length > 10, i.id);
    });
  }
  it("déterministe : mêmes données, même plan", () => {
    assert.deepEqual(planDay({ ...base, minutes: 30 }), planDay({ ...base, minutes: 30 }));
  });
  it("les rappels du jour passent avant le chapitre en cours", () => {
    const p = planDay({ ...base, minutes: 20 });
    assert.ok(p.items.some((i) => i.kind === "rappel"));
  });
  it("le devoir à rendre est dans le plan dès 30 minutes", () => {
    assert.ok(planDay({ ...base, minutes: 30 }).items.some((i) => i.kind === "devoir"));
  });
  it("méthodes désactivées : ni automatismes, ni oral, ni VO", () => {
    const off = Object.fromEntries(METHODS.map((m) => [m.id, false])) as Record<MethodId, boolean>;
    const p = planDay({ ...base, minutes: 60, methods: off });
    assert.ok(!p.items.some((i) => i.method));
  });
  it("une séance terminée coche les objectifs qui y mènent", () => {
    const p = planDay({ ...base, minutes: 45 });
    const withSession = p.items.find((i) => i.sessionId)!;
    const after = markSessionDone(p, withSession.sessionId!) as DayPlan;
    assert.ok(after.done.includes(withSession.id));
    assert.ok(!(markDone(after, withSession.id, false) as DayPlan).done.includes(withSession.id));
  });
});

describe("Coach : méthodes", () => {
  it("les méthodes ne concernent que leur matière", () => {
    assert.deepEqual(activeMethods("hg", DEFAULT_METHODS), []);
    assert.ok(activeMethods("maths", DEFAULT_METHODS).every((m) => METHODS.find((x) => x.id === m)?.domain === "maths"));
    assert.ok(activeMethods("anglais", DEFAULT_METHODS).every((m) => METHODS.find((x) => x.id === m)?.domain === "langues"));
  });
  it("chaque méthode dit ce qui change et ce qu'on sait de son efficacité", () => {
    for (const m of METHODS) {
      assert.ok(m.effect.length > 20 && m.why.length > 20 && m.evidenceNote.length > 20, m.id);
      assert.ok(["Solide", "Prometteur", "Observé"].includes(m.evidence));
    }
  });
  it("le coach conseille « Penser sa démarche » après des erreurs de lecture de la question en maths", () => {
    const e = [ev("fail", 1, 0, { errorType: "strategique" }), ev("partial", 2, 0, { errorType: "strategique" })];
    const a = analyzeMethods(e, DEFAULT_METHODS, [], TODAY).find((x) => x.id === "sg-demarche")!;
    assert.equal(a.recommended, true);
  });
  it("pas de comparaison avec / sans tant qu'il n'y a pas assez de réponses", () => {
    const a = analyzeMethods(S.evidence, DEFAULT_METHODS, [], TODAY);
    for (const x of a) assert.equal(x.observed, null);
    const many = [...Array.from({ length: MIN_COMPARE }, (_, i) => ev("success", i + 1, 0, { itemId: `w${i}`, methods: ["sg-modeles"] })), ...Array.from({ length: MIN_COMPARE }, (_, i) => ev(i % 2 ? "success" : "fail", i + 1, 0, { itemId: `o${i}` }))];
    const m = analyzeMethods(many, DEFAULT_METHODS, [], TODAY).find((x) => x.id === "sg-modeles")!;
    assert.ok(m.observed);
    assert.equal(m.observed?.withRate, 1);
    assert.equal(m.observed?.withoutRate, 0.5);
  });
  it("défi oral et VO : sujet, débuts de phrases et exemple dans chaque langue", () => {
    for (const lang of ["anglais", "espagnol", "allemand"] as const) {
      for (const p of [PASSIONS[0]!, EVERYDAY]) {
        const c = oralChallenge(lang, p, "Voyages", "2026-10-29");
        assert.ok(c.task && c.model.length > 40 && c.starters.length >= 3 && c.checklist.length === 3);
        assert.ok(voSuggestion(lang, p).idea.length > 20);
      }
    }
  });
});

describe("Coach dans l'appli", () => {
  it("choisir son temps crée les objectifs du jour ; une séance terminée les coche", () => {
    let s = makePlan(S, 45, TODAY);
    assert.equal(s.lastMinutes, 45);
    const item = s.today!.items.find((i) => i.sessionId)!;
    s = applyResult(s, sampleResult(getSession(item.sessionId!), s.profile.levels));
    assert.ok(s.today!.done.includes(item.id));
    s = togglePlanItem(s, item.id);
    assert.ok(!s.today!.done.includes(item.id));
  });
  it("les traces gardent le type d'erreur et les méthodes choisies automatiquement, sans changer le calcul de la maîtrise", () => {
    const session = getSession("fractions-6e");
    const r = sampleResult(session, S.profile.levels);
    r.items = r.items.map((i) => (i.status !== "first" ? { ...i, errorType: "calcul" as const } : i));
    const expected = methodsForSession(session.subject, session.unitId, S.evidence);
    const withM = applyResult(S, r);
    const fresh = withM.evidence.slice(S.evidence.length);
    assert.ok(fresh.some((e) => e.errorType === "calcul"));
    assert.ok(fresh.every((e) => JSON.stringify(e.methods ?? []) === JSON.stringify(expected)));
    assert.ok(fresh.every((e) => e.result !== "success" || !e.errorType), "un type d'erreur seulement sur une réponse non réussie du premier coup");
    const stripped = withM.evidence.filter((e) => e.unitId === session.unitId).map(({ methods: _m, ...e }) => e);
    assert.equal(masteryOf(stripped), withM.lastGain?.stateAfter);
  });
  it("automatismes : une trace par calcul, des points, l'objectif coché", () => {
    let s = makePlan(S, 30, TODAY);
    const d = buildDrill({ level: "3e", progress: s.progress, subjects: studentSubjects("3e", s.profile.track).map((x) => x.subject), weakFirst: [], interleave: true, seed: "t" });
    s = applyDrill(s, d.questions.map((q, i) => ({ question: q, correct: i % 4 !== 0, seconds: 12 })));
    assert.equal(s.evidence.length - S.evidence.length, d.questions.length);
    assert.ok(s.today!.done.includes("automatismes"));
    assert.ok(s.practice.some((p) => p.kind === "automatismes"));
  });
  it("VO et défi oral : minutes notées, objectif coché", () => {
    const s = logPractice(makePlan(S, 60, TODAY), "vo", 10);
    assert.ok(s.today!.done.includes("vo"));
    assert.equal(s.practice.at(-1)?.minutes, 10);
  });
  it("l'état de la v7 passe en v8 : plus de réglage de méthodes, bac de français et Explorer ajoutés", () => {
    const old = { ...S, v: 7, methods: DEFAULT_METHODS } as unknown as Parameters<typeof migrate>[0];
    const m = migrate(old)!;
    assert.equal(m.v, 8);
    assert.ok(!("methods" in m));
    assert.deepEqual(m.explore, {});
    assert.ok(m.bac && Array.isArray(m.bac.textes));
    const { today: _t, lastMinutes: _l, practice: _p, ...v6State } = S;
    const v6 = migrate({ ...v6State, v: 6 } as unknown as Parameters<typeof migrate>[0])!;
    assert.equal(v6.today, null);
    assert.equal(migrate({ v: 3 } as Parameters<typeof migrate>[0]), null);
  });
});
