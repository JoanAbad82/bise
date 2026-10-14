// The outline of a workbook (docs/office.md): one node per sheet, its cells
// as children. Field names are the ones the viewer reads (office-viewer
// m_23787): sheet props widths (px per column from A), heights ({row: px}),
// merged, frozen, charts, pivots; cell text as Excel shows it and props
// formula, bold, italic, fill, color, align, noValue.

import type { Cell as XCell, Worksheet } from "exceljs";
import type { OutlineNode } from "../core/outline.ts";
import { rels as readRels } from "../core/opc.ts";
import { textOf as xmlText, NS, parseXml } from "../core/xml.ts";
import { refName } from "./addr.ts";
import { formulaOf, hasNoValue, hex, numFmtOf, scalarOf, textOf, VT } from "./cells.ts";
import type { Origin, XBook } from "./io.ts";

export type InspectOptions = {
  /** only this sheet */
  sheet?: string;
  /** at most this many cell nodes per sheet (the sheet's `cells` prop says how many there are) */
  maxCells?: number;
};

const T = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/";
const CHART_NS = "http://schemas.openxmlformats.org/drawingml/2006/chart";

/** Excel column width (characters) -> pixels at 100% zoom, Calibri 11. */
export const widthPx = (chars: number): number => Math.round(chars * 7 + 5);
/** Row height (points) -> pixels. */
export const heightPx = (pt: number): number => Math.round((pt * 96) / 72);

export function sheetNodes(book: XBook, origin: Origin | undefined, opts: InspectOptions = {}): OutlineNode[] {
  const out: OutlineNode[] = [];
  const date1904 = !!book.properties?.date1904;
  book.eachSheet((ws) => {
    if (opts.sheet !== undefined && ws.name !== opts.sheet) return;
    out.push(sheetNode(ws, origin, date1904, opts.maxCells));
  });
  return out;
}

function sheetNode(ws: Worksheet, origin: Origin | undefined, date1904: boolean, max?: number): OutlineNode {
  const cells: OutlineNode[] = [];
  let count = 0;
  ws.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (cell.type === VT.Merge || (cell.type === VT.Null && !cell.style?.fill)) return;
      count++;
      if (max === undefined || cells.length < max) cells.push(cellNode(ws.name, cell, date1904));
    });
  });
  const dims = count ? (ws.dimensions as unknown as { range?: string })?.range : undefined;
  const props: Record<string, unknown> = { cells: count };
  if (dims && count) props.dims = dims;
  if (ws.state && ws.state !== "visible") props.hidden = ws.state;
  const widths: number[] = [];
  const lastCol = Math.max(ws.columnCount, (ws as unknown as { _columns?: unknown[] })._columns?.length ?? 0);
  for (let c = 1; c <= lastCol; c++) {
    const col = ws.getColumn(c);
    widths.push(col.hidden ? 0 : widthPx(col.width ?? ws.properties.defaultColWidth ?? 8.43));
  }
  if (widths.length) props.widths = widths;
  const heights: Record<string, number> = {};
  ws.eachRow({ includeEmpty: true }, (row, n) => {
    if (row.hidden) heights[n] = 0;
    else if (row.height) heights[n] = heightPx(row.height);
  });
  if (Object.keys(heights).length) props.heights = heights;
  const merged = Object.values((ws as unknown as { _merges: Record<string, { range: string }> })._merges ?? {}).map((m) => m.range);
  if (merged.length) props.merged = merged.sort();
  const view = ws.views?.[0] as { state?: string; xSplit?: number; ySplit?: number } | undefined;
  if (view?.state === "frozen") props.frozen = { rows: view.ySplit ?? 0, cols: view.xSplit ?? 0 };
  const tables = Object.keys((ws as unknown as { tables?: Record<string, unknown> }).tables ?? {});
  if (tables.length) props.tables = tables;
  if (origin) Object.assign(props, carried(ws, origin));
  return {
    id: refName(ws.name, "A1").replace(/!A1$/, ""),
    type: "sheet",
    name: ws.name,
    anchor: { kind: "cell", sheet: ws.name, range: (count && dims) || "A1" },
    props,
    children: cells,
  };
}

export function cellNode(sheet: string, cell: XCell, date1904: boolean): OutlineNode {
  const props: Record<string, unknown> = {};
  const value = scalarOf(cell, date1904);
  if (value !== null) props.value = value;
  if (value && typeof value === "object") props.error = value.error;
  const f = formulaOf(cell);
  if (f) props.formula = `=${f}`;
  if (hasNoValue(cell)) props.noValue = true;
  const fmt = numFmtOf(cell);
  if (fmt && fmt !== "General") props.numFmt = fmt;
  const font = cell.font ?? {};
  if (font.bold) props.bold = true;
  if (font.italic) props.italic = true;
  const color = hex(font.color?.argb);
  if (color) props.color = color;
  const fill = cell.fill as { type?: string; pattern?: string; fgColor?: { argb?: string } } | undefined;
  const fillHex = fill?.type === "pattern" && fill.pattern === "solid" ? hex(fill.fgColor?.argb) : undefined;
  if (fillHex) props.fill = fillHex;
  const align = cell.alignment?.horizontal;
  if (align === "left" || align === "center" || align === "right") props.align = align;
  if (cell.isMerged && cell.master === cell) {
    const m = Object.values((cell.worksheet as unknown as { _merges: Record<string, { range: string; tl: string }> })._merges).find((x) => x.tl === cell.address);
    if (m) props.merged = m.range;
  }
  return {
    id: refName(sheet, cell.address),
    type: "cell",
    anchor: { kind: "cell", sheet, range: cell.address },
    text: textOf(cell, date1904),
    props,
  };
}

/** What a sheet holds that exceljs does not model, read from the original parts: charts, pivots. */
function carried(ws: Worksheet, origin: Origin): Record<string, unknown> {
  const part = origin.sheetPart.get(ws.id);
  if (!part) return {};
  const out: Record<string, unknown> = {};
  const all = readRels(origin.zip, part);
  const pivots = all.filter((r) => r.type === `${T}pivotTable`).length;
  if (pivots) out.pivots = pivots;
  const drawing = all.find((r) => r.type === `${T}drawing` && !r.external);
  if (drawing) {
    const charts = readRels(origin.zip, drawing.target)
      .filter((r) => r.type === `${T}chart` && !r.external)
      .map((r) => ({ title: chartTitle(origin, r.target), part: r.target }));
    if (charts.length) out.charts = charts;
  }
  return out;
}

function chartTitle(origin: Origin, part: string): string {
  const text = origin.zip.text(part);
  if (!text) return "chart";
  try {
    const doc = parseXml(text, part);
    const title = doc.getElementsByTagNameNS(CHART_NS, "title").item(0);
    return (title && xmlText(title, NS.a)) || "chart";
  } catch {
    return "chart";
  }
}
