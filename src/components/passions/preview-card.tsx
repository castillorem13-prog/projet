import type { CSSProperties } from "react";
import { FamilyIcon } from "@/components/ui/family-icon";
import { nb } from "@/lib/cx";
import { FAMILIES, type Passion } from "@/lib/content/passions";
import { affineIntro } from "@/lib/content/scenarios";

/** Montre en direct comment un énoncé est réécrit avec une passion. */
export function PreviewCard({ passion, text }: { passion: Passion; text?: string }) {
  return (
    <figure className="pcard" style={{ "--fam": FAMILIES[passion.family].color } as CSSProperties} aria-live="polite">
      <figcaption>
        <FamilyIcon family={passion.family} size={15} /> Ton énoncé version {passion.label.toLowerCase()}
      </figcaption>
      <p key={passion.id}>{nb(text ?? affineIntro(3, 2)(passion))}</p>
    </figure>
  );
}
