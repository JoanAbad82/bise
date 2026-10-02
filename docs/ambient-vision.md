# bise for everyone: the product vision of bise ambient v2

Status: agreed by ambient-pm (product, owns this file), ambient-lead (tech: m_4705, m_4711,
m_4732) and ambient (design: m_4708, m_4714, m_4736). The first slice (§8) is ambient-lead's to cut
and staff. The user's answer to §10.3: v2 is for him only, as simple as possible.
The app it builds on: [ambient-app.md](ambient-app.md) (v1: the capsule, fn to talk, cards).
The look: ambient's `SPEC.md` (`site/content/ambient/`, local). The brand: [brand/bise-book.md](brand/bise-book.md).
**⚠** marks what is not built.

## 1. The idea, in five lines

1. bise is an assistant that is always there, for anyone whose work is mail, docs, meetings,
   numbers and decisions, not only code. You talk to main; agents do the work.
2. bise has almost no UI of its own: the capsule (v1) is the front door, and that's it.
3. Everything bigger than a sentence is a **page**: the agent makes it on the fly, for this job,
   and opens it in your own browser.
4. On a page you react the way you would on paper: point, talk, strike, edit, pick. `send`, and
   the agent that made it comes back with the next draft, in the same tab.
5. One kit (components, tokens, words) so every page, whoever made it, feels like one app.

What we keep from bise: you talk to one agent; it runs as many as the work needs; only the
decisions that are really yours reach you. The four words stay: you, main, agents, the inbox.
One noun joins them on screen: **page** (what an agent made for you; ambient already uses it in
"for you").

## 2. Who it's for

**The first user: Camille, who runs operations at a 20-person startup.** Not a developer. Her day:
Gmail, Google Calendar, Slack, Notion/Google Docs, a few spreadsheets, Linear for what product
does, Granola for meeting notes, a Metabase dashboard. She writes a lot, decides a lot, and spends
half her week moving information from one tool to another. She has no terminal and won't open one.

**v2's only user is Gabriel, on his non-code work** (the launch, mail, Slack, the newsletter,
planning), to validate the core UX (decided by the user, §10.3). Same tools, same jobs as Camille:
she is who we design for, he is who we build for now. bise opens to others, and becomes a product,
only if v2 is a success for him.

**Her week, and the three jobs that prove "bise for everyone":**

| job | today | with bise | the page |
|---|---|---|---|
| **1. the weekly update** (every Monday) | 2 h: read Slack, Linear, meeting notes, the dashboard; write; ask two people to check; post | "draft my weekly update" → a draft in 4 min, with its sources; she pins 3 notes by voice; draft 2; "post it in #team" | a **doc** |
| **2. the inbox** (every morning) | 45 min of mail, half of it needs a two-line answer | "go through my mail" → mail grouped by what it needs, a reply drafted for each one that needs one; she edits two, strikes one, approves the rest | a **review**: a list of items, each one approve / edit / skip |
| **3. a plan with decisions** (a few times a year, days of work) | the team offsite: venues in 12 tabs, a spreadsheet, a poll in Slack, a to-do list in her head | "plan the offsite in May, 20 people, near Lyon" → 3 venues side by side with prices and dates; she ♡ one, ✗ one, asks "and by train?"; then the open questions (date, budget) and a checklist | a **compare**, a **question**, a **checklist** |

Jobs 1 and 2 are weekly or daily, so bise earns its place in her day. Job 3 shows the range: one
page that grows over days, with decisions in it. Each job uses different page kinds.
Next ones, same parts (not v2): reviewing a deck or a draft someone sent (notes, voice), meeting
prep and follow-up (a brief before, the follow-up mails after), comparing vendors, the month's
numbers.

## 3. The core loops

**A. Ask.** Hold fn and talk (or fn + space and type) from any app. Main sees the front window
(v1). Main answers in a sentence when a sentence is enough, by voice when you talked.

**B. Show.** When the answer is more than a short message, an agent makes a page. Your pages
live in one tab group of your own browser window, `bise` (pink), separate from the agents'
working groups (`bise · <agent>`, computer use's background tabs). A page reuses its own tab, so
you never get 30 tabs.
- You asked and you're waiting for it (main said `on it.` a minute ago): the page opens in front.
- Anything else: it never steals your focus. The capsule says it (`your weekly update is ready ·
  fn + o`); fn + o (or a click on it in "for you") opens it, or brings its tab forward.
- **for you**: the page server's home (`/`) lists every page for you, newest first, the same list
  and the same words as the capsule's "for you" (internally: the desk).

**Names on screen.** Agents' ids are kebab-case (`weekly-update`); on Camille's surfaces (the
capsule, the page's frame, the notes, "for you") the name shows with spaces: `weekly update is on
it.` The id stays kebab in the TUI and the hub.

When main makes a page instead of talking (main's rule, in its prompt):
- the answer is longer than a screen of the capsule, or has structure (a table, options, drafts,
  a plan, numbers over time);
- you'll want to change it, pick from it, or check its sources;
- it's a draft of something that leaves (a mail, a post, a doc for others).

**C. React.** The page carries bise's note layer (annotate.js grown up, §5). You can:
- **point and talk**: hold fn, the voice note pins where the mouse is (`you · voice · 0:04`);
- **type** a note on a block or on a selection;
- **mark**: ♡ keep, ✗ drop, ~ not sure, on any block or row;
- **edit** in place, where the page says it's editable (doc text, table cells, a draft's lines);
- **pick** among options (1-3, or click);
- **approve / skip** an item (job 2).
Every reaction is a note in the side list (`notes for weekly update · 3`). Nothing goes until you
`send` (said, clicked or ⌘⏎): `sent. weekly update is on it.`

**D. Iterate.** The notes go to the agent that made the page, in one message. While it works,
the page's frame says `weekly update is updating this page…`. The next version replaces the page
in place in the same tab (scroll kept, notes re-anchored to their blocks; a note whose block is
gone shows `moved` in the list): `v2 · just now`. Each note shows what happened to it: `✓ done`, or
the agent's one-line answer (`kept: Marc asked for it`), or still open. `what changed` (a soft
highlight, a toggle) shows the changes since the last version. Older versions stay one click away.

**E. Act.** When the page is right, you say what to do with it: "post it in #team", "send the
replies", "make it a Google Doc". Anything that leaves your Mac goes through the approvals gate
(a card, or the page's own approve button, which is the same approval). Done: `posted in #team.`

**F. Needs you** stays v1's card: one question, fn + 1…9. A question with more than a few words
or options becomes a **question** block on a page, and its card says `? offsite needs you` with
`open it`, which takes you to that question on the page. Answering on the page answers the card:
one question, two places, never two answers.

The loop is A → B → (C → D)* → E. Most of the value is in C → D: the page is how the agent asks
for feedback, and your notes are how you steer, without writing a prompt.

## 4. What the agent makes in the browser

A page is one HTML file that uses the **bise kit** (§6), written by the agent in one go, about
50 lines for a typical page, with no build step. It's plain HTML with kit classes and `data-`
attributes, no custom elements: `<section data-kit="table" data-id="t1">…</section>`, values as
`data-`, never `style=`. Models write plain HTML best, it reads fine without JS (and exports as
is), the note layer anchors on ordinary DOM, and the lint is a simple parse. The kit's JS adds the
note layer, editing and the live update.

**The page kinds of v2** (what the kit has components for):

| kind | what | the reactions it adds |
|---|---|---|
| **doc** | prose: an update, a mail, a brief, a plan | edit the text, strike, highlight, margin notes |
| **review** | a list of items to decide: mails to answer, tickets, expenses | approve / edit / skip per item; `approve 5` approves the rest with its count, never the items you edited or struck (those go with `send`) |
| **table** | rows to check or sort: numbers, candidates, a list | ♡ ✗ per row, edit a cell, sort, "add a column" by voice |
| **compare** | 2 to 4 variants side by side (venues, drafts, designs), each with its facts and its why | ♡ ✗ per variant, pick one (1-3) |
| **question** | a decision with options, the rich card (a block inside any page) | pick, or answer in words; answers the card too |
| **checklist** | what's left to do, who does it, by when | tick, edit, "add …" by voice |
| **email draft** | a mail ready to send: to, subject, body, attachments | edit, approve (sends through the gate), skip |

Any page can hold: headings, callouts, a source list (every claim links its source: the mail, the
Slack thread, the dashboard), a simple chart (bars, lines), an image, a timeline.

Later kinds (not v2): week/calendar view, board (kanban, drag), slides and a deck review, a live
dashboard (data that refreshes), image variants (ambient's mock: draw, cross out, pick one), a PR
(dev).

**Rules for every page:**
- every block has a stable id (`data-id`), kept across versions, so notes anchor and the agent
  knows what each note is about;
- agents write semantic blocks, never styles: no CSS, no inline style, no fonts or colors of
  their own (else the "one app" feel is gone after a week);
- every page gets the same thin bise frame on top, drawn by the kit, not the agent: whose page it
  is (`weekly update`), its version and age (`v2 · 3 min ago`), its state (`weekly update is
  updating this page…`), the notes count and `send`;
- sources visible, never hidden: a fact with no source says so;
- the words follow the brand (lowercase chrome, short, concrete; the content itself is in the
  user's voice and language);
- no network: a page loads only the kit and its own files (CSP), no outside scripts, fonts or
  trackers. Data comes from the agent when it writes the page, not from the page at runtime (v2).

## 5. How feedback flows back

```
 you, on the page            the bise page server (local)          the agent that made the page
 ─────────────────           ────────────────────────────          ────────────────────────────
 notes, edits, marks ──────▶ kept with the page (notes.json)
 send (⌘⏎, "send", click) ─▶ one message to the agent ───────────▶ reads the notes and edits
                                                                    writes version n+1 (+ handled)
 the tab updates ◀────────── live update (same URL) ◀──────────────
```

- **The message** the agent gets is the hub's normal input to that agent: the page, its version,
  and each note: its id, the block id, the quoted text, the kind (note / voice / edit / keep / drop
  / unsure / pick / approve / skip / tick), the words, and for an edit the text before and after;
  a screenshot of the page when a note is drawn. Readable for a person too (the TUI shows it as a
  level-3 message `@ you → weekly-update`). The agent can also look at its page itself (its file,
  or computer use).
- **The answer** is the next version plus, per note, `done` or one line, as data, not prose the
  server parses (`sb page publish … --notes-done n1,n3 --note-answer n2="…"`, or a notes file).
  Notes are kept with the page; on the next version they show as done, answered or still open, and
  you can reopen one.
- **Anchors:** a note on a block anchors on its id; a note on a selection, on (block id, quote).
  When the block or the quote is gone in the next version, the note shows `moved`.
- **Who gets it:** the agent that made the page. If that agent is gone (finished, dropped), main
  gets the notes and decides (picks it up, or starts a new agent with the page as its brief).
- **Picks and approvals** from a page are answers like a card's: the page's approve button and the
  capsule's card are the same approval, answered once.
- **Voice on a page:** holding fn on a page makes a voice note pinned at the mouse (not a message to
  main). Saying "send" while on the page sends the notes. fn + space still talks to main.
- **Your edits are yours:** an edit in place is a note too (`you changed …`), so the agent knows,
  and you can undo it before `send`. The agent's next version keeps your edited text as is unless
  your note asks otherwise.

## 6. The design system: the bise kit

The kit is the design system. It is the one reason every page feels like one app. Owned by
ambient (product look) with designer (brand); built by an implementer; agents only use it.

**In scope:**
- **tokens**: colors (the accent `#f4a6b0`, light `#b8416b`; pen red `#c8264a` only for your notes),
  type (SF for UI, Newsreader for reading, JetBrains Mono for code and keys), space, radius (macOS's,
  like the capsule), motion (the SPEC's curves);
- **tokens are named by role, not by look**: `surface-talk`, `surface-made`, `accent`, `pen`,
  `ink`, `dim`. The look behind them can change (ambient is exploring a more unique identity for
  ambient, "the agent that's always there and lets itself be forgotten, almost your OS", at the
  user's request); the kit's structure and every page stay as they are;
- **two surfaces**: `surface-talk` is where you talk (today glass: the capsule, and on a page
  bise's own chrome: the frame, the note toolbar, the side list, the send bar); `surface-made` is
  what they make (today paper: the page's content, the site's world: Newsreader to read,
  JetBrains Mono for code and numbers), light and dark following macOS;
- **the page shell**: the frame (whose, version and age, state, `what changed`, notes count,
  `send`), the side list of notes (`notes for weekly update · 3`), the send bar (`3 notes for
  weekly update · or just say "send"`), "for you" (the list of pages);
- **components**: prose, heading, callout, source list, table, item list (review), compare,
  question, checklist, email draft, chart (bars, lines), image, timeline, and the edit states
  (editable, edited by you, changed in this version);
- **the note layer**: pin, type, mark (♡ ✗ ~), draw, voice note, edit, the keys (p pin · d draw ·
  t type · ⌘z undo · ⌘⏎ send · 1-3 pick · hold fn: voice note);
- **words**: the kit's own strings, signed off like the capsule's `W`;
- **a check**: publishing runs the kit's lint: unknown blocks, any style, script or outside URL,
  a block without its id fail it, with one line the agent can act on; it fixes the page and
  publishes again;
- **no `style=` anywhere, the kit's own components included**: a bar's width, a chart's size, a
  color tag are `data-` attributes the kit's CSS and JS read (`data-value`, `data-tone`,
  `data-size`), so agents never need a style, and stripping every `style=` never changes how a kit
  page looks (the kit's own check proves it; ambient m_4717, ambient-lead);
- **the agent's guide**: one short reference (the blocks, an example page per kind, the rules of
  §4) that agents get when they make a page, so a page is ~50 lines.

The kit and the note layer are product code, in the repo (`apps/`, public). Users' pages are not:
they live in the user's bise home, never in a repo.

**Out of scope:** themes, the user's own branding, any CSS written by an agent (a visual the kit
can't draw waits for a new component), a component library for developers to build apps with.

## 7. Where things live, and what stays private

- **The page server**: inside the hub (sbd), the one process per workspace that already knows the
  agents and routes messages; no new binary. On 127.0.0.1, a stable port per workspace from the
  ports plan ([ports-plan.md](ports-plan.md)); live updates by SSE. Agents never pick a port or a
  path: they publish (`sb page publish`, §8) and get the URL. Pages are static files the agent writes (one folder per page, one file per
  version, the notes next to them) in the user's bise home, per workspace. Any web page can POST to
  localhost, so the notes and answers API takes a per-session token baked into the pages it serves,
  checks the origin, and is never open to other sites.
- **No repo needed**: a home workspace (`~/bise`) where main lives for non-code work: no git, no
  worktrees (those stay a developer thing). Repos stay workspaces for code. The capsule uses the
  home workspace by default **⚠**. On screen for non-developers: no repo, PR, branch, worktree;
  `main` and `agents` stay (they're the product's words).
- **Private by default**: your files, your screen and your pages stay on your Mac. What leaves: what
  the model needs to answer (to your model provider, the same promise as the screenshot: `it goes
  to your model with your words`), and what you approve to send (a mail, a post, a doc) through your
  connectors. Pages are not on the internet; sharing a page = exporting it where it lives (a Google
  Doc, a mail, a Slack post), with approval.
- **The browser**: opening a page in the `bise` tab group and reusing its tab needs the bise
  browser extension (the one computer use installs). Without it, bise opens the page with macOS's
  `open` in the default browser, a new tab each time: it works, less tidy. A v2 dependency, not a
  blocker.
- **The terminal** is optional: Camille never sees it. A developer still has the TUI on the same
  thread.
- **Data comes from** connectors (mail, calendar, Slack, docs, Linear, Granola, Metabase...) and
  computer use in her browser for the rest. A job that needs a connector she hasn't set up says so
  in one line and opens its setup.

## 8. What v2 ships first, and what is out

**v2 = the page loop, proved on job 1 (the weekly update), then jobs 2 and 3.**

The first build slice (for ambient-lead to cut and staff):

1. **The page server**, in the hub: serves pages from the user's bise home, keeps notes,
   live-updates an open tab by SSE when a new version lands (scroll kept, notes re-anchored),
   takes `send` with the session token and gives the notes to the page's agent as its input
   from you, a structured block (page id, version, notes JSON) plus a readable summary (main when
   that agent is gone); "for you" at `/`.
2. **The kit v0**: tokens (by role), `surface-made` light/dark, the frame, prose, heading, callout, source list, table,
   question; the lint; the agent's guide as a built-in skill, `bise-pages`.
3. **The note layer v1**: pin + typed note on a block or a selection, ♡ ✗ ~, edit in place on doc
   text (an edit is a note), the side list, send (click and ⌘⏎). Voice notes and drawing come in
   slice 2.
4. **Publishing**: `sb page publish <file> [--id <id>] [--title …]`: the lint runs, the server
   stores version n+1, the hub sends a `page` event, the command prints the URL. The capsule shows
   it in "for you" with `<page> is ready · fn + o`; fn + o opens it in the `bise` tab group of the
   user's window (the extension; else `open`), or brings its tab forward; a page you're waiting for
   opens in front.
5. **The notes message and the next version**: the agent gets the notes as one message, publishes
   v2 with each note's outcome as data (`--notes-done`, `--note-answer`); each note shows done, its
   answer, or still open; `what changed` on, block by block (block id + text hash; no pixel diff).
6. **Main's rule** for when to make a page (§3 B), in main's prompt, pointing to `bise-pages`.

Done when: Gabriel says "draft my weekly update from Slack and Linear", gets a doc page with
sources, leaves 3 notes, sends, and v2 lands in the same tab with the 3 notes done; no terminal
touched, and it works with the TUI closed (the capsule only).

Proposed staffing (ambient-lead's): amb-core (the page server in the hub, `sb page`, notes routing,
page events), amb-web (the note layer and the live update in the kit's JS), a new amb-kit (the
kit's CSS and components, the lint, the `bise-pages` skill; with ambient and designer), amb-mac
(fn + o, the tab group through the extension or `open`, opening in front when you're waiting).

**Slice 2:** voice notes at the mouse (hold fn on a page) and "send" by voice; the review and email
draft kinds and job 2 (the inbox, replies approved from the page through the approvals gate); a
page's question answers its card; versions history.
**Slice 3:** the home workspace without a repo; compare and checklist, and job 3 (the offsite);
exporting a page (Google Doc, mail, Slack); drawing.

**Out of v2:**
- anything for a user other than Gabriel: installing without a terminal, signing and
  notarization, packaging, onboarding for others (§10.3). v2 runs from his dev build and stays as
  simple as possible; these come only if v2 succeeds;
- bise's own editor or app windows: the browser is the surface, the capsule the door;
- pages on the internet, on a phone, or shared live with others; real-time co-editing (§9);
- pages that fetch data or call connectors at runtime (live dashboards); actions from a page outside
  the approvals gate;
- proactive work on a schedule (a morning brief before you ask): the obvious next step for "always
  on", after v2;
- Windows, Linux, browsers other than the Chromium family (computer use's limit).

## 9. Later: bise with you everywhere (not v2)

The user's horizon, his words: "plus tard, … un agent always on avec une mobile app qui permet de
lui parler en plus de desktop. bise serait hosté sur un server. tout le monde pourrait se faire un
compte et avoir bise avec soi tout le temps."

- **Hosted bise.** Main and its agents run on a server, always on, even when the Mac sleeps.
  Anyone makes an account and has their own bise.
- **Mobile and desktop.** A phone app to talk to main (hold to talk, the cards, the pages), next to
  the Mac capsule. The same thread everywhere, like the terminal and the capsule today.
- **Pages from anywhere.** A page is a URL behind your account, readable and annotatable on the
  phone; sharing a page with someone becomes possible.

What v2 does now so this stays cheap later:
- the capsule and the page server talk to the hub through its protocol only (the hub socket today,
  a network connection later), never through files or the hub's insides;
- a page is addressed by its id and version through the page server, never by a file path; pages
  never assume `localhost` (relative URLs only), so they can be served by a hosted server;
- the session token on pages is the seed of an account's auth: one place checks it;
- notes, answers and `send` are hub messages, so a phone can send the same ones;
- what needs the Mac (the fn key, the screenshot, computer use in the user's browser) stays in the
  Mac app and the core; main asks for them, it never assumes them.
What v2 does not do for it: no server, no accounts, no sync, no phone.

## 10. Open (for the trio, then the user)

1. ~~The page format~~: decided, plain HTML with kit classes and `data-` attributes (§4,
   ambient-lead).
2. ~~The noun on screen~~: decided, **page** for everything an agent makes for you; the list of
   pages is "for you" everywhere (ambient).
3. ~~Who v2 is for~~: decided by the user (via main m_4812): v2 is for Gabriel's own work only,
   to validate the core UX; "on fait au plus simple … on le rendra disponible et commercial
   seulement si c'est un succès". No no-terminal install, signing, notarization or packaging for
   others until it proves itself; when a choice is between simple and ready-for-others, pick
   simple.

Nothing is open.
