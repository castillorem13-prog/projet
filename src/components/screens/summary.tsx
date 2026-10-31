"use client";

import { ArrowRight, CalendarClock, Check, ChevronDown, CircleDot, Lightbulb, PiggyBank, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { MasteryMeter } from "@/components/programme/parts";
import { FocusPage } from "@/components/ui/focus-page";
import { subStyle } from "@/components/ui/subject-icon";
import { COMPETENCES, levelLabel } from "@/lib/content/meta";
import { getSession } from "@/lib/content/sessions";
import { STAGES, type CompetenceId } from "@/lib/content/types";
import { findUnit, type MasteryState, type Stage } from "@/lib/curriculum";
import { MASTERY } from "@/lib/learning/mastery";
import { dueLabel } from "@/lib/learning/scheduler";
import { cx, nb } from "@/lib/cx";
import { frEuros, frPoints, partner } from "@/lib/rewards";
import type { ItemResult } from "@/lib/session-result";
import { useStore } from "@/lib/store";
import { isoDay } from "@/lib/coach/planner";
import { demoNow } from "@/lib/content/calendar";

/** Ce qu'il faut pour passer à l'état suivant, dit simplement. */
function nextStep(s: MasteryState): string {
  switch (s) {
    case "a-decouvrir":
    case "en-decouverte":
      return "Prochaine marche : réussir un défi sans indice.";
    case "fragile":
      return "Prochaine marche : réussir seul les défis de rappel et d'application, sans erreur qui revient.";
    case "consolidation":
      return "Prochaine marche : réussir seul un défi de transfert, un autre jour que le premier succès.";
    case "provisoire":
      return "Prochaine marche : réussir encore seul dans une semaine ou plus, sur un problème différent.";
    case "durable":
      return "Tu es au sommet : les rappels espacés servent maintenant à le garder.";
  }
}

function stageOutcome(items: ItemResult[]): { label: string; tone: "ok" | "help" | "miss" } {
  if (!items.length) return { label: "Non fait", tone: "miss" };
  if (items.some((i) => i.status === "missed")) return { label: "Corrigé", tone: "miss" };
  if (items.every((i) => i.status === "first" && i.assistance === 0 && !i.selfAssessed)) return { label: "Réussi seul", tone: "ok" };
  if (items.every((i) => i.selfAssessed)) return { label: "Relu avec la grille", tone: "help" };
  return { label: "Avec de l'aide", tone: "help" };
}

export function useCountUp(target: number, ms = 900): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}

export function useGrow(): boolean {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setGrown(true), 250);
    return () => window.clearTimeout(id);
  }, []);
  return grown;
}

export function EmptyResult({ title, text, href, cta }: { title: string; text: string; href: string; cta: string }) {
  return (
    <FocusPage>
      <div className="empty">
        <h1 className="h1">{title}</h1>
        <p className="muted">{text}</p>
        <Link href={href} className="btn btn-ink">{cta}</Link>
      </div>
    </FocusPage>
  );
}

export function SummaryScreen({ sessionId }: { sessionId: string }) {
  const { state } = useStore();
  const session = getSession(sessionId);
  const result = state.lastResult?.sessionId === sessionId ? state.lastResult : null;
  const gain = state.lastGain?.sessionId === sessionId ? state.lastGain : null;
  const points = useCountUp(gain?.points ?? result?.points.awarded ?? 0);
  const grown = useGrow();
  const [showCalc, setShowCalc] = useState(false);

  if (!result) {
    return <EmptyResult title="Pas encore de bilan." text={`Fais une séance sur ${session.notion.toLowerCase()} pour voir ton bilan ici.`} href={`/seance/${sessionId}`} cta="Préparer une séance" />;
  }

  const items = result.items;
  const total = items.length;
  const alone = items.filter((i) => i.status === "first" && i.assistance === 0 && !i.selfAssessed).length;
  const helped = items.filter((i) => i.status !== "missed").length - alone;
  const competences = Object.keys(result.levelsAfter) as CompetenceId[];
  const takeaways = Array.from(new Set(session.activities.filter((a) => items.some((i) => i.activityId === a.id)).map((a) => a.takeaway)));
  const headline = alone === total ? "Tout réussi seul." : alone + helped === total ? "Tout réussi, avec un peu d'aide." : alone >= total / 2 ? "Ça prend forme." : "Bonne base de travail.";
  const stages: Stage[] = ["rappel", "application", "transfert", ...(items.some((i) => i.stage === "extension") ? (["extension"] as Stage[]) : [])];
  const unit = findUnit(session.unitId);
  const challenges = gain?.challenges ?? [];
  const sponsored = gain?.sponsored ?? [];
  const challengePts = challenges.reduce((n, c) => n + c.points, 0);
  const sponsoredPts = sponsored.reduce((n, c) => n + c.points, 0);
  const after = gain ? gain.balanceBefore + gain.points + challengePts + sponsoredPts : 0;
  const changed = gain && gain.stateAfter !== gain.stateBefore;
  const up = gain ? MASTERY[gain.stateAfter].rank > MASTERY[gain.stateBefore].rank : false;
  // Prochain objectif du jour (le type d'erreur reste une donnée interne).
  const plan = state.today && state.today.date === isoDay(demoNow()) ? state.today : null;
  const nextGoal = plan?.items.find((i) => !plan.done.includes(i.id));

  return (
    <FocusPage
      wide
      className="result-page"
      dock={
        <div className="dock-row">
          <Link href="/progres" className="btn btn-ghost">Mes progrès</Link>
          <Link href="/" className="btn btn-ink">Terminer</Link>
        </div>
      }
    >
      <div className="result-layout">
        <div className="result-main">
          <section className="summary-hero on-yellow">
            <p className="summary-kicker">{session.notion}, séance terminée</p>
            <h1 className="h1">{headline}</h1>
            <p className="summary-sub">
              {alone} réussite{alone > 1 ? "s" : ""} seul{helped > 0 ? `, ${helped} avec de l'aide` : ""} sur {total}.
            </p>
            <ol className="stage-results">
              {stages.map((st) => {
                const o = stageOutcome(items.filter((i) => i.stage === st));
                return (
                  <li key={st} className={cx("stage-result", `is-${o.tone}`)}>
                    <span className="stage-result-icon">{o.tone === "ok" ? <Check size={16} strokeWidth={3} /> : o.tone === "help" ? <Lightbulb size={16} strokeWidth={2.6} /> : <X size={16} strokeWidth={3} />}</span>
                    <span>
                      <strong>{st === "extension" ? "Bonus" : `Défi ${STAGES[st].n}`} · {STAGES[st].short}</strong>
                      <span>{o.label}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          {gain && unit ? (
            <section className="block mastery-card" style={subStyle(unit.subject)} aria-labelledby="m-title">
              <h2 id="m-title" className="h2">Maîtrise du chapitre</h2>
              <p className="muted small">{unit.title}</p>
              <div className="mastery-change">
                {changed ? (
                  <>
                    <MasteryMeter state={gain.stateBefore} subject={unit.subject} />
                    <ArrowRight size={20} strokeWidth={2.6} aria-label={up ? "monte à" : "redescend à"} />
                  </>
                ) : null}
                <MasteryMeter state={gain.stateAfter} subject={unit.subject} />
              </div>
              <p>{changed ? (up ? `Tu passes à « ${MASTERY[gain.stateAfter].label} ». ` : `Redescend à « ${MASTERY[gain.stateAfter].label} » : ce n'est pas grave, c'est exactement ce que les rappels vont travailler. `) : `Toujours « ${MASTERY[gain.stateAfter].label} ». `}{nextStep(gain.stateAfter)}</p>
              <p className="review-next">
                <CalendarClock size={18} strokeWidth={2.4} />
                <span>
                  <strong>Prochain rappel : {dueLabel(gain.review).toLowerCase()}.</strong> {gain.review.reason}
                </span>
              </p>
            </section>
          ) : null}

          {nextGoal ? (
            <Link href={nextGoal.kind === "vo" ? "/" : nextGoal.href} className="next-goal">
              <span className="next-goal-kicker num">Aujourd'hui · {plan?.done.length}/{plan?.items.length}</span>
              <strong>{nb(nextGoal.title)}</strong>
              <span className="next-goal-cta">{nextGoal.minutes} min <ArrowRight size={18} strokeWidth={2.6} /></span>
            </Link>
          ) : plan ? (
            <p className="plan-done-note"><Check size={18} strokeWidth={3} /> Tous tes objectifs du jour sont faits.</p>
          ) : null}

          <section className="block wallet-gain" aria-labelledby="w-title">
            <h2 id="w-title" className="sr-only">Ta cagnotte</h2>
            <div className="points-row">
              <span className="points-icon"><PiggyBank size={26} strokeWidth={2.4} /></span>
              <div>
                <p className="points-value">+{points} <span className="points-unit">points</span></p>
                <p className="muted small">
                  {gain ? `Ta cagnotte passe à ${frEuros(after)}. ` : ""}Les points récompensent ta régularité ; ils ne changent pas ta maîtrise.
                </p>
              </div>
              <button type="button" className="icon-btn" aria-expanded={showCalc} aria-label="Voir le calcul des points" onClick={() => setShowCalc(!showCalc)}>
                <ChevronDown size={22} className={cx("chev", showCalc && "is-open")} />
              </button>
            </div>
            {showCalc ? (
              <dl className="calc">
                <dt>Participation et réussite</dt>
                <dd>{result.points.basePoints.toFixed(1).replace(".", ",")} pts</dd>
                <dt>Temps de réflexion moyen</dt>
                <dd>{Math.round(result.avgSeconds)} s {result.points.timeMultiplier === 0 ? "(trop rapide)" : ""}</dd>
                <dt>Bonus de régularité</dt>
                <dd>× {result.points.streakMultiplier.toFixed(2).replace(".", ",")}</dd>
                {result.points.cappedByDailyLimit ? (
                  <>
                    <dt>Plafond du jour</dt>
                    <dd>150 pts atteint</dd>
                  </>
                ) : null}
                <dt>Conversion</dt>
                <dd>1 000 points = 1 €</dd>
              </dl>
            ) : null}
            {sponsored.length ? (
              <ul className="gain-challenges is-sponsored">
                {sponsored.map((c) => (
                  <li key={c.partnerId}>
                    <span className="sponsor-mark" style={{ "--art": partner(c.partnerId).color } as CSSProperties} aria-hidden="true">{partner(c.partnerId).mark}</span>
                    Exercice partenaire terminé, offert par {partner(c.partnerId).name} <strong>{frPoints(c.points, { sign: true })}</strong>
                  </li>
                ))}
              </ul>
            ) : null}
            {challenges.length ? (
              <ul className="gain-challenges">
                {challenges.map((c) => (
                  <li key={c.title}><Trophy size={17} strokeWidth={2.6} /> Défi de la semaine réussi : {c.title} <strong>{frPoints(c.points, { sign: true })}</strong></li>
                ))}
              </ul>
            ) : null}
            {result.points.timeMultiplier === 0 ? (
              <p className="notice notice-soft">Tu as répondu en moins de 8 secondes en moyenne : cette séance ne rapporte pas de points. Prends le temps de lire, c'est là que tu progresses.</p>
            ) : null}
            <Link href="/cagnotte" className="text-btn">Voir ma cagnotte</Link>
          </section>
        </div>

        <div className="result-side">
          <section className="block block-first" aria-labelledby="skills-title">
            <h2 id="skills-title" className="h2">Compétences travaillées</h2>
            <ul className="skill-list">
              {competences.map((c) => {
                const before = result.levelsBefore[c] ?? 0;
                const afterV = result.levelsAfter[c] ?? before;
                const comp = COMPETENCES[c];
                return (
                  <li key={c} className="skill" style={subStyle(comp.subject)}>
                    <div className="skill-head">
                      <strong>{comp.label}</strong>
                      <span className="skill-delta">+{afterV - before}</span>
                    </div>
                    <div className="skill-bar" style={{ "--before": `${before}%`, "--after": `${grown ? afterV : before}%` } as CSSProperties}>
                      <span className="skill-gain" />
                      <span className="skill-base" />
                    </div>
                    <span className="skill-level">{levelLabel(afterV)}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="block" aria-labelledby="keep-title">
            <h2 id="keep-title" className="h2">À retenir</h2>
            <ul className="takeaways">
              {takeaways.map((t) => (
                <li key={t}><Check size={18} strokeWidth={3} /> {nb(t)}</li>
              ))}
            </ul>
          </section>

          {session.contentNote ? (
            <p className="muted small content-note"><CircleDot size={14} strokeWidth={2.6} /> {session.contentNote}</p>
          ) : null}
        </div>
      </div>
    </FocusPage>
  );
}
