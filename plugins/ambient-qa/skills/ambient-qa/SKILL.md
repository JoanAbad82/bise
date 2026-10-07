---
name: ambient-qa
description: QA of bise's product flows without the user's hands and without his accounts - throwaway hubs (scripted or with his model) on fake accounts (mail, Slack, Linear, calendar, GitHub, HN, Reddit, X, Bluesky, Kit), pages driven in a throwaway headless Chrome, asks to main measured, scripted product runs with a one-screen report, and bise desktop's QA world (a throwaway home with 2-3 seeded projects) that apps/desktop/tests drive. Load it when you (ambient, ambient-pm, ambient-lead, the desktop QA agents) check a flow, a page, main's answers or the desktop app's world.
---

# QA on throwaway hubs

Everything here runs on throwaway hubs with their own files under
`<bise dev dir>/qa/<your agent name>/` (one QA hub per agent: you never
drive another agent's), or, for the world, under `~/.bise/gate`. Nothing
here needs the user. The Swift app this plugin once drove (QA.swift's
socket, scenes, fn, keys, snapshots) is gone; bise desktop's own checks
live in `apps/desktop/tests` (its harness launches the Electron app, and
`checks/world.ts` / `checks/real.sh` call `qa.py world up|down|state|say`).

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

Never on your real work: since docs/issues/16 a hub takes a client's
hello only from a process the user started, never from an agent's, so
the real workspace is refused ("the real workspace needs a client the
user started"). QA runs on throwaway hubs (fake, model, or a world).

## Tools (`tools.ambient_qa.*`) and the same as one-line commands

The CLI is `python3 plugins/ambient-qa/qa.py <cmd>` from the repo root.
Every tool returns JSON.

| tool | CLI | what |
|---|---|---|
| `launch({hub})` | `qa.py launch [--hub fake\|model]` | a throwaway hub, its page server and the fake accounts. fake (default): tests/e2e.py's scripted provider, main answers `ack: <your words>`. model: the same with the user's configured model and keys (costs credits; main's real behavior on the fake accounts). Returns `pages_url` and the outbox file |
| `stop()` | `qa.py stop` | stop the throwaway hub (its own pids only) |
| `outbox()` | `qa.py outbox` | what the QA hub's main wrote to the fake accounts (drafts, sends, posts, issues, events) |
| `page_publish({file, id, edit, done, answers})` | `qa.py page publish [--file f.html] [--id x]` | the throwaway hub's main publishes a page (`sb page publish`): your file or amb-kit's weekly-update example; returns its URL |
| `page_notes({id, notes, send})` | `qa.py page notes --id x --notes '[...]' --send` | draft notes through the page's own API (token, origin), as notes.js does; `send` sends them to the page's agent |
| `page_meta({id})` | `qa.py page meta --id x` | versions, state, the notes and their status |
| `page_drive({id, steps, schemes})` | `qa.py page drive --id x --steps f.json` | the page in a throwaway headless Chrome (no logins, local only): your steps, 2x shots in light and dark |
| `page_fixture()` | `qa.py page fixture` | weekly-update at v1, four notes sent (note, voice, edit, unsure), then v2 marking one done, answering one, and moving the unsure one's block |
| `ask({texts, capsule})` | `qa.py ask "what's my next meeting" "plan the offsite" [--file asks.txt] [--no-capsule]` | asks to main on the running throwaway hub (`launch --hub model` first), one after the other, through a `bise ambient-core` child: main's words, their length, the time until all idle, the pages made or updated, the cards; asks-<time>.json |
| `tick()` | `qa.py tick [--n 1]` | the fake launch's next batch of comments comes in now |
| `run({scenario})` | `qa.py run weekly-update\|inbox\|offsite\|... [--keep]` | a scripted product run on a model hub with the fake accounts (costs credits); a one-screen report (see "Scripted product runs") |
| `world({do: "up"\|"state"\|"say"\|"feature"\|"down"})` | `qa.py world up [--projects 3] [--bise <path>]`, `world state`, `world say <project\|bise> "words"`, `world feature <project> <name>`, `world down` | bise desktop's QA world (below) |

## The world (bise desktop)

`world up` makes one isolated HOME under `~/.bise/gate` with bise's home
hub and 2-3 projects (telemetry, shop, docs), each its own fake-provider
hub, seeded by its fake main: agents in worktrees, a committed diff ready
to merge, an agent at work in a dirty worktree, cards with options, a
merge question, a blocked agent, an artifact, a message between two
agents, a question main answered for him (with why), a tool approval he
refused with a note in auto mode, receipts. `world state` lists each
hub's agents, commits, diffs, cards and socket; `world say` sends words
to that project's fake main (`[[bash: ...]]` scripts it); `world feature`
makes a real approval card. Always `world down` when done: it stops
every hub by pid. A world outside `~/.bise/gate`, or a value reaching his
hubs, is refused.

## Pages in a throwaway Chrome

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
   done, answered, moved).
4. `stop()` when done.

The `computer` plugin (the user's own Chrome, with his logins) is not for
QA: only when the user asks for that run himself.

## Scripted product runs

`qa.py run <scenario>` measures speed and the notes loop the same way
every time, on a model hub (your model and keys, throwaway state, costs
credits) with the fake accounts only:

| scenario | the ask |
|---|---|
| `weekly-update` | draft my weekly update from Slack and Linear |
| `inbox` | go through my mail, draft replies, don't send |
| `offsite` | plan the offsite: the venue we decided, the budget, and an agenda for the two days, from my mail and Slack |
| `launch-watch` | watch the launch until tomorrow, tell me what needs an answer (no notes: after v1 it ticks once, the page must republish with the new comments that need an answer; any write or a card not about such a comment fails) |
| `morning` | make today's morning page (roadmap E: first a scripted hub seeds the night with no credits: fix-csv done with PR #241, a cookie-banner question card, the inbox review with unsent replies, the domain plan with his steps, the launch watch and its 30 min timer; then the model hub reuses that state with the `today` set: meetings 15, 60 and 150 min after the hub's start, Granola notes, people.md. Checks: id `morning-<today>`, no review, question or sources, 5 headings at most, every line outside the meetings links to `/p/<page>#<item>` or https, each meeting's brief 3 lines at most, all three meetings and the night's five items there, outbox empty) |
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
Code?"). Batch 0 is there at the hub's start; `tick()` brings the next
one now (else every 30 min of hub time, AMBIENT_QA_TICK_MIN), and points,
rank and likes move with each batch. Links are the real places'
(news.ycombinator.com/item?id=, reddit /r/<sub>/comments/<id>,
x.com/<user>/status/<id>, bsky.app/profile/...).

The ask goes through a `bise ambient-core` child (text only: no mic, no
voice). It records the time to the page's first appearance (`sb page
start`) and to v1, v1's blocks, then posts 3 scripted notes over the page
API (make this shorter / drop this part / where does this number come
from), sends, and records the time to v2 and each note's outcome; the
outbox (a send on `inbox` fails the run; drafts are fine); main's line
and its length (over 120 characters fails); cards that showed. Output in
`<qa dir>/out/runs/<scenario>-<time>/`: `run.json`, `report.txt` (one
screen), the page bodies. It stops the hub it started unless `--keep`.
The report names the build: a tree behind ambient-app prints a WARNING
(a fail may be the stale build); `--require <sha>,<sha>` refuses a tree
that lacks those commits. One run at a time: it uses your QA dir's hub.

## The heavy lock

`qa.py world up` takes `~/.bise/run/heavy.lock` itself only around a
helpers build that will compile (scripts/bins.sh, stale helpers); with
built helpers and an existing bise it never waits on the lock (main
m_10008: the lock is for cargo builds and gates only). It skips the lock
when it already runs under a `lockf ... heavy.lock` of its own ancestry,
so don't wrap `world up` in the lock yourself (a `lockf -k heavy.lock
qa.py world up` once waited on itself and held the lock for everyone,
main m_9310).

## Limits

- One throwaway hub per agent; a `model` hub costs credits.
- The core's mic, listener and voice are not exercised (amb-core's tests
  cover those); asks reach main as typed text.
- No app here: the desktop app's windows, keys and shots are
  apps/desktop/tests' (its harness, on fake cores or on this world).
