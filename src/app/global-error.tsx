"use client";

/** Dernier filet : l'erreur vient de la structure de l'appli elle-même, les styles ne sont plus garantis. */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, display: "grid", minHeight: "100dvh", placeItems: "center", padding: 24, fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
        <main>
          <h1 style={{ fontSize: 24 }}>LearnWard a eu un problème.</h1>
          <p>Ta progression est gardée sur cet appareil.</p>
          <button type="button" onClick={reset} style={{ padding: "12px 20px", fontSize: 16, fontWeight: 700 }}>Réessayer</button>
        </main>
      </body>
    </html>
  );
}
