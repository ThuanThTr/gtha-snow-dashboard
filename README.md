# GTHA Snow Plowing Dashboard

Next.js + TypeScript + Tailwind + D3 dashboard of winter road maintenance across the 26 GTHA municipalities. Builds to a fully static site.

## Run

```bash
npm install
npm run dev      # runs the data script, then http://localhost:3000
npm run build    # runs the data script, then writes the static site to /out
```

## Data pipeline — `scripts/process-data.ts`

Inputs (kept in the repo so Vercel can rebuild):

- `data/winter-costs.csv` — one row per municipality per year, 2015–2025: total winter cost (roads 0621 + sidewalks 0622 + population share of the Region's road costs), cost per resident, 2021 population and estimated snowfall in cm. Exported from the "Clean Data" sheet of `data/winter_costs.xlsx`, with `mun-id` added from its "Annual Snowfall" sheet. Blank totals mean the municipality did not report that year.
- `data/municipality-directory.csv` — names and regions (its road-length column is no longer read)
- `geospatial data/Municipal_Boun_FeaturesToJSO.geojson`

Steps: read winter costs → join the directory on `mun-id` → compute measures (null when an input is missing, never 0), including change in cost per resident since 2016 and the regional roads share → filter the GeoJSON to GTHA municipalities, fix ring winding for D3 and round coordinates.

The 2025 rows for Aurora, Brock and East Gwillimbury were added to the CSV from a later FIR extract, `data/fir-2025-update.csv` (total = 0621 + 0622 + the workbook's allocated regional cost). The workbook does not have them yet, so add them there before re-exporting, or they will be lost.

If the workbook changes, re-export the CSV before running `npm run data`. Public-facing text avoids "FIR", "tier" and the 0621/0622 codes.

Outputs: `src/data/municipal-metrics.json` (bundled into the page) and `public/data/gtha-boundaries.geojson` (fetched by the map).

Road length and the snow-mass estimates were removed because the road-length figures are not reliable across municipalities.

## Code map

- `src/app/page.tsx` — left/right layout and shared state (year, metric, comparison picks)
- `src/components/Sidebar.tsx` — overview text and link to the project description
- `src/app/project/page.tsx` — project description: key findings cards, methods, worked example, limitations, data sources
- `src/components/Map.tsx` — D3 choropleth, legend, hover panel (rank, trend line, own vs regional share), click-to-compare
- `src/components/Comparison.tsx` — A vs B table and trend chart
- `src/components/StoryCards.tsx` — findings cards (shown on the project description page)
- `src/components/AreaComparison.tsx`, `SnowScatter.tsx` — area bars and snowfall vs spending chart on the dashboard
- `src/lib/metrics.ts` — metric definitions, formatters, colours
- `src/lib/insights.ts` — headline year and the summaries behind the cards and charts

## Deploy to Vercel

Import the folder as a project. Framework preset: Next.js. No settings to change — `next.config.ts` sets `output: "export"`, and `prebuild` regenerates the data.
