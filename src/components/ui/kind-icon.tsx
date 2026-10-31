import { ChartLine, CircleHelp, Columns3, Footprints, ListOrdered, MessagesSquare, NotebookPen, PenLine, ScanSearch } from "lucide-react";
import type { ActivityKind } from "@/lib/content/types";

export function KindIcon({ kind, size = 20 }: { kind: ActivityKind; size?: number }) {
  const p = { size, strokeWidth: 2.2 };
  if (kind === "mcq") return <CircleHelp {...p} />;
  if (kind === "problem") return <PenLine {...p} />;
  if (kind === "graph") return <ChartLine {...p} />;
  if (kind === "order") return <ListOrdered {...p} />;
  if (kind === "classify") return <Columns3 {...p} />;
  if (kind === "writing") return <NotebookPen {...p} />;
  if (kind === "dialogue") return <MessagesSquare {...p} />;
  if (kind === "worked") return <Footprints {...p} />;
  return <ScanSearch {...p} />;
}
