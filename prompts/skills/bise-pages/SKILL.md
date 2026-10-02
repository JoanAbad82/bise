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
| `review` | items the user approves or skips one by one (mails to answer, tickets, expenses) | `<ol>` of `<li data-id="m1">`: a first `<p>` saying what it is (`Léa Martin · offsite dates · 9:12`), then the proposal |
| `message` | a draft that leaves through a channel (Slack, a post) | `data-to="Slack · #launch"` (where it goes, shown above it), then `<p>`s and `<ul>`, with `<strong>`, `<em>`, `<code>`, `<a>`: the kit's `copy` turns them into Slack markup |
| `compare` | 2 to 4 options side by side (venues, drafts, tools) | `<ol>` of `<li data-id="moulin">`: an `<h3>` name, a `<ul>` of facts, a `<p>` with the why |
| `checklist` | what's left to do, who, by when | `<ol>` of `<li data-id="t1">` the task `<small>who · when</small></li>`; `data-done` on what is done |
| `email` | one mail ready to send | `<p data-field="to">`, optional `<p data-field="cc">`, `<p data-field="subject">`, then the body as `<p>`s |

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
venues to compare and what's left to do).

## 4. Publish fast, then fill it

The user should see the page within about 10 seconds of asking, then watch it fill in. So:

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

## 6. When the page leaves

Acting on the page is a separate step the user asks for ("post it in #team", "send the mail",
"make it a Google Doc"), through the usual approvals, never before their word:
- take the text from your last published version, in the page's order, with the user's edits
  (they came to you as notes), without the kit's chrome (no frame, no buttons, no "sources" label);
- a `message` block goes as is to its `data-to` channel (Slack markup: `*bold*`, `_italic_`,
  `• ` items, `<url|text>` links); an `email` block through the mail tool, its fields as the
  mail's to, cc, subject;
- a whole page as a doc: headings as headings, tables as tables, each `<sup>n</sup>` as a link to
  its source (or the sources as a list at the end);
- then say where it went in one line (`posted in #team.`) and, when it makes sense, publish a last
  version that says so (a `good` callout: `posted in #team, 14:02`).
