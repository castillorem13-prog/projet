"use client";

import { ArrowLeft, Check, ChevronRight, Download, PiggyBank, ShieldCheck, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Segmented } from "@/components/ui/segmented";
import { Toggle } from "@/components/ui/toggle";
import { findUnit, statusIn } from "@/lib/curriculum";
import { getLevel, studentSubjects } from "@/lib/curriculum/levels";
import { MASTERY, UNLOCK_STATE, atLeast } from "@/lib/learning/mastery";
import { frEuros, frPoints, reward, spendable, weekEntries, type ParentRules } from "@/lib/rewards";
import { decideReward, minutesThisWeek, useMastery, useStore } from "@/lib/store";

export function ParentScreen() {
  const { state, update } = useStore();
  const profile = state.profile;
  const w = state.wallet;
  const mastery = useMastery();
  const pendingReq = w.redemptions.filter((r) => r.status === "pending");
  const week = weekEntries(w).filter((e) => e.kind === "session" || e.kind === "exam");
  const minutes = minutesThisWeek(state);
  const setParent = (patch: Partial<ParentRules>) => update((s) => ({ ...s, wallet: { ...s.wallet, parent: { ...s.wallet.parent, ...patch } } }));
  const worked = studentSubjects(profile.grade, profile.track).flatMap((s) => {
    const p = state.progress[s.subject];
    return (p?.order ?? []).filter((id) => statusIn(p, id) !== "a-venir").map(findUnit).filter((u) => u !== undefined);
  });
  const solid = worked.filter((u) => atLeast(mastery(u.id), UNLOCK_STATE)).length;
  const fragile = worked.filter((u) => MASTERY[mastery(u.id)].rank === 2);
  const { consent, weekly, themed } = w.parent;
  const [dialog, setDialog] = useState<"export" | "delete" | "withdraw" | null>(null);
  const [done, setDone] = useState(false);
  const open = (d: "export" | "delete" | "withdraw") => {
    setDone(false);
    setDialog(d);
  };

  const titles = { export: "Exporter les données", delete: "Supprimer le compte", withdraw: "Retirer l'accord" };
  const texts = {
    export: "Vous recevrez un fichier avec le profil, l'historique des séances et les réglages.",
    delete: "Le compte et tout l'historique seront effacés. Cette action est définitive.",
    withdraw: `${profile.pseudo} ne pourra plus utiliser l'application tant qu'un nouvel accord n'est pas donné.`,
  };

  return (
    <div className="parent">
      <header className="sub-top">
        <Link href="/moi" className="icon-btn" aria-label="Retour à Moi">
          <ArrowLeft size={24} />
        </Link>
      </header>
      <header className="page-top">
        <h1 className="h1">Espace parent</h1>
        <p className="muted">Pour suivre {profile.pseudo} ({getLevel(profile.grade).label}) et gérer ses données. Aucune publicité ciblée, aucune donnée transmise aux partenaires de la cagnotte.</p>
      </header>

      <div className="parent-grid">
      <div className="parent-col">
      <section className="consent-card">
        <span className="consent-icon"><ShieldCheck size={26} strokeWidth={2.4} /></span>
        <div>
          <strong>{consent ? "Accord donné" : "Accord retiré"}</strong>
          <p>{consent ? "Le 29 octobre 2026, après lecture de la notice d'information (version 1.2)." : "Le compte est en pause."}</p>
          {consent ? (
            <button type="button" className="text-btn" onClick={() => open("withdraw")}>Retirer l'accord</button>
          ) : (
            <button type="button" className="text-btn" onClick={() => setParent({ consent: true })}>Redonner l'accord</button>
          )}
        </div>
      </section>

      <section className="block" aria-labelledby="w-title">
        <h2 id="w-title" className="h2">Cette semaine</h2>
        <dl className="week-summary">
          <div><dt>Temps de révision</dt><dd>{minutes} min</dd></div>
          <div><dt>Séances terminées</dt><dd>{week.length}</dd></div>
          <div><dt>Chapitres maîtrisés</dt><dd>{solid}<span className="dd-unit"> sur {worked.length} vus</span></dd></div>
          <div><dt>À consolider</dt><dd className="is-text">{fragile[0]?.title ?? "Rien d'urgent"}</dd></div>
        </dl>
        <p className="muted small">Vous voyez la régularité et la maîtrise par chapitre, pas le détail de chaque réponse. La maîtrise ne dépend pas des points gagnés.</p>
      </section>

      <section className="block" aria-labelledby="cg-title">
        <div className="block-head">
          <h2 id="cg-title" className="h2">Cagnotte</h2>
          <span className="wallet-chip"><PiggyBank size={16} strokeWidth={2.6} /> {frEuros(spendable(w))}</span>
        </div>
        {profile.under15 ? (
          pendingReq.length ? (
            <ul className="approve-list">
              {pendingReq.map((r) => {
                const rw = reward(r.rewardId);
                return (
                  <li key={r.id} className="approve-row">
                    <span className="approve-main">
                      <strong>{rw.title} {rw.euros} €</strong>
                      <span className="muted small">{frPoints(r.points)} · {rw.detail}</span>
                    </span>
                    <span className="approve-actions">
                      <Button variant="ghost" icon={<X size={18} />} onClick={() => update((s) => decideReward(s, r.id, false))}>Refuser</Button>
                      <Button icon={<Check size={18} />} onClick={() => update((s) => decideReward(s, r.id, true))}>Valider</Button>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted">Aucune demande en attente. Avant 15 ans, chaque utilisation de la cagnotte vous est soumise.</p>
          )
        ) : (
          <p className="muted">{profile.pseudo} a 15 ans ou plus : il ou elle utilise sa cagnotte sans validation.</p>
        )}
        <div className="setting">
          <span className="setting-main"><strong>Exercices partenaires</strong><span>Un exercice par séance au plus, signalé, écrit avec une enseigne partenaire et récompensé par des points. Désactivés, {profile.pseudo} fait la même version sans marque.</span></span>
          <Toggle on={w.parent.sponsored !== false} onChange={(sponsored) => setParent({ sponsored })} label="Exercices partenaires" />
        </div>
        <div className="setting">
          <span className="setting-main"><strong>Offres de cashback des partenaires</strong><span>Masquées, la cagnotte ne grandit qu'avec les révisions.</span></span>
          <Toggle on={w.parent.offers} onChange={(offers) => setParent({ offers })} label="Offres de cashback" />
        </div>
        <div className="setting setting-col">
          <span className="setting-main"><strong>Plafond d'utilisation par mois</strong><span>Au-delà, une demande est refusée automatiquement.</span></span>
          <Segmented<string>
            label="Plafond mensuel"
            value={String(w.parent.monthlyCap)}
            onChange={(v) => setParent({ monthlyCap: Number(v) })}
            options={[10, 20, 30, 50].map((n) => ({ id: String(n), label: `${n} €` }))}
          />
        </div>
      </section>

      </div>
      <div className="parent-col">
      <section className="block block-first-wide" aria-labelledby="s-title">
        <h2 id="s-title" className="h2">Réglages</h2>
        <div className="setting">
          <span className="setting-main"><strong>Résumé chaque dimanche</strong><span>Par e-mail à {profile.parentEmail}</span></span>
          <Toggle on={weekly} onChange={(v) => setParent({ weekly: v })} label="Résumé hebdomadaire" />
        </div>
        <div className="setting">
          <span className="setting-main"><strong>Énoncés personnalisés</strong><span>Exercices écrits autour des passions de {profile.pseudo}</span></span>
          <Toggle on={themed} onChange={(v) => setParent({ themed: v })} label="Énoncés personnalisés" />
        </div>
      </section>

      <section className="block" aria-labelledby="d-title">
        <h2 id="d-title" className="h2">Données</h2>
        <button type="button" className="setting setting-link" onClick={() => open("export")}>
          <span className="setting-icon"><Download size={22} strokeWidth={2.4} /></span>
          <span className="setting-main"><strong>Exporter les données</strong><span>Une copie complète, au format lisible</span></span>
          <ChevronRight size={22} />
        </button>
        <button type="button" className="setting setting-link is-danger" onClick={() => open("delete")}>
          <span className="setting-icon"><Trash2 size={22} strokeWidth={2.4} /></span>
          <span className="setting-main"><strong>Supprimer le compte</strong><span>Effacement de tout l'historique</span></span>
          <ChevronRight size={22} />
        </button>
        <p className="muted small parent-transparency">
          Comment LearnWard adapte le travail : à partir des réponses de votre enfant, calculées sur l'appareil, l'appli choisit les objectifs du jour et applique des méthodes reconnues (modèles en barres et démarche en trois questions inspirés de Singapour en maths, oral d'abord et écoute quotidienne inspirés des pays nordiques en langues, révisions espacées et entrelacées). Votre enfant n'a rien à régler.
        </p>
      </section>

      </div>
      </div>

      <Sheet open={dialog !== null} title={dialog ? titles[dialog] : ""} onClose={() => setDialog(null)}>
        <p className="sheet-text">{done ? "Démo : rien n'a été envoyé, exporté ni supprimé." : dialog ? texts[dialog] : ""}</p>
        <div className="sheet-actions">
          {done ? (
            <Button block onClick={() => setDialog(null)}>Fermer</Button>
          ) : (
            <>
              <Button
                block
                onClick={() => {
                  if (dialog === "withdraw") setParent({ consent: false });
                  setDone(true);
                }}
              >
                {dialog === "export" ? "Préparer l'export" : dialog === "delete" ? "Supprimer définitivement" : "Retirer l'accord"}
              </Button>
              <Button block variant="ghost" onClick={() => setDialog(null)}>Annuler</Button>
            </>
          )}
        </div>
      </Sheet>
    </div>
  );
}
