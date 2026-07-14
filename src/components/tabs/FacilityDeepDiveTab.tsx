'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Plot from '@/components/Plot';
import { ChartCard } from '@/components/ChartCard';
import { ExportBar } from '@/components/ExportBar';
import { IndicatorBox, GRADIENTS } from '@/components/IndicatorBox';
import { useDerived } from '@/lib/useDerived';
import { useStore } from '@/store/useStore';
import { useT, CATEGORY_KEY } from '@/lib/i18n';
import { useIsMobile } from '@/lib/useIsMobile';
import { DOMAINS } from '@/lib/domains';
import { categorize, colorForScore, colorForDelta, daysBetween, CATEGORY_EMOJI } from '@/lib/scoring';

const TODAY = '2024-09-30';

export function FacilityDeepDiveTab() {
  const t = useT();
  const isMobile = useIsMobile();
  const rootRef = useRef<HTMLDivElement>(null);
  const { summaries } = useDerived();
  const selectedFacilityId = useStore((s) => s.selectedFacilityId);
  const setSelectedFacility = useStore((s) => s.setSelectedFacility);
  const [assessmentIdx, setAssessmentIdx] = useState<number | null>(null);

  const facility = useMemo(
    () => summaries.find((s) => s.facilityId === selectedFacilityId) ?? summaries[0],
    [summaries, selectedFacilityId],
  );

  useEffect(() => {
    setAssessmentIdx(null); // reset to latest when facility changes
  }, [facility?.facilityId]);

  if (!facility)
    return (
      <div className="card p-8 text-center text-slate-400">{t('noFacilitiesMatch')}</div>
    );

  const idx = assessmentIdx ?? facility.assessments.length - 1;
  const assessment = facility.assessments[idx];
  const since30 = facility.assessments.filter(
    (a) => daysBetween(a.reportingDate, TODAY) <= 30 && daysBetween(a.reportingDate, TODAY) >= 0,
  ).length;
  const since7 = facility.assessments.filter(
    (a) => daysBetween(a.reportingDate, TODAY) <= 7 && daysBetween(a.reportingDate, TODAY) >= 0,
  ).length;

  const csvRows = DOMAINS.map((d) => {
    const score = assessment.domainScores[d.id] ?? 0;
    return {
      Domain: `${d.order}. ${d.label}`,
      Score: score,
      'Delta Baseline': score - (facility.baseline.domainScores[d.id] ?? 0),
      Status: categorize(score),
    };
  });

  return (
    <div ref={rootRef} className="space-y-4">
      <ExportBar
        rootRef={rootRef}
        deckTitle={`Facility Deep Dive — ${facility.facilityName}`}
        fileBase={`facility-${facility.facilityId}`}
        csv={{
          rows: csvRows,
          fileName: `facility-${facility.facilityId}-assessment-${idx + 1}.csv`,
        }}
      />
      <div className="card p-4 grid md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">🏥 {t('facilityToInspect')}</span>
          <select
            value={facility.facilityId}
            onChange={(e) => setSelectedFacility(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
          >
            {summaries.map((s) => (
              <option key={s.facilityId} value={s.facilityId}>
                {s.facilityName}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">📋 {t('specificAssessment')}</span>
          <select
            value={idx}
            onChange={(e) => setAssessmentIdx(Number(e.target.value))}
            className="mt-1 w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
          >
            {facility.assessments.map((a, i) => (
              <option key={i} value={i}>
                #{i + 1} — {a.reportingDate} (Total {a.totalScore})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <IndicatorBox label={`📋 ${t('assessmentsSinceBaseline')}`} value={facility.assessmentCount} gradient={GRADIENTS.blue} />
        <IndicatorBox label={`🗓️ ${t('assessmentsLast30')}`} value={since30} gradient={GRADIENTS.teal} />
        <IndicatorBox label={`🕐 ${t('assessmentsLast7')}`} value={since7} gradient={GRADIENTS.purple} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard
          title={`📊 ${t('snapshot')}`}
          subtitle={`${t('assessment')} #${idx + 1} — ${assessment.reportingDate} · ${t('total')} ${assessment.totalScore}`}
          height={520}
        >
          <Plot
            data={[
              {
                type: 'bar',
                orientation: 'h',
                y: DOMAINS.map((d) => `${d.order}. ${d.label}`),
                x: DOMAINS.map((d) => assessment.domainScores[d.id] ?? 0),
                marker: {
                  color: DOMAINS.map((d) => colorForScore(assessment.domainScores[d.id] ?? 0)),
                },
                hovertemplate: '%{y}<br>Score: %{x}<extra></extra>',
              },
            ]}
            layout={{
              margin: { l: isMobile ? 108 : 150, r: isMobile ? 8 : 20, t: 10, b: 40 },
              font: { size: isMobile ? 9 : 12 },
              xaxis: { title: { text: t('score') }, range: [0, 100] },
              yaxis: { autorange: 'reversed', automargin: true, tickfont: { size: isMobile ? 9 : 12 } },
              shapes: [vLine(50, '#c0392b'), vLine(80, '#27ae60')],
            }}
          />
        </ChartCard>

        <section className="card p-4 overflow-y-auto" style={{ maxHeight: 560 }}>
          <h3 className="font-semibold text-slate-800 mb-2">{t('domainDetail')}</h3>
          <table className="w-full text-sm border-collapse">
            <thead className="text-left bg-slate-100">
              <tr>
                <th className="py-2 px-2">{t('thDomain')}</th>
                <th className="py-2 px-2">{t('score')}</th>
                <th className="py-2 px-2">{t('thDeltaBaseline')}</th>
                <th className="py-2 px-2">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {DOMAINS.map((d) => {
                const score = assessment.domainScores[d.id] ?? 0;
                const delta = score - (facility.baseline.domainScores[d.id] ?? 0);
                const cat = categorize(score);
                return (
                  <tr key={d.id} className="border-b border-slate-100">
                    <td className="py-1.5 px-2">{d.order}. {d.label}</td>
                    <td className="py-1.5 px-2">{score}</td>
                    <td className="py-1.5 px-2" style={{ color: colorForDelta(delta) }}>
                      {delta >= 0 ? '+' : ''}{delta}
                    </td>
                    <td className="py-1.5 px-2">
                      {CATEGORY_EMOJI[cat]} {t(CATEGORY_KEY[cat])}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>

      <ChartCard
        title={`📊 ${t('divergingChange')} (${t('divergingView')})`}
        subtitle={t('subDiverging')}
        height={480}
      >
        <DivergingChange facility={facility} />
      </ChartCard>
    </div>
  );
}

function vLine(x: number, color: string) {
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

function DivergingChange({ facility }: { facility: ReturnType<typeof useDerived>['summaries'][number] }) {
  const t = useT();
  const isMobile = useIsMobile();
  const rows = DOMAINS.map((d) => ({ label: d.label, delta: facility.domainDelta[d.id] ?? 0 })).sort(
    (a, b) => a.delta - b.delta,
  );
  return (
    <Plot
      data={[
        {
          type: 'bar',
          orientation: 'h',
          y: rows.map((r) => r.label),
          x: rows.map((r) => r.delta),
          marker: { color: rows.map((r) => colorForDelta(r.delta)) },
          hovertemplate: '%{y}: %{x}<extra></extra>',
        },
      ]}
      layout={{
        margin: { l: isMobile ? 104 : 150, r: isMobile ? 8 : 20, t: 10, b: 40 },
        font: { size: isMobile ? 9 : 12 },
        xaxis: { title: { text: t('axisDeltaSinceBaseline') }, zeroline: true },
        yaxis: { automargin: true, tickfont: { size: isMobile ? 9 : 12 } },
      }}
    />
  );
}
