// Minimal type declarations for the untyped Plotly entry points we import
// directly. @types/react-plotly.js covers the default `react-plotly.js` module
// but not the `/factory` subpath or the `plotly.js-dist-min` bundle.

declare module 'plotly.js-dist-min' {
  // We only use toImage() for the PPTX export; keep the rest permissive.
  const Plotly: {
    toImage: (
      node: HTMLElement,
      opts: { format: 'png' | 'jpeg' | 'svg' | 'webp'; width: number; height: number; scale?: number },
    ) => Promise<string>;
    [key: string]: unknown;
  };
  export default Plotly;
}

declare module 'react-plotly.js/factory' {
  import type { ComponentType } from 'react';
  import type { PlotParams } from 'react-plotly.js';
  const createPlotlyComponent: (plotly: unknown) => ComponentType<PlotParams>;
  export default createPlotlyComponent;
}
