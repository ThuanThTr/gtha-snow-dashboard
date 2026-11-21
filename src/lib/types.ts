/**
 * Which level of government the record belongs to. Each tier has its own winter maintenance mandate.
 * Upper tier: Toronto and Hamilton (single-tier cities) and the Regions. Lower tier: cities and towns within a Region.
 */
export type Tier = "Upper-tier" | "Lower-tier";

/** One municipality in one year, after merging and calculating measures. */
export interface MunicipalRecord {
  munId: string;
  name: string;
  fullName: string;
  /** Region name from the municipal directory, e.g. "Durham Region" or "City of Toronto". */
  region: string;
  /** Short area name used for area comparisons: Toronto, Hamilton, Halton, Peel, York or Durham. */
  area: string;
  /** Tier from the cost data; null only for the synthetic GTHA average. */
  tier: Tier | null;
  year: number;
  /** Average snowfall in mm (estimated). */
  avgSnowMm: number | null;
  /**
   * Total winter cost, $: the municipality's own winter control for roads, sidewalks and parking lots.
   * Null = not reported that year.
   */
  totalExpenses: number | null;
  /** Own winter control for roads, $. Null = not reported that year. */
  roadsCost: number | null;
  /**
   * Own winter control for sidewalks and parking lots, $. Zero means the municipality reports these
   * together with roads that year, not that it spent nothing.
   */
  sidewalksCost: number | null;
  /** 2021 Census population, used for every year. */
  population: number | null;
  /** Total winter cost per resident, $ (the headline measure). */
  spendPerCapita: number | null;
  /** Total road length, km. */
  roadKm: number | null;
  /** Total winter cost per km of road, $. */
  spendPerKm: number | null;
  /** Change in spending per resident since 2016, as a fraction (0.25 = +25%). Null for 2016 and earlier. */
  changeSince2016: number | null;
  /** The municipality's total operating expenses across all services, $. Null = not reported that year. */
  operatingExpense: number | null;
  /** totalExpenses ÷ operatingExpense, 0 to 1: the share of the operating budget spent on winter control. */
  winterShareOfOperating: number | null;
}

export interface MetricsFile {
  generatedAt: string;
  years: number[];
  records: MunicipalRecord[];
}
