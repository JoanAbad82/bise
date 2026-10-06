# hub/xhub-model.bend — the hub's cross-hub message state (bise desktop S2):
# the home hub's outbox to the project hubs and a project hub's record of
# what it received from the home hub. A field of model.bend's St (`x`),
# owned by sb-core and rebuilt from the journal like the rest.
#
# Empty for now: S2's step 1 fills it (outbox, inbox) with its journal
# kinds and laws. Imported by model.bend, so it imports neither model nor
# core (Bend has no import cycles), like timers.bend.
import Base

import ../vendor/json.bend as J

# his own words forwarded by reference (his authority), or bise's own
# question (none)
type XKind is Data:
  KInput{}
  KAsk{}

type OutSt is Data:
  OPending{}
  OAcked{}
  OSettled{}

# `msg`: the home hub's message it forwards (kind input) or 0; `text`: the
# words sent (copied by sb-core from that message, or the question)
type Out is Data:
  Out{xid: Nat, project: String, kind: XKind, msg: Nat, text: String, st: OutSt, tries: Nat}

# `msg`: the message the project hub made of it (its id there)
type XIn is Data:
  XIn{hub: String, xid: Nat, msg: Nat, kind: XKind, replied: Bool}

type Xs is Data:
  Xs{outbox: List<&2, Out>, next_xid: Nat, xin: List<&2, XIn>}

def empty() -> Xs:
  Xs{Nil{}, 1n, Nil{}}

# ---- fields ----

def Out.xid(x: Out) -> Nat:
  match x:
    case Out{+xid, _, _, _, _, _, _}:
      xid

def Out.project(x: Out) -> String:
  match x:
    case Out{_, +p, _, _, _, _, _}:
      p

def Out.kind(x: Out) -> XKind:
  match x:
    case Out{_, _, +k, _, _, _, _}:
      k

def Out.msg(x: Out) -> Nat:
  match x:
    case Out{_, _, _, +m, _, _, _}:
      m

def Out.text(x: Out) -> String:
  match x:
    case Out{_, _, _, _, +t, _, _}:
      t

def Out.st(x: Out) -> OutSt:
  match x:
    case Out{_, _, _, _, _, +s, _}:
      s

def Out.tries(x: Out) -> Nat:
  match x:
    case Out{_, _, _, _, _, _, +n}:
      n

def XIn.hub(x: XIn) -> String:
  match x:
    case XIn{+h, _, _, _, _}:
      h

def XIn.xid(x: XIn) -> Nat:
  match x:
    case XIn{_, +xid, _, _, _}:
      xid

def XIn.msg(x: XIn) -> Nat:
  match x:
    case XIn{_, _, +m, _, _}:
      m

def XIn.kind(x: XIn) -> XKind:
  match x:
    case XIn{_, _, _, +k, _}:
      k

def XIn.replied(x: XIn) -> Bool:
  match x:
    case XIn{_, _, _, _, +r}:
      r

def Xs.outbox(x: Xs) -> List<&2, Out>:
  match x:
    case Xs{+o, _, _}:
      o

def Xs.next_xid(x: Xs) -> Nat:
  match x:
    case Xs{_, +n, _}:
      n

def Xs.xin(x: Xs) -> List<&2, XIn>:
  match x:
    case Xs{_, _, +i}:
      i

def kind_str(k: XKind) -> String:
  match k:
    case KInput{}:
      "input"
    case KAsk{}:
      "ask"

def kind_of(+s: String) -> XKind:
  Bool.pick(XKind, String.eq(s, "ask"), KAsk{}, KInput{})

def st_str(s: OutSt) -> String:
  match s:
    case OPending{}:
      "pending"
    case OAcked{}:
      "acked"
    case OSettled{}:
      "settled"

def is_settled(s: OutSt) -> Bool:
  match s:
    case OSettled{}:
      True{}
    case _:
      False{}

# ---- lookups ----

def out_of(xs: List<&2, Out>, +xid: Nat) -> Maybe<&2, Out>:
  match xs:
    case Nil{}:
      None{}
    case Con{+h, +t}:
      Bool.pick(Maybe<&2, Out>, Nat.is_eq(Out.xid(h), xid), Some{h}, out_of(t, xid))

def xin_of(xs: List<&2, XIn>, +hub: String, +xid: Nat) -> Maybe<&2, XIn>:
  match xs:
    case Nil{}:
      None{}
    case Con{+h, +t}:
      Bool.pick(Maybe<&2, XIn>, String.eq(XIn.hub(h), hub) && Nat.is_eq(XIn.xid(h), xid), Some{h}, xin_of(t, hub, xid))

# the inbox record whose message is `msg` (its answer goes back)
def xin_by_msg(xs: List<&2, XIn>, +msg: Nat) -> Maybe<&2, XIn>:
  match xs:
    case Nil{}:
      None{}
    case Con{+h, +t}:
      Bool.pick(Maybe<&2, XIn>, Nat.is_eq(XIn.msg(h), msg), Some{h}, xin_by_msg(t, msg))

# the forward of his message `msg` (one per message)
def out_by_msg(xs: List<&2, Out>, +msg: Nat) -> Maybe<&2, Out>:
  match xs:
    case Nil{}:
      None{}
    case Con{+h, +t}:
      Bool.pick(Maybe<&2, Out>, Nat.is_eq(Out.msg(h), msg), Some{h}, out_by_msg(t, msg))

# ---- the journal's changes ----

def Out.with_st(x: Out, +s: OutSt) -> Out:
  match x:
    case Out{+xid, +p, +k, +m, +t, _, +n}:
      Out{xid, p, k, m, t, s, n}

# acked only from pending (a late ack never reopens a settled send)
def acked_st(s: OutSt) -> OutSt:
  match s:
    case OPending{}:
      OAcked{}
    case other:
      other

def Out.acked(x: Out) -> Out:
  match x:
    case Out{+xid, +p, +k, +m, +t, +s, +n}:
      Out{xid, p, k, m, t, acked_st(s), n}

def Out.tried(x: Out) -> Out:
  match x:
    case Out{+xid, +p, +k, +m, +t, +s, +n}:
      Out{xid, p, k, m, t, s, 1n+n}

def Out.settled(x: Out) -> Out:
  Out.with_st(x, OSettled{})

type OutOp is Data:
  OpAcked{}
  OpTried{}
  OpSettled{}

def out_op(op: OutOp, +x: Out) -> Out:
  match op:
    case OpAcked{}:
      Out.acked(x)
    case OpTried{}:
      Out.tried(x)
    case OpSettled{}:
      Out.settled(x)

def out_set(xs: List<&2, Out>, +xid: Nat, +op: OutOp) -> List<&2, Out>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      Bool.pick(List<&2, Out>, Nat.is_eq(Out.xid(h), xid), out_op(op, h) <> t, h <> out_set(t, xid, op))

def XIn.done(x: XIn) -> XIn:
  match x:
    case XIn{+h, +xid, +m, +k, _}:
      XIn{h, xid, m, k, True{}}

def xin_set(xs: List<&2, XIn>, +hub: String, +xid: Nat) -> List<&2, XIn>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      Bool.pick(List<&2, XIn>, String.eq(XIn.hub(h), hub) && Nat.is_eq(XIn.xid(h), xid), XIn.done(h) <> t, h <> xin_set(t, hub, xid))

def x_out(+x: Xs, +o: Out) -> Xs:
  match x:
    case Xs{+ob, +n, +xi}:
      Xs{List.append(&2, Out, ob, [o]), Nat.max(n, 1n+Out.xid(o)), xi}

def x_op(+x: Xs, +xid: Nat, +op: OutOp) -> Xs:
  match x:
    case Xs{+ob, +n, +xi}:
      Xs{out_set(ob, xid, op), n, xi}

def x_in(+x: Xs, +i: XIn) -> Xs:
  match x:
    case Xs{+ob, +n, +xi}:
      Xs{ob, n, List.append(&2, XIn, xi, [i])}

def x_replied(+x: Xs, +hub: String, +xid: Nat) -> Xs:
  match x:
    case Xs{+ob, +n, +xi}:
      Xs{ob, n, xin_set(xi, hub, xid)}

# ---- JSON (the journal lines' parts, the snapshot) ----

def out_json(+o: Out) -> J.Json:
  J.obj([J.kv("xid", J.JNum{Out.xid(o)}), J.kv("project", J.JStr{Out.project(o)}),
    J.kv("kind", J.JStr{kind_str(Out.kind(o))}), J.kv("msg", J.JNum{Out.msg(o)}),
    J.kv("text", J.JStr{Out.text(o)}), J.kv("state", J.JStr{st_str(Out.st(o))}), J.kv("tries", J.JNum{Out.tries(o)})])

def xin_json(+i: XIn) -> J.Json:
  J.obj([J.kv("hub", J.JStr{XIn.hub(i)}), J.kv("xid", J.JNum{XIn.xid(i)}), J.kv("msg", J.JNum{XIn.msg(i)}),
    J.kv("kind", J.JStr{kind_str(XIn.kind(i))}), J.kv("replied", J.JBool{XIn.replied(i)})])

# ---- the journal's kinds of this state (model.bend's Ev EX) ----

type XEv is Data:
  XOut{o: Out}
  XOp{xid: Nat, op: OutOp}
  XGot{i: XIn}
  XReplied{hub: String, xid: Nat}

def apply(+x: Xs, e: XEv) -> Xs:
  match e:
    case XOut{+o}:
      x_out(x, o)
    case XOp{+xid, +op}:
      x_op(x, xid, op)
    case XGot{+i}:
      x_in(x, i)
    case XReplied{+h, +xid}:
      x_replied(x, h, xid)
