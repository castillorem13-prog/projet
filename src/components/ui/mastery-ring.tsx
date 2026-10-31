import type { SubjectId } from "@/lib/content/types";
import { cx } from "@/lib/cx";
import { subStyle } from "./subject-icon";

export function MasteryRing({ value, subject, size = "md", label }: { value: number; subject: SubjectId; size?: "sm" | "md" | "lg"; label?: string }) {
  const r = 19;
  const c = 2 * Math.PI * r;
  return (
    <span className={cx("ring", `ring-${size}`)} style={subStyle(subject)} role="img" aria-label={label ?? `Maîtrise ${value} %`}>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r={r} className="ring-track" />
        <circle cx="24" cy="24" r={r} className="ring-value" strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 24 24)" />
      </svg>
      <span aria-hidden="true">{value}</span>
    </span>
  );
}
