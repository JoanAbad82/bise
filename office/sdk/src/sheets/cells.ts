// One exceljs cell read the way the SDK speaks of it: its value as a
// scalar (what a formula sees), its formula, its text as Excel shows it.

import type { Cell as XCell } from "exceljs";
import { BUILTIN, formatValue, serial } from "./numfmt.ts";
import type { Scalar } from "./formula.ts";

// exceljs ValueType (lib/doc/enums.js)
// A formula's result is read through `cell.result`: exceljs's `cell.value`
// drops a falsy one (0, false, ""), as if the formula had no value.
export const VT = { Null: 0, Merge: 1, Number: 2, String: 3, Date: 4, Hyperlink: 5, Formula: 6, SharedString: 7, RichText: 8, Boolean: 9, Error: 10 } as const;

/** The value a formula reading this cell sees (a formula cell: its result; a date: its serial). */
export function scalarOf(cell: XCell | undefined, date1904 = false): Scalar {
  if (!cell || cell.type === VT.Merge) return null;
  return toScalar(cell.type === VT.Formula ? resultOf(cell) : cell.value, date1904);
}

function toScalar(v: unknown, date1904: boolean): Scalar {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" || typeof v === "string" || typeof v === "boolean") return v;
  if (v instanceof Date) return serial(v, date1904);
  const o = v as Record<string, unknown>;
  if (typeof o.error === "string") return { error: o.error };
  if (Array.isArray(o.richText)) return (o.richText as { text: string }[]).map((r) => r.text).join("");
  if (typeof o.text === "string") return o.text; // a hyperlink
  return null;
}

/** The cell's formula without "=", or undefined. Shared formulas come translated to this cell. */
export function formulaOf(cell: XCell): string | undefined {
  if (cell.type !== VT.Formula) return undefined;
  const f = cell.formula as string | undefined;
  return f ? f.replace(/^=/, "") : undefined;
}

/** A formula cell with no cached result: blank in a viewer until something computes it. */
export function hasNoValue(cell: XCell): boolean {
  if (cell.type !== VT.Formula) return false;
  const r = resultOf(cell);
  return r === undefined || r === null;
}

function resultOf(cell: XCell): unknown {
  return (cell as unknown as { result?: unknown }).result;
}

/** The number format in force: its code, the built-in one by id when only the id is known. */
export function numFmtOf(cell: XCell): string | undefined {
  const f = cell.numFmt as unknown;
  if (typeof f === "string") return f;
  if (typeof f === "number") return BUILTIN[f];
  return undefined;
}

/** The value as Excel shows it. */
export function textOf(cell: XCell, date1904 = false): string {
  if (cell.type === VT.Merge) return "";
  const v = cell.type === VT.Formula ? resultOf(cell) : (cell.value as unknown);
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return formatValue(v, numFmtOf(cell), date1904);
  const s = toScalar(v, date1904);
  if (s && typeof s === "object") return s.error;
  return formatValue(s, numFmtOf(cell), date1904);
}

/** "FFRRGGBB" -> "#rrggbb"; undefined for theme or indexed colors. */
export function hex(argb: unknown): string | undefined {
  if (typeof argb !== "string" || !/^[0-9a-f]{6,8}$/i.test(argb)) return undefined;
  return `#${argb.slice(-6).toLowerCase()}`;
}
