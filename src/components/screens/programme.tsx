"use client";

import { BookOpen, CalendarClock, ChevronRight, Link2, MapPin, RotateCcw, Rocket } from "lucide-react";
import Link from "next/link";
import { SectionTabs } from "@/components/shell/section-tabs";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LockIcon, MasteryMeter, ModeChip, UnitSegments } from "@/components/programme/parts";
import { ExamCard, ReviewList } from "@/components/programme/side";
import { UnitSheet } from "@/components/programme/unit-sheet";
import { YearTrack } from "@/components/programme/parts";
import { SubjectTile, subStyle } from "@/components/ui/subject-icon";
import { SCHOOL_WEEKS, classWeek, currentHoliday, parseDay, shortDay } from "@/lib/content/calendar";
import { findSession } from "@/lib/content/catalog";
import { SUBJECTS, inSentence } from "@/lib/content/meta";
import { findUnit, nextLevel, prevLevel, statusIn, type Level, type SubjectId, type Unit } from "@/lib/curriculum";
import { getLevel, studentSubjects, type LevelSubject } from "@/lib/curriculum/levels";
import { advanceRows, recommendedBases, revisionRows, type AdvanceRow } from "@/lib/curriculum/modes";
import { MASTERY, UNLOCK_STATE } from "@/lib/learning/mastery";
import { cx } from "@/lib/cx";
import { homeworkOf, useMastery, useStore } from "@/lib/store";

export type ProgrammeMode = "annee" | "revision" | "avance";

const ROLE: Record<LevelSubject["role"], string | null> = { commun: null, specialite: "Spécialité", option: "Option" };

/**
 * Le programme de l'élève, en trois modes bien séparés :
 * son année (au centre, dans l'ordre de sa classe), la révision de l'année d'avant, l'avance sur l'année d'après.
 */
export function ProgrammeScreen() {
  const { state } = useStore();
  const level = state.profile.grade;
  const before = prevLevel(level);
  const after = nextLevel(level);
  // Le mode vit dans l'adresse : un lien, le bouton retour et le partage donnent le même écran.
  const wanted = useSearchParams().get("mode");
  const mode: ProgrammeMode = wanted === "revision" && before ? "revision" : wanted === "avance" && after ? "avance" : "annee";
  const [open, setOpen] = useState<Unit | null>(null);
  const holiday = currentHoliday();
  const week = classWeek();
  const lvl = getLevel(level).label;

  // Changer d'onglet ne demande rien au serveur : l'adresse suit, sans recharger la page.
  const setMode = (m: ProgrammeMode) => window.history.replaceState(null, "", m === "annee" ? "/reviser" : `/reviser?mode=${m}`);

  const tabs: { id: ProgrammeMode; title: string; sub: string; icon: React.ReactNode }[] = [
    { id: "annee", title: `Ma ${lvl}`, sub: "Dans l'ordre de ta classe", icon: <BookOpen size={20} strokeWidth={2.4} /> },
    ...(before ? [{ id: "revision" as const, title: `Révision ${getLevel(before).label}`, sub: "Les bases de l'an dernier", icon: <RotateCcw size={20} strokeWidth={2.4} /> }] : []),
    ...(after ? [{ id: "avance" as const, title: `Avance ${getLevel(after).label}`, sub: "Quand tu es prêt", icon: <Rocket size={20} strokeWidth={2.4} /> }] : []),
  ];

  return (
    <div className="programme">
      <SectionTabs />
      <header className="page-top">
        <p className="kicker">
          Année 2026-2027 · {holiday ? `Vacances de la ${holiday.label}` : `Semaine ${Math.floor(week)} sur ${SCHOOL_WEEKS}`}
        </p>
        <h1 className="h1">Ton programme de {lvl}</h1>
      </header>

      <div className="mode-tabs" role="tablist" aria-label="Mode de travail">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={mode === t.id} aria-controls={`panel-${t.id}`} className={cx("mode-tab", `is-${t.id}`, mode === t.id && "is-on")} onClick={() => setMode(t.id)}>
            <span className="mode-tab-icon">{t.icon}</span>
            <span className="mode-tab-main">
              <strong>{t.title}</strong>
              <span>{t.sub}</span>
            </span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${mode}`} aria-labelledby={`tab-${mode}`}>
        {mode === "annee" ? <YearView onOpen={setOpen} onMode={setMode} /> : mode === "revision" && before ? <RevisionView level={level} before={before} onOpen={setOpen} /> : after ? <AdvanceView level={level} after={after} onOpen={setOpen} /> : null}
      </div>

      <UnitSheet unit={open} onClose={() => setOpen(null)} onOpen={setOpen} />
    </div>
  );
}

/* ——— Mon année ——— */

function YearView({ onOpen, onMode }: { onOpen: (u: Unit) => void; onMode: (m: ProgrammeMode) => void }) {
  const { state } = useStore();
  const mastery = useMastery();
  const level = state.profile.grade;
  const subjects = studentSubjects(level, state.profile.track);
  const before = prevLevel(level);
  const holiday = currentHoliday();
  const bases = recommendedBases(level, state.progress, mastery);
  const progress = subjects.map((s) => state.progress[s.subject]).filter(Boolean);
  const unconfirmed = progress.filter((p) => p && !p.confirmed).length;
  const fromEnt = progress.some((p) => p?.source === "ent_demo");
  const counts = { vu: 0, "en-cours": 0, "a-venir": 0 };
  for (const p of progress) for (const id of p?.order ?? []) {
    const st = statusIn(p, id);
    if (st) counts[st]++;
  }
  const homework = homeworkOf(state);

  return (
    <>
      {unconfirmed ? (
        <div className="progress-banner">
          <MapPin size={20} strokeWidth={2.4} />
          <p>
            <strong>Où en est ta classe ?</strong> Pour {unconfirmed} matière{unconfirmed > 1 ? "s" : ""}, le chapitre en cours est une <strong>proposition</strong> de LearnWard, d'après l'ordre du programme et la période de l'année. Touche une matière pour le confirmer ou le corriger : tes séances suivront ta classe.
          </p>
        </div>
      ) : fromEnt ? (
        <p className="progress-source">
          <Link2 size={15} strokeWidth={2.6} /> Ordre et chapitres en cours récupérés depuis l'ENT de ta classe (ENT simulé pour la démo).
        </p>
      ) : null}

      <YearTrack level={level} />
      <p className="year-stats">
        <span><strong>{counts.vu}</strong> chapitres vus</span>
        <span><strong>{counts["en-cours"]}</strong> en cours</span>
        <span><strong>{counts["a-venir"]}</strong> à venir</span>
      </p>

      <div className="prog-grid">
        <div className="prog-main">
          <section className="block" aria-labelledby="now-title">
            <div className="block-head">
              <h2 id="now-title" className="h2">En ce moment en classe</h2>
              <span className="muted small">{holiday ? "À la rentrée" : "Cette semaine"}</span>
            </div>
            <ul className="now-list">
              {subjects.map(({ subject, role }) => {
                const p = state.progress[subject];
                const c = findUnit(p?.current);
                if (!p || !c) return null;
                const hw = homework.find((h) => h.subject === subject);
                const due = hw ? shortDay(parseDay(hw.due)) : null;
                const base = bases.find((b) => b.target.id === c.id);
                const done = p.order.filter((id) => statusIn(p, id) === "vu").length;
                return (
                  <li key={subject}>
                    <Link href={`/reviser/${subject}`} className={cx("now-row", !p.confirmed && "is-proposal")} style={subStyle(subject)}>
                      <SubjectTile subject={subject} />
                      <span className="now-row-main">
                        <span className="now-row-top">
                          <span className="now-row-subject">{SUBJECTS[subject].label}</span>
                          {ROLE[role] ? <span className="role-tag">{ROLE[role]}</span> : null}
                          {hw && due ? (
                            <span className="now-due">
                              <CalendarClock size={13} strokeWidth={2.6} /> {hw.kind} {due.day} {due.num}
                            </span>
                          ) : !p.confirmed ? (
                            <span className="now-due is-proposal">À confirmer</span>
                          ) : null}
                        </span>
                        <strong className="now-row-title">{c.title}</strong>
                        <span className="now-row-meta">
                          <MasteryMeter state={mastery(c.id)} subject={subject} />
                          <span className="now-row-count">{done} vu{done > 1 ? "s" : ""} sur {p.order.length}</span>
                        </span>
                        <UnitSegments progress={p} subject={subject} mastery={mastery} />
                        {base ? (
                          <span className="now-row-base">
                            <RotateCcw size={13} strokeWidth={2.8} /> Base de {getLevel(base.base.level).label} à revoir : {base.base.title}
                          </span>
                        ) : null}
                      </span>
                      <ChevronRight size={22} className="subject-row-go" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            {getLevel(level).notCovered?.length ? (
              <p className="muted small not-covered">Pas encore dans le prototype : {getLevel(level).notCovered?.join(" ; ")}.</p>
            ) : null}
          </section>
        </div>

        <aside className="prog-side">
          <ExamCard level={level} entLinked={state.profile.entLinked} />
          <ReviewList reviews={state.reviews} onOpen={onOpen} />
          {before && bases.length ? (
            <section className="block mode-block" aria-labelledby="bases-title">
              <ModeChip mode="revision" level={before} />
              <h2 id="bases-title" className="h2">Utile maintenant</h2>
              <p className="muted small">Des bases de {getLevel(before).label} encore fragiles, dont tes chapitres en cours ont besoin.</p>
              <ul className="mini-list">
                {bases.slice(0, 3).map(({ base, target }) => (
                  <li key={base.id}>
                    <button type="button" className="mini-row" onClick={() => onOpen(base)} style={subStyle(base.subject)}>
                      <SubjectTile subject={base.subject} size="sm" />
                      <span className="mini-row-main">
                        <strong>{base.title}</strong>
                        <span className="muted small">Pour « {target.title} » · {MASTERY[mastery(base.id)].label}</span>
                      </span>
                      <ChevronRight size={20} />
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="text-btn mode-foot" onClick={() => onMode("revision")}>Toute la révision de {getLevel(before).label}</button>
            </section>
          ) : null}
        </aside>
      </div>
    </>
  );
}

/* ——— Révision de l'année précédente ——— */

function RevisionView({ level, before, onOpen }: { level: Level; before: Level; onOpen: (u: Unit) => void }) {
  const { state } = useStore();
  const mastery = useMastery();
  const subjects = studentSubjects(level, state.profile.track).map((s) => s.subject);
  const bases = recommendedBases(level, state.progress, mastery);
  const groups = subjects.map((s) => ({ subject: s, rows: revisionRows(level, s, state.progress[s], mastery) })).filter((g) => g.rows.length);
  const b = getLevel(before).label;

  return (
    <div className="mode-view">
      <header className="mode-intro is-revision">
        <ModeChip mode="revision" level={before} />
        <h2 className="h2">Revoir la {b}</h2>
        <p>Les chapitres de l'an dernier, matière par matière. En tête : ceux dont ta {getLevel(level).label} a besoin maintenant, et ceux qui sont encore fragiles.</p>
      </header>

      {bases.length ? (
        <section className="block" aria-labelledby="now-bases">
          <h3 id="now-bases" className="h3">Utile pour tes chapitres en cours</h3>
          <ul className="mode-list">
            {bases.map(({ base, target }) => (
              <li key={base.id}>
                <button type="button" className="mode-row" style={subStyle(base.subject)} onClick={() => onOpen(base)}>
                  <SubjectTile subject={base.subject} size="sm" />
                  <span className="mode-row-main">
                    <strong>{base.title}</strong>
                    <span className="muted small">Pour « {target.title} » en {inSentence(target.subject)}</span>
                    <MasteryMeter state={mastery(base.id)} subject={base.subject} />
                  </span>
                  <ChevronRight size={20} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="notice notice-soft">Aucune base urgente : les chapitres de {b} dont tu as besoin maintenant sont au moins en consolidation.</p>
      )}

      <div className="mode-groups">
        {groups.map(({ subject, rows }) => {
          const weak = rows.filter((r) => MASTERY[r.state].rank <= 2).length;
          return (
            <details key={subject} className="mode-group" style={subStyle(subject)} open={groups.length <= 3}>
              <summary>
                <SubjectTile subject={subject} size="sm" />
                <strong>{SUBJECTS[subject].label}</strong>
                <span className="muted small">{rows.length} chapitre{rows.length > 1 ? "s" : ""}{weak ? ` · ${weak} à revoir` : ""}</span>
                <ChevronRight size={20} className="mode-group-chev" />
              </summary>
              <ul className="mode-list">
                {rows.map(({ unit, usefulFor, state: st, useful }) => (
                  <li key={unit.id}>
                    <button type="button" className="mode-row" onClick={() => onOpen(unit)}>
                      <span className="mode-row-main">
                        <strong>{unit.title}</strong>
                        <span className="muted small">
                          {useful && usefulFor[0] ? `Utile pour « ${usefulFor[0].title} »` : unit.domain}
                          {findSession(unit.sessionId) ? " · séance disponible" : ""}
                        </span>
                        <MasteryMeter state={st} subject={unit.subject} />
                      </span>
                      <ChevronRight size={20} />
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
    </div>
  );
}

/* ——— Avance sur l'année suivante ——— */

function AdvanceView({ level, after, onOpen }: { level: Level; after: Level; onOpen: (u: Unit) => void }) {
  const { state } = useStore();
  const mastery = useMastery();
  const subjects = studentSubjects(level, state.profile.track).map((s) => s.subject);
  // En 1re, l'avance suit les spécialités choisies (on en garde deux en terminale) ;
  // ailleurs, toutes les matières de l'année suivante, spécialités comprises : utile pour s'orienter.
  const allowed: SubjectId[] | undefined = level === "1re" ? studentSubjects(after, state.profile.track).map((s) => s.subject) : undefined;
  const seen = new Set<string>();
  const rows: AdvanceRow[] = [];
  for (const s of subjects) for (const r of advanceRows(level, s, mastery, allowed)) {
    if (seen.has(r.unit.id)) continue;
    seen.add(r.unit.id);
    rows.push(r);
  }
  const openRows = rows.filter((r) => r.open);
  const locked = rows.filter((r) => !r.open);
  const a = getLevel(after).label;

  return (
    <div className="mode-view">
      <header className="mode-intro is-avance">
        <ModeChip mode="avance" level={after} />
        <h2 className="h2">Prendre de l'avance sur la {a}</h2>
        <p>
          Un chapitre de {a} s'ouvre quand ce qui le prépare dans ta {getLevel(level).label} atteint « {MASTERY[UNLOCK_STATE].label} ». C'est facultatif : ton année passe d'abord, et rien ici ne compte dans le programme exigé.
        </p>
      </header>

      <section className="block" aria-labelledby="open-title">
        <h3 id="open-title" className="h3">Ouverts pour toi ({openRows.length})</h3>
        {openRows.length ? (
          <ul className="mode-list">
            {openRows.map(({ unit, after: from }) => (
              <li key={unit.id}>
                <button type="button" className="mode-row" style={subStyle(unit.subject)} onClick={() => onOpen(unit)}>
                  <LockIcon open />
                  <span className="mode-row-main">
                    <strong>{unit.title}</strong>
                    <span className="muted small">{SUBJECTS[unit.subject].short}, {a} · grâce à « {from[0]?.title} »</span>
                  </span>
                  <ChevronRight size={20} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="notice notice-soft">Rien d'ouvert pour l'instant : continue ton année, les premiers chapitres de {a} s'ouvriront quand leurs bases seront maîtrisées.</p>
        )}
      </section>

      <section className="block" aria-labelledby="locked-title">
        <h3 id="locked-title" className="h3">S'ouvriront au fil de l'année ({locked.length})</h3>
        <div className="mode-groups is-tight">
          {Array.from(new Set(locked.map((r) => r.unit.subject))).map((sub) => {
            const rows = locked.filter((r) => r.unit.subject === sub);
            return (
              <details key={sub} className="mode-group" style={subStyle(sub)}>
                <summary>
                  <SubjectTile subject={sub} size="sm" />
                  <strong>{SUBJECTS[sub].label}</strong>
                  <span className="muted small">{rows.length} chapitre{rows.length > 1 ? "s" : ""}</span>
                  <ChevronRight size={20} className="mode-group-chev" />
                </summary>
                <ul className="mode-list">
                  {rows.map(({ unit, blocking }) => (
                    <li key={unit.id}>
                      <button type="button" className="mode-row is-locked" onClick={() => onOpen(unit)}>
                        <LockIcon open={false} />
                        <span className="mode-row-main">
                          <strong>{unit.title}</strong>
                          {blocking[0] ? (
                            <span className="lock-need">
                              <span className="muted small">Il faut « {blocking[0].title} »{blocking.length > 1 ? ` et ${blocking.length - 1} autre${blocking.length > 2 ? "s" : ""}` : ""}</span>
                              <MasteryMeter state={mastery(blocking[0].id)} subject={blocking[0].subject} />
                            </span>
                          ) : null}
                        </span>
                        <ChevronRight size={20} />
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}
