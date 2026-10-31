import { Suspense } from "react";
import { SubjectScreen } from "@/components/screens/subject";
import { SUBJECTS } from "@/lib/content/meta";
import type { SubjectId } from "@/lib/content/types";

export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(SUBJECTS).map((matiere) => ({ matiere }));

export default async function Page({ params }: { params: Promise<{ matiere: string }> }) {
  const { matiere } = await params;
  return (
    <Suspense>
      <SubjectScreen subject={matiere as SubjectId} />
    </Suspense>
  );
}
