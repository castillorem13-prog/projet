import type { FactSet } from "../types";
import { ARTS_FACTS, EPS_FACTS } from "./arts";
import { EMC_FACTS, GEO_FACTS, HISTOIRE_FACTS, NOTIONS_HISTOIRE } from "./histoire";
import { ANTIQUITE_FACTS, VOCAB_DE, VOCAB_EN, VOCAB_ES } from "./langues";
import { BAC_FACTS, NOTIONS_LETTRES, OEUVRES_FACTS, PHILO_FACTS } from "./lettres";
import { NUMERIQUE_FACTS } from "./numerique";
import { PHYSIQUE_FACTS, SVT_FACTS } from "./sciences";
import { SES_FACTS } from "./ses";

/** Lots de faits sourcés, matière par matière. */
export const FACT_SETS: FactSet[] = [PHYSIQUE_FACTS, SVT_FACTS, NUMERIQUE_FACTS, SES_FACTS, HISTOIRE_FACTS, GEO_FACTS, NOTIONS_HISTOIRE, EMC_FACTS, OEUVRES_FACTS, BAC_FACTS, NOTIONS_LETTRES, PHILO_FACTS, VOCAB_EN, VOCAB_ES, VOCAB_DE, ANTIQUITE_FACTS, ARTS_FACTS, EPS_FACTS];
