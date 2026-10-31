import { writeFileSync } from "node:fs";
import { catalogSource } from "./catalog-source";

writeFileSync(new URL("../src/lib/content/catalog.generated.ts", import.meta.url), catalogSource());
