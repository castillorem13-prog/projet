"use client";

import { ArrowLeft, ArrowRight, BadgeCheck, Check, Clock3, FlaskConical, Info, PenLine, Play, RotateCcw, Target, Timer } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { PreviewCard } from "@/components/passions/preview-card";
import { FocusPage } from "@/components/ui/focus-page";
import { KindIcon } from "@/components/ui/kind-icon";
import { Segmented } from "@/components/ui/segmented";
import { ModeChip, VerifyBadge } from "@/components/programme/parts";
import { subStyle } from "@/components/ui/subject-icon";
import { findUnit, levelRank, sourceOf, type Stage } from "@/lib/curriculum";
import { getLevel } from "@/lib/curriculum/levels";
import { getObjective } from "@/lib/curriculum/objectives";
import { exercisePoints, getExam } from "@/lib/content/exams";
import { COMPETENCES, KINDS, SUBJECTS } from "@/lib/content/meta";
import { FAMILIES } from "@/lib/content/passions";
import { getSession } from "@/lib/content/sessions";
import { shownActivity } from "@/lib/content/sponsored";
import { partner } from "@/lib/rewards";
import { STAGES, themed, type Activity, type Stimulus } from "@/lib/content/types";
import { cx, frNumber } from "@/lib/cx";
import { useBack } from "@/lib/nav";
import { useMyPassions, useSessionPassions, useStore } from "@/lib/store";

export type Mode = "practice" | "exam";

export function PrepareScreen({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const goBack = useBack("/");
  const { state, update } = useStore();
  const session = getSession(sessionId);
  const exam = session.examId ? getExam(session.examId) : undefined;
  const wanted = useSearchParams().get("mode");
  const [mode, setMode] = useState<Mode>(exam && wanted === "controle" ? "exam" : "practice");
  const [focusId, setFocusId] = useState<string | null>(null);
  const passions = useMyPassions();
  const activePassions = useSessionPassions();
  const active = activePassions.map((p) => p.id);
  const focus = activePassions.find((p) => p.id === focusId) ?? activePassions[0] ?? passions[0];

  const problem = session.activities.find((a) => a.kind === "problem");
  const examContext = exam?.exercises.find((e) => e.context)?.context;
  const previewText = focus
    ? mode === "exam" && examContext
      ? themed(examContext, focus)
      : session.preview
        ? themed(session.preview, focus)
        : problem && problem.kind === "problem"
          ? themed(problem.context, focus)
          : undefined
    : undefined;
  const unit = findUnit(session.unitId);
  const src = unit ? sourceOf(unit) : undefined;
  const rel = levelRank(session.grade) - levelRank(state.profile.grade);
  const objective = unit?.objectiveIds?.map(getObjective).find(Boolean);
  const byStage = (["rappel", "application", "transfert", "extension"] as Stage[]).map((st) => ({ st, acts: session.activities.filter((a) => a.stage === st) })).filter((g) => g.acts.length);
  const docs: Stimulus[] = session.activities.flatMap((a: Activity) => (a.stimulus ? (Array.isArray(a.stimulus) ? a.stimulus : [a.stimulus]) : []));
  const uniqueDocs = docs.filter((d, i) => docs.findIndex((x) => x.title === d.title) === i);
  const itemCount = session.activities.reduce((s, a) => s + (a.kind === "problem" ? a.parts.length : 1), 0);
  const isExam = mode === "exam" && exam;
  const resumePlayer = !isExam && state.player?.sessionId === sessionId ? state.player : null;
  const resumeExam = isExam && state.exam?.examId === exam.id ? state.exam : null;
  const canResume = Boolean(resumePlayer || resumeExam);

  const toggle = (id: string) =>
    update((s) => {
      const cur = s.active.filter((x) => passions.some((p) => p.id === x));
      const base = cur.length ? cur : passions.map((p) => p.id);
      const nextActive = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
      return { ...s, active: nextActive.length ? nextActive : base };
    });

  const start = (fresh: boolean) => {
    if (isExam) {
      if (fresh || !resumeExam) update((s) => ({ ...s, exam: { examId: exam.id, answers: {}, exIndex: 0, startedAt: Date.now() } }));
      router.push(`/controle/${exam.id}`);
    } else {
      if (fresh || !resumePlayer) update((s) => ({ ...s, player: null }));
      router.push(`/seance/${sessionId}/jouer`);
    }
  };

  const startLabel = isExam ? "Commencer le contrôle" : "Commencer la séance";
  const actions = canResume ? (
    <div className="dock-row">
      <button type="button" className="btn btn-ghost" onClick={() => start(true)}>
        <RotateCcw size={18} strokeWidth={2.6} />
        <span>Recommencer</span>
      </button>
      <button type="button" className="btn btn-ink" onClick={() => start(false)}>
        <Play size={18} strokeWidth={2.6} />
        <span>Reprendre</span>
      </button>
    </div>
  ) : (
    <button type="button" className="btn btn-ink btn-block" onClick={() => start(true)}>
      <span>{startLabel}</span>
      <ArrowRight size={20} strokeWidth={2.6} />
    </button>
  );
  const note = (
    <p className="dock-note">
      <Clock3 size={15} strokeWidth={2.4} />
      {canResume
        ? resumePlayer
          ? `Tu en étais à l'exercice ${resumePlayer.index + 1} sur ${session.activities.length}`
          : "Le chrono de ton contrôle continue"
        : isExam
          ? `${exam.minutes} minutes, rends ta copie quand tu veux`
          : `${session.minutes} minutes environ, pause possible à tout moment`}
    </p>
  );

  return (
    <FocusPage
      wide
      className="prepare-page"
      top={
        <>
          <button type="button" className="icon-btn" onClick={goBack} aria-label="Retour">
            <ArrowLeft size={24} />
          </button>
          <span className="chip chip-sub topbar-end" style={subStyle(session.subject)}>{SUBJECTS[session.subject].label}, {getLevel(session.grade).label}</span>
        </>
      }
      dock={
        <div className="prepare-dock">
          {actions}
          {note}
        </div>
      }
    >
      <div className="prepare-layout">
        <div className="prepare-main">
          <div className="prepare-head">
            {rel !== 0 ? <ModeChip mode={rel < 0 ? "revision" : "avance"} level={session.grade} /> : null}
            <h1 className="display">{session.notion}</h1>
            <p className="lead">{session.chapter}</p>
          </div>

          <div className="objective-card" style={subStyle(session.subject)}>
            <Target size={20} strokeWidth={2.4} />
            <div>
              <p className="objective-label">À la fin de la séance, tu sauras</p>
              <p className="objective-text">{objective?.observableOutcome ?? session.objective}</p>
              {src && unit ? (
                <p className="objective-src">
                  <span>{src.title} · {unit.title}</span>
                  <VerifyBadge status={unit.verification} short />
                </p>
              ) : null}
            </div>
          </div>

          {exam ? (
            <div className="mode-switch">
              <Segmented label="Type de séance" value={mode} onChange={setMode} options={[{ id: "practice", label: "Entraînement" }, { id: "exam", label: "Contrôle blanc" }]} />
              <p className="muted small">
                {mode === "practice"
                  ? `${itemCount} questions, coup de pouce et correction après chaque réponse.`
                  : `${exam.minutes} minutes, noté sur 20, corrigé quand tu rends ta copie. Comme un vrai contrôle.`}
              </p>
            </div>
          ) : null}

          {!isExam ? (
            <section className="block" aria-labelledby="prog-title">
              <h2 id="prog-title" className="h2">Trois défis{byStage.some((g) => g.st === "extension") ? ", plus un bonus" : ""}</h2>
              <ol className="stage-plan">
                {byStage.map(({ st, acts }) => (
                  <li key={st} className={cx("stage-group", st === "extension" && "is-extra")}>
                    <p className="stage-group-title">
                      <span className="stage-n">{st === "extension" ? "+" : STAGES[st].n}</span>
                      <strong>{STAGES[st].label}</strong>
                      {st === "extension" ? <span className="chip chip-sm chip-outline">Facultatif</span> : null}
                    </p>
                    <ul className="plan">
                      {acts.map((a) => {
                        const comps = a.kind === "problem" ? Array.from(new Set(a.parts.map((p) => p.competence))) : [a.competence];
                        const sp = shownActivity(session, a, state.wallet.parent.sponsored !== false).sponsor;
                        return (
                          <li key={a.id} className="plan-row">
                            <span className="plan-icon"><KindIcon kind={a.kind} size={22} /></span>
                            <span className="plan-main">
                              <strong>{KINDS[a.kind].label}{a.kind === "problem" ? `, ${a.parts.length} questions` : ""}</strong>
                              <span className="plan-comps">
                                {comps.map((c) => (
                                  <span key={c} className="chip chip-sm chip-sub" style={subStyle(COMPETENCES[c].subject)}>{COMPETENCES[c].label}</span>
                                ))}
                                {sp ? (
                                  <span className="chip chip-sm sponsor-pill" style={{ "--art": partner(sp.partnerId).color } as CSSProperties}>
                                    Partenaire {partner(sp.partnerId).name} · +{sp.bonus} pts
                                  </span>
                                ) : null}
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ol>
              <p className="muted small plan-note"><Info size={15} strokeWidth={2.4} /> Jusqu'à trois indices par exercice. Une réussite avec indice compte, mais la maîtrise demande de réussir seul, sur plusieurs jours.</p>
            </section>
          ) : (
            <section className="block" aria-labelledby="exam-title">
              <h2 id="exam-title" className="h2">Le sujet</h2>
              <ol className="plan">
                {exam.exercises.map((e) => (
                  <li key={e.id} className="plan-row">
                    <span className="plan-icon"><PenLine size={22} strokeWidth={2.2} /></span>
                    <span className="plan-main">
                      <strong>{e.title}</strong>
                      <span className="muted small">{e.questions.length} questions, {frNumber(exercisePoints(e))} points</span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="exam-rules"><Timer size={18} strokeWidth={2.4} /> Tu peux masquer le chrono, et finir même si le temps est écoulé : ce sera simplement indiqué sur ta copie.</p>
            </section>
          )}
        </div>

        {session.fixedNote ? (
          <aside className="prepare-aside" aria-labelledby="docs-title">
            <h2 id="docs-title" className="h2">Les documents</h2>
            <p className="muted small">{session.fixedNote}</p>
            {uniqueDocs.length ? (
              <ul className="doc-list">
                {uniqueDocs.map((d) => (
                  <li key={d.title} className={cx("doc-list-item", d.provenance.authentic ? "is-authentic" : "is-mock")}>
                    {d.provenance.authentic ? <BadgeCheck size={18} strokeWidth={2.4} /> : <FlaskConical size={18} strokeWidth={2.4} />}
                    <span>
                      <strong>{d.title}</strong>
                      <span className="muted small">{d.provenance.authentic ? [d.provenance.creator, d.provenance.date].filter(Boolean).join(", ") || d.provenance.type : "Document fictif, écrit pour l'exercice"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {session.contentNote ? <p className="content-note muted small"><Info size={14} strokeWidth={2.6} /> {session.contentNote}</p> : null}
            <div className="prepare-aside-actions">
              {actions}
              {note}
            </div>
          </aside>
        ) : (
        <aside className="prepare-aside" aria-labelledby="univ-title">
          <div className="block-head">
            <h2 id="univ-title" className="h2">Tes passions dans les énoncés</h2>
            <Link href={`/passions?retour=/seance/${sessionId}`} className="text-btn">Modifier</Link>
          </div>
          <p className="muted small">Touche une passion pour voir l'énoncé, ou décoche-la pour cette séance.</p>
          <div className="chip-cloud prepare-passions">
            {passions.map((p) => {
              const on = active.includes(p.id);
              return (
                <span key={p.id} className={cx("pchip-pair fam", on && "is-on", focus?.id === p.id && "is-focus")} style={{ "--fam": FAMILIES[p.family].color } as CSSProperties}>
                  <button type="button" className="pchip-main" onClick={() => { if (!on) toggle(p.id); setFocusId(p.id); }}>
                    {p.label}
                  </button>
                  <button type="button" className="pchip-toggle" aria-pressed={on} aria-label={on ? `Retirer ${p.label} de cette séance` : `Ajouter ${p.label}`} onClick={() => toggle(p.id)} disabled={on && active.length === 1}>
                    {on ? <Check size={15} strokeWidth={3} /> : <span className="pchip-off" />}
                  </button>
                </span>
              );
            })}
          </div>
          {focus && previewText ? <PreviewCard passion={focus} text={previewText} /> : <p className="muted small">Les exemples et situations de cette séance reprennent tes passions.</p>}
          {session.contentNote ? <p className="content-note muted small"><Info size={14} strokeWidth={2.6} /> {session.contentNote}</p> : null}
          <div className="prepare-aside-actions">
            {actions}
            {note}
          </div>
        </aside>
        )}
      </div>
    </FocusPage>
  );
}
