# bend/laws/stall.bend: a stalled REPL start under load never fails an
# agent (hub/stall.bend, send-fast step 6 C, architect m_36171). Closed
# by bend/proofs/stall.bend; the gate checks every bend/proofs/*.bend.
import Base
import ../hub/stall.bend as SL

# LAW: a stall under load never counts toward the agent's crashes,
# whatever its row.
law loaded_stall_never_counts:
  for +row: Nat
  {SL.counts(SL.pick(True{}, True{}, row)) == False{} : Bool}

# LAW: no more than K() starts again under load without a wait: from
# the stall after the K()-th in a row, the agent waits for the machine.
law loaded_stalls_bounded:
  for +n: Nat
  {SL.pick(True{}, True{}, Nat.add(SL.K(), 1n+n)) == SL.SWait{} : SL.Do}

# LAW: a stall on a machine that is not loaded counts, as a crash does.
law unloaded_stall_counts:
  for +row: Nat
  {SL.pick(True{}, False{}, row) == SL.Count{} : SL.Do}

# LAW: a crash (no stall) counts, loaded or not.
law crash_counts:
  for loaded: Bool
  for +row: Nat
  {SL.pick(False{}, loaded, row) == SL.Count{} : SL.Do}
