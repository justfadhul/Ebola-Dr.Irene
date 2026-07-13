import type { FacilityLevel } from './domains';

/** A single completed IPC Assessment for one facility on one date. */
export interface Assessment {
  facilityId: string;
  facilityName: string;
  province: string;
  district: string;
  subdistrict: string;
  facilityLevel: FacilityLevel;
  /** ISO date string (YYYY-MM-DD) of the assessment / reporting date. */
  reportingDate: string;
  latitude?: number;
  longitude?: number;
  /** Overall IPC score, 0-100. */
  totalScore: number;
  /** Per-domain scores keyed by DomainDef.id, each 0-100. */
  domainScores: Record<string, number>;
}

export type ReadinessCategory = 'critical' | 'atrisk' | 'ready';

export type TrendCategory = 'increasing' | 'decreasing' | 'static';

export type TimeAxis = 'reportingDate' | 'daysSinceBaseline' | 'assessmentNumber';

/** Derived per-facility rollup used across every tab. */
export interface FacilitySummary {
  facilityId: string;
  facilityName: string;
  province: string;
  district: string;
  subdistrict: string;
  facilityLevel: FacilityLevel;
  latitude?: number;
  longitude?: number;
  assessments: Assessment[]; // sorted ascending by date, post-baseline only
  baseline: Assessment;
  latest: Assessment;
  assessmentCount: number;
  baselineTotal: number;
  latestTotal: number;
  deltaTotal: number;
  followUpDays: number; // baseline -> latest
  latestCategory: ReadinessCategory;
  trend: TrendCategory;
  /** Per-domain change baseline -> latest, keyed by domain id. */
  domainDelta: Record<string, number>;
  /** Domain ids currently in the Critical band on the latest assessment. */
  criticalDomains: string[];
}
