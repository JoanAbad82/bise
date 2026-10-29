// check(): what an agent must fix before it says a deck is done, in data.
// Text that does not fit its box (measured with average glyph widths of a
// sans font: an estimate, said as one), shapes off the slide, empty
// placeholders, text boxes over each other, text too small to read, an
// empty slide, and the package's own problems (broken relationships).

import { checkPackage } from "../core/package.ts";
import type { Problem } from "../core/outline.ts";
import type { DeckCore } from "./deck.ts";
import { readShapes, type Para, type ShapeInfo } from "./read.ts";
import { overlapArea, pt, type Emu } from "./units.ts";
import { EMU_PER_PT } from "./units.ts";

/** A glyph's width in em, for a sans font like Arial or Calibri (an estimate: no font is loaded). */
export function glyphEm(ch: string): number {
  if (ch === " ") return 0.28;
  if ("iljtfI.,;:'!|()[]".includes(ch)) return 0.3;
  if ("mwMW@%".includes(ch)) return 0.88;
  if (/[A-Z]/.test(ch)) return 0.68;
  if (/[0-9]/.test(ch)) return 0.56;
  if (/[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/.test(ch)) return 1;
  return 0.52;
}

/** How many lines a paragraph takes in `width` points, at `size` points (greedy word wrap). */
export function linesOf(text: string, size: number, width: number, wrap = true): { lines: number; widest: number } {
  let lines = 0;
  let widest = 0;
  for (const hard of text.split("\v")) {
    const words = hard.split(/(\s+)/);
    let line = 0;
    let n = 1;
    for (const w of words) {
      const ww = [...w].reduce((s, c) => s + glyphEm(c), 0) * size;
      if (wrap && line > 0 && line + ww > width && w.trim()) {
        widest = Math.max(widest, line);
        n++;
        line = ww;
      } else line += ww;
    }
    widest = Math.max(widest, line);
    lines += n;
  }
  return { lines, widest };
}

/** The text's height in points in a box `width` wide, and its widest line. */
export function textHeight(paras: Para[], width: number, wrap: boolean): { height: number; widest: number } {
  let height = 0;
  let widest = 0;
  paras.forEach((p, i) => {
    const indent = p.bullet ? 18 * p.level : 0;
    const { lines, widest: w } = linesOf(p.text || " ", p.size, width - indent, wrap);
    height += lines * p.size * 1.2 + (i > 0 ? p.size * 0.2 : 0);
    widest = Math.max(widest, w + indent);
  });
  return { height, widest };
}

const label = (s: ShapeInfo) => `${s.name ? `"${s.name}" ` : ""}(shape ${s.id})`;
const short = (t: string) => (t.length > 40 ? `${t.slice(0, 40)}…` : t).replace(/[\n\v]/g, " / ");

export function check(deck: DeckCore): Problem[] {
  deck.store.flush();
  const out: Problem[] = checkPackage(deck.store.zip);
  const size = deck.size();
  const slideBox: Emu = { x: 0, y: 0, w: size.w, h: size.h };
  for (const s of deck.slides()) {
    const ctx = deck.ctx(s);
    const top = readShapes(ctx);
    const flat: ShapeInfo[] = [];
    const walk = (list: ShapeInfo[]) => list.forEach((i) => (flat.push(i), i.children && walk(i.children)));
    walk(top);
    const at = (i: ShapeInfo) => ({ kind: "shape" as const, slide: s.index, shape: i.id });
    if (!top.length) out.push({ code: "empty_slide", severity: "warning", at: { kind: "slide", slide: s.index }, message: `slide ${s.index} has nothing on it` });
    for (const i of flat) {
      const where = `slide ${s.index}: ${label(i)}`;
      if (i.box && (i.box.w > 0 || i.box.h > 0)) {
        const inside = overlapArea(i.box, slideBox);
        const area = Math.max(1, i.box.w * i.box.h);
        const tol = 2 * EMU_PER_PT;
        if (!inside) {
          out.push({ code: "off_slide", severity: "error", at: at(i), message: `${where} is off the slide (box at ${pt(i.box.x)}, ${pt(i.box.y)} pt; the slide is ${pt(size.w)} x ${pt(size.h)} pt)` });
        } else if (i.box.x < -tol || i.box.y < -tol || i.box.x + i.box.w > size.w + tol || i.box.y + i.box.h > size.h + tol) {
          const pct = Math.round((1 - inside / area) * 100);
          out.push({ code: "off_slide", severity: pct >= 10 ? "error" : "warning", at: at(i), message: `${where} goes past the slide's edge (${pct}% of it is outside; the slide is ${pt(size.w)} x ${pt(size.h)} pt)` });
        }
      }
      if (i.ph && i.type === "shape" && !(i.text ?? "").trim() && !["pic", "chart", "tbl", "media", "clipArt", "dgm", "dt", "ftr", "sldNum", "hdr"].includes(i.ph.type)) {
        out.push({ code: "empty_placeholder", severity: "warning", at: at(i), message: `${where} is an empty ${i.ph.type} placeholder: fill it or remove it (PowerPoint shows "Click to add text" there)` });
      }
      const text = i.paras.some((p) => p.text.trim());
      if (text && i.box) {
        const width = pt(i.box.w - i.inset[0] - i.inset[2]);
        const height = pt(i.box.h - i.inset[1] - i.inset[3]);
        const need = textHeight(i.paras, width, i.wrap);
        if (need.height > height * 1.05 && i.autofit !== "grow") {
          const shrink = i.autofit === "shrink";
          out.push({
            code: "overflow",
            severity: shrink ? "warning" : "error",
            at: at(i),
            message: `${where}: its text needs about ${Math.round(need.height)} pt of height, the box has ${Math.round(height)} pt ("${short(i.text ?? "")}")${shrink ? "; PowerPoint shrinks it to fit, other viewers may not" : ""}: cut the text, make the box taller, or the font smaller (an estimate from average letter widths)`,
          });
        }
        if (!i.wrap && need.widest > width * 1.05) {
          out.push({ code: "overflow", severity: "error", at: at(i), message: `${where}: a line of its text is about ${Math.round(need.widest)} pt wide, the box ${Math.round(width)} pt, and it does not wrap` });
        }
        const small = i.paras.filter((p) => p.text.trim() && p.size < 10);
        if (small.length) out.push({ code: "small_text", severity: "warning", at: at(i), message: `${where} has text at ${Math.min(...small.map((p) => p.size))} pt: below 10 pt is hard to read on a slide` });
      }
      if (i.type === "picture" && !i.image) out.push({ code: "broken_image", severity: "error", at: at(i), message: `${where} is a picture whose image is missing` });
    }
    // text over text: two shapes with text whose boxes overlap by more than a tenth of the smaller one
    const texts = flat.filter((i) => i.box && i.type !== "group" && (i.text ?? "").trim());
    for (let a = 0; a < texts.length; a++) {
      for (let b = a + 1; b < texts.length; b++) {
        const A = texts[a];
        const B = texts[b];
        const o = overlapArea(A.box!, B.box!);
        const smaller = Math.min(A.box!.w * A.box!.h, B.box!.w * B.box!.h);
        if (smaller > 0 && o > smaller * 0.1) {
          out.push({ code: "overlap", severity: "warning", at: at(B), message: `slide ${s.index}: ${label(A)} and ${label(B)} overlap, both with text: move one, or say why they should` });
        }
      }
    }
  }
  return out;
}
