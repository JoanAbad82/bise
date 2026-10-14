// The docs module (docx), on the built bundle: outline, edits by id that
// keep what they do not touch, tracked changes, comments, tables, create,
// check, diff. Fixtures: office/fixtures (make.mjs); the rest made here.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { docs, diff, flatten, core, OfficeError } from "../../dist/office.js";
import { sample } from "./docs-sample.mjs";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "fixtures");
const fixture = (name) => new Uint8Array(readFileSync(join(fixtures, name)));
const now = () => new Date(Date.UTC(2026, 9, 14, 9, 0, 0));
const tiny = () => docs.open(fixture("tiny.docx"), { author: "Ada", now });
const para = (id, quote) => (quote ? { kind: "para", para: id, quote } : { kind: "para", para: id });
const xmlOf = async (doc, part = "word/document.xml") => core.Zip.read(await doc.save()).text(part);

const rejects = async (fn, code) => {
  try {
    await fn();
  } catch (e) {
    assert.ok(e instanceof OfficeError, `not an OfficeError: ${e}`);
    assert.equal(e.code, code, e.message);
    return e;
  }
  assert.fail("did not throw");
};

// a docx with no paraIds, no w14 namespace, and a bold run: the shape other tools write
function foreign() {
  const zip = core.Zip.read(fixture("tiny.docx"));
  const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  zip.set(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="${W}"><w:body>` +
      `<w:p><w:r><w:t>Plain </w:t></w:r><w:r><w:rPr><w:b/><w:color w:val="C00000"/></w:rPr><w:t>bold words</w:t></w:r><w:r><w:t xml:space="preserve"> after.</w:t></w:r></w:p>` +
      `<w:p><w:r><w:t>Second</w:t></w:r></w:p><w:sectPr/></w:body></w:document>`,
  );
  return zip.write();
}

test("inspect: paragraphs in document order, a table's paragraphs as its children, heading levels", async () => {
  const doc = await tiny();
  const o = doc.inspect();
  assert.equal(o.kind, "docx");
  assert.deepEqual(o.nodes.map((n) => [n.id, n.type]), [["10000001", "para"], ["10000002", "para"], ["table:10000003", "table"], ["10000007", "para"]]);
  assert.deepEqual(o.nodes[0].props, { style: "Heading1", level: 1 });
  assert.deepEqual(o.nodes[0].anchor, { kind: "para", para: "10000001" });
  const t = o.nodes[2];
  assert.deepEqual(t.props, { rows: 2, cols: 2 });
  assert.deepEqual(t.children.map((c) => [c.text, c.props.cell]), [["Region", { row: 1, col: 1 }], ["Revenue", { row: 1, col: 2 }], ["North", { row: 2, col: 1 }], ["120", { row: 2, col: 2 }]]);
  assert.equal(doc.text(), "Q3 review\nNet revenue grew 4% on the quarter.\nRegion\nRevenue\nNorth\n120\nNext: the pricing page.");
  assert.deepEqual(doc.check(), []);
});

test("a round trip with no edit keeps every part byte for byte, the unknown one too", async () => {
  const before = core.Zip.read(fixture("tiny.docx"));
  const after = core.Zip.read(await (await tiny()).save());
  assert.deepEqual(after.list(), before.list());
  for (const p of before.list()) assert.deepEqual(after.bytes(p), before.bytes(p), p);
});

test("an edit keeps the parts it did not touch, and the attributes it did not touch", async () => {
  const doc = await tiny();
  doc.at(para("10000002")).replace("4%", "5%");
  const before = core.Zip.read(fixture("tiny.docx"));
  const after = core.Zip.read(await doc.save());
  for (const p of before.list()) if (p !== "word/document.xml") assert.deepEqual(after.bytes(p), before.bytes(p), p);
  const xml = after.text("word/document.xml");
  assert.match(xml, /mc:Ignorable="w14"/);
  assert.match(xml, /<w:pgMar w:top="1440"[^>]*w:gutter="0"\/>/);
  assert.match(xml, /w14:paraId="10000002" w14:textId="77777777"/);
});

test("paragraphs with no id get one: the same for the same bytes, kept once saved, w14 declared and ignorable", async () => {
  const bytes = foreign();
  const a = (await docs.open(bytes)).inspect().nodes.map((n) => n.id);
  const b = (await docs.open(bytes)).inspect().nodes.map((n) => n.id);
  assert.deepEqual(a, b);
  for (const id of a) assert.match(id, /^[0-7][0-9A-F]{7}$/);
  assert.notEqual(a[0], a[1]);
  // a save with no edit keeps the bytes: the ids are not written
  const plain = core.Zip.read(await (await docs.open(bytes)).save());
  assert.deepEqual(plain.bytes("word/document.xml"), core.Zip.read(bytes).bytes("word/document.xml"));
  // an edit writes them, and they stay
  const doc = await docs.open(bytes);
  doc.at(para(a[1])).insert("!");
  const saved = await doc.save();
  const xml = core.Zip.read(saved).text("word/document.xml");
  assert.match(xml, /xmlns:w14="http:\/\/schemas.microsoft.com\/office\/word\/2010\/wordml"/);
  assert.match(xml, /mc:Ignorable="w14"/);
  assert.deepEqual((await docs.open(saved)).inspect().nodes.map((n) => n.id), a);
});

test("replace splits runs and keeps the format of what it does not touch", async () => {
  const doc = await docs.open(foreign());
  const id = doc.inspect().nodes[0].id;
  const sel = doc.at(para(id));
  assert.equal(sel.text, "Plain bold words after.");
  assert.equal(sel.replace("words", "ideas"), 1);
  assert.equal(sel.text, "Plain bold ideas after.");
  const xml = await xmlOf(doc);
  // "bold " and "ideas" both stay bold and red
  assert.match(xml, /<w:r><w:rPr><w:b\/><w:color w:val="C00000"\/><\/w:rPr><w:t[^>]*>bold <\/w:t><\/w:r>/);
  assert.match(xml, /<w:r><w:rPr><w:b\/><w:color w:val="C00000"\/><\/w:rPr><w:t[^>]*>ideas<\/w:t><\/w:r>/);
  // a regexp with groups, across runs
  assert.equal(sel.replace(/(\w+) after/, "$1 before"), 1);
  assert.equal(sel.text, "Plain bold ideas before.");
  assert.equal(doc.replaceAll("Plain", "Clear"), 1);
  assert.equal(sel.text, "Clear bold ideas before.");
});

test("insert, setText, format and style on a paragraph", async () => {
  const doc = await tiny();
  const s = doc.at(para("10000007"));
  s.insert(" Then the FAQ.");
  s.insert("→ ", "start");
  assert.equal(s.text, "→ Next: the pricing page. Then the FAQ.");
  s.format({ bold: true, color: "#1F4E79" }, { quote: "pricing page" });
  s.style("Heading2");
  s.align("center");
  const n = doc.inspect().nodes.at(-1);
  assert.deepEqual(n.props, { style: "Heading2", level: 2, align: "center" });
  const xml = await xmlOf(doc);
  assert.match(xml, /<w:rPr><w:b\/><w:color w:val="1F4E79"\/><\/w:rPr><w:t[^>]*>pricing page<\/w:t>/);
  assert.match(xml, /<w:pPr><w:pStyle w:val="Heading2"\/><w:jc w:val="center"\/><\/w:pPr>/);
  assert.match(await xmlOf(doc, "word/styles.xml"), /w:styleId="Heading2"/);
  s.setText("Done.");
  assert.equal(doc.at(para("10000007")).text, "Done.");
  await rejects(() => s.style("NoSuchStyle"), "bad_arg");
  await rejects(() => s.insert("x", 99), "bad_arg");
});

test("tracked edits: a replace is a deletion and an insertion; accept and reject settle them", async () => {
  const doc = await tiny();
  doc.tracking = true;
  doc.at(para("10000002")).replace("4%", "5%");
  doc.at(para("10000007")).remove();
  doc.add({ kind: "para", text: "Added line." });
  const list = doc.changes.list();
  assert.deepEqual(
    list.map((c) => [c.kind, c.text, c.author]),
    [
      ["insert", "5%", "Ada"],
      ["delete", "4%", "Ada"],
      ["para-delete", "", "Ada"],
      ["delete", "Next: the pricing page.", "Ada"],
      ["para-insert", "", "Ada"],
      ["insert", "Added line.", "Ada"],
    ],
  );
  assert.equal(list[0].date, "2026-10-14T09:00:00Z");
  assert.equal(new Set(list.map((c) => c.id)).size, list.length, "change ids are unique");
  assert.ok(doc.check().some((p) => p.code === "open_changes"));
  // the outline shows the text as it reads with the changes in, and the changes as children
  const n2 = doc.inspect().nodes[1];
  assert.equal(n2.text, "Net revenue grew 5% on the quarter.");
  assert.deepEqual(n2.children.map((c) => [c.type, c.props.kind]), [["change", "insert"], ["change", "delete"]]);

  const saved = await doc.save();
  const accepted = await docs.open(saved);
  assert.equal(accepted.changes.accept(), 6);
  assert.equal(accepted.text(), "Q3 review\nNet revenue grew 5% on the quarter.\nRegion\nRevenue\nNorth\n120\nAdded line.");
  assert.deepEqual(accepted.changes.list(), []);
  assert.deepEqual(accepted.check(), []);

  const rejected = await docs.open(saved);
  rejected.changes.reject();
  assert.equal(rejected.text(), "Q3 review\nNet revenue grew 4% on the quarter.\nRegion\nRevenue\nNorth\n120\nNext: the pricing page.");
  assert.doesNotMatch(await xmlOf(rejected), /w:del |w:ins |delText/);

  // one change by id
  const one = await docs.open(saved);
  const del = one.changes.list().find((c) => c.text === "4%");
  assert.equal(one.changes.reject(del.id), 1);
  assert.equal(one.at(para("10000002")).text, "Net revenue grew 5%4% on the quarter.");
  await rejects(() => one.changes.accept("999"), "not_found");
});

test("tracked format change: rejected, the old format comes back", async () => {
  const doc = await docs.open(foreign(), { now });
  const id = doc.inspect().nodes[0].id;
  doc.at(para(id)).format({ italic: true }, { quote: "Plain", track: true });
  const [c] = doc.changes.list();
  assert.equal(c.kind, "format");
  assert.match(await xmlOf(doc), /<w:rPr><w:i\/><w:rPrChange [^>]*><w:rPr\/><\/w:rPrChange><\/w:rPr>/);
  doc.changes.reject();
  assert.doesNotMatch(await xmlOf(doc), /<w:i\/>|rPrChange/);
});

test("comments: add on a quote, reply, resolve, read back after a save, remove", async () => {
  const doc = await tiny();
  const c = doc.at(para("10000002", "grew 4%")).comment("Source for 4%?");
  assert.deepEqual([c.id, c.author, c.text, c.para, c.quote, c.done], ["0", "Ada", "Source for 4%?", "10000002", "grew 4%", false]);
  const whole = doc.comments.add(para("10000001"), "Title ok.\nKeep it short.");
  assert.equal(whole.quote, "Q3 review");
  assert.equal(whole.text, "Title ok.\nKeep it short.");
  doc.author = "Bob";
  const r = doc.comments.reply(c.id, "Finance deck, slide 4.");
  assert.equal(r.replyTo, c.id);
  assert.equal(r.quote, "grew 4%");
  doc.comments.resolve(c.id);
  // the text did not change
  assert.equal(doc.at(para("10000002")).text, "Net revenue grew 4% on the quarter.");

  const again = await docs.open(await doc.save());
  const list = again.comments.list();
  assert.deepEqual(list.map((x) => [x.id, x.author, x.replyTo ?? null, x.done]), [["0", "Ada", null, true], ["1", "Ada", null, false], ["2", "Bob", "0", false]]);
  const node = again.inspect().nodes[1];
  assert.deepEqual(node.children.map((k) => [k.id, k.type, k.anchor.quote]), [["comment:0", "comment", "grew 4%"], ["comment:2", "comment", "grew 4%"]]);
  assert.deepEqual(again.check(), []);
  const zip = core.Zip.read(await again.save());
  assert.match(zip.text("[Content_Types].xml"), /comments\+xml/);
  assert.match(zip.text("[Content_Types].xml"), /commentsExtended\+xml/);
  assert.match(zip.text("word/_rels/document.xml.rels"), /relationships\/comments"/);

  again.comments.remove("0");
  assert.deepEqual(again.comments.list().map((x) => x.id), ["1"]);
  assert.doesNotMatch(await xmlOf(again), /w:id="0"|w:id="2"/);
  assert.deepEqual(again.check(), []);
  await rejects(() => again.comments.reply("42", "x"), "not_found");
  await rejects(() => again.at(para("10000002")).comment("x", { quote: "absent" }), "not_found");
});

test("tables: read, set a cell, add and remove rows, tracked or not", async () => {
  const doc = await tiny();
  const t = doc.table(para("10000003"));
  assert.deepEqual(t.rows, [["Region", "Revenue"], ["North", "120"]]);
  t.setCell(2, 2, "125");
  t.addRow(["South", "80"]);
  t.addRow(["Total", "205"], { after: 3 });
  assert.deepEqual(t.rows, [["Region", "Revenue"], ["North", "125"], ["South", "80"], ["Total", "205"]]);
  t.removeRow(3);
  assert.deepEqual(t.rows.map((r) => r[0]), ["Region", "North", "Total"]);
  t.removeRow(3, { track: true });
  assert.deepEqual(doc.changes.list().map((c) => c.kind), ["row-delete", "delete", "delete"]);
  doc.changes.accept();
  assert.deepEqual(t.rows, [["Region", "Revenue"], ["North", "125"]]);
  assert.equal(t.node.props.rows, 2);
  assert.equal(doc.at(para("10000006")).table().rows.length, 2);
  await rejects(() => t.cell(9, 9), "not_found");
  await rejects(() => doc.table(para("10000001")), "not_found");
  assert.deepEqual(doc.check(), []);
});

test("at(): by id, by quote when the id is gone, refusals with words", async () => {
  const doc = await tiny();
  assert.equal(doc.at(para("10000004")).text, "Revenue");
  assert.deepEqual(doc.at(para("10000002", "4%")).quote, { start: 17, end: 19, text: "4%" });
  // Word renamed the paragraph: the note's quote finds it
  assert.equal(doc.at(para("7FFFFFFF", "pricing page")).node.id, "10000007");
  await rejects(() => doc.at(para("7FFFFFFF")), "not_found");
  await rejects(() => doc.at({ kind: "cell", sheet: "Q3", range: "B4" }), "anchor_kind_mismatch");
  await rejects(() => doc.at({ kind: "para" }), "anchor_shape");
  assert.deepEqual(doc.find("the"), [para("10000002", "the"), para("10000007", "the")]);
});

test("open refuses what is not a docx", async () => {
  await rejects(() => docs.open(fixture("tiny.pptx")), "not_office");
  await rejects(() => docs.open(new Uint8Array([1, 2, 3])), "not_a_zip");
});

test("create: every block kind, a comment and a tracked change; check() says only the open change", async () => {
  const doc = await sample();
  const o = doc.inspect();
  const paras = flatten(o).filter((n) => n.type === "para");
  assert.deepEqual(
    paras.map((n) => n.text),
    ["Q3 review", "Summary", "Revenue rose 4% on the quarter. Details", "North up 6%", "South flat", "Ship pricing", "Numbers", "Region", "Revenue", "North", "120", "South", "80", "Plain words win.", "", "", "Appendix."],
  );
  const byText = (t) => paras.find((n) => n.text === t);
  assert.deepEqual(byText("Q3 review").props, { style: "Title", level: 0 });
  assert.deepEqual(byText("North up 6%").props.list, { level: 1, ordered: false });
  assert.deepEqual(byText("South flat").props.list, { level: 2, ordered: false });
  assert.deepEqual(byText("Ship pricing").props.list, { level: 1, ordered: true });
  assert.deepEqual(byText("Revenue rose 4% on the quarter. Details").props.links, ["https://example.com/q3"]);
  assert.equal(paras.find((n) => n.props?.images).props.images[0].alt, "a chart");
  assert.deepEqual(byText("Appendix.").props.align, "justify");
  assert.deepEqual(doc.check().map((p) => p.code), ["open_changes"]);

  const zip = core.Zip.read(await doc.save());
  assert.ok(zip.has("word/media/image1.png"));
  assert.match(zip.text("[Content_Types].xml"), /Extension="png"/);
  assert.match(zip.text("docProps/core.xml"), /<dc:title>Q3 review<\/dc:title>/);
  assert.match(zip.text("word/numbering.xml"), /w:numFmt w:val="bullet"/);
  // the reopened file reads the same
  const again = await docs.open(await doc.save());
  assert.deepEqual(diff(o, again.inspect()), { added: [], removed: [], changed: [] });
});

test("check(): the problems an agent must fix, each with where it is", async () => {
  const doc = await tiny();
  doc.add({ kind: "heading", text: "Deep", level: 3 });
  doc.add({ kind: "para", text: "Owner: TBD" });
  const zip = core.Zip.read(await doc.save());
  let xml = zip.text("word/document.xml");
  xml = xml.replace('<w:pStyle w:val="Heading1"/>', '<w:pStyle w:val="Heading 1"/>');
  xml = xml.replace('w14:paraId="10000005"', 'w14:paraId="10000004"');
  xml = xml.replace("<w:t xml:space=\"preserve\">Next", '<w:t xml:space="preserve">Next</w:t></w:r><w:commentRangeStart w:id="7"/><w:r><w:t xml:space="preserve">');
  zip.set("word/document.xml", xml);
  const bad = await docs.open(zip.write());
  const codes = bad.check().map((p) => [p.code, p.severity, p.at?.para ?? null]);
  assert.deepEqual(codes.map((c) => c[0]).sort(), ["dangling_comment", "heading_skip", "missing_style", "para_id_renamed", "placeholder"]);
  const renamed = bad.check().find((p) => p.code === "para_id_renamed");
  assert.equal(renamed.severity, "info");
  assert.match(renamed.message, /10000004/);
  assert.equal(bad.at(renamed.at).text, "North");
  assert.deepEqual(codes.find((c) => c[0] === "missing_style"), ["missing_style", "warning", "10000001"]);
  assert.equal(bad.check().find((p) => p.code === "placeholder").at.quote, "TBD");
  // a paraId twice: the second paragraph gets a new id, anchors stay unambiguous
  const ids = flatten(bad.inspect()).filter((n) => n.type === "para").map((n) => n.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(bad.at(para("10000004")).text, "Revenue");
});

test("diff between two versions: by paragraph id, comments and changes as their own nodes", async () => {
  const doc = await tiny();
  const v1 = doc.inspect();
  doc.at(para("10000002")).replace("4%", "5%");
  doc.at(para("10000004")).comment("check this");
  const added = doc.add({ kind: "para", text: "New." }, { after: para("10000001") });
  const v2 = doc.inspect();
  const d = diff(v1, v2);
  assert.deepEqual(d.changed.map((c) => [c.after.id, c.fields]), [["10000002", ["text"]]]);
  assert.deepEqual(d.added.map((n) => n.id).sort(), [added.node.id, "comment:0"].sort());
  assert.deepEqual(v2.nodes.map((n) => n.id).slice(0, 2), ["10000001", added.node.id]);
  assert.deepEqual(d.removed, []);
});

test("bad block specs are refused with what a block is", async () => {
  const doc = await docs.create();
  await rejects(() => doc.add({ kind: "chart" }), "bad_arg");
  await rejects(() => doc.add({ kind: "heading", text: "x", level: 9 }), "bad_arg");
  await rejects(() => doc.add({ kind: "table", rows: [] }), "bad_arg");
  await rejects(() => doc.add({ kind: "image", bytes: new Uint8Array([1, 2, 3]) }), "bad_arg");
  assert.deepEqual(doc.check().map((p) => p.code), ["empty"]);
});
