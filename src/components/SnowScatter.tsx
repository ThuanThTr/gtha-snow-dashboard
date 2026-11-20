"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import type { MunicipalRecord } from "@/lib/types";
import { snowVsSpending } from "@/lib/insights";
import { gthaAverageRecords } from "@/lib/metrics";

const H = 300;
const M = { top: 16, right: 20, bottom: 44, left: 56 };

/** Each municipality as a dot: average snowfall against average spending per resident, sized by population. */
export default function SnowScatter({ records }: { records: MunicipalRecord[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const points = useMemo(() => snowVsSpending(records), [records]);
  const years = useMemo(() => [...new Set(records.map((r) => r.year))].sort((a, b) => a - b), [records]);
  // GTHA average over all years: mean of the yearly GTHA-wide spending per resident and of yearly average snowfall.
  const gtha = useMemo(() => {
    const avg = gthaAverageRecords(records);
    return {
      perResident: d3.mean(avg, (r) => r.spendPerCapita ?? undefined) ?? null,
      snow: d3.mean(avg, (r) => r.avgSnowCm ?? undefined) ?? null,
    };
  }, [records]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e!.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const innerW = Math.max(0, width - M.left - M.right);
  const x = d3
    .scaleLinear()
    .domain(d3.extent(points, (p) => p.avgSnowCm) as [number, number])
    .nice()
    .range([M.left, M.left + innerW]);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(points, (p) => p.perResident) ?? 1])
    .nice()
    .range([H - M.bottom, M.top]);
  const r = d3
    .scaleSqrt()
    .domain([0, d3.max(points, (p) => p.population) ?? 1])
    .range([3, 16]);

  // Label the five highest spenders and the three largest municipalities; the rest stay unlabelled to avoid clutter.
  const labelled = new Set([
    ...[...points].sort((a, b) => b.perResident - a.perResident).slice(0, 5).map((p) => p.munId),
    ...[...points].sort((a, b) => b.population - a.population).slice(0, 3).map((p) => p.munId),
  ]);
  // Place labels top to bottom, nudging one down when it would overlap a label already placed.
  const LINE = 13;
  const placed: { x: number; y: number; w: number }[] = [];
  const labels = points
    .filter((p) => labelled.has(p.munId))
    .sort((a, b) => y(a.perResident) - y(b.perResident))
    .map((p) => {
      const lx = x(p.avgSnowCm) + r(p.population) + 4;
      const w = p.name.length * 6.5;
      let ly = y(p.perResident);
      while (placed.some((q) => Math.abs(q.y - ly) < LINE && lx < q.x + q.w && q.x < lx + w)) ly += LINE;
      placed.push({ x: lx, y: ly, w });
      return { ...p, lx, ly };
    });

  return (
    <section aria-labelledby="scatter-title" className="flex flex-col gap-3 min-w-0 rounded-xl border border-line bg-panel p-3 sm:p-4">
      <div>
        <h2 id="scatter-title" className="text-base font-semibold">
          Snowfall and spending, {years[0]} to {years.at(-1)}
        </h2>
        <p className="text-xs text-ink-2">Do snowier places spend more?</p>
      </div>
      <div ref={wrapRef}>
        {width > 0 && (
          <svg
            width={width}
            height={H}
            role="img"
            aria-label="Scatter chart of average snowfall against average spending per resident for the 26 municipalities"
          >
            {y.ticks(4).map((t) => (
              <g key={`y${t}`}>
                <line x1={M.left} x2={M.left + innerW} y1={y(t)} y2={y(t)} stroke="#e3f2fc" />
                <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="#557388">
                  ${t}
                </text>
              </g>
            ))}
            {x.ticks(Math.max(2, Math.floor(innerW / 80))).map((t) => (
              <text key={`x${t}`} x={x(t)} y={H - M.bottom + 16} textAnchor="middle" fontSize={11} fill="#557388">
                {t}
              </text>
            ))}
            <line x1={M.left} x2={M.left + innerW} y1={H - M.bottom} y2={H - M.bottom} stroke="#c8e0f4" />
            {gtha.snow != null && (
              <g>
                <line
                  x1={x(gtha.snow)}
                  x2={x(gtha.snow)}
                  y1={M.top}
                  y2={H - M.bottom}
                  stroke="#b5461a"
                  strokeDasharray="4 3"
                  strokeOpacity={0.6}
                />
                <text x={x(gtha.snow) + 4} y={M.top + 4} dy="0.32em" fontSize={11} fill="#b5461a">
                  GTHA avg {Math.round(gtha.snow)} cm
                </text>
              </g>
            )}
            {gtha.perResident != null && (
              <g>
                <line
                  x1={M.left}
                  x2={M.left + innerW}
                  y1={y(gtha.perResident)}
                  y2={y(gtha.perResident)}
                  stroke="#b5461a"
                  strokeDasharray="4 3"
                />
                <text
                  x={M.left + innerW}
                  y={y(gtha.perResident) - 6}
                  textAnchor="end"
                  fontSize={11}
                  fontWeight={600}
                  fill="#b5461a"
                  stroke="#ffffff"
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  GTHA average ${Math.round(gtha.perResident)} per resident
                </text>
              </g>
            )}
            <text x={M.left + innerW / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="#4a6a88">
              Average snowfall per year (estimated, cm)
            </text>
            <text
              transform={`translate(14 ${M.top + (H - M.top - M.bottom) / 2}) rotate(-90)`}
              textAnchor="middle"
              fontSize={11}
              fill="#4a6a88"
            >
              Average spending per resident
            </text>
            {[...points]
              .sort((a, b) => b.population - a.population)
              .map((p) => (
                <circle
                  key={p.munId}
                  cx={x(p.avgSnowCm)}
                  cy={y(p.perResident)}
                  r={r(p.population)}
                  fill="#2f4d6a"
                  fillOpacity={0.6}
                  stroke="#ffffff"
                  strokeWidth={1}
                >
                  <title>{`${p.name}: ${Math.round(p.avgSnowCm)} cm of snow, $${Math.round(p.perResident)} per resident`}</title>
                </circle>
              ))}
            {labels.map((p) => (
                <text
                  key={`l${p.munId}`}
                  x={p.lx}
                  y={p.ly}
                  dy="0.32em"
                  fontSize={11}
                  fontWeight={600}
                  fill="#2f4d6a"
                  stroke="#ffffff"
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {p.name}
                </text>
              ))}
          </svg>
        )}
      </div>
      <p className="text-xs text-ink-2">
        Each dot is one municipality, sized by population. Dashed lines mark the GTHA average (spending per resident is
        GTHA-wide: total spending ÷ total population, averaged over {years[0]}–{years.at(-1)}). The snowy, rural ones sit higher on the chart, Uxbridge most
        of all. Snow is one reason. Service levels, road networks and contracts drive the cost too. And the snowfall
        numbers are estimates.
      </p>
    </section>
  );
}
