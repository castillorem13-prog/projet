"use client";

import { Ellipsis, Flag, Info, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { ActivityEnvContext, type ActivityEnv } from "@/components/activities/env";
import { defaultErrorType } from "@/lib/coach/diagnose";
import { methodsForSession } from "@/lib/coach/methods";
import { LANG_CODE, isLang } from "@/lib/coach/oral";
import { ChoiceActivity } from "@/components/activities/choice";
import { ClassifyActivity } from "@/components/activities/classify";
import { DialogueActivity } from "@/components/activities/dialogue";
import { OrderActivity } from "@/components/activities/order";
import { ProblemActivity } from "@/components/activities/problem";
import { SpotErrorActivity } from "@/components/activities/spot-error";
import { WorkedActivity } from "@/components/activities/worked";
import { WritingActivity } from "@/components/activities/writing";
import { SessionIntro } from "@/components/session/session-intro";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { Passion } from "@/lib/content/passions";
import { getSession } from "@/lib/content/sessions";
import { shownActivity } from "@/lib/content/sponsored";
import { STAGES } from "@/lib/content/types";
import { cx } from "@/lib/cx";
import { useFx } from "@/lib/fx";
import { buildResult, type ItemResult } from "@/lib/session-result";
import { SPONSOR_DAILY_CAP, partner, pointsToday } from "@/lib/rewards";
import { applyResult, useSessionPassions, useStore } from "@/lib/store";

const REPORT_REASONS = ["La bonne réponse me semble fausse", "L'énoncé n'est pas clair", "Une faute de frappe", "Autre chose"];

export function PlayerScreen({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const fx = useFx();
  const session = getSession(sessionId);
  const passions = useSessionPassions();
  const { state, update } = useStore();
  const progress = state.player?.sessionId === sessionId ? state.player : null;
  const [intro, setIntro] = useState(() => !progress || (progress.index === 0 && progress.results.length === 0));
  const [sheet, setSheet] = useState<"exit" | "report" | "sponsor" | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [reported, setReported] = useState(false);
  const [done, setDone] = useState(false);
  const [gate, setGate] = useState(false);

  const index = progress?.index ?? 0;
  const results = progress?.results ?? [];
  const shifts = progress?.shifts ?? {};
  const base = session.activities[index];
  // Exercice partenaire : version écrite avec une enseigne, sauf si le parent l'a désactivée.
  const shown = base ? shownActivity(session, base, state.wallet.parent.sponsored !== false) : undefined;
  const activity = shown?.activity;
  const sponsor = shown?.sponsor;
  const endIntro = useCallback(() => setIntro(false), []);
  // Méthodes actives pour cette matière, transmises aux exercices (modèles en barres, oral d'abord…).
  const env = useMemo<ActivityEnv>(
    () => ({ methods: methodsForSession(session.subject, session.unitId, state.evidence), speechLang: isLang(session.subject) ? LANG_CODE[session.subject] : undefined }),
    [session.subject, session.unitId, state.evidence],
  );

  useEffect(() => {
    // Nouvelle séance (ou arrivée directe sur la page) : on crée la progression sauvegardée.
    if (!progress) update((s) => ({ ...s, player: { sessionId, index: 0, results: [], shifts: {}, startedAt: Date.now() } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!activity || done) return null;

  const finish = (all: ItemResult[][]) => {
    const result = buildResult({ sessionId, items: all.flat(), levels: state.profile.levels, streak: state.profile.streak, pointsToday: pointsToday(state.wallet) });
    fx("complete");
    setDone(true);
    update((s) => ({ ...applyResult(s, result), player: null, lastResult: result }));
    router.replace(`/seance/${sessionId}/bilan`);
  };

  const complete = (raw: ItemResult[]) => {
    const typed = raw.map((i) => (i.status !== "first" && !i.errorType && activity ? { ...i, errorType: defaultErrorType(activity.kind, activity.stage) } : i));
    const items = sponsor ? typed.map((i) => ({ ...i, sponsor: { partnerId: sponsor.partnerId, bonus: sponsor.bonus } })) : typed;
    const all = [...results, items];
    const next = session.activities[index + 1];
    if (!next) return finish(all);
    update((s) => ({ ...s, player: { sessionId, index: index + 1, results: all, shifts, startedAt: progress?.startedAt ?? Date.now() } }));
    // Les trois défis sont faits : l'approfondissement reste un choix, jamais une étape imposée.
    if (next.stage === "extension" && activity.stage !== "extension") setGate(true);
    window.scrollTo({ top: 0 });
  };

  const segmentState = (i: number) => {
    const r = results[i];
    if (!r) return i === index ? "is-current" : "";
    if (r.every((x) => x.status === "first")) return "is-ok";
    if (r.some((x) => x.status === "missed")) return "is-missed";
    return "is-retry";
  };

  const n = passions.length;
  const passion = passions[(index + (shifts[index] ?? 0)) % n] as Passion;
  const onSwap =
    n > 1
      ? () => update((s) => (s.player ? { ...s, player: { ...s.player, shifts: { ...s.player.shifts, [index]: (s.player.shifts[index] ?? 0) + 1 } } } : s))
      : undefined;
  const reviewLabel = session.reviewLabels[activity.id] ?? session.notion;

  const common = { passion, onSwap, reviewLabel, seed: index, onComplete: complete };

  if (intro) {
    return (
      <SessionIntro
        passions={passions}
        formats={new Set(session.activities.map((a) => a.kind)).size}
        subject={session.subject}
        personal={!session.fixedNote}
        onDone={endIntro}
      />
    );
  }

  return (
    <div className="focus focus-player">
      <header className="topbar">
        <div className="topbar-inner">
          <button type="button" className="icon-btn" onClick={() => setSheet("exit")} aria-label="Faire une pause">
            <X size={24} />
          </button>
          <div className="segments" role="progressbar" aria-valuemin={1} aria-valuemax={session.activities.length} aria-valuenow={index + 1} aria-label={`Exercice ${index + 1} sur ${session.activities.length}`}>
            {session.activities.map((a, i) => (
              <span key={a.id} className={cx("segment", segmentState(i), a.stage === "extension" && "is-extra")} />
            ))}
          </div>
          <span className="topbar-count num">{index + 1}/{session.activities.length}</span>
          <button type="button" className="icon-btn" onClick={() => { setReported(false); setReason(null); setSheet("report"); }} aria-label="Signaler une erreur dans l'exercice">
            <Ellipsis size={24} />
          </button>
        </div>
      </header>

      <main id="main" className="player-main" tabIndex={-1}>
        {gate ? (
          <section className="gate" aria-labelledby="gate-title">
            <span className="gate-icon"><Flag size={26} strokeWidth={2.4} /></span>
            <h1 id="gate-title" className="display gate-title">Les trois défis sont faits.</h1>
            <p className="gate-text">Il reste un approfondissement <strong>facultatif</strong> : {STAGES.extension.label.toLowerCase()}. Il ne compte pas dans le programme exigé et ne pénalise pas ta maîtrise si tu le rates.</p>
            <div className="gate-actions">
              <Button block icon={<Sparkles size={18} />} onClick={() => setGate(false)}>Essayer le bonus</Button>
              <Button block variant="ghost" onClick={() => finish(results)}>Terminer la séance</Button>
            </div>
          </section>
        ) : (
          <>
            <div className="stage-row">
              <p className={cx("stage-bar", activity.stage === "extension" && "is-extra")}>
                {activity.stage === "extension" ? "Facultatif" : `Défi ${STAGES[activity.stage].n} sur 3`}
                <span aria-hidden="true"> · </span>
                <strong>{STAGES[activity.stage].label}</strong>
              </p>
              {sponsor ? (
                <button type="button" className="sponsor-chip" style={{ "--art": partner(sponsor.partnerId).color } as CSSProperties} onClick={() => setSheet("sponsor")}>
                  <span className="sponsor-mark" aria-hidden="true">{partner(sponsor.partnerId).mark}</span>
                  <span>
                    Exercice partenaire · {partner(sponsor.partnerId).name} <strong>+{sponsor.bonus} points</strong>
                  </span>
                  <Info size={15} strokeWidth={2.6} aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <ActivityEnvContext.Provider value={env}>
            {activity.kind === "problem" ? (
          <ProblemActivity key={activity.id} activity={activity} {...common} />
        ) : activity.kind === "order" ? (
          <OrderActivity key={activity.id} activity={activity} {...common} />
        ) : activity.kind === "spot-error" ? (
          <SpotErrorActivity key={activity.id} activity={activity} {...common} />
        ) : activity.kind === "classify" ? (
          <ClassifyActivity key={activity.id} activity={activity} {...common} />
        ) : activity.kind === "writing" ? (
          <WritingActivity key={activity.id} activity={activity} {...common} />
        ) : activity.kind === "dialogue" ? (
          <DialogueActivity key={activity.id} activity={activity} {...common} />
        ) : activity.kind === "worked" ? (
          <WorkedActivity key={activity.id} activity={activity} {...common} />
        ) : (
          <ChoiceActivity key={activity.id} activity={activity} {...common} />
        )}
            </ActivityEnvContext.Provider>
          </>
        )}
      </main>

      <Sheet open={sheet === "exit"} title="Faire une pause ?" onClose={() => setSheet(null)}>
        <p className="sheet-text">Tu en es à l'exercice {index + 1} sur {session.activities.length}. Ta progression est gardée : tu reprendras ici depuis l'accueil.</p>
        <div className="sheet-actions">
          <Button block onClick={() => setSheet(null)}>Continuer la séance</Button>
          <Button block variant="ghost" onClick={() => router.push("/")}>Faire une pause</Button>
        </div>
      </Sheet>

      <Sheet open={sheet === "sponsor"} title="Exercice partenaire" onClose={() => setSheet(null)}>
        {sponsor ? (
          <>
            <p className="sheet-text">
              Cet exercice est proposé avec <strong>{partner(sponsor.partnerId).name}</strong>, une enseigne partenaire de la cagnotte (fictive dans la démo). En le terminant, tu reçois <strong>{sponsor.bonus} points</strong> offerts par le partenaire, que ta réponse soit juste ou non.
            </p>
            <ul className="sheet-list">
              <li>Même difficulté, même compétence et même correction que la version sans marque.</li>
              <li>Le partenaire ne voit ni tes réponses, ni tes résultats, ni ton nom.</li>
              <li>Il ne change rien à ta maîtrise, et rien ne t'oblige à acheter quoi que ce soit.</li>
              <li>Au plus {SPONSOR_DAILY_CAP} points de bonus partenaires par jour. Ton parent peut désactiver ces exercices.</li>
            </ul>
            <Button block onClick={() => setSheet(null)}>Revenir à l'exercice</Button>
          </>
        ) : null}
      </Sheet>

      <Sheet open={sheet === "report"} title="Signaler une erreur" onClose={() => setSheet(null)}>
        {reported ? (
          <>
            <p className="sheet-text">Merci. Ton signalement aide à corriger l'exercice pour tout le monde. (Démo : rien n'est envoyé.)</p>
            <Button block onClick={() => setSheet(null)}>Revenir à l'exercice</Button>
          </>
        ) : (
          <>
            <p className="sheet-text">Qu'est-ce qui ne va pas dans cet exercice ?</p>
            <div className="report-list" role="radiogroup">
              {REPORT_REASONS.map((r) => (
                <button key={r} type="button" role="radio" aria-checked={reason === r} className={cx("report-option", reason === r && "is-on")} onClick={() => setReason(r)}>
                  {r}
                </button>
              ))}
            </div>
            <Button block disabled={!reason} onClick={() => setReported(true)}>Envoyer le signalement</Button>
          </>
        )}
      </Sheet>
    </div>
  );
}
