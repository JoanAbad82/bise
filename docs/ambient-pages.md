# bise ambient v2, slice 1: the page loop (build plan and contracts)

Status: building on the local feature branch `ambient-app` (never main, never pushed). Lead:
`ambient-lead`. The product: [ambient-vision.md](ambient-vision.md) §3-§8 (ambient-pm). The look:
ambient (product design), designer (brand); ambient is exploring a new identity, so everything
visual goes through role tokens (§3.1) and waits for the look. v1 (the capsule):
[ambient-app.md](ambient-app.md).

(Since m_5204: proved on fixture data by QA; on his real Slack and Linear only when he runs it
himself. See docs/ambient-app.md §7's hard rule.)

Done when (vision §8): Gabriel says "draft my weekly update from Slack and Linear", gets a doc page
with sources, leaves 3 notes, sends, and v2 lands in the same tab with the 3 notes done; no
terminal touched, and it works with the TUI closed (the capsule only).

## 1. The pieces

```
 agent ──sb page publish──▶ hub (sbd)  ─────────────── page server (in sbd, 127.0.0.1:<port>)
                            │ store: <state>/pages/<id>/   GET /            "for you"
                            │ lint (pages/lint.rs)         GET /p/<id>      the page (wrapped)
                            │ ev "page", state.pages       GET /p/<id>/events  SSE
                            │                              GET /kit/*       the kit (kit/)
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
| `GET /p/<id>/events` | SSE, events named `version {n}`, `state {state}`, `notes {…}` (`/events`: the home list's, `pages`) |
| `GET /p/<id>/meta` | flat: `{id, title, agent, created_ms, state, versions, url, notes}` |
| `GET /kit/<file>` | the kit's files, from the app root's `kit/` |
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

The hooks between them (agreed with amb-web; amb-kit builds to them):
- styles: `notes.css` (amb-web's) next to `notes.js`; the shell links `tokens.css`, `kit.css`,
  `notes.css`, then `kit.js`, `notes.js` (no inline style: the CSP blocks it);
- events on `document`, from kit.js (the one SSE client): `bise:swapped {version, changed: [ids]}`,
  `bise:notes {notes}` (the SSE notes event), `bise:state {state}` (the SSE state event);
- the frame (kit.js) gives `[data-bise-notes-count]` (notes.js writes the count) and a button
  `[data-bise-send]` (notes.js binds it, disabled at 0 drafts);
- notes.js mounts `<aside class="bise-notes">` (the side list) and `<div class="bise-sendbar">` on
  `body`; blocks are `#bise-page [data-kit][data-id]`; the page id and version are `#bise-page`'s
  `data-page`/`data-version`; the token is `<meta name="bise-token">`;
- the API (amb-core): `POST /api/p/<id>/notes {notes: [...]}` = the page's whole draft list (it
  replaces the drafts; sent/done/answered untouched; delete = leave it out); `POST
  /api/p/<id>/send {}` → `{sent: n}`; `GET /p/<id>/meta` → flat `{id, title, agent, created_ms,
  state, versions, url, notes}` (as built). notes.js gives every note its own id (`n` + a random
  or time-based suffix): the server numbers an id-less note `n<max+1>`, so a deleted draft's id
  could come back.

### 2.8 Opening a page (owners: amb-mac, amb-web, amb-core)

fn + o or a click in "for you" → web `app_open_url {url, page}` → the app: in a Chromium browser
that is running (Chrome, Arc, Brave, Edge), find a tab whose URL starts with the page's URL and
bring it forward, else open a new tab (AppleScript, macOS asks once for Automation); otherwise
`open <url>`. The `bise` tab group through the extension comes in slice 2, by the path computer-use
gave (m_4777): ambient-core (not the Swift app: the broker starts on demand from a bise process)
sends `{op: "show", args: {url, url_prefix}}` to the computer-use broker (`~/.bise/run/
computer-use.sock`, C3), which forwards it to the extension (C4); sw.js finds the tab by prefix in a
user-facing `bise` group, else creates it active there, and focuses the window (no debugger, not in
the agents' tools: the only op that takes focus). On `not_set_up`, `no_browser` or no socket: the
AppleScript path above. computer-use owns the broker + sw.js side (~half a day). "A page you're waiting for opens in front": the core knows the user's last turn
(phase `working`) and the page's agent is main or started in that turn → `page` event with
`front: true` → the app opens it without fn + o.

### 2.9 The guide and main's rule (owner: amb-kit, words with ambient-pm and ambient)

`prompts/skills-all/bise-pages/SKILL.md` (a built-in skill every agent sees, main and tasks: `prompts/skills-all/`, amb-kit 82782bee; `prompts/skills/` stays main's own, like `bise-demo`): the blocks, one example
page per kind, the rules, `sb page publish`, how to answer notes. Main's rule (vision §3 B) in
main's prompt (`rust/switchboard/src/prompts.rs` or the prompt file it reads), pointing to it.

## 3. Rules

### 3.1 Tokens by role

`kit/tokens.css`: CSS custom properties named by role only: `--surface-talk`,
`--surface-made`, `--accent`, `--pen`, `--ink`, `--dim`, `--faint`, `--rule`, type roles
(`--font-read`, `--font-ui`, `--font-mono`), space, `--radius`, motion. Light and dark from the
system. The capsule's web UI moves to the same file. An identity = another tokens file + assets.

### 3.2 Who owns what

| agent | owns |
|---|---|
| ambient-lead | this file, `docs/ambient-app.md`, `tests/ambient_pages_e2e.py`, integration |
| amb-core | `rust/switchboard/src/pages/` (except lint.rs), the hub/daemon/cli/core lines for pages, `rust/tui/src/ambient/**` |
| amb-kit | `kit/` (except notes.js), `rust/switchboard/src/pages/lint.rs`, `prompts/skills-all/bise-pages/`, main's rule |
| amb-web | `kit/notes.js`, `apps/ambient/web/**` ("for you", fn + o) |
| amb-mac | `apps/ambient/mac/**`, `scripts/ambient.sh` |

A shared file (Cargo.toml, Cargo.lock, a new dependency): ask ambient-lead. Commit with `sb land`.
Tests never open a browser, the app, the mic or the user's pages: a throwaway hub (tests/e2e.py),
HTTP from Python, the kit's laws in node.

## 4. Slice 2: talk to the page, the inbox (job 2), questions in two places

Started in parallel with slice 1's end (the user's call, m_4826: never wait). Simple over ready
for others (vision §10.3).

### 4.1 Voice notes at the mouse (owners: amb-mac, amb-core, amb-web)

Hold fn while the front window is a bise page: a voice note pinned where the mouse is, not a
message to main. The page's own JS knows the mouse; nobody computes screen→page coordinates.

1. amb-mac: on fn down, if the front app is a Chromium browser whose active tab URL starts with
   the hub's `pages_url` (AppleScript, the PageOpen code), `talk_start` carries `page: {id, url}`
   and no screenshot is taken (the page is the context). Released: `talk_end` as usual.
2. amb-core: a talk with `page` is a **note talk**: the same mic and listener, but the words go to
   the hub op `page_voice {page, phase: start|heard|end|cancel, text}`, never to main's input;
   `heard` partials too. The final words alone equal to "send" (or "envoie", the user's language)
   → `page_voice {phase: send}`. The hub relays each as an SSE event `voice` on that page's
   `/p/<id>/events`.
3. amb-web (notes.js): `voice start` → a pin at the last mouse position over a block (anchor:
   block id + nearest text, like a typed note) with the listening state; `heard` fills it live;
   `end` saves it as a `voice` note draft; `cancel` removes it; `send` = the send button.
4. The capsule shows `voice note on <page>` while it listens (amb-web), the edge glow stays.

### 4.2 Questions in two places (owners: amb-core, amb-kit)

A `question` block in a published page creates (or updates) one hub card of kind `question`,
agent = the page's agent, `text` = the question, options = its items, `page` = `{id, block, url}`.
The page's question renders that card: a pick on the page = `POST /api/p/<id>/answer {block,
option|text}` → the hub's `/answer <card> <reply>` (the same path as the capsule); answered in the
capsule or the TUI → the page gets SSE `answered {block, reply}`, and shows it. One card, one
answer. The capsule's card says `open it` (fn + ⏎ opens the page at `#<block>`).

### 4.3 The inbox (job 2): review and email draft (owners: amb-kit, amb-web)

Kit components `review` (items, each approve / edit / skip, `approve all`) and `email` (to,
subject, body editable, approve / skip). Reactions are notes of kinds `approve`, `skip`, `edit`;
`send` sends them to the agent like any notes. The agent then acts (sends the replies through its
mail tool; the approvals gate applies as for any tool call). The guide shows job 2's page.

### 4.4 Versions (owners: amb-kit, amb-core)

The frame's `v3 · 2 min ago` opens a small list of versions; a version opens read-only at
`/p/<id>/v/<n>` with `back to the latest`. `what changed` compares with the version before.

### 4.5 The `bise` tab group (owners: computer-use, amb-core)

§2.8's slice-2 path: ambient-core sends the broker's C3 `show`; fallback the AppleScript path.

## 5. Slice 3: a home without a repo, plans with decisions (job 3), pages that leave

### 5.1 The home workspace (owner: amb-home)

`~/bise` (created on first use, no git): a workspace the hub runs in without git (no worktrees:
agents work in the shared folder; `sb land`, features, PRs off). `bise ambient` with no repo
opens the app on it; the capsule's workspace is the home by default when the app starts from the
menu bar. The simplest version that works for Gabriel's non-code work.

### 5.2 Compare and checklist (owner: amb-kit), job 3's page in the guide

`compare` (2-4 variants side by side, each with facts and why; ♡ ✗, pick one), `checklist`
(items, who, when; tick, edit, add). Reactions are notes (`pick`, `tick`).

### 5.3 Pages that leave (owner: amb-kit's guide)

"Make it a Google Doc / send it / post it in #team": the agent exports the page's text through
its connectors (Gmail, Slack, Google Docs when present), after the user's word, through the
approvals gate. Guide-only: the skill shows how (the fragment's text in order, sources as links).

### 5.4 Drawing (owner: amb-web): `d` draws on the page; a drawing is a note with an SVG path and
its blocks, and the notes message carries a screenshot of the area (the server renders nothing:
the page sends the PNG it drew with canvas).

## 6. Roadmap A-D as built (docs/ambient-roadmap.md §2)

The contracts as they landed on `ambient-app`. QA: docs/ambient-qa.md's done-when checks, run on
fake accounts only (`plugins/ambient-qa`, `qa.py run <scenario>`).

### 6.1 Rules every slice follows
- **Nothing leaves before his word on the page** (main's rule + the guide, amb-kit 038fc00b): no
  draft, message, post or label in his accounts during the first versions; only after a send,
  approve or "put it in my drafts" note on that page. The hub enforces it as a guard (amb-home
  68e03f09, `tests/draft_guard_e2e.py`): a draft-making connector call from an agent whose page
  has an unreviewed review item or open question becomes a card `<agent> wants to put drafts in
  Gmail before you reviewed "<page>"`. Draft tools otherwise need no card; send, post and delete
  stay gated.
- **Page or one line** (main's rule, amb-kit 07f0b9d4): a fact, a yes/no, a status, a time get one
  capsule line; a page is for what he'll read, edit or act on.
- **Publish fast** (the guide, a9338abc: SKILL.md ≤ 1200 words, details in `blocks.md`,
  `leaving.md`, `watch.md`, `feedback.md`, `about-you.md` read on demand): `sb page start` at
  once, items published 2-3 at a time as drafted, first real items within ~45 s.
- **His taste** (amb-home d75aefe4): `sb page publish --taste` sets `meta.taste {rules: N}` (the
  `- `/`* ` lines of `~/bise/taste.md`), SSE `taste`; the frame says `following your taste · N
  rules` (link `/p/about-you`).
- **A button does only what it names** (ambient): `stop` and `start an agent` send their one note
  alone; his other drafts stay drafts until ⌘⏎.

### 6.2 A: drafts where they live
Gmail reply: an email block, `put it in my drafts` (or `send` for one he lets bise send). Slack:
a message block with `copy` + `data-open` (`copied · open #team`). Kit newsletter: an email block
with `data-verb="draft"`, Kit create-draft, never send (amb-kit 56cfd679). After the act the agent
runs `sb page publish --went <kind>:<ref>[@<block>]=<url>` (amb-home f7758504): `meta.went
[{kind, ref, url, at, block?}]`, SSE `went`; kit.js draws `in your Gmail drafts · open`.

### 6.3 B: watch for me
`sb every <interval> "<message>" --page <id> [--until …]` (amb-home 796ea3d3, 3f22c3bc): the hub
wakes the agent, the agent republishes. State: `timers [{id, agent, label, text, by, next_ms,
last_ms, fired, until_ms?, times?, page?}]`; `meta.watch {timer, every, checked_ms, until_ms}`,
SSE `watch`. The frame: `watching · checked 3 min ago · until tomorrow 18:00` + `stop` (a note
of kind `stop`, handled by the hub: it ends the page's timers, no model turn). The menu bar
(amb-mac bae165c1): `watching <page> · N new for you`, `stop watching` → core `{cmd:
"every_stop", id}` → hub op `every_stop` (amb-core 527fa441). Review items for read-only places
take `data-verb="open-reply"`: `open with the reply` (X/Bluesky compose intent, else copy + open
the thread), never send (amb-kit f0a88b01, 0873589e).

### 6.4 C: feedback into work
A review item per report with `data-verb="start"`: `start an agent` / `answer <name>` / `skip`
(amb-kit d418d973). `start` sends one note of kind `start` (amb-web 1c034fb3), which the hub routes
to main, never to the page's agent (amb-home f7758504); main starts the agent with the item as
its brief and republishes the item with `data-agent="<name>"`. Items with `data-agent` get SSE
`agent {name, status, note?}` (replayed at connect, from `pages/<id>/agents.json`); kit.js draws
`∿ <name> working · <note>`, `✓ <name> done`, `▲ <name> failed`, `? <name> needs you · <note>`.
The drafted reply follows A's rules.

### 6.5 D: steps only you can do
A checklist row with `data-who="yours"` (kit: `you · friday` in the accent) becomes one question
card when every row before it is done (amb-core 527fa441): `card.page = {id, block, item,
url#item}`, `urgent: false`. It closes on a tick on the page, `data-done` in a republish, `done`
on the card, or `sb page tick <page> <item> [words]`; ticks push SSE `ticked` and a notes message
to the page's agent. A capsule message to main carries `[his open steps: …]` so a spoken "done
with the payment" becomes a `sb page tick`. bise's own rows: `data-done` on republish.

### 6.6 The full view's "for you" and the count
Unopened pages first (`version > opened_version`, amb-core 03821a37), newest first, then seen ones
dim; a watched page shows its watch line (amb-web 6e78047f). The menu-bar count and this list use
one rule (questions + approvals + unopened pages), fixed in `apps/ambient/web/fixtures/count.json`
and tested on both sides.
