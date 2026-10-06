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

## Order

⛔1–⛔6 first, with ⛔1s and ⛔1p: they are his 7 bugs. Then 2.1–2.7, then S.1–S.5 (no one without a
terminal gets past setup without them), then 3.x, the rest of S, then A, P and O. ambient-pm does the hand
pass of every row on the last turn and marks it here: pass, fail (with what he'd see) or not built.
