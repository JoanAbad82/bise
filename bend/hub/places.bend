# hub/places.bend - who shares a place with whom (dev-flow §3.1), pure:
# the other agents of a worktree (`mates`) and the other agents that
# changed the same file in the same place (`overlap_others`, main's "file
# overlap" note). Moved out of core.bend as they were (shared-guard, its
# line count); core.bend calls them.
import Base

import ./model.bend as M

def active(l: M.Life) -> Bool:
  match l:
    case M.LActive{}:
      True{}
    case _:
      False{}

def gone(l: M.Life) -> Bool:
  match l:
    case M.LArchived{}:
      True{}
    case _:
      False{}

# `b` is another agent of `place`'s live folder: still in it (`live`), or
# archived with its ws still on that folder (it left before the others)
def mate.hit(m: Maybe<&2, M.Agent>, +name: String, +place: String, +live: Bool) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{+b}:
      +gone = gone(M.Agent.life(b))
      Bool.not(String.eq(M.Agent.name(b), name)) && M.ws_worktree(M.Agent.ws(b)) && Bool.not(M.ws_dropped(M.Agent.ws(b)))
        && String.eq(M.Agent.place(b), place) && Bool.pick(Bool, live, Bool.not(gone), gone)

def mates(xs: List<&2, String>, +s: M.St, +name: String, +place: String, +live: Bool) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+n, +t}:
      +rest = mates(t, s, name, place, live)
      Bool.pick(List<&2, String>, mate.hit(M.get_agent(s, n), name, place, live), n <> rest, rest)

# an overlap is within one place (dev-flow §3.1): the shared folder, or
# one worktree its agents share
def overlap_hit(m: Maybe<&2, M.Agent>, +agent: String, +path: String, +place: String) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{+a}:
      Bool.not(M.Agent.is_main(a)) && Bool.not(String.eq(M.Agent.name(a), agent))
        && String.eq(M.Agent.place(a), place) && active(M.Agent.life(a))
        && M.str_in(M.Agent.files(a), path)

def overlap_others(xs: List<&2, String>, +s: M.St, +agent: String, +path: String, +place: String) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+n, +t}:
      +rest = overlap_others(t, s, agent, path, place)
      Bool.pick(List<&2, String>, overlap_hit(M.get_agent(s, n), agent, path, place), n <> rest, rest)
