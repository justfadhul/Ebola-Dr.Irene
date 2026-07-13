import { DOMAINS } from './domains';
import type { Assessment } from './types';
import type { FacilityLevel } from './domains';

// Entirely fabricated data (mirrors the User Guide's test file): 200 facilities,
// 2-3 assessments each, across 3 provinces in eastern DRC. Geolocation is not
// real. Deterministic via a seeded PRNG so the demo is stable across reloads.

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Geo {
  province: string;
  lat: number;
  lon: number;
  districts: string[];
}

const GEO: Geo[] = [
  { province: 'Ituri', lat: 1.55, lon: 30.2, districts: ['Bunia', 'Mahagi', 'Aru', 'Djugu'] },
  { province: 'Nord-Kivu', lat: -0.6, lon: 29.2, districts: ['Goma', 'Beni', 'Butembo', 'Rutshuru'] },
  { province: 'Sud-Kivu', lat: -2.5, lon: 28.85, districts: ['Bukavu', 'Uvira', 'Kabare', 'Walungu'] },
];

const LEVELS: FacilityLevel[] = ['primary', 'secondary', 'tertiary'];

export function generateTestData(count = 200, seed = 42): Assessment[] {
  const rnd = mulberry32(seed);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const between = (a: number, b: number) => a + rnd() * (b - a);
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

  const rows: Assessment[] = [];

  for (let i = 0; i < count; i++) {
    const geo = pick(GEO);
    const district = pick(geo.districts);
    const subdistrict = `${district} SD-${1 + Math.floor(rnd() * 4)}`;
    const level = pick(LEVELS);
    const facilityId = `F-${String(i + 1).padStart(3, '0')}`;
    const facilityName = `${facilityId} ${district} HF`;

    const lat = geo.lat + between(-0.6, 0.6);
    const lon = geo.lon + between(-0.6, 0.6);

    // Each facility starts somewhere and drifts up or down over visits.
    const startMean = between(20, 70);
    const drift = between(-8, 14); // per-assessment trend
    const nAssess = 2 + Math.floor(rnd() * 2); // 2 or 3

    // Baseline date within Jan-May 2024, follow-ups spaced ~4-12 weeks apart.
    let date = new Date(2024, 0, 1 + Math.floor(rnd() * 150));

    for (let a = 0; a < nAssess; a++) {
      const mean = startMean + drift * a;
      const domainScores: Record<string, number> = {};
      let sum = 0;
      for (const d of DOMAINS) {
        const s = clamp(mean + between(-25, 25));
        domainScores[d.id] = s;
        sum += s;
      }
      const totalScore = clamp(sum / DOMAINS.length);

      rows.push({
        facilityId,
        facilityName,
        province: geo.province,
        district,
        subdistrict,
        facilityLevel: level,
        reportingDate: date.toISOString().slice(0, 10),
        latitude: Number(lat.toFixed(4)),
        longitude: Number(lon.toFixed(4)),
        totalScore,
        domainScores,
      });

      const gapDays = 28 + Math.floor(rnd() * 56);
      date = new Date(date.getTime() + gapDays * 86_400_000);
    }
  }

  return rows;
}
