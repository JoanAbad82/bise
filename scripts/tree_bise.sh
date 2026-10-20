#!/bin/bash
# This tree's own bise for the nightly's real-core world (core_record.sh, the desktop-checks step):
# built in the gate's target beside the tree ($CARGO_TARGET_DIR, else <tree>/../target), then its
# path on stdout. A no-op build after the gate's own; but a gate that stopped before its cargo
# build left there the warm seed's clone, another tree's code (2026-10-20: the seed's bise, built
# in release-35's dropped worktree, its world hubs dead on 'repl-live not found').
#   scripts/tree_bise.sh     exit 0 and the path; 1 when there is no gate target (not a
#                            nightly-shaped tree: the caller lets qa.py pick a bise); 2 when the
#                            build failed (said on stderr)
set -u
here="$(cd "$(dirname "$0")/.." && pwd)"
t="${CARGO_TARGET_DIR:-$here/../target}"
[ -d "$t" ] || exit 1
if ! (cd "$here/rust" && CARGO_TARGET_DIR="$t" cargo build --offline -q -p bend-harness) >&2; then
  echo "tree_bise: this tree's bise didn't build (cargo build -p bend-harness in $t)" >&2
  exit 2
fi
echo "$t/debug/bise"
