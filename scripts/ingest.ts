/**
 * Pulls granular crosstabs from datos.gov.co (Socrata) and writes JSON
 * snapshots to public/data/. Client applies filters in-memory on top of
 * these, so we must pre-aggregate by every dimension we want to expose
 * as a filter or a facet.
 *
 * Filter dimensions exposed to the user:  depto, tipo_vehiculo.
 * Pre-filtered facets we keep in the data: year, gravedad, genero, edad.
 *
 * Datasets:
 *   6jmc-vaxk  Vehículos involucrados en accidente (Ley 2251-2022, RUNT)
 *   ha6j-pa2r  Homicidios en accidente de tránsito (Policía Nacional)
 *   72sg-cybi  Lesiones en accidente de tránsito (Policía Nacional)
 *   u3vn-bdcy  Parque automotor RUNT 2.0
 *   72nf-y4v3  Historial de multas SIMIT (FCM, 2019-2024)
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
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE}/${dataset}.json?${qs}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Socrata ${dataset} ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T[];
}

// fecha_accidente is "MM/yyyy"; fecha_hecho is "dd/MM/yyyy".
const YEAR_ACC = "substring(fecha_accidente, 4, 4)"; // RUNT
const YEAR_HECHO = "substring(fecha_hecho, 7, 4)"; // Policía

// ---------- Vehículos en accidentes (RUNT Ley 2251-2022) ----------

async function vehiculosCrosstab() {
  const dataset = "6jmc-vaxk";

  // Main crosstab: (year, depto, tipo, gravedad) → count
  // Also keeps average edad_vehiculo per cell as a bonus metric.
  const accidentes = await soql(dataset, {
    "$select": [
      `${YEAR_ACC} as ano`,
      "departamento_accidente as depto",
      "tipo_vehiculo as tipo",
      "gravedad_accidente as gravedad",
      "count(*) as c",
      "avg(edad_vehiculo::number) as edad_promedio",
    ].join(", "),
    "$group": `${YEAR_ACC}, departamento_accidente, tipo_vehiculo, gravedad_accidente`,
    "$limit": "50000",
  });

  // Top marcas dentro de motocicletas, por depto.
  const marcasMoto = await soql(dataset, {
    "$select":
      "departamento_accidente as depto, marca_vehiculo as marca, count(*) as c",
    "$where": "tipo_vehiculo='MOTOCICLETA'",
    "$group": "departamento_accidente, marca_vehiculo",
    "$limit": "10000",
  });

  return { accidentes, marcasMoto };
}

// ---------- Homicidios en tránsito (Policía Nacional) ----------

async function homicidiosCrosstab() {
  const dataset = "ha6j-pa2r";

  const victimas = await soql(dataset, {
    "$select": [
      `${YEAR_HECHO} as ano`,
      "departamento as depto",
      "genero",
      "grupo_etar_o as edad",
      "sum(cantidad::number) as victimas",
    ].join(", "),
    "$group": `${YEAR_HECHO}, departamento, genero, grupo_etar_o`,
    "$limit": "50000",
  });

  return { victimas };
}

// ---------- Lesiones en tránsito (Policía Nacional) ----------

async function lesionesCrosstab() {
  const dataset = "72sg-cybi";

  // This dataset uses `grupo_etario` (not `grupo_etar_o`). Confirmed via probe.
  const victimas = await soql(dataset, {
    "$select": [
      `${YEAR_HECHO} as ano`,
      "departamento as depto",
      "genero",
      "grupo_etario as edad",
      "sum(cantidad::number) as victimas",
    ].join(", "),
    "$group": `${YEAR_HECHO}, departamento, genero, grupo_etario`,
    "$limit": "50000",
  });

  return { victimas };
}

// ---------- Parque automotor RUNT 2.0 ----------

async function parqueCrosstab() {
  const dataset = "u3vn-bdcy";

  const porDeptoClase = await soql(dataset, {
    "$select":
      "nombre_departamento as depto, nombre_de_la_clase as clase, sum(cantidad::number) as n",
    "$where": "estado_del_vehiculo='ACTIVO'",
    "$group": "nombre_departamento, nombre_de_la_clase",
    "$limit": "5000",
  });

  return { porDeptoClase };
}

// ---------- SIMIT multas (FCM) ----------

async function simitCrosstab() {
  const dataset = "72nf-y4v3";

  const porDeptoVigencia = await soql(dataset, {
    "$select":
      "vigencia, departamento as depto, count(*) as multas, sum(valor_multa) as valor, sum(case(pagado_si_no='SI',1,true,0)) as pagadas",
    "$group": "vigencia, departamento",
    "$limit": "5000",
  });

  return { porDeptoVigencia };
}

// ---------- Main ----------

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log("→ vehiculos crosstab...");
  const v = await vehiculosCrosstab();
  console.log(`  accidentes: ${v.accidentes.length} cells`);
  console.log(`  marcasMoto: ${v.marcasMoto.length} cells`);
  await writeFile(
    join(OUT_DIR, "vehiculos.json"),
    JSON.stringify(v, null, 0),
  );

  console.log("→ homicidios crosstab...");
  const h = await homicidiosCrosstab();
  console.log(`  victimas: ${h.victimas.length} cells`);
  await writeFile(
    join(OUT_DIR, "homicidios.json"),
    JSON.stringify(h, null, 0),
  );

  console.log("→ lesiones crosstab...");
  const l = await lesionesCrosstab();
  console.log(`  victimas: ${l.victimas.length} cells`);
  await writeFile(join(OUT_DIR, "lesiones.json"), JSON.stringify(l, null, 0));

  console.log("→ parque automotor crosstab...");
  const p = await parqueCrosstab();
  console.log(`  porDeptoClase: ${p.porDeptoClase.length} cells`);
  await writeFile(join(OUT_DIR, "parque.json"), JSON.stringify(p, null, 0));

  console.log("→ simit crosstab...");
  const s = await simitCrosstab();
  console.log(`  porDeptoVigencia: ${s.porDeptoVigencia.length} cells`);
  await writeFile(join(OUT_DIR, "simit.json"), JSON.stringify(s, null, 0));

  const manifest = {
    generatedAt: new Date().toISOString(),
    sources: {
      "6jmc-vaxk": "Vehículos en accidente (Ley 2251-2022) — RUNT",
      "ha6j-pa2r": "Homicidios en accidente de tránsito — Policía Nacional",
      "72sg-cybi": "Lesiones en accidente de tránsito — Policía Nacional",
      "u3vn-bdcy": "Crecimiento del parque automotor — RUNT 2.0",
      "72nf-y4v3": "Historial de multas SIMIT — FCM (2019-2024)",
    },
  };
  await writeFile(
    join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  console.log("✓ done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
