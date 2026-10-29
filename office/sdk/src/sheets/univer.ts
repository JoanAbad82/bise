// The viewer's grid (Univer, kit/office/sheet.js) and the workbook, pure
// (page xlsx-univer, architect m_37322): a workbook as Univer's snapshot
// (IWorkbookData's shape, plain JSON: this module imports nothing of
// Univer), and what the user did in the grid as edits, replayed on the
// workbook it came from. The grid never writes the xlsx itself: the save
// is the SDK's (carry.ts keeps what exceljs does not model), so a chart or
// a pivot the grid never saw comes through.
//
//   const snap = book.univer();                 // what the grid opens
//   const edits = editsBetween(before, after);  // two saves of the grid
//   book.apply(edits); await book.save();
//
// Indexes in a snapshot are 0-based (Univer's), in an Edit 1-based (the
// SDK's). Widths and heights are pixels in the grid, characters and points
// in the file (inspect.ts widthPx, heightPx and back).

import type { Cell as XCell, Worksheet } from "exceljs";
import { OfficeError } from "../core/errors.ts";
import { formulaOf, hex, numFmtOf, scalarOf, VT } from "./cells.ts";
import { isError, type Scalar } from "./formula.ts";
import { heightPx, widthPx } from "./inspect.ts";
import type { XBook } from "./io.ts";

/** A cell of the snapshot: value, formula ("=SUM(A1:A3)"), style id, type (1 text, 2 number, 3 boolean, 4 forced text). */
export type UCell = { v?: string | number | boolean | null; f?: string | null; s?: string | null; t?: number | null };
export type UBorder = { s: number; cl?: { rgb: string } };
/** Univer's IStyleData, the part bise reads from an xlsx. */
export type UStyle = {
  bl?: 0 | 1;
  it?: 0 | 1;
  ul?: { s: 1 };
  st?: { s: 1 };
  fs?: number;
  ff?: string;
  cl?: { rgb: string };
  bg?: { rgb: string };
  ht?: number;
  vt?: number;
  tb?: number;
  n?: { pattern: string };
  bd?: { t?: UBorder; b?: UBorder; l?: UBorder; r?: UBorder };
};
export type USheet = {
  id: string;
  name: string;
  hidden?: 0 | 1;
  rowCount: number;
  columnCount: number;
  defaultColumnWidth: number;
  defaultRowHeight: number;
  cellData: Record<number, Record<number, UCell>>;
  columnData: Record<number, { w?: number; hd?: 0 | 1 }>;
  rowData: Record<number, { h?: number; hd?: 0 | 1 }>;
  mergeData: { startRow: number; endRow: number; startColumn: number; endColumn: number }[];
  freeze?: { xSplit: number; ySplit: number; startRow: number; startColumn: number };
};
export type UWorkbook = {
  id: string;
  name: string;
  appVersion: string;
  sheetOrder: string[];
  styles: Record<string, UStyle>;
  sheets: Record<string, USheet>;
};

/** What the user did in the grid, as the SDK edits it (1-based, sheet by name). */
export type Edit =
  /** a value (null: cleared) or a formula with the result the grid computed */
  | { kind: "cell"; sheet: string; row: number; col: number; value: Scalar | { formula: string; result?: Scalar } }
  /** a formula cell the grid recomputed: only its cached result changes */
  | { kind: "result"; sheet: string; row: number; col: number; result: Scalar }
  | { kind: "width"; sheet: string; col: number; px: number }
  | { kind: "height"; sheet: string; row: number; px: number };

/** Rows and columns past the data the grid shows, to type in. */
const ROOM_ROWS = 100;
const ROOM_COLS = 10;
const MIN_ROWS = 200;
const MIN_COLS = 26;

const HT: Record<string, number> = { left: 1, center: 2, right: 3, justify: 4, distributed: 6 };
const VA: Record<string, number> = { top: 1, middle: 2, bottom: 3 };
const BD: Record<string, number> = {
  thin: 1, hair: 2, dotted: 3, dashed: 4, dashDot: 5, dashDotDot: 6, double: 7,
  medium: 8, mediumDashed: 9, mediumDashDot: 10, mediumDashDotDot: 11, slantDashDot: 12, thick: 13,
};

/** pixels -> Excel column width in characters (inverse of widthPx), 2 decimals. */
export const widthChars = (px: number): number => Math.max(0, Math.round(((px - 5) / 7) * 100) / 100);
/** pixels -> row height in points (inverse of heightPx), 2 decimals. */
export const heightPt = (px: number): number => Math.max(0, Math.round(((px * 72) / 96) * 100) / 100);

/** The workbook as Univer's snapshot. */
export function toUniver(book: XBook, id = "book"): UWorkbook {
  const date1904 = !!book.properties?.date1904;
  const styles = new Map<string, string>();
  const styleOf = (s: UStyle): string | undefined => {
    const key = JSON.stringify(s);
    if (key === "{}") return undefined;
    let sid = styles.get(key);
    if (!sid) styles.set(key, (sid = `s${styles.size + 1}`));
    return sid;
  };
  const sheets: Record<string, USheet> = {};
  const order: string[] = [];
  book.eachSheet((ws) => {
    const sid = `sheet${order.length + 1}`;
    order.push(sid);
    sheets[sid] = sheetOf(ws, sid, date1904, styleOf);
  });
  const styleRecord: Record<string, UStyle> = {};
  for (const [key, sid] of styles) styleRecord[sid] = JSON.parse(key);
  return { id, name: "", appVersion: "1", sheetOrder: order, styles: styleRecord, sheets };
}

function sheetOf(ws: Worksheet, id: string, date1904: boolean, styleOf: (s: UStyle) => string | undefined): USheet {
  const cellData: USheet["cellData"] = {};
  let rows = 0;
  let cols = 0;
  ws.eachRow({ includeEmpty: false }, (row, r) => {
    row.eachCell({ includeEmpty: false }, (cell, c) => {
      if (cell.type === VT.Merge) return;
      const u = cellOf(cell, date1904);
      const s = styleOf(styleData(cell));
      if (s) u.s = s;
      if (Object.keys(u).length === 0) return;
      (cellData[r - 1] ??= {})[c - 1] = u;
      rows = Math.max(rows, r);
      cols = Math.max(cols, c);
    });
  });
  const defaultColumnWidth = widthPx(ws.properties.defaultColWidth ?? 8.43);
  const defaultRowHeight = heightPx(ws.properties.defaultRowHeight ?? 15);
  const columnData: USheet["columnData"] = {};
  const lastCol = Math.max(ws.columnCount, (ws as unknown as { _columns?: unknown[] })._columns?.length ?? 0);
  for (let c = 1; c <= lastCol; c++) {
    const col = ws.getColumn(c);
    const d: { w?: number; hd?: 0 | 1 } = {};
    if (col.width !== undefined) d.w = widthPx(col.width);
    if (col.hidden) d.hd = 1;
    if (d.w !== undefined || d.hd) columnData[c - 1] = d;
  }
  const rowData: USheet["rowData"] = {};
  ws.eachRow({ includeEmpty: true }, (row, r) => {
    const d: { h?: number; hd?: 0 | 1 } = {};
    if (row.height) d.h = heightPx(row.height);
    if (row.hidden) d.hd = 1;
    if (d.h !== undefined || d.hd) rowData[r - 1] = d;
  });
  const mergeData: USheet["mergeData"] = [];
  for (const m of Object.values((ws as unknown as { _merges: Record<string, { model: { top: number; left: number; bottom: number; right: number } }> })._merges ?? {})) {
    const { top, left, bottom, right } = m.model;
    mergeData.push({ startRow: top - 1, endRow: bottom - 1, startColumn: left - 1, endColumn: right - 1 });
    rows = Math.max(rows, bottom);
    cols = Math.max(cols, right);
  }
  const sheet: USheet = {
    id,
    name: ws.name,
    rowCount: Math.max(MIN_ROWS, rows + ROOM_ROWS),
    columnCount: Math.max(MIN_COLS, cols + ROOM_COLS, lastCol),
    defaultColumnWidth,
    defaultRowHeight,
    cellData,
    columnData,
    rowData,
    mergeData,
  };
  if (ws.state && ws.state !== "visible") sheet.hidden = 1;
  const view = ws.views?.[0] as { state?: string; xSplit?: number; ySplit?: number } | undefined;
  if (view?.state === "frozen" && (view.xSplit || view.ySplit)) {
    const x = view.xSplit ?? 0;
    const y = view.ySplit ?? 0;
    sheet.freeze = { xSplit: x, ySplit: y, startRow: y, startColumn: x };
  }
  return sheet;
}

/** A value as the grid holds it: a number, text, a boolean; an error as its text. */
function plain(v: Scalar): Pick<UCell, "v" | "t"> {
  if (v === null) return {};
  if (typeof v === "number") return { v, t: 2 };
  if (typeof v === "boolean") return { v: v ? 1 : 0, t: 3 };
  if (isError(v)) return { v: v.error, t: 1 };
  return { v, t: 1 };
}

function cellOf(cell: XCell, date1904: boolean): UCell {
  const value = plain(scalarOf(cell, date1904));
  const f = formulaOf(cell);
  return f ? { f: `=${f}`, ...value } : value;
}

function styleData(cell: XCell): UStyle {
  const s: UStyle = {};
  const font = cell.font ?? {};
  if (font.bold) s.bl = 1;
  if (font.italic) s.it = 1;
  if (font.underline) s.ul = { s: 1 };
  if (font.strike) s.st = { s: 1 };
  if (font.size && font.size !== 11) s.fs = font.size;
  if (font.name && font.name !== "Calibri") s.ff = font.name;
  const color = hex(font.color?.argb);
  if (color) s.cl = { rgb: color };
  const fill = cell.fill as { type?: string; pattern?: string; fgColor?: { argb?: string } } | undefined;
  const bg = fill?.type === "pattern" && fill.pattern === "solid" ? hex(fill.fgColor?.argb) : undefined;
  if (bg) s.bg = { rgb: bg };
  const a = cell.alignment ?? {};
  if (a.horizontal && HT[a.horizontal]) s.ht = HT[a.horizontal];
  if (a.vertical && VA[a.vertical]) s.vt = VA[a.vertical];
  if (a.wrapText) s.tb = 3;
  const fmt = numFmtOf(cell);
  if (fmt && fmt !== "General") s.n = { pattern: fmt };
  const b = cell.border ?? {};
  const bd: NonNullable<UStyle["bd"]> = {};
  for (const [side, k] of [["top", "t"], ["bottom", "b"], ["left", "l"], ["right", "r"]] as const) {
    const x = (b as Record<string, { style?: string; color?: { argb?: string } } | undefined>)[side];
    if (!x?.style || !BD[x.style]) continue;
    const rgb = hex(x.color?.argb);
    bd[k] = rgb ? { s: BD[x.style], cl: { rgb } } : { s: BD[x.style] };
  }
  if (Object.keys(bd).length) s.bd = bd;
  return s;
}

// ---- what the user did: two snapshots of the grid compared ----

/** A cell's value as the SDK takes it back. */
function scalarOfCell(u: UCell | undefined): Scalar {
  if (!u || u.v === undefined || u.v === null || u.v === "") return null;
  if (u.t === 2) {
    const n = typeof u.v === "number" ? u.v : Number(u.v);
    return Number.isFinite(n) ? n : String(u.v);
  }
  if (u.t === 3) return u.v === true || u.v === 1 || u.v === "1" || String(u.v).toUpperCase() === "TRUE";
  if (typeof u.v === "string" && /^#(NULL!|DIV\/0!|VALUE!|REF!|NAME\?|NUM!|N\/A|SPILL!|CALC!|GETTING_DATA)$/.test(u.v)) return { error: u.v };
  if (typeof u.v === "number" && u.t !== 1 && u.t !== 4) return u.v;
  return typeof u.v === "boolean" ? u.v : String(u.v);
}

const same = (a: Scalar, b: Scalar): boolean => JSON.stringify(a) === JSON.stringify(b);
const formulaText = (u: UCell | undefined): string | undefined => (u?.f ? String(u.f).replace(/^=/, "") : undefined);

/**
 * The edits that turn `before` into `after`, both snapshots of the grid
 * (Univer's own save, so its way of holding a value is the same on both
 * sides): cells whose value or formula changed, formula cells whose result
 * the grid recomputed, columns and rows whose size changed. Styles, sheets
 * added or renamed are not edits the viewer makes (its menus are off).
 */
export function editsBetween(before: UWorkbook, after: UWorkbook): Edit[] {
  const out: Edit[] = [];
  for (const sid of before.sheetOrder) {
    const a = before.sheets[sid];
    const b = after.sheets[sid];
    if (!a || !b) continue;
    const sheet = a.name;
    const rows = new Set([...Object.keys(a.cellData ?? {}), ...Object.keys(b.cellData ?? {})].map(Number));
    for (const r of [...rows].sort((x, y) => x - y)) {
      const ra = a.cellData?.[r] ?? {};
      const rb = b.cellData?.[r] ?? {};
      const cols = new Set([...Object.keys(ra), ...Object.keys(rb)].map(Number));
      for (const c of [...cols].sort((x, y) => x - y)) {
        const fa = formulaText(ra[c]);
        const fb = formulaText(rb[c]);
        const va = scalarOfCell(ra[c]);
        const vb = scalarOfCell(rb[c]);
        const at = { sheet, row: r + 1, col: c + 1 };
        if (fa !== fb) out.push({ kind: "cell", ...at, value: fb ? { formula: fb, result: vb } : vb });
        else if (!same(va, vb)) out.push(fb ? { kind: "result", ...at, result: vb } : { kind: "cell", ...at, value: vb });
      }
    }
    const colKeys = new Set([...Object.keys(a.columnData ?? {}), ...Object.keys(b.columnData ?? {})].map(Number));
    for (const c of [...colKeys].sort((x, y) => x - y)) {
      const wa = a.columnData?.[c]?.w ?? a.defaultColumnWidth;
      const wb = b.columnData?.[c]?.w ?? b.defaultColumnWidth;
      if (Math.round(wa) !== Math.round(wb)) out.push({ kind: "width", sheet, col: c + 1, px: Math.round(wb) });
    }
    const rowKeys = new Set([...Object.keys(a.rowData ?? {}), ...Object.keys(b.rowData ?? {})].map(Number));
    for (const r of [...rowKeys].sort((x, y) => x - y)) {
      const ha = a.rowData?.[r]?.h ?? a.defaultRowHeight;
      const hb = b.rowData?.[r]?.h ?? b.defaultRowHeight;
      if (Math.round(ha) !== Math.round(hb)) out.push({ kind: "height", sheet, row: r + 1, px: Math.round(hb) });
    }
  }
  return out;
}

// ---- the edits on the workbook ----

/** exceljs's value for a scalar (an error as {error}). */
function xValue(v: Scalar): unknown {
  return v;
}

/** Replay `edits` on the workbook (Book.apply). Throws not_found for a sheet it does not have. */
export function applyEdits(book: XBook, edits: Edit[]): void {
  const sheet = (name: string): Worksheet => {
    const ws = book.worksheets.find((w) => w.name === name);
    if (!ws) throw new OfficeError("not_found", `no sheet "${name}" in this workbook`);
    return ws;
  };
  for (const e of edits) {
    const ws = sheet(e.sheet);
    if (e.kind === "width") ws.getColumn(e.col).width = widthChars(e.px);
    else if (e.kind === "height") ws.getRow(e.row).height = heightPt(e.px);
    else if (e.kind === "result") {
      const cell = ws.getCell(e.row, e.col);
      const f = formulaOf(cell);
      if (f) cell.value = { formula: f, result: xValue(e.result) } as never;
    } else {
      const cell = ws.getCell(e.row, e.col);
      const v = e.value;
      if (v !== null && typeof v === "object" && "formula" in v) {
        cell.value = (v.result === undefined || v.result === null ? { formula: v.formula } : { formula: v.formula, result: xValue(v.result) }) as never;
      } else cell.value = xValue(v) as never;
    }
  }
}
