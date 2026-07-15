'use client';

export function ChartCard({
  title,
  subtitle,
  chip,
  children,
  height = 420,
}: {
  title: string;
  subtitle?: string;
  chip?: string;
  children: React.ReactNode;
  height?: number | string;
}) {
  return (
    <section className="card overflow-hidden">
      <header className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-3 border-b border-hairline">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-ink truncate">{title}</h3>
            {chip && <span className="chip shrink-0">{chip}</span>}
          </div>
          {subtitle && <p className="text-xs text-subtle mt-0.5">{subtitle}</p>}
        </div>
      </header>
      {/* Plotly renders an SVG canvas that screen readers can't interpret; give
          the chart region an accessible name from its title + description. */}
      <div
        className="px-2 py-2"
        style={{ height }}
        role="img"
        aria-label={subtitle ? `${title}. ${subtitle}` : title}
      >
        {children}
      </div>
    </section>
  );
}
