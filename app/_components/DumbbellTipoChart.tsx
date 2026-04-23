"use client";

import * as Plot from "@observablehq/plot";
import { PlotFigure } from "./Plot";

type Row = {
  tipo: string;
  shareParque: number; // % del parque automotor
  shareAccidentes: number; // % de vehículos en accidentes
};

export function DumbbellTipoChart({ data }: { data: Row[] }) {
  // Sort once: biggest share (accidentes) first so rows read naturally.
  const sorted = [...data].sort(
    (a, b) => b.shareAccidentes - a.shareAccidentes,
  );
  const domain = sorted.map((r) => r.tipo);

  return (
    <PlotFigure
      options={{
        height: 440,
        marginLeft: 130,
        marginRight: 40,
        x: {
          label: "Participación (%) →",
          grid: true,
          tickFormat: (d: number) => `${d}%`,
        },
        y: { label: null, domain },
        color: {
          type: "categorical",
          domain: ["Parque automotor", "Accidentes"],
          range: ["#8a8691", "#ff4236"],
          legend: true,
          label: null,
        },
        marks: [
          Plot.link(sorted, {
            y1: "tipo",
            y2: "tipo",
            x1: "shareParque",
            x2: "shareAccidentes",
            stroke: "var(--color-border)",
            strokeWidth: 2,
          }),
          Plot.dot(sorted, {
            x: "shareParque",
            y: "tipo",
            r: 6,
            fill: "#8a8691",
            stroke: "#fff",
            strokeWidth: 0.5,
            tip: true,
            title: (d: Row) =>
              `${d.tipo}\nParque: ${d.shareParque.toFixed(1)}%`,
          }),
          Plot.dot(sorted, {
            x: "shareAccidentes",
            y: "tipo",
            r: 7,
            fill: "#ff4236",
            stroke: "#fff",
            strokeWidth: 0.5,
            tip: true,
            title: (d: Row) =>
              `${d.tipo}\nAccidentes: ${d.shareAccidentes.toFixed(1)}%`,
          }),
          Plot.ruleX([0]),
        ],
      }}
    />
  );
}
