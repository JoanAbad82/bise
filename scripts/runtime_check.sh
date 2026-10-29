#!/usr/bin/env bash
# runtime_check.sh <app root> — is this runtime whole for the artifact viewer? Every build
# that ships a runtime runs it on what it made and stops when it says no: scripts/versions.sh
# (a version dir), packaging/build-dist.sh (the terminal release), scripts/try_build.py's
# root_script (the try's and the candidates' snapshot root, the share runtime clones it) and
# apps/desktop/electron-builder.mjs (every desktop pack: try, candidate, dist, release).
#
# The xlsx grid (office/dist/office-sheet.js, Univer) is built, never committed: a build that
# copied only the committed office/dist shipped a kit/office/sheet.js that imports a 404, and
# the app never showed the grid (xlsx-fix: root-29c2d5aa6, root-824c1ca54, versions/9552c21a8).
#
#   scripts/runtime_check.sh <dir>     exit 0: whole; exit 1: says each missing file
# An older runtime whose sheet.js loads no grid needs none. Tested in tests/runtime_check_test.py.
set -uo pipefail
d="${1:?usage: runtime_check.sh <app root>}"
miss=()
if [ -f "$d/kit/office/viewer.js" ]; then
  [ -s "$d/office/dist/office.js" ] || miss+=("office/dist/office.js")
fi
if [ -f "$d/kit/office/sheet.js" ] && grep -q 'office-sheet\.js' "$d/kit/office/sheet.js"; then
  [ -s "$d/office/dist/office-sheet.js" ] || miss+=("office/dist/office-sheet.js (the xlsx grid: scripts/bins.sh path office-sheet)")
fi
if [ ${#miss[@]} -gt 0 ]; then
  for m in "${miss[@]}"; do echo "runtime_check: $d has no $m" >&2; done
  exit 1
fi
exit 0
