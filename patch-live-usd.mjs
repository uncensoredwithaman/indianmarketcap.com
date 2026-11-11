import { readFileSync, writeFileSync } from "node:fs";

/** Har file ke liye (purana text -> naya text) badlav. */
const files = {
  "src/lib/format.ts": [
    [
      "export const USD_INR = 95;",
      `let usdInr = 95;

/** Live USD/INR rate set karta hai. Galat ya khaali rate ko ignore karta hai. */
export function setUsdInr(rate: number | null | undefined): void {
  if (typeof rate === "number" && Number.isFinite(rate) && rate > 50 && rate < 200) usdInr = rate;
}

export function getUsdInr(): number {
  return usdInr;
}`,
    ],
    ["inr / USD_INR / 1e6", "inr / usdInr / 1e6"],
    ["inr / USD_INR / 1e9", "inr / usdInr / 1e9"],
  ],
  "src/lib/market-types.ts": [
    [
      "  indices: Array<LiveQuote | null>;\n  fetchedAt: number;",
      "  indices: Array<LiveQuote | null>;\n  /** Live 1 USD = ? INR (Yahoo INR=X). */\n  usdInr?: number;\n  fetchedAt: number;",
    ],
  ],
  "src/lib/market.functions.ts": [
    [
      "async function fetchMarket(): Promise<MarketPayload> {",
      `async function fetchUsdInr(): Promise<number | null> {
  const url = "https://query1.finance.yahoo.com/v8/finance/chart/INR%3DX?interval=1d&range=1d";
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "application/json" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) return null;
  const json: unknown = await res.json();
  if (!isRecord(json) || !isRecord(json.chart) || !Array.isArray(json.chart.result)) return null;
  const result = json.chart.result[0];
  if (!isRecord(result) || !isRecord(result.meta)) return null;
  return num(result.meta.regularMarketPrice);
}

async function fetchMarket(): Promise<MarketPayload> {`,
    ],
    [
      "  const batches = await mapLimit(",
      "  const usdInrPromise = fetchUsdInr().catch(() => null);\n  const batches = await mapLimit(",
    ],
    [
      "    indices: INDICES.map((index) => byYahoo.get(index.yahoo) ?? null),",
      "    indices: INDICES.map((index) => byYahoo.get(index.yahoo) ?? null),\n    usdInr: (await usdInrPromise) ?? undefined,",
    ],
  ],
  "src/lib/rows.ts": [
    [
      'import type { LiveQuote, MarketPayload } from "@/lib/market-types";',
      'import type { LiveQuote, MarketPayload } from "@/lib/market-types";\nimport { setUsdInr } from "@/lib/format";',
    ],
    [
      "export function buildRows(payload: MarketPayload): StockRow[] {",
      "export function buildRows(payload: MarketPayload): StockRow[] {\n  setUsdInr(payload.usdInr);",
    ],
  ],
};

// Pehle sab check karo, taaki kuch adhura na badle.
const updated = {};
for (const [file, edits] of Object.entries(files)) {
  let text = readFileSync(file, "utf8");
  if (file === "src/lib/format.ts") {
    if (text.includes("setUsdInr")) {
      console.log("Pehle se patch ho chuka hai.");
      process.exit(0);
    }
    if (!text.includes("USD_INR")) {
      console.error("Pehle patch-usd.mjs chalao, phir ye script.");
      process.exit(1);
    }
  }
  for (const [from, to] of edits) {
    if (!text.includes(from)) {
      console.error(`Line not found in ${file}, nothing changed:\n${from}`);
      process.exit(1);
    }
    text = text.split(from).join(to);
  }
  updated[file] = text;
}

for (const [file, text] of Object.entries(updated)) writeFileSync(file, text);
console.log("Done! Ab USD/INR rate live aayega (har ~45 second mein refresh).");
