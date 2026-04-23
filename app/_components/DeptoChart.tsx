"use client";

import * as Plot from "@observablehq/plot";
import { PlotFigure } from "./Plot";

type Row = { depto: string; valor: number };

export function DeptoChart({
  data,
  xLabel,
  color = "#ff4236",
}: {
  data: Row[];
  xLabel: string;
  color?: string;
}) {
  return (
    <PlotFigure
      options={{
        height: 460,
        marginLeft: 150,
        marginRight: 40,
        x: { label: `${xLabel} →`, grid: true, tickFormat: "~s" },
        y: { label: null },
        marks: [
          Plot.barX(data, {
            x: "valor",
            y: "depto",
            fill: color,
            sort: { y: "x", reverse: true, limit: 15 },
            tip: true,
          }),
          Plot.text(data, {
            x: "valor",
            y: "depto",
            text: (d: Row) =>
              d.valor >= 1000
                ? `${(d.valor / 1000).toFixed(0)}k`
                : d.valor.toString(),
            dx: 6,
            textAnchor: "start",
            fill: "var(--color-foreground)",
            sort: { y: "x", reverse: true, limit: 15 },
          }),
          Plot.ruleX([0]),
        ],
      }}
    />
  );
}
