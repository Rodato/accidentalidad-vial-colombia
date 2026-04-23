# Accidentalidad vial · Colombia

Data story con datos abiertos de Colombia sobre accidentes de tránsito, víctimas y comparendos.

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind v4 + Observable Plot + MapLibre GL.

## Fuentes

Todos los datos provienen de [datos.gov.co](https://www.datos.gov.co/) vía API Socrata:

| ID | Dataset | Entidad |
|---|---|---|
| `6jmc-vaxk` | Vehículos en accidente (Ley 2251-2022) | RUNT |
| `ha6j-pa2r` | Homicidios en accidente de tránsito | Policía Nacional |
| `72sg-cybi` | Lesiones en accidente de tránsito | Policía Nacional |
| `u3vn-bdcy` | Crecimiento del parque automotor RUNT 2.0 | RUNT |
| `72nf-y4v3` | Historial de multas SIMIT | Federación Colombiana de Municipios |

## Desarrollo

```bash
npm install
npm run ingest   # refresca public/data/*.json desde Socrata
npm run dev      # arranca Next en http://localhost:3000
```

La página es un Server Component: lee los JSON pre-agregados de `public/data/` en tiempo de build. Las agregaciones ocurren server-side en Socrata (`$select` + `$group`) — nunca se descargan los 25M comparendos del SIMIT crudos.

## Estructura

```
app/
├── _components/     # Plot wrappers, Hero, SectionShell, charts
├── _lib/data.ts     # cargadores + normalizadores
├── globals.css      # tema oscuro con acento rojo
├── layout.tsx
└── page.tsx         # narrativa scrolleable
public/data/         # snapshots JSON generados por scripts/ingest.ts
scripts/ingest.ts    # pipeline de ingesta Socrata
```
