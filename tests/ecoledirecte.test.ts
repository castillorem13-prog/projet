import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { DEFAULT_TRACK } from "../src/lib/curriculum/levels";
import type { SubjectId } from "../src/lib/curriculum/types";
import { answerQuestion, EdError, login } from "../src/server/ecoledirecte/client";
import { collectHomework, todayInParis } from "../src/server/ecoledirecte/import";
import { matchUnit } from "../src/server/ecoledirecte/match";
import { candidatesFor, guessSubject } from "../src/server/ecoledirecte/subjects";

describe("ÉcoleDirecte : reconnaître les matières", () => {
  const cases: [string, string, SubjectId[]][] = [
    ["MATHEMATIQUES", "Mathématiques", ["maths", "maths-tc"]],
    ["MATHS EXPERTES", "Mathématiques expertes", ["maths-exp"]],
    ["MATHEMATIQUES COMPLEMENTAIRES", "Mathématiques complémentaires", ["maths-comp"]],
    ["ENSEIGN.SCIENTIFIQUE", "Enseignement scientifique", ["ens-sci"]],
    ["ED.PHYS.PR.CULT.SP.", "EPPCS (spécialité)", ["eppcs"]],
    ["ED.PHYSIQUE & SPORT.", "EPS", ["eps"]],
    ["EDUCATION PHYSIQUE ET SPORTIVE", "EPS", ["eps"]],
    ["PHYSIQUE-CHIMIE", "Physique-chimie", ["physique"]],
    ["SCIENCES VIE & TERRE", "SVT", ["svt"]],
    ["SC.VIE & TERRE", "SVT", ["svt"]],
    ["SC. PHYSIQUES", "Physique-chimie", ["physique"]],
    ["SC. NUMERIQ.TECHNOL.", "SNT", ["snt"]],
    ["SCIENCES NUMERIQUES ET TECHNOLOGIE", "SNT", ["snt"]],
    ["NUMERIQUE SC.INFORM.", "NSI", ["nsi"]],
    ["SCIENCES DE L'INGENIEUR", "Sciences de l'ingénieur", ["si"]],
    ["TECHNOLOGIE", "Technologie", ["techno"]],
    ["SCIENCES ET TECHNOLOGIE", "Sciences et technologie", ["sciences", "techno"]],
    ["SC. ECONO.& SOCIALES", "SES", ["ses"]],
    ["HIST.GEO.GEOPOL.S.P.", "HGGSP", ["hggsp"]],
    ["HUMANITES LITTERATURE PHILO", "HLP", ["hlp"]],
    ["DROIT & GRANDS ENJEUX", "DGEMC", ["dgemc"]],
    ["LLCER ANGLAIS", "LLCER anglais", ["llcer"]],
    ["LLCER ESPAGNOL", "LLCER (autre langue)", []],
    ["LCA LATIN", "Latin", ["latin"]],
    ["LCA GREC", "Grec ancien", ["grec"]],
    ["HISTOIRE-GEOGRAPHIE", "Histoire-géographie", ["hg"]],
    ["HISTOIRE DES ARTS", "Histoire des arts", []],
    ["DNL Ita. Hist. Géo", "Histoire-géographie (DNL)", ["hg"]],
    ["ENS. MORAL & CIVIQUE", "EMC", ["emc"]],
    ["PHILOSOPHIE", "Philosophie", ["philo"]],
    ["FRANCAIS", "Français", ["francais"]],
    ["ANGLAIS LV1", "Anglais", ["anglais"]],
    ["ESPAGNOL LV2", "Espagnol", ["espagnol"]],
    ["ALLEMAND LV2", "Allemand", ["allemand"]],
    ["ITALIEN LV2", "Italien", []],
    ["CHINOIS", "Chinois", []],
    ["ARTS PLASTIQUES", "Arts plastiques", ["arts", "arts-spe"]],
    ["EDUCATION MUSICALE", "Éducation musicale", ["musique"]],
    ["THEATRE", "Théâtre", []],
    ["MANAGEMENT", "Management, gestion et droit", []],
    ["VIE DE CLASSE", "Vie de classe", []],
    ["ACCOMPAGNEMT. PERSO.", "Accompagnement", []],
  ];
  for (const [raw, label, candidates] of cases) {
    it(`« ${raw} » → ${label}`, () => assert.deepEqual(guessSubject(raw), { label, candidates }));
  }
  it("une matière inconnue garde son nom, sans matière de l'appli", () => {
    assert.deepEqual(guessSubject("ATELIER ROBOTIQUE"), { label: "ATELIER ROBOTIQUE", candidates: [] });
  });
  it("utilise le code matière quand le nom ne suffit pas", () => {
    assert.deepEqual(guessSubject("MATIERE 12", "MATHS").candidates, ["maths", "maths-tc"]);
  });
});

describe("ÉcoleDirecte : choisir parmi les matières de l'élève", () => {
  const maths = guessSubject("MATHEMATIQUES");
  it("en 1re avec la spé maths, « Mathématiques » est la spécialité", () => {
    assert.deepEqual(candidatesFor(maths, "1re", { ...DEFAULT_TRACK, specialties: ["maths", "physique", "svt"] }), ["maths", "maths-tc"]);
  });
  it("en 1re sans la spé maths, c'est le tronc commun", () => {
    assert.deepEqual(candidatesFor(maths, "1re", { ...DEFAULT_TRACK, specialties: ["ses", "hggsp", "hlp"] }), ["maths-tc", "maths"]);
  });
  it("en 3e, seule la matière « maths » existe", () => {
    assert.deepEqual(candidatesFor(maths, "3e", DEFAULT_TRACK), ["maths"]);
  });
  it("en 6e, « Sciences et technologie » devient les sciences", () => {
    assert.deepEqual(candidatesFor(guessSubject("SCIENCES ET TECHNOLOGIE"), "6e", DEFAULT_TRACK), ["sciences"]);
  });
});

describe("ÉcoleDirecte : reconnaître le chapitre", () => {
  const id = (t: string, l: "1re" | "3e" = "1re", s: SubjectId = "maths") => matchUnit(t, l, s)?.unit.id ?? null;
  it("relie les façons courantes d'écrire un chapitre", () => {
    assert.equal(id("DS sur le Degré 2 : équations, inéquations, paramètre m"), "1re-maths-second-degre");
    assert.equal(id("Contrôle probas : indépendance"), "1re-maths-proba");
    assert.equal(id("Exercices 12 et 15 p. 87 sur les dérivées"), "1re-maths-derivation");
    assert.equal(id("Révisions : la Première Guerre mondiale, guerre totale", "1re", "hg"), "1re-hg-1gm");
  });
  it("ne relie rien quand le devoir est trop vague ou vide", () => {
    assert.equal(id("Revoir vos DS, bonnes vacances !"), null);
    assert.equal(id("Finir les exercices"), null);
    assert.equal(id("Lire Lettres d'une Péruvienne et « Comment peut-on être français ? »", "1re", "francais"), null);
    assert.equal(id(""), null);
  });
});

describe("ÉcoleDirecte : date du jour", () => {
  it("prend la date de Paris, pas celle du serveur (UTC)", () => {
    assert.equal(todayInParis(new Date("2026-11-14T23:30:00Z")), "2026-11-15");
    assert.equal(todayInParis(new Date("2026-07-01T21:59:00Z")), "2026-07-01");
  });
});

// ---------- faux serveur ÉcoleDirecte ----------

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const b64 = (s: string) => Buffer.from(s).toString("base64");
type Seen = { path: string; data: Record<string, unknown>; headers: Record<string, string> };

function fakeEcoleDirecte(handler: (path: string, data: Record<string, unknown>, headers: Record<string, string>) => { body: unknown; headers?: Record<string, string> }) {
  const seen: Seen[] = [];
  globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const data = JSON.parse(new URLSearchParams(String(init?.body ?? "")).get("data") ?? "{}") as Record<string, unknown>;
    const headers = Object.fromEntries(Object.entries((init?.headers ?? {}) as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v]));
    const path = url.pathname + (url.searchParams.get("verbe") ? `?verbe=${url.searchParams.get("verbe")}` : "");
    seen.push({ path, data, headers });
    const r = handler(path, data, headers);
    return new Response(JSON.stringify(r.body), { status: 200, headers: r.headers });
  }) as typeof fetch;
  return seen;
}

const ACCOUNT = { id: 42, typeCompte: "E", profile: { classe: { libelle: "1G3" } }, modules: [{ code: "CAHIER_DE_TEXTES", enable: true }] };

describe("ÉcoleDirecte : connexion", () => {
  it("renvoie la question de sécurité, puis la clé d'appareil", async () => {
    const seen = fakeEcoleDirecte((path) => {
      if (path === "/v3/login.awp") return { body: { code: 250, token: "" }, headers: { "2fa-token": "T2FA" } };
      if (path === "/v3/connexion/doubleauth.awp?verbe=get") return { body: { code: 200, data: { question: b64("Votre année de naissance ?"), propositions: [b64("2009"), b64("2010")] } } };
      return { body: { code: 200, data: { cn: "CN", cv: "CV" } } };
    });
    const r = await login("eleve", "Secret!é&+", "11111111-1111-4111-8111-111111111111");
    assert.equal(r.kind, "question");
    if (r.kind !== "question") return;
    assert.equal(r.question, "Votre année de naissance ?");
    assert.deepEqual(r.choices.map((c) => c.label), ["2009", "2010"]);
    assert.deepEqual(await answerQuestion(r.token2fa, r.choices[0]!.value), { cn: "CN", cv: "CV" });
    assert.equal(seen[0]?.data.motdepasse, "Secret!é&+"); // le mot de passe arrive intact (caractères spéciaux)
    assert.equal(seen[0]?.headers["content-type"], "x-www-form-urlencoded");
    assert.equal(seen[2]?.headers["2fa-token"], "T2FA");
  });
  it("un mauvais mot de passe donne un message clair, sans répéter l'identifiant ni le mot de passe", async () => {
    fakeEcoleDirecte(() => ({ body: { code: 505 } }));
    await assert.rejects(login("jean.dupont", "Secret!é&+", "11111111-1111-4111-8111-111111111111"), (e: unknown) => {
      assert.ok(e instanceof EdError);
      assert.equal(e.kind, "credentials");
      assert.ok(!e.message.includes("jean.dupont") && !e.message.includes("Secret"));
      return true;
    });
  });
  it("refuse un compte parent", async () => {
    fakeEcoleDirecte(() => ({ body: { code: 200, token: "TOK", data: { accounts: [{ id: 7, typeCompte: "1" }] } } }));
    await assert.rejects(login("parent", "x", "11111111-1111-4111-8111-111111111111"), (e: unknown) => e instanceof EdError && e.kind === "not-student");
  });
  it("signale une clé d'appareil expirée", async () => {
    fakeEcoleDirecte(() => ({ body: { code: 520 } }));
    await assert.rejects(login("eleve", "x", "11111111-1111-4111-8111-111111111111", { cn: "old", cv: "old" }), (e: unknown) => e instanceof EdError && e.kind === "device");
  });
  it("ÉcoleDirecte injoignable ou réponse inattendue : erreur compréhensible", async () => {
    globalThis.fetch = (async () => { throw new Error("réseau"); }) as typeof fetch;
    await assert.rejects(login("e", "x", "11111111-1111-4111-8111-111111111111"), (e: unknown) => e instanceof EdError && e.kind === "unavailable");
    globalThis.fetch = (async () => new Response("<html>maintenance</html>")) as typeof fetch;
    await assert.rejects(login("e", "x", "11111111-1111-4111-8111-111111111111"), (e: unknown) => e instanceof EdError && e.kind === "changed");
  });
});

describe("ÉcoleDirecte : import des devoirs", () => {
  it("ne garde que les jours à venir, reconnaît matières, contrôles et chapitres", async () => {
    fakeEcoleDirecte((path) => {
      if (path === "/v3/Eleves/42/cahierdetexte.awp?verbe=get") return { body: { code: 200, data: { "2026-11-10": [], "2026-11-17": [], "2026-11-20": [] } } };
      const day = path.match(/cahierdetexte\/(\d{4}-\d{2}-\d{2})\.awp/)?.[1];
      if (day === "2026-11-17") return { body: { code: 200, data: { matieres: [
        { matiere: "MATHEMATIQUES", codeMatiere: "MATHS", interrogation: true, aFaire: { idDevoir: 901, contenu: b64("<p>DS : <b>probabilités</b>&nbsp;et indépendance</p>"), effectue: false } },
        { matiere: "ITALIEN LV2", codeMatiere: "ITA2", aFaire: { idDevoir: 902, contenu: b64("Imparare il vocabolario") } },
        { matiere: "HISTOIRE-GEOGRAPHIE", contenuDeSeance: { contenu: b64("Séance sur Napoléon") } },
      ] } } };
      if (day === "2026-11-20") return { body: { code: 200, data: { matieres: [{ matiere: "ED.PHYS.PR.CULT.SP.", aFaire: { contenu: "" } }] } } };
      throw new Error(`jour inattendu ${path}`);
    });
    const items = await collectHomework(ACCOUNT, "TOK", "1re", { ...DEFAULT_TRACK, specialties: ["maths", "physique", "eppcs"] }, "2026-11-14");
    assert.deepEqual(items, [
      { sourceId: "901", dueDate: "2026-11-17", subjectLabel: "Mathématiques", subject: "maths", unitId: "1re-maths-proba", isTest: true, text: "DS : probabilités et indépendance", done: false },
      { sourceId: "902", dueDate: "2026-11-17", subjectLabel: "Italien", subject: null, unitId: null, isTest: false, text: "Imparare il vocabolario", done: false },
      { sourceId: "2026-11-20|ED.PHYS.PR.CULT.SP.|0", dueDate: "2026-11-20", subjectLabel: "EPPCS (spécialité)", subject: "eppcs", unitId: null, isTest: false, text: null, done: false },
    ]);
  });
});
