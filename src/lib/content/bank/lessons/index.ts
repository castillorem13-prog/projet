import type { LessonSet } from "../types";
import { ANTIQUITE_LESSONS } from "./antiquite";
import { ARTS_LESSONS } from "./arts";
import { EMC_LESSONS } from "./emc";
import { HISTOIRE_LESSONS } from "./histoire";
import { LANGUES_LESSONS } from "./langues";
import { FRANCAIS_LESSONS, HLP_PHILO_LESSONS } from "./lettres";
import { MATHS_COLLEGE } from "./maths-college";
import { MATHS_LYCEE } from "./maths-lycee";
import { NUMERIQUE_LESSONS } from "./numerique";
import { PHYSIQUE_LESSONS, SVT_LESSONS } from "./sciences";
import { SES_LESSONS } from "./ses";

/** Fiches de cours, matière par matière. */
export const LESSON_SETS: LessonSet[] = [MATHS_COLLEGE, MATHS_LYCEE, PHYSIQUE_LESSONS, SVT_LESSONS, NUMERIQUE_LESSONS, SES_LESSONS, HISTOIRE_LESSONS, EMC_LESSONS, FRANCAIS_LESSONS, HLP_PHILO_LESSONS, LANGUES_LESSONS, ANTIQUITE_LESSONS, ARTS_LESSONS];
