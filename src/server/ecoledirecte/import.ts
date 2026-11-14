/**
 * Transforme le cahier de textes ÉcoleDirecte en devoirs LearnWard : matière de l'appli, chapitre reconnu, contrôle ou pas.
 */
import type { Track } from "@/lib/curriculum/levels";
import type { Level } from "@/lib/curriculum/types";
import { homeworkDays, homeworkOfDay, type EdAccount } from "./client";
import { matchAcross } from "./match";
import { candidatesFor, guessSubject } from "./subjects";

/** Ce qu'on envoie à la fonction SQL import_homework. */
export interface HomeworkItem {
  sourceId: string;
  dueDate: string;
  subjectLabel: string;
  subject: string | null;
  unitId: string | null;
  isTest: boolean;
  text: string | null;
  done: boolean;
}

const MAX_DAYS = 14; // deux semaines de devoirs à venir suffisent pour planifier les révisions

/** Date du jour à Paris (le serveur tourne en heure UTC). */
export function todayInParis(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export async function collectHomework(account: EdAccount, token: string, level: Level, track: Track, today: string): Promise<HomeworkItem[]> {
  const days = (await homeworkDays(account, token)).filter((d) => d >= today).sort().slice(0, MAX_DAYS);
  const perDay = await Promise.all(days.map(async (day) => ({ day, items: await homeworkOfDay(account, token, day) })));
  const out: HomeworkItem[] = [];
  for (const { day, items } of perDay) {
    items.forEach((it, i) => {
      const guess = guessSubject(it.matiere, it.codeMatiere);
      const candidates = candidatesFor(guess, level, track);
      const found = matchAcross(it.aFaire, level, candidates);
      out.push({
        sourceId: it.idDevoir ? String(it.idDevoir) : `${day}|${it.codeMatiere ?? it.matiere}|${i}`.slice(0, 100),
        dueDate: day,
        subjectLabel: guess.label,
        subject: found?.subject ?? candidates[0] ?? null,
        unitId: found?.match.unit.id ?? null,
        isTest: it.interrogation,
        text: it.aFaire ? it.aFaire.slice(0, 2000) : null,
        done: it.effectue,
      });
    });
  }
  return out;
}
