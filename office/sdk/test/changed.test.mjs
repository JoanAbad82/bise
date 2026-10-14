// changedAnchors / changedOf: what a save changed, as anchors (plan §9b,
// architect m_23911), per format, on the built bundle.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { slides, sheets, docs, changedAnchors, changedOf, CHANGED_CAP } from "../../dist/office.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (n) => new Uint8Array(readFileSync(join(here, "..", "..", "fixtures", n)));

test("a deck: an edited shape is its anchor, a new slide is its slide", async () => {
  const before = fixture("tiny.pptx");
  const deck = await slides.open(before);
  deck.at({ kind: "shape", slide: 1, shape: "3" }).replace("4%", "5%");
  deck.addSlide();
  const after = await deck.save();
  const got = await changedAnchors(before, after);
  assert.ok(got.some((a) => a.kind === "shape" && a.slide === 1 && a.shape === "3"), JSON.stringify(got));
  assert.ok(got.some((a) => a.kind === "slide" && a.slide === 3), JSON.stringify(got));
  assert.ok(!got.some((a) => a.kind === "slide" && a.slide === 1), "slide 1 is not listed: its shape is");
});

test("a sheet: the cells set, not the sheet whose used range grew", async () => {
  const before = fixture("tiny.xlsx");
  const book = await sheets.open(before);
  book.range("Q3!B2").set([[999]]);
  book.range("Q3!C5").set([["new"]]);
  const got = await changedAnchors(before, await book.save());
  // B4 is =SUM(B2:B3): its value moved with B2
  assert.deepEqual(got.map((a) => a.range).sort(), ["B2", "B4", "C5"]);
  assert.ok(got.every((a) => a.kind === "cell" && a.sheet === "Q3"), JSON.stringify(got));
});

test("a document: the paragraph edited", async () => {
  const before = fixture("tiny.docx");
  const doc = await docs.open(before);
  const ids = doc.inspect().nodes.filter((n) => n.type === "para").map((n) => n.id);
  doc.at({ kind: "para", para: ids[1] }).insert("!");
  const got = await changedAnchors(before, await doc.save());
  assert.deepEqual(got, [{ kind: "para", para: ids[1] }]);
});

test("the same bytes: nothing; another kind or not a file: null, never a throw", async () => {
  const x = fixture("tiny.xlsx");
  assert.deepEqual(await changedAnchors(x, x), []);
  assert.equal(await changedAnchors(x, fixture("tiny.docx")), null);
  assert.equal(await changedAnchors(new Uint8Array([1, 2, 3]), x), null);
});

const cell = (sheet, ref) => ({ id: `${sheet}!${ref}`, type: "cell", anchor: { kind: "cell", sheet, range: ref }, text: ref });
const sheet = (name, cells) => ({ id: name, type: "sheet", anchor: { kind: "cell", sheet: name, range: "A1" }, children: cells });

test("past the cap, cells become one box per sheet", () => {
  const refs = [];
  for (let r = 1; r <= 10; r++) for (const c of ["B", "C", "D"]) refs.push(`${c}${r}`);
  const before = { kind: "xlsx", nodes: [sheet("Q3", []), sheet("Q4", [])] };
  const after = { kind: "xlsx", nodes: [sheet("Q3", refs.map((r) => cell("Q3", r))), sheet("Q4", [cell("Q4", "A1")])] };
  assert.ok(refs.length > CHANGED_CAP);
  assert.deepEqual(changedOf(before, after), [
    { kind: "cell", sheet: "Q3", range: "B1:D10" },
    { kind: "cell", sheet: "Q4", range: "A1" },
  ]);
});

test("a removed shape points at its slide, past the cap shapes become slides", () => {
  const shape = (n, id) => ({ id: `s${n}/${id}`, type: "shape", anchor: { kind: "shape", slide: n, shape: id }, text: id });
  const slide = (n, shapes) => ({ id: `s${n}`, type: "slide", anchor: { kind: "slide", slide: n }, children: shapes });
  const before = { kind: "pptx", nodes: [slide(1, [shape(1, "2"), shape(1, "3")])] };
  const after = { kind: "pptx", nodes: [slide(1, [shape(1, "2")])] };
  assert.deepEqual(changedOf(before, after), [{ kind: "slide", slide: 1 }]);
  const many = Array.from({ length: 30 }, (_, i) => shape(1 + (i % 2), String(i + 10)));
  const big = { kind: "pptx", nodes: [slide(1, many.filter((s) => s.anchor.slide === 1)), slide(2, many.filter((s) => s.anchor.slide === 2))] };
  assert.deepEqual(changedOf({ kind: "pptx", nodes: [slide(1, []), slide(2, [])] }, big), [
    { kind: "slide", slide: 1 },
    { kind: "slide", slide: 2 },
  ]);
});
