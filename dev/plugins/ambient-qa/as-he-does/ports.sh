# The as-he-does CDP ports, one place (architect m_29576): sourced by cand.sh and run.sh. The full
# gate (real-shape world) and the smoke (its own world, cand.sh --smoke) never share a port or a
# world, so a smoke can run while a gate run holds its window, on another candidate only: one
# candidate takes one run at a time (cand.sh's locks per world and per candidate path, gate-nightly).
# (AS_HE_DOES_CDP_GATE: tests/cand_lock_test.py's own base, off the real runs' ports)
CDP_GATE=${AS_HE_DOES_CDP_GATE:-9341}
CDP_SMOKE=9342
# world n's port (cand.sh's world per heavy slot): 9341, 9351, 9361...
cdp_world() { echo $((CDP_GATE + 10 * ($1 - 1))); }
