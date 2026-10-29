// inspect(): the deck as an outline. One node per slide (id `s<sldId>`,
// stable when slides move), its shapes as children (id `s<sldId>/<cNvPr
// id>`, anchor.shape the cNvPr id). Boxes in points on the slide; colors
// "#rrggbb" through the theme. The side panel's viewer draws from this.

import type { Outline, OutlineNode } from "../core/outline.ts";
import type { DeckCore, SlideRef } from "./deck.ts";
import type { Ctx } from "./inherit.ts";
import { backgroundOf, notesOf, readShapes, type ShapeInfo } from "./read.ts";
import { boxPt, pt } from "./units.ts";

export function outline(deck: DeckCore): Outline {
  const size = deck.size();
  return { kind: "pptx", nodes: deck.slides().map((s) => slideNode(deck, s, size)) };
}

export function slideNode(deck: DeckCore, s: SlideRef, size = deck.size()): OutlineNode {
  const ctx = deck.ctx(s);
  const layout = deck.layouts().find((l) => l.part === ctx.layout);
  const props: Record<string, unknown> = { index: s.index, w: pt(size.w), h: pt(size.h) };
  if (layout) props.layout = layout.key ?? layout.name;
  const bg = backgroundOf(ctx);
  if (bg) props.background = bg;
  const notes = notesOf(ctx);
  if (notes) props.notes = notes;
  return {
    id: `s${s.sldId}`,
    type: "slide",
    anchor: { kind: "slide", slide: s.index },
    ...(layout ? { name: layout.name } : {}),
    props,
    children: readShapes(ctx).map((i) => shapeNode(ctx, s, i)),
  };
}

export function shapeNode(ctx: Ctx, s: SlideRef, i: ShapeInfo): OutlineNode {
  const props: Record<string, unknown> = {};
  if (i.box) props.box = boxPt(i.box);
  if (i.ph) props.placeholder = i.ph.type;
  for (const k of ["fill", "line", "geometry", "image", "alt", "rows", "chart", "notDrawn", "valign"] as const) {
    if (i[k] !== undefined) props[k] = i[k];
  }
  const lead = i.paras.find((p) => p.text) ?? i.paras[0];
  if (lead) {
    props.fontSize = lead.size;
    if (lead.bold) props.bold = true;
    if (lead.italic) props.italic = true;
    if (lead.color) props.color = lead.color;
    if (lead.font) props.font = lead.font;
    if (lead.align) props.align = { l: "left", ctr: "center", r: "right", just: "justify" }[lead.align] ?? lead.align;
  }
  if (i.paras.length > 1 || i.paras.some((p) => p.bullet)) {
    props.paras = i.paras.map((p) => {
      const o: Record<string, unknown> = { text: p.text, level: p.level, size: p.size };
      if (p.bullet) o.bullet = true;
      if (p.bold) o.bold = true;
      if (p.italic) o.italic = true;
      if (p.color) o.color = p.color;
      if (p.align) o.align = { l: "left", ctr: "center", r: "right", just: "justify" }[p.align] ?? p.align;
      return o;
    });
  }
  const node: OutlineNode = {
    id: `s${s.sldId}/${i.id}`,
    type: i.type,
    anchor: { kind: "shape", slide: s.index, shape: i.id },
    props,
  };
  if (i.name) node.name = i.name;
  if (i.text !== undefined) node.text = i.text;
  if (i.children) node.children = i.children.map((c) => shapeNode(ctx, s, c));
  return node;
}
