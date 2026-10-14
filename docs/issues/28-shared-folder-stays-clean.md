# 28 · the shared folder stays clean

Status: done by shared-guard. Label: hub, places, prompts.
Plan: shared-guard's plan (m_25460), signed by architect (m_25463).

## Why

Gabriel: « Je vois énormément de fichiers pas commités sur main. Il faut
absolument que les agents commitent leur code ou travaillent dans des
worktrees. »

The case (Oct 14): 24 uncommitted files in the shared folder
(`~/lab/bend-lab/harness`): hub-stall's hub fix and notif-words' prompts
work, sitting there for hours. That night they blocked 5 lands (rn-land,
line-split, send-parts, inbox-record, notif-open): `sb land` refuses a
file another agent changed (`rust/switchboard/src/land_pick.rs`), and git
cannot rebase over local changes. Nobody owned the cleanup, and `git
stash` in a shared folder loses other people's work.

## What changed

1. **A code task gets its own worktree by default.** `sb spawn <name>`
   with no `--place`, `--worktree` or `--feature`, in a git repo: a new
   worktree (as `--place new`). `--place shared` keeps a task in the
   shared folder (read-only work, or a brief that must use it). No git:
   the shared folder, as before. The decision is sb-core's
   (`bend/hub/wip.bend` `spawn_wt`; laws `spawn_auto_git`,
   `spawn_auto_no_git`, `spawn_place_shared`). His `/new` keeps its `-w`.
   Cost: a new worktree builds cold (its own target), so main's prompt
   tells it to say `--place shared` for a quick read-only task.
2. **A nudge for old or many uncommitted shared files.** About once a
   minute the hub runs one `git status` of the shared folder (off the
   loop: `daemon/shared_wip.rs`) and counts, per active task in the shared
   folder, its claimed files (`Agent::files`, its file tools' writes)
   still uncommitted, and the oldest one's age (`shared_wip.rs`). sb-core
   decides (`wip.bend`): 8 files or 20 minutes, once per episode, a queued
   `[bise]` message to the agent ("land them, or `sb move <you> new
   --with-changes`") and one line in main's thread. The episode ends when
   the count is back to 0 (runtime only: a restarted hub may nudge once
   more). Laws `wip_*`. Files made with bash are not counted (`sb land`
   names them in its left-out note).
3. **The board shows it**: `rows::Agent::shared_wip`, the panel's
   `· N unlanded` on the task's row.
4. **`sb move <agent> new --with-changes`** moves a live task's WIP to its
   own worktree: its claimed files (tracked edits and new files) go as a
   patch (`git diff --binary HEAD`, saved under the hub's state
   `carry/<name>-<ms>.patch`, applied with `git apply --3way`), and only
   once applied the shared copies go back to HEAD. A file another active
   agent also claimed refuses the move; his own edits are never touched.
   The one carry implementation (`rust/switchboard/src/carry.rs`) also
   serves `/new -w --with-changes` (his tracked edits, his copies stay).
5. **Prompts**: main's Places line (worktree by default, `--place shared`
   for read-only, `sb move … --with-changes`); a task in the shared folder
   of a trunk repo reads that its uncommitted files block the others'
   lands.
6. **Leftovers**: `.switchboard/` (the checkout's own `/flow` setting) and
   `site/content/ambient/` (the archived ambient agent's mockups, kept off
   the public repo on purpose) are in `.gitignore`.

## Done when

- a code task spawns in a worktree by default (law + e2e);
- an agent sitting on old or many uncommitted shared files gets one
  nudge and main one line (laws + e2e `tests/shared_guard_e2e.py`, the
  count path; the age path by the laws and `shared_wip` unit tests);
- `sb move --with-changes` works: a task's WIP moves, the shared folder
  ends clean, his own edit stays (e2e + `carry` unit tests).
