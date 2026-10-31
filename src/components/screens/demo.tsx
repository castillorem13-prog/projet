"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { DemoMessage, FrameReport } from "@/components/shell/demo-bridge";
import { Segmented } from "@/components/ui/segmented";
import { FAMILIES, PRESETS, findPassion } from "@/lib/content/passions";
import { cx } from "@/lib/cx";
import type { ThemePref } from "@/lib/store";
import type { Level } from "@/lib/curriculum";

type Device = "phone" | "tablet" | "desktop";
const SIZES: Record<Device, { w: number; h: number; border: number }> = {
  phone: { w: 390, h: 844, border: 10 },
  tablet: { w: 820, h: 1180, border: 14 },
  desktop: { w: 1440, h: 900, border: 10 },
};

type Step = Omit<DemoMessage, "type">;
const LINKS: { group: string; items: { label: string; path: string; before?: Step[] }[] }[] = [
  {
    group: "Découvrir",
    items: [
      { label: "Première ouverture", path: "/bienvenue", before: [{ action: "reset" }] },
      { label: "Accueil", path: "/" },
      { label: "Mes univers (aimer, écarter)", path: "/passions?retour=/" },
    ],
  },
  {
    group: "Aujourd'hui",
    items: [
      { label: "Choisir son temps", path: "/", before: [{ action: "reset-today" }] },
      { label: "Objectifs pour 30 min", path: "/", before: [{ action: "plan", minutes: 30 }] },
      { label: "Automatismes (5 min)", path: "/automatismes" },
      { label: "Défi oral en anglais", path: "/oral?langue=anglais" },
    ],
  },
  {
    group: "Explorer (pour le plaisir)",
    items: [
      { label: "Les parcours", path: "/explorer" },
      { label: "Coder en Python", path: "/explorer/code-variables" },
      { label: "Les intérêts composés", path: "/explorer/argent-interets" },
      { label: "0,999… = 1 ?", path: "/explorer/loin-0999" },
    ],
  },
  {
    group: "Bac de français (1re)",
    items: [
      { label: "Œuvres, descriptif, choix", path: "/bac-francais", before: [{ action: "level", level: "1re" }] },
      { label: "Réviser ses textes", path: "/bac-francais/revision", before: [{ action: "level", level: "1re" }] },
      { label: "Oral blanc chronométré", path: "/bac-francais/oral-blanc", before: [{ action: "level", level: "1re" }] },
      { label: "Écrit blanc (4 h)", path: "/bac-francais/ecrit-blanc", before: [{ action: "level", level: "1re" }] },
      { label: "Grammaire de l'oral", path: "/bac-francais/grammaire", before: [{ action: "level", level: "1re" }] },
    ],
  },
  {
    group: "Épreuves blanches",
    items: [
      { label: "Brevet blanc de maths (3e)", path: "/controle/brevet-blanc-maths", before: [{ action: "level", level: "3e" }, { action: "fresh-exam", id: "brevet-blanc-maths" }] },
      { label: "Maths anticipées (1re)", path: "/controle/eam-blanc", before: [{ action: "level", level: "1re" }, { action: "fresh-exam", id: "eam-blanc" }] },
      { label: "Philosophie (Tle)", path: "/epreuves/philo", before: [{ action: "level", level: "Tle" }] },
      { label: "Grand oral (Tle)", path: "/epreuves/grand-oral", before: [{ action: "level", level: "Tle" }] },
      { label: "Contrôle blanc 30 min", path: "/controle/controle-fonctions-affines", before: [{ action: "fresh-exam", id: "controle-fonctions-affines" }] },
      { label: "Copie corrigée", path: "/controle/controle-fonctions-affines/copie", before: [{ action: "sample-exam", id: "controle-fonctions-affines" }] },
    ],
  },
  {
    group: "Programme",
    items: [
      { label: "Mon année, dans l'ordre de la classe", path: "/reviser" },
      { label: "Mode révision (année d'avant)", path: "/reviser?mode=revision" },
      { label: "Une matière : maths", path: "/reviser/maths" },
      { label: "Progrès et maîtrise", path: "/progres" },
    ],
  },
  {
    group: "Séances",
    items: [
      { label: "Préparer une séance", path: "/seance/fonctions-affines-3e" },
      { label: "Maths : fonctions affines", path: "/seance/fonctions-affines-3e/jouer", before: [{ action: "fresh-session" }] },
      { label: "Maths 6e : modèle en barres", path: "/seance/fractions-6e/jouer", before: [{ action: "jump", id: "fractions-6e", activity: "fr6-situation" }] },
      { label: "Histoire : documents réels", path: "/seance/histoire-totalitarismes-3e/jouer", before: [{ action: "fresh-session" }] },
      { label: "Français : rédaction et grille", path: "/seance/francais-denoncer-3e/jouer", before: [{ action: "fresh-session" }] },
      { label: "Anglais : dialogue", path: "/seance/anglais-present-perfect-3e/jouer", before: [{ action: "fresh-session" }] },
      { label: "Bilan : maîtrise et cagnotte", path: "/seance/fonctions-affines-3e/bilan", before: [{ action: "sample-result", id: "fonctions-affines-3e" }] },
    ],
  },
  {
    group: "Cagnotte",
    items: [
      { label: "Cagnotte et cashback", path: "/cagnotte" },
      { label: "Exercice partenaire (maths 3e)", path: "/seance/fonctions-affines-3e/jouer", before: [{ action: "jump", id: "fonctions-affines-3e", activity: "fa-formules" }] },
      { label: "Validation par le parent", path: "/moi/parent", before: [{ action: "request", id: "gift-bulle-5" }] },
    ],
  },
  {
    group: "Réglages",
    items: [
      { label: "Apparence, couleur, univers", path: "/moi" },
      { label: "Couleur menthe", path: "/", before: [{ action: "accent", accent: "menthe" }] },
      { label: "Couleur lilas", path: "/", before: [{ action: "accent", accent: "lilas" }] },
      { label: "Couleur jaune (par défaut)", path: "/", before: [{ action: "accent", accent: "jaune" }] },
      { label: "Espace parent", path: "/moi/parent" },
    ],
  },
];

const LEVEL_BTNS: Level[] = ["6e", "5e", "4e", "3e", "2nde", "1re", "Tle"];

/** Page /demo : l'appli réelle dans un cadre de téléphone, de tablette ou d'ordinateur. */
export function DemoScreen() {
  const [device, setDevice] = useState<Device>("phone");
  const [theme, setTheme] = useState<ThemePref>("system");
  const [readable, setReadable] = useState(false);
  const [path, setPath] = useState("/");
  /** Lien choisi : plusieurs liens peuvent mener à la même page (l'accueil, par exemple). */
  const [picked, setPicked] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>("3e");
  const [scale, setScale] = useState(1);
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  const send = useCallback((m: Step) => {
    frame.current?.contentWindow?.postMessage({ type: "learnward-demo", ...m }, window.location.origin);
  }, []);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => {
      const { w, h, border } = SIZES[device];
      const s = Math.min((el.clientWidth - 48) / (w + border * 2), (el.clientHeight - 110) / (h + border * 2), 1);
      setScale(Math.max(0.3, s));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [device]);

  // L'appli annonce ses changements : le panneau suit la page, la classe et le thème sans rien interroger.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as FrameReport | null;
      if (d?.type !== "learnward-frame") return;
      setPath(d.path);
      setLevel(d.level);
      setTheme(d.theme);
      setReadable(d.readable);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const go = (item: { label: string; path: string; before?: Step[] }) => {
    setPicked(item.label);
    item.before?.forEach(send);
    send({ action: "navigate", path: item.path });
  };

  const { w, h, border } = SIZES[device];
  return (
    <div className="demo">
      <aside className="demo-panel" aria-label="Navigation de la démo">
        <p className="wordmark">learnward</p>
        <p className="demo-intro">Prototype v8. L'appli réelle tourne dans le cadre : tout est cliquable, rien n'est envoyé.</p>
        <div className="demo-group">
          <h2>Classe de l'élève</h2>
          <div className="demo-levels" role="radiogroup" aria-label="Classe">
            {LEVEL_BTNS.map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={level === l}
                className={cx("demo-level", level === l && "is-on")}
                onClick={() => {
                  setLevel(l);
                  send({ action: "level", level: l });
                  send({ action: "navigate", path: "/reviser" });
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <p className="demo-note">La 3e a un ENT simulé ; les autres classes partent d'une progression proposée, à confirmer.</p>
        </div>
        {LINKS.map((g) => (
          <nav key={g.group} className="demo-group" aria-label={g.group}>
            <h2>{g.group}</h2>
            {g.items.map((it) => (
              <button key={it.label} type="button" className={cx("demo-link", path === it.path && (picked === null || picked === it.label) && "is-on")} onClick={() => go(it)}>
                {it.label}
              </button>
            ))}
          </nav>
        ))}
        <div className="demo-group">
          <h2>Apparence</h2>
          <Segmented<ThemePref>
            label="Apparence"
            value={theme}
            onChange={(t) => {
              setTheme(t);
              send({ action: "theme", theme: t });
            }}
            options={[{ id: "system", label: "Auto" }, { id: "light", label: "Clair" }, { id: "dark", label: "Sombre" }]}
          />
          <button type="button" className={cx("demo-link demo-toggle", readable && "is-on")} onClick={() => { setReadable(!readable); send({ action: "readable", value: !readable }); }}>
            Lecture facilitée {readable ? "activée" : "désactivée"}
          </button>
        </div>
        <div className="demo-group">
          <h2>Profil de passions</h2>
          <div className="demo-presets">
            {PRESETS.map((p) => (
              <button key={p.name} type="button" className="demo-preset" onClick={() => send({ action: "preset", passions: p.passions })}>
                <strong>{p.name}</strong>
                <span>
                  {p.passions.map((id) => {
                    const ps = findPassion(id, []);
                    return ps ? (
                      <i key={id} className="fam" style={{ "--fam": FAMILIES[ps.family].color } as CSSProperties}>{ps.label}</i>
                    ) : null;
                  })}
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="demo-stage" ref={stage}>
        <div className="demo-devices">
          <Segmented<Device> label="Appareil" value={device} onChange={setDevice} options={[{ id: "phone", label: "Téléphone" }, { id: "tablet", label: "Tablette" }, { id: "desktop", label: "Ordinateur" }]} />
        </div>
        <div className="device-slot" style={{ width: (w + border * 2) * scale, height: (h + border * 2) * scale }}>
          <div className={cx("device", `device-${device}`)} style={{ width: w + border * 2, height: h + border * 2, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <iframe ref={frame} src="/" title="Aperçu de LearnWard" />
          </div>
        </div>
      </div>
    </div>
  );
}
