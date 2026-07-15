import Papa from 'papaparse';
import { DOMAINS, FACILITY_LEVELS } from './domains';
import type { FacilityLevel } from './domains';
import type { Assessment } from './types';

/** Standard-CSV column keys expected by the "CSV Upload (Standard)" path. */
export const STANDARD_COLUMNS = {
  facilityId: 'facility_id',
  facilityName: 'facility_name',
  province: 'province',
  district: 'district',
  subdistrict: 'subdistrict',
  facilityLevel: 'facility_level',
  reportingDate: 'reporting_date',
  latitude: '_facility_latitude',
  longitude: '_facility_longitude',
  totalScore: 'total_score',
};

export type ColumnMapping = Partial<Record<keyof typeof STANDARD_COLUMNS, string>> & {
  domains?: Record<string, string>; // domainId -> source column name
};

export interface ParseResult {
  rows: Assessment[];
  headers: string[];
  errors: string[];
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace('%', '').trim());
  return Number.isFinite(n) ? n : 0;
}

function normLevel(v: unknown): FacilityLevel {
  const s = String(v ?? '').toLowerCase().trim();
  return (FACILITY_LEVELS as readonly string[]).includes(s)
    ? (s as FacilityLevel)
    : 'primary';
}

function isoDate(v: unknown): string {
  const s = String(v ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
}

/** Convert one parsed CSV record into an Assessment using the given mapping. */
function toAssessment(
  rec: Record<string, unknown>,
  m: ColumnMapping,
  idx: number,
): Assessment {
  const col = (key: keyof typeof STANDARD_COLUMNS) =>
    rec[m[key] ?? STANDARD_COLUMNS[key]];

  const domainScores: Record<string, number> = {};
  for (const d of DOMAINS) {
    const srcCol = m.domains?.[d.id] ?? d.csvKey;
    if (rec[srcCol] !== undefined) domainScores[d.id] = num(rec[srcCol]);
  }

  const facilityName = String(col('facilityName') ?? `Facility ${idx + 1}`);
  const latRaw = col('latitude');
  const lonRaw = col('longitude');

  return {
    facilityId: String(col('facilityId') ?? facilityName),
    facilityName,
    province: String(col('province') ?? ''),
    district: String(col('district') ?? ''),
    subdistrict: String(col('subdistrict') ?? ''),
    facilityLevel: normLevel(col('facilityLevel')),
    reportingDate: isoDate(col('reportingDate')),
    latitude: latRaw != null && latRaw !== '' ? num(latRaw) : undefined,
    longitude: lonRaw != null && lonRaw !== '' ? num(lonRaw) : undefined,
    totalScore: num(col('totalScore')),
    domainScores,
  };
}

/** Map already-parsed records (e.g. from the Kobo API) into Assessments. */
export function mapRecords(
  records: Record<string, unknown>[],
  mapping: ColumnMapping = {},
): Assessment[] {
  return records
    .filter((r) => Object.keys(r).length > 0)
    .map((r, i) => toAssessment(r, mapping, i));
}

export function parseCsv(text: string, mapping: ColumnMapping = {}): ParseResult {
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  const headers = parsed.meta.fields ?? [];
  const errors = parsed.errors.map((e) => `${e.type}: ${e.message} (row ${e.row})`);
  const rows = parsed.data
    .filter((r) => Object.keys(r).length > 0)
    .map((r, i) => toAssessment(r, mapping, i));
  return { rows, headers, errors };
}

/** Keyword auto-suggest for Custom Mapping: guess source column per target field. */
export function autoSuggestMapping(headers: string[]): ColumnMapping {
  const lower = headers.map((h) => ({ raw: h, l: h.toLowerCase() }));
  const find = (...keys: string[]) =>
    lower.find((h) => keys.some((k) => h.l.includes(k)))?.raw;

  const mapping: ColumnMapping = {
    facilityId: find('facility_id', 'facilityid', 'hf_id'),
    facilityName: find('facility_name', 'facility', 'hf_name', 'name'),
    province: find('province'),
    district: find('district'),
    subdistrict: find('subdistrict', 'sub_district', 'commune'),
    facilityLevel: find('level'),
    reportingDate: find('date', 'reporting', 'submission'),
    latitude: find('latitude', 'lat', '_lat'),
    longitude: find('longitude', 'long', 'lon', '_lon'),
    totalScore: find('total', 'overall', 'score'),
    domains: {},
  };
  for (const d of DOMAINS) {
    const guess = find(d.id, ...d.label.toLowerCase().split(/[^a-z]+/).filter(Boolean));
    if (guess) mapping.domains![d.id] = guess;
  }
  return mapping;
}
