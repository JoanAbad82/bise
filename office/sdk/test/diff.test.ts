// diff(): by id, own fields only.

import { test } from "node:test";
import assert from "node:assert/strict";
import { diff, flatten, type Outline, type OutlineNode } from "../../dist/office.js";

const slide = (n: number, shapes: OutlineNode[]): OutlineNode => ({ id: `s${n}`, type: "slide", anchor: { kind: "slide", slide: n }, children: shapes });
const shape = (n: number, id: string, text: string, props?: Record<string, unknown>): OutlineNode => ({ id: `s${n}/${id}`, type: "shape", anchor: { kind: "shape", slide: n, shape: id }, text, props });

test("added, removed and changed, by id", () => {
  const a: Outline = { kind: "pptx", nodes: [slide(1, [shape(1, "2", "Q3 review"), shape(1, "3", "Revenue up 4%", { box: [1, 2, 3, 4] })]), slide(2, [])] };
  const b: Outline = { kind: "pptx", nodes: [slide(1, [shape(1, "2", "Q3 review"), shape(1, "3", "Revenue up 5%", { box: [1, 2, 3, 4] }), shape(1, "4", "new")])] };
  const d = diff(a, b);
  assert.deepEqual(d.added.map((n) => n.id), ["s1/4"]);
  assert.deepEqual(d.removed.map((n) => n.id), ["s2"]);
  assert.deepEqual(d.changed.map((c) => [c.after.id, c.fields]), [["s1/3", ["text"]]]);
});

test("props compare by value, whatever their key order; the same outline is no change", () => {
  const a: Outline = { kind: "pptx", nodes: [shape(1, "3", "x", { box: [1, 2], fill: "red" })] };
  const b: Outline = { kind: "pptx", nodes: [shape(1, "3", "x", { fill: "red", box: [1, 2] })] };
  assert.deepEqual(diff(a, b), { added: [], removed: [], changed: [] });
  assert.equal(flatten({ kind: "pptx", nodes: [slide(1, [shape(1, "2", "t")])] }).length, 2);
});
