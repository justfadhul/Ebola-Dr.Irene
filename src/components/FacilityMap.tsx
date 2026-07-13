'use client';

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import type { FacilitySummary } from '@/lib/types';
import { colorForScore, categorize, CATEGORY_LABEL } from '@/lib/scoring';

export default function FacilityMap({ summaries }: { summaries: FacilitySummary[] }) {
  const withGeo = summaries.filter(
    (s) => typeof s.latitude === 'number' && typeof s.longitude === 'number',
  );

  if (withGeo.length === 0) {
    return (
      <div className="h-full grid place-items-center text-slate-400 text-sm text-center px-4">
        Map needs latitude/longitude columns in the data. Add
        _facility_latitude / _facility_longitude, or map them in Custom Mapping.
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
              Status: {CATEGORY_LABEL[categorize(s.latestTotal)]}
              <br />
              Score: {s.latestTotal}
              <br />
              Last assessed: {s.latest.reportingDate}
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
