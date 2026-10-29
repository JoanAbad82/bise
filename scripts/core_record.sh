#!/bin/bash
# The nightly's real-core recording and its invariant check (fast-try p5, architect m_29198,
# m_29407): an ambient-qa world up (--rich: every card kind; the fake provider, a throwaway HOME
# under ~/.bise/gate, never his), `bise ambient-core` driven as the desktop app drives it and
# every protocol line recorded (tests/core_record.py), the world down whatever happened, then:
#   1. the recording typed (recorded.gen.ts) and typechecked against bise-proto's generated
#      types: a line they refuse is red (the types are stale), no allowlist;
#   2. the invariants (apps/desktop/tests/nightly/invariants.test.ts): nothing throws, a card the
#      hub took and dropped never shows again, every request answered, no send left on its way.
# No expected output anywhere; re-recorded by this script every run, never by hand, never committed.
#   scripts/core_record.sh            record, type, check (exit 0 green, 1 red, 2 no recording)
#   scripts/core_record.sh --check    type and check the recording already there
#   QA_BISE=<abs bise>                the bise the world and the core run (else qa.py picks one)
# The recording: apps/desktop/tests/nightly/rec/ (rec.jsonl, recorded.gen.ts, core.err).
# Run by scripts/nightly_gate.sh after its gate, in its tree. Tests: tests/core_record_test.py.
set -u
here="$(cd "$(dirname "$0")/.." && pwd)"
desktop="$here/apps/desktop"
qa="$here/dev/plugins/ambient-qa/qa.py"
rec="$desktop/tests/nightly/rec"

record() {
  # no real key reaches the world (tests/checks/real.sh's scrub; world up refuses a leak too)
  local v
  for v in $(env | sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p' |
             grep -iE '(_api_key|_token|_secret|_bedrock|_password)$|^(anthropic|openai|azure|mistral|codestral|gemini|google|aws|openrouter|staging_mistral|gemfury)_'); do
    unset "$v"
  done
  export MISTRAL_API_KEY=qa-fake-not-a-key
  local up=(world up --rich)
  # in the nightly's tree (no QA_BISE): this tree's bise, built in the gate's target beside it
  # (scripts/tree_bise.sh: never the seed's clone a stopped gate left there); else qa.py picks one
  if [ -z "${QA_BISE:-}" ]; then
    local b r
    b="$(bash "$here/scripts/tree_bise.sh")"; r=$?
    [ $r = 2 ] && return 2
    [ $r = 0 ] && { QA_BISE="$b"; export AMBIENT_QA_APP_ROOT="$here"; }
  fi
  [ -n "${QA_BISE:-}" ] && up+=(--bise "$QA_BISE")
  down() { python3 -B "$qa" world down > /dev/null 2>&1 || true; }
  trap down EXIT INT TERM
  down
  rm -rf "$rec"
  mkdir -p "$rec"
  if ! python3 -B "$qa" "${up[@]}" > "$rec/world.json" 2>&1; then
    echo "core_record: the world didn't come up:" >&2
    tail -20 "$rec/world.json" >&2
    return 2
  fi
  python3 -B "$here/tests/core_record.py" drive "$rec" || return 2
  down
  trap - EXIT INT TERM
}

check() {
  [ -s "$rec/rec.jsonl" ] || { echo "core_record: no recording in $rec" >&2; return 2; }
  python3 -B "$here/tests/core_record.py" gen "$rec" || return 2
  cd "$desktop" || return 2
  local red=0
  if ! npx tsc -p tsconfig.rec.json > "$rec/tsc.log" 2>&1; then
    echo "core_record: RED: tonight's core says lines the generated types refuse (stale types):" >&2
    head -30 "$rec/tsc.log" >&2
    red=1
  fi
  if ! npx vitest run -c vitest.nightly.config.ts > "$rec/invariants.log" 2>&1; then
    echo "core_record: RED: an invariant broke on tonight's core:" >&2
    tail -40 "$rec/invariants.log" >&2
    red=1
  fi
  [ "$red" = 0 ] && echo "core_record: green ($(wc -l < "$rec/rec.jsonl" | tr -d ' ') lines)"
  return "$red"
}

case "${1:-}" in
  --check) check ;;
  "") record || exit $?; check ;;
  *) sed -n '2,16p' "$0"; exit 2 ;;
esac
