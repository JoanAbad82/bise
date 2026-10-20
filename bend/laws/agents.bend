# bend/laws/agents.bend: the agents split (issue 21 sha 2, plan B2,
# architect m_30761, hub/agents.bend). S.St.agents holds the agents not
# archived, in creation order: what a tick, a say and every live walk
# read; S.St.arch the archived ones, newest archived first; S.St.order
# every name. HI.AgentsSplit says each side holds only its own; names
# apart (laws/hub.bend names_apart) reads both sides as one list.
# Closed by bend/proofs/agents.bend; the gate checks every
# bend/proofs/*.bend: a law here with no proof there fails it.
#
# Not a law (architect m_34135, named in issue 21): St.agents' names in
# St.order's order, and every name of both sides in St.order. A rename
# to a held name (an older journal) breaks the second, and the first
# rests on it; tests/agents_split_check.py checks both after every step
# of a replay instead.
import Base
import ../vendor/json.bend as J
import ../hub/model.bend as HM
import ../hub/gen/state.bend as HS
import ../hub/core.bend as HC
import ../hub/inv.bend as HI
import ../hub/cold.bend as CO
import ../hub/agents.bend as HAG

# LAW: a new hub's split is right (main, live, in St.agents)...
law split_agents_at_init:
  for +w: String
  HI.AgentsSplit(HM.init(w))

# ...any sequence of inputs keeps it (every event: a lifecycle to
# archived moves the agent to arch's head, out of it back to its place)...
law split_agents_kept_by_run:
  for +ins: List<&2, J.Json>
  for +h: HC.Hub
  for u: HI.AgentsSplit(HC.Hub.d(h))
  HI.AgentsSplit(HC.Hub.d(HC.RunR.hub(HC.run(ins, h))))

# ...and so does a boot replay's batch, of any journal.
law split_agents_after_replay:
  for +ms: List<&2, Maybe<&2, HM.Ev>>
  for +st: HS.St
  for +i: Nat
  for +sk: List<&2, Nat>
  for u: HI.AgentsSplit(st)
  HI.AgentsSplit(Pair.fst(HS.St, List<&2, Nat>, CO.replay_batch(ms, st, i, sk)))

# LAW: with names apart (a run's states: law names_apart), no name is an
# agent's on both sides: a lookup that reads St.agents first never hides
# an archived agent of the same name.
law agents_apart_sides:
  for +s: HS.St
  for +n: String
  for u: HI.NamesApart(s)
  {Bool.and(HAG.has(HS.St.agents(s), n), HAG.has(HS.St.arch(s), n)) == False{} : Bool}
