type Props = {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
  accent?: boolean;
};

export function KpiCard({ label, value, delta, hint, accent }: Props) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="text-[11px] tracking-widest text-muted uppercase">
        {label}
      </div>
      <div
        className={`number-hero mt-2 text-3xl md:text-4xl font-semibold ${accent ? "text-accent" : "text-foreground"}`}
      >
        {value}
      </div>
      {delta ? (
        <div className="mt-1 text-xs text-foreground/60">{delta}</div>
      ) : null}
      {hint ? (
        <div className="mt-3 text-[11px] text-muted leading-relaxed">
          {hint}
        </div>
      ) : null}
    </div>
  );
}
