"use client";

import { useEffect } from "react";

/** Une erreur dans un écran : on propose de réessayer plutôt que de laisser une page blanche. */
export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="focus empty-page">
      <div className="empty">
        <p className="wordmark">learnward</p>
        <h1 className="h1">Cet écran a eu un problème.</h1>
        <p className="muted">Ta progression est gardée. Réessaie, ou reviens à l'accueil.</p>
        <button type="button" className="btn btn-ink" onClick={reset}>Réessayer</button>
        {/* Lien complet : un rechargement repart d'une page saine. */}
        <a href="/" className="btn btn-ghost">Retour à l'accueil</a>
      </div>
    </main>
  );
}
