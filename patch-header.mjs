import { readFileSync, writeFileSync } from "node:fs";

const file = "src/components/market-board.tsx";
let text = readFileSync(file, "utf8");

const from = '<div className="mt-3 overflow-x-auto rounded-xl border border-border">';
const to = '<div className="mt-3 overflow-x-clip rounded-xl border border-border">';

if (text.includes(to)) {
  console.log("Pehle se patch ho chuka hai.");
  process.exit(0);
}
if (!text.includes(from)) {
  console.error("Line not found, nothing changed.");
  process.exit(1);
}
writeFileSync(file, text.replace(from, to));
console.log("Done! Ab Reliance (#1) wali row header ke peeche nahi chhupegi.");
