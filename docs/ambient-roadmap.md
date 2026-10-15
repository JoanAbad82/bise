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
- **The act is "put it in my drafts"**: `put in Gmail drafts` / `put in Kit` on the page's frame
  (and by voice: "put it in my drafts"). A draft doesn't leave, so it needs no approval card (an
  approvals-gate rule: draft-making tool calls are classified as not leaving); it says `in your
  Gmail drafts · open` and the link opens it there. Sending stays his, in Gmail/Kit (his habit,
  launch#999). A send from bise is still possible later, through the gate.
- **Slack has no API for a user's drafts**, so a Slack message waits on the page. His explicit
  `send` on it posts it as him (decided, ambient-lead m_6161: the same as D's mails, and the
  button names what happens: `send` = bise sends it). For places with no send tool, the message
  block has `copy` and `open #team` (a `slack://` link), and the frame says `copied · open #team`.
- The page keeps a `where it went` line (`in your Gmail drafts since 14:02`), so a later "v3"
  updates the same draft (it reads it back first), never makes a second one. Data:
  `sb page publish … --went gmail-draft:<id>=<url>` into the page's meta.
- When the connector fails (launch#1008): one line on the frame, `Gmail didn't take it. copy ·
  try again`, and the copy button copies the draft as rich text. Never a file path.

**Proves.** The loop ends somewhere real: the page is the workshop, the tool is the shelf.
**Done when.** "write Lélio the mail he asks for in the #rh thread" → a mail page with the thread as
its source → 2 voice notes → v2 → "put it in my drafts" → it's in Gmail drafts, the link opens it;
v3 updates that same draft. And "tell Benjamin on Slack how to install bise" → a message page →
`copy` → `copied · open @benjamin` opens the DM, the text ready to paste. No card in either.

### B: watch for me (the launch desk, standing orders)

**The job.** The launch: "tell me what people say on HN, Reddit, X, Bluesky; what needs an
answer". Then the same for mail and Slack.

**The UX.**
- **A standing order**: "watch the launch until tomorrow" makes an agent that checks every N
  minutes and **republishes its page** (vision §4 keeps pages static: freshness comes from the agent
  republishing, not from the page fetching). The hub wakes it on a timer, so no agent burns turns
  sleeping: `sb every 10m "<message>" [--until …]`, `sb every --stop`. The frame says
  `watching · checked 3 min ago · until tomorrow 18:00` and `stop`.
- The page kind **review** (vision §4): the comments that need him, grouped (questions, bugs,
  praise), each with a drafted reply; approve / edit / skip; `approve 5`. Approve = the reply goes to
  the place's draft or, for HN/Reddit/X/Bluesky (read-only plugins), **opens the thread in his
  browser with the reply prefilled where the site allows** (X and Bluesky compose intents, or
  computer use typing into his tab), **else copied + opened**; he presses post. bise never posts.
- **When it speaks first** (the always-on promise): only a card for what he asked to be told
  (`? a HN comment asks if it works with Claude Code`, `1 draft a reply` `2 later`); the rest waits
  on the page. Numbers (stars, points, rank) sit in the page's header, no card.
- No capsule while it watches (vision §3 G): the menu-bar icon moves and its count grows with the
  comments that wait for him; its menu says `watching the launch · 3 new for you`.

**Proves.** Always on, without noise: bise works while he doesn't look, and only decisions reach him.
**Done when.** "watch the launch until tomorrow" → a review page that updates by itself → a card
for one comment he flagged as important → 3 replies approved → each opens its thread with the
reply in the box.

### C: feedback into work (the bridge)

**The job.** "Benjamin's bug reports on Slack: handle them so adoption at Mistral is easy".

**The UX.**
- A **review** page of the feedback, one item per report: what he said (quoted, linked), what bise
  thinks it is, and the proposed action: `start an agent to fix it`, `answer Benjamin`, `skip`.
- Approve `start an agent` = a note of kind `start` sent to main (only main starts agents); main
  starts a dev agent on the right repo with the item as its brief; the item (`data-agent`) then
  shows that agent's status live, pushed by the page server from the hub's agent states
  (`∿ fix-install-path working`, `✓ done · PR`).
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

**The UX.** No capsule pops up in the morning (vision §3 G): the menu-bar icon's count says the
page is there; at the first fn of the day bise says `good morning. 3 things need you · fn + o`. The page: what needs him (cards waiting, replies to approve, steps that are
his), what agents finished overnight, today's meetings with a brief for each (Granola, the
calendar), what's watched. Nothing else. One page, under a minute to read. A standing order (B's
`sb every`) prepares it at a set hour, so the first fn opens it at once: never computed on the fn.

**Proves.** Always on means he starts the day already caught up.
**Done when.** a week of mornings where the page is the first and only place he looks.

Later, same parts: meetings (a brief before, the follow-ups after, from Granola and the calendar);
the deck or doc review someone sent; the persona's weekly update.

### F: mentions for me (B, for his own team)

**The job.** In the launch watch, the cards that mattered were his team asking him something
(Marc in #launch: `can the weekly update carry these numbers?`; Lélio). Those questions sit in
Slack and mail until he finds them. F is B pointed at him: a standing order that collects what
asks *him*, with an answer drafted.

**The UX.** "keep an eye on what people ask me" (or on by default in the home workspace) → an
`sb every` timer reads Slack and mail; each direct question to him (an @-mention with a question,
a DM, a mail from his team that asks) becomes an item on one page, `for you`: who, what they
asked (quoted, sourced), a drafted answer (A's message or email block), `send` / `edit` / `skip`.
A card only for a direct question from his team, one card per batch (`2 questions for you ·
Marc, Lélio`); news, FYIs and comments never make a card, they wait on the page. Nothing leaves
without his word: Slack is copy + open (A), mail is a Gmail draft or a send on his word.

**Proves.** Always on is about his people, not only his launch.

**Done when** (headless, fake accounts, then one spoken ask on the app):
- "keep an eye on what people ask me" → a `for you` page within 30 s, listing every direct
  question in the fake Slack and mail (Marc s210, Lélio s215, the acme mail that asks), each with
  a drafted answer; FYIs and news are not items.
- After a tick that adds one direct question and one FYI: the page republishes with the
  question only; one card for it; the FYI makes no card.
- `send` on a mail answer → exactly one outbox send; on a Slack answer → copied + opened, the
  outbox shows no post; `skip` leaves nothing.
- `stop` ends the timer; the menu bar's count matches the page's open items.

### G: promises (what he said he'd do)

**The job.** From meetings (Granola), his sent mail and his Slack (`i'll send it friday`), the
things he promised; today they live in his head. bise keeps them: D's checklist, with dates, the
draft ready when one is due.

**The UX.** No ask needed once it's on: a `promises` page (D's checklist rows, `yours`, a due
date, the source quoted), kept by a timer. An overdue promise leads the morning page (E) with its
draft (amb-kit's meetings rule: no card from a meeting page, overdue or not). A row ticks when
his own sent mail or message shows it done, or when he ticks it.

**Proves.** bise remembers for him.

**Done when** (headless, fake accounts): the fake meetings, mail and Slack hold 4 promises, one
overdue, one already kept → the page lists the 3 open ones with dates and sources; the overdue one
leads the next morning page with a draft; a fake sent mail that keeps one ticks it on the next
run; no card at any point.

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
   `keep this for next time?` → main writes a line in his taste file (`~/bise/taste.md`, the home
   workspace), which the `bise-pages` skill tells every page-making agent to read. The page frame says `following your taste · 4 rules` (a link to edit them). After
   a week, v1 already sounds like him.
5. **Speed is the UX.** A page that takes 4 minutes is a page he stops asking for. Each slice's
   done-when gets a time: the first version in under 90 s for a draft, the next version in under
   45 s after send; the frame shows progress (`reading the thread · writing`: the page's state plus
   the agent's current tool intent, which the hub has), never a blank wait. The guide makes agents
   publish a skeleton (frame, headings, `writing…`) within ~10 s, then fill it through the live swap.

## 4. bise as an entity (with ambient)

The user asked for bise to have a personality: "the agent that's always there and lets itself be
forgotten", "a reassuring presence". What that means for the product, to settle with ambient (who
owns the look and the words):

- **One someone.** You talk to bise; bise says "i". Agents are its hands, named by what they do.
  The voice, the capsule's words and the frame's words on pages are the same someone.
- **Quiet by default.** It speaks first only for: a decision that's yours, something you asked it
  to watch, the morning. Never to fill silence, never "anything else?".
- **It knows when not to talk.** No voice while the mic or a camera is used by a call, the screen
  is shared or the front app is full screen; text only, and cards wait unless urgent. (All read on
  the Mac with no permission; the calendar is not read: Apple audit #554.)
- **Reassuring.** It says what it did and what it didn't, in one line; a failure is plain, never
  joked about, and comes with what it does next.
- **It remembers.** Your taste (§3.4), who people are (`Lélio · your manager`), what you asked it
  to watch. Shown, editable, never creepy: everything it keeps about you is one page.
- **A little kiss.** The `:*` at most once, at hello, never at a failure.

Agreed with ambient (m_4863). The look the user validated is round 8
(`site/content/ambient/identity8.html`, main m_5134): direction A's dark smoked glass, white text,
bise pink, and the pink mist pearl as bise's body, with its moods (how it rests, listens, works,
nudges once when it needs you, nods when done, goes still on a failure) and the menu-bar states.
At rest it's out of sight (vision §3 G): the personality lives in the menu-bar icon and in the
moments the capsule shows. On ambient surfaces the speaker is bise (`release
failed. i'm on it.`, the label `bise`, `bise sees Chrome · …`), the agents are its hands, `main`
stays the TUI thread's name: the signed `W` lines change **only once the user says yes to round 4**.
`keep this for next time?` is a quiet line under the note, once per preference, never a dialog.

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
| F | Marc's and Lélio's questions in the launch watch | a `for you` page, one card per batch | his team, not only his launch (decided, ambient-lead m_5980) |
| G | what he said he'd do | promises kept as his checklist | bise remembers for him (after F) |

Also decided (ambient-lead m_5980): consecutive drafts ready at once make **one** card (`3 drafts
ready · send all / review`, fn + 1 sends all, fn + o opens the page); every slice's done-when has
one spoken ask on the app with the fake voice (`qa.py run … --app --voice`). Waiting on his yes:
a dogfood day on his real accounts, with him there, logging each ask and every time he went back
to the terminal or the browser.
