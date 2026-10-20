# 21 · the hub's hot state carries every message and every agent it ever had

Status: done (2026-10-12, architect m_20128). Step 2 (the Rust mirror)
by hub-lag-7 (2026-10-11, "Done" below); step 1's measure of sb-core by
hot-core (sha 0, "Measure": the boot's growth was the agent walks,
fixed); chunk V (the Rust side of a step: the typed view, the hot sets,
the caches) by hot-view ("Done: chunk V" below); steps 3-4 as one index
by hot-core (sha 1, design B, "sha 1" below): a user line 98 -> 9.9 ms.
Steps 3-4 redone as plan A by bp-hot (d1fe6f8d5, "steps 3-4: the split"
below): say 18.9 -> 2.0 ms in sb-core. Not done: the archived agents
(sha 2), ~86 % of a live tick (A/B: 1.01 -> 0.14 ms without them);
signed, then stopped with the refactors (Gabriel, architect m_30924):
bp-hot ends at sha 1; done by arch-split for the boot-photo brief (chunk
6): a live tick 87.6M -> 2.2M instructions, "sha 2: done" below.
Plan agreed by architect
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

## sha 1: the hot index (hot-core, design B, architect m_20063)

**Profile first.** sb-core alone (python on its link, `{"t":"say"}` to
main, median): 2.2 ms with the message events taken out of the
journal, 15.4 ms with half, 17.1 ms with all. `sample`: term_drop 40 %,
span_fade 13 %, recs_json 11 %, queued_in + str_in + String.cmp 21 %.
The walks over 19k messages were the cost; a throwaway hack (walks read
the last 200) took the fastest user line from 15.3 to 5.9 ms.

**A or B.** A (A1: move cold messages out of `msgs` to an `old` list;
A2: the same, newest first) changes what `msgs` means: the laws
`msgs_unique` and `msgs_kept` ("a message once sent is never removed")
would have to be restated over `hot ++ old`, and ~150 proof sites
unfold `St.msgs`. B keeps `msgs` as every message and adds an index,
`St.hot` (St's 11th field), inside the same owner, kept under a proven
law. B was chosen: the msgs laws stay true in their plain meaning, and
the walks get the same gain. A comes back only if the O(n) left per
message event (below) matters against the stop rule.

**What it is.** `MRec.is_hot` = queued, or owing a reply (`MRec.owes`,
hot-view's 2b: one def for the steps and the view). `St.hot` is a part
of `msgs`, in its order, with the same hot part:
`hot_of(St.hot) == hot_of(St.msgs)`. A message event (sent, state,
settled) sets it to exactly `hot_of(msgs)`; every other event leaves
it. A boot replay (`replay_many`, apply_rev) does not keep it and ends
each batch with `hot_all` (hot = every message): the first version
recomputed it per batch of 100 (731 filters over up to 19k messages,
boot +1.3 s of sb-core); now the first live message event narrows it.

**Who reads it.** model `queued_for`, `unanswered_for` (and `stop_task`'s
rejects through `queued_for`); pause `held`, `woken`, `his`; view
`view_recs` (a step's changed messages: the hot list first, all
messages if an id is missing from it, i.e. a message that just turned
cold; `view_all` and `msgs_json` with `all` send every message, as
before). Lookups by id (`rec_of`, `map_msg`, `reply_of`) still read
`msgs`. The Rust side's 3 cold readers (core_link deliver, board
agent_threads, core.rs card_note) get the same JSON: view_all still
sends every message, a step's view every changed one.

**Laws** (bend/laws/hub.bend, proved in bend/proofs/hub.bend, all
general): `hot_is_the_hot_part` (every St, every event),
`hot_at_init`, `hot_after_replay`, `hot_kept_by_run` (any sequence of
inputs, through `hub_run_replays`), `hot_narrowed` (exact after a
message event); one per walk, walk(hot) == walk(msgs) under the
invariant: `hot_queued_for`, `hot_unanswered_for`, `hot_held`,
`hot_woken`, `hot_his`. `stop_leaves_no_queue` takes the invariant as a
hypothesis and says no message is queued for the stopped task among
*all* messages (with `hot_queued_for`, `queued_for` says the same).

**Numbers** (same run, load ~22, his journal copy, main's sb-core vs
this one):

| step | main | sha 1 |
|---|---|---|
| user line, sb-core alone (median) | 15.7 ms | 4.2 ms |
| user line, bench (sb-core) | 22.1 ms (16.7) | 9.9 ms (4.9) |
| tick, sb-core alone | 0.20 ms | 0.15 ms |
| boot, sb-core CPU (boot_exp / bench) | 8.7 / 7.3 s | 7.3 / 7.9 s (noise) |

`bench_byte_equal`: the same 5 digests (tick, hello, user line,
archive, restore). `old_core_replay` both ways: the journal is
unchanged.

**Done-when: a user line under 5 ms. Reached 9.9 ms** in the hub
(bench), from 98 ms when the slice began (chunk V's Rust work and these
two shas). Why we stop there: what is left is ~4.9 ms in sb-core, mostly
the O(n) `hot_of` over every message on each message event (under the
stop rule: plan A would not gain 10 % of the step, so it stays out),
and ~5 ms on the Rust side building main's context, which must be
current on every user line.

## steps 3-4: the split (bp-hot, plan A, architect m_29535)

sha 1 left ~4.9 ms of a user line in sb-core, mostly the O(n) `hot_of`
over every message on each message event, and the say walks
(`term_drop` + `span_fade` ~52 %, `hot_of` ~31 % of a say in `sample`).
Plan A, now signed: `St.msgs` is gone. Field 3 is `St.hot`, the hot
messages, ids ascending; field 11 is `St.old`, the cold ones, ids
descending (newest first). `HM.every` puts them back together in send
order (the old side with each hot one put in by id, turned around):
what `view_all`, `msgs_unique` and `msgs_kept` read.

**A message event** (`msg_op`, model.bend): on a hot record, the op,
then the ones it made cold go to the old side (`ins_all`); on a cold
record, the op in place, or back to the hot side if it made it hot
(`ins_asc`, `drop_msg`). A new message is the last hot one. Lookups by
id read the hot side, then the old side (`rec_in`, `rec_at`;
`CO.reply_at`: the earliest reply of the two sides, the old side's walk
stopping at the first id not above the message's). Nothing walks every
message on a step any more. `apply_rev`, `msgs_rev`, `hot_all` and
replay.bend are gone: the boot replay is `M.apply` per event
(cold.bend `replay_batch`).

**A reused or older id** would put a message out of send order: the
replay skips a `message_sent` whose id is below `next_msg` and lists it
in `skipped_at` (tests/old_core_replay.py `stale_ids_skipped`). A scan
of his 17 journals and the 2 fixtures (+ old_core_replay's FIXTURE):
31,328 sends, 0 non-fresh ids.

**Laws** (bend/laws/hub.bend, proved in bend/proofs/hub.bend and
bend/proofs/lib/hub-cold.bend, no unsafe): `HI.Split` says the two sides
are right (hot ascending, old descending and all cold, no id on both,
every id below `next_msg`); `split_at_init`, `split_kept_by_run` (every
input kind, through `hub_run_replays` and `msg_ids_fresh`),
`split_after_replay` (the boot's batch) prove it always holds.
`ids_ascending`: every message is in send order. `cold_is_inert`: a
fresh event does to `every` what it did to one list (`HI.apply1`: the
new message last and its reply's settle, a state, a settle).
`msgs_unique`, `msgs_kept` and `stop_leaves_no_queue` take `HI.Split`
(proved by the three split laws) and keep their meaning over `every`;
the walk laws (`hot_queued_for`, `hot_unanswered_for`, `hot_held`,
`hot_woken`, `hot_his`) take it too. sha 1's index laws
(`hot_is_the_hot_part`, `hot_at_init`, `hot_after_replay`,
`hot_kept_by_run`, `hot_narrowed`) are replaced by the split laws.

**Numbers** (his journal copy, 115,168 events, 29,506 messages; base
a800e0f5d vs this sha; sb-core alone on its link):

| step | base | split |
|---|---|---|
| say, median of 14 | 18.90 ms, 97.0M instructions | 2.01 ms, 19.7M instructions |
| say, first | 15.4 ms | 2.3 ms |
| tick after boot | 4.03 ms | 1.81 ms |
| live tick | 1.82 ms, 16.94M instructions | 1.24 ms, 16.85M instructions |
| view_all (31,150,434 bytes both) | 2978 ms | 1393 ms |
| boot replay, machine alone (2 runs) | 8.0 / 8.0 s, 108.6G instructions | 7.5 / 7.9 s, 109.9G instructions |

(load 21-28 but the replay row, run with heavy-run --alone; the
replay's +1.2 % instructions include the runtime's worker spins: wall
time is not worse.) Same answers: 242 steps of replay, view_all, ticks
and says give the same bytes (view_all sha256 equal);
`bench_byte_equal`: the same 5 digests; `old_core_replay` against
v2026.10.2-28, -29 and main: green.

## sha 2: the archived agents (signed by architect m_30761, done: "sha 2: done" below)

**Measure** (main d1fe6f8d5, heavy-run --alone, 2 runs each): his journal
copy against the same copy without the own events (task_created,
lifecycle, reported, declared, file_touched, workspace, snapshot) of the
747 agents that end archived, of 773 (their messages stay): live tick
1.01 -> 0.14 ms (16.84M -> 1.02M instructions), tick after boot 1.01 ->
0.13 ms, say 0.95 -> 0.16 ms (17.7M -> 1.3M). Archived agents are ~86 %
of a live tick: the 10 % rule says do it. A tick sample shows where: the
agent lookups by name (`find` over St.agents) and `agents_json`'s walk of
every agent, and the walks over St.order that look each name up.

**Plan B2** (signed): St.agents keeps the agents not archived, in
creation order; a new St field `arch` (13th, after withdrawn-answer's
`gone`) keeps the archived ones, newest archived first.

- Lookups by name (get_agent, agent_alias/resolve, name_taken, map_agent,
  put_agent) read St.agents, then arch.
- A lifecycle to archived moves the record from St.agents to arch's
  head; out of archived (a restore: 2 in his journal) moves it back to
  its creation place in St.agents (an insert by St.order's position),
  never at the end. Other agent events change it on its side.
- `every_agents` (view_all, the laws) walks St.order by name: St.order
  holds every name, in creation order (today St.agents' names are
  exactly St.order). A step's view (`agents_json` with `names`) walks
  St.agents when every changed name is there, St.order otherwise.
- The walks over St.order that keep only active agents (overlap_others,
  boot.each; check busy.go, resume.pump, retirees) walk St.agents' names;
  mates (live: false wants archived ones) and close_names keep St.order.
- Laws: HI.AgentsSplit (no name on both sides, every arch agent archived,
  every St.agents one not, every name of both in St.order) with
  split_agents_at_init, split_agents_kept_by_run, split_agents_after_replay;
  `live_order_follows_creation` (St.agents is a subsequence of St.order);
  names_apart, name_taken and the agent laws over every_agents under it.
  No unsafe.
- Same checks as steps 3-4: same.py (view_all sha equal), bench_byte_equal,
  old_core_replay -28/-29/main, numbers with instructions; no journal
  change; new code outside core.bend.
- Room: model.bend is at 998 of 1000 lines. Plan: the two-list helpers as
  generic defs (key, update, archived? as parameters, like `find`) in a
  new file model.bend imports, and model.bend keeps thin wrappers;
  maybe_nat_is / maybe_str_is can move to text.bend if that is not enough.

**Follow-up** (architect m_30761, not this sha): St then has 13
positional fields and each new one costs ~110 pattern edits across
model, replay and the proofs: accessors, or a sub-record for the cold
parts (old, arch, gone), so the next field costs one edit.

## Risks

- A cold message that turns hot again (a state event on it): the index
  is recomputed from every message on each message event, so it is
  found; the laws cover any event.
- A reply to a very old message: `msgs` keeps every message, lookups by
  id read it, so routing is the same.

## sha 2: done (arch-split, boot-photo brief chunk 6)

Plan B2 as signed, with architect's calls of m_34135:

- **State.** St's 13th field `arch` (rust/proto core state.rs, core_gen
  blessed): the archived agents, newest archived first; St.agents the
  others, in creation order. bend/hub/agents.bend owns the two-list
  helpers (pre/hit/post: a list cut at a name; ins by St.order's place;
  drop; side, set). No helper record (tests/state_guard.py: a record is
  sb-core state, declared in bise_proto): each agent event computes
  St.agents (`side` True) and arch (False) from the same values, and
  AG.set puts both back, so every other field is the one before by
  computation. Lookups (get_agent, alias_of, name_taken,
  name_held, take's) read St.agents, then arch. A lifecycle to archived
  moves the record to arch's head, out of it back to its St.order place; a
  task_created of an archived agent's name (an older journal; name-free
  renames it first today) takes its place in St.agents.
- **Walks.** A step's view walks St.agents unless a changed name is an
  archived agent's (then St.order, each looked up), view_all walks
  St.order; overlap_others, boot.each and retirees walk St.agents' names.
  busy and resume.pump keep St.order (no lookup per name in busy; resume
  is rare): the same answers, no proof of 'an archived agent is never
  busy' needed.
- **Laws** (bend/laws/agents.bend, proofs/agents.bend, lib/hub-agents.bend):
  split_agents_at_init, split_agents_kept_by_run, split_agents_after_replay
  (HI.AgentsSplit: St.agents holds no archived agent, arch only archived
  ones; any journal); agents_apart_sides (with names apart, no name on
  both sides). names_apart now reads St.agents ++ arch (HI.NamesApart); a
  lifecycle move is a slide of one entry, and NamesOK is kept by a slide
  (Apart is symmetric). The 'agents unchanged' lemmas of hub-1/hub-2
  read both sides (PL1.hub_ag). No unsafe.
- **Not a law** (architect m_34135): St.agents' names in St.order's order,
  and every name of both sides in St.order. A rename to a held name (an
  older journal) breaks the second; under Fresh the proof would go through
  rename_in and the insert, over the budget. tests/agents_split_check.py
  checks both after every event (bend/tests/agents-split-check.bend) on a
  generated journal (archives, restores, live and archived renames, a
  reused archived name) and on his journal copy.

**Numbers** (his journal copy, 134,699 events, retired instructions of
sb-core, measure.py in arch-split's tmp):

| | before (main f03183397) | after |
|---|---|---|
| live tick, median of 200 | 87.61M, 15.4 ms | 2.22M, 0.31 ms |
| say to main, median of 20 | 25.17M, 3.9 ms | 19.84M, 1.7 ms |
| boot replay | 134.4G, 36.9 s | 76.2G, 12.2 s |
| view_all | 36,006,065 bytes, sha 086f1282 | the same bytes, the same sha |

(Before under a shared slot, after with heavy-run --alone: compare the
instructions; the final build's tick 2.22M, say 19.34M, replay 76.3G.)

**Same answers.** core_same on his copy: 273 steps, 0 differing, view_all
sha equal at the middle and the end. bench_byte_equal: main's and this
tree's 5 digests equal (tick, hello, user line, archive designer, restore
designer). old_core_replay against main f03183397, v2026.10.2-43 and -44:
green. The two tags predate the bend pin (bend/VERSION, b5692ae11) and do
not build with today's bend 2.0.37: their sb-core was built with the bend
they shipped with (~/.bend/versions/2.0.35) and given to the same script.
tests/agents_split_check.py: 0 bad events on the generated journal (31)
and on his copy (134,699). PROOF: 17 files, ALL PROOFS CHECK, no unsafe.
