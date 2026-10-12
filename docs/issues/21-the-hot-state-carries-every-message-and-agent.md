# 21 · the hub's hot state carries every message and every agent it ever had

Status: step 2 (the Rust mirror) done by hub-lag-7 (2026-10-11, see "Done"
below); step 1's measure of sb-core done by hot-core (sha 0, "Measure"
below: the boot's growth was the agent walks, fixed); chunk V (the Rust
side of a step: the typed view, the hot sets, the caches) done by
hot-view ("Done: chunk V" below); steps 3-4 next, retargeted on
sb-core's share of a user line. Plan agreed by architect
(m_15238). Found by hub-fifo (2026-10-09). Label: hub, perf. Follows
bcca8231 (one pass per step) and hub-fifo's inbox lanes and state throttle.

## The problem

Every step of the hub costs O(agents × messages) or O(messages), and both
only grow. On his harness hub (journal copy of 2026-10-09: 53,391 events):

- 474 agents, 450 of them archived (95 %);
- 14,658 messages, 14,656 delivered, 2 rejected; 33 settled by a reply.
  Nearly all of them can never change anything again: delivered, and no
  reply owed (or the reply came).

Yet each step walks them:

- **sb-core** (`bend/hub`): `St.msgs` is one list of `MRec` (model.bend);
  the owed-reply, queued and waiter checks filter the whole list
  (model.bend `MRec.settled`, the filter near line 749), and an agent is
  found by a walk of a list that holds the 450 archived ones too.
- **the Rust mirror** (`core::Hub.st`): `Waiting::of` walks every
  message for each snapshot (board.rs), `State::unanswered_for` does too
  (model.rs), and `Group::of` builds a roster row for each of the 474
  agents; the snapshot sends archived rows that never change.
- **the boot** replays all of it (issue 15).

bcca8231 made each of these walks happen once per step instead of once per
agent; hub-fifo made the snapshot go at most 10 times a second and put
the clients ahead of the REPL lines. The walks themselves are still as
long as the history.

## The idea

Split the state into a hot part, what a step can change or must read, and a
cold part, what is only history. The journal does not change (law
`hub_run_replays`): it stays the durable truth; only memory is split.

- A message is **cold** when it is delivered or rejected, and owes no
  reply (`expect_reply` false, or settled). Everything else is hot: queued,
  or owed.
- An agent is **cold** when archived. A restore makes it hot again.

### sb-core (`bend/hub/model.bend`, `core.bend`, `view.bend`)

1. `St` gains `old: Cold` next to `msgs` and `agents`. `Cold` keeps, per
   message, only what a later step can ask about: `id → (from, to,
   thread)` (a `reply_to` an old message names its thread and its asker),
   and per archived agent its whole `Agent` (a restore, `sb list
   --archived`, the names a new task may not reuse).
2. A message moves to `old` the step it turns cold (`message_state`
   delivered with no reply owed, `message_settled`); the replay does the
   same as it reads the journal, so a boot builds a small hot state.
3. The checks that walk `msgs` (owed replies, queued inputs, waiters)
   walk the hot list only; a lookup by id tries hot, then `old`.
4. `lifecycle archived` moves the agent to `old`; `restore` moves it back.
   Name checks (a new task's name, a rename) look in both.
5. `view.bend`: `msgs` and `agents` are the hot ones. `all_agents` (the
   TUI's /archived, `sb list --archived`) adds the cold agents, built once
   and only when asked.

Law (LAWS.bend): **`cold_is_inert`**: for any journal, a run with the
split
and a run with everything hot give the same effects for every input
(the same journal lines, the same says, the same view minus the cold
rows). PROOF.bend checks it on generated histories.

### Rust mirror (`core.rs`, `board.rs`, `model.rs`)

The first measure (hub-fifo, bench_step on his journal copy: 475 agents,
25 active, cargo test build, load ~8): per REPL tool line, Hub::handle
32.0 ms, of which `refresh_contexts` 23.8 ms; Hub::snapshot 53.0 ms (the
state gate already caps it at 10 a second). So the Rust side dominates,
and inside it the contexts (architect m_15341):

5b. **Contexts when their inputs change, not at every input.**
   `Hub::refresh_contexts` rebuilds every active agent's context (main's
   and each task's, board.rs) on every input, while a context is only
   read when that agent's REPL calls its model. The REPL re-reads
   `BEND_CONTEXT_FILE` before every model call (bend/runtime/main.bend,
   near line 899) and the hub writes that file (`Effect::Context`,
   context.txt, atomic rename), so the context must be pushed, and the
   pick is: rebuild an agent's context only when its inputs change, a
   fingerprint of the roster rows it sees and of its waiting messages
   (main's: its own inputs), not per line. If the read path turns out
   lazier than this, build it at the next request instead, at most once
   per change. Byte-equal check: the context a model call SEES is the same
   as today's at the moment of the call (not at every input).
6. `State.msgs` holds the hot messages only (the view sends nothing
   else); `Waiting::of` and `unanswered_for` are then O(hot).
7. The archived agents' rows: built once when the view sends them
   (`all_agents`), kept until an agent's lifecycle changes, instead of
   each snapshot.

### What does not change

The journal, the transcripts, `sb inspect` and `sb history` (they read the
transcripts, not the state), the clients' protocol (the snapshot keeps
the same fields; archived rows still come when asked).

## Order (one sha each, the same proof each time)

1. **Measure** first, on a copy of his journal (bench_step, now that
   test_home keeps SB_BENCH_JOURNAL): a step's time split into sb-core and
   the Rust side, for a tick, a REPL line and a user line, and how it grows
   with the history (half the journal vs all of it). If sb-core's share is
   small, steps 3-4 wait and 2 goes first.
2. Rust mirror: 5b (the contexts) first, then 6, 7; then the snapshot's
   53 ms is the next target. No Bend change.
3. sb-core messages (1-3, 5) with `cold_is_inert`.
4. sb-core archived agents (4, 5).

Each sha: before/after numbers from bench_step on the copy, and the
byte-equal check bcca8231 used (old and new code on the same journal
copy: the same snapshot JSON, the same agent contexts, the same rosters,
after a tick, a hello and a user line). Gates: quick, PROOF, proto_e2e,
tui_queue_tmux, tui_archived_tmux.

## Architect's conditions (m_15238)

1. **The wire stays as released.** The hub's `agents` state and the older
   state events keep sending the archived rows exactly as today (an older
   desktop core and the TUI's '▸ N archived' read them): they are only
   built once and cached until a lifecycle changes. The byte-equal check
   of each sha is the guard for this.
2. **sb-core shas**: PROOF (ALL PROOFS CHECK) with `cold_is_inert`;
   `old_core_replay` both ways (the journal is unchanged: the released
   core must replay what the new core wrote, and the new core what the
   released one wrote); a boot-time number on his journal copy, before and
   after (issue 15).
3. **The cold index keeps whatever a later op can name**: id → from, to,
   thread, plus expect_reply and settled if any path can still ask. The
   issue lists those paths and how each was checked, so 'nothing asks'
   is shown, not assumed. Paths to check: `sb wait <id>` on an old id, a
   late reply (`reply_to` an old message), a card that cites a message
   (`for_msg`), `sb inspect`/`sb history` (transcripts: no), the
   undelivered and queue marks of the clients, x-hub `x_ack`/`x_reply`.
4. **Measure, ship, re-measure.** If the measure says the Rust side
   dominates, step 2 ships alone and the history is measured again before
   sb-core is touched. Stop when a step's gain on his journal is below
   ~10 % of a tick.

## Done (hub-lag-7, after his hub ran 1-2 min behind on 2026-10-11)

- 5b: contexts.rs keeps the contexts; the message parts until
  `State::msgs_rev` moves (one writer, `put_msg`), a task's only when its
  roster rows, parent or messages changed. His journal copy: Hub::handle
  per REPL tool line 33.2 -> 2.4 ms, a tick 31.3 -> 3.5 ms.
- 7: snapshot_rows.rs keeps each agent row with the inputs it read. A
  snapshot 59 ms from nothing -> ~11 ms kept (0 of 514 rows rebuilt).
- Outside this plan, found by a `sample` of hub_flood_e2e's hub: per REPL
  line the daemon built a whole snapshot (`proto_agents_again`, with 2-3
  `git` subprocesses in `feature_views`) and Hub::core ran `git
  rev-parse` (`is_git`). Now a moved head marks the state gate, GitEnv
  keeps `is_git` (10 s, cleared by its worktree ops), the trunk's name
  comes with the features' facts (a land, the tick every 60 s).
  hub_flood_e2e's lag_and_burst: 400 lines/s from 31 REPLs starting at
  once, the lane's lag stays under 1 s (it grew to 5 s before).
- Later (architect m_18690): sb-core gets `git` with every input
  (`input["git"]`); it already has the `{need}` protocol for git, so
  once core-schema's B chunk is in, `git` should be a need of the few
  inputs that use it, and the memo can go.
- Still per line: main's context.txt write (its activity changes at
  every tool line; the file must be current at the REPL's call), ~4 %.

## Not in this slice

- **The sb CLI ↔ hub seam (agent.sock) is untyped too** (architect
  m_19661, found by hot-view's sha 1): `AgentReq::from_json`
  (rust/switchboard/src/core.rs 294-495 at f9f0ff3b) parses every `sb`
  subcommand by key, 79 string-keyed reads of 50 distinct keys over 28
  commands, and each new `sb` subcommand copies it. The next
  typed-seam candidate: cli.rs's requests and `AgentReq` declared in
  `bise_proto`. The done-when grep of this issue is about sb-core's view
  only ("no string-keyed read of sb-core's view"): those reads are this
  other seam's.

## Measure (hot-core sha 0, 2026-10-12)

bench_step on a copy of his journal (73,101 events; 529 agents, 34
active; 19,474 messages, 8 of them hot), debug build, load 20-27.
sb-core's share is the wait on `CoreLink::call` (a test-only counter,
`CoreLink::waited`); the rest is the Rust side.

| step | half (36,550 events) | all, before | all, after sha 0 |
|---|---|---|---|
| boot (`Hub::replay`) | 19.9 s (sb-core 19.0) | 72.8 s (sb-core 71.0) | 11.2 s (sb-core 10.0) |
| tick | 13.3 ms (sb-core 1.6) | 10.0 ms (sb-core 0.5) | 9.1 ms (sb-core 0.45) |
| REPL tool line | 3.9 ms (sb-core 0) | 7.7 ms (sb-core 0) | 5.5 ms (sb-core 0) |
| hello + its snapshot | 123 ms (sb-core 0) | 185 ms (sb-core 0) | 134 ms (sb-core 0) |
| user line to main | 49 ms (sb-core 26) | 98 ms (sb-core 25) | 67 ms (sb-core 17) |

(Medians of 10 at a load of 20-27: the Rust numbers move 20-30 % from
run to run; sb-core's did not change between half and all.)

**The boot grew with the agents, not the messages.** sb-core's CPU time
per 5k events, the same batches sent to it alone (python on its TCP
link, `ps` cputime): `ping` (parse only) 15.5 s in all, flat;
`replay_many` 43.6 s, from 0.4 to 7.3 s per 5k; `replay_many` with the
message events taken out (33,759 events left) 79 s, up to 18 s per 5k.
Cause: model.bend's `map_agent` was written with `Bool.pick`, which
computes both branches. Each agent event (reported 11.8k, declared 6.9k,
file_touched 4.1k...) ran its op on all 529 agents (`OFile` walks each
one's files) and walked to the end of the list.

**sha 0** writes it with a `match` that stops at the hit (the pattern
`map_msg.fast` already used): `map_agent.go`. After, at load ~15: a
boot's sb-core CPU 7.6 s, flat (0.3-0.6 s per 5k), against 6.4 s for
the same lines sent as `ping` (parse only): the replay costs about its
parse. The bench at load ~16: boot 7.5 s, tick 4.1 ms (sb-core 0.19),
REPL tool line 3.0 ms, hello + snapshot 68 ms, user line 49.8 ms
(sb-core 16.0). The value is the same (the old pick returned the hit
and dropped the other branch): the 9 proof steps that unfolded
`map_agent`'s body (hub_prof_map.pick and the two rename proofs) now
unfold `map_agent.go`, the laws untouched, ALL PROOFS CHECK (59 s
unsplit); and
`bench_byte_equal` (an ignored test: the snapshot JSON, every agent's
context and every roster after a tick, a hello, a user line, an archive
and a restore) gives the same digests with main's sb-core and this one.

**What this changes for steps 3-4.** The boot no longer grows with the
history, so cold messages gain little there. Their target is now
sb-core's 17 ms per user line: profile that step first (architect
m_19654); `Cold` only if the 19k-message walks are its cost. On a tick
sb-core is 5 % (stop rule: steps 3-4 cannot gain 10 % of a tick). The
rest of a user line (~50 ms), of a tick, a tool line and a hello is the
Rust side (chunk V).

### Bool.pick walks left (tests/pick_gate.py)

A `Bool.pick` with one branch that calls its own def and one that stops
never stops. A filter (both branches on the tail) is not one: the runtime
shares the call (a 26-element filter: 0.06 s). `tests/pick_gate.py`, in
the quick gate, refuses a new one; `tests/pick_gate.list` holds the 43
left and only shrinks. Hot = on the path of a common step or of the boot,
over a list that grows.

| walk | list | hot |
|---|---|---|
| model `find` (`agent_named`, `rec_of`, `card_of`) | agents, every message, cards | **yes**: every lookup by name or id walks to the end (left as is in sha 0: ~20 proofs unfold its pick) |
| model `map_msg` | every message (19k) | **yes**: each `message_state`/`settled` of a live step |
| core `reply_of` | every message | **yes** for `sb wait` |
| core `rt_find`, `rt_put`, pause `rt_of` | the REPL runtimes | **yes** if the runtimes keep every agent: `agent_json` calls `rt_find` per agent sent (view_all: 529 x) |
| model `agent_alias` | every agent x its aliases | **yes** on a name lookup that misses |
| timers `find`, `put`, `act_find`; wakes `find` | timers, acts, watches (kept after they stop?) | to check in the profile |
| model `put_agent`, core `unique_name.go`, `strip_dash.go` | agents, a name | no (task creation) |
| model `drop_card`, `card_holding`, core `question_card` | open cards | no (a few) |
| core `waiter_pick`, `waiter_drop`, `wake_ans`, `first_from`, `get_key`; view `waits_on` | waiters, one agent's questions, a JSON object | no (short) |
| xhub-model (8 walks) | cross-hub routes and messages | no (2 on his hub) |
| vendor json `get_kv`, `set_kv`, `remove_kv`, `insert_kv_go` | one object's keys | no (short, but everywhere: the codecs) |
| core/image, core/wire, runtime/gate-pure, vendor/http (6) | REPL-side, short | no |

## Done: chunk V (hot-view, 2026-10-12)

The Rust side of a step, on the same journal copy (529 agents, 19,474
messages, 8 hot). Each sha: bench_step before/after, `bench_byte_equal`
(the same digests with old and new code), quick gate; signed by
architect.

- **sha 1 (c0e44eba): sb-core's view is typed.** `bise_proto::core::view`
  (View, ViewAgent, ViewMsg, declared with `core_records!`) generates
  `bend/hub/gen/view.bend`; `load_view` (core_view.rs) decodes it once.
  No string-keyed read of the view is left. A view that does not decode
  is logged and the step's effects still run.
- **sha 2a (06598d81): `board::Threads`**, kept by `State::put_msg`
  (one writer): `agent_threads` 31.6 -> 0.41 ms.
- **sha 2b (fba1f7d5): sb-core says which messages are hot.** ViewMsg
  gains `queued` and `owes`; view.bend calls `M.is_queued` and
  `MRec.owes`, the one def the steps' `unanswered_in` calls too, so the
  rule cannot drift. The Rust predicates are gone; `Waiting` walks the
  hot set (`State::hot()`): 9.4 -> 0.55 ms.
- **sha 2c (1c5b87ce): caches deleted where fresh is cheap.** contexts.rs's
  questions cache, snapshot_rows' message part and `State::msgs_rev`
  (hub-lag-7's 5b keyed on it): each built fresh is under 1 ms.
- **sha 2d (this one): contexts.rs's per-task cache goes.** `refresh`
  builds every context fresh and pushes the texts that changed. Same
  inputs, 30 activities: cached 5.56 ms median, fresh 5.34 ms.

| step | before V (hot-core sha 0 bench) | after 2d |
|---|---|---|
| tick | 10.0 ms (Rust 9.5) | 6.3 ms (Rust 5.6) |
| REPL tool line | 7.7 ms | 4.5 ms |
| hello + its snapshot | 184.6 ms | 67.5 ms |
| user line to main | 98.3 ms (sb-core 24.7 + Rust 73.6) | 22.2 ms (sb-core 15.8 + Rust 6.4) |
| contexts from nothing | 45.3 ms | 4.0 ms |
| snapshot alone (kept rows) | 14.5 ms | 12.2 ms |

(Debug build, `heavy-run --alone`, machine load ~30: Rust numbers move
20-30 % between runs. A flood of 1000 tool lines: 4.2 ms per line.)
PROOF shards alone, main vs 2b: 21/15/9/31 s vs 22/12/10/25 s (the
122 s of one quick gate was load).

**Done-when "<5 ms per input":** met for a REPL tool line (4.5 ms). Not
met for a tick (Rust 5.6 ms) nor a user line, whose 15.8 ms is sb-core's
(steps 3-4, hot-core's profile). **Why V stops here:** what is left of
the Rust side per input is main's context (`status_block` ~1 ms,
`Group::of` ~0.9 ms), each under 10 % of a tick (architect's stop rule);
the snapshot (12 ms) is off the tick path, behind the state gate. Still
reading cold messages on the Rust side, named in State's header: core_link
`deliver`, `board::agent_threads`, `core.rs` `card_note`.

## Risks

- A cold message that turns hot again: none today (a delivered message
  owing no reply has no further state); the law would catch a new one.
- A reply to a very old message: the cold index keeps its thread and
  asker, so routing is the same.
- Boot: the replay moves messages as it goes, so a boot ends with the
  small state (issue 15 gets faster too, not measured yet).
