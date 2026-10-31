"use client";

import { ArrowRight, BookOpenText, CalendarRange, ChevronRight, Compass, Flame, GraduationCap, Link2, PiggyBank, Play, Plus, Target, Timer, Trophy } from "lucide-react";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { TodayCard } from "@/components/home/today";
import { RewardArt } from "@/components/rewards/parts";
import { ReviewList } from "@/components/programme/side";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { subStyle } from "@/components/ui/subject-icon";
import { isCardDue } from "@/lib/bac/francais";
import { isoDay } from "@/lib/coach/planner";
import { TODAY, currentHoliday, demoNow, frDate, parseDay, shortDay } from "@/lib/content/calendar";
import { CAPSULES, findExam, findSession } from "@/lib/content/catalog";
import { SUBJECTS } from "@/lib/content/meta";
import { TODAY_INDEX, WEEK } from "@/lib/content/mock";
import { prevLevel } from "@/lib/curriculum";
import { cx } from "@/lib/cx";
import { epreuvesOf } from "@/lib/epreuves";
import { getTrack } from "@/lib/explore/tracks";
import { challengeStates, frEuros, reward, rewardPoints, spendable } from "@/lib/rewards";
import { homeworkOf, minutesToday, useStore, useStreak } from "@/lib/store";

export function HomeScreen() {
  const { state } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const p = state.profile;
  const w = state.wallet;
  const streak = useStreak();
  const homework = homeworkOf(state);
  const week = WEEK.map((d, i) => (i === TODAY_INDEX ? { ...d, minutes: d.minutes + minutesToday(state) } : d));
  const maxMinutes = Math.max(...week.map((d) => d.minutes), 20);
  const weekMinutes = week.reduce((s, d) => s + d.minutes, 0);
  const streakLabel = `${streak.days} jour${streak.days > 1 ? "s" : ""} de suite`;
  const player = state.player;
  const playing = findSession(player?.sessionId);
  const exam = state.exam;
  const examTitle = findExam(exam?.examId)?.title ?? "contrôle blanc";
  const holiday = currentHoliday();
  const available = spendable(w);
  const goal = reward(w.goalId);
  const goalPct = Math.min(100, Math.round((available / rewardPoints(goal)) * 100));
  const challenge = challengeStates(w, prevLevel(p.grade)).find((c) => !c.done);
  const day = isoDay(demoNow());
  const bacDue = state.bac.textes.filter((t) => isCardDue(t.card, day)).length;
  const epreuves = epreuvesOf(p.grade);
  const capsule = CAPSULES.find((c) => !state.explore[c.id]) ?? CAPSULES[0]!;
  const track = getTrack(capsule.track);

  return (
    <div className="home">
      <header className="home-top">
        <div className="hello">
          <p className="muted small date">{frDate(TODAY)}</p>
          <h1 className="h1">Salut {p.pseudo}</h1>
        </div>
        <div className="stat-pills">
          <span className="stat-pill" aria-label={streakLabel}>
            <Flame size={18} strokeWidth={2.4} /> {streak.days}
          </span>
          <Link href="/cagnotte" className="stat-pill stat-pill-wallet" aria-label={`Ta cagnotte : ${frEuros(available)}`}>
            <PiggyBank size={18} strokeWidth={2.4} /> {frEuros(available)}
          </Link>
        </div>
      </header>

      <div className="home-grid">
        <div className="home-main">
          {player || exam ? (
            <Link href={player ? `/seance/${player.sessionId}/jouer` : `/controle/${exam?.examId}`} className="resume-card">
              <span className="resume-icon">{player ? <Play size={22} strokeWidth={2.6} /> : <Timer size={22} strokeWidth={2.6} />}</span>
              <span className="resume-main">
                <strong>{player ? `Reprendre ${playing?.notion ?? "ta séance"}` : `Reprendre : ${examTitle}`}</strong>
                <span>{player ? `Exercice ${player.index + 1} sur ${playing?.activityCount ?? player.index + 1}` : "Le chrono continue"}</span>
              </span>
              <ArrowRight size={22} strokeWidth={2.6} />
            </Link>
          ) : null}

          {holiday ? (
            <p className="holiday-line">
              <CalendarRange size={18} strokeWidth={2.4} />
              <span><strong>Vacances de la {holiday.label}</strong> · rentrée {frDate(holiday.back)}</span>
            </p>
          ) : null}

          <TodayCard />

          <section className="block" aria-labelledby="next-title">
            <h2 id="next-title" className="h2">À venir</h2>
            <ul className="upcoming" role="list">
              {homework.map((hw) => {
                const d = shortDay(parseDay(hw.due));
                const href = hw.sessionId ? `/seance/${hw.sessionId}${hw.examMode ? "?mode=controle" : ""}` : null;
                const inner = (
                  <>
                    <span className="up-date bg-sub" style={subStyle(hw.subject)}>
                      <span>{d.day}</span>
                      <strong>{d.num}</strong>
                    </span>
                    <span className="up-kind">
                      {hw.examMode ? "Contrôle blanc" : hw.kind} · {SUBJECTS[hw.subject].short}
                      {hw.source === "ent" && p.entLinked ? <Link2 size={13} strokeWidth={2.6} aria-label="depuis l'ENT" /> : null}
                    </span>
                    <strong className="up-title">{hw.title}</strong>
                  </>
                );
                return (
                  <li key={hw.id}>
                    {href ? <Link href={href} className="up-card">{inner}</Link> : <div className="up-card is-static">{inner}</div>}
                  </li>
                );
              })}
              {p.grade === "1re" ? (
                <li>
                  <Link href="/bac-francais" className="up-card is-bac">
                    <span className="up-icon"><BookOpenText size={22} strokeWidth={2.4} /></span>
                    <span className="up-kind">Bac de français</span>
                    <strong className="up-title">{state.bac.textes.length} texte{state.bac.textes.length > 1 ? "s" : ""}{bacDue ? ` · ${bacDue} à revoir` : ""}</strong>
                  </Link>
                </li>
              ) : null}
              {epreuves.length ? (
                <li>
                  <Link href="/epreuves" className="up-card is-exam">
                    <span className="up-icon"><GraduationCap size={22} strokeWidth={2.4} /></span>
                    <span className="up-kind">Épreuves blanches</span>
                    <strong className="up-title">{epreuves.map((e) => e.short).join(", ")}</strong>
                  </Link>
                </li>
              ) : null}
              <li>
                <button type="button" className="up-card is-add" onClick={() => setAddOpen(true)}>
                  <span className="up-icon"><Plus size={22} strokeWidth={2.6} /></span>
                  <strong className="up-title">Ajouter un devoir</strong>
                </button>
              </li>
            </ul>
          </section>

          <section className="block" aria-labelledby="explore-title">
            <div className="block-head">
              <h2 id="explore-title" className="h2">Pour le plaisir</h2>
              <Link href="/explorer" className="text-btn">Explorer</Link>
            </div>
            <Link href={`/explorer/${capsule.id}`} className="explore-teaser" style={{ "--track": track.color, "--track-ink": track.ink } as CSSProperties}>
              <span className="explore-teaser-icon"><Compass size={24} strokeWidth={2.4} /></span>
              <span className="explore-teaser-main">
                <span className="explore-teaser-kicker">{track.title} · {capsule.minutes} min</span>
                <strong>{capsule.title}</strong>
              </span>
              <ChevronRight size={24} strokeWidth={2.6} />
            </Link>
          </section>
        </div>

        <aside className="home-side">
          <section className="block block-first" aria-labelledby="wallet-title">
            <h2 id="wallet-title" className="sr-only">Ta cagnotte</h2>
            <Link href="/cagnotte" className="wallet-mini">
              <span className="wallet-mini-top">
                <span><PiggyBank size={18} strokeWidth={2.6} /> Ta cagnotte</span>
                <ChevronRight size={20} />
              </span>
              <strong className="wallet-mini-amount">{frEuros(available)}</strong>
              <span className="wallet-mini-goal">
                <RewardArt r={goal} />
                <span>
                  <span className="wallet-mini-label"><Target size={14} strokeWidth={2.8} /> {goal.title} {goal.euros} €</span>
                  <span className="goal-bar"><span style={{ width: `${goalPct}%` }} /></span>
                </span>
                <span className="wallet-mini-pct">{goalPct} %</span>
              </span>
              {challenge ? (
                <span className="wallet-mini-challenge">
                  <Trophy size={16} strokeWidth={2.6} /> {challenge.challenge.title(prevLevel(p.grade))} · {challenge.value}/{challenge.challenge.goal} · <strong>+{challenge.challenge.points}</strong>
                </span>
              ) : null}
            </Link>
          </section>

          <ReviewList reviews={state.reviews} title="À revoir" />

          <section className="block" aria-labelledby="week-title">
            <div className="block-head">
              <h2 id="week-title" className="h2">Ta semaine</h2>
              <span className="muted small">{weekMinutes} min</span>
            </div>
            <div className="week" role="img" aria-label={`Minutes de révision par jour : ${week.map((d) => d.minutes).join(", ")}`}>
              {week.map((d, i) => (
                <div key={i} className={cx("week-day", i === TODAY_INDEX && "is-today", i > TODAY_INDEX && "is-future")}>
                  <span className="week-bar">
                    <span style={{ height: `${Math.max(d.minutes ? 12 : 4, (d.minutes / maxMinutes) * 100)}%` }} className={d.minutes ? "is-filled" : ""} />
                  </span>
                  <span className="week-label">{d.day}</span>
                </div>
              ))}
            </div>
            <p className="muted small week-note">
              <Flame size={15} strokeWidth={2.4} /> {streakLabel}
            </p>
          </section>
        </aside>
      </div>

      <Sheet open={addOpen} title="Ajouter un devoir" onClose={() => setAddOpen(false)}>
        <p className="sheet-text">Dans l'appli finale : tu choisis la matière, tu écris le titre du devoir (« DM Thalès ») et LearnWard te propose la notion correspondante du programme.</p>
        <Button block onClick={() => setAddOpen(false)}>Compris</Button>
      </Sheet>
    </div>
  );
}
