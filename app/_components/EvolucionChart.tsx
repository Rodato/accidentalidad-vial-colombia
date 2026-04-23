"use client";

import * as Plot from "@observablehq/plot";
import { PlotFigure } from "./Plot";

type Row = { ano: number; tipo: "Muertos" | "Heridos"; victimas: number };

export function EvolucionChart({ data }: { data: Row[] }) {
  return (
    <PlotFigure
      options={{
        height: 380,
        marginLeft: 60,
        x: { label: "Año", tickFormat: "d", grid: false },
        y: { label: "Víctimas →", grid: true, tickFormat: "~s" },
        color: {
          type: "categorical",
          domain: ["Heridos", "Muertos"],
          range: ["#ffb1a9", "#ff4236"],
          legend: true,
          label: null,
        },
        marks: [
          Plot.ruleY([0]),
          Plot.line(data, {
            x: "ano",
            y: "victimas",
            stroke: "tipo",
            strokeWidth: 2.5,
            curve: "monotone-x",
          }),
          Plot.dot(data, {
            x: "ano",
            y: "victimas",
            fill: "tipo",
            r: 3.5,
            tip: true,
          }),
        ],
      }}
    />
  );
}
