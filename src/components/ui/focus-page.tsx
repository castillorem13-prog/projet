import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/** Écran de concentration : barre du haut, contenu centré, dock d'action collé en bas. */
export function FocusPage({ top, dock, wide, className, children }: { top?: ReactNode; dock?: ReactNode; wide?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={cx("focus", wide && "focus-wide", className)}>
      {top ? (
        <header className="topbar">
          <div className="topbar-inner">{top}</div>
        </header>
      ) : null}
      <main id="main" tabIndex={-1} className="focus-body">
        {children}
      </main>
      {dock ? (
        <footer className="dock">
          <div className="dock-inner">{dock}</div>
        </footer>
      ) : null}
    </div>
  );
}
