---
name: sheets
description: Make, read or edit an Excel workbook (.xlsx) - a table of numbers, a budget, a tracker, a model with formulas - with a TypeScript script run by `bise office run`. Use when the user asks for a spreadsheet or an xlsx, sends one, or leaves notes on an xlsx artifact.
---

# Sheets (xlsx)

You write a short TypeScript script against `@bise/office` and run it with
`bise office run`. The script reads and writes the file; you never unzip
or hand-edit XML. Each write of a file that is an artifact is its next
version, and the user sees it in the side panel.

## Quick start

```sh
bise office inspect q3.xlsx     # the outline as JSON: sheets, cells with ids
bise office check q3.xlsx       # the problems as JSON ([] when none)
bise office run "$TMPDIR/edit.ts"
```

```ts
// $TMPDIR/edit.ts: an ES module, top-level await, no other import
import { sheets, run } from "@bise/office";

const book = await sheets.open(await run.read("q3.xlsx"));
book.range("Q3!B4").set(1300);
book.range("Q3!B6").set("=SUM(B2:B5)");
book.range("Q3!A1:D1").style({ bold: true, fill: "#f2f2f2" });
console.log(JSON.stringify(book.check()));
console.log(await run.write("q3.xlsx", await book.save()));
```

A new workbook: `sheets.create({ sheet: "Q3", rows: [[...], ...] })`, and
the first write with `{ artifact: true }` so it shows in the panel.

The script runs in a closed box: `run.read` and `run.write` reach your
worktree and `$TMPDIR` only (a file elsewhere: `cp` it into `$TMPDIR`
first), files up to 50 MB, 5 minutes, no network, no timers, no `fs`,
no `process`. `console.log` prints a line. Keep scripts in `$TMPDIR`, not
in the repo.

## The loop

1. **Inspect.** `bise office inspect <file>`, or `book.inspect()` in the
   script. Every node has an `id` (`Q3`, `Q3!B4`) and an `anchor`. Read the
   real sheet names, the used range (`props.dims`), which cells hold
   formulas (`props.formula`) and number formats before you change any.
2. **Edit by id.** `book.range("Q3!B4:D9")` or `book.at(anchor)`: `set`,
   `formula`, `style`, `merge`, `width`, `height`, `note`, `clear`; sheets:
   `addSheet`, `renameSheet`, `moveSheet`, `removeSheet`. Write numbers
   as numbers and totals as formulas, never as typed results.
3. **Save.** `await run.write(path, await book.save())`. Write back to the
   same path: that path is the artifact, and the write is its next version.
   What `run.write` returns is the hub's answer: print it.
4. **Check.** `book.check()` before the write, `bise office check` after.
5. **Fix** each `error` and `warning`, or say in your reply why one stays.
   Only `info` may stay without a word.

Done means: saved, checked, and the problems fixed or named.

## Notes and selections from the user

He can point at cells in the viewer. Two shapes reach you:

- a message `you sent N notes on "q3.xlsx" (artifact <id> vN, ...)` with an
  `<artifact-notes artifact="<id>" version="N">[...]</artifact-notes>`
  block: a JSON list of `{id, anchor, text}`;
- an `<artifact-selection artifact="<id>" version="N">` block inside his
  own message: the first line is an anchor's JSON, the lines after are
  what he saw selected.

An anchor here is `{"kind": "cell", "sheet": "Q3", "range": "B4:D9"}`.
Pass it as it is: `book.at(anchor)` gives the range and its edits. Do
each note, save once to the artifact's path (`sb artifact list` shows it),
then reply in one or two lines per note: what you changed, or why not.
The new version marks the notes done. `at()` throws `not_found` when the
sheet is gone or renamed: inspect, find the cells by their text, and say
so. An anchor of another kind (a slide, a paragraph): not this file.

## Errors

The SDK throws `OfficeError` with a `code` and words that say what to do:
`not_found`, `bad_arg` (the message shows the shape it takes),
`would_lose` (below), `anchor_kind_mismatch`. A refused path names the
folders you may use.

`would_lose`: the workbook has parts the SDK carries but cannot keep after
your edit (a chart on a deleted sheet, a pivot whose sheet changed).
`check()` names them. Do not pass `save({ drop: [...] })` on your own:
ask the user first, he may need that chart.

## Read next

- `api.md`: every call, its arguments, the outline's fields.
- `recipes.md`: a table from data, totals, a new summary sheet, a CSV in,
  formats, notes on cells, answering notes.
- `style.md`: how a sheet should look and read.
- `check.md`: each problem code, what it means, how to fix it.
