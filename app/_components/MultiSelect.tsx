"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = "Todos",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  const toggle = (v: string) => {
    if (selected.includes(v)) onChange(selected.filter((x) => x !== v));
    else onChange([...selected, v]);
  };

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0]
        : `${selected.length} seleccionados`;

  return (
    <div ref={ref} className="relative inline-block text-sm">
      <div className="text-[10px] tracking-widest text-muted uppercase mb-1.5">
        {label}
      </div>
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="w-full min-w-[180px] text-left bg-surface border border-border rounded-lg px-3 py-2 hover:border-foreground/40 transition flex items-center justify-between gap-2"
      >
        <span className={selected.length === 0 ? "text-muted" : ""}>
          {summary}
        </span>
        <span className="text-muted text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open ? (
        <div className="absolute z-30 mt-2 w-[280px] bg-surface border border-border rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          {selected.length > 0 ? (
            <div className="px-3 py-2 border-b border-border flex items-center justify-between text-xs">
              <span className="text-muted">{selected.length} seleccionados</span>
              <button
                onClick={() => onChange([])}
                className="text-accent hover:underline"
              >
                Limpiar
              </button>
            </div>
          ) : null}
          <ul className="max-h-[300px] overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-muted text-xs">
                Sin resultados
              </li>
            ) : null}
            {filtered.map((opt) => {
              const checked = selected.includes(opt);
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => toggle(opt)}
                    className="w-full text-left px-3 py-1.5 hover:bg-background/50 flex items-center gap-2 text-sm"
                  >
                    <span
                      aria-hidden
                      className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${checked ? "bg-accent border-accent text-background" : "border-border"}`}
                    >
                      {checked ? "✓" : ""}
                    </span>
                    <span className="flex-1">{opt}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
