// Text edits on a text body (p:txBody, a:txBody of a table cell): set its
// paragraphs, replace words across runs, apply a style. The first
// paragraph's pPr and the first run's rPr are the template of new text, so
// a title set on a PowerPoint deck keeps its font, size and color.

import { child, children, type Element } from "../core/xml.ts";
import { OfficeError } from "../core/errors.ts";
import { ensure, insertBefore, ln, PNS, remove } from "./dom.ts";
import { emu, hex } from "./units.ts";

const A = PNS.a;

/** How text looks; every field optional: what is not given is inherited. */
export type TextStyle = {
  /** points */
  size?: number;
  bold?: boolean;
  italic?: boolean;
  /** "#rrggbb" */
  color?: string;
  font?: string;
  align?: "left" | "center" | "right" | "justify";
};

/** A paragraph: its text, or its text with a level (1-9), a bullet and a style. */
export type ParaInput = string | ({ text: string; level?: number; bullet?: boolean } & TextStyle);

/** The text an edit takes: one string (a "\n" starts a paragraph), or one entry per paragraph. */
export type TextInput = string | ParaInput[];

const ALIGN: Record<string, string> = { left: "l", center: "ctr", right: "r", justify: "just" };

const FILLS = ["noFill", "solidFill", "gradFill", "blipFill", "pattFill", "grpFill"];
const AFTER_FILL = ["effectLst", "effectDag", "highlight", "uLnTx", "uLn", "uFillTx", "uFill", "latin", "ea", "cs", "sym", "hlinkClick", "hlinkMouseOver", "rtl", "extLst"];
const AFTER_LATIN = ["ea", "cs", "sym", "hlinkClick", "hlinkMouseOver", "rtl", "extLst"];
const BULLETS = ["buNone", "buAutoNum", "buChar", "buBlip"];
const AFTER_BULLET = ["tabLst", "defRPr", "extLst"];
const at = (names: string[]): [string, string][] => names.map((n) => [A, n]);

/** Check a style's values; throws bad_arg. */
export function checkStyle(s: TextStyle | undefined): void {
  if (!s) return;
  if (s.size !== undefined && !(typeof s.size === "number" && s.size >= 1 && s.size <= 400)) {
    throw new OfficeError("bad_arg", `a text size is in points, 1 to 400, got ${JSON.stringify(s.size)}`);
  }
  if (s.align !== undefined && !ALIGN[s.align]) throw new OfficeError("bad_arg", `align is left, center, right or justify, got ${JSON.stringify(s.align)}`);
  if (s.color !== undefined) hex(s.color);
}

/** Apply a style to a run's properties (a:rPr, a:endParaRPr, a:defRPr). */
export function styleRun(rPr: Element, s: TextStyle): void {
  if (s.size !== undefined) rPr.setAttribute("sz", String(Math.round(s.size * 100)));
  if (s.bold !== undefined) rPr.setAttribute("b", s.bold ? "1" : "0");
  if (s.italic !== undefined) rPr.setAttribute("i", s.italic ? "1" : "0");
  if (s.color !== undefined) {
    for (const f of children(rPr, A).filter((e) => FILLS.includes(ln(e)))) remove(f);
    const fill = rPr.ownerDocument!.createElementNS(A, "a:solidFill");
    const c = rPr.ownerDocument!.createElementNS(A, "a:srgbClr");
    c.setAttribute("val", hex(s.color));
    fill.appendChild(c);
    insertBefore(rPr, fill, at(AFTER_FILL));
  }
  if (s.font !== undefined) {
    remove(child(rPr, A, "latin"));
    const latin = rPr.ownerDocument!.createElementNS(A, "a:latin");
    latin.setAttribute("typeface", s.font);
    insertBefore(rPr, latin, at(AFTER_LATIN));
  }
}

/** Apply a paragraph's alignment, level and bullet to its a:pPr (made when needed). */
function stylePara(p: Element, s: { align?: string; level?: number; bullet?: boolean }): void {
  if (s.align === undefined && s.level === undefined && s.bullet === undefined) return;
  const pPr = ensure(p, A, "a:pPr", at(["r", "br", "fld", "endParaRPr"]));
  if (s.align !== undefined) pPr.setAttribute("algn", ALIGN[s.align]);
  if (s.level !== undefined) {
    if (s.level > 1) pPr.setAttribute("lvl", String(s.level - 1));
    else pPr.removeAttribute("lvl");
  }
  if (s.bullet !== undefined) {
    for (const b of children(pPr, A).filter((e) => BULLETS.includes(ln(e)) || ln(e) === "buFont")) remove(b);
    if (s.bullet) {
      const lvl = s.level ?? 1;
      pPr.setAttribute("marL", String(emu(18 * lvl)));
      pPr.setAttribute("indent", String(emu(-18)));
      const ch = p.ownerDocument!.createElementNS(A, "a:buChar");
      ch.setAttribute("char", "\u2022");
      insertBefore(pPr, ch, at(AFTER_BULLET));
    } else {
      insertBefore(pPr, p.ownerDocument!.createElementNS(A, "a:buNone"), at(AFTER_BULLET));
    }
  }
}

function normalize(input: TextInput): Exclude<ParaInput, string>[] {
  const list = typeof input === "string" ? input.split("\n") : input;
  if (!Array.isArray(list)) throw new OfficeError("bad_arg", `text is a string or an array of paragraphs, got ${JSON.stringify(input)}`);
  return list.map((p) => {
    const o = typeof p === "string" ? { text: p } : p;
    if (!o || typeof o.text !== "string") throw new OfficeError("bad_arg", `a paragraph is a string or { text, level?, bullet?, size?, bold?, color?, ... }, got ${JSON.stringify(p)}`);
    if (o.level !== undefined && !(Number.isInteger(o.level) && o.level >= 1 && o.level <= 9)) throw new OfficeError("bad_arg", `a paragraph's level is 1 to 9, got ${o.level}`);
    checkStyle(o);
    return o;
  });
}

/** Replace a text body's paragraphs. `style` applies to every run on top of the template. */
export function setText(body: Element, input: TextInput, style?: TextStyle): void {
  checkStyle(style);
  const paras = normalize(input);
  const doc = body.ownerDocument!;
  const old = children(body, A, "p");
  const first = old[0];
  const pPrT = first && child(first, A, "pPr");
  const runT = first && (children(first, A, "r")[0] ?? undefined);
  const rPrT = (runT && child(runT, A, "rPr")) ?? (first && child(first, A, "endParaRPr"));
  for (const p of old) remove(p);
  const tail = child(body, A, "extLst");
  for (const para of paras) {
    const p = doc.createElementNS(A, "a:p");
    if (pPrT) p.appendChild(pPrT.cloneNode(true));
    const rPr = () => {
      const r = rPrT ? (rPrT.cloneNode(true) as Element) : doc.createElementNS(A, "a:rPr");
      if (r.localName !== "rPr") {
        const n = doc.createElementNS(A, "a:rPr");
        for (let i = 0; i < r.attributes.length; i++) n.setAttribute(r.attributes.item(i)!.name, r.attributes.item(i)!.value);
        for (let c = r.firstChild; c; c = c.nextSibling) n.appendChild(c.cloneNode(true));
        return n;
      }
      return r;
    };
    const look = { ...style, ...para };
    const lines = para.text.split("\v");
    lines.forEach((line, i) => {
      if (i > 0) {
        const br = doc.createElementNS(A, "a:br");
        br.appendChild(rPr());
        p.appendChild(br);
      }
      if (!line) return;
      const r = doc.createElementNS(A, "a:r");
      const rp = rPr();
      rp.removeAttribute("dirty");
      rp.removeAttribute("err");
      if (!rp.hasAttribute("lang")) rp.setAttribute("lang", "en-US");
      styleRun(rp, look);
      r.appendChild(rp);
      const t = doc.createElementNS(A, "a:t");
      t.appendChild(doc.createTextNode(line));
      r.appendChild(t);
      p.appendChild(r);
    });
    const end = rPrT ? (rPrT.cloneNode(true) as Element) : doc.createElementNS(A, "a:endParaRPr");
    const endEl = doc.createElementNS(A, "a:endParaRPr");
    for (let i = 0; i < end.attributes.length; i++) endEl.setAttribute(end.attributes.item(i)!.name, end.attributes.item(i)!.value);
    endEl.removeAttribute("dirty");
    if (!endEl.hasAttribute("lang")) endEl.setAttribute("lang", "en-US");
    if (style?.size !== undefined || para.size !== undefined) endEl.setAttribute("sz", String(Math.round((para.size ?? style!.size!) * 100)));
    p.appendChild(endEl);
    stylePara(p, { align: look.align, level: para.level, bullet: para.bullet });
    if (tail) body.insertBefore(p, tail);
    else body.appendChild(p);
  }
}

/** Style every run and paragraph of a text body. */
export function styleText(body: Element, style: TextStyle): void {
  checkStyle(style);
  for (const p of children(body, A, "p")) {
    for (const r of children(p, A).filter((e) => e.localName === "r" || e.localName === "fld")) {
      styleRun(ensure(r, A, "a:rPr", at(["t"])), style);
    }
    const end = child(p, A, "endParaRPr");
    if (end && style.size !== undefined) end.setAttribute("sz", String(Math.round(style.size * 100)));
    stylePara(p, { align: style.align });
  }
}

/** Replace every `find` by `by` in a text body, across runs of one paragraph; how many it replaced. */
export function replaceText(body: Element, find: string, by: string): number {
  if (typeof find !== "string" || !find) throw new OfficeError("bad_arg", "replace needs the text to find, not an empty string");
  let count = 0;
  for (const p of children(body, A, "p")) {
    const ts = children(p, A)
      .filter((e) => e.localName === "r" || e.localName === "fld")
      .map((r) => child(r, A, "t"))
      .filter((t): t is Element => !!t);
    const texts = ts.map((t) => t.textContent ?? "");
    const whole = texts.join("");
    const hits: number[] = [];
    for (let i = whole.indexOf(find); i >= 0; i = whole.indexOf(find, i + find.length)) hits.push(i);
    if (!hits.length) continue;
    count += hits.length;
    // from the last hit, so earlier offsets stay right
    for (const start of hits.reverse()) {
      const end = start + find.length;
      let pos = 0;
      let placed = false;
      for (let k = 0; k < ts.length; k++) {
        const s = pos;
        const e = pos + texts[k].length;
        pos = e;
        if (e <= start || s >= end) continue;
        const keepHead = texts[k].slice(0, Math.max(0, start - s));
        const keepTail = texts[k].slice(Math.max(0, end - s));
        texts[k] = keepHead + (placed ? "" : by) + keepTail;
        placed = true;
      }
    }
    ts.forEach((t, k) => {
      if (t.textContent !== texts[k]) t.textContent = texts[k];
    });
  }
  return count;
}
