---
name: bise-pages
description: Make a page for the user instead of a long reply, with the bise kit, and publish it with sb page publish; then answer the notes the user leaves on it. Use when an answer is longer than a short message or has structure (a table, options to pick, numbers, a plan, sources to check), when the user will want to change it or pick from it, or for a draft of something that leaves (a mail, a post, an update for others): a weekly update, a comparison, a decision, a list to review. Also when a message says "you sent N notes on your page".
---

# bise pages: show it as a page

A page is a short HTML fragment you write in one go (about 50 lines), made of kit blocks. bise
wraps it in its frame (whose page, version, age, notes, send), draws every block in the user's
look, light and dark, and opens it in the user's browser. The user reads it, leaves notes, sends
them to you; you publish the next version and the same tab updates in place.

You never write CSS, classes, scripts or colors: the kit draws everything. If something can't be
said with the blocks below, say it in words.

Not every answer is a page: a fact, a yes or no, a status, a one-line answer stay a sentence in
your reply.

Before you write: if `~/bise/taste.md` exists, read it. It holds the user's taste rules (tone,
length, what they always want or never want); follow them on the page.

## 1. The blocks

Every block is a `<section>` with its kind and an id. Ids are short, unique, and stay the same
across versions (the user's notes anchor on them): `p1`, `t1`, `q1`, `src`.

| `data-kit` | what | inside |
|---|---|---|
| `heading` | the page's title, or a section's | `<h1>` (once, first) + an optional `<p>` meta line; or `<h2>` / `<h3>` alone |
| `prose` | the text | `<p>`, `<ul>`/`<ol>`/`<li>`, `<blockquote>`, `<pre><code>`, inline `<strong> <em> <code> <a> <sup>` |
| `table` | rows to read or compare | one `<table>` (`<thead>` + `<tbody>`, `<th>`/`<td>`), then an optional `<p>` caption |
| `callout` | one thing not to miss | a first `<h3>` (a short label: `heads-up`, `not checked`) + `<p>`; `data-tone="note"` (default), `"good"` or `"risk"` |
| `question` | a decision the user makes | one `<p>` (the question) + `<ol>` of 2 to 4 short options; after the answer, `data-answer="2"` |
| `sources` | where each fact comes from | `<ol>` of `<li><a href="…">name · tool</a>, when</li>`, last on the page |
| `review` | items the user approves or skips one by one (mails to answer, tickets, expenses) | `<ol>` of `<li data-id="m1">`: a first `<p>` saying what it is (`Léa Martin · offsite dates · 9:12`), then the proposal; `data-verb="send"` on the block when the proposals are drafts that leave (replies to mails or messages): the buttons say `send` and `send all 3`, not `approve` |
| `message` | a draft that leaves through a channel (Slack, a post) | `data-to="Slack · #launch"` (where it goes, shown above it), then `<p>`s and `<ul>`, with `<strong>`, `<em>`, `<code>`, `<a>`: the kit's `copy` turns them into Slack markup; optional `data-open` = the channel's `slack://` or `https://` link (after a copy the page says `copied · open #launch`) |
| `compare` | 2 to 4 options side by side (venues, drafts, tools) | `<ol>` of `<li data-id="moulin">`: an `<h3>` name, a `<ul>` of facts, a `<p>` with the why |
| `checklist` | what's left to do, who, by when | `<ol>` of `<li data-id="t1" data-who="Camille" data-due="2026-05-20">` the task `</li>`; `data-done` on what is done; the kit shows `Camille · friday` and what is late. `data-who="yours"` for a step only the user can do (a payment, a login, a signature): it shows `you · friday`, and when every step before it is done the user gets a card for it; your own steps take `data-who="bise"` or none; any other name is someone else's |
| `email` | one mail ready to send | `data-to="Gmail · reply to Camille Roux"` (where it goes, shown above it), `<p data-field="to">`, optional `<p data-field="cc">`, `<p data-field="subject">`, then the body as `<p>`s |

Also allowed inside blocks: `<br>`, `<kbd>`, `<del>`, `<ins>`, `<mark>`, `<small>`, `<sub>`,
`<img src="data:image/…" alt="…">`. Nothing else.

How to write them well:
- **Sources:** every fact you took from somewhere gets a `<sup>n</sup>` right after it, n = its
  line in the `sources` block (the kit links them). A fact with no source says so in the text.
- **Numbers:** write them as they read (`412`, `4.1 s`, `3.2 %`, `€12,400`): table columns of
  numbers are aligned and set in mono by the kit. One number per cell: `11 (10 new)` is not a
  number, make it two columns (`total`, `new today`). In prose, put a key number in `<code>`.
- **Items** (review, compare, checklist) have their own `data-id`, kept across versions like
  block ids. The kit draws the reactions and each one comes back to you as a note with the
  item's id: review `approve` / `skip` (and `approve 3` for the rest), email `approve` / `skip`,
  compare `keep` (♡) / `drop` (✗) / `pick` (one per block), checklist `tick`. Mark a checklist
  item done with `data-done` when it is done. Sending, replying or booking is still your tool
  call, through the user's approvals, after their `send`.
- **Replies to comments** (Hacker News, Reddit, X, Bluesky): a `review` item with
  `data-reply="<the comment's https link>"`, then `<p>who · where · when</p>`, the comment in a
  `<blockquote>`, and your drafted reply in `<p>`s. Approving it opens the thread with the reply
  ready (prefilled on X, copied for the others): bise never posts, the user does.
- **Work handed to agents** (bug reports from Slack or Linear, tickets, a to-do list): one
  `review` item per report, its id the ticket's (`ENG-412`) or the message's, a first `<p>`
  `who · where · when`, then what is wrong in one or two sentences with its number of reports.
  The user's "start an agent" on an item goes to main as a note; once an agent works on it, put
  its name on the item: `<li data-id="ENG-412" data-agent="fix-login">` (review and checklist
  items). The kit shows `∿ fix login · working · reading the logs`, live, and `needs you` when
  it is blocked. The reply to the reporter is a `message` block (`data-to="Slack · Nina Park"`).
- **Drafts** (a Slack message, a post, a reply): in a `message` block with its `data-to`, as
  `<p>`s and `<ul>`, so the user reads it in the page's font, edits it in place and copies it.
  Never in `<pre>` or `<code>`: those are for code. A mail goes in an `email` block.
- **Questions:** one per decision, options short enough for a button; the user picks on the page
  (or presses 1-3) and the pick comes back to you as a note.
- **Words:** the user's language and voice; lowercase headings, short sentences, concrete.
- **Size:** about 50 lines. A page is for reading in one go; split a big one in two pages.

## 2. The rules (the lint)

`sb page publish` checks the page first. It refuses, with one line per problem, and stores
nothing: `style` (attribute or element), `class` or `id`, `<script>`, `<iframe>`, `<link>`,
`<div>`, `<span>` or any element not listed above, `on…=` handlers, an unknown `data-kit` or
`data-` attribute, a block without `data-id` or with one already used, text outside a block, a
block inside a block, `<!doctype>`/`<html>`/`<body>` (write only the blocks), images from the
network (use a `data:` src), `javascript:` links, more than 1 MB. Links to the outside
(`https:`, `mailto:`) are fine. Each line names the block and what to do: fix it and publish again.

## 3. An example: the weekly update

```html
<section data-kit="heading" data-id="title">
  <h1>the week, in three lines</h1>
  <p>week 41 · for #team · draft 1</p>
</section>

<section data-kit="prose" data-id="p1">
  <p>signup is faster: <code>4.1 s → 0.9 s</code> on a mid-range phone<sup>1</sup>. dark mode ships on the settings page monday<sup>2</sup>.</p>
</section>

<section data-kit="heading" data-id="h-numbers"><h2>numbers</h2></section>

<section data-kit="table" data-id="t1">
  <table>
    <thead><tr><th>metric</th><th>last week</th><th>this week</th></tr></thead>
    <tbody>
      <tr><td>signups</td><td>412</td><td>468</td></tr>
      <tr><td>signup time (p50)</td><td>4.1 s</td><td>0.9 s</td></tr>
    </tbody>
  </table>
  <p>from the growth dashboard, monday 9:00<sup>3</sup></p>
</section>

<section data-kit="callout" data-id="c1" data-tone="risk">
  <h3>heads-up</h3>
  <p><strong>release 2.5 slips to wednesday.</strong> the checksum didn't match on friday<sup>4</sup>.</p>
</section>

<section data-kit="question" data-id="q1">
  <p>post it in #team now, or wait for Marc's check?</p>
  <ol><li>post now</li><li>wait for Marc</li></ol>
</section>

<section data-kit="sources" data-id="src">
  <ol>
    <li><a href="https://acme.slack.com/archives/C01PERF/p1712">#perf · Slack</a>, thursday</li>
    <li><a href="https://linear.app/acme/issue/DARK-12">DARK-12 · Linear</a></li>
    <li><a href="https://metabase.acme.dev/dashboard/7">growth dashboard · Metabase</a></li>
    <li><a href="https://acme.slack.com/archives/C01REL/p1713">#release · Slack</a>, friday</li>
  </ol>
</section>
```

More examples, each one passing the lint: `apps/ambient/kit/examples/` in the bise app
(`weekly-update.html` a doc, `offsite-venues.html` a table to choose from,
`pricing-question.html` a decision, `inbox-review.html` the inbox: replies to approve and a mail
ready to send, `launch-post.html` a Slack post to check and copy, `offsite-plan.html` a plan:
venues to compare and what's left to do, `offsite-todo.html` who does what by when,
`launch-watch.html` a standing order: new comments with drafted replies).

## 4. Publish fast, then fill it

The user should see the page within about 10 seconds of asking, then watch it fill in. So:

0. **A page started for you:** when your brief gives you a page id (main ran `sb page start`),
   the page is already open and says you are writing it, with your actions as its live progress
   line (the one-line description you give each command: make them say what you do, in the user's
   words: `reading #launch in Slack`). Publish to that id; your first publish replaces the
   placeholder.

1. **Skeleton first**, before you gather anything: the title, the section headings you expect,
   and a callout that says what you are doing. Publish it at once.
   ```html
   <section data-kit="heading" data-id="title"><h1>the week, in three lines</h1><p>week 41 · for #team</p></section>
   <section data-kit="callout" data-id="writing"><h3>writing…</h3><p>reading Slack and Linear for this week.</p></section>
   <section data-kit="heading" data-id="h-numbers"><h2>numbers</h2></section>
   ```
2. **Fill it** with further publishes of the same `--id` as each part is ready (the open tab
   swaps the new blocks in place, the user's scroll stays). Keep the ids you already used.
3. **Last publish**: drop the `writing` callout, add the sources.

**A page of items** (mails to answer, comments, bugs): draft and publish as you read, never
read everything first.
1. List the items first, subjects and senders only (one call, no bodies), and pick the ones that
   need the user.
2. Read the first 2 or 3 of those, draft their replies, and publish them as v2 **within about 45
   seconds of the ask**, with the `writing` callout saying where you are: `5 of 20 read`.
3. Then one version per 2 or 3 more items, each added under the others, the callout counting up.
4. Last: what you skipped (newsletters, notifications) as one short table or callout, the
   `writing` callout gone, the sources.
The user starts reviewing the first replies while you write the rest. `examples/inbox-writing.html`
is such a v2.

**Drafts stay on the page.** While you write and until the user's word on the page (`send`,
`approve`, "put it in my drafts"), nothing goes to their accounts: no draft in Gmail or Outlook,
no message, no post, no label. The page is where they review; the account comes after.

Write the fragment in your temp folder, then:

```
sb page publish $TMPDIR/weekly-update.html --id weekly-update --title "weekly update"
```

- `--id`: lowercase, digits and `-`, 40 at most; keep it for every version of the page.
- `--title`: what the user calls it, lowercase (shown in the frame and in "for you").
- It prints `published weekly-update v1 · <url>`. The user gets it in "for you" (and in front
  if they were waiting for it): don't paste the HTML in your reply. Say one line with what the
  page is and what you want from them: `the weekly update is ready: check the numbers and pick
  when to post.`
- A refusal prints the lint's lines: fix each one, publish again.

## 5. Answer the notes

When the user sends notes you get one message: `you sent 3 notes on your page "weekly update"
(weekly-update v1, <url>)`, a numbered list, and a `<page-notes>` block with each note's id,
block, quote, kind and words (an edit has its text before and after; a pick has the option).

1. Change the page for each note. Keep the same ids for the same blocks: change their content,
   don't renumber. Keep the user's own edits as they are unless a note asks otherwise. An
   answered question gets `data-answer="<option number>"`.
2. Publish the next version with the outcome of each note:
   ```
   sb page publish $TMPDIR/weekly-update.html --id weekly-update --notes-done n1,n3 --note-answer n2="the March numbers are not out yet: i kept February"
   ```
   `--notes-done` for the notes you did; `--note-answer` (one per note) for a note you answer in
   words instead, or only partly did. Every note sent gets one or the other.
3. Reply in one line: `v2 is up: 3 notes done.`

Two kinds of notes ask for more than a change of the page:
- **`taste: true`**: the user said yes to "keep this for next time?". Besides doing the note,
  append the preference as one line to `~/bise/taste.md` (create it if needed), in general
  words that will hold for other pages (`numbers: one per cell, the change in its own column`),
  never the page's own content.
- **kind `start`** ("start an agent on this", with an item and its text): it goes to main, not
  to you; main starts an agent on it. Nothing to change on your page unless another note asks.

## 6. A standing order: one page, kept up to date

"watch the launch for me", "tell me when the PR is reviewed": one page you keep current, not a
new page each time.
- Check on a timer: `sb every 10m "<what to check>"`, written as the instruction to your future
  self (`check the launch on HN, X and Reddit; republish launch-watch with what's new`). It
  wakes you with `timer #3 (every 10m, …): <that line>`. Add `--until 18:00` or `--times 6` when
  the user gave an end. `sb every` lists the timers; `sb every --stop 3` stops one: when the user
  says so or the thing is over.
- Each check republishes the **same page id**: what is new on top (a `callout` saying `since
  14:10` and what came), the items still to handle under it, the handled ones gone or folded into
  one line (`12 answered earlier`). Keep each item's `data-id` (the comment's id, the PR's
  number) so the user's notes stay on it.
- Nothing new: don't publish; at most update the heading's meta line (`last check 14:20`) on the
  next real change.
- A card (`sb card`, through main) only for what the user asked to be told about, in their
  words ("tell me if Simon posts"); everything else waits on the page.

**The morning page** ("a page every morning with my day"): a daily timer,
`sb every day 07:30 "make today's morning page"`, and each morning a new page with the id
`morning-YYYY-MM-DD` (today's date: the app opens exactly that id). In this order, each part
left out when empty:
1. a `heading`: `your tuesday` and the meta line (`3 meetings · 2 wait for you`);
2. what waits for the user: a `review` of the mails and messages to answer, the questions
   agents left open, each with its draft;
3. today's meetings: a `table` (`time`, `what`, `with`, `prep`), the prep in words
   (`read Camille's renewal mail`);
4. what agents finished overnight: one line each with its page or PR, in a `prose` list;
5. pages not opened yet: a `prose` list of links (`/p/<id>`), oldest first.
Nothing waits and no meetings: a short page that says so, never an empty one.

## 7. When the page leaves

Acting on the page is a separate step the user asks for ("post it in #team", "send the mail",
"make it a Google Doc"), through the usual approvals, never before their word:
- take the text from your last published version, in the page's order, with the user's edits
  (they came to you as notes), without the kit's chrome (no frame, no buttons, no "sources" label);
- a `message` block goes as is to its `data-to` channel (Slack markup: `*bold*`, `_italic_`,
  `• ` items, `<url|text>` links); an `email` block through the mail tool, its fields as the
  mail's to, cc, subject;
- a whole page as a doc: headings as headings, tables as tables, each `<sup>n</sup>` as a link to
  its source (or the sources as a list at the end);
- "put it in my drafts" (the user's words, or their `send` on a draft they want to finish in
  their tool): a draft doesn't leave, so it needs no card, but it waits for that word like
  anything else: never make drafts in their account on your own, never during the first
  versions. Then make the draft in the user's tool (Gmail, Outlook, Kit), only the ones they
  approved, and record where it went on the block it came from:
  `sb page publish $TMPDIR/p.html --id <id> --went gmail-draft:<draft id>@e1=<its https link>`
  (kinds: `gmail-draft`, `outlook-draft`, `kit-draft`, `slack`, `copy`). The page shows
  `in your Gmail drafts · open` under that block. A later version updates the same draft (read
  it back first, the user may have edited it there), never a second one;
- Slack has no drafts: the user copies (the `message` block's `copy`, with `data-open` for the
  channel link); a post you made after their approval is `--went slack:<ts>@m1=<its link>`;
- a tool that fails (Gmail didn't take the draft): one line in your reply and a `risk` callout
  on the page (`Gmail didn't take it: copy it from here`), never a file path;
- then say where it went in one line (`posted in #team.`) and, when it makes sense, publish a last
  version that says so (a `good` callout: `posted in #team, 14:02`).

## 8. What bise keeps about the user

"what do you know about me?", "show me my taste rules": main publishes one page, id `about-you`,
from `~/bise/taste.md` (the taste rules) and `~/bise/people.md` (who is who), when they exist:
- a `heading` (`what i keep about you`, meta line: `5 taste rules · 4 people · edit or strike any`);
- `## your taste`: a `review` with `data-verb="keep"`, one item per rule, its `data-id` the
  rule's slug (`no-emoji`): a first `<p>` saying where it came from (`from your notes on the
  launch recap · 12 may`), then the rule in a `<p>`, as the user would say it. The kit gives each
  one `keep` / `strike`, and the rule's words are editable in place; each change comes back as a
  note;
- `## who is who`: the same, one item per person (`data-id` their slug): `<p>Lélio Martin</p>`
  then `<p>your manager. the weekly update goes to him on fridays.</p>`;
- a `callout` (`note`): `nothing else is kept: no mail, no messages. strike a line and it's gone.`
- no `sources` (it is the user's own words) and no `question`.
Notes on it go to main, who rewrites the files (a struck rule: deleted; an edited one: replaced,
in the user's words) and publishes the next version with `--notes-done`. Nothing kept is ever
shown elsewhere without the user asking.
