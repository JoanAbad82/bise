// Tracked changes: list them, accept or reject one, some, or all.
//
// Kinds: "insert" / "delete" (runs, w:ins / w:del, and moves as Word
// writes them), "para-insert" / "para-delete" (a paragraph mark), "format"
// (w:rPrChange, w:pPrChange), "row-insert" / "row-delete" (a table row).

import { OfficeError } from "../core/errors.ts";
import type { Element } from "../core/xml.ts";
import { blocksOf, type Model } from "./model.ts";
import { scan } from "./text.ts";
import { getW, isW, remove, textEl, unwrap, W, wkid, wkids } from "./w.ts";

export type ChangeKind = "insert" | "delete" | "para-insert" | "para-delete" | "format" | "row-insert" | "row-delete";

export type TrackedChange = {
  /** the change's w:id */
  id: string;
  kind: ChangeKind;
  author: string;
  date?: string;
  /** the text inserted or deleted ("" for a mark or a format) */
  text: string;
  /** the paragraph it is in */
  para: string;
};

type Found = TrackedChange & { el: Element; p: Element };

const KIND: Record<string, ChangeKind> = { ins: "insert", del: "delete", moveTo: "insert", moveFrom: "delete" };

function runText(e: Element): string {
  let out = "";
  const list = e.getElementsByTagNameNS(W, "*");
  for (let i = 0; i < list.length; i++) {
    const c = list.item(i)!;
    if (c.localName === "t" || c.localName === "delText") out += c.textContent ?? "";
    else if (c.localName === "tab") out += "\t";
    else if (c.localName === "br" || c.localName === "cr") out += "\n";
  }
  return out;
}

function info(e: Element, kind: ChangeKind, p: Element, m: Model, text = ""): Found {
  return { id: getW(e, "id") ?? "", kind, author: getW(e, "author") ?? "", date: getW(e, "date"), text, para: m.paraId(p), el: e, p };
}

function find(m: Model): Found[] {
  const out: Found[] = [];
  const inPara = (p: Element) => {
    const pPr = wkid(p, "pPr");
    const mark = pPr && wkid(pPr, "rPr");
    if (mark) {
      for (const c of wkids(mark)) {
        if (c.localName === "ins") out.push(info(c, "para-insert", p, m));
        if (c.localName === "del") out.push(info(c, "para-delete", p, m));
      }
    }
    if (pPr && wkid(pPr, "pPrChange")) out.push(info(wkid(pPr, "pPrChange")!, "format", p, m));
    const walk = (parent: Element) => {
      for (const c of wkids(parent)) {
        const kind = KIND[c.localName ?? ""];
        if (kind) out.push(info(c, kind, p, m, runText(c)));
        if (c.localName === "r") {
          const rPr = wkid(c, "rPr");
          const ch = rPr && wkid(rPr, "rPrChange");
          if (ch) out.push(info(ch, "format", p, m, runText(c)));
        }
        if (c.localName === "ins" || c.localName === "moveTo" || c.localName === "hyperlink" || c.localName === "smartTag" || c.localName === "fldSimple") walk(c);
        if (c.localName === "sdt" && wkid(c, "sdtContent")) walk(wkid(c, "sdtContent")!);
      }
    };
    walk(p);
  };
  const inBlocks = (parent: Element) => {
    for (const b of blocksOf(parent)) {
      if (b.kind === "p") inPara(b.el);
      else {
        for (const tr of wkids(b.el, "tr")) {
          const trPr = wkid(tr, "trPr");
          const first = tr.getElementsByTagNameNS(W, "p").item(0);
          for (const c of trPr ? wkids(trPr) : []) {
            if (first && c.localName === "ins") out.push(info(c, "row-insert", first, m));
            if (first && c.localName === "del") out.push(info(c, "row-delete", first, m));
          }
          for (const tc of wkids(tr, "tc")) inBlocks(tc);
        }
      }
    }
  };
  inBlocks(m.body);
  return out;
}

export function listChanges(m: Model): TrackedChange[] {
  return find(m).map(({ el: _e, p: _p, ...c }) => c);
}

/** Accept (or reject) the changes with these ids; no ids: every change. Returns how many. */
export function settle(m: Model, accept: boolean, ids?: string | string[]): number {
  const want = ids === undefined ? undefined : new Set((Array.isArray(ids) ? ids : [ids]).map(String));
  const all = find(m);
  const chosen = want ? all.filter((c) => want.has(c.id)) : all;
  if (want) {
    const missing = [...want].filter((id) => !all.some((c) => c.id === id));
    if (missing.length) throw new OfficeError("not_found", `no tracked change ${missing.join(", ")} in this docx (doc.changes.list() has their ids)`);
  }
  // paragraph merges last, from the end, so earlier ones keep their place
  const merges: Element[] = [];
  for (const c of chosen) {
    if (!c.el.parentNode) continue;
    const keep = accept === (c.kind === "insert" || c.kind === "para-insert" || c.kind === "row-insert" || c.kind === "format");
    switch (c.kind) {
      case "insert":
        if (keep) unwrap(c.el);
        else remove(c.el);
        break;
      case "delete":
        if (keep) {
          undelete(c.el);
          unwrap(c.el);
        } else remove(c.el);
        break;
      case "para-insert":
      case "para-delete":
        remove(c.el);
        // an inserted mark rejected, a deleted mark accepted: the paragraph joins the next
        if (!keep) merges.push(c.p);
        break;
      case "row-insert":
      case "row-delete": {
        const tr = c.el.parentNode!.parentNode as Element;
        remove(c.el);
        if (!keep) remove(tr);
        break;
      }
      case "format":
        if (accept) remove(c.el);
        else restore(c.el);
        break;
    }
  }
  for (const p of merges.reverse()) mergeNext(m, p);
  dropMoveMarks(m);
  m.touch();
  return chosen.length;
}

/** Deleted text back to text. */
function undelete(e: Element): void {
  const doc = e.ownerDocument!;
  for (const local of ["delText", "delInstrText"] as const) {
    const list = e.getElementsByTagNameNS(W, local);
    const all: Element[] = [];
    for (let i = 0; i < list.length; i++) all.push(list.item(i)!);
    for (const d of all) d.parentNode!.replaceChild(textEl(doc, local === "delText" ? "t" : "instrText", d.textContent ?? ""), d);
  }
}

/** A format change rejected: the old properties come back. */
function restore(change: Element): void {
  const owner = change.parentNode as Element; // rPr or pPr
  const old = wkid(change, owner.localName ?? "");
  for (const c of wkids(owner)) {
    // a pPr keeps its run mark, section and the change list; the rest is the old one's
    if (owner.localName === "pPr" && (c.localName === "rPr" || c.localName === "sectPr")) continue;
    owner.removeChild(c);
  }
  const first = owner.firstChild;
  for (const c of old ? wkids(old) : []) owner.insertBefore(c, first);
}

/**
 * A paragraph whose mark went: left empty it goes (a whole paragraph
 * deleted, or a new one rejected); else the next paragraph's content joins
 * it. The last paragraph of a cell or the body keeps its place.
 */
function mergeNext(m: Model, p: Element): void {
  const parent = p.parentNode as Element;
  const empty = !scan(p).text && !wkids(p).some((c) => c.localName !== "pPr" && c.localName !== "bookmarkStart" && c.localName !== "bookmarkEnd");
  const siblings = wkids(parent, "p");
  if (empty && (siblings.length > 1 || isW(parent, "body"))) {
    remove(p);
    return;
  }
  let next = p.nextSibling;
  while (next && next.nodeType !== 1) next = next.nextSibling;
  if (!isW(next, "p")) return;
  for (const c of wkids(next)) if (c.localName !== "pPr") p.appendChild(c);
  remove(next);
  void m;
}

function dropMoveMarks(m: Model): void {
  for (const local of ["moveFromRangeStart", "moveFromRangeEnd", "moveToRangeStart", "moveToRangeEnd"]) {
    const list = m.doc.getElementsByTagNameNS(W, local);
    const all: Element[] = [];
    for (let i = 0; i < list.length; i++) all.push(list.item(i)!);
    for (const e of all) remove(e);
  }
}
