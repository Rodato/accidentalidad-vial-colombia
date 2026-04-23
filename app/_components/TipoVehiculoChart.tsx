"use client";

import * as Plot from "@observablehq/plot";
import { PlotFigure } from "./Plot";

type Row = { tipo: string; gravedad: string; total: number };

export function TipoVehiculoChart({ data }: { data: Row[] }) {
  return (
    <PlotFigure
      options={{
        height: 420,
        marginLeft: 120,
        marginRight: 20,
        x: { label: "Accidentes →", grid: true, tickFormat: "~s" },
        y: { label: null },
        color: {
          type: "categorical",
          domain: ["CON HERIDOS", "CON MUERTOS"],
          range: ["#ffb1a9", "#ff4236"],
          legend: true,
          label: null,
        },
        marks: [
          Plot.barX(data, {
            x: "total",
            y: "tipo",
            fill: "gravedad",
            sort: { y: "x", reverse: true, limit: 10 },
            tip: true,
          }),
          Plot.ruleX([0]),
        ],
      }}
    />
  );
}
