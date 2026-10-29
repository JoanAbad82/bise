# Docs API

Everything a script imports comes from `@bise/office`:

```ts
import { docs, run, diff, OfficeError } from "@bise/office";
```

## Files

| call | does |
|---|---|
| `await run.read(path)` | the file's bytes (`Uint8Array`); a relative path starts at the current folder |
| `await run.write(path, bytes, opts?)` | writes the file, then returns the hub's words: `added memo.docx (doc) · v4 …`, or `… is not an artifact: written only` |
| `{ artifact: true }` | as `opts`: make a new file an artifact (v1). A file that already is one gets its next version without it |
| `await docs.open(bytes, { author? })` | a `Doc`; `author` (default `"bise"`) signs your tracked changes and comments; throws `not_a_zip`, `not_office` |
| `await docs.create({ title?, size?, author? })` | a new, empty document; `size` `"A4"` (default) or `"letter"` |
| `await doc.save()` | the bytes. A document opened and saved with no edit keeps its bytes |

## The document

| call | does |
|---|---|
| `doc.inspect()` / `doc.check()` | the outline / the problems |
| `doc.text()` | the whole text, one paragraph per line (table cells too) |
| `doc.find(text \| RegExp)` | an anchor with its quote for each place it appears |
| `doc.at(anchor)` | the paragraph; by its id, else (an id Word renamed) the first with the anchor's quote |
| `doc.add(block, where?, opts?)` | a new block at the end, or `{ after: anchor }` / `{ before: anchor }` |
| `doc.replaceAll(find, by, opts?)` | in every paragraph; returns how many |
| `doc.table(anchor)` | the table that holds the anchor's paragraph (a table node's anchor works) |
| `doc.tracking` | `true`: every edit after it is a tracked change unless it says `track: false` |
| `doc.author` | who changes and comments are by |
| `doc.comments` / `doc.changes` | see `comments.md` |

Every edit takes `opts = { track?: boolean }` (default: `doc.tracking`).

## A paragraph: `doc.at(anchor)`

| on it | does |
|---|---|
| `.node` | its outline node |
| `.text` | its text now (tracked insertions in, deletions out) |
| `.quote` | `{ start, end, text }`: where the anchor's quote is, when it had one and it is still there |
| `.setText(text, opts?)` | the whole text; the first run's format is kept |
| `.replace(find, by, opts?)` | each match (a string, or a RegExp with `$1` in `by`); `opts.all` for every match; returns how many. The new text takes the replaced text's format |
| `.insert(text, at?, opts?)` | at `"start"`, `"end"` (default) or an offset in `.text` |
| `.format(f, opts?)` | the anchor's quote, `opts.quote`, or the whole paragraph |
| `.style(id)` | `"Heading2"`, `"Quote"`, `"Normal"`...; Title, Heading1-6, ListParagraph, Quote are added to the file when missing |
| `.align(a)` | `left`, `center`, `right`, `justify` |
| `.comment(text, { quote? })` | on the anchor's quote, a given quote, or the whole paragraph; returns the comment |
| `.add(block, "after" \| "before", opts?)` | a new block next to it; returns its selection |
| `.remove(opts?)` | the paragraph (tracked: marked deleted) |
| `.table()` | the table it is in, or `undefined` |

`RunFormat` (for `format`, and in runs): `{ bold?, italic?, underline?,
strike?, color?: "#C00000", highlight?: "yellow" | "green" | "cyan" | ...,
size?: points, font?, style?: "Hyperlink" | "Strong" | ..., code? }`.

## Blocks: what `add` takes

```ts
{ kind: "para", text?, style?, align? }
{ kind: "title", text }
{ kind: "heading", text, level?: 1..6 }       // default 1
{ kind: "bullet", text, level? }              // level 1 is the first
{ kind: "numbered", text, level? }
{ kind: "quote", text }
{ kind: "table", rows: Inline[][], header?: boolean, widths?: number[] }
{ kind: "image", bytes, width?: points, alt? }   // PNG, JPEG or GIF
{ kind: "pagebreak" }
```

`text` (an `Inline`) is a string, or runs:
`[{ text: "Revenue rose " }, { text: "4%", bold: true }, { text: "on Q2", link: "https://…" }]`.
A run takes every `RunFormat` field and `link`.

## A table: `doc.table(anchor)`

| on it | does |
|---|---|
| `.node` | its outline node |
| `.rows` | each cell's text, row by row |
| `.cell(row, col)` | the cell's paragraph, as `at()` gives it (from 1) |
| `.setCell(row, col, text, opts?)` | |
| `.addRow(values, { after?, track? })` | after row `after` (default: the last; 0: first) |
| `.removeRow(row, opts?)` | |

## Reading: the outline

```json
{ "kind": "docx", "nodes": [
  { "id": "14B86A73", "type": "para", "text": "Q3 memo",
    "anchor": { "kind": "para", "para": "14B86A73" }, "props": { "style": "Title", "level": 0 } },
  { "id": "6181C2BA", "type": "para", "text": "Revenue", "props": { "style": "Heading1", "level": 1 } },
  { "id": "03AD9EFC", "type": "para", "text": "North +9%",
    "props": { "style": "ListParagraph", "list": { "level": 1, "ordered": false } } },
  { "id": "table:09E06C37", "type": "table", "anchor": { "kind": "para", "para": "09E06C37" },
    "props": { "rows": 2, "cols": 2, "style": "TableGrid" },
    "children": [ { "id": "09E06C37", "type": "para", "text": "Region", "props": { "cell": { "row": 1, "col": 1 } } } ] } ] }
```

- The body's blocks in document order. A paragraph's props, when set:
  `style`, `level` (0 for a title, 1-6 for a heading), `list`, `align`,
  `images`, `links`. Its comments and tracked changes are its `comment`
  and `change` children.
- `text` is the text with every tracked change accepted. Offsets and
  quotes are in that text. A tab is `\t`, a line break `\n`.
- Ids stay across saves. A paragraph Word never gave an id gets one when
  the file opens (the same each time for the same file).
- Headers, footers, footnotes and text boxes are not in the outline and
  the SDK does not edit them.

`diff(before, after)` compares two outlines by id:
`{ added, removed, changed: [{ before, after, fields }] }`.

## What the SDK does not do (v1)

- Headers, footers, footnotes, text boxes, fields (a table of contents is
  kept, not updated: Word updates it).
- Section layout (margins, columns, orientation) beyond the page size of
  `create`.
