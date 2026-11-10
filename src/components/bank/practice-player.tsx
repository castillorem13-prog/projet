"use client";

import { ArrowRight, BookOpen, RotateCcw, Target, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChoiceActivity } from "@/components/activities/choice";
import { ClassifyActivity } from "@/components/activities/classify";
import { ActivityEnvContext, type ActivityEnv } from "@/components/activities/env";
import { OrderActivity } from "@/components/activities/order";
import { ProblemActivity } from "@/components/activities/problem";
import { SpotErrorActivity } from "@/components/activities/spot-error";
import { WorkedActivity } from "@/components/activities/worked";
import { Button } from "@/components/ui/button";
import { MasteryMeter } from "@/components/programme/parts";
import type { Activity } from "@/lib/content/types";
import type { SubjectId } from "@/lib/curriculum/types";
import { cx } from "@/lib/cx";
import { useFx } from "@/lib/fx";
import type { ItemResult } from "@/lib/session-result";
import { applyPractice, useMastery, useSessionPassions, useStore } from "@/lib/store";

const ENV: ActivityEnv = { methods: [] };
const PER = 8;

/**
 * Entraînement sur un chapitre : des séries de 8 exercices tirés de la banque (tous contre-vérifiés par les tests),
 * du rappel au transfert. Chaque série compte pour la maîtrise et le rappel espacé du chapitre.
 */
export function PracticePlayer({ unitId, title, subject, pool, hasLesson }: { unitId: string; title: string; subject: SubjectId; pool: Activity[]; hasLesson: boolean }) {
  const router = useRouter();
  const fx = useFx();
  const passions = useSessionPassions();
  const mastery = useMastery();
  const { update } = useStore();
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ItemResult[][]>([]);
  const [finished, setFinished] = useState(false);

  const start = (round * PER) % Math.max(pool.length, 1);
  const series = [...pool.slice(start, start + PER), ...pool.slice(0, Math.max(0, start + PER - pool.length))].slice(0, Math.min(PER, pool.length));
  const activity = series[index];
  const passion = passions[index % passions.length]!;

  const complete = (items: ItemResult[]) => {
    const all = [...results, items];
    setResults(all);
    if (index + 1 < series.length) {
      setIndex(index + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    const flat = all.flat();
    const minutes = Math.max(1, Math.round(flat.reduce((s, i) => s + i.seconds, 0) / 60));
    fx("complete");
    update((s) => applyPractice(s, unitId, flat, minutes));
    setFinished(true);
    window.scrollTo({ top: 0 });
  };

  const again = () => {
    setRound(round + 1);
    setIndex(0);
    setResults([]);
    setFinished(false);
    window.scrollTo({ top: 0 });
  };

  const flat = results.flat();
  const firstTry = flat.filter((r) => r.status === "first").length;
  const common = { passion, reviewLabel: title, seed: index, onComplete: complete };

  return (
    <div className="focus focus-player practice-page">
      <header className="topbar">
        <div className="topbar-inner">
          <button type="button" className="icon-btn" onClick={() => router.push(`/reviser/${subject}`)} aria-label="Quitter l'entraînement">
            <X size={24} />
          </button>
          <div className="segments" role="progressbar" aria-valuemin={1} aria-valuemax={series.length} aria-valuenow={Math.min(index + 1, series.length)} aria-label={`Exercice ${index + 1} sur ${series.length}`}>
            {series.map((a, i) => (
              <span key={a.id} className={cx("segment", i < results.length ? "is-ok" : i === index && !finished ? "is-current" : "")} />
            ))}
          </div>
          <span className="topbar-count num">{Math.min(index + 1, series.length)}/{series.length}</span>
        </div>
      </header>

      <main id="main" className="player-main" tabIndex={-1}>
        {finished ? (
          <section className="practice-end" aria-labelledby="practice-end-title">
            <span className="practice-end-icon"><Target size={30} strokeWidth={2.4} /></span>
            <p className="practice-end-kicker">Entraînement</p>
            <h1 id="practice-end-title" className="display">{title}</h1>
            <p className="practice-end-stats"><span className="num">{firstTry}/{flat.length}</span> réussis du premier coup</p>
            <MasteryMeter state={mastery(unitId)} subject={subject} detail />
            <div className="practice-end-actions">
              <Button block onClick={again} trailing={<RotateCcw size={20} strokeWidth={2.6} />}>Une autre série</Button>
              {hasLesson ? (
                <Link href={`/cours/${unitId}`} className="btn btn-soft btn-block"><BookOpen size={18} strokeWidth={2.6} /><span>Revoir le cours</span></Link>
              ) : null}
              <Link href={`/reviser/${subject}`} className="btn btn-ghost btn-block"><span>Retour à la matière</span><ArrowRight size={18} strokeWidth={2.6} /></Link>
            </div>
          </section>
        ) : activity ? (
          <>
            <div className="stage-row">
              <p className="stage-bar">Entraînement<span aria-hidden="true"> · </span><strong>{title}</strong></p>
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
        ) : (
          <p className="notice">Aucun exercice disponible pour ce chapitre.</p>
        )}
      </main>
    </div>
  );
}
