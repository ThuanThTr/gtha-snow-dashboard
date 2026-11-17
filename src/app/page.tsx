"use client";

import { useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import type { FeatureCollection, Geometry } from "geojson";

import Sidebar from "@/components/Sidebar";
import GthaMap, { type MunFeatureProps } from "@/components/Map";
import Comparison from "@/components/Comparison";
import Profiles from "@/components/Profiles";
import metricsJson from "@/data/municipal-metrics.json";
import { METRIC_BY_KEY, SEQ_RAMP, indexRecords, type MetricKey, type ScaleMode } from "@/lib/metrics";
import type { MetricsFile } from "@/lib/types";

/** Indicators offered in the map dropdown, in display order. */
const DROPDOWN_METRICS: MetricKey[] = ["totalExpenses", "spendPerCapita", "avgSnowMm"];

type View = "map" | "profiles";
const VIEWS: [View, string][] = [
  ["map", "Map"],
  ["profiles", "Profiles"],
];

const data = metricsJson as MetricsFile;
const byYear = indexRecords(data.records);
const MIN_YEAR = data.years[0]!;
const MAX_YEAR = data.years.at(-1)!;


export default function Page() {
  const [year, setYear] = useState(2020);
  const [view, setView] = useState<View>("map");
  const [metric, setMetric] = useState<MetricKey>("totalExpenses");
  const [scaleMode, setScaleMode] = useState<ScaleMode>("all-years");
  const [selA, setSelA] = useState<string | null>("20002"); // Toronto
  const [selB, setSelB] = useState<string | null>("21005"); // Mississauga
  const [nextSlot, setNextSlot] = useState<"A" | "B">("A");
  const [geo, setGeo] = useState<FeatureCollection<Geometry, MunFeatureProps> | null>(null);
  const [geoError, setGeoError] = useState(false);

  useEffect(() => {
    fetch("/data/gtha-boundaries.geojson")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setGeo)
      .catch(() => setGeoError(true));
  }, []);

  const recordsById = byYear.get(year) ?? new Map();
  const recordsList = [...recordsById.values()];
  const withSpendCount = recordsList.filter((r) => r.totalExpenses != null).length;

  // Colour scale: quantiles over all years (so colours are comparable year to year)
  // or over the selected year only (to spread out the colours for that year).
  const colorScale = useMemo(() => {
    const source = scaleMode === "all-years" ? data.records : [...recordsById.values()];
    const values = source.map((r) => r[metric]).filter((v): v is number => v != null);
    return d3.scaleQuantile<string>().domain(values).range(SEQ_RAMP);
  }, [metric, scaleMode, recordsById]);

  function handleMapSelect(id: string) {
    if (id === selA || id === selB) return;
    if (nextSlot === "A") setSelA(id);
    else setSelB(id);
    setNextSlot(nextSlot === "A" ? "B" : "A");
  }

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      {/* Left: context & controls */}
      <aside className="w-full shrink-0 border-b border-line bg-panel lg:w-[380px] lg:overflow-y-auto lg:border-r lg:border-b-0">
        <Sidebar minYear={MIN_YEAR} maxYear={MAX_YEAR} assumptions={data.assumptions} />
      </aside>

      {/* Right: visualization */}
      <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:overflow-y-auto lg:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <div role="tablist" aria-label="Main view" className="flex w-fit rounded-md border border-line bg-panel p-0.5 text-sm">
              {VIEWS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={view === key}
                  onClick={() => setView(key)}
                  className={`rounded px-3 py-1 ${view === key ? "bg-ink text-white" : "text-ink-2 hover:text-ink"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <h2 className="text-xl font-semibold">
              {view === "map" ? METRIC_BY_KEY[metric].label : "Winter maintenance profiles"}
            </h2>
          </div>
          {view === "map" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-line bg-panel px-3 py-1.5 text-sm">
              <label htmlFor="year" className="font-medium">
                Year
              </label>
              <span className="text-xs text-ink-3 tabular-nums">{MIN_YEAR}</span>
              <input
                id="year"
                type="range"
                min={MIN_YEAR}
                max={MAX_YEAR}
                step={1}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="year-slider w-36"
                style={{ "--fill": `${((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%` } as React.CSSProperties}
              />
              <span className="text-xs text-ink-3 tabular-nums">{MAX_YEAR}</span>
              <output htmlFor="year" className="w-12 text-right font-semibold tabular-nums">
                {year}
              </output>
            </div>
            <label className="sr-only" htmlFor="metric">
              Map metric
            </label>
            <select
              id="metric"
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricKey)}
              className="rounded-md border border-line bg-panel px-3 py-1.5 text-sm"
            >
              {DROPDOWN_METRICS.map((key) => (
                <option key={key} value={key}>
                  {METRIC_BY_KEY[key].label}
                </option>
              ))}
            </select>
            <div className="flex rounded-md border border-line bg-panel p-0.5 text-sm" role="group" aria-label="Colour scale range">
              {(
                [
                  ["all-years", "Scale: all years"],
                  ["this-year", "Scale: this year"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setScaleMode(mode)}
                  aria-pressed={scaleMode === mode}
                  className={`rounded px-2.5 py-1 ${scaleMode === mode ? "bg-ink text-white" : "text-ink-2 hover:text-ink"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          )}
        </header>

        {view === "map" && withSpendCount < recordsList.length && (
          <p className="-mt-2 text-xs text-ink-2">
            {withSpendCount === 0
              ? `No spending data reported for ${year} yet — only snowfall is shown.`
              : `${recordsList.length - withSpendCount} of ${recordsList.length} municipalities have no spending data for ${year}.`}
          </p>
        )}

        {view === "map" && (
        <section className="relative min-h-[420px] flex-1 overflow-hidden rounded-xl border border-line bg-panel lg:min-h-[480px]">
          {geo ? (
            <GthaMap
              geo={geo}
              year={year}
              metric={metric}
              recordsById={recordsById}
              colorScale={colorScale}
              selectedA={selA}
              selectedB={selB}
              onSelect={handleMapSelect}
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-ink-2">
              {geoError ? "Could not load the boundary file." : "Loading map…"}
            </div>
          )}
          <p className="pointer-events-none absolute top-3 right-3 rounded bg-panel/90 px-2 py-1 text-xs text-ink-2">
            Click a municipality to set comparison <strong>{nextSlot}</strong>
          </p>
        </section>
        )}

        {view === "map" && (
        <Comparison
          records={data.records}
          years={data.years}
          year={year}
          metric={metric}
          selA={selA}
          selB={selB}
          onChangeA={setSelA}
          onChangeB={setSelB}
        />
        )}

        {view === "profiles" && (
          <section className="max-w-5xl">
            <Profiles />
          </section>
        )}
      </main>
    </div>
  );
}
