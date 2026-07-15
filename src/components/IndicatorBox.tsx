'use client';

export function IndicatorBox({
  label,
  value,
  gradient,
  icon,
}: {
  label: string;
  value: string | number;
  gradient: string;
  icon?: string;
}) {
  return (
    <div className="card px-4 py-3 flex items-center gap-3">
      {icon ? (
        <span
          className="grid place-items-center h-9 w-9 shrink-0 rounded-lg text-base"
          style={{ background: 'var(--accent-soft, #eef1ff)' }}
        >
          <span aria-hidden="true">{icon}</span>
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="h-9 w-1.5 shrink-0 rounded-full"
          style={{ background: gradient }}
        />
      )}
      <div className="min-w-0">
        <div className="text-xs font-medium text-subtle truncate">{label}</div>
        <div className="text-2xl font-semibold text-ink leading-tight tracking-tight">{value}</div>
      </div>
    </div>
  );
}

export const GRADIENTS = {
  blue: 'linear-gradient(135deg,#1e6fd8,#0ea5e9)',
  purple: 'linear-gradient(135deg,#6d28d9,#a21caf)',
  green: 'linear-gradient(135deg,#059669,#10b981)',
  amber: 'linear-gradient(135deg,#f59e0b,#f97316)',
  teal: 'linear-gradient(135deg,#0891b2,#06b6d4)',
};
