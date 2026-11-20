import type { ReactNode } from "react";
import {
  BODY,
  JUSTIFY,
  LIST,
  SUBHEADING,
  TABLE,
  TABLE_CELL,
  TABLE_HEAD_ROW,
  TABLE_MISSING,
  TABLE_ROW,
  TABLE_ROW_HEADER,
  TABLE_TH,
} from "@/lib/typography";

type CategoryKey = "expressway" | "arterial" | "collector" | "local" | "sidewalks" | "cycling" | "windrows" | "busStops";

interface Level {
  terminology: string | null;
  salting: string | null;
  plowing: string | null;
  completion: string | null;
  surface: string | null;
  mmsClass: string | null;
  notes: string | null;
  secondary: boolean;
}

export interface ServiceProfile {
  name: string;
  region: string;
  responsibility: string | null;
  sourceUrl: string | null;
  lastVerified: string | null;
  levels: Partial<Record<CategoryKey, Level | null>>;
}

export interface ServiceCategory {
  key: CategoryKey;
  label: string;
}

const NA: ReactNode = <span className={TABLE_MISSING}>n/a</span>;

const REGION_NAMES = ["Peel", "Halton", "Durham", "York"];
const WHO: Record<string, { who: string; plural?: boolean }> = {
  City: { who: "The city" },
  Town: { who: "The town" },
  Township: { who: "The township" },
  Municipality: { who: "The municipality" },
  Residents: { who: "Residents", plural: true },
  Owners: { who: "Property owners", plural: true },
  MTO: { who: "The Ministry of Transportation (Ontario)" },
  Region: { who: "The regional government" },
};
// Abbreviations and jargon, replaced with plain wording.
const TERMS: [RegExp, string][] = [
  [/windrows?/gi, "driveway windrows (snow the plow pushes onto the end of driveways)"],
  [/DVP\/Gardiner/g, "Don Valley Parkway and Gardiner Expressway"],
  [/Linc\/RHVP/g, "Lincoln Alexander Parkway and Red Hill Valley Parkway"],
  [/MUPs/g, "multi-use paths"],
  [/PXOs/g, "pedestrian crossovers"],
  [/400-series/g, "400-series highways"],
];

/** Plain wording for the text after "is responsible for": expands terms and lowercases mid-sentence place words. */
function plainTerms(text: string) {
  const expanded = TERMS.reduce((t, [pattern, replacement]) => t.replace(pattern, replacement), text);
  return expanded.replace(/\b(Town|City|Township|Municipality|Region|Regional)\b/g, (w) => w.toLowerCase());
}

function capitalise(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** First snow depth in centimetres found in a plowing-trigger value, e.g. "2.5–5 cm" → 2.5. */
function parseDepth(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s*cm/);
  return match ? Number(match[1]) : null;
}

/** Turns "City: roads; residents: windrows" into plain bullet points. */
function responsibilityBullets(text: string) {
  return text
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^([A-Za-z][A-Za-z\s-]*?):\s*(.+)$/);
      if (!match) return { who: null, plural: false, body: capitalise(plainTerms(part)) };
      const label = match[1]!.trim();
      const body = plainTerms(match[2]!);
      if (WHO[label]) return { who: WHO[label].who, plural: !!WHO[label].plural, body };
      if (REGION_NAMES.includes(label)) return { who: `${label} Region`, plural: false, body };
      return { who: label, plural: false, body };
    });
}

const RULER_MAX_CM = 12;
const RULER_TICKS = [0, 2, 4, 6, 8, 10, 12];

/**
 * Trigger ruler: each row marks the snow depth at which plowing starts, on a shared 0 to 12 cm scale.
 * Only the first published figure is drawn; the table has the full wording.
 */
function TriggerRuler({ rows }: { rows: { label: string; depth: number }[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className={SUBHEADING}>Plowing trigger depth</h3>
        <p className={BODY}>The snow depth at which plowing starts, shown on a 0 to 12 cm scale.</p>
      </div>
      {rows.length === 0 ? (
        <p className={BODY}>{NA}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map(({ label, depth }) => (
            <div key={label} className="grid grid-cols-[minmax(0,7rem)_1fr_3.5rem] sm:grid-cols-[minmax(0,13rem)_1fr_3.5rem] items-center gap-3 text-sm">
              <span className="truncate text-ink">{label}</span>
              <span className="relative h-5">
                <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
                {RULER_TICKS.map((t) => (
                  <span
                    key={t}
                    className="absolute top-0 h-full w-px bg-line"
                    style={{ left: `${(t / RULER_MAX_CM) * 100}%` }}
                  />
                ))}
                <span
                  className="absolute top-0 h-full w-0.5 bg-ink"
                  style={{ left: `${(depth / RULER_MAX_CM) * 100}%` }}
                />
              </span>
              <span className="text-right tabular-nums text-ink">{depth} cm</span>
            </div>
          ))}
          <div className="grid grid-cols-[minmax(0,7rem)_1fr_3.5rem] sm:grid-cols-[minmax(0,13rem)_1fr_3.5rem] gap-3 text-xs text-ink-3">
            <span />
            <span className="relative h-4">
              {RULER_TICKS.map((t) => (
                <span
                  key={t}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${(t / RULER_MAX_CM) * 100}%` }}
                >
                  {t}
                </span>
              ))}
            </span>
            <span />
          </div>
        </div>
      )}
    </div>
  );
}

/** Published levels of service for one municipality: responsibilities, triggers, table and notes. */
export function ServiceLevels({
  profile,
  categories,
}: {
  profile: ServiceProfile;
  categories: ServiceCategory[];
}) {
  const withNotes = categories.filter(({ key }) => {
    const level = profile.levels[key];
    return level && (level.notes || level.secondary);
  });

  return (
    <div className="flex flex-col gap-8">
      <section className={`${BODY} ${JUSTIFY}`}>
        <h3 className={SUBHEADING}>About these figures</h3>
        <div className="mt-2 flex flex-col gap-2 leading-relaxed">
          <p>
            Figures are as each municipality publishes them. {NA} means the value is not published, could not be verified,
            or sources disagree.
          </p>
          <p>
            Completion times start the clock at different points (end of snowfall, a snow depth trigger or per operating
            round), so compare them with care.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className={SUBHEADING}>Who is responsible</h3>
        {profile.responsibility ? (
          <ul className={LIST}>
            {responsibilityBullets(profile.responsibility).map((item, i) => (
              <li key={i}>
                {item.who ? (
                  <>
                    <span className="font-medium text-ink">{item.who}</span> {item.plural ? "are" : "is"} responsible for{" "}
                    {item.body}.
                  </>
                ) : (
                  <>{item.body}.</>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={BODY}>{NA}</p>
        )}
      </section>

      <TriggerRuler
        rows={categories.flatMap(({ key, label }) => {
          // Windrow figures are snow heights for clearing driveways, not plowing triggers.
          if (key === "windrows") return [];
          const plowing = profile.levels[key]?.plowing;
          const depth = plowing ? parseDepth(plowing) : null;
          return depth == null ? [] : [{ label, depth }];
        })}
      />

      <div className="overflow-x-auto">
        <table className={`${TABLE} stack sm:min-w-[640px]`}>
          <thead>
            <tr className={TABLE_HEAD_ROW}>
              <th scope="col" className={TABLE_TH}>Road type</th>
              <th scope="col" className={TABLE_TH}>Salting trigger</th>
              <th scope="col" className={TABLE_TH}>Plowing trigger</th>
              <th scope="col" className={TABLE_TH}>Completion time</th>
              <th scope="col" className={TABLE_TH}>Target surface</th>
              <th scope="col" className={TABLE_TH}>MMS class</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(({ key, label }) => {
              const level = profile.levels[key] ?? null;
              return (
                <tr key={key} className={TABLE_ROW}>
                  <th scope="row" className={TABLE_ROW_HEADER}>
                    {label}
                    {level?.terminology && (
                      <span className="mt-0.5 block text-xs font-normal text-ink-3">{level.terminology}</span>
                    )}
                  </th>
                  {level ? (
                    <>
                      <td data-label="Salting trigger" className={`${TABLE_CELL} text-ink`}>{level.salting ?? NA}</td>
                      <td data-label="Plowing trigger" className={`${TABLE_CELL} text-ink`}>{level.plowing ?? NA}</td>
                      <td data-label="Completion time" className={`${TABLE_CELL} text-ink`}>{level.completion ?? NA}</td>
                      <td data-label="Target surface" className={`${TABLE_CELL} text-ink`}>{level.surface ?? NA}</td>
                      <td data-label="MMS class" className={`${TABLE_CELL} text-ink`}>{level.mmsClass ?? NA}</td>
                    </>
                  ) : (
                    <td colSpan={5} className={`${TABLE_CELL} ${TABLE_MISSING}`}>
                      {key === "expressway" ? "Not applicable (no municipal expressways)" : NA}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {withNotes.length > 0 && (
        <ul className="flex flex-col gap-2 text-base leading-relaxed text-ink-2">
          {withNotes.map(({ key, label }) => {
            const level = profile.levels[key]!;
            return (
              <li key={key}>
                <span className="font-medium text-ink">{label}:</span> {level.notes}
                {level.notes && level.secondary ? " " : null}
                {level.secondary && "Includes a figure from a secondary source (news or a directory)."}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
