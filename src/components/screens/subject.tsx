"use client";

import { ArrowLeft, ArrowRight, Check, ChevronRight, ExternalLink, Link2, MapPin, Timer } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LockIcon, MasteryMeter, ModeChip, STATUS_LABEL, VerifyBadge } from "@/components/programme/parts";
import { UnitSheet } from "@/components/programme/unit-sheet";
import { Sheet } from "@/components/ui/sheet";
import { SubjectChip, SubjectTile, subStyle } from "@/components/ui/subject-icon";
import { findSession } from "@/lib/content/catalog";
import { SUBJECTS } from "@/lib/content/meta";
import { findUnit, nextLevel, prevLevel, sourceOf, statusIn, unitsOf, type SubjectId, type Unit } from "@/lib/curriculum";
import { LEVELS, getLevel, studentSubjects } from "@/lib/curriculum/levels";
import { advanceRows, revisionRows } from "@/lib/curriculum/modes";
import { PROGRESS_SOURCE_LABEL } from "@/lib/curriculum/progression";
import { MASTERY, UNLOCK_STATE, atLeast } from "@/lib/learning/mastery";
import { cx } from "@/lib/cx";
import { confirmProgress, setCurrentUnit, useMastery, useStore } from "@/lib/store";

export function SubjectScreen({ subject }: { subject: SubjectId }) {
  const { state, update } = useStore();
  const mastery = useMastery();
  // Lien direct vers un chapitre (depuis les objectifs du jour ou un rappel).
  const initialUnit = useSearchParams().get("unite");
  const [open, setOpen] = useState<Unit | null>(() => findUnit(initialUnit) ?? null);
  const [picking, setPicking] = useState(false);
  const level = state.profile.grade;
  const lvl = getLevel(level).label;
  const meta = SUBJECTS[subject];
  const mine = studentSubjects(level, state.profile.track).find((s) => s.subject === subject);
  const progress = state.progress[subject];
  const units = progress ? progress.order.map(findUnit).filter((u): u is Unit => Boolean(u)) : unitsOf(level, subject);
  const before = prevLevel(level);
  const after = nextLevel(level);
  const revision = revisionRows(level, subject, progress, mastery);
  const advance = advanceRows(level, subject, mastery);
  const src = units[0] ? sourceOf(units[0]) : undefined;
  const seen = units.filter((u) => statusIn(progress, u.id) === "vu").length;
  const solid = units.filter((u) => atLeast(mastery(u.id), UNLOCK_STATE)).length;

  if (!units.length) {
    const where = LEVELS.filter((l) => unitsOf(l.id, subject).length).map((l) => l.label);
    return (
      <div className="subject-page" style={subStyle(subject)}>
        <header className="sub-top">
          <Link href="/reviser" className="icon-btn" aria-label="Retour au programme"><ArrowLeft size={24} /></Link>
        </header>
        <header className="subject-head">
          <SubjectTile subject={subject} size="lg" />
          <div>
            <p className="kicker">Pas au programme de ta {lvl}</p>
            <h1 className="h1">{meta.label}</h1>
          </div>
        </header>
        <p className="lead">{where.length ? `Cette matière est enseignée en ${where.join(", ")}. Change de niveau dans « Moi » pour la voir.` : "Cette matière n'est pas encore dans le prototype."}</p>
      </div>
    );
  }

  return (
    <div className="subject-page" style={subStyle(subject)}>
      <header className="sub-top">
        <Link href="/reviser" className="icon-btn" aria-label="Retour au programme">
          <ArrowLeft size={24} />
        </Link>
      </header>

      <header className="subject-head">
        <SubjectTile subject={subject} size="lg" />
        <div>
          <p className="kicker">
            {lvl}
            {mine?.role === "specialite" ? " · Spécialité" : mine?.role === "option" ? " · Option" : ""}
            {mine?.hours ? ` · ${mine.hours}${/an|EMC/.test(mine.hours) ? "" : " par semaine"}` : ""}
          </p>
          <h1 className="h1">{meta.label}</h1>
        </div>
      </header>

      {src ? (
        <p className="subject-source">
          <span>Programme : {src.title}, {src.reference}.</span>
          <VerifyBadge status={src.verification} short />
          <a className="text-btn" href={src.url} target="_blank" rel="noreferrer">
            Référence <ExternalLink size={13} strokeWidth={2.6} />
          </a>
        </p>
      ) : null}

      <dl className="subject-stats">
        <div><dt>Vus en classe</dt><dd>{seen}<span>/{units.length}</span></dd></div>
        <div><dt>Maîtrisés</dt><dd>{solid}<span>/{units.length}</span></dd></div>
        <div><dt>À revoir bientôt</dt><dd>{state.reviews.filter((r) => findUnit(r.unitId)?.subject === subject).length}</dd></div>
      </dl>

      <div className="subject-grid">
        <section className="block subject-main" aria-labelledby="tl-title" id="progression">
          <div className="block-head">
            <h2 id="tl-title" className="h2">Progression de ta classe</h2>
          </div>
          {progress ? (
            <div className={cx("progress-note", !progress.confirmed && "is-proposal")}>
              <p>{progress.source === "ent_demo" ? <Link2 size={15} strokeWidth={2.6} className="inline-icon" /> : null} {PROGRESS_SOURCE_LABEL[progress.source]}.{!progress.confirmed ? " L'ordre suit le programme ; le chapitre en cours est estimé d'après la période de l'année." : ""}</p>
              <div className="progress-note-actions">
                {!progress.confirmed ? (
                  <button type="button" className="btn btn-ink btn-md" onClick={() => update((s) => confirmProgress(s, subject))}>
                    <Check size={17} strokeWidth={3} />
                    <span>C'est bien ça</span>
                  </button>
                ) : null}
                <button type="button" className="btn btn-ghost btn-md" onClick={() => setPicking(true)}>
                  <MapPin size={17} strokeWidth={2.6} />
                  <span>{progress.confirmed ? "Changer le chapitre en cours" : "Ma classe en est ailleurs"}</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="muted small">Ordre indicatif du programme : cette matière ne fait pas partie de tes enseignements cette année.</p>
          )}

          <ol className="timeline">
            {units.map((u, i) => {
              const status = statusIn(progress, u.id) ?? "a-venir";
              const m = mastery(u.id);
              const session = findSession(u.sessionId);
              const weakNeeds = (u.needs ?? []).map(findUnit).filter((n): n is Unit => Boolean(n) && !atLeast(mastery(n?.id ?? ""), "consolidation"));
              if (status === "en-cours") {
                return (
                  <li key={u.id} className="tl-item is-en-cours">
                    <span className="tl-dot" aria-hidden="true">{i + 1}</span>
                    <article className="tl-current">
                      <p className="tl-meta">{STATUS_LABEL[status]}{progress && !progress.confirmed ? " (proposition)" : ""} · {u.domain}</p>
                      <h3 className="tl-current-title">{u.title}</h3>
                      <MasteryMeter state={m} subject={subject} detail />
                      <ul className="tl-notions">
                        {u.notions.map((n) => (
                          <li key={n}><Check size={15} strokeWidth={3} /> {n}</li>
                        ))}
                      </ul>
                      {weakNeeds.length ? (
                        <div className="tl-needs">
                          {weakNeeds[0] && weakNeeds[0].level !== level ? <ModeChip mode="revision" level={weakNeeds[0].level} /> : null}
                          <span>À consolider d'abord :</span>
                          {weakNeeds.map((n) => (
                            <button key={n.id} type="button" className="text-btn" onClick={() => setOpen(n)}>
                              {n.title} ({MASTERY[mastery(n.id)].label.toLowerCase()})
                            </button>
                          ))}
                        </div>
                      ) : null}
                      <div className="tl-actions">
                        {session ? (
                          <Link href={`/seance/${session.id}`} className="btn btn-ink btn-md">
                            <span>Réviser ce chapitre</span>
                            <ArrowRight size={18} strokeWidth={2.6} />
                          </Link>
                        ) : (
                          <button type="button" className="btn btn-ink btn-md" onClick={() => setOpen(u)}>Voir le chapitre</button>
                        )}
                        {session?.examId ? (
                          <Link href={`/seance/${session.id}?mode=controle`} className="btn btn-ghost btn-md">
                            <Timer size={17} strokeWidth={2.6} />
                            <span>Contrôle blanc</span>
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  </li>
                );
              }
              return (
                <li key={u.id} className={cx("tl-item", `is-${status}`)}>
                  <span className="tl-dot" aria-hidden="true">{status === "vu" ? <Check size={15} strokeWidth={3.2} /> : i + 1}</span>
                  <button type="button" className="tl-card" onClick={() => setOpen(u)}>
                    <span className="tl-card-main">
                      <span className="tl-meta">{u.domain}{session ? " · séance disponible" : ""}</span>
                      <strong>{u.title}</strong>
                      {status === "vu" || m !== "a-decouvrir" ? <MasteryMeter state={m} subject={subject} /> : <span className="tl-preview">{u.notions.join(" · ")}</span>}
                    </span>
                    <ChevronRight size={20} className="tl-go" />
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="subject-side">
          {before && revision.length ? (
            <section className="block mode-block block-first" aria-labelledby="rev-title">
              <ModeChip mode="revision" level={before} />
              <h2 id="rev-title" className="h2">Revoir la {getLevel(before).label}</h2>
              <p className="muted small">En tête : ce qui sert cette année et ce qui reste fragile.</p>
              <ul className="mini-list">
                {revision.slice(0, 6).map(({ unit, usefulFor, state: st, useful }) => (
                  <li key={unit.id}>
                    <button type="button" className="mini-row" onClick={() => setOpen(unit)}>
                      <span className="mini-row-main">
                        <strong>{unit.title}</strong>
                        {unit.subject !== subject ? <SubjectChip subject={unit.subject} small /> : null}
                        <span className="muted small">{useful && usefulFor[0] ? `Utile pour « ${usefulFor[0].title} »` : unit.domain}</span>
                        <MasteryMeter state={st} subject={unit.subject} />
                      </span>
                      <ChevronRight size={20} />
                    </button>
                  </li>
                ))}
              </ul>
              {revision.length > 6 ? <Link href="/reviser?mode=revision" className="text-btn mode-foot">Toute la révision ({revision.length})</Link> : null}
            </section>
          ) : null}

          {after && advance.length ? (
            <section className="block mode-block" aria-labelledby="adv-title">
              <ModeChip mode="avance" level={after} />
              <h2 id="adv-title" className="h2">Prendre de l'avance sur la {getLevel(after).label}</h2>
              <p className="muted small">Facultatif. Un chapitre s'ouvre quand ce qui le prépare atteint « {MASTERY[UNLOCK_STATE].label} ».</p>
              <ul className="mini-list">
                {advance.slice(0, 6).map(({ unit, open: unlocked, blocking }) => (
                  <li key={unit.id}>
                    <button type="button" className={cx("mini-row", !unlocked && "is-locked")} onClick={() => setOpen(unit)}>
                      <LockIcon open={unlocked} />
                      <span className="mini-row-main">
                        <strong>{unit.title}</strong>
                        {unit.subject !== subject ? <SubjectChip subject={unit.subject} small /> : null}
                        {unlocked ? (
                          <span className="muted small">Ouvert : tu peux commencer</span>
                        ) : blocking[0] ? (
                          <span className="lock-need">
                            <span className="muted small">Il faut « {blocking[0].title} »</span>
                            <MasteryMeter state={mastery(blocking[0].id)} subject={blocking[0].subject} />
                          </span>
                        ) : null}
                      </span>
                      <ChevronRight size={20} />
                    </button>
                  </li>
                ))}
              </ul>
              {advance.length > 6 ? <Link href="/reviser?mode=avance" className="text-btn mode-foot">Toute l'avance ({advance.length})</Link> : null}
            </section>
          ) : null}
        </aside>
      </div>

      <Sheet open={picking} title="Où en est ta classe ?" onClose={() => setPicking(false)}>
        <p className="sheet-text">Choisis le chapitre que ton professeur traite en ce moment. Les chapitres d'avant seront considérés comme vus ; tu pourras changer à tout moment.</p>
        <div className="report-list pick-list" role="radiogroup" aria-label="Chapitre en cours">
          {units.map((u) => (
            <button
              key={u.id}
              type="button"
              role="radio"
              aria-checked={progress?.current === u.id}
              className={cx("report-option", progress?.current === u.id && "is-on")}
              onClick={() => {
                update((s) => setCurrentUnit(s, subject, u.id));
                setPicking(false);
              }}
            >
              {u.title}
            </button>
          ))}
        </div>
      </Sheet>

      <UnitSheet unit={open} onClose={() => setOpen(null)} onOpen={setOpen} />
    </div>
  );
}
