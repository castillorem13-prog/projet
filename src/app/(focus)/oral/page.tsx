import { Suspense } from "react";
import { OralScreen } from "@/components/screens/oral";

export default function Page() {
  return (
    <Suspense>
      <OralScreen />
    </Suspense>
  );
}
