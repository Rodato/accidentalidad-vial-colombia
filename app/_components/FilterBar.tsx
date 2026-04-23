"use client";

import { MultiSelect } from "./MultiSelect";
import { useFilters } from "../_lib/useFilters";

type Props = {
  deptos: string[];
  tipos: string[];
};

export function FilterBar({ deptos, tipos }: Props) {
  const { filters, update, clear } = useFilters();
  const active = filters.deptos.length + filters.tipos.length;

  return (
    <div className="sticky top-0 z-20 backdrop-blur-md bg-background/85 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base leading-tight">
            Accidentalidad vial <span className="text-muted">· Colombia</span>
          </div>
          <div className="text-[11px] text-muted">
            Datos abiertos · Policía Nacional · RUNT · SIMIT
          </div>
        </div>

        <MultiSelect
          label="Departamento"
          options={deptos}
          selected={filters.deptos}
          onChange={(deptos) => update({ deptos })}
          placeholder="Todos los departamentos"
        />
        <MultiSelect
          label="Tipo de vehículo"
          options={tipos}
          selected={filters.tipos}
          onChange={(tipos) => update({ tipos })}
          placeholder="Todos los tipos"
        />

        {active > 0 ? (
          <button
            onClick={clear}
            className="text-xs text-accent hover:underline self-end pb-1.5"
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>
    </div>
  );
}
