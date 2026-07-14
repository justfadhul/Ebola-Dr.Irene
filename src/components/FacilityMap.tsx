'use client';

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import type { FacilitySummary } from '@/lib/types';
import { colorForScore, categorize } from '@/lib/scoring';
import { useT, CATEGORY_KEY } from '@/lib/i18n';

export default function FacilityMap({ summaries }: { summaries: FacilitySummary[] }) {
  const t = useT();
  const withGeo = summaries.filter(
    (s) => typeof s.latitude === 'number' && typeof s.longitude === 'number',
  );

  if (withGeo.length === 0) {
    return (
      <div className="h-full grid place-items-center text-slate-400 text-sm text-center px-4">
        {t('mapNoGeo')}
      </div>
    );
  }

  const lat = withGeo.reduce((a, s) => a + (s.latitude ?? 0), 0) / withGeo.length;
  const lon = withGeo.reduce((a, s) => a + (s.longitude ?? 0), 0) / withGeo.length;

  return (
    <MapContainer
      center={[lat, lon]}
      zoom={7}
      scrollWheelZoom
      style={{ height: '100%', width: '100%', borderRadius: 8 }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {withGeo.map((s) => (
        <CircleMarker
          key={s.facilityId}
          center={[s.latitude!, s.longitude!]}
          radius={5 + (s.latestTotal / 100) * 10}
          pathOptions={{
            color: colorForScore(s.latestTotal),
            fillColor: colorForScore(s.latestTotal),
            fillOpacity: 0.7,
            weight: 1,
          }}
        >
          <Tooltip>
            <div className="text-xs">
              <strong>{s.facilityName}</strong>
              <br />
              {t('status')}: {t(CATEGORY_KEY[categorize(s.latestTotal)])}
              <br />
              {t('score')}: {s.latestTotal}
              <br />
              {t('lastAssessed')}: {s.latest.reportingDate}
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
