// The slides module (pptx): open a deck or create one, inspect it, edit it
// by anchor or by slide, check it, save it (docs/office.md, "Slides").
//
//   const deck = await slides.create();                    // 16:9, six layouts, no slide
//   const s = deck.addSlide({ layout: "title-body" });
//   s.placeholder("title")!.setText("Q3 review");
//   s.addChart({ type: "column", categories: ["Jul", "Aug"], series: [{ name: "Revenue", values: [120, 140] }] }, [480, 120, 432, 360]);
//   deck.check();                                         // overflow, off_slide, empty_placeholder, ...
//   await run.write("q3.pptx", await deck.save());
//
// Create is our own template (template.ts) plus the edit layer, no
// pptxgenjs (architect m_23769): the module needs no timers and no node
// shims, so it runs the same in `bise office run`, the viewer and node.
// Edits keep every part and attribute they do not touch (store.ts).

import { anchorFor, type Anchor } from "../core/anchor.ts";
import { OfficeError } from "../core/errors.ts";
import type { OfficeFile, Outline, Problem } from "../core/outline.ts";
import { check } from "./check.ts";
import { DeckCore, type LayoutInfo } from "./deck.ts";
import { slideSel, shapeSel, type ShapeOps, type ShapeSel, type SlideOps, type SlideSel } from "./ops.ts";
import { outline } from "./outline.ts";
import { pt } from "./units.ts";
import type { SlideSize } from "./template.ts";

export type { SlideOps, ShapeOps, SlideSel, ShapeSel, SlideSize };
export type { Box, ChartInput, ShapeLook, TableOpts, TextInput, TextStyle } from "./ops.ts";
export { LAYOUTS } from "./template.ts";

type SlideAnchor = Extract<Anchor, { kind: "slide" }>;
type ShapeAnchor = Extract<Anchor, { kind: "shape" }>;

/** An open deck. */
export class Deck implements OfficeFile<"pptx", SlideOps | ShapeOps> {
  readonly kind = "pptx" as const;
  private core: DeckCore;

  constructor(core: DeckCore) {
    this.core = core;
  }

  /** The slide size in points (960 x 540 for 16:9). */
  get size(): { w: number; h: number } {
    const s = this.core.size();
    return { w: pt(s.w), h: pt(s.h) };
  }

  /** How many slides. */
  get count(): number {
    return this.core.slides().length;
  }

  /** The layouts a slide can be added on: { key? (ours: title, title-body, ...), name, type }. */
  layouts(): Omit<LayoutInfo, "part">[] {
    return this.core.layouts().map(({ part: _part, ...l }) => l);
  }

  /** Slide `n`, from 1. */
  slide(n: number): SlideSel {
    return slideSel(this.core, this.core.slideAt(n).sldId);
  }

  slides(): SlideSel[] {
    return this.core.slides().map((s) => slideSel(this.core, s.sldId));
  }

  /** A new slide on a layout (key, name or number; default "title-body"), with its placeholders, at `at` (default last). */
  addSlide(opts: { layout?: string | number; at?: number } = {}): SlideSel {
    return slideSel(this.core, this.core.addSlide(opts).sldId);
  }

  inspect(): Outline {
    return outline(this.core);
  }

  at(anchor: SlideAnchor): SlideSel;
  at(anchor: ShapeAnchor): ShapeSel;
  at(anchor: Anchor): SlideSel | ShapeSel;
  at(anchor: Anchor): SlideSel | ShapeSel {
    const a = anchorFor("pptx", anchor);
    if (a.kind === "slide") return slideSel(this.core, this.core.slideAt(a.slide).sldId, a.rect);
    if (a.kind !== "shape") throw new OfficeError("anchor_kind_mismatch", `a ${a.kind} anchor does not point into a pptx`);
    const s = this.core.slideAt(a.slide);
    if (!this.core.shapeEl(s, a.shape)) {
      throw new OfficeError("not_found", `slide ${a.slide} has no shape ${a.shape} (any more): the deck changed since the note; inspect() and find it by its text${a.quote ? ` ("${a.quote}")` : ""}`);
    }
    return shapeSel(this.core, s.sldId, a.shape, a.quote);
  }

  check(): Problem[] {
    return check(this.core);
  }

  async save(): Promise<Uint8Array> {
    return this.core.save();
  }
}

export const slides = {
  /** A pptx's bytes as a deck; throws OfficeError (not_a_zip, not_office, bad_xml). */
  async open(bytes: Uint8Array): Promise<Deck> {
    return new Deck(DeckCore.open(bytes));
  },
  /** A new, empty deck: 16:9 (960 x 540 pt) or 4:3 (720 x 540 pt). */
  async create(opts: { size?: SlideSize } = {}): Promise<Deck> {
    const size = opts.size ?? "16:9";
    if (size !== "16:9" && size !== "4:3") throw new OfficeError("bad_arg", `a deck's size is "16:9" or "4:3", got ${JSON.stringify(size)}`);
    return new Deck(DeckCore.create(size));
  },
};
