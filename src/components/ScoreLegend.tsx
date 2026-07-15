'use client';

import { useT } from '@/lib/i18n';
import { CATEGORY_COLOR, CATEGORY_EMOJI } from '@/lib/scoring';

/**
 * Explicit text + emoji key for the red/amber/green scoring model. Serves as a
 * non-color cue (accessibility) and documents the thresholds used everywhere.
 */
export function ScoreLegend() {
  const t = useT();
  const items: [keyof typeof CATEGORY_COLOR, string, string][] = [
    ['critical', t('critical'), '≤ 50'],
    ['atrisk', t('atRisk'), '51–79'],
    ['ready', t('ready'), '≥ 80'],
  ];
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600"
      role="note"
      aria-label={t('scoreLegend')}
    >
      <span className="font-medium text-slate-500">{t('scoreLegend')}:</span>
      {items.map(([cat, label, range]) => (
        <span key={cat} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-sm border border-black/10"
            style={{ background: CATEGORY_COLOR[cat] }}
          />
          <span>
            {CATEGORY_EMOJI[cat]} {label} <span className="text-slate-400">({range})</span>
          </span>
        </span>
      ))}
    </div>
  );
}
