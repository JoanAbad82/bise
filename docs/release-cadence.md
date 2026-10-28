# Continuous releases

Gabriel, 2026-10-28 (page release-cadence): « une release dès qu'il y a des changements [...] en
continu [...] l'écart minimum entre deux releases, ça peut être genre deux heures ». A release
(the terminal and the desktop app, together) starts as soon as something users get has landed,
at least 2 h after the last one, one at a time, and ends in ONE notification: his word to publish.

Who: the release manager (the `marketing` agent). What wakes it: an `sb every 30m` timer (never a
launchd job or a login item: off by his choice). What decides: `scripts/release_slot.py`. What
runs the checked part: `scripts/release_cut.sh`.

## One wake

1. `scripts/release_slot.py`. `slot: skip: <why>`: nothing to do, end the turn (a red tip: one
   line on the page release-cadence per sha; main forwards tip-red as usual). `slot: cut <sha>`:
   `scripts/release_slot.py start <sha>`, then the steps below.
2. **Tip gate**: `scripts/release_cut.sh gate <keep dir>`. It prints `green <sha>`: the sha its
   slot tested (main's tip then, maybe newer than the wake's). Every step below is on THAT sha.
   Red: `release_slot.py end`; the next wake tries main's next tip.
3. **The app's notes**, before its tag (the annotated tag's body is the notes file, read at
   `desktop_tag.py`'s start): from the commits since the last release, each line checked.
4. **The app's checks and its local tag**: `scripts/release_cut.sh tag <sha> <next desktop tag>
   <notes>` (`desktop_tag.py` in a clean worktree outside his state, signed through Secretive;
   it runs `nightly_desktop.sh` and the desktop checks on that sha when missing). A red outside
   tests/known_reds.txt: rerun it alone (`covmap.mts checks --only checks/<x>.spec.ts`, QA_BISE =
   `scripts/tree_bise.sh`, BISE_HARNESS_ELECTRON_DIST); green alone: an owned known_reds line,
   landed, and the cut again on the new sha; red alone: its owner fixes it, `end`, the page says
   why. The rerun of `release_cut.sh tag` on the same sha only tags.
5. **The terminal's what's new**: 3-5 lines for users (`private/launch/terminal-whats-new-<tag>.md`).
6. **The terminal draft**: `SSH_AUTH_SOCK=<Secretive's socket> packaging/publish-release.sh
   <next terminal tag> --rev <sha> --whats-new <file>` (no `--publish`): tag, push, release.yml,
   the DRAFT checked. Its darwin jobs wait on the desktop-release environment's approval: his,
   unless he said otherwise on the page release-cadence (q-sign).
7. **The notification**, through main, one: the sha, the what's new, `1. publier 2. pas cette fois`.
8. On `publier`: `publish-release.sh <tag> --publish` (every terminal sees it), then `git push
   origin <desktop tag>` (desktop-release.yml: one job, one approval: build, sign, notarize, the
   draft, beta), then stable (Actions > desktop-release > publish, channel stable), all on that one
   word. keep-current then moves his app and hubs. `release_slot.py end`.
   On `pas cette fois`: `gh release delete <tag> --yes` (the draft nobody saw), `git push origin
   :refs/tags/<tag>` (no v* tag left on an old commit), `git tag -d <desktop tag>` (its name is
   free for the next cut), `release_slot.py end`.

## Rules

- Terminal first, same sha: the app carries the published terminal release whose v* tag is on its
  own commit (desktop-release.yml failed without it, 2026-10-28). So every release has both.
- Only on a tip-green sha (docs/loop-speed.md §0 rule 11); no `--not-tip-green` unless main names it.
- Only on a ready Mac: on AC, load under 12, no quick gate running (`release_slot.py` skips
  otherwise): on battery `nightly_desktop.sh` runs nothing, under load its end-to-end steps go red
  with no real cause.
- Publishing (terminal `--publish`, the app's stable channel) and the deployment approvals are his
  word.
- One release at a time: a draft out or a cut under way (`release_slot.py start`) skips the wake.
