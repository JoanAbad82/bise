# hub/xhub.bend — the cross-hub decisions (bise desktop S2), pure: what a
# forward of his message needs, the outbox's next step after an ack, a
# failure or an answer, the retry backoff, which inbox record an answer
# goes back for. core.bend's `---- cross-hub (S2) ----` section runs them
# through emit/send/out (it decides nothing itself); the state and its
# journal kinds are xhub-model.bend's. Laws: LAWS.bend `xhub_*`.
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

def his.go(m: Maybe<&2, M.Msg>, +id: Nat) -> Fwd:
  match m:
    case None{}:
      FwdErr{String.append("no message ", mid(id))}
    case Some{+msg}:
      Bool.pick(Fwd, String.eq(M.Msg.from(msg), M.USER()) && String.eq(M.Msg.to(msg), M.MAIN()),
        FwdOk{M.Msg.text(msg)},
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

# the outbox entry of a new send: the next xid, pending, never tried
def new_out(+x: XH.Xs, +project: String, +k: XH.XKind, +msg: Nat, +text: String) -> XH.Out:
  XH.Out{XH.Xs.next_xid(x), project, k, msg, text, XH.OPending{}, 0n}

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
      Bool.pick(List<&2, XH.Out>, is_pending(XH.Out.st(h)), h <> pendings(t), pendings(t))

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
def retry_act(+tm: TM.Tms, +xid: Nat, +tries: Nat, +now: Nat) -> TM.Act:
  TM.Act{TM.Tms.next_act(tm), Nat.add(now, backoff(tries)), TM.Retry{xid}}
