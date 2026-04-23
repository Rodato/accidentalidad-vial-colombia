"use client";

import * as Plot from "@observablehq/plot";
import type { FeatureCollection, Geometry } from "geojson";
import { useEffect, useMemo, useRef, useState } from "react";
import { normDepto } from "../_lib/format";

type DeptoProps = { NOMBRE_DPT: string; DPTO: string; value?: number };
type Geo = FeatureCollection<Geometry, DeptoProps>;

type Props = {
  valuesByDepto: Record<string, number>;
  label: string;
};

export function MapaDeptos({ valuesByDepto, label }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/colombia.geo.json")
      .then((r) => r.json() as Promise<Geo>)
      .then((g) => {
        if (!cancelled) setGeo(g);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const enriched = useMemo(() => {
    if (!geo) return null;
    return {
      ...geo,
      features: geo.features.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          value: valuesByDepto[normDepto(f.properties.NOMBRE_DPT)] ?? 0,
        },
      })),
    };
  }, [geo, valuesByDepto]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !enriched) return;

    const chart = Plot.plot({
      projection: { type: "mercator", domain: enriched },
      width: 720,
      height: 640,
      style: {
        background: "transparent",
        color: "var(--color-foreground)",
        fontFamily:
          "var(--font-sans), -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: "12px",
      },
      color: {
        type: "sqrt",
        scheme: "reds",
        label,
        legend: true,
        unknown: "#222",
      },
      marks: [
        Plot.geo(enriched.features, {
          fill: (d: Geo["features"][number]) =>
            (d.properties.value ?? 0) > 0 ? (d.properties.value ?? 0) : null,
          stroke: "var(--color-background)",
          strokeWidth: 0.6,
          title: (d: Geo["features"][number]) =>
            `${d.properties.NOMBRE_DPT}\n${(d.properties.value ?? 0).toLocaleString("es-CO")} ${label.toLowerCase()}`,
        }),
      ],
    });

    host.replaceChildren(chart);
    return () => {
      chart.remove();
    };
  }, [enriched, label]);

  return (
    <div
      ref={hostRef}
      className="w-full flex justify-center min-h-[500px] items-center"
    >
      {!enriched ? (
        <span className="text-muted text-sm">Cargando mapa…</span>
      ) : null}
    </div>
  );
}
