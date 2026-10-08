# The bar: what bise desktop must do before we call it usable

Owner: ambient-pm. The plan: http://127.0.0.1:47438/p/desktop-reset. The shared brief: ambient-lead's
`desktop-build.md`. The rows come from the terminal parity audit (`docs/ambient-qa.md`, "Terminal parity
audit") and ambient-pm's m_9398.

The user's goal (main m_7003): nobody needs the terminal to use bise. A row is done only when the app does
what the terminal does. The reference is the TUI, open on the same throwaway hub next to the app.

## How to read a row

- **id**: `⛔n` means the app can't be used without it. `2.n` is his list for "usable". `3.n` is
  parity after that. `S.n` is setup with no terminal, `A.n` agents and review, `P.n` plugins and
  computer use, `O.n` the rest.
- **terminal**: what the TUI does today. The source module is in brackets.
- **hand test**: what the user (or ambient-pm on the last turn's hand pass) does by hand on the app.
- **pass**: the rule. If the rule isn't met, the row fails.
- **chunk**: who builds it. The paths are in the brief's layout: amb-web for `src/composer`,
  `src/spotlight` and `src/pearl`; amb-win for `src/thread`, `src/agents`, `src/review` and
  `src/app`; amb-home for `src/inbox`, `src/setup` and `src/settings`; amb-mac for `src/main`
  (menus, keys, windows, bundling, updates) and `native/mac`; amb-core for the core, the hub and
  `src/store`.
- **check**: the end-to-end check under `tests/checks/<area>/`, written red first by qa-type,
  qa-flows or qa-native. Its id is the spec path without `.spec.ts`.

The same rules hold for every row:

- **Typing.** Every surface that takes typing keeps the typing invariants: 0 replaced nodes in the
  field and in the lists while typing, a caret that is drawn and blinks, and no frame change
  outside the field.
- **Test data.** Hand tests run on a throwaway hub with a fake provider and fake accounts, never
  on his real ones.

## ⛔: the app can't be used without these (his 7 bugs)

| id | terminal | hand test | pass | chunk | check |
|---|---|---|---|---|---|
| ⛔1 | typing in the composer: caret, multiline, editing keys (`input.rs`, `editor.rs`) | type a fast 3-line French message with accents (é, ç, « »), dead keys (^ then e), shift+⏎ for new lines, ⌥←/⌥→, select a word | the caret is always visible and blinks where the next letter goes; no flicker or blank frame while typing (a 60 fps recording shows none); each key does what it does in TextEdit | amb-web | qa-type `composer/typing` (caret, 0 replaced nodes, frames, shift+⏎), `composer/accents` (é ç « », dead keys ´ ^ ¨ through the real key path) |
| ⛔1s | the same typing in the spotlight (his bug 7) | fn+space, then type the same message fast | the same as ⛔1, and the result list under the field doesn't blink | amb-web | qa-type `spotlight/typing` |
| ⛔1p | the pearl (his bug 2) | watch the pearl through listen, think and answer, then at rest | no flicker, no jump, no background behind it; smooth at 60 fps | amb-web | qa-type `pearl/frames` |
| ⛔2 | the editing keys and the app keys | in the field: ⌘X, ⌘C, ⌘V, ⌘Z, ⌘⇧Z, ⌘A. In the app: ⌘Q, ⌘W, ⌘, and ⌘H | each one does the standard mac action, and each shows its key in the menu bar (a real Edit menu) | amb-mac (menus), amb-web (field) | qa-type `composer/edit-keys` (with ⌥ arrows), qa-native `native/mac-keys` |
| ⛔3 | ⏎ sends; the message shows in the feed and the agent's turn starts | type "hi" and press ⏎ with the app open a while (warm); then right after launch, as soon as the composer shows (cold); then with the core stopped | Cold: while the core waits for the hub's welcome, the state says so ("connecting to bise…", not "sending…"), and working comes no later than the TUI's own first send after its launch on the same hub, plus 0.5 s. qa-flows' first numbers (m_9859): warm 81 ms; cold 2.1 s, of which 1.86 s is the hub's welcome. Warm and cold:  his message shows in the thread in under 100 ms. From Enter until main's working state shows, every moment has a named state: "sending…", or the routing hold with where his words go, a countdown and a way to change it. Main's working state comes no later than the TUI's on the same hub, plus 0.5 s; a hold the app shows does not count. The answer streams in. Offline: one line with retry, and the draft is kept. Never a send with no trace | amb-win (thread), amb-core (send, events) | qa-flows `thread/send` |
| ⛔4 | the feed: full answers in markdown | ask for a 40-line answer with a list, a code block and a link, first in the window, then with fn+space | the whole answer is readable at the default size (body text at least 13 pt), with nothing cut off; it scrolls, links open, code keeps its shape and ⌘C copies. fn+space's answer goes into the thread or a panel that grows to fit, never a small fixed box | amb-win (thread), amb-web (spotlight answer) | qa-flows `thread/answers`, `spotlight/answer` |
| ⛔5 | the inbox, most blocking first, with `/answer N`, `/close N` and the approvals screen | on a hub with 1 question, 1 drafts card and 1 approval: ⌘I, then ↑↓, ⏎, 1–n, a typed free answer, and a close with no answer | the same items in the same order as the TUI's inbox; each act removes the item from both the app and the TUI; the keys are shown | amb-home, amb-core (the inbox events) | qa-flows `inbox/cmd-i` |
| ⛔6 | esc stops the turn | press esc during a long answer | the turn stops in under 1 s, the stop shows in the thread, and the composer keeps its text | amb-win, amb-core | qa-flows `thread/interrupt` |

## 2: his list for "usable"

| id | terminal | hand test | pass | chunk | check |
|---|---|---|---|---|---|
| 2.1 | `/` opens the command popup (`commands.rs`) | type "/" | a popup lists the commands below, filters as he types, tab completes and ⏎ runs. Each command does here what the TUI does on the same hub, with the same argument popups (agent, archived agent, card number, branch, effort, model). A command not built yet shows greyed as "not yet", never as a silent gap | amb-web (popup), amb-core (the command list and the calls) | qa-type `composer/slash` |
| 2.2 | `@` opens the file popup (`files.rs`, `docs/at-mentions.md`) | in a repo workspace, type "@" and part of a file name | the same top 5 as the TUI for the same query (file name ranked before path); tab replaces `@` and the query with the bare path and a space ("see @ap" becomes "see src/app.rs ", as the TUI's `completion_inserts_the_reference`; a leading `@name` is for an agent, `docs/at-mentions.md`); the agent reads that file (its answer quotes it) | amb-web, amb-core (the file index) | qa-type `composer/at-files` |
| 2.3 | `$` opens the skill popup (`skills.rs`) | type "$" and part of a skill name | the same list as the TUI's for this workspace; it inserts `$name `; the agent uses the skill | amb-web, amb-core (the skill list) | qa-type `composer/dollar-skills` |
| 2.4 | images become `[Image #N]` chips, from ⌘V, a dragged file or an @ image (`attach.rs`, `docs/images.md`) | ⌘V a screenshot, drag in a PNG, pick a .png with @ | each one makes a chip with a thumbnail that one key removes; the agent describes what is in the image correctly; no file path shows as text | amb-web | qa-type `composer/images` |
| 2.5 | quotes: select text in the history and type, and a `❝ 1` chip goes in at the caret, with the strip "first words…  main · 3 lines" (`quote.rs`) | select 3 lines of an answer and type a question | the chip goes in at the caret; the strip shows where the quote comes from; the agent's answer is about that passage | amb-web (chip), amb-win (selection in the thread) | qa-type `composer/quote` |
| 2.6 | ctrl+r dictates into the composer; ctrl+r twice starts voice mode; `/voice` sets the model, the voice and the language | hold the voice key and say a sentence; then start hands-free mode | the words go in at the caret, editable, never sent by themselves; hands-free mode is separate and shown; the language and the model are in settings, as with /voice | amb-web (composer), amb-mac (fn, mic), amb-home (settings), amb-core (voice) | qa-type `composer/dictation` (fake mic) |
| 2.7 | a long paste becomes a `▤ 1` chip; the first undo makes it inline text (`pasted.rs`) | paste 200 lines, then ⌘Z | a chip shows the line count; ⌘Z makes the text inline; the agent gets all 200 lines | amb-web | qa-type `composer/long-paste` |

**The /commands of 2.1.** The rule: the app offers every TUI command that acts on bise, not on the
terminal, with the same names and arguments, so his habits carry over. That is 32 of the TUI's 33.
`/version` (a dev tool) and the dev-only commands stay out. There is no `/effort` (it is `/reasoning`),
`/clear` or `/drop`.

- Runs in place, as a typed core command (amb-core): `/new [-w] [name:] objective`, `/archive`,
  `/restore`, `/isolate`, `/rename`, `/answer N text`, `/close N [note]`, `/model`, `/reasoning`,
  `/interrupt`, `/stop`, `/compact`, `/quit` (the agents keep running), `/restart` (restarts the core
  with nothing lost; the way out of S.5), `/update`.
- Opens a screen:
  - `/inbox` (also `/cards`): ⌘I, amb-home.
  - `/agents`, `/switch`, `/archived`, `/diff [<branch>]`, `/artifacts`, `/scheduled`: amb-win.
  - `/models`, `/provider`, `/plugins …`, `/computer-use`, `/voice`, `/theme` (auto follows macOS): settings or setup, amb-home.
  - `/welcome`, `/setup`: setup, amb-home. Here `/setup` checks again permissions, sign-in and the workspace.
  - `/help`, `/shortcuts` (also `/keys`): the key list, amb-home.

**The 7 red bug checks** (qa-type) reuse the bar's ids, and each spec's header names its row and bug:

| bug | check |
|---|---|
| 1. no caret, flicker, dead @ $ / | `composer/typing`, `composer/slash`, `composer/at-files`, `composer/dollar-skills` |
| 2. pearl flicker | `pearl/frames` |
| 3. no images, quotes or voice | `composer/images`, `composer/quote`, `composer/dictation` |
| 4. ⌘I does nothing | `inbox/cmd-i` |
| 5. a send does nothing | `thread/send` |
| 6. the fn+space answer can't be read | `spotlight/answer` |
| 7. spotlight flicker | `spotlight/typing` |

qa-type writes the first cut of `inbox/cmd-i`, `thread/send` and `spotlight/answer`, then hands them to qa-flows.

## 3: parity after that

| id | terminal | hand test | pass | chunk | check |
|---|---|---|---|---|---|
| 3.1 | during a turn, tab queues the message and ⏎ steers; ↑ in an empty composer pops the queued one back (`queue.rs`) | during a long answer: tab one message, ⏎ another, then ↑ | the queued one goes out after the turn ends; the steered one goes in during the turn; ↑ brings the queued one back to edit | amb-web, amb-core (steer vs queued) | qa-type `composer/queue-steer` |
| 3.2 | drafts: ↑ brings back sent and put-away messages; esc puts the draft away; each agent keeps its own draft (`sb/drafts.rs`) | write half a message, press esc, then ↑; switch agents; restart the app | the draft comes back each time, one per agent, across the restart | amb-web, amb-core (draft storage) | qa-type `composer/drafts` |
| 3.3 | write to a given agent from its view, or with @agent | open an agent and send it a line | the line reaches that agent, not main, and shows in its feed | amb-win, amb-core | qa-flows `agents/write-to-one` |
| 3.4 | ctrl+f finds text in the history (`find.rs`) | ⌘F and a word from an old answer | each match shows, ⏎ goes to the next, and the composer keeps its draft | amb-win | qa-flows `thread/find` |
| 3.5 | `/help`, `/shortcuts` (`help.rs`) | ⌘/ (or ?) | every key of the app is in one list, with the same meaning as the TUI's keys | amb-home (key list), amb-mac (menus) | qa-flows `settings/keys` |

## S: setup with no terminal (blocks a person with no terminal; in this order)

| id | terminal | hand test | pass | chunk | check |
|---|---|---|---|---|---|
| S.1 | install bise (the CLI on PATH) | on a Mac (VM) with no bise: install the app and open it | it works with no terminal and no CLI install: bise is inside the app | amb-mac (bundling), amb-core | qa-native `setup/no-cli` (VM) |
| S.2 | sign in with a provider key or a subscription (onboarding, `/provider`, ChatGPT, OpenRouter) | first run: sign in with a subscription; then with a key | main answers after sign-in; a wrong key says so in one line; nothing asks for the terminal | amb-home, amb-core (`bise auth`) | qa-native `setup/sign-in` |
| S.3 | which model does what (`/models`, the onboarding roles) | open models; change one role | a working default with nothing to pick; a change shows up in the TUI's /models | amb-home, amb-core | qa-flows `settings/models` |
| S.4 | pick where bise works (a repo, or `~/bise` home) | pick a repo folder, then go back to home | the agents work in that place; it shows in the window; no SIGUSR1, no terminal | amb-home, amb-core | qa-flows `setup/workspace` |
| S.5 | the core can't be reached: today's way out is "run bise in Terminal" | stop the core while the app runs | one line says what happened, and the app restarts the core itself and shows its last log line; Terminal never opens | amb-mac, amb-core | qa-native `setup/offline` |
| S.6 | `/update`, the release item | a fake newer version on the throwaway update feed | the app says there is an update, installs it on his click and restarts with the work kept | amb-mac | qa-native `setup/update` |
| S.7 | the permissions: mic, accessibility, screen | first run with none granted | each step has continue and not now; a refused one says how to grant it later | amb-home (UI), amb-mac (helper) | qa-native `setup/perms` |
| S.8 | `/setup` checks again and offers what helps | after a refused permission or a removed key | "check again" finds it and offers the fix | amb-home | qa-native `setup/check-again` |
| S.9 | `/welcome` and the tour | first run | hello plus the start-here page, as in the old app | amb-home | qa-flows `setup/welcome` |

## A: agents, features and review

| id | terminal | hand test | pass | chunk | check |
|---|---|---|---|---|---|
| A.1 | `/new` starts an agent | start one from the window and from the spotlight | it shows in the agents list and in the TUI | amb-win, amb-web (spotlight) | qa-flows `agents/new` |
| A.2 | `/agents` and the panel: name, status, what it's doing, age | open the agents list with 3 agents working | the same agents and statuses as the TUI's panel, live; each row opens the agent | amb-win, amb-core | qa-flows `agents/list` |
| A.3 | an agent's view: its feed, last report and open questions (`sb tasks`, `sb inspect`) | open an agent that is working | its feed streams as in the TUI; its report and questions show | amb-win, amb-core | qa-flows `agents/view` |
| A.4 | `/stop`, `/archive`, `/restore`, `/archived`, drop | stop one agent, archive another, restore it | each one acts as in the TUI; archived agents can be listed | amb-win, amb-core | qa-flows `agents/lifecycle` |
| A.5 | `/switch`, `/rename`, `/isolate`, and `/model` and `/reasoning` of one agent | rename an agent; set its model | the TUI shows the same change | amb-win, amb-core | qa-flows `agents/settings` |
| A.6 | features and feature branches: try one, see its agents, review, merge (`sb feature`) | a fake feature with 2 agents: open it, review it, merge it on his go | its agents and changes show; merge happens only on his click; the TUI shows the same | amb-win (review), amb-core | qa-flows `review/feature` |
| A.7 | `/prs` | open the PR list | the same list as the TUI | amb-win | qa-flows `review/prs` |

## P: plugins and computer use

| id | terminal | hand test | pass | chunk | check |
|---|---|---|---|---|---|
| P.1 | `/plugins`: list, enable, disable, log in, log out | log in to a fake connector, then disable it | the connector works for main after the login; the TUI's /plugins shows the same state | amb-home, amb-core | qa-flows `settings/plugins` |
| P.2 | `/computer-use`: setup and off | turn computer use on, then off, on a throwaway profile | the permissions it needs are asked for in the app; off stops it | amb-home, amb-mac (helper) | qa-native `setup/computer-use` |

## O: the rest

| id | terminal | hand test | pass | chunk | check |
|---|---|---|---|---|---|
| O.1 | tool approvals: the approvals screen and auto mode | an agent asks to run a tool that needs approval | the request shows as a card with approve and deny, in ⌘I too; the agent goes on after approve | amb-home, amb-core | qa-flows `inbox/approvals` |
| O.2 | pages: open, notes, versions, send, stop watching | fn o on a page; stop a watch | the same as the old app (this passed before) | amb-win | qa-flows `pages/open` |
| O.3 | `sb history`, `sb every` (timers) | ask main for past work; stop a timer from the app | the answer shows in the thread; the timer stops (the TUI's list agrees) | amb-win, amb-core | qa-flows `thread/history` |
| O.4 | `/log`, error reports, crash reports | make the core crash | the app shows that it happened and how to send the report; no terminal needed | amb-mac, amb-core | qa-native `native/crash` |
| O.5 | fn hold from rest with another app frontmost (old check: listens in under 300 ms) | hold fn while in another app | the capsule listens in under 300 ms; the app doesn't steal focus | amb-mac (helper), amb-web (capsule) | qa-native `native/fn-from-rest` |
| O.6 | every button takes a real click, with hover (round 10 audit) | click every control once | each one acts on the first click, with bise not frontmost | each chunk on its own surfaces | qa-flows `app/clicks` |

## T: the terminal's gaps (tui-parity's exhaustive audit)

tui-parity read all of `rust/tui` against `apps/desktop` in `docs/terminal-parity.md` (b920338e). It
found 294 items: 69 MISSING, 45 part missing and 3 that differ. Every MISSING item and every missing
part is a row below. Each row keeps tui-parity's id (C, K, E, I, F, V, M, W, S, N, L, B), so it doesn't
clash with the bar's S.n setup rows. The source lines (file:line) are in that doc.

The owners are ambient-lead's split (m_9976). When a row needs a typed feed event or command from the
core, the chunk column names amb-core too.

These rules hold for every row:

- A key shown in the key list (`settings/keys.ts`) with no handler is a fail. Today ten of them have
  none: ⌘0, ⌘1…9, ⌥0…9, ⌘K, ⌘D, ⌘⇧A, ⌘E, ⌘/ and ⌘.
- The real thread's composer gets the same sources as the lab (commands, files, skills). Today
  `thread/ThreadScreen.tsx:151` passes none, so 2.1, 2.2 and 2.3 fail in the thread until they are
  wired.

### On purpose (ambient-lead's call on the 3 that differ; the user can override)

| id | terminal | the app, on purpose | hand test | pass | chunk | check |
|---|---|---|---|---|---|---|
| K7 esc during a turn | esc never interrupts; it puts the draft away | esc **stops** the turn (the window has no other visible stop; Codex and Claude do the same); the TUI's own interrupt key works too | esc during a long answer; then the TUI's interrupt key during another | both stop the turn in under 1 s (⛔6), and the composer keeps its text | amb-win | qa-flows `thread/interrupt` |
| I3 inbox walk | ←/→ and ctrl+n/ctrl+p walk the items | ↑/↓ walk the items and ←/→ the options (a vertical list), **plus** ctrl+n/ctrl+p as in the TUI | ⌘I with 3 items: ↑↓, ←→, ctrl+n, ctrl+p | each key moves as said, and the key list shows each one | amb-home | qa-flows `inbox/keys` |
| B21 esc in the / popup | esc clears the /query; the @ and $ popups keep the text | the same as the TUI: esc **clears** the /query (today the app keeps it, `composer/Brain.tsx:366`) | type "/arch", press esc; type "@ap", press esc | after /: the field is empty; after @: "@ap" stays | amb-web | qa-type `composer/slash` |

### The composer (amb-web)

| id | terminal | hand test | pass | chunk | check |
|---|---|---|---|---|---|
| K3 ⏎ inside a code fence | ⏎ in an open ``` block is a new line; the message sends only once the block is closed | type ``` and a line, ⏎, another line, then ``` and ⏎ | the first ⏎ adds a line; only the ⏎ after the closing ``` sends | amb-web | qa-type `composer/code-fence-enter` |
| K4 / B6 images to a model that reads none | refused with the no-vision line; the message and its images stay | with a text-only model in view, send a message with an image | one line says that model can't read images; nothing is sent; the draft and the chip stay | amb-web, amb-core (the model's vision flag) | qa-type `composer/no-vision` |
| K11 tab on a list item | indents a markdown list item | type "- a", ⏎, "b", then tab | "b" goes one level in, and the caret stays | amb-web | qa-type `composer/list-indent` |
| K12 backspace at the start of a list item | outdents it | on that indented item, caret at its start, backspace | it goes one level out; one more backspace removes the bullet | amb-web | qa-type `composer/list-indent` |
| K23 undo with nothing left | says "no undo: an agent may already have acted…" | send a message, then ⌘Z in the empty field | that line shows once, and nothing else changes | amb-web | qa-type `composer/no-undo` |
| E3 subword moves | ctrl+⌥←/→ moves by camelCase, snake_case, kebab-case and digits | in "fooBar_baz-qux2", ctrl+⌥→ four times | the caret stops at Bar, baz, qux and 2 | amb-web | qa-type `composer/subword` |
| E9 subword deletes | ctrl+⌥⌫ / ctrl+⌥⌦ delete one subword | at the end of "fooBar", ctrl+⌥⌫ | "foo" is left | amb-web | qa-type `composer/subword` |
| E21 folders in the @ popup | → goes into a folder; ← or ⌫ on `@dir/` goes one folder up | "@src", → on src/, then ← | it lists src/'s files, then goes back up a level | amb-web, amb-core (the file index) | qa-type `composer/at-folders` |
| E22 `:name:` emoji | `:tada:` becomes 🎉 | type ":tada:" | 🎉 in the field | amb-web | qa-type `composer/emoji` |
| W13 the emoji popup | ":cl" lists the matching emoji | type ":cl", ↓, ⏎ | a list filters as he types; ⏎ inserts the emoji | amb-web | qa-type `composer/emoji` |
| B8 @ ranking memory | a path he picked ranks first next time | pick src/app.rs with "@ap", then type "@ap" again | src/app.rs is first | amb-web | qa-type `composer/at-files` |
| B9 / W8 live markdown | lists go on after ⏎, code lines keep their indent, ``` blocks are colored as he types | type "- a⏎", then a ```rust block with an indented line | the next bullet comes by itself; the indent stays; the block is colored, and no node is replaced outside the line he types (⛔1) | amb-web | qa-type `composer/live-markdown` |
| W9 the key bar | the keys of the current mode (rest, selection, voice), and a tip every 5 minutes | look at the key bar at rest, with text selected in the thread, and in voice mode | the keys change with the mode, and each one shown works | amb-web | qa-type `composer/keybar` |
| C45 `steer …` / `say …` | the prefix is stripped before the line runs | send "say hello" | main gets "hello" | amb-web, amb-core | qa-type `composer/prefixes` |

### The thread, its rows and states, the window keys (amb-win)

The rows need typed feed events from amb-core (thinking, compaction, usage and context, a failed turn
and why, not delivered, landed, PR news, artifacts, scheduled, agent folds, answered for you, notices,
model and effort, hub confirmations). Each such event gets a fixture the UI replays (guarantee 3).

| id | terminal | hand test | pass | chunk | check |
|---|---|---|---|---|---|
| S1 working, turn time | the gust, "working · 1m" | send a long ask | the working state shows its turn time, ticking | amb-win, amb-core | qa-flows `thread/states` |
| S2 starting | its own frame while an agent starts | /new an agent | "starting" shows until its first turn | amb-win, amb-core | qa-flows `thread/states` |
| S3 waiting on someone | "⋯ waiting on docs" | an agent waits on another | its row and thread say who it waits on | amb-win, amb-core | qa-flows `thread/states` |
| S8 thinking | "thought for Ns", folded; a click or ctrl+o opens it | ask something that makes the model think | a folded "thought for Ns" row that opens on a click | amb-win, amb-core | qa-flows `thread/rows` |
| S9 tool calls | one row per call: description, state (∿ 12s, ✓ 0.3s, ✗ exit 1), the first error line, the code and its output when open | ask for a command that fails | one row per call with its state and time; the failing one shows its first error line; opening it shows the code and the output | amb-win, amb-core | qa-flows `thread/rows` |
| S12 compaction | "≡ compacting", then the summary folded | /compact | the compacting state, then a folded summary that opens | amb-win, amb-core | qa-flows `thread/rows` |
| S13 usage and context | the context gauge ("18k · 2%") and prices | a few turns, then look | the gauge shows and matches the TUI on the same hub | amb-win, amb-core | qa-flows `thread/rows` |
| S14 failed or interrupted, and why | "failed: …", "interrupted by …" | make a turn fail (the fake provider errors) | a row says it failed and why | amb-win, amb-core | qa-flows `thread/rows` |
| S15 / K22 / B20 not delivered | "✗ not delivered: {name} stopped. ⏎ send again · esc drop" | send to an agent that stopped | that row, with ⏎ to resend and esc to drop; the text is never lost | amb-win, amb-core | qa-flows `thread/not-delivered` |
| S16 agent-to-agent messages | shown, folded, or "▸ 4 messages between 2 agents" | two agents talk | the run folds into one row that opens | amb-win, amb-core | qa-flows `thread/rows` |
| S17 answered for you by main | ":* docs asked: v1 or v2? · i answered: v2 ▸", which opens to the why | main answers an agent's question | that row, and it opens to the why | amb-win, amb-core | qa-flows `thread/rows` |
| S20 / M12 landed | "± 3 files +42 −18 a1b2c3d"; a click opens the diff | an agent lands | that row; a click opens the review on that diff | amb-win, amb-core | qa-flows `thread/rows` |
| S21 PR news | "↑ #412 changes asked · dark-mode is on it", with the number linked | a fake PR event | that row; the number opens the PR | amb-win, amb-core | qa-flows `thread/rows` |
| S22 / M13 artifacts | a "↗ title · kind · v3" chip that opens it | an agent registers a file and a link | a chip for each one, not only for pages; ↗ opens each in its app | amb-win, amb-core | qa-flows `thread/rows` |
| S23 scheduled | "◷" when a timer is set, runs and ends | set an `sb every` timer for 1 min | the three lines show | amb-win, amb-core | qa-flows `thread/rows` |
| S25 notices | Warn, Err and Info lines (e.g. "the inbox is empty") | trigger a warning on the fake hub | a notice row of the right kind | amb-win, amb-core | qa-flows `thread/rows` |
| S29 / L19 computer use, live | an agent drives an app; "you took the wheel · ⏎ give it back"; stopped until he writes | a fake computer-use agent, then he moves the mouse | the live mark, the took-the-wheel line, and ⏎ gives it back | amb-win, amb-core | qa-flows `thread/computer-use` |
| S32 / C47 an archived agent | its feed is history only; a line to it is refused | open an archived agent | no composer that sends; a send attempt says "history only" | amb-win | qa-flows `agents/archived` |
| S33 the no-vision line in the thread | the refusal line, with the message kept | as K4 | the line shows in the thread | amb-win | qa-type `composer/no-vision` |
| S36 one-time hints | the first agent, the first card, … once per user | a fresh throwaway HOME: start the first agent | its hint shows once, never again after a restart | amb-win | qa-flows `thread/hints` |
| S40 / W3 the divider | "you → main · model · effort · approvals mode · state · context" | look under the thread | the model, effort, approvals mode, state, turn time and context are all there, and they match the TUI | amb-win, amb-core | qa-flows `thread/divider` |
| W2 the top edge | where he is, the counts, and "↗ designer · features update" for a new artifact | an agent makes an artifact | the counts and the new-artifact line show | amb-win, amb-core | qa-flows `thread/top-edge` |
| W4 / K14 / K16 the agents panel | numbered for ⌥1-9, a status glyph, the turn time, who it waits on; ⌥0 is main; alt+↑/↓ select | 3 agents: ⌥2, ⌥0, alt+↓ | the numbers show; ⌥2 opens agent 2 and ⌥0 main; alt+↓ selects the next one | amb-win | qa-flows `agents/panel-keys` |
| W5 worktree sections | a worktree 2+ agents share is a section; an agent alone carries its mark | 2 agents in one worktree, 1 alone | the section and the mark show (the environments route says "not yet" today) | amb-win, amb-core | qa-flows `agents/worktrees` |
| W6 / K18 preview | space on a selected agent shows its feed in place | select an agent, then space | its feed shows without entering it; space again closes it | amb-win | qa-flows `agents/preview` |
| W7 / K24 the inbox strip | its own box above the divider, numbered for ctrl+1-9 | 2 items waiting; ctrl+2 | the strip shows in the thread; ctrl+2 opens item 2 | amb-win (strip), amb-home (items) | qa-flows `inbox/strip` |
| W11 artifacts in @ | the @ popup lists artifacts by their token too | type "@pricing" | the pricing page shows in the list and goes into the message | amb-win, amb-core | qa-flows `thread/at-artifacts` |
| W14 / V1 the agent palette | find any agent by name, archived ones too; ↑↓ ⏎ esc | ⌘K, type part of a name | the palette filters, and ⏎ opens; ⌘K is listed and works | amb-win | qa-flows `agents/palette` |
| V3 the help overlay | the key list, filtered as he types; tab goes between help and shortcuts | open it and type "inbox" | only the matching keys show | amb-win | qa-flows `settings/keys` |
| C15 / W20 / V6 any branch's diff | /diff <branch>, a branch picker; ctrl+g, ↑↓, pgup/pgdn, tab in the panel | /diff some-branch; then the keys | that branch's diff shows; each key moves as in the TUI | amb-win, amb-core | qa-flows `review/diff` |
| V7 / L11 / B7 quote diff lines | drag or shift+↑↓ over diff lines, then type: a "src/a.rs:12-14 · 3 lines" chip | select 3 lines in a diff and type | the chip carries its file and lines; the agent answers about them | amb-win, amb-web (chip) | qa-flows `review/quote` |
| F1 / F2 fold and unfold | ctrl+o opens or closes everything folded; space opens the selected one | ⌘E (as listed), then space on one row | everything opens or closes; space toggles the one selected | amb-win | qa-flows `thread/folds` |
| F5 / M2 / N11 / B12 back to the bottom | the view stays put while scrolled up; a bar shows "N unseen"; a click or End goes back | scroll up during a turn | the view doesn't move; the bar counts the new rows; End or a click goes to the tail | amb-win | qa-flows `thread/scroll` |
| F7 / M8 / B13 copy a code block | ctrl+y or a click copies the block, without borders or line numbers | hover a block, click copy; then ctrl+y | the clipboard holds just the code | amb-win | qa-flows `thread/code-copy` |
| M4 / B14 file paths | a file path in the feed is a link that opens in his editor | click "src/app.rs:12" in an answer | the file opens at that line | amb-win, amb-mac (open) | qa-flows `thread/file-links` |
| M14 turn time on hover | hovering a turn shows its time | hover an old turn | its time shows | amb-win | qa-flows `thread/hover` |
| B11 long messages fold | a long message of his folds, and opens on click | send 80 lines | it folds, and a click opens it whole | amb-win | qa-flows `thread/rows` |
| B15 code blocks | a box with the language, highlighted | an answer with a rust block | the language shows and the code is highlighted | amb-win | qa-flows `thread/answers` |
| K2 ⏎ on an empty composer | with an agent selected, enters it; gives a stopped computer-use agent back the wheel; signs in again after expiry | each of the three, with an empty field | ⏎ does that one act | amb-win, amb-home (sign-in) | qa-flows `thread/empty-enter` |

### Inbox, settings, sign-in, approvals, first run (amb-home)

| id | terminal | hand test | pass | chunk | check |
|---|---|---|---|---|---|
| I6 / B3 a draft per inbox item | each item keeps his typed answer | type half an answer on item 1, go to item 2, come back | the half answer is still there | amb-home | qa-flows `inbox/drafts` |
| I8 folded parts | ctrl+o opens an item's folded parts | an item with a long brief | ctrl+o opens and closes it | amb-home | qa-flows `inbox/keys` |
| I9 / C46 / S30 hub confirmations | a y/n question in the feed (e.g. archive a working agent); y, n or esc | archive a working agent | the question shows; y archives, n keeps it, esc puts it off | amb-home, amb-core | qa-flows `inbox/confirm` |
| N14 / L8 answer by voice | `heard "the first one" → 1` | the fake mic says "the first one" on a card | option 1 is picked, and the line shows what was heard | amb-home, amb-web (capsule) | qa-native `voice/answer-card` |
| V8 / W21 approval rules | the mode, the checker, the saved rules of this repo; remove a rule | open approvals, remove one rule | the rule is gone in the TUI too | amb-home, amb-core | qa-flows `settings/approvals` |
| V14 / S28 / L2 expired ChatGPT sign-in | the agents it stopped wait; "⏎ sign in again"; c copies the link | expire the fake subscription | a line says so; sign-in again in the app; the waiting agents go on | amb-home, amb-core | qa-native `setup/sign-in` |
| L5 a model with no key | /model x opens that provider's setup, then runs the line | pick a model whose provider has no key | the provider's setup opens, then the model is set | amb-home | qa-flows `settings/models` |
| V17 effort per role | the roles screen sets a model and an effort per role | set main's effort | the TUI's /models shows the same | amb-home, amb-core | qa-flows `settings/models` |
| L1 / M18 the first-run text | "show me what you can do" fills the composer, selected, and doesn't send | first run in a fresh HOME, click it | the text is in the composer, selected, and nothing is sent | amb-home | qa-flows `setup/welcome` |
| L25 / S37 the demo | the built-in demo with a tip per step | start the demo | a tip shows at each step | amb-home | qa-flows `setup/demo` |

### Commands still missing (amb-home's commands item)

| id | terminal | hand test | pass | chunk | check |
|---|---|---|---|---|---|
| C3 /new --with-changes | moves his uncommitted changes into the new worktree | change a file, then /new -w --with-changes x: do it | the new agent's worktree has the change, and his tree is clean | amb-home, amb-core | qa-flows `commands/new` |
| C13 / L15 /artifacts add | registers a path or link for the agent in view | /artifacts add https://x.test | it shows in /artifacts and as a chip | amb-home, amb-core | qa-flows `commands/artifacts` |
| C40 /cancel, /undo | says there is no undo: tell main the change instead | /undo | that line; nothing goes to the agent as text | amb-home | qa-flows `commands/undo` |
| C42 / L14 /flow pr\|trunk | the repo's dev flow: land by PR or on trunk | /flow pr, then /flow | it is set, and /flow says which | amb-home, amb-core | qa-flows `commands/flow` |

### The mac shell and voice with the agent in view (amb-mac)

| id | terminal | hand test | pass | chunk | check |
|---|---|---|---|---|---|
| W33 / N10 counts outside the app | the tab title "#2 ↗1 ●3 · harness" | 2 items waiting, the window in the back | the dock badge and the window title show the counts | amb-mac | qa-native `native/badge` |
| W25 / V13 / K26 / M16 the terminal panel | a real shell in the workspace, kept while hidden; ctrl+` toggles it; drag resizes | ctrl+`, run `ls`, hide it, show it | the shell is in the workspace and kept; every key goes to it; it resizes | amb-mac | qa-native `native/terminal-panel` |
| V12 / W24 / L21 / N13 voice mode with the agent in view | ctrl+r twice: talk with that agent, its answer said aloud, mute, type instead, cut in | in an agent's view, start voice mode, say a line (fake mic) | the line reaches that agent, not main; the answer is spoken (fake speaker) sentence by sentence; mute and type instead work | amb-mac, amb-web | qa-native `voice/agent-in-view` |

### The design system (no owner named; amb-kit)

| id | terminal | hand test | pass | chunk | check |
|---|---|---|---|---|---|
| N2 color alone | NO_COLOR: every color cue has a plain stand-in | turn on macOS increase contrast | every state still reads without its color (a glyph or a word) | amb-kit | qa-type `ds/contrast` |

B16 (how a narrow window lays out) was not checked by tui-parity; ambient-pm checks it on the hand pass.

## Regression list (try gate)

Owner: ambient-pm (ambient-lead m_12388, main m_12384). Every piece of feedback the user has given on
the app is one row: the desktop app, plus what still applies from the old ambient days. Before any
try build reaches him:

1. qa-native opens the candidate off-screen on amb-tools' rich world.
2. It takes one shot per row, in `~/.bise/gate/try-gate/<sha8>/<id>.png`, with an `index.md`.
3. ambient-pm checks each shot by eye and marks the row **ok** or **red** in the run's log below.

One red row, or an unsigned screen, means no try build. Each row has:

- **id**: the shot's file name.
- **his words**: quoted and dated (UTC), with where he said them.
- **right**: what right looks like.
- **shot**: the route or state, the width (1100 if not said) and the theme (light if not said).

A row stays even after it passes: it is a regression list.

**For every gate run** (the user via main m_13700, ambient-lead m_13706): whoever judges the shots
(ambient-pm, designer, qa-native) looks at them **as images**. Reading index.md's notes or the DOM
isn't judging. A row marked ok names the shot that was looked at.

| id | his words (date, where) | right | shot |
|---|---|---|---|
| R01 | "La UI est cassé sur ambiant! le layout va pas." (10-03, main#45596) | every screen laid out as signed: nothing overlaps, cut or spills | bise, inbox, settings, agent/shop/main at 1100 and at 800 |
| R02 | "il faut toujours que l'espece d'orbe soit affiché sans background … Dans une carré avec un background c'est pas très beau" (10-03, main#45596) | the pearl floats with no box, plate or square behind it, on every surface | capsule:talk on its own transparent window (off-screen there is no desktop behind it), the pearl cropped at 2×; index.md says whether every pixel outside the pearl's glow has alpha 0 |
| R03 | "on ne peut pas cliquer sur les boutons de la UI de ambiant" (10-03, main#45596) | every control acts on the first click and shows its hover (app/clicks green on this build) | capsule:card with one button hovered; app/clicks' result in index.md |
| R04 | "quelque chose spotlight like avec pleins de racourcis clavier" (10-03, main#45596) | each action in the spotlight and on cards shows its key | capsule:spot with an agent selected; capsule:card |
| R05 | "maintenir la touche fn pour parler alors que la ui de ambiant n'était pas ouverte … cela n'a pas fonctionner" (10-03, main#45596) | fn held from rest, with another app in front, listens in under 300 ms (native/fn-from-rest green) | capsule:talk, 300 ms after fn from rest |
| R06 | "il manque beaucoup de click events sur beaucoup de choses. Il n'y a pas de commande Q pour quitter." (10-04, main#48002) | a real menu bar with every mac key (⌘Q, ⌘W, ⌘, and Edit), and clickable rows, names and counts | the app menu and the Edit menu, read from the app's menu model and written as text in index.md, with each item's key (native menus can't be shot off-screen) |
| R07 | "dans le menu Spotlight, je puisse sélectionner un agent et … je vois sur la droite … ses dernières actions … Et quand je clique … l'historique … interactif" (10-04, main#48002) | an agent selected in the spotlight shows its last actions; ⏎ or a click opens its thread in the window, live | capsule:spot with p99 selected; then agent/shop/p99 after ⏎ |
| R08 | "la transcription de ce que je viens de dire, s'affiche dans une fenêtre trop petite, donc il est clippé … 'bise :* on it.' Que je préférais éviter" (10-04, main#49478) | his words shown whole and never clipped; no "on it" line: the pearl's thinking animation instead | capsule:talk after a 3-line spoken ask (fake mic), then 1 s later |
| R09 | "quand je click sur un lien de nouveau commit sur main j'ai la UI de diff qui s'ouvre avec pas de diff!" (10-04, main#51145) | a landed or merged commit opens on its own diff, never an empty one | review/shop from a landed row whose branch is already on main |
| R10 | "il faut un petit 'new' rose quelque part … je ne sais pas qu'est ce qui est nouveau" (10-04, main#52666) | new artifacts carry a pink "new" until he has seen them | the artifacts list with 2 new and some old |
| R11 | "keyboard shortcuts like arrow, escape and enter don't work consistently / can't reach bise error / Clicking doesn't do anything … I don't get a user message" (10-05, main#55683) | the keys act on every surface; no "can't reach bise" on a healthy world; a send always shows his message | bise right after a send; the core line absent |
| R12 | "je ne vois pas de curseur. A chaque fois que je tape, je vois tout qui clignote." (10-06, main#59926, bug 1) | a blinking caret where the next letter goes; nothing outside the field changes while he types | agent/shop/main mid-typing: a 6-frame strip |
| R13 | "@fles et $skills et /command n'ont pas l'air de marcher." (10-06, main#59926, bug 1) | `/`, `@` and `$` list the TUI's items in the real thread | agent/shop/main with the / list, the @ list and the $ list open (3 shots) |
| R14 | "Les animations du marble de bise clignote tres bizarement" (10-06, main#59926, bug 2) | the pearl moves smoothly, with no flash and no jump | the pearl through listen, think and answer: a frame strip |
| R15 | "Les images ne marchent pas dans le composer, ni les quotes, ni le voice recording" (10-06, main#59926, bug 3) | image, quote and dictation chips in the composer, each removable | the composer with one image chip, one quote chip and dictation running |
| R16 | "Command I ne fait rien" (10-06, main#59926, bug 4) | ⌘I opens the inbox with its items, most blocking first | inbox after ⌘I with 3 items |
| R17 | "Mon mesage s'est envoyé mais ne fait rien." (10-06, main#59926, bug 5) | his message shows at once, then main's working state, then the answer | "after send in bise": at 100 ms and at 2 s |
| R18 | "La réponse de bise quand j'envoie un message avec fn+space s'affiche dans une fenetre trop petite, et je peux pas le lire" (10-06, main#59926, bug 6) | a 40-line answer readable whole: it grows to fit or goes to the window | capsule:spot after a 40-line answer |
| R19 | "Dans la UI de spotlight, quand je tape toute la UI clignote." (10-06, main#59926, bug 7) | the spotlight doesn't blink while he types | capsule:spot mid-typing: a 6-frame strip |
| R20 | "the sorte of marble / orb … flying pixels forming a cute simple robot face" (10-06, main#61716); "les trucs dans bise presence sont très laid" (10-06, designer#30458) | the presence that designer and ambient signed, and nothing they didn't sign | the sidebar's bise row and capsule:talk |
| R21 | "Je pense qu'on devrait enlever ça dans la sidebar … on peut ajouter un tip a propos de /scheduled" (10-06, main#62161) | no "◷ = its next run · /scheduled" legend line in the sidebar | bise with a scheduled agent in the sidebar |
| R22 | "ce screen pour les notifications … C'est vraiment moche, il y a du texte qui dépasse de partout." (10-07, main#65938) | no text spills out of its card or row in the inbox, at any width | inbox with long cards, at 1100 and 800 |
| R23 | "la coloration syntaxique en rose pâle … pour le bold … les trucs entre backticks … En vert" (10-07, main#66499) | bold in pale pink and `code` in green, in the thread and in the composer | an answer with bold, `code` and a list; the composer with the same |
| R24 | "un input riche … quand tu fais Ctrl R … pour la dictation, je voudrais que ce soit une tip dans l'input, pareil pour les images … les quotes" (10-07, main#66499) | a rich input: dictation, images and quotes are chips in the text | the composer during ctrl+r, with an image and a quote |
| R25 | "la partie interactive elle est pas … toute la box et si je hover l'input … une espèce de border qui apparaît" (10-07, main#66499) | a click anywhere in the box puts the caret in; no stray border on hover | the composer hovered, then clicked at its bottom-right corner |
| R26 | "c'est dommage que les projets, les folders des projets soient fermés par défaut" (10-07, main#66499) | the project folders are open at first launch | bise at launch with a fresh keep |
| R27 | "J'aime pas trop l'espèce de cercle qui grandit et qui rapte … pour dire si l'agent est en train de travailler" (10-07, main#66499) | the working sign that was signed, not a growing pulsing circle | the sidebar with 2 working agents: a frame strip |
| R28 | "Il y a une image qui manque à côté de Bise ici" (10-07, main#66499) | the bise row has its avatar | the sidebar's top |
| R29 | "Quand je fais fn espace … l'endroit où je tape reste à la même place … le border top et left de la boîte ne changent pas" (10-07, main#66499) | the spotlight field's top-left never moves while the list under it changes | capsule:spot with more agents than fit on the screen (about 30; amb-tools' rich world has about 12, so it gets a seed with more, or index.md marks the row "not shot"), typing 1 to 4 letters: a strip with a guide line at the field's top |
| R30 | "quand je tape sur Fn pendant longtemps pour être en voice mode … parfois la fenêtre bouge un peu" (10-07, main#66499) | the talk capsule doesn't move while it listens | capsule:talk held 10 s: a strip |
| R31 | "il manque une sidebar à droite qui me liste les artefacts … La liste des sous-agents" (10-07, main#66499); "Je vois pas mes sous agents, je ne vois pas les artifacts, je ne vois pas les schedules" (10-07, main#67960) | a project shows its sub-agents, its artifacts and its scheduled tasks in the window | agent/shop/main with the project's side panel |
| R32 | "j'étais en train de taper un message quand tu as refresh l'app … j'ai tout perdu … ça devrait etre vrai pour tout le state de l'app" (10-07, main#67886) | nothing he typed or opened is lost across a reload or a restart (app/keep-all green) | the composer and an inbox answer before and after a reload |
| R33 | "onboarding window: deux fenetres imbriqués avec des boutons de fermeture en haut a gauche x2 . on veut du frameless" (10-07, main#67960) | one frameless window with a single set of window buttons, also at onboarding | setup:hello |
| R34 | "La liste de projets a un probleme de scrollbar, une partie est offscreen … pas de recherche native pour selectioner un projet" (10-07, main#67960) | the project list fits and scrolls inside its box, with a search field | setup's project picker with 22 projects, at 1100 and 800 |
| R35 | "le text n'a pas de max-width et ne wrap pas" (10-07, main#67960) | answers sit in a reading column of capped width and wrap | agent/shop/main with a long paragraph, at 1800 |
| R36 | "je vois du XML rendu, comme si il y avait du contenu riche qui manquais" (10-07, main#67960) | no raw tags (`<screen_context>`, `<selection>`, `<pasted>`) in the thread: each one renders as its chip or is hidden | a turn sent with screen context, a quote and a paste |
| R37 | "thought 0.0s" (his 10-07 screenshot, named by ambient-lead m_12388) | no thinking row for a turn that didn't think; a real time otherwise | a turn with no thinking, and a turn that thought |
| R38 | "une fois que j'ai sélectionné, je voudrais pouvoir appuyer sur Space … pour que ça … cite … cliquer sur Type to Ask About It directement" (10-07, main#68436) | Space on a selection starts the quote; a click on "type to ask about it" puts the quote at the caret | a selection with its pop; then the composer after Space |
| R39 | "l'app desktop allait se comporter comme le terminal en terme d'historique" (10-07, main#69423) | the thread holds the whole history, as the TUI does: older turns load when he scrolls up | agent/shop/main scrolled to the top |
| R40 | "une petite animation quand le text apparait comme ce qu'il y a sur claude.ai" (10-07, main#69684) | streamed text appears with the signed animation (stagger capped), and nothing jumps | a streaming answer: a frame strip |
| R41 | "N'oublie pas que le harness doit être multi-modal et donc que le modèle doit voir ces images que je paste" (10-08, main m_13700) | an image he pastes or drops reaches the model as an image content block, never as a path, a file name or a text tag. Five places: the window's composer, the spotlight, a card answer, an escalated agent question (`sb card --for`) and the terminal | not a shot: qa-native's check reads the fake provider's recorded request bodies (`$FAKE_BODIES`) after one paste in each of the five places. index.md lists each one with the block's type and media type; a path, `<image …>` or `[Image #1]` text in the body is red |

**Run log** (one line per candidate: the sha, the date, the reds with what i saw, signed or not):

- **12a9efbf, 10-08: red, not signed, no try build.** The shots are in
  `~/.bise/gate/try-gate/12a9efbf/` (qa-native, 09:25–09:31 UTC). ambient-pm judged the flows by
  eye; designer judged the look and signs the screens (m_12594).
  - **ok:** R02, R05 (shot only; the check's result isn't in index.md), R06 (every mac key is in the
    menu; see P6), R11, R14, R16, R17, R21, R22, R29 (the field's top stays at y −29830 while the
    capsule's height goes 270 → 141), R30 (the frame doesn't move in 10 s) and R33.
  - **red:**
    - R01, R07, R09, R23, R31, R35, R37: every project route says "not found · nothing here at
      project/shop" (also changes/shop), so ⏎ on an environment and a project's thread lead
      nowhere (designer D1, amb-win + amb-home).
    - R26, R27: no agents under any project in the sidebar (D2, amb-win).
    - R20, R28: bise's row shows a white square with a broken-image mark instead of its pearl
      (D3, amb-win).
    - R10: "new" is an ink outline, not pink (D4, amb-kit).
    - R01: the composer's hint row cuts words at 1100 (D6, amb-home).
    - R03: two app/clicks reds, the thread head's agents link and the agents rows' buttons
      (amb-win; one re-cut).
  - **not judged:** the world or the driver failed, not the app.
    - R36, R40: the rich world's fake model echoes its input (`ack: <user_message …>`, raw
      `[[slow: 2]]`), so raw tags and streaming can't be judged. His own bubble shows no raw
      `<screen_context>` (D5, amb-tools).
    - R18: the answer is an ack, not 40 lines (amb-tools).
    - R08: no fake mic in this run (qa-native: `BISE_AMBIENT_FAKE_VOICE`).
    - R12, R13, R15, R24, R25, R32, R34, R38, R39: not shot, because the driver's clicks timed out
      after 30 s, most likely on the missing project routes. qa-native reshoots after D1.
    - R19: the strip wasn't checked by eye (designer or ambient-pm on the reshoot).
  - **fix in the same pass** (not red):
    - P6, R06: the menu says "bise-desktop" ("Quit bise-desktop", "Hide bise-desktop"); it should
      say "bise" (amb-mac).
    - P7, R04: the spotlight's waiting rows show no key of their own; only the foot has ⏎ and esc
      (amb-web).
    - Designer's D7–D9 (amb-home).
  - **final owners** (ambient-lead m_12614; they replace the ones above where they differ):
    - D1 (project routes): qa-native first finds out whether the cause is the test setup or the
      app; amb-win if it's the app.
    - D2 (agents under projects): amb-win.
    - D3 (bise's pearl in the sidebar) and D6 (the hint row): amb-web.
    - D4 (a pink "new"): amb-kit.
    - D5, R36, R40, R18 (the fake model): amb-tools.
    - R08 (the fake mic) and the rows whose clicks timed out: qa-native.
    - The spotlight's waiting-row keys: amb-web.
    - D7–D9: amb-home.
    - "Quit bise-desktop": amb-mac, when a slot frees.
    - R03 (the click reds): amb-win.

    There will be one re-cut once all of these land; ambient-pm gets its sha after qa-native's
    reshoot.
  - **reshoot on the same 12a9efbf** (09:32–09:34 UTC): D1 was the screenshot driver's fault, which
    opened routes by name instead of hub id. Every project screen opens now (ambient-lead m_12618).
    - **now ok:**
      - R01 (shop's thread);
      - R13 (`/`, `@` and `$` list in the real thread; `@` gives agents, then artifacts, then
        folders);
      - R31 (sub-agents under the project in the sidebar, artifacts and "scheduled here" on the
        right);
      - R32 (the draft survives a reload);
      - R37;
      - R38 (Space on a selection gives the `❝ 1` chip and its "answered · main · 1 line" strip);
      - R39 (older history with a table; "back to the bottom" floats over the rows).
    - **still red:**
      - R26: the folders start closed on a fresh keep (amb-win).
      - R27 / D2: at 30 agents the sidebar's list runs under its footer ("synthetic-checks…"
        under "add a project") (amb-win).
      - R25: after a click at the composer's bottom-right corner, the field doesn't have the focus
        (amb-web).
      - R01 / D6: the hint row still cuts words ("tip: esc puts your draft awa…") (amb-web).
      - R20, R28, R10 and R03 as above.
    - **not judged:**
      - R36, R40, R18: the fake model still echoes `<agent_message …>` and `[[bash: …]]` (amb-tools).
      - R24 and R15: the driver made no chips.
      - R34: no project picker was reached in setup.
      - R07, R09: no p99 match in the spotlight shot, and no changes row.
      - R08: no fake mic.
    - **designer on the reshoot** (m_12630; still not signed):
      - Fixed: D1 and D2.
      - Green: R23 in the thread (bold in pale pink, `code` in green); the composer half wasn't
        shot.
      - Still red: D3, D5, and D6, where the hint row now also overlaps ("$ skills" runs into the
        tip).
      - New red: D10, the same as R27 (the sidebar's 22-30 agents draw over "add a project" and
        "settings").
      - New, not red:
        - D11: "every every 30m" in "scheduled here", and the time cut off (amb-win).
        - D12: every agent row ends in an unnamed "0%" (amb-win).
      - R35, reshot at 1800 (designer m_12647): green. Answers and his long message sit in the 720
        column, the prose is capped near 68ch and wraps, and the composer has the same edges.
      - D3 also hits the thread: bise's head and its name lines show the broken square, which
        leaves "bise 11:15" indented with nothing before it. One pearl component (amb-web).
      - D13, not red: "↓ back to the bottom" has no solid fill, so the answer's words show
        through it (amb-home).
      - Shots designer still needs: R37 with and without
        thinking (qa-native).
    - **new, fix in the same pass:** the `/` list offers `/version`. Row 2.1 leaves it out, as a
      dev tool (amb-web's list, or amb-home's commands).
- **7b27e678, 10-09: red, holds the try** (two new reds; the rule above: a new red holds). The
  no-build proof is green. qa-native's shots are in `~/.bise/gate/try-gate/7b27e678/` (m_14024),
  its checks are e39e2cee, and designer confirmed (m_14028). ambient-pm looked at R41-dock.png,
  D14b-gift-ui.png and KW-palette-waiting.png.
  - **R41: all 9 paths reach the model** (`$FAKE_BODIES`, an image/png image_url block next to his
    words):
    - the composer's ⌘V and drop, to main and to an agent;
    - the spotlight's ⌘V, and a drop on the capsule;
    - a ⌘I card answer;
    - the docked answer in a thread;
    - an escalated question (`sb card --for`), where the agent's own request carries the image.

    The sent text now has its space: "[Image #1] what is…".
  - **ok:**
    - D14b (D14b-gift-ui.png): "blocked · waiting for your answer" is a pink status line, with no
      raw "[report:".
    - KW (KW-palette-waiting.png): ⌘K's waiting rows have bise's pink pearl.
    - SLASH: `/keychain` is listed.
    - DARK-card.
  - **red, new in this cut:**
    - (a), R36 (R41-dock.png): the "✓ you answered gift-ui" row prints the hub's image marker raw,
      `<image name="bd91…" path="/Users/…/images/….png" mime="image/png" b64="…">`. Its unbroken
      path runs past the column into the panel. It should read "✓ you answered gift-ui · the
      balance on the cart page", with the usual `[Image #1]` chip and its thumbnail (amb-feed,
      amb-win). It's new because card answers carried no image before this cut.
    - (b), R17 (R41-dock.png): under the delivered "you · [Image #1] what is in this picture …" a
      second greyed "you · sending… [Image #1] …" stays forever. A pending row must go the moment
      its message lands (amb-win).
  - **nit:** the docked answer's label wraps to 2 lines. One line, with the question cut by "…"
    (amb-home).
  - **flow question** (designer): main's "merge checkout into main?" card says "or type your answer
    below", and the run answered it with "[Image #1] this one …". In the TUI, a typed answer to
    main's question goes to main as words (`/answer N text`). So typing isn't wrong in itself, as
    long as a typed line never merges anything without his clear yes. ambient-pm asked qa-native
    whether the world's main merged after "this one". If it did, it's a red.
  - **ruling: red (c), the typed line closed an irreversible card** (ambient-pm m_14045).
    - The world's main didn't merge (qa-native m_14042), but only because it's a fake.
    - The hub closed card #1, "merge checkout into main?", as answered by "[Image #1] this one …",
      a typed line with no 1 or 2. That breaks ambient's decision (c) (ambient#8417, designer
      m_8778): a plain message never decides anything irreversible.
    - The fix, in the same re-cut as (a) and (b): on a card that decides something irreversible
      (merge, feature_try's try or merge, tool approvals), typed text goes to main as a plain
      message and the card stays open. The label reads "to bise · the merge waits for 1 or 2" and
      the card says "pick 1 or 2" (amb-home, and amb-feed if the hub needs the card's kind).
    - Proof on the re-cut: a typed line on the merge card leaves it open, main gets a plain
      message, and nothing merges.
    - If cb1f2b44, his current build, has it too (amb-home checks the code), main tells him
      today: on a merge or try card, pick 1 or 2; don't type.

- **cb1f2b44, 10-08: red, no try build.** The no-build proof is green. qa-native shot the touched
  rows and R41 into `~/.bise/gate/try-gate/cb1f2b44/` (m_13848). ambient-pm looked at the shots as
  images.
  - **R41, the model sees his images:** read from `$FAKE_BODIES` on the packed app.
    - The window composer's ⌘V reaches bise's main and an agent as an image_url block (yes).
    - A drop on the composer reaches shop's main and an agent (yes).
    - The spotlight's ⌘V, and a drop on the capsule, reach bise's main (yes).
    - **Red:** a ⌘I card answer, and with it an escalated question, goes as text only, and the
      field takes no paste. The fix is amb-feed's 4b927e05, being landed by r41-land as c6ddde31.
      It isn't in this cut.
    - The terminal path is img-paste's.
    - Nit: the window sends "[Image #1]what is…" with no space after the label.
  - **ok, from the shots:**
    - R24 (R24.png): the `❝ 1` quote chip, the `[Image #2]` chip with its thumbnail, and
      dictation listening, all in one composer. The mono "[Image #2] checker.png" line above "to
      bise" is a known nit.
    - SPOT-chip (SPOT-chip.png): an image chip with its thumbnail before the words, and "⏎ send to
      bise ⌫ remove esc close".
    - R34; N2 ("◷ main scheduled dashboards · every 30m · next 23:42"); and KQ (⌘K 'p99' opens
      p99, and a sentence puts "ask bise" with the pearl on top).
  - **red:** N3 (N3-gift-ui.png). Agent threads still show raw report tags: "[report: blocked]
    waiting for your answer: cart page or checkout only?" in gift-ui, and "[report: done] …" in
    p99. It's D14 come back on agent threads (bise's own thread is fixed) (amb-home).
  - **not red:**
    - N1 (N1-p99-head.png): the head has no "high · yolo", and no context gauge on a done agent.
      Designer says whether the gauge should show when the agent isn't working.
    - R07-a: the right column shows p99's 2 actions, which is all it has.
  - **designer** (m_13855): one red, the rest signed.
    - Red: N3/D14 in agent threads, as above (amb-home). A report renders as a status line
      ("blocked · waiting for your answer", "✓ done · <summary>"), or not at all when the question
      card under it says it.
    - Green: N1 (the gauge is rightly hidden on a done or idle agent), N2, N3's position, R34, KQ,
      SPOT-chip, R24, R07-a and the spot's heads.
    - EMPTY, reshot anyway on the packed app with a fresh home (qa-native m_13896), is green.
      ambient-pm looked at EMPTY-1100.png: "bise is here.", "add a project ⌘N" and "show me what
      you can do", centred, with nothing scrolling, at 800, 1024, 1100 and 1400. Its check is
      gate/empty.spec.ts.
    - EMPTY and N4 are signed on amb-win's 2f22e7fc/442ea0f1 and amb-web's f57db910 shots; no
      reshoot needed.
    - Nits for the next cut:
      - An agent's thread opens on the hub's brief as a 28 px "Task" heading with internal words.
        One quiet row, "bise started gift-ui · …", with the brief folded under it (amb-home).
      - One space after "[Image #1]" (amb-web).
      - Bise's pearl in ⌘K's "waiting for you" rows is grey; it should be pink (amb-web).
  - **verdict: GO tonight, with two known gaps in the notes to main** (ambient-pm, answering
    ambient-lead m_13861).
    - N3/D14, raw report tags in agent threads, is red on R36. But his current build, d94b7996,
      has it too: 233c325a's D14 shot only covered shop's main. So this try brings no regression,
      and holding it would keep him on a build with the same red and fewer fixes.
    - R41's card answers are the same case: text only in both builds, and the fix waits on main's
      gate.
    - Both gaps are named in the notes. The next cut carries amb-home's fix, and c6ddde31 when it
      lands.
  - **gate rule, refined:** a red that his current try build already has may go as a named gap in
    the notes, by ambient-pm's call. A red that is new, or a fix that came undone, still holds
    the try.

- **d94b7996, 10-08: OK for the try** (ambient-pm, after R24's proof below; designer signed the
  look on 233c325a, and R03 and R34 on this cut).
  - **R24 proven** (qa-native m_13205): amb-mac's composer/paste-image passes on the packed
    d94b7996 bundle (1 passed, 1.3 s: the chip visible, the thumbnail drawn). The packed app
    pastes images. The missing chip in the gate's shot was the driver's order: it staged the image
    before clicking the field, right after a drag-select and Space. The check clicks, stages, then
    presses ⌘V. qa-native reruns R24 alone in that order as a confirmation; it doesn't block.
  - **Not in this build** (the try's notes to main say so): R40, the streamed text (no partial
    events yet), and R07-a, the spot's preview of an agent's last actions (next round).
  - **For the next cut:** designer's nits N1–N4, and amb-home's R34 subtitle.
  - The entry before this one was "R24 red, no try build yet." The no-build proof is green
  (up to date, the stamp untouched, nothing spawned, a clean `--stop`). qa-native reshot R03, R24
  and R34 into `~/.bise/gate/try-gate/d94b7996/` (m_13172).
  - **now ok:**
    - R03: ⏎ on the spot's first waiting row opens "4 drafts wait for you" in place, with its
      options (1 review, 2 send all 4) and "1 2 pick · ⏎ open in bise · esc later". esc goes back
      to the list.
    - R34: "no repos in this folder. choose a folder…, or continue without one."
  - **red:** R24 (his bug 3, images). The hook staged checker.png, then a real ⌘V in the field gave
    no image chip; the quote chip and dictation do show. So it isn't the 1×1 PNG. qa-native is
    running amb-mac's composer/paste-image check on the same packed bundle, to tell the packed
    app from its own sequence. Owner: amb-mac or amb-web, depending on what that run shows.
  - Everything else stands as on 233c325a, signed by designer.

- **233c325a, 10-08 (the second re-cut): 3 rows open, not signed yet, no try build yet.** The
  `--try` no-build proof is green. qa-native reshot the touched rows into
  `~/.bise/gate/try-gate/233c325a/`; qa-flows' app/clicks is green on this sha.
  - **now ok:**
    - D12: no bare "0%" in the sidebar.
    - D7b, D3b: "bise · every project" with its 14 px pearl at 1100 and 800.
    - D14: no raw "[report:".
    - D15: no "bash: bash" and no raw tool JSON.
    - The spot's heads: "waiting for you", "at work", "projects".
    - R18: a spot ask shows the 52-line answer in the capsule, readable, with "the rest in bise ⏎
      open". It still does after the window went to settings and back.
    - Dark: `/theme dark` and settings both work.
    - The rest of the rows stand as on 723648da.
  - **open** (one more re-cut):
    - R03: ⏎ on a waiting row in the spot closes the capsule, and nothing opens to answer
      (amb-web).
    - R34: setup's "your projects" with no repo reads 'no repo matches "". choose a folder…, or
      clear the filter' on an empty filter. Its lead line also says "i found these repos in your
      folder" when it found none (amb-home). The overflow and the search can't be judged: the
      harness home has no repos.
    - R24's image: not proven, because the driver's 1×1 PNG made no chip. Rerun with checker.png
      (qa-native).
  - **designer: SIGNED** (m_13005): every row and every screen in the set, D18 included (the
    composer is 52 px, with the placeholder centred). D14 now reads as a pink status line, "gift-ui:
    blocked · waiting for your answer".
  - **designer's nits for the next cut; none blocks this try:**
    - N1: the agent head reads "dashboards t. idle 262k · high · yolo": role first, "context 262k",
      and "high · yolo" out of the head (amb-home).
    - N2: "◷ ‣ main scheduled #1 for…" has two glyphs and an internal "#1" (amb-home).
    - N3: the blocked status line is indented ~36 px under a list (amb-home).
    - N4: in the spot's project rows, the path eats the agent count (amb-web).
    - N5: the copy of R34's empty state (see above).
  - **R34's copy does not block this try:** ambient-pm agrees with designer, because his folder has
    repos. It is fixed before the public.
  - **not in this build:** R40 (no partial events yet) and R07-a (the spot's preview, next
    round).

- **723648da, 10-08 (the re-cut with every fix): red, not signed, no try build.** `--try` opens with
  no build step. The world is e9c09378's, with real answers and 30 agents. The shots are in
  `~/.bise/gate/try-gate/723648da/`.
  - **now ok** (ambient-pm, flows):
    - R01: shop's thread; the hint row is whole.
    - R04: each waiting row in the spotlight shows "↵ answer".
    - R07: 'p99' then ⏎ opens telemetry › p99 in the window.
    - R08: the whole 3-line ask is shown.
    - R10: "new" is pink.
    - R13: `/version` is no longer in the `/` list.
    - R26, R27: the folders are open, and the list scrolls above an opaque footer.
    - R29, R30: the frame holds; the talk grows downward only.
    - R32.
    - R36: no raw tags; screen context reads "with Figma · Checkout.fig".
    - Also ok as before: R02, R05, R06 (the menu now says "bise try"), R11, R16, R17 and R38.
  - **now ok** (designer, look; m_12776): D2, D3 in the sidebar and agent heads, D4, D6, D10, D11,
    D13, R22, R23, R33, R35, R37, R14 and R20-talk.
  - **red** (designer):
    - D12: every sidebar agent row ends in "0%" (amb-win).
    - D7b: bise's own head reads "every project · 15 · 0%" (amb-home).
    - D3b: bise's head pearl is missing at 1100 and 800, or a tiny blurred dot; it should be the
      sidebar's crisp 14 px pearl (amb-home).
    - D14: a raw "[report: blocked] waiting for your answer: …" line in shop's thread, right above
      the question card that already says it. R36's tag check misses this form (amb-home).
  - **nits:**
    - D15: "$ bash: bash /…" has one "bash" too many (amb-home).
    - D18: in the empty composer, the placeholder sits on the bottom line of a ~72 px box (amb-home).
  - **owners checked in the code** (ambient-lead m_12782; they replace the ones above):
    - D12, D7b, D3b: amb-win (bise's head is ThreadScreen's 'every project' lead and BisePearl).
    - D14, D15: amb-home (thread rows).
    - D18: amb-web (Composer.tsx).

    One re-cut once these land.
  - **ambient-pm's use, from qa-native's reshoot and asks** (13:17 UTC):
    - **ok:**
      - R25: the corner click lands on the box and the field gets the focus.
      - R24's quote: drag, then Space, gives the `❝ 1` chip and its strip. Designer: green; the
        chip sits low, in D18's family.
      - The dashboards thread: tool rows grouped, the answers between them.
      - The ⌘I feature_try card: try it / show the diff / not yet, with 1–3, close and esc later.
      - Docs' dark-mode feature view.
      - Spot search: "ingest" finds both agents.
    - **red:**
      - R18 (his bug 6): asked in the spot, the fake model answers 52 lines, and the capsule stays on
        its list, so the answer never shows there (amb-web). I asked qa-native whether the answer
        landed in bise's thread instead.
      - Tool rows show raw JSON, `± edit: {"file_path":"panels.md"}`. Same class as D14 and his "je
        vois du XML rendu"; it should read "± edit panels.md" (amb-home, with D15).
      - R07-a: an agent selected in the spot shows its objective, not its last actions on the
        right (amb-web). It was never built rather than broken. **Not blocking** (ambient-lead
        m_12812): it goes to the next round, and the try's notes to main say "not in this build".
        Raw tool JSON goes to amb-home with D14/D15; R18 and `/theme` go to amb-web.
      - **Not a red after all** (ambient-lead m_12821): qa-native's script typed a bare `/theme`,
        which opens settings · general as decided in e118d823. `/theme dark` works (the
        window-commands and app/theme checks), and dark is reshot with `/theme dark`. The first
        read was: `/theme` left the window light, with data-theme unset, while the composer's tip
        promises that it switches. A red if the driver typed it right; asked qa-native.
    - **nit:** the spot's section head says "ENVIRONMENTS"; it should say "projects", like the sidebar
      and ⌘K (amb-web; designer m_12804).
    - **not judged:**
      - R24's image: test mode fences Electron's clipboard, so it needs amb-mac's clipboard seed.
      - R03: no button to hover after ⏎ on the spot's first row.
      - R34: setup isn't reached in a reshoot-only run.
      - R40 and the dark theme: next.
  - **reshoot 2** (qa-native m_12850):
    - Dark: `/theme dark` and settings · general's control both set data-theme=dark. The dark
      shots are designer's to judge.
    - R40: redone, with 12 deltas 250 ms apart; designer's to judge.
    - R18 is confirmed red, but narrower than it looked. The 52-line answer does land in bise's
      thread (R18-window-bise.png). The capsule stays on its list (640×952) and never shows the
      answer or says where it went (amb-web, coded and in its harness now).
    - Still not shot:
      - R03: ⏎ on the spot's first waiting row closes the capsule, so there's nothing to hover.
        app/clicks has one red left: telemetry's fold and menu on the agents screen (amb-win).
      - R34: setup's next doesn't reach the project picker in 20 s on this world (amb-home
        triages, ambient-lead m_12855).
    - **designer on reshoot 2** (m_12858):
      - Dark is signed: the telemetry and bise threads and settings, with contrast, pink accents,
        the "new" chips, the code block, the inbox card and the composer.
      - **R40: not in this build** (ambient-lead m_12862). The hub sends no partial events on
        ambient-app yet; amb-core builds them on main after desktop-hub lands (main m_12379). So
        every answer arrives whole, and R40 is judged on the build after that land. It is neither
        a red nor a pass here. Designer's first read was: the whole answer is there from the first
        of the 7 frames.
        designer asked qa-native for a 50 ms log of the last row's text length during the stream.
        If it jumps from 0 to the final length in one step, that's a red for the thread's
        streaming (amb-win).
      - No sign on 723648da. Designer signs the next cut if D12, D7b, D3b (amb-win e35bc349) and D14
        (amb-home 9f75a184) read right and R40 shows words arriving.
      - R24's image: waits on amb-mac's clipboard seed.
  - **question** (amb-win): with telemetry's 17 rows, shop and docs fall below the fold. Are the
    stopped rows under 1 h old, and does the current project scroll into view?
  - **still to come:**
    - qa-native redoes R03 (app/clicks), R18, R24/R15, R25 and R34.
    - The dark theme and R40's frames (the fake answered whole, so the frames are identical).
    - ambient-pm's use asks: dashboards' tool rows (S9), the ⌘I approval card (O.1), the
      spotlight preview (R07-a), bise in dark, and the feature review (A.6).
  - **the 30-minute use** with designer waits for the re-cut: with the project routes missing,
    most of the app can't be reached.

## Status at ambient-app a2039499: what is left (ambient-pm, for ambient-lead m_12152)

How this was read: the 117 specs in `apps/desktop/tests/checks`, the 214 lands since 6b1530fc, and
the QA agents' notes in sb. No app was run, and no heavy job.

Every row not listed here passes. That is a check, green on the real core or in the harness, named
in a land or a QA report. Since 6b1530fc these rows went to pass:

- ⛔1s, 2.4–2.7 (with quotes), 3.1–3.4.
- S.2, S.3, S.6, S.7, S.8, S.9, P.1, P.2, O.3, O.5.
- From section T:
  - the thread's rows: batch 2, 3a and 3b, S2, S8, S12–S17, S20, S22, S23, S25 and S36;
  - inbox, palette and preview: W6/K18, W7/K24, W14/V1, W2 (the sidebar), F5/M2/N11/B12, F7/M8/B13, M14, B11, V7/L11 and S32/C47;
  - settings, first run, demo and voice: L5, V8/W21, V17, L1/M18, L25/S37, N14/L8 and V12/W24/L21/N13.

tui-parity is re-auditing the terminal against a2039499; its new gaps will come as new rows.

| row | status | owner | the smallest next step |
|---|---|---|---|
| S.5 + O.4 core down, crash | **fail**: app/core-line red, "copy its path" never turns "copied". native/crash and setup/offline's last-log-line were red before CoreLine got the core's end and last line | amb-win (src/app/CoreLine.tsx) | fix the copied state; qa-native reruns native/crash + native/setup |
| O.6 every control clicks | **fail (soft)**: app/clicks on the real core, '+ add a project' green, one target still red on telemetry's screen | the target's chunk | qa-flows names the target in one line; its owner fixes it |
| S21 PR news | **fail (flaky)**: news-real found the failing #412 PR row in one run only | amb-win, amb-feed | qa-flows makes the PR step wait on the row's event, not a time |
| 2.1 / 2.2 / 2.3 in the real thread | built: thread/composer-sources is green in the harness; composer/lists-real's reds were fixed in 516b891a, with **no real-core rerun yet** | amb-web, amb-core | qa-type: `real.sh composer/lists-real` |
| C3, C13, C40, C42 commands | built: thread/commands' reds (/undo, /cancel and /flow sent as messages) were fixed, with **no real-core rerun yet** | amb-home, amb-feed | qa-flows: `real.sh thread/commands` |
| I9/C46/S30 confirmations | built: app/confirm-bar green in the harness; not run on the real core | amb-home | qa-type reruns it on the real core |
| W5 worktree sections | check written (agents/worktrees, 3377e118); no run result in the lands | amb-win | qa-flows posts the run's result |
| W11 artifacts in @ | check written (thread/at-artifacts, 982e582a); no run result in the lands | amb-web | qa-flows posts the run's result |
| O.2 pages | check written (pages/open, 828910b0); no run result in the lands | amb-win | qa-flows posts the run's result |
| O.6's composer part | check written (composer/controls); no run result found | amb-web | qa-type posts the run's result |
| 3.5 the key list | built, no check | amb-win, amb-home | qa-flows: settings/keys, every listed key has a handler and does its act |
| I3 ctrl+n / ctrl+p, I8 ctrl+o | built (the W7/K24 land, 72995314), no check: inbox/keys was never written | amb-home | qa-flows writes inbox/keys |
| I6/B3 a draft per inbox item | built in part: app/keep-all keeps the ⌘I answer across a reload; two items with one draft each are not checked | amb-home | qa-flows: inbox/drafts with two items |
| V14/S28/L2 expired sign-in | built (a7556130, vitest only); "not covered: the screen's wiring against a real core" | amb-home, amb-core | qa-native: setup/sign-in's expired case on the fake subscription |
| F1/F2 fold all / one, V3 the help filter | built (677c70cf), no check | amb-win | qa-flows: thread/folds, and a filter case in settings/keys |
| N2 color alone | built (a824752f), no check | amb-kit | qa-type: ds/contrast with increase contrast on |
| S9 tool calls | partly: the tools row exists and opens; each call's state and time, its first error line and its output are not confirmed | amb-win, amb-feed | qa-flows adds a failing-call case to thread/rows |
| S40/W3 the divider | partly: the context gauge is in the sidebar (rows-batch2); model, effort and approvals mode under the thread are not confirmed | amb-win | amb-win says where they show; qa-flows: thread/divider |
| S3 waiting on someone | not built (no land) | amb-win, amb-feed | a typed "waiting on" field on the agent row |
| S29/L19 computer use, live | not built (no land; P.2 setup passes) | amb-win, amb-core | plan with architect: the "took the wheel" event |
| C15/W20/V6 any branch's diff | partly: the diff keys only; a branch by name is not built | amb-win, amb-feed | a typed diff of a branch, then /diff <branch> |
| K2 ⏎ on an empty composer | not built | amb-win, amb-home | enter the selected agent first (the other two acts wait on S29 and V14) |
| O.1 approvals as cards | partly: news-real checks the approval row in the thread; approve and deny from ⌘I are not confirmed | amb-home, amb-core | qa-flows: inbox/approvals |
| S.4 where bise works | ?: app/folders checks the sidebar's folders; picking a workspace with no terminal is not confirmed | amb-home | amb-home says which screen does it; qa-flows: setup/workspace |
| S.1 no CLI (VM) | not run: native/vm-pass is opt-in, and the last try (de71e6d2) was off-screen only | amb-mac, qa-native | one VM pass when desktop-hub frees the heavy lock |
| B16 narrow window | not checked | ambient-pm | my hand pass |

## Status at ambient-app 6b1530fc (superseded by the section above; kept for the record)

How this was read: the checks in `apps/desktop/tests/checks`, the land messages on ambient-app since
4d22b577, and the reports of qa-type, qa-flows and qa-native. No app was run.

- **pass**: its check is green. "real core" means the check runs on the real core next to the TUI
  (`tests/checks/real.sh`). "harness" means it runs on the scripted core or the lab. The sha is the
  green run or the fix the run confirmed.
- **fail**: its check is red, or the app does it only partly. The row says what he'd see.
- **built, no check**: a land built it, but no check proves it yet.
- **not built**: no land does it.
- **?**: a check exists but i found no result, or i couldn't tell from the lands.

The status is one table here, keyed by row id. A column added to each of the ~150 rows above would
be the same data, and harder to keep in sync.

| id | status | owner | waits on |
|---|---|---|---|
| ⛔1 | pass, harness (composer/typing, composer/accents; 97db8f62, d38f2df9) | amb-web | - |
| ⛔1s | ? spotlight/typing moved onto the new labs in fef4c763; i found no result for it | amb-web | qa-type: a run result |
| ⛔1p | pass, harness (pearl/frames fef4c763: one canvas, no flash, no jump) | amb-web | - |
| ⛔2 | pass (composer/edit-keys, harness; native/mac-keys in qa-native's 15/15 at 7e1ca30e) | amb-mac, amb-web | - |
| ⛔3 | pass, real core (thread/send 5ee10a00, cold rule: the TUI's first send 382 ms; thread/route-hold exists) | amb-win, amb-core | - |
| ⛔4 | pass (thread/answers, spotlight/answer; lead m_10664) | amb-win, amb-web | - |
| ⛔5 | pass, real core (inbox/cmd-i, 4.6 s) | amb-home | - |
| ⛔6 | pass, real core (thread/interrupt 2c1ba161, after the runtime's issue 13 fix) | amb-win, amb-core | - |
| 2.1 | **fail in the real thread**: `/` lists nothing (ThreadScreen passes no commands). Passes in the lab (composer/slash 2d2d331d, with B21) | amb-web, amb-home | amb-home's commands item (C) and wiring the thread's sources |
| 2.2 | **fail in the real thread**: `@` lists no files. Passes in the lab (composer/at-files a4c30647) | amb-web, amb-home | amb-home (A), the file source in the thread |
| 2.3 | **fail in the real thread**: `$` lists no skills. Passes in the lab (composer/dollar-skills 97db8f62) | amb-web, amb-home | amb-home (B), the skill source in the thread |
| 2.4 | pass, harness (composer/images + no-vision 2/2; the files reach the agent, ad1eb9c7) | amb-web | - |
| 2.5 | built, rerun pending: red on the real thread (7a27cbab, a drag selected nothing and no path led to the chip); amb-win's fix 35d08ae5 passes it on the scripted core | amb-win, amb-web | qa-type's rerun (working) |
| 2.6 | pass: composer/dictation 5/5 in the lab, composer/dictation-real 1/1 on the real core (7a27cbab) | amb-web, amb-core | - |
| 2.7 | pass, harness (composer/long-paste) | amb-web | - |
| 3.1 | pass, harness (composer/queue-steer) | amb-web | - |
| 3.2 | pass, harness (composer/drafts) | amb-web | - |
| 3.3 | pass, real core (agents/write-to-one) | amb-win | - |
| 3.4 | pass, real core (thread/find) | amb-win | - |
| 3.5 | built, no check (677c70cf: the keys listed with no handler got one) | amb-win, amb-home | a settings/keys check (qa-flows) |
| S.1 | ? the VM pass (native/vm-pass) exists and is opt-in; skipped so far | amb-mac | a VM run (qa-native) |
| S.2 | built, no check (settings/accounts.tsx signs in); the expired sign-in is not built (see V14) | amb-home | a setup/sign-in check |
| S.3 | built, no check (settings · models by click); effort per role not built (V17) | amb-home | a settings/models check |
| S.4 | ? settings/projects.tsx exists; i found no land that says it switches the workspace | amb-home | amb-home to confirm |
| S.5 | **fail**: the app restarts the core (green), but while the core is down he sees only "bise isn't running · starting it again…", with no last log line (red, 6b1530fc; src/app/CoreLine.tsx has none) | amb-mac, amb-core | the last log line in CoreLine |
| S.6 | not built | amb-mac | - |
| S.7 | pass, harness (setup/perms, 15/15) | amb-home, amb-mac | - |
| S.8 | ? settings/check.tsx exists; no check | amb-home | a setup/check-again check |
| S.9 | built, no check (setup/Onboarding.tsx) | amb-home | a setup/welcome check |
| A.1–A.7 | pass, real core (agents/new, list, view, lifecycle, settings, models, tune; review/feature, feature-view, feature-drop, prs, prs-list; lead m_10664) | amb-win, amb-feed | - |
| P.1 | built, no check (settings/plugins.tsx) | amb-home | a settings/plugins check |
| P.2 | built, no check (settings/computer.tsx); the live hand-back is not built (S29) | amb-home, amb-mac | a setup/computer-use check |
| O.1 | ? i found no land or check for tool approvals as cards | amb-home, amb-core | amb-home to confirm |
| O.2 | built, no check (page rows in the thread) | amb-win | a pages/open check |
| O.3 | not built (no scheduled lines; history works only by asking main) | amb-win, amb-core | amb-feed item 5 batch 2 (scheduled) |
| O.4 | **fail** (native/crash red, 6b1530fc): after a crash he sees the plain "isn't running" line, with no crash words and no report action; the restart works | amb-mac, amb-core | the crash line and a report action |
| O.5 | pass, harness (native/fn-from-rest 6b1530fc: one talk_start within 300 ms with TextEdit in front, bise never frontmost; real fn in the VM pass 442f748a) | amb-mac | - |
| O.6 | built, no check (data-testid on controls) | every chunk | an app/clicks check |
| K7 | pass, real core (thread/interrupt) | amb-win | - |
| I3 | ? no inbox/keys check; i couldn't tell whether ctrl+n/ctrl+p are wired | amb-home | an inbox/keys check |
| B21 | pass, harness (composer/slash, B21 case) | amb-web | - |
| K3, K4/B6, K11, K12, K23, E3, E9, E21, E22, W13, B8, B9/W8, W9, C45 | pass, harness (qa-type at 803e7d35 and after: code-fence-enter, no-vision, list-indent, no-undo, subword, at-folders, emoji, at-files, live-markdown, keybar, prefixes) | amb-web | - |
| S1, S2, S3, S8, S9, S12, S13, S14, S17, S20/M12, S21, S22/M13, S23, S25, S40/W3 | not built: no thinking, compaction, usage, failed-turn, landed, PR, artifact, scheduled, notice or model rows in the thread yet | amb-win, amb-feed | amb-feed item 5 batch 2 (typed rows; batch 1 f1f7f3d0 is the parser), then amb-win |
| S15/K22/B20 | built, no check of its own (77de63ae: "not delivered" on his row, with retry) | amb-win, amb-feed | a thread/not-delivered check |
| S16 | pass, harness (thread/to-agent; eb752406, 1b1d0abe) | amb-win, amb-feed | - |
| S29/L19 | not built | amb-win, amb-core | - |
| S32/C47 | built, no check (550d0324) | amb-win | an agents/archived check |
| S33 | pass, harness (composer/no-vision) | amb-win | - |
| S36 | not built | amb-win | - |
| W2 | partly built, no check (550d0324: the counts); the new-artifact line waits on artifact events | amb-win | amb-feed batch 2 |
| W4/K14/K16 | pass, real core (agents/list: the TUI's order and sticky numbers, ⌥1 opens p99 in both; c0d5c638, 677c70cf) | amb-win | - |
| W5 | built, no check (550d0324) | amb-win | an agents/worktrees check |
| W6/K18 | not built | amb-win | - |
| W7/K24 | not built (the inbox strip in the thread) | amb-win, amb-home | - |
| W11 | built, no check (e31308b1, artifacts in the @ list) | amb-web | a thread/at-artifacts check |
| W14/V1, V3, F1/F2, F5/M2/N11/B12, F7/M8/B13 | built, no check (677c70cf keys, 550d0324 rows) | amb-win | qa-flows: palette, keys, folds, scroll, code-copy checks |
| C15/W20/V6 | partly built: the diff keys (677c70cf); any branch by name is not built | amb-win, amb-feed | - |
| V7/L11 | not built (quote diff lines) | amb-win | - |
| M4/B14 | pass, harness (thread/file-links, c5b3ae87) | amb-win, amb-mac | - |
| M14 | not built | amb-win | - |
| B11 | built, no check (550d0324) | amb-win | a thread/rows check |
| B15 | built (e62beef4: language label and colors); thread/answers checks only the label's size | amb-win | - |
| K2 | not built | amb-win, amb-home | - |
| I6/B3, I8, I9/C46/S30, N14/L8, V8/W21, V14/S28/L2, L5, V17, L1/M18, L25/S37 | not built: no amb-home land since 4d22b577 | amb-home | amb-home's turn |
| C3 | partly built: the typed `new` command takes with_changes (6cb6c0ef); the /command is not built | amb-home | amb-home's commands item |
| C13/L15, C40, C42/L14 | not built | amb-home | amb-home's commands item |
| W33/N10 | pass, harness (native/badge 6b1530fc: the badge and "bise · 2 waiting" in the title, updated at once; the Dock icon itself is the VM pass's) | amb-mac | - |
| W25/V13/K26/M16 | pass, harness (terminal/panel: ⌃` opens a shell, hide and show keep it; 7dc16b63) | amb-win, amb-mac | - |
| V12/W24/L21/N13 | not built (voice mode with the agent in view) | amb-mac, amb-web | - |
| N2 | built, no check (a824752f, never by color alone) | amb-kit | a ds/contrast check |
| B16 | not checked (narrow window) | - | ambient-pm's hand pass |

## Order

⛔1–⛔6 first, with ⛔1s and ⛔1p: they are his 7 bugs. Then 2.1–2.7, then S.1–S.5 (no one without a
terminal gets past setup without them), then 3.x, the rest of S, then A, P and O. ambient-pm does the hand
pass of every row on the last turn and marks it here: pass, fail (with what he'd see) or not built.
