# 28 · a land never checks the merged result

Status: part 1 done (land-check, debt-audit pick 1, plan m_27077 and sha
m_27119 signed by architect; on main at 8046e563e). Part 2 done (every
land that moves main, arch-review pick A, land-every: plan m_28364 and
shas m_28662 signed by architect): a worktree land whose base moved, one
whose base did not, `sb land --here` onto main, `sb feature merge`; see
"Part 2" below. Label: land, gate.

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
- **When** (part 1; part 2 below checks every land that moves main): a
  worktree land whose base is behind main (the merge case), after the
  rebase, inside the land queue's turn: land N is checked on top of N-1
  (`land_check.rs`). Red refuses the land with the step and its error
  lines; the branch stays rebased, the agent fixes and lands again. A
  fast-forward was not checked, nor a `--here` (its land line said
  `· not checked (--here)`; gone in part 2).
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

## Part 2 · every land that moves main (arch-review pick A)

Plan signed by architect (m_28364). 52 commits in 14 days repaired a red
main (clippy 12, generated TS 9, desktop typecheck 7, file limit 6,
word_lint 4): the land check ran only on a worktree land whose base had
moved. Now nothing moves the trunk without `[land] check` green on the
exact tree it will point at. The four ways main moves:

1. **a worktree land whose base moved**: as in part 1, on the rebased tree;
2. **a worktree land whose base did not move** (a fast-forward): checked
   too, in the agent's worktree when `git status` is empty there, else in
   the check tree;
3. **`sb land --here` onto main** (main's checkout): the new commit is
   checked in the check tree after `commit-tree`, before the compare-and-
   swap; red: no ref moves, the files stay as they were;
4. **`sb feature merge`**: the feature rebased in its scratch worktree
   (one that holds merges: merged, `merge --no-ff` onto main's tip),
   then its tip checked in the check tree before the feature's ref and
   main move; red: neither moves.

A `--here` onto any other branch (an agent's `sb/<name>`) stays unchecked,
and a worktree land onto a feature is checked only when the feature moved
under it (as before). No bypass flag; a repo without `[land] check` at the
trunk's tip lands as before.

- **One decision**: `land_check::checked(via, onto_trunk, base_moved)`,
  its 12-row table in land_check.rs's tests.
- **The check tree** (`scratch::CheckTree`, with feature.rs's `Scratch`
  moved there): `<worktrees>/.land-check/<workspace id>/<repo>`, reused
  (a checkout and a clean: ~0.3 s, where a fresh worktree took 2.7 s and a
  cold target), its `owner` file making gate.sh give it a clone of the
  warm cargo seed; must be clean after the checkout or it is made again;
  used only in the trunk's land-queue turn (it takes the turn).
- **Words**: the refusal names the step and its log path, with what did
  not move for each way: `... red at clippy on main + your files (log:
  ...): <errors> nothing landed, your files are as they were: fix them,
  then sb land --here again`.
- **word_lint** joined `gate.sh land`'s steps (tests/*_tmux.py,
  apps/desktop/tests and src, the words catalog, word_literals.txt).
- **e2e**: tests/land_every_e2e.py (a clone of the repo, a throwaway hub,
  the fake provider): each red (clippy, proto_ts, desktop, word_lint,
  line_gate) refused on a worktree land with an unmoved base; line_gate
  refused on the other three ways; main's sha unchanged after each; a
  docs-only change lands on all four.
- **Land wall time** (the e2e's lands, a throwaway hub at load 80-130),
  two runs: docs-only, before (no `[land]` at main's tip) p50 0.83 s /
  0.42 s, max 1.20 s / 0.47 s; after p50 0.96 s / 0.86 s, max 1.37 s /
  1.41 s (+0.13 s / +0.44 s p50: the check tree's checkout and `gate.sh
  land`'s "no step"); refused reds p50 2.17 s / 4.95 s, max 35.8 s /
  70.0 s (clippy, warm target).
- **The desktop red** was refused at `desktop` (main unmoved) in the
  e2e run on land-every's worktree with apps/desktop/node_modules
  installed from the lockfile (`pnpm install --frozen-lockfile --offline`,
  `pnpm check` green); without node_modules the e2e skips it and says so.
  The full gate on e12b6f3bc: Rust, e2e and tmux green (rpc_e2e red in the
  pool, green alone: FLAKY), desktop_check red only on a stale linked
  node_modules (no `three`), green after the real install.
- **Known gap**: nothing removes a project's worktrees folder when the
  project goes, `.land-check/` included (scratch.rs's header says so).
- **Follow-up (feature-merge, 7bda06b10; owner: designer, or whoever
  draws closing words in the window)**: a feature card his pick could not
  run closes with the hub's `handed to main` (`feature::HANDED`); the
  TUI says it through `words::thread::closed_handed("main")`. The window
  draws no closing word on a card yet: it should say `handed to bise`
  (its own word for main, designer m_45201) with the tip `your pick
  couldn't run (<reason>), so main has it, with a brief`, which needs the
  reason on the wire.
