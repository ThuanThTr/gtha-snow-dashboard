/** One municipality in one year, after merging and calculating measures. */
export interface MunicipalRecord {
  munId: string;
  name: string;
  fullName: string;
  /** Region name from the municipal directory, e.g. "Durham Region" or "City of Toronto". */
  region: string;
  /** Short area name used for area comparisons: Toronto, Hamilton, Halton, Peel, York or Durham. */
  area: string;
  year: number;
  /** Average snowfall in cm (estimated). */
  avgSnowCm: number | null;
  /**
   * Total winter cost, $: the municipality's own winter control for roads, sidewalks and parking lots,
   * plus its population share of its Region's road winter costs. Null = not reported that year.
   */
  totalExpenses: number | null;
  /** The municipality's own winter control cost (roads, sidewalks and parking lots), $. */
  localCost: number | null;
  /** Own winter control for roads, $. Null = not reported that year. */
  roadsCost: number | null;
  /**
   * Own winter control for sidewalks and parking lots, $. Zero means the municipality reports these
   * together with roads that year, not that it spent nothing.
   */
  sidewalksCost: number | null;
  /** The municipality's population share of its Region's road winter costs, $. 0 for Toronto and Hamilton. */
  regionalCost: number | null;
  /** regionalCost ÷ totalExpenses, 0 to 1. */
  regionalShare: number | null;
  /** 2021 Census population, used for every year. */
  population: number | null;
  /** Total winter cost per resident, $ (the headline measure). */
  spendPerCapita: number | null;
  /** Change in spending per resident since 2016, as a fraction (0.25 = +25%). Null for 2016 and earlier. */
  changeSince2016: number | null;
}

export interface MetricsFile {
  generatedAt: string;
  years: number[];
  records: MunicipalRecord[];
}
