"use client";

import * as Plot from "@observablehq/plot";
import { PlotFigure } from "./Plot";

type Row = { tipo: string; letalidad: number; total: number };

export function LetalidadTipoChart({ data }: { data: Row[] }) {
  return (
    <PlotFigure
      options={{
        height: 420,
        marginLeft: 130,
        marginRight: 80,
        x: {
          label: "Letalidad (% de accidentes fatales) →",
          grid: true,
          tickFormat: (d: number) => `${d.toFixed(0)}%`,
        },
        y: { label: null },
        color: { legend: false },
        marks: [
          Plot.barX(data, {
            x: "letalidad",
            y: "tipo",
            fill: "#ff4236",
            sort: { y: "x", reverse: true, limit: 12 },
            tip: true,
          }),
          Plot.text(data, {
            x: "letalidad",
            y: "tipo",
            text: (d: Row) =>
              `${d.letalidad.toFixed(1)}%  ·  ${d.total.toLocaleString("es-CO")}`,
            dx: 6,
            textAnchor: "start",
            fill: "var(--color-foreground)",
            fontSize: 11,
            sort: { y: "x", reverse: true, limit: 12 },
          }),
          Plot.ruleX([0]),
        ],
      }}
    />
  );
}
