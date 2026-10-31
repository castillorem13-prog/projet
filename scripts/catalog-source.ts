import { EXAMS } from "../src/lib/content/exams";
import { ALL_SESSIONS } from "../src/lib/content/sessions";
import { CAPSULES } from "../src/lib/explore/capsules";

/** Texte de src/lib/content/catalog.generated.ts, calculé à partir du contenu complet. */
export function catalogSource(): string {
  const sessions = ALL_SESSIONS.map((s) => ({
    id: s.id,
    subject: s.subject,
    grade: s.grade,
    unitId: s.unitId,
    notion: s.notion,
    objective: s.objective,
    minutes: s.minutes,
    ...(s.examId ? { examId: s.examId } : {}),
    activityCount: s.activities.length,
  }));
  const exams = Object.values(EXAMS).map((e) => ({
    id: e.id,
    sessionId: e.sessionId,
    subject: e.subject,
    grade: e.grade,
    notion: e.notion,
    ...(e.title ? { title: e.title } : {}),
    minutes: e.minutes,
    ...(e.format ? { format: e.format } : {}),
    exerciseCount: e.exercises.length,
  }));
  const capsules = CAPSULES.map((c) => ({ id: c.id, track: c.track, title: c.title, promise: c.promise, minutes: c.minutes }));
  const list = (name: string, type: string, rows: unknown[]) => `export const ${name}: ${type}[] = [\n${rows.map((r) => `  ${JSON.stringify(r)},`).join("\n")}\n];\n`;
  return [
    "/* Généré par `npm run gen:catalog` à partir du contenu : ne pas modifier à la main. */",
    'import type { CapsuleMeta, ExamMeta, SessionMeta } from "./catalog";',
    "",
    list("SESSION_LIST", "SessionMeta", sessions),
    list("EXAM_LIST", "ExamMeta", exams),
    list("CAPSULES", "CapsuleMeta", capsules),
  ].join("\n");
}
