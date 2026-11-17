import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonScreen } from "@/components/bank/lesson-screen";
import { generatorsOf, lessonOf, lessonSetOf, LESSONS } from "@/lib/content/bank";
import { findUnit, sourceOf, UNITS } from "@/lib/curriculum";

export const dynamicParams = false;
export const generateStaticParams = () => LESSONS.map((l) => ({ unit: l.unitId }));

export async function generateMetadata({ params }: { params: Promise<{ unit: string }> }): Promise<Metadata> {
  const { unit } = await params;
  return { title: `Cours : ${findUnit(unit)?.title ?? "chapitre"}` };
}

export default async function Page({ params }: { params: Promise<{ unit: string }> }) {
  const { unit: id } = await params;
  const unit = findUnit(id);
  const lesson = lessonOf(id);
  const set = lessonSetOf(id);
  if (!unit || !lesson || !set) notFound();
  // Chapitres voisins de la même matière et du même niveau, dans l'ordre du programme.
  const siblings = UNITS.filter((u) => u.subject === unit.subject && u.level === unit.level && lessonOf(u.id));
  const at = siblings.findIndex((u) => u.id === id);
  const near = (u: (typeof siblings)[number] | undefined) => (u ? { id: u.id, title: u.title } : undefined);
  return <LessonScreen unit={unit} lesson={lesson} set={set} source={sourceOf(unit)} practice={generatorsOf(id).length} prev={near(siblings[at - 1])} next={near(siblings[at + 1])} />;
}
