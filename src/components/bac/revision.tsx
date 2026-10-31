"use client";

import { Check, Eye } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FocusPage } from "@/components/ui/focus-page";
import { CloseHome } from "@/components/coach/close-home";
import { OBJETS, isCardDue } from "@/lib/bac/francais";
import { isoDay } from "@/lib/coach/planner";
import { demoNow } from "@/lib/content/calendar";
import { rateOralText, useStore } from "@/lib/store";

/**
 * Révision des textes de l'oral, en répétition espacée : l'élève redit de mémoire, puis compare avec ses notes
 * et dit comment ça s'est passé. Le prochain passage du texte s'éloigne quand c'est su.
 */
export function BacRevision() {
  const { state, update } = useStore();
  const today = isoDay(demoNow());
  const [all, setAll] = useState(false);
  // La liste est figée au début : un texte noté ne disparaît pas sous les doigts de l'élève.
  const queue = useMemo(
    () => state.bac.textes.filter((t) => all || isCardDue(t.card, today)).map((t) => t.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [all],
  );
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const text = state.bac.textes.find((t) => t.id === queue[i]);

  const rate = (r: "revoir" | "bien" | "facile") => {
    if (!text) return;
    update((s) => rateOralText(s, text.id, r));
    setShown(false);
    setI(i + 1);
  };

  const top = (
    <>
      <CloseHome />
      <span className="topbar-title">Mes textes</span>
      {queue.length ? <span className="topbar-count num">{Math.min(i + 1, queue.length)}/{queue.length}</span> : <span />}
    </>
  );

  if (!text) {
    return (
      <FocusPage top={top}>
        <div className="flash-done">
          <span className="flash-done-icon"><Check size={30} strokeWidth={3} /></span>
          <h1 className="display">{queue.length ? "Textes revus." : "Rien à revoir aujourd'hui."}</h1>
          <p className="muted">{state.bac.textes.length} textes dans ton descriptif.</p>
          <div className="sheet-actions">
            {!all && state.bac.textes.length ? <Button block onClick={() => { setAll(true); setI(0); }}>Tout repasser</Button> : null}
            <Link href="/bac-francais" className="btn btn-ghost btn-block"><span>Bac de français</span></Link>
          </div>
        </div>
      </FocusPage>
    );
  }

  return (
    <FocusPage
      top={top}
      dock={
        shown ? (
          <div className="rate-row" role="group" aria-label="Comment ça s'est passé ?">
            <Button variant="ghost" onClick={() => rate("revoir")}>À revoir</Button>
            <Button variant="soft" onClick={() => rate("bien")}>Bien</Button>
            <Button onClick={() => rate("facile")}>Facile</Button>
          </div>
        ) : (
          <Button block icon={<Eye size={18} />} onClick={() => setShown(true)}>Voir mes notes</Button>
        )
      }
    >
      <article className="flash" key={text.id}>
        <p className="flash-kicker">{OBJETS[text.objet].label} · {text.kind === "oeuvre" ? "œuvre intégrale" : "parcours associé"}</p>
        <h1 className="flash-title">{text.title}</h1>
        {!shown ? (
          <ol className="flash-prompts">
            <li>La problématique</li>
            <li>Les mouvements du texte</li>
            <li>Deux procédés et leur effet</li>
          </ol>
        ) : (
          <div className="flash-notes">
            {text.notes ? text.notes.split("\n").map((l, k) => <p key={k}>{l}</p>) : <p className="muted">Pas encore de notes pour ce texte.</p>}
          </div>
        )}
      </article>
    </FocusPage>
  );
}
