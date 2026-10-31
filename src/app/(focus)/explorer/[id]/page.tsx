import { CapsulePlayer } from "@/components/explore/capsule-player";
import { CAPSULES } from "@/lib/content/catalog";

export const dynamicParams = false;
export const generateStaticParams = () => CAPSULES.map((c) => ({ id: c.id }));

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CapsulePlayer capsuleId={id} />;
}
