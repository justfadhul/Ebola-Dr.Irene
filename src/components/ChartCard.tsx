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
      <div style={{ height }}>{children}</div>
    </section>
  );
}
