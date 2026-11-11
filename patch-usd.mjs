import { readFileSync, writeFileSync } from "node:fs";

const file = "src/lib/format.ts";
let text = readFileSync(file, "utf8");

if (text.includes("USD_INR")) {
  console.log("Pehle se patch ho chuka hai.");
  process.exit(0);
}

const edits = [
  [
    "export type Tone =",
    "/** 1 US dollar in rupees. Isse kabhi bhi apne hisaab se badal sakte ho. */\nexport const USD_INR = 95;\n\nexport type Tone =",
  ],
  ['label: "₹ Million"', 'label: "$ Million"'],
  ['label: "₹ Billion"', 'label: "$ Billion"'],
  [
    'if (unit === "million") return `₹${(inr / 1e6).toLocaleString("en-IN", options)} Mn`;',
    'if (unit === "million") return `$${(inr / USD_INR / 1e6).toLocaleString("en-US", options)} M`;',
  ],
  [
    'if (unit === "billion") return `₹${(inr / 1e9).toLocaleString("en-IN", options)} Bn`;',
    'if (unit === "billion") return `$${(inr / USD_INR / 1e9).toLocaleString("en-US", options)} B`;',
  ],
];

for (const [from, to] of edits) {
  if (!text.includes(from)) {
    console.error("Line not found, nothing changed:", from);
    process.exit(1);
  }
  text = text.replace(from, () => to);
}

writeFileSync(file, text);
console.log("Done! Million aur Billion ab US dollars ($) mein dikhenge.");
