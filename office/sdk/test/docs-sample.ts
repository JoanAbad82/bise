// The sample docx: every kind of block, a comment and a tracked change.
// The tests check it; docs-ql.sh writes it and has Quick Look render it
// (architect's off-screen check for the docs module).

import { docs } from "../../dist/office.js";

const now = () => new Date(Date.UTC(2026, 9, 14, 9, 0, 0));

// a 2x1 PNG: header and IHDR are enough for the size
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0, 200, 0, 0, 0, 100, 8, 6, 0, 0, 0, 0, 0, 0, 0]);

export async function sample() {
  const doc = await docs.create({ title: "Q3 review", author: "bise", now });
  doc.add({ kind: "title", text: "Q3 review" });
  doc.add({ kind: "heading", text: "Summary", level: 1 });
  const p = doc.add({ kind: "para", text: [{ text: "Revenue grew " }, { text: "4%", bold: true }, { text: " on the quarter. " }, { text: "Details", link: "https://example.com/q3" }] });
  doc.add({ kind: "bullet", text: "North up 6%" });
  doc.add({ kind: "bullet", text: "South flat", level: 2 });
  doc.add({ kind: "numbered", text: "Ship pricing" });
  doc.add({ kind: "heading", text: "Numbers", level: 2 });
  doc.add({ kind: "table", rows: [["Region", "Revenue"], ["North", "120"], ["South", "80"]], header: true });
  doc.add({ kind: "quote", text: "Plain words win." });
  doc.add({ kind: "image", bytes: PNG, alt: "a chart" });
  doc.add({ kind: "pagebreak" });
  doc.add({ kind: "para", text: "Appendix.", align: "justify" });
  if (!("comment" in p)) throw new Error("a para block gives a paragraph, not a table");
  p.comment("Is 4% the final number?", { quote: "4%" });
  p.replace("grew", "rose", { track: true });
  return doc;
}

