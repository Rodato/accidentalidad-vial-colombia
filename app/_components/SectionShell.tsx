import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  lede?: string;
  children: ReactNode;
};

export function SectionShell({ eyebrow, title, lede, children }: Props) {
  return (
    <section className="section-rule max-w-6xl mx-auto px-6 py-24">
      <p className="text-xs tracking-[0.18em] uppercase text-accent mb-4">
        {eyebrow}
      </p>
      <h2 className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight max-w-3xl">
        {title}
      </h2>
      {lede ? (
        <p className="mt-6 text-lg text-foreground/70 max-w-2xl leading-relaxed">
          {lede}
        </p>
      ) : null}
      <div className="mt-12">{children}</div>
    </section>
  );
}
