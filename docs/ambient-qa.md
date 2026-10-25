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

- [ ] A typed note on a block: anchored to it, in the side list (`notes · 1`).
- [ ] The side list folds: its head or `l` folds it to a pill `notes · 1 ▸`, the pill or `l` opens it; a reload keeps the fold; an agent's answer or a ✓ done opens it; on a wide window it sits right of the text, never over it.
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

Pages driven in a throwaway headless Chrome (`dev/plugins/ambient-qa/pagedrive.ts`), never his.

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

Rechecks at the tip (after 038fc00b, 2ffdf1f2, 03821a37 and amb-core's main-words fix):
`qa.py run inbox --headless` on fake accounts **passes**: something on the page at 10 s, review
items at 34 s (21 fixed), main's capsule line short and clean (9 and 22 fixed), the next version 14
s after notes, the outbox empty (20 fixed). Question 16 on a page by main: the option is marked,
`/answer` returns 409, and the fallback pick note lands in the side list; the answered state on
the page with an open card (a task agent's page) is not checked yet.

### Results: 2026-10-03, after midnight (headless, model hubs on fake accounts)

- **16 fixed** (527fa441): the first pick on a page's question → `/answer` 200 → the page shows the
  answer.
- **Main's "page or one line" rule** (`qa.py ask`): pass. The four short asks got one line and no
  page in 5-14 s; the four page asks each made a page with a one-line capsule reply. Fails 23
  (times in UTC, not his zone) and 24 (a follow-up made a second page) went to amb-kit; fixed in
  c535c7ce, not rechecked yet.
- **The skill trim** (a9338abc): v1 at 26 s instead of 77 s. It lost the message block for the
  Slack draft; fixed in c535c7ce and rechecked: `heading message callout callout sources`, v1 at
  24 s, the next version 26 s after notes, the outbox empty.
- **B, watch for me:** the first page passes (seen at 18-22 s, v1 at 33-37 s, 4 of 4 comments that
  need an answer, the outbox empty, main's line clean). The checks after the first tick
  (republish, one card, open-reply, stop) haven't run: `qa.py run launch-watch` stops at tick 1
  (a 404, then a connection reset, both in amb-tools' tool).
- **D, checklists: fail.** The page came at 17 s and v1 at 29 s, with 7 sourced steps. Fail 25:
  no card for his first step within 400 s (amb-core). Fail 26: bise took none of the steps (5
  yours, 2 Lucas'); fixed in dc32a7c9 (bise drafts what it can, his are only sign-in, 2FA,
  payment, his word). Rerun once 25 lands.
- **A, drafts where they live (the newsletter): pass.** First seen at 15 s, v1 at 29 s (an email
  block, a question, sources). Nothing was written before his word; the Kit draft was made 28 s
  after `put it in my drafts`, with its `went` line on the page. Outbox: 1 Kit draft, 0 sends.
  Main's line was 93 characters, one sentence.
- **C, feedback into work: mostly pass.** First seen at 20 s; v1 had all 3 of Benjamin's fake
  reports, each with a drafted reply in a message block. `start an agent` on 2 items → main
  started both agents 18 s after the start note, and the items showed them 8 s later. Outbox
  empty. Fail 27: after the start note, main's capsule words were 356 characters in two
  capitalized paragraphs, including its own coordination (`it hasn't confirmed yet`). Fail 28: v1
  at 88 s. Rerun after 83c1a8af: v1 at 58 s, the line after the start still 204 characters
  (amb-core's `via: page` tag pending), plus a fair card (`how should agents ship code here? this
  repo has no remote`).
- **B, a third run at 96a1769b:** the page passes again (14 s, v1 27 s, 4 of 4), then the run stops
  at tick 1 on `GET /p/launch-watch/meta` (`Remote end closed connection`). Three runs, three errors
  at the same moment (404, reset, closed), so the page server may drop a page's meta while it's
  republished: sent to amb-core and amb-tools.

### Results: 2026-10-03, 01:30-02:50 (headless, model hubs on fake accounts)

- **B, watch for me: pass on the product** (5697cc7e, with amb-mac's page server fix 8e1cdac8).
  First seen at 17 s, v1 at 26 s, 4 of 4 comments that need an answer. Tick 1 came at 111 s and the
  page republished by itself with 4 of 4 of the new comments. No reset or closed connection, so
  8e1cdac8 holds. Outbox empty, the stop ended the timer. The run's only fail is a check that is
  too strict: the one card was Marc in #launch asking him `can the weekly update carry these
  numbers?`. He asked "tell me what needs an answer", and a teammate's direct question needs his
  answer, so the card is right (sent to amb-tools). Still to check: the republish came 559 s after
  the tick, and the menu bar's `watching … N new` needs the app. An earlier run at 8e1cdac8 also
  got past tick 1, then qa.py itself died on `Too many open files` (the runner leaks descriptors
  under a 256 limit: amb-tools; run with `ulimit -n 10240` until then). Two runs at once from one
  agent share one hub: never do that (amb-tools may make qa.py refuse it).
- **D, checklists: fail, much further each time.**
  - At 491dbee3: fail 29. The fixture's domain exists in the real world: the agent checked the
    real .app registry, found it taken, and rightly asked first, and the flow never answered.
    Fixed by amb-tools in 494bbd0d (a fake registry, an invented free domain, the flow answers a
    page question).
  - At 5697cc7e: fail 30. bise's own step `ask legal` stayed `drafted` (legal's address was
    missing), so the plan never reached his steps, and the agent had already ended. Fixed in amb-kit
    8ad89e55 (an agent never ends with its own step open) and amb-core 6ab4e8e4 (a drafted step of
    bise's is his turn: `send the draft?`).
  - At 6ab4e8e4: page 16 s, v1 25 s, outbox empty. The agent asks for legal's address as a page
    question, the drafted step comes as `send the draft?`, then his `sign in to Gandi` card comes.
    Fail 31 (amb-core): answering that card with `1` from the capsule's path never closes it, so the
    plan stops there. Nits: `send the draft?` comes in the same second as the address question it
    depends on, and has no page link.
- **C, feedback into work: fail at 9c83d97f.** Page 24 s, v1 33 s, the 3 reports covered, outbox
  empty, main's line 90 characters (fail 27 holds). Fail 32: the task agent couldn't read the fake
  Slack and asked him to connect an account; main read it and passed the reports on (amb-tools /
  amb-core: spawned agents need the same fake connectors as main). Fail 33: no review block (each
  report is prose + a message), so there's no `start an agent`, and the agent found no code to fix
  in a repo that holds only a README (amb-kit's feedback.md; amb-tools' fixture). Fail 34: main
  asked `how should agents ship code here?` at 24 s, before any code change was known, then
  withdrew it (amb-kit).
- **C, feedback into work: pass at 713ae37e** (with amb-tools d44b566e and amb-kit 43fef68d).
  First seen at 16 s, main's line 42 characters, v1 at 71 s with a review of Benjamin's 3 reports
  (3 of 3) and a drafted reply each. `start an agent` on 2 items → main started fix-fish-path and
  fix-https-proxy 24 s after the note, each with its report as the brief, and the items showed them
  14 s later. Outbox empty. Fails 32-34 hold: the agent read the fake Slack itself. The
  `how should agents ship code here?` card now comes at 110 s, once agents exist that need the
  answer (the fixture repo has no remote; his real repos do). Not yet checked: v1 at 71 s is
  slower than amb-kit's ~45 s for the first items; and the end of the loop (an agent done → the
  item's reply updated → it leaves only on his word) isn't in `qa.py run feedback`.
- **C after amb-kit's 9b0983bd: v1 at 44 s** (each report published as an item as soon as read).
  That run's fail was the check misreading a brief that did name s212 (amb-tools). With the
  loop's end in the run (83038189), both agents had their fixes ready and tested, then waited on
  main's `how should agents ship code here?` card, which the flow doesn't answer (amb-tools). The
  question itself is right there: it comes once fixes are ready. v1 was 98 s on that run (4 items).
- **D at dbfcfd99: fail 31 fixed.** His `sign in to Gandi` card, answered with `1`, closed and
  ticked; the `send the draft?` card waited for the legal question. The plan then stops at s3
  because the flow picked `i'll leave a note with legal's address` and never left it (amb-tools).
  Fail 35 (amb-kit): one decision, two cards in the same second, the question `how many years?`
  and his step `pick how long … 1. done`. Nit: after he chose to leave a note, the legal question
  came back as a new card 30 s later.
- **C to the loop's end at b90475d7: pass on the product.** 2 agents started from the page, both
  done in ~6 min, 3 fixes landed with tests; page v9 has 3 Slack replies (one in French for the
  Lyon team) and 3 Linear issue drafts waiting for his word; outbox empty. The run's fail is a
  check that wants the English word `fixed` (amb-tools). Fail 36: a card `archive @proxy-fix? the
  agent is mid-turn` reached him, and the agent was archived anyway; fixed in amb-core 19c45805
  (housekeeping cards stay in the TUI; only his yes archives).
- **D at 6f91aa83: 35 holds, one card per decision.** The plan ran legal's question → `send the
  draft?` → `sign in to Gandi` → `pay … €28, company card`, each when its turn came, outbox
  empty. The run's fail is the flow handling only 2 step cards (it counts his rows, and a drafted
  step of bise's now makes a card too): amb-tools. Nit (amb-kit): the `send the draft?` card still
  said `waiting for your note: legal's address` after the note was left.
- **D at c1dd4f9c: pass on the product, to the end.** One card for the decision (`how many
  years?`), legal's address asked once, his `sign in` and `pay` cards each when their turn came,
  then 3 `send the draft?` cards (legal, Lucas, Marc). The 3 mails went only after his `send`
  (fake outbox, all accurate), and the plan ends waiting on Lucas's DNS. The run's 2 fails are
  checks (amb-tools): sends after his word counted as sends on a "don't send" ask, and rows waiting
  on Lucas counted as forgotten. Nits (amb-kit): v1 at 69 s (the page at 16 s), and the trademark
  mail came after he paid while Marc asked for it before buying.
- **D at c02a8c56 (amb-kit 6de3d718): the nits hold, a new fail.** v1 at 48 s, and `ask legal …
  before paying` now comes before his `sign in and pay` card. Fail 37: his `send` on 3 `send the
  draft?` cards made no send (outbox empty at the run's end; the run before made 3 sends within
  5 s). The run said pass because its check no longer counts sends (amb-tools to fix; amb-core or
  amb-kit for the cause).
- **D at 74df6244: pass, sends checked one for one.** Page 18 s, v1 38 s. Legal's address asked
  once; the note with it reached the agent; `ask legal … before paying: send the draft?` → his
  `send` → the mail to legal left at once, before his `sign in` and `pay` cards; then `send the
  draft?` for Lucas's DNS → sent. 2 sends for 2 `send` answers, none before his word. The plan ends
  waiting on Lucas and legal, and the mail to Marc waits for his word once they reply. Fail 37 is
  closed for this flow. At 626e876c (without 74df6244), Lucas's and Marc's mails went but legal's
  didn't: the flow's note carried the option's label instead of the address (amb-tools, fixed
  after 9688bc68), and the product still opened `send the draft?` on a draft with no address
  (amb-kit b12b6fde: such a draft stays `waiting for your note: <what>`, never `drafted`).
- **D at 807ff018 (amb-core's wake fix, amb-kit b12b6fde): fail 38, the plan stalls silently.**
  Page 16 s, v1 33 s. After his `how many years?` answer, bise's step `ask legal … · waiting for
  your note: legal's address` is open, but the page has no question for the address (only the
  row and a callout say it), so no card comes, his sign-in and pay never come, and the outbox
  stays empty. Out of the way, only cards reach him, so he'd never know. Proposed: a draft
  waiting for his note always comes with a question for what's missing, with `skip` (amb-kit),
  or such a row opens a card (amb-core).
- **D at 60da0b05: pass, end to end.** Page 17 s, v1 31 s. What bise needs from him comes as a
  question (`who is legal?`, then `how many years?`); the flow's note with legal's address reached
  the agent; `ask legal (legal@acme.test) …` → his `send` → sent, before his `sign in` and `pay`
  cards; then `send the draft?` for Lucas's DNS and for Marc → both sent on his word. 3 sends for
  3 `send` answers, none before. Only Lucas's own step is left, waiting on him. Fails 37 and 38
  are closed.
- **B on the app (fake hub at 46f387bc, with amb-mac's menu read): pass on the core.** The menu
  shows `watching the launch · N new for you` and `stop watching` once the timer is set; a
  republish raises N and never opens the capsule; a card from the watch shows the glass for ~8 s,
  then folds into `needs you`; `stop watching` ends the timer at once (no timer, no watch rows);
  the icon's badge reads on light and dark. To fix: N counts unopened versions (2 after v2)
  instead of the new items for him (the page has 3), so a tick with nothing new would raise it
  (amb-mac); the rows say `main` (`main: watch: …`, `the launch · main · v2`) where bise should
  speak (amb-mac, ambient's words); `sb card` has no `--page`, so a watch's card can't open its
  page (amb-core). Not checked: the page frame saying the watch stopped.
- **B's menu fixes rechecked on the app (762aea49, amb-mac 623473da): pass.** `watching the launch ·
  4 new for you` counts the page's 4 waiting items and stays 4 after a version with nothing new;
  the rows say `the launch · v2`, and main's card shows the question alone.
- **D at 597d1136 (amb-core 8a9f7d63): fail 39 closed, pass.** Headless: page 15 s, v1 33 s,
  `who is legal?` then `how many years?`, the mail to legal sent on his word before his sign-in
  and pay cards, then Lucas's DNS draft; every send matches one `send` of his, none before.
  Spoken on the app: `got` at 4.1 s, the page at 21 s, main's line at 22.6 s (61 characters), the
  glass gone at 30.5 s, the first card shown at 73 s; the run then stopped in the QA tool (in app
  mode it answers cards through a core that isn't there: amb-tools).
- **D spoken on the app at 0519afbf: pass**, every card answered through the app's own path (as
  fn + 1 sends it). `got` at 4.1 s, the page at 22.9 s, main's line at 24.9 s (68 characters), the
  glass gone at 32.9 s; legal's and Lucas's mails sent on his word, Marc's waits on the site check.
  Under load 53, v1 took 64 s. The batched draft card wasn't exercised: here the drafts became
  ready one at a time.
- **C spoken on the app at a5782b18: fail 41.** The ask passes (`got` 3.3 s, the page 20 s, main's
  line 21.6 s, the glass gone 28.4 s, v1 46.5 s; 2 agents 24 s after the start note). Then main's
  card `how should agents ship code here? / 1 a PR per task / 2 straight to main` was answered `2`
  through the app's path and never reached main, so the agents waited 900 s. The card has no page,
  and the capsule's option split wants `1. label`; main wrote `1 label`, so fn + 2 is refused as
  `that option opens in the terminal.` (amb-core).
- **C spoken on the app at 3572ac59 (amb-core 58b6d7ce): pass, fail 41 closed.** `got` 3.3 s, the
  page 20 s, main's line 21.3 s, the glass gone 28 s, v1 65 s. Main's `1 a PR … / 2 straight to
  main` card, answered `2` through the app's path, reached main; 2 agents started, one done at
  159 s, its reply updated, his `send` → exactly one Slack post. Open: no `N drafts ready` card,
  though 3 sendable Slack replies waited at once (amb-core, if review replies are meant to batch);
  and a Slack reply is now posted as him on his word, where roadmap A said copy + open (main's
  call).
- **C on the app at 7a5ebb2e: 42 holds.** One card `3 drafts wait for you · benjamin's reports` at
  82 s (the ship-code question stays its own card). Not yet checked: `send all 3` → 3 posts (the
  flow didn't press it: amb-tools). Nit: its line reads `messages to to Benjamin, on the proxy, to
  Benjamin, …`. Question: the batch came before any fix landed, so `send all` would post the
  first-version replies while agents are still fixing; a reply whose item has a working agent
  should stay out of the batch.
- **C on the app at f0e2f115: `send all` works.** One card `6 drafts wait for you` (3 Slack replies,
  3 Linear issue drafts); his `2` through the app's path → all 6 left once, 12 s later, none
  before. The run's fail is its count (Slack posts only: amb-tools). Open: the same send also
  marked 2 Linear issues done, a write no card named (amb-kit). The early batch and its wording
  are addressed in amb-core 2e114ebe.
- **C on the app at 9e5d8a6e (amb-core's reply hold): pass, end to end.** One card `3 drafts wait
  for you · 3 replies to Benjamin: proxy, fish and français` at 75 s, before any agent started;
  after the start, the replies waited for their fixes, and his `send all 3` (at 230 s, after the
  page was republished) posted the 3 fixed replies once (`Fixed. …`), none before. Nit for
  ambient's words: the topic `français` comes from the French reply; `French` reads right.
- **C on the app at 87151ebf (action blocks, amb-core 9f45bc1c + amb-kit 5ecd9cae): fail 43.** Two
  batch cards were open at once (`6 drafts … · 3 actions`, then `7 drafts … · 4 actions`); the
  first was never closed, and his `send all 6` on it did nothing (outbox empty). A new batch card
  must close the one it replaces, and an answer on a replaced card must never do nothing silently
  (amb-core). The actions on that page were code work (`change the system prompt …, then land it
  on main`): code belongs to `start an agent`, not to a send batch; the action block is for account
  writes like closing an issue (amb-kit).
- **C headless at b2137adb (amb-core 5f9a1eca, amb-kit 43e4a54e): pass, fail 43 closed.** One batch
  card `6 drafts wait for you · 3 replies to Benjamin · 3 to create` (the actions are now Linear
  issues to create, no code work); his `send all 6` → 3 Slack replies + 3 Linear issues, once each,
  none before. Page 17 s, v1 36 s.
- **F at 88044e58 (amb-tools' run, isolated fake set): pass on the product, fail 40 closed.** v1 at
  33 s, 6 items newest first, ids kept across the start and 2 ticks; 2 cards, one per batch with
  team asks (Léa's question in v1, Nora's request after a tick), none for clients or noise; outbox
  empty until his send, then exactly one Gmail send; `start an agent` on Nora's ask briefed an
  agent with her words. The run's only fail was its noise check reading the sources block
  (amb-tools 5fbd2268). Clean rerun at b920c95a: verdict pass (v1 36 s, the same 2 cards, both
  main's and linked to their item, one Gmail send after his word).
- **F at d057f499 (headless): fail 40 for ticks.** Léa's direct question in v1 got its card; Nora's
  DM that arrived with tick 1 got none, though the page listed it and main started an agent on it
  (amb-kit 78500b1b since).
- **G, promises, at d057f499 (amb-tools' run): pass.** No card (the 2 page questions stay on the
  page), v1 at 30 s with 6 promises, the 2 overdue ones with drafts and listed first, the kept one
  marked kept; the morning page's needs-you leads with the 2 overdue promises; outbox empty.
- **Meetings at ad197877 (amb-tools' run #4): pass.** No card from a meeting page; the renewal's
  brief 13.5 min before it starts and its follow-ups 15.5 min after it ends; the team sync's brief
  10 min before; outbox empty.
- **Job 2, the inbox, spoken on the app (`--app --voice`): pass.** fn held, the ask spoken,
  `got` at 2.6 s, the words at the core at 2.9 s, the page at 15.9 s, main's line at 17.7 s (`mail
  replies is on it. the drafts will show up on a page, and nothing gets sent.`, 86 characters), the
  glass gone at 26.7 s; the 3 notes done; outbox empty.
- **D at 435325c0: fail 39, a stall again.** After `who is legal?` was answered and the address
  reached the agent, the ready mail to legal got no `send the draft?` card: its row carried
  `data-question`, which suppresses the card even after the question is answered (amb-core).
- **23 and 24 rechecked at a589f9f9 (`qa.py ask`): pass.** `what's my next meeting` → `09:30,
  launch standup with Marc, Lucas and Nora` in 13 s, no page: the fixture says 07:30Z, so the time
  is in his zone (CEST). `plan the offsite` → offsite-plan; the follow-up `add a budget per person
  to the offsite` updated the same page (v3) in 22 s, with no new page. Same nit as D: the offsite
  opened `who comes?` and `confirm La Grange … send the draft?` together, two cards at once where
  the draft depends on the answer.

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

## What he hit on the dogfood day: checks on every build (main m_6474, ambient-lead m_6482)

His verdict at 22:26 on 2026-10-03, with a screenshot: the card layout is broken, the capsule's
buttons can't be clicked, holding fn with the capsule closed did nothing, and the pearl sits in a
square with a background. His direction: Spotlight-like, keyboard-first with the shortcuts shown,
polish at the level of Siri. Every build of the app passes these before he tries it again, on the
QA app with a model hub on fake accounts. The four checks below that run on the QA app need a
build where no dogfood app is running (two apps would both take fn).

**Real-mouse clicks.** These clicks go through the window server, never through the page's JS or
the QA socket (that's how the `answer` path passed while his clicks did nothing):
- [ ] Every button the capsule can show takes one real click, posted as a mouse event at the
      button's screen point: each card option (1..n), review, send all, open the page, stop
      watching, type to main, close. One click does it, also when bise is not the frontmost app
      (the panel takes the first click: no click to focus first). After each click, the core gets
      its command once (`qa.py` events), and the capsule shows the result.
- [ ] Hover and the pressed state show under the real pointer. The pointer is an arrow or a hand
      on a button, never the text cursor.
- [ ] A click outside the capsule goes to the app below it: the capsule's window has no invisible
      margin that eats clicks around it.
- [ ] The same clicks on the menu-bar menu and on the full view.

**fn from rest.** This is how he first reached for it:
- [ ] Capsule closed, nothing on screen but the menu-bar icon, another app frontmost (TextEdit,
      then a full-screen app, then the terminal): hold fn. The pearl appears and listens within
      300 ms, the fake voice's words show, let go, the words reach the core, main's line shows.
      Run it right after launch, then again after the capsule has folded away by itself, then
      again after `fn + .` hid it.
- [ ] fn with no hold (a tap) does nothing visible and starts no recording.
- [ ] If the app lacks the Input Monitoring or Accessibility permission, holding fn shows one line
      saying what to allow and where (no silent failure). Check it on a QA build without the
      permission.

**The pearl floats free.**
- [ ] In every state (`qa.py scenes`: rest, listening, working, needs you, done, failed, reduced
      motion), the pixels around the pearl are the screen behind it: transparent window, no
      square, no glass, no shadow box, no border. Check it in the screen composite over a light
      and a dark wallpaper, not only in the capsule PNG.
- [ ] The pearl sits next to the interface (the card, the answer, the field), never inside a box
      of it.

**Keyboard first, shortcuts shown.**
- [ ] Every action in the capsule, the full view and the cards can be done with the keyboard
      alone, and its shortcut is shown next to it: card options (1..n), ↑↓ to move, ⏎ to pick,
      esc to close, review, send all, open the page (fn + o), hide (fn + .), stop watching, type
      to main. Run each slice's flow once with keys only, no mouse.
- [ ] No action exists only on a click. No shortcut works without being shown somewhere on the
      surface it acts on.

**Cards are readable.** These come from main's read of his screenshot:
- [ ] The question shows in full and once. The options are not repeated inside the question's
      text.
- [ ] Options are compact rows, one line each, with an ellipsis when long. The full text shows on
      hover or when the row is selected. No big blocks, no labels wrapped onto several lines.
- [ ] A card from main reads as bise's question (no 'main' label). A card from a task names the
      task.

### Results: real clicks, first run (ambient-app c1001d7f, QA app on a fake hub, stopped after)

`qa.py clicks --state card|question|drafts|settings`, one real click per target, bise not
frontmost:
- **settings: pass.** All 8 toggles and `+ add an app` sent `app_setting`, and `esc close` closed
  the panel. The two `◌ … always` rows are labels: no command, arrow cursor.
- **drafts: pass for what shows.** The card body and `⏎ open` opened the inbox page at `#i1`.
  `esc later` folded the card. `↑↓ move` changed the selection. **Fail 44 (product):** the
  `3 drafts ready` card shows only `open` and `later`. It has no `send all`, so he can't send the
  batch from the card ("Every slice" below: `send all / review`).
- **card: fail 45.** A click on the card body ("which date works for the pricing review?") got
  no click: no window at that point (`window None, hit None`). `⏎ open` and `esc later` on the
  same card work. The body's hit area is not where it is drawn, or it falls outside the panel.
- **question: no result (tool).** In that state the capsule never came on screen, so the run
  had nothing to click. The 6 targets are listed: `⌘⏎ full text`, `1 tuesday`, `2 thursday`,
  `fn 1–2 pick`, `fn esc later`, `fn o open the page`. Goes to amb-tools.
- Not checked yet: a click 10 px outside the glass reaching the app below, hover under the real
  pointer, the pearl with no background, keyboard only (amb-tools' next checks).

### Results: real clicks, second run (ambient-app with amb-web d16054d8, QA app, stopped after)

- **card: fail 45 again.** The body's point is in no bise window: the window there is the app
  behind (Chrome), even though the page's hit test finds the web view. The body sticks out of the
  panel's window shape, so a real click there goes to the app below. `⏎ open` and `esc later`
  pass.
- **question: fail 46.** One real click on `1 tuesday` or `2 thursday` sends `answer` **twice**
  for the same card.
- **question: fail 47.** The footer hints `fn 1–2 pick`, `fn esc later` and `fn o open the page`
  show a pointer cursor but take no click. A hint that is not a button keeps the arrow cursor.
  If it looks like a button, the click does what it says.
- **question: pass.** `⌘⏎ full text` and the question's text show the full text.
- **drafts: pass for what shows** (body, `⏎ open`, `esc later`). Fail 44 (`send all` on the
  batch card) is not checked yet: amb-web puts `1 review` and `2 send all 3` on the card's own
  bar, reached from a row in fn i, and `qa.py clicks` has no state for that bar yet (amb-tools).

### Results: real clicks, third run (fresh launch at ambient-app d2a47b84, QA app, stopped after)

- **card: pass, fail 45 closed.** All 3 targets (the body, `⏎ open`, `esc later`) got the first
  click in the panel. The second run had hit a stale panel or bundle (amb-mac m_6650): from now
  on, a click run always starts on a fresh launch (`launch --restart`).
- **question: fail 46 still there.** One click on `1 tuesday` or `2 thursday` sends `answer`
  twice.
- **question: fail 47, partly fixed.** `fn esc later` takes the click now. `fn 1–2 pick` and
  `fn o open the page` still show a pointer cursor and take no click.

### Results: real clicks, fourth run (fresh launch at ambient-app with amb-web 71df07bf)

- **question: fail 46 still reads twice.** `1 tuesday`, `2 thursday` and now `fn 1–2 pick` each
  log two identical `answer` commands for one card, with no route on them. amb-web's headless
  test posts one answer for two click events. So either the app forwards it twice, or `clicks`
  logs both the page→app and the app→core copy: amb-tools to tell which.
- **question: fail 47 moved.** `fn 1–2 pick` acts now. `fn o open the page` sent `app_open_url`,
  yet the run says the page got no click. `fn esc later` got no click and sent nothing (it passed
  in the third run). Either the press acts before the click event, or the hints still move under
  the pointer.

### Results: real clicks, fifth run (fresh launch at ambient-app with amb-web 78e24cdf)

Each command now carries its route. A press acts on release (amb-web), so 47 is judged by the
act, not by the page's click event.
- **fail 46 closed: it was the log.** Each option click sends one `answer`, page→app. The second
  line was the same answer going on app→core.
- **fail 47, 2 of 3 pass by the act.** `fn 1–2 pick` answers 1, and `fn o open the page` sends
  `app_open_url`. **`fn esc later` still does nothing seen:** no command left, while `esc later`
  on the card sends `app_size` + `app_content`. The view changed, but nothing shows the card going
  into the count. `qa.py clicks` should also judge by the act, not by the click event (amb-tools).

## Click and key audit, round 10 (the user via main m_6963: "il manque beaucoup de click events sur beaucoup de choses; pas de ⌘Q")

This audit reads the code only, at ambient-app faeb8a47 (before the Swift app and the old web
capsule were deleted): the old capsule's `bar.js` + `ui.js` (the bar), the Swift app's
`StatusItem.swift` + `MenuRows.swift` + `Capsule.swift` (menu bar, panel) and `kit/kit.js` + `notes.js` (the pages' frame). No app run. "click" = a
`data-act` button or a row that sends something. "hover" = a `:hover` style. "info" = text with
no act, arrow cursor. The rule behind every "should": anything that shows a key or looks like a
row does the same thing on click, and a click never does more than its key.

**The bar**

| element | today | should | owner |
|---|---|---|---|
| the pearl (any state) | no act; the panel lets the mouse through over it (`takesMouse`: glass only), so a click goes to the app below | click = talk (same as fn: listens, a 2nd click sends); hover: soft lift + "fn talk" tip | amb-mac (take the mouse on the pearl) + amb-web |
| idle/hello foot: `fn talk`, `fn space type`, `fn 0 going on`, `fn o start here` | info only: no act on any of the 4 | each one clickable: talk, opens the field, opens going-on, opens start-here | amb-web |
| needs head: `? main needs you · now · +2` | info | `+N` opens the inbox (fn i); the rest stays info | amb-web |
| question text, clamped | click → full text ✓ | ✓ | - |
| question text, full | info ✓ | ✓ | - |
| option rows `1 tuesday`… | click ✓, hover ✓ | ✓ | - |
| drafts big line (`3 drafts ready…`) | click → review ✓ | ✓ | - |
| foot `fn 1–n pick`, `↑↓ move`, `fn talk / hold` | info ✓ (the rows/fn are the targets) | ✓; `fn talk` may join the pearl's click | amb-web |
| foot `fn esc later`, `fn o open the page`, `⌘⏎ full text` | click ✓ (fail 47: `fn esc later` showed no act in the 5th run) | recheck 47 at the next build | amb-web |
| working/speaking: main's line (the words) | info | click opens his page when the answer has one; else info | amb-web + amb-core (page id on the line) |
| working/speaking foot `⌘C copy`, `esc close` | click ✓ | ✓ | - |
| started agents (`∿ name` rows after an answer) | info (div) | click = what that agent made: its page if any, else its last line + "open in terminal" | amb-web + amb-core |
| spotlight field rows `@ ask main`, `+ start an agent` | click ✓, hover ✓ | ✓ | - |
| spotlight foot `⏎ send to main`, `tab start an agent` | info (no act) | clickable, same as the rows | amb-web |
| spotlight foot `esc close` | click ✓ | ✓ | - |
| inbox/going-on card rows (`? …`, 1-9) | click ✓ | ✓ | - |
| going-on running agent rows (name · what · age) | info (div), no hover | click opens the agent's page or last report; hover shows its last report in full | amb-web + amb-core (agent → page/report) |
| for-you page rows (◰) | click ✓, ⌘1-9 ✓ | ✓ | - |
| section labels `waiting · 2`, `running · 3`, `for you`, head `most blocking`, `kept` | info | `for you · N` opens fn p (all pages); the others stay info | amb-web |
| "… more" / clamp on long row text | none: rows cut at one line, no way to read more | hover or selection shows the full line (as for options) | amb-web |
| offline rows retry / terminal / copy | click ✓ | ✓ | - |
| refused lines (▲ 8 s flash, 37cd0aa8) | info, then gone | click = its way back (opens the System Settings pane, or settings) | amb-web + amb-mac |
| settings switches | click ✓ (space ✓) | ✓ | - |
| settings skipped app rows (`◌ Zoom ⌫`) | **a click removes the app** at once | click selects; removal on ⌫ or a hover `×` only | amb-web |
| settings `◌ … always` rows | info ✓ | ✓ | - |
| settings `+ add an app`, perm continue / not now | click ✓ | ✓ | - |
| the glass outside any row | nothing ✓, clicks inside the glass don't reach the app below ✓ | ✓ | - |

**The menu-bar menu** (StatusItem.swift): a left click on the icon opens the full view ✓; right
or ctrl click opens the menu. Card, page, watch, stop watching, type to main, hide/show,
settings and quit rows all act ✓ (native hover ✓).

| element | today | should | owner |
|---|---|---|---|
| menu shortcuts | keys drawn as dim text, `keyEquivalent: ""` on every item: no ⌘ key works in the menu | real key equivalents: quit ⌘Q, settings ⌘, | amb-mac |
| left click on the icon | full view only; the menu is right/ctrl click | keep it; say "right-click for the menu" in the full view's foot (now hidden) | amb-mac + amb-web |
| section headers (needs you, for you) | disabled ✓ | ✓ | - |

**The mac keys.** The app sets no main menu (`NSApp.mainMenu` nowhere), so AppKit's standard keys
have nothing to go through. The panel's keydown (`ui.js`) handles only ⌘⏎, ⌘1-9 and ⌘C.

| key | today | should | owner |
|---|---|---|---|
| ⌘Q | nothing (quit is only the menu row) | quits bise (the same as the menu's quit) | amb-mac |
| ⌘W | nothing | closes the bar (= esc) | amb-mac |
| ⌘, | nothing | opens settings (= fn ,) | amb-mac |
| ⌘H | nothing | hides the bar (= fn .) | amb-mac |
| ⌘F | nothing | in going-on / pages: opens the field to filter the list | amb-web |
| ⌘A ⌘C ⌘V ⌘X ⌘Z ⇧⌘Z in the field | likely dead: with no Edit menu, WKWebView gets no editing commands (one short run to confirm) | all work as in any text field; pasting a long text is the main case | amb-mac (an Edit menu, hidden) |
| ⌥←→ ⌘←→ ⌥⌫ in the field | to check in the same run | as in any text field | amb-mac |
| ⌘C outside the field | copies main's answer or the offline line ✓ | ✓; also copies a selected row's text | amb-web |
| ⌘⏎, ⌘1-9 | ✓ | ✓ | - |

**The pages' frame** (kit.js): the version button, its menu, `latest`, `changes`, `stop`
(watching), `send` and the taste link all act ✓, with keyboard ✓.

| element | today | should | owner |
|---|---|---|---|
| the frame's pearl `:*` and the title | info | the pearl = talk about this page (= fn held on it); the title scrolls to the top | amb-kit + amb-web |
| notes count (`3 notes`) | info | click opens the notes list | amb-kit |
| `updating · <agent>` | info | the agent's name opens its last report (or stays info: product call) | amb-kit |

**To prove with one short run** (only if a doubt stays): ⌘V in the field, and a click on the
pearl reaching the app below.

## Terminal parity audit (the user via main m_7003, ambient-lead m_7006)

The user's goal: "je voudrais pas que les gens aient besoin du terminal pour utiliser ambiant, il
devrait être capable de faire tout ce que tu peux faire dans le terminal à partir d'ambiant
exclusivement."

This audit reads code and docs only at ambient-app b63216d6, with no app run: the TUI's
`rust/tui/src/commands.rs` (every /command), `help.rs`, `onboarding/`, `sb/`, and ambient's
`rust/tui/src/ambient/core.rs` (what the app can ask the core: `main`, `answer`, `start`, `send`,
`every_stop`, `voice`, `shot`, `quiet`, `hush`, `talk_*`, `state`), the old capsule's `bar.js` and
the Swift app's sources.

- **ok**: ambient does it in its own UI.
- **via main**: only by asking main in words; main does it with `sb`. That works when main has
  the command, but nothing shows it can be done, and nothing shows the result.
- **partial**: some of it.
- **missing**: no way without the terminal.
- **(verify)**: what i couldn't settle from the code.
- **⛔ first**: blocks a person with no terminal before anything else.

**1. Setup and first run** (what to build first)

| terminal | ambient today | status | owner |
|---|---|---|---|
| install bise (the CLI on PATH) | the app finds `bise` from `--bise`, `lastBise`, the dev build or PATH (App.swift); no binary in the bundle | ⛔ first · missing | amb-mac + amb-home |
| pick where bise works (`cd` a repo, or `~/bise` home) | home workspace `~/bise` by default (amb-home); switching only by SIGUSR1, no UI | ⛔ first · partial | amb-mac + amb-home |
| sign in: provider key or subscription (`/provider`, onboarding sign-in, ChatGPT, OpenRouter) | no view; without a provider main can't answer at all | ⛔ first · missing | amb-mac + amb-web (UI), subs-auth's `bise auth` CLI under it (amb-core) |
| which model does what (`/models`, onboarding roles) | no view | ⛔ first · missing | amb-web + amb-core |
| permissions (mic, accessibility, screen) | perm steps continue / not now ✓, refused lines with the way back (37cd0aa8) | ok | - |
| welcome, tour (`/welcome`, tour) | hello + the start-here page | ok | - |
| `/setup` (check again, offer what helps) | no "check again" | missing | amb-mac |
| can't reach bise (offline) | retry ✓, but "run bise in Terminal" is the way out (`ui_terminal` opens Terminal.app) | ⛔ first · partial: the fix itself needs the terminal | amb-mac + amb-core (restart the core from the app, show its log line) |
| `/voice` (model, voice, language) | settings: answers out loud on/off; no model, voice or language | partial | amb-web + amb-mac |
| `/theme` | follows macOS | ok (n/a) | - |

**2. Talking and sending**

| terminal | ambient today | status | owner |
|---|---|---|---|
| write to main (composer) | fn hold (voice), fn space (field) ✓ | ok | - |
| write to a given agent (`@agent`, its view) | only main | missing | amb-web + amb-core (`send` to an agent) |
| steer vs queued (`sb send --mode`) | none | missing | amb-core + amb-web |
| dictation / voice mode (ctrl+r, twice) | fn hold, double fn hands-free ✓ | ok | - |
| paste text, images, files; `@file` | screen with voice (`shot`) ✓; paste in the field likely dead (round 10: no Edit menu); no files, no `@file` | partial | amb-mac (Edit menu) + amb-web |
| copy an answer | ⌘C ✓ | ok | - |
| read main's whole answer and the thread | one line, then the page if there is one; no thread view | partial | amb-web + amb-core |
| `/interrupt`, `/stop <agent>` | via main | via main | amb-core + amb-web (a stop on an agent's row) |
| `/compact` | via main | via main (rarely his) | - |

**3. Agents**

| terminal | ambient today | status | owner |
|---|---|---|---|
| `/new` start an agent | spotlight tab "start an agent" ✓ (through main) | ok | - |
| `/agents`, the panel | fn 0 going on: name · what · age; rows take no click (round 10) | partial | amb-web + amb-core |
| an agent's feed, its last report, its questions (`sb tasks`, `sb inspect`) | none | missing | amb-web + amb-core |
| `/switch`, `/rename`, `/isolate` | via main | via main | amb-core |
| `/archive`, `/restore`, `/archived`, drop | via main; archived agents not shown | via main | amb-core + amb-web |
| `/model`, `/reasoning` of an agent | none | missing | amb-core + amb-web |

**4. Inbox, cards, approvals**

| terminal | ambient today | status | owner |
|---|---|---|---|
| question cards (pick an option) | the bar, fn 1–n, click ✓ | ok | - |
| answer in his own words (`/answer N text`) | fn talk on a card (voice) ✓; typed free answer (verify); paste dead (round 10) | partial | amb-web + amb-mac |
| `/close N [note]` close without answering | "later" only puts it off | missing | amb-web + amb-core |
| `/inbox`, most blocking first | fn i ✓ | ok | - |
| drafts cards (review / send all) | ✓ on the card's own bar (amb-web d16054d8) | ok | - |
| plan step cards (D) | ✓ | ok | - |
| tool approvals (the approvals screen, auto mode) | (verify) whether they reach ambient as cards with approve / deny | (verify) | amb-core |

**5. Pages**

| terminal | ambient today | status | owner |
|---|---|---|---|
| open a page, notes, versions, send | ✓ (pages in the browser, fn o, fn p) | ok | - |
| `sb page waiting`, what waits on him across pages | in the count and the menu ✓ | ok | - |
| stop watching | ✓ menu + frame | ok | - |
| taste, people (about-you) | the about-you page ✓ | ok | - |

**6. Features, versions, updates**

| terminal | ambient today | status | owner |
|---|---|---|---|
| features and feature branches (try one, see its agents, merge) | none | missing | amb-core + amb-web (+ amb-home: no repo, no branch words) |
| `/update`, the release item | none: the app never updates bise or itself | ⛔ soon · missing | amb-mac + amb-core |
| `/version`, `/restart` | none | missing (restart: amb-mac; versions: dev only) | amb-mac |
| PRs (`/prs`) | via main | via main | - |

**7. Plugins, connectors, computer use**

| terminal | ambient today | status | owner |
|---|---|---|---|
| `/plugins` list / enable / disable / login / logout | none | missing (Gmail, Slack, Linear can't be connected) | amb-web + amb-core |
| `/computer-use` setup / off | none | missing | amb-mac + amb-core |

**8. History, timers, help, the rest**

| terminal | ambient today | status | owner |
|---|---|---|---|
| `sb history` (past work) | via main | via main | - |
| `sb every` timers | watching rows ✓, stop ✓; making one via main | ok | - |
| `/help`, `/shortcuts` | keys shown on each surface; no full list | partial | amb-web |
| `/quit` | menu quit ✓; ⌘Q missing (round 10) | partial | amb-mac |
| logs, crash reports (`/log`, error report) | none; offline points to the terminal | missing | amb-mac + amb-core |

**What blocks a person with no terminal, in order:**
1. bise inside the app: install with no CLI.
2. Sign in to a provider or subscription.
3. Pick models (or a good default with nothing to pick).
4. Choose the workspace.
5. Recover from "can't reach bise" without Terminal.
6. Update.

Then connectors (`/plugins`) and computer use for the job slices, and an agent's own view (feed,
write to it, stop it) to replace the panel.

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
- [ ] Before his word (an item or question on the page still open, no approve, send or `put it
      in my drafts`), an agent's `create_draft` becomes an approval card instead of running
      (amb-home 68e03f09); after his word it runs with no card. Fake outbox: nothing before.
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

**Done-when, run whole** (headless, a model hub on amb-tools' fake accounts with their growing
fake comments; never his real HN, X, Reddit or Bluesky):
- [ ] "watch the launch until tomorrow" → a review page; after a timer tick that brings new fake
      comments, the page republishes by itself (a new version, scroll and notes kept); a tick with
      nothing new publishes nothing.
- [ ] I said "tell me when someone asks about pricing": a pricing comment makes **one** card;
      other new comments make no card and wait on the page.
- [ ] The menu bar says `watching the launch · N new` and N matches the page's open items.
- [ ] Approve a drafted reply → the open-reply action opens (logged in QA) with the reply prefilled
      or copied; the fake outbox shows **no post**, ever.
- [ ] `stop` (on the frame or said) ends the timer at once: no version after it; the frame says
      the watch stopped.

## Job slice C: feedback into work (§2 C)

**Done-when, run whole** (headless, fake accounts):
- [ ] "handle the bug reports in #feedback" with 3 fake Slack reports → a review page, one item per
      report: what was said (quoted, sourced), what bise thinks it is, and `start an agent` /
      `answer` / `skip`.
- [ ] `start an agent` on 2 items → main starts 2 agents (a note of kind `start` reached main; only
      main spawns), each with its item as the brief.
- [ ] Each started item shows its agent's live line on the page (working, then done), pushed from
      the hub's states, no reload.
- [ ] When an agent is done, its item gets a drafted reply to the reporter; the reply leaves only
      on my word on the page (approve, or `put it in my drafts`/copy for Slack); before that the
      fake outbox has nothing.
- [ ] The skipped report stays skipped; nothing started or sent for it.

## Job slice D: steps only you can do (§2 D)

**Done-when, run whole** (headless, fake accounts):
- [ ] A 6-step plan (e.g. "the steps to buy the domain, from my mail") → a checklist page where
      each step says who: `i'll do it` or `yours`, with when.
- [ ] bise does its 4 steps by itself and ticks them (each tick visible on the page, with what it
      did, sourced); nothing it can't do is marked done.
- [ ] My 2 steps come as cards **when their turn comes** (not all at the start): `? pay the
      domain · open`, fn + ⏎ / `open it` takes me to that step.
- [ ] A spoken tick ("done with the payment") from anywhere ticks the right step; the next step
      starts.
- [ ] At the end, all 6 are ticked, none forgotten, none ticked twice; the menu-bar count is back
      to what it was.

## Job slice F: mentions for me ([ambient-roadmap.md](ambient-roadmap.md) §2 F)

**Done-when, run whole** (headless, a model hub on fake accounts, then one spoken ask on the app
with the fake voice; never his real Slack or mail):
- [ ] "keep an eye on what people ask me" → a `for you` page within 30 s: every direct question to
      him in the fake Slack and mail (Marc s210, Lélio s215, the acme mail that asks), each quoted
      and sourced, with a drafted answer; no FYI, news or comment as an item.
- [ ] A tick adds one direct question and one FYI → the page republishes with the question only;
      **one** card for it (a batch of several → one card naming them); the FYI makes no card.
- [ ] `send` on a mail answer → exactly one outbox send, after his word only; a Slack answer →
      copied + opened, no post in the outbox; `skip` → nothing leaves.
- [ ] `stop` ends the timer, no version after it; the menu bar's count matches the open items.
- [ ] Spoken on the app: "what do people need from me?" → one capsule line naming how many and
      who, and the page.

**Results, first run** (headless, fake accounts, 2026-10-03 05:14, build 4 behind the tip):
- Page 12 s, v1 23 s; every direct question found (2 of 2 in v1, 4 of 4 after tick 1, 6 of 6
  after tick 2), each with a drafted answer; the timer republished after each tick (its period,
  ~10 min). `send` on Hugo's mail answer → exactly one send; `start an agent` on Nora's CSV
  question → an agent with her words as the brief.
- Fail 40: no card at all, not even for his team's direct questions (Lea, Nora). amb-tools is
  rerunning at the tip.
- Notes: the page grows to 14 items with yesterday's: it should lead with what's new since he
  looked; drafts promise things in his name (`i'll look into it today`), which once sent are G's
  promises, so G reads his sent answers from F.

## Every slice, from now on (ambient-lead m_5980)

- [ ] One spoken ask on the app with the fake voice (`qa.py run <slice> --app --voice`): the
      capsule shows the talk and one short line, then hides; the page opens on fn + o.
- [ ] Drafts ready at once make **one** card (`N drafts ready · send all / review`); `send all`
      sends exactly N, `review` opens the page.

## Slice 3 (outline)

- The home workspace without a repo: `bise ambient` with no repo works; no repo, PR, branch or
  worktree word on any surface.
- Job 3, the offsite: compare (♡ ✗, pick 1-3), question, checklist (tick, "add …" by voice); the
  page grows over days, notes from day 1 still resolved right on day 3.
- Export a page (Google Doc, mail, Slack) through the gate.
- Drawing on a page; a drawn note sends a screenshot with it.
