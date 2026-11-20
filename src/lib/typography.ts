/** Shared text styles for long-form pages (project description, overview), so they read as one document. */
export const PAGE = "mx-auto flex max-w-3xl flex-col gap-12 px-5 py-10 text-ink sm:py-14";
export const PAGE_HEADER = "border-t-2 border-ink pt-6";
export const EYEBROW = "text-xs font-medium uppercase tracking-wide text-ink-3";
export const PAGE_TITLE = "mt-2 text-4xl font-semibold leading-tight";
export const LEAD = "mt-3 text-lg leading-relaxed text-ink-2";
export const HEADING = "border-t border-line pt-6 text-2xl font-semibold";
export const BODY = "text-base leading-relaxed text-ink-2";
export const LIST = "flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-ink-2";
export const SUBHEADING = "text-lg font-semibold text-ink";
/** Justified paragraphs, hyphenated so lines don't open wide gaps. */
export const JUSTIFY = "text-justify hyphens-auto";

/* Tables: one look for every data table (municipality profile and beyond). Numeric columns add `text-right`. */
export const TABLE = "w-full border-collapse text-left text-sm";
export const TABLE_HEAD_ROW = "border-b border-ink text-xs uppercase tracking-wide text-ink-3";
export const TABLE_TH = "py-2 pr-4 font-medium last:pr-0";
export const TABLE_ROW = "border-b border-line align-top";
export const TABLE_ROW_HEADER = "py-3 pr-4 text-left font-semibold text-ink";
export const TABLE_CELL = "py-3 pr-4 last:pr-0";
/** Missing values ("No data", "n/a"). */
export const TABLE_MISSING = "italic text-ink-3";
