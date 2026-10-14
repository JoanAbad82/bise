---
name: slides
description: Make, read or edit a PowerPoint deck (.pptx) - a review, a pitch, a status deck, slides with tables and charts - with a TypeScript script run by `bise office run`. Use when the user asks for slides, a deck or a pptx, sends one, or leaves notes on a pptx artifact.
---

# Slides (pptx)

You write a short TypeScript script against `@bise/office` and run it with
`bise office run`. The script reads and writes the deck; you never unzip
or hand-edit XML. Each write of a file that is an artifact is its next
version, and the user sees it in the side panel.

## Quick start

```sh
bise office inspect q3.pptx     # the outline as JSON: slides, shapes with ids, boxes, text
bise office check q3.pptx       # the problems as JSON ([] when none)
bise office run "$TMPDIR/deck.ts"
```

```ts
// $TMPDIR/deck.ts: an ES module, top-level await, no other import
import { slides, run } from "@bise/office";

const deck = await slides.create();                       // 16:9, 960 x 540 pt
const s = deck.addSlide({ layout: "title-body" });
s.placeholder("title")!.setText("Q3: revenue up 4%");
s.placeholder("body")!.setText(["North carried the quarter", "South flat", "West back to growth"]);
console.log(JSON.stringify(deck.check()));
console.log(await run.write("q3.pptx", await deck.save(), { artifact: true }));
```

`{ artifact: true }` on the first write of a new file, so it shows in the
panel; later writes to the same path are its next versions without it.

The script runs in a closed box: `run.read` and `run.write` reach your
worktree and `$TMPDIR` only (a file elsewhere: `cp` it into `$TMPDIR`
first), files up to 50 MB, 5 minutes, no network, no timers, no `fs`,
no `process`. `console.log` prints a line. Keep scripts in `$TMPDIR`, not
in the repo. An image goes in with `run.read("chart.png")`.

## The loop

1. **Inspect.** `bise office inspect <file>`, or `deck.inspect()`. A slide
   is `s<n>` with `props.index`, `layout`, `w`, `h`; a shape is
   `s<n>/<id>` with `props.box` `[x, y, w, h]` in points, its text, its
   placeholder type, font size, fill. Read the deck's layouts
   (`deck.layouts()`), sizes and fonts before you add to it.
2. **Edit by id.** `deck.slide(n)`, `slide.shape("3")` or by name,
   `slide.placeholder("title")`, or `deck.at(anchor)`. On a shape:
   `setText`, `replace`, `style`, `move`, `fill`, `line`, `setCell`,
   `replaceImage`, `remove`. On a slide: `addText`, `addShape`, `addImage`,
   `addTable`, `addChart`, `duplicate`, `moveTo`, `remove`.
3. **Save.** `await run.write(path, await deck.save())`, to the same path:
   that path is the artifact. Print what `run.write` returns.
4. **Check.** `deck.check()` before the write, `bise office check` after.
5. **Fix** each `error` and `warning`: text that overflows its box, a shape
   off the slide, an empty placeholder, text under 10 pt, shapes whose
   text overlaps. Or say in your reply why one stays.

Done means: saved, checked, the problems fixed or named, and the deck
reads well (`style.md`).

## Notes and selections from the user

He can point at a slide, a shape, or a box he drew on a slide. Two shapes
reach you:

- a message `you sent N notes on "q3.pptx" (artifact <id> vN, ...)` with an
  `<artifact-notes artifact="<id>" version="N">[...]</artifact-notes>`
  block: a JSON list of `{id, anchor, text}`;
- an `<artifact-selection artifact="<id>" version="N">` block inside his
  own message: the first line is an anchor's JSON, the lines after are
  what he saw selected.

Anchors here: `{"kind": "shape", "slide": 2, "shape": "12", "quote": "up 4%"}`
(a shape, `quote` the words he selected in it) or
`{"kind": "slide", "slide": 5, "rect": {"x": 10, "y": 40, "w": 30, "h": 20}}`
(a slide, `rect` in % of it when he drew a box). Pass it as it is:
`deck.at(anchor)` gives the shape or the slide; on a slide with a rect,
`.under()` lists the shapes in that box. Do each note, save once to the
artifact's path (`sb artifact list` shows it), then reply one or two lines
per note: what you changed, or why not. The new version marks the notes
done. `at()` throws `not_found` when the shape is gone: inspect, find it
by its text (the quote), and say so.

## Errors

The SDK throws `OfficeError` with a `code` and words that say what to do:
`not_found` (it lists what is there), `bad_arg` (it shows the shape it
takes), `anchor_kind_mismatch`. A refused path names the folders you may
use.

## Read next

- `api.md`: every call, its arguments, the outline's fields.
- `recipes.md`: a deck from a brief, a chart slide, a table slide, edit
  his deck, answer notes, split a dense slide.
- `style.md`: how a deck should look and read.
- `check.md`: each problem code, what it means, how to fix it.
