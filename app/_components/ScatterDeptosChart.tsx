"use client";

import * as Plot from "@observablehq/plot";
import { PlotFigure } from "./Plot";

type Row = { depto: string; x: number; y: number };

type Props = {
  data: Row[];
  xLabel: string;
  yLabel: string;
  // both axes log by default — good for long-tailed depto distributions
  logX?: boolean;
  logY?: boolean;
};

export function ScatterDeptosChart({
  data,
  xLabel,
  yLabel,
  logX = true,
  logY = true,
}: Props) {
  return (
    <PlotFigure
      options={{
        height: 480,
        marginLeft: 70,
        marginBottom: 60,
        marginRight: 30,
        x: {
          label: `${xLabel} →`,
          grid: true,
          type: logX ? "log" : "linear",
          tickFormat: "~s",
        },
        y: {
          label: `↑ ${yLabel}`,
          grid: true,
          type: logY ? "log" : "linear",
          tickFormat: "~s",
        },
        marks: [
          Plot.dot(data, {
            x: "x",
            y: "y",
            r: 6,
            fill: "#ff4236",
            fillOpacity: 0.75,
            stroke: "#fff",
            strokeWidth: 0.5,
            tip: true,
          }),
          Plot.text(data, {
            x: "x",
            y: "y",
            text: "depto",
            dy: -10,
            fontSize: 10,
            fill: "var(--color-foreground)",
            filter: (d: Row) => {
              // Only label outliers/large points to reduce clutter.
              const maxX = Math.max(...data.map((r) => r.x));
              const maxY = Math.max(...data.map((r) => r.y));
              return d.x > maxX * 0.25 || d.y > maxY * 0.25;
            },
          }),
        ],
      }}
    />
  );
}
