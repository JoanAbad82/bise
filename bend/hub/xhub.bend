# hub/xhub.bend — the cross-hub decisions (bise desktop S2), pure: what a
# forward of his message needs, the outbox's next step after an ack, a
# failure or an answer, the retry backoff, which inbox record an answer
# goes back for. core.bend's `---- cross-hub (S2) ----` section runs them
# through emit/send/out (it decides nothing itself); the state and its
# journal kinds are xhub-model.bend's. Laws: bend/laws/hub.bend `xhub_*`.
#
# Two kinds (architect's B): his own words, forwarded by reference only
# (`sb project send <p> --input m_<n>`: sb-core checks m_<n> is a message
# he sent this main and copies its text itself, so bise's model never
# retypes words carrying his authority), and bise's own question (`sb
# project ask`, the sender `@bise`, no authority).
#
# Trust: the ops `xin` and `xreply` on hub.sock trust their caller like
# the `input` op does (same uid): an agent could forge one as it could
# forge an input today; not new, not fixed here.
import Base

import ./model.bend as M
import ./gen/state.bend as S

import ./xhub-model.bend as XH

import ./timers.bend as TM

# the sender of bise's own question in a project hub: not a valid agent
# name, so no agent can be it
def FROM_BISE() -> String:
  "@bise"

# the view of his words routed by bise (`<user_message via="bise">`)
def VIA_BISE() -> String:
  "bise"

# ---- a forward of his message (home side) ----

type Fwd is Data:
  FwdErr{why: String}
  FwdOk{text: String}

def mid(+n: Nat) -> String:
  String.append("m_", Nat.show(n))

def his.go(m: Maybe<&2, S.Msg>, +id: Nat) -> Fwd:
  match m:
    case None{}:
      FwdErr{String.append("no message ", mid(id))}
    case Some{+msg}:
      Bool.pick(Fwd, String.eq(S.Msg.from(msg), M.USER()) && String.eq(S.Msg.to(msg), M.MAIN()),
        FwdOk{S.Msg.text(msg)},
        FwdErr{String.append(mid(id), " is not a message the user sent you: forward his own words only (your own question: sb project ask)")})

def forward.done(m: Maybe<&2, XH.Out>, +s: M.St, +id: Nat) -> Fwd:
  match m:
    case Some{+o}:
      FwdErr{String.append(String.append(mid(id), " was already forwarded to "), XH.Out.project(o))}
    case None{}:
      his.go(M.msg_of(s, id), id)

# `sb project send --input m_<id>` by `from`: only main, only a message
# the user sent main, once per message (law xhub_forward_needs_his_message)
def forward(+s: M.St, +from: String, +id: Nat) -> Fwd:
  Bool.pick(Fwd, String.eq(from, M.MAIN()),
    forward.done(XH.out_by_msg(XH.Xs.outbox(M.St.x(s)), id), s, id),
    FwdErr{"only main forwards to the projects"})

# bise's own question (`sb project ask`): words, never a blank (law
# xhub_ask_needs_words); None: it may go
def ask_ok(+text: String) -> Maybe<&2, String>:
  Bool.pick(Maybe<&2, String>, M.trim_is_empty(text), Some{"empty question"}, None{})

# the outbox entry of a new send: the next xid, pending, never tried;
# `parts` his routed message's (R41 (6)), "" for the rest
def new_out(+x: XH.Xs, +project: String, +k: XH.XKind, +msg: Nat, +text: String, +context: String, +parts: String) -> XH.Out:
  XH.Out{XH.Xs.next_xid(x), project, k, msg, text, XH.OPending{}, 0n, context, parts}

# ---- the outbox's steps (home side) ----

def pending.go(+o: XH.Out, s: XH.OutSt) -> Maybe<&2, XH.Out>:
  match s:
    case XH.OPending{}:
      Some{o}
    case _:
      None{}

def pending.of(m: Maybe<&2, XH.Out>) -> Maybe<&2, XH.Out>:
  match m:
    case None{}:
      None{}
    case Some{+o}:
      pending.go(o, XH.Out.st(o))

# an ack or a failure counts only for a send still pending (a late ack
# or failure of a settled send changes nothing)
def pending(+x: XH.Xs, +xid: Nat) -> Maybe<&2, XH.Out>:
  pending.of(XH.out_of(XH.Xs.outbox(x), xid))

def open.go(+o: XH.Out, s: XH.OutSt) -> Maybe<&2, XH.Out>:
  match s:
    case XH.OSettled{}:
      None{}
    case _:
      Some{o}

def open.of(m: Maybe<&2, XH.Out>) -> Maybe<&2, XH.Out>:
  match m:
    case None{}:
      None{}
    case Some{+o}:
      open.go(o, XH.Out.st(o))

# the send an answer settles: known and not settled yet (law
# xhub_outbox_settles_once: after its settle, none)
def open(+x: XH.Xs, +xid: Nat) -> Maybe<&2, XH.Out>:
  open.of(XH.out_of(XH.Xs.outbox(x), xid))

def is_pending(s: XH.OutSt) -> Bool:
  match s:
    case XH.OPending{}:
      True{}
    case _:
      False{}

def pendings(xs: List<&2, XH.Out>) -> List<&2, XH.Out>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = pendings(t)
      Bool.pick(List<&2, XH.Out>, is_pending(XH.Out.st(h)), h <> rest, rest)

# the next try of a failed delivery: 1 s, 2 s, 4 s ... at most 60 s
def backoff(+tries: Nat) -> Nat:
  Nat.min(Nat.mul(1000n, Nat.pow(2n, Nat.min(tries, 6n))), 60000n)

# ---- the inbox (project side) ----

def seen.of(m: Maybe<&2, XH.XIn>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{_}:
      True{}

# a delivery of an origin already received adds nothing (law
# xhub_xin_delivered_once)
def seen(+x: XH.Xs, +hub: String, +xid: Nat) -> Bool:
  seen.of(XH.xin_of(XH.Xs.xin(x), hub, xid))

def reply.go(+i: XH.XIn, r: Bool) -> Maybe<&2, XH.XIn>:
  match r:
    case True{}:
      None{}
    case False{}:
      Some{i}

def reply.of(m: Maybe<&2, XH.XIn>) -> Maybe<&2, XH.XIn>:
  match m:
    case None{}:
      None{}
    case Some{+i}:
      reply.go(i, XH.XIn.replied(i))

# the inbox record an answer to message `msg` goes back for: one not
# answered yet (law xhub_xin_replied_once)
def reply_due(+x: XH.Xs, +msg: Nat) -> Maybe<&2, XH.XIn>:
  reply.of(XH.xin_by_msg(XH.Xs.xin(x), msg))

# ---- the acts ----

# the act of a retry of `xid` after `tries` failures, due from `now`
def retry_act(+tm: S.Tms, +xid: Nat, +tries: Nat, +now: Nat) -> S.Act:
  TM.act_of(S.Tms.next_act(tm), Nat.add(now, backoff(tries)), S.Retry{xid})

# ---- the routing hold (home side, step 2) ----

# how long his words wait before they go to the project the shell picked:
# his time to correct or cancel them (`route_correct`, `route_cancel`)
def HOLD_MS() -> Nat:
  2000n

# a new held route: the next rid, due HOLD_MS from `now`, its act the
# clock's next one
def new_route(+x: XH.Xs, +tm: S.Tms, +text: String, +via: String, +to: String, +name: String, +why: String, +now: Nat, +context: String, +parts: String) -> XH.Route:
  XH.Route{XH.Xs.next_rid(x), text, via, to, name, Nat.add(now, HOLD_MS()), S.Tms.next_act(tm), why, XH.RHeld{}, context, parts}

# the act that sends a held route at its due time (law
# route_fires_at_due_only: timers.bend's acts_due)
def route_act(+r: XH.Route) -> S.Act:
  TM.act_of(XH.Route.act(r), XH.Route.due(r), S.RouteSend{XH.Route.rid(r)})

def is_held(s: XH.RSt) -> Bool:
  match s:
    case XH.RHeld{}:
      True{}
    case _:
      False{}

def held.go(+r: XH.Route, s: XH.RSt) -> Maybe<&2, XH.Route>:
  match s:
    case XH.RHeld{}:
      Some{r}
    case _:
      None{}

def held.of(m: Maybe<&2, XH.Route>) -> Maybe<&2, XH.Route>:
  match m:
    case None{}:
      None{}
    case Some{+r}:
      held.go(r, XH.Route.st(r))

# the route a fire, a correction or a cancel acts on: one still held
# (laws route_one_outcome, route_correct_only_held)
def held(+x: XH.Xs, +rid: Nat) -> Maybe<&2, XH.Route>:
  held.of(XH.route_of(XH.Xs.routes(x), rid))

# the view a routed message carries ("" none)
def via_of(+v: String) -> Maybe<&2, String>:
  Bool.pick(Maybe<&2, String>, String.is_empty(v), None{}, Some{v})

# his routed words as his plain message to main: id `id` (its own thread),
# its text, via and parts from the route (core.bend route_said)
def msg_of_route(+r: XH.Route, +id: Nat, +now: Nat) -> S.Msg:
  +m = S.Msg.with_to(S.Msg.with_from(S.Msg.with_thread(S.Msg.with_id(S.Msg.empty(), id), id), M.USER()), M.MAIN())
  +m2 = S.Msg.with_plain(S.Msg.with_created(S.Msg.with_text(m, XH.Route.text(r)), now), True{})
  S.Msg.with_parts(S.Msg.with_via(m2, via_of(XH.Route.via(r))), XH.Route.parts(r))

# ---- a held route with no target ----
# Only an older hub's route model held one (S2 step 5, gone: only his
# explicit `@<project>` routes now); one left in a journal fires plain to
# bise's main (law route_unclear_goes_plain).

# held, with no target yet
def is_unclear(+r: XH.Route) -> Bool:
  is_held(XH.Route.st(r)) && String.is_empty(XH.Route.to(r))
