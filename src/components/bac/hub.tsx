"use client";

import { BookOpenText, Check, ChevronRight, Mic, PenLine, Pencil, Plus, Spline, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SectionTabs } from "@/components/shell/section-tabs";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { EAF, OBJETS, OBJET_ORDER, SOURCE_OEUVRES, getOeuvre, isCardDue, oeuvresOf, parcoursOf, partieOf, type ObjetId, type OralText, type Voie } from "@/lib/bac/francais";
import { isoDay } from "@/lib/coach/planner";
import { demoNow } from "@/lib/content/calendar";
import { cx, frNumber } from "@/lib/cx";
import { addOralText, removeOralText, setBac, updateOralText, useStore } from "@/lib/store";

type Draft = { id: string | null; objet: ObjetId; kind: OralText["kind"]; title: string; notes: string };

/**
 * Bac de français (première) : les œuvres de la classe, le descriptif de l'oral, l'œuvre choisie et le type de
 * sujet préféré à l'écrit. Tout le reste de l'appli s'appuie dessus (révision des textes, oral et écrit blancs).
 */
export function BacHub() {
  const { state, update } = useStore();
  const bac = state.bac;
  const [draft, setDraft] = useState<Draft | null>(null);
  const today = isoDay(demoNow());
  const due = bac.textes.filter((t) => isCardDue(t.card, today)).length;
  const target = EAF.textes[bac.voie];
  const chosen = OBJET_ORDER.map((o) => getOeuvre(bac.oeuvres[o])).filter((o): o is NonNullable<typeof o> => Boolean(o));
  const last = (kind: "oral" | "ecrit") => [...(bac.blancs ?? [])].reverse().find((b) => b.kind === kind);
  const lastOral = last("oral");
  const lastEcrit = last("ecrit");

  const saveDraft = () => {
    if (!draft || draft.title.trim().length < 2) return;
    const { id, ...t } = draft;
    update((s) => (id ? updateOralText(s, id, { ...t, title: t.title.trim() }) : addOralText(s, { ...t, title: t.title.trim() })));
    setDraft(null);
  };

  return (
    <div className="bac">
      <SectionTabs />
      <header className="page-top">
        <p className="kicker">Épreuves anticipées · session 2027</p>
        <h1 className="h1">Bac de français</h1>
      </header>

      <div className="bac-actions">
        <Link href="/bac-francais/revision" className={cx("bac-action", due > 0 && "is-hot")}>
          <span className="bac-action-icon"><BookOpenText size={24} strokeWidth={2.4} /></span>
          <strong>Mes textes</strong>
          <span>{due ? `${due} à revoir aujourd'hui` : "Tout est à jour"}</span>
        </Link>
        <Link href="/bac-francais/grammaire" className="bac-action">
          <span className="bac-action-icon"><Spline size={24} strokeWidth={2.4} /></span>
          <strong>Grammaire</strong>
          <span>Négation, interrogation, subordonnées</span>
        </Link>
        <Link href="/bac-francais/oral-blanc" className="bac-action">
          <span className="bac-action-icon"><Mic size={24} strokeWidth={2.4} /></span>
          <strong>Oral blanc</strong>
          <span>{lastOral ? `Dernier : ${frNumber(lastOral.score)}/20` : "30 min + 20 min"}</span>
        </Link>
        <Link href="/bac-francais/ecrit-blanc" className="bac-action">
          <span className="bac-action-icon"><PenLine size={24} strokeWidth={2.4} /></span>
          <strong>Écrit blanc</strong>
          <span>{lastEcrit ? `Dernier : ${frNumber(lastEcrit.score)}/20` : "4 heures"}</span>
        </Link>
      </div>

      <div className="bac-grid">
        <section className="block" aria-labelledby="oe-title">
          <div className="block-head">
            <h2 id="oe-title" className="h2">Les œuvres de ta classe</h2>
            <Segmented<Voie> label="Voie" value={bac.voie} onChange={(voie) => update((s) => setBac(s, { voie, oeuvres: {}, choisie: null }))} options={[{ id: "generale", label: "Générale" }, { id: "techno", label: "Techno" }]} />
          </div>
          <div className="objets">
            {OBJET_ORDER.map((objet) => {
              const list = oeuvresOf(objet, bac.voie);
              const sel = bac.oeuvres[objet];
              return (
                <fieldset key={objet} className="objet">
                  <legend className="objet-title">{OBJETS[objet].label} <span>{OBJETS[objet].siecles}</span></legend>
                  <div className="oeuvre-pick" role="radiogroup" aria-label={OBJETS[objet].label}>
                    {list.map((o) => {
                      const on = sel === o.id;
                      const partie = partieOf(o, bac.voie);
                      return (
                        <button key={o.id} type="button" role="radio" aria-checked={on} className={cx("oeuvre", on && "is-on")} onClick={() => update((s) => setBac(s, { oeuvres: { ...s.bac.oeuvres, [objet]: o.id }, choisie: s.bac.choisie === s.bac.oeuvres[objet] ? o.id : s.bac.choisie }))}>
                          <span className="oeuvre-check" aria-hidden="true">{on ? <Check size={16} strokeWidth={3.2} /> : null}</span>
                          <span className="oeuvre-main">
                            <strong>{o.titre}</strong>
                            <span>{o.auteur}</span>
                            <em>Parcours : {parcoursOf(o, bac.voie)}</em>
                            {partie ? <small>{partie}</small> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
          </div>
          <p className="muted small source-line">Programme : {SOURCE_OEUVRES.reference} (liste recoupée dans trois sources).</p>
        </section>

        <div>
          <section className="block block-first" aria-labelledby="ch-title">
            <h2 id="ch-title" className="h2">Œuvre choisie pour l'entretien</h2>
            {chosen.length ? (
              <div className="choice-list" role="radiogroup" aria-label="Œuvre choisie">
                {chosen.map((o) => (
                  <button key={o.id} type="button" role="radio" aria-checked={bac.choisie === o.id} className={cx("choice-row", bac.choisie === o.id && "is-on")} onClick={() => update((s) => setBac(s, { choisie: o.id }))}>
                    <span className="choice-dot" aria-hidden="true" />
                    <span><strong>{o.titre}</strong> · {o.auteur}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted">Indique d'abord les œuvres étudiées en classe.</p>
            )}
          </section>

          <section className="block" aria-labelledby="ec-title">
            <h2 id="ec-title" className="h2">À l'écrit, je vise</h2>
            {bac.voie === "generale" ? (
              <Segmented<"commentaire" | "dissertation"> label="Exercice préféré" value={bac.ecrit} onChange={(ecrit) => update((s) => setBac(s, { ecrit }))} options={[{ id: "commentaire", label: "Le commentaire" }, { id: "dissertation", label: "La dissertation" }]} />
            ) : (
              <p className="muted">Voie technologique : commentaire, ou contraction de texte suivie d'un essai.</p>
            )}
          </section>

          <section className="block" aria-labelledby="desc-title">
            <div className="block-head">
              <h2 id="desc-title" className="h2">Ton descriptif</h2>
              <span className="muted small num">{bac.textes.length}/{target} textes</span>
            </div>
            <div className="desc-bar" role="img" aria-label={`${bac.textes.length} textes sur ${target}`}>
              <span style={{ width: `${Math.min(100, (bac.textes.length / target) * 100)}%` }} />
            </div>
            {OBJET_ORDER.map((objet) => {
              const list = bac.textes.filter((t) => t.objet === objet);
              if (!list.length) return null;
              return (
                <div key={objet} className="desc-group">
                  <h3 className="desc-objet">{OBJETS[objet].label}</h3>
                  <ul className="desc-list">
                    {list.map((t) => (
                      <li key={t.id} className="desc-item">
                        <span className={cx("desc-dot", isCardDue(t.card, today) && "is-due")} role="img" aria-label={isCardDue(t.card, today) ? "À revoir aujourd'hui" : "À jour"} />
                        <span className="desc-main">
                          <strong>{t.title}</strong>
                          <span>{t.kind === "oeuvre" ? "Œuvre intégrale" : "Parcours associé"}</span>
                        </span>
                        <button type="button" className="icon-btn icon-btn-sm" aria-label={`Modifier ${t.title}`} onClick={() => setDraft({ id: t.id, objet: t.objet, kind: t.kind, title: t.title, notes: t.notes })}>
                          <Pencil size={18} strokeWidth={2.4} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            <button type="button" className="hw-add" onClick={() => setDraft({ id: null, objet: "poesie", kind: "oeuvre", title: "", notes: "" })}>
              <Plus size={20} strokeWidth={2.6} /> Ajouter un texte
            </button>
          </section>
        </div>
      </div>

      <Sheet open={Boolean(draft)} title={draft?.id ? "Modifier le texte" : "Ajouter un texte"} onClose={() => setDraft(null)}>
        {draft ? (
          <div className="desc-form">
            <label className="field">
              <span className="field-label">Objet d'étude</span>
              <select className="input" value={draft.objet} onChange={(e) => setDraft({ ...draft, objet: e.target.value as ObjetId })}>
                {OBJET_ORDER.map((o) => <option key={o} value={o}>{OBJETS[o].label}</option>)}
              </select>
            </label>
            <Segmented<OralText["kind"]> label="Type de texte" value={draft.kind} onChange={(kind) => setDraft({ ...draft, kind })} options={[{ id: "oeuvre", label: "Œuvre intégrale" }, { id: "parcours", label: "Parcours associé" }]} />
            <label className="field">
              <span className="field-label">Titre du texte</span>
              <input className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Rimbaud, « Ma Bohème »" maxLength={90} />
            </label>
            <label className="field">
              <span className="field-label">Ce que je veux retenir</span>
              <textarea className="input textarea" rows={5} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder={"Problématique…\nMouvements…\nProcédés…"} />
            </label>
            <div className="sheet-actions">
              <Button block disabled={draft.title.trim().length < 2} onClick={saveDraft}>Enregistrer</Button>
              {draft.id ? (
                <Button block variant="ghost" icon={<Trash2 size={18} />} onClick={() => { const id = draft.id; if (id) update((s) => removeOralText(s, id)); setDraft(null); }}>Retirer du descriptif</Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}

export function BacOnly({ children }: { children: ReactNode }) {
  const { state } = useStore();
  if (state.profile.grade === "1re") return <>{children}</>;
  return (
    <div className="bac">
      <SectionTabs />
      <header className="page-top">
        <h1 className="h1">Bac de français</h1>
        <p className="muted">Les épreuves anticipées de français se passent en fin de première.</p>
      </header>
      <Link href="/epreuves" className="setting setting-link">
        <span className="setting-main"><strong>Voir les épreuves blanches de ta classe</strong></span>
        <ChevronRight size={22} />
      </Link>
    </div>
  );
}
