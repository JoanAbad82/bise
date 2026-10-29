---
title: main and the agents
description: you talk to main. main starts one agent per task, the agents work in parallel, and what needs you waits in your inbox.
---

## how it works

1. you tell **main** what you want, in your own words. main is your team lead.
2. main turns it into tasks and starts one **agent** per task. each agent has a brief: the goal, the context, what not to do, and when it's done.
3. the agents work in parallel. they message each other and main when their work touches.
4. when an agent needs a decision only you can make, it lands in your **inbox**. the rest never interrupts you.
5. when a task is done, its agent lands the work in your repo (see [landing work](flow)) and reports to main.

you keep typing the whole time. the composer is never locked: `⏎` while main works steers its turn, and `tab` queues your message for after it.

## where main lives

::: desktop one window, every project
bise desktop shows every project in one window. each project has its own main, and **bise**, at the top of the sidebar, sits above them: it sees all your projects and passes the work to the right main. see [the desktop window](window).
:::

::: terminal one window per repo
bise terminal runs in one repo: `bise` in a folder opens that folder's main and its agents. another repo, another terminal window.
:::

## the screen

::: desktop the sidebar, the thread, the right bar
- **the sidebar** on the left: bise, the inbox, and your projects, each with its mark: `∿` at work, `?` it asks you, `·` quiet.
- **the thread** in the middle: the agent you're looking at, main by default.
- **the right bar**: the project's agents and their state, the archived ones, the artifacts and the timers. the cube on top shows the [bims](window#the-bims) in their office.
:::

::: terminal the feed, the panel, the divider
- **the feed**: the thread of the agent you're looking at, main by default.
- **the panel** on the right: every agent, a number, and its state. `∿` working, `?` needs you, `✓` done, `○` idle.
- **the divider** above the composer: who you talk to, its model, its effort and the approvals mode, for example `you → main · opus 5.5 · high · yolo`.
- **the inbox**, above the divider when something waits: approvals first, then questions, then merges.
:::

## talk to an agent

::: desktop ⌥1 … ⌥9, a click, ⌘K
- click an agent in the right bar, or a bim in the office.
- `⌥1` … `⌥9` opens the project's agent with that number; `⌥0` its main. `⌘1` … `⌘9` opens a project, `⌘0` bise.
- `⌘K` finds an agent, a page or an artifact by name.
- `⌥↑` / `⌥↓`, with the composer empty: the previous / next agent.
- `@agent …` in the composer sends that agent a message without leaving the thread you're in.
:::

::: terminal ⌥ + a number, @agent, ctrl+s
- `⌥` + a number goes to that agent; `⌥0` back to main. `esc` also goes back to main.
- click an agent in the panel.
- `@agent …` from main's view sends it a message without leaving main. `@main …` from inside an agent.
- `ctrl+s` (or `cmd+k`, or `/switch`) finds an agent by name, archived ones too.
:::

in an agent's thread, what you type goes to that agent. main still sees it.

## the inbox

an inbox item is a question, an approval or a merge that waits for you.

::: desktop ⌘I, from every project
`⌘I` opens the inbox over the screen you're on: what your agents ask you, from every project, the most blocking first. when bise isn't in front, a macOS [notification](window#notifications) tells you; the menu bar's `:*` shows the count.

with an item open:

- `1` … `9` picks an option, or `←→` walks them, then `⏎`.
- type an answer and `⏎`.
- `↑↓` move to the previous or next item. `⌘⌫` closes it without answering. `esc` goes back.

your answer stays next to the thread it came from: an answered item shows what you said and where.
:::

::: terminal ctrl+1 … ctrl+9, /inbox
`ctrl+1` to `ctrl+9` opens the item with that number, or click it, or `/inbox`.

with an item open:

- `1`-`9` picks an option, or `↑↓` then `⏎`.
- type an answer and `⏎` (on an approval, typing means no, with your text as the note).
- `←→` moves to the other items. `ctrl+x` closes it without answering. `esc` goes back to your thread; the item keeps your draft.

`/answer N text` and `/close N [note]` do the same from the composer.
:::

## start, stop and archive

::: desktop ⌘., /agents, the same / commands
- ask main: it starts the agents. `/new` in the composer starts one yourself.
- `⌘.` stops the turn of the agent in view; `ctrl+c` in the composer too.
- `/agents` (or the project's `⋯` menu) opens the project's agents: stop one, or archive it. `/archived` lists the archived ones, each with restore.
- `/` in the composer lists the commands; most of bise terminal's work here too, and a command that has a screen in the window (`/models`, `/plugins`, `/artifacts`) opens it.
:::

::: terminal /new, /stop, /archive
| command | what it does |
|---|---|
| `/new [-w] [name:] objective` | start an agent yourself; `-w` gives it its own git worktree |
| `/agents` | list the agents and what they do |
| `/switch` | find an agent by name, archived ones too |
| `/interrupt` | stop the current turn of the agent in view |
| `/stop <agent>` | stop an agent's turn, and its hands on Chrome or an app, until you write to it |
| `/archive <agent>` | stop an agent and archive it, with its worktree |
| `/restore <agent>` | bring an archived agent back |
| `/archived` | show or hide the archived agents in the panel |
| `/isolate <agent>` | give an agent its own git worktree |
| `/rename <agent> <new-name>` | rename an agent |
| `/compact` | compact the conversation of the agent in view |
| `/pause` | pause the whole project: every turn stops, messages and timers wait |
| `/quit` | quit; the agents keep running |

every command and key is in [keys and commands](keys).
:::

## the agents keep running

::: desktop quit bise
quitting bise desktop (`⌘Q`, or **quit bise** in the menu bar) closes the window, not the work: the agents go on in the background, and open bise to come back.
:::

::: terminal /quit, bise switchboard --stop
quitting bise terminal (`/quit`, or `ctrl+c` at idle) closes the window, not the work: the agents go on in the background. run `bise` in the same folder to come back. to stop everything in a folder:

```sh
bise switchboard --stop               # stop this folder's bise and its agents
bise switchboard --stop --keep-agents # stop bise, the agents go on
```
:::

## past work

every agent's thread is kept, archived ones too. ask main about past work in your own words ("what did we do on the login last week?"): it searches every thread, from before any compaction too.

## worktrees

agents that touch the same files share your folder. main gives a bigger or riskier task its own git worktree, a separate checkout on its own branch, so it never steps on the others. in bise terminal, `ψ` in the panel marks an agent alone in its worktree. the worktree is removed when its work has landed and its last agent leaves.
