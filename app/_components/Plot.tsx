"use client";

import * as Plot from "@observablehq/plot";
import { useEffect, useRef } from "react";

type PlotOptions = Parameters<typeof Plot.plot>[0];

export function PlotFigure({ options }: { options: PlotOptions }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const chart = Plot.plot({
      ...options,
      style: {
        background: "transparent",
        color: "var(--color-foreground)",
        fontFamily:
          "var(--font-sans), -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: "13px",
        ...(options?.style as object),
      },
    });
    host.replaceChildren(chart);
    return () => {
      chart.remove();
    };
  }, [options]);

  return <div ref={ref} className="w-full overflow-x-auto" />;
}
