# bend/proofs/stall.bend: the proofs of bend/laws/stall.bend. A loaded
# stall is Again or Wait, never Count, whichever side of K() its row
# is; past K() the comparison computes to False.
import Base
import ../hub/stall.bend as SL
import ../laws/stall.bend as Laws

# Again or Wait: neither counts
def row_never_counts(below: Bool) -> {SL.counts(SL.pick.row(below)) == False{} : Bool}:
  match below:
    case True{}:
      {==}
    case False{}:
      {==}

def Laws.loaded_stall_never_counts(row):
  row_never_counts(Nat.is_le(row, SL.K()))

def Laws.loaded_stalls_bounded(n):
  {==}

def Laws.unloaded_stall_counts(row):
  {==}

def Laws.crash_counts(loaded, row):
  {==}
