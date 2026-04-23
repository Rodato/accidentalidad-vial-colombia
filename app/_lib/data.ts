import { readFile } from "node:fs/promises";
import { join } from "node:path";

const DIR = join(process.cwd(), "public", "data");

async function load<T>(file: string): Promise<T> {
  const raw = await readFile(join(DIR, file), "utf8");
  return JSON.parse(raw) as T;
}

export type TipoGravedad = {
  tipo_vehiculo: string;
  gravedad_accidente: "CON HERIDOS" | "CON MUERTOS";
  c: string;
};

export type DeptoGravedad = {
  depto: string;
  gravedad_accidente: "CON HERIDOS" | "CON MUERTOS";
  c: string;
};

export type MesGravedad = {
  mes: string;
  gravedad_accidente: "CON HERIDOS" | "CON MUERTOS";
  c: string;
};

export type EdadGravedad = {
  edad: string;
  gravedad_accidente: "CON HERIDOS" | "CON MUERTOS";
  c: string;
};

export type MarcaMoto = {
  marca: string;
  tipo_vehiculo: string;
  c: string;
};

export type Homicidio = {
  ano: string;
  genero: string;
  edad: string;
  victimas: string;
};

export type HomicidioDepto = { depto: string; ano: string; victimas: string };

export type LesionAno = { ano: string; victimas: string };
export type LesionDepto = { depto: string; ano: string; victimas: string };

export type ParqueClase = {
  clase: string;
  estado: string;
  n: string;
};
export type ParqueDepto = { depto: string; n: string };

export type SimitVigencia = {
  vigencia: string;
  multas: string;
  valor: string;
  pagadas: string;
};
export type SimitDepto = { depto: string; multas: string; valor: string };
export type SimitCiudad = {
  ciudad: string;
  depto: string;
  multas: string;
  valor: string;
};

export type Vehiculos = {
  porTipoGravedad: TipoGravedad[];
  porDepto: DeptoGravedad[];
  porMes: MesGravedad[];
  porEdadVehiculo: EdadGravedad[];
  topMarcas: MarcaMoto[];
};

export type Homicidios = {
  porAnoGeneroEdad: Homicidio[];
  porDepto: HomicidioDepto[];
};

export type Lesiones = {
  porAno: LesionAno[];
  porDepto: LesionDepto[];
};

export type Parque = {
  porClase: ParqueClase[];
  porDepto: ParqueDepto[];
};

export type Simit = {
  porVigencia: SimitVigencia[];
  porDepto: SimitDepto[];
  topCiudades: SimitCiudad[];
};

export const loadVehiculos = () => load<Vehiculos>("vehiculos-accidente.json");
export const loadHomicidios = () => load<Homicidios>("homicidios.json");
export const loadLesiones = () => load<Lesiones>("lesiones.json");
export const loadParque = () => load<Parque>("parque-automotor.json");
export const loadSimit = () => load<Simit>("simit.json");

export const n = (v: string | number | undefined | null): number => {
  if (v == null) return 0;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
};

// Normalize department names — SIMIT mixes "Antioquia" / "ANTIOQUIA"
export function normDepto(d: string): string {
  return d
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/BOGOTA D\.?C\.?/, "BOGOTA")
    .trim();
}

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
