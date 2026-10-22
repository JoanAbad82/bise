// The viewer's grid and the workbook (src/sheets/univer.ts, page xlsx-univer):
// an xlsx as Univer's snapshot, the grid's edits as Edit[], replayed and
// saved: values, formulas, widths and heights come back, the rest stays.

import { test } from "node:test";
import assert from "node:assert/strict";
import { sheets, editsBetween, widthChars, heightPt } from "../../dist/office.js";
import { richWorkbook } from "./sheets-rich.mjs";

const DATE = new Date(Date.UTC(2026, 0, 1));
const clone = (x) => JSON.parse(JSON.stringify(x));
const cell = (outline, id) => outline.nodes.flatMap((s) => s.children ?? []).find((c) => c.id === id);

async function q3() {
  const book = await sheets.create({ sheet: "Q3", rows: [["Item", "Amount"], ["a", 1200], ["b", 300.5], ["Total", "=SUM(B2:B3)"]], date: DATE });
  book.range("Q3!A1:B1").style({ bold: true, fill: "#eeeeee", align: "center" });
  book.range("B2:B4").style({ numFmt: "#,##0.00" });
  book.range("A6:C6").merge().set("note row");
  book.range("A1").width(20);
  book.range("A1").height(30);
  return sheets.open(await book.save());
}

test("a workbook as Univer's snapshot: values, formulas with their result, styles, widths, heights, merges", async () => {
  const snap = (await q3()).univer();
  assert.deepEqual(snap.sheetOrder, ["sheet1"]);
  const s = snap.sheets.sheet1;
  assert.equal(s.name, "Q3");
  assert.deepEqual({ v: s.cellData[0][0].v, t: s.cellData[0][0].t }, { v: "Item", t: 1 });
  assert.deepEqual({ v: s.cellData[1][1].v, t: s.cellData[1][1].t }, { v: 1200, t: 2 });
  assert.deepEqual({ f: s.cellData[3][1].f, v: s.cellData[3][1].v }, { f: "=SUM(B2:B3)", v: 1500.5 });
  const head = snap.styles[s.cellData[0][0].s];
  assert.deepEqual({ bl: head.bl, bg: head.bg, ht: head.ht }, { bl: 1, bg: { rgb: "#eeeeee" }, ht: 2 });
  assert.deepEqual(snap.styles[s.cellData[1][1].s].n, { pattern: "#,##0.00" });
  assert.equal(s.columnData[0].w, 145, "20 characters");
  assert.equal(s.rowData[0].h, 40, "30 points");
  assert.deepEqual(s.mergeData, [{ startRow: 5, endRow: 5, startColumn: 0, endColumn: 2 }]);
  assert.ok(s.rowCount >= 200 && s.columnCount >= 26, "room to type past the data");
});

test("pixels and the file's units go back and forth", () => {
  assert.equal(widthChars(145), 20);
  assert.equal(heightPt(40), 30);
  assert.equal(widthChars(0), 0);
});

test("the grid's edits: a value, a formula, a recomputed result, a cleared cell, a width, a height", () => {
  const before = { sheetOrder: ["s1"], styles: {}, sheets: { s1: { name: "Q3", defaultColumnWidth: 64, defaultRowHeight: 20, cellData: { 0: { 0: { v: "a", t: 1 }, 1: { v: 1, t: 2 } }, 1: { 1: { f: "=B1*2", v: 2, t: 2 } }, 2: { 0: { v: "gone", t: 1 } } }, columnData: {}, rowData: {} } } };
  const after = clone(before);
  const s = after.sheets.s1;
  s.cellData[0][1] = { v: 5, t: 2 };
  s.cellData[1][1].v = 10;
  s.cellData[0][2] = { f: "=B1+1", v: 6, t: 2 };
  delete s.cellData[2];
  s.columnData[1] = { w: 120 };
  s.rowData[3] = { h: 33 };
  assert.deepEqual(editsBetween(before, after), [
    { kind: "cell", sheet: "Q3", row: 1, col: 2, value: 5 },
    { kind: "cell", sheet: "Q3", row: 1, col: 3, value: { formula: "B1+1", result: 6 } },
    { kind: "result", sheet: "Q3", row: 2, col: 2, result: 10 },
    { kind: "cell", sheet: "Q3", row: 3, col: 1, value: null },
    { kind: "width", sheet: "Q3", col: 2, px: 120 },
    { kind: "height", sheet: "Q3", row: 4, px: 33 },
  ]);
  assert.deepEqual(editsBetween(before, clone(before)), [], "nothing done, no edit");
});

test("an xlsx round trip through the grid keeps values, formulas, widths and heights", async () => {
  const book = await q3();
  const before = book.univer();
  const after = clone(before);
  const s = after.sheets.sheet1;
  s.cellData[1][1] = { ...s.cellData[1][1], v: 2000 };
  s.cellData[3][1].v = 2300.5; // the grid recomputed the total
  s.cellData[4] = { 1: { f: "=B4/2", v: 1150.25, t: 2 } };
  s.columnData[1] = { w: 201 };
  s.rowData[2] = { h: 28 };
  book.apply(editsBetween(before, after));
  const back = await sheets.open(await book.save());
  const o = back.inspect();
  assert.equal(cell(o, "Q3!B2").props.value, 2000);
  assert.deepEqual([cell(o, "Q3!B4").props.formula, cell(o, "Q3!B4").props.value], ["=SUM(B2:B3)", 2300.5]);
  assert.deepEqual([cell(o, "Q3!B5").props.formula, cell(o, "Q3!B5").props.value], ["=B4/2", 1150.25]);
  assert.equal(cell(o, "Q3!A1").props.bold, true, "a style it never touched");
  const sheet = o.nodes[0].props;
  assert.equal(sheet.widths[0], 145, "the width it did not change");
  assert.equal(sheet.widths[1], 201, "the one it resized");
  assert.equal(sheet.heights[3], 28);
  assert.deepEqual(sheet.merged, ["A6:C6"]);
  // the reopened file opens in the grid as the grid left it
  const again = back.univer().sheets.sheet1;
  assert.equal(again.columnData[1].w, 201);
  assert.equal(again.rowData[2].h, 28);
});

test("a formula the SDK cannot compute keeps the grid's result", async () => {
  const book = await sheets.create({ sheet: "S", rows: [[3, 4]], date: DATE });
  const before = book.univer();
  const after = clone(before);
  after.sheets.sheet1.cellData[0][2] = { f: "=XLOOKUP(3,A1:A1,B1:B1)", v: 4, t: 2 };
  book.apply(editsBetween(before, after));
  const o = (await sheets.open(await book.save())).inspect();
  assert.deepEqual([cell(o, "S!C1").props.formula, cell(o, "S!C1").props.value], ["=XLOOKUP(3,A1:A1,B1:B1)", 4]);
});

test("an edit in the grid keeps the charts and pivots it never saw", async () => {
  const { bytes } = await richWorkbook();
  const book = await sheets.open(bytes);
  const before = book.univer();
  const after = clone(before);
  const sid = after.sheetOrder.find((id) => after.sheets[id].name === "Q3");
  after.sheets[sid].cellData[1][1] = { v: 999, t: 2 };
  after.sheets[sid].columnData[0] = { w: 180 };
  book.apply(editsBetween(before, after));
  const back = await sheets.open(await book.save());
  const q3 = back.inspect().nodes.find((n) => n.name === "Q3");
  assert.deepEqual(q3.props.charts.map((c) => c.title), ["Revenue by item"]);
  assert.equal(q3.props.pivots, 1);
  assert.equal(cell(back.inspect(), "Q3!B2").props.value, 999);
  assert.equal(q3.props.widths[0], 180);
});

test("an edit for a sheet the workbook does not have is refused in words", async () => {
  const book = await q3();
  assert.throws(() => book.apply([{ kind: "width", sheet: "Nope", col: 1, px: 80 }]), (e) => e.code === "not_found" && /Nope/.test(e.message));
});
