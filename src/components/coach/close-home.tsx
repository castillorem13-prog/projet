import { X } from "lucide-react";
import Link from "next/link";

/** Quitter un écran de pratique pour revenir à l'accueil. */
export function CloseHome() {
  return (
    <Link href="/" className="icon-btn" aria-label="Revenir à l'accueil">
      <X size={24} />
    </Link>
  );
}
