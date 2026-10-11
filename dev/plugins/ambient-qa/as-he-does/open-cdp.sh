#!/bin/bash
# BISE_TRY_OPEN hook for the frames launch only (ambient-lead m_18718): exactly --real's open
# (open -g -n -a <app> --env ...), plus one localhost CDP port. Called as: <hook> <app> HOME=… BISE_HOME=… [BISE_DESKTOP_OFFSCREEN=1]
app="$1"; shift
args=(open -g -n -a "$app")
for e in "$@"; do args+=(--env "$e"); done
args+=(--args --remote-debugging-address=127.0.0.1 --remote-debugging-port="${BISE_PROOF_CDP_PORT:-9339}")
exec "${args[@]}"
