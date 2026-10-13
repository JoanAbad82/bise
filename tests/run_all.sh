#!/usr/bin/env bash
# Every switchboard check, from the repo root:
#   tests/run_all.sh            # deterministic (no model)
#   tests/run_all.sh --serial   # e2e + tmux tests one by one
#   tests/run_all.sh --live     # + a real-model smoke test
# e2e.py and the tmux tests run in parallel (SB_TEST_JOBS, default 4: each
# has its own tmux session and throwaway hub; more jobs overload the machine
# and the timing-sensitive tests flake). FUZZ_RUNS=2000 for the long fuzz run.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.bend/bin:$HOME/.cargo/bin:$PATH"
live=0 jobs="${SB_TEST_JOBS:-4}" only="" picked=0 pick=""
while [ $# -gt 0 ]; do
  case "$1" in
    --live) live=1 ;;
    --serial) jobs=1 ;;
    --only) only="${2:?--only <tests>}"; shift ;;
    --tests) picked=1 pick="${2-}"; shift ;;
    *) echo "usage: run_all.sh [--serial] [--live] [--only '<e2e/tmux tests>'] [--tests '<e2e/tmux tests>']" >&2; exit 2 ;;
  esac
  shift
done
# --only: those e2e/tmux tests alone, nothing else (gate.sh rerun: the
# tests a red full gate failed, on the same tree, its Rust part green).
# --tests: the Rust part, then only those e2e/tmux tests (gate.sh full's
# selection, tests/test_map.py; "" = none of them)
if [ -z "$only" ]; then
echo "== No blind sleep in tests/ (tests/sleep_check.py: wait for a state with tests/wait.py)"
python3 tests/sleep_check.py --self-test && python3 tests/sleep_check.py || exit 1
echo "== The terminal and the desktop app release apart (tests/release_split_test.py)"
python3 tests/release_split_test.py || exit 1
echo "== The release's built-in plugins are exactly the shipped list (tests/release_plugins_test.py)"
python3 tests/release_plugins_test.py || exit 1
echo "== Rust: build, unit and scenario tests, clippy"
# the Bend binaries the e2e/tmux tests run (./repl-live, ./repl-scripted,
# ./sb-core; not in git): from bins.sh's cache, compiled on a miss
scripts/bins.sh repl-live repl-scripted sb-core || exit 1
log="$(mktemp -t sb-run-all)"
(cd rust && cargo build --offline -q) || exit 1
# every test binary's summary; a failure stops here with cargo's report
if ! (cd rust && cargo test --offline -q --workspace) >"$log" 2>&1; then
  grep -E "^test .* FAILED|^failures:|panicked|test result" "$log" | head -40
  echo "FAILED: cargo test (full log: $log)"
  exit 1
fi
grep "test result" "$log"
rm -f "$log"
# in its own target dir, like the quick gate: gate.sh new's seed has it warm
# (in the build's target dir clippy re-checked ~90 deps, BISE-244)
clippy_dir="${CARGO_TARGET_DIR:-$PWD/rust/target}/clippy"
(cd rust && cargo clippy --offline -q --workspace --all-targets --target-dir "$clippy_dir" -- -D warnings)
fi
TESTS="e2e subscriptions_e2e agents_md_e2e images_mem_e2e agent_tmp_e2e foundry_url_e2e approvals_e2e approvals_restart_e2e approvals_sandbox_e2e socket_auth_e2e one_key_auto_e2e edit_tools_e2e bise_demo_e2e PROOF worktree_home feature_e2e feature_retire_e2e worktree_base_e2e ambient_core_e2e version_skew_e2e rpc_e2e older_door_e2e older_tui_bundle_hub_tmux line_mode_e2e ambient_projects_e2e ambient_pages_e2e home_workspace_e2e projects_e2e xhub_e2e route_e2e ambient_setup_e2e every_e2e draft_guard_e2e proc_cleanup env_inherit_e2e idle_exit_e2e repl_recycle_e2e repl_start_e2e artifacts_e2e long_socket_e2e core_restart scripted_ts session_ev compaction_e2e repl_bash_env mcp_bootstrap prompt_size_e2e mcp_utf8 mcp_retry mcp_errors plugins_reload_e2e plugins_ts_e2e skills_reload_e2e skills_scan skills_hang_e2e provider_families home_migrate versions_prune bins_path repo_paths tui_tmux tui_help_tmux tui_ctrl_hints_tmux tui_composer_tmux tui_version_tmux tui_at_files_tmux tui_skills_reload_tmux tui_checker_tmux
tui_images_tmux tui_card_image_tmux tui_paste_tmux tui_clear_tmux tui_archived_tmux tui_waits_tmux tui_undelivered_tmux tui_queue_tmux tui_computer_use_tmux
tui_onboarding_tmux tui_onboarding_links_tmux subscriptions_tui_tmux tui_stuck_start_tmux tui_keys_tmux tui_subscriptions_tmux tui_provider_tmux tui_panel_click_tmux tui_drafts_tmux tui_reload_tmux tui_keep_state_tmux tui_links_tmux tui_tool_rows_tmux tui_tabs_tmux tui_select_popup_tmux tui_quote_keys_tmux tui_release_tmux tui_update_tmux tui_cards_tmux tui_close_number_tmux tui_approvals_tmux tui_inbox_split_tmux tui_find_tmux tui_term_select_tmux tui_palette_tmux tui_file_links_tmux tui_cmd_a_tmux tui_cmd_arrows_tmux tui_composer_scroll_tmux tui_turn_time_tmux tui_markdown_tmux tui_code_blocks_tmux tui_demo_tips_tmux tui_text_layer_tmux tui_tool_names_tmux tui_openai_responses_tmux tui_voice_tmux tui_voice_keys_tmux tui_voice_mute_tmux tui_you_fold_click_tmux tui_mcp_login_tmux tui_log_tmux interrupt_e2e partial_e2e tui_live_text_tmux"
[ -n "$only" ] && TESTS="$only"
[ "$picked" = 1 ] && TESTS="$pick"
if [ -z "$(echo $TESTS)" ]; then echo "== no e2e/tmux test picked for this change"; exit 0; fi
# PROOF: every bend/proofs/*.bend (tests/proof_run.py), cached by the content of the .bend files it reads
# and the bend version, for every worktree (a rerun of a red full gate, or
# another task on the same hub/ core/: ~2-3 min of one core, skipped)
proof_cache="${BISE_HOME:-$HOME/.bise}/gate/proof-cache"
proof_key="whole-$( { find bend/core bend/hub bend/vendor bend/runtime bend/laws bend/proofs -name '*.bend' -type f 2>/dev/null | sort | while read -r f; do echo "$f"; cat "$f"; done; } | shasum | cut -c1-16)-$(BEND_NO_TELEMETRY=1 bend version 2>/dev/null | tr -dc '0-9.')"
mkdir -p "$proof_cache" 2>/dev/null
echo "== E2E (real hub, REPLs, git; scripted provider), Bend laws (bend/proofs), the TUI under tmux ($jobs jobs)"
out="$(mktemp -d -t sb-run-all)"
# every test's wall and CPU time (user + sys of it and what it waited for)
# go to a history shared by every worktree (loop-speed.md §10): the slow
# tests are found from it, and the next run starts the longest ones first
timings="${SB_TIMINGS:-${BISE_HOME:-$HOME/.bise}/gate/timings.tsv}"
mkdir -p "$(dirname "$timings")" 2>/dev/null || timings=/dev/null
rev="$(git rev-parse --short HEAD 2>/dev/null || echo '?')"
one() {  # <test>: its last line; its whole output kept on failure
  local s=$SECONDS rc=0 cpu
  if [ "$1" = PROOF ] && [ -f "$proof_cache/$proof_key" ]; then
    echo "ok   PROOF (cached: these .bend files checked whole before)"; return 0
  elif [ "$1" = PROOF ]; then
    # 2 bend at once: PROOF is one job of the pool
    /usr/bin/time -p -o "$out/$1.time" python3 tests/proof_run.py . 2 "$out/proof" >"$out/$1.log" 2>&1 || rc=1
  else
    /usr/bin/time -p -o "$out/$1.time" python3 -u "tests/$1.py" >"$out/$1.log" 2>&1 || rc=$?
  fi
  cpu="$(awk '$1 == "user" || $1 == "sys" { c += $2 } END { printf "%d", c }' "$out/$1.time" 2>/dev/null)"
  local load; load="$(sysctl -n vm.loadavg 2>/dev/null | awk '{ print $2 }')"
  # one line, one write: the parallel jobs' appends never mix
  echo "$(date +%s)	$rev	$1	$rc	$((SECONDS - s))	${cpu:-0}	${load:-?}" >>"$timings"
  [ $rc = 0 ] && [ "$1" = PROOF ] && touch "$proof_cache/$proof_key"
  [ $rc = 0 ] || echo "$1" >>"$out/failed"
  if [ $rc = 0 ]; then echo "ok   $1 ($((SECONDS - s))s, cpu ${cpu:-?}s): $(tail -1 "$out/$1.log")"
  else echo "FAIL $1 ($((SECONDS - s))s, cpu ${cpu:-?}s): $out/$1.log"; fi
  return $rc
}
export -f one; export out timings rev proof_cache proof_key
rc=0
# the longest first (median wall of their last 10 runs in $timings; a test
# with no history counts as long), so the jobs end together instead of a
# 4-min test starting last
TESTS="$(python3 tests/slow_first.py "$timings" $TESTS)"
printf '%s\n' $TESTS | xargs -P "$jobs" -I{} bash -c 'one {}' || rc=$?
if [ $rc != 0 ]; then
  for f in "$out"/*.log; do grep -q -E "Error|FAIL|Traceback|FALSE|fail" "$f" && { echo "---- $f"; tail -15 "$f"; }; done
  # gate.sh rerun runs these alone on the same tree
  [ -n "${SB_RED_FILE:-}" ] && cp "$out/failed" "$SB_RED_FILE" 2>/dev/null
  echo "FAILED: e2e/tmux (logs: $out)"
  exit 1
fi
rm -rf "$out"
if [ $live = 1 ]; then
  echo "== live model"
  python3 -u tests/live_smoke.py
fi
