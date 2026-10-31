"use client";

import { ArrowRight, FileText, ListTree, PenLine, Plus, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { StimulusView } from "@/components/activities/stimulus";
import { CloseHome } from "@/components/coach/close-home";
import { Button } from "@/components/ui/button";
import { FocusPage } from "@/components/ui/focus-page";
import { EMPTY_DRAFT, draftKey, draftSeconds, parseDraft, togglePause, type Draft, type DraftMode } from "@/lib/bac/draft";
import { COMMENTAIRE, DESCARTES_LONG, DISSERTATIONS, ECRIT_GRID, EAF, OBJET_ORDER, OEUVRES, PHILO_GRID, PHILO_SUJETS, getOeuvre, parcoursOf } from "@/lib/bac/francais";
import { CONNECTORS, reviewWriting } from "@/lib/coach/writing";
import type { Stimulus as StimulusData } from "@/lib/content/types";
import { cx, frNumber } from "@/lib/cx";
import { useFx } from "@/lib/fx";
import { logBlanc, useStore } from "@/lib/store";
import { GridResult, PhaseClock, SelfGrid, gridScore, type GridItem } from "./parts";

interface Subject {
  id: string;
  type: "commentaire" | "dissertation" | "explication";
  title: string;
  consigne: string;
  text?: StimulusData;
  /** Rappel affiché avec le sujet (œuvre et parcours). */
  context?: string;
  pistes?: { problematique: string; axes: string[] };
}
/** Brouillon gardé sur l'appareil : les frappes sont regroupées, la dernière version est écrite avant de quitter. */
function useDraft(mode: DraftMode): [Draft, (next: Draft | ((d: Draft) => Draft)) => void] {
  const key = draftKey(mode);
  const [draft, setDraft] = useState<Draft>(() => {
    try {
      return parseDraft(window.localStorage.getItem(key));
    } catch {
      return EMPTY_DRAFT;
    }
  });
  const latest = useRef(draft);
  latest.current = draft;
  const write = useCallback(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(latest.current));
    } catch {
      /* stockage indisponible : le brouillon reste en mémoire */
    }
  }, [key]);
  useEffect(() => {
    const id = window.setTimeout(write, 400);
    return () => window.clearTimeout(id);
  }, [draft, write]);
  useEffect(() => {
    window.addEventListener("pagehide", write);
    return () => {
      window.removeEventListener("pagehide", write);
      write();
    };
  }, [write]);
  return [draft, setDraft];
}

/** Le chrono se redessine seul, chaque seconde : pas la copie, qui peut être longue. */
function DraftClock({ draft, minutes, label, onToggle }: { draft: Draft; minutes: number; label: string; onToggle: () => void }) {
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const running = !draft.pausedAt;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [running]);
  return <PhaseClock seconds={draftSeconds(draft, Date.now())} minutes={minutes} running={running} onToggle={onToggle} label={label} />;
}

const PARTS_MAX = 3;

/**
 * Écrit blanc en conditions : 4 heures, sujet au choix, plan puis copie. À la fin, des repères chiffrés sur la copie
 * (mots, citations, connecteurs, paragraphes), la grille de l'épreuve pour se noter, puis les pistes de correction.
 */
export function EcritBlanc({ mode }: { mode: DraftMode }) {
  const fx = useFx();
  const { state, update } = useStore();
  const bac = state.bac;
  const [draft, setDraft] = useDraft(mode);
  /** Copie rendue : le brouillon est libéré, on garde ce qu'il faut pour afficher le résultat. */
  const [handedIn, setHandedIn] = useState<Draft | null>(null);
  const work = handedIn ?? draft;
  const [tab, setTab] = useState<"sujet" | "plan" | "copie">("sujet");
  const [phase, setPhase] = useState<"choix" | "travail" | "grille" | "fin">(draft.subjectId ? "travail" : "choix");
  const [levels, setLevels] = useState<(number | null)[]>([]);

  const subjects: Subject[] =
    mode === "philo"
      ? [
          ...PHILO_SUJETS.map((t, i) => ({ id: `philo-${i}`, type: "dissertation" as const, title: t, consigne: "Dissertation." })),
          { id: "philo-explication", type: "explication", title: "Descartes, Discours de la méthode", consigne: "Expliquez le texte suivant.", text: DESCARTES_LONG },
        ]
      : [
          { id: COMMENTAIRE.id, type: "commentaire", title: "Victor Hugo, « Demain, dès l'aube… »", consigne: COMMENTAIRE.consigne, text: COMMENTAIRE.text, pistes: COMMENTAIRE.pistes },
          ...(bac.voie === "generale"
            ? (OBJET_ORDER.map((o) => getOeuvre(bac.oeuvres[o])).some(Boolean) ? OBJET_ORDER.map((o) => getOeuvre(bac.oeuvres[o])) : OEUVRES.filter((o) => o.voies.includes("generale")).slice(0, 3))
                .filter((o): o is NonNullable<typeof o> => Boolean(o))
                .map((o) => ({ id: `diss-${o.id}`, type: "dissertation" as const, title: DISSERTATIONS[o.id] ?? o.titre, consigne: "Dissertation.", context: `${o.auteur}, ${o.titre} · parcours « ${parcoursOf(o, bac.voie)} »` }))
            : []),
        ];
  const subject = subjects.find((s) => s.id === work.subjectId) ?? null;
  const grid: GridItem[] = mode === "philo" ? PHILO_GRID : subject?.type === "dissertation" ? ECRIT_GRID.dissertation : ECRIT_GRID.commentaire;
  const preferred = mode === "eaf" ? bac.ecrit : null;

  const copie = useDeferredValue(work.copie);
  const review = useMemo(() => reviewWriting(copie, [{ criterion: 0, kind: "words", words: CONNECTORS, label: "Connecteurs" }]), [copie]);
  const citations = (copie.match(/«[^»]{2,}»|"[^"]{2,}"|“[^”]{2,}”/g) ?? []).length;
  const paragraphs = copie.split(/\n+/).filter((p) => p.trim().length > 20).length;
  const connectors = review.criteria[0]?.found.length ?? 0;

  const top = (
    <>
      <CloseHome />
      <span className="topbar-title">{mode === "philo" ? "Philosophie blanche" : "Écrit de français blanc"}</span>
      <span />
    </>
  );

  const begin = (id: string) => {
    setDraft({ ...EMPTY_DRAFT, subjectId: id, startedAt: Date.now() });
    setHandedIn(null);
    setLevels([]);
    setTab("sujet");
    setPhase("travail");
  };
  const hand = () => {
    // Le chrono s'arrête quand la copie est rendue : le temps de la grille ne compte pas.
    setDraft((d) => (d.pausedAt ? d : togglePause(d, Date.now())));
    setPhase("grille");
    window.scrollTo({ top: 0 });
  };
  const finish = () => {
    const score = gridScore(grid, levels.map((l) => l ?? 0));
    const minutes = Math.max(1, Math.round(draftSeconds(draft, Date.now()) / 60));
    fx("complete");
    update((s) => logBlanc(s, { kind: mode === "philo" ? "philo" : "ecrit", label: subject?.title ?? "Écrit blanc", score }, minutes));
    // Une copie notée est terminée : elle ne rouvre pas, et elle ne peut pas être comptée deux fois.
    setHandedIn(draft);
    setDraft(EMPTY_DRAFT);
    setPhase("fin");
    window.scrollTo({ top: 0 });
  };

  if (phase === "choix" || !subject) {
    return (
      <FocusPage top={top}>
        <div className="ecrit">
          <p className="kicker">{mode === "philo" ? "4 heures · un sujet au choix" : `${EAF.ecrit.minutes / 60} heures · coefficient ${EAF.ecrit.coefficient}`}</p>
          <h1 className="h1">Choisis ton sujet</h1>
          <ul className="subject-list">
            {subjects.map((s) => (
              <li key={s.id}>
                <button type="button" className={cx("subject-card", preferred === s.type && "is-preferred")} onClick={() => begin(s.id)}>
                  <span className="subject-type">{s.type === "commentaire" ? "Commentaire" : s.type === "explication" ? "Explication de texte" : "Dissertation"}</span>
                  <strong>{s.title}</strong>
                  {s.context ? <span className="muted small">{s.context}</span> : null}
                  <ArrowRight size={20} strokeWidth={2.6} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          {mode === "eaf" && bac.voie === "techno" ? <p className="muted small">Voie technologique : la contraction de texte suivie d'un essai arrive bientôt.</p> : null}
        </div>
      </FocusPage>
    );
  }

  if (phase === "grille") {
    const complete = grid.every((_, i) => levels[i] !== null && levels[i] !== undefined);
    return (
      <FocusPage top={top} dock={<Button block disabled={!complete} onClick={finish}>{complete ? "Voir ma note" : "Situe-toi sur chaque critère"}</Button>}>
        <div className="ecrit">
          <h1 className="h1">Relis ta copie avec la grille</h1>
          <ul className="copy-stats" aria-label="Repères sur ta copie">
            <li><strong className="num">{review.words}</strong> mots</li>
            <li><strong className="num">{paragraphs}</strong> paragraphes</li>
            <li><strong className="num">{citations}</strong> citations</li>
            <li><strong className="num">{connectors}</strong> connecteurs</li>
          </ul>
          <SelfGrid items={grid} levels={grid.map((_, i) => levels[i] ?? null)} onChange={setLevels} />
        </div>
      </FocusPage>
    );
  }

  if (phase === "fin") {
    return (
      <FocusPage top={top}>
        <div className="ecrit ecrit-end">
          <h1 className="sr-only">Résultat de l'écrit blanc</h1>
          <GridResult items={grid} levels={grid.map((_, i) => levels[i] ?? 0)} note="Note indicative : ta propre évaluation, avec une grille d'entraînement inspirée des attendus de l'épreuve." />
          <ul className="grid-detail">
            {grid.map((g, k) => (
              <li key={g.label}><span>{g.label}</span><strong className="num">{frNumber(Math.round((levels[k] ?? 0) * g.points * 2) / 2)}/{g.points}</strong></li>
            ))}
          </ul>
          {subject.pistes ? (
            <section className="pistes" aria-labelledby="pistes-title">
              <h2 id="pistes-title" className="h2">Pistes de correction</h2>
              <p><strong>Problématique possible :</strong> {subject.pistes.problematique}</p>
              <ol>
                {subject.pistes.axes.map((a) => <li key={a}>{a}</li>)}
              </ol>
            </section>
          ) : null}
          <section className="pistes" aria-labelledby="plan-title">
            <h2 id="plan-title" className="h2">Ton plan</h2>
            <p><strong>Problématique :</strong> {work.problematique || "non rédigée"}</p>
            <ol>
              {work.parties.filter((p) => p.idee.trim()).map((p, i) => <li key={i}>{p.idee}</li>)}
            </ol>
          </section>
          <div className="sheet-actions">
            <Button block onClick={() => { setHandedIn(null); setPhase("choix"); }}>Un autre sujet</Button>
            <Link href={mode === "philo" ? "/epreuves" : "/bac-francais"} className="btn btn-ghost btn-block"><span>Terminer</span></Link>
          </div>
        </div>
      </FocusPage>
    );
  }

  const setPart = (i: number, patch: Partial<Draft["parties"][number]>) => setDraft((d) => ({ ...d, parties: d.parties.map((p, k) => (k === i ? { ...p, ...patch } : p)) }));

  return (
    <FocusPage wide top={top} dock={<Button block onClick={hand}>Rendre ma copie</Button>}>
      <div className="ecrit">
        <h1 className="sr-only">{subject.title}</h1>
        <DraftClock draft={draft} minutes={mode === "philo" ? 240 : EAF.ecrit.minutes} onToggle={() => setDraft((d) => togglePause(d, Date.now()))} label={subject.type === "commentaire" ? "Commentaire" : subject.type === "explication" ? "Explication" : "Dissertation"} />
        <div className="ecrit-tabs" role="tablist" aria-label="Espace de travail">
          {([
            { id: "sujet", label: "Sujet", Icon: FileText },
            { id: "plan", label: "Plan", Icon: ListTree },
            { id: "copie", label: "Copie", Icon: PenLine },
          ] as const).map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={cx("ecrit-tab", tab === t.id && "is-on")} onClick={() => setTab(t.id)}>
              <t.Icon size={18} strokeWidth={2.4} /> {t.label}
            </button>
          ))}
        </div>

        {tab === "sujet" ? (
          <div className="ecrit-pane" role="tabpanel">
            <p className="subject-type">{subject.consigne}</p>
            <h2 className="ecrit-title">{subject.title}</h2>
            {subject.context ? <p className="muted">{subject.context}</p> : null}
            {subject.text ? <StimulusView s={subject.text} /> : null}
          </div>
        ) : tab === "plan" ? (
          <div className="ecrit-pane" role="tabpanel">
            <label className="field">
              <span className="field-label">Problématique</span>
              <textarea className="input textarea" rows={2} value={draft.problematique} onChange={(e) => { const problematique = e.target.value; setDraft((d) => ({ ...d, problematique })); }} />
            </label>
            <ol className="plan-parts">
              {draft.parties.map((p, i) => (
                <li key={i} className="plan-part">
                  <div className="plan-part-head">
                    <span className="plan-part-n">{subject.type === "commentaire" ? `Axe ${i + 1}` : `Partie ${["I", "II", "III"][i]}`}</span>
                    {draft.parties.length > 2 ? (
                      <button type="button" className="icon-btn icon-btn-sm" aria-label={`Retirer la partie ${i + 1}`} onClick={() => setDraft((d) => ({ ...d, parties: d.parties.filter((_, k) => k !== i) }))}><X size={18} /></button>
                    ) : null}
                  </div>
                  <input className="input" value={p.idee} onChange={(e) => setPart(i, { idee: e.target.value })} placeholder="Idée directrice" aria-label={`Idée directrice ${i + 1}`} />
                  <textarea className="input textarea" rows={3} value={p.exemples} onChange={(e) => setPart(i, { exemples: e.target.value })} placeholder={subject.type === "dissertation" ? "Exemples, passages de l'œuvre…" : "Citations et procédés…"} aria-label={`Exemples ${i + 1}`} />
                </li>
              ))}
            </ol>
            {draft.parties.length < PARTS_MAX ? (
              <button type="button" className="hw-add" onClick={() => setDraft((d) => ({ ...d, parties: [...d.parties, { idee: "", exemples: "" }] }))}><Plus size={20} strokeWidth={2.6} /> Ajouter une partie</button>
            ) : null}
          </div>
        ) : (
          <div className="ecrit-pane" role="tabpanel">
            <textarea className="input textarea ecrit-copy" value={draft.copie} onChange={(e) => { const value = e.target.value; setDraft((d) => ({ ...d, copie: value })); }} aria-label="Ta copie" placeholder="Introduction…" />
            <p className="muted small num">{review.words} mots</p>
          </div>
        )}
      </div>
    </FocusPage>
  );
}
