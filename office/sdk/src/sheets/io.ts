// xlsx bytes <-> an exceljs Workbook, without exceljs's XLSX class (JSZip,
// streams, fs, timers): its model and xforms driven over our zip (fflate)
// and a sync SAX pass (saxes), so it runs in bise office run (V8 alone)
// and in the viewer. Ported from exceljs 4.4 lib/xlsx/xlsx.js load/write.
//
// `load` also says what exceljs does not model, for carry.ts: which sheet
// part each sheet came from, and the drawings that hold more than pictures
// (charts, shapes): those are kept whole, never parsed into the model.

import { SaxesParser } from "saxes";
import Workbook from "exceljs/lib/doc/workbook.js";
import XmlStream from "exceljs/lib/utils/xml-stream.js";
import theme1 from "exceljs/lib/xlsx/xml/theme1.js";
import RelType from "exceljs/lib/xlsx/rel-type.js";
import WorkbookXform from "exceljs/lib/xlsx/xform/book/workbook-xform.js";
import WorksheetXform from "exceljs/lib/xlsx/xform/sheet/worksheet-xform.js";
import StylesXform from "exceljs/lib/xlsx/xform/style/styles-xform.js";
import SharedStringsXform from "exceljs/lib/xlsx/xform/strings/shared-strings-xform.js";
import RelationshipsXform from "exceljs/lib/xlsx/xform/core/relationships-xform.js";
import ContentTypesXform from "exceljs/lib/xlsx/xform/core/content-types-xform.js";
import AppXform from "exceljs/lib/xlsx/xform/core/app-xform.js";
import CoreXform from "exceljs/lib/xlsx/xform/core/core-xform.js";
import DrawingXform from "exceljs/lib/xlsx/xform/drawing/drawing-xform.js";
import TableXform from "exceljs/lib/xlsx/xform/table/table-xform.js";
import CommentsXform from "exceljs/lib/xlsx/xform/comment/comments-xform.js";
import VmlNotesXform from "exceljs/lib/xlsx/xform/comment/vml-notes-xform.js";
import type { Workbook as XWorkbook } from "exceljs";

import { OfficeError } from "../core/errors.ts";
import { children, parseXml } from "../core/xml.ts";
import type { Zip } from "../core/zip.ts";
import { resetIds } from "./ids.ts";

export type XBook = XWorkbook & { model: any };

/** What exceljs read from where, kept for the save (carry.ts). */
export type Origin = {
  zip: Zip;
  /** a sheet's `sheetId` -> the part it was read from (xl/worksheets/sheet3.xml) */
  sheetPart: Map<number, string>;
  /** sheet part -> the drawing rel id it points at, for drawings kept whole */
  keptDrawing: Map<string, string>;
  /** the image count of each sheet with a kept drawing, at load */
  imagesAtLoad: Map<number, number>;
};

const XDR = "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing";

/** One part's SAX events, as exceljs's xforms take them (one batch). */
async function* events(text: string): AsyncGenerator<{ eventType: string; value: unknown }[]> {
  const p = new SaxesParser();
  const out: { eventType: string; value: unknown }[] = [];
  let failed: Error | undefined;
  p.on("error", (e: Error) => (failed ??= e));
  p.on("opentag", (v: unknown) => out.push({ eventType: "opentag", value: v }));
  p.on("text", (v: unknown) => out.push({ eventType: "text", value: v }));
  p.on("closetag", (v: unknown) => out.push({ eventType: "closetag", value: v }));
  p.write(text).close();
  if (failed) throw failed;
  yield out;
}

async function parse(xform: any, zip: Zip, path: string): Promise<any> {
  const text = zip.text(path) ?? "";
  try {
    return await xform.parse(events(text));
  } catch (e) {
    throw new OfficeError("bad_xml", `${path} does not read as a spreadsheet part: ${(e as Error).message}`);
  }
}

/** A drawing holds only pictures (what exceljs models) or more (kept whole). */
function picturesOnly(zip: Zip, path: string): boolean {
  const text = zip.text(path);
  if (text === undefined) return true;
  const root = parseXml(text, path).documentElement!;
  for (const anchor of children(root, XDR)) {
    const body = children(anchor).filter((e) => !["from", "to", "pos", "ext", "clientData"].includes(e.localName ?? ""));
    if (body.some((e) => e.localName !== "pic")) return false;
  }
  return true;
}

/** The workbook in these parts. */
export async function load(zip: Zip): Promise<{ book: XBook; origin: Origin }> {
  const model: any = {
    worksheets: [],
    worksheetHash: {},
    worksheetRels: [],
    themes: {},
    media: [],
    mediaIndex: {},
    drawings: {},
    drawingRels: {},
    comments: {},
    tables: {},
    vmlDrawings: {},
  };
  const origin: Origin = { zip, sheetPart: new Map(), keptDrawing: new Map(), imagesAtLoad: new Map() };
  const kept = new Set<string>(); // drawing names (drawing1) kept whole
  for (const path of zip.list()) {
    const m = /^xl\/drawings\/([a-zA-Z0-9]+)\.xml$/.exec(path);
    if (m && !picturesOnly(zip, path)) kept.add(m[1]);
  }

  for (const name of zip.list()) {
    let m: RegExpExecArray | null;
    if (name === "_rels/.rels") model.globalRels = await parse(new RelationshipsXform(), zip, name);
    else if (name === "xl/workbook.xml") {
      const wb = await parse(new WorkbookXform(), zip, name);
      Object.assign(model, { sheets: wb.sheets, definedNames: wb.definedNames, views: wb.views, properties: wb.properties, calcProperties: wb.calcProperties });
    } else if (name === "xl/_rels/workbook.xml.rels") model.workbookRels = await parse(new RelationshipsXform(), zip, name);
    else if (name === "xl/sharedStrings.xml") {
      model.sharedStrings = new SharedStringsXform();
      await parse(model.sharedStrings, zip, name);
    } else if (name === "xl/styles.xml") {
      model.styles = new StylesXform();
      await parse(model.styles, zip, name);
    } else if (name === "docProps/app.xml") {
      const app = await parse(new AppXform(), zip, name);
      model.company = app.company;
      model.manager = app.manager;
    } else if (name === "docProps/core.xml") Object.assign(model, await parse(new CoreXform(), zip, name));
    else if ((m = /^xl\/worksheets\/sheet(\d+)\.xml$/.exec(name))) {
      const ws = await parse(new WorksheetXform({}), zip, name);
      ws.sheetNo = m[1];
      model.worksheetHash[name] = ws;
      model.worksheets.push(ws);
    } else if ((m = /^xl\/worksheets\/_rels\/sheet(\d+)\.xml\.rels$/.exec(name))) model.worksheetRels[m[1]] = await parse(new RelationshipsXform(), zip, name);
    else if ((m = /^xl\/theme\/([a-zA-Z0-9]+)\.xml$/.exec(name))) model.themes[m[1]] = zip.text(name);
    else if ((m = /^xl\/media\/([a-zA-Z0-9]+[.][a-zA-Z0-9]{3,4})$/.exec(name))) {
      const file = m[1];
      const dot = file.lastIndexOf(".");
      model.mediaIndex[file] = model.media.length;
      model.mediaIndex[file.slice(0, dot)] = model.media.length;
      model.media.push({ type: "image", name: file.slice(0, dot), extension: file.slice(dot + 1), buffer: zip.bytes(name) });
    } else if ((m = /^xl\/drawings\/([a-zA-Z0-9]+)\.xml$/.exec(name))) {
      if (!kept.has(m[1])) model.drawings[m[1]] = await parse(new DrawingXform(), zip, name);
    } else if ((m = /^xl\/(comments\d+)\.xml$/.exec(name))) model.comments[`../${m[1]}.xml`] = await parse(new CommentsXform(), zip, name);
    else if ((m = /^xl\/tables\/(table\d+)\.xml$/.exec(name))) model.tables[`../tables/${m[1]}.xml`] = await parse(new TableXform(), zip, name);
    else if ((m = /^xl\/drawings\/_rels\/([a-zA-Z0-9]+)\.xml\.rels$/.exec(name))) {
      if (!kept.has(m[1])) model.drawingRels[m[1]] = await parse(new RelationshipsXform(), zip, name);
    } else if ((m = /^xl\/drawings\/(vmlDrawing\d+)\.vml$/.exec(name))) model.vmlDrawings[`../drawings/${m[1]}.vml`] = await parse(new VmlNotesXform(), zip, name);
  }
  if (!model.sheets) throw new OfficeError("no_part", "this xlsx has no xl/workbook.xml");
  model.styles ??= new StylesXform();

  // a sheet whose drawing is kept whole: exceljs must not look for it
  for (const [path, ws] of Object.entries<any>(model.worksheetHash)) {
    if (!ws.drawing) continue;
    const rel = (model.worksheetRels[ws.sheetNo] ?? []).find((r: any) => r.Id === ws.drawing.rId);
    const name = rel && /\/drawings\/([a-zA-Z0-9]+)\.xml$/.exec(rel.Target)?.[1];
    if (name && kept.has(name)) {
      origin.keptDrawing.set(path, ws.drawing.rId);
      delete ws.drawing;
    }
  }

  reconcile(model);
  for (const ws of model.worksheets) {
    const path = Object.keys(model.worksheetHash).find((p) => model.worksheetHash[p] === ws);
    if (path) origin.sheetPart.set(ws.id, path);
  }
  delete model.worksheetHash;
  delete model.sheetDefs;
  const book = new Workbook() as XBook;
  book.model = model;
  for (const [id, path] of origin.sheetPart) {
    if (origin.keptDrawing.has(path)) origin.imagesAtLoad.set(id, images(book, id));
  }
  return { book, origin };
}

/** The pictures exceljs holds on a sheet (not its background). */
export function images(book: XBook, sheetId: number): number {
  const ws = book.getWorksheet(sheetId);
  return ws ? ws.getImages().length : 0;
}

function reconcile(model: any): void {
  const worksheetXform = new WorksheetXform({});
  new WorkbookXform().reconcile(model);
  const drawingXform = new DrawingXform();
  const drawingOptions: any = { media: model.media, mediaIndex: model.mediaIndex };
  for (const name of Object.keys(model.drawings)) {
    const drawing = model.drawings[name];
    const drawingRel = model.drawingRels[name];
    if (!drawingRel) continue;
    drawingOptions.rels = Object.fromEntries(drawingRel.map((r: any) => [r.Id, r]));
    for (const anchor of drawing.anchors ?? []) {
      const hl = anchor.picture?.hyperlinks;
      if (hl && drawingOptions.rels[hl.rId]) {
        hl.hyperlink = drawingOptions.rels[hl.rId].Target;
        delete hl.rId;
      }
    }
    drawingXform.reconcile(drawing, drawingOptions);
  }
  const tableXform = new TableXform();
  for (const table of Object.values<any>(model.tables)) tableXform.reconcile(table, { styles: model.styles });
  const sheetOptions = {
    styles: model.styles,
    sharedStrings: model.sharedStrings,
    media: model.media,
    mediaIndex: model.mediaIndex,
    date1904: model.properties?.date1904,
    drawings: model.drawings,
    comments: model.comments,
    tables: model.tables,
    vmlDrawings: model.vmlDrawings,
  };
  for (const ws of model.worksheets) {
    ws.relationships = model.worksheetRels[ws.sheetNo];
    worksheetXform.reconcile(ws, sheetOptions);
  }
  for (const k of ["worksheetRels", "globalRels", "sharedStrings", "workbookRels", "styles", "mediaIndex", "drawings", "drawingRels", "vmlDrawings"]) delete model[k];
}

/** exceljs's parts for this workbook, by path: what it models, nothing else. */
export type Rendered = { parts: Map<string, string | Uint8Array>; sheetPath: Map<number, string> };

/** The parts exceljs writes for the book (xlsx.js write, sync). */
export function render(book: XBook): Rendered {
  resetIds();
  const model = book.model;
  const parts = new Map<string, string | Uint8Array>();
  const sheetPath = new Map<number, string>();

  model.creator ||= "bise";
  model.lastModifiedBy ||= "bise";
  model.useSharedStrings = true;
  model.useStyles = true;
  model.sharedStrings = new SharedStringsXform();
  model.styles = new StylesXform(true);
  new WorkbookXform().prepare(model);
  const worksheetXform = new WorksheetXform();
  const options: any = {
    sharedStrings: model.sharedStrings,
    styles: model.styles,
    date1904: model.properties.date1904,
    drawingsCount: 0,
    media: model.media,
  };
  options.drawings = model.drawings = [];
  options.commentRefs = model.commentRefs = [];
  let tableCount = 0;
  model.tables = [];
  for (const ws of model.worksheets) {
    for (const table of ws.tables) {
      tableCount++;
      table.target = `table${tableCount}.xml`;
      table.id = tableCount;
      model.tables.push(table);
    }
    worksheetXform.prepare(ws, options);
  }

  parts.set("[Content_Types].xml", new ContentTypesXform().toXml(model));
  const rels = new RelationshipsXform();
  parts.set(
    "_rels/.rels",
    rels.toXml([
      { Id: "rId1", Type: RelType.OfficeDocument, Target: "xl/workbook.xml" },
      { Id: "rId2", Type: RelType.CoreProperties, Target: "docProps/core.xml" },
      { Id: "rId3", Type: RelType.ExtenderProperties, Target: "docProps/app.xml" },
    ]),
  );
  let count = 1;
  const bookRels: any[] = [
    { Id: `rId${count++}`, Type: RelType.Styles, Target: "styles.xml" },
    { Id: `rId${count++}`, Type: RelType.Theme, Target: "theme/theme1.xml" },
  ];
  // sharedStrings is filled while the sheets render: its rel is added after
  const sheets: any[] = model.worksheets;
  const ssId = `rId${count++}`;
  for (const ws of sheets) {
    ws.rId = `rId${count++}`;
    bookRels.push({ Id: ws.rId, Type: RelType.Worksheet, Target: `worksheets/sheet${ws.id}.xml` });
  }
  const relsXform = new RelationshipsXform();
  const commentsXform = new CommentsXform();
  const vmlXform = new VmlNotesXform();
  for (const ws of sheets) {
    const path = `xl/worksheets/sheet${ws.id}.xml`;
    sheetPath.set(ws.id, path);
    parts.set(path, xml((x) => worksheetXform.render(x, ws)));
    if (ws.rels?.length) parts.set(`xl/worksheets/_rels/sheet${ws.id}.xml.rels`, xml((x) => relsXform.render(x, ws.rels)));
    if (ws.comments.length > 0) {
      parts.set(`xl/comments${ws.id}.xml`, xml((x) => commentsXform.render(x, ws)));
      parts.set(`xl/drawings/vmlDrawing${ws.id}.vml`, xml((x) => vmlXform.render(x, ws)));
    }
  }
  if (model.sharedStrings.count) {
    bookRels.splice(2, 0, { Id: ssId, Type: RelType.SharedStrings, Target: "sharedStrings.xml" });
    parts.set("xl/sharedStrings.xml", model.sharedStrings.xml);
  }
  parts.set("xl/_rels/workbook.xml.rels", rels.toXml(bookRels));

  const drawingXform = new DrawingXform();
  for (const ws of sheets) {
    const { drawing } = ws;
    if (!drawing) continue;
    drawingXform.prepare(drawing, {});
    parts.set(`xl/drawings/${drawing.name}.xml`, drawingXform.toXml(drawing));
    parts.set(`xl/drawings/_rels/${drawing.name}.xml.rels`, rels.toXml(drawing.rels));
  }
  const tableXform = new TableXform();
  for (const ws of sheets) {
    for (const table of ws.tables) {
      tableXform.prepare(table, {});
      parts.set(`xl/tables/${table.target}`, tableXform.toXml(table));
    }
  }
  const themes = model.themes && Object.keys(model.themes).length ? model.themes : { theme1 };
  for (const name of Object.keys(themes)) parts.set(`xl/theme/${name}.xml`, themes[name]);
  if (model.styles.xml) parts.set("xl/styles.xml", model.styles.xml);
  for (const medium of model.media) {
    if (medium.type !== "image") continue;
    const path = `xl/media/${medium.name}.${medium.extension}`;
    if (medium.buffer) parts.set(path, new Uint8Array(medium.buffer));
    else if (medium.base64) parts.set(path, fromBase64(medium.base64.slice(medium.base64.indexOf(",") + 1)));
    else throw new OfficeError("bad_arg", `the image ${medium.name} has no bytes: add images with { buffer } or { base64 }, not a filename`);
  }
  parts.set("docProps/app.xml", new AppXform().toXml(model));
  parts.set("docProps/core.xml", new CoreXform().toXml(model));
  parts.set("xl/workbook.xml", new WorkbookXform().toXml(model));
  return { parts, sheetPath };
}

function xml(fill: (x: any) => void): string {
  const x = new XmlStream();
  fill(x);
  return x.xml;
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** base64 -> bytes, with no atob (bise office run has none). */
export function fromBase64(s: string): Uint8Array {
  const clean = s.replace(/[^A-Za-z0-9+/]/g, "");
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n = [0, 1, 2, 3].map((k) => B64.indexOf(clean[i + k] ?? "A"));
    const v = (n[0] << 18) | (n[1] << 12) | (n[2] << 6) | n[3];
    if (o < out.length) out[o++] = (v >> 16) & 255;
    if (o < out.length) out[o++] = (v >> 8) & 255;
    if (o < out.length) out[o++] = v & 255;
  }
  return out;
}
