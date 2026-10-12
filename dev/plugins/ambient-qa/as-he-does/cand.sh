#!/bin/bash
# The candidate-only as-he-does run (ambient-lead m_20081): his own promoted app may be running, so
# nothing here is addressed by bundle id or by name (no desktop-try.sh, no osascript, no pkill). The
# candidate's own path is opened with --real's stand-in env (HOME/BISE_HOME under ~/.bise/gate,
# BISE_DESKTOP_OFFSCREEN=1, a localhost CDP port), and only its own pids, found by its executable
# path, are stopped or restarted (SIGTERM, then wait). His app's pids are logged before and after:
# unchanged is part of the proof. Gates as run.sh (A front app, B his Library, C TCC + a helper under
# the candidate's path), each a kill of the run's own pids at its first breach.
#   cand.sh <out dir> <candidate app>
set -u
O=${1:?out dir}; A=${2:?candidate app}; mkdir -p "$O"
# the RESOLVED path (ambient-lead m_20102): ~/.bise/dev/build is a symlink to
# ~/.local/state/switchboard/build and the processes carry the resolved one, so a lookup by the
# given path missed the main process and the stop left 4 processes (724c0bb9's first run)
A=$(cd "$A" && pwd -P) || { echo "no $2"; exit 2; }
P=${AS_HE_DOES_PYTHON:-$HOME/.pyenv/versions/3.11.13/bin/python3}
HERE=$(cd "$(dirname "$0")" && pwd); T=$(cd "$HERE/../../../.." && pwd)
RS="$P -B $HERE/../realshape.py"
G=$HOME/.bise/gate/real-shape; H=$G/w/h
HIS="$HOME/.bise/dev/try-src/apps/desktop/dist/mac-arm64/bise try.app"
MAIN="$A/Contents/MacOS/bise try"
PORT_CDP=9341
export PW_FROM=$T/apps/desktop
say() { echo "$(date +%T) $*"; }
case "$A" in "$HIS"|"$HIS/"*) echo "that's his promoted app, not a candidate"; exit 2;; esac
[ -x "$MAIN" ] || { echo "no $MAIN"; exit 2; }
case "$G" in "$HOME/.bise/gate/"*) ;; *) echo "the world must be under ~/.bise/gate"; exit 2;; esac
HISR=$(cd "$HIS" 2>/dev/null && pwd -P || echo "$HIS")
# pids by fixed strings on the process table (no regex on a path with spaces and dots)
# (the awk itself carries the string: skipped)
pidsunder() { ps -axo pid=,command= | awk -v p="$1" 'index($0, p) && index($0, "awk -v p=") == 0 { print $1 }'; }
hispids() { { pidsunder "$HIS/Contents/"; pidsunder "$HISR/Contents/"; } | sort -nu | tr '\n' ' '; }
ours() { pidsunder "$A/Contents/" | sort -nu; }
mainpid() { ps -axo pid=,command= | awk -v m="$MAIN" '{ pid = $1; sub(/^ *[0-9]+ /, ""); if ($0 == m || index($0, m " ") == 1) { print pid; exit } }'; }
killpids() { for p in "$@"; do kill -"${SIG:-TERM}" "$p" 2>/dev/null; done; }
# stop: SIGTERM to the candidate's main process (Electron: app.quit -> will-quit, as an Apple Event
# quit), wait for every process under its path to go, then SIGTERM, then SIGKILL what stays; then the
# world's own processes (its hubs), by pid
stopcand() {
  local m; m=$(mainpid)
  [ -n "$m" ] && kill -TERM "$m" 2>/dev/null
  for i in $(seq 60); do [ -z "$(ours)" ] && break; sleep 0.5; done
  killpids $(ours); sleep 2; SIG=KILL killpids $(ours)
  local w; w=$(pidsunder "$G/w")
  [ -n "$w" ] && killpids $w; sleep 1
  w=$(pidsunder "$G/w"); [ -n "$w" ] && { sleep 2; SIG=KILL killpids $w; sleep 1; }
  local lc lw; lc=$(ours | wc -l | tr -d ' '); lw=$(pidsunder "$G/w" | wc -l | tr -d ' ')
  say "stopped: left under the candidate $lc, naming the world $lw"
  [ "$lc" = 0 ] && [ "$lw" = 0 ] || {
    # which ones (c28260a9's first run left 1 + 1 that were gone a minute later: say what they were)
    { echo "the stop left $lc + $lw processes"; ps -o pid=,ppid=,stat=,etime=,command= -p "$(echo $(ours) $(pidsunder "$G/w") | tr ' ' ',')" 2>/dev/null | cut -c1-240; } > $O/BREACH
    cat $O/BREACH; return 1; }
}
opencand() {
  open -g -n -a "$A" --env HOME=$H --env BISE_HOME=$H/.bise --env BISE_DESKTOP_OFFSCREEN=1 \
    --args --remote-debugging-address=127.0.0.1 --remote-debugging-port=$PORT_CDP
  for i in $(seq 120); do [ -n "$(mainpid)" ] && break; sleep 0.25; done
  say "open: $A ($(grep commit= "$A/Contents/Resources/bin/VERSION")), pid $(mainpid), home $H/.bise"
}
endrun() { touch $O/stop; kill $TPID $NPID $CPID $CCPID 2>/dev/null; kill $(cat $G/fake/fake.pid) 2>/dev/null; }
breach() { [ -e $O/BREACH ] && { say "BREACH: $(cat $O/BREACH)"; stopcand; endrun; say "his app after: $(hispids)"; exit 3; }; }
# gate B with attribution (ambient-lead m_20102): a change in his real userData while HIS app runs
# is read with lsof (read only) on the candidate's pids: any open file under his folder = ours, kill
# as before; none = his own app's write, logged, the run goes on. Anything else changed = kill.
HISDATA="$HOME/Library/Application Support/bise try"
libgate() {
  local out; out=$($RS libsnap --out $O/after-$1.json --diff $O/before.json) && return 0
  echo "$out"
  local other; other=$(echo "$out" | sed -n 's/^  //p' | grep -vF "$HISDATA/" | grep -v '^$')
  if [ -z "$other" ] && [ -n "$(hispids)" ]; then
    local pids; pids=$(sort -u $O/pids.txt | tr '\n' ',' | sed 's/,$//')
    local ourfd; ourfd=$([ -n "$pids" ] && lsof -n -P -Fn -p "$pids" 2>/dev/null | sed -n 's/^n//p' | grep -F "$HISDATA/")
    if [ -z "$ourfd" ]; then
      say "library $1: only his userData changed while his app runs, no candidate fd there: his app's write, logged"
      echo "$1 $(echo "$out" | head -1)" >> $O/his-writes.txt
      cp $O/after-$1.json $O/before.json
      return 0
    fi
    echo "$ourfd" > $O/our-fds-$1.txt
  fi
  echo "library $1" > $O/BREACH; breach
}
drive() { AS_HE_DOES_TAG=${TAG:-} node $HERE/driver.mjs $PORT_CDP $O "$@" > $O/driver-$1${TAG:+-$TAG}.log 2>&1; tail -4 $O/driver-$1${TAG:+-$TAG}.log; breach; }

rm -f $O/BREACH $O/stop $O/pids.txt
say "his app before: $(hispids)" | tee $O/his.txt
$RS libsnap --out $O/before.json
$RS build | tail -8
mkdir -p $G/fake; ($P -u $T/tests/fake_provider.py 0 > $G/fake/fake.out 2> $G/fake/fake.err & echo $! > $G/fake/fake.pid)
for i in $(seq 30); do grep -q PORT $G/fake/fake.out 2>/dev/null && break; sleep 0.3; done
PORT=$(awk '/PORT/{print $2}' $G/fake/fake.out); say "fake provider port $PORT"
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
log stream --style compact --predicate 'process == "tccd"' > $O/tccd.log 2>&1 & TPID=$!
log stream --level debug --style ndjson --predicate 'process == "tccd" OR subsystem == "com.apple.TCC"' > $O/tcc-debug.ndjson 2>&1 & NPID=$!
touch $O/pids.txt
( while [ ! -e $O/stop ]; do
    ours >> $O/pids.txt 2>/dev/null
    h=$(pgrep -f "$A/Contents/MacOS/bise-mac-helper")
    [ -n "$h" ] && { echo "helper $h" > $O/BREACH; SIG=KILL killpids $(sort -u $O/pids.txt); }
    sleep 0.3
  done ) & CPID=$!
$RS tcc --log $O/tccd.log --pids $O/pids.txt --kill-pids --stop-file $O/stop --bundle "$A" --out $O & CCPID=$!
$RS front --out $O/front.jsonl --stop-file $O/stop --bundle "$A" --pids $O/pids.txt & FPID=$!
sleep 1

# first launch: the passes, this cut's rows, then the draft across two restarts (SIGTERM)
say "launch first"; opencand; breach; libgate first-open
drive first
drive cut
for c in pause atonce; do
  TAG=$c drive draft-type "draft kept across a restart ($c)"
  [ $c = pause ] && sleep 5
  say "restart $c (SIGTERM to $(mainpid), then open)"; t0=$(date '+%Y-%m-%d %H:%M:%S')
  stopcand; breach; libgate restart-$c-stop
  opencand; breach; libgate restart-$c-open
  TAG=$c drive draft-check "draft kept across a restart ($c)"
done
L=$(find "$H" -name core.log -newer $O/before.json -not -path "*/.bise/hubs/*" -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)
if [ -n "$L" ]; then say "core.log at $L: $(wc -c < "$L") bytes, repl-live not found: $(grep -c 'repl-live not found' "$L")"; cp "$L" $O/core-first.log
else say "core.log: none under $H"; fi
# whether the world held a signed thought at all (else the BENDSIG row proves only the plain case)
say "signed thoughts in the world's hubs: $(grep -rl 'BENDSIG::' $H/.bise/hubs 2>/dev/null | wc -l | tr -d ' ') files"
say "hubs: $(ls $H/.bise/hubs/ | tr '\n' ' ')"
stopcand; breach; libgate first-stop

say "launch second"; opencand; breach; libgate second-open
drive second
stopcand; breach; libgate second-stop

touch $O/stop; wait $FPID $CCPID; kill $TPID $NPID $CPID 2>/dev/null
kill $(cat $G/fake/fake.pid) 2>/dev/null
say "realshape core with no env"
$RS core --bundle "$A" --out $O/core-noenv 2>&1 | tail -10
w=$(ps -axo pid=,command= | grep -F "$G/w" | grep -v grep | awk '{print $1}'); [ -n "$w" ] && killpids $w
libgate final
say "his app after: $(hispids)" | tee -a $O/his.txt
say "done"
