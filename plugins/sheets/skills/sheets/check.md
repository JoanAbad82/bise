# Sheets check

`book.check()` in a script, or `bise office check file.xlsx`, returns a
list of problems: `{ code, severity, at?, message }`. `at` is a cell
anchor: pass it to `book.at(at)` to fix that cell. A long list of the same
code is cut after a few, with a last line `and N more like these`.

`error` and `warning`: fix it, or say in your reply why it stays.
`info`: nothing to fix.

| code | severity | what it means | what to do |
|---|---|---|---|
| `formula_error` | error | a formula's result is an Excel error (`#DIV/0!`, `#REF!`, `#VALUE!`, `#NAME?`, `#N/A`) | read the formula in the message; fix the reference, guard a division with `IF(B2=0, 0, A2/B2)` or `IFERROR(…, "")` when an empty case is normal |
| `no_value` | warning | a formula has no value yet: the SDK cannot compute its function, so the cell is blank in the viewer until Excel opens the file | use a function the SDK computes when one does the job (`SUMIF` for a one-condition `SUMIFS`); else keep it and tell the user the cell fills in when he opens it in Excel |
| `not_recomputed` | warning | cells kept an old value the SDK could not recompute after your edit | the same as `no_value`; say Excel recomputes on open |
| `would_lose` | error | `save()` would drop parts it cannot keep (a chart on a sheet you removed, a pivot whose source moved); the message names the parts | undo the edit that caused it, or ask the user; only with his yes, `save({ drop: ["xl/charts/chart1.xml", ...] })` |
| `broken_rel` | error | a part points at a part that is not in the file (came broken, or a raw edit) | if you used `core` or `book.exceljs`, undo that; if the file came this way, tell the user |
| `bad_xml` | error | a part does not parse | the file came damaged; tell the user, do not save over his copy |

## The checks it does not do

`check()` sees the file, not its sense. Before you say done, look
yourself (`bise office inspect`, or `values()` on the totals):

- a total that does not cover all its rows (`=SUM(B2:B9)` with data to
  B12): read the formula against `props.dims`;
- a number stored as text (`"1200"` in `props.value` with quotes): `set`
  it again as a number;
- a header without its unit, a column of mixed formats;
- a value that disagrees with what the user said in his brief.

## After the save

`bise office check <file>` on the written file must give the same list as
`book.check()` did before the write (or `[]`). If it shows something new,
the save changed more than you meant: inspect and look.
