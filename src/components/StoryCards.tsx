import type { MunicipalRecord } from "@/lib/types";
import { BASE_YEAR, HEADLINE_YEAR, areaLabel, areaSummaries, changes, yearSummaries } from "@/lib/insights";

const dollars = (v: number) => `$${Math.round(v)}`;
const pct = (v: number) => `${Math.round(Math.abs(v) * 100)}%`;

interface Card {
  title: string;
  body: string;
}

/** Short findings, all computed from the data so they stay correct when the data changes. */
function buildCards(records: MunicipalRecord[]): Card[] {
  const cards: Card[] = [];
  const years = yearSummaries(records);
  const upToHeadline = years.filter((s) => s.year <= HEADLINE_YEAR && s.perResident != null && s.avgSnowCm != null);
  const first = upToHeadline[0];
  const headline = upToHeadline.find((s) => s.year === HEADLINE_YEAR);

  if (first && headline && first.year !== headline.year) {
    const snows = upToHeadline.map((s) => s.avgSnowCm!);
    const rise = headline.perResident! / first.perResident! - 1;
    cards.push({
      title: `Up ${pct(rise)} since ${first.year}`,
      body: `Spending per resident rose from ${dollars(first.perResident!)} in ${first.year} to ${dollars(headline.perResident!)} in ${HEADLINE_YEAR}, while average snowfall stayed between ${Math.round(Math.min(...snows))} and ${Math.round(Math.max(...snows))} cm.`,
    });

    const snowiest = upToHeadline.reduce((a, b) => (b.avgSnowCm! > a.avgSnowCm! ? b : a));
    const costliest = upToHeadline.reduce((a, b) => (b.perResident! > a.perResident! ? b : a));
    if (snowiest.year !== costliest.year) {
      cards.push({
        title: "More snow did not mean more spending",
        body: `The snowiest winter, ${snowiest.year} (${Math.round(snowiest.avgSnowCm!)} cm), cost ${dollars(snowiest.perResident!)} per resident. The most expensive year, ${costliest.year}, cost ${dollars(costliest.perResident!)} with less snow (${Math.round(costliest.avgSnowCm!)} cm).`,
      });
    }
  }

  const changeList = changes(records, BASE_YEAR, HEADLINE_YEAR);
  const top = changeList[0];
  const bottom = changeList.at(-1);
  if (top && bottom) {
    cards.push({
      title: `${top.name}: up ${pct(top.change)}`,
      body: `${top.name}’s spending per resident rose from ${dollars(top.from)} in ${BASE_YEAR} to ${dollars(top.to)} in ${HEADLINE_YEAR}, the biggest increase. ${bottom.name}’s ${bottom.change < 0 ? `fell ${pct(bottom.change)}` : `rose only ${pct(bottom.change)}`} over the same years.`,
    });
  }

  const areas = areaSummaries(records).filter((a) => a.perResident != null);
  const high = areas[0];
  const low = areas.at(-1);
  if (high && low && high.area !== low.area) {
    const span = `${years[0]!.year} to ${years.at(-1)!.year}`;
    const headlineRecords = records.filter((r) => r.year === HEADLINE_YEAR && r.totalExpenses != null);
    const regionalShare = (area: string) => {
      const rs = headlineRecords.filter((r) => r.area === area);
      const total = rs.reduce((s, r) => s + r.totalExpenses!, 0);
      return total === 0 ? null : rs.reduce((s, r) => s + (r.regionalCost ?? 0), 0) / total;
    };
    const highShare = regionalShare(high.area);
    const lowShare = regionalShare(low.area);
    cards.push({
      title: `${areaLabel(high.area)} spends the most per resident`,
      body:
        `From ${span}, municipalities in ${areaLabel(high.area)} spent ${dollars(high.perResident!)} per resident on average, and ${areaLabel(low.area)} ${dollars(low.perResident!)}.` +
        (highShare && lowShare
          ? ` Regional roads were ${pct(highShare)} of the bill in ${areaLabel(high.area)} in ${HEADLINE_YEAR}, against ${pct(lowShare)} in ${areaLabel(low.area)}.`
          : ""),
    });
  }

  return cards;
}

/** The findings cards and their caveat. The caller supplies the section heading. */
export default function StoryCards({ records }: { records: MunicipalRecord[] }) {
  const cards = buildCards(records);
  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2">
        {cards.map(({ title, body }) => (
          <li key={title} className="flex flex-col gap-1.5 border-t-2 border-ink bg-panel p-4">
            <p className="font-serif text-lg font-semibold leading-snug text-ink">{title}</p>
            <p className="text-sm leading-relaxed text-ink-2">{body}</p>
          </li>
        ))}
      </ul>
      <p className="text-sm text-ink-2">
        Spending differences reflect service levels, road networks and contracts, not just snowfall. Snowfall figures are
        estimates. Yearly figures include only the municipalities that reported that year.
      </p>
    </>
  );
}
