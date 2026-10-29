---
title: bise docs
description: bise runs a team of AI agents for you. you talk to one agent, main, and it runs the others. two apps, the same agents.
---

you talk to **main**, your team lead. main turns what you ask into tasks and starts one **agent** per task. the agents work in parallel, talk to each other, and land their work in your repo. what needs you waits in your **inbox**.

## two apps, one bise

| | bise desktop | bise terminal |
|---|---|---|
| what it is | a window on your Mac: every project in one window, an inbox for what needs you, the bims at work | in your terminal, one thread per repo, keys for everything |
| runs on | Macs with Apple silicon, macOS 14 or later | macOS and Linux, over SSH too |
| how you talk | type, or hold `fn` in any app | type, or `ctrl+r` |
| get it | [download it](desktop) | [one curl line](install) |

both apps run the same agents, with the same threads, models, keys and settings. use one, or both at once on the same repo.

these docs are one set for both. most of it is the same in both apps. where a step differs, the page shows your app's way: pick yours with the **desktop / terminal** switch at the top of the list of pages. a page that exists in one app only says so under its title.

## start here

1. get bise: [bise desktop](desktop) or [bise terminal](install).
2. give it a model: an API key from a [provider](providers)<!-- if subscriptions -->, or a plan you already pay for, through a [subscription](subscriptions)<!-- end -->.
3. ask main for something. read [main and the agents](agents) to see what happens next.

## what's in these docs

| page | what you find there |
|---|---|
| [providers and keys](providers) | the providers bise knows, where a key goes |
| [models and roles](models) | which model does what: main, agents, small jobs, voice |
| [gateways and local models](gateways) | LiteLLM, a company proxy, Ollama, LM Studio, vLLM |
| [main and the agents](agents) | how a task runs, the inbox, talking to an agent |
| [the desktop window](window) | projects, bise, the bims, the menu bar, notifications |
| [approvals](approvals) | yolo and auto: what runs without asking |
| [landing work](flow) | how agents commit, features, pull requests |
| [voice and fn](voice) | dictation, voice mode, and `fn` from any app |
| [computer use](computer-use) | agents that drive Chrome and your Mac apps |
| [plugins and MCP](plugins) | skills, local and remote MCP servers, logins |
| [settings](settings) and [config.toml](config) | every setting in one place |
| [troubleshooting](troubleshooting) | the setup check, `bise doctor`, the usual fixes |

## for agents

every page is also plain Markdown: add `.md` to its address, for example `bise.dev/docs/providers.md`. to have a coding agent install and set up bise terminal for you, give it [bise.dev/setup.md](https://bise.dev/setup.md).

## requirements

bise desktop runs on Macs with Apple silicon, macOS 14 or later. bise terminal runs on macOS (Apple silicon and Intel) and on Linux (x86_64 and arm64, glibc 2.34 or newer). you need git; on Linux, OpenSSL 3 too. see [start with bise terminal](install#linux) for the Linux details.
