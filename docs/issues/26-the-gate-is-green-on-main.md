# 26 · the gate is green on main, and stays green

Status: done on landing: full gate green twice on the tip with every fix (debt-t1, plan signed by architect m_23084). Item T1
of architect's tech-debt-night list. Label: tests, gate.

## The problem

Agents land past reds that "aren't theirs", and a known red hides the
next real one. Done when `tests/gate.sh full` is green twice in a row on
main's tip, with no known red; each fixed red has its cause in its commit
(never "flake"); a red another task owns is listed here with its owner;
`tests/sleep_exceptions.txt` (22 lines) does not grow.

## The first full gate

`gate.sh full --all` on main d6ece40b: 6 reds, each then run alone
(serial, `run_all.sh --only`):

| test | alone | cause | fix |
|---|---|---|---|
| partial_e2e | red | turn/send answers `{msg_id}` since f4c033f6 | e2e-msgid's 8ef60b33 |
| one_key_auto_e2e | red | the test hub got the user's real keys (below) | keys dropped, a law |
| ambient_core_e2e | red | dffe9d15 puts his card answer in the asker's thread | the test allows it |
| prompt_size_e2e | red | main's role grew 1.5k without its budget | budget raised by the rows |
| tui_file_chips_tmux | green | its folder in the gate's tmp: the strip dropped the too-wide source (size included) | the folder in the test's HOME |
| tui_computer_use_tmux | green | its folder path's length came from the run's tmp: the gate's made the row wrap | a short path |

Not fixed here, owned elsewhere:

- **tui_queue_tmux**: 2 of 3 alone under load. T4 removes its cause
  (owner: T4 of architect's tech-debt-night list); green in this run.
- **proto_e2e_threads, queued round** (T4's area, issue 23; seen by T3,
  architect m_23279): once, under load, after `turn/unqueue` answered
  with the row and the row left hub/agents (so the take came while main
  worked its `sleep 6` turn), main's row stayed `working` for 438 s
  (90 s x load). Cause not found: 58 reruns green, 0 stalls (15
  take-backs early in a 6 s turn, 36 near the end of 1, 2 and 3 s
  turns, the whole file 4 times alone and 3 in parallel). The waiter is
  e2e.Client's own wait on hub/agents, as in the old proto_e2e. The
  window that fits is a take racing the turn's end (issue 23). A repeat
  now fails in 30 s (x load) with its own trace: main's row (status,
  phase, since, queued) and the client's last 10 notifications
  (tests/proto_rpc.py `idle`).
- **apps/desktop delivery.spec** (not in gate.sh full): amb-win's
  ef74cc92 on main fixed it (the check scrolled the wrong element).

## main's prompt grew past its budget

prompt_size_e2e: main 40913 chars > 40684. Its role rows grew without the
budget, measured on rust/switchboard/src/testdata/prompts/main_role_desktop.txt
at each sha (27929 -> 29437). The budget is raised by exactly these
(architect m_23084), for a later prompt-diet to weigh:

| sha | row | chars |
|---|---|---|
| f0c1b04f | sb every: estimate low and check often, prefer the event | +229 |
| f681138e | sb every: wakes reach a busy agent mid-turn | +34 |
| ae7fcca8 | sb artifact archive / unarchive | +216 |
| 338dd46c | sb wake (a new row) | +548 |
| df1bacdf | sb wake --then / --alarm | +327 |
| d7e20a63 | sb feature retire | +154 |
| | total | +1508 |

The task's prompt is at 28921 of 29044: 123 chars left.

## tui_computer_use_tmux: the gate's tmp

Red in every full gate run from an agent, green alone from an agent's
shell. The extension folder the test shows was
`<tmp>/cu-xxxxxxxx/dev/try/computer-use/extension`, `<tmp>` from
e2e.short_tmp(): the run's $TMPDIR when 40 chars or less (the gate's
`~/.bise/gate/<pid>`, 39 chars here), else /tmp (an agent's own $TMPDIR is
deeper). Under the gate the row `   the folder: <path>` was 97 chars, wider
than the steps column at 150 columns: the TUI wrapped it, and the test
waited 40 s for the one-line row. Reproduced alone with
`TMPDIR=~/.bise/gate/99999`: red, same screen. The path is now
`<tmp>/cu-xxxxxxxx/ext`, short for any tmp short_tmp gives.

## The leak: test hubs had the user's real keys

`tests/bise_env.py clean_env` dropped bise's internal and test variables
and the caller's paths, but kept everything else of his shell, his model
keys too. On this machine that is `OPENROUTER_API_KEY` and
`ANTHROPIC_FOUNDRY_API_KEY` (and `MISTRAL_API_KEY`, which e2e.Env replaces
with a fake one). What reached the real network with his real key:

- **every test hub's efforts refresher** (effort-table step 2, b77eeae5,
  2026-10-13): at its start it fetched OpenRouter's model list with his
  key (`sbd: efforts: 201 lists from openrouter` in each hub's stderr), a
  read-only GET. live_fetch was right (it fetches a provider only with its
  key or login); the key should never have been there.
- **one_key_auto_e2e's approvals checker**: with an OpenRouter key the
  checker route is Jev via OpenRouter, whose call (`approvals/check.rs`,
  curl on the provider's base URL) ignores `BEND_PROVIDER_URL`. It asked
  the real OpenRouter with his key; the key is expired, so the card said
  `API key expired.` and the test went red. Proven by a run with
  `HTTPS_PROXY` on a dead port: the card said `curl: (7) ... 127.0.0.1
  port 9`. Since the test exists (f52fec74, 2026-10-02) whenever his shell
  had the key.

The REPLs' own model calls went to the fake provider (`BEND_PROVIDER_URL`),
local. The other approvals tests run with the checker off.

Closed by:

- `clean_env` drops every provider key (the catalog's `key_env` names,
  read from rust/catalog/models.toml, and auth.rs's ALIASES: one owner) and
  any other `*_API_KEY`; `BISE_TEST_REAL_ACCOUNTS=1` is the only way back
  (`run_all.sh --live` sets it for live_smoke);
- a law, `bise_env.refuse_real_keys`: a test hub or TUI whose env holds a
  key with the caller's own value is refused (e2e.Env.start_hub,
  tui_tmux.start_tui, older_tui_bundle_hub_tmux, version_skew_e2e), with
  its self-test;
- `effort_tests::no_key_no_fetch`: a hub with no provider key makes no
  fetch (both providers on a listener that is never called).

After: one_key_auto_e2e 5/5 alone, and a kept run's hub stderr has no
efforts line, its cache no efforts.json, its checker no card.

## tui_file_chips_tmux: the gate's tmp too

The first fix (94ea51ec, waits for the row with its size) named the wrong
cause: a capture between the name and the size. The next full gate showed
the row with no size for 40 s. The real cause is the one of
tui_computer_use_tmux: the documents lived in `E.tmp/My Desktop`, under
the gate's `~/.bise/gate/<pid>`, so the row's source `2 kB  <folder>` was
wider than the strip, and the strip drops a source that does not fit
(attach::box_row), size included. Reproduced alone with the old test and
`TMPDIR=~/.bise/gate/99999`: red, the same screen. The documents now live
in the test's HOME, as his `~/My Desktop`: the strip says `2 kB  ~/My
Desktop` whatever the tmp.

## The second full gate: one more red

tui_reload_tmux waited for a `reloading bise` line in main's thread after
a /restart. a38108e7 (on main during this work, designer m_23091) removed
that line for a reload that goes well: the switch row and hub.log say it.
The test now checks the line is not there once the draft is back, as
a38108e7's repl_start_e2e does. The lesson: a38108e7 (switcher-line,
archived since; signed by designer) changed a visible line and moved one
of its two tests. A change to a line a test waits on runs every test
naming it (`rg` the words) before it lands.

## feature_retire_e2e under load: two causes, and one stall to watch

Reproduced with 6 copies in parallel (debt-t6, architect m_23328):

- git's optional index lock. The hub's read-only git (a `status` poll
  refreshes the index under `index.lock`) made a land's rebase in the
  same worktree fail with `Unable to create .../index.lock: File exists`,
  so its `landed` line never came (the 90 s timeout). Every hub git now
  goes through `tools_env::git_command` with `GIT_OPTIONAL_LOCKS=0`
  (laws `the_hub_runs_git_only_here`, `the_hubs_git_takes_no_optional_lock`).
- the test's own order by sleeps. fr-c's check slept 8 s while fr-b's ask
  came after `sleep 2` twice; under load the retire ran before fr-b
  asked, or before fr-c's land began. Now by cause: fr-c's check touches
  HELD then waits for GO; main sends fr-b and the retire only after HELD;
  the test writes GO once fr-b asked. One margin stays: fr-b's `sleep 2`,
  so the retire (main's next command, ms later) is queued before it.

After: 3 batches of 6 in parallel, 18/18 green.

Seen twice in 36 parallel runs, no cause yet, none since: a stall where
an agent's `sb land` never returns (120-250 s, until the test ends; at
the hub's stop it kills one `sh` and one `sleep`). Single runs never show
it. A land that hangs is a product bug before a test bug: if it comes
back, it gets its own item with the hub.log and the land queue's state at
the hang. Kept dirs: /tmp/sb-e2e-19s0c5h5, b8dk62mi, 338aukor, vy4zc_lj
(batch 1), 84ipz1mz, _qudidjq, e5u5rsnv, xcdskvxs, pfs1kgp5, z5gii4_m
(batch 2, all at fr-b's first land on fr).

## The nightly of 2026-10-14: 7 reds on main 0aefecd2

The first nightly full gate (scripts/nightly_gate.sh, 04:30) went red on 7
tests. Each run alone on 0aefecd2 under heavy-run (nightly-reds, plan
signed by architect):

| test | alone | cause | fix |
|---|---|---|---|
| repl_start_e2e | 3 red of 6 (2 across a sleep, 1 unexplained, below); 5/5 green under caffeinate | the Mac slept (05:06:45-05:12:26) | the nightly under caffeinate |
| subscriptions_e2e | green | the same sleep | the same |
| partial_e2e | green | the same sleep | the same |
| ambient_pages_e2e | green | both sleeps | the same |
| tui_stuck_start_tmux | green | the sleep 05:13:11-05:20:30 | the same |
| xhub_e2e | green | a read between two journal lines | the test waits for the answer |
| tui_help_tmux | not run unfixed (the cause is on the nightly's screen) | the End page shows the ψ row | the test waits for the filter |

## The Mac slept under the gate

`pmset -g log` has `Entering Sleep state due to 'Maintenance Sleep'` five
times during the run, on AC, the display off. Nothing in the gate holds a
power assertion, so the Mac sleeps with the tests running; at the wake the
wall clock jumped by minutes. Each of the 5 long reds ended at a wake
(timings.tsv, the test's end time): repl_start, subscriptions and partial
at 05:12:26-31 (sleep 05:06:45 -> 05:12:26), tui_stuck_start and
ambient_pages at 05:20:30-31 (sleep 05:13:11 -> 05:20:30). Their
"timeout after 404 s (load x1.0)" for a 120 s wait was the sleep, not
the load. Two of repl_start's reds alone the same morning also spanned a
sleep: hub.log silent 282 s, the switcher still in probation (it counts on
`Instant`, which stops while asleep; the hub and the tests count on the
wall clock).

The nightly now runs the gate under `caffeinate -i`, and in both heavy
slots (`heavy-run --alone`): never beside an agent's heavy job (on battery
it waits for AC). The agents' own gates at night can sleep the same way:
`~/.bise/run/heavy-run` is not in this repo, main applies `caffeinate -i`
to every job there (nightly-reds m_23323, architect m_23320).

Open, no owner, below the line unless a user hits it: **two clocks in a
switch.** The switcher's probation (switch.rs `probation`) counts 120 s on
`Instant`, which stops while the Mac sleeps; the hub (hub.log, the REPL
start watch) and the tests count on the wall clock. A probation that spans
a sleep takes longer than its words say ("120 s"), and the hub reports
"no progress in 282 s" for a start that was asleep, not stuck.

## load x1.0 at load 8-9 is right

`wait.load_factor()` is the 1-minute load per core, at least 1: 8-9 on
12 cores is 0.7, so x1.0. It is read at each poll. Not a bug; the 5
timeouts above were the sleep.

## xhub_e2e: a read between two lines of one step

xanswer journals `x_settled` then the `@<project>` message to main, one
write and flush each (daemon.rs `Effect::Journal`). The test waited for
`x_settled`, then read the message at once: at load 7 the read fell
between the two and saw none ("the answer to main: []", 4 s). Green alone.
It now waits for the message, then checks the send settled.

## tui_help_tmux: the list grew past the End page

At 200 columns the End page of /shortcuts now shows the ψ row (the
symbols list grew: ▯, the ✓✓ rows), with its `symbols` heading above the
page. The test typed `worktree` and waited for `has its own worktree`,
which matched the End page before the filter applied (the screen says
`filter: w`). It now waits for `filter: worktree` too.

## repl_start_e2e: one red alone, cause not found

Run alone on 0aefecd2 the same morning: 11 runs (the first in the run
of all 7, 05:32; then 1, then 4 in a loop; then 5 under `caffeinate -i`).
3 red, all in the first 6. Two of them spanned a sleep (hub.log silent
282 s, matching pmset's 05:51:04 -> 05:55:03 and 05:55:48 -> 06:00:03).
The third, 05:32:09-05:34:18, did not: pmset shows the Mac awake from 05:20:30 to 05:51:04, load 3.9.
It failed `follow`'s wait for "the new hub's socket" (120 s) after the
first, slow (8 s a start) reload. Its kept hub (`/tmp/sb-e2e-vnj8xcgk`,
e2e.short_tmp: the agent's own $TMPDIR is too deep) was gone when read
minutes later, so its hub.log and the switcher's lines are lost; the
cause is not known. The next 5 runs under caffeinate were green (187-202
s). Next time it is red: keep the run in a short TMPDIR that nothing
sweeps (`TMPDIR=~/.bise/gate/<name>`), and read hub.log for the new
hub's start and the switcher's `start_failure` line.
