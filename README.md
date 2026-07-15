# Ebola IPC Assessment Analysis Dashboard

A client-side dashboard that analyzes and visualizes results from **WHO IPC
Rapid Assessment Tool (RAT)** assessments for Ebola/Marburg outbreaks. It turns
facility IPC Assessment data (total score + per-domain scores) into
decision-support visuals for national, sub-national, and partner IPC response
teams.

Built with **Next.js (static export)** so it deploys to GitHub Pages and runs
**entirely in the browser** — uploaded data never leaves your device, is never
stored on a server, and is cleared when you close the tab.

See [`PLAN.md`](./PLAN.md) for the full design, requirements, and roadmap.

## Features

Three operational views, all driven by one scoring model
(🔴 Critical ≤50% · 🟡 At Risk 51–79% · 🟢 Ready ≥80%):

- **🚨 Outbreak Response** — readiness counts, ranked Outbreak Readiness Index
  bar chart, facility × domain heatmap, facility map, and a dispatch table.
- **🌐 Summary View** — 7 KPI boxes, total-score trajectory (with time-axis and
  trend filters), change-from-baseline heatmap, and a facility progress table.
- **🏥 Facility Deep Dive** — per-facility snapshot bars + domain detail table
  and a diverging domain-change-since-baseline chart.

**Data sources:** CSV (standard columns), CSV (custom column mapping with
keyword auto-suggest and a review-before-apply panel), a **KoboToolbox API**
fetch (paginated, token auth — requires the Kobo server to allow CORS), and a
built-in fabricated **Test Data** set (200 facilities, 3 provinces).

**Sidebar controls:** language (EN/FR/ES, applied across all UI text),
geography cascade (province → district → subdistrict), facility level/date
filters, a searchable facility exclude list, a custom baseline anchor, and the
Outbreak Response domain subset.

**Also:** per-tab exports (charts → PowerPoint, tables → CSV), a fully
responsive mobile layout, and an installable, offline-capable PWA (the app
shell and assets are cached after first load; uploaded data is never cached).

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Click **🧪 Load Test Data** to explore with fabricated data, or upload a CSV.

## Build & deploy (GitHub Pages)

```bash
BASE_PATH="/<repo-name>" npm run build   # static site emitted to ./out
```

Serve the `out/` directory from GitHub Pages. `BASE_PATH` must match the Pages
sub-path for a project site (omit it for a user/organization site).

## Notes

- The test data is entirely fabricated; geolocation points are not real.
- Map tiles require a network connection; without one, the app still works and
  the map degrades gracefully.
