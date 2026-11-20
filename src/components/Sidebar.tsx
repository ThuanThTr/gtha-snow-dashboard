import Link from "next/link";
import { BODY, EYEBROW, HEADING, JUSTIFY, LEAD, PAGE, PAGE_HEADER, PAGE_TITLE } from "@/lib/typography";

/** Overview tab: background, how to use the dashboard, and a link to the project write-up. Styled like the project description. */
export default function Sidebar() {
  return (
    <div className={PAGE}>
      <header className={PAGE_HEADER}>
        <p className={EYEBROW}>GTHA Winter Maintenance</p>
        <h1 className={PAGE_TITLE}>Overview</h1>
        <p className={`${LEAD} ${JUSTIFY}`}>
          Canadian winters are long, cold and unpredictable. Every year, municipalities spend millions of dollars keeping
          roads safe and accessible through snowstorms, freezing rain and icy conditions.
        </p>
        <p className="mt-4">
          <Link href="/project" className="font-medium text-ink underline underline-offset-2">
            Read the project description: key findings, methods and data sources →
          </Link>
        </p>
      </header>

      <section className="flex flex-col gap-4">
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

      <section className="flex flex-col gap-4">
        <h2 className={HEADING}>How to explore the dashboard</h2>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-base leading-relaxed text-ink-2">
          <li>Select a year using the slider to explore available historical data.</li>
          <li>Choose an indicator above the map to view spending or other municipal characteristics.</li>
          <li>Hover over a municipality to see its available indicators and supporting information.</li>
          <li>Select two municipalities to compare their results side by side.</li>
        </ol>
      </section>
    </div>
  );
}
