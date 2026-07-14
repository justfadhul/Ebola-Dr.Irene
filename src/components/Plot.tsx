'use client';

import dynamic from 'next/dynamic';
import type { PlotParams } from 'react-plotly.js';

// Plotly touches window/document, so load it only on the client (no SSR).
// Bind react-plotly to the `plotly.js-dist-min` build explicitly so the PPTX
// export (src/lib/exportPptx.ts) can reuse the exact same Plotly instance for
// Plotly.toImage() on the rendered chart nodes.
const Plotly = dynamic(
  async () => {
    const Plotlyjs = (await import('plotly.js-dist-min')).default;
    const createPlotlyComponent = (await import('react-plotly.js/factory')).default;
    return createPlotlyComponent(Plotlyjs);
  },
  { ssr: false },
);

export default function Plot(props: PlotParams) {
  return (
    <Plotly
      {...props}
      useResizeHandler
      style={{ width: '100%', height: '100%', ...(props.style ?? {}) }}
      config={{
        displaylogo: false,
        responsive: true,
        // The floating modebar overlaps chart content on small screens (and
        // is redundant with the planned export feature) — hide it everywhere.
        displayModeBar: false,
        ...(props.config ?? {}),
      }}
    />
  );
}
