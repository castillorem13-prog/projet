"use client";

import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties } from "react";
import { ActivityEnvContext, type ActivityEnv } from "@/components/activities/env";
import { ChoiceActivity } from "@/components/activities/choice";
import { ClassifyActivity } from "@/components/activities/classify";
import { OrderActivity } from "@/components/activities/order";
import { ProblemActivity } from "@/components/activities/problem";
import { SpotErrorActivity } from "@/components/activities/spot-error";
import { WorkedActivity } from "@/components/activities/worked";
import { Button } from "@/components/ui/button";
import type { Passion } from "@/lib/content/passions";
import { capsulesOf, getCapsule, getTrack } from "@/lib/explore/capsules";
import { cx } from "@/lib/cx";
import { useFx } from "@/lib/fx";
import type { ItemResult } from "@/lib/session-result";
import { CAPSULE_POINTS, completeCapsule, useSessionPassions, useStore } from "@/lib/store";

const ENV: ActivityEnv = { methods: [] };

/** Une capsule d'Explorer : mêmes exercices que les séances, sans note ni maîtrise, avec une fin qui donne envie de continuer. */
export function CapsulePlayer({ capsuleId }: { capsuleId: string }) {
  const router = useRouter();
  const fx = useFx();
  const capsule = getCapsule(capsuleId);
  const passions = useSessionPassions();
  const { state, update } = useStore();
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ItemResult[][]>([]);
  const [finished, setFinished] = useState(false);
  const [firstTime] = useState(() => !state.explore[capsuleId]);
  const track = capsule ? getTrack(capsule.track) : null;
  const style = useMemo(() => (track ? ({ "--track": track.color, "--track-ink": track.ink } as CSSProperties) : undefined), [track]);
  if (!capsule || !track) return null;

  const activity = capsule.activities[index];
  const siblings = capsulesOf(capsule.track);
  const next = siblings[siblings.findIndex((c) => c.id === capsule.id) + 1];
  const passion = passions[index % passions.length] as Passion;

  const complete = (items: ItemResult[]) => {
    const all = [...results, items];
    setResults(all);
    if (index + 1 < capsule.activities.length) {
      setIndex(index + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    fx("complete");
    update((s) => completeCapsule(s, capsule.id, capsule.title, capsule.minutes));
    setFinished(true);
    window.scrollTo({ top: 0 });
  };

  const firstTry = results.flat().filter((r) => r.status === "first").length;
  const total = results.flat().length;
  const common = { passion, reviewLabel: capsule.title, seed: index, onComplete: complete };

  return (
    <div className="focus focus-player capsule-page" style={style}>
      <header className="topbar">
        <div className="topbar-inner">
          <button type="button" className="icon-btn" onClick={() => router.push("/explorer")} aria-label="Revenir à Explorer">
            <X size={24} />
          </button>
          <div className="segments" role="progressbar" aria-valuemin={1} aria-valuemax={capsule.activities.length} aria-valuenow={Math.min(index + 1, capsule.activities.length)} aria-label={`Exercice ${index + 1} sur ${capsule.activities.length}`}>
            {capsule.activities.map((a, i) => (
              <span key={a.id} className={cx("segment", i < results.length ? "is-ok" : i === index && !finished ? "is-current" : "")} />
            ))}
          </div>
          <span className="topbar-count num">{Math.min(index + 1, capsule.activities.length)}/{capsule.activities.length}</span>
        </div>
      </header>

      <main id="main" className="player-main" tabIndex={-1}>
        {finished ? (
          <section className="capsule-end" aria-labelledby="end-title">
            <span className="capsule-end-icon"><Sparkles size={30} strokeWidth={2.4} /></span>
            <p className="capsule-end-kicker">{track.title}</p>
            <h1 id="end-title" className="display">{capsule.title} : bouclé.</h1>
            <p className="capsule-end-promise"><Check size={18} strokeWidth={3} /> {capsule.promise}</p>
            <p className="capsule-end-stats">
              <span className="num">{firstTry}/{total}</span> du premier coup{firstTime ? <> · <strong>+{CAPSULE_POINTS} points</strong></> : null}
            </p>
            <div className="capsule-end-actions">
              {next ? (
                <Button block onClick={() => router.push(`/explorer/${next.id}`)} trailing={<ArrowRight size={20} strokeWidth={2.6} />}>{next.title}</Button>
              ) : null}
              <Link href="/explorer" className={cx("btn btn-block", next ? "btn-ghost" : "btn-ink")}><span>Tous les parcours</span></Link>
            </div>
          </section>
        ) : activity ? (
          <>
            <div className="stage-row">
              <p className="stage-bar capsule-bar">{track.title}<span aria-hidden="true"> · </span><strong>{capsule.title}</strong></p>
            </div>
            <ActivityEnvContext.Provider value={ENV}>
              {activity.kind === "problem" ? (
                <ProblemActivity key={activity.id} activity={activity} {...common} />
              ) : activity.kind === "order" ? (
                <OrderActivity key={activity.id} activity={activity} {...common} />
              ) : activity.kind === "spot-error" ? (
                <SpotErrorActivity key={activity.id} activity={activity} {...common} />
              ) : activity.kind === "classify" ? (
                <ClassifyActivity key={activity.id} activity={activity} {...common} />
              ) : activity.kind === "worked" ? (
                <WorkedActivity key={activity.id} activity={activity} {...common} />
              ) : activity.kind === "mcq" ? (
                <ChoiceActivity key={activity.id} activity={activity} {...common} />
              ) : null}
            </ActivityEnvContext.Provider>
          </>
        ) : null}
      </main>
    </div>
  );
}
