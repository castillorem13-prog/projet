"use client";

import { ArrowLeft, Shuffle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PassionPicker } from "@/components/passions/passion-picker";
import { PreviewCard } from "@/components/passions/preview-card";
import { Button } from "@/components/ui/button";
import { FocusPage } from "@/components/ui/focus-page";
import { Toggle } from "@/components/ui/toggle";
import { EVERYDAY, findPassion, type Passion } from "@/lib/content/passions";
import { safeReturn } from "@/lib/cx";
import { useBack } from "@/lib/nav";
import { useStore } from "@/lib/store";

export function PassionsScreen() {
  const router = useRouter();
  const back = safeReturn(useSearchParams().get("retour"), "/moi");
  const goBack = useBack(back);
  const { state, update } = useStore();
  const [ids, setIds] = useState(state.profile.passions);
  const [cs, setCs] = useState(state.profile.customPassions);
  const [muted, setMuted] = useState(state.profile.mutedPassions);
  const [vary, setVary] = useState(state.profile.vary);
  const [focus, setFocus] = useState<Passion>(() => findPassion(ids[0] ?? "", cs) ?? EVERYDAY);
  const current = ids.includes(focus.id) ? focus : (findPassion(ids[ids.length - 1] ?? "", cs) ?? EVERYDAY);

  const save = () => {
    update((s) => ({ ...s, active: ids, profile: { ...s.profile, passions: ids, customPassions: cs, mutedPassions: muted, vary } }));
    router.replace(back);
  };

  return (
    <FocusPage
      wide
      className="passions-page"
      top={
        <>
          <button type="button" className="icon-btn" onClick={goBack} aria-label="Retour sans enregistrer">
            <ArrowLeft size={24} />
          </button>
          <span className="muted small topbar-end">{ids.length} préféré{ids.length > 1 ? "s" : ""}{muted.length ? ` · ${muted.length} écarté${muted.length > 1 ? "s" : ""}` : ""}</span>
        </>
      }
      dock={
        <div className="dock-stack passions-dock">
          <PreviewCard passion={current} />
          <Button block onClick={save}>Enregistrer</Button>
        </div>
      }
    >
      <div className="passions-layout">
        <div>
          <header className="page-top">
            <h1 className="h1">Tes univers</h1>
            <p className="muted">Tes exercices sont écrits dans des univers qui changent d'un exercice à l'autre. Ceux que tu aimes reviennent plus souvent.</p>
          </header>
          <div className="setting vary-setting">
            <span className="setting-icon"><Shuffle size={22} strokeWidth={2.4} /></span>
            <span className="setting-main">
              <strong>Découvrir d'autres univers</strong>
              <span>Deux univers nouveaux chaque jour, en plus des tiens.</span>
            </span>
            <Toggle on={vary} onChange={setVary} label="Découvrir d'autres univers" />
          </div>
          <PassionPicker selected={ids} customs={cs} muted={muted} onMute={setMuted} onFocus={setFocus} onChange={(s, c) => { setIds(s); setCs(c); }} />
        </div>
        <aside className="passions-aside" aria-label="Aperçu">
          <PreviewCard passion={current} />
          <Button block onClick={save}>Enregistrer</Button>
        </aside>
      </div>
    </FocusPage>
  );
}
