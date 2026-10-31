"use client";

import { CalendarClock, ChevronRight, RotateCcw, Timer } from "lucide-react";
import Link from "next/link";
import { BREVET, BREVET_BLANC, TODAY, daysBetween, frDate, parseDay, shortDay } from "@/lib/content/calendar";
import { findSession } from "@/lib/content/catalog";
import { SUBJECTS } from "@/lib/content/meta";
import { findUnit, type Level, type Review, type Unit } from "@/lib/curriculum";
import { getLevel } from "@/lib/curriculum/levels";
import { dueLabel } from "@/lib/learning/scheduler";
import { cx } from "@/lib/cx";
import { SubjectTile, subStyle } from "@/components/ui/subject-icon";

/** Carte d'examen du niveau : brevet en 3e (dates publiées), épreuves anticipées en 1re, bac en terminale (à vérifier). */
export function ExamCard({ level, entLinked }: { level: Level; entLinked: boolean }) {
  const info = getLevel(level);
  const exams = info.exams ?? [];
  if (!exams.length) return null;

  if (level === "3e") {
    const days = daysBetween(TODAY, BREVET.first);
    return (
      <section className="brevet-card block-first" aria-labelledby="exam-title">
        <p className="kicker">Brevet {BREVET.year}</p>
        <h2 id="exam-title" className="brevet-count">
          <strong>{days}</strong> jours
        </h2>
        <ul className="brevet-tests">
          {BREVET.tests.map((t) => {
            const d = shortDay(t.day);
            return (
              <li key={t.subject}>
                <span className="brevet-day"><span>{d.day}</span><strong>{d.num}</strong></span>
                <span>
                  <strong>{t.subject}</strong>
                  <span className="muted small">{t.detail}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="muted small brevet-rule">Juin 2027. {BREVET.rule}</p>
        {entLinked ? (
          <p className="brevet-blanc">
            <CalendarClock size={16} strokeWidth={2.6} /> {BREVET_BLANC.label} au collège : {frDate(BREVET_BLANC.day)} (ENT simulé)
          </p>
        ) : null}
        <Link href="/seance/fonctions-affines-3e?mode=controle" className="btn btn-yellow btn-block btn-md">
          <Timer size={18} strokeWidth={2.6} />
          <span>S'entraîner en 30 minutes</span>
        </Link>
      </section>
    );
  }

  return (
    <section className="brevet-card block-first" aria-labelledby="exam-title">
      {exams.map((e, i) => (
        <div key={e.label} className="exam-item">
          <p className="kicker">{e.label}</p>
          <h2 id={i === 0 ? "exam-title" : undefined} className="brevet-count">
            {e.verified ? (
              <>
                <strong>{daysBetween(TODAY, parseDay(e.when))}</strong> jours
              </>
            ) : (
              <strong>Juin 2027</strong>
            )}
          </h2>
          <p className="muted small brevet-rule">{e.detail}</p>
        </div>
      ))}
      <p className="exam-tbc">Les dates précises seront reprises du calendrier officiel des examens dès sa vérification.</p>
    </section>
  );
}

/** Rappels espacés à venir, avec la raison de chacun. */
export function ReviewList({ reviews, limit = 3, onOpen, title = "À revoir" }: { reviews: Review[]; limit?: number; onOpen?: (u: Unit) => void; title?: string }) {
  const rows = [...reviews]
    .sort((a, b) => a.due.localeCompare(b.due))
    .map((r) => ({ r, u: findUnit(r.unitId) }))
    .filter((x): x is { r: Review; u: Unit } => Boolean(x.u))
    .slice(0, limit);
  if (!rows.length) return null;
  return (
    <section className="block" aria-labelledby="rv-title">
      <div className="block-head">
        <h2 id="rv-title" className="h2">{title}</h2>
        <span className="muted small">Rappels espacés</span>
      </div>
      <ul className="review-list">
        {rows.map(({ r, u }) => {
          const session = findSession(u.sessionId);
          const due = daysBetween(TODAY, parseDay(r.due)) <= 0;
          const inner = (
            <>
              <SubjectTile subject={u.subject} size="sm" />
              <span className="review-main">
                <span className={cx("review-when", due && "is-due")}>
                  <RotateCcw size={13} strokeWidth={2.8} /> {dueLabel(r)} · {SUBJECTS[u.subject].short}, {getLevel(u.level).label}
                </span>
                <strong>{u.title}</strong>
                <span className="review-why">{r.reason}</span>
              </span>
              <ChevronRight size={20} className="review-go" />
            </>
          );
          return (
            <li key={r.unitId} style={subStyle(u.subject)}>
              {session ? (
                <Link href={`/seance/${session.id}`} className="review-row">{inner}</Link>
              ) : onOpen ? (
                <button type="button" className="review-row" onClick={() => onOpen(u)}>{inner}</button>
              ) : (
                <Link href={`/reviser/${u.subject}?unite=${u.id}`} className="review-row">{inner}</Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
