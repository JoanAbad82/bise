// The slides module, on the built bundle: open, inspect, at, edit, check,
// save, diff; create from our template; a save with no timers and no
// TextEncoder (bise office run's V8 has neither).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as office from "../../dist/office.js";

const { slides, core, diff, OfficeError } = office;
const here = dirname(fileURLToPath(import.meta.url));
const tiny = () => new Uint8Array(readFileSync(join(here, "..", "..", "fixtures", "tiny.pptx")));
const PNG = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));

const code = async (fn) => {
  try {
    await fn();
  } catch (e) {
    assert.ok(e instanceof OfficeError, `not an OfficeError: ${e}`);
    return e.code;
  }
  assert.fail("did not throw");
};
const codes = (deck) => deck.check().map((p) => p.code).sort();

test("inspect: slides by stable id, shapes by cNvPr id, boxes in points", async () => {
  const deck = await slides.open(tiny());
  const o = deck.inspect();
  assert.equal(o.kind, "pptx");
  assert.deepEqual(o.nodes.map((n) => [n.id, n.anchor.slide]), [["s256", 1], ["s257", 2]]);
  const [title, body] = o.nodes[0].children;
  assert.equal(title.id, "s256/2");
  assert.deepEqual(title.anchor, { kind: "shape", slide: 1, shape: "2" });
  assert.equal(title.text, "Q3 review");
  assert.deepEqual(title.props.box, [48, 36, 864, 90]);
  assert.equal(title.props.fontSize, 24);
  assert.equal(body.text, "Revenue up 4%");
  assert.deepEqual([o.nodes[0].props.w, o.nodes[0].props.h], [960, 540]);
  assert.deepEqual(deck.check(), []);
});

test("a save with no edit keeps every part's bytes, the unknown one too", async () => {
  const before = core.Zip.read(tiny());
  const deck = await slides.open(tiny());
  deck.inspect();
  deck.check();
  const after = core.Zip.read(await deck.save());
  assert.deepEqual(after.list(), before.list());
  for (const p of before.list()) assert.deepEqual(after.bytes(p), before.bytes(p), p);
});

test("an edit keeps what it does not know: attributes, extensions, other parts", async () => {
  const zip = core.Zip.read(tiny());
  const slide = zip.text("ppt/slides/slide1.xml")
    .replace('<p:cNvPr id="3" name="Body"/>', '<p:cNvPr id="3" name="Body" bise:mark="kept" xmlns:bise="urn:bise:test"/>')
    .replace("</p:sld>", '<p:extLst><p:ext uri="{BISE-TEST}"><bise:x xmlns:bise="urn:bise:test">kept</bise:x></p:ext></p:extLst></p:sld>');
  zip.set("ppt/slides/slide1.xml", slide);
  const deck = await slides.open(zip.write());
  deck.at({ kind: "shape", slide: 1, shape: "3" }).replace("4%", "5%");
  const out = core.Zip.read(await deck.save());
  const xml = out.text("ppt/slides/slide1.xml");
  assert.match(xml, /Revenue up 5%/);
  assert.match(xml, /bise:mark="kept"/);
  assert.match(xml, /<bise:x xmlns:bise="urn:bise:test">kept<\/bise:x>/);
  assert.deepEqual(out.bytes("customXml/item1.xml"), zip.bytes("customXml/item1.xml"));
  assert.deepEqual(out.bytes("ppt/slides/slide2.xml"), zip.bytes("ppt/slides/slide2.xml"));
  assert.deepEqual(office.checkPackage(out), []);
});

test("replace works across runs and keeps each run's style; a missing word is not_found", async () => {
  const zip = core.Zip.read(tiny());
  zip.set(
    "ppt/slides/slide2.xml",
    zip.text("ppt/slides/slide2.xml").replace(
      '<a:r><a:rPr lang="en-US" sz="2400"/><a:t>Next steps</a:t></a:r>',
      '<a:r><a:rPr lang="en-US" sz="2400" b="1"/><a:t>Revenue Q</a:t></a:r><a:r><a:rPr lang="en-US" sz="2400"/><a:t>2 up</a:t></a:r>',
    ),
  );
  const deck = await slides.open(zip.write());
  const sel = deck.at({ kind: "shape", slide: 2, shape: "2", quote: "Q2" });
  assert.equal(sel.quote, "Q2");
  sel.replace(sel.quote, "Q3");
  assert.equal(sel.text(), "Revenue Q3 up");
  const xml = core.Zip.read(await deck.save()).text("ppt/slides/slide2.xml");
  assert.match(xml, /b="1"\/><a:t>Revenue Q3<\/a:t>/);
  assert.equal(await code(() => sel.replace("Q9", "x")), "not_found");
});

test("at: the anchors of a deck, and words for the others", async () => {
  const deck = await slides.open(tiny());
  assert.equal(deck.at({ kind: "slide", slide: 2 }).index, 2);
  assert.equal(deck.at({ kind: "shape", slide: 1, shape: "2" }).node.text, "Q3 review");
  assert.equal(await code(() => deck.at({ kind: "slide", slide: 9 })), "not_found");
  assert.equal(await code(() => deck.at({ kind: "shape", slide: 1, shape: "99" })), "not_found");
  assert.equal(await code(() => deck.at({ kind: "cell", sheet: "Q3", range: "B4" })), "anchor_kind_mismatch");
  assert.equal(await code(() => deck.at({ kind: "slide" })), "anchor_shape");
  const under = deck.at({ kind: "slide", slide: 1, rect: { x: 10, y: 30, w: 20, h: 20 } }).under();
  assert.deepEqual(under.map((s) => s.id), ["3"]);
});

test("create: a 16:9 deck with six layouts; title and placeholders inherit the master's style", async () => {
  const deck = await slides.create();
  assert.deepEqual(deck.size, { w: 960, h: 540 });
  assert.equal(deck.count, 0);
  assert.deepEqual(deck.layouts().map((l) => l.key), ["title", "title-body", "two-content", "section", "title-only", "blank"]);
  const s = deck.addSlide({ layout: "title" });
  s.placeholder("title").setText("Q3 review");
  s.placeholder("subTitle").setText("Finance, October");
  const b = deck.addSlide();
  b.placeholder("title").setText("Revenue");
  b.placeholder("body").setText([{ text: "Up 4%" }, { text: "North leads", level: 2 }]);
  const o = deck.inspect();
  const t = o.nodes[0].children[0];
  assert.deepEqual([t.props.placeholder, t.props.fontSize, t.props.bold, t.props.align, t.props.font, t.props.color], ["ctrTitle", 48, true, "center", "Arial", "#1f2328"]);
  assert.deepEqual(t.props.box, [96, 150, 768, 130]);
  const body = o.nodes[1].children[1];
  assert.deepEqual(body.props.paras.map((p) => [p.text, p.level, p.size, !!p.bullet]), [["Up 4%", 1, 24, true], ["North leads", 2, 20, true]]);
  assert.deepEqual(deck.check(), []);
  const bytes = await deck.save();
  assert.deepEqual(office.checkPackage(core.Zip.read(bytes)), []);
  const again = await slides.open(bytes);
  assert.deepEqual(diff(o, again.inspect()), { added: [], removed: [], changed: [] });
  assert.deepEqual((await slides.create({ size: "4:3" })).size, { w: 720, h: 540 });
  assert.equal(await code(() => slides.create({ size: "21:9" })), "bad_arg");
  assert.equal(await code(() => deck.addSlide({ layout: "nope" })), "not_found");
});

test("check: overflow, off the slide, overlap, small text, empty placeholder, empty slide", async () => {
  const deck = await slides.create();
  const s = deck.addSlide({ layout: "blank" });
  s.addText("A sentence long enough to need many lines in a box this narrow, surely more than fit.", [40, 40, 120, 40], { size: 18 });
  s.addText("off", [1000, 40, 100, 40]);
  s.addText("half out", [900, 400, 120, 40]);
  s.addText("one", [400, 300, 200, 60]);
  s.addText("two", [420, 310, 200, 60]);
  s.addText("tiny", [40, 480, 200, 30], { size: 8 });
  deck.addSlide({ layout: "title-body" });
  deck.addSlide({ layout: "blank" });
  assert.deepEqual(codes(deck), ["empty_placeholder", "empty_placeholder", "empty_slide", "off_slide", "off_slide", "overflow", "overlap", "small_text"]);
  const over = deck.check().find((p) => p.code === "overflow");
  assert.equal(over.severity, "error");
  assert.deepEqual(over.at, { kind: "shape", slide: 1, shape: "2" });
  // the fix: a taller box
  deck.at(over.at).move({ h: 200 });
  assert.ok(!codes(deck).includes("overflow"));
});

test("shapes, tables, charts and images round trip; removing them takes their parts", async () => {
  const deck = await slides.create();
  const s = deck.addSlide({ layout: "title-only" });
  s.placeholder("title").setText("Revenue");
  const shape = s.addShape("roundRect", [48, 120, 200, 80], { fill: "#1f6feb", text: "Up 4%", style: { size: 20, bold: true } });
  const table = s.addTable([["Region", "Revenue"], ["North", "120"], ["South", "80"]], [48, 220, 400, 120]);
  table.setCell(3, 2, "85");
  const chart = s.addChart({ type: "column", title: "By month", categories: ["Jul", "Aug", "Sep"], series: [{ name: "Revenue", values: [120, 140, 155] }] }, [480, 120, 432, 300]);
  const pic = s.addImage(PNG, [48, 360, 80]);
  assert.deepEqual(pic.node.props.box, [48, 360, 80, 80]);
  const again = await slides.open(await deck.save());
  const nodes = again.inspect().nodes[0].children;
  const by = Object.fromEntries(nodes.map((n) => [n.id.split("/")[1], n]));
  assert.equal(by[shape.id].props.fill, "#1f6feb");
  assert.equal(by[shape.id].props.fontSize, 20);
  assert.deepEqual(by[table.id].props.rows, [["Region", "Revenue"], ["North", "120"], ["South", "85"]]);
  assert.deepEqual(by[chart.id].props.chart, { type: "column", title: "By month", categories: ["Jul", "Aug", "Sep"], series: [{ name: "Revenue", values: [120, 140, 155], color: "#4472c4" }] });
  assert.equal(by[pic.id].props.image, "ppt/media/image1.png");
  assert.deepEqual(again.check(), []);
  const zip = core.Zip.read(await again.save());
  assert.ok(zip.has("ppt/charts/chart1.xml") && zip.has("ppt/media/image1.png"));
  // the chart's workbook, embedded as PowerPoint does: its cells are the chart's data
  const wb = await office.sheets.open(zip.bytes("ppt/embeddings/Microsoft_Excel_Worksheet1.xlsx"));
  assert.deepEqual(wb.range("Sheet1!A1:B4").values(), [["", "Revenue"], ["Jul", 120], ["Aug", 140], ["Sep", 155]]);
  assert.match(zip.text("ppt/charts/chart1.xml"), /<c:externalData r:id="rId1">/);
  assert.match(zip.text("[Content_Types].xml"), /Extension="png"/);
  again.at({ kind: "shape", slide: 1, shape: chart.id }).remove();
  again.at({ kind: "shape", slide: 1, shape: pic.id }).remove();
  const gone = core.Zip.read(await again.save());
  assert.ok(!gone.has("ppt/charts/chart1.xml") && !gone.has("ppt/media/image1.png") && !gone.has("ppt/embeddings/Microsoft_Excel_Worksheet1.xlsx"));
  assert.doesNotMatch(gone.text("[Content_Types].xml"), /chart1/);
  assert.deepEqual(office.checkPackage(gone), []);
  assert.equal(await code(() => s.addChart({ type: "pie", categories: ["a"], series: [{ name: "x", values: [1] }, { name: "y", values: [2] }] }, [0, 0, 10, 10])), "bad_arg");
  assert.equal(await code(() => s.addImage(new Uint8Array([1, 2, 3]), [0, 0, 10, 10])), "bad_arg");
  assert.equal(await code(() => s.addText("x", [0, 0, 0, 10])), "bad_arg");
  assert.equal(await code(() => shape.fill("blue")), "bad_arg");
});

test("a chart's names with < & \" and a leading = reach its embedded workbook as text", async () => {
  const deck = await slides.create();
  const names = ['R&D <net> "Q3"', "=SUM(A1)"];
  deck.addSlide({ layout: "blank" }).addChart({ type: "bar", categories: ["<a>", "b & c"], series: names.map((name, i) => ({ name, values: [i, i + 1] })) }, [48, 48, 600, 400]);
  const bytes = await deck.save();
  const zip = core.Zip.read(bytes);
  assert.deepEqual(office.checkPackage(zip), []);
  const wb = await office.sheets.open(zip.bytes("ppt/embeddings/Microsoft_Excel_Worksheet1.xlsx"));
  const cells = wb.range("Sheet1!A1:C3").values();
  assert.equal(cells[0][1], names[0]);
  assert.equal(cells[0][2], "'=SUM(A1)"); // Excel's quote prefix: text, not a formula
  assert.deepEqual(cells.slice(1).map((r) => r[0]), ["<a>", "b & c"]);
  // the chart itself keeps the names exactly
  const chart = (await slides.open(bytes)).inspect().nodes[0].children[0].props.chart;
  assert.deepEqual(chart.series.map((s) => s.name), names);
  assert.deepEqual(chart.categories, ["<a>", "b & c"]);
});

test("slides move, duplicate (charts copied) and go; ids stay, diff says what changed", async () => {
  const deck = await slides.open(tiny());
  const before = deck.inspect();
  const s1 = deck.slide(1);
  s1.addChart({ type: "line", categories: ["a", "b"], series: [{ name: "x", values: [1, 2] }] }, [480, 300, 400, 200]);
  const copy = s1.duplicate();
  assert.equal(copy.index, 2);
  deck.slide(3).moveTo(1);
  const o = deck.inspect();
  assert.deepEqual(o.nodes.map((n) => n.id), ["s257", "s256", "s258"]);
  const zip = core.Zip.read(await deck.save());
  assert.ok(zip.has("ppt/charts/chart1.xml") && zip.has("ppt/charts/chart2.xml"));
  // the copy has its own workbook
  assert.ok(zip.has("ppt/embeddings/Microsoft_Excel_Worksheet1.xlsx") && zip.has("ppt/embeddings/Microsoft_Excel_Worksheet2.xlsx"));
  assert.match(zip.text("ppt/charts/_rels/chart2.xml.rels"), /Microsoft_Excel_Worksheet2\.xlsx/);
  assert.deepEqual(office.checkPackage(zip), []);
  deck.slide(3).remove();
  deck.slide(2).remove();
  const d = diff(before, deck.inspect());
  assert.deepEqual(d.removed.map((n) => n.id), ["s256", "s256/2", "s256/3"]);
  assert.deepEqual(d.changed.map((c) => [c.after.id, c.fields]), [["s257", ["anchor", "props"]], ["s257/2", ["anchor"]]]);
  const left = core.Zip.read(await deck.save());
  assert.ok(!left.has("ppt/slides/slide1.xml") && !left.has("ppt/charts/chart1.xml") && !left.has("ppt/charts/chart2.xml"));
  assert.ok(!left.list().some((p) => p.startsWith("ppt/embeddings/")));
  assert.deepEqual(office.checkPackage(left), []);
  assert.equal(await code(() => s1.shapes()), "not_found");
});

test("a deck is made and saved with no timers and no TextEncoder (bise office run's V8)", async () => {
  const names = ["setTimeout", "setInterval", "setImmediate", "clearTimeout", "clearInterval", "TextEncoder", "TextDecoder"];
  const saved = Object.fromEntries(names.map((n) => [n, globalThis[n]]));
  for (const n of names) delete globalThis[n];
  try {
    const bare = await import("../../dist/office.js?slides-bare");
    const deck = await bare.slides.create();
    const s = deck.addSlide({ layout: "title-body" });
    s.placeholder("title").setText("Revue T3 — été");
    s.addChart({ type: "pie", categories: ["a", "b"], series: [{ name: "x", values: [1, 2] }] }, [480, 120, 300, 300]);
    const again = await bare.slides.open(await deck.save());
    assert.equal(again.inspect().nodes[0].children[0].text, "Revue T3 — été");
  } finally {
    Object.assign(globalThis, saved);
  }
});
