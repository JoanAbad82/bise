// A paragraph's text and the edits on a span of it, run by run.
//
// The text of a paragraph is what it reads with every tracked change
// accepted: inserted runs count, deleted ones (w:del, w:moveFrom) do not.
// Offsets are in that text (JS string units). An edit on a span first
// splits the runs at its two ends, so the format of what it does not touch
// stays; a tracked edit wraps deleted runs in w:del and new ones in w:ins.

import type { Element } from "../core/xml.ts";
import { el, getW, insertAfter, isW, remove, setW, textEl, W, wkid, wkids } from "./w.ts";

/** One piece of a run's text: a w:t, or a w:tab ("\t"), a w:br ("\n"), ... */
export type Atom = { run: Element; node: Element; start: number; text: string };
/** A marker in the paragraph (a comment's start, end or reference) at a text offset. */
export type Mark = { node: Element; local: string; id: string; offset: number };

/** Who and when a tracked edit is, and the next free change id. */
export type Track = { author: string; date: string; nextId(): string };

// containers whose runs are part of the text; w:del and w:moveFrom are not
const INLINE = new Set(["ins", "hyperlink", "smartTag", "fldSimple", "customXml", "moveTo", "dir", "bdo"]);
const MARKS = new Set(["commentRangeStart", "commentRangeEnd", "commentReference"]);

export function scan(p: Element): { atoms: Atom[]; marks: Mark[]; text: string } {
  const atoms: Atom[] = [];
  const marks: Mark[] = [];
  let at = 0;
  const run = (r: Element) => {
    for (const c of wkids(r)) {
      let t: string | undefined;
      switch (c.localName) {
        case "t":
          t = c.textContent ?? "";
          break;
        case "tab":
        case "ptab":
          t = "\t";
          break;
        case "br":
          // a page or column break is not text
          t = getW(c, "type") === "page" || getW(c, "type") === "column" ? undefined : "\n";
          break;
        case "cr":
          t = "\n";
          break;
        case "noBreakHyphen":
          t = "-";
          break;
        case "commentReference":
          marks.push({ node: c, local: c.localName, id: getW(c, "id") ?? "", offset: at });
          break;
      }
      if (t !== undefined && t.length) {
        atoms.push({ run: r, node: c, start: at, text: t });
        at += t.length;
      }
    }
  };
  const walk = (parent: Element) => {
    for (const c of wkids(parent)) {
      const l = c.localName ?? "";
      if (l === "r") run(c);
      else if (INLINE.has(l)) walk(c);
      else if (l === "sdt") {
        const content = wkid(c, "sdtContent");
        if (content) walk(content);
      } else if (MARKS.has(l)) marks.push({ node: c, local: l, id: getW(c, "id") ?? "", offset: at });
    }
  };
  walk(p);
  return { atoms, marks, text: atoms.map((a) => a.text).join("") };
}

export function textOfPara(p: Element): string {
  return scan(p).text;
}

/** Make `offset` a boundary between two runs (splitting a w:t and its run when needed). */
export function splitAt(p: Element, offset: number): void {
  const { atoms, text } = scan(p);
  if (offset <= 0 || offset >= text.length) return;
  // `before` holds the char before offset, `after` the char at it
  const before = atoms.find((x) => x.start <= offset - 1 && offset - 1 < x.start + x.text.length)!;
  const after = atoms.find((x) => x.start <= offset && offset < x.start + x.text.length)!;
  if (before.run !== after.run) return;
  const doc = p.ownerDocument!;
  let cut: Element = before.node;
  if (before === after) {
    // inside one w:t: split its text in two w:t
    const k = offset - before.start;
    const second = textEl(doc, "t", before.text.slice(k));
    before.node.textContent = before.text.slice(0, k);
    before.node.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
    insertAfter(second, before.node);
    cut = before.node;
  }
  // the run's children after `cut` move to a new run with the same format
  const r = before.run;
  const twin = r.cloneNode(false) as Element;
  const rPr = wkid(r, "rPr");
  if (rPr) twin.appendChild(rPr.cloneNode(true));
  while (cut.nextSibling) twin.appendChild(cut.nextSibling);
  insertAfter(twin, r);
}

/** The runs that hold the text [a, b), split so they hold nothing else. */
export function runsIn(p: Element, a: number, b: number): Element[] {
  splitAt(p, a);
  splitAt(p, b);
  const out: Element[] = [];
  for (const x of scan(p).atoms) {
    if (x.start >= a && x.start + x.text.length <= b && !out.includes(x.run)) out.push(x.run);
  }
  return out;
}

/** A new run with this text ("\t" a tab, "\n" a line break), format copied from `like`. */
export function makeRun(p: Element, text: string, like?: Element): Element {
  const doc = p.ownerDocument!;
  const r = el(doc, "r");
  const rPr = like && wkid(like, "rPr");
  if (rPr) {
    const copy = rPr.cloneNode(true) as Element;
    for (const c of wkids(copy, "rPrChange")) copy.removeChild(c);
    r.appendChild(copy);
  }
  const parts = text.split(/(\t|\n)/);
  for (const s of parts) {
    if (s === "\t") r.appendChild(el(doc, "tab"));
    else if (s === "\n") r.appendChild(el(doc, "br"));
    else if (s) r.appendChild(textEl(doc, "t", s));
  }
  return r;
}

export function wrap(local: "ins" | "del", track: Track, node: Element): Element {
  const w = el(node.ownerDocument!, local, { id: track.nextId(), author: track.author, date: track.date });
  node.parentNode!.insertBefore(w, node);
  w.appendChild(node);
  return w;
}

/** A run as deleted text: w:t becomes w:delText, w:instrText w:delInstrText. */
function asDeleted(r: Element): void {
  const doc = r.ownerDocument!;
  for (const c of wkids(r)) {
    if (c.localName === "t" || c.localName === "instrText") {
      const d = textEl(doc, c.localName === "t" ? "delText" : "delInstrText", c.textContent ?? "");
      r.replaceChild(d, c);
    }
  }
}

/** Delete runs: gone, or (tracked) wrapped in w:del; a tracked insertion deleted again just goes. */
export function deleteRuns(runs: Element[], track: Track | null): void {
  for (const r of runs) {
    const parent = r.parentNode as Element;
    if (!track || isW(parent, "ins")) {
      remove(r);
      dropEmpty(parent);
    } else {
      asDeleted(r);
      wrap("del", track, r);
    }
  }
}

/** A w:ins or w:hyperlink left with no run goes too. */
function dropEmpty(e: Element): void {
  if ((isW(e, "ins") || isW(e, "hyperlink") || isW(e, "smartTag")) && !wkids(e).some((c) => c.localName === "r" || INLINE.has(c.localName ?? ""))) {
    const up = e.parentNode as Element;
    remove(e);
    dropEmpty(up);
  }
}

/** Insert text at an offset, formatted like the text before it. */
export function insertText(p: Element, offset: number, text: string, track: Track | null): Element {
  splitAt(p, offset);
  const { atoms } = scan(p);
  const prev = atoms.filter((x) => x.start + x.text.length <= offset).pop();
  const next = atoms.find((x) => x.start >= offset);
  const like = prev?.run ?? next?.run;
  const r = makeRun(p, text, like);
  if (prev) insertAfter(r, outOfIns(prev.run, track));
  else if (next) {
    const ref = outOfIns(next.run, track);
    ref.parentNode!.insertBefore(r, ref);
  } else p.appendChild(r);
  return track ? wrap("ins", track, r) : r;
}

/** A tracked insertion may not sit inside another w:ins: place it beside that one. */
function outOfIns(r: Element, track: Track | null): Element {
  const parent = r.parentNode as Element;
  return track && isW(parent, "ins") ? parent : r;
}

/** Replace the text [a, b) with `text`; the new text takes the format of the first replaced run. */
export function replaceSpan(p: Element, a: number, b: number, text: string, track: Track | null): void {
  if (a === b) {
    if (text) insertText(p, a, text, track);
    return;
  }
  const runs = runsIn(p, a, b);
  if (text) {
    const first = runs[0]!;
    const r = makeRun(p, text, first);
    const ref = outOfIns(first, track);
    ref.parentNode!.insertBefore(r, ref);
    if (track) wrap("ins", track, r);
  }
  deleteRuns(runs, track);
}

/** The offsets of each match of `find` in `text`. */
export function matches(text: string, find: string | RegExp): { start: number; end: number; groups: string[] }[] {
  const out: { start: number; end: number; groups: string[] }[] = [];
  if (typeof find === "string") {
    if (!find) return out;
    let i = text.indexOf(find);
    while (i >= 0) {
      out.push({ start: i, end: i + find.length, groups: [find] });
      i = text.indexOf(find, i + find.length);
    }
    return out;
  }
  const re = new RegExp(find.source, find.flags.includes("g") ? find.flags : `${find.flags}g`);
  for (const m of text.matchAll(re)) {
    if (m[0].length === 0) continue;
    out.push({ start: m.index!, end: m.index! + m[0].length, groups: [...m] });
  }
  return out;
}

/** The run format an edit can set. */
export type RunFormat = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  /** hex "C00000" or "#C00000" */
  color?: string;
  /** Word's highlight names: "yellow", "green", "cyan", ... */
  highlight?: string;
  /** in points */
  size?: number;
  font?: string;
  /** a character style id ("Hyperlink", "Strong") */
  style?: string;
  code?: boolean;
};

/** Set format on a run's rPr (keeping what it does not name), tracked as a w:rPrChange when asked. */
export function formatRun(r: Element, f: RunFormat, track: Track | null, setProp: (props: Element, kid: Element) => Element): void {
  const doc = r.ownerDocument!;
  let rPr = wkid(r, "rPr");
  if (!rPr) {
    rPr = el(doc, "rPr");
    r.insertBefore(rPr, r.firstChild);
  }
  if (track && !wkid(rPr, "rPrChange")) {
    const old = rPr.cloneNode(true) as Element;
    const change = el(doc, "rPrChange", { id: track.nextId(), author: track.author, date: track.date });
    change.appendChild(old);
    setProp(rPr, change);
  }
  const flag = (name: string, on: boolean | undefined) => {
    if (on === undefined) return;
    if (on) setProp(rPr!, el(doc, name));
    else setProp(rPr!, el(doc, name, { val: "0" }));
  };
  flag("b", f.bold);
  flag("i", f.italic);
  flag("strike", f.strike);
  if (f.underline !== undefined) setProp(rPr, el(doc, "u", { val: f.underline ? "single" : "none" }));
  if (f.color) setProp(rPr, el(doc, "color", { val: f.color.replace(/^#/, "").toUpperCase() }));
  if (f.highlight) setProp(rPr, el(doc, "highlight", { val: f.highlight }));
  if (f.size) {
    setProp(rPr, el(doc, "sz", { val: String(Math.round(f.size * 2)) }));
    setProp(rPr, el(doc, "szCs", { val: String(Math.round(f.size * 2)) }));
  }
  const font = f.font ?? (f.code ? "Consolas" : undefined);
  if (font) setProp(rPr, el(doc, "rFonts", { ascii: font, hAnsi: font, cs: font }));
  if (f.style) setProp(rPr, el(doc, "rStyle", { val: f.style }));
  void setW;
  void W;
}
