import { ExamScreen } from "@/components/screens/exam";
import { EXAM_LIST } from "@/lib/content/catalog";

export const dynamicParams = false;
export const generateStaticParams = () => EXAM_LIST.map((e) => ({ id: e.id }));

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExamScreen examId={id} />;
}
