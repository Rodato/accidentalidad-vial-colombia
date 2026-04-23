import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  howToRead?: string;
  source?: string;
  children: ReactNode;
  className?: string;
};

export function Panel({
  title,
  subtitle,
  howToRead,
  source,
  children,
  className = "",
}: Props) {
  return (
    <div
      className={`bg-surface border border-border rounded-xl p-5 flex flex-col ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {subtitle ? (
          <p className="text-xs text-muted mt-1 leading-relaxed">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex-1">{children}</div>
      {howToRead || source ? (
        <div className="mt-4 pt-3 border-t border-border text-[11px] text-muted leading-relaxed space-y-1">
          {howToRead ? (
            <p>
              <span className="text-foreground/70 font-medium">
                Cómo leerlo:
              </span>{" "}
              {howToRead}
            </p>
          ) : null}
          {source ? (
            <p>
              <span className="text-foreground/70 font-medium">Fuente:</span>{" "}
              {source}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
