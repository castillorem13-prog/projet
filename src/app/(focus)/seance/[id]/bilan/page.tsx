import { SummaryScreen } from "@/components/screens/summary";
import { SESSION_LIST } from "@/lib/content/catalog";

export const dynamicParams = false;
export const generateStaticParams = () => SESSION_LIST.map((s) => ({ id: s.id }));

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SummaryScreen sessionId={id} />;
}
