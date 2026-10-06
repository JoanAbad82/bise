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
qa="$desktop/../../plugins/ambient-qa/qa.py"
up=(world up --projects 2)
[ -n "${QA_BISE:-}" ] && up+=(--bise "$QA_BISE")

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
  specs=(tests/checks/thread/send.spec.ts tests/checks/thread/answers.spec.ts tests/checks/thread/send-offline.spec.ts
         tests/checks/thread/interrupt.spec.ts tests/checks/thread/find.spec.ts tests/checks/inbox/cmd-i.spec.ts
         tests/checks/agents tests/checks/spotlight/answer.spec.ts)
fi
cd "$desktop" || exit 1
pnpm exec playwright test -c tests/harness/playwright.config.ts "${specs[@]}" -g 'real core|thread/|inbox/cmd-i|agents/' --reporter=list
