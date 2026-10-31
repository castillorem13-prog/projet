"use client";

import { Ban, Check, Plus, Search, X } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { FamilyIcon } from "@/components/ui/family-icon";
import { FAMILIES, FAMILY_ORDER, PASSIONS, findPassion, makeCustomPassion, type FamilyId, type Passion } from "@/lib/content/passions";
import { affineIntro } from "@/lib/content/scenarios";
import { cx, nb } from "@/lib/cx";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Sélecteur d'univers : catalogue par familles, recherche, univers inventés par l'élève.
 * Rien n'est obligatoire : on peut en aimer (ils reviennent plus souvent) ou en écarter (ils ne reviennent plus).
 */
export function PassionPicker({
  selected,
  customs,
  onChange,
  onFocus,
  muted,
  onMute,
}: {
  selected: string[];
  customs: Passion[];
  onChange: (selected: string[], customs: Passion[]) => void;
  onFocus: (p: Passion) => void;
  /** Univers écartés (facultatif : l'onboarding ne les propose pas). */
  muted?: string[];
  onMute?: (muted: string[]) => void;
}) {
  const [mode, setMode] = useState<"like" | "mute">("like");
  const [query, setQuery] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [family, setFamily] = useState<FamilyId>("sport");
  const [unit, setUnit] = useState("");
  const [event, setEvent] = useState("");

  const q = norm(query.trim());
  const all = useMemo(() => [...PASSIONS, ...customs], [customs]);
  const visible = q ? all.filter((p) => norm(p.label).includes(q) || norm(FAMILIES[p.family].label).includes(q)) : all;

  const toggle = (p: Passion) => {
    if (mode === "mute" && muted && onMute) {
      const off = muted.includes(p.id);
      onMute(off ? muted.filter((id) => id !== p.id) : [...muted, p.id]);
      if (!off && selected.includes(p.id)) onChange(selected.filter((id) => id !== p.id), customs);
      return;
    }
    const on = selected.includes(p.id);
    onChange(on ? selected.filter((id) => id !== p.id) : [...selected, p.id], customs);
    if (!on) {
      onFocus(p);
      if (muted?.includes(p.id) && onMute) onMute(muted.filter((id) => id !== p.id));
    }
  };

  const draft = label.trim().length > 1 ? makeCustomPassion({ label, family, unit, event }) : null;
  const addCustom = () => {
    if (!draft) return;
    const nextCustoms = [...customs.filter((c) => c.id !== draft.id), draft];
    onChange(selected.includes(draft.id) ? selected : [...selected, draft.id], nextCustoms);
    onFocus(draft);
    setLabel("");
    setUnit("");
    setEvent("");
    setCustomOpen(false);
  };

  return (
    <div className="picker">
      {muted && onMute ? (
        <div className="picker-mode segmented" role="tablist" aria-label="Que faire d'un univers ?">
          <button type="button" role="tab" aria-selected={mode === "like"} className={cx(mode === "like" && "is-on")} onClick={() => setMode("like")}><Check size={16} strokeWidth={3} /> J'aime</button>
          <button type="button" role="tab" aria-selected={mode === "mute"} className={cx(mode === "mute" && "is-on")} onClick={() => setMode("mute")}><Ban size={16} strokeWidth={2.6} /> Pas pour moi</button>
        </div>
      ) : null}
      <label className="picker-search">
        <Search size={20} aria-hidden="true" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Basket, piano, espace…" aria-label="Chercher une passion" />
        {query ? (
          <button type="button" className="picker-clear" onClick={() => setQuery("")} aria-label="Effacer la recherche">
            <X size={18} />
          </button>
        ) : null}
      </label>

      <div className="picker-tray" aria-live="polite">
        {selected.length === 0 ? (
          <p className="muted small">Aucun préféré : tout le catalogue tourne. Touche ceux que tu aimes.</p>
        ) : (
          selected.map((id) => {
            const p = findPassion(id, customs);
            if (!p) return null;
            return (
              <button key={id} type="button" className="tray-chip" style={{ "--fam": FAMILIES[p.family].color } as CSSProperties} onClick={() => toggle(p)} aria-label={`Retirer ${p.label}`}>
                {p.label} <X size={15} strokeWidth={2.6} />
              </button>
            );
          })
        )}
      </div>

      {FAMILY_ORDER.map((f) => {
        const items = visible.filter((p) => p.family === f);
        if (!items.length) return null;
        return (
          <section key={f} className="family" style={{ "--fam": FAMILIES[f].color } as CSSProperties} aria-label={FAMILIES[f].label}>
            <h2 className="family-head">
              <span className="family-icon"><FamilyIcon family={f} size={16} /></span>
              {FAMILIES[f].label}
            </h2>
            <div className="chip-cloud">
              {items.map((p) => {
                const on = selected.includes(p.id);
                const off = Boolean(muted?.includes(p.id));
                return (
                  <button key={p.id} type="button" className={cx("pchip", on && "is-on", off && "is-muted", p.custom && "is-custom")} aria-pressed={mode === "mute" ? off : on} onClick={() => toggle(p)}>
                    {on ? <Check size={16} strokeWidth={3} /> : off ? <Ban size={15} strokeWidth={2.6} /> : null}
                    {p.label}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      {q && visible.length === 0 ? <p className="muted">Rien trouvé pour « {query} ». Ajoute-la toi-même juste en dessous.</p> : null}

      <section className="custom-box">
        {!customOpen ? (
          <button type="button" className="custom-open" onClick={() => { setCustomOpen(true); if (query) setLabel(query); }}>
            <Plus size={20} strokeWidth={2.6} /> Ajouter une passion qui n'est pas dans la liste
          </button>
        ) : (
          <div className="custom-form">
            <h3 className="h2">Ta passion à toi</h3>
            <label className="field">
              <span className="field-label">Comment s'appelle-t-elle ?</span>
              <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Pêche, origami, parkour…" maxLength={28} />
            </label>
            <div className="field">
              <span className="field-label">Elle ressemble plutôt à…</span>
              <div className="family-pick" role="radiogroup">
                {FAMILY_ORDER.map((f) => (
                  <button key={f} type="button" role="radio" aria-checked={family === f} className={cx("fam-pill", family === f && "is-on")} style={{ "--fam": FAMILIES[f].color } as CSSProperties} onClick={() => setFamily(f)}>
                    <FamilyIcon family={f} size={15} /> {FAMILIES[f].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="custom-pair">
              <label className="field">
                <span className="field-label">On y compte des…</span>
                <input className="input" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="poissons" maxLength={24} />
              </label>
              <label className="field">
                <span className="field-label">À chaque…</span>
                <input className="input" value={event} onChange={(e) => setEvent(e.target.value)} placeholder="sortie" maxLength={24} />
              </label>
            </div>
            {draft ? <p className="custom-preview">{nb(affineIntro(3, 2)(draft))}</p> : null}
            <div className="custom-actions">
              <Button variant="ghost" size="md" onClick={() => setCustomOpen(false)}>Annuler</Button>
              <Button size="md" disabled={!draft} onClick={addCustom}>Ajouter</Button>
            </div>
          </div>
        )}
      </section>
      <p className="muted small picker-note">Tes univers servent uniquement à écrire tes énoncés. Ils ne sont jamais partagés ni utilisés pour de la publicité.</p>
    </div>
  );
}
