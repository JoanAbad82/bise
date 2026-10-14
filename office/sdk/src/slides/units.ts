// Units and small values of the slides module: boxes in points (EMU/12700,
// a 16:9 slide is 960 x 540 pt), colors as "#rrggbb", text that goes into
// XML escaped. Pure, no DOM.

import { OfficeError } from "../core/errors.ts";

/** EMU per point: OOXML lengths are EMU (914400 per inch, 72 pt per inch). */
export const EMU_PER_PT = 12700;

/** A box on the slide, in points: [x, y, w, h] (what inspect() gives), or the same as an object. */
export type Box = [number, number, number, number] | { x: number; y: number; w: number; h: number };

/** A box in EMU, the unit of the XML. */
export type Emu = { x: number; y: number; w: number; h: number };

export const pt = (emu: number): number => Math.round((emu / EMU_PER_PT) * 100) / 100;
export const emu = (points: number): number => Math.round(points * EMU_PER_PT);

/** The box in EMU; throws bad_arg on a box with a missing, negative or not-a-number side. */
export function boxEmu(box: Box, what = "box"): Emu {
  const b = Array.isArray(box) ? { x: box[0], y: box[1], w: box[2], h: box[3] } : box;
  if (!b || ![b.x, b.y, b.w, b.h].every((v) => typeof v === "number" && Number.isFinite(v)) || b.w <= 0 || b.h <= 0) {
    throw new OfficeError("bad_arg", `a ${what} is [x, y, w, h] in points (a 16:9 slide is 960 x 540), w and h above 0; got ${JSON.stringify(box)}`);
  }
  return { x: emu(b.x), y: emu(b.y), w: emu(b.w), h: emu(b.h) };
}

/** An EMU box as inspect() says it: [x, y, w, h] in points. */
export const boxPt = (e: Emu): [number, number, number, number] => [pt(e.x), pt(e.y), pt(e.w), pt(e.h)];

/** "#1f2328", "1F2328" or "#abc" as the XML's "1F2328"; throws bad_arg otherwise. */
export function hex(color: string): string {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(String(color).trim());
  if (!m) throw new OfficeError("bad_arg", `a color is "#rrggbb" (like "#1f6feb"), got ${JSON.stringify(color)}`);
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return h.toUpperCase();
}

/** Text for XML content and attribute values. */
export function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // XML 1.0 refuses these control characters even escaped
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

/** Do two EMU boxes overlap, and by how much (EMU²). */
export function overlapArea(a: Emu, b: Emu): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}
