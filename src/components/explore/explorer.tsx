"use client";

import { Check, ChevronRight, Clock3 } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { CAPSULES } from "@/lib/content/catalog";
import { TRACKS } from "@/lib/explore/tracks";
import { cx } from "@/lib/cx";
import { useStore } from "@/lib/store";

/** Explorer : des parcours courts pour le plaisir, hors programme. Pas de note, pas de maîtrise, pas de rappel. */
export function ExplorerScreen() {
  const { state } = useStore();
  const done = CAPSULES.filter((c) => state.explore[c.id]).length;
  return (
    <div className="explorer">
      <header className="page-top explorer-top">
        <h1 className="h1">Explorer</h1>
        <p className="muted">Pour le plaisir. Pas de note, juste des choses à savoir faire. <span className="num">{done}/{CAPSULES.length}</span></p>
      </header>
      <div className="tracks">
        {TRACKS.map((t) => {
          const list = CAPSULES.filter((c) => c.track === t.id);
          const n = list.filter((c) => state.explore[c.id]).length;
          return (
            <section key={t.id} className="track" style={{ "--track": t.color, "--track-ink": t.ink } as CSSProperties} aria-labelledby={`tr-${t.id}`}>
              <div className="track-head">
                <h2 id={`tr-${t.id}`} className="track-title">{t.title}</h2>
                <p className="track-tagline">{t.tagline}</p>
                <span className="track-count num" aria-label={`${n} capsule${n > 1 ? "s" : ""} terminée${n > 1 ? "s" : ""} sur ${list.length}`}>{n}/{list.length}</span>
              </div>
              <ol className="capsules">
                {list.map((c, i) => {
                  const ok = Boolean(state.explore[c.id]);
                  return (
                    <li key={c.id}>
                      <Link href={`/explorer/${c.id}`} className={cx("capsule", ok && "is-done")}>
                        <span className="capsule-n">{ok ? <Check size={18} strokeWidth={3} aria-label="Terminée" /> : i + 1}</span>
                        <span className="capsule-main">
                          <strong>{c.title}</strong>
                          <span>{c.promise}</span>
                        </span>
                        <span className="capsule-min"><Clock3 size={14} strokeWidth={2.6} aria-hidden="true" /> {c.minutes} min</span>
                        <ChevronRight size={20} strokeWidth={2.6} aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
