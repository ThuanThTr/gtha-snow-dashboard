import type { Metadata } from "next";
import metricsJson from "@/data/municipal-metrics.json";
import type { MetricsFile } from "@/lib/types";
import { HEADLINE_YEAR } from "@/lib/insights";
import StoryCards from "@/components/StoryCards";
import { BODY, EYEBROW, HEADING, JUSTIFY, LIST, LEAD, PAGE, PAGE_HEADER, PAGE_TITLE } from "@/lib/typography";
import SiteHeader from "@/components/SiteHeader";
import PageContents, { type ContentsGroup } from "@/components/PageContents";

const data = metricsJson as MetricsFile;
const EXAMPLE_ID = "21024"; // Caledon
const example = data.records.find((r) => r.munId === EXAMPLE_ID && r.year === HEADLINE_YEAR) ?? null;
const FIRST_YEAR = data.years[0]!;
const LAST_YEAR = data.years.at(-1)!;

/** "Aurora (2015, 2025), Brock (2025), …": municipality-years with no report, grouped by municipality. */
const NOT_REPORTED = (() => {
  const byName = new Map<string, number[]>();
  for (const r of data.records.filter((r) => r.totalExpenses == null)) {
    byName.set(r.name, [...(byName.get(r.name) ?? []), r.year]);
  }
  return [...byName.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, years]) => `${name} (${years.sort().join(", ")})`)
    .join(", ");
})();
const NOT_REPORTED_COUNT = data.records.filter((r) => r.totalExpenses == null).length;

/** Section wrapper; the scroll margin keeps headings clear of the sticky site header when jumped to. */
const SECTION = "flex scroll-mt-40 flex-col gap-4";

/** Left-hand contents list. Ids match the sections below. */
const CONTENTS: ContentsGroup[] = [
  {
    items: [
      { id: "why-it-matters", label: "Why winter maintenance matters" },
      { id: "what-the-numbers-show", label: "What the numbers show" },
    ],
  },
  {
    title: "How we built the dashboard",
    items: [
      { id: "study-area", label: "1. Study area" },
      { id: "spending", label: "2. Winter maintenance spending" },
      { id: "population-and-snowfall", label: "3. Population and snowfall" },
      { id: "levels-of-service", label: "4. Levels of service" },
      { id: "calculating-the-measures", label: "5. Calculating the measures" },
      { id: "worked-example", label: "Worked example" },
    ],
  },
  {
    items: [
      { id: "limitations", label: "Limitations" },
      { id: "data-sources", label: "Data sources" },
    ],
  },
];

const TITLE = "Project Description | GTHA Winter Maintenance Dashboard";
const DESCRIPTION = `Why GTHA winter maintenance spending matters, what the numbers show, and how the figures are built: key findings, study area, data sources, formulas, a worked example for ${example?.name ?? "one municipality"} in ${HEADLINE_YEAR}, and known limitations.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article", locale: "en_CA" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

const number = (value: number | null | undefined) =>
  value == null ? "No data" : new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 }).format(value);

const dollars = (value: number | null | undefined, digits = 0) =>
  value == null
    ? "No data"
    : new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      }).format(value);


function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-fit text-sm text-ink underline underline-offset-2"
    >
      {children}
    </a>
  );
}

function Formula({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[13rem_1fr] sm:gap-6">
      <dt className="font-medium text-ink">{name}</dt>
      <dd className="text-ink-2">{children}</dd>
    </div>
  );
}

function Step({ label, value, strong }: { label: React.ReactNode; value: string; strong?: boolean }) {
  return (
    <tr className="border-b border-line last:border-0">
      <th scope="row" className={`py-3 pr-4 text-left ${strong ? "font-semibold text-ink" : "font-normal text-ink-2"}`}>
        {label}
      </th>
      <td className={`whitespace-nowrap py-3 text-right text-ink ${strong ? "font-semibold" : ""}`}>{value}</td>
    </tr>
  );
}

export default function ProjectPage() {
  return (
    <>
    <SiteHeader active="project" />
    <div className="lg:mx-auto lg:grid lg:max-w-6xl lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8 lg:px-6">
    <PageContents groups={CONTENTS} />
    <main className={`${PAGE} lg:mx-0`}>
      <header className={PAGE_HEADER}>
        <p className={EYEBROW}>GTHA Winter Maintenance</p>
        <h1 className={PAGE_TITLE}>Project overview</h1>
        <p className={`${LEAD} ${JUSTIFY}`}>
          Canadian winters are long, cold and unpredictable. Every year, municipalities spend millions of dollars keeping
          roads safe and accessible through snowstorms, freezing rain and icy conditions. This page explains why that
          spending matters and what the numbers show, then where each figure comes from and how it is calculated.
        </p>
      </header>

      <section id="why-it-matters" className={SECTION}>
        <h2 className={HEADING}>Why winter maintenance matters</h2>
        <p className={`${BODY} ${JUSTIFY}`}>
          Winter maintenance is also one of the most visible municipal services. Whether roads are cleared in time for
          the morning commute, how quickly neighbourhood streets are plowed, or how much taxpayers pay for these
          services, winter operations affect people’s daily lives and often attract significant public attention.
        </p>
        <p className={`${BODY} ${JUSTIFY}`}>
          But how much do municipalities actually spend on winter maintenance? And how does that spending compare when
          we consider the size of their road networks, their populations and the snowfall they receive?
        </p>
        <aside className="bg-ink p-5 text-justify hyphens-auto text-lg font-semibold leading-snug text-white">
          This interactive dashboard explores winter road maintenance spending across 26 municipalities in the Greater
          Toronto and Hamilton Area (GTHA), using publicly available financial, geographic and demographic data.
        </aside>
        <p className={`${BODY} ${JUSTIFY}`}>
          Our goal is to bring together information that is often scattered across different sources and make it easier
          to explore, understand and compare.
        </p>
        <p className={`${BODY} ${JUSTIFY}`}>
          Rather than simply ranking municipalities by spending, the dashboard provides context for understanding why
          winter maintenance costs may differ across the region.
        </p>
      </section>

      <section id="what-the-numbers-show" className={SECTION}>
        <h2 className={HEADING}>What the numbers show</h2>
        <StoryCards records={data.records} />
      </section>

      <p className="-mb-6 text-xs font-medium uppercase tracking-wide text-ink-3">How we built the dashboard</p>

      <section id="study-area" className={SECTION}>
        <h2 className={HEADING}>1. Study area</h2>
        <p className={BODY}>
          The dashboard covers 26 local municipalities in the Greater Toronto and Hamilton Area (GTHA): Toronto,
          Hamilton, and the municipalities in Durham, Halton, Peel and York Regions. Municipal boundary data define the
          study area and draw the map.
        </p>
      </section>

      <section id="spending" className={SECTION}>
        <h2 className={HEADING}>2. Winter maintenance spending</h2>
        <p className={BODY}>
          Spending comes from Ontario’s provincial financial reports (the Financial Information Return), the standard
          annual report every municipality files. The dashboard covers {FIRST_YEAR} to {LAST_YEAR} and uses each
          municipality’s total winter cost, which adds up:
        </p>
        <ul className={LIST}>
          <li>Its own winter control for roads, such as plowing and salting.</li>
          <li>Its own winter control for sidewalks and parking lots.</li>
          <li>
            A share of its Region’s winter road costs. In Durham, Halton, Peel and York, the Region looks after some major
            roads. Each municipality gets a share of those costs in line with its share of the Region’s population.
            Toronto and Hamilton run all of their own roads, so they have no regional share.
          </li>
        </ul>
        <p className={BODY}>
          Adding the regional share makes the totals comparable across all 26 municipalities. The municipality pages show
          the split between roads, sidewalks and parking lots, and the regional share. Some municipalities report sidewalks
          and parking lots together with roads, so those years show “Included in roads” instead of a figure.
        </p>
        <p className={BODY}>
          The reports have gaps. {NOT_REPORTED_COUNT} municipality-years were not reported: {NOT_REPORTED}. These show as
          “No data”, never $0. {HEADLINE_YEAR} is the latest year with data for 25 of the 26 municipalities, so the map
          opens on {HEADLINE_YEAR}. The reports also do not split spending into labour, equipment, materials or
          contractors, so they cannot explain what drives a municipality’s total.
        </p>
      </section>

      <section id="population-and-snowfall" className={SECTION}>
        <h2 className={HEADING}>3. Population and snowfall</h2>
        <ul className={LIST}>
          <li>
            <span className="font-medium text-ink">Population:</span> Statistics Canada 2021 Census counts, used for
            every year so that spending per resident is measured the same way across years.
          </li>
          <li>
            <span className="font-medium text-ink">Snowfall:</span> estimated average annual snowfall in centimetres, to
            show how winter weather relates to reported spending. The year-to-year pattern is almost identical in every
            municipality, which suggests the figures are modelled rather than measured locally. Treat them as estimates.
          </li>
        </ul>
        <p className="rounded-md bg-surface px-4 py-3 text-sm text-ink-2">
          To confirm: the snowfall data source and how observations are assigned to each municipality.
        </p>
      </section>

      <section id="levels-of-service" className={SECTION}>
        <h2 className={HEADING}>4. Levels of service</h2>
        <p className={BODY}>
          Spending depends on what each municipality is responsible for and the standards it sets. We reviewed the
          official websites of all 26 municipalities for winter maintenance policies, service standards and descriptions
          of operations. We looked at:
        </p>
        <ul className={LIST}>
          <li>Road classes and maintenance priorities</li>
          <li>Plowing, salting and clearing practices</li>
          <li>Response times and service targets</li>
          <li>Sidewalk clearing and other winter responsibilities</li>
        </ul>
        <p className={BODY}>
          Publication varies widely. Some municipalities post detailed policies, while others give only a general
          description. We use this information for qualitative comparison only. It does not rank service levels or
          measure performance.
        </p>
      </section>

      <section id="calculating-the-measures" className={SECTION}>
        <h2 className={HEADING}>5. Calculating the measures</h2>
        <p className={BODY}>
          We combined the spending, population and snowfall data by municipality and year, then calculated these measures.
        </p>
        <dl className="flex flex-col divide-y divide-line text-base">
          <Formula name="Total winter spending">own roads and sidewalks + regional roads share</Formula>
          <Formula name="Spending per resident">total winter spending ÷ 2021 population</Formula>
          <Formula name="Change since 2016">spending per resident in a year ÷ spending per resident in 2016, minus 1</Formula>
          <Formula name="Regional roads share">regional roads share ÷ total winter spending</Formula>
        </dl>
        <p className={BODY}>
          Area averages (for example, York Region) add up the spending of the municipalities that reported that year and
          divide by their combined population, so larger municipalities count for more. We do not use road length: the
          available figures are not consistent across the 26 municipalities, so we do not report spending per kilometre.
        </p>
      </section>

      <section id="worked-example" className={SECTION}>
        <h2 className={HEADING}>Worked example: {example?.name ?? "Caledon"}, {HEADLINE_YEAR}</h2>
        <p className={BODY}>
          Every value below comes from the dataset behind the dashboard, so you can check the arithmetic against the map.
        </p>
        {example ? (
          <table className="w-full border-collapse text-left text-sm sm:text-base">
            <thead>
              <tr className="border-b border-ink text-xs font-medium uppercase tracking-wide text-ink-3">
                <th scope="col" className="py-2 pr-4 font-medium">Step</th>
                <th scope="col" className="py-2 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              <Step label="Own roads and sidewalks" value={dollars(example.localCost)} />
              <Step label="Share of regional roads" value={dollars(example.regionalCost)} />
              <Step label="Total winter spending" value={dollars(example.totalExpenses)} strong />
              <Step label="Population (2021 Census)" value={number(example.population)} />
              <Step
                label="Spending per resident: total ÷ population"
                value={dollars(example.spendPerCapita, 2)}
                strong
              />
            </tbody>
          </table>
        ) : (
          <p className={BODY}>The Caledon {HEADLINE_YEAR} record is not available in the dataset.</p>
        )}
      </section>

      <section id="limitations" className={SECTION}>
        <h2 className={HEADING}>Limitations</h2>
        <p className={BODY}>
          This dashboard is intended as an exploratory and benchmarking resource, not a definitive ranking of municipal
          efficiency or performance. While provincial financial reports provide a consistent reporting framework, there
          are important limitations in the supporting datasets.
        </p>
        <ol className="flex flex-col gap-6 text-base leading-relaxed text-ink-2">
          <li className="flex flex-col gap-2">
            <span className="font-medium text-ink">1. Population data represent a single point in time.</span>
            <span>
              Population figures are based on the 2021 Census. These figures do not capture growth since then and should
              not be interpreted as annual population estimates throughout the study period.
            </span>
          </li>
          <li className="flex flex-col gap-2">
            <span className="font-medium text-ink">2. Financial data are not complete for every year.</span>
            <span>
              Some municipalities did not report for certain years, including the most recent ones. As a result, the
              number of municipalities represented varies by year, and {LAST_YEAR} has the fewest.
            </span>
          </li>
          <li className="flex flex-col gap-2">
            <span className="font-medium text-ink">3. Municipalities do not all deliver winter maintenance in the same way.</span>
            <span>
              Winter maintenance may be divided between regional and local governments. Some municipalities primarily use
              in-house crews, while others rely more heavily on contractors.
            </span>
            <span>
              Differences in service levels, road characteristics, operating models and financial reporting can all
              influence reported expenditures.
            </span>
          </li>
          <li className="flex flex-col gap-2">
            <span className="font-medium text-ink">4. Some years are unusual.</span>
            <span>
              Toronto’s 2019 figure includes a one-time transfer, and 2022 was a high-cost year. Toronto’s low 2020 figure
              reflects accounting adjustments, not a cheap winter.
            </span>
          </li>
          <li className="flex flex-col gap-2">
            <span className="font-medium text-ink">5. Snowfall figures are estimates.</span>
            <span>
              Snowfall moves almost identically across municipalities from year to year, so it likely comes from a model.
              It is useful for broad comparisons, not for explaining one municipality’s spending in one year.
            </span>
          </li>
        </ol>
        <p className={BODY}>
          For these reasons, a municipality with higher spending per resident is not necessarily less efficient, just as
          lower spending does not necessarily indicate better performance. Spending differences reflect service levels,
          road networks and contracts, not just snowfall. The dashboard is best used to identify patterns, raise questions
          and support further investigation, rather than draw conclusions from any single measure.
        </p>
      </section>

      <section id="data-sources" className={SECTION}>
        <h2 className={HEADING}>Data sources</h2>
        <p className={BODY}>The dashboard was developed using the following publicly available data sources.</p>
        <ol className="flex flex-col divide-y divide-line text-base leading-relaxed text-ink-2">
          <li className="flex flex-col gap-1 py-3">
            <span className="font-medium text-ink">
              Ontario Ministry of Municipal Affairs and Housing: Financial Information Return
            </span>
            <span>
              Provincial financial reports: annual winter control costs for roads, sidewalks and parking lots, for
              municipalities and Regions, {FIRST_YEAR} to {LAST_YEAR}. Figures for 2025 for Aurora, Brock and East
              Gwillimbury come from a later provincial extract.
            </span>
            <ExternalLink href="https://efis.fma.csc.gov.on.ca/fir/index.php/en/reports-and-dashboards/fir-by-year-and-municipality/">
              Financial Information Return by year and municipality
            </ExternalLink>
          </li>
          <li className="flex flex-col gap-1 py-3">
            <span className="font-medium text-ink">Statistics Canada: 2021 Census of Population</span>
            <span>Municipal population, used for per-resident figures.</span>
            <ExternalLink href="https://open.canada.ca/data/en/dataset/750e6035-adf8-4426-966f-4c25b12a999e">
              2021 Census Profile
            </ExternalLink>
          </li>
          <li className="flex flex-col gap-1 py-3">
            <span className="font-medium text-ink">Municipal government websites</span>
            <span>
              Winter maintenance policies and service standards, reviewed for road classifications, snow clearing
              priorities, response times and service delivery responsibilities across the 26 municipalities.
            </span>
          </li>
          <li className="flex flex-col gap-1 py-3">
            <span className="font-medium text-ink">GTHA municipal boundary GIS data</span>
            <span>Boundary data used to define the study area and draw the map.</span>
            <span className="text-sm text-ink-2">To confirm: the exact dataset, publisher and version.</span>
          </li>
          <li className="flex flex-col gap-1 py-3">
            <span className="font-medium text-ink">Historical snowfall data</span>
            <span>Estimated annual snowfall, used for weather context.</span>
            <span className="text-sm text-ink-2">
              To confirm: the exact source, observation period and how observations are assigned to municipalities.
            </span>
          </li>
          <li className="flex flex-col gap-1 py-3">
            <span className="font-medium text-ink">CARTO basemaps</span>
            <span>Basemap used for geographic context on the interactive map.</span>
            <ExternalLink href="https://carto.com/basemaps/">CARTO Basemaps</ExternalLink>
          </li>
        </ol>
      </section>
    </main>
    </div>
    </>
  );
}
