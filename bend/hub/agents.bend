# hub/agents.bend — the agents split (issue 21 sha 2, plan B2, architect
# m_30761): S.St.agents holds the agents not archived, in creation order;
# S.St.arch the archived ones, newest archived first; S.St.order every
# name, in creation order. A live tick walks St.agents only: the archived
# agents (95 % of them on his hub) were ~86 % of it. The list helpers of
# the split, pure; model.bend's apply calls them (lookups read St.agents,
# then arch; a lifecycle to or from archived moves the record), the laws
# are HI.AgentsSplit and names_apart over both lists.
import Base

import ./gen/state.bend as S
import ./lazy.bend as LZ

# a list cut at the first agent named `n`: the ones before it (pre), it
# (hit), the ones after it (post); no agent named `n`: every one is
# before. Three walks, not a record (a step's local value,
# tests/state_guard.py): only a lifecycle and an older journal's reused
# name cut a list.
def pre(xs: List<&2, S.Agent>, +n: String) -> List<&2, S.Agent>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      LZ.pick(List<&2, S.Agent>, String.eq(S.Agent.name(h), n), u => Nil{}, u => h <> pre(t, n))

def hit(xs: List<&2, S.Agent>, +n: String) -> Maybe<&2, S.Agent>:
  match xs:
    case Nil{}:
      None{}
    case Con{+h, +t}:
      LZ.pick(Maybe<&2, S.Agent>, String.eq(S.Agent.name(h), n), u => Some{h}, u => hit(t, n))

def post(xs: List<&2, S.Agent>, +n: String) -> List<&2, S.Agent>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      LZ.pick(List<&2, S.Agent>, String.eq(S.Agent.name(h), n), u => t, u => post(t, n))

# the list a cut came from (law: AG.whole(pre, hit, post) == xs)
def whole.of(m: Maybe<&2, S.Agent>, +q: List<&2, S.Agent>) -> List<&2, S.Agent>:
  match m:
    case None{}:
      q
    case Some{+a}:
      a <> q

def whole(+p: List<&2, S.Agent>, m: Maybe<&2, S.Agent>, +q: List<&2, S.Agent>) -> List<&2, S.Agent>:
  List.append(&2, S.Agent, p, whole.of(m, q))

# an agent named `n` is in the list
def has(xs: List<&2, S.Agent>, +n: String) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, +t}:
      LZ.or(String.eq(S.Agent.name(h), n), u => has(t, n))

def names(xs: List<&2, S.Agent>) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      S.Agent.name(h) <> names(t)

# where `n` goes among `xs` (a subsequence of `ord`, the creation order):
# how many of them come before it in `ord` (not in `ord`: after all)
def place(ord: List<&2, String>, +xs: List<&2, S.Agent>, +n: String) -> Nat:
  match ord xs:
    case Nil{} _:
      List.length(&2, S.Agent, xs)
    case Con{_, _} Nil{}:
      0n
    case Con{+o, +t} Con{+h, +r}:
      LZ.pick(Nat, String.eq(o, n), u => 0n,
        u => LZ.pick(Nat, String.eq(o, S.Agent.name(h)), v => 1n+place(t, r, n), v => place(t, h <> r, n)))

# `a` in its creation place among `xs` (an archived agent restored, a
# reused archived name): a split of `xs` with `a` between its two parts
def ins.at(+k: Nat, +xs: List<&2, S.Agent>, +a: S.Agent) -> List<&2, S.Agent>:
  List.append(&2, S.Agent, List.take(&2, S.Agent, xs, k), a <> List.drop(&2, S.Agent, xs, k))

def ins(+ord: List<&2, String>, +xs: List<&2, S.Agent>, +a: S.Agent) -> List<&2, S.Agent>:
  ins.at(place(ord, xs, S.Agent.name(a)), xs, a)

# the list without the first agent named `n`
def drop(+xs: List<&2, S.Agent>, +n: String) -> List<&2, S.Agent>:
  List.append(&2, S.Agent, pre(xs, n), post(xs, n))

# the two sides after an agent event: each event's code computes St.agents
# (`side` True) and arch (False) from the same values, and set puts both
# back, so every other field of the state is the one before, by
# computation (no record: tests/state_guard.py)
def side(s: Bool, +a: List<&2, S.Agent>, +r: List<&2, S.Agent>) -> List<&2, S.Agent>:
  match s:
    case True{}:
      a
    case False{}:
      r

def set(+st: S.St, +a: List<&2, S.Agent>, +r: List<&2, S.Agent>) -> S.St:
  S.St.with_arch(S.St.with_agents(st, a), r)
