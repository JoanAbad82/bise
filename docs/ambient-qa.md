# bise ambient v2: product QA, per slice

Owner: ambient-pm (the flows against [ambient-vision.md](ambient-vision.md)). ambient checks the
look against its SPEC; this file checks that each interaction really works, end to end, as the user
lives it. A slice is done only after this pass is green (the user's rule, via ambient-lead m_4750).
Failures go to ambient-lead, one line each: the step, what i did, what i saw, what the vision says.

**The rule (the user, via main m_5199, 2026-10-02): no QA run touches the user's real accounts.**
No Gmail, Outlook, Slack, Linear, calendar or any real connector, read or write, and no computer
use in his browser on his accounts, unless he explicitly asks for that one run. QA runs on fake
connectors and fixture data only (a fixture mailbox for job 2, fixture threads for job A, fixture
comments for the watch). Never `--connectors` or `--computer` on a QA hub. A checklist line below
that names his mail, Slack or Gmail means the fixture of it.

How: a real hub on a throwaway workspace (never the user's pages), the pages in Chrome through
computer use (open, read, click, type, screenshot), the hub's side through `sb page list|notes` and
the agents' threads (`sb inspect`). The capsule's steps wait for the `ambient-qa` plugin; until then
they are checked through ambient-core's events (`page`, `state.pages`), marked **(core)**.
Each run writes its results under `$TMPDIR/qa/<slice>-<date>/` (screenshots, the notes JSON).

## Slice 1: the page loop (plan: [ambient-pages.md](ambient-pages.md))

### 0. The done-when (vision §8), run last, whole

- [ ] With the TUI closed: hold fn (or spotlight) "draft my weekly update from Slack and Linear".
- [ ] Main says it's on it; an agent (or main) makes a **doc page** with sources, without asking me
      to pick a format.
- [ ] The page opens in front, because I was waiting for it, in a Chromium tab.
- [ ] I leave 3 notes (one typed on a block, one on a selection, one edit in place); `send`.
- [ ] v2 lands **in the same tab**, no new tab, scroll kept; the 3 notes show done (or answered).
- [ ] At no point did I need the terminal, a file path, a port or a command.

### A. Ask → a page (main's rule, §3 B)

- [ ] A long or structured ask (an update, a comparison, a plan) gives a page, not a wall of text
      in the capsule.
- [ ] A short ask ("what time is my next meeting?") gives a sentence, **no** page.
- [ ] A draft of something that leaves (a mail, a post) gives a page.
- [ ] The agent loads `bise-pages` and publishes with `sb page publish`; the page passes the lint
      on the first or second try (a lint failure is fixed by the agent, never shown to me).
- [ ] Every fact on the page has its source (a link to the Slack thread, the Linear issue); a fact
      with no source says so.
- [ ] The page's words follow the brand: lowercase chrome, short; the content in my language.

### B. Show

- [ ] "for you" (the capsule) **(core)** lists the page: title, newest first, `<page> is ready ·
      fn + o` when I wasn't waiting.
- [ ] fn + o opens the page; fn + o again brings the **same** tab forward (no second tab).
- [ ] A page I was waiting for opens in front without fn + o; a page I wasn't waiting for never
      steals focus.
- [ ] No Chromium browser running: the page opens with `open` in the default browser (a new tab:
      accepted for slice 1).
- [ ] `/` on the page server is "for you": the same list as the capsule, each row opens its page.
- [ ] The frame on top: the name with spaces (`weekly update`), `v1 · just now` (ages right after a
      few minutes), the notes count, `send`.
- [ ] The page reads fine with JS off (the fragment alone).

### C. React (the note layer v1)

- [ ] A typed note on a block: anchored to it, in the side list (`notes for weekly update · 1`).
- [ ] A typed note on a text selection: anchored to the quote.
- [ ] ♡ keep, ✗ drop, ~ not sure on a block: each one is a note in the list.
- [ ] Edit in place on prose: becomes a note `you changed …`; undo takes it back (and removes it
      from the list).
- [ ] Delete a draft note before sending: gone from the list and from `sb page notes`.
- [ ] Reload the tab before sending: every draft note is still there (never lost).
- [ ] Close the tab, reopen from "for you": the drafts are still there.
- [ ] The send bar says the count: `3 notes for weekly update · or just say "send"`.
- [ ] ⌘⏎ sends; the click sends; with 0 notes, send does nothing (no empty message to the agent).

### D. Iterate (notes → v2)

- [ ] After `send`: `sent. weekly update is on it.`; the frame says `weekly update is updating this
      page…`.
- [ ] The agent's thread got **one** message: readable lines + the `page-notes` block, the right
      page id and version, every note with its block, quote and kind, the edit's before/after.
- [ ] The agent publishes v2 with `--notes-done` / `--note-answer`; it doesn't reply in prose
      instead.
- [ ] The open tab swaps to v2 by itself: no reload, scroll kept, `v2 · just now`.
- [ ] Each v1 note shows `✓ done`, the agent's one-line answer, or still open, as the agent said.
- [ ] A note whose block or quote is gone in v2 shows `moved`.
- [ ] My edit in place is kept as I wrote it in v2 (unless my note asked otherwise).
- [ ] `what changed` highlights exactly the blocks whose text changed, and nothing else; off by
      toggle.
- [ ] v1 is still one click away and shows v1's text.
- [ ] Notes on v2 + send again: the loop runs a second time (v3), the old notes stay resolved.
- [ ] The agent's turn ends without publishing: the frame goes back to ready, the notes stay `sent`
      (not lost, not shown as done).
- [ ] The page's agent is gone (done, dropped): send goes to main, main answers (takes the page
      over or starts an agent), and the page still gets its v2.
- [ ] Another agent can't publish over this page (`--id` of someone else's page is refused).

### E. Act (slice 1: the minimum)

- [ ] "post it in #team" (by voice, on the page): goes through the approvals gate (a card), never
      posts silently; after approval, `posted in #team.`

### F. Safety (vision §4, §7)

- [ ] The page can't load anything from outside (CSP): an outside image or script in a fragment is
      refused by the lint; links to sources open fine.
- [ ] `POST /api/p/<id>/send` from another origin, or without the token: 403, nothing sent.
- [ ] The server listens on 127.0.0.1 only; the port is the same after a hub restart.
- [ ] The pages live in the workspace's state dir, never in the repo (`git status` clean).

### Results: slice 1, pass 1 (ambient-lead's real run, `launch-recap`, Chrome via computer use)

Pass: the CSP and nosniff headers; `send` without the token or from another origin: 403; "for
you" at `/`; the frame (title, version and age, `what changed`, the previous version, `send`
disabled at 0); `what changed` marks the changed blocks; `t` on a hovered block → note → side list
→ send bar `1 note for launch recap · or just say "send"` → ⌘⏎ → `sent. launch recap is on it.` +
`updating` → v3 swapped in place, scroll kept, the note `✓ done` and the table really changed;
older versions reachable (`v2 of 3 · see the latest`); v2 18 s after send; the agent asked back on
an ambiguous note instead of guessing.

Fail (sent to ambient-lead m_4910, m_4928; amb-web m_4929):
1. the frame and "for you" show the kebab id (`by launch-recap`, `launch-recap is updating this
   page…`), not the name with spaces;
2. the draft he came for is a monospace block that doesn't wrap (lines cut at the right edge) and
   can't be edited in place;
3. the note input opens over the next block;
4. a bare `0` beside `send`;
5. v1 in 100 s (target 90);
6. the toolbar (note · ♡ · ✗ · ~ · edit) only shows on a text selection, never on block hover;
7. `edit` is unreachable (only offered without a quote, but the toolbar needs a selection);
8. nothing tells you that selecting text gives ♡ ✗ ~.

Main's rule, the other way (ambient-lead on the same hub, m_4940): "how many stars do we have?" →
one sentence in 10 s, no page; "is the HN post on the front page?" → a short answer in 12 s, no
page. Pass, with a caveat: that build predates b1ed8fe; recheck on the next real run.

Not verified yet: drafts surviving a reload, selection notes, the capsule side (`qa.py launch` can't start its fake hub from an agent shell).

### Results: slice 1, pass 2 (build 0bcfd610: kit 21c81232 + web 1213df8d)

My own done-when run first, through amb-tools' `qa.py launch --hub model` (real model, the QA
capsule, a fake voice): said the ask → main answered in 28 s → `launch-recap` started → the page
event 83 s after the ask with `front: true` → opened at once; in `state.pages`. Fail (9): main's
capsule words were 3 capitalized sentences with the kebab id (routed: amb-core tags capsule input,
amb-kit adds the one-short-line rule). That run served an older kit (amb-home's tree).

Then ambient-lead's run on the new build, in Chrome. Pass: 1-4 and 6-8 of pass 1 (names with
spaces, the draft in prose and wrapped, the toolbar on block hover with `edit` on prose, the
composer no longer covers a block, the empty count hidden); edit in place becomes a note; a typed
note and an edit both survive a reload; ⌘⏎ → v3 in place with my edit kept as written and my note
done (the line really cut).

Fail (sent to ambient-lead m_5008):
10. an answered note whose block was removed shows only `moved`: the agent's answer (a question
    back to me) is never shown;
11. an insertion reads `you changed "" → "(or not)"`: show the words around it;
12. after v3, my kept edit shows `moved` instead of done;
13. v1 in 126 s (target 90): no skeleton was published (fix: `sb page start`, `bise-pages` for
    every agent).

Slice 1 holds its done-when except speed and 10-12.

## Slice 2: talk to the page, the inbox, questions in two places ([ambient-pages.md](ambient-pages.md) §4)

### 0. The done-when, run whole

- [ ] "go through my mail" (a throwaway mailbox or read-only on his) → a review page; I hold fn
      over two items and say a note on each; I approve three, skip one; "send" by voice → the
      replies go out only through the gate (a card per send in auto), the page shows each item's
      outcome. Nothing sent without an approval.

### A. Voice notes at the mouse (§4.1)

- [ ] fn held with a bise page in front: the pin appears where the mouse is, `you · voice · 0:04`
      fills live with my words; no screenshot is taken; main's thread gets **nothing**.
- [ ] fn held with any other page or app in front: a normal talk to main (the shot, the chip).
- [ ] The capsule says `voice note on <page>` while it listens; the edge glow stays.
- [ ] fn + esc while holding: the pin goes away, no note.
- [ ] Saying only "send" (or "envoie") on the page sends the notes, same as ⌘⏎; "send" inside a
      longer sentence is a note, not a send.
- [ ] The voice note anchors to the block under the mouse and survives v2 like a typed note.

### B. Questions in two places (§4.2)

- [ ] A page's `question` block makes one card in the capsule (`? <page> needs you`, `open it`).
- [ ] Answer on the page → the card is gone from the capsule and the TUI; the page shows the answer.
- [ ] Answer with fn + 1 in the capsule → the page shows the answer (live, no reload).
- [ ] Answer in both places quickly: one answer wins, the other side shows it; never two answers.
- [ ] `open it` / fn + ⏎ opens the page at that question.

### C. The inbox: review and email (§4.3)

- [ ] Each item: what it is, the drafted reply, approve / edit / skip; an edited reply is sent as
      edited.
- [ ] `approve 5` says its count and leaves out the items I edited or struck.
- [ ] After send: each approved reply reaches the gate as a send (auto: a card each, or one card
      for the batch, never silent); skipped items are not touched.
- [ ] The page's v2 shows each item's outcome (`sent`, `skipped`, `draft kept`).

### D. Versions (§4.4)

- [ ] `v3 ▾` lists the versions with their age; an old one opens read-only with `back to the
      latest`; notes can't be added on an old version (or they go to the latest, said so).
- [ ] `what changed` compares with the version just before.

### E. The tab group (§4.5)

- [ ] With the extension: the page opens in the `bise` tab group of my window, reuses its tab; no
      tab in an agent's group. Without it: the AppleScript/`open` path still works.

### Results: fake accounts, real model (2026-10-02, tip; amb-tools' canned Camille mailbox, Slack, Linear)

Pages driven in a throwaway headless Chrome (`plugins/ambient-qa/pagedrive.mjs`), never his.

- **Slice 1 done-when, "draft my weekly update from Slack and Linear": pass.** A skeleton
  (`writing…`) ~27 s after the ask, the filled page ~77 s (target 90): a Slack message draft for
  #team, 14 sources, a table of the OPS issues, two callouts, a question. Three notes (typed, ♡,
  an edit) → ⌘⏎ → the next version 15 s later (target 45), all three done, the dropped line
  really gone, my edit kept. The outbox stayed empty.
- **Job 2, "go through my mail and draft replies, don't send": content pass, two fails.** Seven
  replies, each with a `why` line and `[brackets]` where only he knows, plus a `skipped` table with
  the reason for each mail, from 20 mails read. Fail 20: the agent wrote 7 Gmail drafts by itself
  (7 × `create_draft` in the outbox) before any review. The vision's order is review on the page,
  then `put it in my drafts` on his word (owner: the `bise-pages` guide and main's rule). Fail 21:
  the filled page came at ~103 s (target 90).
- Still open: 9 (main's capsule words); the page question → card wasn't checked (the app was
  stopped to keep the run light).

Kit fixtures (fake hub, headless): pass for approve and skip, `approve N` counting down, compare
♡ ✗ pick, checklist ticks, the message block's copy. Fails 14-18 (edit on a review item edits its
header, `approve N` counts edited items, a question option doesn't answer, ♡ copies the whole
variant, no `open #channel`), all routed; 14, 15, 17 and 18 are fixed, 16 has a fallback note.

## The look the user validated: round 8 (main m_5134)

ambient owns the pixels against `site/content/ambient/identity8.html` and its SPEC; these are the
product checks, through `qa.py scenes` and `snapshot`:

- [ ] The capsule is direction A's glass: dark smoked glass, white text, bise pink `#f4a6b0` as the
      only accent; no constellation orb anywhere: the pink mist pearl is bise's body.
- [ ] The pearl's moods read at a glance and match the state: at rest, listening (follows my
      voice), working, needs you (one nudge, then still), done (a nod), failed (still, no joke),
      reduced motion (still).
- [ ] The menu-bar states match round 8: idle, working, a count, needs you.
- [ ] The pages' frame and note layer use the same pink and the same glass for bise's own chrome,
      so the capsule and a page feel like one app.

## Out of the way (vision §3 G, the user's change m_5030)

- [ ] At rest, after launch: nothing on screen but the menu-bar icon (no idle capsule).
- [ ] Agents working, nothing for me: the icon moves quietly; no capsule appears by itself.
- [ ] A question arrives: the needs-you glass shows once, then folds away; the icon shows the
      accent and the count goes up by one; fn + 1 answers it without the capsule; the count goes
      down.
- [ ] A page lands that I didn't wait for: the count goes up, no capsule; fn + o opens it and the
      count goes down.
- [ ] Hold fn: the capsule shows; let go; bise answers; it fades a few seconds after the answer
      ends (after the voice when it speaks).
- [ ] fn + . (or a click on the icon) while agents work: the capsule hides and stays hidden
      through new agents, done lines and pages; only my fn or a needs-you brings it back.
- [ ] A click on the icon opens the full view (running, needs you, for you); esc or a click
      elsewhere closes it.
- [ ] The count = questions + approvals + pages not opened yet, the same number everywhere (icon,
      full view).

## Job slice A: drafts where they live ([ambient-roadmap.md](ambient-roadmap.md) §2 A)

- [ ] "write Lélio the mail he asks for in the #rh thread" → an email page with the Slack thread
      as its source; the draft is prose, editable.
- [ ] "put it in my drafts" (said on the page or the frame's button) → in Gmail drafts, **no card**;
      the frame says `in your Gmail drafts · open`, the link opens that draft.
- [ ] v3 after more notes updates **the same** Gmail draft (one draft in Gmail, not two).
- [ ] The Gmail connector fails → one line `Gmail didn't take it. copy · try again`; copy gives
      rich text; never a file path.
- [ ] A Slack message page: `copy` + `open #channel` (slack:// link), the frame says `copied ·
      open #team`; nothing posted.
- [ ] A Kit newsletter page → `put in Kit` makes a Kit draft, never sends.

## Job slice B: watch for me (§2 B)

- [ ] "watch the launch until tomorrow" → a review page that updates by itself (a new version on
      each check that found something; none when nothing changed), the frame says `watching ·
      checked 3 min ago · until …` and `stop`.
- [ ] No agent turn between checks (the hub timer wakes it); `stop` ends the watch at once.
- [ ] A card only for what I asked to be told; everything else waits on the page; numbers sit in
      the header.
- [ ] Approve a reply → its thread opens in my browser with the reply prefilled where the site
      allows, else copied; nothing is ever posted by bise.
- [ ] At `--until`, the watch stops by itself and says so once.

## Slice 3 (outline)

- The home workspace without a repo: `bise ambient` with no repo works; no repo, PR, branch or
  worktree word on any surface.
- Job 3, the offsite: compare (♡ ✗, pick 1-3), question, checklist (tick, "add …" by voice); the
  page grows over days, notes from day 1 still resolved right on day 3.
- Export a page (Google Doc, mail, Slack) through the gate.
- Drawing on a page; a drawn note sends a screenshot with it.
