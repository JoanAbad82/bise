# hub/land-step.bend — the steps of the land inputs (issue 37 #3, plan-3
# signed by architect m_36620): land.bend decides; this module reads R's
# lands ({claims, line}), writes them back and says the answers as fx.
# St never changes and no journal line is written (law
# land_steps_keep_st): the line and the claims are runtime state, fresh
# at boot; after a core restart the shell gives them back (land_live).
import Base

import ../vendor/json.bend as J
import ./gen/kit.bend as K
import ./gen/fx.bend as F
import ./gen/state.bend as S

import ./cx.bend as X
import ./land.bend as LD

def lands(-o: S.St, +cx: X.Cx<o>) -> J.Json:
  X.R.lands(X.Cx.r(o, cx))

def set_lands(-o: S.St, +cx: X.Cx<o>, +l: J.Json) -> X.Cx<o>:
  X.with_r(o, cx, X.R.with_lands(X.Cx.r(o, cx), l))

def out(-o: S.St, +cx: X.Cx<o>, +kvs: List<&2, Sigma<&2, &2, String, _ => J.Json>>) -> X.Cx<o>:
  X.out(o, cx, J.obj(kvs))

def now(-o: S.St, +cx: X.Cx<o>) -> Nat:
  X.R.now(X.Cx.r(o, cx))

def jlist(+j: J.Json) -> List<&2, J.Json>:
  K.arr(Some{j})

# fx land_go for each ticket that got go, then the line's ranks
def gos(-o: S.St, ns: List<&2, Nat>, +cx: X.Cx<o>, +line: List<&2, J.Json>) -> X.Cx<o>:
  match ns:
    case Nil{}:
      out(o, cx, F.land_ranks(LD.ranks(line)))
    case Con{+n, +t}:
      gos(o, t, out(o, cx, F.land_go(n, Maybe.default(&2, String, LD.target_of(line, n), ""))), line)

# the line after, and who got go: its lands written, then the fx
def moved.go(-o: S.St, +cx: X.Cx<o>, +claims: List<&2, J.Json>, +line: List<&2, J.Json>, ns: List<&2, Nat>) -> X.Cx<o>:
  gos(o, ns, set_lands(o, cx, LD.lands(claims, line)), line)

def moved(-o: S.St, +cx: X.Cx<o>, +claims: List<&2, J.Json>, p: List<&2, J.Json> & List<&2, Nat>) -> X.Cx<o>:
  (line, ns) = p
  moved.go(o, cx, claims, line, ns)

# ---- land_claim ----

def claim.go(-o: S.St, m: Maybe<&2, Nat>, +cx: X.Cx<o>, +key: String) -> X.Cx<o>:
  match m:
    case Some{+since}:
      out(o, cx, F.land_claimed(False{}, LD.busy(since, now(o, cx))))
    case None{}:
      +l = lands(o, cx)
      out(o, set_lands(o, cx, LD.lands(List.append(&2, J.Json, LD.ls.claims(l), [LD.claim(key, now(o, cx))]), LD.ls.line(l))), F.land_claimed(True{}, ""))

def claim(-o: S.St, +cx: X.Cx<o>, +key: String) -> X.Cx<o>:
  claim.go(o, LD.in_line(LD.ls.claims(lands(o, cx)), key), cx, key)

# ---- land_pick: what it takes, or its refusal before its turn ----

def pick(-o: S.St, +cx: X.Cx<o>, +i: J.Json) -> X.Cx<o>:
  +a = LD.decide(i)
  out(o, cx, F.land_picked(K.get_b(a, "ok"), K.get_ss(a, "mine"), K.get_ss(a, "left_out"), K.get_s(a, "note"), K.get_s(a, "why")))

# ---- land_join: the line of its target (its feature's while its agent
# still lands there, else the trunk's) ----

def join.in(-o: S.St, +cx: X.Cx<o>, +claims: List<&2, J.Json>, +n: Nat, +t: String, p: List<&2, J.Json> & Maybe<&2, Nat>) -> X.Cx<o>:
  (line, g) = p
  moved(o, out(o, cx, F.land_joined(n, True{}, t, "")), claims, (line, LD.maybe_list(g)))

def join.go(-o: S.St, m: Maybe<&2, String>, +cx: X.Cx<o>, +n: Nat, +target: String, +place: String, +agent: String, +trunk: String) -> X.Cx<o>:
  match m:
    case Some{+why}:
      out(o, cx, F.land_joined(n, False{}, "", why))
    case None{}:
      +t = LD.onto(X.d(o, cx), agent, target, trunk)
      +l = lands(o, cx)
      join.in(o, cx, LD.ls.claims(l), n, t, LD.join(LD.ls.line(l), n, t, place, agent, trunk))

def join(-o: S.St, +cx: X.Cx<o>, +n: Nat, +target: String, +place: String, +agent: String, +trunk: String, +dirty: J.Json) -> X.Cx<o>:
  join.go(o, LD.dirty_refusal(K.strs(jlist(dirty))), cx, n, target, place, agent, trunk)

# ---- land_end: its ticket leaves, its claim ends, the next goes ----

def end.go(-o: S.St, m: Maybe<&2, J.Json>, +cx: X.Cx<o>, +line: List<&2, J.Json>, +claims: List<&2, J.Json>, +n: Nat) -> X.Cx<o>:
  match m:
    case None{}:
      moved(o, cx, claims, (line, Nil{}))
    case Some{+t}:
      moved(o, cx, claims, LD.grants(LD.drop(line, n), X.d(o, cx), LD.t.target(t), K.get_s(t, "trunk")))

def end(-o: S.St, +cx: X.Cx<o>, +n: Nat, +key: String) -> X.Cx<o>:
  +l = lands(o, cx)
  end.go(o, LD.find(LD.ls.line(l), n), cx, LD.ls.line(l), LD.unclaim(LD.ls.claims(l), key), n)

# ---- land_live: after a core restart, the lands still running ----

def live(-o: S.St, +cx: X.Cx<o>, +claims: J.Json, +line: J.Json) -> X.Cx<o>:
  moved(o, cx, jlist(claims), LD.grant_all(jlist(line), jlist(line)))
