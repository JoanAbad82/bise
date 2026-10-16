# 15 · One macOS folder grant for every dev version: bise runs from a signed bundle

Status: done for dev builds (agent tcc-sign) and for releases (agent cli-sign,
below), proven by local signed + notarized builds. Still open: (1) the CI
signed dry run, `release.yml` dispatched on main with `sign` checked after
the merge (main runs it; then the variable `RELEASE_SIGN` goes `on`); (2)
the desktop's signed build with a runtime that has the new layout (the
first terminal release after the merge; dist-plan's desktop release runs it).

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

## Releases (cli-sign)

A release used to install each update at `<prefix>/versions/<v>/bise`, a
new path, signed ad hoc: a user was asked again after every update (his
App Management list had one 'bise' row per version). Now, on macOS:

- `packaging/build-dist.sh` ships the dev layout: `app/bise.app` (bundle id
  **`dev.bise.cli`**, made by `scripts/mac_sign.py bundle`, the one bundle
  builder; dev builds keep `dev.bise.bise`, so the self-signed dev builds
  and the releases never share one id in TCC) and `app/bise` a link to
  `bise.app/Contents/MacOS/bise`. install.sh and `bise update` copy or move
  it whole (links kept: the signature still verifies after `place`).
- `scripts/dist_sign.py` signs every piece with the team's Developer ID
  Application certificate (the desktop app's), hardened runtime, the
  entitlements of `packaging/entitlements/` (bise.app: the mic and Apple
  Events; bend-jsrt: V8's JIT, the same file the desktop signs it with),
  then notarizes the whole app root in one submission and staples
  bise.app and the computer-use helper. Its gate: every designated
  requirement is `identifier "<id>" and anchor apple generic and ... and
  certificate leaf[subject.OU] = "9G5B2RTD6U"` (no cdhash), the same for
  every version and every user.
- The desktop app's runtime carries the same bise.app (dev.bise.cli, same
  entitlements): the grant follows the hub across the terminal and the app.
- CI: release.yml's darwin jobs sign in the environment desktop-release
  (his approval), on a `v*` tag when the variable `RELEASE_SIGN` is `on`
  (then required: a missing secret fails the job), or a dispatch with
  `sign`. Ad hoc otherwise (forks, local builds), as before.

What the user sees: a user of an older (plain, ad hoc) release is asked
once more at the first signed version, then never again: say it in that
release's notes. The old per-version 'bise' rows stay in System Settings
until he removes them (`-`); nothing here touches them.

Gatekeeper on a curl install: curl (install.sh, `bise update`) sets no
quarantine flag, so Gatekeeper never assesses these files, signed or not,
and install.sh clears the flag of a browser-downloaded tarball. A tarball
can't be stapled, nor can a bare Mach-O (repl-live, sb-core, bend-jsrt):
their notarization ticket is looked up online when a quarantined copy is
first run; bise.app and the helper carry theirs (stapled). So for the curl
path notarization changes no Gatekeeper prompt; what it buys is the
stable requirement TCC keys on, a known team for XProtect and endpoint
security (CrowdStrike), and a quarantined copy that would pass anyway.
