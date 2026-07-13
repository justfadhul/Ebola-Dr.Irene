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

  return { filtered, summaries };
}
