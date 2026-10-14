# The office SDK (`@bise/office`)

Read, create and edit xlsx, pptx and docx from TypeScript. The plan is
`docs/office-artifacts-plan.md` (on the `office-artifacts` branch); this file
says what is built and how to work on it.

## Where it is

| path | what |
|---|---|
| `office/sdk/src/` | the sources: `core/` (zip, XML, OPC, anchors, outline, diff), `run.ts`, one folder per module (`sheets/`, `slides/`, `docs/`) |
| `office/sdk/src/anchor.gen.ts` | the `Anchor` type, generated from `bise_proto::anchor` (never hand-edited) |
| `office/dist/office.js` | the built bundle, **committed**: one ESM file, no node imports |
| `office/fixtures/` | `tiny.xlsx`, `tiny.pptx`, `tiny.docx`, made by `make.mjs` from our own XML |
| `office/sdk/test/` | the tests, run on the built bundle with `node --test` |
| `tests/office_check.sh` | the gate's check (below) |

## One bundle, three hosts

The SDK is pure: bytes in, bytes out (`Uint8Array`). No `node:` import, no
`fs`, no `require`, no web API it cannot do without (TextEncoder and
TextDecoder are used when the host has them, else its own UTF-8:
`core/utf8.ts`). So the same `office/dist/office.js` runs in:

- `bise office run <script.ts>` (bend-jsrt's script mode: V8 and deno_core,
  no web APIs; it embeds the file with `include_str!`);
- the viewer in the side panel (the pages server serves the same file);
- node, for the tests and for anyone who wants it.

Cargo and nix never run pnpm, so the bundle is committed like generated
code. `build.mjs` builds with esbuild `platform: "neutral"` (a node import
fails the build) and refuses a bundle that still names `require("…")`,
`node:`, `process.env` or `Buffer.from`.

## Working on it

```sh
pnpm -C office/sdk install
pnpm -C office/sdk build        # writes office/dist/office.js: commit it with the sources
pnpm -C office/sdk check        # typecheck + the bundle is fresh + the tests
node office/fixtures/make.mjs   # the fixtures again (same bytes each run)
```

The gate: `tests/office_check.sh` typechecks, rebuilds the bundle in memory
and fails when the committed file differs (stale or hand-edited), then runs
the tests. `gate.sh quick` runs it when a path under `office/` changed
(and `proto_ts` when `anchor.gen.ts` did); `gate.sh full` runs it every
time (`strict`: it installs node_modules from the lockfile).

A new dependency in the bundle: its license file in `packaging/notices/`,
its row in `packaging/third-party-notices.py`'s MANUAL and in
`THIRD_PARTY_NOTICES`, in the same commit.

## The API every module shares

```ts
import { sheets, slides, docs, run, readAnchor, diff } from "@bise/office";
const deck = await slides.open(await run.read("q3.pptx"));
const outline = deck.inspect();        // { kind, nodes: [{ id, type, anchor, name?, text?, props?, children? }] }
const sel = deck.at(note.anchor);      // the node under a note's anchor, and the module's edits on it
const problems = deck.check();         // [{ code, severity, at?, message }]: fix them before saying done
await run.write("q3.pptx", await deck.save());
const changes = diff(before, deck.inspect());   // { added, removed, changed: [{ before, after, fields }] }
```

- `OfficeFile` (`core/outline.ts`) is the interface each module's open file
  implements: `kind`, `inspect()`, `at(anchor)`, `check()`, `save()`; the
  module adds its own edits on the selection.
- Ids are stable across saves: a cell `Sheet!B4`, a shape its
  `p:cNvPr/@id`, a paragraph its `w14:paraId` (made when missing).
- `diff` compares two outlines by id, own fields only (a slide whose shape
  changed is not itself changed).
- Errors are `OfficeError` with a `code` (`core/errors.ts`) and words an
  agent can act on.
- `run.read` / `run.write` go through a host: `bise office run` installs
  its ops; elsewhere `setHost({ read, write })`. No host: `no_host`.
- `checkPackage(zip)` is the check every module starts from: a part that
  is not XML, a relationship to a missing part.
- `core` exports the raw layers (`Zip`, `parseXml`, `writeXml`, `rels`,
  ...) for what no module does yet. A part never touched is written back
  with the same content; an XML edit keeps every attribute and namespace
  it did not touch.

A module whose chunk has not landed yet is a stub that refuses with
`not_built`.

## The docs module (docx)

Our own OOXML layer on the core's zip and XML, for create and edit alike:
`docs.create()` is a blank template written in `docs/create.ts` plus the
same edits as an open file (the `docx` npm package needs node globals and
timers: plan §2, architect m_23763). Sources in `office/sdk/src/docs/`,
one file per concern (`text.ts` runs and spans, `blocks.ts` new blocks,
`comments.ts`, `changes.ts`, `outline.ts`, `check.ts`, `styles.ts`).

```ts
const doc = await docs.open(bytes, { author: "bise" });   // or docs.create({ title, size: "A4" | "letter" })
doc.inspect();                     // paragraphs in order: { id: w14:paraId, type: "para", text, props: { style, level, list, align, images, links } }
const p = doc.at(note.anchor);     // { kind: "para", para, quote? }; a renamed id falls back to the quote
p.replace("4%", "5%", { track: true });   // also setText, insert, format, style, align, remove
p.comment("source?");              // on the anchor's quote, or the whole paragraph
p.add({ kind: "bullet", text: "North up 6%" });   // para | title | heading | bullet | numbered | quote | table | image | pagebreak
doc.table(anchor).addRow(["South", "80"]);        // rows, cell, setCell, addRow, removeRow
doc.comments.reply(id, "done"); doc.comments.resolve(id);
doc.changes.list(); doc.changes.accept(); doc.changes.reject(ids);
doc.tracking = true;               // every edit after it is a tracked change
```

- **The outline**: the body's blocks in document order; a table is a
  `table` node (`table:<its first paragraph's id>`) whose children are its
  paragraphs, row by row (`props.cell`); a paragraph's comments and
  tracked changes are its `comment` and `change` children. Headers,
  footers, footnotes and text boxes are not in it (the viewer counts the
  n-th drawn paragraph on that).
- **Text** is what a paragraph reads with every tracked change accepted:
  insertions in, deletions out, a tab `\t`, a line break `\n`, a page
  break nothing. Offsets and quotes are in that text.
- **Ids**: a paragraph with no `w14:paraId` (or a second one with the
  same) gets one when the file opens: 8 hex digits below 0x80000000, the
  same for the same bytes. They are written when an edit saves the part (a
  save with no edit keeps the bytes); `w14` is then declared and listed in
  `mc:Ignorable`, or Word would call the file corrupt. A renamed duplicate
  is in check() as `para_id_renamed` (info): a note on the old id finds
  its paragraph by its quote.
- **Edits keep the rest**: a span edit splits the runs at its ends, so the
  format around it stays; the new text takes the replaced run's format.
  Styles (Title, Heading1-6, ListParagraph, Quote, TableGrid, Hyperlink),
  list definitions, comments parts and their content types and
  relationships are added only when an edit needs them.
- **check()**: the package's problems, then `dangling_comment` (error),
  `orphan_comment`, `missing_style`, `missing_list`, `heading_skip`,
  `empty_heading`, `placeholder` (TODO, TBD, lorem ipsum, `[insert …]`),
  `table_shape`, `open_changes`, `empty` (warnings).
- **The off-screen check**: `office/sdk/test/docs-ql.sh` (under
  `heavy-run --low`, macOS) saves a created and an edited docx, checks
  them, and has Quick Look render each to a thumbnail (`qlmanage -t`, no
  window).

## Anchors

Where a note sits, one type for every artifact: `bise_proto::anchor::Anchor`
(`rust/proto/src/anchor.rs`), an object tagged `kind`:

| kind | fields | on |
|---|---|---|
| `block` | `block`, `quote?` | a page, an html artifact |
| `cell` | `sheet`, `range` (`B4`, `B4:D9`) | xlsx |
| `slide` | `slide`, `rect?` | pptx |
| `shape` | `slide`, `shape`, `quote?` | pptx |
| `para` | `para`, `quote?` | docx |
| `region` | `page?`, `rect` | an image, a pdf |
| `text` | `line`, `quote?` | any text file |

Slides, pages and lines count from 1; a `rect` is `{x, y, w, h}` in % of
its frame. Wire rules: fields are only added; Rust reads a kind it does
not know (or a known one with bad fields) as `Unknown` with the whole
object and writes it back unchanged; `fixtures/released/anchor_v1.jsonl`
is the first version, frozen (`tests/released.rs`).

The TS comes from `rust/proto/tests/ts.rs`, written twice from one render:
`apps/desktop/src/proto/anchor.ts` and `office/sdk/src/anchor.gen.ts`, with
`ANCHOR_KINDS` from `Anchor::KINDS` (no list of kinds typed by hand, in TS
or in `kit/`). After a change to `anchor.rs`:

```sh
BISE_PROTO_BLESS=1 cargo test -p bise-proto --features ts --test ts
pnpm -C office/sdk build
```

The SDK's `readAnchor(v)` refuses an unknown kind (`anchor_kind`) or a bad
field (`anchor_shape`) with words, never guesses; `anchorFor(fileKind, v)`
also refuses another file type's anchor (`anchor_kind_mismatch`).
