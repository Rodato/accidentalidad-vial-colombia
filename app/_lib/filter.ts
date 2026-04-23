import { n, normDepto } from "./format";
import type {
  AccidenteCell,
  AllData,
  Filters,
  MarcaMotoCell,
  ParqueCell,
  SimitCell,
  VictimaCell,
} from "./types";

const matchDepto = (cell: { depto: string }, deptos: string[]) =>
  deptos.length === 0 || deptos.includes(normDepto(cell.depto));

const matchTipo = (tipo: string, tipos: string[]) =>
  tipos.length === 0 || tipos.includes(tipo);

// ---------- Universe extractors ----------

export function uniqueDeptos(data: AllData): string[] {
  const s = new Set<string>();
  for (const r of data.vehiculos.accidentes) s.add(normDepto(r.depto));
  for (const r of data.homicidios.victimas) s.add(normDepto(r.depto));
  return Array.from(s)
    .filter((d) => d && d !== "NO REPORTA")
    .sort();
}

export function uniqueTipos(data: AllData): string[] {
  const s = new Set<string>();
  for (const r of data.vehiculos.accidentes) s.add(r.tipo);
  return Array.from(s)
    .filter((t) => t && t !== "NO REPORTA")
    .sort();
}

// ---------- Filtered views ----------

export function filterAccidentes(
  rows: AccidenteCell[],
  f: Filters,
): AccidenteCell[] {
  return rows.filter((r) => matchDepto(r, f.deptos) && matchTipo(r.tipo, f.tipos));
}

// Homicidios/Lesiones datasets don't carry tipo_vehiculo — they're person-level.
// They respond only to the depto filter.
export function filterVictimas(
  rows: VictimaCell[],
  f: Filters,
): VictimaCell[] {
  return rows.filter((r) => matchDepto(r, f.deptos));
}

export function filterParque(rows: ParqueCell[], f: Filters): ParqueCell[] {
  // parque.clase uses different labels (CAMPERO, AUTOMOVIL, MOTOCICLETA...) —
  // we don't try to re-map to tipo_vehiculo of the accidents dataset.
  return rows.filter((r) => matchDepto(r, f.deptos));
}

export function filterSimit(rows: SimitCell[], f: Filters): SimitCell[] {
  return rows.filter((r) => matchDepto(r, f.deptos));
}

export function filterMarcasMoto(
  rows: MarcaMotoCell[],
  f: Filters,
): MarcaMotoCell[] {
  return rows.filter((r) => matchDepto(r, f.deptos));
}

// ---------- Aggregations ----------

export function aggregate<K extends string, V>(
  rows: V[],
  key: (r: V) => K,
  value: (r: V) => number,
): Map<K, number> {
  const m = new Map<K, number>();
  for (const r of rows) {
    const k = key(r);
    m.set(k, (m.get(k) ?? 0) + value(r));
  }
  return m;
}

export const sumC = (r: { c: string }) => n(r.c);
export const sumVictimas = (r: { victimas: string }) => n(r.victimas);
