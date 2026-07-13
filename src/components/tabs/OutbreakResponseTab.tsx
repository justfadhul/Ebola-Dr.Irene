'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Plot from '@/components/Plot';
import { ChartCard } from '@/components/ChartCard';
import { IndicatorBox } from '@/components/IndicatorBox';
import { useDerived } from '@/lib/useDerived';
import { useStore } from '@/store/useStore';
import { useT } from '@/lib/i18n';
import { DOMAINS, domainById } from '@/lib/domains';
import { CATEGORY_COLOR, colorForScore, categorize, CATEGORY_EMOJI } from '@/lib/scoring';

const FacilityMap = dynamic(() => import('@/components/FacilityMap'), {
  ssr: false,
  loading: () => <div className="h-full grid place-items-center text-slate-400">Loading map…</div>,
});

export function OutbreakResponseTab() {
  const t = useT();
  const { summaries } = useDerived();
  const outbreakDomains = useStore((s) => s.outbreakDomains);
  const domainList = DOMAINS.filter((d) => outbreakDomains.includes(d.id));

  const counts = useMemo(() => {
    const c = { ready: 0, atrisk: 0, critical: 0 };
    for (const s of summaries) c[s.latestCategory]++;
    return c;
  }, [summaries]);
  const n = summaries.length;

  // Readiness index: ranked ascending (lowest/highest priority on top).
  const ranked = summaries; // already sorted asc by latestTotal in summarize()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <IndicatorBox
          label={`🟢 ${t('ready')}`}
          value={`${counts.ready} / ${n}`}
          gradient="linear-gradient(135deg,#059669,#10b981)"
        />
        <IndicatorBox
          label={`🟡 ${t('atRisk')}`}
          value={`${counts.atrisk} / ${n}`}
          gradient="linear-gradient(135deg,#f59e0b,#ea580c)"
        />
        <IndicatorBox
          label={`🔴 ${t('critical')}`}
          value={`${counts.critical} / ${n}`}
          gradient="linear-gradient(135deg,#dc2626,#991b1b)"
        />
      </div>

      <ChartCard
        title={`🚦 ${t('readinessIndex')}`}
        subtitle="Latest total score per facility. Lowest (highest priority) on top."
        height={Math.max(320, ranked.length * 22)}
      >
        <Plot
          data={[
            {
              type: 'bar',
              orientation: 'h',
              y: ranked.map((s) => s.facilityName),
              x: ranked.map((s) => s.latestTotal),
              marker: { color: ranked.map((s) => colorForScore(s.latestTotal)) },
              hovertemplate: '%{y}<br>Score: %{x}<extra></extra>',
            },
          ]}
          layout={{
            margin: { l: 160, r: 20, t: 10, b: 40 },
            xaxis: { title: { text: t('totalScore') }, range: [0, 100] },
            yaxis: { autorange: 'reversed', automargin: true },
            shapes: [
              thresholdLine(50, '#c0392b'),
              thresholdLine(80, '#27ae60'),
            ],
          }}
        />
      </ChartCard>

      <ChartCard
        title={`🟢🟡🔴 ${t('domainScores')}`}
        subtitle="One row per facility, one column per domain. Cells colored by score thresholds."
        height={Math.max(320, summaries.length * 20)}
      >
        <DomainHeatmap
          summaries={summaries}
          domainIds={domainList.map((d) => d.id)}
        />
      </ChartCard>

      <ChartCard
        title={`🗺️ ${t('facilityMap')}`}
        subtitle="Color = score category; dot size scales with score. Requires latitude/longitude."
        height={480}
      >
        <FacilityMap summaries={summaries} />
      </ChartCard>

      <section className="card p-4">
        <h3 className="font-semibold text-slate-800 mb-2">📋 {t('dispatchTable')}</h3>
        <DispatchTable summaries={summaries} />
      </section>
    </div>
  );
}

function thresholdLine(x: number, color: string) {
  return {
    type: 'line' as const,
    x0: x,
    x1: x,
    yref: 'paper' as const,
    y0: 0,
    y1: 1,
    line: { color, width: 1.5, dash: 'dash' as const },
  };
}

function DomainHeatmap({
  summaries,
  domainIds,
}: {
  summaries: ReturnType<typeof useDerived>['summaries'];
  domainIds: string[];
}) {
  if (summaries.length === 0 || domainIds.length === 0)
    return <Empty />;
  const z = summaries.map((s) =>
    domainIds.map((id) => s.latest.domainScores[id] ?? null),
  );
  const text = summaries.map((s) =>
    domainIds.map((id) => String(Math.round(s.latest.domainScores[id] ?? 0))),
  );
  return (
    <Plot
      data={[
        {
          type: 'heatmap',
          z,
          x: domainIds.map((id) => domainById(id)?.label ?? id),
          y: summaries.map((s) => s.facilityName),
          text: text as unknown as string[],
          texttemplate: '%{text}',
          textfont: { size: 9, color: 'white' },
          colorscale: [
            [0, CATEGORY_COLOR.critical],
            [0.5, CATEGORY_COLOR.critical],
            [0.500001, CATEGORY_COLOR.atrisk],
            [0.79, CATEGORY_COLOR.atrisk],
            [0.800001, CATEGORY_COLOR.ready],
            [1, CATEGORY_COLOR.ready],
          ],
          zmin: 0,
          zmax: 100,
          showscale: false,
          hovertemplate: '%{y}<br>%{x}: %{z}<extra></extra>',
        },
      ]}
      layout={{
        margin: { l: 160, r: 10, t: 10, b: 120 },
        xaxis: { side: 'top', tickangle: -40, automargin: true },
        yaxis: { autorange: 'reversed', automargin: true },
      }}
    />
  );
}

function DispatchTable({
  summaries,
}: {
  summaries: ReturnType<typeof useDerived>['summaries'];
}) {
  if (summaries.length === 0) return <Empty />;
  return (
    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-slate-100">
          <tr className="text-left">
            <Th>Facility</Th>
            <Th>Readiness</Th>
            <Th>Critical-gap domains</Th>
            <Th>Last Assessed</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {summaries.map((s) => (
            <tr key={s.facilityId} className="border-b border-slate-100">
              <td className="py-1.5 px-2">{s.facilityName}</td>
              <td className="py-1.5 px-2 font-medium">{s.latestTotal}</td>
              <td className="py-1.5 px-2 text-xs text-slate-600">
                {s.criticalDomains.map((id) => domainById(id)?.label).slice(0, 4).join(', ')}
                {s.criticalDomains.length > 4 ? ` +${s.criticalDomains.length - 4}` : ''}
              </td>
              <td className="py-1.5 px-2">{s.latest.reportingDate}</td>
              <td className="py-1.5 px-2">
                {CATEGORY_EMOJI[s.latestCategory]}{' '}
                <span className="capitalize">{categorize(s.latestTotal)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="py-2 px-2 font-semibold text-slate-700">{children}</th>
);

const Empty = () => (
  <div className="h-full grid place-items-center text-slate-400 text-sm">
    No facilities match the current filters.
  </div>
);
