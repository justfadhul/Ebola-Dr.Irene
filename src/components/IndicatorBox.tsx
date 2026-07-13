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
    <div
      className="rounded-xl p-4 text-white shadow-sm flex items-center gap-3"
      style={{ background: gradient }}
    >
      {icon && <span className="text-2xl opacity-90">{icon}</span>}
      <div>
        <div className="text-sm font-medium opacity-95">{label}</div>
        <div className="text-3xl font-bold leading-tight">{value}</div>
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
