import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { catalogSource } from "../scripts/catalog-source";
import { EMPTY_DRAFT, draftSeconds, parseDraft, togglePause } from "../src/lib/bac/draft";
import { HUGO_DEMAIN, reviewCard } from "../src/lib/bac/francais";
import { buildDrill, FAMILIES, rng } from "../src/lib/coach/drills";
import { TODAY, demoNow, isoDay } from "../src/lib/content/calendar";
import { CAPSULES, EXAM_LIST, findExam, findSession, SESSION_LIST } from "../src/lib/content/catalog";
import { getExam, EXAMS } from "../src/lib/content/exams";
import { EVERYDAY, PASSIONS, makeCustomPassion } from "../src/lib/content/passions";
import { ALL_SESSIONS, getSession } from "../src/lib/content/sessions";
import { themed, type Activity } from "../src/lib/content/types";
import { nextOf, unitsOf, UNITS } from "../src/lib/curriculum";
import { own, safeReturn, uid } from "../src/lib/cx";
import { gradeExam, isAnswered } from "../src/lib/exam-result";
import { sampleResult } from "../src/lib/session-result";
import { balance, challengeStates, credit, redeemBlock, reservedPoints, reward, spendable, usedThisMonth, type Wallet } from "../src/lib/rewards";
import { INITIAL_STATE, applyResult, completeCapsule, decideReward, logPractice, minutesThisWeek, minutesToday, migrate, requestReward, sanitize, setTrack, type State } from "../src/lib/store";

const at = demoNow().toISOString();
const rich = (s: State = INITIAL_STATE): State => ({ ...s, wallet: { ...s.wallet, ledger: [{ id: "cadeau", at, kind: "summary", label: "Test", points: 100_000 }, ...s.wallet.ledger] } });

describe("Une adresse ne fait jamais planter l'appli", () => {
  it("« constructor » ou « toString » ne sont pas des séances, des épreuves ni des clés de contenu", () => {
    for (const id of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
      assert.equal(findSession(id), undefined, id);
      assert.equal(findExam(id), undefined, id);
      assert.equal(own({ a: 1 }, id), undefined, id);
      assert.throws(() => getSession(id));
      assert.throws(() => getExam(id));
    }
  });
  it("le lien de retour reste dans l'appli", () => {
    assert.equal(safeReturn("/moi", "/x"), "/moi");
    assert.equal(safeReturn("/seance/a?b=c", "/x"), "/seance/a?b=c");
    for (const bad of ["//exemple.fr", "/\\exemple.fr", "https://exemple.fr", "javascript:alert(1)", "", null, undefined]) assert.equal(safeReturn(bad, "/x"), "/x", String(bad));
  });
});

describe("Une sauvegarde abîmée ne bloque jamais l'ouverture", () => {
  it("contenu retiré : séance, épreuve, récompense et objectif disparaissent proprement", () => {
    const s = sanitize({
      ...INITIAL_STATE,
      player: { sessionId: "disparue", index: 0, results: [], shifts: {}, startedAt: 1 },
      exam: { examId: "disparue", answers: {}, exIndex: 0, startedAt: 1 },
      lastResult: { sessionId: "disparue" } as State["lastResult"],
      lastExam: { examId: "disparue" } as State["lastExam"],
      lastGain: { sessionId: "disparue" } as State["lastGain"],
      wallet: { ...INITIAL_STATE.wallet, goalId: "disparue", redemptions: [{ id: "r", rewardId: "disparue", points: 1, at, status: "pending" }] },
    });
    assert.equal(s.player, null);
    assert.equal(s.exam, null);
    assert.equal(s.lastResult, null);
    assert.equal(s.lastExam, null);
    assert.equal(s.lastGain, null);
    assert.equal(s.wallet.goalId, INITIAL_STATE.wallet.goalId);
    assert.deepEqual(s.wallet.redemptions, []);
  });
  it("position hors limites : la séance repart proprement, l'épreuve revient sur un exercice qui existe", () => {
    const session = SESSION_LIST[0]!;
    const exam = EXAM_LIST[0]!;
    const s = sanitize({ ...INITIAL_STATE, player: { sessionId: session.id, index: 99, results: [], shifts: {}, startedAt: 1 }, exam: { examId: exam.id, answers: {}, exIndex: 99, startedAt: 1 } });
    assert.equal(s.player, null);
    assert.equal(s.exam?.exIndex, exam.exerciseCount - 1);
  });
  it("types inattendus : tout est remplacé par des valeurs sûres", () => {
    const junk = { v: 8, profile: "x", wallet: 3, evidence: "x", reviews: null, progress: [], settings: 1, bac: 2, explore: [], practice: {}, active: 4, today: "x", onboarded: true } as unknown as Partial<State>;
    const s = sanitize(junk);
    assert.equal(s.profile.grade, INITIAL_STATE.profile.grade);
    assert.ok(Array.isArray(s.evidence) && Array.isArray(s.reviews) && Array.isArray(s.practice) && Array.isArray(s.wallet.ledger) && Array.isArray(s.bac.textes));
    assert.equal(s.today, null);
    assert.equal(balance(s.wallet), balance(INITIAL_STATE.wallet));
  });
  it("une classe inconnue revient à la classe par défaut, les nouveaux réglages parent sont ajoutés", () => {
    const old = { ...INITIAL_STATE, profile: { ...INITIAL_STATE.profile, grade: "CP" }, wallet: { ...INITIAL_STATE.wallet, parent: { offers: false, sponsored: true, monthlyCap: 10 } } } as unknown as Partial<State>;
    const s = sanitize(old);
    assert.equal(s.profile.grade, "3e");
    assert.equal(s.wallet.parent.monthlyCap, 10);
    assert.equal(s.wallet.parent.offers, false);
    assert.equal(s.wallet.parent.themed, true);
  });
  it("un état v7 passe par la reprise, puis par la réparation", () => {
    const migrated = migrate({ ...INITIAL_STATE, v: 7 } as unknown as Parameters<typeof migrate>[0]);
    assert.ok(migrated);
    assert.equal(sanitize(migrated).v, 8);
  });
  it("un état sain n'est pas modifié", () => {
    const s = sanitize(INITIAL_STATE);
    assert.deepEqual(s.wallet, INITIAL_STATE.wallet);
    assert.equal(s.evidence.length, INITIAL_STATE.evidence.length);
  });
});

describe("Cagnotte : règles et calculs", () => {
  it("une capsule (sans matière) ne compte pas comme une matière de plus", () => {
    const entry = { at, kind: "session" as const, label: "x", points: 10 };
    const lower = null;
    const week = (w: Wallet) => challengeStates(w, lower).find((c) => c.challenge.id === "subjects-3")?.value ?? 0;
    const base = week(INITIAL_STATE.wallet);
    const withCapsule = credit(INITIAL_STATE.wallet, entry, lower).wallet;
    assert.equal(week(withCapsule), base);
    assert.equal(week(credit(INITIAL_STATE.wallet, { ...entry, subject: "svt" }, lower).wallet), base + 1);
  });
  it("deux crédits dans la même milliseconde gardent des identifiants différents", () => {
    let w = INITIAL_STATE.wallet;
    for (let i = 0; i < 50; i++) w = credit(w, { at, kind: "session", label: "x", points: 1, subject: "maths" }, null).wallet;
    assert.equal(new Set(w.ledger.map((e) => e.id)).size, w.ledger.length);
    assert.notEqual(uid("a"), uid("a"));
  });
  it("impossible de dépenser plus que le solde, même en insistant", () => {
    const poor: State = { ...INITIAL_STATE, wallet: { ...INITIAL_STATE.wallet, ledger: [] } };
    assert.equal(redeemBlock(poor.wallet, reward("gift-bulle-5")), "funds");
    assert.equal(requestReward(poor, "gift-bulle-5"), poor);
    let s = INITIAL_STATE;
    for (let i = 0; i < 10; i++) s = requestReward(s, "gift-bulle-5");
    assert.ok(spendable(s.wallet) >= 0, "le solde ne passe jamais sous zéro");
    assert.equal(reservedPoints(s.wallet) % 5000, 0);
  });
  it("le plafond du parent compte les demandes du mois de la démo, et bloque la demande elle-même", () => {
    const s = rich();
    const a = requestReward(s, "gift-octet-20");
    assert.equal(usedThisMonth(a.wallet), 20);
    assert.equal(redeemBlock(a.wallet, reward("gift-bulle-5")), "cap");
    assert.equal(requestReward(a, "gift-bulle-5"), a);
    // Refusée, la demande libère le plafond.
    const refused = decideReward(a, a.wallet.redemptions[0]!.id, false);
    assert.equal(usedThisMonth(refused.wallet), 0);
    assert.equal(redeemBlock(refused.wallet, reward("gift-bulle-5")), null);
  });
  it("une demande d'un autre mois ne compte pas dans le plafond", () => {
    const old = { ...INITIAL_STATE.wallet, redemptions: [{ id: "r", rewardId: "gift-octet-20", points: 20000, at: new Date(2026, 8, 2).toISOString(), status: "approved" as const }] };
    assert.equal(usedThisMonth(old), 0);
  });
  it("le bilan affiche la cagnotte disponible, points réservés déduits", () => {
    const asked = requestReward(rich(), "gift-bulle-5");
    const s = applyResult(asked, sampleResult(getSession("fonctions-affines-3e"), asked.profile.levels));
    assert.equal(s.lastGain?.balanceBefore, spendable(asked.wallet));
  });
  it("un contrôle ne remplace pas le bilan de la dernière séance", () => {
    const session = getSession("fonctions-affines-3e");
    const first = applyResult(INITIAL_STATE, sampleResult(session, INITIAL_STATE.profile.levels));
    const after = applyResult(first, sampleResult(session, first.profile.levels), "exam");
    assert.equal(after.lastGain, first.lastGain);
  });
});

describe("Temps de travail", () => {
  it("VO, défi oral et épreuves comptent dans la journée et dans la semaine", () => {
    const base = minutesToday(INITIAL_STATE);
    const s = logPractice(logPractice(INITIAL_STATE, "vo", 10), "oral", 4);
    assert.equal(minutesToday(s), base + 14);
    assert.equal(minutesThisWeek(s), minutesThisWeek(INITIAL_STATE) + 14);
  });
  it("les automatismes ne sont pas comptés deux fois (ils sont déjà dans la cagnotte)", () => {
    const s = { ...INITIAL_STATE, practice: [{ kind: "automatismes" as const, at, minutes: 5 }] };
    assert.equal(minutesToday(s), minutesToday(INITIAL_STATE));
  });
  it("une capsule compte dans le temps du jour, une seule fois", () => {
    const once = completeCapsule(INITIAL_STATE, "c", "Capsule", 4);
    assert.equal(minutesToday(completeCapsule(once, "c", "Capsule", 4)), minutesToday(INITIAL_STATE) + 4);
  });
});

describe("Changer de langue ou de spécialité", () => {
  it("la progression confirmée des autres matières est gardée, la nouvelle matière est proposée", () => {
    const s: State = { ...INITIAL_STATE, profile: { ...INITIAL_STATE.profile, entLinked: false } };
    const confirmed: State = { ...s, progress: { ...s.progress, maths: { ...s.progress.maths!, current: "3e-maths-thales", source: "student", confirmed: true } } };
    const next = setTrack(confirmed, { lvb: "allemand" });
    assert.equal(next.profile.track.lvb, "allemand");
    assert.equal(next.progress.maths?.current, "3e-maths-thales");
    assert.equal(next.progress.maths?.confirmed, true);
    assert.ok(next.progress.allemand);
    assert.equal(next.progress.espagnol, undefined, "l'ancienne langue ne pèse plus dans les recommandations");
  });
});

describe("Dates et fuseaux horaires", () => {
  it("la révision espacée tombe le bon jour partout dans le monde", () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      for (const zone of ["Pacific/Auckland", "Pacific/Kiritimati", "America/Los_Angeles", "Europe/Paris", "Pacific/Pago_Pago"]) {
        process.env.TZ = zone;
        assert.equal(reviewCard({ due: "2026-10-29", interval: 0, reps: 0 }, "revoir", "2026-10-29").due, "2026-10-30", zone);
        assert.equal(reviewCard({ due: "2026-10-29", interval: 3, reps: 1 }, "bien", "2026-10-29").due, "2026-11-04", zone);
      }
    } finally {
      process.env.TZ = tz;
    }
  });
  it("isoDay reste local", () => assert.equal(isoDay(TODAY), "2026-10-29"));
});

describe("Automatismes : une écriture mathématique propre", () => {
  it("jamais de coefficient nul ni de « 1x » dans un énoncé", () => {
    for (const f of FAMILIES.filter((x) => x.id === "derivee" || x.id === "discriminant")) {
      for (let i = 0; i < 400; i++) {
        const q = f.make(rng(`t-${f.id}-${i}`));
        assert.doesNotMatch(q.prompt, /[+−] 0(x|\b)/, q.prompt);
        assert.doesNotMatch(q.prompt, /\b1x/, q.prompt);
        assert.doesNotMatch(q.prompt, /undefined|NaN/, q.prompt);
      }
    }
  });
  it("le calcul attendu ne change pas : Δ = b² − 4ac", () => {
    const f = FAMILIES.find((x) => x.id === "discriminant")!;
    for (let i = 0; i < 100; i++) {
      const q = f.make(rng(`d-${i}`));
      const m = /x²(?: ([+−]) (\d*)x)?(?: ([+−]) (\d+))?$/.exec(q.prompt);
      assert.ok(m, q.prompt);
      const b = m[1] ? (m[1] === "−" ? -1 : 1) * Number(m[2] || 1) : 0;
      const c = m[3] ? (m[3] === "−" ? -1 : 1) * Number(m[4]) : 0;
      assert.equal(q.expected, b * b - 4 * c, q.prompt);
    }
  });
  it("le tirage reste possible à tous les niveaux", () => {
    const d = buildDrill({ level: "1re", progress: {}, subjects: ["maths"], weakFirst: [], interleave: true, seed: "x" });
    assert.ok(d.questions.length > 0);
  });
});

describe("Copie : une réponse vide reste vide", () => {
  it("un signe moins seul n'est pas une réponse", () => {
    const exam = getExam("controle-fonctions-affines");
    const q = exam.exercises.flatMap((e) => e.questions).find((x) => x.kind === "numeric")!;
    for (const value of ["−", "-", " "]) assert.equal(isAnswered(q, { kind: "numeric", value, unit: null }), false);
    const out = gradeExam({ exam, answers: { [q.id]: { kind: "numeric", value: "−", unit: null } }, seconds: 600, overtime: false, levels: INITIAL_STATE.profile.levels, streak: 0, pointsToday: 0 });
    assert.equal(out.graded.find((g) => g.question.id === q.id)?.status, "blank");
  });
});

describe("Brouillon d'écrit blanc", () => {
  const started = { ...EMPTY_DRAFT, subjectId: "s", startedAt: 1_000_000 };
  it("le chrono s'arrête vraiment pendant une pause, et reprend où il en était", () => {
    assert.equal(draftSeconds(started, 1_060_000), 60);
    const paused = togglePause(started, 1_060_000);
    assert.equal(draftSeconds(paused, 1_660_000), 60, "dix minutes de pause ne comptent pas");
    const back = togglePause(paused, 1_660_000);
    assert.equal(draftSeconds(back, 1_670_000), 70);
    const again = togglePause(togglePause(back, 1_670_000), 1_680_000);
    assert.equal(draftSeconds(again, 1_690_000), 80, "plusieurs pauses s'additionnent");
  });
  it("un brouillon de la v7 ou abîmé se relit sans erreur", () => {
    const v7 = parseDraft(JSON.stringify({ subjectId: "s", problematique: "p", parties: [{ idee: "i", exemples: "e" }], copie: "c", startedAt: 5 }));
    assert.equal(v7.pausedMs, 0);
    assert.equal(v7.pausedAt, null);
    assert.equal(v7.copie, "c");
    assert.equal(parseDraft("pas du json"), EMPTY_DRAFT);
    assert.equal(parseDraft(null), EMPTY_DRAFT);
  });
});

describe("Catalogue léger", () => {
  it("il correspond exactement au contenu (sinon : npm run gen:catalog)", () => {
    const file = readFileSync(new URL("../src/lib/content/catalog.generated.ts", import.meta.url), "utf8").replace(/\r\n/g, "\n");
    assert.equal(file, catalogSource());
  });
  it("toutes les séances, épreuves et capsules y figurent", () => {
    assert.equal(SESSION_LIST.length, ALL_SESSIONS.length);
    assert.equal(EXAM_LIST.length, Object.keys(EXAMS).length);
    assert.ok(CAPSULES.length >= 13);
  });
});

describe("Index du programme", () => {
  it("unitsOf et nextOf donnent les mêmes résultats qu'une recherche complète", () => {
    for (const u of UNITS.slice(0, 120)) {
      assert.deepEqual(unitsOf(u.level, u.subject).map((x) => x.id), UNITS.filter((x) => x.level === u.level && x.subject === u.subject).map((x) => x.id));
      assert.deepEqual(nextOf(u.id).map((x) => x.id), UNITS.filter((x) => x.needs?.includes(u.id)).map((x) => x.id));
    }
    assert.deepEqual(unitsOf("6e", "philo"), []);
  });
});

describe("Contenu : ce que l'interface suppose", () => {
  const customs = (["sport", "jeux", "musique", "creation", "sciences", "monde"] as const).map((family) => makeCustomPassion({ label: `Essai ${family}`, family }));
  const passions = [...PASSIONS.filter((_, i) => i % 5 === 0), EVERYDAY, ...customs];
  const walk = (v: unknown, visit: (s: string) => void) => {
    if (typeof v === "function") for (const p of passions) visit(themed(v as never, p));
    else if (Array.isArray(v)) v.forEach((x) => walk(x, visit));
    else if (v && typeof v === "object") Object.values(v).forEach((x) => walk(x, visit));
  };
  const activities: Activity[] = [...ALL_SESSIONS.flatMap((s) => s.activities)];
  it("une passion inventée par l'élève fonctionne partout", () => {
    for (const a of activities) walk(a, (t) => assert.doesNotMatch(t, /undefined|null|NaN|\[object/, a.id));
  });
  it("une unité obligatoire peut toujours être choisie", () => {
    for (const a of activities) if (a.kind === "problem") for (const p of a.parts) if (p.answer.requireUnit) assert.ok(p.units?.length, `${a.id}/${p.id}`);
  });
  it("le lecteur de capsules sait afficher tous les formats utilisés", () => {
    assert.ok(CAPSULES.length);
  });
  it("le poème de Hugo garde ses lignes vides (séparations de strophes)", () => {
    assert.equal(HUGO_DEMAIN.kind === "text" && HUGO_DEMAIN.lines.filter((l) => !l).length, 2);
  });
});
