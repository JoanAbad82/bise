// inspect(): the body as outline nodes in document order. A paragraph is
// {id: w14:paraId, type: "para"}; a table is a "table" node whose children
// are its paragraphs, row by row, cell by cell; a paragraph's comments and
// tracked changes are its children ("comment", "change"). Headers,
// footers, footnotes and text boxes are not in it (the viewer counts on it).

import type { Anchor } from "../anchor.gen.ts";
import type { Outline, OutlineNode } from "../core/outline.ts";
import type { Element } from "../core/xml.ts";
import { listChanges, type TrackedChange } from "./changes.ts";
import { listComments, type Comment } from "./comments.ts";
import { blocksOf, cellsOfRow, rowsOf, type Model } from "./model.ts";
import { headingLevel, listOrdered, readStyles, type StyleInfo } from "./styles.ts";
import { scan } from "./text.ts";
import { A, getW, R, W, wkid, WP } from "./w.ts";

type Ctx = {
  m: Model;
  styles: Map<string, StyleInfo>;
  comments: Map<string, Comment[]>;
  changes: Map<string, TrackedChange[]>;
  links: Map<string, string>;
};

export function inspect(m: Model): Outline {
  const ctx: Ctx = { m, styles: readStyles(m.parts), comments: new Map(), changes: new Map(), links: new Map() };
  for (const c of listComments(m)) if (c.para) push(ctx.comments, c.para, c);
  for (const c of listChanges(m)) push(ctx.changes, c.para, c);
  for (const r of m.parts.rels()) if (r.external) ctx.links.set(r.id, r.target);
  return { kind: "docx", nodes: blocks(ctx, m.body) };
}

function push<T>(map: Map<string, T[]>, k: string, v: T): void {
  const list = map.get(k);
  if (list) list.push(v);
  else map.set(k, [v]);
}

function blocks(ctx: Ctx, parent: Element, cell?: { row: number; col: number }): OutlineNode[] {
  const out: OutlineNode[] = [];
  for (const b of blocksOf(parent)) out.push(b.kind === "p" ? para(ctx, b.el, cell) : table(ctx, b.el));
  return out;
}

export function paraAnchor(id: string, quote?: string): Anchor {
  return quote ? { kind: "para", para: id, quote } : { kind: "para", para: id };
}

/** A paragraph's own facts: its style, heading level, list, alignment, images, links. */
export function paraProps(ctx: { m: Model; styles: Map<string, StyleInfo>; links?: Map<string, string> }, p: Element): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const pPr = wkid(p, "pPr");
  const styleEl = pPr && wkid(pPr, "pStyle");
  const style = styleEl ? getW(styleEl, "val") : undefined;
  if (style) out.style = style;
  const lvlEl = pPr && wkid(pPr, "outlineLvl");
  const level = headingLevel(ctx.styles, style, lvlEl ? Number(getW(lvlEl, "val")) : undefined);
  if (level !== undefined) out.level = level;
  const numPr = pPr && wkid(pPr, "numPr");
  const numId = (numPr && wkid(numPr, "numId") && getW(wkid(numPr, "numId")!, "val")) ?? (style ? ctx.styles.get(style)?.numId : undefined);
  if (numId && numId !== "0") {
    const ilvl = Number((numPr && wkid(numPr, "ilvl") && getW(wkid(numPr, "ilvl")!, "val")) ?? 0);
    const ordered = listOrdered(ctx.m.parts, numId, ilvl);
    out.list = { level: ilvl + 1, ordered: ordered ?? false };
  }
  const jc = pPr && wkid(pPr, "jc");
  const align = jc && getW(jc, "val");
  if (align && align !== "left" && align !== "start") out.align = align === "both" ? "justify" : align;
  const pics = p.getElementsByTagNameNS(WP, "docPr");
  if (pics.length) {
    const imgs: { name: string; alt?: string }[] = [];
    for (let i = 0; i < pics.length; i++) {
      const d = pics.item(i)!;
      imgs.push(d.getAttribute("descr") ? { name: d.getAttribute("name") ?? "", alt: d.getAttribute("descr")! } : { name: d.getAttribute("name") ?? "" });
    }
    out.images = imgs;
  }
  const hl = p.getElementsByTagNameNS(W, "hyperlink");
  const urls: string[] = [];
  for (let i = 0; i < hl.length; i++) {
    const rid = hl.item(i)!.getAttributeNS(R, "id");
    const url = rid ? ctx.links?.get(rid) : undefined;
    if (url) urls.push(url);
  }
  if (urls.length) out.links = urls;
  void A;
  return out;
}

function para(ctx: Ctx, p: Element, cell?: { row: number; col: number }): OutlineNode {
  const id = ctx.m.paraId(p);
  const props = paraProps(ctx, p);
  if (cell) props.cell = cell;
  const node: OutlineNode = { id, type: "para", anchor: paraAnchor(id), text: scan(p).text };
  if (Object.keys(props).length) node.props = props;
  const kids: OutlineNode[] = [];
  for (const c of ctx.comments.get(id) ?? []) {
    const cp: Record<string, unknown> = { author: c.author, done: c.done };
    if (c.quote) cp.quote = c.quote;
    if (c.replyTo) cp.replyTo = c.replyTo;
    if (c.date) cp.date = c.date;
    kids.push({ id: `comment:${c.id}`, type: "comment", anchor: paraAnchor(id, c.quote || undefined), text: c.text, props: cp });
  }
  const seen = new Map<string, number>();
  for (const c of ctx.changes.get(id) ?? []) {
    const n = (seen.get(c.id) ?? 0) + 1;
    seen.set(c.id, n);
    const cp: Record<string, unknown> = { kind: c.kind, author: c.author, change: c.id };
    if (c.date) cp.date = c.date;
    kids.push({ id: n > 1 ? `change:${c.id}#${n}` : `change:${c.id}`, type: "change", anchor: paraAnchor(id), text: c.text, props: cp });
  }
  if (kids.length) node.children = kids;
  return node;
}

function table(ctx: Ctx, tbl: Element): OutlineNode {
  const rows = rowsOf(tbl);
  const kids: OutlineNode[] = [];
  let cols = 0;
  rows.forEach((tr, r) => {
    const cells = cellsOfRow(tr);
    cols = Math.max(cols, cells.length);
    cells.forEach((tc, c) => kids.push(...blocks(ctx, tc, { row: r + 1, col: c + 1 })));
  });
  const first = kids.find((k) => k.type === "para");
  const id = `table:${first?.id ?? "empty"}`;
  const props: Record<string, unknown> = { rows: rows.length, cols };
  const st = wkid(tbl, "tblPr") && wkid(wkid(tbl, "tblPr")!, "tblStyle");
  if (st) props.style = getW(st, "val");
  return { id, type: "table", anchor: paraAnchor(first?.id ?? ""), props, children: kids };
}
