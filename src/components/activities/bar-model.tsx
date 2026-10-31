import type { BarModel } from "@/lib/content/types";
import { cx, nb } from "@/lib/cx";

/** Modèle en barres (Singapour) : les quantités en longueurs, les inconnues en « ? ». */
export function BarModelView({ model }: { model: BarModel }) {
  const max = Math.max(...model.rows.map((r) => r.parts.reduce((s, p) => s + p.size, 0)));
  return (
    <figure className="bar-model">
      <figcaption className="bar-model-head">
        <span className="bar-model-tag">Modèle en barres</span>
        <span>{nb(model.caption)}</span>
      </figcaption>
      <div className="bar-model-rows">
        {model.rows.map((r) => {
          const total = r.parts.reduce((s, p) => s + p.size, 0);
          return (
            <div key={r.label} className="bar-row">
              <span className="bar-label">{r.label}</span>
              <span className="bar-track">
                <span className="bar" style={{ width: `${(total / max) * 100}%` }}>
                  {r.parts.map((p, i) => (
                    <span key={i} className={cx("bar-part", p.tone && `is-${p.tone}`)} style={{ flexGrow: p.size }}>
                      {p.text ? nb(p.text) : null}
                    </span>
                  ))}
                </span>
                {r.total ? <span className="bar-total">{nb(r.total)}</span> : null}
              </span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
