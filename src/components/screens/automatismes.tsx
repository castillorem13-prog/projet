"use client";

import { ArrowRight, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { applyKey, Keypad } from "@/components/activities/keypad";
import { NumericField } from "@/components/activities/numeric-field";
import { Button } from "@/components/ui/button";
import { FocusPage } from "@/components/ui/focus-page";
import { buildDrill, familyLabel } from "@/lib/coach/drills";
import { autoMethods } from "@/lib/coach/methods";
import { knowledgeByUnit } from "@/lib/coach/learner";
import { isoDay } from "@/lib/coach/planner";
import { demoNow } from "@/lib/content/calendar";
import { studentSubjects } from "@/lib/curriculum/levels";
import { nb } from "@/lib/cx";
import { useFx } from "@/lib/fx";
import { checkAnswer } from "@/lib/pedagogy/answer-checker";
import { applyDrill, useStore, type DrillAnswer } from "@/lib/store";
import { useFinePointer } from "@/lib/use-media";
import { useKeys } from "@/lib/use-keys";
import { CloseHome } from "@/components/coach/close-home";

/**
 * Automatismes : 8 calculs rapides, sans indice, sur les notions déjà vues. Pas de chrono affiché :
 * la vitesse n'est pas un critère de maîtrise. Une réponse fausse montre tout de suite la bonne méthode.
 */
export function AutomatismesScreen() {
  const { state, update } = useStore();
  const router = useRouter();
  const fx = useFx();
  const fine = useFinePointer();
  const p = state.profile;
  const drill = useMemo(() => {
    const know = knowledgeByUnit(state.evidence, demoNow());
    const weakFirst = Array.from(know).filter(([, k]) => k.n >= 3).sort((a, b) => a[1].recall - b[1].recall).map(([id]) => id);
    return buildDrill({ level: p.grade, progress: state.progress, subjects: studentSubjects(p.grade, p.track).map((s) => s.subject), weakFirst, interleave: autoMethods(state.evidence).entrelacement, seed: isoDay(demoNow()) });
    // Le tirage est fixé à l'ouverture de l'écran.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [answers, setAnswers] = useState<DrillAnswer[]>([]);
  const [shown, setShown] = useState<{ correct: boolean } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const start = useRef(Date.now());
  const q = drill.questions[index];
  const finished = index >= drill.questions.length;
  useKeys((e) => {
    if (e.key === "Enter" && shown) {
      next();
      return true;
    }
  });

  const check = useCallback(() => {
    if (!q || shown) return;
    const r = checkAnswer(q.answer, value);
    if (r.status === "invalid_format") return setNotice("Écris un nombre, par exemple 12 ou −3,5.");
    const correct = r.status === "correct";
    fx(correct ? "correct" : "wrong");
    setShown({ correct });
    setAnswers((a) => [...a, { question: q, correct, seconds: Math.round((Date.now() - start.current) / 1000) }]);
  }, [q, shown, value, fx]);

  const next = () => {
    // Dernier calcul : le travail est enregistré tout de suite, même si l'élève quitte l'écran du bilan par la croix.
    if (index + 1 >= drill.questions.length) update((s) => applyDrill(s, answers));
    setShown(null);
    setValue("");
    setNotice(null);
    setIndex((i) => i + 1);
    start.current = Date.now();
  };

  if (!drill.questions.length) {
    return (
      <FocusPage top={<><CloseHome /><span className="topbar-title">Automatismes</span></>}>
        <div className="drill">
          <p>Pas encore de notion de maths vue cette année pour construire des automatismes. Ils apparaîtront dès que ta classe aura commencé un chapitre.</p>
          <Button onClick={() => router.push("/")}>Retour à l'accueil</Button>
        </div>
      </FocusPage>
    );
  }

  if (finished) {
    const ok = answers.filter((a) => a.correct).length;
    return (
      <FocusPage top={<><CloseHome /><span className="topbar-title">Automatismes</span></>} dock={<Button block onClick={() => router.push("/")} trailing={<ArrowRight size={20} />}>Revenir à l'accueil</Button>}>
        <div className="drill drill-summary">
          <p className="drill-count">Terminé</p>
          <p className="drill-score">{ok}/{answers.length}</p>
          <p>{ok === answers.length ? "Tout juste." : "Les calculs ratés reviendront dans les prochains automatismes."}</p>
          <ul className="drill-list">
            {answers.map((a) => (
              <li key={a.question.id} className={a.correct ? "is-ok" : "is-ko"}>
                {a.correct ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}
                <span>
                  <strong>{familyLabel(a.question.family)}</strong> · {nb(a.question.prompt)} {a.correct ? "" : <>→ {nb(a.question.solution)}</>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </FocusPage>
    );
  }

  const canSubmit = value.replace("−", "").length > 0;
  const dock = shown ? (
    <Button block variant={shown.correct ? "green" : "ink"} onClick={next} trailing={<span className="kbd kbd-hint">Entrée</span>}>
      {index + 1 < drill.questions.length ? "Calcul suivant" : "Voir le bilan"}
    </Button>
  ) : fine ? (
    <Button block disabled={!canSubmit} onClick={check}>Vérifier</Button>
  ) : (
    <Keypad onKey={(k) => { setNotice(null); setValue((v) => applyKey(v, k)); }} onSubmit={check} canSubmit={canSubmit} />
  );

  return (
    <FocusPage
      top={
        <>
          <CloseHome />
          <span className="topbar-title">Automatismes</span>
          <span className="topbar-count num topbar-end">{index + 1}/{drill.questions.length}</span>
        </>
      }
      dock={dock}
    >
      <div className="drill">
        <span className="drill-tag">{familyLabel(q!.family)}</span>
        <h1 className={q!.prompt.length > 40 ? "drill-prompt is-long" : "drill-prompt"}>{nb(q!.prompt)}</h1>
        <NumericField
          value={value}
          unit={null}
          fine={fine}
          label="Ta réponse"
          status={shown ? (shown.correct ? "correct" : "wrong") : undefined}
          onChange={(v) => { setNotice(null); setValue(v); }}
          onSubmit={shown ? next : check}
        />
        {notice ? <p className="notice answer-notice" role="alert">{notice}</p> : null}
        {shown ? (
          <div className={shown.correct ? "drill-feedback is-ok" : "drill-feedback is-ko"} role="status">
            <strong>{shown.correct ? "Exact." : `C'était ${nb(String(q!.answer.expected).replace(".", ",").replace("-", "−"))}.`}</strong>
            <span>{nb(q!.solution)}</span>
          </div>
        ) : null}
      </div>
    </FocusPage>
  );
}
