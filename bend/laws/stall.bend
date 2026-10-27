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

# a REPL asked to stop (TERM, INT, HUP; stop-not-crash, architect
# m_48209): `row` its stops with no connect between, this one counted

# LAW: the first stop is no crash, whatever the stall facts say.
law first_stop_never_counts:
  for stalled: Bool
  for loaded: Bool
  {SL.exit(True{}, stalled, loaded, 1n) == SL.Stop{} : SL.Do}

# LAW: nor is the second in a row (K() is 3).
law second_stop_never_counts:
  for stalled: Bool
  for loaded: Bool
  {SL.exit(True{}, stalled, loaded, 2n) == SL.Stop{} : SL.Do}

# LAW: a stop never counts toward the crashes.
law stop_is_no_crash:
  {SL.counts(SL.Stop{}) == False{} : Bool}

# LAW: from the K()-th stop in a row on, it counts: something keeps
# killing it before it is ready.
law kth_stop_counts:
  for stalled: Bool
  for loaded: Bool
  for +n: Nat
  {SL.exit(True{}, stalled, loaded, Nat.add(SL.K(), n)) == SL.Count{} : SL.Do}

# LAW: an end that is no stop is picked as before.
law no_stop_as_before:
  for stalled: Bool
  for loaded: Bool
  for +row: Nat
  {SL.exit(False{}, stalled, loaded, row) == SL.pick(stalled, loaded, row) : SL.Do}
