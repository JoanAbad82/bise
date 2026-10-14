// A slide's shapes as data: what inspect() shows and check() measures.
// One ShapeInfo per p:sp, p:pic, p:graphicFrame (table, chart, SmartArt),
// p:grpSp and p:cxnSp, its box on the slide (a group's children mapped
// out of the group's own frame), its text by paragraph, its resolved style.

import { attr, child, children, type Element } from "../core/xml.ts";
import { readChart, type ChartData } from "./chart.ts";
import { int, ln, path, PNS, REL } from "./dom.ts";
import { boxOf, colorIn, fillOf, lineOf, phOf, runStyle, type Ctx, type Ph } from "./inherit.ts";
import type { Emu } from "./units.ts";

const { a: A, p: P } = PNS;

export type ShapeType = "shape" | "picture" | "table" | "chart" | "group" | "connector" | "graphic";

export type Para = { text: string; level: number; bullet: boolean; size: number; bold: boolean; italic: boolean; color?: string; font?: string; align?: string };

export type ShapeInfo = {
  el: Element;
  /** p:cNvPr/@id, unique on its slide */
  id: string;
  name: string;
  type: ShapeType;
  box?: Emu;
  ph?: Ph;
  /** the shape's text, paragraphs joined by "\n" ("" when it has a text body with nothing in it) */
  text?: string;
  paras: Para[];
  fill?: string;
  line?: string;
  geometry?: string;
  image?: string;
  alt?: string;
  rows?: string[][];
  chart?: ChartData;
  notDrawn?: string;
  /** what the text body says about fitting: "shrink", "grow" or none */
  autofit?: "shrink" | "grow";
  wrap: boolean;
  /** text insets in EMU: left, top, right, bottom */
  inset: [number, number, number, number];
  valign?: string;
  children?: ShapeInfo[];
};

const SHAPES = new Set(["sp", "pic", "graphicFrame", "grpSp", "cxnSp", "contentPart"]);

/** The shape elements of a tree (p:spTree or p:grpSp), AlternateContent opened to its first choice. */
export function shapeEls(tree: Element): Element[] {
  const out: Element[] = [];
  for (const el of children(tree)) {
    if (el.namespaceURI === P && SHAPES.has(ln(el))) out.push(el);
    else if (el.localName === "AlternateContent" && el.namespaceURI === PNS.mc) {
      const choice = child(el, PNS.mc, "Choice") ?? child(el, PNS.mc, "Fallback");
      const inner = choice && children(choice).find((c) => c.namespaceURI === P && SHAPES.has(ln(c)));
      if (inner) out.push(inner);
    }
  }
  return out;
}

/** The shape's p:cNvPr (its id and name). */
export function cNvPr(shape: Element): Element | undefined {
  const nv = children(shape).find((c) => ln(c).startsWith("nv"));
  return nv && child(nv, P, "cNvPr");
}

export function spTree(ctx: Ctx): Element {
  const tree = path(ctx.store.root(ctx.slide), [P, "cSld"], [P, "spTree"]);
  if (!tree) throw new Error(`${ctx.slide} has no p:spTree`);
  return tree;
}

/** Every shape of the slide, groups with their children. */
export function readShapes(ctx: Ctx): ShapeInfo[] {
  return shapeEls(spTree(ctx)).map((el) => readShape(ctx, el, undefined));
}

type Frame = (b: Emu) => Emu;

function readShape(ctx: Ctx, el: Element, frame: Frame | undefined): ShapeInfo {
  const nv = cNvPr(el);
  const own = boxOf(ctx, el);
  const box = own && frame ? frame(own) : own;
  const info: ShapeInfo = {
    el,
    id: attr(nv ?? el, "id") ?? "",
    name: attr(nv ?? el, "name") ?? "",
    type: "shape",
    box,
    ph: phOf(el),
    paras: [],
    wrap: true,
    inset: [91440, 45720, 91440, 45720],
  };
  const alt = nv && attr(nv, "descr");
  if (alt) info.alt = alt;
  switch (el.localName) {
    case "sp":
      readText(ctx, el, info);
      info.fill = fillOf(ctx, el);
      info.line = lineOf(ctx, el);
      info.geometry = attr(path(el, [P, "spPr"], [A, "prstGeom"]) ?? el, "prst") ?? (path(el, [P, "spPr"], [A, "custGeom"]) ? "custom" : undefined);
      break;
    case "cxnSp":
      info.type = "connector";
      info.line = lineOf(ctx, el);
      break;
    case "pic": {
      info.type = "picture";
      const blip = path(el, [P, "blipFill"], [A, "blip"]);
      const rid = blip && attr(blip, "embed", PNS.r);
      const rel = rid ? ctx.store.rel(ctx.slide, rid) : undefined;
      if (rel && !rel.external) info.image = rel.target;
      break;
    }
    case "graphicFrame":
      readFrame(ctx, el, info);
      break;
    case "grpSp": {
      info.type = "group";
      const xfrm = path(el, [P, "grpSpPr"], [A, "xfrm"]);
      const chOff = xfrm && child(xfrm, A, "chOff");
      const chExt = xfrm && child(xfrm, A, "chExt");
      let inner: Frame | undefined = frame;
      if (own && chOff && chExt) {
        const cx = int(chOff, "x") ?? 0;
        const cy = int(chOff, "y") ?? 0;
        const sx = (int(chExt, "cx") ?? 0) ? own.w / int(chExt, "cx")! : 1;
        const sy = (int(chExt, "cy") ?? 0) ? own.h / int(chExt, "cy")! : 1;
        const local: Frame = (b) => ({ x: own.x + (b.x - cx) * sx, y: own.y + (b.y - cy) * sy, w: b.w * sx, h: b.h * sy });
        inner = frame ? (b) => frame(local(b)) : local;
      }
      info.children = shapeEls(el).map((c) => readShape(ctx, c, inner));
      break;
    }
    default:
      info.type = "graphic";
      info.notDrawn = ln(el);
  }
  return info;
}

/** The text body of a shape or a table cell, by paragraph. */
export function readText(ctx: Ctx, el: Element, info: ShapeInfo): void {
  const body = child(el, P, "txBody");
  if (!body) return;
  const bodyPr = child(body, A, "bodyPr");
  if (bodyPr) {
    if (child(bodyPr, A, "normAutofit")) info.autofit = "shrink";
    else if (child(bodyPr, A, "spAutoFit")) info.autofit = "grow";
    info.wrap = attr(bodyPr, "wrap") !== "none";
    info.inset = [
      int(bodyPr, "lIns") ?? 91440,
      int(bodyPr, "tIns") ?? 45720,
      int(bodyPr, "rIns") ?? 91440,
      int(bodyPr, "bIns") ?? 45720,
    ];
    info.valign = { t: "top", ctr: "middle", b: "bottom" }[attr(bodyPr, "anchor") ?? ""] ?? undefined;
  }
  info.paras = children(body, A, "p").map((p) => readPara(ctx, el, p));
  info.text = info.paras.map((p) => p.text).join("\n");
}

function readPara(ctx: Ctx, shape: Element | undefined, p: Element): Para {
  let text = "";
  let firstRPr: Element | undefined;
  let seen = false;
  for (const r of children(p, A)) {
    if (r.localName === "r" || r.localName === "fld") {
      if (!seen) ((firstRPr = child(r, A, "rPr")), (seen = true));
      text += child(r, A, "t")?.textContent ?? "";
    } else if (r.localName === "br") text += "\v";
  }
  if (!seen) firstRPr = child(p, A, "endParaRPr");
  const s = runStyle(ctx, shape, p, firstRPr);
  const level = (int(child(p, A, "pPr"), "lvl") ?? 0) + 1;
  return { text, level, ...s, bullet: s.bullet && text.length > 0 };
}

function readFrame(ctx: Ctx, el: Element, info: ShapeInfo): void {
  const data = path(el, [A, "graphic"], [A, "graphicData"]);
  const uri = data ? (attr(data, "uri") ?? "") : "";
  if (uri.endsWith("/table")) {
    info.type = "table";
    const tbl = child(data!, A, "tbl");
    info.rows = tbl ? children(tbl, A, "tr").map((tr) => children(tr, A, "tc").map((tc) => cellText(tc))) : [];
    info.text = info.rows.map((r) => r.join("\t")).join("\n");
  } else if (uri.endsWith("/chart")) {
    info.type = "chart";
    const rid = attr(child(data!, PNS.c, "chart") ?? data!, "id", PNS.r);
    const rel = rid ? ctx.store.rel(ctx.slide, rid) : undefined;
    if (rel && !rel.external && ctx.store.has(rel.target)) {
      info.chart = readChart(ctx.store.root(rel.target), (h) => colorIn(ctx, h));
      if (info.chart.title) info.text = info.chart.title;
    } else info.notDrawn = "chart";
  } else {
    info.type = "graphic";
    info.notDrawn = uri.endsWith("/diagram") ? "smartart" : uri.slice(uri.lastIndexOf("/") + 1) || "graphic";
  }
}

/** A table cell's text, paragraphs joined by "\n". */
export function cellText(tc: Element): string {
  const body = child(tc, A, "txBody");
  if (!body) return "";
  return children(body, A, "p")
    .map((p) =>
      children(p, A)
        .filter((r) => r.localName === "r" || r.localName === "fld")
        .map((r) => child(r, A, "t")?.textContent ?? "")
        .join(""),
    )
    .join("\n");
}

/** The speaker notes of a slide, or undefined. */
export function notesOf(ctx: Ctx): string | undefined {
  const notes = ctx.store.relTarget(ctx.slide, REL.notesSlide);
  if (!notes || !ctx.store.has(notes)) return undefined;
  const tree = path(ctx.store.root(notes), [P, "cSld"], [P, "spTree"]);
  if (!tree) return undefined;
  for (const el of shapeEls(tree)) {
    const ph = phOf(el);
    if (ph?.type !== "body") continue;
    const body = child(el, P, "txBody");
    const text = body
      ? children(body, A, "p")
          .map((p) => children(p, A, "r").map((r) => child(r, A, "t")?.textContent ?? "").join(""))
          .join("\n")
      : "";
    return text.trim() ? text : undefined;
  }
  return undefined;
}

/** The slide's own background color, when it sets one. */
export function backgroundOf(ctx: Ctx): string | undefined {
  for (const part of [ctx.slide, ctx.layout, ctx.master]) {
    if (!part) continue;
    const bg = path(ctx.store.root(part), [P, "cSld"], [P, "bg"]);
    if (!bg) continue;
    const fill = path(bg, [P, "bgPr"], [A, "solidFill"]);
    if (fill) return colorIn(ctx, fill);
    const ref = child(bg, P, "bgRef");
    if (ref) return colorIn(ctx, ref);
    return undefined;
  }
  return undefined;
}
