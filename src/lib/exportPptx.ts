'use client';

// Snapshot every Plotly chart inside `root` and assemble them into a PowerPoint
// deck (one chart per slide). Leaflet maps are not Plotly plots and are skipped.

type PlotlyToImage = {
  toImage: (
    node: HTMLElement,
    opts: { format: 'png'; width: number; height: number; scale?: number },
  ) => Promise<string>;
};

function titleFor(node: HTMLElement, index: number): string {
  const heading = node.closest('section')?.querySelector('h3')?.textContent?.trim();
  return heading && heading.length > 0 ? heading : `Chart ${index + 1}`;
}

export async function exportChartsToPptx(
  root: HTMLElement,
  deckTitle: string,
  fileBase: string,
): Promise<number> {
  const [{ default: Plotly }, { default: PptxGenJS }] = await Promise.all([
    import('plotly.js-dist-min') as Promise<{ default: PlotlyToImage }>,
    import('pptxgenjs'),
  ]);

  const nodes = Array.from(
    root.querySelectorAll<HTMLElement>('.js-plotly-plot'),
  ).filter((n) => n.offsetWidth > 0 && n.offsetHeight > 0);

  if (nodes.length === 0) return 0;

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'W', width: 10, height: 5.63 });
  pptx.layout = 'W';

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const w = node.offsetWidth || 1000;
    const h = node.offsetHeight || 600;
    const dataUrl = await Plotly.toImage(node, {
      format: 'png',
      width: w,
      height: h,
      scale: 2,
    });

    const slide = pptx.addSlide();
    slide.addText(titleFor(node, i), {
      x: 0.4,
      y: 0.2,
      w: 9.2,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: '0F172A',
    });

    // Fit the image into the content area, preserving aspect ratio.
    const areaW = 9.2;
    const areaH = 4.6;
    const ar = w / h;
    let imgW = areaW;
    let imgH = areaW / ar;
    if (imgH > areaH) {
      imgH = areaH;
      imgW = areaH * ar;
    }
    slide.addImage({
      data: dataUrl,
      x: 0.4 + (areaW - imgW) / 2,
      y: 0.8 + (areaH - imgH) / 2,
      w: imgW,
      h: imgH,
    });
  }

  pptx.title = deckTitle;
  await pptx.writeFile({ fileName: `${fileBase}.pptx` });
  return nodes.length;
}
