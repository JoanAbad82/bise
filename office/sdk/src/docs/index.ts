// The docs module (docx): open or create a Word document, read its outline,
// edit it by paragraph id (text, runs, styles, tables, comments, tracked
// changes), check it, save it. Our own OOXML layer on the core's zip and
// XML: create() is a blank template of ours plus the same edits, one write
// path (architect m_23763: the `docx` package needs node globals and
// timers). docs/office.md says the API.

import type { Anchor } from "../anchor.gen.ts";
import { anchorFor } from "../core/anchor.ts";
import { OfficeError } from "../core/errors.ts";
import type { OfficeFile, Outline, OutlineNode, Problem, Selection } from "../core/outline.ts";
import { openPackage } from "../core/package.ts";
import type { Element } from "../core/xml.ts";
import { buildBlock, buildRow, type BlockSpec, type Inline } from "./blocks.ts";
import { listChanges, settle, type TrackedChange } from "./changes.ts";
import { check } from "./check.ts";
import { addComment, listComments, removeComment, reply, resolve, type Comment } from "./comments.ts";
import { blank, type CreateOptions } from "./create.ts";
import { cellsOfRow, Model, rowsOf, type ModelOptions } from "./model.ts";
import { inspect, paraAnchor } from "./outline.ts";
import { Parts } from "./parts.ts";
import { ensureStyle } from "./styles.ts";
import { deleteRuns, formatRun, insertText, matches, replaceSpan, runsIn, scan, type RunFormat } from "./text.ts";
import { el, insertAfter, isW, props, remove, setProp, W, wkid, wkids } from "./w.ts";

export type { BlockSpec, Inline, Run, Align } from "./blocks.ts";
export type { Comment } from "./comments.ts";
export type { TrackedChange, ChangeKind } from "./changes.ts";
export type { CreateOptions } from "./create.ts";
export type { RunFormat } from "./text.ts";
export type { ModelOptions as OpenOptions } from "./model.ts";

/** Every edit takes it: `track` makes it a tracked change (default: `doc.tracking`). */
export type EditOptions = { track?: boolean };

/** What `at(anchor)` gives on a paragraph. */
export type ParaOps = {
  /** the paragraph's text now (tracked insertions in, deletions out) */
  readonly text: string;
  /** where the anchor's quote is in the text, when it has one and it is still there */
  readonly quote?: { start: number; end: number; text: string };
  /** replace the whole text (keeps the first run's format) */
  setText(text: string, opts?: EditOptions): void;
  /** replace each match (a string, or a RegExp: `$1` works in `by`); returns how many */
  replace(find: string | RegExp, by: string, opts?: EditOptions & { all?: boolean }): number;
  /** insert text at "start", "end" (default) or an offset */
  insert(text: string, at?: "start" | "end" | number, opts?: EditOptions): void;
  /** format the anchor's quote, a given quote, or the whole paragraph */
  format(f: RunFormat, opts?: EditOptions & { quote?: string }): void;
  /** the paragraph's style ("Heading2", "Quote", ...; Title, Heading1-6, ListParagraph, Quote are added when missing) */
  style(id: string): void;
  align(a: "left" | "center" | "right" | "justify"): void;
  /** a comment on the anchor's quote, a given quote, or the whole paragraph */
  comment(text: string, opts?: { quote?: string }): Comment;
  /** a new block after (default) or before this paragraph */
  add(spec: BlockSpec, where?: "after" | "before", opts?: EditOptions): Selection<ParaOps> | TableSel;
  /** remove the paragraph (tracked: its text and mark marked deleted) */
  remove(opts?: EditOptions): void;
  /** the table this paragraph is in, else undefined */
  table(): TableSel | undefined;
};

/** A table: read its cells, edit them, add and remove rows (rows and columns count from 1). */
export type TableSel = {
  readonly node: OutlineNode;
  /** each cell's text, row by row */
  readonly rows: string[][];
  cell(row: number, col: number): Selection<ParaOps>;
  setCell(row: number, col: number, text: string, opts?: EditOptions): void;
  /** a new row after `after` (default: the last; 0: first), its cells from `values` */
  addRow(values: Inline[], opts?: EditOptions & { after?: number }): void;
  removeRow(row: number, opts?: EditOptions): void;
};

/** Where `add` puts a block: after or before an anchor's paragraph; nothing: at the end. */
export type Where = { after?: Anchor; before?: Anchor };

const P = Symbol("paragraph");

export class Doc implements OfficeFile<"docx", ParaOps> {
  readonly kind = "docx" as const;
  private m: Model;

  constructor(m: Model) {
    this.m = m;
  }

  /** who tracked changes and comments are by */
  get author(): string {
    return this.m.author;
  }
  set author(a: string) {
    this.m.author = a;
  }
  /** when true, every edit is a tracked change unless it says `track: false` */
  get tracking(): boolean {
    return this.m.tracking;
  }
  set tracking(on: boolean) {
    this.m.tracking = on;
  }

  inspect(): Outline {
    return inspect(this.m);
  }

  check(): Problem[] {
    return check(this.m);
  }

  async save(): Promise<Uint8Array> {
    this.m.parts.flush();
    return this.m.parts.zip.write();
  }

  /** The whole text, one paragraph per line (tables' cells too). */
  text(): string {
    return this.m
      .paras()
      .map((p) => scan(p).text)
      .join("\n");
  }

  /** Each place the text has this, as an anchor with the quote. */
  find(what: string | RegExp): Anchor[] {
    const out: Anchor[] = [];
    for (const p of this.m.paras()) {
      const text = scan(p).text;
      for (const hit of matches(text, what)) out.push(paraAnchor(this.m.paraId(p), text.slice(hit.start, hit.end)));
    }
    return out;
  }

  /** Replace in every paragraph; returns how many. */
  replaceAll(find: string | RegExp, by: string, opts?: EditOptions): number {
    let n = 0;
    for (const p of this.m.paras()) n += replaceIn(this.m, p, find, by, opts?.track, true);
    return n;
  }

  /** The paragraph under an anchor; by its id, else (an id Word renamed) the first with the anchor's quote. */
  at(anchor: Anchor): Selection<ParaOps> {
    const a = anchorFor("docx", anchor);
    if (a.kind !== "para") throw new OfficeError("anchor_kind_mismatch", "a docx takes para anchors");
    let p = this.m.byId(a.para);
    if (!p && a.quote) p = this.m.paras().find((x) => scan(x).text.includes(a.quote!));
    if (!p) {
      throw new OfficeError("not_found", `no paragraph ${a.para}${a.quote ? ` and no paragraph with "${a.quote}"` : ""} in this docx: inspect() again for the ids`);
    }
    return this.sel(p, a.quote);
  }

  /** A new block at the end, or after / before an anchor's paragraph. */
  add(spec: BlockSpec, where?: Where, opts?: EditOptions): Selection<ParaOps> | TableSel {
    const track = this.m.track(opts?.track);
    const made = buildBlock(this.m, spec, track);
    if (where?.after) insertAfter(made, this.paraOf(where.after));
    else if (where?.before) {
      const ref = this.paraOf(where.before);
      ref.parentNode!.insertBefore(made, ref);
    } else this.m.body.insertBefore(made, wkid(this.m.body, "sectPr") ?? null);
    this.m.touch();
    return isW(made, "tbl") ? tableSel(this, this.m, made) : this.sel(made);
  }

  /** The table whose cell holds the anchor's paragraph (a table node's anchor is its first cell's). */
  table(anchor: Anchor): TableSel {
    const t = this.at(anchor).table();
    if (!t) throw new OfficeError("not_found", "that paragraph is not in a table");
    return t;
  }

  readonly comments = {
    list: (): Comment[] => listComments(this.m),
    /** a comment on an anchor's quote (or its whole paragraph) */
    add: (anchor: Anchor, text: string): Comment => this.at(anchor).comment(text),
    reply: (id: string, text: string): Comment => reply(this.m, id, text),
    resolve: (id: string, done = true): void => resolve(this.m, id, done),
    remove: (id: string): void => removeComment(this.m, id),
  };

  readonly changes = {
    list: (): TrackedChange[] => listChanges(this.m),
    /** accept these changes (ids from list()), or all of them; returns how many */
    accept: (ids?: string | string[]): number => settle(this.m, true, ids),
    reject: (ids?: string | string[]): number => settle(this.m, false, ids),
  };

  private paraOf(anchor: Anchor): Element {
    return (this.at(anchor) as unknown as { [P]: Element })[P];
  }

  /** @internal a paragraph's selection */
  sel(p: Element, quote?: string): Selection<ParaOps> {
    return paraSel(this, this.m, p, quote);
  }
}

function findNode(nodes: OutlineNode[], id: string): OutlineNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    const hit = n.children && findNode(n.children, id);
    if (hit) return hit;
  }
  return undefined;
}

function replaceIn(m: Model, p: Element, find: string | RegExp, by: string, track: boolean | undefined, all: boolean): number {
  const text = scan(p).text;
  let hits = matches(text, find);
  if (!all) hits = hits.slice(0, 1);
  const t = m.track(track);
  for (const h of [...hits].reverse()) {
    const repl = typeof find === "string" ? by : by.replace(/\$(\d)/g, (_, d) => h.groups[Number(d)] ?? "");
    replaceSpan(p, h.start, h.end, repl, t);
  }
  if (hits.length) m.touch();
  return hits.length;
}

function span(p: Element, quote: string | undefined): { start: number; end: number; text: string } | undefined {
  if (!quote) return undefined;
  const i = scan(p).text.indexOf(quote);
  return i < 0 ? undefined : { start: i, end: i + quote.length, text: quote };
}

function paraSel(doc: Doc, m: Model, p: Element, anchorQuote?: string): Selection<ParaOps> {
  const id = m.paraId(p);
  const sel = {
    [P]: p,
    get node(): OutlineNode {
      return findNode(inspect(m).nodes, id) ?? { id, type: "para", anchor: paraAnchor(id), text: scan(p).text };
    },
    get text() {
      return scan(p).text;
    },
    get quote() {
      return span(p, anchorQuote);
    },
    setText(text: string, opts?: EditOptions) {
      replaceSpan(p, 0, scan(p).text.length, text, m.track(opts?.track));
      m.touch();
    },
    replace(find: string | RegExp, by: string, opts?: EditOptions & { all?: boolean }) {
      return replaceIn(m, p, find, by, opts?.track, opts?.all ?? true);
    },
    insert(text: string, at: "start" | "end" | number = "end", opts?: EditOptions) {
      const len = scan(p).text.length;
      const off = at === "start" ? 0 : at === "end" ? len : at;
      if (!Number.isInteger(off) || off < 0 || off > len) throw new OfficeError("bad_arg", `insert at "start", "end" or an offset 0..${len}, got ${at}`);
      insertText(p, off, text, m.track(opts?.track));
      m.touch();
    },
    format(f: RunFormat, opts?: EditOptions & { quote?: string }) {
      const q = opts?.quote ?? anchorQuote;
      const s = q ? span(p, q) : { start: 0, end: scan(p).text.length };
      if (!s) throw new OfficeError("not_found", `"${q}" is not in paragraph ${id} any more`);
      if (f.style && !ensureStyle(m.parts, f.style)) throw new OfficeError("bad_arg", `no character style "${f.style}" in this docx`);
      const t = m.track(opts?.track);
      for (const r of runsIn(p, s.start, s.end)) formatRun(r, f, t, setProp);
      m.touch();
    },
    style(styleId: string) {
      if (!ensureStyle(m.parts, styleId)) throw new OfficeError("bad_arg", `no style "${styleId}" in this docx (bise adds Title, Heading1-6, ListParagraph, Quote when missing)`);
      setProp(props(p, "pPr"), el(m.doc, "pStyle", { val: styleId }));
      m.touch();
    },
    align(a: "left" | "center" | "right" | "justify") {
      setProp(props(p, "pPr"), el(m.doc, "jc", { val: a === "justify" ? "both" : a }));
      m.touch();
    },
    comment(text: string, opts?: { quote?: string }) {
      const q = opts?.quote ?? anchorQuote;
      const s = span(p, q);
      if (opts?.quote && !s) throw new OfficeError("not_found", `"${opts.quote}" is not in paragraph ${id}`);
      return addComment(m, p, text, s);
    },
    add(spec: BlockSpec, where: "after" | "before" = "after", opts?: EditOptions) {
      const a = paraAnchor(id);
      return doc.add(spec, where === "before" ? { before: a } : { after: a }, opts);
    },
    remove(opts?: EditOptions) {
      const t = m.track(opts?.track);
      if (t) {
        const len = scan(p).text.length;
        if (len) deleteRuns(runsIn(p, 0, len), t);
        const pPr = props(p, "pPr");
        const rPr = wkid(pPr, "rPr") ?? setProp(pPr, el(m.doc, "rPr"));
        setProp(rPr, el(m.doc, "del", { id: t.nextId(), author: t.author, date: t.date }));
      } else {
        const parent = p.parentNode as Element;
        remove(p);
        // a table cell keeps one paragraph
        if (isW(parent, "tc") && !wkids(parent, "p").length && !wkids(parent, "tbl").length) {
          const empty = el(m.doc, "p");
          m.name(empty, `empty:${id}`);
          parent.appendChild(empty);
        }
      }
      m.touch();
    },
    table() {
      let x: Element | null = p.parentNode as Element | null;
      while (x && !(x.namespaceURI === W && x.localName === "tbl")) x = x.parentNode as Element | null;
      return x ? tableSel(doc, m, x) : undefined;
    },
  };
  return sel as unknown as Selection<ParaOps>;
}

function tableSel(doc: Doc, m: Model, tbl: Element): TableSel {
  const cellEl = (row: number, col: number): Element => {
    const tr = rowsOf(tbl)[row - 1];
    const tc = tr && cellsOfRow(tr)[col - 1];
    if (!tc) throw new OfficeError("not_found", `no cell (${row}, ${col}) in this table (rows and columns count from 1)`);
    return tc;
  };
  const firstPara = (tc: Element): Element => {
    const p = wkids(tc, "p")[0] ?? tc.getElementsByTagNameNS(W, "p").item(0);
    if (!p) throw new OfficeError("bad_xml", "a table cell with no paragraph");
    return p;
  };
  return {
    get node(): OutlineNode {
      return findNode(inspect(m).nodes, `table:${m.paraId(firstPara(cellEl(1, 1)))}`)!;
    },
    get rows() {
      return rowsOf(tbl).map((tr) =>
        cellsOfRow(tr).map((tc) =>
          wkids(tc, "p")
            .map((p) => scan(p).text)
            .join("\n"),
        ),
      );
    },
    cell(row: number, col: number) {
      return doc.sel(firstPara(cellEl(row, col)));
    },
    setCell(row: number, col: number, text: string, opts?: EditOptions) {
      doc.sel(firstPara(cellEl(row, col))).setText(text, opts);
    },
    addRow(values: Inline[], opts?: EditOptions & { after?: number }) {
      if (!Array.isArray(values)) throw new OfficeError("bad_arg", "a row's values are an array of cell texts");
      const rows = rowsOf(tbl);
      const after = opts?.after ?? rows.length;
      const ref = rows[after - 1];
      if (!ref && after !== 0) throw new OfficeError("not_found", `no row ${after} in this table`);
      const grid = wkid(tbl, "tblGrid");
      const tw = grid ? wkids(grid, "gridCol").map((g) => Number(g.getAttributeNS(W, "w") ?? 0)) : [];
      const cols = Math.max(tw.length, rows[0] ? cellsOfRow(rows[0]).length : 0, values.length);
      const tr = buildRow(m, values, cols, tw.length ? tw : [Math.round(m.textWidth() / cols)], false, m.track(opts?.track));
      if (ref) insertAfter(tr, ref);
      else tbl.insertBefore(tr, rows[0] ?? null);
      m.touch();
    },
    removeRow(row: number, opts?: EditOptions) {
      const tr = rowsOf(tbl)[row - 1];
      if (!tr) throw new OfficeError("not_found", `no row ${row} in this table`);
      const t = m.track(opts?.track);
      if (t) {
        const ps = tr.getElementsByTagNameNS(W, "p");
        const all: Element[] = [];
        for (let i = 0; i < ps.length; i++) all.push(ps.item(i)!);
        for (const p of all) {
          const len = scan(p).text.length;
          if (len) deleteRuns(runsIn(p, 0, len), t);
        }
        setProp(props(tr, "trPr"), el(m.doc, "del", { id: t.nextId(), author: t.author, date: t.date }));
      } else {
        remove(tr);
        if (!rowsOf(tbl).length) remove(tbl);
      }
      m.touch();
    },
  };
}

async function open(bytes: Uint8Array, opts?: ModelOptions): Promise<Doc> {
  const pkg = openPackage(bytes);
  if (pkg.kind !== "docx") throw new OfficeError("not_office", `this is a ${pkg.kind}, not a docx: open it with ${pkg.kind === "xlsx" ? "sheets" : "slides"}.open`);
  return new Doc(new Model(new Parts(pkg.zip, pkg.main), opts));
}

async function create(opts: CreateOptions = {}): Promise<Doc> {
  return open(blank(opts), { author: opts.author, now: opts.now });
}

export const docs = { open, create };
