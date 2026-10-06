---
name: ambient-qa
description: QA of bise ambient.app without the user's hands - launch the real app on a throwaway scripted hub, play every SPEC §2 state and get a contact sheet, drive fn, fn + keys and a fake voice that reaches a fake main, read the capsule's model and events, and take PNGs of the capsule and the screen. Load it when you (ambient, ambient-pm, ambient-lead) review a slice of the ambient app, check the UI against SPEC.md, or check an interaction or a flow.
---

# QA of bise ambient.app

The app is the real one (`<bise dev dir>/build/ambient/bise ambient.app`,
built by `scripts/ambient.sh` from the repo the plugin lives in), launched
in QA mode (`--qa fake|real`): a second instance with its own files under
`<bise dev dir>/qa/<your agent name>/` (one QA app, hub and socket per agent: you never drive another agent's app) and a control socket. Nothing here needs the user.

**The user's rule: no test, QA or demo touches his real accounts** (Gmail,
Outlook, Slack, Linear, calendar, any connector, read or write, and his
browser through computer use), unless he asks for that one run himself.
Every QA hub has fake accounts instead: `tools.gmail.*`, `tools.slack.*`,
`tools.linear.*`, `tools.calendar.*`, `tools.github.*`, `tools.hn.*` over
canned items (Camille, ops at acme: 20 mails of her day with a few to
answer, newsletters and a thread where the offsite venue gets decided;
Slack #team and #launch with the launch numbers; 5 Linear issues; today's
meetings; the repo's stars and traffic; a Show HN at #7), dated on the
hub's today (FAKE_ACCOUNTS_TODAY pins it), whose writes (drafts, sends,
posts, issues, events, comments) only land in the hub's outbox
(`outbox()`). Real connectors and the computer plugin are refused
unless `real_accounts_approved_by_user=<the user's own message id>`: never
set it on your own.

What QA mode never does: open the mic (the voice is faked inside the app),
play a sound, capture the user's screen, post a macOS notification, take
the keyboard focus, open a URL, ask a permission, listen to the real fn,
or talk to the user's real main. The capsule does show on the screen while
QA runs (top right, like the real one).

## Tools (`tools.ambient_qa.*`) and the same as one-line commands

The CLI is `python3 plugins/ambient-qa/qa.py <cmd>` from the repo root.
Every tool returns JSON; PNG files are written under
`<bise dev dir>/qa/out/` (the paths are in the result).

| tool | CLI | what |
|---|---|---|
| `launch({hub})` | `qa.py launch [--hub fake\|model\|real]` | fake (default): a throwaway hub, tests/e2e.py's scripted provider: main answers `ack: <your words>`. model: the same throwaway hub and workspace with the user's configured model and keys (costs credits; main's real behavior on the fake accounts, never the real main or his accounts). real: your workspace, read-only (nothing is ever sent). The result names the bise, its tree, the tree's commit and `behind_ambient_app` |
| `scenes({only, backdrops, at, reduce, tokens, screen_h})` | `qa.py scenes [--only talk,needs] [--backdrops dark,bright,busy] [--reduce-motion] [--tokens f.css] [--at 400,1200]` | plays each scene in the app, shoots each moment, returns contact sheets (panel, and the screen's top 300 px; `screen_h: 0` = the whole screen) |
| `frames({scene, every, span})` | `qa.py scenes --frames talk --every 80 [--span 0,2000]` | a strip of panel frames for the motion (springs, the lean-in, the needs-you edge); each file says when it was really taken (`taken_ms`) |
| `look({tokens, reduce})` | `qa.py look --tokens f.json --reduce-motion on` | another look for what follows: a tokens file (`.css` as is, `.json` `{name: value}` as `:root --name`), kept across reloads; `tokens: ""` = the app's own |
| `list_scenes()` | `qa.py list` | the scene ids and their SPEC §2 states |
| `say({text})` | `qa.py say "words"` | hold fn, the words heard one by one with a voice level, let go: sent to the fake main; waits for main's answer, then "speaks" it word by word. Returns main's text |
| `fn({state})` | `qa.py fn down\|up\|tap\|double\|cancel` | fn through the app's real key path (glow, fake shot, talk) |
| `key({k})` | `qa.py key 1` | fn + key: `space` `1`-`9` `i` `0` `o` `.` `enter` `esc` |
| `inject({ev})` | `qa.py inject '{"ev":"phase","phase":"working"}'` | any contract event (docs/ambient-app.md §4), core or `app_*`/`ui_*` |
| `snapshot({what, backdrop, name})` | `qa.py snapshot --what both --backdrop busy` | `panel`, `screen`, `web` or `both` |
| `state()` | `qa.py state` | the web UI's `model` and `view` (size, pose, words, chips, perm, pane) and the app's side (panel frame, shape, hidden, glow) |
| `events({n})` | `qa.py events 40` | the last events in and out, levels left out |
| `play({events, shots, name})` | - | your own timeline `[[ms, ev], ...]`, shots `[{at: ms, what}]` |
| `reset()` | `qa.py reset` | the capsule starts over, shown |
| `outbox()` | `qa.py outbox` | what the QA hub's main wrote to the fake accounts (drafts, sends, posts, issues, events) |
| `page_publish({file, id, edit, done, answers})` | `qa.py page publish [--file f.html] [--id x]` | the throwaway hub's main publishes a page (`sb page publish`): your file or amb-kit's weekly-update example; returns its URL |
| `page_notes({id, notes, send})` | `qa.py page notes --id x --notes '[...]' --send` | draft notes through the page's own API (token, origin), as notes.js does; `send` sends them to the page's agent |
| `page_meta({id})` | `qa.py page meta --id x` | versions, state, the notes and their status |
| `page_drive({id, steps, schemes})` | `qa.py page drive --id x --steps f.json` | the page in a throwaway headless Chrome (no logins, local only): your steps, 2x shots in light and dark |
| `page_fixture()` | `qa.py page fixture` | weekly-update at v1, four notes sent (note, voice, edit, unsure), then v2 marking one done, answering one, and moving the unsure one's block |
| `menubar({states, frames, count})` | `qa.py snapshot --menubar [--states work,need] [--frames 12] [--count 3]` | the menu-bar item (the 18 px pearl) in each state (still, work, need+N, away ☾, done, fail ▲, listen) through amb-mac's StatusItem: its own composed image at 1x/2x, transparent and on light/dark menu-bar strips, and a sheet |
| `pearl()` | `qa.py pearl` | every pearl frame amb-mac plays, per mood, at 1x and 2x |
| `launch({hub, no_app: true})` | `qa.py launch --hub fake\|model --no-app` | the throwaway hub, its page server and the fake accounts only (pages, notes, outbox checks): never builds or opens the app; returns `pages_url` and the outbox file; `page_*`, `outbox` and `stop` work on it |
| `ask({texts, capsule})` | `qa.py ask "what's my next meeting" "plan the offsite" [--file asks.txt] [--no-capsule]` | asks to main on the running throwaway hub (`launch --hub model --no-app` first), one after the other, through a core like the capsule's: main's words, their length, the time until all idle, the pages made or updated, the cards; asks-<time>.json |
| `run({scenario, headless})` | `qa.py run weekly-update\|inbox\|offsite [--headless] [--keep]` | a scripted product run on a model hub with the fake accounts (costs credits): the ask through the core, then times, notes, outbox; a one-screen report (see "Scripted product runs") |
| `stop()` | `qa.py stop` | quit the QA app and the fake hub |

## The pictures: what is real and what is composited

- The capsule's content (tint, strokes, orb, words, chips, the needs-you
  note) is the app's own WKWebView, drawn by WebKit, at the screen's scale
  (2x on a Retina screen).
- The glass behind it is **composited**: the backdrop blurred (44) and
  saturated (1.9) under the page's two rounded boxes, a dark layer for the
  `.hudWindow` material, the shadow `0 30 80 -24 #000b`. macOS 26 gives an
  app no image of its own windows, and ScreenCaptureKit needs Screen
  Recording and draws the blur flat. Judge the glass's legibility from
  these shots; judge the exact blur on the real screen with the user.
- The backdrop is synthetic: `dark`, `bright`, `busy` (colors, shapes and
  small dark and light text), `none`, or a picture file path. Never the
  user's screen.
- `screen`: the backdrop, a plain menu bar, the capsule at its real place,
  and the edge overlay (the glow, the pink corners) when it shows.
- Names: `<scene>.<backdrop>@<seconds>s.panel.png` (and `.screen.png`,
  `.web.png`): the seconds are the time into the scene.

## How to QA a slice

1. `launch()` (fake hub). Check `hub_up: true` in the result.
2. `scenes()` for the whole SPEC §2 pass, with `backdrops: ["dark",
   "bright", "busy"]` when you judge the glass. Open the sheets
   (`sheets[]`) and each scene's PNGs. Compare each state with SPEC.md
   §2 (size, orb, words) and the mocks.
3. A moment that matters: `play` the scene's events with `shots` at the
   ms you want (`list_scenes`, then your own `at`), or `scenes({only:
   ["talk"], at: [400, 1200, 2000]})`.
4. The flows, through the real key path: `say("...")` (hold fn → words →
   send → main answers → spoken), `fn("double")` hands-free, `key("1")`
   on a card, `key("space")` then `inject({ev: "ui_spot_type", text})`
   and `inject({ev: "ui_spot_send"})` for the spotlight, `key(".")` to
   hide. After each step: `state()` (what the model decided) and
   `snapshot()`.
5. Cards on the fake hub: say `[[bash: sb ask-user "keep the banner on
   mobile?" --options "yes|no"]]`-style scripts to main, or inject a
   `state` event with `cards`.
6. Reduced motion: `inject({ev: "app_reduce_motion", on: true})`; the
   `still` scene plays a whole turn with it.
7. `stop()` when done.

Read-only on your real work: `launch({hub: "real", workspace: ...})`
shows your real agents and cards; nothing you do reaches main.

## Pages in a throwaway Chrome

The capsule's side of pages (`page-ready`, `page-updating`, `page-fn-o`,
`page-front`, `for-you` scenes) plays here; QA mode logs the URL it would
open (`events`: `qa_open_url`) instead of opening it. The page itself:

1. `launch()`, then `page_fixture()` (or `page_publish(...)`): the page
   on the throwaway hub's page server (127.0.0.1).
2. `page_drive({id, steps, schemes: ["light", "dark"]})` (CLI: `qa.py page
   drive --id weekly-update --steps steps.json`): a throwaway headless
   Chrome (its own profile, no logins, deleted after; local URLs only,
   never the user's browser) runs your steps: `{eval}` (read the DOM, the
   notes' state), `{mouse: [x, y], click}`, `{key}`, `{type}` (select,
   note, edit, send like the user), `{wait}`, `{shot: "name"}` (2x PNGs,
   once per color scheme). `/p/<id>/v/1` and `/v/2` give each version.
3. Check the result with `page_meta(id)` (the notes' status: open, sent,
   done, answered, moved) and `events()` (the core's `page` events
   reaching the capsule).

The `computer` plugin (the user's own Chrome, with his logins) is not for
QA: only when the user asks for that run himself.

## Scripted product runs

`qa.py run <scenario> [--headless]` measures speed and the notes loop the
same way every time, on a model hub (your model and keys, throwaway
state, costs credits) with the fake accounts only:

| scenario | the ask |
|---|---|
| `weekly-update` | draft my weekly update from Slack and Linear |
| `inbox` | go through my mail, draft replies, don't send |
| `offsite` | plan the offsite: the venue we decided, the budget, and an agenda for the two days, from my mail and Slack |
| `launch-watch` | watch the launch until tomorrow, tell me what needs an answer (no notes: after v1 it ticks once, the page must republish with the new comments that need an answer; any write or a card not about such a comment fails) |
| `morning` | make today's morning page (`--headless` only; roadmap E: first a scripted hub seeds the night with no credits: fix-csv done with PR #241, a cookie-banner question card, the inbox review with unsent replies, the domain plan with his steps, the launch watch and its 30 min timer; then the model hub reuses that state with the `today` set: meetings 15, 60 and 150 min after the hub's start, Granola notes, people.md. Checks: id `morning-<today>`, no review, question or sources, 5 headings at most, every line outside the meetings links to `/p/<page>#<item>` or https, each meeting's brief 3 lines at most, all three meetings and the night's five items there, outbox empty) |
| `meetings` | brief me before my meetings today, and do the follow-ups after (real time, about 75 min: the `today` set puts the Northwind renewal 15 min after the hub's start, its Granola notes at 47, the team sync at 60; the hub's own timers fire, nothing is ticked. Checks: a brief page `meeting-<slug>-<date>` for each before its start, with a checklist of what is open, 3 questions in a prose `<ol>` and a link to last time; the renewal's v2 within 30 min of its end with his rows `data-who="yours"`, an email or message draft and Granola's decisions (3-year, SSO, 45 seats); no card about a meeting; outbox empty. run.json lists the `sb every` timers main set) |

Roadmap A's inputs: a fake `tools.kit.*` (subscriber_count 1204,
list_broadcasts, broadcast_stats, create_draft → a draft url, written to
the outbox as kind `kit-draft`; no send tool), `tools.github.list_releases`
(v2.5.0's notes for the newsletter), Lélio's Slack thread in #ops asking
for a written summary to HR by mail, and Benjamin's DM (`@benjamin.roy`)
asking how to install the CLI. Every outbox line has a `kind`
(`gmail-draft`, `kit-draft`, `slack-post_message`...). Roadmap C: #acme-feedback
holds Benjamin's three reports. Slack messages carry their permalink.

The launch (roadmap B) lives in the fake `tools.hn.*`, `tools.reddit.*`,
`tools.x.*`, `tools.bluesky.*` (the real plugins' tool names, read-only):
acme's Show HN, r/SaaS post, X and Bluesky posts, 19 comments in three
batches (questions, bugs, praise, spam, one "does it work with Claude
Code?"). Batch 0 is there at the hub's start; `tick()` (`qa.py tick`)
brings the next one now (else every 30 min of hub time,
AMBIENT_QA_TICK_MIN), and points, rank and likes move with each batch.
Links are the real places' (news.ycombinator.com/item?id=, reddit
/r/<sub>/comments/<id>, x.com/<user>/status/<id>, bsky.app/profile/...).

The ask goes through a core like the capsule's (the QA app's own; with
`--headless` a `bise ambient-core` child, text only: no mic, no voice).
It records the time to the page's first appearance (`sb page start`) and
to v1, v1's blocks, then posts 3 scripted notes over the page API (make
this shorter / drop this part / where does this number come from), sends,
and records the time to v2 and each note's outcome; the outbox (a send on
`inbox` fails the run; drafts are fine); main's capsule line and its
length (over 120 characters fails); cards that showed. Output in
`<qa dir>/out/runs/<scenario>-<time>/`: `run.json`, `report.txt` (one
screen), the page bodies. It stops the hub (and app) it started unless
`--keep`. The report names the build: a tree behind ambient-app prints a
WARNING (a fail may be the stale build); `--require <sha>,<sha>` refuses
a tree that lacks those commits. One run at a time: it uses your QA dir's hub.

## The heavy lock

`qa.py world up` takes `~/.bise/run/heavy.lock` itself (for its bins
build and the hubs' start), and skips it when it already runs under a
`lockf ... heavy.lock` of its own ancestry. Never wrap a command that
takes the lock in a second take of it: before that check, a
`lockf -k heavy.lock qa.py world up` waited on itself and held the lock
for everyone (main m_9310). `qa.py real t1`, `t1-setup` and `try-proof`
do not take it: the caller wraps them, once.

## Limits

- Main never really speaks: the voice out is played by the app from
  main's text (290 ms per word), like the core's timing, no audio.
- The words you `say` reach main as a typed `send` with the voice flag
  set by QA; the core's mic, listener and image marker are not exercised
  (amb-core's tests cover those).
- The menu-bar `:*` and the macOS notifications are off in QA mode.
- One throwaway hub per agent; a `model` hub costs credits.
