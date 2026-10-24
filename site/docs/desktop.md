---
title: start with bise desktop
description: download bise desktop, drag it to Applications, and the first launch asks for a model, your projects, and what to do first.
app: desktop
other: one curl line | install
---

## download

bise desktop runs on Macs with Apple silicon, macOS 14 or later. download it from [bise.dev](https://bise.dev): it comes down as `bise-mac-arm64.dmg`, signed and notarized by Apple.

1. open it from your Downloads.
2. drag bise to Applications.
3. open bise from Applications. macOS asks once if you want to open an app from the internet: Open.

> note: keep bise in Applications. it updates itself only from there; opened from the disk image or your Downloads, it offers to move itself first. see [updates](updates).

on an Intel Mac or on Linux, use [bise terminal](install): the same agents, in your terminal.

## the first launch

four short steps. `⏎` takes the step's button, `esc` goes a step back, and **skip for now**, top right, leaves it for later.

1. **hello**: bise says what it is.
2. **the model**: a plan you already have, or a key. pick ChatGPT, OpenRouter, an API key or a coding plan key; a key bise finds in your shell or a `.env` file is offered first. bise checks it with one tiny call and shows what the model said. you add more later in settings › models. see [providers and keys](providers) and [subscriptions](subscriptions).
3. **your projects**: the repos bise found in your folder, with how recently each changed. tick the ones it should work in, or **choose a folder…**. each project gets its own main. you add more later with `⌘N` or settings › projects.
4. **what should i do first?**: write your first message to bise, or pick one of the ideas. `⏎` sends it and opens bise with it running. **open bise** leaves without asking.

## permissions for fn

holding `fn` talks to bise from any app (see [voice and fn](voice)). the first time you hold it, bise asks for three macOS permissions:

| permission | what for | without it |
|---|---|---|
| Microphone | to hear you while you hold `fn` | `fn` can't hear you: you type in the spotlight instead |
| Accessibility | `fn` everywhere, and to read the app in front (URL, file, selection) | `fn` works only in bise's own windows |
| Screen Recording | the capture `fn` adds to your question | `fn` sends your words without a capture |

**not now** keeps them off: your words still go to bise, typed in the spotlight (`fn space`). settings › setup shows each one and asks again.

## what you see

- **bise**, at the top of the sidebar (`⌘0`): your own agent. it sees every project and passes the work to the right one.
- **your projects** under it (`⌘1` … `⌘9`): each has its main, and the agents main starts.
- the **inbox** (`⌘I`): what your agents ask you, from every project.

the [desktop window](window) page walks through each part. [main and the agents](agents) says how the work runs.

## the terminal too

bise desktop and [bise terminal](install) run the same agents: the same projects, threads, keys and settings. you can open bise terminal in a project's folder while the window is open; both show the same threads.
