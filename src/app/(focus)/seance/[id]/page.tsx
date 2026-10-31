import { Suspense } from "react";
import { PrepareScreen } from "@/components/screens/prepare";
import { SESSION_LIST } from "@/lib/content/catalog";

export const dynamicParams = false;
export const generateStaticParams = () => SESSION_LIST.map((s) => ({ id: s.id }));

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <PrepareScreen sessionId={id} />
    </Suspense>
  );
}
