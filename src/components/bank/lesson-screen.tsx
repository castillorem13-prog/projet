import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, ExternalLink, Lightbulb, ListChecks, X } from "lucide-react";
import Link from "next/link";
import { FocusPage } from "@/components/ui/focus-page";
import { SubjectChip } from "@/components/ui/subject-icon";
import type { Lesson, LessonSet } from "@/lib/content/bank/types";
import { SUBJECTS } from "@/lib/content/meta";
import type { CurriculumSource, Unit } from "@/lib/curriculum/types";
import { getLevel } from "@/lib/curriculum/levels";
import { nb } from "@/lib/cx";

const STATUS_NOTE: Record<string, string> = {
  computed: "Calculs vérifiés automatiquement.",
  verified_official: "Contenu relu dans le texte officiel.",
  cross_checked: "Contenu recoupé avec des sources de référence.",
  needs_review: "Fiche rédigée par LearnWard d'après le programme officiel ; les calculs sont vérifiés automatiquement, le texte reste à relire par un enseignant.",
  illustrative_mock: "Contenu de démonstration.",
  extension_not_required: "Approfondissement hors des attendus du programme.",
};

/** Fiche de cours d'une unité : rendue sur le serveur, sans JavaScript côté élève. */
type Neighbour = { id: string; title: string };

export function LessonScreen({ unit, lesson, set, source, practice, prev, next }: { unit: Unit; lesson: Lesson; set: LessonSet; source?: CurriculumSource; practice: number; prev?: Neighbour; next?: Neighbour }) {
  return (
    <FocusPage
      className="lesson-page"
      top={
        <>
          <Link href={`/reviser/${unit.subject}`} className="icon-btn" aria-label="Revenir à la matière">
            <X size={24} />
          </Link>
          <span className="topbar-title">Cours</span>
        </>
      }
      dock={
        practice ? (
          <Link href={`/entrainement/${unit.id}`} className="btn btn-ink btn-block">
            <span>S'entraîner sur ce chapitre</span>
            <ArrowRight size={20} strokeWidth={2.6} />
          </Link>
        ) : undefined
      }
    >
      <article className="lesson">
        <header className="lesson-head">
          <SubjectChip subject={unit.subject}>{SUBJECTS[unit.subject].short}, {getLevel(unit.level).label}</SubjectChip>
          <h1 className="display lesson-title">{nb(unit.title)}</h1>
          <p className="lesson-intro">{nb(lesson.intro)}</p>
        </header>

        {lesson.blocks.map((b) => (
          <section key={b.title} className="lesson-block">
            <h2 className="lesson-h2"><BookOpen size={18} strokeWidth={2.4} aria-hidden="true" /> {b.title}</h2>
            <ul className="lesson-list">
              {b.items.map((it) => <li key={it}>{nb(it)}</li>)}
            </ul>
          </section>
        ))}

        {lesson.example ? (
          <section className="lesson-block lesson-example">
            <h2 className="lesson-h2"><ListChecks size={18} strokeWidth={2.4} aria-hidden="true" /> Exemple : {nb(lesson.example.title)}</h2>
            <ol className="lesson-steps">
              {lesson.example.steps.map((st) => <li key={st}>{nb(st)}</li>)}
            </ol>
          </section>
        ) : null}

        <section className="lesson-block lesson-pitfalls">
          <h2 className="lesson-h2"><AlertTriangle size={18} strokeWidth={2.4} aria-hidden="true" /> Erreurs fréquentes</h2>
          <ul className="lesson-list">
            {lesson.pitfalls.map((p) => <li key={p}>{nb(p)}</li>)}
          </ul>
        </section>

        <section className="lesson-remember" aria-label="À retenir">
          <h2 className="lesson-h2"><Lightbulb size={18} strokeWidth={2.4} aria-hidden="true" /> À retenir</h2>
          <ul className="lesson-list">
            {lesson.remember.map((p) => <li key={p}>{nb(p)}</li>)}
          </ul>
        </section>

        {prev || next ? (
          <nav className="lesson-nav" aria-label="Autres chapitres">
            {prev ? (
              <Link href={`/cours/${prev.id}`} className="lesson-nav-link">
                <ArrowLeft size={18} strokeWidth={2.6} aria-hidden="true" />
                <span><span className="muted small">Chapitre précédent</span><strong>{nb(prev.title)}</strong></span>
              </Link>
            ) : <span />}
            {next ? (
              <Link href={`/cours/${next.id}`} className="lesson-nav-link is-next">
                <span><span className="muted small">Chapitre suivant</span><strong>{nb(next.title)}</strong></span>
                <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
              </Link>
            ) : null}
          </nav>
        ) : null}

        <footer className="lesson-source">
          <p>{STATUS_NOTE[set.status]}</p>
          {source ? (
            <p>
              Programme officiel : {source.title}, {source.reference}.{" "}
              <a className="text-btn" href={source.url} target="_blank" rel="noreferrer">Texte <ExternalLink size={13} strokeWidth={2.6} /></a>
            </p>
          ) : null}
        </footer>
      </article>
    </FocusPage>
  );
}
