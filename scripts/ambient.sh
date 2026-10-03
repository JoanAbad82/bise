#!/usr/bin/env bash
# ambient.sh — build, open and stop bise ambient.app (docs/ambient-app.md §2).
#
#   scripts/ambient.sh build        build the app if its sources changed; print its path
#   scripts/ambient.sh path         the same (the .app path is the only stdout line)
#   scripts/ambient.sh key          the source hash the build is keyed on
#   scripts/ambient.sh check        type-check the Swift (no binary) + KeyMachine's laws
#   scripts/ambient.sh open [--workspace <ws> | --home] --bise <exe> [--web <dir>]
#                                   (--home: the home workspace ~/bise, no repo)
#                                   build if needed, open the app; when it already
#                                   runs: switch.json + SIGUSR1 (open drops --args)
#   scripts/ambient.sh try [--home | --workspace <ws>] [--dry-run | --build-only]
#                                   the user's try path: bise from THIS checkout into one
#                                   target dir (<bise dev dir>/build/ambient/target), its
#                                   repl-live and sb-core through bins.sh, the app, then
#                                   open it on that bise (BISE_APP_ROOT = this checkout)
#   scripts/ambient.sh stop         quit the running app (the pid in app.pid, never by name)
#   scripts/ambient.sh status       running or not, its pid, the built key
#   scripts/ambient.sh logs         the app's and the core's logs (tail)
#
# One app, one path: <bise dev dir>/build/ambient/bise ambient.app (bins.sh's
# STATE), rebuilt only when the hash of apps/ambient/mac changed, ad-hoc signed
# (bundle id dev.bise.ambient). The EDR deletes fresh unsigned binaries: never
# build another copy, never start the app from a test, never pkill by name.
# Its files: <bise dev dir>/ambient/{app.pid,app.log,core.log,switch.json,shots/}.
# BISE_AMBIENT_WEB=<dir>: load the web UI from there (live dev: the page
# reloads when a file changes).
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
if [ -n "${BISE_HOME:-}" ]; then STATE="$BISE_HOME/dev"
elif [ -e "$HOME/.bise/migrated.json" ]; then STATE="$HOME/.bise/dev"
else STATE="$HOME/.local/state/switchboard"; fi
# the app's one path, whoever calls: never under SB_BUILD_DIR (an agent's
# shell sets it to another hub's build dir, which made second copies the
# EDR deletes; bins.sh's cache still uses it)
BUILD="$STATE/build/ambient"
if [ -n "${SB_BUILD_DIR:-}" ] && [ "$SB_BUILD_DIR" != "$STATE/build" ]; then
  echo "ambient: SB_BUILD_DIR=$SB_BUILD_DIR ignored for the app: its one path is $BUILD" >&2
fi
APP="$BUILD/bise ambient.app"
BIN="$APP/Contents/MacOS/bise ambient"
RUN="$STATE/ambient"
SRC="$REPO/apps/ambient/mac"

say() { echo "ambient: $*" >&2; }

[ "$(uname -s)" = Darwin ] || { say "macOS only"; exit 2; }

# the oldest macOS (rust/.cargo/config.toml, BISE-164), at least 14.0
# (ScreenCaptureKit screenshots)
target() {
  local v
  v="$(sed -n 's/^MACOSX_DEPLOYMENT_TARGET *= *{ *value *= *"\([0-9.]*\)".*/\1/p' "$REPO/rust/.cargo/config.toml" 2>/dev/null)"
  v="${v:-14.0}"
  if [ "${v%%.*}" -lt 14 ]; then v=14.0; fi
  echo "$v"
}
export MACOSX_DEPLOYMENT_TARGET; MACOSX_DEPLOYMENT_TARGET="$(target)"

# the key: every file of apps/ambient/mac by path and content (never a
# date), the target and the compiler
key() {
  (cd "$SRC" && find . -type f ! -name '.*' -print | LC_ALL=C sort | while read -r f; do
     printf '%s %s\n' "$(shasum < "$f" | cut -c1-40)" "$f"; done
   echo "MACOSX_DEPLOYMENT_TARGET=$MACOSX_DEPLOYMENT_TARGET"
   swiftc --version 2>&1 | head -1) | shasum | cut -c1-12
}

# the running app's pid, if app.pid names a live bise ambient
running_pid() {
  local pid
  pid="$(cat "$RUN/app.pid" 2>/dev/null || true)"
  [ -n "$pid" ] || return 1
  # any case: the app was "Bise Ambient" before designer's lowercase name
  case "$(ps -p "$pid" -o comm= 2>/dev/null | tr '[:upper:]' '[:lower:]' || true)" in
    *"bise ambient.app/contents/macos/bise ambient") echo "$pid" ;;
    *) return 1 ;;
  esac
}

stop() {
  local pid i
  pid="$(running_pid)" || { say "not running"; return 0; }
  kill -TERM "$pid" 2>/dev/null || true
  for i in $(seq 1 30); do kill -0 "$pid" 2>/dev/null || break; sleep 0.1; done
  if kill -0 "$pid" 2>/dev/null; then kill -KILL "$pid" 2>/dev/null || true; fi
  rm -f "$RUN/app.pid"
  say "stopped pid $pid"
}

# build when the key changed or the binary is gone (the EDR ate it); a
# running app is stopped first (its binary is replaced)
build() {
  local k; k="$(key)"
  if [ -x "$BIN" ] && [ "$(cat "$BUILD/key" 2>/dev/null || true)" = "$k" ]; then return 0; fi
  # one build at a time at the one path: a second caller waits, then finds
  # the app built (two at once rm -rf'ed the bundle under each other's icon)
  mkdir -p "$BUILD"
  local lock="$BUILD/build.lock" waited=0
  until mkdir "$lock" 2>/dev/null; do
    local holder; holder="$(cat "$lock/pid" 2>/dev/null || true)"
    if [ -n "$holder" ] && ! kill -0 "$holder" 2>/dev/null; then rm -rf "$lock"; continue; fi
    [ "$waited" = 0 ] && say "another build of $APP is running (pid ${holder:-?}): waiting"
    waited=$((waited + 1))
    if [ "$waited" -gt 600 ]; then say "still building after 10 min (pid ${holder:-?}): giving up"; exit 1; fi
    sleep 1
  done
  echo $$ > "$lock/pid"
  trap 'rm -rf "'"$lock"'"' EXIT
  if [ -x "$BIN" ] && [ "$(cat "$BUILD/key" 2>/dev/null || true)" = "$k" ]; then rm -rf "$lock"; trap - EXIT; return 0; fi
  if running_pid >/dev/null; then say "sources changed: stopping the running app to rebuild"; stop; fi
  say "building $APP ($k)"
  rm -f "$BUILD/key"
  # a fresh bundle next to it, then swapped in: a half-built app never sits
  # at the one path (and the case-insensitive disk never keeps the old
  # "Bise Ambient.app" capitals)
  local fresh="$BUILD/new/$(basename "$APP")"
  rm -rf "$BUILD/new"
  mkdir -p "$BUILD/new"
  "$SRC/build.sh" "$fresh" >&2
  rm -rf "$APP"
  mv "$fresh" "$APP"
  rm -rf "$BUILD/new"
  echo "$k" > "$BUILD/key"
  rm -rf "$lock"
  trap - EXIT
}

# a JSON string
js() { python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$1"; }

open_app() {
  local ws="" home=0 bise="" web="${BISE_AMBIENT_WEB:-$REPO/apps/ambient/web}"
  while [ $# -gt 0 ]; do
    case "$1" in
      --workspace) ws="$2"; shift 2 ;;
      --home) home=1; shift ;;
      --bise) bise="$2"; shift 2 ;;
      --web) web="${BISE_AMBIENT_WEB:-$2}"; shift 2 ;;
      *) say "unknown option: $1"; exit 2 ;;
    esac
  done
  if [ "$home" = 0 ] && [ -z "$ws" ]; then ws="$(git -C "$PWD" rev-parse --show-toplevel 2>/dev/null || pwd)"; fi
  # no --bise: the try path's build when there is one (the dogfood's first
  # launch took ~/.local/bin/bise, which has no ambient-core: 2 min of
  # 'unknown command'), the PATH's bise only without it
  if [ -z "$bise" ] && [ -x "$TRY_BISE" ]; then
    bise="$TRY_BISE"
    export BISE_APP_ROOT="${BISE_APP_ROOT:-$REPO}"
  fi
  [ -n "$bise" ] || bise="$(command -v bise || true)"
  [ -n "$bise" ] || { say "no bise: pass --bise <exe>"; exit 2; }
  build
  mkdir -p "$RUN"
  local pid
  if pid="$(running_pid)"; then
    printf '{"workspace": %s, "home": %s, "bise": %s, "web": %s, "env": {"BISE_APP_ROOT": %s}}\n' "$(js "$ws")" "$([ "$home" = 1 ] && echo true || echo false)" "$(js "$bise")" "$(js "$web")" "$(js "${BISE_APP_ROOT:-}")" > "$RUN/switch.json"
    kill -USR1 "$pid"
    say "running (pid $pid): told it the workspace ${ws:-~/bise (home)}"
    return 0
  fi
  local args=(--bise "$bise" --web "$web" --dev "$STATE")
  [ "$home" = 1 ] || args+=(--workspace "$ws")
  [ -z "${BISE_HOME:-}" ] || args+=(--env "BISE_HOME=$BISE_HOME")
  # the core finds repl-live there (open drops the shell's env; a bise
  # built outside its tree has no app root of its own)
  [ -z "${BISE_APP_ROOT:-}" ] || args+=(--env "BISE_APP_ROOT=$BISE_APP_ROOT")
  args+=(--env "PATH=$PATH")
  open -a "$APP" --args "${args[@]}"
  say "opened $APP for ${ws:-~/bise (home)}"
}

# the try path's one bise build dir (never another copy)
TRY_TARGET="$BUILD/target"
TRY_BISE="$TRY_TARGET/debug/bise"

# bise (cargo -p bend-harness, into TRY_TARGET) and its repl-live + sb-core
# (bins.sh, at this checkout's root): a second run rebuilds only what
# changed. Under a file-size cap (an agent's shell: ulimit -f), the
# build runs as a launchd job, which has none, and this waits for it.
# A submitted job is KeepAlive: launchd restarts it when it ends, so the
# job removes its own label as its last step (and on any exit: trap).
try_build() {
  local job="$RUN/try-job.sh" rc="$RUN/try.rc" log="$RUN/try.log" v
  local label="dev.bise.ambient.try.$$"
  mkdir -p "$RUN" "$TRY_TARGET"
  {
    echo '#!/bin/bash'
    printf 'trap "launchctl remove %s 2>/dev/null" EXIT\n' "$label"
    for v in HOME PATH BISE_HOME SB_BUILD_DIR MACOSX_DEPLOYMENT_TARGET; do
      [ -z "${!v:-}" ] || printf 'export %s=%q\n' "$v" "${!v}"
    done
    printf 'export CARGO_TARGET_DIR=%q\n' "$TRY_TARGET"
    printf 'cd %q && nice -n 10 cargo build -p bend-harness \\\n' "$REPO/rust"
    printf '  && cd %q && nice -n 10 scripts/bins.sh repl-live sb-core\n' "$REPO"
    printf 'echo $? > %q\n' "$rc"
  } > "$job"
  rm -f "$rc"
  if [ "$(ulimit -f)" = unlimited ]; then
    bash "$job" 2>&1 | tee "$log" >&2
  else
    say "a file-size cap here: building as a launchd job (log: $log)"
    : > "$log"
    launchctl submit -l "$label" -o "$log" -e "$log" -- /bin/bash "$job"
    local last=""
    # this wait ending early (^C) must not leave the job behind
    trap 'launchctl remove "$label" 2>/dev/null' EXIT
    while [ ! -s "$rc" ]; do
      sleep 2
      local now; now="$(tail -n 1 "$log" 2>/dev/null || true)"
      if [ -n "$now" ] && [ "$now" != "$last" ]; then echo "  $now" >&2; last="$now"; fi
    done
    launchctl remove "$label" 2>/dev/null || true
    trap - EXIT
  fi
  local code; code="$(cat "$rc" 2>/dev/null || echo 1)"
  [ "$code" = 0 ] || { say "the build failed (exit $code): $log"; tail -n 20 "$log" >&2; exit 1; }
  [ -x "$TRY_BISE" ] || { say "no $TRY_BISE after the build"; exit 1; }
}

what_to_try() {
  cat >&2 <<'WORDS'

bise ambient is open: top right of your screen.

what to try
  hold fn              talk to main. let go to send
  fn fn                hands-free. tap fn to send
  fn space             type to main
  fn 1 … 9             answer the top question
  fn i   fn 0          the inbox, the agents
  fn o                 the newest page
  fn .                 hide or show bise
  hold fn on a page    a voice note where your mouse is
  right-click :*       what's waiting, your pages, quit

the first time, macOS asks for Accessibility; the mic and screen
recording come on your first fn hold.
logs: scripts/ambient.sh logs      stop: scripts/ambient.sh stop
WORDS
}

try() {
  local dry=0 only=0 where=()
  while [ $# -gt 0 ]; do
    case "$1" in
      --dry-run) dry=1; shift ;;
      --build-only) only=1; shift ;;
      --home) where=(--home); shift ;;
      --workspace) where=(--workspace "$2"); shift 2 ;;
      *) say "unknown option: $1"; exit 2 ;;
    esac
  done
  if [ "$dry" = 1 ]; then
    echo "checkout     $REPO"
    echo "bise         $TRY_BISE  (cargo build -p bend-harness, CARGO_TARGET_DIR=$TRY_TARGET)"
    echo "repl/hub     $REPO/repl-live, $REPO/sb-core  (scripts/bins.sh)"
    echo "app          $APP  (built if its sources changed: $(key))"
    echo "web          ${BISE_AMBIENT_WEB:-$REPO/apps/ambient/web}"
    echo "app root     BISE_APP_ROOT=$REPO"
    echo "workspace    ${where[*]:-the git root of $PWD}"
    echo "build via    $([ "$(ulimit -f)" = unlimited ] && echo "this shell (nice)" || echo "a launchd job (ulimit -f $(ulimit -f) here)")"
    echo "then         $([ "$only" = 1 ] && echo "nothing (--build-only)" || echo "open the app")"
    return 0
  fi
  try_build
  build
  if [ "$only" = 1 ]; then say "built: $TRY_BISE and $APP (not opened)"; return 0; fi
  BISE_APP_ROOT="$REPO" open_app --bise "$TRY_BISE" "${where[@]}"
  what_to_try
}

case "${1:-}" in
  build|path) build; echo "$APP" ;;
  try) shift; try "$@" ;;
  key) key ;;
  check) "$SRC/build.sh" --check && "$SRC/build.sh" --test ;;
  open) shift; open_app "$@" ;;
  stop) stop ;;
  status)
    if pid="$(running_pid)"; then echo "running pid $pid"; else echo "not running"; fi
    echo "built key $(cat "$BUILD/key" 2>/dev/null || echo none), sources key $(key)"
    ;;
  logs) tail -n 40 "$RUN/app.log" "$RUN/core.log" 2>/dev/null || say "no logs yet" ;;
  *) sed -n '2,26p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
