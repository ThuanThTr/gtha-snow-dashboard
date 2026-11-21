"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import type { MunicipalRecord } from "@/lib/types";
import {
  GTHA_AVG_ID,
  METRIC_BY_KEY,
  SERIES_A,
  SERIES_B,
  formatMetric,
  gthaAverageRecords,
  type MetricKey,
} from "@/lib/metrics";
import { TABLE, TABLE_CELL, TABLE_HEAD_ROW, TABLE_MISSING, TABLE_ROW, TABLE_ROW_HEADER, TABLE_TH } from "@/lib/typography";

type NumericField = {
  [K in keyof MunicipalRecord]: MunicipalRecord[K] extends number | null ? K : never;
}[keyof MunicipalRecord];

interface TableRow {
  field: NumericField;
  label: string;
  /** Metric whose formatter is used for the value. */
  format: MetricKey;
  /** Map metric(s) that highlight this row. */
  highlight: MetricKey[];
  /** A component of total winter spending, shown indented under it. */
  part?: boolean;
  /** Text shown for a reported zero (e.g. sidewalks folded into roads). */
  zeroText?: string;
  /** Financial Information Return line, shown in an info popover. */
  info?: { code: string; text: string };
}

/** Rows of the side-by-side table, in display order. */
const TABLE_ROWS: TableRow[] = [
  { field: "totalExpenses", label: "Total winter spending", format: "totalExpenses", highlight: ["totalExpenses"] },
  {
    field: "roadsCost",
    label: "Roads only",
    format: "totalExpenses",
    highlight: ["totalExpenses"],
    part: true,
    info: { code: "0621", text: "Winter Control - Except Sidewalks, Parking Lots" },
  },
  {
    field: "sidewalksCost",
    label: "Sidewalks and parking lots only",
    format: "totalExpenses",
    highlight: ["totalExpenses"],
    part: true,
    zeroText: "n/a",
    info: { code: "0622", text: "Winter Control - Sidewalks, Parking Lots Only" },
  },
  { field: "spendPerCapita", label: METRIC_BY_KEY.spendPerCapita.label, format: "spendPerCapita", highlight: ["spendPerCapita", "changeSince2016"] },
  { field: "spendPerKm", label: METRIC_BY_KEY.spendPerKm.label, format: "spendPerKm", highlight: ["spendPerKm"] },
  { field: "operatingExpense", label: METRIC_BY_KEY.operatingExpense.label, format: "operatingExpense", highlight: ["operatingExpense"] },
  {
    field: "winterShareOfOperating",
    label: METRIC_BY_KEY.winterShareOfOperating.label,
    format: "winterShareOfOperating",
    highlight: ["winterShareOfOperating"],
  },
  { field: "avgSnowMm", label: METRIC_BY_KEY.avgSnowMm.label, format: "avgSnowMm", highlight: ["avgSnowMm"] },
];

interface ComparisonProps {
  records: MunicipalRecord[];
  years: number[];
  year: number;
  metric: MetricKey;
  selA: string | null;
  selB: string | null;
  onChangeA: (id: string) => void;
  onChangeB: (id: string) => void;
}

export default function Comparison({ records: baseRecords, years, year, metric, selA, selB: selBProp, onChangeA, onChangeB }: ComparisonProps) {
  const [vsAverage, setVsAverage] = useState(false);
  // Municipal records plus one synthetic "GTHA average" record per year.
  const records = useMemo(() => [...baseRecords, ...gthaAverageRecords(baseRecords)], [baseRecords]);
  const selB = vsAverage ? GTHA_AVG_ID : selBProp;

  const municipalities = useMemo(
    () =>
      [...new Map(baseRecords.map((r) => [r.munId, r.name])).entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [baseRecords],
  );

  const recA = records.find((r) => r.munId === selA && r.year === year);
  const recB = records.find((r) => r.munId === selB && r.year === year);
  const nameA = recA?.name ?? "A";
  const nameB = recB?.name ?? "B";

  return (
    <section className="min-w-0 rounded-xl border border-line bg-panel p-3 sm:p-4" aria-labelledby="compare-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="compare-title" className="text-base font-semibold">
          {vsAverage ? "Compare to the GTHA average" : "Compare municipalities"} · {year}
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Picker label="A" color={SERIES_A} value={selA} options={municipalities} onChange={onChangeA} />
          <span className="text-ink-3">vs</span>
          {vsAverage ? (
            <span className="flex items-center gap-1.5">
              <span
                className="grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold text-white"
                style={{ background: SERIES_B }}
                aria-hidden
              >
                B
              </span>
              <span className="rounded-md border border-line bg-surface px-2 py-1">GTHA average</span>
            </span>
          ) : (
            <Picker label="B" color={SERIES_B} value={selB} options={municipalities} onChange={onChangeB} />
          )}
          <button
            type="button"
            onClick={() => setVsAverage((v) => !v)}
            aria-pressed={vsAverage}
            className={`rounded-md border px-2.5 py-1 font-medium ${
              vsAverage ? "border-ink bg-ink text-panel" : "border-line bg-panel text-ink hover:bg-surface"
            }`}
          >
            {vsAverage ? "Compare to a municipality" : "Compare to GTHA average"}
          </button>
        </div>
      </div>

      {vsAverage && (
        <div className="-mt-2 mb-4 text-xs italic text-ink-2">
          <p className="font-semibold">GTHA average:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            <li>
              Spending per resident is GTHA-wide (total winter spending ÷ total population of municipalities reporting
              that year).
            </li>
            <li>The share of operating expenses is GTHA-wide (total winter spending ÷ total operating expenses).</li>
            <li>Dollar totals and snowfall are the average across reporting municipalities.</li>
          </ul>
        </div>
      )}

      <div className="grid gap-6">
        {/* Side-by-side table */}
        <div className="overflow-x-auto">
          <table className={`${TABLE} stack`}>
            <thead>
              <tr className={TABLE_HEAD_ROW}>
                <th scope="col" className={TABLE_TH}>Indicator</th>
                <th scope="col" className={`${TABLE_TH} text-right`}>{nameA}</th>
                <th scope="col" className={`${TABLE_TH} text-right`}>{nameB}</th>
                <th scope="col" className={`${TABLE_TH} text-right`}>A vs B</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {TABLE_ROWS.map((row) => {
                // A component is only meaningful when that year's total was reported.
                const pick = (rec: MunicipalRecord | undefined) =>
                  rec && (!row.part || rec.totalExpenses != null) ? (rec[row.field] ?? null) : null;
                const a = pick(recA);
                const b = pick(recB);
                // Skip the comparison when a component is a reported zero: "−100%" would mislead.
                const diff =
                  a != null && b != null && b !== 0 && !(row.zeroText && a === 0) ? (a - b) / b : null;
                const text = (v: number | null) => (v === 0 && row.zeroText ? row.zeroText : formatMetric(row.format, v));
                const value = (v: number | null) =>
                  `${TABLE_CELL} whitespace-nowrap text-right ${v == null ? TABLE_MISSING : row.part ? "text-ink-2" : "text-ink"}`;
                return (
                  <tr key={row.field} className={`${TABLE_ROW} ${row.highlight.includes(metric) ? "bg-surface" : ""}`}>
                    <th
                      scope="row"
                      className={row.part ? "py-3 pr-4 pl-4 text-left font-normal text-ink-2" : TABLE_ROW_HEADER}
                    >
                      {row.label}
                      {row.info && <InfoTip code={row.info.code} text={row.info.text} label={row.label} />}
                    </th>
                    <td data-label={nameA} className={value(a)}>{text(a)}</td>
                    <td data-label={nameB} className={value(b)}>{text(b)}</td>
                    <td data-label="A vs B" className={`${TABLE_CELL} whitespace-nowrap text-right text-ink-2`}>
                      {diff == null ? "—" : `${diff > 0 ? "+" : ""}${d3.format(".0%")(diff)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Trend of the active map metric */}
        <TrendChart records={records} years={years} year={year} metric={metric} selA={selA} selB={selB} />
      </div>
    </section>
  );
}

function Picker({
  label,
  color,
  value,
  options,
  onChange,
}: {
  label: string;
  color: string;
  value: string | null;
  options: { id: string; name: string }[];
  onChange: (id: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span
        className="grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold text-white"
        style={{ background: color }}
        aria-hidden
      >
        {label}
      </span>
      <span className="sr-only">Municipality {label}</span>
      {/* Native arrow hidden and replaced with the dashboard chevron, so the box fits the name plus the arrow */}
      <span className="relative">
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-[11rem] cursor-pointer appearance-none rounded-md border border-line bg-panel py-1 pl-2.5 pr-7 sm:max-w-none"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-2"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </label>
  );
}

/** "i" button that shows a Financial Information Return line on click; closes on outside click or Escape. */
function InfoTip({ code, text, label }: { code: string; text: string; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative ml-1.5 inline-block align-middle">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`About ${label}: line ${code}`}
        className="grid h-4 w-4 cursor-pointer place-items-center rounded-full border border-ink-3 text-[10px] font-semibold leading-none text-ink-2 hover:border-ink hover:text-ink"
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1.5 block w-64 rounded-md border border-line bg-panel px-3 py-2 text-xs font-normal italic text-ink shadow-sm"
        >
          <span className="font-semibold tabular-nums">{code}</span> {text}
        </span>
      )}
    </span>
  );
}

const H = 220;
const M = { top: 16, right: 16, bottom: 28, left: 64 };

function TrendChart({
  records,
  years,
  year,
  metric,
  selA,
  selB,
}: {
  records: MunicipalRecord[];
  years: number[];
  year: number;
  metric: MetricKey;
  selA: string | null;
  selB: string | null;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(0);
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const def = METRIC_BY_KEY[metric];

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e!.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const series = useMemo(
    () =>
      [
        { slot: "A", id: selA, color: SERIES_A },
        { slot: "B", id: selB, color: SERIES_B },
      ]
        .filter((s) => s.id)
        .map((s) => {
          const rows = records.filter((r) => r.munId === s.id).sort((a, b) => a.year - b.year);
          return { ...s, name: rows[0]?.name ?? "", points: rows.map((r) => ({ year: r.year, value: r[metric] })) };
        }),
    [records, selA, selB, metric],
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !width) return;
    const root = d3.select(svg);
    const innerW = width - M.left - M.right;

    const x = d3.scaleLinear().domain(d3.extent(years) as [number, number]).range([M.left, M.left + innerW]);
    const allValues = series.flatMap((s) => s.points.map((p) => p.value)).filter((v): v is number => v != null);
    // Start at zero, but extend below it when a measure (change since 2016) has negative values.
    const y = d3
      .scaleLinear()
      .domain([Math.min(0, d3.min(allValues) ?? 0), Math.max(d3.max(allValues) ?? 1, 0)])
      .nice()
      .range([H - M.bottom, M.top]);

    // Axes (recessive)
    root
      .selectAll<SVGGElement, null>("g.x")
      .data([null])
      .join("g")
      .attr("class", "x")
      .attr("transform", `translate(0,${H - M.bottom})`)
      .call(d3.axisBottom(x).ticks(Math.min(years.length, Math.floor(innerW / 48))).tickFormat(d3.format("d")).tickSizeOuter(0))
      .call((g) => g.selectAll("path,line").attr("stroke", "#d6d5d0"))
      .call((g) => g.selectAll("text").attr("fill", "#52514e"));

    root
      .selectAll<SVGGElement, null>("g.y")
      .data([null])
      .join("g")
      .attr("class", "y")
      .attr("transform", `translate(${M.left},0)`)
      .call(d3.axisLeft(y).ticks(4).tickSize(-innerW).tickFormat((v) => def.formatShort(v as number)))
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll("line").attr("stroke", "#ecebe7"))
      .call((g) => g.selectAll("text").attr("fill", "#52514e"));

    // Active-year marker
    root
      .selectAll<SVGLineElement, number>("line.year")
      .data([year])
      .join("line")
      .attr("class", "year")
      .attr("x1", (d) => x(d))
      .attr("x2", (d) => x(d))
      .attr("y1", M.top)
      .attr("y2", H - M.bottom)
      .attr("stroke", "#8a8983")
      .attr("stroke-dasharray", "3 3");

    const line = d3
      .line<{ year: number; value: number | null }>()
      .defined((p) => p.value != null)
      .x((p) => x(p.year))
      .y((p) => y(p.value!));

    root
      .selectAll<SVGPathElement, (typeof series)[number]>("path.series")
      .data(series, (s) => s.slot)
      .join("path")
      .attr("class", "series")
      .attr("fill", "none")
      .attr("stroke", (s) => s.color)
      .attr("stroke-width", 2)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .transition()
      .duration(300)
      .attr("d", (s) => line(s.points));

    // Hover dots
    const dots = series.flatMap((s) =>
      s.points
        .filter((p) => p.year === hoverYear && p.value != null)
        .map((p) => ({ key: s.slot, color: s.color, cx: x(p.year), cy: y(p.value!) })),
    );
    root
      .selectAll<SVGCircleElement, (typeof dots)[number]>("circle.dot")
      .data(dots, (d) => d.key)
      .join("circle")
      .attr("class", "dot")
      .attr("r", 4.5)
      .attr("fill", (d) => d.color)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("cx", (d) => d.cx)
      .attr("cy", (d) => d.cy);

    // Invisible hit area for the crosshair tooltip
    root
      .selectAll<SVGRectElement, null>("rect.hit")
      .data([null])
      .join("rect")
      .attr("class", "hit")
      .attr("x", M.left)
      .attr("y", M.top)
      .attr("width", innerW)
      .attr("height", H - M.top - M.bottom)
      .attr("fill", "transparent")
      .on("pointermove", (event: PointerEvent) => {
        const [px] = d3.pointer(event);
        setHoverYear(Math.round(x.invert(px)));
      })
      .on("pointerleave", () => setHoverYear(null));
  }, [width, series, years, year, def, hoverYear]);

  const tipX = hoverYear != null && width ? hoverYear : null;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
        <span className="font-medium text-ink">{def.label} over time</span>
        {series.map((s) => (
          <span key={s.slot} className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
      <div ref={wrapRef} className="relative">
        <svg ref={svgRef} width={width} height={H} role="img" aria-label={`${def.label} by year for the selected municipalities`} />
        {tipX != null && (
          <div className="pointer-events-none absolute top-0 right-0 rounded-md border border-line bg-panel px-2.5 py-1.5 text-xs shadow-sm">
            <p className="mb-0.5 font-semibold">{tipX}</p>
            {series.map((s) => (
              <p key={s.slot} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="tabular-nums">{formatMetric(metric, s.points.find((p) => p.year === tipX)?.value)}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
