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

def forward.done(m: Maybe<&2, S.Out>, +s: M.St, +id: Nat) -> Fwd:
  match m:
    case Some{+o}:
      FwdErr{String.append(String.append(mid(id), " was already forwarded to "), S.Out.project(o))}
    case None{}:
      his.go(M.msg_of(s, id), id)

# `sb project send --input m_<id>` by `from`: only main, only a message
# the user sent main, once per message (law xhub_forward_needs_his_message)
def forward(+s: M.St, +from: String, +id: Nat) -> Fwd:
  Bool.pick(Fwd, String.eq(from, M.MAIN()),
    forward.done(XH.out_by_msg(S.Xs.outbox(M.St.x(s)), id), s, id),
    FwdErr{"only main forwards to the projects"})

# bise's own question (`sb project ask`): words, never a blank (law
# xhub_ask_needs_words); None: it may go
def ask_ok(+text: String) -> Maybe<&2, String>:
  Bool.pick(Maybe<&2, String>, M.trim_is_empty(text), Some{"empty question"}, None{})

# the outbox entry of a new send: the next xid, pending, never tried;
# `parts` his routed message's (R41 (6)), "" for the rest
def new_out(+x: S.Xs, +project: String, +k: S.XKind, +msg: Nat, +text: String, +context: String, +parts: String) -> S.Out:
  +o = S.Out.with_kind(S.Out.with_project(S.Out.with_xid(S.Out.empty(), S.Xs.next_xid(x)), project), k)
  S.Out.with_parts(S.Out.with_context(S.Out.with_text(S.Out.with_msg(o, msg), text), context), parts)

# ---- the outbox's steps (home side) ----

def pending.go(+o: S.Out, s: S.OutSt) -> Maybe<&2, S.Out>:
  match s:
    case S.OPending{}:
      Some{o}
    case _:
      None{}

def pending.of(m: Maybe<&2, S.Out>) -> Maybe<&2, S.Out>:
  match m:
    case None{}:
      None{}
    case Some{+o}:
      pending.go(o, S.Out.st(o))

# an ack or a failure counts only for a send still pending (a late ack
# or failure of a settled send changes nothing)
def pending(+x: S.Xs, +xid: Nat) -> Maybe<&2, S.Out>:
  pending.of(XH.out_of(S.Xs.outbox(x), xid))

def open.go(+o: S.Out, s: S.OutSt) -> Maybe<&2, S.Out>:
  match s:
    case S.OSettled{}:
      None{}
    case _:
      Some{o}

def open.of(m: Maybe<&2, S.Out>) -> Maybe<&2, S.Out>:
  match m:
    case None{}:
      None{}
    case Some{+o}:
      open.go(o, S.Out.st(o))

# the send an answer settles: known and not settled yet (law
# xhub_outbox_settles_once: after its settle, none)
def open(+x: S.Xs, +xid: Nat) -> Maybe<&2, S.Out>:
  open.of(XH.out_of(S.Xs.outbox(x), xid))

def is_pending(s: S.OutSt) -> Bool:
  match s:
    case S.OPending{}:
      True{}
    case _:
      False{}

def pendings(xs: List<&2, S.Out>) -> List<&2, S.Out>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = pendings(t)
      Bool.pick(List<&2, S.Out>, is_pending(S.Out.st(h)), h <> rest, rest)

# the next try of a failed delivery: 1 s, 2 s, 4 s ... at most 60 s
def backoff(+tries: Nat) -> Nat:
  Nat.min(Nat.mul(1000n, Nat.pow(2n, Nat.min(tries, 6n))), 60000n)

# ---- the inbox (project side) ----

def seen.of(m: Maybe<&2, S.XIn>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{_}:
      True{}

# a delivery of an origin already received adds nothing (law
# xhub_xin_delivered_once)
def seen(+x: S.Xs, +hub: String, +xid: Nat) -> Bool:
  seen.of(XH.xin_of(S.Xs.xin(x), hub, xid))

def reply.go(+i: S.XIn, r: Bool) -> Maybe<&2, S.XIn>:
  match r:
    case True{}:
      None{}
    case False{}:
      Some{i}

def reply.of(m: Maybe<&2, S.XIn>) -> Maybe<&2, S.XIn>:
  match m:
    case None{}:
      None{}
    case Some{+i}:
      reply.go(i, S.XIn.replied(i))

# the inbox record an answer to message `msg` goes back for: one not
# answered yet (law xhub_xin_replied_once)
def reply_due(+x: S.Xs, +msg: Nat) -> Maybe<&2, S.XIn>:
  reply.of(XH.xin_by_msg(S.Xs.xin(x), msg))

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
def new_route(+x: S.Xs, +tm: S.Tms, +text: String, +via: String, +to: String, +name: String, +why: String, +now: Nat, +context: String, +parts: String) -> S.Route:
  +r = S.Route.with_to(S.Route.with_via(S.Route.with_text(S.Route.with_rid(S.Route.empty(), S.Xs.next_rid(x)), text), via), to)
  +r2 = S.Route.with_act(S.Route.with_due(S.Route.with_name(r, name), Nat.add(now, HOLD_MS())), S.Tms.next_act(tm))
  S.Route.with_parts(S.Route.with_context(S.Route.with_why(r2, why), context), parts)

# the act that sends a held route at its due time (law
# route_fires_at_due_only: timers.bend's acts_due)
def route_act(+r: S.Route) -> S.Act:
  TM.act_of(S.Route.act(r), S.Route.due(r), S.RouteSend{S.Route.rid(r)})

def is_held(s: S.RSt) -> Bool:
  match s:
    case S.RHeld{}:
      True{}
    case _:
      False{}

def held.go(+r: S.Route, s: S.RSt) -> Maybe<&2, S.Route>:
  match s:
    case S.RHeld{}:
      Some{r}
    case _:
      None{}

def held.of(m: Maybe<&2, S.Route>) -> Maybe<&2, S.Route>:
  match m:
    case None{}:
      None{}
    case Some{+r}:
      held.go(r, S.Route.st(r))

# the route a fire, a correction or a cancel acts on: one still held
# (laws route_one_outcome, route_correct_only_held)
def held(+x: S.Xs, +rid: Nat) -> Maybe<&2, S.Route>:
  held.of(XH.route_of(S.Xs.routes(x), rid))

# the view a routed message carries ("" none)
def via_of(+v: String) -> Maybe<&2, String>:
  Bool.pick(Maybe<&2, String>, String.is_empty(v), None{}, Some{v})

# his routed words as his plain message to main: id `id` (its own thread),
# its text, via and parts from the route (core.bend route_said)
def msg_of_route(+r: S.Route, +id: Nat, +now: Nat) -> S.Msg:
  +m = S.Msg.with_to(S.Msg.with_from(S.Msg.with_thread(S.Msg.with_id(S.Msg.empty(), id), id), M.USER()), M.MAIN())
  +m2 = S.Msg.with_plain(S.Msg.with_created(S.Msg.with_text(m, S.Route.text(r)), now), True{})
  S.Msg.with_parts(S.Msg.with_via(m2, via_of(S.Route.via(r))), S.Route.parts(r))

# ---- a held route with no target ----
# Only an older hub's route model held one (S2 step 5, gone: only his
# explicit `@<project>` routes now); one left in a journal fires plain to
# bise's main (law route_unclear_goes_plain).

# held, with no target yet
def is_unclear(+r: S.Route) -> Bool:
  is_held(S.Route.st(r)) && String.is_empty(S.Route.to(r))
