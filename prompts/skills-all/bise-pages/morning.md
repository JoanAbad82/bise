# bise pages: the morning page

Read this when a timer wakes you with "make today's morning page", or the user asks for "a page
every morning with my day". It is the one page bise prepares unasked: the user opens it with
his first fn of the day, so it is ready before then, never computed when he asks.

**The order** (once, when the user asks for it): `sb every day 07:30 "make today's morning page
(bise-pages morning.md)"`. Each wake makes a new page with the id `morning-YYYY-MM-DD` (today,
his time zone): the app opens exactly that id. No `--page`: it is a new page each day.

**The page: four parts, nothing else, under a minute to read.** Each part left out when empty;
at most 5 lines per part, the rest as one line with a link (`+4 more on the launch watch`).
Every line links to where it is handled: a page's item as `/p/<page id>#<item id>` (the page
opens on that item), a PR or a doc by its https link.

1. `heading`: `your tuesday` and the meta line in numbers (`3 need you · 2 done overnight ·
   3 meetings`).
2. **What needs you**, a `prose` list under `## needs you`: the cards waiting for him, the
   replies he hasn't sent yet, his own checklist steps (`data-who="yours"`) whose turn has come.
   One line each, the thing and where it waits: `<a href="/p/inbox-review#m2">reply to Marc
   about invoice #2231</a> · inbox`. Never the drafts themselves: they stay on their page.
3. **Done overnight**, a `prose` list under `## done overnight`: one line per agent that
   finished, what it did and its link (`export csv: the 10,000-row cut is fixed, PR #881`).
4. **Today's meetings**, under `## today`: one `prose` block per meeting, a first `<p>` with
   `<strong>14:30</strong> Q3 renewal · Camille Roux`, then a brief of at most 3 short lines
   (`<ul>`): what it is about, what was said last time (Granola's notes), what to have read or
   decided before. From the calendar and Granola only; a meeting without notes gets its
   calendar description, or one line `no notes from last time`.
5. **Watched**, a `prose` list under `## watched`: each standing order's page with what is new
   since he last looked (`<a href="/p/launch-watch">the launch</a> · 4 new, 2 need a reply`).

When the user wants briefs before his meetings, the same wake also sets each meeting's two
timers (`meetings.md`).

No `sources` block (every line links to its place), no `question`, no `review`: decisions are
made on their own pages. Nothing waits, nothing new, no meetings: a short page that says so in
one line, never an empty one. See `examples/morning.html`.
