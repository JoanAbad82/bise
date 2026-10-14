# hub/wip.bend - the shared folder stays clean (shared-guard, architect
# m_25463, docs/issues/28-shared-folder-stays-clean.md), the pure part:
#
# - where `sb spawn` puts a task (`spawn_wt`): `--place new` or
#   `--worktree`: its own worktree; no place given (`auto`): its own
#   worktree when the workspace is git, else the shared folder; `--place
#   shared` (or another agent's place): no new worktree. His `/new` keeps
#   its `-w` (INew, not this).
# - an agent's uncommitted files in the shared folder: the hub (Rust
#   shared_wip.rs) counts, about once a minute, each task's claimed files
#   still uncommitted there and the oldest one's age (minutes), one
#   `shared_wip` input per agent with its words. Here: whether it gets its
#   one nudge (and main its one line) in this episode, and who stays
#   nudged. The episode ends when its count is back to 0 (X.R.wip, runtime
#   only: a restarted hub may nudge once more).
#
# core.bend's shared_wip runs these decisions (it holds send and emit).
# Laws in bend/laws/hub.bend: spawn_auto_git, spawn_auto_no_git,
# spawn_place_shared, wip_nudges_once, wip_quiet_when_clean,
# wip_count_nudges, wip_age_nudges, wip_under_quiet,
# wip_clean_ends_episode.
import Base

def spawn_wt(worktree: Bool, auto: Bool, git: Bool) -> Bool:
  worktree || (auto && git)

def FILES() -> Nat:
  8n

def MINUTES() -> Nat:
  20n

def over(n: Nat, age_min: Nat) -> Bool:
  match n:
    case 0n:
      False{}
    case 1n+k:
      Nat.is_le(FILES(), 1n+k) || Nat.is_le(MINUTES(), age_min)

def nudge(n: Nat, age_min: Nat, nudged: Bool) -> Bool:
  Bool.not(nudged) && over(n, age_min)

def drop(xs: List<&2, String>, +s: String) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      Bool.pick(List<&2, String>, String.eq(h, s), drop(t, s), h <> drop(t, s))

# who stays nudged after this input: out when clean, in once nudged
def next(n: Nat, +xs: List<&2, String>, +agent: String, go: Bool) -> List<&2, String>:
  match n:
    case 0n:
      drop(xs, agent)
    case 1n+k:
      Bool.pick(List<&2, String>, go, agent <> xs, xs)
