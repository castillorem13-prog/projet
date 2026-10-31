import { Suspense } from "react";
import { PassionsScreen } from "@/components/screens/passions";

export default function Page() {
  return (
    <Suspense>
      <PassionsScreen />
    </Suspense>
  );
}
