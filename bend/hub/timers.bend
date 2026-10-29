# hub/timers.bend — the timers of `sb every` (docs/ambient-roadmap.md B,
# standing orders) in sb-core's durable state: their records, how each of
# their journal lines changes them (`every_set`, `every_fired`,
# `every_run`, `every_stop`, applied by model.bend `apply`), the pure
# decisions over a record (is it due, why it ends, may it fire, its next
# time) and the view's JSON of them.
#
# Owns: the live timers (by id), the ended ones (at most ENDED_KEPT, for
# memory: the views show a week of them), the last id. `page` is an
# opaque pass-through (ambient-app's `sb every --page`).
# Not here: the steps that send, emit and ask (core.bend's `---- timers
# ----` section: they call send, pump and ask, which are core's, and
# Bend has no import cycles: this module is imported by model.bend, so
# it imports neither model nor core); the clock (Rust: the tick's `now`,
# every::next_daily for a daily timer); the words (Rust every.rs: labels,
# the list, the wake texts). The laws: bend/laws/hub.bend fire_is_a_message,
# wake_never_stacked, times_bound, stop_leaves_no_timer.
import Base

import ../vendor/json.bend as J

import ./gen/state.bend as S

import ./gen/state-codec.bend as SC

import ./wakes.bend as WK

import ./lazy.bend as LZ

# The records are declared once in bise_proto::core::state (gen/state.bend,
# read with S.T.f, changed with S.T.with_f):
# - S.Timer: `next` when it is due; `last` when it last woke its agent (0:
#   never); `runs` its last runs (at most RUNS_KEPT, oldest first); `name`
#   what the lists show ("" until `sb every --name` or the hub's
#   `every_name`); `held` set without a name, its ◷ set line not written
#   yet (the every_name that names it writes it, once: law
#   named_announces_once; an old line's timer was announced at its set);
#   `sched` (S.Sched): every `ms`, or every day at that minute (local
#   time, the hub's next_daily);
# - S.TimerEnd: a timer that ended, when (0: an old line without it) and why;
# - S.Tms: the agents' wake sources: the timers (and the acts, on the
#   same clock) and the watches of `sb wake` (`wk`, event-wake: what wakes
#   an agent on an event). The watches are wakes.bend's: WK owns every
#   function over `wk`; this module only holds it and applies its lines
#   (wk_apply);
# - S.Act (S.What): an act (bise desktop S2), an internal step sb-core
#   takes at a time, on the same clock and the same due rule as the wake
#   timers (the tick's now): send a held route (RouteSend, the route's id)
#   or try a cross-hub delivery again (Retry, the outbox's xid). Journal:
#   act_set, act_done (laws act_fires_once, act_due_only).
# Their journal and view JSON: gen/state-codec.bend (SC).

def RUNS_KEPT() -> Nat:
  5n

def ENDED_KEPT() -> Nat:
  200n

def MIN_MS() -> Nat:
  60000n

def empty() -> S.Tms:
  S.Tms.empty()

# ---- a timer's runs ----

def last_is(m: Maybe<&2, Nat>, +n: Nat) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{+x}:
      Nat.is_eq(x, n)

# the last RUNS_KEPT of `xs`
def keep_last(+xs: List<&2, Nat>) -> List<&2, Nat>:
  List.drop(&2, Nat, xs, Nat.sub(List.length(&2, Nat, xs), RUNS_KEPT()))

# a run at `at` (0, or the same as the last one: nothing)
def runs_add(+rs: List<&2, Nat>, +at: Nat) -> List<&2, Nat>:
  Bool.pick(List<&2, Nat>, Nat.is_eq(at, 0n) || last_is(List.last(&2, Nat, rs), at), rs,
    keep_last(List.append(&2, Nat, rs, [at])))

# an old `undelivered` line: its lost wake was the last run, not a run
def runs_unrun(+rs: List<&2, Nat>, +last: Nat) -> List<&2, Nat>:
  Bool.pick(List<&2, Nat>, last_is(List.last(&2, Nat, rs), last),
    List.take(&2, Nat, rs, Nat.sub(List.length(&2, Nat, rs), 1n)), rs)

# ---- one record, one line ----

# `every_fired`: its count, its next time, when it ran
def Timer.fire.ran(+x: S.Timer, +fired: Nat, +next: Nat, +at: Nat) -> S.Timer:
  S.Timer.with_runs(S.Timer.with_last(S.Timer.with_fired(S.Timer.with_next(x, next), fired), at), runs_add(S.Timer.runs(x), at))

# an `undelivered` line: sb-core's (its count unchanged, the wake was
# refused) only moves the next time; an old hub's (count - 1) took back
# the run it had counted
def Timer.fire.lost(+x: S.Timer, +fired: Nat, +next: Nat, +at: Nat) -> S.Timer:
  Bool.pick(S.Timer, Nat.is_eq(fired, S.Timer.fired(x)), S.Timer.with_next(x, next),
    S.Timer.with_runs(S.Timer.with_last(S.Timer.with_fired(S.Timer.with_next(x, next), fired), at), runs_unrun(S.Timer.runs(x), at)))

def Timer.fire(x: S.Timer, +fired: Nat, +next: Nat, +at: Nat, +undelivered: Bool) -> S.Timer:
  match undelivered:
    case False{}:
      Timer.fire.ran(x, fired, next, at)
    case True{}:
      Timer.fire.lost(x, fired, next, at)

# `every_run`: a run now, outside the count, the next wake unchanged
def Timer.run(+x: S.Timer, +at: Nat) -> S.Timer:
  S.Timer.with_runs(S.Timer.with_last(x, at), runs_add(S.Timer.runs(x), at))

# its name (from `sb every --name` or the hub's small model), every other
# field kept (law named_keeps_the_rest)
def Timer.named(x: S.Timer, +name: String) -> S.Timer:
  S.Timer.with_name(x, name)

# its ◷ set line is written: no longer held (law named_announces_once)
def Timer.shown(x: S.Timer) -> S.Timer:
  S.Timer.with_held(x, False{})

# `every_name`: its name, and its set line written (the line carries
# `announce` when it was held, a later one never: the step's own
# S.Timer.held decides it, core.bend timer_name)
def Timer.name_line(x: S.Timer, +name: String) -> S.Timer:
  Timer.shown(Timer.named(x, name))

# ---- the live list (sorted by id, like `sb every` lists them) ----

def find(xs: List<&2, S.Timer>, +id: Nat) -> Maybe<&2, S.Timer>:
  match xs:
    case Nil{}:
      None{}
    case Con{+h, +t}:
      LZ.pick(Maybe<&2, S.Timer>, Nat.is_eq(S.Timer.id(h), id), u => Some{h}, u => find(t, id))

# replace the timer of the same id, else insert it in id order
def put(xs: List<&2, S.Timer>, +x: S.Timer) -> List<&2, S.Timer>:
  match xs:
    case Nil{}:
      [x]
    case Con{+h, +t}:
      LZ.pick(List<&2, S.Timer>, Nat.is_eq(S.Timer.id(h), S.Timer.id(x)), u => x <> t,
        u => LZ.pick(List<&2, S.Timer>, Nat.is_lt(S.Timer.id(x), S.Timer.id(h)), v => x <> h <> t, v => h <> put(t, x)))

# every timer but those of id `id`
def drop(xs: List<&2, S.Timer>, +id: Nat) -> List<&2, S.Timer>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = drop(t, id)
      Bool.pick(List<&2, S.Timer>, Nat.is_eq(S.Timer.id(h), id), rest, h <> rest)

def fire_in(xs: List<&2, S.Timer>, +id: Nat, +fired: Nat, +next: Nat, +at: Nat, +undelivered: Bool) -> List<&2, S.Timer>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      Bool.pick(S.Timer, Nat.is_eq(S.Timer.id(h), id), Timer.fire(h, fired, next, at, undelivered), h)
        <> fire_in(t, id, fired, next, at, undelivered)

def run_in(xs: List<&2, S.Timer>, +id: Nat, +at: Nat) -> List<&2, S.Timer>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      Bool.pick(S.Timer, Nat.is_eq(S.Timer.id(h), id), Timer.run(h, at), h) <> run_in(t, id, at)

def named_in(xs: List<&2, S.Timer>, +id: Nat, +name: String) -> List<&2, S.Timer>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      Bool.pick(S.Timer, Nat.is_eq(S.Timer.id(h), id), Timer.name_line(h, name), h) <> named_in(t, id, name)

def str_in(xs: List<&2, String>, +s: String) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, +t}:
      LZ.or(String.eq(h, s), u => str_in(t, s))

# the ids of the timers whose agent is one of `ns` (an agent's names: its
# own and its old ones)
def ids_in(xs: List<&2, S.Timer>, +ns: List<&2, String>) -> List<&2, Nat>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = ids_in(t, ns)
      Bool.pick(List<&2, Nat>, str_in(ns, S.Timer.agent(h)), S.Timer.id(h) <> rest, rest)

# name-free: the live timers set under the old name `n` (another agent
# takes it), and one moved to its holder's name `agent` under id `id`
def of_name(xs: List<&2, S.Timer>, +n: String) -> List<&2, S.Timer>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = of_name(t, n)
      Bool.pick(List<&2, S.Timer>, String.eq(S.Timer.agent(h), n), h <> rest, rest)

def moved(t: S.Timer, +agent: String, +id: Nat) -> S.Timer:
  S.Timer.with_agent(S.Timer.with_id(t, id), agent)

# ---- for the law stop_leaves_no_timer (bend/proofs/hub.bend) ----

def nat_in(xs: List<&2, Nat>, +n: Nat) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, +t}:
      LZ.or(Nat.is_eq(n, h), u => nat_in(t, n))

# the timers whose id is not in `ids`
def keep_out(xs: List<&2, S.Timer>, +ids: List<&2, Nat>) -> List<&2, S.Timer>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = keep_out(t, ids)
      Bool.pick(List<&2, S.Timer>, nat_in(ids, S.Timer.id(h)), rest, h <> rest)

# every id of `xs` is in `ys`
def all_in(xs: List<&2, Nat>, +ys: List<&2, Nat>) -> Bool:
  match xs:
    case Nil{}:
      True{}
    case Con{+h, +t}:
      LZ.and(nat_in(ys, h), u => all_in(t, ys))

# ---- the state's changes, one per journal line ----

def set(+tm: S.Tms, +x: S.Timer) -> S.Tms:
  S.Tms.with_last_id(S.Tms.with_live(tm, put(S.Tms.live(tm), x)), Nat.max(S.Tms.last_id(tm), S.Timer.id(x)))

def fired(+tm: S.Tms, +id: Nat, +fired: Nat, +next: Nat, +at: Nat, +undelivered: Bool) -> S.Tms:
  S.Tms.with_live(tm, fire_in(S.Tms.live(tm), id, fired, next, at, undelivered))

def run(+tm: S.Tms, +id: Nat, +at: Nat) -> S.Tms:
  S.Tms.with_live(tm, run_in(S.Tms.live(tm), id, at))

# `every_name`: a live timer's name (an ended or unknown id: nothing)
def named(+tm: S.Tms, +id: Nat, +name: String) -> S.Tms:
  S.Tms.with_live(tm, named_in(S.Tms.live(tm), id, name))

def cap(+xs: List<&2, S.TimerEnd>) -> List<&2, S.TimerEnd>:
  List.drop(&2, S.TimerEnd, xs, Nat.sub(List.length(&2, S.TimerEnd, xs), ENDED_KEPT()))

# a timer that ended at `at`, and why
def ended_of(+x: S.Timer, +at: Nat, +why: String) -> S.TimerEnd:
  S.TimerEnd.with_why(S.TimerEnd.with_at(S.TimerEnd.with_t(S.TimerEnd.empty(), x), at), why)

def ended_add(m: Maybe<&2, S.Timer>, +xs: List<&2, S.TimerEnd>, +at: Nat, +why: String) -> List<&2, S.TimerEnd>:
  match m:
    case None{}:
      xs
    case Some{+x}:
      cap(List.append(&2, S.TimerEnd, xs, [ended_of(x, at, why)]))

# a stop: the timer leaves the live list (whatever was there), and joins
# the ended ones when it was live
def stop(+tm: S.Tms, +id: Nat, +why: String, +at: Nat) -> S.Tms:
  S.Tms.with_ended(S.Tms.with_live(tm, drop(S.Tms.live(tm), id)), ended_add(find(S.Tms.live(tm), id), S.Tms.ended(tm), at, why))

# ---- the acts (bise desktop S2) ----

def act_drop(xs: List<&2, S.Act>, +id: Nat) -> List<&2, S.Act>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = act_drop(t, id)
      Bool.pick(List<&2, S.Act>, Nat.is_eq(S.Act.id(h), id), rest, h <> rest)

def act_find(xs: List<&2, S.Act>, +id: Nat) -> Maybe<&2, S.Act>:
  match xs:
    case Nil{}:
      None{}
    case Con{+h, +t}:
      LZ.pick(Maybe<&2, S.Act>, Nat.is_eq(S.Act.id(h), id), u => Some{h}, u => act_find(t, id))

# an act: `id`, due at `due`, doing `what`
def act_of(+id: Nat, +due: Nat, +what: S.What) -> S.Act:
  S.Act.with_what(S.Act.with_due(S.Act.with_id(S.Act.empty(), id), due), what)

# act_set: one more act (its id the next free one)
def act_set(+tm: S.Tms, +a: S.Act) -> S.Tms:
  S.Tms.with_next_act(S.Tms.with_acts(tm, List.append(&2, S.Act, S.Tms.acts(tm), [a])), Nat.max(S.Tms.next_act(tm), 1n+S.Act.id(a)))

# act_done: it fired (or was dropped): gone, whatever it was
def act_done(+tm: S.Tms, +id: Nat) -> S.Tms:
  S.Tms.with_acts(tm, act_drop(S.Tms.acts(tm), id))

# the acts due at `now` (due <= now), in order
def acts_due(xs: List<&2, S.Act>, +now: Nat) -> List<&2, S.Act>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = acts_due(t, now)
      Bool.pick(List<&2, S.Act>, Nat.is_le(S.Act.due(h), now), h <> rest, rest)

# ---- the pure decisions (core.bend's timers section wires them) ----

def opt_le(m: Maybe<&2, Nat>, +now: Nat) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{+u}:
      Nat.is_le(u, now)

# its end time passed
def past_until(+x: S.Timer, +now: Nat) -> Bool:
  opt_le(S.Timer.until(x), now)

def is_due(+x: S.Timer, +now: Nat) -> Bool:
  Nat.is_le(S.Timer.next(x), now)

# something to look at in a tick: a timer due or past its end. A tick
# where none is (the common case) does nothing at all (idle-cpu, 51051c52)
def any_work(xs: List<&2, S.Timer>, +now: Nat) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, +t}:
      LZ.or(is_due(h, now) || past_until(h, now), u => any_work(t, now))

# why a timer ends at a tick (None: it does not): its agent is gone
# (unknown or archived), or its end time passed
def end_why(+x: S.Timer, +gone: Bool, +now: Nat) -> Maybe<&2, String>:
  Bool.pick(Maybe<&2, String>, gone, Some{String.concat(["@", S.Timer.agent(x), " is gone"])},
    Bool.pick(Maybe<&2, String>, past_until(x, now), Some{"its end time passed"}, None{}))

def under.go(m: Maybe<&2, Nat>, +fired: Nat) -> Bool:
  match m:
    case None{}:
      True{}
    case Some{+n}:
      Nat.is_lt(fired, n)

# below its times (no times: always)
def under(+x: S.Timer) -> Bool:
  under.go(S.Timer.times(x), S.Timer.fired(x))

def spent.go(m: Maybe<&2, Nat>, +fired: Nat) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{+n}:
      Nat.is_le(n, 1n+fired)

# the fire about to be counted is its last one (it ran its times)
def spent(+x: S.Timer) -> Bool:
  spent.go(S.Timer.times(x), S.Timer.fired(x))

def may_fire.go(due: Bool, +x: S.Timer, +ready: Bool, +now: Nat) -> Bool:
  match due:
    case False{}:
      True{}
    case True{}:
      ready && is_due(x, now) && under(x)

# the guard of every wake (law wake_never_stacked): its agent has no wake
# from bise still queued; a due wake also needs the timer due and under
# its times, and its agent active and reachable (idle: a turn; busy:
# steered into its turn; core.bend timer_ready, law timer_fires_busy)
def may_fire(+bise_queued: Bool, +due: Bool, +x: S.Timer, +ready: Bool, +now: Nat) -> Bool:
  Bool.not(bise_queued) && may_fire.go(due, x, ready, now)

# the next time of an every-N timer: a period after the due time, a
# missed period skipped (never caught up). A daily one: the hub's answer
# (every::next_daily, local time)
def next_every(+p: Nat, +from: Nat, +now: Nat) -> Nat:
  Bool.pick(Nat, Nat.is_le(Nat.add(from, p), now), Nat.add(now, p), Nat.add(from, p))

def next_of(s: S.Sched, +from: Nat, +now: Nat, +daily: Nat) -> Nat:
  match s:
    case S.Every{+p}:
      next_every(p, from, now)
    case S.Daily{_}:
      daily

def is_daily(s: S.Sched) -> Bool:
  match s:
    case S.Every{_}:
      False{}
    case S.Daily{_}:
      True{}

# ---- the view's lists (each item: gen/state-codec.bend's view shape) ----

def live_json(xs: List<&2, S.Timer>) -> List<&2, J.Json>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      SC.Timer.view_json(h) <> live_json(t)

def ended_list_json(xs: List<&2, S.TimerEnd>) -> List<&2, J.Json>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      SC.TimerEnd.view_json(h) <> ended_list_json(t)

# the acts' journal kinds (model.bend's Ev EAct)
type ActEv is Data:
  ActSet{a: S.Act}
  ActDone{id: Nat}

# the watches' lines (model.bend's Ev EWake, hub/wakes.bend): they live
# beside the timers and the acts, the hub's other standing waits
def wk_apply(+tm: S.Tms, e: WK.WkEv) -> S.Tms:
  S.Tms.with_wk(tm, WK.apply(S.Tms.wk(tm), e))

def act_apply(+tm: S.Tms, e: ActEv) -> S.Tms:
  match e:
    case ActSet{+a}:
      act_set(tm, a)
    case ActDone{+id}:
      act_done(tm, id)
