# hub/model.bend — the Switchboard hub's durable state (RFC 0001 §12) and
# its events. `apply` is the only way the durable state changes; the
# Rust daemon keeps a read-only mirror of it (rust/switchboard/src/
# model.rs) fed by the journal events the hub emits.
import Base
import ../vendor/json.bend as J
import ./timers.bend as TM
import ./wakes.bend as WK
import ./xhub-model.bend as XH
import ./lazy.bend as LZ
import ./gone.bend as G
import ./names.bend as NM
import ./gen/state.bend as S

type Life is Data:
  LActive{}
  LStopped{}
  LArchived{}
  LFailed{}

type Run is Data:
  RDown{}
  RStarting{}
  RIdle{}
  RBusy{}

type Decl is Data:
  DWorking{}
  DDone{}
  DBlocked{}

type Agent is Data:
  Agent{name: String, is_main: Bool, parent: Maybe<&2, String>, life: Life,
    declared: Maybe<&2, Decl>, aliases: List<&2, String>,
    files: List<&2, String>, ws: J.Json, dir: String, brief: J.Json,
    created: Nat, failure: Maybe<&2, String>, note: String, report: J.Json,
    snap: Maybe<&2, String>, follow: Maybe<&2, String>}

type St is Data:
  St{agents: List<&2, Agent>, order: List<&2, String>, hot: List<&2, S.MRec>,
    cards: List<&2, S.Card>, notes: List<&2, String>, next_msg: Nat,
    next_card: Nat, tm: TM.Tms, x: XH.Xs, paused: Maybe<&2, Nat>,
    old: List<&2, S.MRec>, gone: List<&2, G.Item>}
# paused: since that ms (pause.bend; None runs); hot/old: the messages split
# (issue 21); gone: withdrawn cards he may still answer (gone.bend)

type Ev is Data:
  ETaskCreated{name: String, parent: String, brief: J.Json, ws: J.Json, at: Nat}
  ELifecycle{name: String, life: Life, reason: Maybe<&2, String>}
  EWorkspace{name: String, ws: J.Json}
  ESnapshot{name: String, snap: Maybe<&2, String>}
  # hub-loop: the worktree made for a placing task (`err` "": `ws`)
  EPlaced{name: String, ws: J.Json, err: String}
  EDeclared{name: String, status: Maybe<&2, Decl>, note: String}
  EReported{name: String, report: J.Json}
  EFileTouched{name: String, path: String}
  ERenamed{name: String, new_name: String}
  # name-free: a live agent's hot messages to its old name `from` (taken)
  EMsgsMoved{from: String, to: String}
  EMsgSent{msg: S.Msg}
  EMsgState{id: Nat, st: S.MSt}
  ESettled{id: Nat}
  ECardOpened{card: S.Card}
  # `ans` his answer (via "": closed without him, `resolution` says why)
  ECardClosed{id: Nat, resolution: String, ans: S.Ans}
  # his answer's route line position in the asker's thread (answer_pos_once)
  ECardAnswerPos{card: Nat, agent: String, pos: Nat}
  # main withdrew card `id` (`text`), his late answer delivered (gone.bend)
  ECardWithdrawn{id: Nat, text: String}
  ECardLate{id: Nat}
  EMainNote{text: String, at: Nat}
  ENotesFlushed{}
  # `sb every`'s timers (timers.bend): set, fired, run, stop, name (its
  # name; `announce`: the ◷ set line its held timer waited for)
  ETimerSet{t: TM.Timer, at: Nat}
  ETimerFired{id: Nat, fired: Nat, next: Nat, at: Nat, undelivered: Bool}
  ETimerRun{id: Nat, at: Nat}
  ETimerStop{id: Nat, why: String, at: Nat}
  ETimerName{id: Nat, name: String, announce: Bool, at: Nat}
  # bise desktop S2: the cross-hub state's lines (xhub-model.bend) and
  # the acts' (timers.bend): one constructor each, their kinds inside
  EX{e: XH.XEv}
  EAct{e: TM.ActEv}
  # S10: a follow (or its stop), a followed job's end: follow off (law
  # follow_one_shot); `hub` the asker, "" this hub (follow_hub_journaled)
  EFollow{name: String, on: Bool, hub: String}
  EJobEnd{name: String, state: String}
  # event-wake: `sb wake`'s watches (wakes.bend); an older core skips them
  EWake{e: WK.WkEv}
  # cost-pause (pause.bend): paused, resumed at `at`; an older core skips
  # them (after a rollback the project comes back unpaused)
  EPaused{at: Nat}
  EResumed{at: Nat}

type AgentOp is Data:
  OLife{life: Life, reason: Maybe<&2, String>}
  OSnap{snap: Maybe<&2, String>}
  OReport{report: J.Json}
  OWs{ws: J.Json}
  ODeclared{d: Maybe<&2, Decl>, note: String}
  OFile{path: String}
  ORename{new_name: String}
  OFollow{f: Maybe<&2, String>}

type MsgOp is Data:
  OSt{st: S.MSt}
  OSettle{}

def St.agents(x: St) -> List<&2, Agent>:
  match x:
    case St{+agents, _, _, _, _, _, _, _, _, _, _, _}:
      agents

def St.order(x: St) -> List<&2, String>:
  match x:
    case St{_, +order, _, _, _, _, _, _, _, _, _, _}:
      order

# the hot messages (MRec.is_hot), ids ascending: what the walks read
def St.hot(x: St) -> List<&2, S.MRec>:
  match x:
    case St{_, _, +hot, _, _, _, _, _, _, _, _, _}:
      hot

def St.cards(x: St) -> List<&2, S.Card>:
  match x:
    case St{_, _, _, +cards, _, _, _, _, _, _, _, _}:
      cards

def St.notes(x: St) -> List<&2, String>:
  match x:
    case St{_, _, _, _, +notes, _, _, _, _, _, _, _}:
      notes

def St.next_msg(x: St) -> Nat:
  match x:
    case St{_, _, _, _, _, +next_msg, _, _, _, _, _, _}:
      next_msg

def St.next_card(x: St) -> Nat:
  match x:
    case St{_, _, _, _, _, _, +next_card, _, _, _, _, _}:
      next_card

def St.tm(x: St) -> TM.Tms:
  match x:
    case St{_, _, _, _, _, _, _, +tm, _, _, _, _}:
      tm

def St.x(x: St) -> XH.Xs:
  match x:
    case St{_, _, _, _, _, _, _, _, +xs, _, _, _}:
      xs

# the cold messages, newest first (ids descending): a recent id is found
# near the head, a message that turns cold goes in there
def St.old(x: St) -> List<&2, S.MRec>:
  match x:
    case St{_, _, _, _, _, _, _, _, _, _, +old, _}:
      old

# the cards main withdrew he may still answer, newest first (hub/gone.bend)
def St.gone(x: St) -> List<&2, G.Item>:
  match x:
    case St{_, _, _, _, _, _, _, _, _, _, _, +gone}:
      gone

def St.paused(x: St) -> Maybe<&2, Nat>:
  match x:
    case St{_, _, _, _, _, _, _, _, _, +pz, _, _}:
      pz

# the first entry whose key is `k`
def find(~A: Data, ~K: Data, ~key: A -> K, ~eq: K -> K -> Bool, xs: List<&2, A>, +k: K) -> Maybe<&2, A>:
  match xs:
    case Nil{}:
      None{}
    case Con{+h, +t}:
      LZ.pick(Maybe<&2, A>, eq(key(h), k), u => Some{h}, u => find(~A, ~K, ~key, ~eq, t, k))

def rec_of(xs: List<&2, S.MRec>, +id: Nat) -> Maybe<&2, S.MRec>:
  find(~S.MRec, ~Nat, ~(r => S.Msg.id(S.MRec.msg(r))), ~(a => b => Nat.is_eq(a, b)), xs, id)

# `dir`: its folder, the stable id of its files (hub/names.bend free_dir)
def new_agent(+name: String, +dir: String, +is_main: Bool, +parent: Maybe<&2, String>, +ws: J.Json, +brief: J.Json, +created: Nat) -> Agent:
  Agent{name, is_main, parent, LActive{}, None{}, Nil{}, Nil{}, ws, dir, brief, created, None{}, "", J.JNull{}, None{}, None{}}

def Agent.name(x: Agent) -> String:
  match x:
    case Agent{+name, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _}:
      name

# replace (or add) the agent named `n`
def put_agent(xs: List<&2, Agent>, +n: String, +a: Agent) -> List<&2, Agent>:
  match xs:
    case Nil{}:
      [a]
    case Con{+h, +t}:
      LZ.pick(List<&2, Agent>, String.eq(Agent.name(h), n), u => a <> t, u => h <> put_agent(t, n, a))

def MAIN() -> String:
  "main"

def USER() -> String:
  "user"

def HUB() -> String:
  "switchboard"

# pr-news (pr-design §10): the pseudo sender of GitHub's news (reviews,
# comments, failing checks) to the agent that owns a PR; like a peer
def GITHUB() -> String:
  "github"

# ---- small helpers ----

def snoc(-A: Data, xs: List<&2, A>, +x: A) -> List<&2, A>:
  match xs:
    case Nil{}:
      [x]
    case Con{+h, +t}:
      h <> snoc(A, t, x)

def str_in(xs: List<&2, String>, +s: String) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, +t}:
      LZ.or(String.eq(h, s), u => str_in(t, s))

def nat_in(xs: List<&2, Nat>, +n: Nat) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, +t}:
      LZ.or(Nat.is_eq(h, n), u => nat_in(t, n))

def maybe_str_is(m: Maybe<&2, String>, +s: String) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{+x}:
      String.eq(x, s)

def maybe_nat_is(m: Maybe<&2, Nat>, +n: Nat) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{+x}:
      Nat.is_eq(x, n)

# one_line, clip, clip_tail: hub/text.bend
def trim_is_empty(+s: String) -> Bool:
  String.is_empty(String.trim(s))

# ---- lookups ----

def agent_named(xs: List<&2, Agent>, +n: String) -> Maybe<&2, Agent>:
  find(~Agent, ~String, ~Agent.name, ~(a => b => String.eq(a, b)), xs, n)

def Agent.aliases(x: Agent) -> List<&2, String>:
  match x:
    case Agent{_, _, _, _, _, +aliases, _, _, _, _, _, _, _, _, _, _}:
      aliases

def agent_alias(xs: List<&2, Agent>, +n: String) -> Maybe<&2, String>:
  match xs:
    case Nil{}:
      None{}
    case Con{+a, +t}:
      LZ.pick(Maybe<&2, String>, str_in(Agent.aliases(a), n), u => Some{Agent.name(a)}, u => agent_alias(t, n))

def get_agent(+st: St, +n: String) -> Maybe<&2, Agent>:
  agent_named(St.agents(st), n)

# the canonical name: itself, or the task an alias points to
def resolve.pick(m: Maybe<&2, Agent>, +st: St, +n: String) -> Maybe<&2, String>:
  match m:
    case Some{+a}:
      Some{Agent.name(a)}
    case None{}:
      agent_alias(St.agents(st), n)

def resolve(+st: St, +n: String) -> Maybe<&2, String>:
  resolve.pick(get_agent(st, n), st, n)

def reserved(+n: String) -> Bool:
  String.eq(n, MAIN()) || String.eq(n, USER()) || String.eq(n, HUB()) || String.eq(n, GITHUB())

def live_agent(m: Maybe<&2, Agent>) -> Bool:
  match m:
    case Some{Agent{_, _, _, LArchived{}, _, _, _, _, _, _, _, _, _, _, _, _}}:
      False{}
    case Some{_}:
      True{}
    case None{}:
      False{}

# name-free: a live (not archived) agent's name or bise's is taken; an
# archived one's and an old name are free (core take, apply's strip)
def name_taken(+st: St, +n: String) -> Bool:
  reserved(n) || live_agent(agent_named(St.agents(st), n))

# no agent has it (any life), nor bise: a take's event (cx FreshEv)
def name_held(+st: St, +n: String) -> Bool:
  reserved(n) || Maybe.is_some(&2, Agent, agent_named(St.agents(st), n))

def agent_op.decl(l: Life, +d: Maybe<&2, Decl>) -> Maybe<&2, Decl>:
  match l:
    case LActive{}:
      None{}
    case LStopped{}:
      d
    case LArchived{}:
      d
    case LFailed{}:
      d

def agent_op.file(known: Bool, +files: List<&2, String>, +p: String) -> List<&2, String>:
  match known:
    case True{}:
      files
    case False{}:
      snoc(String, files, p)

def agent_op(+a: Agent, op: AgentOp) -> Agent:
  match a:
    case Agent{+name, +is_main, +parent, +life, +declared, +aliases, +files, +ws, +dir, +brief, +created, +failure, +note, +report, +snap, +follow}:
      match op:
        case OLife{+l, +why}:
          Agent{name, is_main, parent, l, agent_op.decl(l, declared), aliases, files, ws, dir, brief, created, why, note, report, snap, follow}
        case OWs{+w}:
          Agent{name, is_main, parent, life, declared, aliases, files, w, dir, brief, created, failure, note, report, snap, follow}
        case ODeclared{+d, +n}:
          Agent{name, is_main, parent, life, d, aliases, files, ws, dir, brief, created, failure, n, report, snap, follow}
        case OFile{+p}:
          Agent{name, is_main, parent, life, declared, aliases, agent_op.file(str_in(files, p), files, p), ws, dir, brief, created, failure, note, report, snap, follow}
        case ORename{+nn}:
          Agent{nn, is_main, parent, life, declared, snoc(String, aliases, name), files, ws, dir, brief, created, failure, note, report, snap, follow}
        case OSnap{+sn}:
          Agent{name, is_main, parent, life, declared, aliases, files, ws, dir, brief, created, failure, note, report, sn, follow}
        case OReport{+rp}:
          Agent{name, is_main, parent, life, declared, aliases, files, ws, dir, brief, created, failure, note, rp, snap, follow}
        case OFollow{+f}:
          Agent{name, is_main, parent, life, declared, aliases, files, ws, dir, brief, created, failure, note, report, snap, f}

def Agent.strip(+a: Agent, +n: String) -> Agent:
  match a:
    case Agent{+name, +is_main, +parent, +life, +declared, +aliases, +files, +ws, +dir, +brief, +created, +failure, +note, +report, +snap, +follow}:
      Agent{name, is_main, parent, life, declared, NM.drop_str(aliases, n), files, ws, dir, brief, created, failure, note, report, snap, follow}

# the agents without the old name `n` (another agent takes it)
def strip(xs: List<&2, Agent>, +n: String) -> List<&2, Agent>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+a, +t}:
      Agent.strip(a, n) <> strip(t, n)

def dirs_of(xs: List<&2, Agent>) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{Agent{_, _, _, _, _, _, _, _, +dir, _, _, _, _, _, _, _}, +t}:
      dir <> dirs_of(t)

# the head of `xs` is the agent named `n`
def name_at(xs: List<&2, Agent>, +n: String) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, _}:
      String.eq(Agent.name(h), n)

# map_agent's walk: it stops at the agent (`hit`: name_at(xs, n)); a match,
# not Bool.pick (both branches: every agent, at every agent event)
def map_agent.go(xs: List<&2, Agent>, +hit: Bool, +n: String, +op: AgentOp) -> List<&2, Agent>:
  match xs hit:
    case Nil{} _:
      Nil{}
    case Con{+h, +t} True{}:
      agent_op(h, op) <> t
    case Con{+h, +t} False{}:
      h <> map_agent.go(t, name_at(t, n), n, op)

# apply an operation to the agent named `n` (no agent: nothing changes)
def map_agent(+xs: List<&2, Agent>, +n: String, +op: AgentOp) -> List<&2, Agent>:
  map_agent.go(xs, name_at(xs, n), n, op)

def rec_op(+r: S.MRec, op: MsgOp) -> S.MRec:
  match op:
    case OSt{+ns}:
      S.MRec.with_st(r, ns)
    case OSettle{}:
      S.MRec.with_settled(r, True{})

def map_msg(xs: List<&2, S.MRec>, +id: Nat, +op: MsgOp) -> List<&2, S.MRec>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      LZ.pick(List<&2, S.MRec>, Nat.is_eq(S.Msg.id(S.MRec.msg(h)), id), u => rec_op(h, op) <> t, u => h <> map_msg(t, id, op))

def drop_card(xs: List<&2, S.Card>, +id: Nat) -> List<&2, S.Card>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      LZ.pick(List<&2, S.Card>, Nat.is_eq(S.Card.id(h), id), u => t, u => h <> drop_card(t, id))

# a card from its fields, in S.Card's order (the generated setters)
def card(id: Nat, kind: String, agent: String, text: String, for_msg: Maybe<&2, Nat>, created: Nat, place: Maybe<&2, String>, pr: Maybe<&2, Nat>) -> S.Card:
  c0 = S.Card.with_kind(S.Card.with_id(S.Card.empty(), id), kind)
  c1 = S.Card.with_for_msg(S.Card.with_text(S.Card.with_agent(c0, agent), text), for_msg)
  S.Card.with_pr(S.Card.with_place(S.Card.with_created(c1, created), place), pr)

def put_card(xs: List<&2, S.Card>, +c: S.Card) -> List<&2, S.Card>:
  snoc(S.Card, drop_card(xs, S.Card.id(c)), c)

def is_queued(s: S.MSt) -> Bool:
  match s:
    case S.Queued{_}:
      True{}
    case S.Delivered{}:
      False{}
    case S.Rejected{_}:
      False{}
    case S.Cancelled{}:
      False{}
def is_delivered(s: S.MSt) -> Bool:
  match s:
    case S.Queued{_}:
      False{}
    case S.Delivered{}:
      True{}
    case S.Rejected{_}:
      False{}
    case S.Cancelled{}:
      False{}
# one of the messages is from the user
def any_from_user(xs: List<&2, S.Msg>) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, +t}:
      LZ.pick(Bool, String.eq(S.Msg.from(h), USER()), u => True{}, u => any_from_user(t))
# the record with its message to `to` (msgs_moved)
def MRec.to(+r: S.MRec, +to: String) -> S.MRec:
  S.MRec.with_msg(r, S.Msg.with_to(S.MRec.msg(r), to))
# a sent message's record: queued ("new"), not settled
def new_rec(+m: S.Msg) -> S.MRec:
  S.MRec.with_st(S.MRec.with_msg(S.MRec.empty(), m), S.Queued{"new"})
# a delivered message that expects a reply its recipient has not given:
# the steps (unanswered_in) and the view (view.bend rec_json) both read it
def MRec.owes(+r: S.MRec) -> Bool:
  S.Msg.expect(S.MRec.msg(r)) && Bool.not(S.MRec.settled(r)) && is_delivered(S.MRec.st(r))
# queued, or owing a reply (issue 21): St.hot's one predicate; "cold" else
def MRec.is_hot(+r: S.MRec) -> Bool:
  is_queued(S.MRec.st(r)) || MRec.owes(r)
# the hot messages of `xs`, in their order
def hot_of(xs: List<&2, S.MRec>) -> List<&2, S.MRec>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+r, +t}:
      +rest = hot_of(t)
      Bool.pick(List<&2, S.MRec>, MRec.is_hot(r), r <> rest, rest)
# the cold ones, in their order
def cold_of(xs: List<&2, S.MRec>) -> List<&2, S.MRec>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+r, +t}:
      +rest = cold_of(t)
      Bool.pick(List<&2, S.MRec>, MRec.is_hot(r), rest, r <> rest)
# ---- the split (issue 21 steps 3-4): St.hot ascending, St.old descending ----
def MRec.id(+r: S.MRec) -> Nat:
  S.Msg.id(S.MRec.msg(r))
# the head of `xs` has an id above `n`
def id_above(xs: List<&2, S.MRec>, +n: Nat) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, _}:
      Nat.is_gt(MRec.id(h), n)
# `r` into `xs` (ids descending), before the first id not above its own
def ins_desc.go(xs: List<&2, S.MRec>, gt: Bool, +r: S.MRec) -> List<&2, S.MRec>:
  match xs gt:
    case Nil{} _:
      [r]
    case Con{+h, +t} True{}:
      h <> ins_desc.go(t, id_above(t, MRec.id(r)), r)
    case Con{+h, +t} False{}:
      r <> h <> t
def ins_desc(+xs: List<&2, S.MRec>, +r: S.MRec) -> List<&2, S.MRec>:
  ins_desc.go(xs, id_above(xs, MRec.id(r)), r)
# `r` into `xs` (ids ascending), before the first id above its own
def ins_asc.go(xs: List<&2, S.MRec>, gt: Bool, +r: S.MRec) -> List<&2, S.MRec>:
  match xs gt:
    case Nil{} _:
      [r]
    case Con{+h, +t} True{}:
      r <> h <> t
    case Con{+h, +t} False{}:
      h <> ins_asc.go(t, id_above(t, MRec.id(r)), r)
def ins_asc(+xs: List<&2, S.MRec>, +r: S.MRec) -> List<&2, S.MRec>:
  ins_asc.go(xs, id_above(xs, MRec.id(r)), r)
# the messages of `hs` put into `os` (ids descending)
def ins_all(hs: List<&2, S.MRec>, +os: List<&2, S.MRec>) -> List<&2, S.MRec>:
  match hs:
    case Nil{}:
      os
    case Con{+r, +t}:
      ins_desc(ins_all(t, os), r)
# every message in send order (view_all; the laws' HI.Unique, HI.Kept)
def every(+st: St) -> List<&2, S.MRec>:
  List.reverse(&2, S.MRec, ins_all(St.hot(st), St.old(st)))
def drop_msg(xs: List<&2, S.MRec>, +id: Nat) -> List<&2, S.MRec>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      LZ.pick(List<&2, S.MRec>, Nat.is_eq(MRec.id(h), id), u => t, u => h <> drop_msg(t, id))
# the two sides after a message event
type Ms is Data:
  Ms{hot: List<&2, S.MRec>, old: List<&2, S.MRec>}
def Ms.hot(x: Ms) -> List<&2, S.MRec>:
  match x:
    case Ms{+hot, _}:
      hot
def Ms.old(x: Ms) -> List<&2, S.MRec>:
  match x:
    case Ms{_, +old}:
      old
# the op on a cold message: back to the hot side if it made it hot, else in place
def msg_op.cold.go(back: Bool, +c: S.MRec, +hot: List<&2, S.MRec>, +old: List<&2, S.MRec>, +id: Nat, +op: MsgOp) -> Ms:
  match back:
    case True{}:
      Ms{ins_asc(hot, rec_op(c, op)), drop_msg(old, id)}
    case False{}:
      Ms{hot, map_msg(old, id, op)}
def msg_op.cold(m: Maybe<&2, S.MRec>, +hot: List<&2, S.MRec>, +old: List<&2, S.MRec>, +id: Nat, +op: MsgOp) -> Ms:
  match m:
    case None{}:
      Ms{hot, old}
    case Some{+c}:
      msg_op.cold.go(MRec.is_hot(rec_op(c, op)), c, hot, old, id, op)
# the op on a hot message: the one it made cold goes to the old side
def msg_op.hot(+hs: List<&2, S.MRec>, +old: List<&2, S.MRec>) -> Ms:
  Ms{hot_of(hs), ins_all(cold_of(hs), old)}
def msg_op.in(in_hot: Bool, +hot: List<&2, S.MRec>, +old: List<&2, S.MRec>, +id: Nat, +op: MsgOp) -> Ms:
  match in_hot:
    case True{}:
      msg_op.hot(map_msg(hot, id, op), old)
    case False{}:
      msg_op.cold(rec_of(old, id), hot, old, id, op)
# a message event's op on the message `id`, and its move when it turns cold (or hot)
def msg_op(+hot: List<&2, S.MRec>, +old: List<&2, S.MRec>, +id: Nat, +op: MsgOp) -> Ms:
  msg_op.in(Maybe.is_some(&2, S.MRec, rec_of(hot, id)), hot, old, id, op)
def rec_in.go(m: Maybe<&2, S.MRec>, +old: List<&2, S.MRec>, +id: Nat) -> Maybe<&2, S.MRec>:
  match m:
    case None{}:
      rec_of(old, id)
    case Some{+r}:
      Some{r}
# the record of the message `id`, hot or cold
def rec_in(+hot: List<&2, S.MRec>, +old: List<&2, S.MRec>, +id: Nat) -> Maybe<&2, S.MRec>:
  rec_in.go(rec_of(hot, id), old, id)
def rec_at(+st: St, +id: Nat) -> Maybe<&2, S.MRec>:
  rec_in(St.hot(st), St.old(st), id)
# a reply from the recipient (or from the user) settles the question
def settle_in.if(ok: Bool, +hot: List<&2, S.MRec>, +old: List<&2, S.MRec>, +id: Nat) -> Ms:
  match ok:
    case True{}:
      msg_op(hot, old, id, OSettle{})
    case False{}:
      Ms{hot, old}
def settle_in.go(orig: Maybe<&2, S.MRec>, +hot: List<&2, S.MRec>, +old: List<&2, S.MRec>, +id: Nat, +from: String) -> Ms:
  match orig:
    case None{}:
      Ms{hot, old}
    case Some{+o}:
      settle_in.if(String.eq(S.Msg.to(S.MRec.msg(o)), from) || String.eq(from, USER()), hot, old, id)
def settle_in(r: Maybe<&2, Nat>, +hot: List<&2, S.MRec>, +old: List<&2, S.MRec>, +from: String) -> Ms:
  match r:
    case None{}:
      Ms{hot, old}
    case Some{+id}:
      settle_in.go(rec_in(hot, old, id), hot, old, id, from)

# name-free (msgs_moved): a hot record to `from` goes to `to`, same id
def moved.if(hit: Bool, +r: S.MRec, +to: String) -> S.MRec:
  match hit:
    case True{}:
      MRec.to(r, to)
    case False{}:
      r

def moved(xs: List<&2, S.MRec>, +from: String, +to: String) -> List<&2, S.MRec>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+r, +t}:
      moved.if(MRec.is_hot(r) && String.eq(S.Msg.to(S.MRec.msg(r)), from), r, to) <> moved(t, from, to)

def apply(+st: St, e: Ev) -> St:
  match st:
    case St{+agents, +order, +hot, +cards, +notes, +nm, +nc, +tm, +xs, +pz, +old, +gone}:
      match e:
        case ETaskCreated{+name, +parent, +brief, +ws, +at}:
          St{put_agent(strip(agents, name), name, new_agent(name, NM.free_dir(dirs_of(agents), name), False{}, Some{parent}, ws, brief, at)),
            Bool.pick(List<&2, String>, str_in(order, name), order, snoc(String, order, name)),
            hot, cards, notes, nm, nc, tm, xs, pz, old, gone}
        case ELifecycle{+name, +life, +reason}:
          St{map_agent(agents, name, OLife{life, reason}), order, hot, cards, notes, nm, nc, tm, xs, pz, old, gone}
        case EWorkspace{+name, +ws}:
          St{map_agent(agents, name, OWs{ws}), order, hot, cards, notes, nm, nc, tm, xs, pz, old, gone}
        case ESnapshot{+name, +snap}:
          St{map_agent(agents, name, OSnap{snap}), order, hot, cards, notes, nm, nc, tm, xs, pz, old, gone}
        case EPlaced{+name, +ws, +err}:
          St{Bool.pick(List<&2, Agent>, String.is_empty(err), map_agent(agents, name, OWs{ws}), agents), order, hot, cards, notes, nm, nc, tm, xs, pz, old, gone}
        case EDeclared{+name, +status, +note}:
          St{map_agent(agents, name, ODeclared{status, note}), order, hot, cards, notes, nm, nc, tm, xs, pz, old, gone}
        case EReported{+name, +report}:
          St{map_agent(agents, name, OReport{report}), order, hot, cards, notes, nm, nc, tm, xs, pz, old, gone}
        case EFileTouched{+name, +path}:
          St{map_agent(agents, name, OFile{path}), order, hot, cards, notes, nm, nc, tm, xs, pz, old, gone}
        case ERenamed{+name, +nn}:
          St{map_agent(strip(agents, nn), name, ORename{nn}), NM.rename_in(order, name, nn), hot, cards, notes, nm, nc, tm, xs, pz, old, gone}
        case EMsgsMoved{+from, +to}:
          St{agents, order, moved(hot, from, to), cards, notes, nm, nc, tm, xs, pz, old, gone}
        # the three message events, on the split (law cold_is_inert: on
        # every message, the same as one list's snoc, map_msg, settle)
        case EMsgSent{+m}:
          +p = settle_in(S.Msg.reply_to(m), snoc(S.MRec, hot, new_rec(m)), old, S.Msg.from(m))
          St{agents, order, Ms.hot(p), cards, notes, Nat.max(Nat.max(nm, 1n+S.Msg.id(m)), 1n+S.Msg.thread(m)), nc, tm, xs, pz, Ms.old(p), gone}
        case EMsgState{+id, +s}:
          +p = msg_op(hot, old, id, OSt{s})
          St{agents, order, Ms.hot(p), cards, notes, nm, nc, tm, xs, pz, Ms.old(p), gone}
        case ESettled{+id}:
          +p = msg_op(hot, old, id, OSettle{})
          St{agents, order, Ms.hot(p), cards, notes, nm, nc, tm, xs, pz, Ms.old(p), gone}
        case ECardOpened{+c}:
          St{agents, order, hot, put_card(cards, c), notes, nm, Nat.max(nc, 1n+S.Card.id(c)), tm, xs, pz, old, gone}
        case ECardClosed{+id, _, _}:
          St{agents, order, hot, drop_card(cards, id), notes, nm, nc, tm, xs, pz, old, gone}
        case ECardAnswerPos{_, _, _}:
          St{agents, order, hot, cards, notes, nm, nc, tm, xs, pz, old, gone}
        case ECardWithdrawn{+id, +text}:
          St{agents, order, hot, cards, notes, nm, nc, tm, xs, pz, old, G.add(gone, id, text)}
        case ECardLate{+id}:
          St{agents, order, hot, cards, notes, nm, nc, tm, xs, pz, old, G.drop(gone, id)}
        case EMainNote{+text, _}:
          St{agents, order, hot, cards, snoc(String, notes, text), nm, nc, tm, xs, pz, old, gone}
        case ENotesFlushed{}:
          St{agents, order, hot, cards, Nil{}, nm, nc, tm, xs, pz, old, gone}
        case ETimerSet{+t, _}:
          St{agents, order, hot, cards, notes, nm, nc, TM.set(tm, t), xs, pz, old, gone}
        case ETimerFired{+id, +fired, +next, +at, +undelivered}:
          St{agents, order, hot, cards, notes, nm, nc, TM.fired(tm, id, fired, next, at, undelivered), xs, pz, old, gone}
        case ETimerRun{+id, +at}:
          St{agents, order, hot, cards, notes, nm, nc, TM.run(tm, id, at), xs, pz, old, gone}
        case ETimerStop{+id, +why, +at}:
          St{agents, order, hot, cards, notes, nm, nc, TM.stop(tm, id, why, at), xs, pz, old, gone}
        case ETimerName{+id, +name, _, _}:
          St{agents, order, hot, cards, notes, nm, nc, TM.named(tm, id, name), xs, pz, old, gone}
        case EX{+xe}:
          St{agents, order, hot, cards, notes, nm, nc, tm, XH.apply(xs, xe), pz, old, gone}
        case EAct{+ae}:
          St{agents, order, hot, cards, notes, nm, nc, TM.act_apply(tm, ae), xs, pz, old, gone}
        case EFollow{+name, +on, +hub}:
          St{map_agent(agents, name, OFollow{Bool.pick(Maybe<&2, String>, on, Some{hub}, None{})}), order, hot, cards, notes, nm, nc, tm, xs, pz, old, gone}
        case EJobEnd{+name, _}:
          St{map_agent(agents, name, OFollow{None{}}), order, hot, cards, notes, nm, nc, tm, xs, pz, old, gone}
        case EWake{+we}:
          St{agents, order, hot, cards, notes, nm, nc, TM.wk_apply(tm, we), xs, pz, old, gone}
        case EPaused{+at}:
          St{agents, order, hot, cards, notes, nm, nc, tm, xs, Some{at}, old, gone}
        case EResumed{_}:
          St{agents, order, hot, cards, notes, nm, nc, tm, xs, None{}, old, gone}

# the state after a journal: the replay of a list of events
def apply_all(evs: List<&2, Ev>, +st: St) -> St:
  match evs:
    case Nil{}:
      st
    case Con{+e, +rest}:
      apply_all(rest, apply(st, e))

def card_of(xs: List<&2, S.Card>, +id: Nat) -> Maybe<&2, S.Card>:
  find(~S.Card, ~Nat, ~S.Card.id, ~(a => b => Nat.is_eq(a, b)), xs, id)

# queued_in's step: `q` first (most are delivered), then the names
def queued_in.keep(q: Bool, +ns: List<&2, String>, +m: S.Msg, +rest: List<&2, S.Msg>) -> List<&2, S.Msg>:
  match q:
    case True{}:
      Bool.pick(List<&2, S.Msg>, str_in(ns, S.Msg.to(m)), m <> rest, rest)
    case False{}:
      rest

def queued_in(xs: List<&2, S.MRec>, +ns: List<&2, String>) -> List<&2, S.Msg>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+r, +t}:
      queued_in.keep(is_queued(S.MRec.st(r)), ns, S.MRec.msg(r), queued_in(t, ns))

def names_of.go(m: Maybe<&2, Agent>) -> List<&2, String>:
  match m:
    case None{}:
      Nil{}
    case Some{+a}:
      Agent.aliases(a)

# an agent's names: its own and its old ones (until another agent takes one)
def names_of(+st: St, +n: String) -> List<&2, String>:
  n <> names_of.go(get_agent(st, n))

# messages waiting for delivery to `n` (under any of its names), oldest first
def queued_for(+st: St, +n: String) -> List<&2, S.Msg>:
  queued_in(St.hot(st), names_of(st, n))

def unanswered_in(xs: List<&2, S.MRec>, +ns: List<&2, String>) -> List<&2, S.Msg>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+r, +t}:
      +rest = unanswered_in(t, ns)
      Bool.pick(List<&2, S.Msg>, str_in(ns, S.Msg.to(S.MRec.msg(r))) && MRec.owes(r), S.MRec.msg(r) <> rest, rest)

# delivered messages to `n` that expect a reply it has not given
def unanswered_for(+st: St, +n: String) -> List<&2, S.Msg>:
  unanswered_in(St.hot(st), names_of(st, n))

def msg_of.go(m: Maybe<&2, S.MRec>) -> Maybe<&2, S.Msg>:
  match m:
    case None{}:
      None{}
    case Some{+r}:
      Some{S.MRec.msg(r)}

def msg_of(+st: St, +id: Nat) -> Maybe<&2, S.Msg>:
  msg_of.go(rec_at(st, id))

def state_of.go(m: Maybe<&2, S.MRec>) -> Maybe<&2, S.MSt>:
  match m:
    case None{}:
      None{}
    case Some{+r}:
      Some{S.MRec.st(r)}

def state_of(+st: St, +id: Nat) -> Maybe<&2, S.MSt>:
  state_of.go(rec_at(st, id))

def ws_worktree(+ws: J.Json) -> Bool:
  String.eq(J.get_str_or(ws, "mode", "shared"), "worktree")

def ws_dropped(+ws: J.Json) -> Bool:
  J.get_bool_or(ws, "dropped", False{})

# hub-loop: a worktree task whose worktree the shell is still making
def ws_placing(+ws: J.Json) -> Bool:
  String.eq(J.get_str_or(ws, "state", ""), "placing")

def ws_branch(+ws: J.Json) -> J.Json:
  Maybe.default(&2, J.Json, J.get(ws, "branch"), J.JNull{})

def ws_path(+ws: J.Json) -> String:
  J.get_str_or(ws, "path", "")

def init(+workspace: String) -> St:
  +ws = J.obj([J.kv("mode", J.str("shared")), J.kv("path", J.str(workspace)),
    J.kv("branch", J.JNull{}), J.kv("base_commit", J.JNull{}), J.kv("dropped", J.JBool{False{}})])
  +brief = J.obj([J.kv("objective", J.str("")), J.kv("context", J.str("")), J.kv("constraints", J.JArr{Nil{}}),
    J.kv("done_when", J.JNull{}), J.kv("report_format", J.JNull{})])
  St{[new_agent(MAIN(), MAIN(), True{}, None{}, ws, brief, 0n)], [MAIN()], Nil{}, Nil{}, Nil{}, 1n, 1n, TM.empty(), XH.empty(), None{}, Nil{}, Nil{}}

def Agent.is_main(x: Agent) -> Bool:
  match x:
    case Agent{_, +is_main, _, _, _, _, _, _, _, _, _, _, _, _, _, _}:
      is_main

def Agent.parent(x: Agent) -> Maybe<&2, String>:
  match x:
    case Agent{_, _, +parent, _, _, _, _, _, _, _, _, _, _, _, _, _}:
      parent

def Agent.life(x: Agent) -> Life:
  match x:
    case Agent{_, _, _, +life, _, _, _, _, _, _, _, _, _, _, _, _}:
      life

def Agent.declared(x: Agent) -> Maybe<&2, Decl>:
  match x:
    case Agent{_, _, _, _, +declared, _, _, _, _, _, _, _, _, _, _, _}:
      declared

def Agent.files(x: Agent) -> List<&2, String>:
  match x:
    case Agent{_, _, _, _, _, _, +files, _, _, _, _, _, _, _, _, _}:
      files

def Agent.ws(x: Agent) -> J.Json:
  match x:
    case Agent{_, _, _, _, _, _, _, +ws, _, _, _, _, _, _, _, _}:
      ws

def Agent.dir(x: Agent) -> String:
  match x:
    case Agent{_, _, _, _, _, _, _, _, +dir, _, _, _, _, _, _, _}:
      dir

def Agent.brief(x: Agent) -> J.Json:
  match x:
    case Agent{_, _, _, _, _, _, _, _, _, +brief, _, _, _, _, _, _}:
      brief

def Agent.created(x: Agent) -> Nat:
  match x:
    case Agent{_, _, _, _, _, _, _, _, _, _, +created, _, _, _, _, _}:
      created

def Agent.failure(x: Agent) -> Maybe<&2, String>:
  match x:
    case Agent{_, _, _, _, _, _, _, _, _, _, _, +failure, _, _, _, _}:
      failure

def Agent.note(x: Agent) -> String:
  match x:
    case Agent{_, _, _, _, _, _, _, _, _, _, _, _, +note, _, _, _}:
      note

def Agent.report(x: Agent) -> J.Json:
  match x:
    case Agent{_, _, _, _, _, _, _, _, _, _, _, _, _, +report, _, _}:
      report

def Agent.snap(x: Agent) -> Maybe<&2, String>:
  match x:
    case Agent{_, _, _, _, _, _, _, _, _, _, _, _, _, _, +snap, _}:
      snap

# bise desktop S10: someone asked to hear when it ends (one job: off again
# at its job_end)
def Agent.follow(x: Agent) -> Bool:
  match x:
    case Agent{_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, +f}:
      Maybe.is_some(&2, String, f)

# J: the hub its end goes back to ("" none: not followed, or followed by
# this hub's own main or window)
def Agent.follow_hub(x: Agent) -> String:
  match x:
    case Agent{_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, +f}:
      Maybe.default(&2, String, f, "")
