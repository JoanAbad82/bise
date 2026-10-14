// What exceljs does not model, carried through a save (architect m_23798:
// edits keep what they do not understand). exceljs writes its parts
// (io.ts render); every original part it did not produce and that a
// relationship still reaches (charts and the drawings that hold them,
// pivot tables and caches, external links, slicers, chartsheets, custom
// properties, printer settings, ...) is copied unchanged, with its rels and
// content type; the elements that point at them (`<drawing r:id>`,
// `<pivotCaches>`, extLst entries, a chartsheet's `<sheet>` row, ...) go
// back into exceljs's XML in schema order with remapped r:ids.
//
// What cannot be carried (a part that hangs on a deleted sheet, a chart
// drawing on a sheet whose pictures changed) is never dropped silently:
// `losses()` names it, and `assemble` refuses (would_lose) unless the
// caller passes its part in `drop`.

import { OfficeError } from "../core/errors.ts";
import { contentTypes, rels as readRels, relsPath, typeOf, type ContentTypes, type Rel } from "../core/opc.ts";
import { attr, children, NS, parseXml, writeXml, type Document, type Element } from "../core/xml.ts";
import { Zip } from "../core/zip.ts";
import { images, type Origin, type Rendered, type XBook } from "./io.ts";

/** A part the save cannot carry, and why. */
export type Loss = { part: string; sheet?: string; why: string };

const T = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/";
const PKG_OWNED = new Set([`${T}officeDocument`, "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties", `${T}extended-properties`]);
const BOOK_OWNED = new Set([`${T}worksheet`, `${T}styles`, `${T}theme`, `${T}sharedStrings`, `${T}calcChain`]);
const SHEET_OWNED = new Set([`${T}hyperlink`, `${T}comments`, `${T}table`, `${T}image`]);

// CT_Worksheet and CT_Workbook children in schema order (ECMA-376 §18.3.1.99, §18.2.27)
const WS_ORDER = "sheetPr dimension sheetViews sheetFormatPr cols sheetData sheetCalcPr sheetProtection protectedRanges scenarios autoFilter sortState dataConsolidate customSheetViews mergeCells phoneticPr conditionalFormatting dataValidations hyperlinks printOptions pageMargins pageSetup headerFooter rowBreaks colBreaks customProperties cellWatches ignoredErrors smartTags drawing legacyDrawing legacyDrawingHF drawingHF picture oleObjects controls webPublishItems tableParts extLst".split(" ");
const WB_ORDER = "fileVersion fileSharing workbookPr workbookProtection bookViews sheets functionGroups externalReferences definedNames calcPr oleSize customWorkbookViews pivotCaches smartTagPr smartTagTypes webPublishing fileRecoveryPr webPublishObjects extLst".split(" ");
// what exceljs never writes: carried from the original when present
const WS_CARRY = new Set("sheetCalcPr protectedRanges scenarios sortState dataConsolidate customSheetViews phoneticPr colBreaks customProperties cellWatches ignoredErrors smartTags drawing legacyDrawing legacyDrawingHF drawingHF oleObjects controls webPublishItems".split(" "));
const WB_CARRY = new Set("fileSharing workbookProtection functionGroups externalReferences oleSize customWorkbookViews pivotCaches smartTagPr smartTagTypes webPublishing fileRecoveryPr webPublishObjects".split(" "));
// extLst entries exceljs models itself (x14 conditional formatting)
const EXT_OWNED = new Set(["{78C0D931-6437-407d-A8EE-F0AAD7539E65}"]);

/** Is this original sheet rel exceljs's (rewritten) or one to carry? */
function sheetRelOwned(origin: Origin, sheetPart: string, rel: Rel, all: Rel[]): boolean {
  if (SHEET_OWNED.has(rel.type)) return true;
  if (rel.type === `${T}drawing`) return origin.keptDrawing.get(sheetPart) !== rel.id;
  // a VML part is exceljs's when it holds the sheet's notes, else (form controls) it is carried
  if (rel.type === `${T}vmlDrawing`) return all.some((r) => r.type === `${T}comments`);
  return false;
}

/** The original sheets' names, by sheetId (losses name the sheet). */
function originalNames(zip: Zip): Map<number, string> {
  const out = new Map<number, string>();
  const root = parseXml(zip.text("xl/workbook.xml") ?? "", "xl/workbook.xml").documentElement!;
  for (const s of children(child1(root, "sheets") ?? root, NS.s, "sheet")) out.set(Number(attr(s, "sheetId")), attr(s, "name") ?? "");
  return out;
}

function child1(e: Element, local: string): Element | undefined {
  return children(e).find((c) => c.localName === local);
}

/** What a save of the book now would lose, [] when nothing. */
export function losses(origin: Origin, book: XBook): Loss[] {
  const out: Loss[] = [];
  const names = originalNames(origin.zip);
  for (const [id, part] of origin.sheetPart) {
    const all = readRels(origin.zip, part);
    const carried = all.filter((r) => !r.external && !sheetRelOwned(origin, part, r, all));
    const sheet = names.get(id) ?? `#${id}`;
    if (!book.getWorksheet(id)) {
      for (const r of carried) out.push({ part: r.target, sheet, why: `it hangs on sheet "${sheet}", which was deleted` });
      continue;
    }
    const kept = origin.keptDrawing.get(part);
    if (kept && images(book, id) !== origin.imagesAtLoad.get(id)) {
      const target = all.find((r) => r.id === kept)?.target ?? kept;
      out.push({ part: target, sheet, why: `sheet "${sheet}" has a chart or shapes in it, and its pictures changed: v1 cannot merge new pictures into that drawing` });
    }
  }
  return out;
}

/** The final package: exceljs's parts plus everything carried. Throws would_lose for a loss not in `drop`. */
export function assemble(origin: Origin | undefined, rendered: Rendered, book: XBook, drop: readonly string[] = []): Zip {
  const zip = Zip.empty();
  for (const [path, data] of rendered.parts) zip.set(path, data);
  if (!origin) return zip;

  const lost = losses(origin, book);
  const refused = lost.filter((l) => !drop.includes(l.part));
  if (refused.length) {
    const list = refused.map((l) => `${l.part} (${l.why})`).join("; ");
    throw new OfficeError("would_lose", `this save would drop ${list}. Undo the change, or pass save({ drop: [${refused.map((l) => JSON.stringify(l.part)).join(", ")}] }) to accept the loss`);
  }
  const dropped = new Set(lost.map((l) => l.part));
  new Carrier(origin, rendered, zip, dropped).run();
  return zip;
}

class Carrier {
  private orig: Zip;
  private origCt: ContentTypes;
  private copied = new Map<string, string>(); // original path -> final path
  private owned: Set<string>;

  constructor(
    private origin: Origin,
    private rendered: Rendered,
    private out: Zip,
    private dropped: Set<string>,
  ) {
    this.orig = origin.zip;
    this.origCt = contentTypes(this.orig);
    this.owned = ownedParts(origin);
  }

  run(): void {
    this.packageLevel();
    this.bookLevel();
    for (const [id, origPart] of this.origin.sheetPart) {
      const outPart = this.rendered.sheetPath.get(id);
      if (outPart) this.sheetLevel(origPart, outPart);
    }
    this.contentTypes();
  }

  /** Copy a part and what its rels reach; its final path (renamed on a clash). */
  private copy(path: string): string {
    const done = this.copied.get(path);
    if (done !== undefined) return done;
    const bytes = this.orig.bytes(path);
    if (bytes === undefined) return path; // a broken rel stays as it was
    if (this.owned.has(path) && this.out.has(path)) return path; // exceljs wrote it: point at that
    let final = path;
    const have = this.out.bytes(path);
    if (have && !same(have, bytes)) final = this.freeName(path);
    this.copied.set(path, final);
    if (!have || final !== path) this.out.set(final, bytes);
    const relsText = this.orig.text(relsPath(path));
    if (relsText !== undefined) {
      const doc = parseXml(relsText, relsPath(path));
      for (const r of children(doc.documentElement!, NS.rel, "Relationship")) {
        if (attr(r, "TargetMode") === "External") continue;
        const target = readRels(this.orig, path).find((x) => x.id === attr(r, "Id"))!.target;
        const now = this.copy(target);
        if (now !== target) r.setAttribute("Target", relative(final, now));
      }
      this.out.set(relsPath(final), writeXml(doc));
    }
    return final;
  }

  private freeName(path: string): string {
    const m = /^(.*?)(\d*)(\.[^./]+)$/.exec(path)!;
    for (let n = 1001; ; n++) {
      const p = `${m[1]}${n}${m[3]}`;
      if (!this.out.has(p) && !this.orig.has(p)) return p;
    }
  }

  /** Carry `rels` (original ids) from `fromOrig` into `toOut`'s rels; old id -> new id. */
  private carryRels(fromOrig: string, toOut: string, carried: Rel[]): Map<string, string> {
    const map = new Map<string, string>();
    if (!carried.length) return map;
    const path = relsPath(toOut);
    const text = this.out.text(path) ?? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${NS.rel}"/>`;
    const doc = parseXml(text, path);
    const root = doc.documentElement!;
    const ids = new Set(children(root, NS.rel, "Relationship").map((r) => attr(r, "Id")));
    let n = ids.size + 1;
    const origDoc = parseXml(this.orig.text(relsPath(fromOrig))!, relsPath(fromOrig));
    const origById = new Map(children(origDoc.documentElement!, NS.rel, "Relationship").map((r) => [attr(r, "Id"), r]));
    for (const rel of carried) {
      while (ids.has(`rId${n}`)) n++;
      const id = `rId${n}`;
      ids.add(id);
      map.set(rel.id, id);
      const el = doc.importNode(origById.get(rel.id)!, true) as Element;
      el.setAttribute("Id", id);
      if (!rel.external) el.setAttribute("Target", relative(toOut, this.copy(rel.target)));
      root.appendChild(el);
    }
    this.out.set(path, writeXml(doc));
    return map;
  }

  private packageLevel(): void {
    const carried = readRels(this.orig, "").filter((r) => !PKG_OWNED.has(r.type));
    if (!carried.length) return;
    const path = relsPath("");
    const doc = parseXml(this.out.text(path)!, path);
    const ids = new Set(children(doc.documentElement!, NS.rel, "Relationship").map((r) => attr(r, "Id")));
    const origDoc = parseXml(this.orig.text(path)!, path);
    let n = ids.size + 1;
    for (const r of children(origDoc.documentElement!, NS.rel, "Relationship")) {
      const rel = carried.find((c) => c.id === attr(r, "Id"));
      if (!rel) continue;
      while (ids.has(`rId${n}`)) n++;
      const el = doc.importNode(r, true) as Element;
      el.setAttribute("Id", `rId${n}`);
      ids.add(`rId${n}`);
      if (!rel.external) el.setAttribute("Target", this.copy(rel.target));
      doc.documentElement!.appendChild(el);
    }
    this.out.set(path, writeXml(doc));
  }

  private bookLevel(): void {
    const book = "xl/workbook.xml";
    const carried = readRels(this.orig, book).filter((r) => !BOOK_OWNED.has(r.type));
    const map = this.carryRels(book, book, carried);
    const doc = parseXml(this.out.text(book)!, book);
    const origRoot = parseXml(this.orig.text(book)!, book).documentElement!;
    const root = doc.documentElement!;
    const have = new Set(children(root).map((e) => e.localName));
    for (const e of children(origRoot)) {
      if (WB_CARRY.has(e.localName ?? "") && !have.has(e.localName)) insert(root, doc, e, WB_ORDER, map);
    }
    this.mergeExt(doc, root, child1(origRoot, "extLst"), WB_ORDER, map);
    scopes(root, origRoot);
    this.chartsheets(doc, root, origRoot, map);
    this.out.set(book, writeXml(doc));
  }

  /** A chartsheet's `<sheet>` row back at its place; definedNames and views re-indexed. */
  private chartsheets(doc: Document, root: Element, origRoot: Element, map: Map<string, string>): void {
    const outSheets = child1(root, "sheets");
    const origSheets = child1(origRoot, "sheets");
    if (!outSheets || !origSheets) return;
    const before = children(outSheets, NS.s, "sheet");
    const rid = (e: Element) => attr(e, "id", NS.r) ?? "";
    const rows = children(origSheets, NS.s, "sheet");
    const ids = new Set(before.map((e) => attr(e, "sheetId")));
    let maxId = Math.max(0, ...[...ids].map(Number), ...rows.map((e) => Number(attr(e, "sheetId"))));
    let added = false;
    rows.forEach((row, i) => {
      if (!map.has(rid(row))) return;
      const el = doc.importNode(row, true) as Element;
      el.setAttributeNS(NS.r, "r:id", map.get(rid(row))!);
      if (ids.has(attr(el, "sheetId") ?? "")) el.setAttribute("sheetId", String(++maxId));
      // after the nearest earlier original row that is still there
      let anchor: Element | undefined;
      for (let j = i - 1; j >= 0 && !anchor; j--) {
        const id = attr(rows[j], "sheetId");
        anchor = children(outSheets, NS.s, "sheet").find((e) => attr(e, "sheetId") === id && e !== el);
      }
      if (anchor) outSheets.insertBefore(el, anchor.nextSibling);
      else outSheets.insertBefore(el, outSheets.firstChild);
      added = true;
    });
    if (!added) return;
    const after = children(outSheets, NS.s, "sheet");
    const index = (old: string | undefined) => (old === undefined ? undefined : String(after.indexOf(before[Number(old)])));
    for (const dn of root.getElementsByTagNameNS(NS.s, "definedName") as unknown as Iterable<Element>) {
      const i = index(attr(dn, "localSheetId"));
      if (i !== undefined) dn.setAttribute("localSheetId", i);
    }
    for (const v of root.getElementsByTagNameNS(NS.s, "workbookView") as unknown as Iterable<Element>) {
      for (const a of ["activeTab", "firstSheet"]) {
        const i = index(attr(v, a));
        if (i !== undefined) v.setAttribute(a, i);
      }
    }
  }

  private sheetLevel(origPart: string, outPart: string): void {
    const all = readRels(this.orig, origPart);
    const carried = all.filter((r) => !sheetRelOwned(this.origin, origPart, r, all) && !this.dropped.has(r.target));
    const map = this.carryRels(origPart, outPart, carried);
    const origText = this.orig.text(origPart);
    if (origText === undefined) return;
    const doc = parseXml(this.out.text(outPart)!, outPart);
    const origRoot = parseXml(origText, origPart).documentElement!;
    const root = doc.documentElement!;
    const have = new Set(children(root).map((e) => e.localName));
    for (const e of children(origRoot)) {
      if (WS_CARRY.has(e.localName ?? "") && !have.has(e.localName)) insert(root, doc, e, WS_ORDER, map);
    }
    this.mergeExt(doc, root, child1(origRoot, "extLst"), WS_ORDER, map);
    this.out.set(outPart, writeXml(doc));
  }

  /** The original extLst's entries exceljs did not write, by uri. */
  private mergeExt(doc: Document, root: Element, origExt: Element | undefined, order: string[], map: Map<string, string>): void {
    if (!origExt) return;
    let ext = child1(root, "extLst");
    const have = new Set(ext ? children(ext).map((e) => attr(e, "uri")) : []);
    for (const e of children(origExt)) {
      const uri = attr(e, "uri");
      if (!uri || EXT_OWNED.has(uri) || have.has(uri) || !idsCarried(e, map)) continue;
      if (!ext) {
        ext = doc.createElementNS(NS.s, "extLst");
        place(root, ext, order);
      }
      ext.appendChild(remap(doc.importNode(e, true) as Element, map));
    }
  }

  /** Every part in the zip has a content type: the carried ones get theirs from the original. */
  private contentTypes(): void {
    const path = "[Content_Types].xml";
    const doc = parseXml(this.out.text(path)!, path);
    const root = doc.documentElement!;
    const now = contentTypes(this.out);
    for (const part of this.out.list()) {
      if (part === path || typeOf(now, part)) continue;
      const from = [...this.copied].find(([, f]) => f === part)?.[0] ?? part;
      const ext = part.slice(part.lastIndexOf(".") + 1).toLowerCase();
      const override = this.origCt.overrides.get(from);
      if (override) {
        const o = doc.createElementNS(NS.ct, "Override");
        o.setAttribute("PartName", `/${part}`);
        o.setAttribute("ContentType", override);
        root.appendChild(o);
        now.overrides.set(part, override);
      } else {
        const d = this.origCt.defaults.get(ext) ?? (ext === "rels" ? "application/vnd.openxmlformats-package.relationships+xml" : undefined);
        if (!d) continue;
        const e = doc.createElementNS(NS.ct, "Default");
        e.setAttribute("Extension", ext);
        e.setAttribute("ContentType", d);
        root.insertBefore(e, children(root, NS.ct, "Override")[0] ?? null);
        now.defaults.set(ext, d);
      }
    }
    this.out.set(path, writeXml(doc));
  }
}

/**
 * A defined name scoped to a sheet (`localSheetId`) comes back scoped:
 * exceljs keeps the scope only for print areas and titles. The original
 * index is mapped to its sheet by sheetId, then to that sheet's index now.
 */
function scopes(root: Element, origRoot: Element): void {
  const origIds = children(child1(origRoot, "sheets") ?? origRoot, NS.s, "sheet").map((s) => attr(s, "sheetId"));
  const nowIds = children(child1(root, "sheets") ?? root, NS.s, "sheet").map((s) => attr(s, "sheetId"));
  const nowNames = children(child1(root, "definedNames") ?? root, NS.s, "definedName");
  for (const d of children(child1(origRoot, "definedNames") ?? origRoot, NS.s, "definedName")) {
    const local = attr(d, "localSheetId");
    if (local === undefined) continue;
    const index = nowIds.indexOf(origIds[Number(local)]);
    if (index < 0) continue;
    const same = nowNames.find((n) => attr(n, "name") === attr(d, "name") && attr(n, "localSheetId") === undefined && n.textContent === d.textContent);
    same?.setAttribute("localSheetId", String(index));
  }
}

/** The original parts exceljs reads and writes again itself: never copied over its output. */
function ownedParts(origin: Origin): Set<string> {
  const zip = origin.zip;
  const out = new Set(["[Content_Types].xml", "_rels/.rels", "docProps/core.xml", "docProps/app.xml", "xl/workbook.xml", "xl/_rels/workbook.xml.rels", "xl/styles.xml", "xl/sharedStrings.xml", "xl/calcChain.xml"]);
  for (const p of zip.list()) {
    if (/^xl\/(theme|media|tables)\//.test(p) || /^xl\/comments\d+\.xml$/.test(p)) out.add(p);
  }
  for (const part of origin.sheetPart.values()) {
    out.add(part);
    out.add(relsPath(part));
    const all = readRels(zip, part);
    for (const r of all) {
      if (r.external || !sheetRelOwned(origin, part, r, all)) continue;
      out.add(r.target);
      out.add(relsPath(r.target));
    }
  }
  return out;
}

/** Are all the r:ids under `e` carried (so the element can come back)? */
function idsCarried(e: Element, map: Map<string, string>): boolean {
  for (const el of [e, ...(e.getElementsByTagName("*") as unknown as Iterable<Element>)]) {
    for (let i = 0; i < el.attributes.length; i++) {
      const a = el.attributes.item(i)!;
      if (a.namespaceURI === NS.r && !map.has(a.value)) return false;
    }
  }
  return true;
}

function remap(e: Element, map: Map<string, string>): Element {
  for (const el of [e, ...(e.getElementsByTagName("*") as unknown as Iterable<Element>)]) {
    for (let i = 0; i < el.attributes.length; i++) {
      const a = el.attributes.item(i)!;
      if (a.namespaceURI === NS.r && map.has(a.value)) a.value = map.get(a.value)!;
    }
  }
  return e;
}

/** Bring an original element into `root` at its schema place, ids remapped; skipped when one of its ids is not carried. */
function insert(root: Element, doc: Document, e: Element, order: string[], map: Map<string, string>): void {
  if (!idsCarried(e, map)) return;
  place(root, remap(doc.importNode(e, true) as Element, map), order);
}

function place(root: Element, el: Element, order: string[]): void {
  const rank = order.indexOf(el.localName ?? "");
  const next = children(root).find((c) => order.indexOf(c.localName ?? "") > rank);
  root.insertBefore(el, next ?? null);
}

/** A rels Target from `from`'s folder to `to` (both part paths). */
export function relative(from: string, to: string): string {
  const a = from.split("/").slice(0, -1);
  const b = to.split("/");
  let i = 0;
  while (i < a.length && i < b.length - 1 && a[i] === b[i]) i++;
  return [...a.slice(i).map(() => ".."), ...b.slice(i)].join("/");
}

function same(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
