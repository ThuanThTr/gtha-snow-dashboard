"use client";

export default function Sidebar() {
  return (
    <div className="flex flex-col">
      {/* Title stays pinned while the text scrolls */}
      <div className="sticky top-0 z-10 border-b border-line bg-panel p-5">
        <h1 className="text-2xl font-semibold leading-tight">
          Winter Maintenance Across Greater Toronto and Hamilton Area (GTHA)
        </h1>
      </div>

      <div className="flex flex-col gap-6 p-5 text-sm leading-relaxed text-ink-2">
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

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-ink">Overview</h2>
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
          <aside className="bg-ink p-5 text-lg font-semibold leading-snug text-white">
            This interactive dashboard explores winter road maintenance spending across 26 municipalities in the Greater
            Toronto and Hamilton Area (GTHA), using publicly available financial, geographic and demographic data.
          </aside>
          <p>
            Our goal is to bring together information that is often scattered across different sources and make it
            easier to explore, understand and compare.
          </p>
          <p>
            Rather than simply ranking municipalities by spending, the dashboard provides context for understanding
            why winter maintenance costs may differ across the region.
          </p>
        </section>

        <p>
          <a href="/methodology" className="font-medium text-ink underline underline-offset-2">
            Read the full methodology, with a worked example →
          </a>
        </p>
      </div>
    </div>
  );
}
