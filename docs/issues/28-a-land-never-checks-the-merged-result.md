# 28 · a land never checks the merged result

Status: done (land-check, debt-audit pick 1, plan m_27077 and sha
m_27119 signed by architect; on main at 8046e563e). Label: land, gate.

## The problem

`sb land` ran no check in this repo. land.rs ran `flow.check` only when
one was configured (the per-user `.switchboard/config.toml`, ignored by
git) and main had moved; this repo's had none. So each land was green on
its own base, and nobody checked the merge.

- a3d52808f: two lands, 1de5fc75f and 51cd16143 (plan-ok's worktree land
  of 3 commits, rebased on a main that already had 1de5fc75f), each
  exported `typeWords` from InboxCard.tsx. Each built alone; main's tip
  e9c7085a9 did not (vite: "Multiple exports with the same name").
- f6db6e1d2: apps/desktop/src/proto stale on main: proto_ts red.
- 14 commits in 7 days say "red on main"; land-reds exists to chase them.

## Done when

(a) On a throwaway repo, two branches that each add the same TS export
(and the same Rust fn) both land from worktrees: the second is refused
with the step's words, and main still builds. (b) A docs-only land runs
no step and adds no time. (c) A rust/proto change without a regenerated
apps/desktop/src/proto is refused. (d) The quick gate is green; one full
gate is green except the known reds file's entries. (e) The land check's
time on 5 real lands is reported. No regression in the land e2e tests;
the land queue's order and words are unchanged.

## What it does

- **`tests/gate.sh land <base> <head>`**: the fast steps that are always
  green on main, for the paths `<base>..<head>` touches only: `line_gate`,
  `clippy -D warnings` (quick's command, in its warm `$target/clippy`),
  `proto_ts`, `desktop` (`pnpm typecheck && pnpm build`; no
  node_modules: installed from the lockfile; no pnpm: red, never a
  skip), `office_check`, `kit` (the kit's node checks). No e2e, tmux,
  PROOF or vitest: the quick/full gate and the nightly keep them. The
  path -> step map is one function, `map_paths`, that quick calls too.
  A docs-only land: `GATE land GREEN (0s): no step for these paths`.
- **Where the command lives**: `bise.toml` at the repo's root, tracked
  (`[land] check`), read from main's tip (`git show <base>:bise.toml`,
  `flow::land_check`): every checkout sees it, and a branch cannot switch
  off the check it is checked by.
- **When**: a worktree land whose base is behind main (the merge case),
  after the rebase, inside the land queue's turn: land N is checked on
  top of N-1 (`land_check.rs`). Red refuses the land with the step and
  its error lines; the branch stays rebased, the agent fixes and lands
  again. A fast-forward is not checked: no merge happened, the agent's
  own gate ran on that tree.
- **`--here` is not checked** (architect m_27077): checking it needs a
  checkout of the commit (a cold target, no node_modules) inside main's
  queue turn, and worktrees are the default (shared-guard). Its land
  line says `· not checked (--here)` when the repo has a land check.
- **Known reds**: `tests/known_reds.txt` (test, since, owner, why), read
  by `tests/known_reds.py`. The full gate (its e2e/tmux reds) and
  test:land (its red checks) say which reds are known and which are NEW;
  their rc does not change. The land check has no known reds.

## Done-when, checked

- (a)(b)(c): a throwaway hub (fake provider) on a clone of the repo,
  every land a real `sb land` from an agent's worktree. Two branches each
  adding `export function probeWords` to apps/desktop/src/thread/tab.ts:
  the first fast-forwards (no check), the second is refused `red at
  desktop` (TS2323 Cannot redeclare exported variable 'probeWords'), main
  unmoved and `gate.sh land` green on it. The same with `pub fn probe_fn`
  in rust/switchboard/src/util.rs: `red at clippy` (E0428). A docs-only
  land on a moved base: no step. A rust/proto doc line without
  regenerated apps/desktop/src/proto: `red at proto_ts`. The run takes
  ~3 min (a clone, a hub): a one-off, not a test in tests/ (architect).
- (d) quick green; the full gate on dfaca0f55 (load 22): 3 reds;
  tui_keep_state_tmux and tui_inbox_split_tmux green alone (gate.sh
  rerun); wake_deliver_e2e red alone and on the base 3f4c38292 without
  this change: now in known_reds.txt.
- (e) `gate.sh land` on 5 real lands (their own worktree's warm target):

  | land | paths | steps | seconds |
  |---|---|---|---|
  | 478e2e1a0 (words-settings) | rust/proto | line_gate, clippy 9, proto_ts 40, desktop 9 | 58 |
  | 1ee1e71a6 (words-lead) | tests/word_lint.py | line_gate | 0 |
  | 10bdb35c5 (words-lead) | tests/word_lint.py, word_literals.txt | line_gate | 0 |
  | 35d1235d0 (words-lead) | tests/word_lint.py | line_gate | 0 |
  | 8046e563e (land-check) | rust/switchboard, apps/desktop, tests | line_gate, clippy 12, desktop 8 | 20 |

  Plus the gate's start (its folder, logs and the sweep of dead runs):
  5-12 s at load 20-25. A land with no step now ends before it (0.25 s;
  it took 9 s through the setup). A cold worktree's desktop step (pnpm
  install from the store, then typecheck and build): 18-19 s, the
  install ~4 s of it.
