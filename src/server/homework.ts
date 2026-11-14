/** Lecture des devoirs de l'élève connecté, dans la forme du contrat. */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubjectId } from "@/lib/curriculum/types";
import type { Homework } from "@/lib/homework/contract";

type Row = { id: number; due_date: string; subject_label: string; subject: string | null; unit_id: string | null; is_test: boolean; text: string | null; done: boolean };

export async function listHomework(supabase: SupabaseClient, from: string): Promise<Homework[] | null> {
  const { data, error } = await supabase
    .from("homework")
    .select("id, due_date, subject_label, subject, unit_id, is_test, text, done")
    .gte("due_date", from)
    .order("due_date")
    .order("id")
    .limit(500);
  if (error) {
    console.error("listHomework", error.code);
    return null;
  }
  return (data as Row[]).map((r) => ({
    id: r.id,
    dueDate: r.due_date,
    subjectLabel: r.subject_label,
    subject: (r.subject as SubjectId | null) ?? null,
    unitId: r.unit_id,
    isTest: r.is_test,
    text: r.text,
    done: r.done,
  }));
}
