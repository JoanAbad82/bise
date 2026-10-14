// The viewer's pure parts (kit/office/*.js, plan §4) and the bundles' split (architect m_23781):
// office.js stays DOM-free (bise office run loads it), office-view.js carries docx-preview.
// The renderers import the bundles by their served path (/kit/office/…): their pure helpers
// are loaded here without those imports, so no DOM is needed.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..");

/** A kit/office module with its bundle imports cut (its helpers need none). */
async function helpers(name) {
  const src = readFileSync(join(root, "kit", "office", name), "utf8").replace(/^import .* from "\/kit\/office\/[^"]+";$/gm, "");
  return import(`data:text/javascript;base64,${Buffer.from(src).toString("base64")}`);
}

test("office.js loads with no window or document, and has no docx-preview in it", async () => {
  assert.equal(typeof globalThis.window, "undefined");
  assert.equal(typeof globalThis.document, "undefined");
  const office = await import("../../dist/office.js");
  assert.equal(typeof office.sheets.open, "function");
  const js = readFileSync(join(root, "office", "dist", "office.js"), "utf8");
  assert.ok(!js.includes("docx-preview"), "docx-preview lives in office-view.js only");
  const view = readFileSync(join(root, "office", "dist", "office-view.js"), "utf8");
  assert.match(view, /export\s*\{[^}]*renderDocx/, "office-view.js exports renderDocx");
  assert.ok(view.length < 2 * 1024 * 1024, "within its 2 MB budget");
});

test("the grid names cells and ranges as the sheets module does", async () => {
  const { parseRef, colName, rangeOf, model } = await helpers("sheet.js");
  assert.deepEqual(parseRef("B4"), { col: 2, row: 4 });
  assert.deepEqual(parseRef("$AA$10"), { col: 27, row: 10 });
  assert.equal(parseRef("Sheet1"), null);
  assert.deepEqual([1, 26, 27, 52, 703].map(colName), ["A", "Z", "AA", "AZ", "AAA"]);
  assert.equal(rangeOf({ col: 4, row: 9 }, { col: 2, row: 4 }), "B4:D9");
  assert.equal(rangeOf({ col: 2, row: 4 }, { col: 2, row: 4 }), "B4");
  const m = model({
    id: "Q3",
    type: "sheet",
    name: "Q3",
    props: { merged: ["A1:C1"], dims: "A1:E30" },
    children: [
      { id: "Q3!A1", type: "cell", text: "Revenue" },
      { id: "Q3!B4", type: "cell", text: "1,200", props: { value: 1200 } },
    ],
  });
  assert.deepEqual([m.rows, m.cols], [30, 5], "the sheet's dims, beyond its last cell");
  assert.deepEqual(m.spans.get("1:1"), { rows: 1, cols: 3 });
  assert.ok(m.covered.has("1:2") && m.covered.has("1:3") && !m.covered.has("1:1"));
  assert.equal(m.cells.get("4:2").text, "1,200");
});

test("a slide's boxes are placed in % of the slide", async () => {
  const { pct } = await helpers("slides.js");
  assert.deepEqual(pct([72, 54, 480, 270], 960, 540), { left: 7.5, top: 10, width: 50, height: 50 });
});

test("drawn paragraphs pair with the outline's, passing over what it skips", async () => {
  const { matchParas, parasOf } = await helpers("docx.js");
  const outline = parasOf([
    { id: "p1", type: "para", text: "Title" },
    { id: "t", type: "table", children: [{ id: "p2", type: "para", text: "cell  one" }, { id: "c", type: "comment" }] },
    { id: "p3", type: "para", text: "Body" },
  ]);
  assert.deepEqual(outline.map((n) => n.id), ["p1", "p2", "p3"], "a table's paragraphs in place, no comment");
  // a text box's paragraph drawn between them is passed over; whitespace does not count
  assert.deepEqual(matchParas(["Title", "in a text box", "cell one", "Body"], outline.map((n) => n.text)), [0, -1, 1, 2]);
  // a paragraph docx-preview did not draw: the next ones still pair
  assert.deepEqual(matchParas(["Title", "Body"], outline.map((n) => n.text)), [0, 2]);
});
