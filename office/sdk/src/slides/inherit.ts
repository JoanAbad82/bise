// What a slide's shape inherits: a placeholder's box from its layout and
// master, a paragraph's font size, weight, color and alignment through the
// lstStyle chain (shape, layout, master, the master's text styles, the
// deck's default), and theme colors resolved to "#rrggbb". Read only.

import { attr, child, children, descendants, type Element } from "../core/xml.ts";
import { int, ln, path, PNS, REL } from "./dom.ts";
import type { Store } from "./store.ts";
import type { Emu } from "./units.ts";

const { a: A, p: P } = PNS;

/** The parts a slide draws from. */
export type Ctx = {
  store: Store;
  pres: string;
  slide: string;
  layout?: string;
  master?: string;
  theme?: string;
};

export function ctxOf(store: Store, pres: string, slide: string): Ctx {
  const layout = store.relTarget(slide, REL.slideLayout);
  const master = layout ? store.relTarget(layout, REL.slideMaster) : undefined;
  const theme = master ? store.relTarget(master, REL.theme) : undefined;
  const ok = (p: string | undefined) => (p && store.has(p) ? p : undefined);
  return { store, pres, slide, layout: ok(layout), master: ok(master), theme: ok(theme) };
}

// ---- placeholders

export type Ph = { type: string; idx: number; hasIdx: boolean };

/** A shape's placeholder (p:nvPr/p:ph), its type defaulting to "obj" as the spec says. */
export function phOf(shape: Element): Ph | undefined {
  const nv = children(shape).find((c) => ln(c).startsWith("nv"));
  const ph = path(nv, [P, "nvPr"], [P, "ph"]);
  if (!ph) return undefined;
  return { type: attr(ph, "type") ?? "obj", idx: int(ph, "idx") ?? 0, hasIdx: ph.hasAttribute("idx") };
}

const TITLE = new Set(["title", "ctrTitle"]);
const SPECIAL = new Set(["dt", "ftr", "sldNum", "hdr"]);

/** The master's placeholder type a slide placeholder falls back to. */
function masterType(t: string): string {
  if (TITLE.has(t)) return "title";
  if (SPECIAL.has(t)) return t;
  return "body";
}

function placeholders(store: Store, part: string | undefined): { el: Element; ph: Ph }[] {
  if (!part) return [];
  const tree = path(store.root(part), [P, "cSld"], [P, "spTree"]);
  if (!tree) return [];
  return children(tree)
    .map((el) => ({ el, ph: phOf(el) }))
    .filter((x): x is { el: Element; ph: Ph } => !!x.ph);
}

/** The layout's and the master's shapes a placeholder inherits from, nearest first. */
export function phChain(ctx: Ctx, ph: Ph): Element[] {
  const out: Element[] = [];
  const lay = placeholders(ctx.store, ctx.layout);
  const onLayout =
    (ph.hasIdx && !TITLE.has(ph.type) && lay.find((x) => x.ph.idx === ph.idx)) ||
    lay.find((x) => x.ph.type === ph.type) ||
    lay.find((x) => masterType(x.ph.type) === masterType(ph.type) && (TITLE.has(ph.type) || x.ph.idx === ph.idx));
  if (onLayout) out.push(onLayout.el);
  const want = masterType(onLayout?.ph.type ?? ph.type);
  const onMaster = placeholders(ctx.store, ctx.master).find((x) => masterType(x.ph.type) === want);
  if (onMaster) out.push(onMaster.el);
  return out;
}

/** The layout's placeholders a new slide on it gets (not the date, footer, slide number). */
export function layoutPlaceholders(store: Store, layout: string): Element[] {
  return placeholders(store, layout)
    .filter((x) => !SPECIAL.has(x.ph.type))
    .map((x) => x.el);
}

// ---- boxes

/** The element's own a:xfrm box, in EMU (p:xfrm for a graphic frame). */
export function ownXfrm(shape: Element): Emu | undefined {
  const xfrm = path(shape, [P, "spPr"], [A, "xfrm"]) ?? path(shape, [P, "grpSpPr"], [A, "xfrm"]) ?? child(shape, P, "xfrm");
  const off = xfrm && child(xfrm, A, "off");
  const ext = xfrm && child(xfrm, A, "ext");
  if (!off || !ext) return undefined;
  return { x: int(off, "x") ?? 0, y: int(off, "y") ?? 0, w: int(ext, "cx") ?? 0, h: int(ext, "cy") ?? 0 };
}

/** A shape's box: its own, else its placeholder's on the layout, else on the master. */
export function boxOf(ctx: Ctx, shape: Element): Emu | undefined {
  const own = ownXfrm(shape);
  if (own) return own;
  const ph = phOf(shape);
  if (!ph) return undefined;
  for (const el of phChain(ctx, ph)) {
    const b = ownXfrm(el);
    if (b) return b;
  }
  return undefined;
}

/** The slide size in EMU (p:sldSz), 16:9 when the deck does not say. */
export function slideSize(store: Store, pres: string): { w: number; h: number } {
  const sz = child(store.root(pres), P, "sldSz");
  return { w: int(sz, "cx") ?? 12192000, h: int(sz, "cy") ?? 6858000 };
}

// ---- colors

/** A color element's parent (a:solidFill, a:fontRef, ...) as "#rrggbb", through the theme. */
export function colorIn(ctx: Ctx, holder: Element | undefined): string | undefined {
  if (!holder) return undefined;
  const c = children(holder, A).find((e) => /Clr$/.test(ln(e)));
  if (!c) return undefined;
  let rgb: string | undefined;
  if (c.localName === "srgbClr") rgb = attr(c, "val");
  else if (c.localName === "sysClr") rgb = attr(c, "lastClr") ?? (attr(c, "val") === "window" ? "FFFFFF" : "000000");
  else if (c.localName === "schemeClr") rgb = schemeColor(ctx, attr(c, "val") ?? "");
  else if (c.localName === "prstClr") rgb = ({ black: "000000", white: "FFFFFF", red: "FF0000", green: "008000", blue: "0000FF" } as Record<string, string>)[attr(c, "val") ?? ""];
  if (!rgb || !/^[0-9a-f]{6}$/i.test(rgb)) return undefined;
  return `#${mods(rgb, c).toLowerCase()}`;
}

function schemeColor(ctx: Ctx, val: string): string | undefined {
  let name = val;
  if (ctx.master) {
    const map = child(ctx.store.root(ctx.master), P, "clrMap");
    const mapped = map && attr(map, val);
    if (mapped) name = mapped;
  }
  if (!ctx.theme) return undefined;
  const scheme = descendants(ctx.store.root(ctx.theme), A, "clrScheme")[0];
  const slot = scheme && child(scheme, A, name);
  const c = slot && children(slot)[0];
  if (!c) return undefined;
  return c.localName === "sysClr" ? attr(c, "lastClr") : attr(c, "val");
}

/** lumMod / lumOff / tint / shade, the modifiers themes use most. */
function mods(rgb: string, c: Element): string {
  let [h, s, l] = hsl(rgb);
  let [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(rgb.slice(i, i + 2), 16) / 255);
  let viaHsl = false;
  for (const m of children(c, A)) {
    const v = (int(m, "val") ?? 100000) / 100000;
    if (m.localName === "lumMod") ((l *= v), (viaHsl = true));
    else if (m.localName === "lumOff") ((l += v), (viaHsl = true));
    else if (m.localName === "tint" || m.localName === "shade") {
      if (viaHsl) [r, g, b] = rgbOf(h, s, l);
      [r, g, b] = [r, g, b].map((x) => (m.localName === "tint" ? x + (1 - x) * (1 - v) : x * v));
      [h, s, l] = hsl(toHex(r, g, b));
      viaHsl = false;
    }
  }
  if (viaHsl) [r, g, b] = rgbOf(h, s, Math.min(1, Math.max(0, l)));
  return toHex(r, g, b);
}

const toHex = (r: number, g: number, b: number) =>
  [r, g, b].map((x) => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();

function hsl(rgb: string): [number, number, number] {
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(rgb.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function rgbOf(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    const u = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (u < 1 / 6) return p + (q - p) * 6 * u;
    if (u < 1 / 2) return q;
    if (u < 2 / 3) return p + (q - p) * (2 / 3 - u) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}

/** A shape's fill: its own spPr fill, else its style's fillRef; "none" for no fill. */
export function fillOf(ctx: Ctx, shape: Element): string | undefined {
  const spPr = child(shape, P, "spPr");
  if (spPr && child(spPr, A, "noFill")) return "none";
  const own = spPr && child(spPr, A, "solidFill");
  if (own) return colorIn(ctx, own);
  const ref = path(shape, [P, "style"], [A, "fillRef"]);
  if (ref && (int(ref, "idx") ?? 0) > 0) return colorIn(ctx, ref);
  return undefined;
}

/** A shape's outline color, or "none". */
export function lineOf(ctx: Ctx, shape: Element): string | undefined {
  const ln = path(shape, [P, "spPr"], [A, "ln"]);
  if (ln && child(ln, A, "noFill")) return "none";
  const own = ln && child(ln, A, "solidFill");
  if (own) return colorIn(ctx, own);
  const ref = path(shape, [P, "style"], [A, "lnRef"]);
  if (ref && (int(ref, "idx") ?? 0) > 0) return colorIn(ctx, ref);
  return undefined;
}

// ---- text styles

/** What a run of text looks like, all resolved. */
export type RunStyle = { size: number; bold: boolean; italic: boolean; color?: string; font?: string; align?: string; bullet: boolean };

/**
 * The lvlNpPr elements a paragraph at `level` (1-9) of `shape` inherits
 * from, nearest first: the shape's lstStyle, its placeholder's on the
 * layout and master, the master's title/body/other style, the deck's
 * default text style.
 */
export function levelChain(ctx: Ctx, shape: Element | undefined, level: number): Element[] {
  const name = `lvl${level}pPr`;
  const out: Element[] = [];
  const fromList = (holder: Element | undefined) => {
    const l = holder && path(holder, [P, "txBody"], [A, "lstStyle"], [A, name]);
    if (l) out.push(l);
  };
  const ph = shape ? phOf(shape) : undefined;
  if (shape) fromList(shape);
  if (ph) for (const el of phChain(ctx, ph)) fromList(el);
  if (ctx.master) {
    const styles = child(ctx.store.root(ctx.master), P, "txStyles");
    const which = !ph ? "otherStyle" : TITLE.has(ph.type) ? "titleStyle" : SPECIAL.has(ph.type) ? "otherStyle" : "bodyStyle";
    const l = styles && path(styles, [P, which], [A, name]);
    if (l) out.push(l);
  }
  const def = path(ctx.store.root(ctx.pres), [P, "defaultTextStyle"], [A, name]);
  if (def) out.push(def);
  return out;
}

/** The style of a run (`rPr` may be undefined) in paragraph `para` of `shape`. */
export function runStyle(ctx: Ctx, shape: Element | undefined, para: Element, rPr: Element | undefined): RunStyle {
  const pPr = child(para, A, "pPr");
  const level = (int(pPr, "lvl") ?? 0) + 1;
  const chain = levelChain(ctx, shape, level);
  const defs = chain.map((l) => child(l, A, "defRPr")).filter((d): d is Element => !!d);
  const rprs = [rPr, ...defs].filter((d): d is Element => !!d);
  const first = <T>(f: (e: Element) => T | undefined, list: Element[]): T | undefined => {
    for (const e of list) {
      const v = f(e);
      if (v !== undefined) return v;
    }
    return undefined;
  };
  const scale = (int(path(shape, [P, "txBody"], [A, "bodyPr"], [A, "normAutofit"]), "fontScale") ?? 100000) / 100000;
  const size = ((first((e) => int(e, "sz"), rprs) ?? 1800) / 100) * scale;
  const flag = (n: string) => first((e) => (e.hasAttribute(n) ? ["1", "true"].includes(e.getAttribute(n)!) : undefined), rprs) ?? false;
  const fontRef = shape ? path(shape, [P, "style"], [A, "fontRef"]) : undefined;
  const color = first((e) => colorIn(ctx, child(e, A, "solidFill")), rprs.slice(0, 1)) ?? colorIn(ctx, fontRef) ?? first((e) => colorIn(ctx, child(e, A, "solidFill")), defs);
  const font = first((e) => attr(child(e, A, "latin") ?? e, "typeface"), rprs);
  const align = first((e) => attr(e, "algn"), [pPr, ...chain].filter((d): d is Element => !!d));
  const bu = first((e) => {
    if (child(e, A, "buNone")) return false;
    if (child(e, A, "buChar") || child(e, A, "buAutoNum") || child(e, A, "buBlip")) return true;
    return undefined;
  }, [pPr, ...chain].filter((d): d is Element => !!d));
  return { size, bold: flag("b"), italic: flag("i"), color, font: font && !font.startsWith("+") ? font : themeFont(ctx, font), align, bullet: bu ?? false };
}

/** "+mn-lt" / "+mj-lt" as the theme's minor or major Latin font. */
function themeFont(ctx: Ctx, ref: string | undefined): string | undefined {
  if (!ctx.theme) return undefined;
  const which = ref === "+mj-lt" ? "majorFont" : "minorFont";
  const f = descendants(ctx.store.root(ctx.theme), A, which)[0];
  return attr(child(f, A, "latin") ?? f, "typeface");
}
