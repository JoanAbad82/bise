// The core, on the built bundle (office/dist/office.js): what the three
// hosts load is what is tested. Fixtures: office/fixtures (make.mjs).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as office from "../../dist/office.js";

const { core, OfficeError } = office;
const fixtures = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "fixtures");
const fixture = (name) => new Uint8Array(readFileSync(join(fixtures, name)));

const code = (fn) => {
  try {
    fn();
  } catch (e) {
    assert.ok(e instanceof OfficeError, `not an OfficeError: ${e}`);
    return e.code;
  }
  assert.fail("did not throw");
};

test("each fixture says what it is", () => {
  assert.equal(office.kindOf(fixture("tiny.xlsx")), "xlsx");
  assert.equal(office.kindOf(fixture("tiny.pptx")), "pptx");
  assert.equal(office.kindOf(fixture("tiny.docx")), "docx");
  assert.equal(office.openPackage(fixture("tiny.pptx")).main, "ppt/presentation.xml");
  assert.equal(office.kindOf(new Uint8Array([1, 2, 3, 4])), null);
});

test("bytes that are not a zip, or a zip that is not Office, are refused with words", () => {
  assert.equal(code(() => office.openPackage(new Uint8Array([0x25, 0x50, 0x44, 0x46]))), "not_a_zip");
  const zip = core.Zip.empty();
  zip.set("hello.txt", "hi");
  assert.equal(code(() => office.openPackage(zip.write())), "not_office");
});

test("a round trip keeps every part, the unknown one byte for byte", () => {
  for (const name of ["tiny.xlsx", "tiny.pptx", "tiny.docx"]) {
    const a = core.Zip.read(fixture(name));
    const b = core.Zip.read(a.write());
    assert.deepEqual(b.list(), a.list(), name);
    for (const p of a.list()) assert.deepEqual(b.bytes(p), a.bytes(p), `${name}: ${p}`);
    assert.match(b.text("customXml/item1.xml"), /keep me/);
    assert.equal(b.list()[0], "[Content_Types].xml");
  }
});

test("the same parts make the same bytes", () => {
  const a = core.Zip.read(fixture("tiny.docx"));
  assert.deepEqual(a.write(), core.Zip.read(fixture("tiny.docx")).write());
});

test("an XML edit keeps the attributes and namespaces it did not touch", () => {
  const zip = core.Zip.read(fixture("tiny.docx"));
  const doc = core.parseXml(zip.text("word/document.xml"), "word/document.xml");
  const ps = core.descendants(doc, core.NS.w, "p");
  assert.equal(core.attr(ps[1], "paraId", core.NS.w14), "10000002");
  core.descendants(ps[1], core.NS.w, "t")[0].textContent = "Net revenue grew 5% on the quarter.";
  zip.set("word/document.xml", core.writeXml(doc));
  const again = core.parseXml(core.Zip.read(zip.write()).text("word/document.xml"), "x");
  const p = core.descendants(again, core.NS.w, "p")[1];
  assert.equal(core.textOf(p, core.NS.w), "Net revenue grew 5% on the quarter.");
  assert.equal(core.attr(p, "textId", core.NS.w14), "77777777");
  assert.equal(again.documentElement.getAttribute("mc:Ignorable"), "w14");
  assert.match(core.writeXml(again), /^<\?xml version="1.0" encoding="UTF-8" standalone="yes"\?>\n<w:document/);
});

test("bad XML is refused with the part's name", () => {
  const e = (() => {
    try {
      core.parseXml("<a><b></a>", "ppt/slides/slide9.xml");
    } catch (e) {
      return e;
    }
  })();
  assert.equal(e.code, "bad_xml");
  assert.match(e.message, /slide9\.xml/);
});

test("relationships resolve against their part's folder", () => {
  const zip = core.Zip.read(fixture("tiny.pptx"));
  const r = core.rels(zip, "ppt/slides/slide1.xml");
  assert.deepEqual(r.map((x) => x.target), ["ppt/slideLayouts/slideLayout1.xml"]);
  assert.equal(core.relsPath("ppt/presentation.xml"), "ppt/_rels/presentation.xml.rels");
  assert.equal(core.relsPath(""), "_rels/.rels");
  assert.equal(core.resolve("xl/", "../customXml/item1.xml"), "customXml/item1.xml");
  assert.equal(core.resolve("xl/", "/xl/styles.xml"), "xl/styles.xml");
});

test("checkPackage: clean fixtures, then a broken relationship and a bad part", () => {
  for (const name of ["tiny.xlsx", "tiny.pptx", "tiny.docx"]) {
    assert.deepEqual(office.checkPackage(core.Zip.read(fixture(name))), [], name);
  }
  const zip = core.Zip.read(fixture("tiny.pptx"));
  zip.remove("ppt/slides/slide2.xml");
  zip.set("ppt/slides/slide1.xml", "<p:sld>");
  const codes = office.checkPackage(zip).map((p) => p.code).sort();
  assert.deepEqual(codes, ["bad_xml", "broken_rel"]);
});
