// An open workbook: the OfficeFile of the sheets module (inspect, at,
// check, save) and its edits. Cells are named the way notes and outlines
// name them: `Q3!B4`, `'My sheet'!B4:D9`, or an anchor {kind: "cell"}.

import type { Cell as XCell, Worksheet } from "exceljs";
import { anchorFor, type Anchor } from "../core/anchor.ts";
import { OfficeError } from "../core/errors.ts";
import type { Outline, OutlineNode, OfficeFile, Problem, Selection } from "../core/outline.ts";
import { checkPackage } from "../core/package.ts";
import { boxName, readBox, refName, splitRef, type Box } from "./addr.ts";
import { recalc, type Recalc } from "./calc.ts";
import { assemble, losses } from "./carry.ts";
import { scalarOf, VT } from "./cells.ts";
import { cellProblems, lossProblems } from "./check.ts";
import type { Scalar } from "./formula.ts";
import { cellNode, sheetNodes, type InspectOptions } from "./inspect.ts";
import { render, type Origin, type XBook } from "./io.ts";
import { applyEdits, toUniver, type Edit, type UWorkbook } from "./univer.ts";

/** What `set` takes per cell: a value, a formula ("=SUM(B1:B3)" or {formula}), or null to clear. */
export type CellInput = number | string | boolean | Date | null | { formula: string } | { error: string };

export type Style = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  /** font size in points */
  size?: number;
  /** font name */
  font?: string;
  /** text color, "#rrggbb" */
  color?: string;
  /** background, "#rrggbb", or null to remove */
  fill?: string | null;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  wrap?: boolean;
  /** a number format: "0.00", "#,##0", "0%", "yyyy-mm-dd", '"$"#,##0.00' */
  numFmt?: string;
  /** a border on every side of every cell, or "none" */
  border?: "thin" | "medium" | "thick" | "none";
};

/** What `at`, `range` and `addSheet` return: the node, and the edits on its cells. */
export type RangeOps = {
  /** the sheet and the range, as written in an outline id */
  readonly ref: string;
  /** the values, row by row (a formula's: its result) */
  values(): Scalar[][];
  /** values from the top-left corner (a 2D array, a row array, or one value for every cell) */
  set(values: CellInput | CellInput[] | CellInput[][]): RangeSel;
  /** the same formula in every cell (refs are not shifted) */
  formula(f: string): RangeSel;
  style(s: Style): RangeSel;
  merge(): RangeSel;
  unmerge(): RangeSel;
  /** column widths of the range's columns, in characters (Excel's unit) */
  width(chars: number): RangeSel;
  /** row heights of the range's rows, in points */
  height(points: number): RangeSel;
  /** a note (comment) on the top-left cell, or null to remove it */
  note(text: string | null): RangeSel;
  clear(): RangeSel;
};
export type RangeSel = Selection<RangeOps>;

export type SaveOptions = {
  /** parts the save may drop, by path, as check() names them (would_lose) */
  drop?: string[];
};

export class Book implements OfficeFile<"xlsx", RangeOps> {
  readonly kind = "xlsx" as const;
  private edited = false;
  private last?: Recalc;

  constructor(
    private x: XBook,
    private origin?: Origin,
    private bytes?: Uint8Array,
  ) {
    if (!origin) this.edited = true;
  }

  /** The sheet names, in tab order. */
  get sheetNames(): string[] {
    return this.x.worksheets.map((ws) => ws.name);
  }

  /** Was anything changed since open (a save of an unchanged file gives its bytes back)? */
  get changed(): boolean {
    return this.edited;
  }

  /** exceljs's Workbook, for what this API does not do. Using it counts as an edit. */
  get exceljs(): XBook {
    this.edited = true;
    return this.x;
  }

  inspect(opts?: InspectOptions): Outline {
    if (opts?.sheet !== undefined) this.sheet(opts.sheet);
    return { kind: "xlsx", nodes: sheetNodes(this.x, this.origin, opts) };
  }

  at(anchor: Anchor): RangeSel {
    const a = anchorFor("xlsx", anchor);
    if (a.kind !== "cell") throw new OfficeError("anchor_kind_mismatch", `a ${a.kind} anchor does not point into a sheet`);
    return this.select(this.sheet(a.sheet), readBox(a.range));
  }

  /** A range by reference: "Q3!B4", "'My sheet'!B4:D9" (a bare "B4" on the first sheet). */
  range(ref: string): RangeSel {
    const { sheet, range } = splitRef(ref);
    const ws = sheet === undefined ? this.x.worksheets[0] : this.sheet(sheet);
    if (!ws) throw new OfficeError("not_found", "this workbook has no sheet");
    return this.select(ws, readBox(range));
  }

  /** A new sheet (at the end, or at `index` from 0), filled from A1 with `rows` when given. */
  addSheet(name: string, opts: { rows?: CellInput[][]; index?: number } = {}): RangeSel {
    if (this.x.getWorksheet(name)) throw new OfficeError("bad_arg", `a sheet named "${name}" already exists`);
    let ws: Worksheet;
    try {
      ws = this.x.addWorksheet(name);
    } catch (e) {
      throw new OfficeError("bad_arg", `"${name}" cannot be a sheet name: ${(e as Error).message}`);
    }
    this.edited = true;
    if (opts.index !== undefined) this.moveSheet(name, opts.index);
    const sel = this.select(ws, { top: 1, left: 1, bottom: 1, right: 1 });
    if (opts.rows?.length) sel.set(opts.rows);
    const width = Math.max(1, ...(opts.rows ?? []).map((r) => r.length));
    return this.select(ws, { top: 1, left: 1, bottom: Math.max(1, opts.rows?.length ?? 1), right: width });
  }

  /** Remove a sheet. What hangs on it that exceljs does not model makes save() refuse (would_lose) unless dropped. */
  removeSheet(name: string): void {
    this.x.removeWorksheet(this.sheet(name).id);
    this.edited = true;
  }

  renameSheet(from: string, to: string): void {
    if (this.x.getWorksheet(to)) throw new OfficeError("bad_arg", `a sheet named "${to}" already exists`);
    const ws = this.sheet(from);
    try {
      ws.name = to;
    } catch (e) {
      throw new OfficeError("bad_arg", `"${to}" cannot be a sheet name: ${(e as Error).message}`);
    }
    this.edited = true;
  }

  /** Move a sheet to tab position `index` (from 0). */
  moveSheet(name: string, index: number): void {
    const list = this.x.worksheets;
    const ws = this.sheet(name);
    if (!Number.isInteger(index) || index < 0 || index >= list.length) throw new OfficeError("bad_arg", `a sheet index goes from 0 to ${list.length - 1}, not ${index}`);
    const order = list.filter((w) => w !== ws);
    order.splice(index, 0, ws);
    order.forEach((w, i) => ((w as unknown as { orderNo: number }).orderNo = i));
    this.edited = true;
  }

  /** Compute every formula the SDK can (save does it too); what it cannot is listed. */
  /** The workbook as the viewer's grid opens it (Univer's snapshot, univer.ts). */
  univer(): UWorkbook {
    return toUniver(this.x);
  }

  /** What the user did in the grid (univer.ts editsBetween), replayed on this workbook. */
  apply(edits: Edit[]): void {
    if (edits.length === 0) return;
    applyEdits(this.x, edits);
    this.edited = true;
  }

  recalc(): Recalc {
    this.last = recalc(this.x);
    return this.last;
  }

  check(): Problem[] {
    if (!this.edited) return [...(this.origin ? checkPackage(this.origin.zip) : []), ...cellProblems(this.x, undefined)];
    const r = this.recalc();
    const lost = this.origin ? losses(this.origin, this.x) : [];
    const out = [...lossProblems(lost), ...cellProblems(this.x, r)];
    const zip = assemble(this.origin, render(this.x), this.x, lost.map((l) => l.part));
    return [...checkPackage(zip), ...out];
  }

  async save(opts: SaveOptions = {}): Promise<Uint8Array> {
    if (!this.edited && this.bytes) return this.bytes;
    this.recalc();
    // what the SDK could not compute, Excel recomputes when it opens the file
    this.x.calcProperties = { ...(this.x.calcProperties ?? {}), fullCalcOnLoad: true };
    return assemble(this.origin, render(this.x), this.x, opts.drop).write();
  }

  // ---- inside ----

  private sheet(name: string): Worksheet {
    const ws = this.x.worksheets.find((w) => w.name === name) ?? this.x.worksheets.find((w) => w.name.toLowerCase() === name.toLowerCase());
    if (!ws) throw new OfficeError("not_found", `no sheet "${name}" in this workbook (it has ${this.sheetNames.map((n) => `"${n}"`).join(", ")})`);
    return ws;
  }

  private select(ws: Worksheet, box: Box): RangeSel {
    const book = this;
    const ref = refName(ws.name, boxName(box));
    const cells = (fn: (c: XCell, r: number, col: number) => void) => {
      for (let r = box.top; r <= box.bottom; r++) for (let c = box.left; c <= box.right; c++) fn(ws.getCell(r, c), r, c);
    };
    const edit = (fn: () => void): RangeSel => {
      fn();
      book.edited = true;
      return sel;
    };
    const sel: RangeSel = {
      node: book.node(ws, box),
      ref,
      values() {
        const date1904 = !!book.x.properties?.date1904;
        const out: Scalar[][] = [];
        for (let r = box.top; r <= box.bottom; r++) {
          const row: Scalar[] = [];
          for (let c = box.left; c <= box.right; c++) row.push(scalarOf(ws.findCell(r, c) as XCell | undefined, date1904));
          out.push(row);
        }
        return out;
      },
      set: (values) =>
        edit(() => {
          const grid = toGrid(values, box);
          grid.forEach((row, i) => row.forEach((v, j) => (ws.getCell(box.top + i, box.left + j).value = cellValue(v) as never)));
        }),
      formula: (f) => edit(() => cells((c) => (c.value = { formula: f.replace(/^=/, "") } as never))),
      style: (s) => edit(() => cells((c) => applyStyle(c, s))),
      merge: () =>
        edit(() => {
          try {
            ws.mergeCells(box.top, box.left, box.bottom, box.right);
          } catch (e) {
            throw new OfficeError("bad_arg", `${ref} cannot be merged: ${(e as Error).message}`);
          }
        }),
      unmerge: () => edit(() => ws.unMergeCells(box.top, box.left, box.bottom, box.right)),
      width: (chars) =>
        edit(() => {
          if (!(chars >= 0 && chars <= 255)) throw new OfficeError("bad_arg", `a column width is 0 to 255 characters, not ${chars}`);
          for (let c = box.left; c <= box.right; c++) ws.getColumn(c).width = chars;
        }),
      height: (points) =>
        edit(() => {
          if (!(points >= 0 && points <= 409)) throw new OfficeError("bad_arg", `a row height is 0 to 409 points, not ${points}`);
          for (let r = box.top; r <= box.bottom; r++) ws.getRow(r).height = points;
        }),
      note: (text) => edit(() => (ws.getCell(box.top, box.left).note = (text ?? undefined) as never)),
      clear: () =>
        edit(() =>
          cells((c) => {
            c.value = null;
            c.style = {};
          }),
        ),
    };
    return sel;
  }

  private node(ws: Worksheet, box: Box): OutlineNode {
    const date1904 = !!this.x.properties?.date1904;
    if (box.top === box.bottom && box.left === box.right) return cellNode(ws.name, ws.getCell(box.top, box.left), date1904);
    const rows: string[] = [];
    const kids: OutlineNode[] = [];
    for (let r = box.top; r <= box.bottom; r++) {
      const row: string[] = [];
      for (let c = box.left; c <= box.right; c++) {
        const cell = ws.findCell(r, c) as XCell | undefined;
        if (cell && cell.type !== VT.Null && cell.type !== VT.Merge) kids.push(cellNode(ws.name, cell, date1904));
        row.push(cell ? cellNode(ws.name, cell, date1904).text ?? "" : "");
      }
      rows.push(row.join("\t"));
    }
    const range = boxName(box);
    return { id: refName(ws.name, range), type: "range", anchor: { kind: "cell", sheet: ws.name, range }, text: rows.join("\n"), children: kids };
  }
}

function toGrid(values: CellInput | CellInput[] | CellInput[][], box: Box): CellInput[][] {
  if (Array.isArray(values)) {
    if (values.every((r) => Array.isArray(r))) return values as CellInput[][];
    if (values.some((r) => Array.isArray(r))) throw new OfficeError("bad_arg", "set() takes one value, a row [a, b], or rows [[a, b], [c, d]], not a mix");
    return [values as CellInput[]];
  }
  const rows = box.bottom - box.top + 1;
  const cols = box.right - box.left + 1;
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => values));
}

function cellValue(v: CellInput): unknown {
  if (v === undefined || v === null) return null;
  if (typeof v === "string" && v.startsWith("=") && v.length > 1) return { formula: v.slice(1) };
  if (typeof v === "number" && !Number.isFinite(v)) throw new OfficeError("bad_arg", `a cell takes a finite number, not ${v}`);
  if (typeof v === "object" && !(v instanceof Date)) {
    if ("formula" in v && typeof v.formula === "string") return { formula: v.formula.replace(/^=/, "") };
    if ("error" in v && typeof v.error === "string") return { error: v.error };
    throw new OfficeError("bad_arg", `a cell takes a number, text, a boolean, a Date, null, "=FORMULA" or {formula}; not ${JSON.stringify(v)}`);
  }
  return v;
}

function argb(color: string, what: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) throw new OfficeError("bad_arg", `${what} is a color like "#1f6feb", not ${JSON.stringify(color)}`);
  return `FF${m[1].toUpperCase()}`;
}

function applyStyle(c: XCell, s: Style): void {
  const font = { ...(c.font ?? {}) } as Record<string, unknown>;
  let fontChanged = false;
  for (const k of ["bold", "italic", "underline"] as const) {
    if (s[k] !== undefined) {
      font[k] = s[k];
      fontChanged = true;
    }
  }
  if (s.size !== undefined) {
    if (!(s.size > 0 && s.size < 410)) throw new OfficeError("bad_arg", `a font size is in points (1 to 409), not ${s.size}`);
    font.size = s.size;
    fontChanged = true;
  }
  if (s.font !== undefined) {
    font.name = s.font;
    fontChanged = true;
  }
  if (s.color !== undefined) {
    font.color = { argb: argb(s.color, "color") };
    fontChanged = true;
  }
  if (fontChanged) c.font = font as never;
  if (s.fill !== undefined) {
    c.fill = (s.fill === null ? { type: "pattern", pattern: "none" } : { type: "pattern", pattern: "solid", fgColor: { argb: argb(s.fill, "fill") } }) as never;
  }
  if (s.align !== undefined || s.valign !== undefined || s.wrap !== undefined) {
    const a = { ...(c.alignment ?? {}) } as Record<string, unknown>;
    if (s.align !== undefined) a.horizontal = s.align;
    if (s.valign !== undefined) a.vertical = s.valign;
    if (s.wrap !== undefined) a.wrapText = s.wrap;
    c.alignment = a as never;
  }
  if (s.numFmt !== undefined) c.numFmt = s.numFmt;
  if (s.border !== undefined) {
    const side = s.border === "none" ? undefined : { style: s.border };
    c.border = (side ? { top: side, left: side, bottom: side, right: side } : {}) as never;
  }
}
