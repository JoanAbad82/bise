# bise ambient v2: product QA, per slice

Owner: ambient-pm (the flows against [ambient-vision.md](ambient-vision.md)). ambient checks the
look against its SPEC; this file checks that each interaction really works, end to end, as the user
lives it. A slice is done only after this pass is green (the user's rule, via ambient-lead m_4750).
Failures go to ambient-lead, one line each: the step, what i did, what i saw, what the vision says.

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

## Slice 2 (outline, detailed when its plan lands)

- Voice note: hold fn on a page, the note pins at the mouse with its words (`you · voice · 0:04`);
  main doesn't get a message; saying "send" on the page sends the notes.
- The `bise` tab group through the extension; a page reuses its tab there.
- Job 2, the inbox: a review page; approve / edit / skip per item; `approve 5` skips edited and
  struck items; each sent reply went through the gate; email draft blocks.
- A page's question answers its card, and the card's answer shows on the page: one answer, never two.
- Versions history.

## Slice 3 (outline)

- The home workspace without a repo: `bise ambient` with no repo works; no repo, PR, branch or
  worktree word on any surface.
- Job 3, the offsite: compare (♡ ✗, pick 1-3), question, checklist (tick, "add …" by voice); the
  page grows over days, notes from day 1 still resolved right on day 3.
- Export a page (Google Doc, mail, Slack) through the gate.
- Drawing on a page; a drawn note sends a screenshot with it.
