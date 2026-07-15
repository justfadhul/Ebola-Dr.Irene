'use client';

import { useState, type RefObject } from 'react';
import { useT } from '@/lib/i18n';

/**
 * Per-tab export controls: charts → PowerPoint, table → CSV.
 * `rootRef` should wrap the tab content whose Plotly charts get captured.
 */
export function ExportBar({
  rootRef,
  deckTitle,
  fileBase,
  csv,
}: {
  rootRef: RefObject<HTMLDivElement | null>;
  deckTitle: string;
  fileBase: string;
  csv?: { rows: Record<string, unknown>[]; fileName: string };
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const exportPptx = async () => {
    if (!rootRef.current || busy) return;
    setBusy(true);
    setMsg('');
    try {
      const { exportChartsToPptx } = await import('@/lib/exportPptx');
      const n = await exportChartsToPptx(rootRef.current, deckTitle, fileBase);
      setMsg(n === 0 ? t('exportNoCharts') : '');
    } catch {
      setMsg(t('exportFailed'));
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = async () => {
    if (!csv || csv.rows.length === 0) return;
    const { downloadCsv } = await import('@/lib/exportCsv');
    downloadCsv(csv.fileName, csv.rows);
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {msg && <span className="text-xs text-red-600">{msg}</span>}
      {csv && (
        <button
          type="button"
          onClick={exportCsv}
          className="btn-secondary disabled:opacity-50"
          disabled={csv.rows.length === 0}
        >
          <span aria-hidden="true">⬇️</span> {t('exportCsv')}
        </button>
      )}
      <button
        type="button"
        onClick={exportPptx}
        className="btn-secondary disabled:opacity-50"
        disabled={busy}
      >
        <span aria-hidden="true">🖼️</span> {busy ? t('exporting') : t('exportPptx')}
      </button>
    </div>
  );
}
