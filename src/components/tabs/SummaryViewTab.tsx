'use client';

import { useMemo, useRef, useState } from 'react';
import Plot from '@/components/Plot';
import { ChartCard } from '@/components/ChartCard';
import { ExportBar } from '@/components/ExportBar';
import { IndicatorBox, GRADIENTS } from '@/components/IndicatorBox';
import { useDerived } from '@/lib/useDerived';
import { useStore } from '@/store/useStore';
import { useT, CATEGORY_KEY } from '@/lib/i18n';
import { useIsMobile } from '@/lib/useIsMobile';
import { DOMAINS } from '@/lib/domains';
import { summaryMetrics } from '@/lib/selectors';
import { daysBetween } from '@/lib/scoring';
import type { FacilitySummary, TimeAxis, TrendCategory } from '@/lib/types';

export function SummaryViewTab() {
  const t = useT();
  const rootRef = useRef<HTMLDivElement>(null);
  const { filtered, summaries, referenceDate } = useDerived();
  const timeAxis = useStore((s) => s.timeAxis);
  const setTimeAxis = useStore((s) => s.setTimeAxis);
  const [trend, setTrend] = useState<'all' | TrendCategory>('all');

  const m = useMemo(
    () => summaryMetrics(summaries, filtered, referenceDate),
    [summaries, filtered, referenceDate],
  );

  const shown = trend === 'all' ? summaries : summaries.filter((s) => s.trend === trend);

  const csvRows = summaries.map((s) => ({
    Facility: s.facilityName,
    Assessments: s.assessmentCount,
    'Baseline Date': s.baseline.reportingDate,
    'Latest Date': s.latest.reportingDate,
    'Follow-up (days)': s.followUpDays,
    'Baseline Total': s.baselineTotal,
    'Latest Total': s.latestTotal,
    'Delta Total': s.deltaTotal,
    Status: s.latestCategory,
  }));

  return (
    <div ref={rootRef} className="space-y-4">
      <ExportBar
        rootRef={rootRef}
        deckTitle="Summary View"
        fileBase="summary-view"
        csv={{ rows: csvRows, fileName: 'summary-progress.csv' }}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <IndicatorBox label={t('facilitiesTracked')} value={m.facilitiesTracked} gradient={GRADIENTS.blue} icon="🏥" />
        <IndicatorBox label={t('avgAssessments')} value={m.avgPerFacility.toFixed(1)} gradient={GRADIENTS.purple} icon="🔁" />
        <IndicatorBox label={t('medianDelta')} value={`${m.medianDelta >= 0 ? '+' : ''}${m.medianDelta.toFixed(1)}`} gradient={GRADIENTS.green} icon="📈" />
        <IndicatorBox label={t('medianFollowUp')} value={m.medianFollowUp} gradient={GRADIENTS.teal} icon="🗓️" />
        <IndicatorBox label={t('totalAssessments')} value={m.totalAssessments} gradient={GRADIENTS.amber} icon="📊" />
        <IndicatorBox label={t('last30')} value={m.last30} gradient={GRADIENTS.blue} icon="📅" />
        <IndicatorBox label={t('last7')} value={m.last7} gradient={GRADIENTS.purple} icon="🕐" />
      </div>

      <ChartCard
        title={`📈 ${t('trajectory')}`}
        subtitle={t('subTrajectory')}
        height={480}
      >
        <div className="flex flex-wrap gap-4 mb-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{t('timeAxis')}:</span>
            {(
              [
                ['reportingDate', t('axisReportingDate')],
                ['daysSinceBaseline', t('axisDaysSinceBaseline')],
                ['assessmentNumber', t('axisAssessmentNumber')],
              ] as [TimeAxis, string][]
            ).map(([v, label]) => (
              <label key={v} className="flex items-center gap-1">
                <input type="radio" checked={timeAxis === v} onChange={() => setTimeAxis(v)} />
                {label}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{t('trend')}:</span>
            {(
              [
                ['all', t('trendAll')],
                ['increasing', t('trendIncreasing')],
                ['decreasing', t('trendDecreasing')],
                ['static', t('trendStatic')],
              ] as ['all' | TrendCategory, string][]
            ).map(([v, label]) => (
              <label key={v} className="flex items-center gap-1">
                <input type="radio" checked={trend === v} onChange={() => setTrend(v)} />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div style={{ height: 400 }}>
          <Trajectory summaries={shown} timeAxis={timeAxis} />
        </div>
      </ChartCard>

      <ChartCard
        title={`🟥🟩 ${t('changeBaseline')}`}
        subtitle={t('subChangeBaseline')}
        height={Math.max(320, summaries.length * 20)}
      >
        <ChangeHeatmap summaries={summaries} />
      </ChartCard>

      <section className="card p-4">
        <h3 className="font-semibold text-slate-800 mb-2">📋 {t('progressSummary')}</h3>
        <ProgressTable summaries={summaries} />
      </section>
    </div>
  );
}

function Trajectory({
  summaries,
  timeAxis,
}: {
  summaries: FacilitySummary[];
  timeAxis: TimeAxis;
}) {
  const t = useT();
  const isMobile = useIsMobile();
  if (summaries.length === 0) return <Empty />;
  const traces = summaries.map((s) => {
    const xs = s.assessments.map((a, i) => {
      if (timeAxis === 'assessmentNumber') return i + 1;
      if (timeAxis === 'daysSinceBaseline')
        return daysBetween(s.baseline.reportingDate, a.reportingDate);
      return a.reportingDate;
    });
    return {
      type: 'scatter' as const,
      mode: 'lines+markers' as const,
      name: s.facilityName,
      x: xs,
      y: s.assessments.map((a) => a.totalScore),
      hovertemplate: `${s.facilityName}<br>%{y}<extra></extra>`,
      showlegend: false,
    };
  });
  return (
    <Plot
      data={traces}
      layout={{
        margin: { l: isMobile ? 38 : 50, r: isMobile ? 8 : 20, t: 10, b: 50 },
        font: { size: isMobile ? 10 : 12 },
        xaxis: {
          title: {
            text:
              timeAxis === 'assessmentNumber'
                ? t('axisAssessmentNumber')
                : timeAxis === 'daysSinceBaseline'
                  ? t('axisDaysSinceBaseline')
                  : t('axisReportingDate'),
          },
        },
        yaxis: { title: { text: t('totalScore') }, range: [0, 100] },
        shapes: [refLine(50, '#c0392b'), refLine(80, '#27ae60')],
      }}
    />
  );
}

function refLine(y: number, color: string) {
  return {
    type: 'line' as const,
    xref: 'paper' as const,
    x0: 0,
    x1: 1,
    y0: y,
    y1: y,
    line: { color, width: 1.5, dash: 'dash' as const },
  };
}

function ChangeHeatmap({ summaries }: { summaries: FacilitySummary[] }) {
  const isMobile = useIsMobile();
  if (summaries.length === 0) return <Empty />;
  const z = summaries.map((s) => DOMAINS.map((d) => s.domainDelta[d.id] ?? 0));
  return (
    <Plot
      data={[
        {
          type: 'heatmap',
          z,
          x: DOMAINS.map((d) => d.label),
          y: summaries.map((s) => s.facilityName),
          // Per-cell deltas overlap on narrow screens — color grid only on
          // mobile; exact values stay available on hover/tap.
          text: z.map((row) => row.map((v) => (v > 0 ? `+${v}` : `${v}`))) as unknown as string[],
          texttemplate: isMobile ? undefined : '%{text}',
          textfont: { size: 9 },
          colorscale: [
            [0, '#c0392b'],
            [0.5, '#f7e9b0'],
            [1, '#27ae60'],
          ],
          zmin: -50,
          zmax: 50,
          showscale: !isMobile,
          hovertemplate: '%{y}<br>%{x}: %{z}<extra></extra>',
        },
      ]}
      layout={{
        margin: { l: isMobile ? 92 : 160, r: 10, t: 10, b: isMobile ? 90 : 120 },
        xaxis: { side: 'top', tickangle: -40, automargin: true, tickfont: { size: isMobile ? 8 : 11 } },
        yaxis: { autorange: 'reversed', automargin: true, tickfont: { size: isMobile ? 8 : 11 } },
      }}
    />
  );
}

function ProgressTable({ summaries }: { summaries: FacilitySummary[] }) {
  const t = useT();
  if (summaries.length === 0) return <Empty />;
  const headers = [
    t('facility'),
    t('thAssessments'),
    t('thBaselineDate'),
    t('thLatestDate'),
    t('thFollowUpDays'),
    t('thBaseline'),
    t('thLatest'),
    t('thDeltaTotal'),
    t('status'),
  ];
  return (
    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-slate-100 text-left">
          <tr>
            {headers.map((h) => (
              <th key={h} className="py-2 px-2 font-semibold text-slate-700">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {summaries.map((s) => (
            <tr key={s.facilityId} className="border-b border-slate-100">
              <td className="py-1.5 px-2">{s.facilityName}</td>
              <td className="py-1.5 px-2">{s.assessmentCount}</td>
              <td className="py-1.5 px-2">{s.baseline.reportingDate}</td>
              <td className="py-1.5 px-2">{s.latest.reportingDate}</td>
              <td className="py-1.5 px-2">{s.followUpDays}</td>
              <td className="py-1.5 px-2">{s.baselineTotal}</td>
              <td className="py-1.5 px-2">{s.latestTotal}</td>
              <td
                className="py-1.5 px-2 font-medium"
                style={{ color: s.deltaTotal >= 0 ? '#27ae60' : '#c0392b' }}
              >
                {s.deltaTotal >= 0 ? '+' : ''}
                {s.deltaTotal}
              </td>
              <td className="py-1.5 px-2">{t(CATEGORY_KEY[s.latestCategory])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Empty = () => {
  const t = useT();
  return (
    <div className="h-full grid place-items-center text-slate-400 text-sm">
      {t('noFacilitiesMatch')}
    </div>
  );
};
