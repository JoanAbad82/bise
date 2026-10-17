---
name: bend-perf
description: Audit and speed up bise's Bend code (sb-core in bend/hub, the agent runtime in bend/runtime) without changing what it does - measure first, find the costly patterns (eager picks, full list walks, string appends, unused fork/join), fix them with the same results and laws. Use when asked to make the Bend code faster, to audit its performance or its use of parallelism, or before optimizing any .bend file.
---

# bend-perf

How to find and fix slow Bend in bise. Same results, same laws: a perf change
never changes what a step answers or writes.

## 0. Read the language first

Run `bend guide` (or `~/.bend/bin/bend guide`) and read "Recursion",
"Parallelism", "IO and Concurrency" and "Under the Hood". Look up any Base def
with `bend base <name>` before relying on how it evaluates. The facts this
audit rests on:

- **Bend is strict.** Every argument of a call is computed before the call.
  `Bool.pick(c, a, b)`, `a && b`, `a || b` (`Bool.and`/`Bool.or`) are plain
  defs, so BOTH sides are computed. Only a `match` runs one branch.
- **A `match` inspects a parameter only.** To branch lazily on a computed
  Bool, pass it to a helper def that matches on its parameter.
- **Strings are cons lists of chars** (`SCon{head, tail}`): `a ++ b` costs
  the length of `a`. Building output by appending is quadratic; build a list
  of chunks and join once (vendor/json's join_chunks).
- **Parallel calls**: `a b = f(x) g(y)` (a parallel let) forks two
  independent pure calls on CPU cores (native build: sb-core and repl-live are
  compiled with `bend -o`, so they run in parallel; the JS target does not).
  The scheduler is a binary fork-join that never moves a task: the two
  halves must cost about the same. A list must be split into halves to
  parallelise a map over it; worth it only when each element is real work
  (a JSON parse, a stringify), never for a cheap fold.
- **`IO.fork`/`IO.join`** run effects concurrently on the event loop: for
  waits (network, processes), not for CPU.
- **A hub step is sequential** (each step reads the state the previous one
  wrote). Parallelism fits only pure bulk work inside one step or one batch.

## 1. Measure (never optimise unmeasured)

sb-core on a copy of a real journal (read-only, its own sb-core):

    B=$(scripts/bins.sh path sb-core)
    /usr/bin/lockf -k ~/.bise/run/heavy.lock nice -n 10 \
      python3 scripts/core_profile.py "$B" ~/.bise/hubs/<hub>/journal.jsonl --out "$TMPDIR"

It prints the boot replay time, a Tick, a `say`, `view_all`, and writes three
`sample` files. In each, the "Sort by top of stack" list names the hot defs as
`WL_FID_<FILE>_<DEF>` (`WL_FID_MODEL_QUEUED_IN` = model.bend `queued_in`);
`rfc_wrap`, `span_fade`, `term_drop`, `heap_alloc_miss` are the runtime's
memory work (many allocations: usually string building).

The Rust side of a step: `SB_BENCH_JOURNAL=<copy> cargo test -p switchboard
bench_step -- --ignored --nocapture` (sb-core vs rust split per step).

The agent runtime (repl-live): `ps -o time` against its age, then `sample
<pid> 5`. If it sits in poll/select, it waits on the network: nothing to win.

## 2. The patterns to look for (cheapest fix first)

1. **Eager pick in a search**: `Bool.pick(c, Some{h}, find(t, k))` or
   `eq(h) || in(t)`: the recursion runs to the end of the list even after a
   hit. Fix: a helper that matches on the Bool and recurses only in the
   False branch. Find them: a def whose own name appears inside a
   `Bool.pick(`, `&&` or `||` on the same line. tests/pick_gate.py already
   refuses the exponential case (the def called twice).
2. **Expensive test first**: `str_in(names, to) && is_queued(st)` compares
   strings for every message, queued or not. Match the cheap test first.
3. **Full walks per step** over everything (all messages, all agents,
   archived included): keep the hot set apart (issue 21's split), or index it.
4. **Appends in a loop**: `acc ++ piece` or `xs <> [x]`: chunks, then one join;
   cons then one reverse.
5. **Pure bulk work done one by one** where the items are independent and
   costly (parsing a batch of journal events, stringifying the view's agent
   rows): split in balanced halves and use a parallel let.

## 3. Change it safely

- One pattern per commit. The same answers: `old_core_replay.py` green, the
  bench_byte_equal digest equal before/after (`SB_CORE_BIN` = each build),
  ALL PROOFS CHECK (a law may unfold the def you rewrote).
- Before/after numbers from core_profile.py in the commit message, same
  journal copy, same load (under the heavy lock).
- Bend rules from `bise-implement` hold: core.bend's line ratchet, laws for
  any changed decision (a perf change changes none).

## 4. Keep the record

Add a dated line to "Audits" below: what was measured, what changed, the
numbers. The next audit starts from there.

## Audits

- 2026-10-17 (architect, page bend-perf): his journal copy, 112,404 events.
  Boot replay 23-30 s (JSON parse about a third, then string appends and
  memory work); Tick 35 ms (model.bend queued_in + STRING_CMP: every message,
  delivered ones too, compared against names); say 15 ms (answer 10.8 KB);
  view_all 2.1 s for 30 MB (quote_string, string appends), at boot and
  restore only. Step answers are small (tick 138 B), not the whole view.
  34 searches in bend/hub walk the whole list (eager pick); zero parallel
  lets or IO.fork in bend/. repl-live: idle in poll (network-bound).
