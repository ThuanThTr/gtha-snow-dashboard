"use client";

import { useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import type { FeatureCollection, Geometry } from "geojson";

import Sidebar from "@/components/Sidebar";
import GthaMap, { type LegendItem, type MunFeatureProps } from "@/components/Map";
import Comparison from "@/components/Comparison";
import AreaComparison from "@/components/AreaComparison";
import SnowScatter from "@/components/SnowScatter";
import Link from "next/link";
import { slugify } from "@/lib/slug";
import metricsJson from "@/data/municipal-metrics.json";
import {
  CHANGE_LABELS,
  CHANGE_RAMP,
  CHANGE_THRESHOLDS,
  METRIC_BY_KEY,
  NO_DATA_FILL,
  SEQ_RAMP,
  indexRecords,
  seriesByMunicipality,
  type MetricKey,
  type ScaleMode,
} from "@/lib/metrics";
import { HEADLINE_YEAR } from "@/lib/insights";
import type { MetricsFile } from "@/lib/types";

/** Measures offered in the map dropdown, in display order. */
const DROPDOWN_METRICS: MetricKey[] = ["spendPerCapita", "totalExpenses", "changeSince2016", "avgSnowCm"];

const data = metricsJson as MetricsFile;
const byYear = indexRecords(data.records);
const seriesById = seriesByMunicipality(data.records);
const MIN_YEAR = data.years[0]!;
const MAX_YEAR = data.years.at(-1)!;

const PAIR_KEY = "gtha-compare-pair";
const KNOWN_IDS = new Set(data.records.map((r) => r.munId));
const DEFAULT_PAIR: [string, string] = ["20002", "21005"]; // Toronto, Mississauga

/** The last comparison pair this browser saved, or null if none is usable. */
function readSavedPair(): [string, string] | null {
  try {
    const raw = window.localStorage.getItem(PAIR_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (Array.isArray(value) && value.length === 2 && value.every((id) => typeof id === "string" && KNOWN_IDS.has(id))) {
      return [value[0] as string, value[1] as string];
    }
  } catch {
    // Storage can be blocked or hold bad data; fall back to the default pair.
  }
  return null;
}

function savePair(a: string, b: string) {
  try {
    window.localStorage.setItem(PAIR_KEY, JSON.stringify([a, b]));
  } catch {
    // Ignore: the comparison still works without saving.
  }
}

/** Municipality names grouped by region, for the "open a municipality page" picker. */
const MUNICIPALITY_GROUPS = [...new Set(data.records.map((r) => r.region))].map((region) => ({
  region,
  names: [...new Set(data.records.filter((r) => r.region === region).map((r) => r.name))].sort(),
}));


export default function Page() {
  const [year, setYear] = useState(HEADLINE_YEAR);
  const [metric, setMetric] = useState<MetricKey>("spendPerCapita");
  const [scaleMode, setScaleMode] = useState<ScaleMode>("all-years");
  const [selA, setSelA] = useState<string | null>(DEFAULT_PAIR[0]);
  const [selB, setSelB] = useState<string | null>(DEFAULT_PAIR[1]);
  const [nextSlot, setNextSlot] = useState<"A" | "B">("A");
  const [geo, setGeo] = useState<FeatureCollection<Geometry, MunFeatureProps> | null>(null);
  const [geoError, setGeoError] = useState(false);

  // Restore the last saved pair after mount, so the server render matches the default.
  useEffect(() => {
    const saved = readSavedPair();
    if (saved) {
      setSelA(saved[0]);
      setSelB(saved[1]);
    }
  }, []);

  useEffect(() => {
    fetch("/data/gtha-boundaries.geojson")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setGeo)
      .catch(() => setGeoError(true));
  }, []);

  const recordsById = byYear.get(year) ?? new Map();
  const recordsList = [...recordsById.values()];
  const withData = recordsList.filter((r) => r[metric] != null).length;
  const def = METRIC_BY_KEY[metric];

  // Colour scale. Change since 2016 uses fixed bands (blue = fell, rust = grew).
  // Other measures use quantiles over all years (comparable year to year) or the selected year only.
  const { colorScale, legend } = useMemo((): { colorScale: (v: number) => string; legend: LegendItem[] } => {
    if (def.diverging) {
      const scale = d3.scaleThreshold<number, string>().domain(CHANGE_THRESHOLDS).range(CHANGE_RAMP);
      return {
        colorScale: (v) => scale(v),
        legend: CHANGE_RAMP.map((color, i) => ({ color, label: CHANGE_LABELS[i]! })),
      };
    }
    const source = scaleMode === "all-years" ? data.records : [...recordsById.values()];
    const values = source.map((r) => r[metric]).filter((v): v is number => v != null);
    if (values.length === 0) return { colorScale: () => NO_DATA_FILL, legend: [] };
    const scale = d3.scaleQuantile<string>().domain(values).range(SEQ_RAMP);
    const breaks = scale.quantiles();
    return {
      colorScale: (v) => scale(v),
      legend: SEQ_RAMP.map((color, i) => ({
        color,
        label: i === 0 ? `Under ${def.formatShort(breaks[0]!)}` : `${def.formatShort(breaks[i - 1]!)}+`,
      })),
    };
  }, [def, metric, scaleMode, recordsById]);

  /** Sets both comparison slots and saves the pair once both are filled. */
  function updatePair(a: string | null, b: string | null) {
    setSelA(a);
    setSelB(b);
    if (a && b) savePair(a, b);
  }

  function handleMapSelect(id: string) {
    if (id === selA || id === selB) return;
    if (nextSlot === "A") updatePair(id, selB);
    else updatePair(selA, id);
    setNextSlot(nextSlot === "A" ? "B" : "A");
  }

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      {/* Left: context & controls */}
      <aside className="w-full shrink-0 border-b border-line bg-panel lg:w-[380px] lg:overflow-y-auto lg:border-r lg:border-b-0">
        <Sidebar />
      </aside>

      {/* Right: visualization */}
      <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:overflow-y-auto lg:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{METRIC_BY_KEY[metric].label}</h2>
          </div>
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
            {!def.diverging && (
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
            )}
          </div>
        </header>


        <>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label htmlFor="open-municipality" className="font-medium">
            Municipality page
          </label>
          <select
            id="open-municipality"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) window.location.href = `/municipality/${e.target.value}`;
            }}
            className="rounded-md border border-line bg-panel px-2 py-1 text-sm"
          >
            <option value="">Open a municipality page…</option>
            {MUNICIPALITY_GROUPS.map(({ region, names }) => (
              <optgroup key={region} label={region}>
                {names.map((name) => (
                  <option key={name} value={slugify(name)}>
                    {name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <section className="relative min-h-[420px] flex-1 overflow-hidden rounded-xl border border-line bg-panel lg:min-h-[480px]">
          {geo ? (
            <GthaMap
              geo={geo}
              year={year}
              metric={metric}
              recordsById={recordsById}
              seriesById={seriesById}
              colorScale={colorScale}
              legend={legend}
              selectedA={selA}
              selectedB={selB}
              onSelect={handleMapSelect}
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-ink-2">
              {geoError ? "Could not load the boundary file." : "Loading map…"}
            </div>
          )}
          <p className="pointer-events-none absolute top-3 left-3 rounded bg-panel/90 px-2 py-1 text-xs text-ink-2">
            Click a municipality to set comparison <strong>{nextSlot}</strong>
          </p>
        </section>
        <p className="-mt-2 text-xs text-ink-2">
          Figure: {def.label}, {year}. {withData} of {recordsList.length} municipalities have data for this year.
        </p>
        <div className="-mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {[selA, selB].map((id, i) => {
            const rec = data.records.find((r) => r.munId === id);
            if (!rec) return null;
            return (
              <Link
                key={`${i}-${rec.munId}`}
                href={`/municipality/${slugify(rec.name)}`}
                className="text-ink underline underline-offset-2"
              >
                Open {rec.name} page →
              </Link>
            );
          })}
        </div>
        </>

        <Comparison
          records={data.records}
          years={data.years}
          year={year}
          metric={metric}
          selA={selA}
          selB={selB}
          onChangeA={(id) => updatePair(id, selB)}
          onChangeB={(id) => updatePair(selA, id)}
        />

        <div className="grid gap-4 xl:grid-cols-2">
          <AreaComparison records={data.records} year={year} />
          <SnowScatter records={data.records} />
        </div>
      </main>
    </div>
  );
}
