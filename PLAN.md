# Ebola IPC Assessment Analysis Dashboard — Build Plan

A plan to build a dashboard tool that analyzes and visualizes results from
**WHO IPC Rapid Assessment Tool (RAT)** assessments for Ebola/Marburg outbreaks.
This document is derived from the *Ebola IPC Assessment Analysis Dashboard User
Guide (7 June 2026)* and the reference deployment at
`https://ipc-toolbox.github.io/ipc_rat_dashboard/`.

---

## 1. What the tool is (from the source document)

IPC (Infection Prevention & Control) teams assess healthcare facilities using
the WHO IPC RAT, capturing a **total score** plus **per-domain scores**. Data is
collected in Kobo/Excel and exported as CSV. The dashboard ingests that data and
turns it into decision-support visuals for **national, sub-national, and partner
IPC response teams** to (a) prioritize interventions and (b) track change over
time.

**Non-negotiable product principles (called out in the guide):**

- **Privacy-first / fully client-side.** Uploaded data never leaves the browser,
  is never stored server-side, and is erased when the tab closes or new data is
  loaded. → *No backend, no database, no telemetry on the data.*
- **Offline-capable.** After first load, the app works with no internet (upload
  and analyze offline). → *Installable PWA with a service worker.*
- **Static hosting.** Runs on GitHub Pages. → *Static build, no server runtime.*
- **Multilingual.** English / Français / Español, switchable live, affecting all
  UI text.
- **Export built in.** Visuals → PowerPoint; tables → Excel/CSV, per tab.

### Scoring model (used everywhere, no per-chart overrides)

| Category    | Score      | Meaning                        | Color  |
|-------------|------------|--------------------------------|--------|
| 🔴 Critical | ≤ 50%      | Immediate intervention needed  | Red    |
| 🟡 At Risk  | 51%–79%    | Gaps remain; not yet prepared  | Yellow |
| 🟢 Ready    | ≥ 80%      | Meets most criteria            | Green  |

### IPC domains (columns in the per-facility heatmaps / snapshots)

~18 domains from the RAT, e.g.: IPC Committee, Staff Training, Hand Hygiene,
Screening/Triage, Isolation, PPE, Injection Safety, Environmental Cleaning,
Decontamination, Post-exposure, Patient Management, Patient Placement,
Sanitation, Water Supply, Waste Management (Solid), Waste Management (Liquid),
Dead Body Management. (Exact domain list to be pinned to the RAT column spec.)

---

## 2. Application structure

### Left sidebar (3 collapsible sections)

1. **📂 Data Source** *(open by default)*
   - Language selector (EN / FR / ES).
   - Three ingestion modes:
     - **CSV (Standard)** — file already uses WHO RAT column names.
     - **CSV (Custom Mapping)** — non-standard columns; app auto-suggests
       matches by keyword, user confirms → *Apply Mapping*. Minimum required
       mappings: Facility Name, Reporting Date (plus Total, domains, lat/long).
     - **KoboToolbox API** — server URL + asset UID + API token → *Fetch Data*
       (paginated pull of all submissions).
2. **🔍 View Controls** *(collapsed)* — global filters affecting every chart:
   - Time axis: Reporting Date / Days Since Baseline / Assessment #.
   - Include data on/after (date floor).
   - Geography cascade: Province → District → Subdistrict.
   - Facility Level: primary / secondary / tertiary.
   - Facility multi-select (remove specific facilities).
   - **Custom baseline anchor** (toggle): target date ± N-week buffer; each
     facility's baseline = earliest assessment inside the window; pre-baseline
     assessments excluded. (For comparing against a common event.)
3. **🚨 Outbreak Settings** *(collapsed)* — choose the subset of domains used in
   Outbreak Response calculations/visuals (Readiness Index always uses overall
   score).

### Main area — 3 tabs

**🚨 Outbreak Response** (snapshot for prioritization)
- Indicator boxes: **Ready / At Risk / Critical** facility counts (X / N).
- **Outbreak Readiness Index** — ranked horizontal bar chart, lowest score on
  top, colored by category, threshold guide lines at 50 & 80.
- **Assessment Domain Scores** — facility × domain heatmap, cells colored by
  category.
- **Facility Map** — Leaflet map; dot color = category, dot size scales with
  score; hover shows Status, Score, Last assessed. Needs lat/long.
- **Dispatch Decision Table** — sortable/filterable list: facility, readiness
  score, critical-gap domains, last assessed, status.

**🌐 Summary View** (change over time)
- Indicator boxes: Facilities Tracked, Avg Assessments/Facility, Median Δ Total
  Score (since baseline), Median Follow-up (days), Total Assessments, Total
  (last 30 days), Total (last 7 days).
- **Total Score Trajectory** — one line per facility over time; 50/80 reference
  lines; time-axis switch; trend filter (all / increasing / decreasing / static).
- **Change from Baseline** — facility × domain heatmap of Δ (green up, red down,
  yellow flat).
- **Facility Progress Summary** — table: #assessments, baseline/latest dates,
  follow-up days, baseline/latest total, Δ total, latest status.

**🏥 Facility Deep Dive** (one facility at a time)
- Selectors: Facility to inspect; Specific assessment (defaults to latest).
  Respects sidebar filters.
- Indicator boxes: Assessments Since Baseline, Assessments (last 30d),
  Assessments (last 7d).
- **Single Assessment Snapshot** — all domain scores as bars (category colored,
  50/80 guides) + companion table (score, Δ from baseline, status).
- **Domain Change Since Baseline (Diverging)** — net Δ per domain, sorted
  biggest loss (left/red) → biggest gain (right/green).

---

## 3. Recommended technical approach

The reference app is **R + Shiny** (per the guide), which on GitHub Pages implies
a WebAssembly build (shinylive). Two viable paths:

| Option | Stack | Pros | Cons |
|---|---|---|---|
| **A (recommended)** | **React + TypeScript + Vite**, client-side only | Maintainable by any web dev, small bundle, first-class PWA/i18n/export, easy GitHub Pages deploy | Rebuild of analysis logic in TS |
| B | R/Shiny via shinylive (WASM) | Reuses existing Shiny logic if source is available | Large WASM payload, R-specialist maintenance, harder i18n/PWA |

**Recommended stack (Option A):**

- **Framework/build:** React + TypeScript + Vite → static output for GitHub Pages.
- **State/filters:** lightweight store (Zustand) holding the parsed dataset +
  filter state; all derived data computed with memoized selectors.
- **CSV parsing:** PapaParse (streaming, handles large files in-browser).
- **Charts:** Plotly.js (matches the reference visuals — bars, lines, heatmaps,
  hover, PNG export) **or** ECharts. Plotly recommended for parity + export.
- **Maps:** Leaflet + react-leaflet with OpenStreetMap tiles (tiles need network;
  degrade gracefully offline).
- **Tables:** TanStack Table (column sort + per-column filters + range filters).
- **i18n:** i18next with EN/FR/ES resource bundles.
- **Offline:** vite-plugin-pwa (service worker precache of app shell).
- **Exports:** PptxGenJS (charts → PPTX) and a CSV writer (tables → CSV/Excel).
- **Kobo:** fetch the KoboToolbox `/assets/{uid}/data` endpoint with token auth,
  paginated. (CORS may require the user's Kobo instance to allow it — document
  as a known constraint.)

**Everything runs in the browser. No server, no data persistence.**

---

## 4. Data model (core abstraction)

```
Assessment {
  facilityId, facilityName
  province, district, subdistrict
  facilityLevel: 'primary' | 'secondary' | 'tertiary'
  reportingDate: Date
  latitude?, longitude?
  totalScore: number            // 0–100
  domainScores: Record<DomainId, number>  // 0–100 per domain
}
```

Derived per facility: baseline assessment (own-earliest or custom-anchor
window), latest assessment, Δ total, per-domain Δ, status category, follow-up
days, trend classification (increasing/decreasing/static). A single **selectors
layer** computes these once from `(dataset, filters, outbreakSettings)` and feeds
every tab — guaranteeing the "one scoring model everywhere" rule.

---

## 5. Phased roadmap

**Phase 0 — Scaffold & contracts**
- Vite + React + TS project, GitHub Pages deploy workflow, ESLint/Prettier.
- Pin the canonical WHO RAT column spec + domain list (schema constants).
- Define `Assessment` types, scoring/category helpers, and the test data loader
  (200 fabricated facilities, 3 provinces — reuse the guide's test-data shape).

**Phase 1 — Ingestion + global state**
- CSV Standard upload (PapaParse) → validated `Assessment[]`.
- Custom Mapping UI (keyword auto-suggest, confirm, apply).
- Kobo API fetch (paginated) + geolocation array split into lat/long.
- Sidebar Data Source section + language switch (i18n wired, EN first).

**Phase 2 — View Controls + selectors engine**
- Date floor, geography cascade, facility level, facility multi-select.
- Custom baseline anchor logic (window + buffer, pre-baseline exclusion).
- Time-axis and trend classification. Memoized selector layer feeding tabs.

**Phase 3 — Outbreak Response tab**
- Indicator boxes, Readiness Index bar, Domain heatmap, Facility Map, Dispatch
  Decision Table. Outbreak Settings domain subset wired in.

**Phase 4 — Summary View tab**
- 7 indicator boxes, Total Score Trajectory (+ trend filter), Change-from-
  Baseline heatmap, Facility Progress Summary table.

**Phase 5 — Facility Deep Dive tab**
- Facility/assessment selectors, 3 indicator boxes, Single Assessment Snapshot
  (+ companion table), Domain Change diverging chart.

**Phase 6 — Exports, i18n completion, PWA, polish**
- PPTX export of visuals + CSV export of tables per tab.
- FR/ES translation bundles; live language switch across all text.
- PWA offline install; empty/error states; troubleshooting parity (missing
  columns, missing lat/long, empty baseline window, Kobo auth errors).

**Phase 7 — QA & docs**
- Test data validation, cross-browser check, accessibility (color is
  category-coded — add non-color cues/labels), user-facing README/help.

---

## 6. Key risks & decisions

- **Exact RAT column & domain spec** — must be pinned to the real WHO RAT export
  to make "Standard CSV" work without mapping. *Need the canonical column names.*
- **Kobo CORS** — browser-only fetch depends on the Kobo instance allowing
  cross-origin requests with the token; document/verify.
- **Map tiles offline** — Leaflet tiles need network; offline mode shows dots
  without basemap (acceptable degradation) unless we bundle a static basemap.
- **Accessibility** — the design leans hard on red/yellow/green; add text labels
  and patterns so it's not color-only.
- **Reference-vs-rebuild** — if the original R/Shiny source is available and
  licensed for reuse, we should study it for exact formulas (baseline, trend,
  medians) even though we rebuild the UI in the web stack.

---

## 7. Open questions for the product owner

1. **Rebuild in the modern web stack (Option A) or extend the existing R/Shiny
   app (Option B)?**
2. Is the original dashboard's source code available to us as a reference?
3. Do you have the exact WHO RAT standard CSV column list / domain names?
4. Should the map ship an offline basemap, or is "dots-only when offline" fine?
5. Any branding (logos, colors, org name) to apply, or keep it neutral?
