# 30 · the hub's state is untyped JSON

Status: done (sha 1: the typed `Snapshot`, proved equal to the older
builder; sha 2: the readers on fields, the old way deleted). Label:
hub, debt. Plan: arch-review pick B (Gabriel), architect's
brief-typed-snapshot, plan signed by architect (m_28470).

## Problem

`Hub::snapshot(now)` built the client state as `serde_json::Value`
(`json!` in core.rs and snapshot_rows.rs), and the shell added keys to it
after (`snap["pages"] = …`, the cards' page links, the agents' models).
Every reader then read it back by key: proto_view (agents, cards, jobs,
places), growth, view.json, the daemon's emitters. Switchboard had 273
`.get("` reads outside the `*_tests.rs` files.

So each new fact cost a JSON key in the builder, a read back by string, a
typed row and the TS. A wrong key was silent: the read gave None. The rows
could lose information (growth had to add `declared` to the JSON; the typed
Agent row can't tell an archived agent that finished from one that failed).

And the JSON no longer left the hub: the older door is gone
(older_door_e2e), the state goes out as typed events only, view.json is
bise-proto's `ProjectView`.

## Plan

1. Types and equality. `crate::snapshot::{Snapshot, AgentRow, CardRow}`
   (the hub's view, not wire); snapshot_rows builds the typed row;
   core_snapshot.rs builds the snapshot (out of core.rs). A test-only copy
   of the older builder proves `to_value(new) == old` on every core_tests
   state that reads a snapshot (`snapshot_checked`), on a journal-shaped
   fixture and on his journal (SB_BENCH_JOURNAL, 739 agents: equal).
2. Readers on fields, old way deleted. proto_view, growth, view.rs, the
   daemon's emitters read typed fields; the shell's parts get one writer
   each (pages, card links, gate card agents, models); card_links.json is
   read into typed links once, at load; the keys no reader took (`ev`,
   `dropped`, `model_from`, `timers`, `pages_url`) go; the older builder,
   its equality test and `Serialize` on the snapshot go too (nothing outside
   reads that JSON: no goldens, architect m_28470).

## Status

Done. Switchboard's `.get("` reads outside `*_tests.rs`: 273 before, 235
after; none left on a snapshot (the ones left read other events, the art
store's rows, card_links.json at its load). bench_step on his journal copy
(739 agents, same debug build): the snapshot alone 24.2 ms -> 3.8 ms, hello
+ its snapshot 146 ms -> 74 ms, every row built from nothing 134 ms -> 66
ms. core.rs 2685 -> 2583 lines, core_tests.rs 4612 -> 4604, daemon.rs 2243 -> 2241, their limits lowered.

Left for later, each its own chunk (no wire change here):
- the lossy typed rows, like the Agent row's last report on an archived
  agent;
- the same pattern elsewhere (architect m_28642): the art store's
  `artifacts` event and the diff are built as `Value` and read back by key
  in proto_view (`artifacts`, `diff`, `hunk`).
