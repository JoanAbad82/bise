---
title: the desktop window
description: every project in one window. bise at the top, your projects under it, the agents and the bims on the right, and a menu bar icon that tells you when something waits.
app: desktop
other: the screen | agents
---

## the sidebar

from top to bottom:

- **search or jump** (`⌘K`): find an agent, a page or an artifact, and open it.
- **bise** (`⌘0`): your own agent. it sees every project: say what's on your mind and it passes the work to the right one, or tells you what happened while you were away.
- **inbox** (`⌘I`): what waits for you, from every project, with its count.
- **artifacts** and **scheduled**: what your agents made, and their timers, across every project.
- **your projects** (`⌘1` … `⌘9`, in the order of settings › projects). each has a mark: `∿` at work, `?` it asks you, `·` quiet. a click opens the project's main; its `⋯` menu lists its agents.
- **+ add a project** (`⌘N`) and **settings** (`⌘,`) at the foot.

`⌘\` hides the sidebar.

## projects and bise

a project is a folder, usually a git repo. each project has its own **main**, which starts the agents of that project, exactly as in [main and the agents](agents). **bise** sits above them all: you can talk to it instead of picking a project, and it coordinates the mains.

settings › projects lists them: rename, move up or down (that is the `⌘1` … `⌘9` order), or remove one from bise (its folder and its git history stay).

## the thread

the middle of the window is the thread of the agent you opened: its messages, what it ran, what it changed. you write in the composer at the bottom. `⌘[` and `⌘]` go back and forward, `⌘F` finds in the thread, `⌘E` folds or unfolds everything.

## the right bar

what happens in the project you're looking at, in four sections:

| section | what it shows |
|---|---|
| agents | the project's agents and their state; `⌥1` … `⌥9` open them, `⌥0` its main |
| archived | the agents that are done, folded until you open it |
| artifacts | what the agents made: pages, docs, files, links |
| scheduled & watching | the agents' timers, and what they wait for |

on bise's thread, the same sections cover every project. `⌥⌘0` shows or hides the right bar.

## the bims

each agent is a **bim**, a little character in its project's office. the cube at the top of the agents section shows the office above the list: you see who works, who waits, who asks you (a `?` over its head) and who failed (`✗`). hover a bim for its card; a click opens its thread. pinch to zoom, drag to move, **fit** goes back to the whole office. the office grows as the project's agents get work done.

## changes and artifacts

- `⌘D`: in an agent's thread, the changes it made; elsewhere, the project's changes.
- `⌘⇧A`: the project's artifacts. an open artifact has **save a copy…** (`⌘S`).

## the terminal panel

`` ctrl+` `` (View › Terminal) shows or hides a terminal panel in the window, a shell in the project's folder.

## the menu bar

bise's `:*` sits in the macOS menu bar. it moves while agents work and blows two kisses when something new waits for you. a click opens its menu: how many agents are at work and waiting, the inbox, your projects (a live one opens its agents), then **open bise**, **inbox**, **settings…** and **quit bise**.

## the spotlight

`fn space`, from any app, opens the spotlight: find an agent, or ask bise. see [voice and fn](voice).

## notifications

when an agent asks you something and bise isn't in front, a macOS notification tells you. turn them on in settings › general.

settings › quiet moments decides when they wait: during a call (Zoom, Meet, FaceTime), while you share your screen, in full screen, in focus mode. then they come together, one at a time, at most every few minutes; after you were away, one notification sums it up when you open your Mac again.
