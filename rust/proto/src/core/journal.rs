//! sb-core's journal (tag `"type"`): one row per kind of line its `log`
//! effect writes and its boot replays (bend/hub/model.bend's `Ev`), each
//! field under its wire key, in wire order. The Bend codec is generated
//! from it (`bend/hub/gen/journal.bend`, tests/core_gen.rs): the line's
//! read (the tag looked up in a binary search, an unknown tag skips the
//! line) and its write (one match on `M.Ev`, no catch-all: an `Ev`
//! constructor without a row fails Bend's check).
//!
//! A row's `bend` is its `M.Ev` pattern, nested, over its fields' names:
//! `M.EX{XH.XOp{xid, XH.OpAcked{}}}` is the line `{"type": "x_acked",
//! "xid": …}`. The records inside a line (a message, a card, a route...)
//! keep their hand codecs in bend/hub/codec.bend ([`Codec`]: one per
//! record, never one per kind).
//!
//! A new kind: one row here, `BISE_PROTO_BLESS=1 cargo test -p bise-proto
//! --test core_gen`, then its `Ev` constructor and what it does.
//!
//! No Rust type yet: the hub reads journal lines as `Value` (switchboard
//! core.rs); a typed reader generated from this table is what is left of
//! debt D1.

use super::{Codec, Field, FieldKind::*, Kind, Table};

pub const LIFE: Codec = Codec { name: "life", ty: "M.Life", cases: &["M.LActive{}", "M.LStopped{}", "M.LArchived{}", "M.LFailed{}"] };
pub const DECL: Codec = Codec {
    name: "decl",
    ty: "Maybe<&2, M.Decl>",
    cases: &["None{}", "Some{M.DWorking{}}", "Some{M.DDone{}}", "Some{M.DBlocked{}}"],
};
pub const MST: Codec = Codec { name: "mst", ty: "M.MSt", cases: &["M.Queued{$r}", "M.Delivered{}", "M.Rejected{$e}", "M.Cancelled{}"] };
pub const MSG: Codec = Codec { name: "msg", ty: "M.Msg", cases: &[] };
pub const CARD: Codec = Codec { name: "card", ty: "M.Card", cases: &[] };
pub const TIMER: Codec = Codec { name: "timer", ty: "TM.Timer", cases: &[] };
pub const OUT: Codec = Codec { name: "out", ty: "XH.Out", cases: &[] };
pub const XIN: Codec = Codec { name: "xin", ty: "XH.XIn", cases: &[] };
pub const ROUTE: Codec = Codec { name: "route", ty: "XH.Route", cases: &[] };
pub const ACT: Codec = Codec { name: "act", ty: "TM.Act", cases: &[] };
pub const WATCH: Codec = Codec { name: "watch", ty: "WK.Watch", cases: &[] };

const fn f(name: &'static str, kind: super::FieldKind) -> Field {
    Field::new(name, kind)
}

const fn k(tag: &'static str, rust: &'static str, bend: &'static str, fields: &'static [Field]) -> Kind {
    Kind { tag, rust, bend, fields }
}

/// Every kind of journal line, in `M.Ev`'s order.
pub const JOURNAL: Table = Table {
    name: "Journal",
    tag_key: "type",
    kinds: &[
        k("task_created", "TaskCreated", "M.ETaskCreated{name, parent, brief, ws, at_ms}",
            &[f("name", Str), f("parent", Str), f("brief", Json), f("ws", Json), f("at_ms", Nat)]),
        k("lifecycle", "Lifecycle", "M.ELifecycle{name, lifecycle, reason}",
            &[f("name", Str), f("lifecycle", Rec(&LIFE)), f("reason", OptStr)]),
        k("workspace_changed", "Workspace", "M.EWorkspace{name, ws}", &[f("name", Str), f("ws", Json)]),
        k("snapshot", "Snapshot", "M.ESnapshot{name, snapshot_ref}", &[f("name", Str), f("snapshot_ref", OptStr)]),
        // hub-loop: the worktree the shell made for a placing task (its
        // `ws`), or why it could not (`err`; `ws` null)
        k("worktree_placed", "Placed", "M.EPlaced{name, ws, err}", &[f("name", Str), f("ws", Json), f("err", Str)]),
        k("declared", "Declared", "M.EDeclared{name, status, note}",
            &[f("name", Str), f("status", Rec(&DECL)), f("note", Str)]),
        k("reported", "Reported", "M.EReported{name, report}", &[f("name", Str), f("report", Json)]),
        k("file_touched", "FileTouched", "M.EFileTouched{name, path}", &[f("name", Str), f("path", Str)]),
        k("renamed", "Renamed", "M.ERenamed{name, new_name}", &[f("name", Str), f("new_name", Str)]),
        k("message_sent", "MsgSent", "M.EMsgSent{msg}", &[f("msg", Rec(&MSG))]),
        k("message_state", "MsgState", "M.EMsgState{id, state}", &[f("id", Nat), f("state", Inline(&MST))]),
        k("message_settled", "Settled", "M.ESettled{id}", &[f("id", Nat)]),
        k("card_opened", "CardOpened", "M.ECardOpened{card}", &[f("card", Rec(&CARD))]),
        // inbox-record (architect m_24257): his answer rides on the close
        // (`via` "" = closed without him: `resolution` is the reason);
        // `said` his words, `pick` the option's words when he picked by
        // its number (never the digit alone); `via` inbox|thread|page
        k("card_closed", "CardClosed", "M.ECardClosed{id, resolution, M.Ans{said, pick_n, pick, via, page, block}}",
            &[f("id", Nat), f("resolution", Str), f("said", StrOmit), f("pick_n", OptNatOmit), f("pick", StrOmit),
              f("via", StrOmit), f("page", StrOmit), f("block", StrOmit)]),
        // the asker's transcript position of the route line his answer
        // became (the shell knows it once written): a fact, no decision
        k("card_answer_pos", "CardAnswerPos", "M.ECardAnswerPos{card, agent, pos}", &[f("card", Nat), f("agent", Str), f("pos", Nat)]),
        k("main_note", "MainNote", "M.EMainNote{text, at_ms}", &[f("text", Str), f("at_ms", Nat)]),
        k("main_notes_flushed", "NotesFlushed", "M.ENotesFlushed{}", &[]),
        // the timers' lines, in the shape every.rs wrote them (old hubs
        // read them); a set line without a schedule is skipped
        k("every_set", "EverySet", "M.ETimerSet{timer, at}", &[f("timer", InlineOpt(&TIMER)), f("at", Nat)]),
        k("every_fired", "EveryFired", "M.ETimerFired{id, fired, next_ms, at, undelivered}",
            &[f("id", Nat), f("fired", Nat), f("next_ms", Nat), f("at", Nat), f("undelivered", Flag)]),
        k("every_run", "EveryRun", "M.ETimerRun{id, at}", &[f("id", Nat), f("at", Nat)]),
        k("every_stop", "EveryStop", "M.ETimerStop{id, why, at}", &[f("id", Nat), f("why", Str), f("at", Nat)]),
        k("every_name", "EveryName", "M.ETimerName{id, name, announce, at}",
            &[f("id", Nat), f("name", Str), f("at", Nat), f("announce", Flag)]),
        // bise desktop S2: the cross-hub state's lines and the acts'
        k("x_out", "XOut", "M.EX{XH.XOut{out}}", &[f("out", Rec(&OUT))]),
        k("x_acked", "XAcked", "M.EX{XH.XOp{xid, XH.OpAcked{}}}", &[f("xid", Nat)]),
        k("x_failed", "XFailed", "M.EX{XH.XOp{xid, XH.OpTried{}}}", &[f("xid", Nat)]),
        k("x_settled", "XSettled", "M.EX{XH.XOp{xid, XH.OpSettled{}}}", &[f("xid", Nat)]),
        k("x_in", "XIn", "M.EX{XH.XGot{in}}", &[f("in", Rec(&XIN))]),
        k("x_replied", "XReplied", "M.EX{XH.XReplied{hub, xid}}", &[f("hub", Str), f("xid", Nat)]),
        k("route_held", "RouteHeld", "M.EX{XH.XRouteHeld{route}}", &[f("route", Rec(&ROUTE))]),
        k("route_set", "RouteSet", "M.EX{XH.XRoute{rid, XH.RTo{to, name}}}", &[f("rid", Nat), f("to", Str), f("name", Str)]),
        k("route_sent", "RouteSent", "M.EX{XH.XRoute{rid, XH.REnd{XH.RSent{}}}}", &[f("rid", Nat)]),
        k("route_cancelled", "RouteCancelled", "M.EX{XH.XRoute{rid, XH.REnd{XH.RCancelled{}}}}", &[f("rid", Nat)]),
        k("act_set", "ActSet", "M.EAct{TM.ActSet{act}}", &[f("act", Rec(&ACT))]),
        k("act_done", "ActDone", "M.EAct{TM.ActDone{id}}", &[f("id", Nat)]),
        // bise desktop S10: `hub` "" in an older journal (this hub's own)
        k("follow", "Follow", "M.EFollow{name, on, hub}", &[f("name", Str), f("on", Bool), f("hub", Str)]),
        k("job_end", "JobEnd", "M.EJobEnd{name, state}", &[f("name", Str), f("state", Str)]),
        // event-wake
        k("wake_set", "WakeSet", "M.EWake{WK.WSet{watch}}", &[f("watch", Rec(&WATCH))]),
        k("wake_end", "WakeEnd", "M.EWake{WK.WEnd{id, why, at}}", &[f("id", Nat), f("why", Str), f("at", Nat)]),
        // cost-pause
        k("paused", "Paused", "M.EPaused{at}", &[f("at", Nat)]),
        k("resumed", "Resumed", "M.EResumed{at}", &[f("at", Nat)]),
    ],
};

/// The `M.Ev` values no step journals, written as they always were and
/// never read back as themselves: a route ends sent or cancelled, never
/// held again (`REnd{RHeld}` writes `route_held` with only its `rid`,
/// which reads as a `route_held` without its route). The law
/// `no_step_journals_a_held_end` (bend/laws/hub.bend) keeps it unwritten.
pub const NEVER: &[Kind] = &[k("route_held", "RouteEndHeld", "M.EX{XH.XRoute{rid, XH.REnd{XH.RHeld{}}}}", &[f("rid", Nat)])];
