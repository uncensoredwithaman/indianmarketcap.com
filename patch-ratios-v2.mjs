// patch-ratios-v2.mjs
// Chalao: node patch-ratios-v2.mjs
// Kya karta hai:
//  1. src/lib/fundamentals.ts  -> sector-aware RULES + rateRatio(key, value, sector)
//  2. src/components/key-stats.tsx -> sector pass karta hai
//  3. src/components/market-board.tsx -> P/E, P/B cells color-coded
//  4. src/data/extra-listings.json -> duplicate symbols hata deta hai
import { existsSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";

const fundamentalsTs = `import raw from "@/data/fundamentals.json";

/** Per-stock fundamentals written by scripts/build-universe.mjs (Yahoo Finance, INR). */
export type Fundamentals = {
  eps?: number;
  bookValue?: number;
  forwardPE?: number;
  peg?: number;
  dividendPerShare?: number;
  sharesOutstanding?: number;
  floatShares?: number;
  insidersPct?: number;
  institutionsPct?: number;
  beta?: number;
  roe?: number;
  roa?: number;
  debtToEquity?: number;
  profitMargin?: number;
  operatingMargin?: number;
  revenue?: number;
  ebitda?: number;
  freeCashflow?: number;
  currentRatio?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  domain?: string;
};

const DATA = raw as unknown as Record<string, Fundamentals>;

export function fundamentalsOf(symbol: string): Fundamentals | undefined {
  return DATA[symbol];
}

// Ratios use the live price, so they move with the market during the day.
export function peOf(price: number, f?: Fundamentals): number | null {
  return f?.eps != null && f.eps > 0 && price > 0 ? price / f.eps : null;
}

export function pbOf(price: number, f?: Fundamentals): number | null {
  return f?.bookValue != null && f.bookValue > 0 && price > 0 ? price / f.bookValue : null;
}

export function dividendYieldOf(price: number, f?: Fundamentals): number | null {
  return f?.dividendPerShare != null && f.dividendPerShare > 0 && price > 0
    ? (f.dividendPerShare / price) * 100
    : null;
}

export function formatRatio(n: number | null | undefined, digits = 2, suffix = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return \`\${n.toLocaleString("en-IN", { maximumFractionDigits: digits })}\${suffix}\`;
}

export function formatPe(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n > 999) return ">999";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 1 });
}

/** 0.153 -> "15.3%" */
export function formatFraction(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return \`\${(n * 100).toLocaleString("en-IN", { maximumFractionDigits: 1 })}%\`;
}

// ─── Ratio quality ratings (sector-aware market standards) ───────────────

export type Rating = "good" | "ok" | "bad";

type Rule = { lowerIsBetter: boolean; good: number; ok: number };
type RuleSet = Record<string, Rule>;

/** Generic / default thresholds. */
const DEFAULT_RULES: RuleSet = {
  pe: { lowerIsBetter: true, good: 15, ok: 30 },
  forwardPe: { lowerIsBetter: true, good: 15, ok: 30 },
  pb: { lowerIsBetter: true, good: 1.5, ok: 3 },
  peg: { lowerIsBetter: true, good: 1, ok: 2 },
  roe: { lowerIsBetter: false, good: 0.15, ok: 0.08 },
  roa: { lowerIsBetter: false, good: 0.08, ok: 0.03 },
  profitMargin: { lowerIsBetter: false, good: 0.1, ok: 0.03 },
  operatingMargin: { lowerIsBetter: false, good: 0.15, ok: 0.05 },
  revenueGrowth: { lowerIsBetter: false, good: 0.15, ok: 0.05 },
  earningsGrowth: { lowerIsBetter: false, good: 0.15, ok: 0 },
  debtToEquity: { lowerIsBetter: true, good: 0.5, ok: 1.5 },
  currentRatio: { lowerIsBetter: false, good: 1.5, ok: 1 },
  dividendYield: { lowerIsBetter: false, good: 2, ok: 0.5 },
};

/**
 * Sector-specific overrides. Banks/Finance ke P/E aur P/B naturally kam hote
 * hain, IT/FMCG ke zyada, Metals ke kam. Isse colors sahi lagte hain.
 */
const SECTOR_RULES: Record<string, RuleSet> = {
  Banks: {
    pe: { lowerIsBetter: true, good: 10, ok: 18 },
    pb: { lowerIsBetter: true, good: 1.5, ok: 2.5 },
    roe: { lowerIsBetter: false, good: 0.14, ok: 0.1 },
    debtToEquity: { lowerIsBetter: true, good: 3, ok: 6 }, // banks inherently leveraged
    currentRatio: { lowerIsBetter: false, good: 1.2, ok: 0.9 },
  },
  Finance: {
    pe: { lowerIsBetter: true, good: 12, ok: 22 },
    pb: { lowerIsBetter: true, good: 2, ok: 3.5 },
    roe: { lowerIsBetter: false, good: 0.14, ok: 0.1 },
    debtToEquity: { lowerIsBetter: true, good: 3, ok: 6 },
  },
  Technology: {
    pe: { lowerIsBetter: true, good: 25, ok: 40 },
    pb: { lowerIsBetter: true, good: 5, ok: 9 },
    roe: { lowerIsBetter: false, good: 0.2, ok: 0.12 },
    profitMargin: { lowerIsBetter: false, good: 0.18, ok: 0.1 },
  },
  Telecom: {
    pe: { lowerIsBetter: true, good: 20, ok: 40 },
    pb: { lowerIsBetter: true, good: 3, ok: 6 },
  },
  FMCG: {
    pe: { lowerIsBetter: true, good: 35, ok: 50 },
    pb: { lowerIsBetter: true, good: 8, ok: 15 },
    roe: { lowerIsBetter: false, good: 0.25, ok: 0.15 },
  },
  Auto: {
    pe: { lowerIsBetter: true, good: 18, ok: 30 },
    pb: { lowerIsBetter: true, good: 4, ok: 7 },
  },
  Pharma: {
    pe: { lowerIsBetter: true, good: 25, ok: 40 },
    pb: { lowerIsBetter: true, good: 4, ok: 8 },
    roe: { lowerIsBetter: false, good: 0.18, ok: 0.1 },
  },
  Energy: {
    pe: { lowerIsBetter: true, good: 10, ok: 18 },
    pb: { lowerIsBetter: true, good: 1.5, ok: 3 },
  },
  Metals: {
    pe: { lowerIsBetter: true, good: 10, ok: 18 },
    pb: { lowerIsBetter: true, good: 1.5, ok: 3 },
  },
  Utilities: {
    pe: { lowerIsBetter: true, good: 15, ok: 25 },
    pb: { lowerIsBetter: true, good: 2, ok: 4 },
  },
  Realty: {
    pe: { lowerIsBetter: true, good: 20, ok: 35 },
    pb: { lowerIsBetter: true, good: 2, ok: 4 },
  },
  Consumer: {
    pe: { lowerIsBetter: true, good: 30, ok: 45 },
    pb: { lowerIsBetter: true, good: 6, ok: 12 },
  },
  Industrials: {
    pe: { lowerIsBetter: true, good: 25, ok: 40 },
    pb: { lowerIsBetter: true, good: 4, ok: 8 },
  },
};

function rulesFor(sector?: string): RuleSet {
  if (!sector) return DEFAULT_RULES;
  const overrides = SECTOR_RULES[sector];
  if (!overrides) return DEFAULT_RULES;
  return { ...DEFAULT_RULES, ...overrides };
}

export function rateRatio(
  key: keyof typeof DEFAULT_RULES,
  value: number | null | undefined,
  sector?: string,
): Rating | null {
  if (value == null || !Number.isFinite(value)) return null;
  const rule = rulesFor(sector)[key];
  if (!rule) return null;
  if (rule.lowerIsBetter) {
    if (value <= rule.good) return "good";
    if (value <= rule.ok) return "ok";
    return "bad";
  }
  if (value >= rule.good) return "good";
  if (value >= rule.ok) return "ok";
  return "bad";
}

/** Tailwind classes for a rating. */
export function ratingClass(rating: Rating | null): string {
  if (rating === "good") return "text-emerald-600 dark:text-emerald-400";
  if (rating === "ok") return "text-amber-600 dark:text-amber-400";
  if (rating === "bad") return "text-rose-600 dark:text-rose-400";
  return "";
}
`;

// ─── Key stats: sector pass karo ─────────────────────────────────────────
const keyStatsTsx = `import type { ReactNode } from "react";
import { formatMcap, formatVolume, type MarketCapUnit } from "@/lib/format";
import {
  dividendYieldOf,
  formatFraction,
  formatPe,
  formatRatio,
  fundamentalsOf,
  pbOf,
  peOf,
  rateRatio,
  ratingClass,
  type Rating,
} from "@/lib/fundamentals";
import { formatPrice } from "@/lib/format";
import { LISTING_BY_SYMBOL } from "@/data/universe";

function Stat({
  label,
  value,
  hint,
  rating,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  rating?: Rating | null;
}) {
  return (
    <div className="rounded-xl border border-border px-3 py-3" title={hint}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={\`mt-1 text-sm font-bold \${ratingClass(rating ?? null)}\`}>{value}</dd>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="text-sm font-bold text-muted">{title}</h3>
      <dl className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</dl>
    </section>
  );
}

function Legend() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      <span><span className="font-bold text-emerald-600 dark:text-emerald-400">●</span> Good</span>
      <span><span className="font-bold text-amber-600 dark:text-amber-400">●</span> Average</span>
      <span><span className="font-bold text-rose-600 dark:text-rose-400">●</span> Weak</span>
      <span>(vs sector market standards)</span>
    </p>
  );
}

export function KeyStats({
  symbol,
  price,
  listedShares,
  mcapUnit,
}: {
  symbol: string;
  price: number;
  listedShares: number;
  mcapUnit: MarketCapUnit;
}) {
  const f = fundamentalsOf(symbol);
  const sector = LISTING_BY_SYMBOL[symbol]?.sector;
  const outstanding = f?.sharesOutstanding ?? listedShares;
  const floatPct = f?.floatShares && outstanding ? (f.floatShares / outstanding) * 100 : null;
  const money = (n?: number) => (n == null ? "—" : formatMcap(n, mcapUnit));

  const R = (key: Parameters<typeof rateRatio>[0], v: number | null | undefined) =>
    rateRatio(key, v, sector);

  return (
    <section className="mt-8" aria-label="Key statistics">
      <h2 className="text-lg font-bold">Key statistics</h2>
      <Legend />
      {!f ? (
        <p className="mt-2 text-sm text-muted">Fundamentals for this stock are not loaded yet.</p>
      ) : null}

      <Group title="Valuation">
        <Stat label="P/E (TTM)" value={formatPe(peOf(price, f))} rating={R("pe", peOf(price, f))} hint="Price ÷ EPS (TTM). Sector ke hisaab se rated." />
        <Stat label="Forward P/E" value={formatPe(f?.forwardPE)} rating={R("forwardPe", f?.forwardPE ?? null)} />
        <Stat label="P/B" value={formatRatio(pbOf(price, f))} rating={R("pb", pbOf(price, f))} hint="Price ÷ book value per share." />
        <Stat label="PEG" value={formatRatio(f?.peg)} rating={R("peg", f?.peg ?? null)} hint="P/E ÷ earnings growth." />
        <Stat label="EPS (TTM)" value={f?.eps != null ? formatPrice(f.eps) : "—"} />
        <Stat label="Book value / share" value={f?.bookValue != null ? formatPrice(f.bookValue) : "—"} />
        <Stat label="Dividend yield" value={formatRatio(dividendYieldOf(price, f), 2, "%")} rating={R("dividendYield", dividendYieldOf(price, f))} />
        <Stat label="Beta" value={formatRatio(f?.beta)} hint="Stock volatility vs the market." />
      </Group>

      <Group title="Shares & ownership">
        <Stat label="Shares outstanding" value={formatVolume(outstanding)} />
        <Stat label="Free float (circulating)" value={f?.floatShares ? formatVolume(f.floatShares) : "—"} />
        <Stat label="Free float %" value={formatRatio(floatPct, 1, "%")} />
        <Stat label="Insiders hold" value={formatFraction(f?.insidersPct)} />
        <Stat label="Institutions hold" value={formatFraction(f?.institutionsPct)} />
      </Group>

      <Group title="Financials">
        <Stat label="Revenue (TTM)" value={money(f?.revenue)} />
        <Stat label="EBITDA" value={money(f?.ebitda)} />
        <Stat label="Free cash flow" value={money(f?.freeCashflow)} />
        <Stat label="Profit margin" value={formatFraction(f?.profitMargin)} rating={R("profitMargin", f?.profitMargin ?? null)} />
        <Stat label="Operating margin" value={formatFraction(f?.operatingMargin)} rating={R("operatingMargin", f?.operatingMargin ?? null)} />
        <Stat label="ROE" value={formatFraction(f?.roe)} rating={R("roe", f?.roe ?? null)} />
        <Stat label="ROA" value={formatFraction(f?.roa)} rating={R("roa", f?.roa ?? null)} />
        <Stat label="Debt / equity" value={f?.debtToEquity != null ? formatRatio(f.debtToEquity / 100) : "—"} rating={R("debtToEquity", f?.debtToEquity != null ? f.debtToEquity / 100 : null)} />
        <Stat label="Current ratio" value={formatRatio(f?.currentRatio)} rating={R("currentRatio", f?.currentRatio ?? null)} />
        <Stat label="Revenue growth" value={formatFraction(f?.revenueGrowth)} rating={R("revenueGrowth", f?.revenueGrowth ?? null)} />
        <Stat label="Earnings growth" value={formatFraction(f?.earningsGrowth)} rating={R("earningsGrowth", f?.earningsGrowth ?? null)} />
      </Group>

      <p className="mt-4 text-xs text-muted">
        Fundamentals via Yahoo Finance. P/E, P/B and yield use the live price. Colours compare each ratio against sector-specific market standards, not investment advice.
      </p>
    </section>
  );
}
`;

// ─── Market board: P/E, P/B cells color-code karo ───────────────────────
function patchMarketBoard(text) {
  let out = text;

  // 1. Import rateRatio / ratingClass
  if (!out.includes("rateRatio")) {
    out = out.replace(
      /import \{ fundamentalsOf, formatPe, formatRatio, pbOf, peOf \} from "@\/lib\/fundamentals";/,
      'import { fundamentalsOf, formatPe, formatRatio, pbOf, peOf, rateRatio, ratingClass } from "@/lib/fundamentals";',
    );
    if (!out.includes("rateRatio")) {
      // Fallback: pehle se koi aur import hai
      out = out.replace(
        /from "@\/lib\/fundamentals";/,
        'from "@/lib/fundamentals";\nimport { rateRatio, ratingClass } from "@/lib/fundamentals";',
      );
    }
  }

  // 2. P/E cell
  const peCellRe = /(<td className="hidden px-3 text-right whitespace-nowrap text-muted xl:table-cell">\s*\{formatPe\(peOf\(row\.quote\.price, fundamentalsOf\(row\.symbol\)\)\)\}\s*<\/td>)/;
  if (peCellRe.test(out)) {
    out = out.replace(
      peCellRe,
      `<td className={\`hidden px-3 text-right whitespace-nowrap xl:table-cell \${ratingClass(rateRatio("pe", peOf(row.quote.price, fundamentalsOf(row.symbol)), row.sector))}\`}>
                      {formatPe(peOf(row.quote.price, fundamentalsOf(row.symbol)))}
                    </td>`,
    );
  }

  // 3. P/B cell
  const pbCellRe = /(<td className="hidden px-3 text-right whitespace-nowrap text-muted xl:table-cell">\s*\{formatRatio\(pbOf\(row\.quote\.price, fundamentalsOf\(row\.symbol\)\)\)\}\s*<\/td>)/;
  if (pbCellRe.test(out)) {
    out = out.replace(
      pbCellRe,
      `<td className={\`hidden px-3 text-right whitespace-nowrap xl:table-cell \${ratingClass(rateRatio("pb", pbOf(row.quote.price, fundamentalsOf(row.symbol)), row.sector))}\`}>
                      {formatRatio(pbOf(row.quote.price, fundamentalsOf(row.symbol)))}
                    </td>`,
    );
  }

  return out;
}

// ─── Duplicates hatao extra-listings.json se ────────────────────────────
function dedupeExtraListings() {
  const path = "src/data/extra-listings.json";
  if (!existsSync(path)) return 0;
  const arr = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(arr)) return 0;
  const seen = new Set();
  const core = existsSync("src/data/universe.ts")
    ? new Set([...readFileSync("src/data/universe.ts", "utf8").matchAll(/symbol:\s*"([^"]+)"/g)].map((m) => m[1]))
    : new Set();
  const kept = [];
  let removed = 0;
  for (const row of arr) {
    if (!row?.symbol) continue;
    if (seen.has(row.symbol) || core.has(row.symbol)) { removed++; continue; }
    seen.add(row.symbol);
    kept.push(row);
  }
  if (removed > 0) writeFileSync(path, JSON.stringify(kept, null, 1));
  return removed;
}

// ─── Safety + write ─────────────────────────────────────────────────────
const files = {
  "src/lib/fundamentals.ts": fundamentalsTs,
  "src/components/key-stats.tsx": keyStatsTsx,
};
for (const f of Object.keys(files)) {
  if (!existsSync(f)) { console.error(`✗ ${f} nahi mili. Project root se chalao.`); process.exit(1); }
}

// Market board patch
const mbPath = "src/components/market-board.tsx";
let mb = existsSync(mbPath) ? readFileSync(mbPath, "utf8") : null;
if (mb) mb = patchMarketBoard(mb);

// Backup + write
for (const [f, text] of Object.entries(files)) {
  copyFileSync(f, f + ".bak");
  writeFileSync(f, text);
}
if (mb) { copyFileSync(mbPath, mbPath + ".bak"); writeFileSync(mbPath, mb); }

const removed = dedupeExtraListings();

// Verify
const fund = readFileSync("src/lib/fundamentals.ts", "utf8");
if (!fund.includes("SECTOR_RULES")) { console.error("✗ fundamentals.ts verify fail"); process.exit(1); }

console.log("✓ Done!");
console.log("  - fundamentals.ts: sector-aware RULES + rateRatio(key, value, sector)");
console.log("  - key-stats.tsx: sector pass hota hai");
console.log(mb ? "  - market-board.tsx: P/E, P/B color-coded (sector-aware)" : "  - market-board.tsx: file nahi mili, skip");
console.log(`  - extra-listings.json: ${removed} duplicate/overlap entries hataye`);
console.log("  - Backups: *.bak");
console.log("");
console.log("Ab chalao:  npm run dev");