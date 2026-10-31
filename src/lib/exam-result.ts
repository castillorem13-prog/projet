import { exercisePoints, round2, type Exam, type ExamQuestion } from "@/lib/content/exams";
import type { CompetenceId } from "@/lib/content/types";
import { checkAnswer } from "@/lib/pedagogy/answer-checker";
import { buildResult, type ItemResult, type SessionResult } from "@/lib/session-result";

export type ExamAnswer =
  | { kind: "choice"; index: number }
  | { kind: "numeric"; value: string; unit: string | null }
  | { kind: "order"; order: number[] }
  | { kind: "spot"; line: number };

export type GradeStatus = "ok" | "partial" | "wrong" | "blank";

export interface GradedQuestion {
  exerciseId: string;
  question: ExamQuestion;
  earned: number;
  status: GradeStatus;
  given: string;
  expected: string;
}

export interface ExamOutcome {
  examId: string;
  graded: GradedQuestion[];
  score: number;
  perExercise: { id: string; title: string; earned: number; points: number }[];
  seconds: number;
  overtime: boolean;
  result: SessionResult;
}

const LETTERS = ["A", "B", "C", "D"];

export function isAnswered(q: ExamQuestion, a: ExamAnswer | undefined): boolean {
  if (!a) return false;
  if (a.kind === "numeric") return a.value.replace(/[−-]/g, "").trim().length > 0;
  if (a.kind === "order") return q.kind === "order" && a.order.length === q.steps.length;
  return true;
}

function grade(q: ExamQuestion, a: ExamAnswer | undefined): Omit<GradedQuestion, "exerciseId" | "question"> {
  const blank = { earned: 0, status: "blank" as const, given: "Pas de réponse" };
  if (q.kind === "mcq" || q.kind === "graph") {
    const expected = q.kind === "mcq" ? (q.options[q.correct] ?? "") : `Graphique ${LETTERS[q.correct]}`;
    if (!a || a.kind !== "choice") return { ...blank, expected };
    const given = q.kind === "mcq" ? (q.options[a.index] ?? "") : `Graphique ${LETTERS[a.index]}`;
    const ok = a.index === q.correct;
    return { earned: ok ? q.points : 0, status: ok ? "ok" : "wrong", given, expected };
  }
  if (q.kind === "numeric") {
    if (!a || a.kind !== "numeric" || !isAnswered(q, a)) return { ...blank, expected: q.expected };
    const raw = a.unit ? `${a.value} ${a.unit}` : a.value;
    const ok = checkAnswer(q.answer, raw).status === "correct";
    return { earned: ok ? q.points : 0, status: ok ? "ok" : "wrong", given: raw, expected: q.expected };
  }
  if (q.kind === "order") {
    const expected = `Les ${q.steps.length} étapes dans l'ordre`;
    if (!a || a.kind !== "order" || a.order.length === 0) return { ...blank, expected };
    let prefix = 0;
    while (prefix < a.order.length && a.order[prefix] === prefix) prefix++;
    if (prefix === q.steps.length) return { earned: q.points, status: "ok", given: "Toutes les étapes bien placées", expected };
    const earned = Math.floor((prefix / q.steps.length) * q.points * 2) / 2;
    return { earned, status: earned > 0 ? "partial" : "wrong", given: `${prefix} étape${prefix > 1 ? "s" : ""} sur ${q.steps.length} bien placée${prefix > 1 ? "s" : ""}`, expected };
  }
  const expected = `Ligne ${q.wrongLine + 1}`;
  if (!a || a.kind !== "spot") return { ...blank, expected };
  const ok = a.line === q.wrongLine;
  return { earned: ok ? q.points : 0, status: ok ? "ok" : "wrong", given: `Ligne ${a.line + 1}`, expected };
}

export function gradeExam(args: {
  exam: Exam;
  answers: Record<string, ExamAnswer>;
  seconds: number;
  overtime: boolean;
  levels: Record<CompetenceId, number>;
  streak: number;
  pointsToday: number;
}): ExamOutcome {
  const { exam, answers, seconds, overtime } = args;
  const graded: GradedQuestion[] = exam.exercises.flatMap((ex) =>
    ex.questions.map((q) => ({ exerciseId: ex.id, question: q, ...grade(q, answers[q.id]) })),
  );
  const perExercise = exam.exercises.map((ex) => ({
    id: ex.id,
    title: ex.title,
    points: exercisePoints(ex),
    earned: round2(graded.filter((g) => g.exerciseId === ex.id).reduce((s, g) => s + g.earned, 0)),
  }));
  const score = round2(perExercise.reduce((s, e) => s + e.earned, 0));
  const per = graded.length ? seconds / graded.length : 0;
  const items: ItemResult[] = graded.map((g) => ({
    activityId: g.question.id,
    competence: g.question.competence,
    status: g.status === "ok" ? "first" : g.status === "partial" ? "retry" : "missed",
    assistance: 0,
    stage: "application",
    seconds: per,
    reviewLabel: g.question.reviewLabel,
    ...(g.question.unitId ? { unitId: g.question.unitId } : {}),
  }));
  const result = buildResult({ sessionId: exam.sessionId, items, levels: args.levels, streak: args.streak, pointsToday: args.pointsToday });
  return { examId: exam.id, graded, score, perExercise, seconds, overtime, result };
}

export function frScore(n: number): string {
  return String(Math.round(n * 10) / 10).replace(".", ",");
}
