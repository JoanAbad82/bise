// bise kit · the pptx renderer of the office viewer (viewer.js; plan §4): the slides module's
// outline (slides.open(bytes).inspect(), office-slides m_23797: boxes in pt, colors resolved)
// as HTML, one 16:9 (or the deck's) box per slide scaled to the frame, a slide rail on the
// left, ←/→ to move. Text with its paragraphs, filled and outlined shapes, pictures (their
// bytes from the file's zip), tables, and charts as SVG from their data. A click on a shape
// selects it (an Anchor `shape`). Not drawn, said in the foot: what the module marks notDrawn
// (SmartArt and animations show their text only).
//
// Pure helpers (exported for office/sdk/test/viewer.test.ts): pct, chartSvg.

import { slides, openPackage } from "/kit/office/office.js";
import type { OutlineNode, Package } from "/kit/office/office.js";

// what slides' inspect() says in a node's props (office/sdk/src/slides), the fields drawn here
type Chart = { series?: { values?: (number | null)[] }[]; categories?: unknown[]; title?: string; type?: string };
type Para = { text?: string; bullet?: string; level?: number; size?: number; bold?: boolean; color?: string; align?: string };
type Props = {
  valign?: string; paras?: Para[]; fontSize?: number; bold?: boolean; italic?: boolean; color?: string; align?: string;
  notDrawn?: string; box?: number[]; fill?: string; line?: string; geometry?: string; font?: string; image?: string;
  rows?: unknown[][]; chart?: Chart; w?: number; h?: number; background?: string;
};
type Ctx = { zip: Package["zip"] | null; urls: string[]; notDrawn: Set<string> };
type Slide = { n: number; w: number; h: number };
type Drawn = Slide & { box: HTMLDivElement; fit?: () => void; thumb?: Drawn };
const propsOf = (n: OutlineNode) => (n.props || {}) as Props;

const SVG = "http://www.w3.org/2000/svg";

/** A box in pt as left/top/width/height in % of a slide of w × h pt. */
export function pct(box: number[], w: number, h: number) {
  const [x, y, bw, bh] = box;
  return { left: (x / w) * 100, top: (y / h) * 100, width: (bw / w) * 100, height: (bh / h) * 100 };
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string | null, text?: string) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function svgEl(tag: string, attrs: Record<string, string | number>) {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

/** A chart's data as an SVG (bars, or lines for a line chart), in a 400 × 240 box. */
export function chartSvg(chart: Chart | null | undefined) {
  const svg = svgEl("svg", { viewBox: "0 0 400 240", class: "office-chart", role: "img" });
  const series = (chart && chart.series) || [];
  const cats = (chart && chart.categories) || [];
  const values = series.flatMap((s) => (s.values || []).filter((v) => typeof v === "number"));
  if (chart && chart.title) {
    const t = svgEl("text", { x: 200, y: 18, "text-anchor": "middle", class: "title" });
    t.textContent = chart.title;
    svg.append(t);
  }
  if (values.length === 0) return svg;
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const [x0, y0, w, h] = [36, 30, 352, 180];
  const y = (v: number) => y0 + h - ((v - min) / (max - min || 1)) * h;
  svg.append(svgEl("line", { x1: x0, y1: y(0), x2: x0 + w, y2: y(0), class: "axis" }));
  const n = Math.max(cats.length, ...series.map((s) => (s.values || []).length));
  const line = /line|scatter/i.test((chart && chart.type) || "");
  series.forEach((s, si) => {
    const vs = s.values || [];
    if (line) {
      const pts = vs.map((v, i) => `${x0 + ((i + 0.5) / n) * w},${y(v || 0)}`).join(" ");
      svg.append(svgEl("polyline", { points: pts, class: `s${si % 6}`, fill: "none" }));
      return;
    }
    const bw = w / n / (series.length + 1);
    vs.forEach((v, i) => {
      if (typeof v !== "number") return;
      const top = Math.min(y(v), y(0));
      svg.append(svgEl("rect", { x: x0 + (i * w) / n + bw * (si + 0.5), y: top, width: bw, height: Math.abs(y(v) - y(0)), class: `s${si % 6}` }));
    });
  });
  cats.forEach((c, i) => {
    const t = svgEl("text", { x: x0 + ((i + 0.5) / n) * w, y: y0 + h + 16, "text-anchor": "middle", class: "cat" });
    t.textContent = String(c);
    svg.append(t);
  });
  return svg;
}

/** A picture's bytes as an object URL, or null when the part is not in the file. */
function pictureUrl(zip: Ctx["zip"], path: string | undefined, urls: string[]) {
  if (!path || !zip) return null;
  const b = zip.bytes(String(path).replace(/^\//, ""));
  if (!b) return null;
  const ext = String(path).split(".").pop()!.toLowerCase();
  const type = ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", svg: "image/svg+xml", webp: "image/webp" } as Record<string, string>)[ext];
  if (!type) return null;
  const u = URL.createObjectURL(new Blob([b as Uint8Array<ArrayBuffer>], { type }));
  urls.push(u);
  return u;
}

function textOf(shape: OutlineNode) {
  const p = propsOf(shape);
  const box = el("div", "txt");
  if (p.valign) box.dataset.valign = p.valign;
  const paras: Para[] = p.paras && p.paras.length ? p.paras : shape.text ? String(shape.text).split("\n").map((t) => ({ text: t })) : [];
  for (const para of paras) {
    const e = el("p", null, para.text || "\u00a0");
    if (para.bullet) e.dataset.bullet = para.bullet;
    if (para.level) e.style.marginLeft = `${para.level * 1.2}em`;
    const size = para.size || p.fontSize;
    if (size) e.style.fontSize = `${size}pt`;
    if (para.bold ?? p.bold) e.style.fontWeight = "600";
    if (p.italic) e.style.fontStyle = "italic";
    if (para.color || p.color) e.style.color = (para.color || p.color) as string;
    if (para.align || p.align) e.style.textAlign = (para.align || p.align) as string;
    box.append(e);
  }
  return box;
}

/** One shape (or a group's children, already in slide coordinates) into the slide box. */
function drawShape(into: HTMLElement, shape: OutlineNode, slide: Slide, ctx: Ctx) {
  const p = propsOf(shape);
  if (shape.type === "group") {
    for (const c of shape.children || []) drawShape(into, c, slide, ctx);
    return;
  }
  if (p.notDrawn) ctx.notDrawn.add(p.notDrawn);
  if (!Array.isArray(p.box)) return;
  const b = pct(p.box, slide.w, slide.h);
  const e = el("div", `shape ${shape.type}`);
  Object.assign(e.style, { left: `${b.left}%`, top: `${b.top}%`, width: `${b.width}%`, height: `${b.height}%` });
  e.dataset.slide = String(slide.n);
  const an = shape.anchor as { shape?: string | number } | undefined;
  e.dataset.shape = String(an && an.shape ? an.shape : shape.id);
  // "none": no fill or no outline (office-slides m_23821)
  if (p.fill && p.fill !== "none") e.style.background = p.fill;
  if (p.line && p.line !== "none") e.style.border = `1pt solid ${p.line}`;
  if (p.geometry === "ellipse") e.style.borderRadius = "50%";
  if (p.font) e.style.fontFamily = `"${p.font}", var(--font-body, sans-serif)`;
  if (shape.type === "picture") {
    const u = pictureUrl(ctx.zip, p.image, ctx.urls);
    if (u) {
      const img = el("img");
      img.src = u;
      img.alt = shape.name || "";
      e.append(img);
    } else e.append(el("span", "missing", shape.name || "picture"));
  } else if (shape.type === "table" && Array.isArray(p.rows)) {
    const t = el("table");
    for (const r of p.rows) {
      const tr = el("tr");
      for (const c of r) tr.append(el("td", null, String(c ?? "")));
      t.append(tr);
    }
    e.append(t);
  } else if (shape.type === "chart") {
    e.append(chartSvg(p.chart));
  } else if (shape.text || (p.paras && p.paras.length)) {
    e.append(textOf(shape));
  }
  into.append(e);
}

/** One slide as a fixed w × h pt box; the frame scales it (fit()). */
function drawSlide(node: OutlineNode, n: number, ctx: Ctx): Drawn {
  const p = propsOf(node);
  const slide = { n, w: p.w || 960, h: p.h || 540 };
  const box = el("div", "slide");
  box.dataset.slide = String(n);
  Object.assign(box.style, { width: `${slide.w}pt`, height: `${slide.h}pt` });
  if (p.background) box.style.background = p.background;
  for (const s of node.children || []) drawShape(box, s, slide, ctx);
  return { box, ...slide };
}

export async function draw(root: HTMLElement, bytes: Uint8Array): Promise<OfficeView> {
  const deck = await slides.open(bytes);
  const nodes = deck.inspect().nodes.filter((n) => n.type === "slide");
  let zip: Ctx["zip"] = null;
  try {
    zip = openPackage(bytes).zip;
  } catch {}
  const ctx: Ctx = { zip, urls: [], notDrawn: new Set() };
  root.classList.add("office-deck");
  const rail = el("nav", "office-rail");
  rail.setAttribute("aria-label", "slides");
  const stage = el("div", "office-slide");
  stage.tabIndex = 0;
  root.append(rail, stage);

  const big = nodes.map((n, i) => drawSlide(n, i + 1, ctx));
  let current = 0;
  let selected: { slide: number; shape: string | undefined } | null = null;

  /** Scale a w × h pt slide to `width` px wide (1pt = 4/3 px). */
  function scaleTo(holder: HTMLElement, s: Drawn, width: number) {
    const k = width / ((s.w * 4) / 3);
    holder.style.height = `${((s.h * 4) / 3) * k}px`;
    s.box.style.transform = `scale(${k})`;
  }

  for (const [i, s] of big.entries()) {
    const thumb = drawSlide(nodes[i], i + 1, { ...ctx, notDrawn: new Set() });
    const b = el("button", "thumb");
    b.type = "button";
    b.setAttribute("aria-label", `slide ${i + 1}`);
    const holder = el("div", "holder");
    holder.append(thumb.box);
    b.append(el("span", "n", String(i + 1)), holder);
    b.addEventListener("click", () => go(i));
    rail.append(b);
    thumb.fit = () => scaleTo(holder, thumb, holder.clientWidth || 120);
    s.thumb = thumb;
  }

  function fit() {
    const s = big[current];
    if (!s) return;
    const holder = stage.firstElementChild as HTMLElement;
    scaleTo(holder, s, stage.clientWidth - 16);
    for (const t of big) t.thumb!.fit!();
  }

  function go(i: number) {
    if (big.length === 0) {
      stage.replaceChildren(el("p", "office-empty", "this deck has no slides."));
      return;
    }
    current = Math.max(0, Math.min(big.length - 1, i));
    const holder = el("div", "holder");
    holder.append(big[current].box);
    stage.replaceChildren(holder);
    for (const [j, b] of [...rail.children].entries()) b.setAttribute("aria-current", String(j === current));
    rail.children[current]?.scrollIntoView({ block: "nearest" });
    fit();
  }

  new ResizeObserver(fit).observe(stage);
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") go(current + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") go(current - 1);
    else return;
    e.preventDefault();
  });
  stage.addEventListener("click", (e) => {
    for (const x of stage.querySelectorAll(".shape.sel")) x.classList.remove("sel");
    const s = (e.target as Element).closest<HTMLElement>(".shape");
    selected = s ? { slide: Number(s.dataset.slide), shape: s.dataset.shape } : null;
    if (s) s.classList.add("sel");
  });
  go(0);

  const words: Record<string, string> = { smartart: "SmartArt shows its text only", animation: "animations are not played" };
  return {
    notes: [...ctx.notDrawn].map((k) => `${words[k] || `${k} is not drawn`} here.`),
    place: () => ({ slide: current }),
    restore: (p) => go((p.slide as number) ?? 0),
    /** The selection as an Anchor (`shape`, or the slide shown), never null on a deck with slides. */
    selection: () => (selected ? { kind: "shape", ...selected } : big.length ? { kind: "slide", slide: current + 1 } : null),
  };
}
