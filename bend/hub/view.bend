# hub/view.bend — the state the Rust views read (board, snapshot,
# contexts, prompts), as JSON: sb-core is the only source of truth, the
# daemon stores this as is. Its shape is declared in bise_proto::core::view
# (View, ViewAgent, ViewMsg); the encoders are generated (gen/view.bend).
import Base

import ../vendor/json.bend as J

import ./gen/view.bend as V

import ./model.bend as M

import ./codec.bend as C

import ./cx.bend as X

import ./core.bend as H

import ./timers.bend as TM
import ./wakes.bend as WK
import ./lazy.bend as LZ

def jdecl(d: Maybe<&2, M.Decl>, +note: String) -> J.Json:
  match d:
    case None{}:
      J.JNull{}
    case Some{+x}:
      J.obj([J.kv("status", J.JStr{C.decl_str(x)}), J.kv("note", J.JStr{note})])

# the recipient of a message (none: unknown message)
def waits_to(m: Maybe<&2, M.Msg>) -> Maybe<&2, String>:
  match m:
    case None{}:
      None{}
    case Some{+x}:
      Some{M.Msg.to(x)}

# who `n` waits on: the recipient of the message its first `sb wait` (or
# `sb ask`) waits for the reply to; none when it waits on no one
def waits_on(+ws: List<&2, X.Waiter>, +s: M.St, +n: String) -> Maybe<&2, String>:
  match ws:
    case Nil{}:
      None{}
    case Con{+w, +t}:
      LZ.pick(Maybe<&2, String>, String.eq(X.Waiter.agent(w), n),
        u => waits_to(M.msg_of(s, X.Waiter.msg(w))), u => waits_on(t, s, n))

def agent_json(+a: M.Agent, +x: X.Rt, +wo: Maybe<&2, String>) -> J.Json:
  V.agent(M.Agent.name(a), M.Agent.dir(a), M.Agent.is_main(a), M.Agent.parent(a),
    M.Agent.brief(a), M.Agent.created(a), M.Agent.ws(a), C.life_str(M.Agent.life(a)),
    M.Agent.failure(a), jdecl(M.Agent.declared(a), M.Agent.note(a)), M.Agent.report(a),
    M.Agent.aliases(a), M.Agent.files(a), M.Agent.snap(a), M.Agent.follow(a),
    H.run_str(X.Rt.run(x)), X.Rt.waiting(x), wo, X.Rt.turn(x), X.Rt.turns(x))

def is_archived(l: M.Life) -> Bool:
  match l:
    case M.LArchived{}:
      True{}
    case _:
      False{}

# a match, not Bool.pick: pick would encode every agent, kept or not
def agents_json.keep(keep: Bool, +a: M.Agent, +rts: List<&2, X.Rt>, +ws: List<&2, X.Waiter>, +s: M.St, +rest: List<&2, J.Json>) -> List<&2, J.Json>:
  match keep:
    case True{}:
      agent_json(a, H.rt_find(rts, M.Agent.name(a)), waits_on(ws, s, M.Agent.name(a))) <> rest
    case False{}:
      rest

# every agent (`all`), else the ones in `names` (the only ones a step
# can change, see `changed`). idle-cpu: a step's view sent every agent
# not archived, changed or not, and the hub ticks every 500 ms: ~127 KB
# per idle tick for 20 agents, re-encoded and re-parsed twice a second.
def agents_json(xs: List<&2, M.Agent>, +rts: List<&2, X.Rt>, +ws: List<&2, X.Waiter>, +s: M.St, +all: Bool, +names: List<&2, String>) -> List<&2, J.Json>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+a, +t}:
      agents_json.keep(all || M.str_in(names, M.Agent.name(a)),
        a, rts, ws, s, agents_json(t, rts, ws, s, all, names))

# a message, its state, and what the steps' predicates (model.bend) say
# of it: queued, or delivered owing a reply (the hub's Waiting reads them)
def rec_json(+r: M.MRec) -> J.Json:
  +st = M.MRec.st(r)
  V.msg(C.msg_json(M.MRec.msg(r)), J.obj(C.mst_kvs(st)), M.MRec.settled(r), M.is_queued(st), M.MRec.owes(r))

# a match, not Bool.pick: pick would encode every message, kept or not
def recs_json.keep(keep: Bool, +r: M.MRec, +rest: List<&2, J.Json>) -> List<&2, J.Json>:
  match keep:
    case True{}:
      rec_json(r) <> rest
    case False{}:
      rest

def recs_json(xs: List<&2, M.MRec>, +all: Bool, +ids: List<&2, Nat>) -> List<&2, J.Json>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+r, +t}:
      recs_json.keep(all || M.nat_in(ids, M.Msg.id(M.MRec.msg(r))), r, recs_json(t, all, ids))

# every id of `ids` is a message of `xs`
def ids_in(ids: List<&2, Nat>, +xs: List<&2, M.MRec>) -> Bool:
  match ids:
    case Nil{}:
      True{}
    case Con{+i, +t}:
      LZ.and(Maybe.is_some(&2, M.MRec, M.rec_of(xs, i)), u => ids_in(t, xs))

# the lowest id of `ids` (0 when none)
def ids_lo.go(ids: List<&2, Nat>, +acc: Nat) -> Nat:
  match ids:
    case Nil{}:
      acc
    case Con{+i, +t}:
      ids_lo.go(t, Nat.min(acc, i))

def ids_lo(ids: List<&2, Nat>) -> Nat:
  match ids:
    case Nil{}:
      0n
    case Con{+i, +t}:
      ids_lo.go(t, i)

# the head of `xs` has an id below `lo`
def id_below(xs: List<&2, M.MRec>, +lo: Nat) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, _}:
      Nat.is_lt(M.MRec.id(h), lo)

# the cold messages of `ids`, newest first: St.old is newest first, so the
# walk stops at the first id below the lowest one asked (`below`)
def old_of(xs: List<&2, M.MRec>, below: Bool, +ids: List<&2, Nat>, +lo: Nat) -> List<&2, M.MRec>:
  match xs below:
    case Nil{} _:
      Nil{}
    case Con{_, _} True{}:
      Nil{}
    case Con{+r, +t} False{}:
      +rest = old_of(t, id_below(t, lo), ids, lo)
      Bool.pick(List<&2, M.MRec>, M.nat_in(ids, M.MRec.id(r)), r <> rest, rest)

# where the view finds the step's messages (issue 21): the hot ones when
# they are all there (a message sent and still queued, or owing a reply);
# else the hot ones with the cold ones of `ids` (a message the step just
# turned cold), in send order; all of them (view_all): M.every
def view_recs.some(here: Bool, +s: M.St, +ids: List<&2, Nat>) -> List<&2, M.MRec>:
  match here:
    case True{}:
      M.St.hot(s)
    case False{}:
      +lo = ids_lo(ids)
      List.reverse(&2, M.MRec, M.ins_all(M.St.hot(s), old_of(M.St.old(s), id_below(M.St.old(s), lo), ids, lo)))

def view_recs.go(every: Bool, +s: M.St, +ids: List<&2, Nat>) -> List<&2, M.MRec>:
  match every:
    case True{}:
      M.every(s)
    case False{}:
      view_recs.some(ids_in(ids, M.St.hot(s)), s, ids)

def view_recs(+s: M.St, +all: Bool, +ids: List<&2, Nat>) -> List<&2, M.MRec>:
  view_recs.go(all, s, ids)

# the messages of the view: no walk of every message when the step
# touched none (an idle tick)
def msgs_json(walk: Bool, +xs: List<&2, M.MRec>, +all: Bool, +ids: List<&2, Nat>) -> List<&2, J.Json>:
  match walk:
    case True{}:
      recs_json(xs, all, ids)
    case False{}:
      Nil{}

def cards_json(xs: List<&2, M.Card>) -> List<&2, J.Json>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+c, +t}:
      C.card_json(c) <> cards_json(t)

def opt_list(m: Maybe<&2, Nat>) -> List<&2, Nat>:
  match m:
    case None{}:
      Nil{}
    case Some{+r}:
      [r]

# the message ids an event touches (a reply settles its question)
def ev_ids(e: M.Ev) -> List<&2, Nat>:
  match e:
    case M.EMsgSent{+m}:
      M.Msg.id(m) <> opt_list(M.Msg.reply_to(m))
    case M.EMsgState{+id, _}:
      [id]
    case M.ESettled{+id}:
      [id]
    case _:
      Nil{}

def touched(evs: List<&2, M.Ev>) -> List<&2, Nat>:
  match evs:
    case Nil{}:
      Nil{}
    case Con{+e, +t}:
      List.append(&2, Nat, ev_ids(e), touched(t))

# the agents an event changes (a rename: both names)
def ev_names(e: M.Ev) -> List<&2, String>:
  match e:
    case M.ETaskCreated{+name, _, _, _, _}:
      [name]
    case M.ELifecycle{+name, _, _}:
      [name]
    case M.EWorkspace{+name, _}:
      [name]
    case M.ESnapshot{+name, _}:
      [name]
    case M.EPlaced{+name, _, _}:
      [name]
    case M.EDeclared{+name, _, _}:
      [name]
    case M.EReported{+name, _}:
      [name]
    case M.EFileTouched{+name, _}:
      [name]
    case M.ERenamed{+name, +nn}:
      [name, nn]
    # S10: following and a job's end change the agent's row
    case M.EFollow{+name, _, _}:
      [name]
    case M.EJobEnd{+name, _}:
      [name]
    case _:
      Nil{}

def names_of(evs: List<&2, M.Ev>) -> List<&2, String>:
  match evs:
    case Nil{}:
      Nil{}
    case Con{+e, +t}:
      List.append(&2, String, ev_names(e), names_of(t))

# a runtime at rest: no REPL, no wait, no turn, no turn ended (what
# rt_find answers for an agent it does not know)
def rt_rest(turn: Maybe<&2, Nat>, down: Bool, waiting: Bool, turns: Nat) -> Bool:
  match turn:
    case None{}:
      match turns:
        case 0n:
          down && Bool.not(waiting)
        case 1n+_:
          False{}
    case Some{_}:
      False{}

# a mark of what an agent's view reads outside the durable state: a
# runtime not at rest (run, waiting, turn) or a wait (`sb wait`). A step
# changes that part of an agent's view only if it adds, removes or
# changes one of its marks (a runtime at rest is one value, the one
# rt_find answers for an agent it does not know).
type Mark is Data:
  Mark{name: String, key: String}

def Mark.name(x: Mark) -> String:
  match x:
    case Mark{+name, _}:
      name

def Mark.key(x: Mark) -> String:
  match x:
    case Mark{_, +key}:
      key

def mark_eq(+a: Mark, +b: Mark) -> Bool:
  String.eq(Mark.name(a), Mark.name(b)) && String.eq(Mark.key(a), Mark.key(b))

def turn_key(m: Maybe<&2, Nat>) -> String:
  match m:
    case None{}:
      "-"
    case Some{+t}:
      Nat.show(t)

def rt_key(+x: X.Rt) -> String:
  H.cat([H.run_str(X.Rt.run(x)), " ", Bool.pick(String, X.Rt.waiting(x), "w", "-"), " ", turn_key(X.Rt.turn(x)), " ", Nat.show(X.Rt.turns(x))])

def rt_marks.keep(rest: Bool, +x: X.Rt, +acc: List<&2, Mark>) -> List<&2, Mark>:
  match rest:
    case True{}:
      acc
    case False{}:
      Mark{X.Rt.name(x), rt_key(x)} <> acc

def rt_marks(rts: List<&2, X.Rt>) -> List<&2, Mark>:
  match rts:
    case Nil{}:
      Nil{}
    case Con{+x, +t}:
      rt_marks.keep(rt_rest(X.Rt.turn(x), H.is_down(X.Rt.run(x)), X.Rt.waiting(x), X.Rt.turns(x)), x, rt_marks(t))

def waiter_marks(ws: List<&2, X.Waiter>) -> List<&2, Mark>:
  match ws:
    case Nil{}:
      Nil{}
    case Con{+w, +t}:
      Mark{X.Waiter.agent(w), H.cat(["wait ", Nat.show(X.Waiter.token(w)), " ", Nat.show(X.Waiter.msg(w))])} <> waiter_marks(t)

# the marks of every runtime not at rest and every wait (main.bend takes
# them before a step, `changed` after it)
def marks(+rts: List<&2, X.Rt>, +ws: List<&2, X.Waiter>) -> List<&2, Mark>:
  List.append(&2, Mark, rt_marks(rts), waiter_marks(ws))

def mark_in(xs: List<&2, Mark>, +m: Mark) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, +t}:
      LZ.or(mark_eq(h, m), u => mark_in(t, m))

def gone.keep(kept: Bool, +m: Mark, +rest: List<&2, String>) -> List<&2, String>:
  match kept:
    case True{}:
      rest
    case False{}:
      Mark.name(m) <> rest

# the names of the marks of `xs` that are not in `ys`
def gone(xs: List<&2, Mark>, +ys: List<&2, Mark>) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+m, +t}:
      gone.keep(mark_in(ys, m), m, gone(t, ys))

# the agents a step may change (hub-lag, idle-cpu): the ones its events
# name (a durable change is an event, model.bend `apply`) and the ones
# whose marks it changed (`before`: the marks before the step). Every
# other agent is as the last view left it: the daemon keeps it. An idle
# tick changes none: its view carries no agent.
def changed.go(+names: List<&2, String>, +before: List<&2, Mark>, +after: List<&2, Mark>) -> List<&2, String>:
  List.append(&2, String, names, List.append(&2, String, gone(before, after), gone(after, before)))

def changed(+evs: List<&2, M.Ev>, +before: List<&2, Mark>, +rts: List<&2, X.Rt>, +ws: List<&2, X.Waiter>) -> List<&2, String>:
  changed.go(names_of(evs), before, marks(rts, ws))

# the order, the cards and the notes change only by an event (model.bend
# `apply`): a view with none (`durable` False) leaves them out, the
# daemon keeps its own. A match each, not Bool.pick: pick would encode
# them, sent or not.
def order_when(durable: Bool, +s: M.St) -> Maybe<&2, List<&2, String>>:
  match durable:
    case True{}:
      Some{M.St.order(s)}
    case False{}:
      None{}

def cards_when(durable: Bool, +s: M.St) -> Maybe<&2, List<&2, J.Json>>:
  match durable:
    case True{}:
      Some{cards_json(M.St.cards(s))}
    case False{}:
      None{}

def notes_when(durable: Bool, +s: M.St) -> Maybe<&2, List<&2, String>>:
  match durable:
    case True{}:
      Some{M.St.notes(s)}
    case False{}:
      None{}

# an event of the timers (`ended`: one that ends a timer)
def timer_ev(+ended: Bool, e: M.Ev) -> Bool:
  match e:
    case M.ETimerSet{_, _}:
      Bool.not(ended)
    case M.ETimerFired{_, _, _, _, _}:
      Bool.not(ended)
    case M.ETimerRun{_, _}:
      Bool.not(ended)
    case M.ETimerStop{_, _, _}:
      True{}
    case M.ETimerName{_, _, _, _}:
      Bool.not(ended)
    case _:
      False{}

def timer_evs(+ended: Bool, evs: List<&2, M.Ev>) -> Bool:
  match evs:
    case Nil{}:
      False{}
    case Con{+e, +t}:
      LZ.or(timer_ev(ended, e), u => timer_evs(ended, t))

# the timers (`sb every`) only when a step changed them: an idle tick
# carries none (idle-cpu), a fire no ended ones
def timers_live(go: Bool, +s: M.St) -> Maybe<&2, List<&2, J.Json>>:
  match go:
    case True{}:
      Some{TM.live_json(TM.Tms.live(M.St.tm(s)))}
    case False{}:
      None{}

def timers_ended(go: Bool, +s: M.St) -> Maybe<&2, List<&2, J.Json>>:
  match go:
    case True{}:
      Some{TM.ended_list_json(TM.Tms.ended(M.St.tm(s)))}
    case False{}:
      None{}

def wake_evs(evs: List<&2, M.Ev>) -> Bool:
  match evs:
    case Nil{}:
      False{}
    case Con{M.EWake{_}, _}:
      True{}
    case Con{_, +t}:
      wake_evs(t)

# the watches (`sb wake`, wakes.bend) only when a step changed them, or
# all: an idle tick carries none (idle-cpu)
def wakes_live(go: Bool, +s: M.St) -> Maybe<&2, List<&2, J.Json>>:
  match go:
    case True{}:
      Some{WK.live_json(WK.Wakes.live(TM.Tms.wk(M.St.tm(s))))}
    case False{}:
      None{}

def wakes_ended(go: Bool, +s: M.St) -> Maybe<&2, List<&2, J.Json>>:
  match go:
    case True{}:
      Some{WK.ended_list_json(WK.Wakes.ended(TM.Tms.wk(M.St.tm(s))))}
    case False{}:
      None{}

# the view: the agents in `names` (or all), the messages in `ids` (or
# all); the order, cards and notes when an event of `evs` (the step's
# journal) changed the durable state (or all); the timers and the
# watches when an event changed them (or all). cost-pause: `paused`
# (null: it runs) in every view, a few bytes.
def view.go(+s: M.St, +rts: List<&2, X.Rt>, +ws: List<&2, X.Waiter>, +all: Bool, +ids: List<&2, Nat>, +names: List<&2, String>, +durable: Bool, +timers: Bool, +ended: Bool, +wakes: Bool) -> J.Json:
  V.view(agents_json(M.St.agents(s), rts, ws, s, all, names), all,
    msgs_json(all || Bool.not(List.is_empty(&2, Nat, ids)), view_recs(s, all, ids), all, ids), all,
    M.St.next_msg(s), M.St.next_card(s), M.St.paused(s),
    order_when(durable, s), cards_when(durable, s), notes_when(durable, s),
    timers_live(timers, s), timers_ended(ended, s), wakes_live(wakes, s), wakes_ended(wakes, s))

def view(+s: M.St, +rts: List<&2, X.Rt>, +ws: List<&2, X.Waiter>, +all: Bool, +ids: List<&2, Nat>, +names: List<&2, String>, +evs: List<&2, M.Ev>) -> J.Json:
  view.go(s, rts, ws, all, ids, names, all || Bool.not(List.is_empty(&2, M.Ev, evs)),
    all || timer_evs(False{}, evs), all || timer_evs(True{}, evs), all || wake_evs(evs))
