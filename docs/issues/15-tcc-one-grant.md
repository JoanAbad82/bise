# 15 · One macOS folder grant for every dev version: bise runs from a signed bundle

Status: done for dev builds (agent tcc-sign). Releases: still open (below).

## The problem

macOS asked again and again "bise would like to access files in your
Documents folder" (and Downloads, Desktop), several times a week.

What the TCC log says (`log show --info --predicate 'subsystem == "com.apple.TCC"'`):

- The one process TCC holds responsible is the hub's own executable,
  `<versions>/<id>/bise` (the hub runs detached, ppid 1). Its children
  (bash, `head`, repl-live, ...) are attributed to it.
- That binary was signed ad hoc by the linker: `Identifier=bise-<hash>`,
  no certificate, so its designated requirement is its cdhash.
- TCC keys a plain executable on its PATH (`IDENTITY_ATTRIBUTION ... type 1`)
  plus that requirement. Every version is a new dir, a new path and a new
  cdhash: a new app to TCC, asked again.

## The fix

- `scripts/dev-sign.sh`: one stable identity, the self-signed code-signing
  certificate **'bise ambient dev'** in its own keychain file
  `<build dir>/ambient/sign/sign.keychain-db` (password in `pass`, 0600),
  the one amb-mac made for the desktop app. Made once when missing, never in
  the login keychain. codesign only finds identities in the search list: the
  file joins the user's list for the signing and leaves right after, under
  a lock.
- `scripts/versions.sh`: each version gets `bise.app` (bundle id
  `dev.bise.bise`, `LSUIElement`), signed with that identity, and
  `<version>/bise` is a link to `bise.app/Contents/MacOS/bise`. One binary:
  the TUI, the hub and the agents' `sb` all run it. TCC keys a bundle on its
  id + signature, the same for every version and every path.
- `scripts/bins.sh`: repl-live, repl-scripted, sb-core, harness-demo and
  bend-jsrt are signed in the cache (`dev.bise.<name>`), old cache files
  when they are next used.
- `bise_home::exe_home_dir`: `<root>/<x>.app/Contents/MacOS` with
  `VERSION` in `<root>` is `<root>`; approot, plugins, sb-core, the
  computer-use extension and helper lookups use it. `BISE_APP_ROOT` stays the
  handoff to a hub, not the only way.
- No identity (CI, another Mac, a refused sign dir), not macOS, or
  `SB_DEV_SIGN=0`: a plain `bise` as before, one warning line, never a failed
  build. An old commit (no `exe_home_dir`) also gets a plain `bise`.

## Proof (throwaway probes, never the content of ~/Documents: an opendir and an entry count)

Each probe was started by launchd (`launchctl submit`), like the hub.

| probe | path | build | TCC |
| --- | --- | --- | --- |
| plain, signed `dev.bise.tcc-probe` | `probe/probeA` | A (CDHash 11c3fa7d) | asked, allowed |
| same | same path | B (56e7ee9c) | Allowed (User Consent), no prompt |
| same | `probe/v2/probeB` | B | **asked again** (path is the key) |
| bundle `dev.bise.tcc-probe-app` | `X/TCC Probe.app` | X1 (45d7a65a) | asked, allowed |
| same bundle id | `Y/TCC Probe.app` | Y2 (f9870a75) | Allowed, no prompt |
| same, its child `/bin/ls` | `Z/TCC Probe.app` | Y3 (ca9d1d0f) | Allowed, attributed to the bundle |

## The user's one-time step

After the first hub on a version built with this: macOS asks once "bise
would like to access files in your Documents folder": click Allow (same for
Desktop and Downloads). Or once in System Settings > Privacy & Security >
Full Disk Access (or Files and Folders), `+`, add
`~/.bise/dev/versions/<any id>/bise.app`. Every later version keeps it.

## Releases (not changed, still open)

A release installs each update at `~/.bise/versions/<v>/bise`, a new path,
signed ad hoc: a user is asked again after every update. The same fix there
needs both: the bundle layout (`bise.app` with a fixed bundle id, the
`bise` link) in `packaging/build-dist.sh`, and a Developer ID Application
certificate (Apple Developer Program, 99 USD a year) with notarization, so
the requirement is `anchor apple generic and identifier ... and certificate
leaf[subject.OU] = <team>` for every user. A self-signed certificate does
not work for other users (their Gatekeeper rejects it).
