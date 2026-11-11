// patch-ratios.mjs
// Chalao: node patch-ratios.mjs
import { existsSync, copyFileSync, writeFileSync, readFileSync } from "node:fs";

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
  return n > 999 ? ">999" : n.toLocaleString("en-IN", { maximumFractionDigits: 1 });
}

/** 0.153 -> "15.3%" */
export function formatFraction(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return \`\${(n * 100).toLocaleString("en-IN", { maximumFractionDigits: 1 })}%\`;
}

// ─── Ratio quality ratings (market standards) ────────────────────────────

export type Rating = "good" | "ok" | "bad";

/**
 * Thresholds:
 *  - lowerIsBetter = true  (P/E, P/B, PEG, Debt): value <= good -> green, <= ok -> yellow, else red
 *  - lowerIsBetter = false (ROE, margins, growth): value >= good -> green, >= ok -> yellow, else red
 */
type Rule = { lowerIsBetter: boolean; good: number; ok: number };

const RULES: Record<string, Rule> = {
  // Valuation — lower is better
  pe: { lowerIsBetter: true, good: 15, ok: 30 },
  forwardPe: { lowerIsBetter: true, good: 15, ok: 30 },
  pb: { lowerIsBetter: true, good: 1.5, ok: 3 },
  peg: { lowerIsBetter: true, good: 1, ok: 2 },
  // Profitability — higher is better
  roe: { lowerIsBetter: false, good: 0.15, ok: 0.08 },
  roa: { lowerIsBetter: false, good: 0.08, ok: 0.03 },
  profitMargin: { lowerIsBetter: false, good: 0.1, ok: 0.03 },
  operatingMargin: { lowerIsBetter: false, good: 0.15, ok: 0.05 },
  revenueGrowth: { lowerIsBetter: false, good: 0.15, ok: 0.05 },
  earningsGrowth: { lowerIsBetter: false, good: 0.15, ok: 0 },
  // Leverage / liquidity (debtToEquity in 0-1 scale; key-stats divides Yahoo 100-scale by 100)
  debtToEquity: { lowerIsBetter: true, good: 0.5, ok: 1.5 },
  currentRatio: { lowerIsBetter: false, good: 1.5, ok: 1 },
  // Dividend yield — percent, higher is better
  dividendYield: { lowerIsBetter: false, good: 2, ok: 0.5 },
};

export function rateRatio(
  key: keyof typeof RULES,
  value: number | null | undefined,
): Rating | null {
  if (value == null || !Number.isFinite(value)) return null;
  const rule = RULES[key];
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
      <span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400">●</span> Good
      </span>
      <span>
        <span className="font-bold text-amber-600 dark:text-amber-400">●</span> Average
      </span>
      <span>
        <span className="font-bold text-rose-600 dark:text-rose-400">●</span> Weak
      </span>
      <span className="text-muted">(vs typical market standards)</span>
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
  const outstanding = f?.sharesOutstanding ?? listedShares;
  const floatPct =
    f?.floatShares && outstanding ? (f.floatShares / outstanding) * 100 : null;
  const money = (n?: number) => (n == null ? "—" : formatMcap(n, mcapUnit));

  return (
    <section className="mt-8" aria-label="Key statistics">
      <h2 className="text-lg font-bold">Key statistics</h2>
      <Legend />
      {!f ? (
        <p className="mt-2 text-sm text-muted">
          Fundamentals for this stock are not loaded yet.
        </p>
      ) : null}

      <Group title="Valuation">
        <Stat
          label="P/E (TTM)"
          value={formatPe(peOf(price, f))}
          rating={rateRatio("pe", peOf(price, f))}
          hint="Price ÷ earnings per share (last 12 months). Lower is usually cheaper."
        />
        <Stat
          label="Forward P/E"
          value={formatPe(f?.forwardPE)}
          rating={rateRatio("forwardPe", f?.forwardPE ?? null)}
          hint="Price ÷ next-year estimated EPS."
        />
        <Stat
          label="P/B"
          value={formatRatio(pbOf(price, f))}
          rating={rateRatio("pb", pbOf(price, f))}
          hint="Price ÷ book value per share. Lower is usually cheaper."
        />
        <Stat
          label="PEG"
          value={formatRatio(f?.peg)}
          rating={rateRatio("peg", f?.peg ?? null)}
          hint="P/E ÷ earnings growth. Below 1 is often considered attractive."
        />
        <Stat label="EPS (TTM)" value={f?.eps != null ? formatPrice(f.eps) : "—"} />
        <Stat
          label="Book value / share"
          value={f?.bookValue != null ? formatPrice(f.bookValue) : "—"}
        />
        <Stat
          label="Dividend yield"
          value={formatRatio(dividendYieldOf(price, f), 2, "%")}
          rating={rateRatio("dividendYield", dividendYieldOf(price, f))}
          hint="Annual dividend ÷ price."
        />
        <Stat
          label="Beta"
          value={formatRatio(f?.beta)}
          hint="How much the stock moves versus the market."
        />
      </Group>

      <Group title="Shares & ownership">
        <Stat label="Shares outstanding" value={formatVolume(outstanding)} />
        <Stat
          label="Free float (circulating)"
          value={f?.floatShares ? formatVolume(f.floatShares) : "—"}
          hint="Shares available to trade, excluding promoter and locked-in holdings."
        />
        <Stat label="Free float %" value={formatRatio(floatPct, 1, "%")} />
        <Stat label="Insiders hold" value={formatFraction(f?.insidersPct)} />
        <Stat label="Institutions hold" value={formatFraction(f?.institutionsPct)} />
      </Group>

      <Group title="Financials">
        <Stat label="Revenue (TTM)" value={money(f?.revenue)} />
        <Stat label="EBITDA" value={money(f?.ebitda)} />
        <Stat label="Free cash flow" value={money(f?.freeCashflow)} />
        <Stat
          label="Profit margin"
          value={formatFraction(f?.profitMargin)}
          rating={rateRatio("profitMargin", f?.profitMargin ?? null)}
        />
        <Stat
          label="Operating margin"
          value={formatFraction(f?.operatingMargin)}
          rating={rateRatio("operatingMargin", f?.operatingMargin ?? null)}
        />
        <Stat
          label="ROE"
          value={formatFraction(f?.roe)}
          rating={rateRatio("roe", f?.roe ?? null)}
          hint="Return on equity."
        />
        <Stat
          label="ROA"
          value={formatFraction(f?.roa)}
          rating={rateRatio("roa", f?.roa ?? null)}
          hint="Return on assets."
        />
        <Stat
          label="Debt / equity"
          value={f?.debtToEquity != null ? formatRatio(f.debtToEquity / 100) : "—"}
          rating={rateRatio(
            "debtToEquity",
            f?.debtToEquity != null ? f.debtToEquity / 100 : null,
          )}
        />
        <Stat
          label="Current ratio"
          value={formatRatio(f?.currentRatio)}
          rating={rateRatio("currentRatio", f?.currentRatio ?? null)}
        />
        <Stat
          label="Revenue growth"
          value={formatFraction(f?.revenueGrowth)}
          rating={rateRatio("revenueGrowth", f?.revenueGrowth ?? null)}
        />
        <Stat
          label="Earnings growth"
          value={formatFraction(f?.earningsGrowth)}
          rating={rateRatio("earningsGrowth", f?.earningsGrowth ?? null)}
        />
      </Group>

      <p className="mt-4 text-xs text-muted">
        Fundamentals via Yahoo Finance, refreshed when the site&rsquo;s data is
        rebuilt. P/E, P/B and yield use the live price. Colours compare each
        ratio against typical market standards, not investment advice.
      </p>
    </section>
  );
}
`;

// ─── Safety checks ───────────────────────────────────────────────────────
for (const f of ["src/lib/fundamentals.ts", "src/components/key-stats.tsx"]) {
  if (!existsSync(f)) {
    console.error(`✗ ${f} nahi mili. Project root se chala rahe ho?`);
    process.exit(1);
  }
}
if (!existsSync("src/data/fundamentals.json")) {
  console.warn("⚠ src/data/fundamentals.json nahi mili — pehle build-universe.mjs chalao.");
}

// ─── Backup + write ──────────────────────────────────────────────────────
for (const f of ["src/lib/fundamentals.ts", "src/components/key-stats.tsx"]) {
  copyFileSync(f, f + ".bak");
}
writeFileSync("src/lib/fundamentals.ts", fundamentalsTs);
writeFileSync("src/components/key-stats.tsx", keyStatsTsx);

// ─── Verify ──────────────────────────────────────────────────────────────
const fund = readFileSync("src/lib/fundamentals.ts", "utf8");
const ks = readFileSync("src/components/key-stats.tsx", "utf8");
if (!fund.includes("export function rateRatio")) {
  console.error("✗ fundamentals.ts verify fail");
  process.exit(1);
}
if (!ks.includes("rateRatio")) {
  console.error("✗ key-stats.tsx verify fail");
  process.exit(1);
}

console.log("✓ Done!");
console.log("  - src/lib/fundamentals.ts  (rating logic)");
console.log("  - src/components/key-stats.tsx  (color-coded stats + legend)");
console.log("  - Backups: *.bak files");
console.log("");
console.log("Ab chalao:  npm run dev");
console.log("Koi stock kholo — P/E, P/B, PEG, ROE, margins, growth sab color-coded dikhenge.");