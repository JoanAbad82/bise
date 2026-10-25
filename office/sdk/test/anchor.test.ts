// The anchor the SDK takes is bise_proto's (anchor.gen.ts): every line of
// rust/proto/fixtures/anchor.jsonl reads; an unknown kind is refused.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as office from "../../dist/office.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const lines = readFileSync(join(root, "rust/proto/fixtures/anchor.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));

const refusal = (fn: () => unknown): InstanceType<typeof office.OfficeError> => {
  try {
    fn();
  } catch (e) {
    assert.ok(e instanceof office.OfficeError, `not an OfficeError: ${e}`);
    return e;
  }
  assert.fail("did not throw");
};

test("every fixture anchor reads, and the fixtures cover every kind", () => {
  for (const a of lines) assert.deepEqual(office.readAnchor(a), a);
  assert.deepEqual([...new Set(lines.map((a) => a.kind))].sort(), [...office.ANCHOR_KINDS].sort());
});

test("an unknown kind is refused with words, never guessed", () => {
  const e = refusal(() => office.readAnchor({ kind: "voxel", x: 1 }));
  assert.equal(e.code, "anchor_kind");
  assert.match(e.message, /"voxel"/);
  assert.match(e.message, /block, cell/);
});

test("a known kind with a bad field is refused, naming the field", () => {
  const e = refusal(() => office.readAnchor({ kind: "slide", slide: 0 }));
  assert.equal(e.code, "anchor_shape");
  assert.match(e.message, /slide/);
  assert.equal(refusal(() => office.readAnchor({ kind: "cell", sheet: "Q3" })).code, "anchor_shape");
  assert.equal(refusal(() => office.readAnchor({ kind: "region", rect: { x: 1, y: 2, w: 3 } })).code, "anchor_shape");
  // a video's moment (video-view): seconds, 0 or more, a box optional
  assert.deepEqual(office.readAnchor({ kind: "time", t: 12.5 }), { kind: "time", t: 12.5 });
  assert.deepEqual(office.readAnchor({ kind: "time", t: 0, rect: { x: 1, y: 2, w: 3, h: 4 } }), { kind: "time", t: 0, rect: { x: 1, y: 2, w: 3, h: 4 } });
  for (const t of [-1, "0:12", undefined]) assert.equal(refusal(() => office.readAnchor({ kind: "time", t })).code, "anchor_shape");
  assert.equal(refusal(() => office.readAnchor("B4")).code, "anchor_shape");
});

test("an anchor of another file type is refused", () => {
  const cell = office.anchorFor("xlsx", { kind: "cell", sheet: "Q3", range: "B4" });
  assert.equal(cell.kind === "cell" ? cell.range : undefined, "B4");
  const e = refusal(() => office.anchorFor("xlsx", { kind: "shape", slide: 1, shape: "2" }));
  assert.equal(e.code, "anchor_kind_mismatch");
});
