"use client";

import { Check, ChevronDown, Copy, Hourglass, Info, ShieldCheck, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LedgerRow, PartnerTile, RewardArt, longDay } from "@/components/rewards/parts";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { prevLevel } from "@/lib/curriculum";
import { getLevel, levelRank } from "@/lib/curriculum/levels";
import { SESSIONS } from "@/lib/content/catalog";
import { SUBJECTS } from "@/lib/content/meta";
import { SPONSORSHIPS, sponsorshipsOf } from "@/lib/content/sponsored";
import { TODAY, sameDay } from "@/lib/content/calendar";
import { cx } from "@/lib/cx";
import {
  DAILY_PACE,
  SPONSOR_DAILY_CAP,
  PARTNERS,
  REWARDS,
  challengeStates,
  frEuros,
  frPoints,
  partner,
  pendingPoints,
  redeemBlock,
  reservedPoints,
  reward,
  rewardPoints,
  spendable,
  type Reward,
} from "@/lib/rewards";
import { requestReward, useStore } from "@/lib/store";

const STATUS = { pending: "En attente de ton parent", approved: "Validée", refused: "Refusée par ton parent" } as const;

export function WalletScreen() {
  const { state, update } = useStore();
  const w = state.wallet;
  const p = state.profile;
  const [rewardId, setRewardId] = useState<string | null>(null);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const [allHistory, setAllHistory] = useState(false);
  const [allGifts, setAllGifts] = useState(false);
  const [allSponsored, setAllSponsored] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);

  const available = spendable(w);
  const pending = pendingPoints(w);
  const reserved = reservedPoints(w);
  const goal = reward(w.goalId);
  const goalPts = rewardPoints(goal);
  const goalPct = Math.min(100, Math.round((available / goalPts) * 100));
  const missing = Math.max(0, goalPts - available);
  const weeks = Math.ceil(missing / DAILY_PACE / 7);
  const challenges = challengeStates(w, prevLevel(p.grade));
  const pendingCashback = w.ledger.find((e) => e.pending);
  const history = allHistory ? w.ledger : w.ledger.slice(0, 6);
  const gifts = REWARDS.filter((r) => r.kind === "gift").sort((a, b) => Number(b.id === w.goalId) - Number(a.id === w.goalId) || a.euros - b.euros);
  const others = REWARDS.filter((r) => r.kind !== "gift");
  const shownRewards = [...(allGifts ? gifts : gifts.slice(0, 4)), ...others];
  // Exercices partenaires : ceux de la classe de l'élève d'abord, puis les classes voisines (révision, avance).
  const sponsoredAll = SPONSORSHIPS.filter((sp) => SESSIONS[sp.sessionId]).sort(
    (a, b) => Math.abs(levelRank(SESSIONS[a.sessionId]!.grade) - levelRank(p.grade)) - Math.abs(levelRank(SESSIONS[b.sessionId]!.grade) - levelRank(p.grade)),
  );
  const sponsoredShown = allSponsored ? sponsoredAll : sponsoredAll.slice(0, 4);
  const sponsoredToday = w.ledger.filter((e) => e.kind === "sponsored" && sameDay(new Date(e.at), TODAY)).reduce((n, e) => n + e.points, 0);

  return (
    <div className="wallet">
      <header className="page-top">
        <h1 className="h1">Ta cagnotte</h1>
        <p className="muted">Tu révises, tu gagnes des points : 1 000 points = 1 €. Ils n'expirent jamais.</p>
      </header>

      <div className="wallet-grid">
        <div className="wallet-main">
          <section className="wallet-hero on-yellow" aria-labelledby="amount">
            <p className="wallet-kicker">Disponible</p>
            <p id="amount" className="wallet-amount">{frEuros(available)}</p>
            <p className="wallet-points">{frPoints(available)}</p>
            {pending > 0 && pendingCashback ? (
              <p className="wallet-line">
                <Hourglass size={16} strokeWidth={2.6} /> {frEuros(pending, { sign: true })} en attente : {pendingCashback.label.replace(/^Cashback/, "cashback")}, disponible le {longDay(pendingCashback.availableOn ?? pendingCashback.at)}
              </p>
            ) : null}
            {reserved > 0 ? (
              <p className="wallet-line">
                <ShieldCheck size={16} strokeWidth={2.6} /> {frEuros(reserved)} réservés : ta demande attend l'accord de ton parent
              </p>
            ) : null}

            <div className="goal">
              <div className="goal-head">
                <span><Target size={17} strokeWidth={2.6} /> Ton objectif</span>
                <button type="button" className="text-btn" onClick={() => setGoalOpen(true)}>Changer</button>
              </div>
              <button type="button" className="goal-main" onClick={() => setRewardId(goal.id)}>
                <RewardArt r={goal} />
                <span>
                  <strong>{goal.title} {goal.euros} €</strong>
                  <span>{missing ? `Encore ${frPoints(missing)}` : "Objectif atteint : tu peux l'utiliser"}</span>
                </span>
              </button>
              <span className="goal-bar" role="img" aria-label={`${goalPct} % de l'objectif`}>
                <span style={{ width: `${goalPct}%` }} />
              </span>
              <p className="goal-note">
                {missing ? `${goalPct} %. À ton rythme, environ ${weeks} semaine${weeks > 1 ? "s" : ""} ; les défis et le cashback accélèrent.` : "Bravo, tu as réuni la somme."}
              </p>
            </div>
          </section>

          {w.redemptions.length ? (
            <section className="block" aria-labelledby="req-title">
              <h2 id="req-title" className="h2">Tes demandes</h2>
              <ul className="request-list">
                {w.redemptions.map((r) => {
                  const rw = reward(r.rewardId);
                  return (
                    <li key={r.id} className={cx("request", `is-${r.status}`)}>
                      <RewardArt r={rw} />
                      <span className="request-main">
                        <strong>{rw.title} {rw.euros} €</strong>
                        <span className="request-status">{STATUS[r.status]}</span>
                        {r.code ? (
                          revealed === r.id ? (
                            <span className="gift-code">
                              <code>{r.code}</code>
                              <button type="button" className="icon-btn icon-btn-sm" aria-label="Copier le code" onClick={() => navigator.clipboard?.writeText(r.code ?? "").catch(() => undefined)}>
                                <Copy size={16} />
                              </button>
                            </span>
                          ) : (
                            <button type="button" className="text-btn" onClick={() => setRevealed(r.id)}>Voir le code</button>
                          )
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <section className="block" aria-labelledby="ch-title">
            <div className="block-head">
              <h2 id="ch-title" className="h2">Défis de la semaine</h2>
              <span className="muted small">Jusqu'à dimanche</span>
            </div>
            <ul className="challenges">
              {challenges.map(({ challenge: c, value, done }) => (
                <li key={c.id} className={cx("challenge", done && "is-done")}>
                  <span className="challenge-icon">{done ? <Check size={20} strokeWidth={3} /> : <Trophy size={20} strokeWidth={2.4} />}</span>
                  <span className="challenge-main">
                    <strong>{c.title(prevLevel(p.grade))}</strong>
                    <span className="challenge-bar" aria-hidden="true"><span style={{ width: `${(value / c.goal) * 100}%` }} /></span>
                    <span className="muted small">{done ? "Réussi, points crédités" : `${value} sur ${c.goal}`}</span>
                  </span>
                  <span className="challenge-points">+{c.points}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="block" aria-labelledby="sp-title">
            <div className="block-head">
              <h2 id="sp-title" className="h2">Exercices partenaires</h2>
              <span className="muted small num">Aujourd'hui {sponsoredToday}/{SPONSOR_DAILY_CAP} pts</span>
            </div>
            {w.parent.sponsored !== false ? (
              <>
                <p className="muted small">Dans certaines séances, un exercice est écrit avec un partenaire. Termine-le : le partenaire t'offre des points, que ta réponse soit juste ou non. Il ne voit jamais tes résultats.</p>
                <ul className="sponsored-list">
                  {sponsoredShown.map((sp) => {
                    const pt = partner(sp.partnerId);
                    const session = SESSIONS[sp.sessionId];
                    if (!session) return null;
                    const doneToday = w.ledger.some((e) => e.kind === "sponsored" && e.activityId === sp.activityId && sameDay(new Date(e.at), TODAY));
                    return (
                      <li key={sp.activityId}>
                        <Link href={`/seance/${session.id}`} className={cx("sponsored-row", doneToday && "is-done")}>
                          <PartnerTile id={pt.id} />
                          <span className="sponsored-main">
                            <strong>{sp.pitch}</strong>
                            <span className="muted small">{pt.name} · {SUBJECTS[session.subject].short}, {getLevel(session.grade).label} · {session.notion}</span>
                          </span>
                          <span className="sponsored-bonus">{doneToday ? <Check size={16} strokeWidth={3} /> : `+${sp.bonus}`}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {sponsoredAll.length > 4 && (
                  <button type="button" className="text-btn ledger-more" aria-expanded={allSponsored} onClick={() => setAllSponsored(!allSponsored)}>
                    {allSponsored ? "Moins d'exercices" : `Tous les exercices partenaires (${sponsoredAll.length})`}
                  </button>
                )}
              </>
            ) : (
              <p className="notice notice-soft">Ton parent a désactivé les exercices partenaires : tes séances utilisent la version sans marque.</p>
            )}
          </section>

          <section className="block" aria-labelledby="cb-title">
            <h2 id="cb-title" className="h2">Cashback partenaires</h2>
            {w.parent.offers ? (
              <>
                <p className="muted small">Une partie de ce que ta famille achète chez eux revient dans ta cagnotte.</p>
                <ul className="offers">
                  {PARTNERS.map((pt) => {
                    const on = w.activeOffers.includes(pt.id);
                    return (
                      <li key={pt.id}>
                        <button type="button" className={cx("offer", on && "is-on")} onClick={() => setOfferId(pt.id)}>
                          <PartnerTile id={pt.id} />
                          <span className="offer-main">
                            <strong>{pt.name}</strong>
                            <span>{pt.category}{sponsorshipsOf(pt.id).length ? ` · ${sponsorshipsOf(pt.id).length} exercice${sponsorshipsOf(pt.id).length > 1 ? "s" : ""}` : ""}</span>
                          </span>
                          <span className="offer-rate">{pt.rate} %</span>
                          {on ? <span className="offer-on"><Check size={13} strokeWidth={3.4} /> Activée</span> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="muted small wallet-fine">
                  <Info size={15} strokeWidth={2.4} /> Enseignes fictives, inventées pour la démo. Mêmes offres pour tous les élèves : elles ne dépendent ni de tes passions ni de tes résultats, et aucune de tes données n'est transmise aux marques.
                </p>
              </>
            ) : (
              <p className="notice notice-soft">Ton parent a masqué les offres des partenaires. Tu gagnes toujours des points en révisant.</p>
            )}
          </section>
        </div>

        <div className="wallet-side">
          <section className="block block-first" aria-labelledby="use-title">
            <h2 id="use-title" className="h2">Utiliser ta cagnotte</h2>
            <ul className="rewards">
              {shownRewards.map((r) => {
                const cost = rewardPoints(r);
                const ok = available >= cost;
                return (
                  <li key={r.id}>
                    <button type="button" className={cx("reward", ok && "is-ok", r.id === w.goalId && "is-goal")} onClick={() => setRewardId(r.id)}>
                      <RewardArt r={r} />
                      <span className="reward-main">
                        <strong>{r.title}</strong>
                        <span className={cx("reward-state", ok && "is-ok")}>{ok ? "Disponible" : `Encore ${frEuros(cost - available)}`}</span>
                      </span>
                      {r.id === w.goalId ? <span className="reward-goal"><Target size={14} strokeWidth={2.8} /> Objectif</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            {gifts.length > 4 ? (
              <button type="button" className="text-btn ledger-more" aria-expanded={allGifts} onClick={() => setAllGifts(!allGifts)}>
                {allGifts ? "Moins de cartes" : `Toutes les cartes cadeaux (${gifts.length})`}
              </button>
            ) : null}
          </section>

          <section className="block" aria-labelledby="hist-title">
            <h2 id="hist-title" className="h2">Historique</h2>
            <ul className="ledger">
              {history.map((e) => (
                <LedgerRow key={e.id} e={e} />
              ))}
            </ul>
            {w.ledger.length > 6 ? (
              <button type="button" className="text-btn ledger-more" onClick={() => setAllHistory(!allHistory)} aria-expanded={allHistory}>
                {allHistory ? "Afficher moins" : `Tout afficher (${w.ledger.length})`}
              </button>
            ) : null}
          </section>

          <details className="how block">
            <summary>
              <span className="h2">Comment ça marche</span>
              <ChevronDown size={22} className="chev" />
            </summary>
            <ul>
              <li><strong>En révisant.</strong> Une séance rapporte de 10 à 30 points, plus un bonus de régularité jusqu'à +50 %. Au maximum 150 points par jour, pour que réviser reste un plaisir et pas une course.</li>
              <li><strong>Avec les exercices partenaires.</strong> Quand une séance contient un exercice écrit avec un partenaire, le terminer rapporte de 10 à 15 points offerts par lui, au plus {SPONSOR_DAILY_CAP} par jour. Le résultat ne change rien au bonus, et rien à ta maîtrise.</li>
              <li><strong>Avec les défis.</strong> Chaque semaine, des défis rapportent un bonus : réviser plusieurs jours, plusieurs matières, faire un contrôle blanc.</li>
              <li><strong>Avec le cashback.</strong> Quand ta famille achète chez un partenaire avec ton code, une partie revient dans ta cagnotte, disponible 30 jours plus tard.</li>
              <li><strong>Pour l'utiliser.</strong> Cartes cadeaux, virement à un parent ou don. {p.under15 ? "Avant 15 ans, ton parent valide chaque demande." : "Tu utilises ta cagnotte toi-même."}</li>
            </ul>
            <p className="muted small">Démo : partenaires fictifs, aucun achat, aucun virement réel. Dans le produit, les récompenses sont financées par les partenaires.</p>
          </details>
        </div>
      </div>

      <RewardSheet id={rewardId} onClose={() => setRewardId(null)} />
      <OfferSheet id={offerId} onClose={() => setOfferId(null)} />
      <Sheet open={goalOpen} title="Choisir ton objectif" onClose={() => setGoalOpen(false)}>
        <div className="report-list" role="radiogroup" aria-label="Objectif">
          {REWARDS.filter((r) => r.kind !== "donation").map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={w.goalId === r.id}
              className={cx("report-option goal-option", w.goalId === r.id && "is-on")}
              onClick={() => {
                update((s) => ({ ...s, wallet: { ...s.wallet, goalId: r.id } }));
                setGoalOpen(false);
              }}
            >
              <RewardArt r={r} />
              <span>{r.title} {r.euros} €</span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

function RewardSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { state, update } = useStore();
  const [sent, setSent] = useState<string | null>(null);
  if (!id) return null;
  const r: Reward = reward(id);
  const w = state.wallet;
  const p = state.profile;
  const cost = rewardPoints(r);
  const available = spendable(w);
  const block = redeemBlock(w, r);
  const ok = block !== "funds";
  const overCap = block === "cap";
  const close = () => {
    setSent(null);
    onClose();
  };

  return (
    <Sheet open title={`${r.title} ${r.euros} €`} onClose={close}>
      <div className="rsheet">
        <RewardArt r={r} size="lg" />
        {sent ? (
          <>
            <p className="sheet-text">
              {p.under15 ? `Demande envoyée à ton parent (${p.parentEmail}). Tes ${frPoints(cost)} sont réservés en attendant sa réponse.` : "C'est fait : retrouve ton code dans « Tes demandes »."}
            </p>
            <Button block onClick={close}>Compris</Button>
          </>
        ) : (
          <>
            <p className="sheet-text">{r.detail}.</p>
            <dl className="calc rsheet-calc">
              <dt>Coût</dt>
              <dd>{frPoints(cost)}</dd>
              <dt>Ta cagnotte</dt>
              <dd>{frEuros(available)}</dd>
              {ok ? (
                <>
                  <dt>Après</dt>
                  <dd>{frEuros(available - cost)}</dd>
                </>
              ) : null}
            </dl>
            {p.under15 ? <p className="notice notice-soft"><ShieldCheck size={16} strokeWidth={2.6} className="inline-icon" /> Avant 15 ans, ton parent valide chaque utilisation de ta cagnotte.</p> : null}
            {ok && overCap ? <p className="notice notice-soft">Ton parent a fixé un plafond de {w.parent.monthlyCap} € par mois. Cette demande le dépasserait.</p> : null}
            <div className="sheet-actions">
              <Button
                block
                disabled={!ok || overCap}
                onClick={() => {
                  update((s) => requestReward(s, r.id));
                  setSent(r.id);
                }}
              >
                {!ok ? `Encore ${frPoints(cost - available)}` : p.under15 ? "Demander à mon parent" : `Utiliser ${frPoints(cost)}`}
              </Button>
              {w.goalId !== r.id && r.kind !== "donation" ? (
                <Button block variant="ghost" onClick={() => { update((s) => ({ ...s, wallet: { ...s.wallet, goalId: r.id } })); close(); }}>
                  En faire mon objectif
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

function OfferSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { state, update } = useStore();
  if (!id) return null;
  const pt = partner(id);
  const on = state.wallet.activeOffers.includes(id);
  const code = `LW-${state.profile.pseudo.normalize("NFD").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "ELEVE"}-${pt.mark.replace(/[^A-Z]/g, "")}`;
  const toggle = () =>
    update((s) => ({
      ...s,
      wallet: { ...s.wallet, activeOffers: on ? s.wallet.activeOffers.filter((x) => x !== id) : [...s.wallet.activeOffers, id] },
    }));
  return (
    <Sheet open title={pt.name} onClose={onClose}>
      <div className="rsheet">
        <div className="offer-head">
          <PartnerTile id={id} size="lg" />
          <p>
            <strong>{pt.rate} % de vos achats</strong>
            <span className="muted">reversés dans ta cagnotte · {pt.category}</span>
          </p>
        </div>
        <p className="sheet-text">{pt.blurb} <span className="muted">(Enseigne fictive.)</span></p>
        {sponsorshipsOf(id).length ? (
          <div className="offer-exercises">
            <p className="offer-subtitle">Exercices proposés avec {pt.name}</p>
            <ul>
              {sponsorshipsOf(id).map((sp) => {
                const session = SESSIONS[sp.sessionId];
                return session ? (
                  <li key={sp.activityId}>
                    <Link href={`/seance/${session.id}`} className="text-btn">{sp.pitch}</Link>
                    <span className="muted small"> · {SUBJECTS[session.subject].short}, {getLevel(session.grade).label} · +{sp.bonus} points</span>
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        ) : null}
        <p className="offer-subtitle">Le cashback</p>
        <ol className="offer-steps">
          <li>Active l'offre.</li>
          <li>Ta famille achète en magasin ou en ligne en donnant ton code.</li>
          <li>Le cashback apparaît « en attente », puis devient disponible 30 jours plus tard (le temps des retours).</li>
        </ol>
        {on ? (
          <p className="offer-code">
            Ton code <code>{code}</code>
          </p>
        ) : null}
        <div className="sheet-actions">
          <Button block variant={on ? "ghost" : "ink"} onClick={toggle}>{on ? "Désactiver l'offre" : "Activer l'offre"}</Button>
        </div>
        <p className="muted small rsheet-fine">Démo : partenaire fictif. Exemple : 30 € d'achats rapportent {frEuros(30 * pt.rate * 10)}, soit {frPoints(30 * pt.rate * 10)}.</p>
      </div>
    </Sheet>
  );
}

