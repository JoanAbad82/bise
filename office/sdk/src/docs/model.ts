// An open docx: its parts, its body walked as blocks (paragraphs and
// tables, through content controls), the paragraph ids, and who a tracked
// edit is by. The other docs/ files read and edit through it.

import { OfficeError } from "../core/errors.ts";
import type { Document, Element } from "../core/xml.ts";
import { declareW14, Parts } from "./parts.ts";
import type { Track } from "./text.ts";
import { textOfPara } from "./text.ts";
import { getW, W, W14, wkid, wkids, wordDate } from "./w.ts";

/** A block of the body: a paragraph or a table. */
export type Block = { kind: "p"; el: Element } | { kind: "tbl"; el: Element };

export type ModelOptions = {
  /** who tracked changes and comments are by (default "bise") */
  author?: string;
  /** the clock for w:date (tests set it) */
  now?: () => Date;
};

export class Model {
  readonly parts: Parts;
  readonly doc: Document;
  readonly body: Element;
  author: string;
  /** every edit is tracked unless the call says `track: false` */
  tracking = false;
  readonly now: () => Date;
  private ids = new Set<string>();
  private nextChange = 0;

  constructor(parts: Parts, opts: ModelOptions = {}) {
    this.parts = parts;
    this.doc = parts.dom(parts.main);
    const body = wkid(this.doc.documentElement!, "body");
    if (!body) throw new OfficeError("no_part", `${parts.main} has no w:body`);
    this.body = body;
    this.author = opts.author ?? "bise";
    this.now = opts.now ?? (() => new Date());
    this.nameParagraphs();
  }

  /** The body's blocks in document order; a table's cells hold blocks too (`blocksOf`). */
  blocks(): Block[] {
    return blocksOf(this.body);
  }

  /** Every paragraph of the body, tables' cells included, in document order. */
  paras(): Element[] {
    const out: Element[] = [];
    const walk = (bs: Block[]) => {
      for (const b of bs) {
        if (b.kind === "p") out.push(b.el);
        else for (const tc of cellsOf(b.el)) walk(blocksOf(tc));
      }
    };
    walk(this.blocks());
    return out;
  }

  paraId(p: Element): string {
    return p.getAttributeNS(W14, "paraId") ?? "";
  }

  /** The paragraph with this id, else undefined. */
  byId(id: string): Element | undefined {
    const want = id.toUpperCase();
    return this.paras().find((p) => this.paraId(p).toUpperCase() === want);
  }

  /** Give a new paragraph its id. */
  name(p: Element, seed: string): string {
    declareW14(this.doc.documentElement!);
    const id = this.freeId(seed);
    p.setAttributeNS(W14, "w14:paraId", id);
    p.setAttributeNS(W14, "w14:textId", "77777777");
    return id;
  }

  /** Paragraphs whose paraId was another's: their old id and the new one (check() says so). */
  readonly renamed: { from: string; to: string }[] = [];

  /**
   * Paragraphs with no w14:paraId (or another's) get one, the same for the
   * same bytes (a hash of the place and the text), so an outline read twice
   * names them alike. They are written when an edit saves the part; a save
   * with no edit keeps the bytes.
   */
  private nameParagraphs(): void {
    const comments = this.parts.find("comments");
    if (comments) {
      const list = this.parts.dom(comments).getElementsByTagNameNS(W, "p");
      for (let i = 0; i < list.length; i++) {
        const id = list.item(i)!.getAttributeNS(W14, "paraId");
        if (id) this.ids.add(id.toUpperCase());
      }
    }
    const all = this.paras();
    const missing: [Element, number][] = [];
    all.forEach((p, i) => {
      const id = this.paraId(p).toUpperCase();
      if (id && !this.ids.has(id)) this.ids.add(id);
      else missing.push([p, i]);
    });
    for (const [p, i] of missing) {
      const old = this.paraId(p);
      const id = this.name(p, `${i}:${textOfPara(p)}`);
      if (old) this.renamed.push({ from: old, to: id });
    }
  }

  /** An unused paraId: 8 hex digits below 0x80000000 (Word's rule). */
  freeId(seed: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 0x01000193) >>> 0;
    for (;;) {
      h = (h & 0x7fffffff) || 1;
      const id = h.toString(16).toUpperCase().padStart(8, "0");
      if (!this.ids.has(id)) {
        this.ids.add(id);
        return id;
      }
      h = (h + 0x9e3779b1) >>> 0;
    }
  }

  /** The tracked-edit context, or null when this edit is not tracked. */
  track(want?: boolean): Track | null {
    if (!(want ?? this.tracking)) return null;
    if (!this.nextChange) this.nextChange = maxId(this.doc) + 1;
    return {
      author: this.author,
      date: wordDate(this.now()),
      nextId: () => String(this.nextChange++),
    };
  }

  touch(): void {
    this.parts.touch(this.parts.main);
  }

  /** The text width of the page (twips), for tables. */
  textWidth(): number {
    const sect = wkid(this.body, "sectPr");
    const pg = sect && wkid(sect, "pgSz");
    const mar = sect && wkid(sect, "pgMar");
    const w = Number((pg && getW(pg, "w")) ?? 11906);
    const l = Number((mar && getW(mar, "left")) ?? 1440);
    const r = Number((mar && getW(mar, "right")) ?? 1440);
    return Math.max(1440, w - l - r);
  }
}

/** The blocks of a body, a table cell or a content control, in order. */
export function blocksOf(parent: Element): Block[] {
  const out: Block[] = [];
  for (const c of wkids(parent)) {
    if (c.localName === "p") out.push({ kind: "p", el: c });
    else if (c.localName === "tbl") out.push({ kind: "tbl", el: c });
    else if (c.localName === "sdt") {
      const content = wkid(c, "sdtContent");
      if (content) out.push(...blocksOf(content));
    } else if (c.localName === "customXml") out.push(...blocksOf(c));
  }
  return out;
}

/** A table's rows (through content controls). */
export function rowsOf(tbl: Element): Element[] {
  const out: Element[] = [];
  const walk = (e: Element) => {
    for (const c of wkids(e)) {
      if (c.localName === "tr") out.push(c);
      else if (c.localName === "sdt" || c.localName === "customXml") walk(wkid(c, "sdtContent") ?? c);
    }
  };
  walk(tbl);
  return out;
}

export function cellsOfRow(tr: Element): Element[] {
  const out: Element[] = [];
  const walk = (e: Element) => {
    for (const c of wkids(e)) {
      if (c.localName === "tc") out.push(c);
      else if (c.localName === "sdt" || c.localName === "customXml") walk(wkid(c, "sdtContent") ?? c);
    }
  };
  walk(tr);
  return out;
}

export function cellsOf(tbl: Element): Element[] {
  return rowsOf(tbl).flatMap(cellsOfRow);
}

/** The largest w:id of a change or annotation in the part, so new ones are unique. */
function maxId(doc: Document): number {
  let max = 0;
  for (const local of ["ins", "del", "moveFrom", "moveTo", "rPrChange", "pPrChange", "trPrChange", "tcPrChange", "tblPrChange", "sectPrChange", "bookmarkStart", "commentRangeStart"]) {
    const list = doc.getElementsByTagNameNS(W, local);
    for (let i = 0; i < list.length; i++) {
      const n = Number(getW(list.item(i)!, "id"));
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return max;
}
