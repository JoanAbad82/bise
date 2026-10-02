# bise ambient v2: the next slices, from Gabriel's real week

Owner: ambient-pm. Builds on [ambient-vision.md](ambient-vision.md) (the why and the rules) and
slice 1 ([ambient-pages.md](ambient-pages.md), the page loop). v2 has one user, Gabriel (§10.3), so
every slice below starts from something he really asked bise for in the last two weeks (quoted from
the threads, `sb history`), not from the persona's imagined week. Each slice: the job, the UX it
adds (pages, notes, voice, cards), what it proves, and its done-when. ambient-lead cuts and staffs;
ambient signs the screens and words; ambient-pm runs the QA gate ([ambient-qa.md](ambient-qa.md)).

## 0. What his week really is

From his threads (launch, main, designer), 2026-09-18 → today:

| what he asked | thread | what it needed | what went wrong or slow |
|---|---|---|---|
| "tu peux lire le thread slack, il demande un email à ma RH" → "tu peux sauvegarder le draft dans mon gmail? je vais l'éditer là-bas" | launch#854, #999 | read a Slack thread, write a mail, put it in his Gmail drafts | the Gmail connector failed; the text went to a file. He wants to **finish in the tool where it lives** |
| "fais des drafts slack en fait si tu préfères" · "dis à Benjamin sur slack comment télécharger et tester bise" | main#16822, #16380 | a Slack message to a colleague | drafts, not sends: he keeps the last word |
| "on a reçu des bug reports de benjamin … tu peux traiter pour que l'adoption interne soit facile?" | main#30979 | read feedback, turn it into fixes | feedback → dev work: the bridge between his two lives |
| "tu peux checker mes mails et me donner une todo list step by step pour acheter le domaine?" | designer#4431 | mail → a checklist of steps, some only he can do | a checklist in chat text, no ticking, no "done" |
| the launch: posts, the HN/Reddit/X/Bluesky watch, stars, the newsletter (Kit) | launch | watch, answer comments, write the recap | plugins exist (hn, reddit, x, bluesky, bise-stats, kit): read-only, he posts himself |

Three patterns: (1) **things that leave** (mail, Slack, posts, newsletter) end as a draft where they
live, never sent by bise; (2) **watching** (the launch, feedback, mail) is most of "always on";
(3) **feedback turns into work**: a bug report becomes an agent's task.

## 1. A change to slice 1's demo (not its build)

The done-when's prompt, "draft my weekly update from Slack and Linear", is the persona's job, not
his: he has no weekly update. Same plumbing, his job: **"write the launch recap for Slack, from
today's numbers and the HN thread"** (bise-stats, hn, Slack). It tests the same page loop on content
he cares about today. QA runs both.

## 2. The next slices, in order

Already in build (ambient-lead): the vision's slice 2 (voice notes on a page, a page's question as
a card, versions) and the home workspace without a repo (amb-home). The job slices below come
after, lettered so they don't clash with the build's numbers; each reuses those parts.

### A: drafts where they live (Slack, Gmail, Kit)

**The job.** "write Lélio the mail he asks for in that thread", "tell Benjamin on Slack how to
install bise", "the newsletter for the launch". Most of what he asks bise to write.

**The UX.**
- The page kind **email draft** (to, subject, body) and a new **message draft** (Slack: channel or
  person, text): a doc with a header, the same notes.
- Voice notes at the mouse (hold fn on the page), and "send" by voice: the gesture that makes pages
  feel like talking to a person (vision §3 C). Already in the build's slice 2; this job is its first real use.
- **The act is "put it in my drafts"**: `put in Gmail drafts` / `put in Slack drafts` / `put in Kit`
  on the page's frame (and by voice: "put it in my drafts"). A draft doesn't leave, so it needs no
  approval card; it says `in your Gmail drafts · open` and the link opens it there. Sending stays
  his, in Gmail/Slack/Kit (his habit, launch#999). A send from bise is still possible later, through
  the gate.
- The page keeps a `where it went` line (`in your Gmail drafts since 14:02`), so a later "v3" knows
  it must update the draft, not make a second one.
- When the connector fails (launch#1008): one line on the frame, `Gmail didn't take it. copy ·
  try again`, and the copy button copies the draft as rich text. Never a file path.

**Proves.** The loop ends somewhere real: the page is the workshop, the tool is the shelf.
**Done when.** "write Lélio the mail he asks for in the #rh thread" → a mail page with the thread as
its source → 2 voice notes → v2 → "put it in my drafts" → it's in Gmail drafts, the link opens it.

### B: watch for me (the launch desk, standing orders)

**The job.** The launch: "tell me what people say on HN, Reddit, X, Bluesky; what needs an
answer". Then the same for mail and Slack.

**The UX.**
- **A standing order**: "watch the launch until tomorrow" makes an agent that checks every N
  minutes and **republishes its page** (vision §4 keeps pages static: freshness comes from the agent
  republishing, not from the page fetching; no new architecture). The frame says
  `watching · checked 3 min ago · until tomorrow 18:00` and `stop`.
- The page kind **review** (vision §4): the comments that need him, grouped (questions, bugs,
  praise), each with a drafted reply; approve / edit / skip; `approve 5`. Approve = the reply goes to
  the place's draft or, for HN/Reddit/X (read-only plugins), **opens the thread in his browser with
  the reply ready to paste** (computer use fills the box; he presses post). bise never posts.
- **When it speaks first** (the always-on promise): only a card for what he asked to be told
  (`? a HN comment asks if it works with Claude Code`, `1 draft a reply` `2 later`); the rest waits
  on the page. Numbers (stars, points, rank) sit in the page's header, no card.
- The capsule's idle line can carry the watch: `watching the launch · 3 new for you`.

**Proves.** Always on, without noise: bise works while he doesn't look, and only decisions reach him.
**Done when.** "watch the launch until tomorrow" → a review page that updates by itself → a card
for one comment he flagged as important → 3 replies approved → each opens its thread with the
reply in the box.

### C: feedback into work (the bridge)

**The job.** "Benjamin's bug reports on Slack: handle them so adoption at Mistral is easy".

**The UX.**
- A **review** page of the feedback, one item per report: what he said (quoted, linked), what bise
  thinks it is, and the proposed action: `start an agent to fix it`, `answer Benjamin`, `skip`.
- Approve `start an agent` = main starts a dev agent on the right repo with the item as its brief;
  the item then shows that agent's status live (`∿ fix-install-path working`, `✓ done · PR`).
- When an agent finishes, the page's item gets its answer and the drafted reply to Benjamin
  (`fixed in 0.4.2. try again?`), which goes to Slack drafts (A's act).

**Proves.** bise for everyone and bise for developers are one product: a page is where a non-code
input becomes code work and comes back as a human answer.
**Done when.** a Slack thread with 3 reports → a review page → 2 agents started from it → their
status on the page → 2 replies in Slack drafts.

### D: steps only you can do (checklists that tick themselves)

**The job.** "check my mail and give me a step-by-step to buy the domain".

**The UX.**
- The page kind **checklist** (vision §4): each step says who does it: `i'll do it` (bise, through
  connectors or computer use) or `yours` (a payment, a login, a signature). bise does its own steps
  and ticks them; `yours` steps are cards when their turn comes (`? pay the domain on Gandi · open`).
- Ticking by voice ("done with the payment") from anywhere: the capsule knows which checklist is
  open.

**Proves.** The page is a shared plan between him and bise, not a to-do list he reads.
**Done when.** a 6-step plan where bise does 4 and asks for 2, all ticked, none forgotten.

### E: the morning (the one time bise speaks first unasked)

**The job.** Not asked yet; the natural next step of B-D: one page each morning.

**The UX.** At the first fn of the day (never on a timer while he's away): `good morning. 3 things
need you · fn + o`. The page: what needs him (cards waiting, replies to approve, steps that are
his), what agents finished overnight, today's meetings with a brief for each (Granola, the
calendar), what's watched. Nothing else. One page, under a minute to read.

**Proves.** Always on means he starts the day already caught up.
**Done when.** a week of mornings where the page is the first and only place he looks.

Later, same parts: meetings (a brief before, the follow-ups after, from Granola and the calendar);
the deck or doc review someone sent; the persona's weekly update.

## 3. Challenges to what's there

1. **The capsule says `main`.** For an always-on presence, `main is on it.` reads like plumbing;
   the user talks to bise. Proposal (with ambient, see §4): on ambient surfaces the speaker is
   bise (`:* on it.`, `i'll put it in your drafts.`), `main` stays the thread's name in the TUI.
2. **The approvals gate for drafts.** A draft that stays in his own Gmail/Slack doesn't leave: no
   card. Cards are for what really leaves (a send, a post, a payment). Fewer cards, more trust.
3. **Pages for one-liners.** Main's rule (vision §3 B) must also say when **not** to make a page:
   a fact, a yes/no, a status. A page for "what's my next meeting" is noise. QA checks both ways.
4. **His taste, learned.** His notes repeat (no emoji, lowercase, short, no "it's not X, it's Y").
   Every note that states a preference ("never …", "always …", "too long") is offered back once:
   `keep this for next time?` → a line in his taste file (the bise home), which every page-making
   agent reads. The page frame says `following your taste · 4 rules` (a link to edit them). After
   a week, v1 already sounds like him.
5. **Speed is the UX.** A page that takes 4 minutes is a page he stops asking for. Each slice's
   done-when gets a time: the first version in under 90 s for a draft, the next version in under
   45 s after send; the frame shows progress (`reading the thread · writing`), never a blank wait.

## 4. bise as an entity (with ambient)

The user asked for bise to have a personality: "the agent that's always there and lets itself be
forgotten", "a reassuring presence". What that means for the product, to settle with ambient (who
owns the look and the words):

- **One someone.** You talk to bise; bise says "i". Agents are its hands, named by what they do.
  The voice, the capsule's words and the frame's words on pages are the same someone.
- **Quiet by default.** It speaks first only for: a decision that's yours, something you asked it
  to watch, the morning. Never to fill silence, never "anything else?".
- **It knows when not to talk.** No voice while the mic is used by a call or during a calendar
  meeting; text only, and cards wait unless urgent. (The calendar and the mic state are already on
  the Mac.)
- **Reassuring.** It says what it did and what it didn't, in one line; a failure is plain, never
  joked about, and comes with what it does next.
- **It remembers.** Your taste (§3.4), who people are (`Lélio · your manager`), what you asked it
  to watch. Shown, editable, never creepy: everything it keeps about you is one page.
- **A little kiss.** The `:*` and the light touch when something goes well, at most once a reply.

## 5. Order and why

| slice | job (his words) | new UX | why now |
|---|---|---|---|
| 1 | the launch recap (demo) | the page loop | landing now |
| 2 | (the build's) | voice notes, questions as cards, versions; the home workspace | in build |
| A | "sauvegarde le draft dans mon gmail" | voice notes, drafts where they live | most of what he asks bise to write; closes the loop in a real tool |
| B | the launch watch | standing orders, review, the first card from a watch | always on, for real; the launch is now |
| C | Benjamin's bug reports | feedback → agents, live status on a page | the bridge between his two worlds |
| D | "todo list pour acheter le domaine" | checklists with who-does-what | a plan shared with bise |
| E | (next) the morning | one page a day | always on, before he asks |
