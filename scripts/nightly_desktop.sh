#!/usr/bin/env bash
# The desktop app's full end-to-end (fast-try p7, architect m_29601): what only the real packed
# app shows, run at night and before a desktop release, never between Gabriel and a try (his try
# path: a candidate, the selected checks and the smoke; docs/desktop-try.md).
#   scripts/nightly_desktop.sh <out dir> [<sha>] [--until HH:MM]
# <sha>: default HEAD of this tree. The nightly (scripts/nightly_gate.sh --in-slot) runs it as one
# night_step, in the slot it holds; desktop_try and desktop_dmg nest there at nice 10 (heavy_argv),
# never a second slot. Its steps, by value (a night cut short keeps the most useful part):
#   candidate  scripts/desktop-try.sh --candidate <sha>: the packed 'bise cand' app
#   quick      every quick as-he-does row (no QUICK_ROWS), the first run (fresh home, the model
#              step) and one fake-voice ctrl+r take: cand.sh with AS_HE_DOES_ONLY=quick
#   land       apps/desktop pnpm build + pnpm test:land
#   full       the full as-he-does pass: cand.sh (first, cut, rows2, two restarts, second, the
#              hubs outside the bundle, the core with no env)
#   dmg        scripts/desktop-dmg.sh <sha>: that candidate repacked as 'bise', the DMG mounted
#              read-only and checked (never launched)
# Each cand.sh run is on its own throwaway world (~/.bise/gate/real-shape, fake provider and
# accounts) with its gates A/B/C; a breach is a red. A step is green, red, or none (no result:
# not run, with why). --until: nothing new starts at or after that local time (the night's 08:00);
# what didn't run is none, never green. On battery: nothing runs (none: on battery).
# The reds: each ok:false step of the cand.sh JSONs, named 'as-he-does/<mode>: <step name>' (digits
# as N: a card's number changes each run), plus the steps' own reds, split by tests/known_reds.py
# (known with its owner, else NEW). A known red is still red.
# Out: <out>/<step>.log, <out>/quick/ and <out>/full/ (cand.sh's dirs), <out>/summary.txt, and
# what a tag reads (scripts/desktop_tag.py): <out>/reds.txt (each red's exact name) and
# <out>/steps.tsv (each step's state). Each run's line in <BISE_HOME>/run/nightly/desktop-runs.tsv:
# <when> <sha> green|red|none <out dir>. Exit 0 green, 1 red ('FAIL <step>' lines), 2 no result; a second run in a row with no result is red (desktop-runs.tsv keeps each
# run's verdict; the summary names the last green run). The candidate dir it built is removed at the end (disk); one built before
# (another agent's, desktop_try says "is built") is kept.
# Tests: tests/nightly_desktop_test.py (fake desktop-try, cand.sh, dmg and pnpm: NIGHTLY_DESKTOP_*).
nightly_desktop() {
set -uo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
out="" sha="" until=""
while [ $# -gt 0 ]; do
  case "$1" in
    --until) until="${2:-}"; shift 2 ;;
    *) if [ -z "$out" ]; then out="$1"; elif [ -z "$sha" ]; then sha="$1"; else echo "usage: nightly_desktop.sh <out dir> [<sha>] [--until HH:MM]" >&2; return 2; fi; shift ;;
  esac
done
[ -n "$out" ] || { echo "usage: nightly_desktop.sh <out dir> [<sha>] [--until HH:MM]" >&2; return 2; }
mkdir -p "$out" && out="$(cd "$out" && pwd)"
sha="$(git -C "$here" rev-parse --verify -q "${sha:-HEAD}^{commit}")" || { echo "no commit ${sha:-HEAD} in $here" >&2; return 2; }
bh="${BISE_HOME:-$HOME/.bise}"
try_sh="${NIGHTLY_DESKTOP_TRY:-$here/scripts/desktop-try.sh}"
dmg_sh="${NIGHTLY_DESKTOP_DMG:-$here/scripts/desktop-dmg.sh}"
cand_sh="${NIGHTLY_DESKTOP_CAND:-$here/dev/plugins/ambient-qa/as-he-does/cand.sh}"
pnpm="${NIGHTLY_DESKTOP_PNPM:-pnpm}"
sum="$out/summary.txt"
: >"$sum"
reds=()
state_of=()
note() { echo "$*" | tee -a "$sum"; }
# <name> green|red|none <why>
record() { state_of+=("$1=$2"); note "STEP $1: $2${3:+ ($3)}"; [ "$2" = red ] && echo "FAIL $1"; return 0; }

# the hard end: an epoch, the next HH:MM from the start (a 23:00 start ends tomorrow's 08:00)
# (NIGHTLY_DESKTOP_NOW: a file holding the epoch, the test's clock)
now() { if [ -n "${NIGHTLY_DESKTOP_NOW:-}" ]; then cat "$NIGHTLY_DESKTOP_NOW"; else date +%s; fi; }
end=""
if [ -n "$until" ]; then
  end="$(date -j -f "%Y-%m-%d %H:%M:%S" "$(date -r "$(now)" +%F) $until:00" +%s 2>/dev/null)" || { echo "--until wants HH:MM, got $until" >&2; return 2; }
  [ "$end" -gt "$(now)" ] || end=$((end + 86400))
fi
late() { [ -n "$end" ] && [ "$(now)" -ge "$end" ]; }
on_battery() { [ -n "${NIGHTLY_DESKTOP_BATTERY:-}" ] && { [ "$NIGHTLY_DESKTOP_BATTERY" = 1 ]; return; }; /usr/bin/pmset -g batt 2>/dev/null | head -1 | grep -q "Battery Power"; }

note "nightly desktop: $sha in $here, $(date)${until:+, nothing new after $until}"
steps=(candidate quick land full dmg)
if on_battery; then
  for s in "${steps[@]}"; do record "$s" none "on battery"; done
  verdict; return $?
fi

# the reds of one cand.sh dir: every ok:false step of its step JSONs
cand_reds() { # <mode> <dir>
  python3 -B - "$1" "$2" <<'PY'
import glob, json, os, re, sys
mode, d = sys.argv[1], sys.argv[2]
for f in sorted(glob.glob(os.path.join(d, "*.json"))):
    try:
        j = json.load(open(f))
    except (OSError, ValueError):
        continue
    if not isinstance(j, dict) or not isinstance(j.get("steps"), list):
        continue
    for s in j["steps"]:
        if isinstance(s, dict) and s.get("ok") is False:
            name = re.sub(r"\s+", " ", re.sub(r"\d+", "N", str(s.get("name", "?")))).strip()[:160]
            print("as-he-does/%s: %s" % (mode, name))
PY
}
# test:land's red checks, from land.mjs' "known reds (tests/known_reds.txt): a (owner, since x), …"
# and "NEW reds (not in tests/known_reds.txt): b, c" lines: one name per line
land_reds() { # <land.log>
  python3 -B - "$1" <<'PY'
import re, sys
for line in open(sys.argv[1], errors="replace"):
    m = re.match(r"^(known reds \(tests/known_reds.txt\)|NEW reds \(not in tests/known_reds.txt\)): (.*)$", line.strip())
    if m:
        for part in re.sub(r"\([^)]*\)", "", m.group(2)).split(","):
            if part.strip():
                print(part.strip())
PY
}
# cand.sh <mode> <dir> [env...]: its rc, its BREACH, its red steps
as_he_does() {
  local mode=$1 d="$out/$1"; shift
  rm -rf "$d"
  env "$@" bash "$cand_sh" "$d" "$app" >"$out/$mode.log" 2>&1
  local rc=$? r n=0
  while IFS= read -r r; do [ -n "$r" ] && { reds+=("$r"); n=$((n + 1)); }; done < <(cand_reds "$mode" "$d")
  if [ -e "$d/BREACH" ]; then reds+=("as-he-does/$mode: gate breach"); record "$mode" red "gate breach: $(head -1 "$d/BREACH")"
  elif [ $rc != 0 ]; then reds+=("as-he-does/$mode: cand.sh exit $rc"); record "$mode" red "cand.sh exit $rc, $n red steps, $out/$mode.log"
  elif [ $n -gt 0 ]; then record "$mode" red "$n red steps"
  else record "$mode" green; fi
}

# apps/desktop's node_modules, once (a fresh nightly tree has none); pnpm 10 skips Electron's
# postinstall (tests/harness/README.md 'Electron'): the harness then takes the shared patched one,
# ~/.bise/dev/electron-dist/v<version>-lsui (night1: every test:land check 'no Electron at …')
deps() {
  [ -d "$here/apps/desktop/node_modules/@playwright/test" ] || ( cd "$here/apps/desktop" && "$pnpm" install --frozen-lockfile --prefer-offline ) || return 1
  local v shared
  if [ -z "${BISE_HARNESS_ELECTRON_DIST:-}" ] && [ ! -d "$here/apps/desktop/node_modules/electron/dist/Electron.app" ]; then
    v="$(jq -r .version "$here/apps/desktop/node_modules/electron/package.json" 2>/dev/null)"
    shared="$HOME/.bise/dev/electron-dist/v$v-lsui"
    [ -d "$shared/Electron.app" ] || { echo "no Electron: node_modules/electron/dist is empty and $shared has none"; return 1; }
    export BISE_HARNESS_ELECTRON_DIST="$shared"
  fi
}

app="" cdir="" made=""
for s in "${steps[@]}"; do
  if late; then record "$s" none "past $until"; continue; fi
  case $s in
    candidate)
      bash "$try_sh" --candidate "$sha" >"$out/candidate.log" 2>&1; rc=$?
      j="$(tail -1 "$out/candidate.log")"
      app="$(printf '%s' "$j" | jq -r '.app // empty' 2>/dev/null)"
      cdir="$(printf '%s' "$j" | jq -r '.dir // empty' 2>/dev/null)"
      # built before this run (desktop_try's 'candidate <sha8> is built'): someone else's, kept
      grep -q "candidate ${sha:0:8} is built" "$out/candidate.log" || made="$cdir"
      if [ $rc = 0 ] && [ -d "$app" ]; then record candidate green "$app"
      else reds+=("desktop/candidate"); record candidate red "desktop-try.sh --candidate exit $rc, $out/candidate.log"; app=""; fi ;;
    quick|full)
      if [ -z "$app" ]; then record "$s" none "no candidate"; continue; fi
      # the driver's @playwright/test (cand.sh's PW_FROM: this tree's apps/desktop)
      if ! deps >"$out/deps.log" 2>&1; then reds+=("desktop/deps"); record "$s" red "pnpm install failed, $out/deps.log"; continue; fi
      if [ $s = quick ]; then as_he_does quick AS_HE_DOES_ONLY=quick AS_HE_DOES_FIRSTRUN=1 AS_HE_DOES_FAKE_VOICE=1
      else as_he_does full; fi ;;
    land)
      { deps && ( cd "$here/apps/desktop" && "$pnpm" build && "$pnpm" test:land ); } >"$out/land.log" 2>&1; rc=$?
      if [ $rc = 0 ]; then record land green
      else
        # its reds by name (land.mjs' known/NEW lines: each a desktop check's spec name), so a tag
        # can match them to known_reds; no such line (it didn't run its checks): one unknown red
        n=0
        while IFS= read -r r; do [ -n "$r" ] && { reds+=("$r"); n=$((n + 1)); }; done < <(land_reds "$out/land.log")
        [ $n = 0 ] && reds+=("desktop/test:land")
        record land red "exit $rc; $(grep -E '^(known reds|NEW reds)' "$out/land.log" | tr '\n' ' ')$out/land.log"
      fi ;;
    dmg)
      if [ -z "$app" ]; then record dmg none "no candidate"; continue; fi
      bash "$dmg_sh" "$sha" >"$out/dmg.log" 2>&1; rc=$?
      if [ $rc = 0 ]; then record dmg green "$(tail -1 "$out/dmg.log")"
      elif grep -q "no stable signing identity" "$out/dmg.log"; then record dmg none "no signing identity on this Mac"
      else reds+=("desktop/dmg"); record dmg red "desktop-dmg.sh exit $rc: $(grep 'bise dmg:' "$out/dmg.log" | tail -1)"; fi ;;
  esac
done

# disk: the candidate this run built (its DMG and share build inside), never one that was there
if [ -n "$made" ] && [ -d "$made" ]; then
  rm -rf "$made" && git -C "$here" worktree prune 2>/dev/null
  note "removed the night's candidate $made"
fi

[ ${#reds[@]} -gt 0 ] && python3 -B "$here/tests/known_reds.py" split "${reds[@]}" | tee -a "$sum"
# what a tag reads (scripts/desktop_tag.py): each red's exact name, each step's state
printf '%s\n' "${reds[@]+"${reds[@]}"}" | sed '/^$/d' >"$out/reds.txt"
printf '%s\n' "${state_of[@]}" | tr '=' '\t' >"$out/steps.tsv"
verdict
}

# the run's verdict, kept in desktop-runs.tsv (<date>T<time>, sha, green|red|none, out dir): two runs in a
# row with no result (battery, past --until) is a red of its own, owner gate-nightly (review-gates
# m_29770): the rows must not silently never run. The summary names the last green run.
verdict() {
  local v=green hist="$bh/run/nightly/desktop-runs.tsv" prev last
  case " ${state_of[*]} " in *=red*) v=red ;; *=none*) v=none ;; esac
  mkdir -p "$bh/run/nightly"
  prev="$(tail -1 "$hist" 2>/dev/null | cut -f3)"
  last="$(awk -F'\t' '$3 == "green" { l = $1 " on " $2 } END { print l }' "$hist" 2>/dev/null)"
  printf '%s\t%s\t%s\t%s\n' "$(date +%FT%T)" "$sha" "$v" "$out" >>"$hist"
  note "last green run: ${last:-none yet}"
  case $v in
    red) note "nightly desktop: red"; return 1 ;;
    none)
      if [ "$prev" = none ]; then
        record desktop-runs red "a second run in a row with no result: the end-to-end hasn't run since ${last:-ever} (owner gate-nightly)"
        note "nightly desktop: red (no result twice)"; return 1
      fi
      note "nightly desktop: no result for some steps"; return 2 ;;
  esac
  note "nightly desktop: green"
  return 0
}
nightly_desktop "$@"; exit $?
