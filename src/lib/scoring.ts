import type { ReadinessCategory } from './types';

// One scoring model, used everywhere. No per-chart custom thresholds.
//   Critical  <= 50%
//   At Risk   51% - 79%
//   Ready     >= 80%
export const THRESHOLD_CRITICAL = 50;
export const THRESHOLD_READY = 80;

export function categorize(score: number): ReadinessCategory {
  if (score <= THRESHOLD_CRITICAL) return 'critical';
  if (score < THRESHOLD_READY) return 'atrisk';
  return 'ready';
}

export const CATEGORY_COLOR: Record<ReadinessCategory, string> = {
  critical: '#c0392b',
  atrisk: '#f39c12',
  ready: '#27ae60',
};

export const CATEGORY_LABEL: Record<ReadinessCategory, string> = {
  critical: 'Critical',
  atrisk: 'At Risk',
  ready: 'Ready',
};

export const CATEGORY_EMOJI: Record<ReadinessCategory, string> = {
  critical: '🔴',
  atrisk: '🟡',
  ready: '🟢',
};

export function colorForScore(score: number): string {
  return CATEGORY_COLOR[categorize(score)];
}

/** Diverging color for a change value: green up, red down, amber ~flat. */
export function colorForDelta(delta: number): string {
  if (delta > 1) return '#27ae60';
  if (delta < -1) return '#c0392b';
  return '#f39c12';
}

export function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  return Math.round((b - a) / 86_400_000);
}
