#!/usr/bin/env bash
# The shadow of the desktop checks' selection (fast-try p2, review-gates m_29412 #8): what
# tests/test_map.py desktop-pick would pick for this land or try, said in one line and logged to
# <gate dir>/desktop-pick.jsonl for the nightly audit. It never fails its caller and never holds
# it: at most DESKTOP_PICK_TIMEOUT seconds (default 20), exit 0 whatever happens. Everything still
# runs: the pick only starts skipping on review-gates' go (<gate dir>/desktop-pick.on).
#   tests/desktop_pick_shadow.sh land|try <from> [<to>]     (no <to>: the working tree)
# Tests: tests/desktop_pick_test.py (a crash, a hang: still exit 0).
kind="${1:-}" from="${2:-}" to="${3:-}"
[ -n "$kind" ] && [ -n "$from" ] || { echo "desktop-pick (shadow): usage: desktop_pick_shadow.sh land|try <from> [<to>]"; exit 0; }
root="$(cd "$(dirname "$0")/.." && pwd)"
out="$(mktemp -t desktop-pick.XXXXXX)" || { echo "desktop-pick (shadow): no temp file"; exit 0; }
${DESKTOP_PICK_PY:-python3} "$root/tests/test_map.py" desktop-pick --from "$from" ${to:+--to "$to"} --log "$kind" >"$out" 2>/dev/null &
pid=$!
for _ in $(seq $(( ${DESKTOP_PICK_TIMEOUT:-20} * 10 ))); do kill -0 "$pid" 2>/dev/null || break; sleep 0.1; done
if kill -0 "$pid" 2>/dev/null; then
  kill "$pid" 2>/dev/null
  echo "desktop-pick (shadow): no answer in ${DESKTOP_PICK_TIMEOUT:-20} s, nothing logged"
elif wait "$pid"; then
  first="$(head -1 "$out")"
  case "$first" in
    ALL*) echo "desktop-pick (shadow, all still runs): ALL (${first#ALL })" ;;
    PICK*) echo "desktop-pick (shadow, all still runs): ${first#PICK } checks would run" ;;
    *) echo "desktop-pick (shadow): no answer" ;;
  esac
else
  echo "desktop-pick (shadow): tests/test_map.py desktop-pick failed, nothing logged"
fi
rm -f "$out"
exit 0
