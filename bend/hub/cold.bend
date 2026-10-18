# hub/cold.bend: the lookups of a step over both sides of the messages
# (issue 21 steps 3-4: St.hot ascending, St.old newest first), kept out
# of core.bend (its line ratchet). A step reads the hot side, and the
# head of the old side, never every message.
import Base
import ./model.bend as M
import ./lazy.bend as LZ

# `m` answers the message `id`: it names it, from its recipient or the user
def is_reply(+m: M.Msg, +id: Nat, +replier: String) -> Bool:
  M.maybe_nat_is(M.Msg.reply_to(m), id) && (String.eq(M.Msg.from(m), replier) || String.eq(M.Msg.from(m), M.USER()))

# the first reply in `xs` (ids ascending: the earliest of them)
def reply_of(xs: List<&2, M.MRec>, +id: Nat, +replier: String) -> Maybe<&2, M.Msg>:
  match xs:
    case Nil{}:
      None{}
    case Con{+r, +t}:
      +m = M.MRec.msg(r)
      LZ.pick(Maybe<&2, M.Msg>, is_reply(m, id, replier), u => Some{m}, u => reply_of(t, id, replier))

def reply_last.pick(later: Maybe<&2, M.Msg>, here: Bool, +m: M.Msg) -> Maybe<&2, M.Msg>:
  match later:
    case Some{+x}:
      Some{x}
    case None{}:
      Bool.pick(Maybe<&2, M.Msg>, here, Some{m}, None{})

# the last reply in `xs` (ids descending: the earliest of them). A reply
# comes after its message, so the walk stops at the first id not above
# it (`after`: the head's id is above `id`)
def reply_last(xs: List<&2, M.MRec>, after: Bool, +id: Nat, +replier: String) -> Maybe<&2, M.Msg>:
  match xs after:
    case Nil{} _:
      None{}
    case Con{_, _} False{}:
      None{}
    case Con{+r, +t} True{}:
      +m = M.MRec.msg(r)
      reply_last.pick(reply_last(t, M.id_above(t, id), id, replier), is_reply(m, id, replier), m)

# the earlier of two replies
def reply_min(a: Maybe<&2, M.Msg>, b: Maybe<&2, M.Msg>) -> Maybe<&2, M.Msg>:
  match a b:
    case None{} _:
      b
    case Some{+x} None{}:
      Some{x}
    case Some{+x} Some{+y}:
      Bool.pick(Maybe<&2, M.Msg>, Nat.is_lt(M.Msg.id(y), M.Msg.id(x)), Some{y}, Some{x})

# the first reply to the message `id` among every message (sb wait, the
# ask's pause): the earliest of the hot side's and of the old side's
def reply_at(+st: M.St, +id: Nat, +replier: String) -> Maybe<&2, M.Msg>:
  reply_min(reply_of(M.St.hot(st), id, replier), reply_last(M.St.old(st), M.id_above(M.St.old(st), id), id, replier))

# ---- the boot replay (main.bend replay_many) ----
# A journal event a replay applies: one this hub knows (GJ.of gives None
# for a kind written by a newer hub, before a /version rollback), and for
# a message_sent an id at or above next_msg. A reused or older id (a
# damaged journal; none in the 17 journals on his machine, issue 21
# steps 3-4) would put the message out of send order in the split (law
# ids_ascending): it is skipped, and the answer says so.
def replay_fresh(+st: M.St, e: M.Ev) -> Bool:
  match e:
    case M.EMsgSent{+m}:
      Nat.is_ge(M.Msg.id(m), M.St.next_msg(st))
    case _:
      True{}

def replay_one(ok: Bool, +st: M.St, +e: M.Ev) -> M.St:
  match ok:
    case True{}:
      M.apply(st, e)
    case False{}:
      st

# a batch of events, each M.apply: the split keeps a message event on
# the hot side and the head of the old side, so a boot is linear (one
# list of every message made it quadratic). `i` counts the events, `sk`
# the ones skipped (newest first).
def replay_batch(ms: List<&2, Maybe<&2, M.Ev>>, +st: M.St, +i: Nat, +sk: List<&2, Nat>) -> M.St & List<&2, Nat>:
  match ms:
    case Nil{}:
      (st, List.reverse(&2, Nat, sk))
    case Con{None{}, +rest}:
      replay_batch(rest, st, 1n+i, i <> sk)
    case Con{Some{+e}, +rest}:
      +ok = replay_fresh(st, e)
      replay_batch(rest, replay_one(ok, st, e), 1n+i, Bool.pick(List<&2, Nat>, ok, sk, i <> sk))
