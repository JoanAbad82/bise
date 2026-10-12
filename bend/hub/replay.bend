# bend/hub/replay.bend: the boot replay of a journal in batches
# (main.bend `replay_many`), moved out of model.bend (the 1,000-line gate).
# `apply` keeps the messages oldest first: a message_sent is a snoc and a
# message_state walks to a recent id, both linear in the messages, so a
# 20k-event journal replayed in ~18 s (quadratic). During a batch the
# messages are kept newest first (msgs_rev): a message_sent is a cons,
# and a message_state or a settle finds a recent id near the head and
# stops there (map_msg and rec_of use Bool.pick, which computes both
# branches: they always walk the whole list). The messages' own events
# take those early-stopping lookups; every other event is `apply`
# itself. A message is found by its id (unique): the order of the list
# does not change which one an event touches. The batch ends with
# M.hot_all (St.hot is every message until the next live message event).
import Base
import ./model.bend as M

# the head of `xs` is the message `id`
def msg_at(xs: List<&2, M.MRec>, +id: Nat) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, _}:
      Nat.is_eq(M.Msg.id(M.MRec.msg(h)), id)

# map_msg that stops at the message; `hit`: msg_at(xs, id)
def map_msg.fast(xs: List<&2, M.MRec>, +hit: Bool, +id: Nat, +op: M.MsgOp) -> List<&2, M.MRec>:
  match xs hit:
    case Nil{} _:
      Nil{}
    case Con{+h, +t} True{}:
      M.rec_op(h, op) <> t
    case Con{+h, +t} False{}:
      h <> map_msg.fast(t, msg_at(t, id), id, op)

# rec_of that stops at the message; `hit`: msg_at(xs, id)
def rec_of.fast(xs: List<&2, M.MRec>, +hit: Bool, +id: Nat) -> Maybe<&2, M.MRec>:
  match xs hit:
    case Nil{} _:
      None{}
    case Con{+h, _} True{}:
      Some{h}
    case Con{_, +t} False{}:
      rec_of.fast(t, msg_at(t, id), id)

def map_msg.rev(+xs: List<&2, M.MRec>, +id: Nat, +op: M.MsgOp) -> List<&2, M.MRec>:
  map_msg.fast(xs, msg_at(xs, id), id, op)

# apply.settle, with the early-stopping lookups
def apply_rev.settle.if(ok: Bool, +msgs: List<&2, M.MRec>, +id: Nat) -> List<&2, M.MRec>:
  match ok:
    case True{}:
      map_msg.rev(msgs, id, M.OSettle{})
    case False{}:
      msgs

def apply_rev.settle.go(orig: Maybe<&2, M.MRec>, +msgs: List<&2, M.MRec>, +id: Nat, +from: String) -> List<&2, M.MRec>:
  match orig:
    case None{}:
      msgs
    case Some{+o}:
      apply_rev.settle.if(String.eq(M.Msg.to(M.MRec.msg(o)), from) || String.eq(from, M.USER()), msgs, id)

def apply_rev.settle(r: Maybe<&2, Nat>, +msgs: List<&2, M.MRec>, +from: String) -> List<&2, M.MRec>:
  match r:
    case None{}:
      msgs
    case Some{+id}:
      apply_rev.settle.go(rec_of.fast(msgs, msg_at(msgs, id), id), msgs, id, from)

def apply_rev.op(+st: M.St, +id: Nat, +op: M.MsgOp) -> M.St:
  match st:
    case M.St{+agents, +order, +msgs, +cards, +notes, +nm, +nc, +tm, +xs, +pz, +hot}:
      M.St{agents, order, map_msg.rev(msgs, id, op), cards, notes, nm, nc, tm, xs, pz, hot}

def apply_rev.sent(+st: M.St, +m: M.Msg) -> M.St:
  match st:
    case M.St{+agents, +order, +msgs, +cards, +notes, +nm, +nc, +tm, +xs, +pz, +hot}:
      M.St{agents, order,
        apply_rev.settle(M.Msg.reply_to(m), M.MRec{m, M.Queued{"new"}, False{}} <> msgs, M.Msg.from(m)),
        cards, notes, Nat.max(Nat.max(nm, 1n+M.Msg.id(m)), 1n+M.Msg.thread(m)), nc, tm, xs, pz, hot}

# `apply` on a state whose messages are newest first
def apply_rev(+e: M.Ev, +st: M.St) -> M.St:
  match e:
    case M.EMsgSent{+m}:
      apply_rev.sent(st, m)
    case M.EMsgState{+id, +s}:
      apply_rev.op(st, id, M.OSt{s})
    case M.ESettled{+id}:
      apply_rev.op(st, id, M.OSettle{})
    case _:
      M.apply(st, e)

# the messages turned around: oldest first <-> newest first
def msgs_rev(+st: M.St) -> M.St:
  match st:
    case M.St{+agents, +order, +msgs, +cards, +notes, +nm, +nc, +tm, +xs, +pz, +hot}:
      M.St{agents, order, List.reverse(&2, M.MRec, msgs), cards, notes, nm, nc, tm, xs, pz, hot}
