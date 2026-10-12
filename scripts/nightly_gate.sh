#!/usr/bin/env bash
# The nightly full gate: every e2e/tmux test on main's tip (gate.sh full
# --all), because the full gates of the day run only the tests their change
# can break (tests/test_map.py; docs/loop-speed.md §11).
#   scripts/nightly_gate.sh             run it now (through ~/.bise/run/heavy-run)
#   scripts/nightly_gate.sh --install [HH:MM]
#                                       a launchd job every day at HH:MM
#                                       (default 04:30; a Mac asleep then
#                                       runs it at its wake)
#   scripts/nightly_gate.sh --uninstall
# Its tree: <worktrees>/<project-id>/nightly/ (gate.sh new nightly the first
# time, then main's tip checked out again; its target a seed clone).
# Its results, in ~/.bise/run/nightly/: <date>.log, `last` (one line: date,
# sha, green|red, seconds), and `red` while main's tip is red (the sha, the
# failing tests, the log), removed by the next green night. main keeps a
# watch on `red` (sb wake --on-file ~/.bise/run/nightly/red): it hears of a
# red night only.
set -uo pipefail
LABEL=dev.bise.nightly-gate
here="$(cd "$(dirname "$0")/.." && pwd)"
main_tree="$(git -C "$here" worktree list --porcelain | sed -n '1s/^worktree //p')"
out="${BISE_HOME:-$HOME/.bise}/run/nightly"
mkdir -p "$out"
plist="$HOME/Library/LaunchAgents/$LABEL.plist"

if [ "${1:-}" = --install ]; then
  at="${2:-04:30}" h="${at%%:*}" m="${at##*:}"
  mkdir -p "$(dirname "$plist")"
  cat >"$plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$main_tree/scripts/nightly_gate.sh</string></array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>$((10#$h))</integer><key>Minute</key><integer>$((10#$m))</integer></dict>
  <key>StandardOutPath</key><string>$out/launchd.out</string>
  <key>StandardErrorPath</key><string>$out/launchd.out</string>
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>$HOME/.bend/bin:$HOME/.cargo/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string></dict>
</dict></plist>
EOF
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null
  launchctl bootstrap "gui/$(id -u)" "$plist" && echo "installed: $LABEL every day at $at ($plist); results in $out"
  exit $?
fi
if [ "${1:-}" = --uninstall ]; then
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null; rm -f "$plist"; echo "removed $LABEL"; exit 0
fi

ulimit -n 10240 2>/dev/null
unset SB_AGENT SB_SOCKET CARGO_TARGET_DIR
day="$(date +%F)" log="$out/$(date +%F).log" s=$SECONDS
# the nightly tree: made once, then main's tip again
wt="$(cd "$main_tree" && bash tests/gate.sh new nightly 2>&1 | sed -n 's/^now: cd \([^ ]*\) .*/\1/p')"
if [ -z "$wt" ]; then
  wt="$(git -C "$main_tree" worktree list --porcelain | sed -n 's/^worktree \(.*\/nightly\/[^/]*\)$/\1/p' | head -1)"
  [ -n "$wt" ] && git -C "$wt" checkout -q --detach "$(git -C "$main_tree" rev-parse main)" && git -C "$wt" clean -qfd
fi
[ -n "$wt" ] && [ -d "$wt" ] || { echo "$day ? red 0 no nightly tree" >"$out/last"; echo "no nightly tree: see $log" >"$out/red"; exit 1; }
sha="$(git -C "$wt" rev-parse --short HEAD)"
echo "START $(date) $sha" >"$log"
(cd "$wt" && GATE_ALL=1 "$HOME/.bise/run/heavy-run" bash tests/gate.sh full --all) >>"$log" 2>&1
rc=$?
if [ $rc = 0 ]; then
  echo "$day $sha green $((SECONDS - s))" >"$out/last"; rm -f "$out/red"
else
  echo "$day $sha red $((SECONDS - s))" >"$out/last"
  { echo "nightly full gate red on main $sha ($day, $((SECONDS - s)) s): $(grep -E '^FAIL ' "$log" | awk '{print $2}' | tr '\n' ' ')"
    echo "log: $log"; } >"$out/red.tmp" && mv "$out/red.tmp" "$out/red"
fi
# old logs: two weeks
find "$out" -name '20*.log' -mtime +14 -delete 2>/dev/null
exit $rc
