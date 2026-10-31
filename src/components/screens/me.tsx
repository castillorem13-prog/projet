"use client";

import { BookOpenText, Check, ChevronRight, GraduationCap, Languages, Link2, Moon, Palette, RotateCcw, ShieldCheck, Shuffle, Smartphone, Volume2, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { Segmented } from "@/components/ui/segmented";
import { Toggle } from "@/components/ui/toggle";
import { SubjectChip } from "@/components/ui/subject-icon";
import { SUBJECTS } from "@/lib/content/meta";
import { FAMILIES, PASSIONS } from "@/lib/content/passions";
import type { Level, SubjectId } from "@/lib/curriculum";
import { LEVELS, LVB_CHOICES, getLevel, studentSubjects } from "@/lib/curriculum/levels";
import { defaultProgress } from "@/lib/curriculum/progression";
import { cx } from "@/lib/cx";
import { useFx } from "@/lib/fx";
import { changeLevel, setTrack as applyTrack, useMyPassions, useStore, type Settings, type ThemePref } from "@/lib/store";
import { ACCENTS, accentFromPassions, getAccent } from "@/lib/theme/accents";

const DEFAULT_SPECS: Partial<Record<Level, SubjectId[]>> = { "1re": ["maths", "physique", "svt"], Tle: ["maths", "physique"] };

export function MeScreen() {
  const router = useRouter();
  const { state, update, reset } = useStore();
  const passions = useMyPassions();
  const fx = useFx();
  const p = state.profile;
  const s = state.settings;
  const liked = p.passions.length ? passions : [];
  const shown = s.accentFromUniverses ? accentFromPassions(liked, s.accent) : s.accent;
  const set = (patch: Partial<Settings>) => update((st) => ({ ...st, settings: { ...st.settings, ...patch } }));
  const info = getLevel(p.grade);
  const specCount = info.specialtyCount ?? 0;
  const specChoices = info.subjects.filter((x) => x.role === "specialite").map((x) => x.subject);
  const optChoices = info.subjects.filter((x) => x.role === "option").map((x) => x.subject);
  const mine = studentSubjects(p.grade, p.track);
  const setLevel = (level: Level) =>
    update((st) => changeLevel(st, level, { ...st.profile.track, specialties: DEFAULT_SPECS[level] ?? [], options: [] }));
  const setTrack = (patch: Partial<typeof p.track>) => update((st) => applyTrack(st, patch));

  return (
    <div className="me">
      <header className="me-top">
        <span className="avatar avatar-xl" aria-hidden="true">{p.pseudo.slice(0, 1).toUpperCase()}</span>
        <div>
          <h1 className="h1">{p.pseudo}</h1>
          <p className="muted"><GraduationCap size={17} strokeWidth={2.4} /> Élève de {info.label}, {info.school.toLowerCase()}</p>
        </div>
      </header>

      <div className="me-grid">
        <section className="block" aria-labelledby="pas-title">
          <div className="block-head">
            <h2 id="pas-title" className="h2">Mes univers</h2>
            <Link href="/passions?retour=/moi" className="text-btn">Modifier</Link>
          </div>
          <Link href="/passions?retour=/moi" className="passion-summary">
            <span className="chip-cloud">
              {liked.length ? liked.map((ps) => (
                <span key={ps.id} className="tray-chip is-static" style={{ "--fam": FAMILIES[ps.family].color } as CSSProperties}>{ps.label}</span>
              )) : <span className="muted">Aucun préféré : tout le catalogue tourne.</span>}
            </span>
            <span className="muted small">{p.mutedPassions.length ? `${p.mutedPassions.length} écarté${p.mutedPassions.length > 1 ? "s" : ""} · ` : ""}{PASSIONS.length} univers au catalogue</span>
          </Link>
          <div className="setting">
            <span className="setting-icon"><Shuffle size={22} strokeWidth={2.4} /></span>
            <span className="setting-main">
              <strong>Découvrir d'autres univers</strong>
              <span>Chaque jour, deux univers nouveaux s'ajoutent aux tiens.</span>
            </span>
            <Toggle on={p.vary} onChange={(vary) => update((st) => ({ ...st, profile: { ...st.profile, vary } }))} label="Découvrir d'autres univers" />
          </div>
        </section>

        <section className="block" aria-labelledby="ens-title">
          <h2 id="ens-title" className="h2">Mes enseignements</h2>
          <div className="field">
            <span className="field-label">Ma classe</span>
            <div className="level-pick" role="radiogroup" aria-label="Ma classe">
              {LEVELS.map((l) => (
                <button key={l.id} type="button" role="radio" aria-checked={p.grade === l.id} className={cx("level-chip", p.grade === l.id && "is-on")} onClick={() => p.grade !== l.id && setLevel(l.id)}>
                  {l.label}
                </button>
              ))}
            </div>
            <span className="muted small">Changer de classe recalcule ta progression : elle repart d'une proposition à confirmer.</span>
          </div>
          {p.grade !== "6e" ? (
            <div className="field">
              <span className="field-label"><Languages size={16} strokeWidth={2.4} className="inline-icon" /> Langue vivante B</span>
              <Segmented<SubjectId>
                label="Langue vivante B"
                value={p.track.lvb}
                onChange={(lvb) => setTrack({ lvb })}
                options={LVB_CHOICES.map((id) => ({ id, label: SUBJECTS[id].label }))}
              />
            </div>
          ) : null}
          {specCount ? (
            <div className="field">
              <span className="field-label">Mes spécialités ({p.track.specialties.length}/{specCount})</span>
              <div className="spec-pick">
                {specChoices.map((sub) => {
                  const on = p.track.specialties.includes(sub);
                  return (
                    <button key={sub} type="button" aria-pressed={on} disabled={!on && p.track.specialties.length >= specCount} className={cx("spec-chip", on && "is-on")} onClick={() => setTrack({ specialties: on ? p.track.specialties.filter((x) => x !== sub) : [...p.track.specialties, sub] })}>
                      {on ? <Check size={15} strokeWidth={3} /> : null}
                      {SUBJECTS[sub].label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {optChoices.length ? (
            <div className="field">
              <span className="field-label">Mes options</span>
              <div className="spec-pick">
                {optChoices.map((sub) => {
                  const on = p.track.options.includes(sub);
                  return (
                    <button key={sub} type="button" aria-pressed={on} className={cx("spec-chip", on && "is-on")} onClick={() => setTrack({ options: on ? p.track.options.filter((x) => x !== sub) : [...p.track.options, sub] })}>
                      {on ? <Check size={15} strokeWidth={3} /> : null}
                      {SUBJECTS[sub].label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div className="subject-cloud" aria-label="Tes matières cette année">
            {mine.map((m) => (
              <SubjectChip key={m.subject} subject={m.subject} small />
            ))}
          </div>
        </section>

        <section className="block" aria-labelledby="look-title">
          <h2 id="look-title" className="h2">Apparence</h2>
          <div className="setting setting-col">
            <span className="setting-line">
              <span className="setting-icon"><Moon size={22} strokeWidth={2.4} /></span>
              <span className="setting-main"><strong>Thème</strong></span>
            </span>
            <Segmented<ThemePref>
              label="Thème"
              value={s.theme}
              onChange={(theme) => set({ theme })}
              options={[{ id: "system", label: "Automatique" }, { id: "light", label: "Clair" }, { id: "dark", label: "Sombre" }]}
            />
          </div>
          <div className="setting setting-col">
            <span className="setting-line">
              <span className="setting-icon"><Palette size={22} strokeWidth={2.4} /></span>
              <span className="setting-main"><strong>Couleur</strong>{s.accentFromUniverses ? <span>Elle suit tes univers : {getAccent(shown).label.toLowerCase()}.</span> : null}</span>
            </span>
            <div className="swatches" role="radiogroup" aria-label="Couleur de l'appli">
              {ACCENTS.map((a) => {
                const on = shown === a.id;
                return (
                  <button key={a.id} type="button" role="radio" aria-checked={on} aria-label={a.label} disabled={s.accentFromUniverses} className={cx("swatch", on && "is-on")} style={{ "--sw": a.base } as CSSProperties} onClick={() => set({ accent: a.id })}>
                    {on ? <Check size={18} strokeWidth={3.2} /> : null}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="setting">
            <span className="setting-icon"><Wand2 size={22} strokeWidth={2.4} /></span>
            <span className="setting-main">
              <strong>Couleur selon mes univers</strong>
              <span>Sport en menthe, jeux en lilas, musique en corail…</span>
            </span>
            <Toggle on={s.accentFromUniverses} onChange={(accentFromUniverses) => set({ accentFromUniverses })} label="Couleur selon mes univers" />
          </div>
        </section>

        <section className="block" aria-labelledby="comfort-title">
          <h2 id="comfort-title" className="h2">Confort</h2>
          <div className="setting">
            <span className="setting-icon"><BookOpenText size={22} strokeWidth={2.4} /></span>
            <span className="setting-main">
              <strong>Lecture facilitée</strong>
              <span>Police très lisible, lettres et lignes plus espacées. Utile en cas de dyslexie.</span>
            </span>
            <Toggle on={s.readable} onChange={(readable) => set({ readable })} label="Lecture facilitée" />
          </div>
          <div className="setting">
            <span className="setting-icon"><Volume2 size={22} strokeWidth={2.4} /></span>
            <span className="setting-main">
              <strong>Sons</strong>
              <span>Un petit son quand tu valides une réponse.</span>
              {s.sound ? <button type="button" className="text-btn setting-test" onClick={() => fx("correct")}>Écouter</button> : null}
            </span>
            <Toggle on={s.sound} onChange={(sound) => set({ sound })} label="Sons" />
          </div>
          <div className="setting">
            <span className="setting-icon"><Smartphone size={22} strokeWidth={2.4} /></span>
            <span className="setting-main">
              <strong>Vibrations</strong>
              <span>Sur Android. Les iPhone ne laissent pas les sites vibrer.</span>
            </span>
            <Toggle on={s.haptics} onChange={(haptics) => set({ haptics })} label="Vibrations" />
          </div>
        </section>

        <section className="block" aria-labelledby="ent-title">
          <h2 id="ent-title" className="h2">Mon ENT</h2>
          <div className="setting">
            <span className="setting-icon"><Link2 size={22} strokeWidth={2.4} /></span>
            <span className="setting-main">
              <strong>{p.entLinked ? "Relié" : "Non relié"}</strong>
              <span>{p.entLinked ? "Tes devoirs et la progression de ta classe arrivent automatiquement." : "Tu ajoutes tes devoirs et confirmes toi-même le chapitre en cours."}</span>
            </span>
            <Toggle on={p.entLinked} onChange={(v) => update((st) => ({ ...st, profile: { ...st.profile, entLinked: v }, progress: defaultProgress(st.profile.grade, st.profile.track, v) }))} label="Relier mon ENT" />
          </div>
          <p className="muted small">Démo : la liaison est simulée, et seulement pour une classe de 3e. Elle passera par un accès officiel, jamais par ton mot de passe.</p>
        </section>

        <section className="block" aria-labelledby="fam-title">
          <h2 id="fam-title" className="h2">Famille et démo</h2>
          <Link href="/moi/parent" className="setting setting-link">
            <span className="setting-icon"><ShieldCheck size={22} strokeWidth={2.4} /></span>
            <span className="setting-main">
              <strong>Espace parent</strong>
              <span>Accord, résumé de la semaine, données</span>
            </span>
            <ChevronRight size={22} />
          </Link>
          <button
            type="button"
            className="setting setting-link"
            onClick={() => {
              reset(false);
              router.push("/bienvenue");
            }}
          >
            <span className="setting-icon"><RotateCcw size={22} strokeWidth={2.4} /></span>
            <span className="setting-main">
              <strong>Recommencer comme un nouvel élève</strong>
              <span>Efface les données de démo et relance la première ouverture</span>
            </span>
            <ChevronRight size={22} />
          </button>
        </section>
      </div>
    </div>
  );
}
