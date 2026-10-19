# hub/state-hand.bend — the hand codecs bise_proto::core::state names
# (`Hand`, `HandRead`), for the two JSON shapes a field-by-field codec
# can't say: a timer's schedule (one key that says the variant, read back
# normalised) and a watch's `resumes` (an old line without it reads its
# spec's default). gen/state-codec.bend calls them; nothing here builds or
# opens a record.
import Base

import ../vendor/json.bend as J

import ./gen/state.bend as S

# ---- a timer's schedule, as every.rs wrote it ----

def sched_kv(s: S.Sched) -> Sigma<&2, &2, String, _ => J.Json>:
  match s:
    case S.Every{+p}:
      J.kv("every_ms", J.JNum{p})
    case S.Daily{+m}:
      J.kv("daily_min", J.JNum{m})

def nat(m: Maybe<&2, J.Json>) -> Maybe<&2, Nat>:
  match m:
    case Some{J.JNum{+n}}:
      Some{n}
    case _:
      None{}

def sched.go(e: Maybe<&2, Nat>, d: Maybe<&2, Nat>) -> Maybe<&2, S.Sched>:
  match e:
    case Some{+p}:
      Some{S.Every{Nat.max(p, 1000n)}}
    case None{}:
      Maybe.map(&2, Nat, S.Sched, m => S.Daily{Nat.mod(m, 1440n)}, d)

# every_ms (at least 1 s), else daily_min (mod a day), else none (the
# every_set line is skipped)
def sched_of(e: Maybe<&2, J.Json>, d: Maybe<&2, J.Json>) -> Maybe<&2, S.Sched>:
  sched.go(nat(e), nat(d))

# what a written schedule reads back as
def sched_norm(s: S.Sched) -> S.Sched:
  match s:
    case S.Every{+p}:
      S.Every{Nat.max(p, 1000n)}
    case S.Daily{+m}:
      S.Daily{Nat.mod(m, 1440n)}

# ---- a watch's `resumes` ----

# a pause by default: what the agent started itself (a backgrounded bash
# command, a pid, a reply it waits on); a file, a launchd job, an unknown
# kind: an alarm (wakes.bend kind_pauses)
def kind_pauses(+k: String) -> Bool:
  Bool.or(String.eq(k, "bg"), Bool.or(String.eq(k, "pid"), String.eq(k, "reply")))

def spec_of(m: Maybe<&2, J.Json>) -> J.Json:
  match m:
    case Some{+j}:
      j
    case None{}:
      J.JNull{}

# its `resumes`; a line from before the field: its spec kind's default
def watch_resumes(m: Maybe<&2, J.Json>, s: Maybe<&2, J.Json>) -> Bool:
  match m:
    case Some{J.JBool{+b}}:
      b
    case _:
      kind_pauses(J.get_str_or(spec_of(s), "kind", ""))
