"use client";

import * as Plot from "@observablehq/plot";
import { PlotFigure } from "./Plot";

type Row = {
  depto: string;
  multas: number;
  accidentes: number;
};

export function CruceSimitChart({ data }: { data: Row[] }) {
  return (
    <PlotFigure
      options={{
        height: 520,
        marginLeft: 70,
        marginBottom: 60,
        marginRight: 30,
        x: {
          label: "Multas SIMIT (2019-2024) →",
          grid: true,
          type: "log",
          tickFormat: "~s",
        },
        y: {
          label: "↑ Vehículos en accidentes",
          grid: true,
          type: "log",
          tickFormat: "~s",
        },
        marks: [
          Plot.dot(data, {
            x: "multas",
            y: "accidentes",
            r: 6,
            fill: "#ff4236",
            fillOpacity: 0.75,
            stroke: "#fff",
            strokeWidth: 0.5,
            tip: true,
          }),
          Plot.text(data, {
            x: "multas",
            y: "accidentes",
            text: "depto",
            dy: -10,
            fontSize: 10,
            fill: "var(--color-foreground)",
            filter: (d: Row) => d.accidentes > 500 || d.multas > 500000,
          }),
        ],
      }}
    />
  );
}
