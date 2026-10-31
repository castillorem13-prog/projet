"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";
import { useStore } from "@/lib/store";

/** Onglets de « Programme » : un seul endroit pour les matières, les progrès et les épreuves. */
export function SectionTabs() {
  const pathname = usePathname();
  const { state } = useStore();
  const tabs = [
    { href: "/reviser", label: "Matières" },
    { href: "/progres", label: "Progrès" },
    { href: "/epreuves", label: "Épreuves" },
    ...(state.profile.grade === "1re" ? [{ href: "/bac-francais", label: "Bac de français" }] : []),
  ];
  return (
    <nav className="section-tabs" aria-label="Programme">
      {tabs.map((t) => {
        const on = pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link key={t.href} href={t.href} className={cx("section-tab", on && "is-on")} aria-current={on ? "page" : undefined}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
