# The as-he-does CDP ports, one place (architect m_29576): sourced by cand.sh and run.sh. The full
# gate (real-shape world) and the smoke (its own world, cand.sh --smoke) never share a port or a
# world, so a smoke can run while a gate run holds its window, on another candidate only: one
# candidate takes one run at a time (cand.sh's locks per world and per candidate path, gate-nightly).
CDP_GATE=9341
CDP_SMOKE=9342
