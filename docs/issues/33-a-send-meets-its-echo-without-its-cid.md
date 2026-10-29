# 33 · a send meets its echo without its cid

Status: plan signed by architect (m_30774, after m_30541, m_30534, m_30770),
not started: Gabriel, no new refactors for now (main m_30891). Label: hub,
desktop. Brief: task send-reason, its sha 2. Sha 1 is on main (fb64c8ff1).

## The problem

The window's 'sending' row for one of his messages meets the 'you' entry it
becomes by the message id turn/send answers (A1, `SendResult.msg_id`). Sha 1
added `SendResult.reason` (made | page | routed | command), so a send that
made no message leaves its row on the answer. Three cases are still not
settled by an id:

- **the core went down before the answer**: the row shows 'not sent', yet the
  hub may have made the message. Sha 1 restores the words match for this one
  case (`Pending.lostAt`, apps/desktop/src/store/echo.ts `echoOf`: an entry
  written between the send and the core's death, by its words or parts). A
  words match can still pick the wrong row.
- **a route** (`@<project> …` on bise's home hub): `thread/routes.ts`
  `applyRoute` binds the hub's `route` event to the oldest pending row with
  the same words; a cancelled route's `route_done` names no message, so its
  row goes on the cancel and never meets the message sb-core says to main.
- **a capsule `/answer N`** to a card another agent asked: his answer is made
  in the asker's thread, the row sits in main's, and never meets its id.

## The plan (signed)

The request's cid travels with his message, its 'you' entry and his routes;
the window clears a row by it.

1. **The cid**: the wire cid stays a u64 (errors, notices and undelivered
   already carry it). The window's counter starts at a session base,
   `base = window start ms * 1000` (< 2^53), so a reload or another window
   never reuses one. One function, with a unit test: a reload one ms later
   never overlaps the first window's first 1000 ids. rpc.rs's cid doc says
   the hub never reads it.
2. **sb-core** (bend/hub): `In::Input` and `In::RouteHold` gain `cid: Nat`,
   0 = none (never a `Maybe`: each `Maybe` field doubles the codec's round
   law cases; a real cid is >= base, never 0). `M.Msg` and `XH.Route` keep
   it, written to the journal only when not 0 (an optional key, no new
   journal kind). `FD.you_id` carries it: `sb you-id :: {"id":12,"cid":N}`,
   byte-identical to today when 0. A route keeps it at home only (the
   project hub's x_out never sees it); `FX.route` and `FX.route_done` carry
   it; `route_cancel.go` names the message it says to main
   (`route_done(.., "cancelled", .., msg)`, its id taken in the same step).
   Laws: `you_line_carries_its_cid` (cid != 0 -> on the line; 0 -> the line
   as today), `route_keeps_cid` (hold -> fire / cancel / correct carry the
   same cid), `route_cancel_names_its_msg`. ALL PROOFS CHECK,
   old_core_replay green.
3. **The shell**: `ClientInput` and `RouteHold` carry the cid (proto_input
   and route_input pass the request's). Issue 16: the client socket only,
   an agent's `sb send` never sets it.
4. **Proto**: `thread::Entry` gains `cid` (from the you-id line, skipped
   when none), on every 'you' entry; `route` / `route_done` events carry it.
   Fixtures and TS blessed.
5. **The window** (rule 7): `echoOf` matches by message id, else by
   `entry.cid == row.cid`, looked up across the project's threads (exact:
   cids are unique), which settles the capsule `/answer` case. `applyRoute`
   binds by cid; `settleOf` meets a cancelled route's message by its id.
   `Pending.lostAt`, `sentWords` / `sentParts`, the words match and
   applyRoute's words binding are deleted, each case with a feature test red
   without the cid rule. review-refactor reviews the desktop part before
   architect.
6. **e2e**: proto_e2e_threads (the you-id line and the entry carry
   turn/send's cid, an agent's `sb send` none); route_e2e (route/held and
   route/done carry it, a cancel names its message).

Order: withdrawn-answer (St.gone) and bp-hot's sha 2 (St.arch) touch St;
this touches Msg and Route. Rebase on whichever lands first.
