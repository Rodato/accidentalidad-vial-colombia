/**
 * Pulls aggregated data from datos.gov.co (Socrata) and writes JSON
 * snapshots to public/data/. All heavy aggregation is done server-side
 * via $select + $group so we never download raw rows.
 *
 * Datasets:
 *   6jmc-vaxk  Vehículos involucrados en accidente (Ley 2251-2022, RUNT)
 *   ha6j-pa2r  Homicidios en accidente de tránsito (Policía Nacional)
 *   72sg-cybi  Lesiones en accidente de tránsito (Policía Nacional)
 *   u3vn-bdcy  Parque automotor RUNT 2.0
 *   72nf-y4v3  Historial de multas SIMIT (FCM, 2019-2023)
 *
 * Run:  npm run ingest
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "data");
const BASE = "https://www.datos.gov.co/resource";

type Row = Record<string, string | number | null>;

async function soql<T = Row>(
  dataset: string,
  params: Record<string, string>,
): Promise<T[]> {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k.startsWith("$") ? k : k, v]),
  ).toString();
  const url = `${BASE}/${dataset}.json?${qs}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Socrata ${dataset} ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T[];
}

function toNum(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ---------- Dataset pulls ----------

async function vehiculosAccidente() {
  const dataset = "6jmc-vaxk";

  const porTipoGravedad = await soql(dataset, {
    "$select": "tipo_vehiculo, gravedad_accidente, count(*) as c",
    "$group": "tipo_vehiculo, gravedad_accidente",
    "$order": "c desc",
    "$limit": "200",
  });

  const porDepto = await soql(dataset, {
    "$select": "departamento_accidente as depto, gravedad_accidente, count(*) as c",
    "$group": "departamento_accidente, gravedad_accidente",
    "$order": "c desc",
    "$limit": "200",
  });

  const porMes = await soql(dataset, {
    "$select": "fecha_accidente as mes, gravedad_accidente, count(*) as c",
    "$group": "fecha_accidente, gravedad_accidente",
    "$order": "mes",
    "$limit": "5000",
  });

  const porEdadVehiculo = await soql(dataset, {
    "$select": "edad_vehiculo as edad, gravedad_accidente, count(*) as c",
    "$group": "edad_vehiculo, gravedad_accidente",
    "$order": "c desc",
    "$limit": "500",
  });

  const topMarcas = await soql(dataset, {
    "$select": "marca_vehiculo as marca, tipo_vehiculo, count(*) as c",
    "$where": "tipo_vehiculo='MOTOCICLETA'",
    "$group": "marca_vehiculo, tipo_vehiculo",
    "$order": "c desc",
    "$limit": "20",
  });

  return { porTipoGravedad, porDepto, porMes, porEdadVehiculo, topMarcas };
}

// fecha_hecho is stored as "dd/MM/yyyy" text in both police datasets;
// SoQL date_extract_y rejects text, so we slice the year out.
const ANO_TXT = "substring(fecha_hecho, 7, 4)";

async function homicidiosTransito() {
  const dataset = "ha6j-pa2r";

  const porAnoGeneroEdad = await soql(dataset, {
    "$select": `${ANO_TXT} as ano, genero, grupo_etar_o as edad, sum(cantidad::number) as victimas`,
    "$group": `${ANO_TXT}, genero, grupo_etar_o`,
    "$order": "ano",
    "$limit": "5000",
  });

  const porDepto = await soql(dataset, {
    "$select": `departamento as depto, ${ANO_TXT} as ano, sum(cantidad::number) as victimas`,
    "$group": `departamento, ${ANO_TXT}`,
    "$order": "victimas desc",
    "$limit": "5000",
  });

  return { porAnoGeneroEdad, porDepto };
}

async function lesionesTransito() {
  const dataset = "72sg-cybi";

  const porAno = await soql(dataset, {
    "$select": `${ANO_TXT} as ano, sum(cantidad::number) as victimas`,
    "$group": ANO_TXT,
    "$order": "ano",
    "$limit": "100",
  });

  const porDepto = await soql(dataset, {
    "$select": `departamento as depto, ${ANO_TXT} as ano, sum(cantidad::number) as victimas`,
    "$group": `departamento, ${ANO_TXT}`,
    "$order": "victimas desc",
    "$limit": "5000",
  });

  return { porAno, porDepto };
}

async function parqueAutomotor() {
  const dataset = "u3vn-bdcy";

  const porClase = await soql(dataset, {
    "$select":
      "nombre_de_la_clase as clase, estado_del_vehiculo as estado, sum(cantidad) as n",
    "$group": "nombre_de_la_clase, estado_del_vehiculo",
    "$order": "n desc",
    "$limit": "200",
  });

  const porDepto = await soql(dataset, {
    "$select": "nombre_departamento as depto, sum(cantidad) as n",
    "$where": "estado_del_vehiculo='ACTIVO'",
    "$group": "nombre_departamento",
    "$order": "n desc",
    "$limit": "100",
  });

  return { porClase, porDepto };
}

async function simit() {
  const dataset = "72nf-y4v3";

  const porVigencia = await soql(dataset, {
    "$select":
      "vigencia, count(*) as multas, sum(valor_multa) as valor, sum(case(pagado_si_no='SI',1,true,0)) as pagadas",
    "$group": "vigencia",
    "$order": "vigencia",
    "$limit": "50",
  });

  const porDepto = await soql(dataset, {
    "$select":
      "departamento as depto, count(*) as multas, sum(valor_multa) as valor",
    "$group": "departamento",
    "$order": "multas desc",
    "$limit": "100",
  });

  const topCiudades = await soql(dataset, {
    "$select":
      "ciudad, departamento as depto, count(*) as multas, sum(valor_multa) as valor",
    "$group": "ciudad, departamento",
    "$order": "multas desc",
    "$limit": "20",
  });

  return { porVigencia, porDepto, topCiudades };
}

// ---------- Main ----------

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log("→ vehiculos-accidente...");
  const vehiculos = await vehiculosAccidente();
  await writeFile(
    join(OUT_DIR, "vehiculos-accidente.json"),
    JSON.stringify(vehiculos, null, 2),
  );

  console.log("→ homicidios...");
  const homicidios = await homicidiosTransito();
  await writeFile(
    join(OUT_DIR, "homicidios.json"),
    JSON.stringify(homicidios, null, 2),
  );

  console.log("→ lesiones...");
  const lesiones = await lesionesTransito();
  await writeFile(
    join(OUT_DIR, "lesiones.json"),
    JSON.stringify(lesiones, null, 2),
  );

  console.log("→ parque-automotor...");
  const parque = await parqueAutomotor();
  await writeFile(
    join(OUT_DIR, "parque-automotor.json"),
    JSON.stringify(parque, null, 2),
  );

  console.log("→ simit...");
  const simitData = await simit();
  await writeFile(
    join(OUT_DIR, "simit.json"),
    JSON.stringify(simitData, null, 2),
  );

  const manifest = {
    generatedAt: new Date().toISOString(),
    sources: {
      "6jmc-vaxk": "Vehículos en accidente (Ley 2251-2022) — RUNT",
      "ha6j-pa2r": "Homicidios en accidente de tránsito — Policía Nacional",
      "72sg-cybi": "Lesiones en accidente de tránsito — Policía Nacional",
      "u3vn-bdcy": "Crecimiento del parque automotor — RUNT 2.0",
      "72nf-y4v3": "Historial de multas SIMIT — FCM (2019-2023)",
    },
  };
  await writeFile(
    join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  console.log("✓ data written to public/data/");
  console.log("   vehiculos:", toNum(vehiculos.porTipoGravedad.length), "rows (tipo×gravedad)");
  console.log("   homicidios:", toNum(homicidios.porAnoGeneroEdad.length), "rows");
  console.log("   lesiones:", toNum(lesiones.porAno.length), "años");
  console.log("   simit depto:", toNum(simitData.porDepto.length), "deptos");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
