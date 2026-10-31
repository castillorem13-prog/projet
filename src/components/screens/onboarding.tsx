"use client";

import { ArrowLeft, ArrowRight, Check, Link2, Mail, PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PassionPicker } from "@/components/passions/passion-picker";
import { PreviewCard } from "@/components/passions/preview-card";
import { Button } from "@/components/ui/button";
import { findPassion, type Passion } from "@/lib/content/passions";
import { SUBJECTS } from "@/lib/content/meta";
import type { Grade, SubjectId } from "@/lib/content/types";
import { LEVELS, getLevel } from "@/lib/curriculum/levels";
import { cx, nb } from "@/lib/cx";
import { changeLevel, useStore } from "@/lib/store";

const GRADES: { id: Grade; caption: string }[] = LEVELS.map((l) => ({ id: l.id, caption: l.school }));

const PROMISES = ["Des exercices variés, pas seulement des QCM", "Écrits dans des dizaines d'univers", "Un corrigé qui explique ton erreur", "Tes progrès, compétence par compétence"];

export function OnboardingScreen() {
  const router = useRouter();
  const { update } = useStore();
  const [step, setStep] = useState(0);
  const [pseudo, setPseudo] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [specs, setSpecs] = useState<SubjectId[]>([]);
  const [under15, setUnder15] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [ent, setEnt] = useState<boolean | null>(null);
  const [passions, setPassions] = useState<string[]>([]);
  const [customs, setCustoms] = useState<Passion[]>([]);
  const [focus, setFocus] = useState<Passion | null>(null);
  const LAST = 3;
  const info = grade ? getLevel(grade) : null;
  const specCount = info?.specialtyCount ?? 0;
  const specChoices = info?.subjects.filter((x) => x.role === "specialite").map((x) => x.subject) ?? [];

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canNext =
    step === 0 ? pseudo.trim().length > 1 && grade !== null && specs.length === specCount : step === 1 ? under15 === false || (under15 === true && emailOk) : step === 2 ? true : ent !== null;
  const shown = focus && passions.includes(focus.id) ? focus : findPassion(passions[passions.length - 1] ?? "", customs);

  const next = () => {
    if (!canNext) return;
    if (step < LAST) {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    update((s) =>
      changeLevel(
        {
          ...s,
          onboarded: true,
          active: passions,
          profile: { ...s.profile, pseudo: pseudo.trim(), under15: under15 ?? true, parentEmail: email.trim() || s.profile.parentEmail, entLinked: ent ?? false, passions, customPassions: customs },
        },
        grade ?? "3e",
        { ...s.profile.track, specialties: specs, options: [] },
      ),
    );
    router.replace("/");
  };

  return (
    <div className={cx("onb", step === 0 && "is-welcome")}>
      <aside className="onb-brand on-yellow" aria-hidden="true">
        <p className="wordmark">learnward</p>
        <p className="display onb-brand-title">Tes devoirs deviennent des séances de révision.</p>
        <ul className="onb-promises">
          {PROMISES.map((t) => (
            <li key={t}><Check size={18} strokeWidth={3} /> {t}</li>
          ))}
        </ul>
      </aside>

      <div className="onb-panel">
        <header className="onb-top">
          {step > 0 ? (
            <button type="button" className="icon-btn" onClick={() => setStep(step - 1)} aria-label="Étape précédente">
              <ArrowLeft size={24} />
            </button>
          ) : (
            <span className="wordmark onb-wordmark">learnward</span>
          )}
          <div className="onb-steps" role="img" aria-label={`Étape ${step + 1} sur 4`}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cx(i <= step && "is-done")} />
            ))}
          </div>
        </header>

        <main id="main" tabIndex={-1} className="onb-body" key={step}>
          {step === 0 ? (
            <>
              <h1 className="display onb-title onb-title-phone">Tes devoirs deviennent des séances de révision.</h1>
              <h1 className="h1 onb-title onb-title-wide">Faisons connaissance.</h1>
              <p className="lead">Des exercices variés, un corrigé qui explique, et tes progrès compétence par compétence.</p>
              <label className="field">
                <span className="field-label">Ton pseudo</span>
                <input className="input" value={pseudo} onChange={(e) => setPseudo(e.target.value)} maxLength={18} placeholder="Pas ton vrai nom" autoComplete="off" />
              </label>
              <div className="field">
                <span className="field-label">Ta classe</span>
                <div className="grade-pick" role="radiogroup" aria-label="Ta classe">
                  {GRADES.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      role="radio"
                      aria-checked={grade === g.id}
                      className={cx(grade === g.id && "is-on")}
                      onClick={() => {
                        setGrade(g.id);
                        setSpecs([]);
                      }}
                    >
                      <strong>{g.id}</strong>
                      <span>{g.caption}</span>
                    </button>
                  ))}
                </div>
              </div>
              {specCount ? (
                <div className="field">
                  <span className="field-label">
                    Tes {specCount} spécialités <span className="muted">({specs.length}/{specCount})</span>
                  </span>
                  <div className="spec-pick" role="group" aria-label={`Choisis ${specCount} spécialités`}>
                    {specChoices.map((sub) => {
                      const on = specs.includes(sub);
                      return (
                        <button
                          key={sub}
                          type="button"
                          aria-pressed={on}
                          disabled={!on && specs.length >= specCount}
                          className={cx("spec-chip", on && "is-on")}
                          onClick={() => setSpecs(on ? specs.filter((x) => x !== sub) : [...specs, sub])}
                        >
                          {on ? <Check size={15} strokeWidth={3} /> : null}
                          {SUBJECTS[sub].label}
                        </button>
                      );
                    })}
                  </div>
                  {grade === "Tle" ? <span className="muted small">En terminale, tu gardes deux des trois spécialités de première.</span> : null}
                </div>
              ) : null}
            </>
          ) : null}

          {step === 1 ? (
            <>
              <h1 className="h1 onb-title">{nb("As-tu moins de 15 ans ?")}</h1>
              <p className="lead">En France, avant 15 ans, un parent doit donner son accord pour que tes données soient utilisées.</p>
              <div className="choice-cards" role="radiogroup">
                <button type="button" role="radio" aria-checked={under15 === true} className={cx("choice-card", under15 === true && "is-on")} onClick={() => setUnder15(true)}>
                  <strong>Oui</strong>
                  <span>Je demande l'accord d'un parent</span>
                </button>
                <button type="button" role="radio" aria-checked={under15 === false} className={cx("choice-card", under15 === false && "is-on")} onClick={() => setUnder15(false)}>
                  <strong>Non</strong>
                  <span>J'ai 15 ans ou plus</span>
                </button>
              </div>
              {under15 ? (
                <label className="field">
                  <span className="field-label">L'e-mail de ton parent</span>
                  <span className="input-wrap">
                    <Mail size={20} aria-hidden="true" />
                    <input className="input" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="parent@exemple.fr" autoComplete="off" />
                  </span>
                  <span className="muted small">Il reçoit une explication claire et donne son accord en un clic. En attendant, tu peux découvrir l'appli. (Démo : aucun e-mail n'est envoyé.)</span>
                </label>
              ) : null}
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h1 className="h1 onb-title">{nb("Qu'est-ce qui te plaît ?")}</h1>
              <p className="lead">Facultatif. Tes exercices voyagent dans des dizaines d'univers ; ceux que tu touches ici reviendront plus souvent.</p>
              <PassionPicker selected={passions} customs={customs} onFocus={setFocus} onChange={(s2, c2) => { setPassions(s2); setCustoms(c2); }} />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <h1 className="h1 onb-title">{nb("Comment récupérer tes devoirs ?")}</h1>
              <p className="lead">Sans ENT, LearnWard te propose le chapitre probable dans chaque matière, et tu le confirmes ou le corriges en un geste.</p>
              <div className="choice-cards" role="radiogroup">
                <button type="button" role="radio" aria-checked={ent === true} className={cx("choice-card", ent === true && "is-on")} onClick={() => setEnt(true)}>
                  <span className="choice-icon"><Link2 size={22} strokeWidth={2.4} /></span>
                  <strong>Relier mon ENT</strong>
                  <span>Tes devoirs et la progression de ta classe arrivent tout seuls</span>
                </button>
                <button type="button" role="radio" aria-checked={ent === false} className={cx("choice-card", ent === false && "is-on")} onClick={() => setEnt(false)}>
                  <span className="choice-icon"><PenLine size={22} strokeWidth={2.4} /></span>
                  <strong>Je les ajoute</strong>
                  <span>En 10 secondes, depuis l'accueil</span>
                </button>
              </div>
              {ent && grade !== "3e" ? <p className="notice notice-soft">Démo : l'ENT n'est simulé que pour une classe de 3e. Pour ta classe, tu verras des propositions à confirmer.</p> : null}
            </>
          ) : null}
        </main>

        <footer className="dock">
          <div className={cx("dock-inner", step === 2 && "dock-stack")}>
            {step === 2 && shown ? <PreviewCard passion={shown} /> : null}
            <Button block disabled={!canNext} onClick={next} trailing={<ArrowRight size={20} strokeWidth={2.6} />}>
              {step < LAST ? (step === 2 ? (passions.length ? `Continuer avec ${passions.length} univers` : "Passer : tout le catalogue") : "Continuer") : "C'est parti"}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
