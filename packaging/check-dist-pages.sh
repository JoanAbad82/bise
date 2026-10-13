#!/usr/bin/env bash
# check-dist-pages.sh — the pages of a BUILT app root serve their kit.
#
#   packaging/check-dist-pages.sh <app dir>
#
# Starts that app's hub (bise sbd) on a throwaway HOME, on the home
# workspace (so the first run publishes the `start here` page), then
# fetches the home list and that page, and every stylesheet and script
# they link (/kit/*.css, /kit/*.js, the page's page.css): each must answer
# 200 with its type (text/css, text/javascript). A release without app/kit
# (v2026.10.2-31, -32) served every /kit file as a 404 JSON error, and the
# browser refused the styles ("MIME type application/json").
# build-dist.sh runs it on every app root it packs; the hub is stopped by
# its pid, the throwaway HOME deleted.

set -euo pipefail
app="$(cd "${1:?usage: check-dist-pages.sh <app dir>}" && pwd)"
say() { echo "check-dist-pages: $*" >&2; }

home="$(mktemp -d "${TMPDIR:-/tmp}/bise-dist-check.XXXXXX")"
mkdir -p "$home/bise"
pid=""
dog=""
# the hub gets 5 s to stop on TERM, then KILL: a hub that never stops
# must not hold the build (CI's darwin-x86_64 sat in build-dist for 25+
# min on -33); never an unbounded wait
cleanup() {
  [ -z "$dog" ] || kill "$dog" 2>/dev/null || true
  if [ -n "$pid" ]; then
    kill "$pid" 2>/dev/null || true
    for _ in $(seq 1 25); do kill -0 "$pid" 2>/dev/null || break; sleep 0.2; done
    kill -9 "$pid" 2>/dev/null || true
  fi
  rm -rf "$home"
}
trap cleanup EXIT
trap 'say "timed out after ${CHECK_DIST_PAGES_TIMEOUT:-120} s"; exit 124' TERM
# the whole check: at most CHECK_DIST_PAGES_TIMEOUT s (default 120)
( sleep "${CHECK_DIST_PAGES_TIMEOUT:-120}"; kill -TERM $$ 2>/dev/null ) &
dog=$!

# a clean environment: never the caller's hub (an agent's SB_SOCKET) nor home
(cd "$app" && exec env -i HOME="$home" PATH=/usr/bin:/bin:/usr/sbin:/sbin USER="${USER:-bise}" TMPDIR="$home" \
  ./bise sbd --workspace "$home/bise") >"$home/sbd.log" 2>&1 &
pid=$!

# the pages port and the start-here page (published at boot)
port=""
for _ in $(seq 1 100); do
  f="$(find "$home/.bise" -name pages.port 2>/dev/null | head -1 || true)"
  [ -n "$f" ] && port="$(tr -d '[:space:]' < "$f")"
  if [ -n "$port" ] && curl -fs --max-time 5 -o /dev/null "http://127.0.0.1:$port/p/start-here"; then break; fi
  kill -0 "$pid" 2>/dev/null || { say "the hub exited:"; tail -20 "$home/sbd.log" >&2; exit 1; }
  sleep 0.2
done
[ -n "$port" ] || { say "no pages port after 20 s"; tail -20 "$home/sbd.log" >&2; exit 1; }
base="http://127.0.0.1:$port"

fail=0
# fetch <path> <want status> <want type prefix>
fetch() {
  local got
  got="$(curl -s --max-time 10 -o /dev/null -w '%{http_code} %{content_type}' "$base$1")"
  case "$got" in
    "$2 $3"*) echo "ok   $1  $got" >&2 ;;
    *) echo "FAIL $1  $got (want $2 $3)" >&2; fail=1 ;;
  esac
}

fetch /p/start-here 200 text/html
links=""
for p in / /p/start-here; do
  html="$(curl -fs --max-time 10 "$base$p")" || { say "$p did not answer"; exit 1; }
  links="$links
$(printf '%s' "$html" | grep -oE '<link rel="stylesheet" href="[^"]+"' | sed 's/.*href="//; s/"$//' || true)
$(printf '%s' "$html" | grep -oE '<script src="[^"]+"' | sed 's/.*src="//; s/"$//' || true)"
done
links="$(printf '%s\n' "$links" | grep '^/' | sort -u)"
n="$(printf '%s\n' "$links" | grep -c . || true)"
[ "$n" -ge 5 ] || { say "the pages link only $n assets:"; printf '%s\n' "$links" >&2; exit 1; }
printf '%s\n' "$links" | grep -q '/page\.css$' || { say "no page.css linked"; fail=1; }
while IFS= read -r u; do
  case "$u" in
    *.css) fetch "$u" 200 text/css ;;
    *.js) fetch "$u" 200 text/javascript ;;
  esac
done <<< "$links"

[ "$fail" = 0 ] || { say "the app's pages miss their kit (is app/kit in the dist?)"; exit 1; }
say "$n assets served with their type"
