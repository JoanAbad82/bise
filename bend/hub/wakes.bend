# hub/wakes.bend — the watches of `sb wake` (event-wake): an agent waits
# for an event instead of a timer (its backgrounded bash command ends, a
# pid or a launchd job exits, a file appears) and bise wakes it ONCE with
# one line. Their records in sb-core's durable state, how their journal
# lines change them (`wake_set`, `wake_end`, applied by model.bend `apply`
# through EWake), the pure decisions over them (a live one by id, the ones
# past their max, an agent's) and the view's JSON of them.
#
# Owns: the live watches, the ended ones (at most ENDED_KEPT, for `sb
# wake`'s list), the last id; and the one kind sb-core sets itself, a
# `reply` watch (ask-wait: an ask's hold ended with no reply, a pause from
# the ask; `make_reply`, the reply/done/drop decisions). A watch is one-shot: it ends at its first
# hit, at its max, at its stop or with its agent (dropped). Whether a
# watch is a pause (`resumes`: its agent continues its work at the end,
# `sb wake --then`) or an alarm (its agent is free, only woken if it
# fires, `--alarm`), and the default by kind when the agent said neither
# (`resumes_of`: a bash command or a pid it started is a pause, a file or
# a launchd job an alarm; designer's page agent-waiting-states, pick A).
# It changes who sees the wait (the clients), never how it wakes.
# Not here: the look (Rust: daemon/wakes.rs probes each live watch on the
# tick: a file, a pid and its start time, a launchd job, a bash slot's
# .rc); the words (Rust wake.rs: the hit line, the "still running" line
# given at set as `max_text`); `spec` is the look's, opaque here; the steps
# that send (core.bend's `---- watches ----` section: send is core's).
# Laws: bend/laws/hub.bend wake_hit_once, wake_gone_never_hits, wake_drop_ends,
# wake_max_once, wake_replay_keeps; bend/laws/wakes.bend wake_bg_pauses,
# wake_pid_pauses, wake_file_alarms, wake_job_alarms, wake_unknown_alarms,
# wake_then_wins, wake_set_keeps_run, wake_set_keeps_agents,
# wake_own_stop_quiet, wake_his_stop_tells, wake_stop_gone_quiet,
# wake_reply_pauses, ask_timeout_pauses, ask_pause_resumes, ask_max_tells,
# ask_once, ask_reply_ends, ask_reply_ends_quiet, ask_done_ends,
# ask_done_quiet, ask_target_gone_tells.
import Base

import ../vendor/json.bend as J

# `spec`: what to look at (Rust's: kind, path, pid, start, label, slot,
# tail, note); `max_text`: the wake at its max ("" with `quiet`); `quiet`:
# its max ends it without a wake (a bash slot: a dev server runs for days);
# `resumes`: a pause (True) or an alarm (False)
type Watch is Data:
  Watch{id: Nat, agent: String, spec: J.Json, max_text: String, set_at: Nat,
    max_at: Nat, quiet: Bool, resumes: Bool}

# what a watch looks at, as its spec's `kind` says (Rust wake.rs `What`);
# a kind this version doesn't know is KOther
type WatchKind is Data:
  KBg{}
  KPid{}
  KFile{}
  KJob{}
  KReply{}
  KOther{}

# a watch that ended: when and why (hit, max, stop, gone)
type Ended is Data:
  Ended{w: Watch, at: Nat, why: String}

type Wakes is Data:
  Wakes{live: List<&2, Watch>, ended: List<&2, Ended>, last_id: Nat}

# the journal's kinds (model.bend's Ev EWake)
type WkEv is Data:
  WSet{w: Watch}
  WEnd{id: Nat, why: String, at: Nat}

def ENDED_KEPT() -> Nat:
  50n

def empty() -> Wakes:
  Wakes{Nil{}, Nil{}, 0n}

# ---- fields ----

def Watch.id(x: Watch) -> Nat:
  match x:
    case Watch{+id, _, _, _, _, _, _, _}:
      id

def Watch.agent(x: Watch) -> String:
  match x:
    case Watch{_, +agent, _, _, _, _, _, _}:
      agent

def Watch.spec(x: Watch) -> J.Json:
  match x:
    case Watch{_, _, +spec, _, _, _, _, _}:
      spec

def Watch.max_text(x: Watch) -> String:
  match x:
    case Watch{_, _, _, +t, _, _, _, _}:
      t

def Watch.set_at(x: Watch) -> Nat:
  match x:
    case Watch{_, _, _, _, +at, _, _, _}:
      at

def Watch.max_at(x: Watch) -> Nat:
  match x:
    case Watch{_, _, _, _, _, +at, _, _}:
      at

def Watch.quiet(x: Watch) -> Bool:
  match x:
    case Watch{_, _, _, _, _, _, +q, _}:
      q

def Watch.resumes(x: Watch) -> Bool:
  match x:
    case Watch{_, _, _, _, _, _, _, +r}:
      r

def Wakes.live(x: Wakes) -> List<&2, Watch>:
  match x:
    case Wakes{+live, _, _}:
      live

def Wakes.ended(x: Wakes) -> List<&2, Ended>:
  match x:
    case Wakes{_, +ended, _}:
      ended

def Wakes.last_id(x: Wakes) -> Nat:
  match x:
    case Wakes{_, _, +last}:
      last

# ---- lists ----

def find(xs: List<&2, Watch>, +id: Nat) -> Maybe<&2, Watch>:
  match xs:
    case Nil{}:
      None{}
    case Con{+h, +t}:
      Bool.pick(Maybe<&2, Watch>, Nat.is_eq(Watch.id(h), id), Some{h}, find(t, id))

def drop(xs: List<&2, Watch>, +id: Nat) -> List<&2, Watch>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = drop(t, id)
      Bool.pick(List<&2, Watch>, Nat.is_eq(Watch.id(h), id), rest, h <> rest)

def str_in(xs: List<&2, String>, +s: String) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, +t}:
      String.eq(h, s) || str_in(t, s)

def cap(+xs: List<&2, Ended>) -> List<&2, Ended>:
  List.drop(&2, Ended, xs, Nat.sub(List.length(&2, Ended, xs), ENDED_KEPT()))

def ended_add(m: Maybe<&2, Watch>, +xs: List<&2, Ended>, +at: Nat, +why: String) -> List<&2, Ended>:
  match m:
    case None{}:
      xs
    case Some{+x}:
      cap(List.append(&2, Ended, xs, [Ended{x, at, why}]))

# ---- the state's changes, one per journal line ----

# wake_set: one more live watch (a second line with its id replaces it)
def set(+ws: Wakes, +x: Watch) -> Wakes:
  match ws:
    case Wakes{+live, +ended, +last}:
      Wakes{List.append(&2, Watch, drop(live, Watch.id(x)), [x]), ended, Nat.max(last, Watch.id(x))}

# wake_end: it leaves the live list (whatever was there) and joins the
# ended ones when it was live
def end(+ws: Wakes, +id: Nat, +why: String, +at: Nat) -> Wakes:
  match ws:
    case Wakes{+live, +ended, +last}:
      Wakes{drop(live, id), ended_add(find(live, id), ended, at, why), last}

def apply(+ws: Wakes, e: WkEv) -> Wakes:
  match e:
    case WSet{+x}:
      set(ws, x)
    case WEnd{+id, +why, +at}:
      end(ws, id, why, at)

# ---- the pure decisions (core.bend's watches section wires them) ----

# the kind a spec names (its `kind`: bg, pid, file, job)
def kind.str(+k: String) -> WatchKind:
  Bool.pick(WatchKind, String.eq(k, "bg"), KBg{},
    Bool.pick(WatchKind, String.eq(k, "pid"), KPid{},
      Bool.pick(WatchKind, String.eq(k, "file"), KFile{},
        Bool.pick(WatchKind, String.eq(k, "job"), KJob{},
          Bool.pick(WatchKind, String.eq(k, "reply"), KReply{}, KOther{})))))

def kind_of(+spec: J.Json) -> WatchKind:
  kind.str(J.get_str_or(spec, "kind", ""))

# a pause by default: what the agent started itself (a backgrounded bash
# command, a pid); a file, a launchd job, an unknown kind: an alarm
def kind_pauses(k: WatchKind) -> Bool:
  match k:
    case KBg{}:
      True{}
    case KPid{}:
      True{}
    case KFile{}:
      False{}
    case KJob{}:
      False{}
    case KReply{}:
      True{}
    case KOther{}:
      False{}

# a watch's `resumes`: the agent's word (`--then`: Some{True}, `--alarm`:
# Some{False}), else the default of its kind
def resumes_of(+spec: J.Json, then: Maybe<&2, Bool>) -> Bool:
  match then:
    case None{}:
      kind_pauses(kind_of(spec))
    case Some{+b}:
      b

# a new watch (wake_set): its id the next free one, its deadline `max_ms`
# from now
def make(+ws: Wakes, +agent: String, +spec: J.Json, +max_text: String, +now: Nat, +max_ms: Nat, +quiet: Bool, then: Maybe<&2, Bool>) -> Watch:
  Watch{1n+Wakes.last_id(ws), agent, spec, max_text, now, Nat.add(now, max_ms), quiet, resumes_of(spec, then)}

# ---- a reply still pending (ask-wait) ----
# An agent's `sb ask` / `sb wait` holds it WAIT_CAP seconds at most
# (core.bend); when the hold ends with no reply, sb-core sets a watch of
# kind `reply` (the one spec sb-core builds itself: kind, to, msg; Rust
# never probes it). A pause from the ask (set_at: the asked message's
# time) until its reply ends it (no wake: the reply is its own), its
# agent moves on (its stop, done, failed, dropped), the asked agent is
# dropped or a day passes (both tell the agent once).

def REPLY_MAX_MS() -> Nat:
  86400000n

def reply_spec(+to: String, +msg: Nat) -> J.Json:
  J.obj([J.kv("kind", J.JStr{"reply"}), J.kv("to", J.JStr{to}), J.kv("msg", J.JNum{msg})])

# the words at its max: the agent planned to continue on the reply
def reply_max_text(+to: String, +msg: Nat) -> String:
  String.append(String.append(String.append(String.append("no reply from @", to), " to m_"), Nat.show(msg)),
    " in a day: it no longer waits for it. ask again, or continue with an explicit assumption.")

# the reply watch of `agent` on its message `msg` to `to`, asked at
# `asked_at`
def make_reply(+ws: Wakes, +agent: String, +to: String, +msg: Nat, +asked_at: Nat, +now: Nat) -> Watch:
  Watch{1n+Wakes.last_id(ws), agent, reply_spec(to, msg), reply_max_text(to, msg), asked_at,
    Nat.add(now, REPLY_MAX_MS()), False{}, True{}}

def kind_is_reply(k: WatchKind) -> Bool:
  match k:
    case KReply{}:
      True{}
    case _:
      False{}

def is_reply(+x: Watch) -> Bool:
  kind_is_reply(kind_of(Watch.spec(x)))

def reply_to_of(+x: Watch) -> String:
  J.get_str_or(Watch.spec(x), "to", "")

def reply_msg(+x: Watch) -> Nat:
  J.get_num_or(Watch.spec(x), "msg", 0n)

# the live reply watch of `agent` on its message `msg`: a walk that stops
# at it (`hit`: the head is it; not Bool.pick, tests/pick_gate.py)
def reply_hit(xs: List<&2, Watch>, +agent: String, +msg: Nat) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, _}:
      is_reply(h) && String.eq(Watch.agent(h), agent) && Nat.is_eq(reply_msg(h), msg)

def reply_for.go(xs: List<&2, Watch>, +hit: Bool, +agent: String, +msg: Nat) -> Maybe<&2, Watch>:
  match xs hit:
    case Nil{} _:
      None{}
    case Con{+h, _} True{}:
      Some{h}
    case Con{+h, +t} False{}:
      reply_for.go(t, reply_hit(t, agent, msg), agent, msg)

def reply_for(+xs: List<&2, Watch>, +agent: String, +msg: Nat) -> Maybe<&2, Watch>:
  reply_for.go(xs, reply_hit(xs, agent, msg), agent, msg)

# the reply watch a message answers: sent to its agent, a reply to its
# message, by the asked agent (`by`: the sender's names) or the user
def answered(+x: Watch, +to: String, +reply_to: Nat, +by: List<&2, String>, +user: Bool) -> Bool:
  is_reply(x) && String.eq(Watch.agent(x), to) && Nat.is_eq(reply_msg(x), reply_to) && (user || str_in(by, reply_to_of(x)))

def answered_of(xs: List<&2, Watch>, +to: String, +reply_to: Nat, +by: List<&2, String>, +user: Bool) -> List<&2, Nat>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = answered_of(t, to, reply_to, by, user)
      Bool.pick(List<&2, Nat>, answered(h, to, reply_to, by, user), Watch.id(h) <> rest, rest)

# the reply watches of an agent (`ns`: its names): it moved on (done, failed)
def replies_of(xs: List<&2, Watch>, +ns: List<&2, String>) -> List<&2, Nat>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = replies_of(t, ns)
      Bool.pick(List<&2, Nat>, is_reply(h) && str_in(ns, Watch.agent(h)), Watch.id(h) <> rest, rest)

# the words its agent hears when the asked agent is dropped
def reply_gone_text(+x: Watch) -> String:
  String.append(String.append(String.append(String.append("@", reply_to_of(x)), " was dropped: no reply to m_"), Nat.show(reply_msg(x))),
    " will come. continue with an explicit assumption, or ask someone else.")

# a watch past its max says "still running" to its agent, unless quiet (a
# bash slot's) or its agent is not active (stopped: nothing to wake)
def max_says(+w: Watch, +active: Bool) -> Bool:
  Bool.not(Watch.quiet(w)) && active

# a stop tells the watch's agent when he stopped it (`tell`: the words,
# "" for the agent's own `sb wake --stop`) and it is active: a pause it
# meant to continue at, an alarm it counted on
def stop_tells(+tell: String, +active: Bool) -> Bool:
  Bool.not(String.is_empty(tell)) && active

# the live watch a hit is for (None: ended or unknown: the hit is nothing)
def hit(+ws: Wakes, +id: Nat) -> Maybe<&2, Watch>:
  find(Wakes.live(ws), id)

def is_due(+x: Watch, +now: Nat) -> Bool:
  Nat.is_le(Watch.max_at(x), now)

# the live watches past their max at `now`, in order
def due(xs: List<&2, Watch>, +now: Nat) -> List<&2, Watch>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = due(t, now)
      Bool.pick(List<&2, Watch>, is_due(h, now), h <> rest, rest)

# a tick with no watch past its max does nothing (idle-cpu)
def any_due(xs: List<&2, Watch>, +now: Nat) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, +t}:
      is_due(h, now) || any_due(t, now)

# the ids of the live watches of an agent (`ns`: its names, own and old)
def ids_of(xs: List<&2, Watch>, +ns: List<&2, String>) -> List<&2, Nat>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = ids_of(t, ns)
      Bool.pick(List<&2, Nat>, str_in(ns, Watch.agent(h)), Watch.id(h) <> rest, rest)

# ---- for the law wake_drop_ends (bend/proofs/hub.bend) ----

def nat_in(xs: List<&2, Nat>, +n: Nat) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, +t}:
      Nat.is_eq(n, h) || nat_in(t, n)

# the watches whose id is not in `ids`
def keep_out(xs: List<&2, Watch>, +ids: List<&2, Nat>) -> List<&2, Watch>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = keep_out(t, ids)
      Bool.pick(List<&2, Watch>, nat_in(ids, Watch.id(h)), rest, h <> rest)

# every id of `xs` is in `ys`
def all_in(xs: List<&2, Nat>, +ys: List<&2, Nat>) -> Bool:
  match xs:
    case Nil{}:
      True{}
    case Con{+h, +t}:
      nat_in(ys, h) && all_in(t, ys)

# ---- JSON (the journal and the view) ----

def watch_kvs(+x: Watch) -> List<&2, Sigma<&2, &2, String, _ => J.Json>>:
  [J.kv("id", J.JNum{Watch.id(x)}), J.kv("agent", J.JStr{Watch.agent(x)}), J.kv("spec", Watch.spec(x)),
    J.kv("max_text", J.JStr{Watch.max_text(x)}), J.kv("set_at", J.JNum{Watch.set_at(x)}),
    J.kv("max_at", J.JNum{Watch.max_at(x)}), J.kv("quiet", J.JBool{Watch.quiet(x)}),
    J.kv("resumes", J.JBool{Watch.resumes(x)})]

def watch_json(+x: Watch) -> J.Json:
  J.obj(watch_kvs(x))

def ended_json(e: Ended) -> J.Json:
  match e:
    case Ended{+x, +at, +why}:
      J.obj(List.append(&2, Sigma<&2, &2, String, _ => J.Json>, watch_kvs(x),
        [J.kv("ended_at", J.JNum{at}), J.kv("why", J.JStr{why})]))

def live_json(xs: List<&2, Watch>) -> List<&2, J.Json>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      watch_json(h) <> live_json(t)

def ended_list_json(xs: List<&2, Ended>) -> List<&2, J.Json>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      ended_json(h) <> ended_list_json(t)

def num(+j: J.Json, +k: String) -> Nat:
  J.get_num_or(j, k, 0n)

def str.of(m: Maybe<&2, J.Json>) -> String:
  match m:
    case Some{J.JStr{+s}}:
      s
    case _:
      ""

def bool.of(m: Maybe<&2, J.Json>) -> Bool:
  match m:
    case Some{J.JBool{+b}}:
      b
    case _:
      False{}

def json.of(m: Maybe<&2, J.Json>) -> J.Json:
  match m:
    case Some{+j}:
      j
    case None{}:
      J.JNull{}

# its `resumes`; a line from before the field: its kind's default
def resumes.of(m: Maybe<&2, J.Json>, +spec: J.Json) -> Bool:
  match m:
    case Some{J.JBool{+b}}:
      b
    case _:
      resumes_of(spec, None{})

# a watch from its JSON (wake_set's `watch`)
def watch_of(+j: J.Json) -> Watch:
  Watch{num(j, "id"), str.of(J.get(j, "agent")), json.of(J.get(j, "spec")), str.of(J.get(j, "max_text")),
    num(j, "set_at"), num(j, "max_at"), bool.of(J.get(j, "quiet")), resumes.of(J.get(j, "resumes"), json.of(J.get(j, "spec")))}

def ev_json(e: WkEv) -> J.Json:
  match e:
    case WSet{+x}:
      J.obj([J.kv("type", J.JStr{"wake_set"}), J.kv("watch", watch_json(x))])
    case WEnd{+id, +why, +at}:
      J.obj([J.kv("type", J.JStr{"wake_end"}), J.kv("id", J.JNum{id}), J.kv("why", J.JStr{why}), J.kv("at", J.JNum{at})])
