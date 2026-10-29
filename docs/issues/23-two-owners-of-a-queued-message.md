# 23 · two owners of a queued message: the terminal's queue and the hub's

Status: done (debt-t4, T4 of architect's tech-debt-night list, plan
signed m_23376). The hub owns every queued message; the terminal sends,
draws and takes back, nothing more. Label: hub, protocol, tui. Same area
as issue 22.

What the user sees change in the terminal: messages queued with tab now
all go in ONE turn when the current turn ends, in order (sb-core's law
user_queued_said_at_idle, the window's behavior); before, the terminal
sent one per turn. One per turn would be a separate sb-core law change
for both apps. Also: a second terminal (and the window) shows the same
queue, and a queue survives a terminal restart (the journal keeps it).

What changed:

- tab: `command/run {line, mode: queued, parts}` at once
  (`rust/tui/src/sb/queued.rs`, `sb/send.rs`); the queue above the
  composer and the panel's `· N queued` come from `rows::Agent.queued`
  (`queue.rs` only draws);
- ↑: `turn/unqueue` of the newest row; `queued_taken` now carries his
  `parts` (and `rows::Agent.queued` too), so his chips come back from
  them (`chips_back.rs`), parsed from the text only for an older message;
- gone: `App.queued`, `queue_out` and the 766a28a6 guard (`next`,
  `seen`, `TURN_WAIT`), the views' copies, `reads::queue_next`, the
  drafts file's own queue; `turn_edges` moved to `turns.rs` (it still
  drives the busy state and voice mode, never a send);
- upgrade: an older terminal's `queues` key in the drafts file (fresh,
  a reload) goes to the hub as queued messages at `ready`, in order, then
  the key goes (`drafts.rs` an_older_tuis_queue_goes_to_the_hub_once).

Proof: tui_queue_tmux (tab, ↑ edit, one turn in order, a second
terminal on the same hub sees the same queue), proto_e2e_threads (the
terminal's door and the window's make the same queued row; queued_take
unchanged), tui_undelivered_tmux, proto_e2e_parts.

## The problem

A message the user queues for a busy agent lives in one of two places,
depending on where he typed it:

- **the terminal** keeps its own queue, client-side
  (`rust/tui/src/queue.rs`: `App.queued`, tab queues, ↑ takes the newest
  back to edit). The hub never sees those lines until the terminal sends
  them, one per turn, when it decides the agent's turn ended (its
  `turn_edges` / `Owed` guard, 766a28a6);
- **the window** sends `send {mode: queued}`: sb-core holds the message
  (`Msg.queued`, law `user_queued_waits_for_turn_end`), the hub shows it on
  `rows::Agent.queued`, and `queued_take` takes it back
  (sb-core's `unqueue`, `Rejected{"taken_back"}`).

So "queued" has two owners. A line queued in the terminal is invisible to
the window (and to a second terminal), and the terminal's release depends
on its own reading of the turn's end, which issue 22 shows can be wrong
when the row's two halves disagree.

## The fix

The terminal moves to the hub-held queue:

1. tab sends `send {mode: queued}` at once, and the terminal draws its
   queue from `rows::Agent.queued` (the window's source);
2. ↑ (take the newest back to edit) calls `queued_take` and puts the
   returned `queued_taken.text` in the composer;
3. `queue.rs`'s client queue, `next_at`, `seen` and the `Owed` turn-edge
   guard go: sb-core's pump releases queued messages at the turn's end, in
   id order, once (`delivered_once`).

Then issue 22's made-up turn can't release a queued line any more (the
terminal no longer decides when), and both clients show the same queue.

## Proof when done

- tui_queue_tmux.py with the queue drawn from the hub's rows (tab, ↑ edit,
  order at the turn's end), and a second terminal seeing the same queue;
- proto_e2e's queued_take check unchanged;
- tui-parity's queue steps the same as before, or each difference named.
