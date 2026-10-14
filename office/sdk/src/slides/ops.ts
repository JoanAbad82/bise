// The selections at() and slide() return, and their edits. A selection
// holds a slide by its stable id and a shape by its cNvPr id, and finds
// them again on each call, so it stays right after other edits (a slide
// moved, a shape added) and says not_found once its target is gone.

import { OfficeError } from "../core/errors.ts";
import type { OutlineNode, Selection } from "../core/outline.ts";
import type { Rect } from "../anchor.gen.ts";
import { attr, child, children, type Element } from "../core/xml.ts";
import { chartFrameXml, imageInfo, pictureXml, shapeXml, tableXml, textBoxXml, type ShapeLook, type TableOpts } from "./build.ts";
import { writeChart, type ChartInput } from "./chart.ts";
import type { DeckCore, SlideRef } from "./deck.ts";
import { ensure, frag, insertBefore, ln, path, PNS, REL, remove } from "./dom.ts";
import { boxOf } from "./inherit.ts";
import { shapeNode, slideNode } from "./outline.ts";
import { readShapes, spTree, type ShapeInfo } from "./read.ts";
import { replaceText, setText, styleText, type TextInput, type TextStyle } from "./text.ts";
import { boxEmu, emu, hex, overlapArea, type Box, type Emu } from "./units.ts";

const { a: A, p: P, r: R } = PNS;

export type { Box, ChartInput, ShapeLook, TableOpts, TextInput, TextStyle };

/** What a slide selection can do. */
export type SlideOps = {
  readonly kind: "slide";
  /** its position, from 1 (changes when slides move) */
  readonly index: number;
  /** the box a note drew on the slide, when the anchor had one (% of the slide) */
  readonly rect?: Rect;
  /** every shape on it (top level; a group's members are in its node's children) */
  shapes(): ShapeSel[];
  /** a shape by id ("3") or by name ("Title 1"); throws not_found listing what is there */
  shape(idOrName: string): ShapeSel;
  /** its placeholder of that type ("title", "body", "subTitle", ...), or undefined */
  placeholder(type: string): ShapeSel | undefined;
  /** the shapes under the anchor's rect, the most covered first ([] without a rect) */
  under(): ShapeSel[];
  addText(text: TextInput, box: Box, style?: TextStyle & ShapeLook & { name?: string }): ShapeSel;
  addShape(geometry: string, box: Box, opts?: ShapeLook & { text?: TextInput; style?: TextStyle; name?: string }): ShapeSel;
  /** a PNG, JPEG or GIF; with only [x, y, w] (or h = 0) the height keeps the image's ratio */
  addImage(bytes: Uint8Array, box: Box | [number, number, number], opts?: { name?: string; alt?: string }): ShapeSel;
  addTable(rows: string[][], box: Box, opts?: TableOpts & { name?: string }): ShapeSel;
  addChart(chart: ChartInput, box: Box, opts?: { name?: string }): ShapeSel;
  remove(): void;
  moveTo(position: number): SlideSel;
  duplicate(): SlideSel;
};

/** What a shape selection can do. */
export type ShapeOps = {
  readonly kind: "shape";
  readonly slide: number;
  readonly id: string;
  /** the quote of the note's anchor, when it had one */
  readonly quote?: string;
  /** its text now ("\n" between paragraphs) */
  text(): string;
  setText(text: TextInput, style?: TextStyle): ShapeSel;
  /** replace every `find` (across runs); throws not_found when it is not there */
  replace(find: string, by: string): ShapeSel;
  style(style: TextStyle): ShapeSel;
  /** move or resize: any of x, y, w, h in points */
  move(box: Partial<{ x: number; y: number; w: number; h: number }> | Box): ShapeSel;
  fill(color: string): ShapeSel;
  line(color: string, width?: number): ShapeSel;
  /** a table's cells as text */
  rows(): string[][];
  /** set a table cell's text, row and column from 1 */
  setCell(row: number, col: number, text: TextInput, style?: TextStyle): ShapeSel;
  /** a picture's image, swapped, its box kept */
  replaceImage(bytes: Uint8Array): ShapeSel;
  remove(): void;
};

export type SlideSel = Selection<SlideOps>;
export type ShapeSel = Selection<ShapeOps>;

const bad = (msg: string) => new OfficeError("bad_arg", msg);
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function slideSel(deck: DeckCore, sldId: number, rect?: Rect): SlideSel {
  const ref = () => deck.slideById(sldId);
  const s0 = ref();
  const add = (xml: (id: number, name: string) => string, name: string): ShapeSel => {
    const s = ref();
    const id = deck.nextId(s);
    const el = frag(deck.store.doc(s.part), xml(id, name.replace("#", String(id - 1))));
    insertBefore(spTree(deck.ctx(s)), el, [[P, "extLst"]]);
    deck.store.touch(s.part);
    return shapeSel(deck, sldId, String(id));
  };
  const top = () => readShapes(deck.ctx(ref()));
  const sel: SlideSel = {
    kind: "slide",
    node: slideNode(deck, s0),
    index: s0.index,
    ...(rect ? { rect } : {}),
    shapes: () => top().map((i) => shapeSel(deck, sldId, i.id)),
    shape(idOrName) {
      const all = flat(top());
      const hit = all.find((i) => i.id === String(idOrName)) ?? all.find((i) => i.name === idOrName);
      if (!hit) {
        throw new OfficeError("not_found", `slide ${ref().index} has no shape ${JSON.stringify(idOrName)}; it has: ${all.map((i) => `${i.id} "${i.name}"`).join(", ") || "nothing"}`);
      }
      return shapeSel(deck, sldId, hit.id);
    },
    placeholder(type) {
      const want = type === "title" ? ["title", "ctrTitle"] : type === "body" ? ["body", "obj"] : [type];
      const hit = top().find((i) => i.ph && want.includes(i.ph.type));
      return hit ? shapeSel(deck, sldId, hit.id) : undefined;
    },
    under() {
      if (!rect) return [];
      const size = deck.size();
      const r: Emu = { x: (rect.x / 100) * size.w, y: (rect.y / 100) * size.h, w: (rect.w / 100) * size.w, h: (rect.h / 100) * size.h };
      return top()
        .filter((i) => i.box && overlapArea(i.box, r) > 0)
        .sort((a, b) => overlapArea(b.box!, r) - overlapArea(a.box!, r))
        .map((i) => shapeSel(deck, sldId, i.id));
    },
    addText(text, box, style = {}) {
      const { fill, line, lineWidth, valign, name, ...ts } = style;
      const b = boxEmu(box);
      const s = add((id, n) => textBoxXml(id, n, b, { fill, line, lineWidth, valign }), name ?? "TextBox #");
      return s.setText(text, ts);
    },
    addShape(geometry, box, opts = {}) {
      const b = boxEmu(box);
      const s = add((id, n) => shapeXml(id, n, geometry, b, opts), opts.name ?? `${geometry} #`);
      return opts.text !== undefined ? s.setText(opts.text, opts.style) : s;
    },
    addImage(bytes, box, opts = {}) {
      const info = imageInfo(bytes);
      const [x, y, w, h0] = Array.isArray(box) ? box : [box.x, box.y, box.w, box.h];
      const h = h0 || (info.w && info.h ? (w * info.h) / info.w : 0);
      if (!h) throw bad(`give the image's height too ([x, y, w, h]): its size could not be read from the bytes`);
      const b = boxEmu([x, y, w, h]);
      const s = ref();
      const media = deck.store.freePath("ppt/media/", "image", info.ext === "jpeg" ? "jpeg" : info.ext);
      deck.store.putBytes(media, bytes);
      deck.store.contentType({ ext: media.slice(media.lastIndexOf(".") + 1), type: info.mime });
      const rid = deck.store.addRel(s.part, REL.image, media);
      return add((id, n) => pictureXml(id, n, rid, b, opts.alt), opts.name ?? "Picture #");
    },
    addTable(rows, box, opts = {}) {
      const b = boxEmu(box);
      return add((id, n) => tableXml(id, n, rows, b, opts), opts.name ?? "Table #");
    },
    addChart(chart, box, opts = {}) {
      const b = boxEmu(box);
      writeChart(chart, "rId1"); // checks the data now, so a bad chart throws here and not at save
      const s = ref();
      const part = deck.store.freePath("ppt/charts/", "chart", "xml");
      const emb = deck.store.freePath("ppt/embeddings/", "Microsoft_Excel_Worksheet", "xlsx");
      // the workbook's bytes come at save (the sheets module's save is async): a placeholder holds its path
      deck.store.putBytes(emb, new Uint8Array(0));
      deck.workbooks.set(emb, chart);
      deck.store.contentType({ ext: "xlsx", type: XLSX });
      deck.store.put(part, writeChart(chart, deck.store.addRel(part, REL.package, emb)));
      deck.store.contentType({ part, type: "application/vnd.openxmlformats-officedocument.drawingml.chart+xml" });
      const rid = deck.store.addRel(s.part, REL.chart, part);
      return add((id, n) => chartFrameXml(id, n, rid, b), opts.name ?? "Chart #");
    },
    remove: () => deck.removeSlide(ref()),
    moveTo: (position) => slideSel(deck, deck.moveSlide(ref(), position).sldId),
    duplicate: () => slideSel(deck, deck.duplicateSlide(ref()).sldId),
  };
  return sel;
}

function flat(list: ShapeInfo[]): ShapeInfo[] {
  return list.flatMap((i) => [i, ...(i.children ? flat(i.children) : [])]);
}

export function shapeSel(deck: DeckCore, sldId: number, id: string, quote?: string): ShapeSel {
  const slide = () => deck.slideById(sldId);
  const el = (): { s: SlideRef; el: Element } => {
    const s = slide();
    const e = deck.shapeEl(s, id);
    if (!e) throw new OfficeError("not_found", `slide ${s.index} has no shape ${id} (any more): inspect() again for its shapes`);
    return { s, el: e };
  };
  const info = (): ShapeInfo => {
    const s = slide();
    const hit = flat(readShapes(deck.ctx(s))).find((i) => i.id === id);
    if (!hit) throw new OfficeError("not_found", `slide ${s.index} has no shape ${id} (any more): inspect() again for its shapes`);
    return hit;
  };
  const body = (what: string): { s: SlideRef; body: Element } => {
    const { s, el: e } = el();
    if (e.localName !== "sp") throw bad(`shape ${id} on slide ${s.index} is a ${describe(e)}: it has no text to ${what}${e.localName === "graphicFrame" ? " (a table's cells: setCell)" : ""}`);
    let b = child(e, P, "txBody");
    if (!b) {
      b = frag(deck.store.doc(s.part), `<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="en-US"/></a:p></p:txBody>`);
      insertBefore(e, b, [[P, "extLst"]]);
    }
    return { s, body: b };
  };
  const done = (s: SlideRef) => {
    deck.store.touch(s.part);
    return shapeSel(deck, sldId, id, quote);
  };
  const s0 = slide();
  const i0 = info();
  const node: OutlineNode = shapeNode(deck.ctx(s0), s0, i0);
  return {
    kind: "shape",
    node,
    slide: s0.index,
    id,
    ...(quote !== undefined ? { quote } : {}),
    text: () => info().text ?? "",
    setText(text, style) {
      const { s, body: b } = body("set");
      setText(b, text, style);
      return done(s);
    },
    replace(find, by) {
      const { s, body: b } = body("replace");
      if (typeof by !== "string") throw bad(`replace(find, by) takes two strings, got ${JSON.stringify(by)} for by`);
      if (!replaceText(b, find, by)) {
        throw new OfficeError("not_found", `${JSON.stringify(find)} is not in shape ${id} of slide ${s.index}; its text is ${JSON.stringify(info().text ?? "")}`);
      }
      return done(s);
    },
    style(style) {
      const { s, body: b } = body("style");
      styleText(b, style);
      return done(s);
    },
    move(box) {
      const { s, el: e } = el();
      const cur = boxOf(deck.ctx(s), e);
      const want = Array.isArray(box) ? { x: box[0], y: box[1], w: box[2], h: box[3] } : box;
      if (!want || typeof want !== "object") throw bad(`move takes { x?, y?, w?, h? } in points, or [x, y, w, h]`);
      const pts = { x: want.x, y: want.y, w: want.w, h: want.h };
      if (!cur && Object.values(pts).some((v) => v === undefined)) throw bad(`shape ${id} has no box yet: give all of x, y, w, h`);
      const merged = {
        x: pts.x !== undefined ? pts.x : cur!.x / 12700,
        y: pts.y !== undefined ? pts.y : cur!.y / 12700,
        w: pts.w !== undefined ? pts.w : cur!.w / 12700,
        h: pts.h !== undefined ? pts.h : cur!.h / 12700,
      };
      const b = boxEmu(merged);
      setXfrm(deck, s, e, b);
      return done(s);
    },
    fill(color) {
      const { s, el: e } = el();
      const spPr = shapeProps(e, s.index);
      for (const f of children(spPr, A).filter((x) => ["noFill", "solidFill", "gradFill", "blipFill", "pattFill", "grpFill"].includes(ln(x)))) remove(f);
      const f = frag(deck.store.doc(s.part), color === "none" ? "<a:noFill/>" : `<a:solidFill><a:srgbClr val="${hex(color)}"/></a:solidFill>`);
      insertBefore(spPr, f, [[A, "ln"], [A, "effectLst"], [A, "effectDag"], [A, "scene3d"], [A, "sp3d"], [A, "extLst"]]);
      return done(s);
    },
    line(color, width) {
      const { s, el: e } = el();
      const spPr = shapeProps(e, s.index);
      const outline = ensure(spPr, A, "a:ln", [[A, "effectLst"], [A, "effectDag"], [A, "scene3d"], [A, "sp3d"], [A, "extLst"]]);
      for (const f of children(outline, A).filter((x) => ["noFill", "solidFill", "gradFill", "pattFill"].includes(ln(x)))) remove(f);
      if (width !== undefined) {
        if (!(typeof width === "number" && width >= 0 && width <= 100)) throw bad(`a line's width is in points, 0 to 100, got ${JSON.stringify(width)}`);
        outline.setAttribute("w", String(emu(width)));
      }
      const f = frag(deck.store.doc(s.part), color === "none" ? "<a:noFill/>" : `<a:solidFill><a:srgbClr val="${hex(color)}"/></a:solidFill>`);
      outline.insertBefore(f, outline.firstChild);
      return done(s);
    },
    rows: () => info().rows ?? [],
    setCell(row, col, text, style) {
      const { s, el: e } = el();
      const tbl = path(e, [A, "graphic"], [A, "graphicData"], [A, "tbl"]);
      if (!tbl) throw bad(`shape ${id} on slide ${s.index} is a ${describe(e)}, not a table`);
      const trs = children(tbl, A, "tr");
      const tcs = trs[row - 1] ? children(trs[row - 1], A, "tc") : [];
      const tc = tcs[col - 1];
      if (!tc) throw new OfficeError("not_found", `the table has ${trs.length} rows and ${tcs.length || children(trs[0], A, "tc").length} columns (from 1); there is no cell ${row}, ${col}`);
      let b = child(tc, A, "txBody");
      if (!b) {
        b = frag(deck.store.doc(s.part), `<a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="en-US"/></a:p></a:txBody>`);
        tc.insertBefore(b, tc.firstChild);
      }
      setText(b, text, style);
      return done(s);
    },
    replaceImage(bytes) {
      const { s, el: e } = el();
      const blip = path(e, [P, "blipFill"], [A, "blip"]);
      if (!blip) throw bad(`shape ${id} on slide ${s.index} is a ${describe(e)}, not a picture`);
      const info2 = imageInfo(bytes);
      const media = deck.store.freePath("ppt/media/", "image", info2.ext);
      deck.store.putBytes(media, bytes);
      deck.store.contentType({ ext: info2.ext, type: info2.mime });
      const old = attr(blip, "embed", R);
      blip.setAttributeNS(R, "r:embed", deck.store.addRel(s.part, REL.image, media));
      if (old && !usesRel(deck.store.root(s.part), old)) deck.store.removeRel(s.part, old);
      return done(s);
    },
    remove() {
      const { s, el: e } = el();
      const rids = relIds(e);
      remove(e);
      // its image or chart relationship goes too when nothing else on the slide uses it
      for (const rid of rids) if (!usesRel(deck.store.root(s.part), rid)) deck.store.removeRel(s.part, rid);
      deck.store.touch(s.part);
    },
  };
}

function describe(e: Element): string {
  if (e.localName === "pic") return "picture";
  if (e.localName === "grpSp") return "group";
  if (e.localName === "cxnSp") return "connector";
  if (e.localName === "graphicFrame") {
    const uri = attr(path(e, [A, "graphic"], [A, "graphicData"]) ?? e, "uri") ?? "";
    return uri.endsWith("/table") ? "table" : uri.endsWith("/chart") ? "chart" : "graphic";
  }
  return "shape";
}

/** The shape's p:spPr (p:grpSpPr for a group); graphic frames have none to fill. */
function shapeProps(e: Element, slide: number): Element {
  if (e.localName === "graphicFrame") throw bad(`a ${describe(e)} on slide ${slide} has no fill or line of its own`);
  return ensure(e, P, e.localName === "grpSp" ? "p:grpSpPr" : "p:spPr", [[P, "style"], [P, "txBody"], [P, "extLst"]]);
}

/** Write a box into the shape's own xfrm (made when it inherited one). */
function setXfrm(deck: DeckCore, s: SlideRef, e: Element, b: Emu): void {
  let xfrm: Element;
  if (e.localName === "graphicFrame") {
    xfrm = ensure(e, P, "p:xfrm", [[A, "graphic"]]);
  } else {
    const spPr = shapeProps(e, s.index);
    xfrm = ensure(spPr, A, "a:xfrm", [[A, "custGeom"], [A, "prstGeom"], [A, "noFill"], [A, "solidFill"], [A, "gradFill"], [A, "blipFill"], [A, "pattFill"], [A, "grpFill"], [A, "ln"], [A, "effectLst"], [A, "extLst"]]);
  }
  const off = ensure(xfrm, A, "a:off", [[A, "ext"]]);
  const ext = ensure(xfrm, A, "a:ext", [[A, "chOff"], [A, "chExt"]]);
  off.setAttribute("x", String(b.x));
  off.setAttribute("y", String(b.y));
  ext.setAttribute("cx", String(b.w));
  ext.setAttribute("cy", String(b.h));
  void deck;
}

/** The relationship ids an element and its descendants use (r:embed, r:id, r:link). */
function relIds(e: Element): string[] {
  const out: string[] = [];
  const walk = (n: Element) => {
    for (let i = 0; i < n.attributes.length; i++) {
      const a = n.attributes.item(i)!;
      if (a.namespaceURI === R) out.push(a.value);
    }
    for (const c of children(n)) walk(c);
  };
  walk(e);
  return out;
}

function usesRel(root: Element, rid: string): boolean {
  return relIds(root).includes(rid);
}
