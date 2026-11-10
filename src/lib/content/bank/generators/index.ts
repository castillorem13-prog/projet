import type { Generator } from "../types";
import { FRANCAIS } from "./francais";
import { MATHS_1RE_TLE } from "./maths-1re-tle";
import { MATHS_2NDE } from "./maths-2nde";
import { MATHS_3E } from "./maths-3e";
import { MATHS_5E, MATHS_4E } from "./maths-5e4e";
import { MATHS_6E } from "./maths-6e";
import { NUMERIQUE } from "./numerique";
import { PHYSIQUE } from "./physique";
import { SES } from "./ses";

/** Générateurs dont la réponse est calculée par le code. */
export const GENERATOR_LIST: Generator[] = [...MATHS_6E, ...MATHS_5E, ...MATHS_4E, ...MATHS_3E, ...MATHS_2NDE, ...MATHS_1RE_TLE, ...PHYSIQUE, ...NUMERIQUE, ...SES, ...FRANCAIS];
