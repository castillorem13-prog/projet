"use client";

import { BookOpen, Compass, Flame, House, PiggyBank, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { frEuros, spendable } from "@/lib/rewards";
import { useStore, useStreak } from "@/lib/store";

/** « Programme » regroupe les matières, les progrès, les épreuves blanches et le bac de français. */
const PROGRAMME = ["/reviser", "/progres", "/epreuves", "/bac-francais"];

const ITEMS = [
  { href: "/", label: "Accueil", Icon: House, match: (p: string) => p === "/" },
  { href: "/reviser", label: "Programme", Icon: BookOpen, match: (p: string) => PROGRAMME.some((x) => p.startsWith(x)) },
  { href: "/explorer", label: "Explorer", Icon: Compass, match: (p: string) => p.startsWith("/explorer") },
  { href: "/cagnotte", label: "Cagnotte", Icon: PiggyBank, match: (p: string) => p.startsWith("/cagnotte") },
  { href: "/moi", label: "Moi", Icon: UserRound, match: (p: string) => p.startsWith("/moi") },
];

/** Navigation principale : barre du bas (téléphone), rail (tablette), barre latérale (ordinateur). */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useStore();
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (!state.onboarded) router.replace("/bienvenue");
  }, [state.onboarded, router]);

  // À chaque changement de page : retour en haut et focus sur le contenu (lecteurs d'écran).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    main.current?.focus({ preventScroll: true });
  }, [pathname]);

  const p = state.profile;
  const streak = useStreak();
  return (
    <>
      <a className="skip-link" href="#main">Aller au contenu</a>
      <nav className="nav" aria-label="Navigation principale">
        <Link href="/" className="nav-brand" aria-label="LearnWard, accueil">
          <span className="logo-mark" aria-hidden="true">L</span>
          <span className="wordmark">learnward</span>
        </Link>
        <div className="nav-items">
          {ITEMS.map(({ href, label, Icon, match }) => {
            const on = match(pathname);
            return (
              <Link key={href} href={href} className={cx("nav-item", on && "is-active")} aria-current={on ? "page" : undefined}>
                <span className="nav-pill"><Icon size={22} strokeWidth={on ? 2.6 : 2.1} /></span>
                {label}
              </Link>
            );
          })}
        </div>
        <Link href="/moi" className="nav-user">
          <span className="avatar avatar-sm" aria-hidden="true">{p.pseudo.slice(0, 1).toUpperCase()}</span>
          <span>
            <strong>{p.pseudo}</strong>
            <span>
              <span><Flame size={14} strokeWidth={2.6} /> {streak.days} j</span>
              <span><PiggyBank size={14} strokeWidth={2.6} /> {frEuros(spendable(state.wallet))}</span>
            </span>
          </span>
        </Link>
      </nav>
      <main id="main" ref={main} tabIndex={-1} className="page">
        <div className="page-inner" key={pathname}>{children}</div>
      </main>
    </>
  );
}
