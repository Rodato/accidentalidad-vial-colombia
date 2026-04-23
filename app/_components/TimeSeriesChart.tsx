"use client";

import * as Plot from "@observablehq/plot";
import { PlotFigure } from "./Plot";

type Row = { ano: number; serie: string; valor: number };

type Props = {
  data: Row[];
  ySeriesLabel?: string;
  palette?: Record<string, string>;
};

const DEFAULT_PALETTE: Record<string, string> = {
  MASCULINO: "#ff4236",
  FEMENINO: "#ffb1a9",
  "NO REPORTA": "#555",
  MENORES: "#ffd2a0",
  ADOLESCENTES: "#ffb06b",
  JOVENES: "#ff7b4d",
  ADULTOS: "#ff4236",
  "ADULTO MAYOR": "#8c1d16",
};

export function TimeSeriesChart({
  data,
  ySeriesLabel = "Víctimas →",
  palette = DEFAULT_PALETTE,
}: Props) {
  const series = Array.from(new Set(data.map((r) => r.serie)));
  const range = series.map(
    (s, i) => palette[s] ?? `hsl(${(i * 57) % 360} 70% 55%)`,
  );

  return (
    <PlotFigure
      options={{
        height: 320,
        marginLeft: 55,
        x: { label: "Año", tickFormat: "d" },
        y: { label: ySeriesLabel, grid: true, tickFormat: "~s" },
        color: {
          type: "categorical",
          domain: series,
          range,
          legend: true,
          label: null,
        },
        marks: [
          Plot.ruleY([0]),
          Plot.line(data, {
            x: "ano",
            y: "valor",
            stroke: "serie",
            z: "serie",
            sort: { channel: "x" },
            strokeWidth: 2,
            curve: "monotone-x",
          }),
          Plot.dot(data, {
            x: "ano",
            y: "valor",
            fill: "serie",
            r: 3,
            tip: true,
          }),
        ],
      }}
    />
  );
}
