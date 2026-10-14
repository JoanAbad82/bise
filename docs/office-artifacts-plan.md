# Office artifacts: xlsx, pptx, docx as first-class artifacts

Status: signed by architect (m_23701) with the changes folded into §8 and
§9; the design questions (§10) wait for Gabriel on designer's page. Lead:
task `office-lead`.
Branch: `office-artifacts` (Gabriel tries it before it reaches main).

Gabriel's ask, in three parts:

1. three plugins (slides, sheets, docs), each with skills that teach any
   agent a TypeScript SDK to read, create and edit the files;
2. in the app: add these files as artifacts, and open them in the side
   panel with a built-in viewer, like the other artifacts;
3. for **any** artifact: highlight a part, comment on it, and let an agent
   make continuous edits while the side panel stays open (the viewer
   follows each new version).

## 1. What Codex does (read 2026-09, Codex app 26.930.11008)

Where: `~/.codex/plugins/cache/openai-primary-runtime/{presentations,
spreadsheets,documents,pdf,template-creator}` (bundled in the app), the
runtime in `~/.cache/codex-runtimes/codex-primary-runtime/dependencies/`
(its own `node`, `python`, `node_modules`), and `codex-rs/core-plugins/src/
artifact_operation.rs` in `~/lab/codex`.

- **One plugin per file type**, each a `.codex-plugin/plugin.json` +
  `skills/<name>/SKILL.md` with many reference files: API docs
  (`artifact_tool_docs/API_QUICK_START.md`, `api/*.spec.md`), style and
  writing guidance (an anti-"slop" table for slide copy, workbook structure
  rules for sheets), template-following workflows, and helper scripts
  (`container_tools/*.mjs|py`: render, layout-geometry and integrity gates).
- **The SDK is `@oai/artifact-tool`** (v2.8.84, 42 MB of `dist` + skia-canvas,
  a WASM EMF decoder): `Presentation.create()`, `slide.shapes.add()`,
  `slide.charts.add()`, `PresentationFile.importPptx/exportPptx`,
  `presentation.inspect({kind})` (an NDJSON outline with object ids),
  `presentation.resolve(id)`, `slide.export({format: "png" | "layout"})`,
  and the same shape for workbooks (`workbook.help("…")`). Agents write one
  `.mjs` builder, run it with the bundled node, look at the PNGs, iterate.
  **Its licence is proprietary** ("internal evaluation and testing only",
  no redistribution, no reverse engineering): we cannot ship it, copy it, or
  study its internals. The skills' texts are "All rights reserved" too: we
  write our own.
- **Docx is different**: no artifact-tool for Word. The skill uses the `docx`
  npm package (MIT) to create, Python OOXML scripts to edit (comments,
  tracked changes, fields), and LibreOffice (`soffice`) to render pages to
  PNG for a "render → look → fix" loop that the skill makes mandatory.
- **The runtime is bundled** and found through a `load_workspace_dependencies`
  tool: agents never use the system node or python. The runtime also has
  `docx` 9.6, `pptxgenjs` 4.0, `jszip`, `pdf-lib`, `pdfjs-dist` (all open).
- **The host knows the operation**: before the first write, the skill runs
  `mark_artifact_operation_started.mjs --operation-kind create|edit
  --output-format pptx`; codex-rs recognises that script by plugin and
  path (analytics, and the app shows a "making a deck" state).
- **Viewers in the app**: `docx-preview` (Apache-2.0) for Word, `react-pdf`
  / pdf.js for PDF (from `THIRD_PARTY_NOTICES.txt`); decks and sheets are
  shown through the PNG renders.
- **Live Excel**: a second skill, `excel-live-control`, drives an open
  Excel through an Office.js add-in. Out of scope for us.

What we take: one plugin per type, a skill that is a short quick start +
reference files, an `inspect` that returns object ids the agent then edits
by id, one builder script per job, and a check loop. What we do not take:
a private SDK, a bundled node, PNG-only previews.

## 2. The SDK: `@bise/office`, our own TypeScript, on open libraries

One package, three modules (`sheets`, `slides`, `docs`) and a small shared
core. Pure: bytes in, bytes out (`Uint8Array`), no `node:` imports, so the
same bundle runs in three places: the agent's scripts, the viewer in the
side panel, and the unit tests.

| part | library | licence | why |
|---|---|---|---|
| zip | `fflate` | MIT | small, sync and async, no node |
| XML | `@xmldom/xmldom` | MIT | DOM-level edits that keep unknown parts |
| xlsx read/write/edit | `exceljs` 4.4 | MIT | keeps styles, formulas, tables, merged cells on a round trip; SheetJS CE (Apache-2.0) writes no styles, Pro is paid |
| formula values | `@formulajs/formulajs` + our evaluator, or none in v1 | MIT | ExcelJS writes formulas without values (see risks) |
| pptx create | `pptxgenjs` 4.0 | MIT | charts, tables, images, masters |
| pptx read/edit | ours, on fflate + xmldom | — | no open JS library edits an existing deck |
| docx create | ours: a template + the edit layer (architect m_23763) | — | `docx` 9.10 needs node globals and timers, which `bise office run` does not give; `exceljs` and `pptxgenjs` must prove a save with neither before their modules start, else the same answer (our OOXML) or a timers shim office-run proposes |
| docx read/edit | ours, on fflate + xmldom | — | `docx` cannot read; `mammoth` (BSD-2) reads to HTML only |
| docx view | `docx-preview` 0.4 | Apache-2.0 | what the Codex app uses |

Every licence fits bise's Apache-2.0; `THIRD_PARTY_NOTICES` gets the rows.

The API, one shape for the three (the agent learns it once):

```ts
import { sheets, slides, docs, run } from "@bise/office";
const deck = await slides.open(await run.read("q3.pptx"));   // or slides.create({ size: "16:9" })
const outline = deck.inspect();          // slides, shapes, text, tables, charts, each with a stable id
deck.at({ slide: 3, shape: "sp12" }).text.replace("Q2", "Q3");
deck.slides.add({ layout: "title-body" }).shapes.add({ kind: "text", box: [72, 48, 1136, 80], text: "Revenue" });
await run.write("q3.pptx", await deck.save());                // the next version of the artifact
```

- `inspect()` gives an outline with ids (cells `Sheet!B4`, slide shape ids
  from `p:cNvPr/@id`, docx paragraph ids `w14:paraId`, made when missing):
  the agent edits by id, never by guessing.
- `at(anchor)`: the same anchors the user's notes carry (§5), so "this note
  is on B4:D9 of Q3" is one call.
- `check()`: the problems an agent must fix before it says done: text that
  overflows its box, shapes off the slide, formula errors (`#REF!`), broken
  relationships, empty placeholders. Our version of Codex's gates, in data.
- Edits keep what they do not understand (unknown XML parts and
  attributes stay byte-for-byte): a deck from PowerPoint edited by an agent
  still opens in PowerPoint with its masters and animations.

### Where the scripts run: `bise office run <script.ts>`

Agents' `run_typescript` has no files and a 64 MB heap: wrong place. Node is
not on every Mac and bise ships no node. So the `bise` binary gets
`bise office run <script.ts>`: bend-jsrt (deno_core, already shipped) in a
script mode, with the SDK bundle built in, a bigger heap (1 GB), no 10 s
watchdog (a 5 min cap), and two ops, `run.read` and `run.write`, limited to
the script's folder, the agent's worktree and its `$TMPDIR`. Also
`bise office inspect <file>` and `bise office check <file>` (no script: the
outline and the problems as JSON), so a read-only question costs one
command. The same bundle also runs under node for the tests and for a user
who wants it.

`run.write` of a file that is already an artifact adds its next version
(the same as `sb artifact add`); `run.write(path, bytes, { artifact: true })`
adds a new one. That is what makes live edits free for the agent (§6).

Rendering to pixels for the agent (Codex's PNG loop) is not in v1: `check()`
covers what the PNGs catch most (overflow, overlap, errors), and the user
sees the real viewer live. If later needed: the viewer (§4) is HTML, so a
render is a screenshot of it, by a tool that already holds a browser.

## 3. The three plugins

In the repo's `plugins/` beside `computer`, shipped with bise like it,
**on by default** (their skills cost nothing until a request matches):

```
plugins/sheets/  plugin.json  skills/sheets/SKILL.md  skills/sheets/{api.md, recipes.md, style.md, check.md}
plugins/slides/  plugin.json  skills/slides/SKILL.md  skills/slides/{api.md, recipes.md, style.md, check.md}
plugins/docs/    plugin.json  skills/docs/SKILL.md    skills/docs/{api.md, recipes.md, style.md, check.md, comments.md}
```

Each `SKILL.md` is short (under 120 lines): when to use it, the
quick start with `bise office run`, the loop (inspect → edit by id → save →
`check()` → fix), how to answer the user's notes (§5), and links to the
reference files. No MCP server: the SDK is the interface, as Gabriel asked.
`style.md` is ours: Gabriel's taste (plain words, no slop) applied to a
deck, a sheet, a doc. The skills are written last, against the real API,
with one recorded run per plugin on a fake brief.

## 4. The viewer in the side panel

Today an artifact opens in the right column (`apps/desktop/src/artifacts/
Open.tsx`) as an iframe on its `frame_url`, a page of the pages server
(`/a/<id>/<v>/<file>`, `pages/server.rs::artifact_file`). xlsx, pptx and
docx get no `frame_url` (the server does not send them), so they say
"opens in your browser".

The plan keeps that one seam: **the viewer is a page of the pages server**,
`/a/<id>/<v>/view`, an HTML shell + `kit/office/*.js` (the SDK's readers +
a renderer per format), which fetches the copy's bytes from
`/a/<id>/<v>/<file>`. The row's `frame_url` points there for the three
kinds. So the same viewer works in the side panel, in "↗ browser", in an
older version, and with no desktop app at all; and the note layer (§5) is
in the same frame as for pages.

| format | renders with | the user moves by | an anchor is |
|---|---|---|---|
| xlsx | SDK reader (ExcelJS) → a virtualised grid (sheet tabs, widths, merged cells, number formats, fills, bold) | sheet tabs, scroll, click a cell (its formula in a bar) | `{sheet, range}` |
| pptx | SDK reader → HTML/SVG, one scaled 16:9 box per slide (text, shapes, images, tables, charts as SVG from their data) | a slide rail on the left, ←/→ | `{slide, shape?, quote?}` or `{slide, rect}` |
| docx | `docx-preview` into pages, each paragraph tagged with its id | scroll, page count | `{para, quote}` |

Not rendered in v1, said honestly in the frame: pptx animations and
SmartArt (their text shows), xlsx pivot tables and charts (a placeholder
with the chart's title), docx fields as their cached text. `.xls .ppt .doc
.key .numbers`: "Quick Look" as today.

## 5. Notes on any artifact: highlight a part, comment

Pages already have it: `kit/notes.js` (pin, typed note on a block or a
selection, anchored by block id + quote; drafts in `notes.json`; `send`
makes one message to the page's agent: `PageMsg::Sent`). The plan
generalises it to every artifact instead of building a second one.

- **One anchor type**, an object with a `kind`:
  `block` (pages, html: `{block, quote}`), `cell` (`{sheet, range}`),
  `shape` / `slide` (`{slide, shape?, quote?, rect?}`), `para`
  (`{para, quote}`), `region` (images, pdf: `{page?, rect}` in % of the
  frame), `text` (any text file: `{line, quote}`). notes.js's core gets the
  anchoring per kind; each viewer exposes "what is under the selection" as
  an anchor and "where is this anchor" as a box.
- **The store**: `artifacts/<id>/notes.json`, the same shape as a page's,
  served at `/api/a/<id>/notes` and `/api/a/<id>/send`; `send` is the page's
  path (`PageMsg::Sent` widened to `{target: page|artifact}`): one message
  to the maker (main when the maker is gone), as from the user, with its
  typed part (the anchors in SDK terms, so the agent calls `at(anchor)`).
- **The words of the message** follow the page's: `you sent 3 notes on
  "q3.pptx" (v4, slides 2 and 5): …`. Designer signs them.
- **Images, html sites, pdf** get it too through the `region` and `block`
  anchors: "any artifact" is real, not only the three formats.

## 6. Continuous edits with the panel open

- The agent saves (`run.write`, or `sb artifact add`): a new version.
  The hub already sends `hub/artifacts`; the pages server also sends it as
  an SSE `version {n}` on `/a/<id>/events`, like `/p/<id>/events`.
- **The viewer swaps in place**: it fetches v<n+1>, re-renders, keeps the
  user's place (the slide, the sheet and scroll, the doc's scroll), marks
  what changed (cells, shapes, paragraphs that differ from the version
  before: the SDK diffs two outlines) for a few seconds, and re-anchors
  the open notes (a lost anchor says `moved`, as on pages). The desktop's
  iframe keeps its `src` on the viewer url without a version (`/a/<id>/
  view`), so a new version never reloads the frame.
- While the maker works on notes the frame says `<agent> is updating…`
  (notes.js's line), and each sent note shows `✓ done` or the agent's
  answer when the version that answers it lands.
- **Versions**: an agent that saves 30 times in 2 minutes must not make 30
  rows to scroll. Signed (§9.4): a save by the same agent in the same turn
  replaces the newest version's copy, `v` stays n, and the SSE's
  `version {n, rev}` still lets the viewer show each save.

## 7. Adding a file as an artifact in the app

The hub already has `do: add` (the TUI's `/artifacts add`). The desktop
gets: drop a file on the artifacts list or on a thread (it becomes an
artifact of that thread's agent, `by: you`), and `+ add` in the list's
head (the macOS file picker through the shell's bridge). The kinds
`sheet slides doc` already come from `.xlsx .pptx .docx`.

## 8. Chunks

Order: `office-sdk-core` first (one day); then the rest in parallel, the
skills last. Battery mode: main spawns as many as the heavy lock allows.

The artifact routes of the pages server go in a new module, one file per
chunk, so no two chunks own one file: `pages/artifact/mod.rs` (the
dispatch, made by office-viewer), `view.rs` (office-viewer), `events.rs`
(art-live), `notes.rs` (art-notes).

| agent | brief | area (owns) | after |
|---|---|---|---|
| `office-sdk-core` | the package and its build to the committed `office/dist/office.js` (one ESM bundle, no node imports) + the gate check that rebuilds it and fails on a diff; the `Anchor` type in `bise_proto` (kind enum with `Unknown`, released-fixture test) and its generated TS; zip/XML core; `inspect`/`at`/`check`/diff interfaces; fixtures made by us; `docs/office.md` | `office/` (sdk, dist, fixtures), `rust/proto` (anchor), `tests/` (the bundle check), `THIRD_PARTY_NOTICES` | — |
| `office-sheets` | `sheets` module on ExcelJS: open/create/edit/save, inspect, at, check (formula errors), diff | `office/sdk/src/sheets/` | core |
| `office-slides` | `slides` module: create through pptxgenjs, read/edit our OOXML layer that keeps unknown parts, inspect, at, check (overflow, off-slide), diff | `office/sdk/src/slides/` | core |
| `office-docs` | `docs` module: create through `docx`, read/edit our OOXML layer (paragraphs, runs, tables, comments, tracked changes), inspect, at, check, diff | `office/sdk/src/docs/` | core |
| `office-run` | `bise office run|inspect|check`: bend-jsrt script mode (1 GB heap, 5 min cap, only the two ops, `office/dist/office.js` by `include_str!`); the door check in Rust (canonicalize, no symlink or `..` out of worktree + `$TMPDIR` from `env::VARS`, 50 MB max) with a test per refusal; `run.write` = write, then the `sb artifact add` request on `SB_SOCKET` | `rust/jsrt/`, the `office` subcommand in `rust/harness/`, `rust/home` (env rows) | core |
| `office-viewer` | `/a/<id>/<v>/view` and `/a/<id>/view` (current), `frame_url` for the three kinds decided in `proto_view`, renderers per format in `kit/office/` loading `office/dist/office.js` (no copy), what it can't draw said in the frame | `rust/switchboard/src/pages/artifact/{mod,view}.rs`, `proto_view.rs`, `kit/office/` | core, then the 3 modules' readers |
| `art-live` | saves in one turn: `artifacts_turns.rs` (pure fn + unit laws), the turn stamped at the door from sb-core's fact; `/a/<id>/events` on the `/p/<id>/events` subs map with `version {n, rev}`; the viewer's swap in place (place kept, changes marked from the SDK diff); the "updating…" state decided server-side; `docs/artifacts.md` | `rust/switchboard/src/artifacts_turns.rs`, `artifacts.rs` (the call), `pages/artifact/events.rs`, `kit/office/swap.js` | office-viewer's route |
| `art-notes` | one notes system for every target: `store.rs`/`drafts.rs` generalised to a target dir, `PageMsg::Sent` with `target`, `/api/a/<id>/notes|send`, notes.js split (`kit/notes-anchors.js` per anchor kind, from the generated `Anchor` TS), anchors for images, html and pdf first, then the office kinds; the words in `bise_proto`, signed by designer | `kit/notes.js`, `kit/notes-anchors.js`, `rust/switchboard/src/pages/{store,drafts,mod}.rs`, `pages/artifact/notes.rs` | core's `Anchor`; designer's page |
| `art-desktop` | the side panel: the frame keeps its src across versions, draws the hub's "updating…" and words, drop a file / `+ add` through the hub's `do: add` (file picker through the shell's bridge) | `apps/desktop/src/artifacts/`, the shell's bridge | designer's page, art-live |
| `office-plugins` | `plugins/{sheets,slides,docs}`: short manifests, skills and reference files on the real API, one recorded fake run each, on by default, the prompt budget test with all three on | `plugins/sheets`, `plugins/slides`, `plugins/docs` | the 3 modules + office-run |

`office-lead` (me) stays: merges order, the plan's updates, the QA pass on
fakes at the end (a deck, a sheet, a doc made and edited by an agent with
notes, the panel open, on a throwaway hub).

## 9. Architect's answers (m_23701): the rules every chunk follows

1. **`office/sdk/`** at the top level. Cargo and nix never run pnpm, so the
   built bundle is committed as **`office/dist/office.js`** (like generated
   code); a gate check rebuilds it and fails on a diff. `include_str!` and
   the viewer both use that one file: no copy in `kit/`. Third-party code in
   the bundle gets its `THIRD_PARTY_NOTICES` rows in the same commit.
2. **Script mode of bend-jsrt**, no second binary. The scope check is in
   Rust, at the door: canonicalize, refuse a symlink or `..` that leaves the
   scope, refuse a write over 50 MB (`MAX_COPY`). Scope = the agent's
   worktree + its `$TMPDIR`, both from `bise_home` / `env::VARS` rows (not
   "the script's folder": a user file elsewhere is copied into `$TMPDIR`
   with bash first). No other op: no net, no env, no subprocess. A test
   proves each refusal.
3. **`run.write` → next version** through `SB_SOCKET`, with the request
   `sb artifact add` already sends (no new op; debt-t5's typed `sb::Req`
   if it has landed). Write the file, then send. Whether a path is already
   an artifact is the hub's call (`artifacts.rs`), never jsrt's.
4. **Saves in one turn** (§6): `artifacts.rs` owns it, as a pure fn with
   unit laws in a new `artifacts_turns.rs`: a save by the same agent in the
   same turn as the newest version replaces that version's copy, `v` stays
   n. The hub stamps the turn from sb-core's fact (the agent's turn number)
   at the door, never from the request. The SSE sends `version {n, rev}`, so
   the viewer swaps on each save; whether Gabriel sees each save or only the
   turn's result is §10.3, the rule allows both.
5. **One notes system**: the pages module owns the notes rules for every
   target (`store.rs`/`drafts.rs` generalised to a target dir, `pages/<id>`
   or `artifacts/<id>`); `artifacts.rs` only reads the counts.
   `PageMsg::Sent` gets a `target` field. The anchor type is wire: it lives
   **once in `bise_proto`** (a kind enum with `Unknown`, fields only added, a
   released-fixture test); notes.js and the SDK import its generated TS, and
   the SDK's `at(anchor)` takes that type.
6. **On by default**; short `plugin.json` descriptions, and the prompt
   budget test runs with all three on.

Also:

- **Line limits**: `kit/notes.js` (1,277) is on the ratchet: generalising
  it splits it (anchor kinds in `kit/notes-anchors.js`), never grows it.
  `server.rs` (898): the `/a/<id>/view`, `/a/<id>/events`,
  `/api/a/<id>/notes|send` routes go in a new `pages/artifact_routes.rs`.
- **Clients draw**: the hub/server decides `frame_url` (`proto_view`), the
  "updating…" state and the notes words; the desktop only draws them. Words
  go through `bise_proto` words, signed by designer.
- **Adding a file** (§7): the desktop calls the hub's `do: add`, never writes
  into `artifacts/`.
- **SSE**: reuse the `/p/<id>/events` mechanism (its subs map).
- **Formulas**: v1 ships without an evaluator if `check()` names the cells
  with no value and the viewer says so.
- **Docs**: `docs/office.md` (new) and `docs/artifacts.md` (versions per
  turn, notes on artifacts) in the chunks that change them, plus `//!`
  headers.
- **Process**: each chunk runs its unit tests + one off-screen check under
  `heavy-run --low`, lands on `office-artifacts` with `sb land --here`, and
  sends architect its sha before landing.

## 10. Design questions for Gabriel (designer's page)

1. The viewer per format in the side panel (55% column): the sheet grid
   and its tabs, the deck with a slide rail or one slide at a time, the doc
   as pages or as a flowing column.
2. Highlight and comment: how a selection becomes a note (a cell range,
   a shape, a text quote, a box drawn on an image), where the notes list
   lives (inside the frame like pages, or in the desktop's panel), how a
   sent note looks once the agent answered.
3. Live edits: how a new version shows while he looks (a flash on what
   changed, a "v5 · 3 changes" line, the agent's "updating…"), and whether
   he sees each save or only the turn's version.
4. Adding a file: drop zones and the `+ add` in the list.

## Risks

- **Formulas without values**: ExcelJS writes formulas with no cached
  result, so a new sheet shows empty cells in our viewer and in Quick Look
  until Excel recalculates. Fix: the SDK computes values on save with an
  evaluator for the common functions (`@formulajs/formulajs`, MIT) and
  `check()` names the cells it could not compute. HyperFormula is GPL:
  not usable.
- **pptx fidelity**: our renderer will differ from PowerPoint (fonts, auto
  fit, SmartArt). The viewer says so in its footer when the deck uses
  something it does not draw. The file itself stays exact: edits keep
  unknown XML.
- **Scope**: the docs and slides edit layers are the big pieces. v1 covers
  text, runs, tables, images, shapes, slides add/remove/reorder, comments;
  not charts editing in pptx (replace a chart, not edit its series).
- **Battery**: no full gates; each chunk runs its package's unit tests and
  one off-screen harness check under the heavy lock.
