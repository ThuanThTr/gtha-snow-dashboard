"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import metricsJson from "@/data/municipal-metrics.json";
import type { MetricsFile } from "@/lib/types";
import { slugify } from "@/lib/slug";

export type SiteSection = "dashboard" | "overview" | "profile" | "project";

const data = metricsJson as MetricsFile;

/** Municipality names grouped by region, for the "Municipality profile" picker. */
const MUNICIPALITY_GROUPS = [...new Set(data.records.map((r) => r.region))].map((region) => ({
  region,
  names: [...new Set(data.records.filter((r) => r.region === region).map((r) => r.name))].sort(),
}));

const TAB_CLASS = "-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 pb-3 font-medium";
const tabColor = (active: boolean) =>
  active ? "border-ink text-ink" : "border-transparent text-ink-2 hover:text-ink";

/**
 * Site title and navigation, shared by the dashboard and the municipality profile pages.
 * On the dashboard, pass `onTab` so Dashboard / Overview switch in place; elsewhere they link back to "/".
 */
export default function SiteHeader({
  active,
  onTab,
  currentSlug,
}: {
  active: SiteSection;
  onTab?: (tab: "dashboard" | "overview") => void;
  currentSlug?: string;
}) {
  const router = useRouter();

  function tab(key: "dashboard" | "overview", label: string) {
    const className = `${TAB_CLASS} ${tabColor(active === key)}`;
    if (onTab) {
      return (
        <button key={key} aria-pressed={active === key} onClick={() => onTab(key)} className={className}>
          {label}
        </button>
      );
    }
    return (
      <Link key={key} href={key === "dashboard" ? "/" : "/?tab=overview"} className={className}>
        {label}
      </Link>
    );
  }

  const profileActive = active === "profile";

  return (
    <header className="z-20 border-b border-line bg-panel md:sticky md:top-0">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 px-4 pt-3 lg:px-6">
        <div className="min-w-0 pb-2 sm:pb-3">
          <Link href="/" className="text-lg font-semibold leading-tight text-ink sm:text-xl">
            Winter Maintenance Across Greater Toronto and Hamilton Area (GTHA)
          </Link>
          <p className="mt-1 text-xs leading-snug text-ink-2 sm:text-sm">
            By{" "}
            <a href="https://www.thuantruong.com/" target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-2">
              Thuan Truong
            </a>{" "}
            and{" "}
            <a href="https://www.thinhlang.com/" target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-2">
              Thinh Lang
            </a>
            . <span className="italic">First published November 2026.</span>
          </p>
        </div>
        <nav aria-label="Sections" className="-mx-4 flex max-w-[calc(100%+2rem)] items-end gap-1 overflow-x-auto px-1 text-sm sm:mx-0 sm:max-w-full sm:px-0">
          {tab("dashboard", "Dashboard")}
          <span className="group relative flex shrink-0 items-end">
            <label htmlFor="open-municipality" className="sr-only">
              Municipality profile
            </label>
            <select
              id="open-municipality"
              value={currentSlug ?? ""}
              aria-current={profileActive ? "page" : undefined}
              onChange={(e) => {
                if (e.target.value) router.push(`/municipality/${e.target.value}`);
              }}
              className={`${TAB_CLASS} ${tabColor(profileActive)} cursor-pointer appearance-none bg-transparent pr-7 pl-3 focus-visible:outline-2`}
            >
              <option value="">Municipality profile</option>
              {MUNICIPALITY_GROUPS.map(({ region, names }) => (
                <optgroup key={region} label={region}>
                  {names.map((name) => (
                    <option key={name} value={slugify(name)}>
                      {name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 12 12"
              className={`pointer-events-none absolute right-2 bottom-[18px] h-3 w-3 group-hover:text-ink ${
                profileActive ? "text-ink" : "text-ink-2"
              }`}
            >
              <path
                d="M2.5 4.5 6 8l3.5-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {tab("overview", "Overview")}
          <Link
            href="/project"
            aria-current={active === "project" ? "page" : undefined}
            className={`${TAB_CLASS} ${tabColor(active === "project")}`}
          >
            Project description
          </Link>
        </nav>
      </div>
    </header>
  );
}
