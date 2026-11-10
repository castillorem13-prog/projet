import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticePlayer } from "@/components/bank/practice-player";
import { lessonOf, practicePool } from "@/lib/content/bank";
import { BANK_CATALOG } from "@/lib/content/bank-catalog.generated";
import { findUnit } from "@/lib/curriculum";

export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(BANK_CATALOG.practice).map((unit) => ({ unit }));

export async function generateMetadata({ params }: { params: Promise<{ unit: string }> }): Promise<Metadata> {
  const { unit } = await params;
  return { title: `Entraînement : ${findUnit(unit)?.title ?? "chapitre"}` };
}

/** Les exercices sont tirés au moment de la construction : la banque ne part pas dans le navigateur. */
export default async function Page({ params }: { params: Promise<{ unit: string }> }) {
  const { unit: id } = await params;
  const unit = findUnit(id);
  const pool = practicePool(id, 24);
  if (!unit || !pool.length) notFound();
  return <PracticePlayer unitId={id} title={unit.title} subject={unit.subject} pool={pool} hasLesson={Boolean(lessonOf(id))} />;
}
