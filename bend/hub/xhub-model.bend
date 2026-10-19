# hub/xhub-model.bend — the hub's cross-hub message state (bise desktop S2):
# the home hub's outbox to the project hubs and a project hub's record of
# what it received from the home hub. A field of model.bend's St (`x`),
# owned by sb-core and rebuilt from the journal like the rest.
#
# Its records (Xs, Out, XIn, Route) and their enums (XKind, OutSt, RSt),
# their getters, setters and journal codec are declared once in
# bise_proto::core::state and generated (gen/state.bend,
# gen/state-codec.bend: issue 35). Here: the lookups, the journal's
# changes and kinds (XEv), all written with the getters and setters.
# Imported by model.bend, so it imports neither model nor core (Bend has
# no import cycles), like timers.bend.
#
# The fields' meaning: an Out's `msg` is the home hub's message it
# forwards (kind input) or 0, `text` the words sent (copied by sb-core
# from that message, or the question), `parts` his routed message's parts
# (msg-parts JSON, "" none, R41 (6)); an XIn's `msg` the message the
# project hub made of it (its id there); a Route holds his words on their
# way to a project (step 2's hold) until `due` (its act `act` on
# timers.bend's clock), then sent or cancelled: `to` the project's hub id,
# `name` its name, `via` the view he typed in ("" none). XKind KJobEnd: a
# task this project's hub follows for bise ended (project -> bise's home
# hub), `text` its JSON {agent, key, state, label, summary, name}.
import Base

import ./lazy.bend as LZ

import ./gen/state.bend as S

# ---- routes ----

def route_of(xs: List<&2, S.Route>, +rid: Nat) -> Maybe<&2, S.Route>:
  match xs:
    case Nil{}:
      None{}
    case Con{+h, +t}:
      LZ.pick(Maybe<&2, S.Route>, Nat.is_eq(S.Route.rid(h), rid), u => Some{h}, u => route_of(t, rid))

# a route's new target (his correction or pick): the project's hub id
# and its name; the rest stays (its due, his parts)
def route_to(+r: S.Route, +to: String, +name: String) -> S.Route:
  S.Route.with_name(S.Route.with_to(r, to), name)

type RouteOp is Data:
  RTo{to: String, name: String}
  REnd{st: S.RSt}

def route_op(op: RouteOp, +r: S.Route) -> S.Route:
  match op:
    case RTo{+to, +name}:
      route_to(r, to, name)
    case REnd{+s}:
      S.Route.with_st(r, s)

def route_set(xs: List<&2, S.Route>, +rid: Nat, +op: RouteOp) -> List<&2, S.Route>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      LZ.pick(List<&2, S.Route>, Nat.is_eq(S.Route.rid(h), rid), u => route_op(op, h) <> t, u => h <> route_set(t, rid, op))

# ---- lookups ----

def out_of(xs: List<&2, S.Out>, +xid: Nat) -> Maybe<&2, S.Out>:
  match xs:
    case Nil{}:
      None{}
    case Con{+h, +t}:
      LZ.pick(Maybe<&2, S.Out>, Nat.is_eq(S.Out.xid(h), xid), u => Some{h}, u => out_of(t, xid))

def xin_of(xs: List<&2, S.XIn>, +hub: String, +xid: Nat) -> Maybe<&2, S.XIn>:
  match xs:
    case Nil{}:
      None{}
    case Con{+h, +t}:
      LZ.pick(Maybe<&2, S.XIn>, String.eq(S.XIn.hub(h), hub) && Nat.is_eq(S.XIn.xid(h), xid), u => Some{h}, u => xin_of(t, hub, xid))

# the inbox record whose message is `msg` (its answer goes back)
def xin_by_msg(xs: List<&2, S.XIn>, +msg: Nat) -> Maybe<&2, S.XIn>:
  match xs:
    case Nil{}:
      None{}
    case Con{+h, +t}:
      LZ.pick(Maybe<&2, S.XIn>, Nat.is_eq(S.XIn.msg(h), msg), u => Some{h}, u => xin_by_msg(t, msg))

# the forward of his message `msg` (one per message)
def out_by_msg(xs: List<&2, S.Out>, +msg: Nat) -> Maybe<&2, S.Out>:
  match xs:
    case Nil{}:
      None{}
    case Con{+h, +t}:
      LZ.pick(Maybe<&2, S.Out>, Nat.is_eq(S.Out.msg(h), msg), u => Some{h}, u => out_by_msg(t, msg))

# ---- the journal's changes ----

# acked only from pending (a late ack never reopens a settled send)
def acked_st(s: S.OutSt) -> S.OutSt:
  match s:
    case S.OPending{}:
      S.OAcked{}
    case other:
      other

type OutOp is Data:
  OpAcked{}
  OpTried{}
  OpSettled{}

def out_op(op: OutOp, +x: S.Out) -> S.Out:
  match op:
    case OpAcked{}:
      S.Out.with_st(x, acked_st(S.Out.st(x)))
    case OpTried{}:
      S.Out.with_tries(x, 1n+S.Out.tries(x))
    case OpSettled{}:
      S.Out.with_st(x, S.OSettled{})

def out_set(xs: List<&2, S.Out>, +xid: Nat, +op: OutOp) -> List<&2, S.Out>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      LZ.pick(List<&2, S.Out>, Nat.is_eq(S.Out.xid(h), xid), u => out_op(op, h) <> t, u => h <> out_set(t, xid, op))

# the inbox record of a delivery from `hub`: its message here `msg`
def xin_rec(+hub: String, +xid: Nat, +msg: Nat, +k: S.XKind, +replied: Bool) -> S.XIn:
  S.XIn.with_replied(S.XIn.with_kind(S.XIn.with_msg(S.XIn.with_xid(S.XIn.with_hub(S.XIn.empty(), hub), xid), msg), k), replied)

def xin_set(xs: List<&2, S.XIn>, +hub: String, +xid: Nat) -> List<&2, S.XIn>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      LZ.pick(List<&2, S.XIn>, String.eq(S.XIn.hub(h), hub) && Nat.is_eq(S.XIn.xid(h), xid), u => S.XIn.with_replied(h, True{}) <> t, u => h <> xin_set(t, hub, xid))

def x_out(+x: S.Xs, +o: S.Out) -> S.Xs:
  S.Xs.with_next_xid(S.Xs.with_outbox(x, List.append(&2, S.Out, S.Xs.outbox(x), [o])), Nat.max(S.Xs.next_xid(x), 1n+S.Out.xid(o)))

def x_op(+x: S.Xs, +xid: Nat, +op: OutOp) -> S.Xs:
  S.Xs.with_outbox(x, out_set(S.Xs.outbox(x), xid, op))

def x_in(+x: S.Xs, +i: S.XIn) -> S.Xs:
  S.Xs.with_xin(x, List.append(&2, S.XIn, S.Xs.xin(x), [i]))

def x_replied(+x: S.Xs, +hub: String, +xid: Nat) -> S.Xs:
  S.Xs.with_xin(x, xin_set(S.Xs.xin(x), hub, xid))

def x_route_held(+x: S.Xs, +r: S.Route) -> S.Xs:
  S.Xs.with_next_rid(S.Xs.with_routes(x, List.append(&2, S.Route, S.Xs.routes(x), [r])), Nat.max(S.Xs.next_rid(x), 1n+S.Route.rid(r)))

def x_route(+x: S.Xs, +rid: Nat, +op: RouteOp) -> S.Xs:
  S.Xs.with_routes(x, route_set(S.Xs.routes(x), rid, op))

# ---- the journal's kinds of this state (model.bend's Ev EX) ----

type XEv is Data:
  XOut{o: S.Out}
  XOp{xid: Nat, op: OutOp}
  XGot{i: S.XIn}
  XReplied{hub: String, xid: Nat}
  XRouteHeld{r: S.Route}
  XRoute{rid: Nat, op: RouteOp}

def apply(+x: S.Xs, e: XEv) -> S.Xs:
  match e:
    case XOut{+o}:
      x_out(x, o)
    case XOp{+xid, +op}:
      x_op(x, xid, op)
    case XGot{+i}:
      x_in(x, i)
    case XReplied{+h, +xid}:
      x_replied(x, h, xid)
    case XRouteHeld{+r}:
      x_route_held(x, r)
    case XRoute{+rid, +op}:
      x_route(x, rid, op)
