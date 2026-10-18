# 32 · the hub loop runs slow shell work

Status: chunk 1 measured; chunks 1-2 signed by architect (m_30076), chunk 3's
shape signed (b: decide, then the effect), its plan with these numbers sent. Label: hub,
loop. Brief: architect's debt-map v4 (q-go), task hub-loop.

## The problem

The hub's Rust loop (daemon/dispatch.rs `serve`) runs one message at a
time. While it runs slow shell work inline, every agent's `sb` waits; an
`sb` that gives up first is dropped: "sb <cmd> from <agent>: its sb gave
up before the hub took it: not run" (daemon/accept.rs).

His harness hub, 2026-10-17, after hub-tick 975c5750b (12:49):

- 48 commands dropped between 12:49 and 22:10; 25 of them from 8 agents
  between 18:53 and 18:58 (a `sb land` of bp-view, 2 `sb spawn` of main),
  during one Tick: "hub loop busy 30 s on input Tick: wakes look" at
  18:57:16, free after 47 s.
- spells of 5-15 s: 19 on `sb drop`, 10 on `sb spawn`, 6 on `repl line
  <agent>`, 11 on other Tick phases (idle check, wakes look).

## What reading the code says (before any number)

- **wakes look** (daemon/wakes.rs): on the Tick, for every live watch of
  an active agent: `stat`/kill(0) each second, `ps -o lstart` per pid and
  `launchctl list <label>` per job every 10 s, a file's head and tail
  (8 KB) per hit. All on the loop.
- **spawn**: sb-core asks a `need` query `worktree_create`; the hub
  answers it inline in `Hub::core` (core_link.rs `query` → worktree.rs
  `GitEnv::worktree_create`): `git rev-parse`, `git worktree add` (a
  checkout of the whole tree), the config's `copy` files and its `setup`
  command (`/bin/sh -c`, any length), then the step is sent again. Then
  `Effect::Spawn` (repl_starts.rs `spawn_on`: dirs, role.md, the REPL
  process on a supervisor thread).
- **drop**: sb-core asks `worktree_loss` (`git status --porcelain`, `git
  rev-list`) then `worktree_drop` (a backup commit when something would
  be lost: `git add -A` on a temp index, `write-tree`, `commit-tree`,
  `update-ref`; then `git worktree remove` and the task folder). After
  the step (daemon/drops.rs): the agent's `tmp/` removed inline
  (`remove_dir_all`), the worktree sweep and the process reap on threads.

So spawn's and drop's slow parts are git queries sb-core asks for, run by
the shell inside sb-core's step: neither "sb-core's cost" nor an effect
after the decision.

## Chunk 1 · measure (code: crate::spent)

- `crate::spent::Spent`: the parts of one loop message, timed where they
  run: `sb-core` (`Hub::call`), `git <query>` (`Hub::query`), `fx <kind>`
  (each effect in daemon `step`). Nested parts count once (an effect that
  steps sb-core). Reset by the loop watch at each message.
- every `hub loop busy` / `hub loop free` line ends with its split:
  `hub loop busy 12 s on sb spawn from main (git worktree_create 11.2 s,
  sb-core 0.4 s, shell 0.4 s)`.
- `CoreLink::waited` (tests only, bench_step) is gone: bench_step reads
  the `sb-core` part (rule 7).
- daemon.rs: the drop cleanup after a step moved to daemon/drops.rs.
- tests/hub_loop_e2e.py: a throwaway hub, the scripted provider, a repo
  of 8,000 files, 25 tasks, 30 live watches (20 pids, 10 files); main's
  `sb list` every 200 ms during a spawn, a /drop and every watch's event
  at once.

A message that held the loop 1 s or more, never said busy, now says so at
its end: `hub loop held 2.1 s on <msg> (<split>)`.

Numbers (before), tests/hub_loop_e2e.py on 8d8795fad + chunk 1, a loaded
Mac (two heavy jobs beside it), a repo of 8,000 files:

| what | held the loop | split |
|---|---|---|
| `sb spawn --worktree` (t25, setup) | 3.4 s | git worktree_create 3.2 s, fx spawn 0.1 s |
| `sb spawn --worktree` (t26, sampled) | 9.8 s | git worktree_create 9.5 s, fx spawn 0.2 s, shell 0.1 s |
| his `/archive` of t25 | 3.2 s | git worktree_drop 2.5 s, git worktree_loss 0.5 s, shell 0.2 s |
| the Tick of the 29 wake hits | 2.9 s | fx other 1.5 s, fx line 0.4 s, sb-core 0.3 s, shell 0.8 s |

main's `sb list` every 200 ms: 15 samples, median 0.041 s, worst 12.98 s,
4 over 1 s (12.98, 3.03, 5.93, 1.97 s). No `setup` command and no backup
commit in this repo (nothing to lose): the spawn's time is `git worktree
add`'s checkout, the drop's `git worktree remove` and the folder's rm.

## Plan (to sign)

1. **Wakes off the loop** (daemon/wake_look.rs, new): a worker thread
   owns the look (`Look`: cadence, jobs' pids) and a copy of the live
   watches of active agents; the loop sends it a new copy when that set
   changes (after a step, compared by ids + agents). Each second it looks
   (`wake::look`, `Hit::of`, `hit_text` unchanged) and sends
   `Msg::WakeSeen { id, text, rc, tail, after_ms }`; it reports an id
   once and forgets it when a copy without it comes. The loop runs
   `Input::WakeHit` for a `WakeSeen` whose watch is still live. The
   inline `wakes_look` and the Tick's "wakes look" phase are deleted.
2. **Spawn and drop off the loop**: architect's shape (b), its plan in
   the section below once signed.
3. tests/hub_loop_e2e.py in run_all.

## Open question (architect)

The git work of a spawn and a drop is an answer sb-core waits for inside
its step. To take it off the loop, either:

- (a) **park the step**: the hub answers a `need` on a thread and sends
  the input again (with the answer) when `Msg::NeedAnswered` comes back;
  other inputs run meanwhile. Shell only, no wire change. Risk: the
  replayed step meets a newer state (a name taken meanwhile: the
  worktree made for it is an orphan the sweep removes; a drop's agent
  already gone). Bound it: one parked step at a time, later spawn/drop/
  restore inputs wait behind it in the hub;
- (b) **decide first, then the effect**: sb-core places the task as
  "placing", an effect runs the git work, a new input brings the result.
  A new input kind and a law: an sb-core change, not this task's.
