# 15 · a hub's boot replays the whole journal

Status: done (hot-core, issue 21 sha 0, 2026-10-12): the boot grew with
the agents, not with the runtime's age; fixed, see "Done" at the end.
Found by `hub-boot-hang` (2026-10-07). Label: hub, boot.

## The problem

Each hub start sends the whole journal to sb-core (`Hub::replay`,
`replay_many` batches). The time grows with the journal, and more than
linearly. On the harness workspace (37.7k events, 16 MB), on 2026-10-07:

- idle machine: ~10 s (hub.log, pid 62062: `journal read` 08:46:48.2,
  `journal replayed` 08:46:58.7);
- load 15-40 (cargo gates, Spotlight): more than 25 s. Before
  `hub-boot-hang`, the switcher killed a hub after 20 s with no new
  hub.log line. A switch to 3981c229 failed for this reason, then its
  rollback failed too, and no hub ran for 68 min.

`hub-boot-hang` made the boot report its progress (`journal replay n/N
events`, crate::boot), made the switcher wait while it moves, and made a
rollback leave a slow hub booting. The boot itself is still as long.

## Measurements (sb-core f22007bd, a copy of the journal, load ~12-22)

Time to replay, by events per `replay_many` line: 5000 → 22.7 s, 500 → 17.0 s,
100 → 11.6 s, 50 → 13.8 s, 20 → 12.7 s. REPLAY_BATCH is now 100.

Seconds per 5k events grow along the replay (batch 500): 0.39, 0.95,
1.54, 2.10, 2.27, 3.75, 4.0. The journal's bytes per 5k events are flat
(2.1-2.9 MB).

Most of it is not `apply`. The same lines sent as `{"t":"ping","evs":[..]}`
(sb-core parses the line and does nothing) take 15.5 s out of 17. The
same 5k events sent 7 times also get slower: 0.32 s, then up to 2.04 s
per 5k. So the slowdown grows with the work the sb-core process has
already done, not with the state. It looks like something in the runtime
(heap, GC, the socket line reader). Not found yet. Architect (m_10760):
it looks like the Bend allocator aging that repl-cpu-3 found in
repl-live (m_9899, the age.bend repro). sb-core is a long-lived Bend
process too, so the allocator fix would help both the boot and sb-core's
steady CPU. A snapshot alone does not cure the aging.

## What to do (not in hub-boot-hang)

1. Find why the parse in a long-running sb-core gets slower (the runtime
   or the TCP line reader). It may be the biggest win, and it would also
   speed up a hub after its boot.
2. A state snapshot: sb-core writes its durable state every N events
   (`snapshot` line, owned by sb-core: architecture rule 2), and a boot
   replays only the events after the last snapshot. Open questions:
   - old_core_replay: a rollback to an older sb-core that cannot read a
     newer snapshot must replay the whole journal (a version field on the
     snapshot, the full replay as the fallback);
   - the laws: a replay from a snapshot must give the same state as a full
     replay (a LAWS.bend law, the PROOF over sampled journals);
   - the Rust mirror (`Hub::view_all`) and the hub's own lines
     (`forge::is_pr_line`) still read the whole journal, or get their own
     snapshot;
   - `Revive` (BISE-292) restarts sb-core on the journal: from the
     snapshot too.

## Done (hot-core, issue 21 sha 0, 2026-10-12)

The growth was not the runtime: it was model.bend's `map_agent`,
written with `Bool.pick`, which computes both branches. Each agent event
of the replay (reported, declared, file_touched: 23k of his 73k events)
ran its op on every agent (529: `OFile` walks each one's files) and
walked to the end of the list. It now stops at the hit (`map_agent.go`).

His journal copy (73,101 events, 529 agents, 19,474 messages), debug
build:

- `Hub::replay` (bench_step, load ~25): **72.8 s -> 11.2 s** (sb-core's
  share 71.0 -> 10.0 s); the half journal took 19.9 s before.
- At load ~16: `Hub::replay` 7.5 s (sb-core 6.6 s).
- sb-core alone, CPU time of the same batches (load ~15): `replay_many`
  43.6 s before, growing from 0.4 to 7.3 s per 5k events; after, 7.6 s,
  0.3-0.6 s per 5k, flat. The same lines sent as `ping` (parse, nothing
  applied): 6.4 s. **What is left of a boot is the JSON parse of the
  journal**, linear: the replay costs no more than reading it.
- The rest of a boot: `view_all` (the whole state for the Rust mirror,
  19 MB on this copy: 1.05 s in sb-core, then its parse in the hub) and
  the hub's ~1.2 s on its side. Issue 21's cold messages would shrink
  `view_all` to the hot ones.

So the "what to do" above is not needed now: no aging to find (1), and a
snapshot (2) would save at most the parse, ~8 s of CPU on a 73k-event
journal. Reopen if a journal grows past that.

