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

type MSt is Data:
  Queued{reason: String}
  Delivered{}
  Rejected{error: String}
  Cancelled{}

type Msg is Data:
  Msg{id: Nat, thread: Nat, from: String, to: String, reply_to: Maybe<&2, Nat>,
    expect: Bool, auto: Bool, text: String, created: Nat, plain: Bool,
    queued: Bool, via: Maybe<&2, String>, parts: String}

# a message, its delivery state and whether it got its (first) reply
type MRec is Data:
  MRec{msg: Msg, st: MSt, settled: Bool}

# `place` and `pr`: what a card asks about, when it is a place's (the
# ready-to-merge item: the place's id and the PR's number, pr-design §6.3)
type Card is Data:
  Card{id: Nat, kind: String, agent: String, text: String,
    for_msg: Maybe<&2, Nat>, created: Nat, place: Maybe<&2, String>,
    pr: Maybe<&2, Nat>}

# his answer to a card, as its close journals it (inbox-record): `said`
# his words, `pick_n`/`pick` the option he picked by its number and its
# words ("" none), `via` where he answered: "inbox", "thread", "page"
# ("" none: not answered), `page`/`block` the page's question
type Ans is Data:
  Ans{said: String, pick_n: Maybe<&2, Nat>, pick: String, via: String,
    page: String, block: String}

# a card closed without his answer
def no_ans() -> Ans:
  Ans{"", None{}, "", "", "", ""}

type Agent is Data:
  Agent{name: String, is_main: Bool, parent: Maybe<&2, String>, life: Life,
    declared: Maybe<&2, Decl>, aliases: List<&2, String>,
    files: List<&2, String>, ws: J.Json, dir: String, brief: J.Json,
    created: Nat, failure: Maybe<&2, String>, note: String, report: J.Json,
    snap: Maybe<&2, String>, follow: Maybe<&2, String>}

type St is Data:
  St{agents: List<&2, Agent>, order: List<&2, String>, hot: List<&2, MRec>,
    cards: List<&2, Card>, notes: List<&2, String>, next_msg: Nat,
    next_card: Nat, tm: TM.Tms, x: XH.Xs, paused: Maybe<&2, Nat>,
    old: List<&2, MRec>}
# paused: the project's pause (cost-pause, hub/pause.bend), since that
# ms; None: it runs. hot and old: the messages, split (issue 21, St.hot)

type Ev is Data:
  ETaskCreated{name: String, parent: String, brief: J.Json, ws: J.Json, at: Nat}
  ELifecycle{name: String, life: Life, reason: Maybe<&2, String>}
  EWorkspace{name: String, ws: J.Json}
  ESnapshot{name: String, snap: Maybe<&2, String>}
  EDeclared{name: String, status: Maybe<&2, Decl>, note: String}
  EReported{name: String, report: J.Json}
  EFileTouched{name: String, path: String}
  ERenamed{name: String, new_name: String}
  EMsgSent{msg: Msg}
  EMsgState{id: Nat, st: MSt}
  ESettled{id: Nat}
  ECardOpened{card: Card}
  # inbox-record (architect m_24257): `ans` his answer when he gave one
  # (Ans.via "" when the card closed without him: `resolution` says why)
  ECardClosed{id: Nat, resolution: String, ans: Ans}
  # the asker's thread position of the route line his answer became: a
  # fact the shell knows once written, no state (law answer_pos_once)
  ECardAnswerPos{card: Nat, agent: String, pos: Nat}
  EMainNote{text: String, at: Nat}
  ENotesFlushed{}
  # the timers of `sb every` (timers.bend): every_set, every_fired (an
  # old line may say `undelivered`), every_run, every_stop, every_name
  # (its name, from the hub's small model or its plain fallback;
  # `announce`: it writes the ◷ set line its held timer waited for)
  ETimerSet{t: TM.Timer, at: Nat}
  ETimerFired{id: Nat, fired: Nat, next: Nat, at: Nat, undelivered: Bool}
  ETimerRun{id: Nat, at: Nat}
  ETimerStop{id: Nat, why: String, at: Nat}
  ETimerName{id: Nat, name: String, announce: Bool, at: Nat}
  # bise desktop S2: the cross-hub state's lines (xhub-model.bend) and
  # the acts' (timers.bend): one constructor each, their kinds inside
  EX{e: XH.XEv}
  EAct{e: TM.ActEv}
  # bise desktop S10: someone follows the agent (or stops), and the end of
  # a followed job (done or failed), journaled once: it turns follow off
  # (one job per follow, law follow_one_shot). `hub`: the hub that asked
  # (bise's home hub, through `sb follow <p>/<agent>`; "" this hub's own
  # main or window): its end goes back there (J, law follow_hub_journaled)
  EFollow{name: String, on: Bool, hub: String}
  EJobEnd{name: String, state: String}
  # event-wake: the watches of `sb wake` (wakes.bend), wake_set and
  # wake_end (an older sb-core reads them as unknown: skipped)
  EWake{e: WK.WkEv}
  # cost-pause (hub/pause.bend): the project paused at `at`, resumed at
  # `at`. An older sb-core reads them as unknown, skipped: after a
  # rollback the project comes back unpaused
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
  OSt{st: MSt}
  OSettle{}

def MRec.msg(x: MRec) -> Msg:
  match x:
    case MRec{+msg, _, _}:
      msg

def MRec.st(x: MRec) -> MSt:
  match x:
    case MRec{_, +st, _}:
      st

def MRec.settled(x: MRec) -> Bool:
  match x:
    case MRec{_, _, +settled}:
      settled

def Card.id(x: Card) -> Nat:
  match x:
    case Card{+id, _, _, _, _, _, _, _}:
      id

def Card.kind(x: Card) -> String:
  match x:
    case Card{_, +kind, _, _, _, _, _, _}:
      kind

def Card.agent(x: Card) -> String:
  match x:
    case Card{_, _, +agent, _, _, _, _, _}:
      agent

def Card.text(x: Card) -> String:
  match x:
    case Card{_, _, _, +text, _, _, _, _}:
      text

def Card.for_msg(x: Card) -> Maybe<&2, Nat>:
  match x:
    case Card{_, _, _, _, +for_msg, _, _, _}:
      for_msg

def Card.created(x: Card) -> Nat:
  match x:
    case Card{_, _, _, _, _, +created, _, _}:
      created

def Card.place(x: Card) -> Maybe<&2, String>:
  match x:
    case Card{_, _, _, _, _, _, +place, _}:
      place

def Card.pr(x: Card) -> Maybe<&2, Nat>:
  match x:
    case Card{_, _, _, _, _, _, _, +pr}:
      pr

def St.agents(x: St) -> List<&2, Agent>:
  match x:
    case St{+agents, _, _, _, _, _, _, _, _, _, _}:
      agents

def St.order(x: St) -> List<&2, String>:
  match x:
    case St{_, +order, _, _, _, _, _, _, _, _, _}:
      order

# the messages a step can still change or must read (MRec.is_hot:
# queued, or owing a reply), ids ascending (their send order). The
# walks (queued_for, unanswered_for, the pause's) read these only.
def St.hot(x: St) -> List<&2, MRec>:
  match x:
    case St{_, _, +hot, _, _, _, _, _, _, _, _}:
      hot

def St.cards(x: St) -> List<&2, Card>:
  match x:
    case St{_, _, _, +cards, _, _, _, _, _, _, _}:
      cards

def St.notes(x: St) -> List<&2, String>:
  match x:
    case St{_, _, _, _, +notes, _, _, _, _, _, _}:
      notes

def St.next_msg(x: St) -> Nat:
  match x:
    case St{_, _, _, _, _, +next_msg, _, _, _, _, _}:
      next_msg

def St.next_card(x: St) -> Nat:
  match x:
    case St{_, _, _, _, _, _, +next_card, _, _, _, _}:
      next_card

def St.tm(x: St) -> TM.Tms:
  match x:
    case St{_, _, _, _, _, _, _, +tm, _, _, _}:
      tm

def St.x(x: St) -> XH.Xs:
  match x:
    case St{_, _, _, _, _, _, _, _, +xs, _, _}:
      xs

# every other message (cold: delivered, rejected or cancelled, owing
# nothing), newest first (ids descending): a lookup by a recent id stops
# near the head, and a message that turns cold goes in at the head
def St.old(x: St) -> List<&2, MRec>:
  match x:
    case St{_, _, _, _, _, _, _, _, _, _, +old}:
      old

def St.paused(x: St) -> Maybe<&2, Nat>:
  match x:
    case St{_, _, _, _, _, _, _, _, _, +pz, _}:
      pz

def Msg.id(x: Msg) -> Nat:
  match x:
    case Msg{+id, _, _, _, _, _, _, _, _, _, _, _, _}:
      id

# the first entry whose key is `k`
def find(~A: Data, ~K: Data, ~key: A -> K, ~eq: K -> K -> Bool, xs: List<&2, A>, +k: K) -> Maybe<&2, A>:
  match xs:
    case Nil{}:
      None{}
    case Con{+h, +t}:
      LZ.pick(Maybe<&2, A>, eq(key(h), k), u => Some{h}, u => find(~A, ~K, ~key, ~eq, t, k))

def rec_of(xs: List<&2, MRec>, +id: Nat) -> Maybe<&2, MRec>:
  find(~MRec, ~Nat, ~(r => Msg.id(MRec.msg(r))), ~(a => b => Nat.is_eq(a, b)), xs, id)

def new_agent(+name: String, +is_main: Bool, +parent: Maybe<&2, String>, +ws: J.Json, +brief: J.Json, +created: Nat) -> Agent:
  Agent{name, is_main, parent, LActive{}, None{}, Nil{}, Nil{}, ws, name, brief, created, None{}, "", J.JNull{}, None{}, None{}}

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

def rename_in(xs: List<&2, String>, +old: String, +new: String) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      Bool.pick(String, String.eq(h, old), new, h) <> rename_in(t, old, new)

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

def name_taken(+st: St, +n: String) -> Bool:
  String.eq(n, MAIN()) || String.eq(n, USER()) || String.eq(n, HUB()) || String.eq(n, GITHUB()) || Maybe.is_some(&2, String, resolve(st, n))

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

# the head of `xs` is the agent named `n`
def name_at(xs: List<&2, Agent>, +n: String) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, _}:
      String.eq(Agent.name(h), n)

# map_agent's walk: it stops at the agent (`hit`: name_at(xs, n)). Not
# Bool.pick, which computes both branches: the op ran on every agent and
# the walk went to the end of the list, at each agent event of a step and
# of the boot's replay.
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

def rec_op(+r: MRec, op: MsgOp) -> MRec:
  match r:
    case MRec{+m, +s, +settled}:
      match op:
        case OSt{+ns}:
          MRec{m, ns, settled}
        case OSettle{}:
          MRec{m, s, True{}}

def map_msg(xs: List<&2, MRec>, +id: Nat, +op: MsgOp) -> List<&2, MRec>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      LZ.pick(List<&2, MRec>, Nat.is_eq(Msg.id(MRec.msg(h)), id), u => rec_op(h, op) <> t, u => h <> map_msg(t, id, op))

def drop_card(xs: List<&2, Card>, +id: Nat) -> List<&2, Card>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      LZ.pick(List<&2, Card>, Nat.is_eq(Card.id(h), id), u => t, u => h <> drop_card(t, id))

def put_card(xs: List<&2, Card>, +c: Card) -> List<&2, Card>:
  snoc(Card, drop_card(xs, Card.id(c)), c)

# the hub's items with numbered options (opened by the hub's Rust side,
# `card_open`): the user's digit goes back to Rust (`card_choice`), which
# acts and closes the item; typed words go to main
def choice_kind(+k: String) -> Bool:
  String.eq(k, "merge") || String.eq(k, "feature_try") || String.eq(k, "feature_merge") || String.eq(k, "update") || String.eq(k, "signin")

# a page's own card (plan-ok): a plan an agent proposes, or a page's
# question or drawn pick (notif-artifact), asked by that agent (core.bend
# page_card); his answer is the hub's page path
def page_kind(+k: String) -> Bool:
  String.eq(k, "plan") || String.eq(k, "question")

# BISE-299: the user's inbox holds only what needs the user, by kind, set
# at the card's creation: main's escalations (`question`: `sb card`,
# `drop`: main's drop of a task with attention) and, later, tool-call
# confirmations (`confirm`), and the hub's own items about a place
# (`merge`: a PR ready to merge, pr-design §6.3). Only the user answers or
# closes them. The agents' traffic (reports, blocked, overlap, crashes) is
# main's, never a card: an older journal's cards of other kinds close at
# boot.
def user_kind(+k: String) -> Bool:
  String.eq(k, "question") || String.eq(k, "drop") || String.eq(k, "confirm") || choice_kind(k) || page_kind(k)

# the ids of the open cards that are not the user's (an older journal's)
def legacy_cards(xs: List<&2, Card>) -> List<&2, Nat>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = legacy_cards(t)
      Bool.pick(List<&2, Nat>, user_kind(Card.kind(h)), rest, Card.id(h) <> rest)

# the open card that holds message `id` (an escalated question)
def card_holding(xs: List<&2, Card>, +id: Nat) -> Maybe<&2, Nat>:
  match xs:
    case Nil{}:
      None{}
    case Con{+h, +t}:
      LZ.pick(Maybe<&2, Nat>, maybe_nat_is(Card.for_msg(h), id), u => Some{Card.id(h)}, u => card_holding(t, id))

def Msg.to(x: Msg) -> String:
  match x:
    case Msg{_, _, _, +to, _, _, _, _, _, _, _, _, _}:
      to

def Msg.reply_to(x: Msg) -> Maybe<&2, Nat>:
  match x:
    case Msg{_, _, _, _, +reply_to, _, _, _, _, _, _, _, _}:
      reply_to

def Msg.from(x: Msg) -> String:
  match x:
    case Msg{_, _, +from, _, _, _, _, _, _, _, _, _, _}:
      from

def Msg.thread(x: Msg) -> Nat:
  match x:
    case Msg{_, +thread, _, _, _, _, _, _, _, _, _, _, _}:
      thread
def is_queued(s: MSt) -> Bool:
  match s:
    case Queued{_}:
      True{}
    case Delivered{}:
      False{}
    case Rejected{_}:
      False{}
    case Cancelled{}:
      False{}
def is_delivered(s: MSt) -> Bool:
  match s:
    case Queued{_}:
      False{}
    case Delivered{}:
      True{}
    case Rejected{_}:
      False{}
    case Cancelled{}:
      False{}
def Msg.expect(x: Msg) -> Bool:
  match x:
    case Msg{_, _, _, _, _, +expect, _, _, _, _, _, _, _}:
      expect
# a delivered message that expects a reply its recipient has not given:
# the steps (unanswered_in) and the view (view.bend rec_json) both read it
def MRec.owes(+r: MRec) -> Bool:
  Msg.expect(MRec.msg(r)) && Bool.not(MRec.settled(r)) && is_delivered(MRec.st(r))
# a message a step can still change or must read (issue 21): queued, or
# owing a reply. The one predicate of St.hot; its negation is "cold":
# delivered, rejected or cancelled, and owing nothing.
def MRec.is_hot(+r: MRec) -> Bool:
  is_queued(MRec.st(r)) || MRec.owes(r)
# the hot messages of `xs`, in their order
def hot_of(xs: List<&2, MRec>) -> List<&2, MRec>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+r, +t}:
      +rest = hot_of(t)
      Bool.pick(List<&2, MRec>, MRec.is_hot(r), r <> rest, rest)
# the cold ones, in their order
def cold_of(xs: List<&2, MRec>) -> List<&2, MRec>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+r, +t}:
      +rest = cold_of(t)
      Bool.pick(List<&2, MRec>, MRec.is_hot(r), rest, r <> rest)
# ---- the split (issue 21 steps 3-4): St.hot ascending, St.old descending ----
def MRec.id(+r: MRec) -> Nat:
  Msg.id(MRec.msg(r))
# the head of `xs` has an id above `n`
def id_above(xs: List<&2, MRec>, +n: Nat) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, _}:
      Nat.is_gt(MRec.id(h), n)
# `r` into `xs` (ids descending), before the first id not above its own
def ins_desc.go(xs: List<&2, MRec>, gt: Bool, +r: MRec) -> List<&2, MRec>:
  match xs gt:
    case Nil{} _:
      [r]
    case Con{+h, +t} True{}:
      h <> ins_desc.go(t, id_above(t, MRec.id(r)), r)
    case Con{+h, +t} False{}:
      r <> h <> t
def ins_desc(+xs: List<&2, MRec>, +r: MRec) -> List<&2, MRec>:
  ins_desc.go(xs, id_above(xs, MRec.id(r)), r)
# `r` into `xs` (ids ascending), before the first id above its own
def ins_asc.go(xs: List<&2, MRec>, gt: Bool, +r: MRec) -> List<&2, MRec>:
  match xs gt:
    case Nil{} _:
      [r]
    case Con{+h, +t} True{}:
      r <> h <> t
    case Con{+h, +t} False{}:
      h <> ins_asc.go(t, id_above(t, MRec.id(r)), r)
def ins_asc(+xs: List<&2, MRec>, +r: MRec) -> List<&2, MRec>:
  ins_asc.go(xs, id_above(xs, MRec.id(r)), r)
# the messages of `hs` put into `os` (ids descending)
def ins_all(hs: List<&2, MRec>, +os: List<&2, MRec>) -> List<&2, MRec>:
  match hs:
    case Nil{}:
      os
    case Con{+r, +t}:
      ins_desc(ins_all(t, os), r)
# every message in send order (view_all; the laws' HI.Unique, HI.Kept)
def every(+st: St) -> List<&2, MRec>:
  List.reverse(&2, MRec, ins_all(St.hot(st), St.old(st)))
def drop_msg(xs: List<&2, MRec>, +id: Nat) -> List<&2, MRec>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      LZ.pick(List<&2, MRec>, Nat.is_eq(MRec.id(h), id), u => t, u => h <> drop_msg(t, id))
# the two sides after a message event
type Ms is Data:
  Ms{hot: List<&2, MRec>, old: List<&2, MRec>}
def Ms.hot(x: Ms) -> List<&2, MRec>:
  match x:
    case Ms{+hot, _}:
      hot
def Ms.old(x: Ms) -> List<&2, MRec>:
  match x:
    case Ms{_, +old}:
      old
# the op on a cold message: back to the hot side if it made it hot, else in place
def msg_op.cold.go(back: Bool, +c: MRec, +hot: List<&2, MRec>, +old: List<&2, MRec>, +id: Nat, +op: MsgOp) -> Ms:
  match back:
    case True{}:
      Ms{ins_asc(hot, rec_op(c, op)), drop_msg(old, id)}
    case False{}:
      Ms{hot, map_msg(old, id, op)}
def msg_op.cold(m: Maybe<&2, MRec>, +hot: List<&2, MRec>, +old: List<&2, MRec>, +id: Nat, +op: MsgOp) -> Ms:
  match m:
    case None{}:
      Ms{hot, old}
    case Some{+c}:
      msg_op.cold.go(MRec.is_hot(rec_op(c, op)), c, hot, old, id, op)
# the op on a hot message: the one it made cold goes to the old side
def msg_op.hot(+hs: List<&2, MRec>, +old: List<&2, MRec>) -> Ms:
  Ms{hot_of(hs), ins_all(cold_of(hs), old)}
def msg_op.in(in_hot: Bool, +hot: List<&2, MRec>, +old: List<&2, MRec>, +id: Nat, +op: MsgOp) -> Ms:
  match in_hot:
    case True{}:
      msg_op.hot(map_msg(hot, id, op), old)
    case False{}:
      msg_op.cold(rec_of(old, id), hot, old, id, op)
# a message event's op on the message `id`, and its move when it turns cold (or hot)
def msg_op(+hot: List<&2, MRec>, +old: List<&2, MRec>, +id: Nat, +op: MsgOp) -> Ms:
  msg_op.in(Maybe.is_some(&2, MRec, rec_of(hot, id)), hot, old, id, op)
def rec_in.go(m: Maybe<&2, MRec>, +old: List<&2, MRec>, +id: Nat) -> Maybe<&2, MRec>:
  match m:
    case None{}:
      rec_of(old, id)
    case Some{+r}:
      Some{r}
# the record of the message `id`, hot or cold
def rec_in(+hot: List<&2, MRec>, +old: List<&2, MRec>, +id: Nat) -> Maybe<&2, MRec>:
  rec_in.go(rec_of(hot, id), old, id)
def rec_at(+st: St, +id: Nat) -> Maybe<&2, MRec>:
  rec_in(St.hot(st), St.old(st), id)
# a reply from the recipient (or from the user) settles the question
def settle_in.if(ok: Bool, +hot: List<&2, MRec>, +old: List<&2, MRec>, +id: Nat) -> Ms:
  match ok:
    case True{}:
      msg_op(hot, old, id, OSettle{})
    case False{}:
      Ms{hot, old}
def settle_in.go(orig: Maybe<&2, MRec>, +hot: List<&2, MRec>, +old: List<&2, MRec>, +id: Nat, +from: String) -> Ms:
  match orig:
    case None{}:
      Ms{hot, old}
    case Some{+o}:
      settle_in.if(String.eq(Msg.to(MRec.msg(o)), from) || String.eq(from, USER()), hot, old, id)
def settle_in(r: Maybe<&2, Nat>, +hot: List<&2, MRec>, +old: List<&2, MRec>, +from: String) -> Ms:
  match r:
    case None{}:
      Ms{hot, old}
    case Some{+id}:
      settle_in.go(rec_in(hot, old, id), hot, old, id, from)

def apply(+st: St, e: Ev) -> St:
  match st:
    case St{+agents, +order, +hot, +cards, +notes, +nm, +nc, +tm, +xs, +pz, +old}:
      match e:
        case ETaskCreated{+name, +parent, +brief, +ws, +at}:
          St{put_agent(agents, name, new_agent(name, False{}, Some{parent}, ws, brief, at)),
            Bool.pick(List<&2, String>, str_in(order, name), order, snoc(String, order, name)),
            hot, cards, notes, nm, nc, tm, xs, pz, old}
        case ELifecycle{+name, +life, +reason}:
          St{map_agent(agents, name, OLife{life, reason}), order, hot, cards, notes, nm, nc, tm, xs, pz, old}
        case EWorkspace{+name, +ws}:
          St{map_agent(agents, name, OWs{ws}), order, hot, cards, notes, nm, nc, tm, xs, pz, old}
        case ESnapshot{+name, +snap}:
          St{map_agent(agents, name, OSnap{snap}), order, hot, cards, notes, nm, nc, tm, xs, pz, old}
        case EDeclared{+name, +status, +note}:
          St{map_agent(agents, name, ODeclared{status, note}), order, hot, cards, notes, nm, nc, tm, xs, pz, old}
        case EReported{+name, +report}:
          St{map_agent(agents, name, OReport{report}), order, hot, cards, notes, nm, nc, tm, xs, pz, old}
        case EFileTouched{+name, +path}:
          St{map_agent(agents, name, OFile{path}), order, hot, cards, notes, nm, nc, tm, xs, pz, old}
        case ERenamed{+name, +nn}:
          St{map_agent(agents, name, ORename{nn}), rename_in(order, name, nn), hot, cards, notes, nm, nc, tm, xs, pz, old}
        # the three message events, on the split (law cold_is_inert: on
        # every message, the same as one list's snoc, map_msg, settle)
        case EMsgSent{+m}:
          +p = settle_in(Msg.reply_to(m), snoc(MRec, hot, MRec{m, Queued{"new"}, False{}}), old, Msg.from(m))
          St{agents, order, Ms.hot(p), cards, notes, Nat.max(Nat.max(nm, 1n+Msg.id(m)), 1n+Msg.thread(m)), nc, tm, xs, pz, Ms.old(p)}
        case EMsgState{+id, +s}:
          +p = msg_op(hot, old, id, OSt{s})
          St{agents, order, Ms.hot(p), cards, notes, nm, nc, tm, xs, pz, Ms.old(p)}
        case ESettled{+id}:
          +p = msg_op(hot, old, id, OSettle{})
          St{agents, order, Ms.hot(p), cards, notes, nm, nc, tm, xs, pz, Ms.old(p)}
        case ECardOpened{+c}:
          St{agents, order, hot, put_card(cards, c), notes, nm, Nat.max(nc, 1n+Card.id(c)), tm, xs, pz, old}
        case ECardClosed{+id, _, _}:
          St{agents, order, hot, drop_card(cards, id), notes, nm, nc, tm, xs, pz, old}
        case ECardAnswerPos{_, _, _}:
          St{agents, order, hot, cards, notes, nm, nc, tm, xs, pz, old}
        case EMainNote{+text, _}:
          St{agents, order, hot, cards, snoc(String, notes, text), nm, nc, tm, xs, pz, old}
        case ENotesFlushed{}:
          St{agents, order, hot, cards, Nil{}, nm, nc, tm, xs, pz, old}
        case ETimerSet{+t, _}:
          St{agents, order, hot, cards, notes, nm, nc, TM.set(tm, t), xs, pz, old}
        case ETimerFired{+id, +fired, +next, +at, +undelivered}:
          St{agents, order, hot, cards, notes, nm, nc, TM.fired(tm, id, fired, next, at, undelivered), xs, pz, old}
        case ETimerRun{+id, +at}:
          St{agents, order, hot, cards, notes, nm, nc, TM.run(tm, id, at), xs, pz, old}
        case ETimerStop{+id, +why, +at}:
          St{agents, order, hot, cards, notes, nm, nc, TM.stop(tm, id, why, at), xs, pz, old}
        case ETimerName{+id, +name, _, _}:
          St{agents, order, hot, cards, notes, nm, nc, TM.named(tm, id, name), xs, pz, old}
        case EX{+xe}:
          St{agents, order, hot, cards, notes, nm, nc, tm, XH.apply(xs, xe), pz, old}
        case EAct{+ae}:
          St{agents, order, hot, cards, notes, nm, nc, TM.act_apply(tm, ae), xs, pz, old}
        case EFollow{+name, +on, +hub}:
          St{map_agent(agents, name, OFollow{Bool.pick(Maybe<&2, String>, on, Some{hub}, None{})}), order, hot, cards, notes, nm, nc, tm, xs, pz, old}
        case EJobEnd{+name, _}:
          St{map_agent(agents, name, OFollow{None{}}), order, hot, cards, notes, nm, nc, tm, xs, pz, old}
        case EWake{+we}:
          St{agents, order, hot, cards, notes, nm, nc, TM.wk_apply(tm, we), xs, pz, old}
        case EPaused{+at}:
          St{agents, order, hot, cards, notes, nm, nc, tm, xs, Some{at}, old}
        case EResumed{_}:
          St{agents, order, hot, cards, notes, nm, nc, tm, xs, None{}, old}

# the state after a journal: the replay of a list of events
def apply_all(evs: List<&2, Ev>, +st: St) -> St:
  match evs:
    case Nil{}:
      st
    case Con{+e, +rest}:
      apply_all(rest, apply(st, e))

def card_of(xs: List<&2, Card>, +id: Nat) -> Maybe<&2, Card>:
  find(~Card, ~Nat, ~Card.id, ~(a => b => Nat.is_eq(a, b)), xs, id)

# queued_in's step: `q` (is the message queued) is matched first, most
# messages are delivered; only a queued one is compared with the names
def queued_in.keep(q: Bool, +ns: List<&2, String>, +m: Msg, +rest: List<&2, Msg>) -> List<&2, Msg>:
  match q:
    case True{}:
      Bool.pick(List<&2, Msg>, str_in(ns, Msg.to(m)), m <> rest, rest)
    case False{}:
      rest

def queued_in(xs: List<&2, MRec>, +ns: List<&2, String>) -> List<&2, Msg>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+r, +t}:
      queued_in.keep(is_queued(MRec.st(r)), ns, MRec.msg(r), queued_in(t, ns))

def names_of.go(m: Maybe<&2, Agent>) -> List<&2, String>:
  match m:
    case None{}:
      Nil{}
    case Some{+a}:
      Agent.aliases(a)

# an agent's names: its own and its old ones (a message sent before a
# rename is still for it)
def names_of(+st: St, +n: String) -> List<&2, String>:
  n <> names_of.go(get_agent(st, n))

# messages waiting for delivery to `n` (under any of its names), oldest first
def queued_for(+st: St, +n: String) -> List<&2, Msg>:
  queued_in(St.hot(st), names_of(st, n))

def unanswered_in(xs: List<&2, MRec>, +ns: List<&2, String>) -> List<&2, Msg>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+r, +t}:
      +rest = unanswered_in(t, ns)
      Bool.pick(List<&2, Msg>, str_in(ns, Msg.to(MRec.msg(r))) && MRec.owes(r), MRec.msg(r) <> rest, rest)

# delivered messages to `n` that expect a reply it has not given
def unanswered_for(+st: St, +n: String) -> List<&2, Msg>:
  unanswered_in(St.hot(st), names_of(st, n))

def msg_of.go(m: Maybe<&2, MRec>) -> Maybe<&2, Msg>:
  match m:
    case None{}:
      None{}
    case Some{+r}:
      Some{MRec.msg(r)}

def msg_of(+st: St, +id: Nat) -> Maybe<&2, Msg>:
  msg_of.go(rec_at(st, id))

def state_of.go(m: Maybe<&2, MRec>) -> Maybe<&2, MSt>:
  match m:
    case None{}:
      None{}
    case Some{+r}:
      Some{MRec.st(r)}

def state_of(+st: St, +id: Nat) -> Maybe<&2, MSt>:
  state_of.go(rec_at(st, id))

def ws_worktree(+ws: J.Json) -> Bool:
  String.eq(J.get_str_or(ws, "mode", "shared"), "worktree")

def ws_dropped(+ws: J.Json) -> Bool:
  J.get_bool_or(ws, "dropped", False{})

def ws_branch(+ws: J.Json) -> J.Json:
  Maybe.default(&2, J.Json, J.get(ws, "branch"), J.JNull{})

def ws_path(+ws: J.Json) -> String:
  J.get_str_or(ws, "path", "")

def init(+workspace: String) -> St:
  +ws = J.obj([J.kv("mode", J.str("shared")), J.kv("path", J.str(workspace)),
    J.kv("branch", J.JNull{}), J.kv("base_commit", J.JNull{}), J.kv("dropped", J.JBool{False{}})])
  +brief = J.obj([J.kv("objective", J.str("")), J.kv("context", J.str("")), J.kv("constraints", J.JArr{Nil{}}),
    J.kv("done_when", J.JNull{}), J.kv("report_format", J.JNull{})])
  St{[new_agent(MAIN(), True{}, None{}, ws, brief, 0n)], [MAIN()], Nil{}, Nil{}, Nil{}, 1n, 1n, TM.empty(), XH.empty(), None{}, Nil{}}

def Msg.auto(x: Msg) -> Bool:
  match x:
    case Msg{_, _, _, _, _, _, +auto, _, _, _, _, _, _}:
      auto

def Msg.text(x: Msg) -> String:
  match x:
    case Msg{_, _, _, _, _, _, _, +text, _, _, _, _, _}:
      text

def Msg.created(x: Msg) -> Nat:
  match x:
    case Msg{_, _, _, _, _, _, _, _, +created, _, _, _, _}:
      created

def Msg.plain(x: Msg) -> Bool:
  match x:
    case Msg{_, _, _, _, _, _, _, _, _, +plain, _, _, _}:
      plain

def Msg.queued(x: Msg) -> Bool:
  match x:
    case Msg{_, _, _, _, _, _, _, _, _, _, +queued, _, _}:
      queued

def Msg.via(x: Msg) -> Maybe<&2, String>:
  match x:
    case Msg{_, _, _, _, _, _, _, _, _, _, _, +via, _}:
      via

# his message's parts (msg-parts): the clients' JSON (bise_proto::parts),
# opaque here, "" for none; sb-core never decides on them, it keeps them
# with the message and writes them at its delivery (deliver.line)
def Msg.parts(x: Msg) -> String:
  match x:
    case Msg{_, _, _, _, _, _, _, _, _, _, _, _, +parts}:
      parts

# the same message with parts `p` (law parts_never_change_text)
def Msg.with_parts(x: Msg, +p: String) -> Msg:
  match x:
    case Msg{+i, +th, +f, +to, +r, +e, +a, +tx, +c, +pl, +q, +v, _}:
      Msg{i, th, f, to, r, e, a, tx, c, pl, q, v, p}

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

def Agent.follow.of(f: Maybe<&2, String>) -> Bool:
  match f:
    case None{}:
      False{}
    case Some{_}:
      True{}

# bise desktop S10: someone asked to hear when it ends (one job: off again
# at its job_end)
def Agent.follow(x: Agent) -> Bool:
  match x:
    case Agent{_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, +f}:
      Agent.follow.of(f)

# J: the hub its end goes back to ("" none: not followed, or followed by
# this hub's own main or window)
def Agent.follow_hub(x: Agent) -> String:
  match x:
    case Agent{_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, +f}:
      Maybe.default(&2, String, f, "")

# dev-flow §3.1: the place of a ws: "shared", or its worktree's id (the
# Rust Workspace::place_id; an older journal's worktree has none: its
# agent's own place, wt:<dir>)
def ws_place(+ws: J.Json, +dir: String) -> String:
  Bool.pick(String, ws_worktree(ws), J.get_str_or(ws, "place", String.append("wt:", dir)), "shared")

def Agent.place(+a: Agent) -> String:
  ws_place(Agent.ws(a), Agent.dir(a))
