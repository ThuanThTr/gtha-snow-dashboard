import type { MunicipalRecord } from "./types";

/** Five-step sequential blue ramp, light → dark, for the choropleth. */
export const SEQ_RAMP = ["#c8e0f4", "#a9c8e6", "#88aecf", "#587a9d", "#2f4d6a"];
/** Change since 2016: one blue step for a fall, four rust steps for growth. */
export const CHANGE_RAMP = ["#88aecf", "#f6dccb", "#eab08f", "#d4733f", "#b5461a"];
/** Upper bounds between the CHANGE_RAMP steps: fell | 0–20% | 20–40% | 40–60% | 60% or more. */
export const CHANGE_THRESHOLDS = [0, 0.2, 0.4, 0.6];
export const CHANGE_LABELS = ["Fell", "Up to 20%", "20–40%", "40–60%", "60% or more"];
export const NO_DATA_FILL = "#e3f2fc";
export const SERIES_A = "#2a78d6";
export const SERIES_B = "#b5461a"; // Plow rust: 5.4:1 with white badge text

export type ScaleMode = "all-years" | "this-year";

export type MetricKey =
  | "spendPerCapita"
  | "totalExpenses"
  | "localCost"
  | "regionalCost"
  | "changeSince2016"
  | "avgSnowCm";

export interface MetricDef {
  key: MetricKey;
  label: string;
  /** Full, rounded value for text, e.g. "$347 million". */
  format: (v: number) => string;
  /** Compact value for legends and chart axes, e.g. "$347M". */
  formatShort: (v: number) => string;
  /** True for measures that can fall below zero and use the two-colour change scale. */
  diverging?: boolean;
}

const whole = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 });
const dec1 = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const compact = new Intl.NumberFormat("en-CA", { notation: "compact", maximumFractionDigits: 1 });

/** "$347 million", "$4.3 million", "$850,000". */
export function formatMoneyLong(v: number): string {
  if (Math.abs(v) >= 1e9) return `$${dec1.format(v / 1e9)} billion`;
  if (Math.abs(v) >= 1e8) return `$${whole.format(v / 1e6)} million`;
  if (Math.abs(v) >= 1e6) return `$${dec1.format(v / 1e6)} million`;
  return `$${whole.format(Math.round(v / 1000) * 1000)}`;
}

const dollars = (v: number) => `$${whole.format(v)}`;
const percent = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${whole.format(Math.abs(v * 100))}%`;

export const METRICS: MetricDef[] = [
  {
    key: "spendPerCapita",
    label: "Winter spending per resident",
    format: dollars,
    formatShort: dollars,
  },
  {
    key: "totalExpenses",
    label: "Total winter spending",
    format: formatMoneyLong,
    formatShort: (v) => `$${compact.format(v)}`,
  },
  {
    key: "localCost",
    label: "Own roads and sidewalks",
    format: formatMoneyLong,
    formatShort: (v) => `$${compact.format(v)}`,
  },
  {
    key: "regionalCost",
    label: "Share of regional roads",
    format: formatMoneyLong,
    formatShort: (v) => `$${compact.format(v)}`,
  },
  {
    key: "changeSince2016",
    label: "Change in spending per resident since 2016",
    format: percent,
    formatShort: percent,
    diverging: true,
  },
  {
    key: "avgSnowCm",
    label: "Average snowfall (estimated)",
    format: (v) => `${whole.format(v)} cm`,
    formatShort: (v) => `${whole.format(v)} cm`,
  },
];

export const METRIC_BY_KEY = Object.fromEntries(METRICS.map((m) => [m.key, m])) as Record<MetricKey, MetricDef>;

/** Rounded value for text. Missing values read "No data", never $0. */
export function formatMetric(key: MetricKey, value: number | null | undefined): string {
  return value == null ? "No data" : METRIC_BY_KEY[key].format(value);
}

/** Index records as year → munId → record for fast lookup. */
export function indexRecords(records: MunicipalRecord[]) {
  const byYear = new Map<number, Map<string, MunicipalRecord>>();
  for (const r of records) {
    if (!byYear.has(r.year)) byYear.set(r.year, new Map());
    byYear.get(r.year)!.set(r.munId, r);
  }
  return byYear;
}

/** Records grouped by municipality, sorted by year. */
export function seriesByMunicipality(records: MunicipalRecord[]) {
  const byId = new Map<string, MunicipalRecord[]>();
  for (const r of records) {
    if (!byId.has(r.munId)) byId.set(r.munId, []);
    byId.get(r.munId)!.push(r);
  }
  for (const list of byId.values()) list.sort((a, b) => a.year - b.year);
  return byId;
}

/** Ordinal suffix: 1 → "1st", 22 → "22nd". */
export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}
