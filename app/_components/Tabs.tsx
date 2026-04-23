"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type TabId = "panorama" | "tendencias" | "cruces";

const TABS: { id: TabId; label: string }[] = [
  { id: "panorama", label: "Panorama" },
  { id: "tendencias", label: "Tendencias" },
  { id: "cruces", label: "Cruces" },
];

export function useTab(): TabId {
  const params = useSearchParams();
  const v = params.get("tab");
  if (v === "tendencias") return "tendencias";
  if (v === "cruces") return "cruces";
  return "panorama";
}

export function Tabs() {
  const params = useSearchParams();
  const router = useRouter();
  const active = useTab();

  const go = (id: TabId) => {
    const p = new URLSearchParams(params.toString());
    if (id === "panorama") p.delete("tab");
    else p.set("tab", id);
    const qs = p.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pt-6">
      <div className="inline-flex bg-surface border border-border rounded-lg p-1 gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => go(t.id)}
            className={`px-4 py-1.5 text-sm rounded-md transition ${
              active === t.id
                ? "bg-background text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
