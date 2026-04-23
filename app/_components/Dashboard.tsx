"use client";

import { useMemo } from "react";
import { DeptoChart } from "./DeptoChart";
import { DumbbellTipoChart } from "./DumbbellTipoChart";
import { EvolucionChart } from "./EvolucionChart";
import { FilterBar } from "./FilterBar";
import { KpiCard } from "./KpiCard";
import { LetalidadTipoChart } from "./LetalidadTipoChart";
import { MapaDeptos } from "./MapaDeptos";
import { Panel } from "./Panel";
import { ScatterDeptosChart } from "./ScatterDeptosChart";
import { Tabs, useTab } from "./Tabs";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { TipoVehiculoChart } from "./TipoVehiculoChart";
import { useFilters } from "../_lib/useFilters";
import {
  aggregate,
  filterAccidentes,
  filterParque,
  filterSimit,
  filterVictimas,
  sumVictimas,
  uniqueDeptos,
  uniqueTipos,
} from "../_lib/filter";
import { compactCOP, compactNum, n, normDepto } from "../_lib/format";
import type { AllData, ParqueCell, VictimaCell } from "../_lib/types";

type Props = { data: AllData };

export function Dashboard({ data }: Props) {
  const { filters } = useFilters();
  const tab = useTab();

  const deptos = useMemo(() => uniqueDeptos(data), [data]);
  const tipos = useMemo(() => uniqueTipos(data), [data]);

  const accidentesFiltered = useMemo(
    () => filterAccidentes(data.vehiculos.accidentes, filters),
    [data.vehiculos.accidentes, filters],
  );
  const homicidiosFiltered = useMemo(
    () => filterVictimas(data.homicidios.victimas, filters),
    [data.homicidios.victimas, filters],
  );
  const lesionesFiltered = useMemo(
    () => filterVictimas(data.lesiones.victimas, filters),
    [data.lesiones.victimas, filters],
  );
  const simitFiltered = useMemo(
    () => filterSimit(data.simit.porDeptoVigencia, filters),
    [data.simit.porDeptoVigencia, filters],
  );
  const parqueFiltered = useMemo(
    () => filterParque(data.parque.porDeptoClase, filters),
    [data.parque.porDeptoClase, filters],
  );

  // ---------- KPIs ----------
  const totalMuertos = homicidiosFiltered.reduce(
    (s, r) => s + n(r.victimas),
    0,
  );
  const totalHeridos = lesionesFiltered.reduce(
    (s, r) => s + n(r.victimas),
    0,
  );
  const totalAccidentes = accidentesFiltered.reduce((s, r) => s + n(r.c), 0);
  const totalMuertosAcc = accidentesFiltered
    .filter((r) => r.gravedad === "CON MUERTOS")
    .reduce((s, r) => s + n(r.c), 0);
  const letalidad = totalAccidentes
    ? ((totalMuertosAcc / totalAccidentes) * 100).toFixed(1)
    : "0";
  const totalMultas = simitFiltered.reduce((s, r) => s + n(r.multas), 0);
  const totalValorMultas = simitFiltered.reduce((s, r) => s + n(r.valor), 0);
  const motosAcc = accidentesFiltered
    .filter((r) => r.tipo === "MOTOCICLETA")
    .reduce((s, r) => s + n(r.c), 0);
  const motosShare = totalAccidentes
    ? Math.round((motosAcc / totalAccidentes) * 100)
    : 0;

  const filterHint =
    filters.deptos.length || filters.tipos.length
      ? `${filters.deptos.length ? filters.deptos.length + " deptos" : "Todos los deptos"} · ${filters.tipos.length ? filters.tipos.length + " tipos" : "Todos los tipos"}`
      : "Todo el país · todos los tipos";

  return (
    <>
      <FilterBar deptos={deptos} tipos={tipos} />

      <div className="max-w-7xl mx-auto px-6 pt-6 text-xs text-muted">
        Vista actual: <span className="text-foreground">{filterHint}</span>
      </div>

      <Tabs />

      {tab === "panorama" ? (
        <Panorama
          accidentesFiltered={accidentesFiltered}
          homicidiosFiltered={homicidiosFiltered}
          lesionesFiltered={lesionesFiltered}
          totalMuertos={totalMuertos}
          totalHeridos={totalHeridos}
          totalMultas={totalMultas}
          totalValorMultas={totalValorMultas}
          motosShare={motosShare}
          letalidad={letalidad}
          totalAccidentes={totalAccidentes}
        />
      ) : tab === "tendencias" ? (
        <Tendencias
          accidentesFiltered={accidentesFiltered}
          homicidiosFiltered={homicidiosFiltered}
          lesionesFiltered={lesionesFiltered}
          simitFiltered={simitFiltered}
        />
      ) : (
        <Cruces
          accidentesFiltered={accidentesFiltered}
          homicidiosFiltered={homicidiosFiltered}
          lesionesFiltered={lesionesFiltered}
          parqueFiltered={parqueFiltered}
          simitRaw={data.simit.porDeptoVigencia}
          filterDeptos={filters.deptos}
        />
      )}

      <Footer />
    </>
  );
}

// =========================================================================
// PANORAMA
// =========================================================================

type PanoramaProps = {
  accidentesFiltered: AllData["vehiculos"]["accidentes"];
  homicidiosFiltered: VictimaCell[];
  lesionesFiltered: VictimaCell[];
  totalMuertos: number;
  totalHeridos: number;
  totalMultas: number;
  totalValorMultas: number;
  motosShare: number;
  letalidad: string;
  totalAccidentes: number;
};

function Panorama({
  accidentesFiltered,
  homicidiosFiltered,
  lesionesFiltered,
  totalMuertos,
  totalHeridos,
  totalMultas,
  totalValorMultas,
  motosShare,
  letalidad,
  totalAccidentes,
}: PanoramaProps) {
  const muertosPorAno = aggregate(
    homicidiosFiltered,
    (r) => r.ano,
    sumVictimas,
  );
  const heridosPorAno = aggregate(
    lesionesFiltered,
    (r) => r.ano,
    sumVictimas,
  );
  const evolucionData = Array.from(
    new Set([...muertosPorAno.keys(), ...heridosPorAno.keys()]),
  )
    .filter((a) => a && Number(a) >= 2010 && Number(a) <= 2025)
    .sort()
    .flatMap((ano) => [
      {
        ano: Number(ano),
        tipo: "Muertos" as const,
        victimas: muertosPorAno.get(ano) ?? 0,
      },
      {
        ano: Number(ano),
        tipo: "Heridos" as const,
        victimas: heridosPorAno.get(ano) ?? 0,
      },
    ]);

  const tipoAgg = new Map<string, { heridos: number; muertos: number }>();
  for (const r of accidentesFiltered) {
    const cur = tipoAgg.get(r.tipo) ?? { heridos: 0, muertos: 0 };
    if (r.gravedad === "CON MUERTOS") cur.muertos += n(r.c);
    else cur.heridos += n(r.c);
    tipoAgg.set(r.tipo, cur);
  }
  const tipoData = Array.from(tipoAgg.entries()).flatMap(([tipo, v]) => [
    { tipo, gravedad: "CON HERIDOS", total: v.heridos },
    { tipo, gravedad: "CON MUERTOS", total: v.muertos },
  ]);

  const muertosPorDeptoMap = new Map<string, number>();
  for (const r of homicidiosFiltered) {
    const k = normDepto(r.depto);
    muertosPorDeptoMap.set(k, (muertosPorDeptoMap.get(k) ?? 0) + n(r.victimas));
  }
  const muertosPorDeptoRecord: Record<string, number> = Object.fromEntries(
    muertosPorDeptoMap,
  );
  const muertosPorDepto = Array.from(muertosPorDeptoMap.entries())
    .map(([depto, valor]) => ({ depto, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 15);

  const generoAnoMap = new Map<string, number>();
  for (const r of homicidiosFiltered) {
    if (!r.ano || !r.genero) continue;
    const k = `${r.ano}|${r.genero}`;
    generoAnoMap.set(k, (generoAnoMap.get(k) ?? 0) + n(r.victimas));
  }
  const generoData = Array.from(generoAnoMap.entries())
    .map(([k, valor]) => {
      const [ano, serie] = k.split("|");
      return { ano: Number(ano), serie, valor };
    })
    .filter((r) => r.ano >= 2010 && r.ano <= 2025 && r.serie)
    .sort((a, b) =>
      a.serie === b.serie ? a.ano - b.ano : a.serie.localeCompare(b.serie),
    );

  const edadAnoMap = new Map<string, number>();
  for (const r of homicidiosFiltered) {
    if (!r.ano || !r.edad) continue;
    const k = `${r.ano}|${r.edad}`;
    edadAnoMap.set(k, (edadAnoMap.get(k) ?? 0) + n(r.victimas));
  }
  const edadData = Array.from(edadAnoMap.entries())
    .map(([k, valor]) => {
      const [ano, serie] = k.split("|");
      return { ano: Number(ano), serie, valor };
    })
    .filter((r) => r.ano >= 2010 && r.ano <= 2025 && r.serie)
    .sort((a, b) =>
      a.serie === b.serie ? a.ano - b.ano : a.serie.localeCompare(b.serie),
    );

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Muertos en accidente"
          value={compactNum(totalMuertos)}
          hint="Homicidios culposos en accidente de tránsito (art. 109). Policía Nacional, 2010-2025."
          accent
        />
        <KpiCard
          label="Heridos en accidente"
          value={compactNum(totalHeridos)}
          hint="Lesiones culposas en accidente de tránsito (art. 120). Policía Nacional, 2010-2025."
        />
        <KpiCard
          label="Multas SIMIT"
          value={compactNum(totalMultas)}
          delta={compactCOP(totalValorMultas)}
          hint="Comparendos registrados 2019-2024. FCM — SIMIT."
        />
        <KpiCard
          label="Motos % accidentes"
          value={totalAccidentes ? `${motosShare}%` : "—"}
          delta={`Letalidad ${letalidad}%`}
          hint="Participación de motocicletas entre los vehículos accidentados. Letalidad = muertos / (muertos + heridos) en RUNT."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel
          title="Evolución anual — muertos y heridos"
          subtitle="Víctimas en accidente de tránsito, por año (2010-2025)."
          howToRead="Dos líneas. Rojo intenso = muertos; rojo claro = heridos. La distancia entre ambas muestra la letalidad del tránsito."
          source="Policía Nacional (ha6j-pa2r y 72sg-cybi)."
        >
          {evolucionData.length > 0 ? (
            <EvolucionChart data={evolucionData} />
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel
          title="Accidentes por tipo de vehículo"
          subtitle="Vehículos involucrados, por tipo y gravedad."
          howToRead="Cada barra es un tipo. Rojo claro = accidentes con heridos; rojo intenso = con muertos. Ordenado por volumen."
          source="RUNT — Ley 2251 de 2022 (6jmc-vaxk)."
        >
          {tipoData.length > 0 ? (
            <TipoVehiculoChart data={tipoData} />
          ) : (
            <Empty />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel
          title="Mapa — muertos por departamento"
          subtitle="Acumulado 2010-2025."
          howToRead="Color más saturado = más víctimas fatales. Pasá el cursor por un depto para ver el número. Si filtrás por depto, solo esos se colorean."
          source="Policía Nacional (ha6j-pa2r)."
        >
          <MapaDeptos
            valuesByDepto={muertosPorDeptoRecord}
            label="Muertos"
          />
        </Panel>
        <Panel
          title="Top departamentos — muertos"
          subtitle="15 departamentos con más víctimas fatales en el recorte actual."
          howToRead="Cada barra es el acumulado 2010-2025 de un departamento."
          source="Policía Nacional (ha6j-pa2r)."
        >
          {muertosPorDepto.length > 0 ? (
            <DeptoChart data={muertosPorDepto} xLabel="Muertos" />
          ) : (
            <Empty />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel
          title="Víctimas fatales por género — evolución"
          subtitle="Muertos en accidente de tránsito, por año y género."
          howToRead="Una línea por género. La distancia entre ambas es la brecha de género en muertes viales."
          source="Policía Nacional (ha6j-pa2r)."
        >
          {generoData.length > 0 ? (
            <TimeSeriesChart data={generoData} ySeriesLabel="Muertos →" />
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel
          title="Víctimas fatales por grupo etario — evolución"
          subtitle="Muertos en accidente de tránsito, por año y grupo etario."
          howToRead="Una línea por grupo etario. Una curva subiendo mientras otras bajan = ese grupo empeorando."
          source="Policía Nacional (ha6j-pa2r)."
        >
          {edadData.length > 0 ? (
            <TimeSeriesChart data={edadData} ySeriesLabel="Muertos →" />
          ) : (
            <Empty />
          )}
        </Panel>
      </div>
    </div>
  );
}

// =========================================================================
// TENDENCIAS (series de tiempo)
// =========================================================================

type TendenciasProps = {
  accidentesFiltered: AllData["vehiculos"]["accidentes"];
  homicidiosFiltered: VictimaCell[];
  lesionesFiltered: VictimaCell[];
  simitFiltered: AllData["simit"]["porDeptoVigencia"];
};

function Tendencias({
  accidentesFiltered,
  homicidiosFiltered,
  lesionesFiltered,
  simitFiltered,
}: TendenciasProps) {
  const simitPorAnoMap = aggregate(
    simitFiltered,
    (r) => r.vigencia,
    (r) => n(r.multas),
  );
  const simitValorPorAnoMap = aggregate(
    simitFiltered,
    (r) => r.vigencia,
    (r) => n(r.valor),
  );
  const simitAnualData = Array.from(simitPorAnoMap.keys())
    .sort()
    .map((vig) => ({
      ano: Number(vig),
      serie: "Comparendos",
      valor: simitPorAnoMap.get(vig) ?? 0,
    }));
  const simitValorAnualData = Array.from(simitValorPorAnoMap.keys())
    .sort()
    .map((vig) => ({
      ano: Number(vig),
      serie: "Valor total",
      valor: simitValorPorAnoMap.get(vig) ?? 0,
    }));

  const muertosPorAno = aggregate(
    homicidiosFiltered,
    (r) => r.ano,
    sumVictimas,
  );
  const heridosPorAno = aggregate(
    lesionesFiltered,
    (r) => r.ano,
    sumVictimas,
  );
  const letalidadAnualData = Array.from(
    new Set([...muertosPorAno.keys(), ...heridosPorAno.keys()]),
  )
    .filter((a) => a && Number(a) >= 2010 && Number(a) <= 2025)
    .sort()
    .map((ano) => {
      const m = muertosPorAno.get(ano) ?? 0;
      const h = heridosPorAno.get(ano) ?? 0;
      const pct = m + h > 0 ? (m / (m + h)) * 100 : 0;
      return { ano: Number(ano), serie: "Letalidad %", valor: pct };
    });

  const tipoAnoMap = new Map<string, number>();
  for (const r of accidentesFiltered) {
    if (!r.ano || !r.tipo) continue;
    const k = `${r.ano}|${r.tipo}`;
    tipoAnoMap.set(k, (tipoAnoMap.get(k) ?? 0) + n(r.c));
  }
  const tiposTotales = aggregate(
    accidentesFiltered,
    (r) => r.tipo,
    (r) => n(r.c),
  );
  const top5Tipos = Array.from(tiposTotales.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);
  const tipoAnoData = Array.from(tipoAnoMap.entries())
    .map(([k, valor]) => {
      const [ano, serie] = k.split("|");
      return { ano: Number(ano), serie, valor };
    })
    .filter(
      (r) =>
        r.ano >= 2019 &&
        r.ano <= 2025 &&
        r.serie &&
        top5Tipos.includes(r.serie),
    )
    .sort((a, b) =>
      a.serie === b.serie ? a.ano - b.ano : a.serie.localeCompare(b.serie),
    );

  const muertosTipoAnoMap = new Map<string, number>();
  for (const r of accidentesFiltered) {
    if (r.gravedad !== "CON MUERTOS") continue;
    if (!r.ano || !r.tipo) continue;
    const k = `${r.ano}|${r.tipo}`;
    muertosTipoAnoMap.set(k, (muertosTipoAnoMap.get(k) ?? 0) + n(r.c));
  }
  const muertosTipoAnoData = Array.from(muertosTipoAnoMap.entries())
    .map(([k, valor]) => {
      const [ano, serie] = k.split("|");
      return { ano: Number(ano), serie, valor };
    })
    .filter(
      (r) =>
        r.ano >= 2019 &&
        r.ano <= 2025 &&
        r.serie &&
        top5Tipos.includes(r.serie),
    )
    .sort((a, b) =>
      a.serie === b.serie ? a.ano - b.ano : a.serie.localeCompare(b.serie),
    );

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel
          title="Comparendos SIMIT por año"
          subtitle="Cantidad de multas registradas por vigencia."
          howToRead="Una línea anual. Subidas = más control (o más infracciones)."
          source="SIMIT — FCM (72nf-y4v3)."
        >
          {simitAnualData.length > 0 ? (
            <TimeSeriesChart
              data={simitAnualData}
              ySeriesLabel="Comparendos →"
            />
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel
          title="Valor total de multas por año"
          subtitle="Monto facturado por vigencia (COP)."
          howToRead="Picos = más facturación. Puede reflejar más volumen o multas más caras."
          source="SIMIT (72nf-y4v3)."
        >
          {simitValorAnualData.length > 0 ? (
            <TimeSeriesChart
              data={simitValorAnualData}
              ySeriesLabel="Valor total (COP)"
            />
          ) : (
            <Empty />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel
          title="Letalidad del tránsito — evolución"
          subtitle="Porcentaje de víctimas totales que terminan en muerte."
          howToRead="Si sube, los accidentes son proporcionalmente más mortales. Si baja, atendemos mejor — o nos accidentamos con menos violencia."
          source="Policía Nacional (ha6j-pa2r + 72sg-cybi)."
        >
          {letalidadAnualData.length > 0 ? (
            <TimeSeriesChart
              data={letalidadAnualData}
              ySeriesLabel="Letalidad (%)"
            />
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel
          title="Accidentes por tipo — evolución"
          subtitle="Top 5 tipos de vehículo, por año (2019-2025)."
          howToRead="Una línea por tipo. Útil junto al filtro de tipo para aislar uno solo."
          source="RUNT — Ley 2251 (6jmc-vaxk)."
        >
          {tipoAnoData.length > 0 ? (
            <TimeSeriesChart data={tipoAnoData} ySeriesLabel="Accidentes →" />
          ) : (
            <Empty />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel
          title="Muertes por tipo — evolución"
          subtitle="Solo siniestros fatales, por tipo y año (2019-2025)."
          howToRead="Si un tipo sube en muertes mientras baja en accidentes, su letalidad aumenta."
          source="RUNT — Ley 2251 (6jmc-vaxk)."
        >
          {muertosTipoAnoData.length > 0 ? (
            <TimeSeriesChart
              data={muertosTipoAnoData}
              ySeriesLabel="Muertos →"
            />
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel
          title="Contexto"
          subtitle="Qué ves en esta pestaña."
          howToRead="Las series anuales responden a los filtros de la barra superior. Si filtrás por Antioquia + Motocicleta, verás cómo evolucionan solo las motos antioqueñas."
        >
          <div className="text-sm text-foreground/70 leading-relaxed space-y-3 py-4">
            <p>
              Las líneas de tiempo te dejan detectar <em>tendencias</em>: cosas
              que suben, que caen, que se cruzan.
            </p>
            <p>
              Para ver <em>relaciones entre variables</em> (tipo vs letalidad,
              multas vs muertes, parque vs siniestros), pasá a la pestaña{" "}
              <span className="text-accent">Cruces</span>.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// =========================================================================
// CRUCES (relaciones entre variables)
// =========================================================================

type CrucesProps = {
  accidentesFiltered: AllData["vehiculos"]["accidentes"];
  homicidiosFiltered: VictimaCell[];
  lesionesFiltered: VictimaCell[];
  parqueFiltered: ParqueCell[];
  simitRaw: AllData["simit"]["porDeptoVigencia"];
  filterDeptos: string[];
};

function Cruces({
  accidentesFiltered,
  homicidiosFiltered,
  lesionesFiltered,
  parqueFiltered,
  simitRaw,
  filterDeptos,
}: CrucesProps) {
  // ---------- A. Letalidad por tipo de vehículo ----------
  const tipoAgg = new Map<string, { heridos: number; muertos: number }>();
  for (const r of accidentesFiltered) {
    if (!r.tipo) continue;
    const cur = tipoAgg.get(r.tipo) ?? { heridos: 0, muertos: 0 };
    if (r.gravedad === "CON MUERTOS") cur.muertos += n(r.c);
    else cur.heridos += n(r.c);
    tipoAgg.set(r.tipo, cur);
  }
  const letalidadTipoData = Array.from(tipoAgg.entries())
    .map(([tipo, v]) => {
      const total = v.heridos + v.muertos;
      return {
        tipo,
        total,
        letalidad: total > 0 ? (v.muertos / total) * 100 : 0,
      };
    })
    .filter((r) => r.total >= 50) // hide noise from tipos with tiny samples
    .sort((a, b) => b.letalidad - a.letalidad);

  // ---------- B. Sobre-representación parque vs accidentes ----------
  const parqueByClase = new Map<string, number>();
  for (const r of parqueFiltered) {
    if (!r.clase) continue;
    parqueByClase.set(
      r.clase.toUpperCase(),
      (parqueByClase.get(r.clase.toUpperCase()) ?? 0) + n(r.n),
    );
  }
  const accByTipo = new Map<string, number>();
  for (const r of accidentesFiltered) {
    if (!r.tipo) continue;
    accByTipo.set(
      r.tipo.toUpperCase(),
      (accByTipo.get(r.tipo.toUpperCase()) ?? 0) + n(r.c),
    );
  }
  const totalParque = Array.from(parqueByClase.values()).reduce(
    (s, v) => s + v,
    0,
  );
  const totalAccTipo = Array.from(accByTipo.values()).reduce(
    (s, v) => s + v,
    0,
  );
  // Intersection of classes present in both datasets with reasonable volume
  const sobreData = Array.from(
    new Set([...parqueByClase.keys(), ...accByTipo.keys()]),
  )
    .map((tipo) => {
      const p = parqueByClase.get(tipo) ?? 0;
      const a = accByTipo.get(tipo) ?? 0;
      return {
        tipo,
        shareParque: totalParque ? (p / totalParque) * 100 : 0,
        shareAccidentes: totalAccTipo ? (a / totalAccTipo) * 100 : 0,
      };
    })
    .filter((r) => r.shareParque > 0.3 || r.shareAccidentes > 0.3)
    .sort((a, b) => b.shareAccidentes - a.shareAccidentes);

  // ---------- C. Muertes × multas SIMIT por depto ----------
  const muertosByDepto = new Map<string, number>();
  for (const r of homicidiosFiltered) {
    const k = normDepto(r.depto);
    muertosByDepto.set(k, (muertosByDepto.get(k) ?? 0) + n(r.victimas));
  }
  const simitByDepto = new Map<string, number>();
  for (const r of simitRaw) {
    const k = normDepto(r.depto);
    if (filterDeptos.length && !filterDeptos.includes(k)) continue;
    simitByDepto.set(k, (simitByDepto.get(k) ?? 0) + n(r.multas));
  }
  const muertesVsSimit = Array.from(simitByDepto.entries())
    .filter(([d]) => muertosByDepto.has(d))
    .map(([depto, multas]) => ({
      depto,
      x: multas,
      y: muertosByDepto.get(depto) ?? 0,
    }))
    .filter((r) => r.x > 100 && r.y > 5);

  // ---------- D. Letalidad por departamento (mapa) ----------
  const heridosByDepto = new Map<string, number>();
  for (const r of lesionesFiltered) {
    const k = normDepto(r.depto);
    heridosByDepto.set(k, (heridosByDepto.get(k) ?? 0) + n(r.victimas));
  }
  const letalidadDeptoMap = new Map<string, number>();
  for (const d of new Set([
    ...muertosByDepto.keys(),
    ...heridosByDepto.keys(),
  ])) {
    const m = muertosByDepto.get(d) ?? 0;
    const h = heridosByDepto.get(d) ?? 0;
    if (m + h < 50) continue; // filter out deptos with tiny samples
    letalidadDeptoMap.set(d, (m / (m + h)) * 100);
  }
  const letalidadDeptoRecord: Record<string, number> = Object.fromEntries(
    letalidadDeptoMap,
  );

  // ---------- E. SIMIT × accidentes (existente, generalizado) ----------
  const accByDeptoAll = new Map<string, number>();
  for (const r of accidentesFiltered) {
    const k = normDepto(r.depto);
    accByDeptoAll.set(k, (accByDeptoAll.get(k) ?? 0) + n(r.c));
  }
  const simitVsAcc = Array.from(simitByDepto.entries())
    .filter(([d]) => accByDeptoAll.has(d))
    .map(([depto, multas]) => ({
      depto,
      x: multas,
      y: accByDeptoAll.get(depto) ?? 0,
    }))
    .filter((r) => r.x > 100 && r.y > 1);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel
          title="Letalidad por tipo de vehículo"
          subtitle="De todos los accidentes de cada tipo, qué % terminó en muerte."
          howToRead="Barra más larga = cuando ese vehículo se accidenta, es más probable que alguien muera. Al lado de cada barra, el % y el total de accidentes del tipo."
          source="RUNT — Ley 2251 (6jmc-vaxk)."
        >
          {letalidadTipoData.length > 0 ? (
            <LetalidadTipoChart data={letalidadTipoData} />
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel
          title="Sobre-representación: parque vs accidentes"
          subtitle="% de cada tipo en el parque automotor vs % en accidentes."
          howToRead="Gris = participación del tipo en vehículos matriculados. Rojo = su participación en accidentes. Cuando el rojo está a la derecha del gris, ese tipo se accidenta más de lo que debería dado su tamaño en el parque."
          source="RUNT — parque automotor (u3vn-bdcy) + accidentes (6jmc-vaxk)."
        >
          {sobreData.length > 0 ? (
            <DumbbellTipoChart data={sobreData} />
          ) : (
            <Empty />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel
          title="Muertes viales × multas SIMIT — por departamento"
          subtitle="Cada punto es un departamento (ejes log-log)."
          howToRead="Horizontal = multas SIMIT acumuladas. Vertical = muertos en accidente. Un punto muy arriba y poco a la derecha = depto con muchas muertes pese a poca fiscalización."
          source="SIMIT (72nf-y4v3) + Policía Nacional (ha6j-pa2r)."
        >
          {muertesVsSimit.length > 1 ? (
            <ScatterDeptosChart
              data={muertesVsSimit}
              xLabel="Multas SIMIT"
              yLabel="Muertos en accidente"
            />
          ) : (
            <Empty note="Seleccioná más de un departamento (o ninguno) para ver el cruce." />
          )}
        </Panel>
        <Panel
          title="Mapa — letalidad por departamento"
          subtitle="Muertos / (muertos + heridos). Deptos rojos = más letales cuando hay accidente."
          howToRead="Color más saturado = mayor probabilidad de muerte dado un accidente. No mide cantidad, mide violencia del siniestro. Deptos con menos de 50 víctimas acumuladas se omiten."
          source="Policía Nacional (ha6j-pa2r + 72sg-cybi)."
        >
          <MapaDeptos
            valuesByDepto={letalidadDeptoRecord}
            label="Letalidad (%)"
          />
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel
          title="Multas SIMIT × accidentes — por departamento"
          subtitle="El cruce original (ejes log-log)."
          howToRead="Horizontal = multas SIMIT; vertical = vehículos en accidentes. Puntos por encima de la tendencia sugieren más siniestros de lo esperado dado el volumen de fiscalización."
          source="SIMIT (72nf-y4v3) + RUNT (6jmc-vaxk)."
        >
          {simitVsAcc.length > 1 ? (
            <ScatterDeptosChart
              data={simitVsAcc}
              xLabel="Multas SIMIT"
              yLabel="Vehículos en accidentes"
            />
          ) : (
            <Empty note="Seleccioná más de un departamento (o ninguno) para ver el cruce." />
          )}
        </Panel>
        <Panel
          title="Contexto"
          subtitle="Qué ves en esta pestaña."
          howToRead="Todos los cruces responden a los filtros de la barra superior. El mapa y los scatter funcionan mejor cuando hay varios departamentos en juego."
        >
          <div className="text-sm text-foreground/70 leading-relaxed space-y-3 py-4">
            <p>
              Los <em>cruces</em> combinan dos o más variables para revelar
              relaciones que no se ven mirando un dato solo.
            </p>
            <p>
              Para ver la evolución en el tiempo, pasá a la pestaña{" "}
              <span className="text-accent">Tendencias</span>.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// =========================================================================
// Helpers
// =========================================================================

function Empty({ note }: { note?: string } = {}) {
  return (
    <div className="h-[240px] flex items-center justify-center text-muted text-sm text-center px-4">
      {note ?? "Sin datos con el filtro actual."}
    </div>
  );
}

function Footer() {
  return (
    <footer className="max-w-7xl mx-auto px-6 pt-4 pb-12 text-xs text-muted">
      <p>
        Fuentes: datos.gov.co — Policía Nacional (
        <code className="font-mono">ha6j-pa2r</code>,{" "}
        <code className="font-mono">72sg-cybi</code>), RUNT (
        <code className="font-mono">6jmc-vaxk</code>,{" "}
        <code className="font-mono">u3vn-bdcy</code>), FCM — SIMIT (
        <code className="font-mono">72nf-y4v3</code>).
      </p>
      <p className="mt-2">
        Un proyecto de Daniel Otero · código en{" "}
        <a
          href="https://github.com/Rodato/accidentalidad-vial-colombia"
          className="underline hover:text-foreground"
        >
          GitHub
        </a>
        .
      </p>
    </footer>
  );
}
