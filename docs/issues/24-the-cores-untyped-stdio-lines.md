# 24 · the ambient core's untyped stdio lines

Status: open, shrink-only (architect's merge review S2). Written by
amb-core. Label: protocol, desktop.

## The problem

The desktop app talks to `bise ambient-core` in JSON-RPC
(`rust/proto/src/app_rpc.rs`). Most names come from typed enums:
`AppCmd` and `CoreEv` (`rust/proto/src/draft.rs`), `HubCmd` and `HubEv`.
Their fields have a Rust type and a generated TS type
(`apps/desktop/src/proto/*.ts`), and a field that changes on one side
breaks the other side's build.

Two lists in `app_rpc.rs` are still untyped. The core reads and writes
these lines as raw `serde_json::Value`, and the app reads them as
`Record<string, unknown>`. A renamed or dropped field fails silently,
with no red. It was accepted on the ambient-app branch to ship.

`CORE_CMDS`: 19 commands, parsed by hand in
`rust/tui/src/ambient/core/cmd.rs`:

    fn_context, shot, send, start, answer, hush, cut_in, quiet, voice,
    every_stop, fake_words, agent_preview, agent_history, agent_unwatch,
    agent_send, follow, stop, archive, unarchive

`CORE_EVS`: 13 events, written as `json!` by the core:

    state, main, hub, sent, word, phase, page, agent_entry, agent_history,
    agent_preview, agent_queued, agent_typing, fake_voice

## The rule

- No new untyped tag. A new command is an `AppCmd` variant and a new
  event is a `CoreEv` variant, with its fixture line.
- The next change that touches an untyped tag also types it, in the same
  sha. Its row leaves `CORE_CMDS` or `CORE_EVS`, and its variant goes in
  `AppCmd` or `CoreEv`, with a fixture and the blessed TS. The app's
  reader moves to the generated type.
- The law `the_untyped_lists_only_shrink`
  (`rust/proto/src/app_rpc_tests.rs`) pins the lists as they are today.
  An added tag fails it. Typing a tag also fails it until that tag
  leaves the pinned list, in the same sha.

## Proof when done

Both lists are empty. Then the two consts, their law and this issue go.
