import Link from "next/link";

export default function NotFound() {
  return (
    <main className="focus empty-page">
      <div className="empty">
        <p className="wordmark">learnward</p>
        <h1 className="h1">Cette page n'existe pas.</h1>
        <p className="muted">Le lien est peut-être incomplet.</p>
        <Link href="/" className="btn btn-ink">Retour à l'accueil</Link>
      </div>
    </main>
  );
}
