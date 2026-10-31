import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { DISSERTATIONS, EAF, ECRIT_GRID, GRAMMAR_ITEMS, GRAND_ORAL, OBJET_ORDER, OEUVRES, ORAL_GRID, PHILO_GRID, isCardDue, oeuvresOf, reviewCard } from "../src/lib/bac/francais";
import { autoMethods } from "../src/lib/coach/methods";
import { isoDay, planDay } from "../src/lib/coach/planner";
import { TODAY } from "../src/lib/content/calendar";
import { EXAMS, exercisePoints } from "../src/lib/content/exams";
import { en, es } from "../src/lib/content/lexicon";
import { FAMILIES, FAMILY_ORDER, PASSIONS } from "../src/lib/content/passions";
import type { Activity } from "../src/lib/content/types";
import { findUnit } from "../src/lib/curriculum";
import type { Evidence } from "../src/lib/curriculum/types";
import { EPREUVES, epreuvesOf } from "../src/lib/epreuves";
import { gradeExam, type ExamAnswer } from "../src/lib/exam-result";
import { CAPSULES, TRACKS, capsulesOf } from "../src/lib/explore/capsules";
import { checkAnswer } from "../src/lib/pedagogy/answer-checker";
import { balance } from "../src/lib/rewards";
import { CAPSULE_POINTS, INITIAL_STATE, applyResult, changeLevel, completeCapsule, discoveryPassions, logBlanc, makePlan, rateOralText } from "../src/lib/store";
import { ACCENTS, FAMILY_ACCENT, ON_ACCENT, accentFromPassions, contrast } from "../src/lib/theme/accents";

const S = INITIAL_STATE;
const sum = (xs: { points: number }[]) => xs.reduce((s, x) => s + x.points, 0);
const isPermutation = (xs: number[], n: number) => xs.length === n && [...xs].sort((a, b) => a - b).every((v, i) => v === i);

/** Contrôles de forme communs à tous les exercices (capsules d'Explorer). */
function checkActivity(a: Activity) {
  if (a.kind === "mcq") assert.ok(a.correct >= 0 && a.correct < a.options.length, `${a.id} : bonne réponse hors des options`);
  if (a.kind === "worked") assert.ok(a.correct >= 0 && a.correct < a.options.length && a.blank < a.steps.length, `${a.id} : étape ou option hors limites`);
  if (a.kind === "order") assert.ok(isPermutation(a.display, a.steps.length), `${a.id} : l'ordre affiché n'est pas une permutation`);
  if (a.kind === "spot-error") assert.ok(a.wrongLine >= 0 && a.wrongLine < a.lines.length, `${a.id} : ligne fautive hors du code`);
  if (a.kind === "classify") assert.ok(a.items.every((i) => i.category >= 0 && i.category < a.categories.length), `${a.id} : catégorie inconnue`);
}

describe("Explorer : des capsules justes", () => {
  it("six parcours, chacun avec au moins une capsule, identifiants uniques", () => {
    assert.equal(TRACKS.length, 6);
    for (const t of TRACKS) assert.ok(capsulesOf(t.id).length >= 1, t.id);
    assert.equal(new Set(CAPSULES.map((c) => c.id)).size, CAPSULES.length);
    const ids = CAPSULES.flatMap((c) => c.activities.map((a) => a.id));
    assert.equal(new Set(ids).size, ids.length, "un identifiant d'exercice en double");
  });
  it("chaque exercice est bien formé", () => {
    for (const c of CAPSULES) {
      assert.ok(c.activities.length >= 2 && c.minutes >= 3 && c.minutes <= 5, c.id);
      c.activities.forEach(checkActivity);
    }
  });
  it("les réponses chiffrées sont recalculées ici, indépendamment du contenu", () => {
    const computed: Record<string, number> = {
      "cv-2a": 12 * 4 - 5,
      "cb-2a": [1, 2, 3, 4].reduce((a, b) => a + b, 0),
      "ab-2a": 40 - 12 - 15,
      "ab-2b": ((40 - 12 - 15) / 40) * 100,
      "ab-2c": 117 / (40 - 12 - 15),
      "ai-2a": 1000 * 1.02 ** 2,
      "ed-1a": 150_000_000 / 300_000,
      "ed-1b": 384_000 / 300_000,
      "lg-1a": (20_000 / 300_000) * 1000,
      "lg-1b": 300_000_000 * 0.000001,
    };
    const parts = CAPSULES.flatMap((c) => c.activities).flatMap((a) => (a.kind === "problem" ? a.parts : []));
    for (const [id, value] of Object.entries(computed)) {
      const p = parts.find((x) => x.id === id);
      assert.ok(p, `partie ${id} introuvable`);
      const tol = Math.max(p.answer.tolerance?.abs ?? 0, Math.abs(value) * (p.answer.tolerance?.rel ?? 0), 1e-9);
      assert.ok(Math.abs(p.answer.expected - value) <= tol + 0.05, `${id} : attendu ${p.answer.expected}, calculé ${value}`);
      const unit = p.answer.unit ? ` ${p.answer.unit}` : "";
      assert.equal(checkAnswer(p.answer, `${String(p.answer.expected).replace(".", ",")}${unit}`).status, "correct", `${id} : la réponse attendue n'est pas acceptée`);
    }
  });
  it("les programmes Python affichent bien ce que dit la bonne réponse", () => {
    // x = 3 ; x = x + 2 ; print(x * 2)
    let x = 3;
    x = x + 2;
    const cv1 = CAPSULES.flatMap((c) => c.activities).find((a) => a.id === "cv-1");
    assert.ok(cv1 && cv1.kind === "mcq" && cv1.options[cv1.correct]?.text === String(x * 2));
    // for i in range(3): print(i)
    const cb1 = CAPSULES.flatMap((c) => c.activities).find((a) => a.id === "cb-1");
    assert.ok(cb1 && cb1.kind === "mcq" && cb1.options[cb1.correct]?.text === [0, 1, 2].join(", "));
  });
  it("une capsule rapporte des points une seule fois, sans toucher à la maîtrise", () => {
    const c = CAPSULES[0]!;
    const once = completeCapsule(S, c.id, c.title, c.minutes);
    assert.ok(once.wallet.ledger.some((e) => e.label === `Explorer : ${c.title}` && e.points === CAPSULE_POINTS));
    assert.ok(balance(once.wallet) >= balance(S.wallet) + CAPSULE_POINTS, "les défis de régularité peuvent s'ajouter");
    assert.deepEqual(once.evidence, S.evidence);
    const twice = completeCapsule(once, c.id, c.title, c.minutes);
    assert.equal(balance(twice.wallet), balance(once.wallet));
  });
});

describe("Bac de français : programme 2027 et barèmes", () => {
  it("13 œuvres sur 4 objets d'étude, 3 par objet dans chaque voie", () => {
    assert.equal(OEUVRES.length, 13);
    for (const o of OBJET_ORDER) {
      assert.equal(oeuvresOf(o, "generale").length, 3, `générale, ${o}`);
      assert.equal(oeuvresOf(o, "techno").length, 3, `techno, ${o}`);
    }
    assert.deepEqual(OEUVRES.find((o) => o.id === "zola-pot")?.voies, ["generale"]);
    assert.deepEqual(OEUVRES.find((o) => o.id === "zola-therese")?.voies, ["techno"]);
  });
  it("un sujet de dissertation d'entraînement par œuvre", () => {
    for (const o of OEUVRES) assert.ok((DISSERTATIONS[o.id] ?? "").endsWith("?"), o.id);
  });
  it("les barèmes font 20 points", () => {
    assert.equal(sum(ORAL_GRID), 20);
    assert.equal(sum(ORAL_GRID.slice(0, 3)), 12, "première partie de l'oral : 12 points");
    assert.equal(sum(ECRIT_GRID.commentaire), 20);
    assert.equal(sum(ECRIT_GRID.dissertation), 20);
    assert.equal(sum(PHILO_GRID), 20);
    assert.equal(sum(GRAND_ORAL.grid), 20);
    assert.equal(GRAND_ORAL.steps.reduce((s, x) => s + x.minutes, 0), 20);
    assert.deepEqual([EAF.ecrit.minutes, EAF.oral.preparation, EAF.oral.minutes, EAF.textes.generale, EAF.textes.techno], [240, 30, 20, 24, 16]);
  });
  it("questions de grammaire bien formées", () => {
    for (const g of GRAMMAR_ITEMS) assert.ok(g.answer >= 0 && g.answer < g.categories.length, g.id);
  });
  it("révision des textes : l'intervalle s'allonge quand c'est su, revient demain sinon", () => {
    const d = "2026-10-29";
    const c1 = reviewCard({ due: d, interval: 0, reps: 0 }, "bien", d);
    const c2 = reviewCard(c1, "bien", c1.due);
    assert.ok(c2.interval > c1.interval);
    assert.equal(reviewCard(c2, "revoir", d).interval, 1);
    assert.ok(!isCardDue(c1, d) && isCardDue(c1, c1.due));
  });
  it("en première, les textes à revoir entrent dans les objectifs du jour, et se cochent une fois revus", () => {
    let s = changeLevel(S, "1re", { ...S.profile.track, specialties: ["maths", "physique", "ses"], options: [] });
    assert.ok(s.bac.textes.length >= 4, "un descriptif d'exemple est proposé en première");
    s = makePlan(s, 60, TODAY);
    const item = s.today?.items.find((i) => i.kind === "bac");
    assert.ok(item, "objectif « oral de français » attendu");
    const today = isoDay(TODAY);
    // L'horloge de la démo est le 29 octobre : on note chaque texte dû ce jour-là.
    for (const t of s.bac.textes.filter((x) => isCardDue(x.card, today))) s = rateOralText(s, t.id, "bien");
    assert.ok(s.bac.textes.every((t) => !isCardDue(t.card, today)) ? s.today?.done.includes("bac-oral") : true);
  });
  it("hors première, pas d'objectif de bac de français", () => {
    const p = planDay({ now: TODAY, minutes: 60, level: "3e", track: S.profile.track, progress: S.progress, evidence: S.evidence, reviews: S.reviews, homework: [], methods: autoMethods(S.evidence), bacDue: 5 });
    assert.ok(!p.items.some((i) => i.kind === "bac"));
  });
  it("une épreuve blanche rédigée garde sa note indicative", () => {
    const s = logBlanc(S, { kind: "oral", label: "Oral blanc", score: 13.5 }, 50);
    assert.equal(s.bac.blancs?.at(-1)?.score, 13.5);
    assert.equal(s.practice.at(-1)?.minutes, 50);
  });
});

describe("Épreuves blanches : format et correction", () => {
  it("chaque épreuve et chaque contrôle est noté sur 20", () => {
    for (const e of Object.values(EXAMS)) assert.equal(Math.round(e.exercises.reduce((s, x) => s + exercisePoints(x), 0) * 100) / 100, 20, e.id);
  });
  it("brevet de maths : automatismes sur 6 points, sans calculatrice, 20 minutes ; 2 heures en tout", () => {
    const b = EXAMS["brevet-blanc-maths"]!;
    assert.equal(b.minutes, 120);
    const p1 = b.exercises[0]!;
    assert.equal(exercisePoints(p1), 6);
    assert.equal(p1.calculator, false);
    assert.equal(p1.minutes, 20);
    assert.equal(p1.questions.length, 10);
    assert.ok(b.exercises.slice(1).every((x) => x.calculator === true));
    assert.equal(b.exercises.slice(1).reduce((s, x) => s + exercisePoints(x), 0), 14);
  });
  it("maths anticipées : 2 heures sans calculatrice, QCM d'automatismes sur 6 points, exercices sur 14", () => {
    const e = EXAMS["eam-blanc"]!;
    assert.equal(e.minutes, 120);
    assert.ok(e.exercises.every((x) => x.calculator === false));
    const auto = e.exercises[0]!;
    assert.equal(exercisePoints(auto), 6);
    assert.ok(auto.questions.every((q) => q.kind === "mcq"));
    assert.equal(e.exercises.slice(1).reduce((s, x) => s + exercisePoints(x), 0), 14);
  });
  it("chaque question vise un chapitre qui existe, et ses données sont cohérentes", () => {
    for (const e of Object.values(EXAMS)) {
      for (const q of e.exercises.flatMap((x) => x.questions)) {
        if (q.unitId) assert.ok(findUnit(q.unitId), `${e.id} ${q.id} : chapitre ${q.unitId} inconnu`);
        if (q.kind === "mcq" || q.kind === "graph") assert.ok(q.correct >= 0 && q.correct < q.options.length, `${e.id} ${q.id}`);
        if (q.kind === "order") assert.ok(isPermutation(q.display, q.steps.length), `${e.id} ${q.id}`);
        if (q.kind === "spot-error") assert.ok(q.wrongLine < q.lines.length, `${e.id} ${q.id}`);
        if (q.kind === "numeric") assert.equal(checkAnswer(q.answer, String(q.answer.expected).replace(".", ",") + (q.answer.unit ? ` ${q.answer.unit}` : "")).status, "correct", `${e.id} ${q.id}`);
      }
    }
  });
  it("une copie parfaite vaut 20, et chaque chapitre évalué reçoit ses traces et son rappel", () => {
    const exam = EXAMS["brevet-blanc-maths"]!;
    const answers: Record<string, ExamAnswer> = {};
    for (const q of exam.exercises.flatMap((x) => x.questions)) {
      if (q.kind === "mcq" || q.kind === "graph") answers[q.id] = { kind: "choice", index: q.correct };
      else if (q.kind === "numeric") answers[q.id] = { kind: "numeric", value: String(q.answer.expected).replace(".", ","), unit: q.answer.unit ?? null };
      else if (q.kind === "order") answers[q.id] = { kind: "order", order: q.steps.map((_, i) => i) };
      else answers[q.id] = { kind: "spot", line: q.wrongLine };
    }
    const out = gradeExam({ exam, answers, seconds: 3600, overtime: false, levels: S.profile.levels, streak: 3, pointsToday: 0 });
    assert.equal(out.score, 20);
    const s = applyResult(S, out.result, "exam", { label: exam.title, minutes: exam.minutes });
    const units = new Set(exam.exercises.flatMap((x) => x.questions.map((q) => q.unitId)));
    for (const u of units) {
      assert.ok(s.evidence.some((e) => e.unitId === u && !S.evidence.includes(e)), `pas de trace pour ${u}`);
      assert.ok(s.reviews.some((r) => r.unitId === u), `pas de rappel pour ${u}`);
    }
    assert.equal(new Set(s.reviews.map((r) => r.unitId)).size, s.reviews.length, "un seul rappel par chapitre");
  });
  it("les épreuves proposées suivent la classe, et chaque lien mène quelque part", () => {
    assert.deepEqual(epreuvesOf("3e").map((e) => e.id), ["brevet-maths"]);
    assert.deepEqual(epreuvesOf("1re").map((e) => e.id).sort(), ["eaf-ecrit", "eaf-oral", "eam"]);
    assert.deepEqual(epreuvesOf("Tle").map((e) => e.id).sort(), ["grand-oral", "philo"]);
    assert.equal(epreuvesOf("5e").length, 0);
    for (const e of EPREUVES) {
      if (e.href.startsWith("/controle/")) assert.ok(EXAMS[e.href.split("/")[2] ?? ""], e.href);
      assert.ok(e.format.length >= 2 && e.source.length > 10, e.id);
    }
  });
});

describe("Couleurs et univers", () => {
  it("chaque accent porte le texte sombre avec un contraste AA (4,5:1)", () => {
    for (const a of ACCENTS) assert.ok(contrast(ON_ACCENT, a.base) >= 4.5, `${a.id} : ${contrast(ON_ACCENT, a.base).toFixed(2)}`);
  });
  it("la feuille de jetons définit chaque accent avec les mêmes valeurs", () => {
    const css = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
    for (const a of ACCENTS.filter((x) => x.id !== "jaune")) {
      assert.ok(css.includes(`:root[data-accent="${a.id}"] { --yellow: ${a.base}; --yellow-deep: ${a.deep}; }`), a.id);
    }
    assert.ok(css.includes(`--yellow: ${ACCENTS[0]!.base};`));
  });
  it("chaque famille d'univers a sa couleur, l'univers dominant décide", () => {
    for (const f of FAMILY_ORDER) assert.ok(FAMILY_ACCENT[f]);
    const pick = (ids: string[]) => ids.map((id) => PASSIONS.find((p) => p.id === id)!);
    assert.equal(accentFromPassions(pick(["football", "basket", "rap"]), "jaune"), FAMILY_ACCENT.sport);
    assert.equal(accentFromPassions([], "rose"), "rose");
  });
  it("un catalogue large : plus de 60 univers, au moins 5 par famille, traduits pour l'anglais et l'espagnol", () => {
    assert.ok(PASSIONS.length >= 60, `${PASSIONS.length} univers`);
    assert.equal(new Set(PASSIONS.map((p) => p.id)).size, PASSIONS.length);
    for (const f of FAMILY_ORDER) assert.ok(PASSIONS.filter((p) => p.family === f).length >= 5, FAMILIES[f].label);
    for (const p of PASSIONS) {
      assert.ok(p.lex.motion.includes("{d}") && p.lex.motion.includes("{t}"), `${p.id} : phrase de mouvement`);
      assert.ok(en(p).length > 1 && !en(p).startsWith("the "), `${p.id} : anglais`);
      assert.ok(/^(el|la|los|las) /.test(es(p)), `${p.id} : espagnol avec article`);
    }
  });
  it("univers de découverte : jamais un univers écarté ni déjà aimé, stables pour la journée", () => {
    const liked = ["football", "rap"];
    const muted = ["echecs", "piano"];
    const a = discoveryPassions(liked, muted, "2026-10-29", 3);
    assert.equal(a.length, 3);
    assert.ok(a.every((p) => !liked.includes(p.id) && !muted.includes(p.id)));
    assert.deepEqual(a, discoveryPassions(liked, muted, "2026-10-29", 3));
    assert.notDeepEqual(a.map((p) => p.id), discoveryPassions(liked, muted, "2026-10-30", 3).map((p) => p.id));
  });
});

describe("Méthodes choisies automatiquement", () => {
  const ev = (unitId: string, n: number, result: Evidence["result"], extra: Partial<Evidence> = {}): Evidence[] =>
    Array.from({ length: n }, (_, i) => ({ unitId, itemId: `x-${unitId}-${i}-${result}`, at: new Date(2026, 9, 20 + (i % 8), 18).toISOString(), stage: "application", result, assistance: 0, ...extra }));
  it("chapitre de maths nouveau : modèles en barres ; chapitre bien su : non", () => {
    assert.equal(autoMethods([], "6e-maths-fractions")["sg-modeles"], true);
    assert.equal(autoMethods(ev("6e-maths-fractions", 8, "success"), "6e-maths-fractions")["sg-modeles"], false);
  });
  it("erreurs de démarche répétées : les trois questions avant de calculer", () => {
    const errors = ev("3e-maths-affines", 3, "fail", { errorType: "strategique" });
    assert.equal(autoMethods(errors)["sg-demarche"], true);
    assert.equal(autoMethods([])["sg-demarche"], false);
  });
  it("entrelacement dès qu'il y a assez de maths à mélanger", () => {
    assert.equal(autoMethods(ev("3e-maths-affines", 6, "success")).entrelacement, true);
    assert.equal(autoMethods(ev("3e-maths-affines", 2, "success")).entrelacement, false);
  });
});
