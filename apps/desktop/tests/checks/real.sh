#!/bin/bash
# The real-core checks (qa-flows), in one run: an ambient-qa world up, the checks through the
# harness (each launch adopts the world's home: launchDesktop's `home`), then the world down,
# whatever happened (ambient-lead m_9932: no world is left after a run). Never under the heavy
# lock: world up takes it by itself only to compile the tree's helpers (amb-tools c35c91b8).
#   tests/checks/real.sh                    every real-core check
#   tests/checks/real.sh thread/send.spec.ts inbox   only these (paths under tests/checks, or areas)
#   QA_BISE=<abs bise>                     the bise the world and the app's core run (else qa.py picks one)
# Out of apps/desktop/out: run `pnpm build` first. The Electron to use: as for every harness run.
set -u
here=$(cd "$(dirname "$0")" && pwd)
desktop=$(cd "$here/../.." && pwd)
qa="$desktop/../../dev/plugins/ambient-qa/qa.py"
up=(world up --projects 2)
[ -n "${QA_BISE:-}" ] && up+=(--bise "$QA_BISE")
# the run's rules (first, fresh, keys), one copy with the nightly's desktop-checks step (covmap.mts)
rule() { python3 -c 'import json, sys; v = json.load(open(sys.argv[1]))[sys.argv[2]]; print(" ".join("tests/" + s for s in v) if isinstance(v, list) else v)' "$here/real.json" "$1"; }

# No real key reaches the run: world up builds its hubs' env from an allowlist since amb-tools'
# b81056b0 (and refuses a leak), and world.ts starts the TUI next to it with the same rule
# (world_env) and checks it; this scrub is the second guard, for all the run starts from this env:
# the app's core, Playwright, the TUI (a hub started with his keys counts his providers as ready,
# and the window's model catalog then differs from the TUI's). Every key, token and provider
# variable goes; one fake Mistral key (never valid) stands in, as the world's hubs have one.
for v in $(env | sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p' |
           grep -iE "$(rule keys)"); do
  unset "$v"
done
export MISTRAL_API_KEY=qa-fake-not-a-key

down() { python3 -B "$qa" world down > /dev/null 2>&1 || true; }
trap down EXIT INT TERM

down
if ! python3 -B "$qa" "${up[@]}" > "${TMPDIR:-/tmp}/qa-flows-world.json"; then
  echo "real.sh: the world didn't come up:" >&2
  tail -20 "${TMPDIR:-/tmp}/qa-flows-world.json" >&2
  exit 1
fi

specs=()
for a in "$@"; do specs+=("tests/checks/$a"); done
if [ ${#specs[@]} -eq 0 ]; then
  specs=(tests/checks/thread/send.spec.ts tests/checks/thread/send-offline.spec.ts
         tests/checks/inbox/answer-everywhere.spec.ts tests/checks/agents tests/checks/review)
fi
cd "$desktop" || exit 1
# checks that change the world for good (real.json's `fresh`) run last, each on a fresh world
# of its own (none today: review/feature-drop and feature-refused went in the e2e cull)
# (${a[@]+"${a[@]}"}: macOS's bash 3.2 calls an empty array unbound under set -u)
fresh=($(rule fresh))
is_fresh() { local f; for f in ${fresh[@]+"${fresh[@]}"}; do [ "$1" = "$f" ] && return 0; done; return 1; }
mine=() later=()
for s in "${specs[@]}"; do
  if is_fresh "$s"; then later+=("$s"); else mine+=("$s"); fi
done
# a folder holding a fresh check runs it last too, not in the shared world
for s in ${mine[@]+"${mine[@]}"}; do
  for f in ${fresh[@]+"${fresh[@]}"}; do
    case "$f" in "$s"/*) later+=("$f") ;; esac
  done
done
# composer/controls is a harness check (scripted core) named in the bar's reruns: let it run when named
grep='real core|thread/|inbox/|agents/|review/|pages/|settings/|app/|composer/controls'
rc=0
# the list on stdout, and every annotation (the checks' measured times) in a JSON beside it
# (given to Playwright alone, never exported: world up refuses any env value that reaches
# ~/.bise/hubs, where an agent's TMPDIR lives)
# real.json's `first` runs first, in the same world, before the other checks fill its threads
# (none today: thread/news-real, the one that needed it, went in the e2e cull, docs/test-plan-min.md).
# Playwright orders files by path, so it gets its own call.
first="$(rule first)" rest=()
for s in ${mine[@]+"${mine[@]}"}; do
  if [ "$s" = "$first" ]; then
    PLAYWRIGHT_JSON_OUTPUT_NAME="${TMPDIR:-/tmp}/qa-flows-real-first.json" pnpm exec playwright test -c tests/harness/playwright.config.ts "$s" -g "$grep" --reporter=list,json || rc=1
  else
    rest+=("$s")
  fi
done
mine=(${rest[@]+"${rest[@]}"})
if [ ${#mine[@]} -gt 0 ]; then
  PLAYWRIGHT_JSON_OUTPUT_NAME="${TMPDIR:-/tmp}/qa-flows-real.json" pnpm exec playwright test -c tests/harness/playwright.config.ts "${mine[@]}" -g "$grep" --reporter=list,json || rc=1
fi
n=0
for s in ${later[@]+"${later[@]}"}; do
  n=$((n + 1))
  down
  if ! python3 -B "$qa" "${up[@]}" > "${TMPDIR:-/tmp}/qa-flows-world.json" 2>&1; then
    echo "real.sh: the fresh world for $s didn't come up:" >&2
    tail -20 "${TMPDIR:-/tmp}/qa-flows-world.json" >&2
    exit 1
  fi
  PLAYWRIGHT_JSON_OUTPUT_NAME="${TMPDIR:-/tmp}/qa-flows-real-fresh$n.json" pnpm exec playwright test -c tests/harness/playwright.config.ts "$s" -g "$grep" --reporter=list,json || rc=1
done
exit $rc
