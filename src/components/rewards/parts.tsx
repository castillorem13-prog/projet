"use client";

import { BadgePercent, BookOpen, CalendarRange, Gift, HandCoins, Handshake, HeartHandshake, Timer, Trophy } from "lucide-react";
import type { CSSProperties } from "react";
import { TODAY, daysBetween, shortDay } from "@/lib/content/calendar";
import { cx } from "@/lib/cx";
import { frPoints, partner, type EntryKind, type LedgerEntry, type Reward } from "@/lib/rewards";

const MONTHS_SHORT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

export function relativeDay(iso: string): string {
  const d = new Date(iso);
  const n = daysBetween(d, TODAY);
  if (n === 0) return "Aujourd'hui";
  if (n === 1) return "Hier";
  if (n === -1) return "Demain";
  const s = shortDay(d);
  return `${s.day} ${s.num} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function longDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate() === 1 ? "1er" : d.getDate()} ${["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"][d.getMonth()]}`;
}

const ENTRY_ICON: Record<EntryKind, typeof Gift> = { session: BookOpen, exam: Timer, challenge: Trophy, cashback: BadgePercent, sponsored: Handshake, redeem: Gift, summary: CalendarRange };

export function LedgerRow({ e }: { e: LedgerEntry }) {
  const Icon = ENTRY_ICON[e.kind];
  return (
    <li className={cx("ledger-row", `is-${e.kind}`, e.pending && "is-pending")}>
      <span className="ledger-icon"><Icon size={19} strokeWidth={2.4} /></span>
      <span className="ledger-main">
        <strong>{e.label}</strong>
        <span>{[e.detail, relativeDay(e.at)].filter(Boolean).join(" · ")}</span>
        {e.pending && e.availableOn ? <span className="ledger-wait">En attente, disponible le {longDay(e.availableOn)}</span> : null}
      </span>
      <span className="ledger-amount">{frPoints(e.points, { sign: true }).replace(" points", "")}</span>
    </li>
  );
}

/** Visuel d'une récompense : carte cadeau à la couleur du partenaire, virement, don. */
export function RewardArt({ r, size = "md" }: { r: Reward; size?: "md" | "lg" }) {
  if (r.kind === "gift" && r.partnerId) {
    const p = partner(r.partnerId);
    return (
      <span className={cx("reward-art", `reward-art-${size}`)} style={{ "--art": p.color } as CSSProperties} aria-hidden="true">
        <span className="reward-mark">{p.mark}</span>
        <span className="reward-value">{r.euros} €</span>
      </span>
    );
  }
  const Icon = r.kind === "transfer" ? HandCoins : HeartHandshake;
  return (
    <span className={cx("reward-art", `reward-art-${size}`, `is-${r.kind}`)} aria-hidden="true">
      <Icon size={size === "lg" ? 34 : 24} strokeWidth={2.2} />
      <span className="reward-value">{r.euros} €</span>
    </span>
  );
}

export function PartnerTile({ id, size = "md" }: { id: string; size?: "md" | "lg" }) {
  const p = partner(id);
  return (
    <span className={cx("partner-tile", size === "lg" && "is-lg")} style={{ "--art": p.color } as CSSProperties} aria-hidden="true">
      {p.mark}
    </span>
  );
}
