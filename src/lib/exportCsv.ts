'use client';

import Papa from 'papaparse';

/** Trigger a client-side file download from a Blob. */
function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Export an array of row objects to a CSV file (opens in Excel/Sheets).
 * Column order follows the keys of the first row.
 */
export function downloadCsv(fileName: string, rows: Record<string, unknown>[]) {
  const csv = Papa.unparse(rows, { header: true });
  // Prepend a UTF-8 BOM so Excel renders accented characters correctly.
  download(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }), fileName);
}
