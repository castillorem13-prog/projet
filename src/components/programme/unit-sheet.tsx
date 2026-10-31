"use client";

import { ArrowRight, Check, ExternalLink, MapPin, Target, Timer } from "lucide-react";
import Link from "next/link";
import { Sheet } from "@/components/ui/sheet";
import { SubjectChip } from "@/components/ui/subject-icon";
import { SESSION_LIST, findSession } from "@/lib/content/catalog";
import { SUBJECTS } from "@/lib/content/meta";
import { findUnit, levelRank, nextOf, sourceOf, statusIn, UNITS, type Unit } from "@/lib/curriculum";
import { getLevel } from "@/lib/curriculum/levels";
import { blockingNeeds, isUnlocked } from "@/lib/curriculum/modes";
import { getObjective } from "@/lib/curriculum/objectives";
import { MASTERY, UNLOCK_STATE } from "@/lib/learning/mastery";
import { setCurrentUnit, useMastery, useStore } from "@/lib/store";
import { LockIcon, MasteryMeter, ModeChip, STATUS_LABEL, VerifyBadge } from "./parts";

/** Une séance jouable de la même matière, pour montrer le format quand celle du chapitre n'est pas rédigée. */
function sampleFor(u: Unit) {
  const same = UNITS.filter((x) => x.subject === u.subject && x.sessionId).sort((a, b) => Math.abs(levelRank(a.level) - levelRank(u.level)) - Math.abs(levelRank(b.level) - levelRank(u.level)));
  return findSession(same[0]?.sessionId) ?? SESSION_LIST.find((s) => s.subject === u.subject);
}

/**
 * Fiche d'une unité du programme : ce qu'elle contient, d'où elle vient (programme officiel et statut de vérification),
 * ce sur quoi elle s'appuie, ce qu'elle prépare, et comment la travailler.
 */
export function UnitSheet({ unit, onClose, onOpen }: { unit: Unit | null; onClose: () => void; onOpen: (u: Unit) => void }) {
  const { state, update } = useStore();
  const mastery = useMastery();
  if (!unit) return null;
  const level = state.profile.grade;
  const rel = levelRank(unit.level) - levelRank(level);
  const progress = state.progress[unit.subject];
  const status = rel === 0 ? statusIn(progress, unit.id) : null;
  const isCurrent = rel === 0 && progress?.current === unit.id;
  const m = mastery(unit.id);
  const locked = rel > 0 && !isUnlocked(unit, level, mastery);
  const blocking = rel > 0 ? blockingNeeds(unit, level, mastery) : [];
  const session = findSession(unit.sessionId);
  const needs = (unit.needs ?? []).map(findUnit).filter((u): u is Unit => Boolean(u));
  const next = nextOf(unit.id);
  const src = sourceOf(unit);
  const objective = unit.objectiveIds?.map(getObjective).find(Boolean);
  const sample = session ? undefined : sampleFor(unit);
  const lvl = getLevel(unit.level).label;
  const startLabel = rel < 0 ? "Revoir cette base" : rel > 0 ? "Prendre de l'avance" : status === "a-venir" ? "Découvrir avant la classe" : "Préparer la séance";

  return (
    <Sheet open title={unit.title} onClose={onClose}>
      <div className="csheet">
        <div className="csheet-tags">
          <SubjectChip subject={unit.subject}>{SUBJECTS[unit.subject].short}, {lvl}</SubjectChip>
          {rel < 0 ? <ModeChip mode="revision" level={unit.level} /> : rel > 0 ? <ModeChip mode="avance" level={unit.level} /> : null}
          <span className="chip chip-sm chip-outline">{status ? STATUS_LABEL[status] : unit.domain}</span>
        </div>

        {!locked ? <MasteryMeter state={m} subject={unit.subject} detail /> : null}

        {objective ? (
          <div className="csheet-objective">
            <Target size={18} strokeWidth={2.4} />
            <p>
              <strong>Objectif :</strong> {objective.observableOutcome}
            </p>
          </div>
        ) : null}

        <div className="csheet-block">
          <h3 className="csheet-title">Au programme</h3>
          <ul className="csheet-notions">
            {unit.notions.map((n) => (
              <li key={n}><Check size={16} strokeWidth={3} /> {n}</li>
            ))}
          </ul>
        </div>

        {needs.length ? (
          <div className="csheet-block">
            <h3 className="csheet-title">{rel > 0 ? `Se prépare avec ta ${getLevel(level).label}` : "S'appuie sur"}</h3>
            <ul className="csheet-links">
              {needs.map((n) => (
                <li key={n.id}>
                  <button type="button" className="csheet-link" onClick={() => onOpen(n)}>
                    <span className="csheet-link-main">
                      <strong>{n.title}</strong>
                      <span className="muted small">{SUBJECTS[n.subject].short}, {getLevel(n.level).label}</span>
                      <MasteryMeter state={mastery(n.id)} subject={n.subject} />
                    </span>
                    <ArrowRight size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {next.length && rel <= 0 ? (
          <div className="csheet-block">
            <h3 className="csheet-title">Ce chapitre prépare</h3>
            <ul className="csheet-links">
              {next.slice(0, 4).map((n) => {
                const ahead = levelRank(n.level) > levelRank(level);
                const open = ahead ? isUnlocked(n, level, mastery) : true;
                return (
                  <li key={n.id}>
                    <button type="button" className="csheet-link" onClick={() => onOpen(n)}>
                      {ahead ? <LockIcon open={open} /> : null}
                      <span className="csheet-link-main">
                        <strong>{n.title}</strong>
                        <span className="muted small">
                          {SUBJECTS[n.subject].short}, {getLevel(n.level).label}
                          {ahead ? (open ? " · ouvert : tu peux prendre de l'avance" : ` · s'ouvre au niveau « ${MASTERY[UNLOCK_STATE].label} »`) : ""}
                        </span>
                      </span>
                      <ArrowRight size={18} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {src ? (
          <div className="csheet-source">
            <p className="csheet-source-title">
              <span>Programme officiel</span>
              <VerifyBadge status={unit.verification} short />
            </p>
            <p>
              {src.title}. {src.reference}.
            </p>
            {rel === 0 ? <p className="muted small">L'ordre des chapitres est celui de {progress?.source === "ent_demo" ? "ta classe (ENT simulé)" : progress?.source === "student" ? "ta classe, d'après toi" : "LearnWard, à confirmer"} : ton professeur reste libre de sa progression.</p> : null}
            <a className="text-btn" href={src.url} target="_blank" rel="noreferrer">
              Texte de référence <ExternalLink size={14} strokeWidth={2.6} />
            </a>
          </div>
        ) : null}

        <div className="csheet-actions">
          {locked ? (
            <p className="notice notice-soft">
              Ce chapitre de {lvl} s'ouvre quand {blocking.length > 1 ? "ces chapitres sont" : "ce chapitre est"} au niveau « {MASTERY[UNLOCK_STATE].label} » : {blocking.map((b) => `« ${b.title} »`).join(", ")}. Prendre de l'avance reste facultatif ; ton année passe d'abord.
            </p>
          ) : session ? (
            <>
              <Link href={`/seance/${session.id}`} className="btn btn-ink btn-block">
                <span>{startLabel}</span>
                <ArrowRight size={20} strokeWidth={2.6} />
              </Link>
              {session.examId ? (
                <Link href={`/seance/${session.id}?mode=controle`} className="btn btn-ghost btn-block">
                  <Timer size={18} strokeWidth={2.6} />
                  <span>Contrôle blanc de 30 min</span>
                </Link>
              ) : null}
            </>
          ) : (
            <>
              <p className="muted csheet-note">La séance de ce chapitre n'est pas encore rédigée dans le prototype. Dans l'appli, elle suit le même modèle : trois défis, indices progressifs, rappel espacé.</p>
              {sample ? (
                <Link href={`/seance/${sample.id}`} className="btn btn-ghost btn-block">
                  <span>Voir un exemple : {sample.notion}</span>
                  <ArrowRight size={20} strokeWidth={2.6} />
                </Link>
              ) : null}
            </>
          )}
          {rel === 0 && progress && !isCurrent ? (
            <button
              type="button"
              className="btn btn-soft btn-block"
              onClick={() => {
                update((s) => setCurrentUnit(s, unit.subject, unit.id));
                onClose();
              }}
            >
              <MapPin size={18} strokeWidth={2.6} />
              <span>C'est le chapitre en cours dans ma classe</span>
            </button>
          ) : null}
        </div>
      </div>
    </Sheet>
  );
}
