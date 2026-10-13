#!/bin/bash
# The as-he-does proof (ambient-lead m_18707, m_18810, m_18918, m_18946): the PROMOTED bundle opened
# by `scripts/desktop-try.sh --real` from ~/.bise/dev/try-src on the real-shaped world
# (realshape.py build; HOME and BISE_HOME there, BISE_DESKTOP_OFFSCREEN=1, a localhost CDP port
# through BISE_TRY_OPEN), a fake provider for the world's mains. Only on his go: it opens an app.
# Gates first, each a kill at its first breach: A the front app (realshape.py front), B his Library
# (realshape.py libsnap, before/after every step), C no bise-mac-helper process and no TCC request
# from any of the run's pids (tccd's log, read live). Then two launches (first: the window passes,
# driver.mjs; second: clean start), --real --stop after each, realshape core with no env.
#   run.sh <out dir>
set -u
O=${1:?out dir}; mkdir -p "$O"
P=${AS_HE_DOES_PYTHON:-$HOME/.pyenv/versions/3.11.13/bin/python3}
HERE=$(cd "$(dirname "$0")" && pwd); T=$(cd "$HERE/../../../.." && pwd)
RS="$P -B $HERE/../realshape.py"
G=$HOME/.bise/gate/real-shape; H=$G/w/h
SRC=${AS_HE_DOES_SRC:-$HOME/.bise/dev/try-src}
A="$SRC/apps/desktop/dist/mac-arm64/bise try.app"
export PW_FROM=$T/apps/desktop
# the files the driver's words carry, under the world, never under a path naming a project (fx.mjs)
export AS_HE_DOES_FX=$G/fx
say() { echo "$(date +%T) $*"; }
stopall() { (cd "$SRC" && BISE_TRY_REAL=$H/.bise scripts/desktop-try.sh --real --stop); sleep 2; say "left naming the world: $(ps -axo pid,command | grep -F "$G/w" | grep -v grep | wc -l)"; }
endrun() { touch $O/stop; kill $TPID $NPID $CPID $CCPID 2>/dev/null; kill $(cat $G/fake/fake.pid) 2>/dev/null; }
breach() { [ -e $O/BREACH ] && { say "BREACH: $(cat $O/BREACH)"; stopall; endrun; exit 3; }; }
libgate() { $RS libsnap --out $O/after-$1.json --diff $O/before.json || { echo "library $1" > $O/BREACH; breach; }; }
# the draft across a restart (ambient-lead m_19525): a draft typed in harness' composer, never sent,
# then the restart exactly as main does it (its launchd one-shot, restart-cmd.txt: bise-ambient --real
# from a launchd job that removes itself) on the stand-in (BISE_TRY_REAL, BISE_DESKTOP_OFFSCREEN,
# BISE_TRY_OPEN as for the launches), then the same composer must hold it. <tag> <pause s before>
# The quit's Apple Event (quit_bundle: osascript 'tell application id … to quit') is logged: every
# kTCCServiceAppleEvents line of the TCC debug stream from the restart on.
draftcase() {
  local tag=$1 pause=$2 text="draft kept across a restart ($1)" d=$O/restart-$1 lbl=amb-tools.restart-proof
  mkdir -p $d; rm -f $d/rc
  AS_HE_DOES_TAG=$tag node $HERE/driver.mjs 9341 $O draft-type "$text" 2>&1 | tail -3
  breach
  [ "$pause" -gt 0 ] && sleep "$pause"
  local t0; t0=$(date '+%Y-%m-%d %H:%M:%S')
  say "restart $tag (draft typed, ${pause} s pause)"
  launchctl remove $lbl 2>/dev/null
  launchctl submit -l $lbl -- /bin/sh -c "cd '$SRC' && /usr/bin/env BISE_TRY_REAL='$H/.bise' BISE_DESKTOP_OFFSCREEN=1 BISE_TRY_OPEN='$HERE/open-cdp.sh' BISE_PROOF_CDP_PORT=9341 BISE_TRY_CHECKOUT='$SRC' $HOME/.local/bin/bise-ambient --real > '$d/log' 2>&1; echo \$? > '$d/rc'; launchctl remove $lbl"
  for i in $(seq 900); do [ -e $d/rc ] && break; [ -e $O/BREACH ] && break; sleep 0.5; done
  say "restart $tag: rc $(cat $d/rc 2>/dev/null || echo none): $(tail -2 $d/log 2>/dev/null | tr '\n' ' ' | cut -c1-300)"
  breach; libgate restart-$tag
  AS_HE_DOES_TAG=$tag node $HERE/driver.mjs 9341 $O draft-check "$text" 2>&1 | tail -3
  breach
  $P - "$O/tcc-debug.ndjson" "$t0" > $d/tcc-appleevents.txt <<'PY'
import json, sys
path, t0 = sys.argv[1], sys.argv[2]
for line in open(path, errors="replace"):
    try:
        e = json.loads(line)
    except ValueError:
        continue
    m = e.get("eventMessage", "")
    if e.get("timestamp", "")[:19] >= t0 and "AppleEvents" in m:
        print(e["timestamp"][11:23], e.get("processImagePath", "").split("/")[-1], m[:400].replace("\n", " "))
PY
  say "restart $tag: AppleEvents TCC lines: $(wc -l < $d/tcc-appleevents.txt | tr -d ' '), preflight=no: $(grep -c 'preflight=no' $d/tcc-appleevents.txt)"
}
case "$G" in "$HOME/.bise/gate/"*) ;; *) echo "the world must be under ~/.bise/gate"; exit 2;; esac
rm -f $O/BREACH $O/stop $O/pids.txt
$RS libsnap --out $O/before.json
say "bundle: $(grep commit= "$A/Contents/Resources/bin/VERSION")"
$RS build | tail -8; cat $H/.bise/prefs.json 2>/dev/null; echo
mkdir -p $G/fake; ($P -u $T/tests/fake_provider.py 0 > $G/fake/fake.out 2> $G/fake/fake.err & echo $! > $G/fake/fake.pid)
for i in $(seq 30); do grep -q PORT $G/fake/fake.out 2>/dev/null && break; sleep 0.3; done
PORT=$(awk '/PORT/{print $2}' $G/fake/fake.out); say "fake provider port $PORT pid $(cat $G/fake/fake.pid)"
cat >> $H/.bise/config.toml <<TOML
[roles]
main = "fake/mistral-small-latest"
classify = "off"

[providers.fake]
name = "fake"
api = "openai-chat"
base_url = "http://127.0.0.1:$PORT/v1"
key_env = "BISE_TRY_FAKE_KEY"
key_command = "echo fake-key"
small_model = "mistral-small-latest"
TOML
# gate C, live (ambient-lead m_19243): every 0.3 s the run's pids (any process of the bundle, ever
# seen) and no bise-mac-helper process; tccd's log read by realshape.py tcc: a request of the run's
# pids that can show something (preflight=no, function=TCCAccessRequest) kills the run, a silent
# preflight (preflight=yes) is only logged to tcc.jsonl; its source is read from a second stream, the
# debug ndjson of tccd + com.apple.TCC (AttributionChain, function, time), before the open to after
# the quit: never 'sample' or lldb on the app (a Developer Tools dialog on his screen, ambient-lead m_19246)
log stream --style compact --predicate 'process == "tccd"' > $O/tccd.log 2>&1 & TPID=$!
log stream --level debug --style ndjson --predicate 'process == "tccd" OR subsystem == "com.apple.TCC"' > $O/tcc-debug.ndjson 2>&1 & NPID=$!
touch $O/pids.txt
( while [ ! -e $O/stop ]; do
    pgrep -f "$A/Contents/" >> $O/pids.txt 2>/dev/null
    h=$(pgrep -f "$A/Contents/MacOS/bise-mac-helper")
    [ -n "$h" ] && { echo "helper $h" > $O/BREACH; pkill -f "$A/Contents/"; }
    sleep 0.3
  done ) & CPID=$!
$RS tcc --log $O/tccd.log --pids $O/pids.txt --stop-file $O/stop --bundle "$A" --out $O & CCPID=$!
$RS front --out $O/front.jsonl --stop-file $O/stop --bundle "$A" & FPID=$!
sleep 1
for n in first second; do
  say "launch $n"
  (cd "$SRC" && BISE_TRY_REAL=$H/.bise BISE_DESKTOP_OFFSCREEN=1 BISE_TRY_OPEN=$HERE/open-cdp.sh BISE_PROOF_CDP_PORT=9341 scripts/desktop-try.sh --real) 2>&1
  breach; libgate $n-open
  node $HERE/driver.mjs 9341 $O $n 2>&1 | tail -5
  breach
  if [ $n = first ]; then draftcase pause 5; draftcase atonce 0; fi
  # the app's core.log is in its actual userData, wherever the stand-in put it (amb-core's caveat,
  # ambient-lead m_19049): the newest core.log under the world's home written during this run
  # -print0 / -0: the stand-in's path has spaces ('Application Support', 'bise try'), plain xargs
  # split it and found nothing (amb-core m_19280); its expected place is said too
  L=$(find "$H" -name core.log -newer $O/before.json -not -path "*/.bise/hubs/*" -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)
  say "core.log expected at $H/Library/Application Support/bise try/core.log: $([ -e "$H/Library/Application Support/bise try/core.log" ] && echo there || echo absent)"
  if [ -n "$L" ]; then
    say "core.log at $L: $(wc -c < "$L") bytes, repl-live not found: $(grep -c 'repl-live not found' "$L")"; cp "$L" $O/core-$n.log
  else
    say "core.log: none written under $H during the run"
  fi
  say "hubs: $(ls $H/.bise/hubs/ | tr '\n' ' ')"
  stopall
  breach; libgate $n-stop
done
touch $O/stop; wait $FPID $CCPID; kill $TPID $NPID $CPID 2>/dev/null
kill $(cat $G/fake/fake.pid) 2>/dev/null
say "realshape core with no env"
$RS core --bundle "$A" --out $O/core-noenv 2>&1 | tail -12
ps -axo pid,command | grep -F "$G/w" | grep -v grep | awk '{print $1}' | xargs kill 2>/dev/null
libgate final; say "done"
