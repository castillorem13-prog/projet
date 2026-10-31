import { BacHub, BacOnly } from "@/components/bac/hub";

export default function Page() {
  return (
    <BacOnly>
      <BacHub />
    </BacOnly>
  );
}
