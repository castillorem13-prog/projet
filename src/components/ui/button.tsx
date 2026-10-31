import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

type Variant = "ink" | "yellow" | "ghost" | "green" | "soft";

export function Button({
  variant = "ink",
  block = false,
  size = "lg",
  icon,
  trailing,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  block?: boolean;
  size?: "lg" | "md";
  icon?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <button type="button" className={cx("btn", `btn-${variant}`, size === "md" && "btn-md", block && "btn-block", className)} {...rest}>
      {icon}
      <span>{children}</span>
      {trailing}
    </button>
  );
}
