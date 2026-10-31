"use client";

import { BadgeCheck, CircleAlert, FlaskConical, Lock, LockOpen, RotateCcw, Rocket } from "lucide-react";
import type { ReactNode } from "react";
import { subStyle } from "@/components/ui/subject-icon";
import { HOLIDAYS, TODAY, YEAR_START, frDate, parseDay, yearPosition } from "@/lib/content/calendar";
import { getLevel } from "@/lib/curriculum/levels";
import type { ClassProgress, Level, MasteryState, SubjectId, VerificationStatus } from "@/lib/curriculum/types";
import { VERIFICATION_LABEL } from "@/lib/curriculum/sources";
import { MASTERY } from "@/lib/learning/mastery";
import type { UnitStatus } from "@/lib/curriculum";
import { cx } from "@/lib/cx";

/**
 * Jauge de maîtrise en cinq marches (en découverte → maîtrise durable), à la couleur de la matière.
 * Elle affiche un état, jamais un pourcentage : la maîtrise n'est pas une moyenne de points.
 */
export function MasteryMeter({ state, subject, label = true, detail = false }: { state: MasteryState; subject: SubjectId; label?: boolean; detail?: boolean }) {
  const rank = MASTERY[state].rank;
  return (
    <span className={cx("meter", `is-${state}`)} style={subStyle(subject)}>
      <span className="meter-steps" role="img" aria-label={`Maîtrise : ${MASTERY[state].label}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={cx("meter-step", i <= rank && "is-on")} />
        ))}
      </span>
      {label ? <span className="meter-label">{MASTERY[state].label}</span> : null}
      {detail ? <span className="meter-detail">{MASTERY[state].detail}</span> : null}
    </span>
  );
}

/** Étiquette du mode : révision (année précédente) ou avance (année suivante). */
export function ModeChip({ mode, level }: { mode: "revision" | "avance"; level: Level }) {
  return (
    <span className={cx("mode-chip", `is-${mode}`)}>
      {mode === "revision" ? <RotateCcw size={15} strokeWidth={2.6} /> : <Rocket size={15} strokeWidth={2.6} />}
      {mode === "revision" ? `Révision ${getLevel(level).label}` : `Avance ${getLevel(level).label}`}
    </span>
  );
}

export function LockIcon({ open }: { open: boolean }) {
  return <span className={cx("lock", open && "is-open")}>{open ? <LockOpen size={18} strokeWidth={2.4} /> : <Lock size={18} strokeWidth={2.4} />}</span>;
}

export const STATUS_LABEL: Record<UnitStatus, string> = { vu: "Vu en classe", "en-cours": "En cours en classe", "a-venir": "À venir" };

/** Statut éditorial d'un contenu : vérifié, recoupé, à relire, fictif. */
export function VerifyBadge({ status, short }: { status: VerificationStatus; short?: boolean }) {
  const ok = status === "verified_official" || status === "cross_checked";
  const mock = status === "illustrative_mock";
  return (
    <span className={cx("verify", `is-${status}`)} title={VERIFICATION_LABEL[status]}>
      {ok ? <BadgeCheck size={14} strokeWidth={2.6} /> : mock ? <FlaskConical size={14} strokeWidth={2.6} /> : <CircleAlert size={14} strokeWidth={2.6} />}
      {short ? SHORT[status] : VERIFICATION_LABEL[status]}
    </span>
  );
}
const SHORT: Record<VerificationStatus, string> = {
  verified_official: "Texte officiel relu",
  cross_checked: "Recoupé",
  needs_review: "À relire",
  illustrative_mock: "Fictif",
  extension_not_required: "Hors attendus",
};

/** Barre segmentée : un segment par unité, selon l'avancement de la classe et l'état de maîtrise. */
export function UnitSegments({ progress, subject, mastery }: { progress: ClassProgress | undefined; subject: SubjectId; mastery: (id: string) => MasteryState }) {
  if (!progress) return null;
  const c = progress.current ? progress.order.indexOf(progress.current) : -1;
  return (
    <span className="segs" style={subStyle(subject)} aria-hidden="true">
      {progress.order.map((id, i) => {
        const st = i < c ? "vu" : i === c ? "en-cours" : "a-venir";
        const m = MASTERY[mastery(id)].rank;
        return <span key={id} className={cx("seg", `is-${st}`, st !== "a-venir" && m >= 4 && "is-solid", st !== "a-venir" && m <= 2 && "is-weak")} />;
      })}
    </span>
  );
}

const MONTHS = [
  { label: "sept", date: new Date(2026, 8, 1) },
  { label: "oct", date: new Date(2026, 9, 1) },
  { label: "nov", date: new Date(2026, 10, 1) },
  { label: "déc", date: new Date(2026, 11, 1) },
  { label: "janv", date: new Date(2027, 0, 1) },
  { label: "févr", date: new Date(2027, 1, 1) },
  { label: "mars", date: new Date(2027, 2, 1) },
  { label: "avr", date: new Date(2027, 3, 1) },
  { label: "mai", date: new Date(2027, 4, 1) },
  { label: "juin", date: new Date(2027, 5, 1) },
];

const pct = (d: Date) => `${(yearPosition(d) * 100).toFixed(2)}%`;

/** Frise de l'année : vacances, aujourd'hui, et les examens du niveau (avec leur statut : officiel ou à vérifier). */
export function YearTrack({ level, children }: { level: Level; children?: ReactNode }) {
  const exams = getLevel(level).exams ?? [];
  const label = [`Année scolaire : nous sommes le ${frDate(TODAY)}`, ...exams.map((e) => `${e.label} ${e.verified ? "le" : "vers le"} ${frDate(parseDay(e.when))}`)].join(", ");
  return (
    <figure className="year">
      <div className="year-bar" role="img" aria-label={`${label}.`}>
        <span className="year-fill" style={{ width: pct(TODAY) }} />
        {HOLIDAYS.map((h) => (
          <span key={h.label} className="year-holiday" style={{ left: pct(h.start), width: `calc(${pct(h.back)} - ${pct(h.start)})` }} />
        ))}
        {exams.map((e, i) => (
          <span key={e.label} className={cx("year-mark", i === exams.length - 1 ? "is-brevet" : "is-blanc", !e.verified && i === exams.length - 1 && "is-tbc")} style={{ left: pct(parseDay(e.when)) }} />
        ))}
        <span className="year-now" style={{ left: pct(TODAY) }} />
      </div>
      <ol className="year-months" aria-hidden="true">
        {MONTHS.map((m) => (
          <li key={m.label} style={{ left: m.date <= YEAR_START ? "0%" : pct(m.date) }}>{m.label}</li>
        ))}
      </ol>
      <figcaption className="year-legend">
        <span><i className="lg-now" /> Aujourd'hui</span>
        <span><i className="lg-holiday" /> Vacances</span>
        {exams.map((e, i) => (
          <span key={e.label}>
            <i className={i === exams.length - 1 ? "lg-brevet" : "lg-blanc"} /> {e.label}
            {e.verified ? "" : i === exams.length - 1 ? " (date à confirmer)" : " (date fictive)"}
          </span>
        ))}
        {children}
      </figcaption>
    </figure>
  );
}
