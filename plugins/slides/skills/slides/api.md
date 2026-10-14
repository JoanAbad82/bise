# Slides API

Everything a script imports comes from `@bise/office`:

```ts
import { slides, run, diff, OfficeError } from "@bise/office";
```

Units: boxes are `[x, y, w, h]` (or `{ x, y, w, h }`) in points from the
slide's top-left corner; a 16:9 slide is 960 x 540, a 4:3 one 720 x 540.
Text sizes are points. Colors are `"#rrggbb"`.

## Files

| call | does |
|---|---|
| `await run.read(path)` | the file's bytes (`Uint8Array`); a relative path starts at the current folder |
| `await run.write(path, bytes, opts?)` | writes the file, then returns the hub's words: `added q3.pptx (slides) · v4 …`, or `… is not an artifact: written only` |
| `{ artifact: true }` | as `opts`: make a new file an artifact (v1). A file that already is one gets its next version without it |
| `await slides.open(bytes)` | a `Deck`; throws `not_a_zip`, `not_office` |
| `await slides.create({ size? })` | a new deck, `"16:9"` (default) or `"4:3"`, no slide yet |
| `await deck.save()` | the bytes; parts nothing points at any more (old images, charts) are dropped |

## The deck

| call | does |
|---|---|
| `deck.size` | `{ w, h }` in points |
| `deck.count` | how many slides |
| `deck.layouts()` | `[{ key?, name, type }]`: what `addSlide` can use |
| `deck.slide(n)` | slide `n`, from 1 |
| `deck.slides()` | every slide |
| `deck.addSlide({ layout?, at? })` | a new slide with its layout's placeholders, last or at position `at` |
| `deck.at(anchor)` | a slide (`kind: "slide"`) or a shape (`kind: "shape"`) |
| `deck.inspect()` / `deck.check()` | the outline / the problems |

Layout keys of a deck made by `slides.create()`: `title` (title and
subtitle), `title-body` (the default), `two-content`, `section`,
`title-only`, `blank`. On a deck made in PowerPoint the same keys work
when it has a layout of that type; a layout's name (`"Title and
Content"`) or its number also works. Use `deck.layouts()` to see them.

## A slide

| call | does |
|---|---|
| `.index` | its position, from 1 (changes when slides move) |
| `.node` | its outline node |
| `.shapes()` | its shapes (a group's members are in the group's node) |
| `.shape(idOrName)` | `"3"` or `"Title 1"`; `not_found` lists what is there |
| `.placeholder(type)` | `"title"` (also finds a centered title), `"body"` (also a content placeholder), `"subTitle"`, ...; `undefined` when none |
| `.under()` | with a note's `rect`: the shapes in that box, the most covered first |
| `.addText(text, box, style?)` | a text box; `style` takes TextStyle, ShapeLook and `name` |
| `.addShape(geometry, box, opts?)` | `rect`, `roundRect`, `ellipse`, `triangle`, `rightArrow`, `leftArrow`, `upArrow`, `downArrow`, `chevron`, `homePlate`, `diamond`, `hexagon`, `star5`, `line`; `opts`: ShapeLook, `text`, `style`, `name` |
| `.addImage(bytes, box, opts?)` | PNG, JPEG or GIF; a box `[x, y, w]` keeps the image's ratio; `opts.alt`: what it shows, say it |
| `.addTable(rows, box, opts?)` | `rows`: `string[][]`, first row the header; `opts`: `header` (default true), `size` (pt, default 14), `widths` (shares) |
| `.addChart(chart, box, opts?)` | see Charts |
| `.duplicate()` | a copy right after it (charts copied, speaker notes not) |
| `.moveTo(position)` | |
| `.remove()` | |

## A shape

| call | does |
|---|---|
| `.node` | its outline node |
| `.quote` | the quote of the note's anchor, when it had one |
| `.text()` | its text, `\n` between paragraphs |
| `.setText(text, style?)` | the whole text |
| `.replace(find, by)` | every `find`, across runs, each run's style kept; `not_found` when absent |
| `.style(style)` | TextStyle on all its text |
| `.move({ x?, y?, w?, h? })` or `.move(box)` | |
| `.fill(color)` / `.line(color, width?)` | `"none"` removes |
| `.rows()` / `.setCell(row, col, text, style?)` | a table's cells, from 1 |
| `.replaceImage(bytes)` | a picture's image, its box kept |
| `.remove()` | |

Edits return the selection, so they chain:
`slide.addText("Source: finance, Oct 2026", [48, 500, 600, 24]).style({ size: 12, color: "#6e7781" })`.

### Text

`TextInput` is a string (`"\n"` starts a paragraph) or one entry per
paragraph: a string, or `{ text, level?, bullet?, ...TextStyle }`. `level`
is 1 to 9 (2 is a sub-bullet).

`TextStyle`: `{ size?, bold?, italic?, color?, font?, align? }`, `align`
one of `left`, `center`, `right`, `justify`.

`ShapeLook`: `{ fill?, line?, lineWidth?, valign? }`, `valign` one of
`top`, `middle`, `bottom`.

A placeholder's text takes the deck's own fonts and sizes from its layout:
set a style only when you mean to change them.

### Charts

```ts
slide.addChart({
  type: "column",                     // "column" | "bar" | "line" | "pie"
  title: "Revenue by month (k€)",     // optional
  categories: ["Jul", "Aug", "Sep"],
  series: [{ name: "2026", values: [120, 140, 151], color: "#1f6feb" }],
  legend: false,                      // "bottom" (default) | "right" | "top" | false
}, [480, 120, 432, 360]);
```

The chart is a real PowerPoint chart with its data inside ("Edit Data"
works). The SDK makes and replaces charts; it does not edit an existing
chart's series: remove it and add a new one.

## Reading: the outline

```json
{ "kind": "pptx", "nodes": [
  { "id": "s256", "type": "slide", "name": "Title and Content",
    "anchor": { "kind": "slide", "slide": 1 },
    "props": { "index": 1, "w": 960, "h": 540, "layout": "title-body", "background": "#ffffff" },
    "children": [
      { "id": "s256/2", "type": "shape", "name": "Title 1", "text": "Q3 review",
        "anchor": { "kind": "shape", "slide": 1, "shape": "2" },
        "props": { "box": [48, 30, 864, 70], "placeholder": "title", "fontSize": 36, "bold": true,
                   "color": "#1f2328", "font": "Arial", "align": "left" } } ] } ] }
```

- A slide's id `s<n>` stays when slides move; `anchor.slide` is its
  position now. A shape's id is `s<n>/<shape>`; `anchor.shape` is the
  shape's own id in the slide.
- A slide's props: `index`, `w`, `h`, `layout`, `background`, `notes`
  (speaker notes, read only).
- A shape's `type`: `shape`, `picture`, `table`, `chart`, `group`,
  `connector`, `graphic`. Its props when it has them: `box`,
  `placeholder`, `fill`, `line`, `geometry`, `fontSize`, `bold`, `italic`,
  `color`, `font`, `align`, `valign`, `image`, `rows` (a table), `chart`
  (`{ type, title, categories, series }`), `paras` (each paragraph's text,
  `level`, `bullet`), `notDrawn` (SmartArt and others the SDK cannot draw).
- A placeholder's box and style come from its layout and master when the
  slide does not set them: what you read is what PowerPoint shows.

`diff(before, after)` compares two outlines by id:
`{ added, removed, changed: [{ before, after, fields }] }`.

## What the SDK does not do (v1)

- Edit an existing chart's data, SmartArt, animations, transitions.
- Write speaker notes (they are read in `props.notes`, kept on save).
- A second master's own layouts by key (use the layout's name).
