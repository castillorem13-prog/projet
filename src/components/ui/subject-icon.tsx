import {
  Amphora, Atom, BookOpenText, Brain, ChartLine, Code, Cog, Cpu, Dna, Dumbbell, Feather, FlaskConical, Gavel, Globe, Landmark, Music, Network, Palette, Pi, Scale, Sigma, Telescope,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import { SUBJECTS } from "@/lib/content/meta";
import type { SubjectId } from "@/lib/content/types";
import { cx } from "@/lib/cx";

const ICONS: Partial<Record<SubjectId, LucideIcon>> = {
  francais: Feather, maths: Pi, "maths-tc": Pi, "maths-comp": Sigma, "maths-exp": Sigma, hg: Landmark, emc: Scale,
  sciences: FlaskConical, physique: Atom, svt: Dna, techno: Cpu, snt: Network, nsi: Code, si: Cog,
  arts: Palette, musique: Music, eps: Dumbbell, ses: ChartLine, "ens-sci": Telescope, philo: Brain,
  hggsp: Globe, hlp: BookOpenText, dgemc: Gavel, llca: Amphora, eppcs: Dumbbell, "arts-spe": Palette,
};
const GLYPHS: Partial<Record<SubjectId, string>> = { anglais: "EN", espagnol: "ES", allemand: "DE", llcer: "EN+", latin: "LA", grec: "ΓΡ" };

/** Variable CSS --sub : la couleur de la matière, reprise par .chip-sub, .ring, .bar… */
export const subStyle = (subject: SubjectId) => ({ "--sub": SUBJECTS[subject].color }) as CSSProperties;

export function SubjectIcon({ subject, size = 20 }: { subject: SubjectId; size?: number }) {
  const Icon = ICONS[subject];
  if (Icon) return <Icon size={size} strokeWidth={2.3} aria-hidden="true" />;
  const g = GLYPHS[subject] ?? SUBJECTS[subject].short.slice(0, 2).toUpperCase();
  return (
    <span className="sub-glyph" style={{ fontSize: Math.round(size * (g.length > 2 ? 0.5 : 0.62)) }} aria-hidden="true">
      {g}
    </span>
  );
}

/** Pastille pleine de la couleur de la matière, icône blanche. */
export function SubjectTile({ subject, size = "md", className }: { subject: SubjectId; size?: "sm" | "md" | "lg"; className?: string }) {
  const px = size === "sm" ? 18 : size === "lg" ? 28 : 22;
  return (
    <span className={cx("sub-tile", `sub-tile-${size}`, className)} style={subStyle(subject)} aria-hidden="true">
      <SubjectIcon subject={subject} size={px} />
    </span>
  );
}

export function SubjectChip({ subject, children, small }: { subject: SubjectId; children?: React.ReactNode; small?: boolean }) {
  return (
    <span className={cx("chip chip-sub", small && "chip-sm")} style={subStyle(subject)}>
      {children ?? SUBJECTS[subject].short}
    </span>
  );
}
