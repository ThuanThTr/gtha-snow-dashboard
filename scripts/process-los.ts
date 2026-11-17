// Parses the GTHA winter maintenance levels-of-service dataset (markdown) into JSON for the
// "Profiles" view. Only the 26 municipalities on the map are kept.
//
// Rules:
// - NS / NF / — / N/A / DATA GAP and "NS (…)" cells become null (shown as n/a).
// - A row whose notes mention a conflict between sources has its trigger and completion
//   values set to null, and its notes set to null.
// - Values with "[2°]" are kept but flagged as coming from a secondary source.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const LOS_DIR = path.join(ROOT, "Level of Services");
const MAP_DATA = path.join(ROOT, "src", "data", "municipal-metrics.json");
const OUT = path.join(ROOT, "src", "data", "level-of-service.json");

type CategoryKey = "expressway" | "arterial" | "collector" | "local" | "sidewalks" | "cycling" | "windrows" | "busStops";

const CATEGORY_MAP: Record<string, CategoryKey> = {
  "Expressway": "expressway",
  "Arterial / Major Road": "arterial",
  "Collector Road": "collector",
  "Local / Residential Road": "local",
  "Sidewalks": "sidewalks",
  "Cycling Infrastructure / Multi-Use Trails": "cycling",
  "Driveway Windrows": "windrows",
  "Bus Stops & Pedestrian Crossovers": "busStops",
};
const CATEGORY_ORDER: CategoryKey[] = ["expressway", "arterial", "collector", "local", "sidewalks", "cycling", "windrows", "busStops"];
const CATEGORY_LABELS: Record<CategoryKey, string> = {
  expressway: "Expressways",
  arterial: "Arterial roads",
  collector: "Collector roads",
  local: "Local / residential roads",
  sidewalks: "Sidewalks",
  cycling: "Cycling & multi-use trails",
  windrows: "Driveway windrows",
  busStops: "Bus stops & pedestrian crossings",
};

const NA_VALUES = new Set(["", "NS", "NF", "—", "-", "N/A", "DATA GAP"]);

interface Cell {
  text: string | null;
  secondary: boolean;
}

interface LevelOfService {
  terminology: string | null;
  salting: string | null;
  plowing: string | null;
  completion: string | null;
  surface: string | null;
  mmsClass: string | null;
  notes: string | null;
  secondary: boolean;
}

interface MunicipalityProfile {
  name: string;
  region: string;
  responsibility: string | null;
  sourceUrl: string | null;
  lastVerified: string | null;
  levels: Partial<Record<CategoryKey, LevelOfService | null>>;
}

function clean(raw: string | undefined): Cell {
  const v = (raw ?? "").trim();
  const secondary = v.includes("[2°]");
  const text = v
    .replace(/\s*\[2°\]/g, "")
    .replace(/\\?\[\d+\\?\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const isNA = NA_VALUES.has(text) || /^(NS|NF|N\/A)\b/.test(text);
  return { text: isNA ? null : text, secondary };
}

function tableRows(lines: string[], heading: string): string[][] {
  const start = lines.findIndex((l) => l.startsWith(heading));
  if (start === -1) throw new Error(`Section not found: ${heading}`);
  const rows: string[][] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.startsWith("## ")) break;
    if (!line.startsWith("|") || /^\|\s*-{3}/.test(line)) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells[0] === "Region" || cells[0] === "Municipality") continue; // header rows
    rows.push(cells);
  }
  return rows;
}

const mdFile = readdirSync(LOS_DIR).find((f) => f.endsWith(".md"));
if (!mdFile) throw new Error(`No markdown file found in ${LOS_DIR}`);
const lines = readFileSync(path.join(LOS_DIR, mdFile), "utf8").replace(/\r/g, "").split("\n");

// The dashboard's own municipality list defines what is shown.
const mapData = JSON.parse(readFileSync(MAP_DATA, "utf8")) as { records: { name: string }[] };
const dashboardNames = [...new Set(mapData.records.map((r) => r.name))].sort();

const normalise = (name: string) => name.replace(/^City of /, "").trim();

// Tab 2: source directory (one row per municipality).
const directory = new Map<string, { region: string; url: string | null; lastVerified: string | null; responsibility: string | null }>();
for (const cells of tableRows(lines, "## Tab 2")) {
  const [municipality, region, url, lastVerified, summary] = cells;
  const u = clean(url);
  const v = clean(lastVerified);
  const s = clean(summary);
  directory.set(normalise(municipality ?? ""), {
    region: (region ?? "").trim() === "Single-Tier" ? "Single-tier cities" : (region ?? "").trim(),
    url: u.text && /^https?:\/\//.test(u.text) ? u.text : null,
    lastVerified: v.text,
    responsibility: s.text,
  });
}

// Tab 1: levels of service (one row per municipality and category).
const levels = new Map<string, Partial<Record<CategoryKey, LevelOfService | null>>>();
for (const cells of tableRows(lines, "## Tab 1")) {
  const pad = (i: number) => cells[i] ?? "";
  const municipality = normalise(pad(1));
  const categoryLabel = pad(2);
  const notesRaw = pad(9);
  const conflict = /conflict/i.test(notesRaw);

  const salting = clean(pad(4));
  const plowing = clean(pad(5));
  const completion = clean(pad(6));
  const surface = clean(pad(7));
  const terminology = clean(pad(3));
  const mms = clean(pad(8));
  const notes = clean(notesRaw);

  // Cells that quote two different values ("X vs Y") are treated as conflicts.
  const vs = [pad(4), pad(5), pad(6)].some((c) => /\svs\s/i.test(c));
  const drop = conflict || vs;

  const key = CATEGORY_MAP[categoryLabel];
  const map = levels.get(municipality) ?? {};
  if (key) {
    map[key] = {
      terminology: terminology.text,
      salting: drop ? null : salting.text,
      plowing: drop ? null : plowing.text,
      completion: drop ? null : completion.text,
      surface: surface.text,
      mmsClass: mms.text,
      notes: conflict ? null : notes.text,
      secondary: [salting, plowing, completion, surface, notes].some((c) => c.secondary),
    };
  } else if (categoryLabel === "All 8 categories") {
    // Uxbridge: the page could not be retrieved, so every category is unavailable.
    for (const k of CATEGORY_ORDER) map[k] = null;
  }
  levels.set(municipality, map);
}

const profiles: MunicipalityProfile[] = [];
for (const name of dashboardNames) {
  const dir = directory.get(name);
  const lv = levels.get(name) ?? {};
  for (const k of CATEGORY_ORDER) if (!(k in lv)) lv[k] = null;
  if (!dir && !levels.has(name)) console.warn(`No levels-of-service data matched "${name}"`);
  profiles.push({
    name,
    region: dir?.region ?? "Unassigned",
    responsibility: dir?.responsibility ?? null,
    sourceUrl: dir?.url ?? null,
    lastVerified: dir?.lastVerified ?? null,
    levels: lv,
  });
}

const output = {
  source: mdFile,
  categories: CATEGORY_ORDER.map((key) => ({ key, label: CATEGORY_LABELS[key] })),
  municipalities: profiles,
};
writeFileSync(OUT, JSON.stringify(output, null, 2));
console.log(`Wrote ${profiles.length} municipality profiles to ${path.relative(ROOT, OUT)}`);
