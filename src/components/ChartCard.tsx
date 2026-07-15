'use client';

export function ChartCard({
  title,
  subtitle,
  children,
  height = 420,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: number | string;
}) {
  return (
    <section className="card p-4">
      <h3 className="font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5 mb-2">{subtitle}</p>}
      {/* Plotly renders an SVG canvas that screen readers can't interpret; give
          the chart region an accessible name from its title + description. */}
      <div style={{ height }} role="img" aria-label={subtitle ? `${title}. ${subtitle}` : title}>
        {children}
      </div>
    </section>
  );
}
