"use client";

import { useState } from "react";
import type { MunicipalRecord, MetricsFile } from "@/lib/types";

interface SidebarProps {
  minYear: number;
  maxYear: number;
  assumptions: MetricsFile["assumptions"];
}

type TabKey = "overview" | "methodology";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "methodology", label: "Methodology" },
];

export default function Sidebar({ minYear, maxYear, assumptions }: SidebarProps) {
  const [tab, setTab] = useState<TabKey>("overview");

  return (
    <div className="flex flex-col">
      {/* Title + year slider stay pinned while the text scrolls */}
      <div className="sticky top-0 z-10 border-b border-line bg-panel p-5">
        <h1 className="text-2xl font-semibold leading-tight">
          Winter Maintenance Across Greater Toronto and Hamilton Area (GTHA)
        </h1>

        <div
          role="tablist"
          aria-label="Sidebar sections"
          className="mt-5 flex rounded-md border border-line bg-panel p-0.5 text-sm"
        >
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`tab-${key}`}
              aria-selected={tab === key}
              aria-controls={`panel-${key}`}
              onClick={() => setTab(key)}
              className={`flex-1 rounded px-3 py-1.5 ${tab === key ? "bg-ink font-medium text-white" : "text-ink-2 hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="flex flex-col gap-6 p-5 text-sm leading-relaxed text-ink-2"
      >
        {tab === "overview" && (
          <>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium text-ink-2 [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-4">
                <span className="flex items-center gap-1.5">
                  <img src="/icons/touch-screen.png" alt="" aria-hidden="true" className="h-4 w-4 shrink-0" />
                  How to Explore the Dashboard
                </span>
                <span aria-hidden="true" className="text-[10px] text-ink-3 transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <div className="mt-2 flex flex-col gap-1.5 text-xs">
                <ol className="list-decimal space-y-0.5 pl-4">
                  <li>Select a year using the slider to explore available historical data.</li>
                  <li>Choose an indicator above the map to view spending or other municipal characteristics.</li>
                  <li>Hover over a municipality to see its available indicators and supporting information.</li>
                  <li>Select two municipalities to compare their results side by side.</li>
                </ol>
              </div>
            </details>

            <Section title="Overview">
              <p>
                Canadian winters are long, cold and unpredictable. Every year, municipalities spend millions of dollars
                keeping roads safe and accessible through snowstorms, freezing rain and icy conditions.
              </p>
              <p>
                Winter maintenance is also one of the most visible municipal services. Whether roads are cleared in time
                for the morning commute, how quickly neighbourhood streets are plowed, or how much taxpayers pay for these
                services, winter operations affect people’s daily lives and often attract significant public attention.
              </p>
              <p>
                But how much do municipalities actually spend on winter maintenance? And how does that spending compare
                when we consider the size of their road networks, their populations and the snowfall they receive?
              </p>
              <p>
                <mark className="bg-seq-2 px-0.5 text-ink">
                  “This interactive dashboard explores winter road maintenance spending across 26 municipalities in the
                  Greater Toronto and Hamilton Area (GTHA), using publicly available financial, geographic and demographic
                  data.”
                </mark>
              </p>
              <p>
                Our goal is to bring together information that is often scattered across different sources and make it
                easier to explore, understand and compare.
              </p>
              <p>
                Rather than simply ranking municipalities by spending, the dashboard provides context for understanding
                why winter maintenance costs may differ across the region.
              </p>
            </Section>


            <details className="group">
              <summary className="mb-2 flex cursor-pointer list-none items-center justify-between gap-3 rounded-md text-base font-semibold text-ink [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-4">
                Data Limitations: What Should You Keep in Mind?
                <span aria-hidden="true" className="text-sm text-ink-3 transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <div className="flex flex-col gap-2">
              <p>
                This dashboard is intended as an exploratory and benchmarking resource, not a definitive ranking of
                municipal efficiency or performance.
              </p>
              <p>
                While the Financial Information Return provides a consistent financial reporting framework, there are
                important limitations in the supporting datasets.
              </p>

              <div className="flex flex-col gap-3">
                <div>
                  <p className="font-medium text-ink">1. Road network information is not fully current.</p>
                  <p>
                    The road network analysis uses a 2019 ORN dataset. Road construction, development and changes to road
                    ownership since that time may not be reflected.
                  </p>
                  <p>
                    More importantly, road length within a municipal boundary is not necessarily equivalent to the road
                    length that municipality is responsible for maintaining.
                  </p>
                </div>

                <div>
                  <p className="font-medium text-ink">2. Population data represent a single point in time.</p>
                  <p>
                    Population figures are based on the 2021 Census. These figures do not capture subsequent growth and
                    should not be interpreted as annual population estimates throughout the study period.
                  </p>
                </div>

                <div>
                  <p className="font-medium text-ink">3. Financial data are not complete for every year.</p>
                  <p>
                    Some municipalities have missing FIR records for certain years, including within the most recent
                    reporting periods. As a result, the number of municipalities represented may vary by year.
                  </p>
                </div>

                <div>
                  <p className="font-medium text-ink">
                    4. Municipalities do not all deliver winter maintenance in the same way.
                  </p>
                  <p>
                    Winter maintenance responsibilities may be divided between upper-tier and lower-tier municipalities.
                    Some municipalities primarily use in-house crews, while others rely more heavily on contractors.
                  </p>
                  <p>
                    Differences in service levels, road characteristics, operating models and financial reporting can all
                    influence reported expenditures.
                  </p>
                </div>
              </div>

              <p>
                For these reasons, a municipality with higher spending per kilometre is not necessarily less efficient,
                just as lower spending does not necessarily indicate better performance.
              </p>
              <p>
                The dashboard is best used to identify patterns, raise questions and support further investigation,
                rather than draw conclusions from any single indicator.
              </p>
              </div>
            </details>
          </>
        )}

        {tab === "methodology" && (
          <>
        <Section title="Methods">
          <ol className="list-decimal space-y-1.5 pl-4">
            <li>Snowfall is reshaped from one column per year into one row per municipality per year.</li>
            <li>
              Snowfall, FIR expenses and the municipal directory are joined on <code>mun-id</code>.
            </li>
            <li>Population uses the 2016 Census for years up to 2016 and the 2021 Census after.</li>
          </ol>
          <dl className="mt-3 space-y-2 rounded-md bg-surface p-3 text-xs">
            <Formula name="Road km per 1,000 residents" f="road km ÷ (population ÷ 1,000)" />
            <Formula name="Spending per km" f="winter expenses ÷ road km" />
            <Formula name="Spending per capita" f="winter expenses ÷ population" />
            <Formula
              name="Snow plowed per dollar (t/$)"
              f={`road km × 1,000 × ${assumptions.roadWidthM} m = road area → × snow depth (m) = volume → × ${assumptions.snowDensityTPerM3} t/m³ = tons → ÷ expenses`}
            />
          </dl>
          <p className="text-xs">
            Assumes an average road width of {assumptions.roadWidthM} m and fresh-snow density of{" "}
            {assumptions.snowDensityTPerM3 * 1000} kg/m³. Road length is fixed at 2019 values. Figures are estimates for
            comparison, not measured tonnage.
          </p>
        </Section>

        <Section title="Data sources">
          <ul className="list-disc space-y-1.5 pl-4">
            <li>
              <strong className="font-medium text-ink">Financial Information Return (FIR)</strong>, Ontario Ministry of
              Municipal Affairs and Housing — winter control expenses (service code 0621).
            </li>
            <li>
              <strong className="font-medium text-ink">Average snowfall by municipality</strong>, {minYear}–{maxYear}.
            </li>
            <li>
              <strong className="font-medium text-ink">Municipal directory</strong> — 2016 & 2021 Census population,
              land area and 2019 road length.
            </li>
            <li>
              <strong className="font-medium text-ink">Municipal boundaries</strong> — Ontario municipal boundary
              GeoJSON.
            </li>
          </ul>
        </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Formula({ name, f }: { name: string; f: string }) {
  return (
    <div>
      <dt className="font-medium text-ink">{name}</dt>
      <dd>{f}</dd>
    </div>
  );
}

