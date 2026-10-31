"use client";

import { ArrowRight, Clock3, FileCheck2, Mic, PenLine, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { SectionTabs } from "@/components/shell/section-tabs";
import { subStyle } from "@/components/ui/subject-icon";
import { EXAM_LIST } from "@/lib/content/catalog";
import { getLevel } from "@/lib/curriculum/levels";
import { cx, frNumber } from "@/lib/cx";
import { epreuvesOf, type Epreuve } from "@/lib/epreuves";
import { useStore } from "@/lib/store";

const ICON = { auto: FileCheck2, redaction: PenLine, oral: Mic } as const;
const duration = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60}` : ""}` : `${m} min`);

/** Épreuves blanches de la classe : format officiel, sujets au niveau de l'élève. */
export function EpreuvesScreen() {
  const { state } = useStore();
  const level = state.profile.grade;
  const list = epreuvesOf(level);
  const controles = EXAM_LIST.filter((e) => !e.title && e.grade === level);
  const blancs = state.bac.blancs ?? [];

  return (
    <div className="epreuves">
      <SectionTabs />
      <header className="page-top">
        <p className="kicker">{getLevel(level).label}</p>
        <h1 className="h1">Épreuves blanches</h1>
      </header>

      {list.length ? (
        <ul className="epreuve-list">
          {list.map((e) => <EpreuveCard key={e.id} e={e} last={[...blancs].reverse().find((b) => (e.id === "eaf-oral" ? b.kind === "oral" : e.id === "eaf-ecrit" ? b.kind === "ecrit" : b.kind === e.id))?.score} />)}
        </ul>
      ) : (
        <p className="notice notice-soft">Pas d'examen national en {getLevel(level).label}. Les contrôles blancs par chapitre sont dans chaque matière.</p>
      )}

      {controles.length ? (
        <section className="block" aria-labelledby="ctrl-title">
          <h2 id="ctrl-title" className="h2">Contrôles blancs par chapitre</h2>
          <ul className="epreuve-mini">
            {controles.map((c) => (
              <li key={c.id}>
                <Link href={`/controle/${c.id}`} className="epreuve-row" style={subStyle(c.subject)}>
                  <span className="epreuve-row-bar" aria-hidden="true" />
                  <span><strong>{c.notion}</strong><span className="muted small"> · {c.minutes} min</span></span>
                  <ArrowRight size={20} strokeWidth={2.6} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function EpreuveCard({ e, last }: { e: Epreuve; last?: number }) {
  const Icon = ICON[e.kind];
  return (
    <li className={cx("epreuve", `is-${e.kind}`)} style={subStyle(e.subject)}>
      <div className="epreuve-head">
        <span className="epreuve-icon"><Icon size={24} strokeWidth={2.4} /></span>
        <span className="epreuve-title">
          <strong>{e.title}</strong>
          <span><Clock3 size={14} strokeWidth={2.6} aria-hidden="true" /> {duration(e.minutes)}{last !== undefined ? ` · dernière note ${frNumber(last)}/20` : ""}</span>
        </span>
      </div>
      <ul className="epreuve-format">
        {e.format.map((f) => <li key={f}>{f}</li>)}
      </ul>
      <p className="epreuve-source"><ShieldCheck size={14} strokeWidth={2.6} aria-hidden="true" /> {e.source}{e.verification === "single_source" ? " · source unique, à recouper" : ""}</p>
      <Link href={e.href} className="btn btn-ink btn-block"><span>Commencer</span><ArrowRight size={20} strokeWidth={2.6} /></Link>
    </li>
  );
}
