import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonScreen } from "@/components/bank/lesson-screen";
import { generatorsOf, lessonOf, lessonSetOf, LESSONS } from "@/lib/content/bank";
import { findUnit, sourceOf } from "@/lib/curriculum";

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
  return <LessonScreen unit={unit} lesson={lesson} set={set} source={sourceOf(unit)} practice={generatorsOf(id).length} />;
}
