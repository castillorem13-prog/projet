import { Gamepad2, Globe2, Music, Palette, Rocket, Trophy } from "lucide-react";
import type { FamilyId } from "@/lib/content/passions";

export function FamilyIcon({ family, size = 18 }: { family: FamilyId; size?: number }) {
  const props = { size, strokeWidth: 2.3 };
  if (family === "sport") return <Trophy {...props} />;
  if (family === "jeux") return <Gamepad2 {...props} />;
  if (family === "musique") return <Music {...props} />;
  if (family === "creation") return <Palette {...props} />;
  if (family === "monde") return <Globe2 {...props} />;
  return <Rocket {...props} />;
}
