---
title: settings
description: bise desktop's settings, page by page. ⌘, opens them. what they change is shared with bise terminal, which has a command for most of it.
app: desktop
other: config.toml and its commands | config
---

`⌘,` opens settings, or **settings** at the foot of the sidebar, or **settings…** in the menu bar's `:*`. the models, approvals, plugins and keys are the same as in bise terminal: a change here shows there too.

| page | what you set there | in bise terminal |
|---|---|---|
| general | macOS notifications, the appearance (light, dark, or as macOS), updates and beta builds | `/theme`, `/update` |
| setup | what bise needs, checked again: a model, bise's home, the permissions of `fn` | `/setup`, `bise doctor` |
| voice and fn | hold `fn` to talk, `fn fn` hands-free, the language bise hears | `/voice` |
| context and privacy | what `fn` adds to your question, how long images are kept, the apps it never reads | none |
| quiet moments | when notifications wait, and how they come back | none |
| models | your plans and keys, and which model does what | `/models`, `/provider` |
| approvals | yolo or auto, the checker, and the rules you saved, per repo | `/approvals`, `shift+tab` |
| projects | your projects: rename, reorder (the `⌘1` … `⌘9` order), remove, add | none: one repo per window |
| plugins | every plugin, on or off, and the servers that log in | `/plugins` |
| computer use | agents drive Chrome and your apps; its setup, or off | `/computer-use` |
| keys | every key, and whether your keys and sign-ins sit in the macOS keychain | `/shortcuts`, `/keychain` |

## general

- **macOS notifications**: whether questions can reach you when bise isn't in front. **turn on** asks macOS; after that, your answer lives in System Settings.
- **appearance**: light, dark, or system.
- **update**: the build you run and the next one. see [updates](updates).

## context and privacy

what bise adds when you hold `fn`, each with its own switch: a screenshot of the window in front (never the whole screen), the tab's URL and title, the open file and your selection, the text of the window. nothing is read unless you hold `fn`.

**images**: pasted, made by agents or taken with `fn`, deleted after the number of days you pick. **never sent to an agent**: the apps `fn` reads nothing in, no title, URL, file, selection, text or capture; **add…** another one by its bundle id.

## quiet moments

notifications wait during a call (Zoom, Meet, FaceTime), while you share your screen, in full screen, and in focus mode, each with its switch. then they come together, one at a time, at most every so many minutes; and after you were away, one notification when you open your Mac again.

## projects

one main per project; yours, **bise**, coordinates them. **add a project** (`⌘N`): a folder, a git repo; its main starts right away. **main may land on main**: main commits to your default branch once the tests pass, without asking you; off, your repo's flow decides (see [landing work](flow)).

removing a project takes it out of bise. its folder and its git history stay.

## keys

the key list of [keys and menus](desktop-keys), and **keep them in the macOS keychain**: on, your keys and sign-ins move to the macOS keychain; off, they stay in files in `~/.bise`.
