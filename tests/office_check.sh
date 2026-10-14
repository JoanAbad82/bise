#!/usr/bin/env bash
# The office SDK's check (docs/office.md, plan §9.1): office/dist/office.js
# is committed, so it must be what office/sdk/src builds. Typecheck, rebuild
# in memory and fail on a diff (a stale or hand-edited bundle), then the
# SDK's tests on that bundle.
#   tests/office_check.sh          no pnpm or node_modules: says "skipped", exit 0
#   tests/office_check.sh strict   installs node_modules from the lockfile; no pnpm: exit 1
# gate.sh quick runs it when office/ changed, gate.sh full every time.
set -uo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
sdk="$root/office/sdk"
[ -d "$sdk" ] || exit 0
strict="${1:-}"
miss=""
if ! command -v pnpm >/dev/null 2>&1; then
  for d in "${FNM_DIR:-$HOME/.local/share/fnm}/aliases/default/bin" "$HOME/.volta/bin" "$HOME/Library/pnpm"; do
    if [ -x "$d/pnpm" ]; then export PATH="$d:$PATH"; break; fi
  done
fi
if ! command -v pnpm >/dev/null 2>&1; then miss="no pnpm on PATH"
elif [ ! -d "$sdk/node_modules" ]; then
  if [ "$strict" = strict ]; then
    (cd "$sdk" && pnpm -s install --frozen-lockfile --prefer-offline) || miss="pnpm install failed in office/sdk"
  else miss="no node_modules; run pnpm -C office/sdk install"; fi
fi
if [ -n "$miss" ]; then
  if [ "$strict" = strict ]; then echo "FAIL office_check: $miss"; exit 1; fi
  echo "skipped office_check: $miss"; exit 0
fi
cd "$sdk" && pnpm -s check
