import type { Metadata } from "next";
import Link from "next/link";
import metricsJson from "@/data/municipal-metrics.json";
import type { MetricsFile } from "@/lib/types";

const data = metricsJson as MetricsFile;
const { roadWidthM, snowDensityTPerM3 } = data.assumptions;
const toronto = data.records.find((r) => r.munId === "20002" && r.year === 2020) ?? null;

const TITLE = "Winter Maintenance Methodology | GTHA Dashboard";
const DESCRIPTION =
  "How the GTHA winter maintenance figures are calculated: study area, data sources, formulas, a worked example for Toronto in 2020, and known limitations.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article", locale: "en_CA" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

const number = (value: number | null | undefined, digits = 0) =>
  value == null
    ? "n/a"
    : new Intl.NumberFormat("en-CA", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);

const dollars = (value: number | null | undefined) =>
  value == null ? "n/a" : new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);

const HEADING = "border-t border-line pt-6 text-2xl font-semibold";
const BODY = "text-base leading-relaxed text-ink-2";

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

export default function MethodologyPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-12 px-5 py-10 text-ink sm:py-14">
      <div className="flex flex-col gap-6">
        <Link href="/" className="w-fit text-sm text-ink-2 underline underline-offset-2">
          ← Back to the dashboard
        </Link>
        <header className="border-t-2 border-ink pt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-3">GTHA Winter Maintenance</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight">How we built the dashboard</h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-2">
            The dashboard combines municipal financial reports, road network data, census population, snowfall records
            and published winter maintenance policies. This page explains where each figure comes from and how it is
            calculated.
          </p>
        </header>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className={HEADING}>1. Study area</h2>
        <p className={BODY}>
          The dashboard covers 26 lower-tier and single-tier municipalities in the Greater Toronto and Hamilton Area
          (GTHA): Toronto, Hamilton, and the municipalities in Durham, Halton, Peel and York Regions. Municipal boundary
          data define the study area and draw the map.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className={HEADING}>2. Winter maintenance spending</h2>
        <p className={BODY}>
          Spending comes from Ontario’s Financial Information Return (FIR), the standard annual financial report that
          every municipality files. The dashboard includes all available years from 2015 to 2025.
        </p>
        <p className={BODY}>
          The FIR has gaps. Some municipalities are missing records for some years. It also does not split spending into
          labour, equipment, materials or contractors, so it cannot explain what drives a municipality’s total.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className={HEADING}>3. Road network length</h2>
        <p className={BODY}>
          To compare municipalities of different sizes, we need each one’s road length in kilometres. We first looked for
          road figures published by each municipality, but could not find consistent, comparable figures for all 26.
        </p>
        <p className={BODY}>
          Instead, we used the 2019 Ontario Road Network (ORN), a province-wide dataset from the Government of Ontario.
          It gives comparable estimates across the whole study area. Two caveats apply:
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-ink-2">
          <li>
            Roads inside a municipal boundary are not always roads that municipality maintains. Depending on how the data
            are filtered, totals can include regional or provincial roads.
          </li>
          <li>The 2019 data do not reflect road changes since then.</li>
        </ul>
        <p className={BODY}>Keep both in mind when reading spending per kilometre.</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className={HEADING}>4. Population and snowfall</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-ink-2">
          <li>
            <span className="font-medium text-ink">Population:</span> Statistics Canada census counts. Years up to 2016
            use the 2016 Census, and later years use the 2021 Census.
          </li>
          <li>
            <span className="font-medium text-ink">Snowfall:</span> historical annual snowfall, to show how winter weather
            relates to reported spending.
          </li>
        </ul>
        <p className={BODY}>Both are matched to each municipality and year, so they line up with the spending data.</p>
        <p className="rounded-md bg-surface px-4 py-3 text-sm text-ink-2">
          To confirm: the snowfall data source and how observations are assigned to each municipality.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className={HEADING}>5. Levels of service</h2>
        <p className={BODY}>
          Spending depends on what each municipality is responsible for and the standards it sets. We reviewed the
          official websites of all 26 municipalities for winter maintenance policies, service standards and descriptions
          of operations. We looked at:
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-ink-2">
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

      <section className="flex flex-col gap-4">
        <h2 className={HEADING}>6. Calculating the indicators</h2>
        <p className={BODY}>
          We joined the spending, road, population and snowfall data by municipality and year, then calculated four
          indicators.
        </p>
        <dl className="flex flex-col divide-y divide-line text-base">
          <div className="grid gap-1 py-3 sm:grid-cols-[13rem_1fr] sm:gap-6">
            <dt className="font-medium text-ink">Road km per 1,000 residents</dt>
            <dd className="text-ink-2">road km ÷ (population ÷ 1,000)</dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[13rem_1fr] sm:gap-6">
            <dt className="font-medium text-ink">Spending per km</dt>
            <dd className="text-ink-2">annual winter maintenance spending ÷ road km</dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[13rem_1fr] sm:gap-6">
            <dt className="font-medium text-ink">Spending per resident</dt>
            <dd className="text-ink-2">annual winter maintenance spending ÷ population</dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[13rem_1fr] sm:gap-6">
            <dt className="font-medium text-ink">Estimated snowfall mass per dollar (t/$)</dt>
            <dd className="text-ink-2">
              estimated snowfall mass on the road network ÷ annual winter maintenance spending
            </dd>
          </div>
        </dl>
        <p className={BODY}>
          Snowfall mass is estimated by multiplying the annual snowfall depth by the estimated road length, an assumed
          average road width of {roadWidthM} m, and a fresh-snow density of {snowDensityTPerM3 * 1000} kg/m³. This is a
          theoretical figure. It is not a measure of snow actually plowed or removed.
        </p>
        <p className={BODY}>
          Use the map to pick a year, view one municipality, or compare two side by side.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className={HEADING}>Worked example: Toronto, 2020</h2>
        <p className={BODY}>
          Every value below comes from the dataset behind the dashboard, so you can check the arithmetic against the map.
        </p>
        {toronto ? (
          <table className="w-full border-collapse text-left text-base">
            <thead>
              <tr className="border-b border-ink text-xs font-medium uppercase tracking-wide text-ink-3">
                <th scope="col" className="py-2 pr-4 font-medium">Step</th>
                <th scope="col" className="py-2 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              <tr className="border-b border-line">
                <th scope="row" className="py-3 pr-4 text-left font-normal text-ink-2">Road length (2019)</th>
                <td className="py-3 text-right text-ink">{number(toronto.roadKm, 1)} km</td>
              </tr>
              <tr className="border-b border-line">
                <th scope="row" className="py-3 pr-4 text-left font-normal text-ink-2">
                  Road area: km × 1,000 × {roadWidthM} m
                </th>
                <td className="py-3 text-right text-ink">{number(toronto.roadAreaM2)} m²</td>
              </tr>
              <tr className="border-b border-line">
                <th scope="row" className="py-3 pr-4 text-left font-normal text-ink-2">
                  Average snowfall ({number(toronto.avgSnowMm, 1)} mm, as depth in m)
                </th>
                <td className="py-3 text-right text-ink">{number((toronto.avgSnowMm ?? 0) / 1000, 3)} m</td>
              </tr>
              <tr className="border-b border-line">
                <th scope="row" className="py-3 pr-4 text-left font-normal text-ink-2">Snow volume: area × depth</th>
                <td className="py-3 text-right text-ink">{number(toronto.snowVolumeM3)} m³</td>
              </tr>
              <tr className="border-b border-line">
                <th scope="row" className="py-3 pr-4 text-left font-normal text-ink-2">
                  Snow tonnes: volume × {snowDensityTPerM3} t/m³
                </th>
                <td className="py-3 text-right text-ink">{number(toronto.snowTons)} t</td>
              </tr>
              <tr className="border-b border-line">
                <th scope="row" className="py-3 pr-4 text-left font-normal text-ink-2">
                  Winter maintenance spending (FIR)
                </th>
                <td className="py-3 text-right text-ink">{dollars(toronto.totalExpenses)}</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 text-left font-semibold text-ink">
                  Estimated snowfall mass per dollar
                </th>
                <td className="py-3 text-right font-semibold text-ink">
                  {toronto.tonsPerDollar == null ? "n/a" : `${number(toronto.tonsPerDollar, 4)} t/$`}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p className={BODY}>The Toronto 2020 record is not available in the dataset.</p>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className={HEADING}>Limitations</h2>
        <p className={BODY}>
          This dashboard is intended as an exploratory and benchmarking resource, not a definitive ranking of municipal
          efficiency or performance. While the Financial Information Return provides a consistent financial reporting
          framework, there are important limitations in the supporting datasets.
        </p>
        <ol className="flex flex-col gap-6 text-base leading-relaxed text-ink-2">
          <li className="flex flex-col gap-2">
            <span className="font-medium text-ink">1. Road network information is not fully current.</span>
            <span>
              The road network analysis uses a 2019 ORN dataset. Road construction, development and changes to road
              ownership since that time may not be reflected.
            </span>
            <span>
              More importantly, road length within a municipal boundary is not necessarily equivalent to the road length
              that municipality is responsible for maintaining.
            </span>
          </li>
          <li className="flex flex-col gap-2">
            <span className="font-medium text-ink">2. Population data represent a single point in time.</span>
            <span>
              Population figures are based on the 2021 Census. These figures do not capture subsequent growth and should
              not be interpreted as annual population estimates throughout the study period.
            </span>
          </li>
          <li className="flex flex-col gap-2">
            <span className="font-medium text-ink">3. Financial data are not complete for every year.</span>
            <span>
              Some municipalities have missing FIR records for certain years, including within the most recent reporting
              periods. As a result, the number of municipalities represented may vary by year.
            </span>
          </li>
          <li className="flex flex-col gap-2">
            <span className="font-medium text-ink">4. Municipalities do not all deliver winter maintenance in the same way.</span>
            <span>
              Winter maintenance responsibilities may be divided between upper-tier and lower-tier municipalities. Some
              municipalities primarily use in-house crews, while others rely more heavily on contractors.
            </span>
            <span>
              Differences in service levels, road characteristics, operating models and financial reporting can all
              influence reported expenditures.
            </span>
          </li>
        </ol>
        <p className={BODY}>
          For these reasons, a municipality with higher spending per kilometre is not necessarily less efficient, just as
          lower spending does not necessarily indicate better performance. The dashboard is best used to identify
          patterns, raise questions and support further investigation, rather than draw conclusions from any single
          indicator.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className={HEADING}>Data sources</h2>
        <p className={BODY}>The dashboard was developed using the following publicly available data sources.</p>
        <ol className="flex flex-col divide-y divide-line text-base leading-relaxed text-ink-2">
          <li className="flex flex-col gap-1 py-3">
            <span className="font-medium text-ink">
              Ontario Ministry of Municipal Affairs and Housing: Financial Information Return (FIR)
            </span>
            <span>Annual winter maintenance expenditures for the 2015 to 2025 reporting period.</span>
            <ExternalLink href="https://efis.fma.csc.gov.on.ca/fir/index.php/en/reports-and-dashboards/fir-by-year-and-municipality/">
              FIR by Year and Municipality
            </ExternalLink>
          </li>
          <li className="flex flex-col gap-1 py-3">
            <span className="font-medium text-ink">Government of Ontario: Ontario Road Network (ORN)</span>
            <span>
              Road network data used to estimate road lengths within municipal boundaries. The analysis uses the 2019
              version.
            </span>
            <ExternalLink href="https://data.ontario.ca/en/dataset/ontario-road-network-road-net-element">
              Ontario Road Network: Road Net Element
            </ExternalLink>
          </li>
          <li className="flex flex-col gap-1 py-3">
            <span className="font-medium text-ink">Statistics Canada: 2016 and 2021 Census of Population</span>
            <span>Municipal population, used for per-resident figures and road kilometres per 1,000 residents.</span>
            <ExternalLink href="https://www150.statcan.gc.ca/n1/en/type/data?geoname=A0000%2CA0002%2CS0516&sourcecode=3901&subject_levels=11">
              2016 Census Profile
            </ExternalLink>
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
            <span>
              Annual snowfall observations, used for weather context and to estimate snowfall mass across the road
              network.
            </span>
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

      <footer className="border-t border-line pt-6 text-sm text-ink-3">
        <Link href="/" className="underline underline-offset-2">
          Back to the dashboard
        </Link>
      </footer>
    </main>
  );
}
