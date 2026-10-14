# Sheets API

Everything a script imports comes from `@bise/office`:

```ts
import { sheets, run, diff, readAnchor, OfficeError } from "@bise/office";
```

## Files

| call | does |
|---|---|
| `await run.read(path)` | the file's bytes (`Uint8Array`); a relative path starts at the current folder |
| `await run.write(path, bytes, opts?)` | writes the file, then returns the hub's words: `added q3.xlsx (sheet) · v4 …`, or `… is not an artifact: written only` |
| `{ artifact: true }` | as `opts`: make a new file an artifact (v1). A file that already is one gets its next version without it |
| `await sheets.open(bytes)` | a `Book`; throws `not_a_zip`, `not_office` (a pptx or docx: the message says which module) |
| `await sheets.create({ sheet?, rows?, date? })` | a new book with one sheet (default `Sheet1`), filled from A1 with `rows` |
| `await book.save(opts?)` | the bytes. An unchanged book gives its own bytes back. `opts.drop`: see `would_lose` in `check.md` |

## Ranges

`book.range(ref)` and `book.at(anchor)` return the same selection.

- `ref`: `"Q3!B4"`, `"Q3!B4:D9"`, `"'My sheet'!A1"` (quotes around a name
  with spaces). A bare `"B4"` is on the first sheet: name the sheet.
- `anchor`: `{ kind: "cell", sheet: "Q3", range: "B4:D9" }`, from a note,
  a selection or an outline node.

| on a range | does |
|---|---|
| `.ref` | `"Q3!B4:D9"` |
| `.node` | its outline node (cells as children) |
| `.values()` | values row by row; a formula's is its result (`null` until `save()` or `book.recalc()` computes it) |
| `.set(v)` | one value for every cell, a row array, or a 2D array from the top-left corner |
| `.formula("=…")` | the same formula in every cell (references are not shifted) |
| `.style(s)` | see Style below |
| `.merge()` / `.unmerge()` | |
| `.width(chars)` | the columns' width in characters (Excel's unit; 8.43 is the default) |
| `.height(points)` | the rows' height |
| `.note(text \| null)` | an Excel note on the top-left cell; `null` removes it |
| `.clear()` | values, formulas and styles out |

Each edit returns the range, so calls chain:
`book.range("Q3!A1:D1").set(["Region", "Q1", "Q2", "Q3"]).style({ bold: true })`.

What `set` takes per cell: a number, a string, a boolean, a `Date`, `null`
(empty), `"=SUM(B2:B5)"` or `{ formula: "SUM(B2:B5)" }`, `{ error: "#N/A" }`.
A string that starts with `=` is always a formula: a label that must
start with `=` cannot be written with `set`.

### Style

```ts
{
  bold?, italic?, underline?: boolean,
  size?: number,            // points
  font?: string,
  color?: "#rrggbb",        // text
  fill?: "#rrggbb" | null,  // background; null removes it
  align?: "left" | "center" | "right",
  valign?: "top" | "middle" | "bottom",
  wrap?: boolean,
  numFmt?: string,          // "#,##0", "0.0%", "yyyy-mm-dd", '"$"#,##0.00', '#,##0;(#,##0)'
  border?: "thin" | "medium" | "thick" | "none",   // every side of every cell
}
```

Colors are `#rrggbb` only: `"red"` is refused with `bad_arg`.

## Sheets

| call | does |
|---|---|
| `book.sheetNames` | names in tab order |
| `book.addSheet(name, { rows?, index? })` | a new sheet (last, or at `index` from 0), filled from A1; returns its used range |
| `book.renameSheet(from, to)` | formulas that name it follow |
| `book.moveSheet(name, index)` | |
| `book.removeSheet(name)` | what hangs on it that the SDK cannot keep makes `save()` refuse (`would_lose`) |

## Formulas

`save()` computes every formula it can, and `book.recalc()` does it on
demand: `{ computed, unsupported: [{ ref, why }] }`. Computed: arithmetic,
`&`, comparisons, references across sheets, and SUM, AVERAGE, MIN, MAX,
MEDIAN, COUNT, COUNTA, COUNTBLANK, COUNTIF, SUMIF, AVERAGEIF, IF, IFERROR,
AND, OR, NOT, ROUND, ROUNDUP, ROUNDDOWN, INT, ABS, SQRT, POWER, MOD,
PRODUCT, CONCAT, CONCATENATE, LEN, LEFT, RIGHT, MID, UPPER, LOWER, TRIM.

Any other function (VLOOKUP, XLOOKUP, SUMIFS, INDEX, dates...) is kept
as written and Excel computes it when the file opens (an edited file is
saved with "recalculate on open"). Until then its cell is blank in the
viewer: `check()` says `no_value`. Prefer the functions above when one
does the job, so the user sees numbers in the panel.

## Reading: the outline

`book.inspect({ sheet?, maxCells? })`, or `bise office inspect file.xlsx`:

```json
{ "kind": "xlsx", "nodes": [
  { "id": "Q3", "type": "sheet", "name": "Q3",
    "anchor": { "kind": "cell", "sheet": "Q3", "range": "A1:D9" },
    "props": { "dims": "A1:D9", "cells": 36, "widths": [145, 64], "heights": { "1": 24 },
               "merged": ["A1:D1"], "frozen": { "rows": 1 }, "tables": [], "charts": [], "pivots": [] },
    "children": [
      { "id": "Q3!B4", "type": "cell", "text": "1,300",
        "anchor": { "kind": "cell", "sheet": "Q3", "range": "B4" },
        "props": { "value": 1300, "numFmt": "#,##0", "bold": true } },
      { "id": "Q3!B6", "type": "cell", "text": "4,200",
        "props": { "value": 4200, "formula": "=SUM(B2:B5)" } } ] } ] }
```

- `text` is what Excel shows (the number format applied); `props.value` is
  the raw value.
- A cell's props, when set: `value`, `formula`, `noValue` (a formula never
  computed), `error`, `numFmt`, `bold`, `italic`, `color`, `fill`,
  `align`, `merged`.
- A sheet's props: `dims`, `cells`, `widths` (px, from column A),
  `heights` (px, by row), `merged`, `frozen`, `tables`, `charts`
  (`{ title, part }`), `pivots`, `hidden`.
- Empty cells are not in the outline. A big sheet: pass `maxCells`, or
  `sheet` to read one sheet.

`diff(before, after)` compares two outlines by id:
`{ added, removed, changed: [{ before, after, fields }] }`. Use it to say
what changed in a version.

## What the SDK does not do (v1)

- Edit a chart or a pivot table: they are kept through every save, never
  changed. Say so if the user asks; offer a new sheet with the numbers.
- Array formulas, and functions outside the list above (Excel computes
  them on open).
- A sheet password (`book.exceljs` is there for what the API lacks, but
  any use of it counts as an edit; prefer the API).
