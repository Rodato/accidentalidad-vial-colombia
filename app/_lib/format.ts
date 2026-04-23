// Client-safe formatters and normalizers. Keeps node:fs out of client bundles.

const CANONICAL_ALIASES: Record<string, string> = {
  "SANTAFE DE BOGOTA D.C": "BOGOTA",
  "BOGOTA D.C.": "BOGOTA",
  "BOGOTA D.C": "BOGOTA",
  "BOGOTA DC": "BOGOTA",
  "VALLE DEL CAUCA": "VALLE",
  "SAN ANDRES PROVIDENCIA Y SANTA CATALINA": "SAN ANDRES",
  "SAN ANDRES Y PROVIDENCIA": "SAN ANDRES",
  "ARCHIPIELAGO DE SAN ANDRES PROVIDENCIA Y SANTA CATALINA": "SAN ANDRES",
  NARINO: "NARIÑO",
  "NARI#O": "NARIÑO",
  QUINDIO: "QUINDIO",
};

export function normDepto(d: string): string {
  if (!d) return "";
  const base = d
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/Ñ/g, "N")
    .replace(/ñ/g, "N")
    .toUpperCase()
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return CANONICAL_ALIASES[base] ?? base;
}

export const n = (v: string | number | undefined | null): number => {
  if (v == null) return 0;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
};

export function compactCOP(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e12) return `$${(v / 1e12).toFixed(1)} B`;
  if (abs >= 1e9) return `$${(v / 1e9).toFixed(1)} MM`;
  if (abs >= 1e6) return `$${(v / 1e6).toFixed(0)} M`;
  return `$${v.toLocaleString("es-CO")}`;
}

export function compactNum(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toLocaleString("es-CO");
}
