---
title: updates
description: bise looks for a new release by itself. bise desktop installs it when you quit or step away; bise terminal tells you in the inbox and you pick when it switches.
---

an update never cuts an agent mid-task, and nothing is lost: the agents and their threads come back on the new version.

::: desktop it installs itself
## bise desktop

bise desktop gets a new build in the background. when it is ready, settings › general says so, and it installs by itself when you quit or step away from your Mac. your agents keep running. **restart to update** there does it now.

it can replace itself only from Applications. opened from the disk image or your Downloads, it offers **move to Applications** first.

if the new build doesn't start right, settings › general says so, with **go back** to the build you had.

### beta builds

settings › general › **beta builds**: new builds a few days early, newer and less tested. turning it off keeps your build until stable passes it.
:::

::: terminal the inbox, /update
## bise terminal

once a day, when bise starts, it looks for a new release in the background. it never slows the start. when there is one, an item waits in your inbox: install it from there.

a running bise keeps its version until you switch, so an update never cuts an agent mid-task. `/restart` switches to the new version, and so does starting `bise` again in that folder.

### by hand

in bise:

```text
/update
```

in a terminal:

```sh
bise update --check   # is there a newer release?
bise update           # download it, check its sha256, install it
bise --version
```

each version is installed in its own folder in `~/.local/share/bise/versions/`, and `current` points to the one in use. a few older versions are kept.

### turn the daily check off

```sh
export BISE_NO_UPDATE=1
```

`/update` and `bise update` still work.

### install the same version again

the installer is safe to run twice:

```sh
curl -fsSL https://bise.dev/install | sh
```
:::
