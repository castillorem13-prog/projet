import { writeFileSync } from "node:fs";
import { bankCatalogSource } from "../src/lib/content/bank/catalog";
import { catalogSource } from "./catalog-source";

writeFileSync(new URL("../src/lib/content/catalog.generated.ts", import.meta.url), catalogSource());
writeFileSync(new URL("../src/lib/content/bank-catalog.generated.ts", import.meta.url), bankCatalogSource());
