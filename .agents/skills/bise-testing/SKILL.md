---
name: bise-testing
description: Read before you write, change or delete a test in the bise repo. Says which test to write for what you check (a Bend law, a Rust unit test, a desktop feature test, a TUI render test, and an end-to-end test only when nothing else can see the break), where it goes, how to run it fast and its time budget. Use for every new test, every test fix, and every time you think "I need an e2e for this".
---

# bise-testing

The fast loop decides how fast we ship. An agent that waits 10 minutes for a
check makes 6 tries an hour; at 10 seconds it makes 300. So every test you
write must be as cheap as it can be while it still fails on the break.

The rule: **pick the cheapest test that can fail on the break.** End-to-end
tests are slow, flaky and run only after the land: use one only for a path
across real processes that nothing else can see. Anything else gets a cheaper
test.

## Which test

| you want to check | the test | where | run it alone | budget |
|---|---|---|---|---|
| who is woken, told, queued; an invariant of the hub or the runtime | a Bend law and its proof | `bend/laws/<area>.bend`, proof in `bend/proofs/<area>.bend` | `python3 tests/proof_run.py . 4 $TMPDIR/proof` | a proofs file < 30 s |
| a pure function of a Rust crate (parse, pick, format, a state step) | a Rust unit test, next to the module | `rust/<crate>/src/<mod>_tests.rs` or a `#[cfg(test)]` mod | `cd rust && cargo test -q -p <crate> --lib <name>` | < 1 s per test |
| what the TUI draws for a state, a key's effect on its state | a TUI render test on ratatui's `TestBackend` (`sb::bench::test_app()`) | `rust/tui/src/*_tests.rs` (e.g. `feed_render_tests.rs`) | `cd rust && cargo test -q -p bend-tui --lib <name>` | < 1 s per test |
| what a desktop screen shows and sends for given core/hub events and his gestures | a desktop feature test on typed inputs | `apps/desktop/tests/feature/<screen>.feature.test.ts` (`feature().given(...).does(...)`, then `view.<screen>()` and `sent()`; inputs from `inputs.ts`, shaped like `rust/proto/fixtures`) | `pnpm -C apps/desktop exec vitest run tests/feature/<file>` | < 1 s the file's tests |
| a desktop pure module (a model, a sort, a reducer), a component | a vitest unit test, next to the module (a DOM one starts with `// @vitest-environment happy-dom`) | `apps/desktop/src/**/<mod>.test.ts(x)` | `pnpm -C apps/desktop exec vitest run src/<path>.test.ts` | < 1 s the file's tests |
| the same fact drawn the same by the TUI and the window | one test: the same proto fixture into both renderers, the outputs compared | the feature test + the TUI's `TestBackend` | both commands above | as above |
| a wire format between Rust, Bend and TS | a codec test on a fixture | `rust/proto/fixtures/*.jsonl`, `rust/proto/tests/core_fixtures.rs` | `cd rust && cargo test -q -p bise-proto` | < 1 s per test |
| a repo script (gate, heavy-run, pick, release tools) | a Python unit test with no process it does not own | `tests/<script>_test.py` | `python3 tests/<script>_test.py` | < 5 s the file |
| a path across real processes that nothing above can see (list below) | an end-to-end test | Playwright `apps/desktop/tests/checks/`, `tests/*_tmux.py`, `tests/*_e2e.py`, as-he-does | not before a land: the tip gate runs it | < 30 s each |

The quick gate (`tests/gate.sh quick`: seconds warm, minutes under load) runs the cheap layers of
what you changed. Iterate with the single-test commands, then the quick gate,
then `sb land`.

## When an end-to-end test is the right one

A **KEEP** (docs/test-plan-min.md's word): a real path across processes that
no unit or integration test can see. Only these:

- hub ↔ REPL ↔ TUI across a real socket or PTY (a message sent, delivered,
  answered; a stall, a flood, an interrupt, a restart of one side);
- app ↔ core ↔ hub (a real core process dies and comes back; nothing lost
  across a quit and relaunch on the same userData);
- install, update, release, version skew between an older and a newer side;
- signing, the keychain, socket auth, the sandbox;
- the window server and the Mac itself: notifications, the badge, keys, the
  capsule, dictation, a real Electron frame and its CSP.

Everything else is a **TRANSFORM**: what it asserts can be checked without
launching the app, the hub or tmux. A screen fed with hub data is a feature
test on fixtures; the hub's decision is a law. A **DELETE** duplicates
another test or a law, or checks nothing that matters. Unsure between KEEP
and something cheaper: ask yourself which process boundary the break lives
on. No boundary, no e2e. The kept list, test by test, is the KEEP rows of
docs/test-plan-min.md; a new e2e test adds its row there with its reason.

A pure look (a pixel, a gap, a color) is not a check: it goes to the
designer's shots after the land, or comes back as a computed check of its
own (a measured box in a feature test), never as a new Playwright spec.

## Rules

1. **No real world in a unit test**: no `sleep`, no real process, socket,
   PTY, tmux, Electron, network or wall clock. Time is an input (`later(ms)`,
   a clock you pass in); a process is a fake that answers from a fixture.
2. **Time budget**: each test stays under its row's budget. Over it, make
   it smaller or move its loop out (a fuzz or exhaustive run is cut to a
   few hundred cases per commit; the full count runs on main, `FUZZ_RUNS`).
3. **Each test fails on its break**: once, before you land it, break the
   code it guards on purpose (flip a condition, drop a line) and see it go
   red, then put the code back. Still green: fix the test until that break
   turns it red; if it can't, delete it (never kept "for coverage"). Say
   the mutation in your commit body.
4. **Test what he sees or what crosses a seam**, through the module's own
   function (a feature test reads `view.<screen>()` and `sent()`), never a
   copy of the logic re-derived in the test.
5. **Fake data only**: fixtures, the fake provider, a throwaway hub. Never
   the user's real accounts, hub or browser.
6. **One fact, one place**: before you add a test, look for the law or the
   test that already checks it (`rg` its words). A second check of the same
   fact is a DELETE.
7. **E2E only on main** (AGENTS.md, docs/loop-speed.md §0 rule 11): before a
   land, `tests/gate.sh quick` and nothing end-to-end, even when a brief
   names one. The tip gate runs the e2e, tmux and desktop checks on main's
   tip; as-he-does runs in the nightly and a release. Put your land sha in
   your report and watch the tip gate's result for it. Red on your sha:
   revert on main first, then fix and land again.
8. **A flaky test is a bug**, never a retry loop or a longer sleep: find the
   race (the order of two events, a clock) and make it an input. A line in
   `tests/known_reds.txt` needs a measured why (green alone at N load, or
   the cause), an owner who agreed, and review-gates' sign; it leaves when
   fixed. It is never where a red goes to be forgotten.
9. **No UI words hard-coded past their count** (`tests/word_lint.py`): read
   the word from the module that owns it.
