'use client';

import dynamic from 'next/dynamic';
import type { PlotParams } from 'react-plotly.js';

// Plotly touches window/document, so load it only on the client (no SSR).
const Plotly = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function Plot(props: PlotParams) {
  return (
    <Plotly
      {...props}
      useResizeHandler
      style={{ width: '100%', height: '100%', ...(props.style ?? {}) }}
      config={{ displaylogo: false, responsive: true, ...(props.config ?? {}) }}
    />
  );
}
