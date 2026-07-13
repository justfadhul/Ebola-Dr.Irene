import { DOMAINS } from './domains';
import { categorize, daysBetween, THRESHOLD_CRITICAL } from './scoring';
import type {
  Assessment,
  FacilitySummary,
  TrendCategory,
} from './types';

export interface Filters {
  includeAfter?: string; // ISO date floor
  provinces: string[];
  districts: string[];
  subdistricts: string[];
  facilityLevels: string[];
  excludedFacilityIds: string[];
  // Custom baseline anchor
  useCustomBaseline: boolean;
  baselineAnchorDate?: string;
  baselineBufferWeeks: number;
}

export const DEFAULT_FILTERS: Filters = {
  provinces: [],
  districts: [],
  subdistricts: [],
  facilityLevels: [],
  excludedFacilityIds: [],
  useCustomBaseline: false,
  baselineBufferWeeks: 2,
};

/** Apply View Controls filters to the raw assessment list. */
export function applyFilters(data: Assessment[], f: Filters): Assessment[] {
  return data.filter((a) => {
    if (f.includeAfter && a.reportingDate < f.includeAfter) return false;
    if (f.provinces.length && !f.provinces.includes(a.province)) return false;
    if (f.districts.length && !f.districts.includes(a.district)) return false;
    if (f.subdistricts.length && !f.subdistricts.includes(a.subdistrict)) return false;
    if (f.facilityLevels.length && !f.facilityLevels.includes(a.facilityLevel)) return false;
    if (f.excludedFacilityIds.includes(a.facilityId)) return false;
    return true;
  });
}

function classifyTrend(assessments: Assessment[]): TrendCategory {
  if (assessments.length < 2) return 'static';
  const delta = assessments[assessments.length - 1].totalScore - assessments[0].totalScore;
  if (delta > 2) return 'increasing';
  if (delta < -2) return 'decreasing';
  return 'static';
}

/**
 * Choose each facility's baseline assessment.
 * Default: the facility's own earliest assessment.
 * Custom anchor: the earliest assessment inside [anchor - buffer, anchor + buffer];
 * facilities with none in the window are dropped, and pre-baseline assessments
 * are excluded.
 */
function resolveBaseline(
  sorted: Assessment[],
  f: Filters,
): Assessment[] | null {
  if (!f.useCustomBaseline || !f.baselineAnchorDate) return sorted;

  const anchor = new Date(f.baselineAnchorDate).getTime();
  const bufferMs = f.baselineBufferWeeks * 7 * 86_400_000;
  const inWindow = sorted.filter((a) => {
    const t = new Date(a.reportingDate).getTime();
    return Math.abs(t - anchor) <= bufferMs;
  });
  if (inWindow.length === 0) return null; // facility drops out

  const baselineDate = inWindow[0].reportingDate;
  return sorted.filter((a) => a.reportingDate >= baselineDate);
}

/** Roll raw assessments up to one summary per facility. */
export function summarize(data: Assessment[], f: Filters): FacilitySummary[] {
  const byFacility = new Map<string, Assessment[]>();
  for (const a of data) {
    const arr = byFacility.get(a.facilityId);
    if (arr) arr.push(a);
    else byFacility.set(a.facilityId, [a]);
  }

  const out: FacilitySummary[] = [];

  for (const [facilityId, list] of byFacility) {
    const sorted = [...list].sort((a, b) =>
      a.reportingDate < b.reportingDate ? -1 : 1,
    );
    const kept = resolveBaseline(sorted, f);
    if (!kept || kept.length === 0) continue;

    const baseline = kept[0];
    const latest = kept[kept.length - 1];

    const domainDelta: Record<string, number> = {};
    for (const d of DOMAINS) {
      domainDelta[d.id] =
        (latest.domainScores[d.id] ?? 0) - (baseline.domainScores[d.id] ?? 0);
    }
    const criticalDomains = DOMAINS.filter(
      (d) => (latest.domainScores[d.id] ?? 0) <= THRESHOLD_CRITICAL,
    ).map((d) => d.id);

    out.push({
      facilityId,
      facilityName: latest.facilityName,
      province: latest.province,
      district: latest.district,
      subdistrict: latest.subdistrict,
      facilityLevel: latest.facilityLevel,
      latitude: latest.latitude,
      longitude: latest.longitude,
      assessments: kept,
      baseline,
      latest,
      assessmentCount: kept.length,
      baselineTotal: baseline.totalScore,
      latestTotal: latest.totalScore,
      deltaTotal: latest.totalScore - baseline.totalScore,
      followUpDays: daysBetween(baseline.reportingDate, latest.reportingDate),
      latestCategory: categorize(latest.totalScore),
      trend: classifyTrend(kept),
      domainDelta,
      criticalDomains,
    });
  }

  return out.sort((a, b) => a.latestTotal - b.latestTotal);
}

const median = (nums: number[]): number => {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/** Summary-View indicator-box metrics. `today` is the viewing date (ISO). */
export function summaryMetrics(
  summaries: FacilitySummary[],
  filtered: Assessment[],
  today: string,
) {
  const facilitiesTracked = summaries.length;
  const totalAssessments = filtered.length;
  const avgPerFacility = facilitiesTracked
    ? totalAssessments / facilitiesTracked
    : 0;
  const medianDelta = median(summaries.map((s) => s.deltaTotal));
  const medianFollowUp = median(
    summaries.filter((s) => s.assessmentCount > 1).map((s) => s.followUpDays),
  );
  const last30 = filtered.filter(
    (a) => daysBetween(a.reportingDate, today) <= 30 && daysBetween(a.reportingDate, today) >= 0,
  ).length;
  const last7 = filtered.filter(
    (a) => daysBetween(a.reportingDate, today) <= 7 && daysBetween(a.reportingDate, today) >= 0,
  ).length;

  return {
    facilitiesTracked,
    avgPerFacility,
    medianDelta,
    medianFollowUp,
    totalAssessments,
    last30,
    last7,
  };
}
