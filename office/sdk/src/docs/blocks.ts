// New blocks from a plain spec: a paragraph, a heading, a list item, a
// table, an image, a page break. The same builders serve create() and the
// edits of an open file: one write path.

import { OfficeError } from "../core/errors.ts";
import { parseXml, type Element } from "../core/xml.ts";
import type { Model } from "./model.ts";
import { ensureStyle, listNumId } from "./styles.ts";
import { formatRun, makeRun, wrap, type RunFormat, type Track } from "./text.ts";
import { el, props, R, setProp, W, wkid, WP } from "./w.ts";

/** A piece of text with its format; `link` makes it a hyperlink. */
export type Run = RunFormat & { text: string; link?: string };
/** Plain text, or runs with formats. */
export type Inline = string | Run[];
export type Align = "left" | "center" | "right" | "justify";

export type BlockSpec =
  | { kind: "para"; text?: Inline; style?: string; align?: Align }
  | { kind: "title"; text: Inline }
  | { kind: "heading"; text: Inline; level?: number }
  | { kind: "bullet"; text: Inline; level?: number }
  | { kind: "numbered"; text: Inline; level?: number }
  | { kind: "quote"; text: Inline }
  | { kind: "table"; rows: Inline[][]; header?: boolean; widths?: number[] }
  | { kind: "image"; bytes: Uint8Array; width?: number; alt?: string }
  | { kind: "pagebreak" };

export const BLOCK_KINDS = ["para", "title", "heading", "bullet", "numbered", "quote", "table", "image", "pagebreak"];

/** Fill a paragraph with runs (tracked: in one w:ins). */
export function fillRuns(m: Model, p: Element, text: Inline, track: Track | null): void {
  const runs: Run[] = typeof text === "string" ? [{ text }] : text;
  const made: Element[] = [];
  for (const run of runs) {
    if (typeof run?.text !== "string") throw new OfficeError("bad_arg", `a run is {text, bold?, italic?, link?, ...}, got ${JSON.stringify(run)}`);
    if (!run.text) continue;
    const r = makeRun(p, run.text);
    const { text: _t, link, ...format } = run;
    if (Object.keys(format).length || link) formatRun(r, link ? { style: "Hyperlink", ...format } : format, null, setProp);
    if (link) {
      ensureStyle(m.parts, "Hyperlink");
      const rid = m.parts.addRel("http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", link, true);
      const h = el(m.doc, "hyperlink");
      h.setAttributeNS(R, "r:id", rid);
      h.appendChild(r);
      made.push(h);
    } else made.push(r);
  }
  if (!track || !made.length) {
    for (const x of made) p.appendChild(x);
    return;
  }
  const ins = el(m.doc, "ins", { id: track.nextId(), author: track.author, date: track.date });
  for (const x of made) ins.appendChild(x);
  p.appendChild(ins);
}

/** A tracked new paragraph also marks its paragraph mark as inserted. */
export function markParaInserted(p: Element, track: Track): void {
  const pPr = props(p, "pPr");
  const rPr = wkid(pPr, "rPr") ?? setProp(pPr, el(p.ownerDocument!, "rPr"));
  setProp(rPr, el(p.ownerDocument!, "ins", { id: track.nextId(), author: track.author, date: track.date }));
}

function para(m: Model, style: string | undefined, text: Inline | undefined, track: Track | null, align?: Align): Element {
  const p = el(m.doc, "p");
  m.name(p, `new:${m.paras().length}:${JSON.stringify(text ?? "")}`);
  if (style) {
    if (!ensureStyle(m.parts, style)) throw new OfficeError("bad_arg", `no paragraph style "${style}" in this docx (and it is not one bise knows how to add: Title, Heading1-6, ListParagraph, Quote)`);
    setProp(props(p, "pPr"), el(m.doc, "pStyle", { val: style }));
  }
  if (align) setProp(props(p, "pPr"), el(m.doc, "jc", { val: align === "justify" ? "both" : align }));
  if (text !== undefined) fillRuns(m, p, text, track);
  if (track) markParaInserted(p, track);
  return p;
}

/** The new block's element (a w:p or a w:tbl), not yet in the body. */
export function buildBlock(m: Model, spec: BlockSpec, track: Track | null): Element {
  if (!spec || typeof spec !== "object" || !BLOCK_KINDS.includes((spec as { kind: string }).kind)) {
    throw new OfficeError("bad_arg", `a block is {kind: ${BLOCK_KINDS.join(" | ")}, ...}, got ${JSON.stringify(spec)?.slice(0, 120)}`);
  }
  switch (spec.kind) {
    case "para":
      return para(m, spec.style, spec.text ?? "", track, spec.align);
    case "title":
      return para(m, "Title", spec.text, track);
    case "heading": {
      const level = spec.level ?? 1;
      if (!Number.isInteger(level) || level < 1 || level > 6) throw new OfficeError("bad_arg", `a heading's level is 1 to 6, got ${level}`);
      return para(m, `Heading${level}`, spec.text, track);
    }
    case "quote":
      return para(m, "Quote", spec.text, track);
    case "bullet":
    case "numbered": {
      const p = para(m, "ListParagraph", spec.text, track);
      const numId = listNumId(m.parts, spec.kind === "numbered");
      const numPr = el(m.doc, "numPr");
      numPr.appendChild(el(m.doc, "ilvl", { val: String(Math.max(0, Math.min(8, (spec.level ?? 1) - 1))) }));
      numPr.appendChild(el(m.doc, "numId", { val: numId }));
      setProp(props(p, "pPr"), numPr);
      return p;
    }
    case "pagebreak": {
      const p = para(m, undefined, undefined, track);
      const r = el(m.doc, "r");
      r.appendChild(el(m.doc, "br", { type: "page" }));
      p.appendChild(track ? wrapNew(m, r, track) : r);
      return p;
    }
    case "table":
      return buildTable(m, spec.rows, spec.header ?? false, spec.widths, track);
    case "image":
      return buildImage(m, spec.bytes, spec.width, spec.alt, track);
  }
}

function wrapNew(m: Model, r: Element, track: Track): Element {
  const ins = el(m.doc, "ins", { id: track.nextId(), author: track.author, date: track.date });
  ins.appendChild(r);
  return ins;
}

/** A table: Table Grid style, equal columns over the text width (or `widths` in %). */
export function buildTable(m: Model, rows: Inline[][], header: boolean, widths: number[] | undefined, track: Track | null): Element {
  if (!Array.isArray(rows) || !rows.length || !rows.every(Array.isArray)) throw new OfficeError("bad_arg", "a table's rows are an array of arrays of cell texts, at least one row");
  const cols = Math.max(...rows.map((r) => r.length));
  if (cols < 1) throw new OfficeError("bad_arg", "a table needs at least one column");
  ensureStyle(m.parts, "TableGrid");
  const total = m.textWidth();
  const pct = widths && widths.length === cols ? widths : Array.from({ length: cols }, () => 100 / cols);
  const tw = pct.map((p) => Math.round((total * p) / 100));
  const tbl = el(m.doc, "tbl");
  const tblPr = el(m.doc, "tblPr");
  tblPr.appendChild(el(m.doc, "tblStyle", { val: "TableGrid" }));
  tblPr.appendChild(el(m.doc, "tblW", { w: String(total), type: "dxa" }));
  tblPr.appendChild(el(m.doc, "tblLook", { val: "04A0", firstRow: header ? "1" : "0", lastRow: "0", firstColumn: "1", lastColumn: "0", noHBand: "0", noVBand: "1" }));
  tbl.appendChild(tblPr);
  const grid = el(m.doc, "tblGrid");
  for (const w of tw) grid.appendChild(el(m.doc, "gridCol", { w: String(w) }));
  tbl.appendChild(grid);
  rows.forEach((row, i) => tbl.appendChild(buildRow(m, row, cols, tw, header && i === 0, track)));
  return tbl;
}

export function buildRow(m: Model, row: Inline[], cols: number, tw: number[], isHeader: boolean, track: Track | null): Element {
  const tr = el(m.doc, "tr");
  if (isHeader) setProp(props(tr, "trPr"), el(m.doc, "tblHeader"));
  if (track) setProp(props(tr, "trPr"), el(m.doc, "ins", { id: track.nextId(), author: track.author, date: track.date }));
  for (let c = 0; c < cols; c++) {
    const tc = el(m.doc, "tc");
    const tcPr = el(m.doc, "tcPr");
    tcPr.appendChild(el(m.doc, "tcW", { w: String(tw[c] ?? tw[tw.length - 1]), type: "dxa" }));
    tc.appendChild(tcPr);
    const cell = row[c] ?? "";
    const text: Inline = isHeader && typeof cell === "string" ? [{ text: cell, bold: true }] : cell;
    tc.appendChild(para(m, undefined, text, track));
    tr.appendChild(tc);
  }
  return tr;
}

// ---- images

const EMU_PER_PT = 12700;

/** An image's type and pixel size from its header (png, jpeg, gif). */
export function imageInfo(b: Uint8Array): { ext: string; mime: string; w: number; h: number } {
  if (!(b instanceof Uint8Array)) throw new OfficeError("bad_arg", "an image's bytes are a Uint8Array (run.read gives one)");
  const u32 = (i: number) => ((b[i]! << 24) | (b[i + 1]! << 16) | (b[i + 2]! << 8) | b[i + 3]!) >>> 0;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", mime: "image/png", w: u32(16), h: u32(20) };
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return { ext: "gif", mime: "image/gif", w: b[6]! | (b[7]! << 8), h: b[8]! | (b[9]! << 8) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) break;
      const marker = b[i + 1]!;
      const len = (b[i + 2]! << 8) | b[i + 3]!;
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { ext: "jpeg", mime: "image/jpeg", h: (b[i + 5]! << 8) | b[i + 6]!, w: (b[i + 7]! << 8) | b[i + 8]! };
      }
      i += 2 + len;
    }
  }
  throw new OfficeError("bad_arg", "the image is not a PNG, JPEG or GIF this SDK can size");
}

function buildImage(m: Model, bytes: Uint8Array, widthPt: number | undefined, alt: string | undefined, track: Track | null): Element {
  const info = imageInfo(bytes);
  const path = m.parts.freePath("media", "image", info.ext);
  m.parts.zip.set(path, bytes);
  m.parts.addDefault(info.ext, info.mime);
  const rid = m.parts.addRel("http://schemas.openxmlformats.org/officeDocument/2006/relationships/image", m.parts.relTarget(path));
  const maxPt = m.textWidth() / 20;
  const natural = info.w * 0.75;
  const wPt = Math.min(widthPt ?? natural, maxPt);
  const cx = Math.round(wPt * EMU_PER_PT);
  const cy = Math.round((cx * info.h) / Math.max(1, info.w));
  // a drawing's id is unique in the document
  const used = m.doc.getElementsByTagNameNS(WP, "docPr");
  let id = 1;
  for (let i = 0; i < used.length; i++) id = Math.max(id, Number(used.item(i)!.getAttribute("id")) + 1 || id);
  const name = `Picture ${id}`;
  const descr = (alt ?? "").replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`);
  const xml =
    `<w:r xmlns:w="${W}" xmlns:r="${R}" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:docPr id="${id}" name="${name}" descr="${descr}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="${name}" descr="${descr}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  const r = m.doc.importNode(parseXml(xml, "image").documentElement!, true) as Element;
  const p = para(m, undefined, undefined, track);
  p.appendChild(track ? wrapNew(m, r, track) : r);
  return p;
}

void wrap;
