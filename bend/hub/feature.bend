# hub/feature.bend - `sb feature retire <name>` (main's), the pure part:
# a feature whose tip is already in the trunk ends WITHOUT archiving its
# agents. Its live agents (not archived, in a worktree still there, whose
# workspace says `feature: <name>`) keep their worktree and branch; their
# workspace loses `feature`, so their next `sb land` goes to the trunk
# (the Rust land job's `onto`), and each active one gets one queued note
# that says so. Main's feed gets one info line.
#
# The hub (daemon/features.rs) checked the tip first, under the feature's
# land turn; it renames the branch to `kept` after this step. core.bend's
# feature_retire runs these decisions (it holds emit and send). Laws in
# bend/laws/feature.bend: feature_retire_clears, feature_retire_keeps_ws,
# feature_retire_archives_none, feature_retire_stops_nothing,
# feature_retire_tells_once.
import Base

import ../vendor/json.bend as J

import ./model.bend as M

def feature_is(m: Maybe<&2, J.Json>, +name: String) -> Bool:
  match m:
    case Some{J.JStr{+s}}:
      String.eq(s, name)
    case _:
      False{}

# a workspace that lands on feature `name`: a worktree still there whose
# `feature` is `name` (the Rust Workspace::feature)
def lands_on(+ws: J.Json, +name: String) -> Bool:
  Bool.and(feature_is(J.get(ws, "feature"), name), Bool.and(M.ws_worktree(ws), Bool.not(M.ws_dropped(ws))))

# the entries without `feature` (every one: J.remove drops the first only)
def unfeature.kvs(kvs: List<&2, Sigma<&2, &2, String, _ => J.Json>>) -> List<&2, Sigma<&2, &2, String, _ => J.Json>>:
  match kvs:
    case Nil{}:
      Nil{}
    case Tuple{+k, +v} <> +t:
      Bool.pick(List<&2, Sigma<&2, &2, String, _ => J.Json>>, String.eq(k, "feature"), unfeature.kvs(t), Tuple{k, v} <> unfeature.kvs(t))

# the workspace after the retire: the same, without `feature`
def unfeature(+ws: J.Json) -> J.Json:
  match ws:
    case J.JObj{+kvs}:
      J.JObj{unfeature.kvs(kvs)}
    case _:
      ws

# an archived agent is never retired (it stays as it is)
def retiree.life(l: M.Life, +ws: J.Json, +name: String) -> Bool:
  match l:
    case M.LArchived{}:
      False{}
    case _:
      lands_on(ws, name)

def retiree(+a: M.Agent, +name: String) -> Bool:
  retiree.life(M.Agent.life(a), M.Agent.ws(a), name)

def retirees.add(m: Maybe<&2, M.Agent>, +name: String, +rest: List<&2, M.Agent>) -> List<&2, M.Agent>:
  match m:
    case Some{+a}:
      Bool.pick(List<&2, M.Agent>, retiree(a, name), a <> rest, rest)
    case None{}:
      rest

def retirees.go(ns: List<&2, String>, +st: M.St, +name: String) -> List<&2, M.Agent>:
  match ns:
    case Nil{}:
      Nil{}
    case Con{+n, +t}:
      retirees.add(M.get_agent(st, n), name, retirees.go(t, st, name))

# the agents the retire moves, in the hub's order
def retirees(+st: M.St, +name: String) -> List<&2, M.Agent>:
  retirees.go(M.St.order(st), st, name)

def cat(+xs: List<&2, String>) -> String:
  String.concat(xs)

# what each moved agent reads (queued: a busy one reads it after its turn)
def note(+name: String, +kept: String, +main: String) -> String:
  cat(["[bise] The feature `", name, "` is retired: its work is on `", main, "`. From now on `sb land` puts your commits on `", main,
    "` (rebased on its tip), never on `", name, "`. Your worktree and your branch stay: rebase your branch on `", main,
    "` before your next change. The old branch is kept as `", kept, "`."])

def names(xs: List<&2, M.Agent>) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+a, +t}:
      String.append("@", M.Agent.name(a)) <> names(t)

def who(xs: List<&2, M.Agent>, +main: String) -> String:
  match xs:
    case Nil{}:
      " · no live agent"
    case Con{+a, +t}:
      cat([" · ", String.join(names(a <> t), ", "), " land on ", main, " now"])

# main's info line
def line(+name: String, +kept: String, +main: String, xs: List<&2, M.Agent>) -> String:
  cat([name, " retired: its tip is in ", main, who(xs, main), " · the branch kept as ", kept])
