"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { Filters } from "./types";

export function useFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const filters: Filters = useMemo(
    () => ({
      deptos: params.get("d")?.split(",").filter(Boolean) ?? [],
      tipos: params.get("t")?.split(",").filter(Boolean) ?? [],
    }),
    [params],
  );

  const update = useCallback(
    (next: Partial<Filters>) => {
      const p = new URLSearchParams(params.toString());
      if (next.deptos !== undefined) {
        if (next.deptos.length) p.set("d", next.deptos.join(","));
        else p.delete("d");
      }
      if (next.tipos !== undefined) {
        if (next.tipos.length) p.set("t", next.tipos.join(","));
        else p.delete("t");
      }
      const qs = p.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [params, router],
  );

  const clear = useCallback(() => {
    router.replace("?", { scroll: false });
  }, [router]);

  return { filters, update, clear };
}
