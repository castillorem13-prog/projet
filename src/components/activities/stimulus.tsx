"use client";

import { BadgeCheck, ChevronDown, Code2, FileText, FlaskConical } from "lucide-react";
import { useState } from "react";
import type { Stimulus } from "@/lib/content/types";
import { cx, nb } from "@/lib/cx";

/**
 * Un document à garder sous les yeux : texte, tableau ou frise, avec sa provenance.
 * Un document réel indique son auteur, sa date et sa source ; un document inventé le dit clairement.
 */
export function StimulusView({ s }: { s: Stimulus }) {
  const [open, setOpen] = useState(false);
  const p = s.provenance;
  return (
    <figure className={cx("doc", p.authentic ? "is-authentic" : "is-mock")}>
      <figcaption className="doc-head">
        <span className="doc-badge">
          {s.kind === "code" ? <Code2 size={15} strokeWidth={2.6} /> : p.authentic ? <BadgeCheck size={15} strokeWidth={2.6} /> : <FlaskConical size={15} strokeWidth={2.6} />}
          {s.kind === "code" ? s.language : p.authentic ? "Document réel" : "Document fictif"}
        </span>
        <strong className="doc-title">{s.title}</strong>
      </figcaption>

      {s.kind === "code" ? (
        <pre className="doc-code" lang="en"><code>{s.lines.join("\n")}</code></pre>
      ) : s.kind === "text" ? (
        <div className="doc-text">
          {s.lines.map((l, i) => (
            <p key={i}>{nb(l)}</p>
          ))}
        </div>
      ) : s.kind === "table" ? (
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                {s.columns.map((c) => (
                  <th key={c} scope="col">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.rows.map((r) => (
                <tr key={r.join("|")}>
                  {r.map((c, i) => (i === 0 ? <th key={i} scope="row">{c}</th> : <td key={i}>{nb(c)}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ol className="doc-timeline">
          {s.events.map((e) => (
            <li key={e.date + e.label}>
              <strong>{e.date}</strong> {e.label}
            </li>
          ))}
        </ol>
      )}

      <button type="button" className="doc-more" aria-expanded={open} onClick={() => setOpen(!open)}>
        <FileText size={15} strokeWidth={2.4} /> Provenance et limites
        <ChevronDown size={16} className={cx("chev", open && "is-open")} />
      </button>
      {open ? (
        <dl className="doc-meta">
          <dt>Nature</dt>
          <dd>{p.type}</dd>
          {p.creator ? (
            <>
              <dt>Auteur</dt>
              <dd>{p.creator}</dd>
            </>
          ) : null}
          {p.date ? (
            <>
              <dt>Date</dt>
              <dd>{p.date}</dd>
            </>
          ) : null}
          {p.context ? (
            <>
              <dt>Contexte</dt>
              <dd>{p.context}</dd>
            </>
          ) : null}
          {p.source ? (
            <>
              <dt>Où le vérifier</dt>
              <dd>{p.source}</dd>
            </>
          ) : null}
          {p.rights ? (
            <>
              <dt>Droits</dt>
              <dd>{p.rights}</dd>
            </>
          ) : null}
          {p.limits ? (
            <>
              <dt>Limites</dt>
              <dd>{p.limits}</dd>
            </>
          ) : null}
          {p.verification === "needs_review" ? (
            <>
              <dt>Statut</dt>
              <dd>À faire vérifier par un enseignant avant publication</dd>
            </>
          ) : null}
        </dl>
      ) : null}
    </figure>
  );
}
