import { Suspense } from "react";
import { ProgrammeScreen } from "@/components/screens/programme";

export default function Page() {
  return (
    <Suspense>
      <ProgrammeScreen />
    </Suspense>
  );
}
