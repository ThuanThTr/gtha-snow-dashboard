import type { Metadata } from "next";
import Link from "next/link";
import { readFileSync } from "node:fs";
import path from "node:path";
import * as d3 from "d3";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import metricsJson from "@/data/municipal-metrics.json";
import losJson from "@/data/level-of-service.json";
import type { MunicipalRecord, MetricsFile } from "@/lib/types";
import { METRIC_BY_KEY, formatMetric } from "@/lib/metrics";
import { slugify } from "@/lib/slug";
import { ServiceLevels, type ServiceCategory, type ServiceProfile } from "@/components/ServiceLevels";
import MunicipalityPicker, { type PickerGroup } from "@/components/MunicipalityPicker";

const data = metricsJson as MetricsFile;
const los = losJson as unknown as { categories: ServiceCategory[]; municipalities: ServiceProfile[] };

interface BoundaryProps {
  munId: string;
  name: string;
}

const boundaries = JSON.parse(
  readFileSync(path.join(process.cwd(), "public", "data", "gtha-boundaries.geojson"), "utf8"),
) as FeatureCollection<Geometry, BoundaryProps>;

const MUNICIPALITIES = [...new Set(data.records.map((r) => r.name))].sort();

/** Municipalities grouped by region, for the switch picker. */
const PICKER_GROUPS: PickerGroup[] = [...new Set(data.records.map((r) => r.region))].map((region) => ({
  region,
  options: [...new Set(data.records.filter((r) => r.region === region).map((r) => r.name))]
    .sort()
    .map((name) => ({ name, slug: slugify(name) })),
}));

/** Records for one municipality, sorted by year. */
function recordsFor(slug: string): MunicipalRecord[] {
  return data
    .records.filter((r) => slugify(r.name) === slug)
    .sort((a, b) => a.year - b.year);
}

export function generateStaticParams() {
  return MUNICIPALITIES.map((name) => ({ slug: slugify(name) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const records = recordsFor(slug);
  const name = records[0]?.name ?? "Municipality";
  const title = `${name} winter maintenance spending | GTHA`;
  const description = `Winter spending per resident, total winter spending and level of service for ${name}, ${data.years[0]} to ${data.years.at(-1)}, from provincial financial reports.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: "en_CA" },
    twitter: { card: "summary", title, description },
  };
}

/** Sidewalks and parking lots: "Included in roads" where the municipality reports them with roads (a zero). */
const sidewalks = (r: MunicipalRecord) =>
  r.totalExpenses == null || r.sidewalksCost == null
    ? "No data"
    : r.sidewalksCost === 0
      ? "Included in roads"
      : formatMetric("totalExpenses", r.sidewalksCost);

/** Regional roads share as a whole percentage; "None" for cities that run all their own roads. */
const share = (r: MunicipalRecord) =>
  r.regionalShare == null ? "No data" : r.regionalCost === 0 ? "None" : `${Math.round(r.regionalShare * 100)}%`;

/** Hero backdrop: the GTHA boundaries with this municipality in the dashboard's dark ink. */
function HeroMap({ name }: { name: string }) {
  const width = 1000;
  const height = 500;
  // Centre the view on this municipality, so its neighbours frame it.
  const focus = boundaries.features.find((f) => f.properties.name === name) ?? boundaries;
  const fitted = d3.geoMercator().fitExtent(
    [
      [0, 0],
      [width, height],
    ],
    focus,
  );
  // Centre on the municipality and zoom out, so the surrounding municipalities stay visible.
  const projection = d3
    .geoMercator()
    .center(d3.geoCentroid(focus))
    .scale(fitted.scale() * 0.4)
    .translate([width / 2, height / 2]);
  const pathFor = d3.geoPath(projection);
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {boundaries.features.map((feature: Feature<Geometry, BoundaryProps>) => {
        const selected = feature.properties.name === name;
        return (
          <path
            key={feature.properties.munId}
            d={pathFor(feature) ?? ""}
            fill={selected ? "#2f4d6a" : "#c8e0f4"}
            stroke="#ffffff"
            strokeWidth={selected ? 1.5 : 0.8}
          />
        );
      })}
    </svg>
  );
}

export default async function MunicipalityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const records = recordsFor(slug);
  if (records.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-ink-2">No data for this municipality.</p>
      </main>
    );
  }

  const name = records[0]!.name;
  const region = records[0]!.region;
  const latest = [...records].reverse().find((r) => r.totalExpenses != null) ?? records.at(-1)!;
  const official = los.municipalities.find((m) => m.name === name);
  const serviceProfile = official ?? null;

  return (
    <main className="flex flex-col">
      <section className="relative h-[380px] overflow-hidden border-b border-line bg-surface md:h-[440px]">
        <HeroMap name={name} />
        <div className="absolute bottom-5 left-5 right-5 max-w-sm border border-line bg-panel/90 p-5 backdrop-blur-sm sm:p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{region}</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight text-ink">{name}</h1>
          <p className="mt-3 text-base text-ink-2">
            Winter road maintenance, {records[0]!.year} to {records.at(-1)!.year}
          </p>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-5 py-12">
        <Link href="/" className="w-fit text-sm text-ink-2 underline underline-offset-2">
          ← Back to the dashboard
        </Link>

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 border-t border-line pt-6">
            <h2 className="text-2xl font-semibold text-ink">Level of Service</h2>
            {official?.sourceUrl ? (
              <p className="text-sm text-ink-2">
                <a
                  href={official.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink underline underline-offset-2"
                >
                  Official winter page
                </a>
                {official.lastVerified && <span> · Last verified {official.lastVerified}</span>}
              </p>
            ) : null}
          </div>
          <MunicipalityPicker groups={PICKER_GROUPS} current={slug} />
          {serviceProfile ? (
            <ServiceLevels profile={serviceProfile} categories={los.categories} />
          ) : (
            <p className="text-sm text-ink-2">No service level data for this municipality.</p>
          )}
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold text-ink">Latest figures, {latest.year}</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
            <Stat label={METRIC_BY_KEY.spendPerCapita.label} value={formatMetric("spendPerCapita", latest.spendPerCapita)} />
            <Stat label={METRIC_BY_KEY.totalExpenses.label} value={formatMetric("totalExpenses", latest.totalExpenses)} />
            <Stat label="Regional roads share" value={share(latest)} />
            <Stat label={METRIC_BY_KEY.avgSnowCm.label} value={formatMetric("avgSnowCm", latest.avgSnowCm)} />
          </dl>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-ink">Where the money goes</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ink text-xs font-medium uppercase tracking-wide text-ink-3">
                  <th scope="col" className="py-2 pr-4 font-medium">Year</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Roads</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Sidewalks and parking lots</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Regional roads share</th>
                  <th scope="col" className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {[...records].reverse().map((r) => {
                  const missing = r.totalExpenses == null;
                  const cell = `py-3 pr-4 text-right ${missing ? "italic text-ink-3" : "text-ink"}`;
                  return (
                    <tr key={r.year} className="border-b border-line">
                      <th scope="row" className="py-3 pr-4 text-left font-medium text-ink">{r.year}</th>
                      <td className={cell}>{missing ? "No data" : formatMetric("totalExpenses", r.roadsCost)}</td>
                      <td className={cell}>{sidewalks(r)}</td>
                      <td className={cell}>
                        {missing ? "No data" : r.regionalCost === 0 ? "None" : formatMetric("regionalCost", r.regionalCost)}
                      </td>
                      <td className={`py-3 text-right font-semibold ${missing ? "italic text-ink-3" : "text-ink"}`}>
                        {formatMetric("totalExpenses", r.totalExpenses)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink-2">
            Roads are the municipality’s own winter control for roads, such as plowing and salting. Some municipalities
            report sidewalks and parking lots together with roads, which is shown as “Included in roads”. The regional
            roads share is this municipality’s population share of its Region’s road costs. Contractor and materials
            costs are not reported separately in the provincial figures.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-ink">Year by year</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ink text-xs font-medium uppercase tracking-wide text-ink-3">
                  <th scope="col" className="py-2 pr-4 font-medium">Year</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Per resident</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Total spending</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Regional roads share</th>
                  <th scope="col" className="py-2 text-right font-medium">Snowfall (estimated)</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {[...records].reverse().map((r) => {
                  const missing = r.totalExpenses == null;
                  const cell = `py-3 pr-4 text-right ${missing ? "italic text-ink-3" : "text-ink"}`;
                  return (
                    <tr key={r.year} className="border-b border-line">
                      <th scope="row" className="py-3 pr-4 text-left font-medium text-ink">{r.year}</th>
                      <td className={cell}>{formatMetric("spendPerCapita", r.spendPerCapita)}</td>
                      <td className={cell}>{formatMetric("totalExpenses", r.totalExpenses)}</td>
                      <td className={cell}>{share(r)}</td>
                      <td className="py-3 text-right text-ink">{formatMetric("avgSnowCm", r.avgSnowCm)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink-2">
            No data means {name} did not report that year; it does not mean nothing was spent. Spending comes from
            provincial financial reports and covers roads, sidewalks and parking lots, plus a population share of regional
            road costs where a Region maintains some roads. Spending differences reflect service levels, road networks and
            contracts, not just snowfall. Snowfall figures are estimates. See the{" "}
            <Link href="/project" className="underline underline-offset-2">project description</Link> for how each figure is
            calculated.
          </p>
        </section>

      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-t border-line pt-3">
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}
