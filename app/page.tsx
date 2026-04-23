import { Hero } from "./_components/Hero";
import { SectionShell } from "./_components/SectionShell";
import { TipoVehiculoChart } from "./_components/TipoVehiculoChart";
import { EvolucionChart } from "./_components/EvolucionChart";
import { DeptoChart } from "./_components/DeptoChart";
import { CruceSimitChart } from "./_components/CruceSimitChart";
import {
  loadVehiculos,
  loadHomicidios,
  loadLesiones,
  loadSimit,
  n,
  normDepto,
  compactCOP,
  compactNum,
} from "./_lib/data";

export default async function Page() {
  const [vehiculos, homicidios, lesiones, simit] = await Promise.all([
    loadVehiculos(),
    loadHomicidios(),
    loadLesiones(),
    loadSimit(),
  ]);

  // ---------- Hero: last year where both series are present ----------
  const anosComunes = Array.from(
    new Set(
      homicidios.porAnoGeneroEdad
        .map((r) => r.ano)
        .filter((a) =>
          lesiones.porAno.some((l) => l.ano === a && n(l.victimas) > 0),
        ),
    ),
  ).sort();
  const anoRef = anosComunes[anosComunes.length - 1] ?? "2024";
  const muertosRef = homicidios.porAnoGeneroEdad
    .filter((r) => r.ano === anoRef)
    .reduce((s, r) => s + n(r.victimas), 0);
  const heridosRef = lesiones.porAno
    .filter((r) => r.ano === anoRef)
    .reduce((s, r) => s + n(r.victimas), 0);

  // ---------- Tipo vehiculo (stacked bar) ----------
  const tipoData = vehiculos.porTipoGravedad
    .filter((r) => r.tipo_vehiculo && r.gravedad_accidente)
    .map((r) => ({
      tipo: r.tipo_vehiculo,
      gravedad: r.gravedad_accidente,
      total: n(r.c),
    }));

  // Motos insight
  const motos = tipoData.filter((r) => r.tipo === "MOTOCICLETA");
  const motosTotal = motos.reduce((s, r) => s + r.total, 0);
  const totalAccidentes = tipoData.reduce((s, r) => s + r.total, 0);
  const motosShare = totalAccidentes
    ? Math.round((motosTotal / totalAccidentes) * 100)
    : 0;
  const motosMuertos =
    motos.find((r) => r.gravedad === "CON MUERTOS")?.total ?? 0;
  const motosHeridos =
    motos.find((r) => r.gravedad === "CON HERIDOS")?.total ?? 0;
  const motosLetalidad = motosHeridos
    ? ((motosMuertos / (motosHeridos + motosMuertos)) * 100).toFixed(1)
    : "0";

  // ---------- Evolución temporal ----------
  const muertosAno = new Map<string, number>();
  for (const r of homicidios.porAnoGeneroEdad) {
    if (!r.ano) continue;
    muertosAno.set(r.ano, (muertosAno.get(r.ano) ?? 0) + n(r.victimas));
  }
  const heridosAno = new Map<string, number>();
  for (const r of lesiones.porAno) {
    if (!r.ano) continue;
    heridosAno.set(r.ano, n(r.victimas));
  }
  const evolucionData = Array.from(
    new Set([...muertosAno.keys(), ...heridosAno.keys()]),
  )
    .sort()
    .flatMap((ano) => [
      {
        ano: Number(ano),
        tipo: "Muertos" as const,
        victimas: muertosAno.get(ano) ?? 0,
      },
      {
        ano: Number(ano),
        tipo: "Heridos" as const,
        victimas: heridosAno.get(ano) ?? 0,
      },
    ])
    .filter((r) => r.ano >= 2010 && r.ano <= 2025 && r.victimas > 0);

  // ---------- Muertos por depto (lifetime) ----------
  const muertosDeptoMap = new Map<string, number>();
  for (const r of homicidios.porDepto) {
    const key = normDepto(r.depto);
    muertosDeptoMap.set(key, (muertosDeptoMap.get(key) ?? 0) + n(r.victimas));
  }
  const muertosDepto = Array.from(muertosDeptoMap.entries())
    .map(([depto, valor]) => ({ depto, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 15);

  // ---------- Cruce SIMIT × accidentes por depto ----------
  const simitByDepto = new Map<string, number>();
  for (const r of simit.porDepto) {
    const key = normDepto(r.depto);
    simitByDepto.set(key, (simitByDepto.get(key) ?? 0) + n(r.multas));
  }
  const accByDepto = new Map<string, number>();
  for (const r of vehiculos.porDepto) {
    const key = normDepto(r.depto);
    accByDepto.set(key, (accByDepto.get(key) ?? 0) + n(r.c));
  }
  const cruceData = Array.from(simitByDepto.entries())
    .filter(([depto]) => accByDepto.has(depto))
    .map(([depto, multas]) => ({
      depto,
      multas,
      accidentes: accByDepto.get(depto) ?? 0,
    }))
    .filter((r) => r.multas > 1000 && r.accidentes > 10);

  // ---------- SIMIT headline ----------
  const simit2024 = simit.porVigencia.find((v) => v.vigencia === "2024");
  const simitValor = n(simit2024?.valor);
  const simitMultas = n(simit2024?.multas);

  return (
    <main>
      <Hero
        muertosTotal={muertosRef}
        heridosTotal={heridosRef}
        anoReferencia={anoRef}
        fuenteVehiculos="Policía Nacional (homicidios y lesiones culposas en accidente de tránsito)"
      />

      <SectionShell
        eyebrow="Evolución 2010 – 2025"
        title="La línea de heridos baja. La de muertos no."
        lede="La Policía Nacional registra dos delitos distintos por accidente de tránsito: homicidio culposo (art. 109) y lesiones culposas (art. 120). Cuando se grafican en conjunto aparece una divergencia: mejoramos en evitar heridos, pero no tanto en evitar muertes."
      >
        <EvolucionChart data={evolucionData} />
      </SectionShell>

      <SectionShell
        eyebrow="El actor más expuesto"
        title={`Las motocicletas concentran el ${motosShare}% de los accidentes registrados.`}
        lede={`De cada 100 vehículos involucrados en un accidente reportado al RUNT bajo la Ley 2251 de 2022, ${motosShare} son motos. Su letalidad — la proporción de accidentes que terminan en muerte — es del ${motosLetalidad}%.`}
      >
        <TipoVehiculoChart data={tipoData} />
      </SectionShell>

      <SectionShell
        eyebrow="Geografía de la muerte vial"
        title="Dónde se concentran las víctimas fatales."
        lede="Agregado 2010-2025 de homicidios culposos en accidentes de tránsito reportados por la Policía Nacional."
      >
        <DeptoChart data={muertosDepto} xLabel="Muertos (acumulado)" />
      </SectionShell>

      <SectionShell
        eyebrow="Multas y accidentes"
        title="¿Hay relación entre comparendos y siniestros por departamento?"
        lede={`Entre 2019 y 2024, el SIMIT registró más de 25 millones de multas en Colombia — ${compactCOP(
          simitValor,
        )} solo en 2024 (${compactNum(
          simitMultas,
        )} comparendos). Cada punto es un departamento: en horizontal sus multas SIMIT, en vertical los vehículos involucrados en accidentes. Ambos ejes en escala logarítmica.`}
      >
        <CruceSimitChart data={cruceData} />
      </SectionShell>

      <footer className="max-w-6xl mx-auto px-6 py-20 text-xs text-muted section-rule">
        <p>
          Fuentes: datos.gov.co — Policía Nacional (
          <code className="font-mono">ha6j-pa2r</code>,{" "}
          <code className="font-mono">72sg-cybi</code>), RUNT (
          <code className="font-mono">6jmc-vaxk</code>,{" "}
          <code className="font-mono">u3vn-bdcy</code>), Federación Colombiana
          de Municipios — SIMIT (
          <code className="font-mono">72nf-y4v3</code>).
        </p>
        <p className="mt-2">
          Un proyecto de Daniel Otero · código abierto en GitHub.
        </p>
      </footer>
    </main>
  );
}
