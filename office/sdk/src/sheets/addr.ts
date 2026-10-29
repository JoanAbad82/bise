// A1 addresses, pure: "B4" <-> {row: 4, col: 2}, "B4:D9" <-> a box,
// "Q3!B4" and "'My sheet'!B4" split into sheet and range.

import { OfficeError } from "../core/errors.ts";

export type Cell = { row: number; col: number };
export type Box = { top: number; left: number; bottom: number; right: number };

const MAX_ROW = 1048576;
const MAX_COL = 16384;

/** 1 -> "A", 27 -> "AA". */
export function colName(col: number): string {
  let s = "";
  for (let n = col; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

/** "AA" -> 27. */
export function colNumber(name: string): number {
  let n = 0;
  for (const ch of name.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

export function cellName(c: Cell): string {
  return `${colName(c.col)}${c.row}`;
}

/** "B4" or "$B$4"; undefined when it is not one cell. */
export function readCell(s: string): Cell | undefined {
  const m = /^\$?([A-Za-z]{1,3})\$?(\d{1,7})$/.exec(s.trim());
  if (!m) return undefined;
  const c = { col: colNumber(m[1]), row: Number(m[2]) };
  return c.row >= 1 && c.row <= MAX_ROW && c.col >= 1 && c.col <= MAX_COL ? c : undefined;
}

/** "B4", "B4:D9" (any corner order); throws bad_arg with words. */
export function readBox(range: string): Box {
  const [a, b = a] = range.split(":");
  const p = readCell(a ?? "");
  const q = readCell(b);
  if (!p || !q || range.split(":").length > 2) {
    throw new OfficeError("bad_arg", `${JSON.stringify(range)} is not a cell range: write one like "B4" or "B4:D9"`);
  }
  return { top: Math.min(p.row, q.row), left: Math.min(p.col, q.col), bottom: Math.max(p.row, q.row), right: Math.max(p.col, q.col) };
}

export function boxName(b: Box): string {
  const a = cellName({ row: b.top, col: b.left });
  return b.top === b.bottom && b.left === b.right ? a : `${a}:${cellName({ row: b.bottom, col: b.right })}`;
}

export function inBox(b: Box, c: Cell): boolean {
  return c.row >= b.top && c.row <= b.bottom && c.col >= b.left && c.col <= b.right;
}

/** "Q3!B4" or "'My sheet'!B4:C5" -> {sheet, range}; a bare range has no sheet. */
export function splitRef(ref: string): { sheet?: string; range: string } {
  const bang = ref.lastIndexOf("!");
  if (bang < 0) return { range: ref };
  let sheet = ref.slice(0, bang);
  if (sheet.startsWith("'") && sheet.endsWith("'")) sheet = sheet.slice(1, -1).replace(/''/g, "'");
  return { sheet, range: ref.slice(bang + 1) };
}

/** A cell's id in an outline: Q3!B4, quoted when the sheet name needs it. */
export function refName(sheet: string, range: string): string {
  return /^[A-Za-z_][A-Za-z0-9_.]*$/.test(sheet) ? `${sheet}!${range}` : `'${sheet.replace(/'/g, "''")}'!${range}`;
}
