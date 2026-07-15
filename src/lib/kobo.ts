'use client';

import type { Assessment } from './types';
import { autoSuggestMapping, mapRecords } from './csv';

export interface KoboConfig {
  serverUrl: string;
  assetUid: string;
  token: string;
}

/** Error codes surfaced to the UI (mapped to translated messages). */
export type KoboErrorCode = 'missing' | 'auth' | 'network' | 'server' | 'empty';

export class KoboError extends Error {
  code: KoboErrorCode;
  constructor(code: KoboErrorCode) {
    super(code);
    this.code = code;
  }
}

type KoboPage = {
  count?: number;
  next?: string | null;
  results?: Record<string, unknown>[];
};

/** KoboToolbox exposes location as [lat, lon, alt?] in `_geolocation`. */
function splitGeolocation(rec: Record<string, unknown>): Record<string, unknown> {
  const geo = rec['_geolocation'];
  if (Array.isArray(geo) && geo.length >= 2 && geo[0] != null && geo[1] != null) {
    return { ...rec, _facility_latitude: geo[0], _facility_longitude: geo[1] };
  }
  return rec;
}

/**
 * Fetch all submissions for a KoboToolbox asset (paginated) and convert them to
 * Assessments. Runs entirely in the browser against the user's own Kobo server,
 * so it depends on that server allowing cross-origin requests (CORS).
 */
export async function fetchKoboAssessments(
  cfg: KoboConfig,
  onProgress?: (loaded: number, total: number) => void,
): Promise<Assessment[]> {
  const base = cfg.serverUrl.trim().replace(/\/+$/, '');
  const uid = cfg.assetUid.trim();
  const token = cfg.token.trim();
  if (!base || !uid || !token) throw new KoboError('missing');

  const headers = { Authorization: `Token ${token}`, Accept: 'application/json' };
  let url: string | null = `${base}/api/v2/assets/${uid}/data.json?limit=300`;
  const records: Record<string, unknown>[] = [];
  let total = 0;

  while (url) {
    let res: Response;
    try {
      res = await fetch(url, { headers });
    } catch {
      // Network failure or CORS rejection (opaque to JS either way).
      throw new KoboError('network');
    }
    if (res.status === 401 || res.status === 403) throw new KoboError('auth');
    if (!res.ok) throw new KoboError('server');

    let page: KoboPage;
    try {
      page = (await res.json()) as KoboPage;
    } catch {
      throw new KoboError('server');
    }

    const results = Array.isArray(page.results)
      ? page.results
      : Array.isArray(page)
        ? (page as unknown as Record<string, unknown>[])
        : [];
    for (const r of results) records.push(splitGeolocation(r));
    total = page.count ?? total;
    onProgress?.(records.length, total || records.length);
    url = page.next ?? null;
  }

  if (records.length === 0) throw new KoboError('empty');
  const mapping = autoSuggestMapping(Object.keys(records[0]));
  return mapRecords(records, mapping);
}
