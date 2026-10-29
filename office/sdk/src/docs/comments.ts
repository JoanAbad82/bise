// Comments: read them with the text they are on, add one on a span of a
// paragraph, reply, resolve, remove. Replies and "resolved" live in
// commentsExtended.xml (w15), as Word writes them.

import { OfficeError } from "../core/errors.ts";
import type { Element } from "../core/xml.ts";
import type { Model } from "./model.ts";
import { scan, splitAt } from "./text.ts";
import { el, getW, insertAfter, isW, remove, setW, textEl, W, W14, W15, wkid, wkids, wordDate, XMLNS } from "./w.ts";
import { declareW14 } from "./parts.ts";

export type Comment = {
  /** the comment's w:id, as a string */
  id: string;
  author: string;
  date?: string;
  text: string;
  /** the paragraph it is on and the text it covers */
  para?: string;
  quote?: string;
  /** a reply's parent comment id */
  replyTo?: string;
  done: boolean;
};

const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

function part(m: Model, make: boolean): string | undefined {
  if (!make) return m.parts.find("comments");
  return m.parts.ensure("comments", () => `${X}<w:comments xmlns:w="${W}" xmlns:w14="${W14}" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="w14"></w:comments>`);
}

function extPart(m: Model, make: boolean): string | undefined {
  if (!make) return m.parts.find("commentsExtended");
  return m.parts.ensure("commentsExtended", () => `${X}<w15:commentsEx xmlns:w15="${W15}" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="w15"></w15:commentsEx>`);
}

function commentEls(m: Model): Element[] {
  const path = part(m, false);
  return path ? wkids(m.parts.dom(path).documentElement!, "comment") : [];
}

/** A comment's last paragraph id: what commentsExtended keys it by. */
function lastParaId(c: Element): string | undefined {
  const ps = wkids(c, "p");
  const p = ps[ps.length - 1];
  return p ? (p.getAttributeNS(W14, "paraId") ?? undefined) : undefined;
}

function extOf(m: Model): Map<string, Element> {
  const out = new Map<string, Element>();
  const path = extPart(m, false);
  if (!path) return out;
  const list = m.parts.dom(path).documentElement!.getElementsByTagNameNS(W15, "commentEx");
  for (let i = 0; i < list.length; i++) {
    const e = list.item(i)!;
    out.set((e.getAttributeNS(W15, "paraId") ?? "").toUpperCase(), e);
  }
  return out;
}

/** Where each comment sits in the body: its paragraph and the text it covers. */
function places(m: Model): Map<string, { para: string; quote: string }> {
  const starts = new Map<string, { p: Element; offset: number }>();
  const out = new Map<string, { para: string; quote: string }>();
  for (const p of m.paras()) {
    const { marks, text } = scan(p);
    for (const k of marks) {
      if (k.local === "commentRangeStart") starts.set(k.id, { p, offset: k.offset });
      else if (k.local === "commentRangeEnd" || (k.local === "commentReference" && !out.has(k.id))) {
        const s = starts.get(k.id);
        if (s && s.p === p) out.set(k.id, { para: m.paraId(p), quote: text.slice(s.offset, k.offset) });
        else if (s) out.set(k.id, { para: m.paraId(s.p), quote: scan(s.p).text.slice(s.offset) });
        else if (!out.has(k.id)) out.set(k.id, { para: m.paraId(p), quote: "" });
      }
    }
  }
  return out;
}

export function listComments(m: Model): Comment[] {
  const ext = extOf(m);
  const where = places(m);
  const els = commentEls(m);
  const byPara = new Map<string, string>();
  for (const c of els) {
    const pid = lastParaId(c);
    if (pid) byPara.set(pid.toUpperCase(), getW(c, "id") ?? "");
  }
  return els.map((c) => {
    const id = getW(c, "id") ?? "";
    const pid = (lastParaId(c) ?? "").toUpperCase();
    const ex = ext.get(pid);
    const parent = ex?.getAttributeNS(W15, "paraIdParent");
    const text = wkids(c, "p")
      .map((p) => scan(p).text)
      .join("\n");
    const at = where.get(id);
    return {
      id,
      author: getW(c, "author") ?? "",
      date: getW(c, "date"),
      text,
      para: at?.para,
      quote: at?.quote,
      replyTo: parent ? byPara.get(parent.toUpperCase()) : undefined,
      done: ex?.getAttributeNS(W15, "done") === "1",
    };
  });
}

function nextCommentId(m: Model): string {
  return String(Math.max(-1, ...commentEls(m).map((c) => Number(getW(c, "id") ?? -1))) + 1);
}

/** The comment element with its text, one paragraph per line. */
function makeComment(m: Model, id: string, text: string, initials: string): Element {
  const path = part(m, true)!;
  const cdoc = m.parts.dom(path);
  declareW14(cdoc.documentElement!);
  const c = el(cdoc, "comment", { id, author: m.author, date: wordDate(m.now()), initials });
  text.split("\n").forEach((line, i) => {
    const p = el(cdoc, "p");
    p.setAttributeNS(W14, "w14:paraId", m.freeId(`comment:${id}:${i}:${line}`));
    p.setAttributeNS(W14, "w14:textId", "77777777");
    if (i === 0) {
      const ref = el(cdoc, "r");
      ref.appendChild(el(cdoc, "annotationRef"));
      p.appendChild(ref);
    }
    const r = el(cdoc, "r");
    r.appendChild(textEl(cdoc, "t", line));
    p.appendChild(r);
    c.appendChild(p);
  });
  cdoc.documentElement!.appendChild(c);
  m.parts.touch(path);
  return c;
}

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0]!.toUpperCase())
      .join("")
      .slice(0, 4) || "B"
  );
}

/** The top-level child of `p` that holds `n` (a run in a hyperlink: the hyperlink). */
function topOf(p: Element, n: Element): Element {
  let x = n;
  while (x.parentNode && x.parentNode !== p) x = x.parentNode as Element;
  return x;
}

/** Comment the text [a, b) of a paragraph (the whole paragraph when a === b === undefined). */
export function addComment(m: Model, p: Element, text: string, span?: { start: number; end: number }): Comment {
  if (typeof text !== "string" || !text.trim()) throw new OfficeError("bad_arg", "a comment needs some text");
  const id = nextCommentId(m);
  makeComment(m, id, text, initialsOf(m.author));
  placeRange(m, p, id, span);
  m.touch();
  return listComments(m).find((c) => c.id === id)!;
}

function placeRange(m: Model, p: Element, id: string, span?: { start: number; end: number }): void {
  const start = el(m.doc, "commentRangeStart", { id });
  const end = el(m.doc, "commentRangeEnd", { id });
  const refRun = el(m.doc, "r");
  refRun.appendChild(el(m.doc, "commentReference", { id }));
  const { text } = scan(p);
  const a = span?.start ?? 0;
  const b = span?.end ?? text.length;
  splitAt(p, a);
  splitAt(p, b);
  const atoms = scan(p).atoms;
  const first = atoms.find((x) => x.start >= a && x.start < b);
  const last = atoms.filter((x) => x.start < b && x.start >= a).pop();
  if (!first || !last) {
    // an empty paragraph or span: the markers at the end
    p.appendChild(start);
    p.appendChild(end);
    p.appendChild(refRun);
    return;
  }
  const s = topOf(p, first.run);
  const e = topOf(p, last.run);
  p.insertBefore(start, s);
  insertAfter(end, e);
  insertAfter(refRun, end);
}

/** Reply to a comment: a new comment on the same text, its parent in commentsExtended. */
export function reply(m: Model, parentId: string, text: string): Comment {
  const parent = commentEls(m).find((c) => getW(c, "id") === String(parentId));
  if (!parent) throw new OfficeError("not_found", `no comment ${parentId} in this docx (doc.comments.list() has their ids)`);
  if (typeof text !== "string" || !text.trim()) throw new OfficeError("bad_arg", "a reply needs some text");
  const id = nextCommentId(m);
  const c = makeComment(m, id, text, initialsOf(m.author));
  const parentPid = ensureLastParaId(m, parent);
  setExt(m, lastParaId(c)!, { paraIdParent: parentPid });
  // the reply covers the same text as its parent
  for (const p of m.paras()) {
    for (const k of scan(p).marks) {
      if (k.id !== String(parentId)) continue;
      if (k.local === "commentRangeStart") insertAfter(el(m.doc, "commentRangeStart", { id }), k.node);
      if (k.local === "commentRangeEnd") {
        const end = el(m.doc, "commentRangeEnd", { id });
        insertAfter(end, k.node);
        const r = el(m.doc, "r");
        r.appendChild(el(m.doc, "commentReference", { id }));
        const parentRef = scan(p).marks.find((x) => x.local === "commentReference" && x.id === String(parentId));
        insertAfter(r, parentRef ? topOf(p, parentRef.node) : end);
      }
    }
  }
  m.touch();
  return listComments(m).find((x) => x.id === id)!;
}

function ensureLastParaId(m: Model, c: Element): string {
  const have = lastParaId(c);
  if (have) return have;
  const ps = wkids(c, "p");
  const p = ps[ps.length - 1];
  if (!p) throw new OfficeError("bad_xml", `comment ${getW(c, "id")} has no paragraph`);
  const id = m.freeId(`comment:${getW(c, "id")}`);
  p.setAttributeNS(W14, "w14:paraId", id);
  m.parts.touch(part(m, false)!);
  return id;
}

function setExt(m: Model, paraId: string, attrs: { paraIdParent?: string; done?: "0" | "1" }): void {
  const path = extPart(m, true)!;
  const doc = m.parts.dom(path);
  const root = doc.documentElement!;
  if (root.lookupNamespaceURI("w15") !== W15) root.setAttributeNS(XMLNS, "xmlns:w15", W15);
  let e = extOf(m).get(paraId.toUpperCase());
  if (!e) {
    e = doc.createElementNS(W15, "w15:commentEx");
    e.setAttributeNS(W15, "w15:paraId", paraId);
    e.setAttributeNS(W15, "w15:done", "0");
    root.appendChild(e);
  }
  if (attrs.paraIdParent) e.setAttributeNS(W15, "w15:paraIdParent", attrs.paraIdParent);
  if (attrs.done) e.setAttributeNS(W15, "w15:done", attrs.done);
  m.parts.touch(path);
}

/** Mark a comment resolved (or open again). */
export function resolve(m: Model, id: string, done = true): void {
  const c = commentEls(m).find((x) => getW(x, "id") === String(id));
  if (!c) throw new OfficeError("not_found", `no comment ${id} in this docx (doc.comments.list() has their ids)`);
  setExt(m, ensureLastParaId(m, c), { done: done ? "1" : "0" });
}

/** Remove a comment, its replies, and their marks in the body. */
export function removeComment(m: Model, id: string): void {
  const all = listComments(m);
  if (!all.some((c) => c.id === String(id))) throw new OfficeError("not_found", `no comment ${id} in this docx (doc.comments.list() has their ids)`);
  const gone = new Set([String(id), ...all.filter((c) => c.replyTo === String(id)).map((c) => c.id)]);
  const ext = extOf(m);
  for (const c of commentEls(m)) {
    if (!gone.has(getW(c, "id") ?? "")) continue;
    const pid = (lastParaId(c) ?? "").toUpperCase();
    const ex = ext.get(pid);
    if (ex) {
      remove(ex);
      m.parts.touch(extPart(m, false)!);
    }
    remove(c);
  }
  m.parts.touch(part(m, false)!);
  for (const p of m.paras()) {
    for (const k of scan(p).marks) {
      if (!gone.has(k.id)) continue;
      const host = k.node.parentNode as Element;
      remove(k.node);
      // a reference's run holds nothing else: it goes too
      if (k.local === "commentReference" && isW(host, "r") && !wkids(host).some((x) => x.localName !== "rPr")) remove(host);
    }
  }
  m.touch();
}

/** The comment ids the body points at, and the ones comments.xml has. */
export function commentIds(m: Model): { used: Set<string>; defined: Set<string> } {
  const used = new Set<string>();
  for (const p of m.paras()) for (const k of scan(p).marks) used.add(k.id);
  return { used, defined: new Set(commentEls(m).map((c) => getW(c, "id") ?? "")) };
}

void setW;
void wkid;
