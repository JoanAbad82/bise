# hub/stall.bend — what a crashed REPL's exit does to its agent's crash
# count (send-fast step 6 C, architect m_36171, main m_36148: at load
# 85-100 REPL starts made no progress for 94-124 s and each counted as a
# crash, main reached 4/5). The shell gives the facts (IExited): the
# start `stalled` (no progress for repl_start's limit), the machine was
# `loaded` (load x2+, crate::load) and the `row` of that REPL's stalls
# in a row (repl_start::Starts: +1 a stall, reset only when it
# connects). A crash, or a stall on a machine that is not loaded,
# counts toward MAX_CRASHES as before; a stall under load never counts:
# it starts again, at most K() times in a row, then waits for the
# machine (its spawn admitted at a tick under load x2). Pure; its laws
# are in bend/laws/stall.bend.
import Base

type Do is Data:
  # a crash: it counts toward the agent's MAX_CRASHES
  Count{}
  # a stall under load: it starts again, not counted
  Again{}
  # K() stalls under load in a row: it waits for the machine, not counted
  SWait{}

# the starts under load in a row before the agent waits for the machine
def K() -> Nat:
  3n

def pick.row(below: Bool) -> Do:
  match below:
    case True{}:
      Again{}
    case False{}:
      SWait{}

def pick.loaded(loaded: Bool, +row: Nat) -> Do:
  match loaded:
    case False{}:
      Count{}
    case True{}:
      pick.row(Nat.is_le(row, K()))

# a crashed REPL's exit: `stalled`, `loaded`, `row` as the shell said
def pick(stalled: Bool, loaded: Bool, +row: Nat) -> Do:
  match stalled:
    case False{}:
      Count{}
    case True{}:
      pick.loaded(loaded, row)

# it counts toward MAX_CRASHES
def counts(d: Do) -> Bool:
  match d:
    case Count{}:
      True{}
    case Again{}:
      False{}
    case SWait{}:
      False{}

# its spawn waits for a tick under load x2
def waits(d: Do) -> Bool:
  match d:
    case Count{}:
      False{}
    case Again{}:
      False{}
    case SWait{}:
      True{}
