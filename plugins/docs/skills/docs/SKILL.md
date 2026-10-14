---
name: docs
description: Make, read or edit a Word document (.docx) - a memo, a report, a contract, a letter - with comments, replies and tracked changes, through a TypeScript script run by `bise office run`. Use when the user asks for a Word doc or a docx, sends one to edit or review, or leaves notes on a docx artifact.
---

# Docs (docx)

You write a short TypeScript script against `@bise/office` and run it with
`bise office run`. The script reads and writes the document; you never
unzip or hand-edit XML. Each write of a file that is an artifact is its
next version, and the user sees it in the side panel.

## Quick start

```sh
bise office inspect memo.docx    # the outline as JSON: paragraphs in order, with ids
bise office check memo.docx      # the problems as JSON ([] when none)
bise office run "$TMPDIR/memo.ts"
```

```ts
// $TMPDIR/memo.ts: an ES module, top-level await, no other import
import { docs, run } from "@bise/office";

const doc = await docs.create({ title: "Q3 memo" });
doc.add({ kind: "title", text: "Q3: revenue up 4%" });
doc.add({ kind: "para", text: "North carried the quarter; South was flat." });
doc.add({ kind: "heading", text: "What we do next", level: 1 });
doc.add({ kind: "bullet", text: "Renewal plan for the three November accounts" });
console.log(JSON.stringify(doc.check()));
console.log(await run.write("q3-memo.docx", await doc.save(), { artifact: true }));
```

`{ artifact: true }` on the first write of a new file, so it shows in the
panel; later writes to the same path are its next versions without it.

The script runs in a closed box: `run.read` and `run.write` reach your
worktree and `$TMPDIR` only (a file elsewhere: `cp` it into `$TMPDIR`
first), files up to 50 MB, 5 minutes, no network, no timers, no `fs`,
no `process`. `console.log` prints a line. Keep scripts in `$TMPDIR`, not
in the repo.

## The loop

1. **Inspect.** `bise office inspect <file>`, `doc.inspect()`, or
   `doc.text()` for the plain text. Each paragraph has an `id` (8 hex
   digits, Word's own paragraph id) and an `anchor`; `props.style` says
   Title, Heading1, ListParagraph...; a table is a `table` node with its
   cells' paragraphs as children. `doc.find("4%")` gives the anchors of a
   phrase.
2. **Edit by id.** `doc.at(anchor)` (or `doc.at({ kind: "para", para: id })`):
   `setText`, `replace`, `insert`, `format`, `style`, `align`, `comment`,
   `add` (a block after it), `remove`. Tables: `doc.table(anchor)`. Edits
   keep the format of the text around them.
3. **Save.** `await run.write(path, await doc.save())`, to the same path:
   that path is the artifact. Print what `run.write` returns.
4. **Check.** `doc.check()` before the write, `bise office check` after.
5. **Fix** each `error` and `warning`: a TODO left in, a skipped heading
   level, a tracked change left open, a table with a short row. Or say in
   your reply why one stays.

Done means: saved, checked, the problems fixed or named.

## Edit his document: track it

A document someone else wrote: make your edits tracked changes, so he
sees each one in Word and accepts or rejects it. `doc.tracking = true`
after opening, or `{ track: true }` on one edit. Set `docs.open(bytes,
{ author: "bise" })` so the changes say who made them. A document you made
for him from scratch: no tracking. Comments, replies, resolving, and
accepting changes: `comments.md`.

## Notes and selections from the user

He can point at a paragraph or words in it in the viewer. Two shapes
reach you:

- a message `you sent N notes on "memo.docx" (artifact <id> vN, ...)` with
  an `<artifact-notes artifact="<id>" version="N">[...]</artifact-notes>`
  block: a JSON list of `{id, anchor, text}`;
- an `<artifact-selection artifact="<id>" version="N">` block inside his
  own message: the first line is an anchor's JSON, the lines after are
  what he saw selected.

An anchor here is `{"kind": "para", "para": "3F2A1B0C", "quote": "up 4%"}`.
Pass it as it is: `doc.at(anchor)` gives the paragraph, and `.quote` where
his words are in it; `format`, `comment` and `replace` work on that quote.
If Word renamed the paragraph's id, `at()` finds it by its quote. Do each
note, save once to the artifact's path (`sb artifact list` shows it), then
reply one or two lines per note: what you changed, or why not. The new
version marks the notes done. `at()` throws `not_found` when the
paragraph and its quote are both gone: say so.

## Errors

The SDK throws `OfficeError` with a `code` and words that say what to do:
`not_found`, `bad_arg` (it shows the shape it takes),
`anchor_kind_mismatch`. A refused path names the folders you may use.

## Read next

- `api.md`: every call, its arguments, the outline's fields.
- `recipes.md`: a memo from a brief, a table, edit his doc with tracked
  changes, answer notes, replace a term everywhere.
- `comments.md`: comments, replies, resolve; tracked changes, accept and
  reject; reviewing a document.
- `style.md`: how a document should read and look.
- `check.md`: each problem code, what it means, how to fix it.
