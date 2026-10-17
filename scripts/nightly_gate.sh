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
#   scripts/nightly_gate.sh --tip       main's tip, once, if the machine is
#                                       quiet now (both heavy slots and the
#                                       full gate lock free, load below
#                                       TIP_GATE_MAX_LOAD, default the
#                                       cores): the same gate in the same
#                                       tree, in one heavy slot. A green
#                                       one records the sha (gate.sh's
#                                       green-shas.tsv): a release on it
#                                       skips its gate. Nothing to do (the
#                                       tip green or tried, a busy machine):
#                                       exits at once. Its results:
#                                       tip-<time>.log and tip-last (<sha>
#                                       green|red|infra <secs> <log>).
#   scripts/nightly_gate.sh --install-tip | --uninstall-tip
#                                       a launchd job that runs --tip when
#                                       main moves and every 10 min
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
TIP_LABEL=dev.bise.tip-gate
tip_plist="$HOME/Library/LaunchAgents/$TIP_LABEL.plist"
if [ "${1:-}" = --install-tip ]; then
  gd="$(git -C "$main_tree" rev-parse --absolute-git-dir)"
  mkdir -p "$(dirname "$tip_plist")"
  cat >"$tip_plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$TIP_LABEL</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$main_tree/scripts/nightly_gate.sh</string><string>--tip</string></array>
  <key>WatchPaths</key><array><string>$gd/refs/heads/main</string><string>$gd/packed-refs</string></array>
  <key>StartInterval</key><integer>600</integer>
  <key>StandardOutPath</key><string>$out/tip-launchd.out</string>
  <key>StandardErrorPath</key><string>$out/tip-launchd.out</string>
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>$HOME/.bend/bin:$HOME/.cargo/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string></dict>
</dict></plist>
EOF
  launchctl bootout "gui/$(id -u)/$TIP_LABEL" 2>/dev/null
  launchctl bootstrap "gui/$(id -u)" "$tip_plist" && echo "installed: $TIP_LABEL when main moves and every 10 min ($tip_plist); results in $out/tip-*"
  exit $?
fi
if [ "${1:-}" = --uninstall-tip ]; then
  launchctl bootout "gui/$(id -u)/$TIP_LABEL" 2>/dev/null; rm -f "$tip_plist"; echo "removed $TIP_LABEL"; exit 0
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
  # caffeinate -is: the Mac never sleeps under the gate. On 2026-10-14
  # it took 'Maintenance Sleep' 5 times during the run (pmset -g log): each
  # test running across one ended at the wake, a timeout (5 reds; issue 26).
  # -i alone is not enough: at night the display is off, the Mac is in a
  # DarkWake, which ignores it; -s (PreventSystemSleep) holds on AC only
  cd "$wt" && GATE_ALL=1 exec /usr/bin/caffeinate -is bash tests/gate.sh full --all
  echo "NOSTART cannot enter $wt"; exit 1
fi

if [ "${1:-}" = --tip ]; then
  # main's tip in a quiet slot (fast-release, gate-lane): nothing to do or a
  # busy machine exits at once, the next move of main or tick tries again
  bh="${BISE_HOME:-$HOME/.bise}"
  tip="$(git -C "$main_tree" rev-parse --verify -q main)" || exit 0
  grep -q "^$tip	" "$bh/gate/green-shas.tsv" 2>/dev/null && exit 0
  [ "$(cut -d' ' -f1 "$out/tip-last" 2>/dev/null)" = "$tip" ] && exit 0
  for l in "$bh/run/heavy.lock" "$bh/run/heavy2.lock"; do
    [ -e "$l" ] || continue
    /usr/bin/lockf -k -t 0 "$l" /usr/bin/true 2>/dev/null || exit 0
  done
  o="$(cat "$bh/gate/full-$(id -u).lock/owner" 2>/dev/null)"
  [ -n "$o" ] && kill -0 "${o%% *}" 2>/dev/null && exit 0
  load="$(sysctl -n vm.loadavg 2>/dev/null | awk '{ print int($2) }')"
  [ "${load:-0}" -lt "${TIP_GATE_MAX_LOAD:-$(sysctl -n hw.ncpu 2>/dev/null || echo 8)}" ] || exit 0
  # one tip run at a time (lockf -t 0: a second one exits 75)
  [ -n "${TIP_LOCKED:-}" ] || TIP_LOCKED=1 exec /usr/bin/lockf -t 0 "$out/tip.lock" /bin/bash "$here/scripts/nightly_gate.sh" --tip
  log="$out/tip-$(date +%Y%m%d-%H%M%S).log" s=$SECONDS
  echo "QUEUED $(date): main $tip, a quiet machine (load $load)" >"$log"
  # one heavy slot: an agent's heavy job may take the other
  "${NIGHTLY_HEAVY_RUN:-$HOME/.bise/run/heavy-run}" /bin/bash "$here/scripts/nightly_gate.sh" --in-slot >>"$log" 2>&1
  rc=$?
  sha="$(awk '/^START /{print $NF; exit}' "$log")"
  if [ -z "$sha" ]; then state=infra; sha="$tip"
  else sha="$(git -C "$main_tree" rev-parse "$sha" 2>/dev/null || echo "$tip")"; [ $rc = 0 ] && state=green || state=red; fi
  echo "$sha $state $((SECONDS - s)) $log" >"$out/tip-last"
  find "$out" -name 'tip-*.log' -mtime +7 -delete 2>/dev/null
  exit $rc
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
