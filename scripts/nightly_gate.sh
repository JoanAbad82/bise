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
# It waits for both heavy slots (~/.bise/run/heavy-run --alone: no agent's
# heavy job beside it; hours on a busy night; on battery it waits for AC),
# then, in the slot, checks main's tip out in its tree and runs the gate:
# the sha tested is main's tip when the slot came, and a tree removed while
# it waited is made again.
# Its tree: ~/.bise/run/nightly/tree/<repo> (a worktree; <repo>/../owner
# makes gate.sh full clone the warm seed into tree/target once). Never in
# the agents' worktrees folder: the hub's start sweep removes a clean
# folder there that no task owns (sweep.rs); it removed the nightly tree
# while the 2026-10-13 run waited for its slot.
# Its results, in ~/.bise/run/nightly/: <date>.log, `last` (one line: date,
# sha, green|red, seconds; `? infra` when the gate did not start), and `red`
# while main's tip is red (the sha, the failing tests, the log; or "did not
# start", an infra failure, no test ran), removed by the next green night.
# main keeps a watch on `red` (sb wake --on-file ~/.bise/run/nightly/red):
# it hears of a red night only.
# Tests: tests/nightly_gate_test.py (a fake repo, gate and heavy-run:
# NIGHTLY_HEAVY_RUN, BISE_HOME).
# The whole body is one function, read before it runs: main can land a new
# version of this file while a run waits for its slot.
nightly_gate() {
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

if [ "${1:-}" = --in-slot ]; then
  # in the heavy slot: the tree at main's tip now, then the gate. A line
  # NOSTART <why> when the gate cannot start; START <date> <sha> when it does.
  repo="$(basename "$main_tree")"; case "$repo" in target|owner) repo=repo ;; esac
  tree="$out/tree" wt="$out/tree/$repo"
  cd / || exit 1
  tip="$(git -C "$main_tree" rev-parse --verify -q main)" || { echo "NOSTART no branch main in $main_tree"; exit 1; }
  if [ ! -e "$wt/.git" ]; then
    rm -rf "$wt"; git -C "$main_tree" worktree prune
    mkdir -p "$tree" && echo nightly >"$tree/owner" && git -C "$main_tree" worktree add -q --detach "$wt" "$tip" \
      || { echo "NOSTART cannot make the tree $wt"; exit 1; }
  fi
  git -C "$wt" checkout -q -f --detach "$tip" && git -C "$wt" clean -qfd \
    || { echo "NOSTART cannot check out main ($tip) in $wt"; exit 1; }
  [ -f "$wt/tests/gate.sh" ] || { echo "NOSTART no tests/gate.sh in $wt"; exit 1; }
  echo "START $(date) $(git -C "$wt" rev-parse --short HEAD)"
  # caffeinate -i: the Mac never idle-sleeps under the gate. On 2026-10-14
  # it took 'Maintenance Sleep' 5 times during the run (pmset -g log): each
  # test running across one ended at the wake, a timeout (5 reds; issue 26)
  cd "$wt" && GATE_ALL=1 exec /usr/bin/caffeinate -i bash tests/gate.sh full --all
  echo "NOSTART cannot enter $wt"; exit 1
fi

day="$(date +%F)" log="$out/$(date +%F).log" s=$SECONDS
echo "QUEUED $(date): waiting for a heavy slot" >"$log"
# --alone: both heavy slots, never beside an agent's heavy job (2026-10-14:
# beside one, at load 8-9, 5 long tests timed out that pass alone; issue 26)
"${NIGHTLY_HEAVY_RUN:-$HOME/.bise/run/heavy-run}" --alone /bin/bash "$here/scripts/nightly_gate.sh" --in-slot >>"$log" 2>&1
rc=$?
sha="$(awk '/^START /{print $NF; exit}' "$log")"
if [ -z "$sha" ]; then
  # the gate did not start: an infra failure, no test ran
  why="$(sed -n 's/^NOSTART //p' "$log" | tail -1)"
  [ -n "$why" ] || why="$(grep -v 'already locked$' "$log" | tail -1) (exit $rc)"
  echo "$day ? infra $((SECONDS - s)) $why" >"$out/last"
  { echo "nightly full gate did not start ($day, an infra failure: no test ran): $why"
    echo "log: $log"; } >"$out/red.tmp" && mv "$out/red.tmp" "$out/red"
  [ $rc = 0 ] && rc=1
  exit $rc
fi
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
}
nightly_gate "$@"; exit $?
