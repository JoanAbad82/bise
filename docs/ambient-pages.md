# bise ambient v2, slice 1: the page loop (build plan and contracts)

Status: building on the local feature branch `ambient-app` (never main, never pushed). Lead:
`ambient-lead`. The product: [ambient-vision.md](ambient-vision.md) §3-§8 (ambient-pm). The look:
ambient (product design), designer (brand); ambient is exploring a new identity, so everything
visual goes through role tokens (§3.1) and waits for the look. v1 (the capsule):
[ambient-app.md](ambient-app.md).

Done when (vision §8): Gabriel says "draft my weekly update from Slack and Linear", gets a doc page
with sources, leaves 3 notes, sends, and v2 lands in the same tab with the 3 notes done; no
terminal touched, and it works with the TUI closed (the capsule only).

## 1. The pieces

```
 agent ──sb page publish──▶ hub (sbd)  ─────────────── page server (in sbd, 127.0.0.1:<port>)
                            │ store: <state>/pages/<id>/   GET /            "for you"
                            │ lint (pages/lint.rs)         GET /p/<id>      the page (wrapped)
                            │ ev "page", state.pages       GET /p/<id>/events  SSE
                            │                              GET /kit/*       the kit (apps/ambient/kit)
                            │                              /api/p/<id>/notes, /send  (token)
                            ▼
                ambient-core → capsule "for you", fn + o → app opens/reuses the tab
 browser tab: kit.js (frame, live swap) + notes.js (note layer) ──send──▶ hub input to the agent
```

## 2. Contracts

### 2.1 The page store (owner: amb-core)

`<workspace state>/pages/<id>/` (the hub's `Paths.state`; per workspace, never in a repo):

- `v<n>.html`: version n, the agent's fragment as published (after the lint), never edited;
- `meta.json`: `{id, title, agent, created_ms, versions: [{n, at_ms, blocks: [{id, kit, hash}]}],
  state: "ready"|"updating"}`;
- `notes.json`: `[{id: "n1", version, block, quote?, kind, text?, before?, after?, at_ms,
  status: "draft"|"sent"|"done"|"answered", answer?, sent_ms?}]`.

`<id>`: `[a-z0-9-]{1,40}`, from `--id` or the title's slug; a new `--id` of another agent's page is
refused (one owner per page; main may take over a page whose agent is gone).

### 2.2 `sb page` (owner: amb-core, in switchboard's cli)

- `sb page publish <file> [--id <id>] [--title <t>] [--notes-done n1,n3] [--note-answer n2="…"]...`
  → hub op `page_publish {agent, id?, title?, html, done, answers}`. The hub runs the lint: a
  failure prints its lines (one per problem, the agent can act on each) and stores nothing, exit 1.
  Ok: stores v<n+1>, sets the notes' outcomes, state `ready`, broadcasts `page`, prints
  `published <id> v<n> · <url>`.
- `sb page list` (id, title, agent, version, open notes), `sb page notes <id>` (the notes as
  JSON).

### 2.3 Hub events (owner: amb-core)

- `{"ev":"page","id","title","agent","version","url","at_ms","state"}` on publish and on every
  state change (`updating` from a send to the next publish or the agent's idle).
- `state` gets `pages: [{id, title, agent, version, url, at_ms, state, open_notes}]`, newest first.
- ambient-core relays `pages` in its own `state` event and a `page` event (docs/ambient-app.md §4,
  to add); the capsule's "for you" and fn + o use them.

### 2.4 The page server (owner: amb-core)

In sbd, one per hub, `127.0.0.1` only. Port: stable per workspace (the first free from a hash of
the workspace id in 47100-47899, kept in `<state>/pages.port`), in `hello` and `state`
(`pages_url`). Routes:

| route | what |
|---|---|
| `GET /` | "for you": the list of pages (a kit page the server writes) |
| `GET /p/<id>` and `/p/<id>/v/<n>` | the page: the server's shell (§2.5) around the fragment |
| `GET /p/<id>/v/<n>/body` | the fragment alone (live swap) |
| `GET /p/<id>/events` | SSE: `version {n}`, `state {state}`, `notes {…}` |
| `GET /p/<id>/meta` | meta.json + notes.json |
| `GET /kit/<file>` | the kit's files, from the app root's `apps/ambient/kit/` |
| `POST /api/p/<id>/notes` | upsert/delete draft notes `{notes: [...]}` |
| `POST /api/p/<id>/send` | the drafts become `sent`, the notes message goes to the agent (§2.6) |

Every response: `Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self';
script-src 'self'` (no inline, no outside). `/api/*`: header `X-Bise-Token` = the hub session's
random token (the shell puts it in `<meta name="bise-token">`), and `Origin` = the server's own
origin; else 403. URLs inside pages are relative (vision §9).

### 2.5 The page format (owner: amb-kit; vision §4, §10.1 decided)

The agent writes a **fragment** of kit blocks, plain HTML: `<section data-kit="<kind>" data-id="<id>"
…data-attributes>…</section>` and the plain elements the kit allows inside (h1-h3, p, ul/ol/li, a,
strong, em, code, pre, table/thead/tbody/tr/th/td, img with a relative or data: src, blockquote).
Kinds of v0: `prose`, `heading`, `callout`, `sources`, `table`, `question`. Values as data-
attributes, never `style=` (ambient). The server's shell wraps it: `<!doctype html>`, title, the
kit's `tokens.css` + `kit.css` + `kit.js` + `notes.js`, the token meta, `<main id="bise-page"
data-page data-version>` holding the fragment. The kit draws the frame (whose page, `v2 · 3 min
ago`, state, `what changed`, notes count, `send`).

The lint (`rust/switchboard/src/pages/lint.rs`, owner: amb-kit, called by the hub): unknown
`data-kit`, a block without `data-id` or with a duplicate, any `style` element or attribute, any
`script`, `iframe`, `object`, `link`, event handler attribute (`on*`), `javascript:` URL, absolute
`http(s):` src (links `<a href>` to the outside are allowed: sources), too big (> 1 MB). One line
each: `t1: style= is not allowed: use data-tone/data-value`. It also returns the blocks (id, kit,
text hash) for `meta.json` and `what changed`.

### 2.6 The notes message (owner: amb-core)

`send` → the hub's input to the page's agent (main when it's gone: dropped or archived), as from
the user:

```
you sent 3 notes on your page "weekly update" (weekly-update v1, <url>):
1. on "Revenue" (t1): use the March numbers
2. on "…we shipped dark mode…" (p2): ✗ drop
3. on p4, you changed "Q2" → "Q3"
answer with: sb page publish <file> --id weekly-update --notes-done n1,n2,n3 (or --note-answer n2="…")
<page-notes page="weekly-update" version="1">[{"id":"n1",…}]</page-notes>
```

The page goes `updating` until the next publish (or the agent's turn ends without one: back to
`ready`, the notes stay `sent`).

### 2.7 The kit's JS and the note layer (owners: amb-kit `kit.js`, amb-web `notes.js`)

`kit.js`: the frame, components' behavior, the SSE client; on `version n` it fetches the body and
swaps blocks by `data-id` in place (scroll kept, a `bise:swapped` event with the changed ids);
`what changed` = blocks whose hash differs from the previous version (meta). `notes.js`: pin,
typed note on a block or a selection (anchor: block id + quote), ♡ ✗ ~, edit in place on `prose`
(an edit is a note with before/after; undo), the side list (`notes for weekly update · 3`), the send
bar, ⌘⏎; drafts saved through `/api/p/<id>/notes` (never lost on reload); on `bise:swapped` it
re-anchors (a lost quote: `moved`) and shows outcomes (done / answer / open). Words: ambient's.

### 2.8 Opening a page (owners: amb-mac, amb-web, amb-core)

fn + o or a click in "for you" → web `app_open_url {url, page}` → the app: in a Chromium browser
that is running (Chrome, Arc, Brave, Edge), find a tab whose URL starts with the page's URL and
bring it forward, else open a new tab (AppleScript, macOS asks once for Automation); otherwise
`open <url>`. The `bise` tab group through the extension comes when the computer extension exposes
it (slice 2). "A page you're waiting for opens in front": the core knows the user's last turn
(phase `working`) and the page's agent is main or started in that turn → `page` event with
`front: true` → the app opens it without fn + o.

### 2.9 The guide and main's rule (owner: amb-kit, words with ambient-pm and ambient)

`prompts/skills/bise-pages/SKILL.md` (a built-in skill like `bise-demo`): the blocks, one example
page per kind, the rules, `sb page publish`, how to answer notes. Main's rule (vision §3 B) in
main's prompt (`rust/switchboard/src/prompts.rs` or the prompt file it reads), pointing to it.

## 3. Rules

### 3.1 Tokens by role

`apps/ambient/kit/tokens.css`: CSS custom properties named by role only: `--surface-talk`,
`--surface-made`, `--accent`, `--pen`, `--ink`, `--dim`, `--faint`, `--rule`, type roles
(`--font-read`, `--font-ui`, `--font-mono`), space, `--radius`, motion. Light and dark from the
system. The capsule's web UI moves to the same file. An identity = another tokens file + assets.

### 3.2 Who owns what

| agent | owns |
|---|---|
| ambient-lead | this file, `docs/ambient-app.md`, `tests/ambient_pages_e2e.py`, integration |
| amb-core | `rust/switchboard/src/pages/` (except lint.rs), the hub/daemon/cli/core lines for pages, `rust/tui/src/ambient/**` |
| amb-kit | `apps/ambient/kit/` (except notes.js), `rust/switchboard/src/pages/lint.rs`, `prompts/skills/bise-pages/`, main's rule |
| amb-web | `apps/ambient/kit/notes.js`, `apps/ambient/web/**` ("for you", fn + o) |
| amb-mac | `apps/ambient/mac/**`, `scripts/ambient.sh` |

A shared file (Cargo.toml, Cargo.lock, a new dependency): ask ambient-lead. Commit with `sb land`.
Tests never open a browser, the app, the mic or the user's pages: a throwaway hub (tests/e2e.py),
HTTP from Python, the kit's laws in node.
