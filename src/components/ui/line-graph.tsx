import type { Curve } from "@/lib/content/types";
import { memo, useId } from "react";

const W = 220;
const H = 132;
const PAD = 14;

function evaluate(c: Curve, x: number): number {
  return c.type === "affine" ? c.a * x + c.b : c.a * x * x;
}

/** Petit repère avec une courbe, pensé pour les choix de graphiques. */
export const LineGraph = memo(function LineGraph({
  curve,
  domain,
  range,
  xLabel,
  yLabel,
}: {
  curve: Curve;
  domain: [number, number];
  range: [number, number];
  xLabel: string;
  yLabel: string;
}) {
  const clip = `clip-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [x0, x1] = domain;
  const [y0, y1] = range;
  const sx = (x: number) => PAD + ((x - x0) / (x1 - x0)) * (W - 2 * PAD);
  const sy = (y: number) => H - PAD - ((y - y0) / (y1 - y0)) * (H - 2 * PAD);

  const gridX: number[] = [];
  for (let x = Math.ceil(x0); x <= x1; x++) gridX.push(x);
  const stepY = y1 - y0 > 12 ? 2 : 1;
  const gridY: number[] = [];
  for (let y = Math.ceil(y0 / stepY) * stepY; y <= y1; y += stepY) gridY.push(y);

  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = x0 + ((x1 - x0) * i) / 60;
    pts.push(`${sx(x).toFixed(1)},${sy(evaluate(curve, x)).toFixed(1)}`);
  }
  const axisX = y0 <= 0 && y1 >= 0 ? sy(0) : H - PAD;
  const axisY = x0 <= 0 && x1 >= 0 ? sx(0) : PAD;

  return (
    <svg className="graph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Graphique">
      <defs>
        <clipPath id={clip}>
          <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} />
        </clipPath>
      </defs>
      {gridX.map((x) => (
        <line key={`gx${x}`} x1={sx(x)} x2={sx(x)} y1={PAD} y2={H - PAD} className="graph-grid" />
      ))}
      {gridY.map((y) => (
        <line key={`gy${y}`} y1={sy(y)} y2={sy(y)} x1={PAD} x2={W - PAD} className="graph-grid" />
      ))}
      <line x1={PAD} x2={W - PAD} y1={axisX} y2={axisX} className="graph-axis" />
      <line y1={PAD} y2={H - PAD} x1={axisY} x2={axisY} className="graph-axis" />
      <text x={W - PAD + 2} y={axisX - 4} className="graph-label" textAnchor="end">{xLabel}</text>
      <text x={axisY + 5} y={PAD + 9} className="graph-label">{yLabel}</text>
      {x0 <= 0 && x1 >= 0 && y0 <= 0 && y1 >= 0 ? (
        <text x={axisY - 4} y={axisX + 12} className="graph-label" textAnchor="end">0</text>
      ) : null}
      {x0 <= 1 && x1 >= 1 ? (
        <text x={sx(1)} y={axisX + 12} className="graph-label" textAnchor="middle">1</text>
      ) : null}
      {y0 < 0 && y1 >= 1 && x0 <= 0 ? (
        <text x={axisY - 4} y={sy(1) + 4} className="graph-label" textAnchor="end">1</text>
      ) : null}
      <polyline points={pts.join(" ")} className="graph-curve" clipPath={`url(#${clip})`} />
    </svg>
  );
});
