# bend/laws/wip.bend: the shared folder stays clean (hub/wip.bend;
# shared-guard, architect m_25463, docs/issues/28-shared-folder-stays-clean.md).
# Agents left uncommitted files in the shared folder and blocked the
# others' lands: a code task gets its own worktree unless main says so,
# and a task sitting on many or old uncommitted shared files gets one
# nudge (core.bend shared_wip runs these decisions: one message from the
# hub through send.thread, one main note; no new journal kind, so the
# replay and message laws of bend/laws/hub.bend cover it as they are).
# Closed by bend/proofs/wip.bend; the gate checks every bend/proofs/*.bend.
import Base
import ../hub/wip.bend as HW

# LAW: no place named, in a git repo: its own worktree.
law spawn_auto_git:
  {HW.spawn_wt(False{}, True{}, True{}) == True{} : Bool}

# LAW: no place named, no git: the shared folder (no worktree possible).
law spawn_auto_no_git:
  {HW.spawn_wt(False{}, True{}, False{}) == False{} : Bool}

# LAW: `--place shared` (or another agent's place): never a new worktree,
# git or not.
law spawn_place_shared:
  for git: Bool
  {HW.spawn_wt(False{}, False{}, git) == False{} : Bool}

# LAW: an agent already nudged in this episode is never nudged again,
# whatever its count and age.
law wip_nudges_once:
  for n: Nat
  for age: Nat
  {HW.nudge(n, age, True{}) == False{} : Bool}

# LAW: no uncommitted file, no nudge, however old the episode.
law wip_quiet_when_clean:
  for age: Nat
  for nudged: Bool
  {HW.nudge(0n, age, nudged) == False{} : Bool}

# LAW: 8 files, even fresh ones: the nudge.
law wip_count_nudges:
  {HW.nudge(8n, 0n, False{}) == True{} : Bool}

# LAW: one file 20 minutes old: the nudge.
law wip_age_nudges:
  {HW.nudge(1n, 20n, False{}) == True{} : Bool}

# LAW: under both (7 files, 19 minutes): quiet.
law wip_under_quiet:
  {HW.nudge(7n, 19n, False{}) == False{} : Bool}

# LAW: a count back to 0 ends the agent's episode (out of the nudged
# list): its next pile gets a nudge again.
law wip_clean_ends_episode:
  for +xs: List<&2, String>
  for +agent: String
  for go: Bool
  {HW.next(0n, xs, agent, go) == HW.drop(xs, agent) : List<&2, String>}

# LAW: a nudged agent stays nudged while it has files.
law wip_nudged_stays:
  for k: Nat
  for +xs: List<&2, String>
  for +agent: String
  {HW.next(1n+k, xs, agent, True{}) == agent <> xs : List<&2, String>}
