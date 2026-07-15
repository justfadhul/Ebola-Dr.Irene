'use client';

import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { applyFilters, summarize } from './selectors';

/** Filtered assessments + per-facility summaries, memoized on data+filters. */
export function useDerived() {
  const data = useStore((s) => s.data);
  const filters = useStore((s) => s.filters);

  const filtered = useMemo(() => applyFilters(data, filters), [data, filters]);
  const summaries = useMemo(() => summarize(filtered, filters), [filtered, filters]);

  // Reference "now" for recency metrics (last 7/30 days). We use the most recent
  // assessment date in view rather than the wall clock, so the metric stays
  // meaningful for both live data and the historical test dataset.
  const referenceDate = useMemo(() => {
    let max = '';
    for (const a of filtered) if (a.reportingDate > max) max = a.reportingDate;
    return max;
  }, [filtered]);

  return { filtered, summaries, referenceDate };
}
