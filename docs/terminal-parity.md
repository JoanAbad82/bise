# Terminal parity: everything the TUI does, and where the desktop app is

Owner: tui-parity (for ambient-lead and ambient-pm). Page: http://127.0.0.1:47438/p/terminal-parity.
The audit of `rust/tui` (and the hub commands it sends through, `rust/switchboard/src/router.rs`)
against `apps/desktop` on `ambient-app`. It feeds `docs/desktop-bar.md`; it does not replace it.

Status, for the desktop app:

- **done**: the app does it; where.
- **planned**: a row of `docs/desktop-bar.md` covers it (its id), built or not.
- **MISSING**: no bar row covers it, and the app does not do it.
- **n/a**: terminal-only on purpose (it fixes a terminal limit, or the bar leaves it out); said why.

- **differs**: the app does it another way; the lead says if that is on purpose.
- **part missing**: a row where the app or the bar covers part, and the rest is missing.

Sources are `file:line` under `rust/tui/src/` unless the path says otherwise; desktop paths are
under `apps/desktop/src/`. Read from the source on `ambient-app` at 9c85cc18; nothing was run.

## Re-audit at ambient-app e3f7e598 (for the merge into main)

The 20 open lines below (R1-R20) were read again against ambient-app e3f7e598 (code only,
nothing run), and the TUI's slash catalogs were matched against the window's. **18 are done, 1
is part missing, 1 differs by decision; 2 new gaps** (TUI commands the window doesn't run).

Done since a2039499, with where: R1 the hub runs typed `/stop`, `/version`, `/restart`,
`/update`, `/approvals` (`rust/switchboard/src/proto_view/slash.rs:55`); R2 `/plugins
enable|disable|login|logout x`, R3 `/theme light|dark|auto` and `/computer-use off|uninstall`,
R4 `/scheduled`, R5 `/quit`, R7 `/diff <branch>` (all `apps/desktop/src/thread/commands.ts`
`windowRun`); R8 `/model` on a provider with no key opens its setup first (`store/store.ts:723`);
R9 "⋯ waiting on docs" (`thread/head.ts:23`, `app/side.ts:49`); R10 model · effort · approvals
mode on the composer's label line (`thread/ThreadScreen.tsx:95`); R11 a call's `✗ exit 1 · 2.1 s`
and its first error line (`thread/entry.ts:277`); R12 a failed turn's own row
(`thread/rows.tsx:152`); R13 agent-to-agent runs folded (`thread/runs.ts`); R14 the `@` list ranks
a picked file first (`composer/sources.ts:79`); R15 the expired ChatGPT sign-in in the thread
(`thread/signin.tsx`); R16 computer use's marks and "you took the wheel" (`thread/AgentHead.tsx:64`,
`app/side.ts:67`; `/stop` lets go of Chrome on the hub, 7230a30e); R17 "↗ 1 new · designer"
(`app/Sidebar.tsx:209`); R19 inbox arrows as the TUI's cards (`inbox/Inbox.tsx:332`); R20 esc on
the `/` list clears the text (`composer/pm/PmField.tsx:777`).

**Still open at e3f7e598 (4).** Owners and calls live in `docs/desktop-bar.md` section T (the TP- rows):

| # | owner | still missing or different | smallest proof |
|---|---|---|---|
| R6 | bar row TP-R6 (owner there) | part missing: ⇧⇥ in the composer doesn't switch the approvals mode (the TUI's key, with its 3 s flash); typed `/approvals yolo` and the mode on the label line are done | ⇧⇥ in the composer flips yolo ↔ auto and the label line shows it |
| N1 | bar row TP-N1 (owner there) | `/keychain on\|off` is a window command in the catalog (`rust/proto/src/commands.rs`, client) with no `windowRun` case and no settings page: the `/` list shows it greyed "not yet" | `/keychain on` ⏎ moves the secrets as the TUI does, or settings shows the switch |
| N2 | bar row TP-N2, in scope, blocks main (ambient-pm m_17249: amb-feed's catalog + amb-win's screen) | `/log` (the agent's raw session, `rust/tui/src/logview.rs`, shipped to everyone in 92f72225) has no window screen and isn't in the window's `/` list (it is not in the proto catalog) | `/log` ⏎ opens the agent's raw session (full history and one request's context, redacted), listed in the `/` list |
| R18 | done, bar K7 (ambient-lead m_17253) | ctrl+c stops a turn in the window as in the TUI (amb-web; on the Mac copy is ⌘C, so ctrl+c is free), and esc stops it too, on purpose (⛔6) | ctrl+c while a turn runs stops it (qa-flows thread/interrupt) |

Left out on purpose: `/version` (dev tool, bar 2.1), `/release-bise` (dev). Not re-checked: the
first audit's planned rows beyond these lines, and a narrow window (B16).

## Re-audit at ambient-app a2039499

The 117 rows that were MISSING, part missing or differs at 9c85cc18 were read again against
ambient-app a2039499 (code and the checks under `apps/desktop/tests/checks`, nothing run). **Most
are done now; 20 lines below are still open** (one line can group several old rows: R1 holds four
commands, R15 and R16 hold V14, S28, L2, K2, S29, L19). Done: `/` `@` `$` wired (`thread/ThreadScreen.tsx:664`), the window's keys
(`app/keys.ts`: ⌘0-9, ⌥0-9, ⌘K, ⌘D, ⌘⇧A, ⌘E, ⌘/, ⌘., end, ctrl+y, ⌥↑↓), the palette, the help
overlay with filter, quotes (thread and diff lines), live markdown, list indent, code-fence ⏎,
emoji, subword moves, `@` folders and artifacts, no-vision, no-undo, steer/say prefixes, confirms
(`inbox/confirm.tsx`), the inbox strip with ctrl+1-9 and per-item drafts, archived threads
read-only, agent preview (`agents/Peek.tsx`), worktrees, the terminal panel, voice mode with the
agent in view (`voicemode/`), voice answers to items, the dock badge (`main/counts.ts`), thread
rows for thinking, compaction, notices, not delivered (⏎ / esc), landed, PR news, artifacts,
main's answers, approvals and scheduled lines, code blocks with language, highlighting and copy,
file links, hover time, back-to-bottom with the new count, long messages folded, the demo tour,
hints and "show me what you can do". Unknown `/words` go to the hub's router
(`thread/commands.ts` `slashLine`), so `/cancel`, `/flow`, `/new --with-changes` and
`/artifacts add` run as in the TUI.

**Still missing or partial (20)**, one line each: owner · what · smallest proof.

| # | owner | still missing | smallest proof |
|---|---|---|---|
| R1 | amb-feed (hub router) | typed `/stop <agent>`, `/restart`, `/update`, `/version` are listed as hub commands (`rust/tui/src/ambient/core/picks.rs:35`) but `router.rs` has no case for them: they become Passthrough and the hub answers "unknown command" (`rust/switchboard/src/core_user.rs:132`). The TUI runs them client-side (`rust/tui/src/sb.rs:1162`) | a hub unit test: `route(parse("/stop perf", MAIN))` then the core step yields an interrupt, not the "unknown command" notice; the same for `/restart`, `/update` |
| R2 | amb-win | `/plugins enable\|disable\|login\|logout <name>` typed: `windowRun` returns nothing with an argument (`thread/commands.ts:62`), the line goes to the hub, which doesn't know `/plugins` | thread/commands spec: `/plugins disable x` ⏎ turns x off (settings · plugins shows it off), no "unknown command" |
| R3 | amb-win | `/theme dark` and `/computer-use off\|uninstall` open their settings page and drop the argument (`thread/commands.ts:55`, `:64`) | `/theme light` ⏎ switches the palette; `/computer-use off` ⏎ turns it off |
| R4 | amb-win | `/scheduled` is greyed "not yet" (`thread/commands.ts:22` ready false, no `windowRun` case) though the `scheduled` route and `scheduled/Screen.tsx` exist | `/scheduled` ⏎ opens `route:scheduled` |
| R5 | amb-win | `/quit` has no `windowRun` case: greyed (⌘Q works) | `/quit` ⏎ quits, the agents keep running |
| R6 | amb-feed + amb-win | `/approvals [yolo\|auto]` typed is not a command anywhere in the app's path (TUI client-side, `sb.rs:1205`); ⇧⇥ in the composer doesn't switch the mode; the mode isn't shown near the composer (TUI divider). The switch exists in settings · approvals | `/approvals yolo` ⏎ and ⇧⇥ in the composer each flip the mode settings · approvals shows |
| R7 | amb-win | `/diff <branch>` takes an agent name only (`thread/commands.ts:41`): a branch with no agent can't be opened by name | `/diff sb/x` (a branch, no agent) opens its diff |
| R8 | amb-home + amb-core | `/model <model>` whose provider has no key: the TUI opens that provider's setup, then runs the line (`sb.rs:1250`); the app sends it to the hub | `/model openrouter/x` with no OpenRouter key opens settings · models on OpenRouter; after the key, the agent's model is x |
| R9 | amb-feed + amb-win | "waiting on <agent>": no `waiting_on` in the proto's agent row (`rust/proto/src/rows.rs`), and the head says "? waiting for you" for any `waiting` status (`thread/head.ts:21`), wrong when it waits on another agent | an agent waiting on docs shows "waiting on docs" in its head and the sidebar, not "waiting for you" |
| R10 | amb-win | the model and effort of the agent in view are not shown (TUI divider); the proto has them (`rows.rs:100`, `:107`); the head shows state, usage and branch only (`thread/AgentHead.tsx:45`) | thread/agent-head: the head (or the composer's label) shows `opus · high` |
| R11 | amb-feed + amb-win | a tool call's own result: ✓ / ✗ exit 1 and its first error line; the folded tools row lists `$` / `±` lines with times only (`thread/entry.ts:197`) | a failing bash call shows `✗ exit 1` and its first error line in its row |
| R12 | amb-feed + amb-win | a failed turn and its reason (`failed: …`, `interrupted by …`): no entry kind of its own; not checked whether the hub sends it as a notice | a turn that fails shows one line with its reason |
| R13 | amb-win | agent-to-agent runs folded by level (`▸ 4 messages between 2 agents`): to_agent rows exist, no fold of a run | 5 messages between two agents in main's thread show as one folded line |
| R14 | amb-web + amb-core | the `@` list's memory: a picked path ranks first next time (`rust/tui/src/commands.rs` `PopItem.path`) | pick `src/b.rs` once, type `@` again: it's first |
| R15 | amb-home | the expired ChatGPT sign-in in the thread: `⏎ sign in again` on an empty composer, `c` copies the link, esc cancels; today it's only in settings · accounts (`settings/accounts.tsx:65`). amb-home has K2 in hand | an expired sign-in: ⏎ in the stopped agent's empty composer starts the sign-in |
| R16 | amb-core (in hand) | computer use live in the thread: the driving marks, "you took the wheel · ⏎ give it back", `/stop` letting go of Chrome (S29, L19, K2) | amb-core's S29/L19 checks |
| R17 | amb-win | the top edge's "↗ N new" artifacts and who made them: not seen in the head or the sidebar (the dock badge counts exist) | a new artifact shows `↗ 1 new · designer` until the artifacts screen is opened |
| R18 | lead's call | differs, unchanged: esc stops the turn (TUI: never) | none: say if on purpose |
| R19 | lead's call | differs, unchanged: inbox ↑↓ change items and ←→ walk options (`inbox/Inbox.tsx:265`), the TUI the other way round | none: say if on purpose |
| R20 | lead's call | differs, unchanged: esc on the `/` list keeps the text (the TUI clears it) | none: say if on purpose |

Not re-checked: the 103 planned rows' behavior beyond the code being there, and narrow-window
layout (B16). The rows below keep their first-audit status (9c85cc18); the list above supersedes
them.

## Summary

At the first audit (9c85cc18), 294 items: 53 done, 103 planned, 69 MISSING, 45 part missing, 3 differs, 20 n/a, 1 not checked.

| area | items | done | planned | MISSING | part missing | differs | n/a |
|---|---|---|---|---|---|---|---|
| slash commands | 48 | 2 | 34 | 7 | 1 | 0 | 4 |
| keys: talking and agents | 26 | 5 | 7 | 9 | 3 | 1 | 1 |
| keys: editing | 26 | 17 | 5 | 4 | 0 | 0 | 0 |
| keys: inbox | 9 | 2 | 3 | 2 | 1 | 1 | 0 |
| keys: feed | 8 | 2 | 1 | 4 | 0 | 0 | 1 |
| keys inside a view, voice | 17 | 1 | 7 | 4 | 5 | 0 | 0 |
| mouse | 20 | 9 | 1 | 6 | 2 | 0 | 2 |
| views | 34 | 1 | 13 | 5 | 11 | 0 | 4 |
| states | 41 | 6 | 8 | 18 | 6 | 0 | 3 |
| settings, notifications | 14 | 2 | 6 | 3 | 2 | 0 | 1 |
| flows | 27 | 1 | 15 | 3 | 7 | 0 | 1 |
| small behaviors | 24 | 5 | 3 | 4 | 7 | 1 | 3 |

The three findings that matter most, beyond single rows:

1. The real thread's composer gets no commands, files or skills (`thread/ThreadScreen.tsx:151`
   calls `useComposerSources(project)` with none): `/`, `@` files and `$` list nothing outside the
   test lab. 2.1, 2.2 and 2.3 are built as popups but not wired.
2. `settings/keys.ts` shows ten keys that have no handler (⌘0, ⌘1…9, ⌥0…9, ⌘K, ⌘D, ⌘⇧A, ⌘E,
   ⌘/, ⌘.): the key list promises what the app doesn't do.
3. The thread shows 8 entry kinds where the TUI's feed has 33: thinking, compaction, usage and
   context, failed turns, not delivered, landed, PR news, artifacts other than pages, scheduled
   lines, agent-to-agent folds and main's answers for you have no row.

Not checked: how a narrow window lays out (B16); whether the planned rows are built as the bar
says (I read the code, I did not run the app or the TUI); the hub-side behavior of each command
beyond `router.rs`.

## Slash commands

The TUI's table is `commands.rs:58` `COMMANDS` (33 commands, the `/` popup and `/help`), plus
aliases and hidden commands handled in `sb.rs:1071` `handle_input`, the dev build's
(`sb/release.rs:13`), and the hub's own parser (`rust/switchboard/src/router.rs:164`).

Desktop: the composer has the `/` popup (`composer/pick.ts`, `composer/Brain.tsx`), but the real
thread gives it **no commands**: `thread/ThreadScreen.tsx:151` calls `useComposerSources(project)`
with no `commands`, so `/` lists nothing outside the test lab (`composer/Lab.tsx:81`). Every
typed command below is therefore missing as a command today; the row says where the same action
exists by click.

| # | command | what it does | args (completion) | source | desktop |
|---|---|---|---|---|---|
| C1 | `/` popup | lists the commands as you type, then each argument's values; tab completes, ⏎ runs a command with no args | per command, below | `commands.rs:144` `popup_matches`, `commands.rs:174` `popup_items`, `commands.rs:450` `arg_items` | planned 2.1: the popup exists (`composer/pick.ts`) but the thread passes no commands (`thread/ThreadScreen.tsx:151`) |
| C2 | `/new [-w] [name:] objective` | starts an agent; `-w`/`--worktree` in its own git worktree; `--with-changes` (with -w) takes the uncommitted changes; `-s` shared | `-w`, then free text | `commands.rs:74`, `router.rs:184` | planned 2.1, A.1: the agents screen's "new" button is disabled, "not yet" (`agents/AgentsScreen.tsx:27`) |
| C3 | `/new --with-changes` | moves your uncommitted changes into the new worktree | not offered by the popup | `router.rs:195` | MISSING (not in 2.1's list) |
| C4 | `/archive <agent>` (`--force`) | stops an agent and archives it with its worktree; `--force` even when working | live agent | `commands.rs:79`, `router.rs:218` | planned 2.1, A.4; by click: done (`agents/AgentsScreen.tsx:115`, archive button, force when working) |
| C5 | `/restore <agent>` | brings an archived agent back | archived agent | `commands.rs:84`, `router.rs:227` | planned 2.1, A.4; by click: done (`agents/AgentsScreen.tsx:93`) |
| C6 | `/archived` | shows or hides the archived agents in the panel | none | `commands.rs:85`, `sb.rs:436` | planned 2.1; by click: done (`agents/AgentsScreen.tsx:46`, the "archived" toggle) |
| C7 | `/isolate <agent>` | gives an agent its own git worktree | live agent | `commands.rs:86`, `router.rs:227` | planned 2.1, A.5 |
| C8 | `/rename <agent> <new-name>` (one word in an agent's view: renames it) | renames an agent | live agent, text | `commands.rs:87`, `router.rs:238` | planned 2.1, A.5 |
| C9 | `/answer N text` (`/reply`, `#N`) | answers an inbox item | open card number, text | `commands.rs:88`, `router.rs:251` | planned 2.1; by the inbox: done (`inbox/screen.tsx`, store.answer) |
| C10 | `/close N [note]` | closes an inbox item without answering | card number, optional note | `commands.rs:89`, `router.rs:261` | planned 2.1, ⛔5; the inbox has no close yet (`inbox/screen.tsx:5`: waits for the core's close command) |
| C11 | `/plugins [list\|enable\|disable\|login\|logout] [<name>]` | the workspace's agent plugins and their state, printed as lines | the five words, then a plugin | `commands.rs:90`, `sb.rs:1177`, `plugins.rs` | planned 2.1, P.1; settings · plugins: done (`settings/plugins.tsx`) |
| C12 | `/artifacts` | the artifacts screen, full screen | none | `commands.rs:104`, `sb.rs:1128` | planned 2.1; the `artifacts/<p>` route draws "not yet" (`app/App.tsx:100`, no case) |
| C13 | `/artifacts add <path or link>` | registers an artifact for the agent in view | not offered by the popup | `sb.rs:1130` | MISSING |
| C14 | `/scheduled` | the scheduled tasks (sb every), full screen | none | `commands.rs:105`, `sb.rs:1124`, `scheduled_screen.rs` | planned 2.1, O.3; no screen |
| C15 | `/diff [<branch>]` | a branch's changes against main, in a panel on the right; no arg: the agent in view's | branch (agents' branches, worktrees, PRs, branches with no agent) | `commands.rs:106`, `sb.rs:1144`, `diffview.rs` | planned 2.1; review screen of an agent: done (`review/ReviewScreen.tsx`); any branch by name: MISSING |
| C16 | `/inbox` (`/cards`) | opens the inbox on its first item; empty: says "the inbox is empty" | none | `commands.rs:107`, `sb.rs:1196` | done: ⌘I and Go · Inbox (`main/menu.ts`, `inbox/screen.tsx`); as `/inbox`: planned 2.1 |
| C17 | `/agents` (`/tasks`) | the board of every agent and what it does (hub-printed) | none | `commands.rs:108`, `router.rs:266` | done: the agents screen (`agents/AgentsScreen.tsx`); as `/agents`: planned 2.1 |
| C18 | `/switch [words]` | the agent palette, filtered by the rest of the line | none | `commands.rs:109`, `sb.rs:1194`, `sb/palette.rs` | planned 2.1; ⌘K is in the key list (`settings/keys.ts:37`) but no handler exists |
| C19 | `/model [<model>] [default]` | the model of the agent in view; `default` also for new sessions (config.toml roles); a model whose provider has no key opens the provider setup first, then runs the line | model or alias, then `default` | `commands.rs:110`, `sb.rs:1250`, `router.rs:270` | planned 2.1, A.5 |
| C20 | `/models` (`/roles`) | which model does what: main, agents, small jobs, voice | none | `commands.rs:118`, `sb.rs:1236`, `onboarding/roles.rs` | planned 2.1, S.3; settings · models: done (`settings/pages.tsx:26`) |
| C21 | `/provider [<id>]` (`/providers`) | set up a provider's key, or change it; an id opens that provider | none offered | `commands.rs:119`, `sb.rs:1244`, `onboarding/provider.rs` | planned 2.1, S.2; settings · models / accounts: done (`settings/accounts.tsx`, key_set, sign_in) |
| C22 | `/reasoning [<effort>]` (`/effort`) | the reasoning effort of the agent in view | the efforts its model takes | `commands.rs:120`, `router.rs:280` | planned 2.1, A.5 |
| C23 | `/interrupt` | interrupts the turn of the agent in view | none | `commands.rs:121`, `router.rs:269` | planned 2.1; esc / stop button: done (`thread/ThreadScreen.tsx:85`, store.stop) |
| C24 | `/stop <agent>` (`@name` too) | stops an agent's turn and its hands on Chrome or apps until you write to it | live agent | `commands.rs:122`, `sb.rs:1224` | planned 2.1, A.4; agents screen stop button: done (`agents/AgentsScreen.tsx:107`) |
| C25 | `/computer-use [off\|uninstall]` | turns computer use on and opens its setup; off / uninstall | by its state: on, off, uninstall | `commands.rs:127`, `sb.rs:1214`, `computer_use.rs` | planned 2.1, P.2; settings · computer use: done (`settings/computer.tsx`) |
| C26 | `/compact` | compacts the conversation of the agent in view | none | `commands.rs:132`, hub passthrough | planned 2.1 |
| C27 | `/theme [auto\|light\|dark]` | switches the palette now and keeps it; no arg says which is in use | the three words | `commands.rs:133`, `sb.rs:529` | planned 2.1; settings · general · theme: done (`settings/pages.tsx:75`) |
| C28 | `/welcome` | replays the first-launch welcome | none | `commands.rs:138`, `onboarding.rs` | planned 2.1, S.9; the onboarding route: done (`setup/Onboarding.tsx`) |
| C29 | `/setup` | checks the terminal and repo again, and offers what would help | none | `commands.rs:139`, `sb/setup.rs` | planned 2.1, S.8; settings · setup: done (`settings/check.tsx`, setup_check) |
| C30 | `/help` | the commands and the essential keys (overlay) | none | `commands.rs:140`, `help.rs:215` | planned 2.1, 3.5; settings · keys: done (`settings/keys.ts`) |
| C31 | `/shortcuts` (`/keys`, `/shortcut`) | every keyboard shortcut, filterable | none | `commands.rs:141`, `sb.rs:1189` | planned 3.5; settings · keys: done, but ⌘/ has no handler |
| C32 | `/quit` (`/exit`) | quits; the agents keep running | none | `commands.rs:142`, `sb.rs:1160` | done: ⌘Q (`main/menu.ts`) |
| C33 | `/voice` | the voice settings screen: dictation on/off, model, voice, language | none | `commands.rs:61`, `sb.rs:1077`, `voicemode/settings.rs` | planned 2.6; settings · voice and fn: done (`settings/pages.tsx:23`) |
| C34 | `/voice setup` | the same screen, on speech to text | typed only | `sb.rs:1083` | planned 2.6 (settings · voice) |
| C35 | `/restart [current\|<commit>]` | reloads bise, nothing lost; a commit (bise's own tree) is built then switched to | `current`, dev versions | `commands.rs:62`, `sb.rs:1162` | planned 2.1, S.5 |
| C36 | `/update` | looks for a new release now and installs it from its item (source tree: builds HEAD) | none | `commands.rs:67`, `sb.rs:1167` | planned 2.1, S.6 |
| C37 | `/version [<commit>\|tree\|back]` | switchboard versions: list, switch, roll back | the hub's version list | `commands.rs:68`, `sb.rs:1168` | n/a: left out by the bar (a dev tool) |
| C38 | `/clear` | clears the display; scroll up shows the lines again | not in the popup | `sb.rs:1185` | n/a: a terminal screen clear; the bar says no `/clear` |
| C39 | `/approvals [yolo\|auto]` | shows the approvals mode, its checker and rules, or switches the mode | typed only | `sb.rs:1205` | planned O.1 (approvals and auto mode); no switch in the app |
| C40 | `/cancel` (`/undo`) | says there is no undo: tell main the change instead | typed only | `sb.rs:1260`, `router.rs:264` | MISSING (the app sends it to the agent as text) |
| C41 | `/prs` | the PR list (hub) | not in the popup | `router.rs:268` | planned A.7 |
| C42 | `/flow [pr\|trunk]` | the repo's dev flow: land by PR or on trunk | not in the popup | `router.rs:286`, `docs/dev-flow.md` | MISSING |
| C43 | `/release-bise [dry-run]` | dev build only: tags HEAD, CI builds, publishes, after a y/n | `dry-run` | `sb/release.rs:13` | n/a: dev build only |
| C44 | `/log` | dev only (`BISE_DEV=1` or the dev build): the raw session of the agent in view | typed | `sb.rs:1114`, `logview.rs` | n/a: dev only (O.4 covers crash and error reports) |
| C45 | `steer …` / `say …` prefixes | stripped before the line runs (voice and old habits) | typed | `sb.rs:1087` | MISSING (harmless: sent as text) |
| C46 | `y` / `n` to a hub confirmation | a typed y/yes/o/oui or n/no/non answers the pending confirmation (e.g. archive a working agent) | typed | `sb.rs:1099`, `sb/keys.rs:67` | MISSING: no confirmation surface in the app |
| C47 | a line to an archived agent | refused: "its feed is history only" | typed | `sb.rs:1263` | MISSING: the app's thread of an archived agent still has a composer that sends |
| C48 | unknown `/word` | goes to the hub as text (passthrough: the agent sees it) | typed | `router.rs:296` | done (sent as text) |

## Keys: talking and moving between agents

How I made sure: every `KeyCode::` match outside tests in `rust/tui/src` (31 files, ~540 matches:
`rg -c 'KeyCode::'`), read file by file, against `help.rs:86` `ROWS` (101 rows, the `/shortcuts`
list) and the key bar (`keybar.rs`). Desktop: every `keydown`/`onKeyDown` handler and menu
accelerator in `apps/desktop/src` (17 handlers, `main/menu.ts`). Note: `settings/keys.ts` lists
⌘0, ⌘1…9, ⌥0…9, ⌘K, ⌘D, ⌘⇧A, ⌘E, ⌘/ and ⌘. but **no handler exists for any of them** (only ⌘F,
⌘I, ⌘, ⌘[ ⌘] and the spotlight's ⌘1…9 do).

| # | key | what it does | where | source | desktop |
|---|---|---|---|---|---|
| K1 | ⏎ | sends to the agent in view; while it works, steers its turn (`steer`); at idle starts one (`say`) | composer | `input.rs:779` | done (`composer/Brain.tsx:329`, `thread/ThreadScreen.tsx:153` mode 'now'); planned ⛔3 |
| K2 | ⏎ on an empty composer | nothing (no empty send); agent selected: enters it; a stopped computer-use agent: gives it back the wheel; an expired ChatGPT sign-in: signs in again | composer empty | `sb/keys.rs:120`, `sb/keys.rs:138`, `input.rs:787` | done for the no-empty-send; the rest MISSING (see states) |
| K3 | ⏎ inside a ``` code block | a new line: you never send half a block; close it with ``` to send | composer | `input.rs:791`, `mdlive.rs` | MISSING |
| K4 | ⏎ with images to a model that reads none | refused with the no-vision line; the message stays | composer | `input.rs:796`, `attach.rs` | MISSING |
| K5 | `@agent …` at the start | a direct message to that agent without leaving main; `@main …` from inside an agent | composer | `router.rs:166`, `sb.rs:514` | planned 3.3 (the `@` list has the agents: `composer/pick.ts`) |
| K6 | ctrl+c | interrupts the turn of the agent in view; again (or at idle) quits, the agents keep running | anywhere | `sb/keys.rs:104`, `input.rs:680` | the stop: done (esc, `thread/ThreadScreen.tsx:85`); quit: ⌘Q |
| K7 | esc during a turn | (TUI: never interrupts; esc puts the draft away) | composer | `input.rs:701` | differs: the app makes esc stop the turn (⛔6, `thread/ThreadScreen.tsx:85`), on purpose; the TUI never does |
| K8 | ⇧⇥ (shift+tab) | switches the approvals mode yolo ↔ auto (the word after the model on the divider) | composer, approvals and computer-use screens | `input.rs:741`, `sb.rs` `toggle_approvals`, `approvals_screen.rs:54` | planned O.1 (auto mode); no key or switch in the app |
| K9 | tab during a turn | queues the message for the end of the turn, shown above the composer | composer | `input.rs:760`, `queue.rs` | done (`composer/Brain.tsx:347`, `composer/drafts.ts:64`); planned 3.1 |
| K10 | ↑ in an empty composer with a queue | the newest queued message back to edit | composer | `input.rs:832`, `queue.rs` | done (`composer/Brain.tsx:387`); planned 3.1 |
| K11 | tab on a list item | indents a markdown list item one level | composer | `input.rs:754`, `mdlive.rs` | MISSING |
| K12 | backspace at the start of a list item | outdents it | composer | `input.rs:733` | MISSING |
| K13 | hold ctrl / hold ⌥ / hold cmd | shows that modifier's shortcuts where they act: fold hints, inbox numbers, panel numbers, key bar; words hidden at rest come back | anywhere (kitty protocol terminals) | `ctrlhint.rs:1` | n/a: a terminal's stand-in for menus; the app shows keys in its menu bar (⛔2). The hidden words (state words, counts) are a separate question |
| K14 | ⌥0 … ⌥9 | goes to main (0) or to the agent with that number in the panel | anywhere | `sb/keys.rs:21` | MISSING: listed in `settings/keys.ts:36`, no handler |
| K15 | ⌘K / ctrl+s / `/switch` | the agent palette: find an agent by name (archived too) and open it | anywhere | `sb/palette.rs:159` | planned 2.1 (`/switch`); ⌘K listed in `settings/keys.ts:37`, no handler; the spotlight (fn+space) finds agents (`spotlight/list.ts`) |
| K16 | alt+↓ / alt+↑ | selects the next / previous agent in the panel | empty composer | `sb/keys.rs:19` | MISSING |
| K17 | ⏎ on a selected agent | enters it | panel selection | `sb/keys.rs:138` | done by click (`app/Sidebar.tsx`, `agents/AgentsScreen.tsx:79`) |
| K18 | space on a selected agent | previews its feed without entering it | panel selection | `sb/keys.rs:144` | MISSING |
| K19 | D on a selected agent | asks "archive {name}?"; y archives, n or esc keeps it | panel selection | `sb/keys.rs:152`, `sb/keys.rs:63` | by click: done (archive button, no confirmation: `agents/AgentsScreen.tsx:115`) |
| K20 | A on a selected agent / `/archived` | shows or hides the archived agents | panel selection | `sb/keys.rs:148` | done by click (`agents/AgentsScreen.tsx:46`) |
| K21 | esc | closes the agent selection; in an agent, back to main; with a draft, puts it away (↑ brings it back) | composer | `sb/keys.rs:159` | draft away: done (`composer/Brain.tsx:366`); back to main: ⌘[ (`app/App.tsx:180`) |
| K22 | ⏎ / esc after "✗ not delivered: {name} stopped" | ⏎ sends it again, esc drops it | composer empty | `sb/keys.rs:85` | MISSING |
| K23 | ctrl+z with nothing to undo | says "no undo: an agent may already have acted…" | composer | `sb/keys.rs:197`, `sb.rs:522` | MISSING |
| K24 | ctrl+1 … ctrl+9 | opens the inbox item with that number (or a click) | anywhere | `sb/cards.rs:1119`, `sb.rs` `proves_ctrl_digits` | ⌘I opens the inbox (done, `main/menu.ts`); a numbered item at once: MISSING |
| K25 | ? on an empty composer | opens the help | composer empty | `keybar.rs:75` | ⌘/ listed, no handler (planned 3.5) |
| K26 | ctrl+\` / ctrl+space / ctrl+@ | shows or hides the terminal panel | anywhere | `term.rs:41` | n/a? the app has no terminal panel: MISSING if he wants a shell in the app (see views) |

## Keys: the composer's editing

| # | key | what it does | source | desktop |
|---|---|---|---|---|
| E1 | shift+⏎ / alt+⏎ / ctrl+j | new line | `input.rs:773`, `zen.rs:105` | shift+⏎: done (`composer/Brain.tsx:339`); alt+⏎ and ctrl+j: n/a (terminal stand-ins) |
| E2 | ←/→, option+←/→ (alt+b/f) | char / word left, right | `editor.rs:1028`, `editor.rs:1084` | done (native contenteditable in Lexical); planned ⛔1 |
| E3 | ctrl+option+←/→ | subword left / right (camelCase, snake_case, kebab-case, digits) | `editor.rs:1032` | MISSING (macOS has no subword move in text fields) |
| E4 | cmd+←/→, ctrl+a/e, home/end | line start / end (shift: select) | `editor.rs:1030`, `editor.rs:1060` | done (native) |
| E5 | ctrl+home/end, cmd+↑/↓ | text start / end (shift: select) | `editor.rs:1043` | done (native) |
| E6 | ↑/↓ | moves between rows, then through the history; ↓ past the newest brings the draft back | `editor.rs:1045`, `sb/drafts.rs` | done (`composer/Brain.tsx:387`, `:417`); planned 3.2 |
| E7 | option+backspace / ctrl+w | deletes the word before | `editor.rs:1053` | option+⌫: done (native); ctrl+w: n/a |
| E8 | option+delete (alt+d) | deletes the word after | `editor.rs:1057` | done (native) |
| E9 | ctrl+option+backspace / delete | deletes a subword before / after | `editor.rs:1052` | MISSING |
| E10 | cmd+backspace / ctrl+u | deletes to the line start | `editor.rs:1051` | done (native ⌘⌫) |
| E11 | ctrl+k | deletes to the line end | `editor.rs:1065` | done (native ctrl+k in macOS text) |
| E12 | ctrl+h / ctrl+d / ctrl+b / ctrl+f | delete back / forward, char left / right (emacs) | `editor.rs:1062` | done (native Cocoa bindings in Chromium) |
| E13 | ctrl+z / cmd+z / ctrl+/ | undo the last composer edit | `editor.rs:1072` | done (⌘Z, `composer/Composer.tsx` HistoryExtension); planned ⛔2 |
| E14 | ctrl+shift+z / ctrl+y / cmd+shift+z / alt+/ | redo | `editor.rs:1071`, `input.rs:686` | done (⌘⇧Z) |
| E15 | cmd+a | selects the whole composer text | `editor.rs:1102` | done (Edit menu, `main/menu.ts`) |
| E16 | ctrl+shift+c / cmd+c | copies the composer selection, else the feed's | `editor.rs:1067`, `editor.rs:1104` | done (`composer/Brain.tsx:436`, `main/clipfence.ts`) |
| E17 | ctrl+shift+x / cmd+x | cut | `editor.rs:1068` | done (`main/menu.ts` clip items) |
| E18 | ctrl+v / cmd+v (image only clipboard) | attaches the clipboard image as `[Image #N]` | `input.rs:769`, `attach.rs` | done (`composer/Brain.tsx:453`); planned 2.4 |
| E19 | tab / ⏎ in a popup | picks from the `/`, `@` or `$` popup; esc closes it (keeps the text for @ and $, clears it for /) | `input.rs:741`, `input.rs:701` | done (`composer/Brain.tsx:347`, `:366`); note: esc on the `/` popup keeps the text in the app |
| E20 | ↑/↓ in a popup | moves, skipping rows that pick nothing (provider headers) | `input.rs:837` | done (`composer/Brain.tsx:387`) |
| E21 | → / ← / backspace in the `@` popup | → browses into a folder, ← or backspace on `@dir/` goes one folder up | `input.rs:873` | MISSING (planned 2.2 covers files, not folder browsing) |
| E22 | `:name:` | typed, becomes its emoji (`:tada:` → 🎉) | `emoji.rs`, `emoji.tsv` | MISSING |
| E23 | option dead keys (⌥\` e, ⌥e e, ⌥i o, ⌥u u, ⌥n n) | è é ô ü ñ | `editor.rs:1092` `option_layer` | done (native IME); planned ⛔1 |
| E24 | option characters (⌥c ⌥q ⌥\\ ⌥⇧\\) | ç œ « », every U.S. option character | `editor.rs:1092` | done (native) |
| E25 | shift + any move | extends the selection | `editor.rs:1041` | done (native) |
| E26 | esc with a selection | drops it | `input.rs:709` | done (native) |

## Keys: the inbox

| # | key | what it does | source | desktop |
|---|---|---|---|---|
| I1 | ↑ / ↓ / ⏎ (empty composer) | chooses an option; ⏎ picks it; nothing chosen: ⏎ does nothing | `sb/cards.rs:1210`, `sb/cards.rs:1231` | done (`inbox/Inbox.tsx:155`); planned ⛔5 |
| I2 | 1 … 9 (empty composer) | picks that option at once; once you type, digits are text | `sb/cards.rs:1217` | done (`inbox/Inbox.tsx:173`) |
| I3 | ← / → / ctrl+n / ctrl+p | the previous / next item | `sb/cards.rs:1201`, `sb/cards.rs:1233` | differs: in the app ↑/↓ change items and ←/→ walk options (`settings/keys.ts:64`), the TUI's other way round; the bar doesn't say it's on purpose; ctrl+n/p: none |
| I4 | type, then ⏎ | your text answers it; on an approval: denies, your text as the note | `sb/cards.rs:1210` | answer: done (`inbox/Inbox.tsx:161`); the approval's deny-with-note: planned O.1 |
| I5 | ctrl+x | closes it without answering | `sb/cards.rs:1203` | key mapped (`inbox/Inbox.tsx:158`, ⌘⌫ too) but no close command yet: planned ⛔5 |
| I6 | esc | back to your thread; each item keeps its draft | `sb/cards.rs:1193` | back: done (`inbox/Inbox.tsx:157`); a draft per item: MISSING |
| I7 | pgup / pgdn / wheel | scrolls a long item | `sb/cards.rs:1221`, `sb/cards.rs:1248` | done (native scroll) |
| I8 | ctrl+o | opens or closes the item's folded parts | `sb/cards.rs:1195` | MISSING |
| I9 | y / n / esc | a confirmation: yes / no / not now | `sb/keys.rs:67` | MISSING (no confirmation item in the app) |

## Keys: the feed

| # | key | what it does | source | desktop |
|---|---|---|---|---|
| F1 | ctrl+o | opens or closes everything folded (thinking, outputs, diffs, reports, briefs) | `input.rs:682`, `input.rs:516` | MISSING: ⌘E listed (`settings/keys.ts:43`), no handler |
| F2 | space (empty composer, item selected) | opens or closes the selected folded item | `input.rs:693` | MISSING (click only: `thread/rows.tsx:70`) |
| F3 | ctrl+f / cmd+f | find in the history: ⏎ or ↑ older, shift+⏎ or ↓ newer, esc closes (the view stays on the match) | `find_bar.rs:235` | done (`thread/FindBar.tsx:76`, menu Edit · Find); planned 3.4 |
| F4 | pgup / pgdn / wheel | scrolls the feed (half a screen) | `input.rs:714` | done (native scroll) |
| F5 | end | back to the bottom | `input.rs:727` | MISSING (no key; does the list follow the tail: `thread/ThreadList.tsx`) |
| F6 | ctrl+l / `/clear` | clears the display | `input.rs:697` | n/a (bar: no `/clear`) |
| F7 | ctrl+y | copies a code block: the one under the mouse, else the newest on screen | `input.rs:690`, `codeblock.rs` | MISSING |
| F8 | ctrl+g / `/diff` | the diff panel of the agent in view; again closes it | `diffview.rs:1050` | ⌘D listed (`settings/keys.ts:41`), no handler; the review screen exists (`review/ReviewScreen.tsx`) |

## Keys inside a view, and voice

| # | view: key | what it does | source | desktop |
|---|---|---|---|---|
| V1 | agent palette: type, ↑↓ (ctrl+p/n, tab/shift+tab), ⏎, esc/ctrl+c, ctrl+w, ctrl+u, alt+⌫ | filters by name, moves, opens, closes, deletes a word / the line | `sb/palette.rs:178` | MISSING (⌘K not wired; the spotlight finds agents) |
| V2 | find bar: ⏎/↑ older, shift+⏎/↓ newer, esc, pgup/pgdn pass, ctrl+c pass | find in the history | `find_bar.rs:244` | done (`thread/FindBar.tsx:77`) |
| V3 | help overlay: type to filter, tab (help ↔ shortcuts), ↑↓ pgup pgdn home end, ⌫, esc (clears the filter, then closes), ctrl+c | the key list | `help.rs:225` | settings · keys is a static list: filter and the help page are MISSING (planned 3.5 for the list) |
| V4 | artifacts: ↑↓ (j/k), pgup/pgdn, home/end, ⏎ open, space Quick Look, v versions, r/o show in Finder, c copy, @ put it in a message, tab this agent ↔ all, / search, esc (versions, then search, then close), ctrl+c/ctrl+g | the artifacts screen | `artifacts_screen.rs:816` | planned 2.1 (`/artifacts`); the screen is "not yet" (`app/App.tsx:100`) |
| V5 | scheduled: ↑↓ (j/k), pgup/pgdn, home/end, ⏎ open, r run now, x stop (y / n or esc), tab ended too, / search, esc, ctrl+c/ctrl+g | the scheduled tasks screen | `scheduled_screen.rs:490` | planned 2.1, O.3; no screen |
| V6 | diff panel: ctrl+g open/close, ↑↓ pgup pgdn home end, tab / shift+tab next / previous file, ⏎ opens the line in the editor or unfolds, esc closes; full screen also j k ] [ and f the file list (type to filter) | the diff | `diffview.rs:1050`, `diffview.rs:1143` | review screen by click (`review/ReviewScreen.tsx`); its keys: MISSING |
| V7 | diff panel: drag or shift+↑↓ over lines, then type | quotes those diff lines into the composer (`src/a.rs:12-14 · 3 lines`) | `diffquote.rs:156` | MISSING |
| V8 | approvals screen: ↑↓ (j/k), home/end, ⌫ asks then ⏎ removes a rule, shift+tab mode, esc, ctrl+c/ctrl+g | the mode, the checker, the saved rules | `approvals_screen.rs:39` | planned O.1 (approvals, auto mode); the rules list: MISSING |
| V9 | computer use: ↑↓ (j/k), ⏎ the step's action, x stops every driver, shift+tab mode, esc | the setup steps | `computer_use.rs:868` | settings · computer use by click (`settings/computer.tsx`); planned P.2 |
| V10 | voice settings: ↑↓ (j/k, tab), ←→ (h/l, space) change a value, ⏎, esc/q; the "turn on" ask: 1-3, ⏎, esc/q not now | dictation on/off, model, voice, language | `voicemode/settings.rs:447`, `:487` | settings · voice and fn by click; planned 2.6 |
| V11 | dictation: ctrl+r starts; while recording any key stops and keeps the text, esc/ctrl+c drop it; while transcribing ⏎ tab ctrl+r are eaten, typing goes on | voice into the composer | `voice.rs:141` | planned 2.6 (not built: `qa-type` composer/dictation waits) |
| V12 | voice mode: ctrl+r twice enters; space sends now; hold space keeps the floor or cuts in; m mutes; tab types instead; esc/ctrl+c leaves | talk with the agent in view | `voicemode/live.rs:369`, `:400`, `:434` | fn fn hands-free in the capsule: done (`capsule/machine.ts:88`), but it talks to bise, not to the agent in view; mute, type instead, cut in: MISSING |
| V13 | terminal panel: every key goes to the shell (ctrl+c too); shift+pgup/pgdn scroll; cmd+c / ctrl+shift+c copy | an embedded shell in the workspace | `term.rs:83`, `term.rs:540` | MISSING (no terminal panel) |
| V14 | ChatGPT sign-in again: c copies the link, esc cancels | an expired subscription sign-in waits for the browser | `resign.rs:77` | MISSING (see states: expired sign-in) |
| V15 | onboarding: ←→↑↓ theme, ⏎, esc skip, ↑↓ model, c copies the sign-in link, OpenRouter choice, paste a key, type to filter models, tab on a failure, ctrl+c | the first-run steps | `onboarding.rs:639`, `onboarding.rs:730` | onboarding by click (`setup/Onboarding.tsx:186`: ⏎ and esc); planned S.2, S.9 |
| V16 | provider setup: type to filter, ↑↓, ⏎, ⌫, digits in a provider's menu, ⏎ to remove, esc | add, change or remove a provider's key | `onboarding/provider.rs:381` | settings · accounts by click (`settings/accounts.tsx:73`); planned S.2 |
| V17 | roles (`/models`): ↑↓, ⏎ pick a role, then provider, model (type to filter), effort; esc back | which model does what | `onboarding/roles.rs:532` | settings · models by click; planned S.3; the effort per role: MISSING (no effort in `settings/pages.tsx`) |

## Mouse

| # | gesture | what it does | source | desktop |
|---|---|---|---|---|
| M1 | wheel over the feed | scrolls 3 rows; over a tall composer, scrolls its text | `input.rs:376` | done (native) |
| M2 | click the "back to the bottom" bar | returns to the tail | `input.rs:387` | MISSING (no such bar: check `thread/ThreadList.tsx`) |
| M3 | click a folded section (▸ thinking, output, diff, report) | opens or closes it | `input.rs:496` | done for tool rows (`thread/rows.tsx:70`) |
| M4 | click a link / a file path in the feed | opens it (a local file in your editor) | `input.rs:500`, `links.rs`, `file_links.rs` | links: done (`thread/Markdown.tsx:27`, http/mailto only); file paths: MISSING |
| M5 | drag in the feed; double / triple click | selects (word, row); the release copies it | `input.rs:471` | select: done (native); copy on release: n/a (⌘C) |
| M6 | select in the feed, then type | the selection goes in as a quote chip `❝ 1` with the strip "first words… main · 3 lines" | `quote.rs`, `input.rs:415` | planned 2.5 (not built) |
| M7 | click / drag / shift+click / double / triple in the composer | cursor, select, extend, word, all | `input.rs:397` | done (native) |
| M8 | click a code block's copy (on hover) | copies the block | `codeblock.rs` | MISSING |
| M9 | click an agent in the panel; click "▸ archived" | goes to it; shows or hides the archived | `sb/panel.rs:1043` | done (`app/Sidebar.tsx`, `agents/AgentsScreen.tsx`) |
| M10 | wheel over the panel | scrolls the agent list | `sb/panel.rs:1032` | done (native) |
| M11 | click an inbox row / an option | opens it / picks it | `sb/cards.rs:1253` | done (`inbox/InboxCard.tsx`) |
| M12 | click `± 3 files` under a landed line, or an agent's ψ | the diff of what it landed, or of its branch | `diffview.rs`, `sb/panel.rs` | the review screen from the agents list (`agents/AgentsScreen.tsx:127`); from a landed line in the thread: MISSING |
| M13 | click ↗ on an artifact chip | opens it (a page in the browser, a .md in the editor, a file in its app) | `artifacts.rs` | MISSING (no artifact chips in the thread) |
| M14 | hover a turn | shows the time of the turn under the mouse | `input.rs:304` | MISSING |
| M15 | pointer shape (hand on clickables, text cursor, resize) | OSC 22 in Ghostty/kitty | `pointer.rs` | done (CSS cursors) |
| M16 | drag the terminal panel's top border | resizes it | `term.rs` | MISSING (no terminal panel) |
| M17 | find bar: click chevrons, ×, its field, drag | find controls | `find_bar.rs:311` | done (`thread/FindBar.tsx`) |
| M18 | the first-run text's "show me what you can do" | fills the composer (selected), does not send | `input.rs:427` | MISSING |
| M19 | click the composer's scroll hints | a screenful that way | `input.rs:396` | n/a (native scroll) |
| M20 | shift+drag | the terminal's own selection | `help.rs` | n/a |

## Views, panels, overlays and pickers

How I made sure: every module of `rust/tui/src` (115 non-test `.rs` files) read by its header,
and every screen the key dispatch in `input.rs:590` hands keys to (help, approvals, log,
artifacts, scheduled, computer use, terminal, diff, voice mode, palette, find, popups, cards).

| # | view | what it shows | how you reach it | source | desktop |
|---|---|---|---|---|---|
| W1 | the feed (one per agent) | the agent's thread: your messages, answers in markdown, thinking, tool rows, notices; a bounded window paged back from the transcript | always | `sb/feed.rs`, `feed.rs`, `render.rs` | done (`thread/ThreadScreen.tsx`, `thread/rows.tsx`); planned ⛔4 |
| W2 | the frame's top edge | `bise :*`, where you are (`~/lab/acme`, the agent's role line), the counts, what came new in /artifacts and who made it (`↗ designer · features updated`) | always | `chrome.rs`, `topedge.rs` | head: title and status line (`thread/ThreadScreen.tsx:94`); counts and the new-artifact line: MISSING |
| W3 | the divider | `you → main · model · effort · approvals mode … state` (working · 1m, idle · 42k, the context gauge) | always | `chrome.rs:3`, `usage.rs` | `you → <name>` in the composer (done); model, effort, approvals mode, context use and turn time: MISSING |
| W4 | the agents panel (right) | main, then the agents numbered for ⌥1-9, a status glyph each, what it does, its turn time, waiting on whom; archived ones under "▸ archived" | always (wide enough) | `sb/panel.rs` | the sidebar (`app/Sidebar.tsx`: agents with a dot) and the agents screen (`agents/AgentsScreen.tsx`); planned A.2; the numbers and "waiting on X": MISSING |
| W5 | worktree sections in the panel | a worktree 2+ agents share is a section (git in its title); an agent alone in one carries its mark | always | `sb/places.rs` | the `environments/<p>` route draws "not yet" (`app/route.ts:15`); MISSING (no bar row) |
| W6 | preview of an agent | its feed in place without entering it (space) | panel selection | `sb.rs:1280` `draw_sb` | MISSING |
| W7 | the inbox strip and box | its own box above the divider, a row per item numbered for ctrl+1-9; an item open in place; full screen with ctrl+o; the last answer folded on top | an item waits; `/inbox`, ctrl+N, click | `sb/card_draw.rs`, `sb/cards.rs` | the inbox screen (`inbox/Inbox.tsx`, ⌘I) and capsule cards (`capsule/machine.ts`); planned ⛔5; the strip in the thread itself: MISSING |
| W8 | the composer pane | the editor with live markdown and syntax colors, chips (images, pastes, quotes), the queue above it | always | `ui.rs`, `editor.rs`, `mdlive.rs`, `syntax.rs` | done (`composer/Composer.tsx`); live markdown and code coloring: MISSING |
| W9 | the key bar | the keys of the current mode (rest: `@ file  $ skills  / commands`; selection: `type to ask about it`; voice; terminal…), a tip every 5 minutes on the right | always | `keybar.rs` | a fixed keys line in the composer (`composer/Composer.tsx:61`); per-mode keys and tips: MISSING |
| W10 | the `/` popup | commands, then argument values (agents, archived, cards, models with provider headers, efforts, branches, versions, plugins) | type `/` | `commands.rs:174` | planned 2.1 (popup built, no commands wired) |
| W11 | the `@` popup | agents first (routes the message), then files and folders ranked (file name before path), artifacts by `@` token | type `@` | `sb/mention.rs`, `files.rs`, `commands.rs` | agents: done; files: planned 2.2 (no file source wired: `composer/useSources.ts:3`); artifacts: MISSING |
| W12 | the `$` popup | skills from the folders the agents read | type `$` | `skills.rs` | planned 2.3 (no skill source wired) |
| W13 | the emoji popup | `:cl` lists matching emoji | type `:` + 2 letters | `emoji.rs` | MISSING |
| W14 | the agent palette | find an agent by name, archived too | ⌘K, ctrl+s, `/switch` | `sb/palette.rs` | MISSING (planned 2.1 for `/switch`; the spotlight lists agents) |
| W15 | the find bar | top-right box, match count, chevrons, × | ctrl+f / cmd+f | `find_bar.rs`, `find.rs` | done (`thread/FindBar.tsx`) |
| W16 | help overlay | the commands and the essential keys | `/help`, `?` | `help.rs:215` | settings · keys (`settings/keys.ts`); planned 3.5 |
| W17 | shortcuts overlay | every key, filterable, with the Ghostty tips and the accents table | `/shortcuts`, `/keys`, tab in help | `help.rs:455` | settings · keys (no filter, no accents table); planned 3.5 |
| W18 | artifacts screen | what agents made, newest first, by day; new marks; versions box; quick look; scope this agent / all | `/artifacts`, the top edge's `↗ N new` | `artifacts_screen.rs`, `artifacts.rs` | planned 2.1; "not yet" |
| W19 | scheduled screen | every `sb every` timer: who it wakes, who set it, how often, next run, its runs; ended ones (7 days) with tab | `/scheduled` | `scheduled_screen.rs`, `scheduled.rs` | planned 2.1, O.3; no screen |
| W20 | diff panel | an agent's or any branch's changes vs main: files, +/−, hunks, big files folded, lock files folded, images as a row; right side or full screen | ctrl+g, `/diff`, click `± 3 files` or ψ | `diffview.rs`, `diffbranches.rs` | the review screen (`review/ReviewScreen.tsx`) and changes screen (`review/ChangesScreen.tsx`); planned A.6; any branch and the branch picker: MISSING |
| W21 | approvals screen | the mode, the checker, the saved rules of this repo; remove a rule | `/approvals` | `approvals_screen.rs` | planned O.1 (the card part); the rules screen: MISSING |
| W22 | computer-use screen | its setup steps, polled live; the drivers running; stop all | `/computer-use` | `computer_use.rs` | settings · computer use (`settings/computer.tsx`); planned P.2 |
| W23 | voice settings | dictation on/off, model, voice, language; "who hears you" on first voice mode | `/voice` | `voicemode/settings.rs` | settings · voice and fn (`settings/pages.tsx:23`); planned 2.6 |
| W24 | voice mode pane | replaces the composer: the big talking kiss, who talks, what was heard, mute | ctrl+r twice | `voicemode/pane.rs`, `voicemode/kiss.rs` | the capsule and pearl in hands-free (`capsule/`, `pearl/`); to the agent in view: MISSING |
| W25 | terminal panel | a real shell (PTY, `$SHELL` in the workspace) at the bottom, kept running while hidden, resizable | ctrl+\` | `term.rs` | MISSING |
| W26 | `/log` viewer | the raw session of the agent in view: full history or what the model sees | `/log` (dev) | `logview.rs` | n/a (dev only) |
| W27 | onboarding | welcome, theme, model and sign-in (ChatGPT, OpenRouter, a pasted key), key check, failures with what to do | first launch, `/welcome` | `onboarding.rs`, `onboarding/signin.rs`, `keycheck.rs` | `setup/Onboarding.tsx`; planned S.2, S.9 |
| W28 | provider setup | providers, their key state, add / change / remove, sign in | `/provider` | `onboarding/provider.rs` | settings · accounts (`settings/accounts.tsx`); planned S.2 |
| W29 | roles picker | main, agents, small jobs, voice: provider, model, effort each | `/models` | `onboarding/roles.rs` | settings · models; planned S.3 |
| W30 | the setup item | a quiet inbox item: "can i set bise up for your terminal and this repo?", its checks and offers | first run, `/setup` | `sb/setup.rs`, `sb/tune.rs` | settings · setup (`settings/check.tsx`); planned S.8 |
| W31 | `/version` picker | the hub's versions, filtered as you type | `/version ` | `sb/versions.rs` | n/a (dev tool) |
| W32 | the release rows | `/release-bise`'s plan, steps and result in main's feed; `∿ releasing v… · 12m` in the header | `/release-bise` | `release_row.rs` | n/a (dev build) |
| W33 | the terminal tab title | `#2 ↗1 ●3 · harness`: inbox items, new artifacts, agents at work, the project | always | `termtitle.rs` | MISSING: no window title count or dock badge; the tray icon has only a tooltip (`main/tray.ts:28`) |
| W34 | `bise keyprobe` | prints the key and mouse events the terminal delivers and the action each maps to | shell command | `keyprobe.rs` | n/a (terminal diagnosis) |

## States the TUI shows

How I made sure: the feed's event kinds (`wire.rs` `enum Ev`, 33 variants), the panel's status
glyphs (`sb/panel.rs:14`, 9 statuses), the divider and the key bar's modes. Desktop: the thread's
entry kinds (`rust/proto/src/thread.rs`: you, agent, tools, from_agent, report, card, page,
stopped) and the agent dot (`agents/model.ts`).

| # | state | what the TUI shows | source | desktop |
|---|---|---|---|---|
| S1 | working | the gust animation in the panel, `working · 1m` on the divider, the turn time | `gust.rs`, `sb/panel.rs:14`, `chrome.rs` | a dot and status line (`agents/model.ts` `dotOf`, `thread/ThreadScreen.tsx:95`); planned ⛔3 (the working state); the turn time: MISSING |
| S2 | starting | its own frame while an agent starts | `sb/panel.rs:15` | MISSING (`agents/model.ts:53` has no starting status) |
| S3 | waiting (on another agent) | `⋯` and "waiting on docs" | `sb/panel.rs:16`, `sb.rs:902` | MISSING: the reason (who it waits on) |
| S4 | blocked / needs you | the needs-you glyph; the inbox item | `sb/panel.rs:19` | dot (`agents/model.ts`), inbox |
| S5 | done / failed / idle / stopped / archived | their glyphs and colors | `sb/panel.rs:20` | dots: done (`agents/model.ts`) |
| S6 | a routing hold | (TUI: none shown; the hub routes main's words) | `rust/switchboard/src/daemon/routing.rs` | done in the app: `thread/routes.ts`, `thread.route` row with keep / change (qa-flows `thread/route-hold`) |
| S7 | sending / your message | your row at once, marked when the hub has it (`MarkYou`) | `wire.rs` `MarkYou`, `quiet_send_tests.rs` | done (pending rows, `thread/ThreadScreen.tsx:126`); planned ⛔3 |
| S8 | thinking | `thought for Ns`, folded; click or ctrl+o opens | `wire.rs` `Thinking`, `render.rs` | MISSING (no thinking row) |
| S9 | tool calls | one row per bash/TS call with its description and state (`∿ 12s`, `✓ 0.3s`, `✗ exit 1`), the first error line; the code box when open; sub-calls | `toolrow.rs`, `toolbox.rs`, `code.rs` | tools row, counted, opens to its steps' text (`thread/rows.tsx:68`); each call's state and time, the error line, the code box and its output: MISSING |
| S10 | the approvals gate of a running call | `sb gate : check|card|done`: checking, an approval card, the result | `wire.rs` `Gate`, `approvals.md` | planned O.1 |
| S11 | an approval answered | allowed or not, the sentence, your words, what it asked; opens whole | `wire.rs` `Approval` | planned O.1 |
| S12 | compaction | `≡ compacting`, then the summary folded behind ▸ | `wire.rs` `Compact`, `Compacted` | MISSING |
| S13 | usage and context | the context gauge on the divider (`18k · 2%`, `210k / 1M tokens`), prices | `usage.rs`, `models.rs`, `chrome.rs` | MISSING |
| S14 | interrupted / failed: why | `interrupted`, `failed: …`, `interrupted by …` | `wire.rs:560` | `stopping {agent}…` marker and a stopped entry (`thread/ThreadScreen.tsx:107`); a failed turn and its reason: MISSING (no entry kind for it) |
| S15 | not delivered | `✗ not delivered: {name} stopped. ⏎ send again · esc drop` | `wire.rs` `Undelivered`, `sb/keys.rs:85` | MISSING |
| S16 | an agent's message to another | levels: shown, folded, `▸ 4 messages between 2 agents` | `wire.rs` `AgentMsg` | from_agent rows (`thread/entry.ts:27`); the levels and the folded runs (`▸ 4 messages between 2 agents`): MISSING (`Fold` is only used for the typing line, `thread/rows.tsx:215`) |
| S17 | answered for you by main | `:* docs asked: v1 or v2? · i answered: v2 ▸`, opens to the why | `answered.rs` | MISSING |
| S18 | a report | `sb report` lines (done, blocked, progress) | `render.rs` | done (`thread/rows.tsx:55`) |
| S19 | a card in the feed / closed | the question, then how it closed | `wire.rs` `Card`, `CardClosed` | card rows (`thread/rows.tsx:92`) |
| S20 | landed | `± 3 files +42 −18  a1b2c3d`, click opens the diff | `wire.rs` `Landed` | MISSING in the thread (merged list in the changes screen) |
| S21 | PR news | `↑ #412 changes asked · dark-mode is on it`, the number links | `wire.rs` `Pr` | planned A.7 (the list); the feed line: MISSING |
| S22 | an artifact made | `↗ pricing page  page · v3`, a chip that opens it | `wire.rs` `Made` | page rows (`thread/rows.tsx:42`) for pages; other artifacts: MISSING |
| S23 | scheduled lines | `◷` a timer set, ran, ended | `wire.rs` `Scheduled`, `scheduled.rs` | MISSING (planned O.3 for stop from the app) |
| S24 | time marks | a time between turns far apart | `wire.rs` `TimeMark` | clock per row (`thread/entry.ts:16`) |
| S25 | warnings, errors, info lines | `Warn`, `Err`, `Info` (e.g. "the inbox is empty") | `wire.rs` | MISSING: no line kind for a client notice |
| S26 | hub disconnected · reconnecting… | in the panel's status; the feed reloads on reconnect | `sb/panel.rs:1208`, `sb.rs:591`, `sb/client.rs:51` | done: `app/CoreLine.tsx` (the core); a project's hub down: the sidebar dot (`app/Sidebar.tsx`); planned S.5 |
| S27 | the client follows the hub to another version | re-exec on a version switch | `sb/client.rs` | planned S.6 (updates) |
| S28 | expired ChatGPT sign-in | the agents it stopped wait; `⏎ sign in again` in the key bar; `c` copies the link, esc cancels | `resign.rs` | MISSING |
| S29 | computer use live marks | an agent driving Chrome or an app; `? you took the wheel · ⏎ give it back`; stopped until you write | `computer_use.rs`, `sb/keys.rs:60` | MISSING (planned P.2 is setup and off only) |
| S30 | a hub confirmation | `y/n` question in the feed (e.g. archive a working agent) | `sb.rs:1099` | MISSING |
| S31 | the drop question | `archive {name}? y / n` | `sb/keys.rs:63` | n/a (the app archives on click, force when working) |
| S32 | an archived agent's feed | read-only; a line refused with "history only" | `sb.rs:1263` | MISSING (composer still sends) |
| S33 | no-vision refusal | images to a model that reads none: the line, message kept | `attach.rs` | MISSING |
| S34 | the queue | queued messages above the composer, sent when the turn ends | `queue.rs` | done (`composer/Brain.tsx:552`); planned 3.1 |
| S35 | zen while you type | the chrome fades 45 % while you type, back 5 s after | `zen.rs` | n/a (a terminal look) |
| S36 | one-time hints | the first agent, the first card, etc., once per user | `hints.rs` | MISSING |
| S37 | the demo's guided tips | a tip per step while the built-in demo runs | `tour.rs` | MISSING |
| S38 | releasing | `∿ releasing v… · 12m` | `release_row.rs` | n/a (dev build) |
| S39 | the approvals mode | yolo or auto, on the divider after the model | `chrome.rs`, `sb.rs` `toggle_approvals` | planned O.1; not shown |
| S40 | model and effort in view | on the divider | `chrome.rs` | MISSING |
| S41 | crash | the terminal is restored, the panic is written to a log, the path said | `crash.rs` | planned O.4 |

## Settings and notifications

| # | item | what it does | source | desktop |
|---|---|---|---|---|
| N1 | theme auto / light / dark | from the terminal's background, or `/theme`; kept across launches | `theme_detect.rs`, `theme.rs`, `sb.rs:529` | settings · general · theme (`settings/pages.tsx:75`; auto follows macOS) |
| N2 | NO_COLOR | every color cue has a plain-text stand-in (brackets, bold) | `mdlive.rs:430`, `quote.rs:280`, `diffquote.rs:255` | n/a? the app has no plain mode; the system's increase-contrast setting: MISSING (not in the bar) |
| N3 | model per role, effort, default | `config.toml [roles]` through `/models`, `/model … default` | `onboarding/roles.rs`, `router.rs:270` | settings · models; planned S.3, A.5 |
| N4 | provider keys and sign-ins | ChatGPT plan, OpenRouter login, pasted keys, detected logins | `onboarding/signin.rs`, `onboarding/provider.rs` | settings · accounts; planned S.2 |
| N5 | voice settings | `[voice]`: dictation, model, voice, language, echo cancel | `voicemode/config.rs`, `voicemode/settings.rs` | settings · voice and fn; planned 2.6 |
| N6 | approvals mode and rules | yolo / auto, saved rules per repo | `approvals_screen.rs` | planned O.1 |
| N7 | plugins on/off, logins | `/plugins` | `plugins.rs` | settings · plugins; planned P.1 |
| N8 | computer use on/off/uninstall | `/computer-use` | `computer_use.rs` | settings · computer use; planned P.2 |
| N9 | env switches | `BISE_POINTER`, `BISE_DEV`, `BISE_VOICE_DEBUG`, `SB_TIMING` | `pointer.rs`, `logview.rs`, `voicemode/debug.rs`, `timing.rs` | n/a (terminal and dev) |
| N10 | the terminal tab title as a notification | `#2 ↗1 ●3 · harness` | `termtitle.rs` | MISSING: a dock badge or tray count (the tray's count comes with the pearl: `main/tray.ts:5`) |
| N11 | new things while scrolled up | `unseen` count on the back-to-bottom bar | `input.rs:727`, `app.rs` | MISSING |
| N12 | an item that needs you | the inbox box shows, the divider's label, the panel's glyph | `sb/card_draw.rs` | the capsule shows a card from rest (`capsule/machine.ts`), the inbox; done |
| N13 | voice answers said aloud | in voice mode the answer is spoken, sentence by sentence | `voicemode/speak.rs` | the capsule's spoken answer (`rust/tui/src/ambient/speech.rs`); done for bise; for an agent in view: MISSING |
| N14 | voice answers to inbox items | `heard "the first one" → 1` | `voicemode/answers.rs` | MISSING |

## Flows

| # | flow | what the user goes through in the TUI | source | desktop |
|---|---|---|---|---|
| L1 | first launch | welcome, theme (from the background), model and sign-in, the key check, the setup item in the inbox, the first-run text with "show me what you can do" | `onboarding.rs`, `keycheck.rs`, `sb/setup.rs` | `setup/Onboarding.tsx`; planned S.1–S.9; "show me what you can do": MISSING |
| L2 | sign in with ChatGPT (plan) | browser sign-in, `c` copies the link, the hourly expiry and "sign in again" | `onboarding/signin.rs`, `resign.rs` | sign-in (`settings/accounts.tsx`, sign_in); planned S.2; the expiry flow: MISSING |
| L3 | sign in with OpenRouter | browser login mints a key | `onboarding/signin.rs` | planned S.2 (check: OpenRouter is named in S.2) |
| L4 | a pasted key | paste, check with one tiny real call, say what is wrong (wrong key, no credit, unknown model) before saving | `keycheck.rs`, `onboarding.rs:806` | settings · accounts (key_set); planned S.2 ("a wrong key says so") |
| L5 | a model whose provider has no key | `/model x` opens that provider's setup, then runs the line | `sb.rs:1250` | MISSING |
| L6 | start an agent | `/new [-w] [name:] objective`; it shows in the panel with a number | `router.rs:184` | planned A.1 (the button is disabled) |
| L7 | write to one agent | from its view (⌥N, click, palette), or `@name …` from main | `sb.rs:510` | done from its view (`thread/ThreadScreen.tsx:153`); `@name` routing: planned 3.3 |
| L8 | answer an item | inbox: arrows, digits, typed answer; `/answer N`; voice | `sb/cards.rs`, `voicemode/answers.rs` | done (`inbox/`, capsule cards); planned ⛔5; by voice: MISSING |
| L9 | approvals | a gate card on a risky call; approve, deny with a note; yolo / auto; saved rules | `approvals_screen.rs`, `wire.rs` `Gate` | planned O.1 |
| L10 | stop, archive, restore, isolate, rename | the commands and panel keys | `router.rs` | archive, restore, stop by click: done (`agents/AgentsScreen.tsx`); isolate, rename: planned A.5 |
| L11 | review what an agent changed | `± files` under a landed line, ψ in the panel, ctrl+g, `/diff <branch>`; quote diff lines to ask about them | `diffview.rs`, `diffquote.rs` | review and changes screens (`review/`), merge button (`review/ReviewScreen.tsx:47`); planned A.6; quote from a diff: MISSING |
| L12 | features (feature branches) | a worktree section in the panel marked as a feature, its try build state (`ψ`) | `sb/places.rs:27`, `sb/places.rs:184` | planned A.6 |
| L13 | PRs | `/prs`, PR news lines in main's feed | `router.rs:268`, `wire.rs` `Pr` | planned A.7 |
| L14 | dev flow | `/flow pr|trunk` | `router.rs:286` | MISSING |
| L15 | artifacts and pages | a chip in the feed, `↗ N new` in the top edge, `/artifacts`, open in the browser or editor, versions, `@` to put one in a message, `/artifacts add` | `artifacts.rs`, `artifacts_screen.rs`, `topedge.rs` | page rows and the pages flow (`thread/rows.tsx:42`, planned O.2); the rest: planned 2.1 (`/artifacts`) / MISSING (`add`, `@` artifact) |
| L16 | scheduled tasks | `◷` lines, `/scheduled`, run now, stop | `scheduled_screen.rs` | planned O.3 |
| L17 | history search | `sb history` is the agents' tool; the TUI pages a long feed back from the transcript | `sb/feed.rs` | done: older pages (`thread/ThreadScreen.tsx:135`); planned O.3 |
| L18 | plugins | `/plugins list/enable/disable/login/logout` | `plugins.rs` | settings · plugins; planned P.1 |
| L19 | computer use | `/computer-use`: turn on, the setup steps polled live, permissions; `/stop` an agent's hands; "you took the wheel" | `computer_use.rs` | settings · computer use; planned P.2; the live hand-back: MISSING |
| L20 | dictation | ctrl+r, speak, the words at the cursor, editable | `voice.rs` | planned 2.6 |
| L21 | voice mode with the agent in view | ctrl+r twice: talk, the answer is said, mute, type instead, answer items by voice | `voicemode/` | fn fn talks to bise (capsule): done for bise; with one agent: MISSING |
| L22 | update | the new-release item, `/update` | `sb.rs:1167` | planned S.6 |
| L23 | restart / version switch | `/restart`, `/version`, the client re-execs and keeps the drafts | `sb/client.rs`, `sb/drafts.rs:11` | planned S.5 (restart); version: n/a |
| L24 | release bise | `/release-bise` y/n | `sb/release.rs` | n/a (dev build) |
| L25 | the built-in demo | guided tips per step | `tour.rs` | MISSING |
| L26 | setup tune | the setup item's checks and offers for the terminal and the repo | `sb/tune.rs` | settings · setup (`settings/check.tsx`); planned S.8 |
| L27 | quit | `/quit` or ctrl+c twice: the agents keep running | `sb.rs:1160` | ⌘Q: done |

## Small behaviors

| # | behavior | what it does | source | desktop |
|---|---|---|---|---|
| B1 | drafts per agent | one draft per agent view, kept on disk (debounced, at send, at quit and re-exec), across restarts | `sb/drafts.rs` | done (`composer/drafts.ts`, renderer storage); planned 3.2 |
| B2 | history recall | the newest 50 sent prompts, ↑/↓; a recall is one undo step | `sb/drafts.rs:38`, `undo.rs` | done (`composer/drafts.ts:54`, 50 kept) |
| B3 | draft per inbox item | each item keeps its own typed answer | `sb/cards.rs` | MISSING |
| B4 | long paste chip | ≥ N lines or chars: `▤ 1` chip, the strip lists it (`240 lines · 9.8 kB`), first undo inlines it, backspace removes it | `pasted.rs` | done (`composer/Brain.tsx:247`); planned 2.7 |
| B5 | paste of image paths | a paste that is only image paths (a dragged file) attaches the images | `input.rs:523`, `attach.rs` | drop of image files: done (`composer/Brain.tsx:471`) |
| B6 | images | `[Image #N]` chips, attachments kept with the draft, the no-vision check | `attach.rs`, `docs/images.md` | chips with thumbnails: done (`composer/Brain.tsx:242`); no-vision: MISSING |
| B7 | quotes | a selection in the feed or a diff becomes a `❝ 1` chip with its source | `quote.rs`, `diffquote.rs` | planned 2.5 (feed); diff: MISSING |
| B8 | `@` file ranking memory | a picked path ranks first next time | `commands.rs` `PopItem.path` | MISSING (planned 2.2 has the ranking, not the memory) |
| B9 | live markdown in the composer | lists continue on ⏎, code lines keep indentation, ``` blocks colored as you type | `mdlive.rs`, `syntax.rs` | MISSING |
| B10 | undo grouping | per word, a run of backspaces, a run of voice deltas, a history recall | `undo.rs` | done: Lexical's history (`composer/Composer.tsx`, HistoryExtension) groups by time, not by word; a long paste is two steps (`composer/Brain.tsx:247`) |
| B11 | a long message of yours folds | opens whole on click | `wire.rs` `You(_, _, open)` | MISSING (your message is shown whole, `thread/rows.tsx:57`) |
| B12 | scroll anchor and follow | the view stays put while new rows come in when scrolled up; follows the tail otherwise; End returns | `feed.rs`, `input.rs:727` | `thread/ThreadList.tsx` (own sends scroll to the end: `thread/ThreadScreen.tsx:141`); back-to-bottom: MISSING |
| B13 | copy | pbcopy locally, else OSC 52; a feed selection copies on release; code blocks copy without borders and line numbers | `clipboard.rs`, `feedsel.rs` | ⌘C native (`main/clipfence.ts`); code-block copy: MISSING |
| B14 | links | OSC 8 links, a plain click opens; file paths are links that open in the editor | `links.rs`, `file_links.rs` | http/mailto links: done (`thread/Markdown.tsx`); file paths: MISSING |
| B15 | code blocks | a rounded box with the language, wrapped, highlighted | `codeblock.rs`, `syntax.rs` | code keeps its shape (`thread/Markdown.tsx`, planned ⛔4); the language label and syntax highlighting: MISSING |
| B16 | resize and widths | the reading column centers from 95 cols, grows from 160; the panel narrows (name cut, ψ kept) then drops; the diff takes the screen when narrow; the key bar moves to its own row | `layout.rs:14`, `sb/panel.rs:1560`, `diffview.rs` | not checked: the window resizes (CSS); how a narrow window lays out the sidebar, thread and review was not looked at, and no bar row says it |
| B17 | text sanitizing | tabs, CR, ESC and wide graphemes laid out safely | `sanitize.rs` | n/a (the DOM) |
| B18 | the pointer shape | hand, text, resize | `pointer.rs` | done (CSS) |
| B19 | hold-modifier hints and hidden words | words left out at rest come back while ctrl is held | `ctrlhint.rs` | n/a (menus show keys) |
| B20 | a send never lost | the sent draft leaves the file only once sent; not delivered shows ⏎ to send again | `sb/drafts.rs`, `sb/keys.rs:85` | pending rows (`thread/ThreadScreen.tsx:126`); not-delivered retry: MISSING; planned ⛔3 (offline keeps the draft) |
| B21 | `/` popup clears on esc | esc on the slash popup clears the draft (the `@` and `$` popups keep the text) | `input.rs:701` | differs: the app keeps the text (`composer/Brain.tsx:366`); not said to be on purpose |
| B22 | `@agent` in the middle of a line | a mention the model reads, not a route | `sb/mention.rs` | done: sent as text, the hub treats it the same (`router.rs:166` routes only a leading `@`) |
| B23 | animation clock | every animation reads time, not frames (no speed-up under load) | `anim.rs` | n/a |
| B24 | crash safety | the terminal restored, the panic logged | `crash.rs` | planned O.4 |
