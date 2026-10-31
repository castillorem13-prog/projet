"use client";

import { ArrowRight, CalendarCheck, Compass, Info, Lock } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { MasteryMeter } from "@/components/programme/parts";
import { SectionTabs } from "@/components/shell/section-tabs";
import { SubjectTile, subStyle } from "@/components/ui/subject-icon";
import { findSession } from "@/lib/content/catalog";
import { COMPETENCES, SUBJECTS, competencesOf, inSentence, levelLabel } from "@/lib/content/meta";
import { findUnit, statusIn, type MasteryState, type SubjectId, type Unit } from "@/lib/curriculum";
import { getLevel, studentSubjects } from "@/lib/curriculum/levels";
import { MASTERY, MASTERY_ORDER } from "@/lib/learning/mastery";
import { dueLabel } from "@/lib/learning/scheduler";
import { cx } from "@/lib/cx";
import { useMastery, useStore } from "@/lib/store";
import { confidenceLabel, knowledgeByUnit } from "@/lib/coach/learner";
import { demoNow } from "@/lib/content/calendar";

export function ProgressScreen() {
  const { state } = useStore();
  const mastery = useMastery();
  const profile = state.profile;
  const subjects = studentSubjects(profile.grade, profile.track).map((s) => s.subject);
  const [subject, setSubject] = useState<SubjectId>(subjects.includes("maths") ? "maths" : (subjects[0] ?? "francais"));
  const comps = competencesOf(subject);
  const weakest = comps.reduce((a, b) => ((profile.levels[b] ?? 0) < (profile.levels[a] ?? 0) ? b : a), comps[0] ?? "chercher");
  const progress = state.progress[subject];
  const worked = (progress?.order ?? [])
    .filter((id) => statusIn(progress, id) !== "a-venir")
    .map(findUnit)
    .filter((u): u is Unit => Boolean(u));
  const current = findUnit(progress?.current);
  const review = [...state.reviews].sort((a, b) => a.due.localeCompare(b.due)).find((r) => findUnit(r.unitId)?.subject === subject);
  const reviewUnit = findUnit(review?.unitId);
  const fragile = worked.filter((u) => MASTERY[mastery(u.id)].rank <= 2);
  const target = reviewUnit ?? fragile[0] ?? current;
  const session = findSession(target?.sessionId);
  const know = useMemo(() => knowledgeByUnit(state.evidence.filter((e) => findUnit(e.unitId)?.subject === subject), demoNow()), [state.evidence, subject]);
  const counts = MASTERY_ORDER.map((m) => ({ m, n: worked.filter((u) => mastery(u.id) === m).length })).filter((x) => x.m !== "a-decouvrir");

  return (
    <div className="progress">
      <SectionTabs />
      <header className="page-top">
        <h1 className="h1">Tes progrès</h1>
        <p className="muted">Visibles par toi et ton parent seulement. Aucun classement.</p>
      </header>

      <div className="subject-tabs" role="tablist" aria-label="Matière">
        {subjects.map((s) => (
          <button key={s} type="button" role="tab" aria-selected={subject === s} className={cx("subject-tab", subject === s && "is-on")} style={subStyle(s)} onClick={() => setSubject(s)}>
            <SubjectTile subject={s} size="sm" />
            {SUBJECTS[s].short}
          </button>
        ))}
      </div>

      <div className="progress-grid" style={subStyle(subject)}>
        <div className="progress-main">
          <section className="next-step">
            <p className="next-kicker">Ta prochaine marche en {inSentence(subject)}</p>
            {target ? (
              <>
                <h2 className="h1">{target.title}</h2>
                <p>
                  {review && reviewUnit ? `${dueLabel(review)} : ${review.reason}` : MASTERY[mastery(target.id)].rank <= 2 ? `Encore ${MASTERY[mastery(target.id)].label.toLowerCase()} : une séance courte aide à stabiliser.` : `Ton chapitre en cours. ${MASTERY[mastery(target.id)].detail}`}
                </p>
              </>
            ) : (
              <>
                <h2 className="h1">{COMPETENCES[weakest].label}</h2>
                <p>{COMPETENCES[weakest].description}.</p>
              </>
            )}
            <Link href={session ? `/seance/${session.id}` : `/reviser/${subject}`} className="btn btn-yellow btn-block">
              <span>{session ? "M'entraîner" : "Voir la matière"}</span>
              <ArrowRight size={20} strokeWidth={2.6} />
            </Link>
          </section>

          <section className="block" aria-labelledby="st-title">
            <h2 id="st-title" className="h2">Où en sont tes chapitres</h2>
            {worked.length ? (
              <ul className="state-bars">
                {counts.map(({ m, n }) => (
                  <li key={m} className={cx("state-row", `is-${m}`)}>
                    <MasteryMeter state={m as MasteryState} subject={subject} label={false} />
                    <span className="state-label">{MASTERY[m].label}</span>
                    <strong className="state-n num">{n}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Aucun chapitre vu en classe pour l'instant dans cette matière.</p>
            )}
            <details className="explain">
              <summary><Info size={16} strokeWidth={2.4} /> Comment on passe d'un état à l'autre</summary>
              <ul>
                {MASTERY_ORDER.slice(1).map((m) => (
                  <li key={m}><strong>{MASTERY[m].label}</strong> : {MASTERY[m].detail}</li>
                ))}
                <li>Une réussite avec un indice fort ou après la correction compte, mais pas comme une réussite seule. Une réponse rédigée relue avec la grille reste indicative.</li>
              </ul>
            </details>
          </section>

          <section className="block" aria-labelledby="c-title">
            <h2 id="c-title" className="h2">Compétences travaillées</h2>
            <p className="muted small">Estimation à partir des exercices faits, compétence par compétence.</p>
            <ul className="skill-list">
              {comps.map((c) => {
                const v = profile.levels[c] ?? 0;
                return (
                  <li key={c} className="skill">
                    <div className="skill-head">
                      <strong>{COMPETENCES[c].label}</strong>
                      <span className="skill-level">{levelLabel(v)}</span>
                    </div>
                    <div className="skill-bar" style={{ "--before": `${v}%`, "--after": `${v}%` } as CSSProperties}>
                      <span className="skill-gain" />
                      <span className="skill-base" />
                    </div>
                    <span className="skill-desc">{COMPETENCES[c].description}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="block" aria-labelledby="k-title">
            <h2 id="k-title" className="h2">Ce que tu retiens aujourd'hui</h2>
            <ul className="knowledge-list">
              {worked.slice(0, 6).map((u) => {
                const k = know.get(u.id);
                const label = k ? confidenceLabel(k) : "pas encore assez de réponses";
                const cls = label === "solide" ? "is-solide" : label === "à entretenir" ? "is-entretenir" : label === "à revoir" ? "is-reprendre" : "is-peu";
                return (
                  <li key={u.id} className="knowledge-row">
                    <span>{u.title}</span>
                    <span className={cx("knowledge-label", cls)}>{label}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="progress-side">
          <section className="block block-first" aria-labelledby="n-title">
            <div className="block-head">
              <h2 id="n-title" className="h2">Chapitres de {getLevel(profile.grade).label}</h2>
              <Link href={`/reviser/${subject}`} className="text-btn">Programme</Link>
            </div>
            <ul className="chapter-bars">
              {worked.map((u) => (
                <li key={u.id}>
                  <span className="chapter-bars-title">
                    <strong>{u.title}</strong>
                    {statusIn(progress, u.id) === "en-cours" ? <span className="chip chip-sm chip-sub">En cours</span> : null}
                  </span>
                  <MasteryMeter state={mastery(u.id)} subject={subject} />
                </li>
              ))}
            </ul>
          </section>

          <section className="block" aria-labelledby="b-title">
            <h2 id="b-title" className="h2">Badges</h2>
            <ul className="badges">
              <li className="badge is-earned"><span><CalendarCheck size={26} /></span><strong>Rendez-vous</strong><small>4 jours dans la semaine</small></li>
              <li className="badge is-earned"><span><Compass size={26} /></span><strong>Curieux</strong><small>5 formats essayés</small></li>
              <li className="badge"><span><Lock size={22} /></span><strong>Sans filet</strong><small>3 défis de transfert réussis seul</small></li>
              <li className="badge"><span><Lock size={22} /></span><strong>Toutes matières</strong><small>Une séance dans chaque matière</small></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
