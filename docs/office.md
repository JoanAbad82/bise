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

The modules (`sheets`, `slides`, `docs`) are stubs that refuse with
`not_built` until their chunk lands.

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
