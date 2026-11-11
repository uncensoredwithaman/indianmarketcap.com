import { readFileSync, writeFileSync } from "node:fs";

const file = "src/components/market-board.tsx";
let text = readFileSync(file, "utf8");

const edits = [
  ["visible.map((row) => {", "visible.map((row, i) => {"],
  [
    '<td className="px-2 text-muted">{row.rank}</td>',
    '<td className="px-2 text-muted">{safePage * pageSize + i + 1}</td>',
  ],
];

for (const [from, to] of edits) {
  if (text.includes(to)) continue;
  if (!text.includes(from)) {
    console.error("Line not found, nothing changed:", from);
    process.exit(1);
  }
  text = text.replace(from, to);
}

writeFileSync(file, text);
console.log("Done! # column ab 1, 2, 3... sequential hai.");
