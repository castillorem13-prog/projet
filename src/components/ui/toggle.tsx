import { cx } from "@/lib/cx";

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={cx("toggle", on && "is-on")} onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}
