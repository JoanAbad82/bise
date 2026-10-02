#!/usr/bin/env bash
# ambient.sh — build, open and stop Bise Ambient.app (docs/ambient-app.md §2).
#
#   scripts/ambient.sh build        build the app if its sources changed; print its path
#   scripts/ambient.sh path         the same (the .app path is the only stdout line)
#   scripts/ambient.sh key          the source hash the build is keyed on
#   scripts/ambient.sh check        type-check the Swift (no binary) + KeyMachine's laws
#   scripts/ambient.sh open --workspace <ws> --bise <exe> [--web <dir>]
#                                   build if needed, open the app; when it already
#                                   runs: switch.json + SIGUSR1 (open drops --args)
#   scripts/ambient.sh stop         quit the running app (the pid in app.pid, never by name)
#   scripts/ambient.sh status       running or not, its pid, the built key
#   scripts/ambient.sh logs         the app's and the core's logs (tail)
#
# One app, one path: <bise dev dir>/build/ambient/Bise Ambient.app (bins.sh's
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
BUILD="${SB_BUILD_DIR:-$STATE/build}/ambient"
APP="$BUILD/Bise Ambient.app"
BIN="$APP/Contents/MacOS/Bise Ambient"
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

# the running app's pid, if app.pid names a live Bise Ambient
running_pid() {
  local pid
  pid="$(cat "$RUN/app.pid" 2>/dev/null || true)"
  [ -n "$pid" ] || return 1
  case "$(ps -p "$pid" -o comm= 2>/dev/null || true)" in
    *"Bise Ambient.app/Contents/MacOS/Bise Ambient") echo "$pid" ;;
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
  if running_pid >/dev/null; then say "sources changed: stopping the running app to rebuild"; stop; fi
  say "building $APP ($k)"
  mkdir -p "$BUILD"
  rm -f "$BUILD/key"
  "$SRC/build.sh" "$APP" >&2
  echo "$k" > "$BUILD/key"
}

# a JSON string
js() { python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$1"; }

open_app() {
  local ws="" bise="" web="${BISE_AMBIENT_WEB:-$REPO/apps/ambient/web}"
  while [ $# -gt 0 ]; do
    case "$1" in
      --workspace) ws="$2"; shift 2 ;;
      --bise) bise="$2"; shift 2 ;;
      --web) web="${BISE_AMBIENT_WEB:-$2}"; shift 2 ;;
      *) say "unknown option: $1"; exit 2 ;;
    esac
  done
  [ -n "$ws" ] || ws="$(git -C "$PWD" rev-parse --show-toplevel 2>/dev/null || pwd)"
  [ -n "$bise" ] || bise="$(command -v bise || true)"
  [ -n "$bise" ] || { say "no bise: pass --bise <exe>"; exit 2; }
  build
  mkdir -p "$RUN"
  local pid
  if pid="$(running_pid)"; then
    printf '{"workspace": %s, "bise": %s, "web": %s}\n' "$(js "$ws")" "$(js "$bise")" "$(js "$web")" > "$RUN/switch.json"
    kill -USR1 "$pid"
    say "running (pid $pid): told it the workspace $ws"
    return 0
  fi
  local args=(--workspace "$ws" --bise "$bise" --web "$web" --dev "$STATE")
  [ -z "${BISE_HOME:-}" ] || args+=(--env "BISE_HOME=$BISE_HOME")
  args+=(--env "PATH=$PATH")
  open -a "$APP" --args "${args[@]}"
  say "opened $APP for $ws"
}

case "${1:-}" in
  build|path) build; echo "$APP" ;;
  key) key ;;
  check) "$SRC/build.sh" --check && "$SRC/build.sh" --test ;;
  open) shift; open_app "$@" ;;
  stop) stop ;;
  status)
    if pid="$(running_pid)"; then echo "running pid $pid"; else echo "not running"; fi
    echo "built key $(cat "$BUILD/key" 2>/dev/null || echo none), sources key $(key)"
    ;;
  logs) tail -n 40 "$RUN/app.log" "$RUN/core.log" 2>/dev/null || say "no logs yet" ;;
  *) sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
