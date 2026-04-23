import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export * from "./format";
export * from "./types";

import type {
  Vehiculos,
  Homicidios,
  Lesiones,
  Parque,
  Simit,
} from "./types";

const DIR = join(process.cwd(), "public", "data");

async function load<T>(file: string): Promise<T> {
  const raw = await readFile(join(DIR, file), "utf8");
  return JSON.parse(raw) as T;
}

export const loadAll = async () => {
  const [vehiculos, homicidios, lesiones, parque, simit] = await Promise.all([
    load<Vehiculos>("vehiculos.json"),
    load<Homicidios>("homicidios.json"),
    load<Lesiones>("lesiones.json"),
    load<Parque>("parque.json"),
    load<Simit>("simit.json"),
  ]);
  return { vehiculos, homicidios, lesiones, parque, simit };
};
