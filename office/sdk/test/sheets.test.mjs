// The sheets module, on the built bundle (office/dist/office.js).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sheets, core, diff, OfficeError, checkPackage } from "../../dist/office.js";
import { richWorkbook, PNG } from "./sheets-rich.mjs";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "fixtures");
const DATE = new Date(Date.UTC(2026, 0, 1));

async function codeOf(fn) {
  try {
    await fn();
  } catch (e) {
    assert.ok(e instanceof OfficeError, `not an OfficeError: ${e}`);
    return e.code;
  }
  assert.fail("did not throw");
}

/** No broken rel, no bad XML, every part has a content type. */
function sound(bytes) {
  const zip = core.Zip.read(bytes);
  assert.deepEqual(checkPackage(zip), []);
  const ct = core.contentTypes(zip);
  for (const p of zip.list()) if (p !== "[Content_Types].xml") assert.ok(core.typeOf(ct, p), `${p} has no content type`);
  return zip;
}

const cell = (outline, id) => outline.nodes.flatMap((s) => s.children ?? []).find((c) => c.id === id);

test("create, style, save, open: values, formulas with values, styles, merges, widths come back", async () => {
  const book = await sheets.create({ sheet: "Q3", rows: [["Item", "Amount"], ["a", 1200], ["b", 300.5], ["Total", "=SUM(B2:B3)"]], date: DATE });
  book.range("Q3!A1:B1").style({ bold: true, fill: "#eeeeee", color: "#1f6feb", align: "center" });
  book.range("B2:B4").style({ numFmt: "#,##0.00" });
  book.range("A6:C6").merge().set("note row");
  book.range("A1").width(20);
  book.range("A2").height(30);
  book.exceljs.getWorksheet("Q3").views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
  const bytes = await book.save();
  sound(bytes);

  const again = await sheets.open(bytes);
  assert.deepEqual(again.sheetNames, ["Q3"]);
  const o = again.inspect();
  const sheet = o.nodes[0];
  assert.equal(sheet.id, "Q3");
  assert.equal(sheet.props.dims, "A1:C6");
  assert.deepEqual(sheet.props.merged, ["A6:C6"]);
  assert.deepEqual(sheet.props.frozen, { rows: 1, cols: 0 });
  assert.equal(sheet.props.widths[0], 145);
  assert.equal(sheet.props.heights["2"], 40);
  assert.deepEqual(cell(o, "Q3!A1").props, { value: "Item", bold: true, color: "#1f6feb", fill: "#eeeeee", align: "center" });
  const total = cell(o, "Q3!B4");
  assert.equal(total.text, "1,500.50");
  assert.equal(total.props.formula, "=SUM(B2:B3)");
  assert.equal(total.props.value, 1500.5);
  assert.equal(total.props.noValue, undefined);
  assert.equal(cell(o, "Q3!A6").props.merged, "A6:C6");
  assert.deepEqual(again.range("Q3!A2:B3").values(), [["a", 1200], ["b", 300.5]]);
  assert.deepEqual(again.check(), []);
});

test("a file opened and saved without an edit comes back byte for byte", async () => {
  const { bytes } = await richWorkbook();
  const book = await sheets.open(bytes);
  book.inspect();
  book.check();
  assert.equal(book.changed, false);
  assert.deepEqual(await book.save(), bytes);
});

test("the same workbook saves to the same bytes (ids of conditional formats too)", async () => {
  const make = async () => {
    const b = await sheets.create({ rows: [[1], [2], [3]], date: DATE });
    b.exceljs.getWorksheet("Sheet1").addConditionalFormatting({ ref: "A1:A3", rules: [{ type: "dataBar", cfvo: [{ type: "min" }, { type: "max" }], color: { argb: "FF638EC6" } }] });
    return b;
  };
  const a = await make();
  const first = await a.save();
  assert.deepEqual(await a.save(), first);
  assert.deepEqual(await (await make()).save(), first);
  sound(first);
});

test("at() takes a note's anchor; refs, wrong kinds, missing sheets and bad ranges are refused with words", async () => {
  const book = await sheets.create({ sheet: "My sheet", rows: [["a", "b"], [1, 2]], date: DATE });
  const sel = book.at({ kind: "cell", sheet: "My sheet", range: "A1:B2" });
  assert.equal(sel.ref, "'My sheet'!A1:B2");
  assert.equal(sel.node.type, "range");
  assert.equal(sel.node.text, "a\tb\n1\t2");
  assert.equal(book.range("'My sheet'!B2").node.id, "'My sheet'!B2");
  sel.set([[10, 20]]);
  assert.deepEqual(book.range("'My sheet'!A1:B1").values(), [[10, 20]]);
  assert.equal(await codeOf(() => book.at({ kind: "shape", slide: 1, shape: "2" })), "anchor_kind_mismatch");
  assert.equal(await codeOf(() => book.at({ kind: "cell", sheet: "Nope", range: "A1" })), "not_found");
  assert.equal(await codeOf(() => book.range("'My sheet'!B4:")), "bad_arg");
  assert.equal(await codeOf(() => book.range("A1").style({ fill: "blue" })), "bad_arg");
  assert.equal(await codeOf(() => book.addSheet("My sheet")), "bad_arg");
  assert.equal(await codeOf(() => sheets.open(readFileSync(join(fixtures, "tiny.docx")))), "not_office");
});

test("formulas get values on save; errors and what the SDK cannot compute are named by check()", async () => {
  const book = await sheets.create({
    rows: [
      [2, 3, "x"],
      ["=A1*B1+1", "=A1/0", "=IF(A1>1,\"big\",\"small\")"],
      ["=SUM(A1:B1)&\" total\"", "=XLOOKUP(1,A1:A2,B1:B2)", "=ROUND(AVERAGE(A1:B1),0)"],
      ["=COUNT(A1:C1)", "=IFERROR(B2,-1)", "=Other!A1"],
    ],
    date: DATE,
  });
  book.addSheet("Other", { rows: [["=Sheet1!A1*10"]] });
  const r = book.recalc();
  assert.deepEqual(r.unsupported.map((u) => u.ref), ["Sheet1!B3"]);
  assert.deepEqual(book.range("A2:C4").values(), [
    [7, { error: "#DIV/0!" }, "big"],
    ["5 total", null, 3],
    [2, -1, 20],
  ]);
  const problems = book.check();
  assert.deepEqual(problems.map((p) => [p.code, p.at?.range]), [["formula_error", "B2"], ["no_value", "B3"]]);
  assert.match(problems[1].message, /XLOOKUP/);
});

test("number formats: the text is what Excel shows", async () => {
  const book = await sheets.create({ date: DATE });
  const cases = [
    [1234.5, "#,##0.00", "1,234.50"],
    [0.256, "0.0%", "25.6%"],
    [-42, "#,##0;(#,##0)", "(42)"],
    [1234567, '"$"#,##0', "$1,234,567"],
    [12345.678, "0.00E+00", "1.23E+04"],
    [46023, "yyyy-mm-dd", "2026-01-01"],
    [46023.75, "d mmm yyyy h:mm AM/PM", "1 Jan 2026 6:00 PM"],
    [0.1 + 0.2, "General", "0.3"],
    [3, "0", "3"],
  ];
  cases.forEach(([v, fmt], i) => book.range(`A${i + 1}`).set(v).style({ numFmt: fmt }));
  const o = book.inspect();
  cases.forEach(([, , want], i) => assert.equal(cell(o, `Sheet1!A${i + 1}`).text, want, cases[i][1]));
});

test("diff names the cells and sheets that changed between two outlines", async () => {
  const book = await sheets.create({ rows: [[1, 2]], date: DATE });
  const before = book.inspect();
  book.range("B1").set(3);
  book.addSheet("New", { rows: [["x"]] });
  const d = diff(before, book.inspect());
  assert.deepEqual(d.changed.map((c) => [c.after.id, c.fields]), [["Sheet1!B1", ["props", "text"]]]);
  assert.deepEqual(d.added.map((n) => n.id).sort(), ["New", "New!A1"]);
  assert.deepEqual(d.removed, []);
});

test("an edit keeps what exceljs does not model: charts, pivots, external links, chartsheets, custom properties", async () => {
  const { bytes } = await richWorkbook();
  const book = await sheets.open(bytes);
  const q3 = book.inspect().nodes.find((n) => n.name === "Q3");
  assert.deepEqual(q3.props.charts.map((c) => c.title), ["Revenue by item"]);
  assert.equal(q3.props.pivots, 1);
  book.range("Q3!B2").set(1300);
  assert.deepEqual(book.check(), []);
  const out = await book.save();
  const zip = sound(out);

  for (const p of ["xl/charts/chart1.xml", "xl/charts/chart2.xml", "xl/pivotTables/pivotTable1.xml", "xl/pivotCache/pivotCacheDefinition1.xml", "xl/pivotCache/pivotCacheRecords1.xml", "xl/externalLinks/externalLink1.xml", "xl/chartsheets/sheet1.xml", "docProps/custom.xml"]) {
    assert.deepEqual(zip.bytes(p), core.Zip.read(bytes).bytes(p), p);
  }
  const wb = zip.text("xl/workbook.xml");
  const bookRels = core.rels(zip, "xl/workbook.xml");
  const target = (id) => bookRels.find((r) => r.id === id)?.target;
  assert.equal(target(/<pivotCache cacheId="1" r:id="(rId\d+)"/.exec(wb)[1]), "xl/pivotCache/pivotCacheDefinition1.xml");
  assert.equal(target(/<externalReference r:id="(rId\d+)"/.exec(wb)[1]), "xl/externalLinks/externalLink1.xml");
  const names = [...wb.matchAll(/<sheet [^>]*name="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(names, ["Q3", "Totals chart", "Data"]);
  assert.match(wb, /<definedName name="DataBlock" localSheetId="2"/);
  assert.ok(wb.indexOf("<externalReferences") < wb.indexOf("<definedNames"), "schema order");

  const sheetPart = target(/<sheet [^>]*name="Q3"[^>]*r:id="(rId\d+)"/.exec(wb)[1]);
  const sheetRels = core.rels(zip, sheetPart);
  const drawingId = /<drawing r:id="(rId\d+)"\/>/.exec(zip.text(sheetPart))[1];
  const drawing = sheetRels.find((r) => r.id === drawingId).target;
  assert.equal(core.rels(zip, drawing)[0].target, "xl/charts/chart1.xml");
  assert.ok(sheetRels.some((r) => r.target === "xl/pivotTables/pivotTable1.xml"));
  assert.ok(core.rels(zip, "").some((r) => r.target === "docProps/custom.xml"));

  // the picture on Data is exceljs's, and still there
  const data = (await sheets.open(out)).exceljs.getWorksheet("Data");
  assert.equal(data.getImages().length, 1);

  // and a second edit round keeps it all again
  const twice = await sheets.open(out);
  twice.range("Data!B2").set(2);
  const zip2 = sound(await twice.save());
  assert.ok(zip2.has("xl/charts/chart1.xml") && zip2.has("xl/pivotTables/pivotTable1.xml"));
  assert.deepEqual(twice.inspect().nodes.find((n) => n.name === "Q3").props.charts.map((c) => c.title), ["Revenue by item"]);
});

test("a save that would lose a part refuses with its name, unless the script drops it", async () => {
  const { bytes } = await richWorkbook();
  const book = await sheets.open(bytes);
  book.removeSheet("Q3");
  const lost = book.check().filter((p) => p.code === "would_lose");
  assert.deepEqual(lost.map((p) => p.message.split(":")[0]).sort(), ["xl/drawings/drawing9.xml", "xl/pivotTables/pivotTable1.xml"]);
  assert.equal(await codeOf(() => book.save()), "would_lose");
  await assert.rejects(book.save({ drop: ["xl/drawings/drawing9.xml"] }), /pivotTable1\.xml/);
  const out = await book.save({ drop: ["xl/drawings/drawing9.xml", "xl/pivotTables/pivotTable1.xml"] });
  const zip = sound(out);
  assert.ok(!zip.has("xl/charts/chart1.xml"));
  assert.ok(zip.has("xl/chartsheets/sheet1.xml"), "the chartsheet does not hang on Q3");
});

test("a picture added to a sheet with a chart cannot be merged: would_lose names the drawing", async () => {
  const { bytes } = await richWorkbook();
  const book = await sheets.open(bytes);
  const x = book.exceljs;
  x.getWorksheet("Q3").addImage(x.addImage({ buffer: PNG, extension: "png" }), "A8:B9");
  assert.deepEqual(book.check().filter((p) => p.code === "would_lose").map((p) => p.message.split(":")[0]), ["xl/drawings/drawing9.xml"]);
  assert.equal(await codeOf(() => book.save()), "would_lose");
});

test("the core's tiny.xlsx opens, edits and keeps its custom XML part", async () => {
  const bytes = new Uint8Array(readFileSync(join(fixtures, "tiny.xlsx")));
  const book = await sheets.open(bytes);
  const before = core.Zip.read(bytes);
  book.range(`${book.sheetNames[0]}!C3`).set("added");
  const zip = sound(await book.save());
  for (const p of before.list()) {
    if (p.startsWith("customXml/")) assert.deepEqual(zip.bytes(p), before.bytes(p), p);
  }
});
