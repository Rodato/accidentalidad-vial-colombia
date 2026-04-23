// Shape of each crosstab produced by scripts/ingest.ts

export type AccidenteCell = {
  ano: string;
  depto: string;
  tipo: string;
  gravedad: "CON HERIDOS" | "CON MUERTOS";
  c: string;
  edad_promedio?: string;
};

export type MarcaMotoCell = {
  depto: string;
  marca: string;
  c: string;
};

export type VictimaCell = {
  ano: string;
  depto: string;
  genero: string;
  edad: string;
  victimas: string;
};

export type ParqueCell = {
  depto: string;
  clase: string;
  n: string;
};

export type SimitCell = {
  vigencia: string;
  depto: string;
  multas: string;
  valor: string;
  pagadas: string;
};

export type Vehiculos = {
  accidentes: AccidenteCell[];
  marcasMoto: MarcaMotoCell[];
};

export type Homicidios = { victimas: VictimaCell[] };
export type Lesiones = { victimas: VictimaCell[] };
export type Parque = { porDeptoClase: ParqueCell[] };
export type Simit = { porDeptoVigencia: SimitCell[] };

export type AllData = {
  vehiculos: Vehiculos;
  homicidios: Homicidios;
  lesiones: Lesiones;
  parque: Parque;
  simit: Simit;
};

export type Filters = {
  deptos: string[]; // canonical form, empty = all
  tipos: string[]; // empty = all
};
