# hub/place.bend - a worktree task is placed off the hub's loop (hub-loop,
# docs/issues/32), the pure part.
#
# Before, sb-core asked the hub for `worktree_create` inside the spawn's
# step: the hub ran `git worktree add` (a checkout of the whole tree) and
# the config's setup command on its loop, 2-10 s during which no agent's
# `sb` was served. Now the spawn's step decides and commits: the task is
# created with a placing workspace ([`placing_ws`]: mode worktree, state
# placing, no path yet), and the fx `worktree_create` asks the shell to
# make it on a thread. The shell picks the path and branch (they depend
# on the disk and the refs) and sends the input `placed` with the whole
# workspace, or git's words; the journal keeps it (`worktree_placed`).
# No REPL starts before (core.bend's `spawn` skips a placing task): its
# messages wait for it as for a starting agent.
#
# What a `placed` does ([`placed_of`]): its task placing, the worktree
# made: the workspace, then its REPL; its task placing, the worktree not
# made: the task fails with git's words, its spawner told once; its task
# gone or no longer placing (dropped meanwhile, archived): the worktree
# goes again (fx `worktree_drop`, nothing to lose), nothing else; a
# `placed` with an error for a task not placing: nothing.
#
# core.bend's `placed` runs these decisions (it holds emit, spawn, send).
# Laws in bend/laws/place.bend.
import Base

import ../vendor/json.bend as J

import ./model.bend as M

# the workspace of a task whose worktree the shell is making: no path, no
# branch yet (the shell picks them); `with_changes`: the shared folder's
# changes go into it (`sb spawn --with-changes`)
def placing_ws(+with_changes: Bool) -> J.Json:
  J.obj([J.kv("mode", J.JStr{"worktree"}), J.kv("state", J.JStr{"placing"}), J.kv("path", J.JStr{""}),
    J.kv("branch", J.JNull{}), J.kv("base_commit", J.JNull{}), J.kv("dropped", J.JBool{False{}}),
    J.kv("with_changes", J.JBool{with_changes})])

# what one `placed` input does
type Do is Data:
  # the worktree is made: the task's workspace, then its REPL
  POk{name: String, ws: J.Json}
  # it could not be made: the task fails, `parent` is told once
  PErr{name: String, err: String, parent: String}
  # made for a task gone or no longer placing: it goes again
  POrphan{name: String, ws: J.Json}
  # an error for a task not placing: nothing to undo
  PNone{}

def parent_of(m: Maybe<&2, String>) -> String:
  match m:
    case Some{+p}:
      p
    case None{}:
      M.MAIN()

# the task found, `live`: placing and not archived
def placed_of.live(live: Bool, +a: M.Agent, +name: String, +ws: J.Json, +err: String) -> Do:
  match live:
    case True{}:
      Bool.pick(Do, String.is_empty(err), POk{name, ws}, PErr{name, err, parent_of(M.Agent.parent(a))})
    case False{}:
      Bool.pick(Do, String.is_empty(err), POrphan{name, ws}, PNone{})

def is_archived(l: M.Life) -> Bool:
  match l:
    case M.LArchived{}:
      True{}
    case _:
      False{}

def placed_of.agent(m: Maybe<&2, M.Agent>, +name: String, +ws: J.Json, +err: String) -> Do:
  match m:
    case None{}:
      Bool.pick(Do, String.is_empty(err), POrphan{name, ws}, PNone{})
    case Some{+a}:
      placed_of.live(M.ws_placing(M.Agent.ws(a)) && Bool.not(is_archived(M.Agent.life(a))), a, name, ws, err)

# the decision of `placed` for task `name` (`err` "": `ws` is made)
def placed_of(+st: M.St, +name: String, +ws: J.Json, +err: String) -> Do:
  placed_of.agent(M.get_agent(st, name), name, ws, err)

# a placing task gets no REPL yet (core.bend's `spawn`)
def waits(m: Maybe<&2, M.Agent>) -> Bool:
  match m:
    case Some{+a}:
      M.ws_placing(M.Agent.ws(a))
    case None{}:
      False{}

# the spawner's words when the worktree could not be made
def err_text(+name: String, +err: String) -> String:
  String.append(String.append(String.append("@", name), " could not start: its worktree was not made: "), err)

# main's line when its worktree is made: `@fix's worktree is ready: sb/fix`
def ready_text(+name: String, +ws: J.Json) -> String:
  String.concat(["@", name, "'s worktree is ready: ", J.get_str_or(ws, "branch", ""), " (", J.get_str_or(ws, "path", ""), ")"])

# the spawn's reply: the task is placing until its worktree is made
def placing_note() -> String:
  "placing: it starts once its worktree is made"

# ---- a drop's words (moved from core.bend) ----

def plural(+n: Nat) -> String:
  Bool.pick(String, Nat.is_gt(n, 1n), "s", "")

def loss_text(+dirty: Nat, +unpushed: Nat) -> String:
  String.concat([Nat.show(dirty), " changed file", plural(dirty), " and ", Nat.show(unpushed),
    " unpushed commit", plural(unpushed), " will be saved (/restore)"])

def drop_label(r: Result<&2, &2, String, J.Json>) -> String:
  match r:
    case Fail{+e}:
      String.append(" — worktree NOT deleted: ", e)
    case Done{J.JStr{_}}:
      " — work saved (/restore)"
    case Done{_}:
      " · its worktree removed"

def drop_snap(j: J.Json) -> Maybe<&2, String>:
  match j:
    case J.JStr{+s}:
      Some{s}
    case _:
      None{}

# a `placed` that starts the task (laws: placed_create_once)
def is_ok(d: Do) -> Bool:
  match d:
    case POk{_, _}:
      True{}
    case _:
      False{}

# dev-flow §3.1: the place of a ws: "shared", or its worktree's id (the
# Rust Workspace::place_id; an older journal's worktree has none: its
# agent's own place, wt:<dir>). Moved from model.bend (its line limit).
def ws_place(+ws: J.Json, +dir: String) -> String:
  Bool.pick(String, M.ws_worktree(ws), J.get_str_or(ws, "place", String.append("wt:", dir)), "shared")

def Agent.place(+a: M.Agent) -> String:
  ws_place(M.Agent.ws(a), M.Agent.dir(a))

# ---- a place's agents (moved from core.bend, its line limit) ----

def is_gone(l: M.Life) -> Bool:
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
      +gone = is_gone(M.Agent.life(b))
      Bool.not(String.eq(M.Agent.name(b), name)) && M.ws_worktree(M.Agent.ws(b)) && Bool.not(M.ws_dropped(M.Agent.ws(b)))
        && String.eq(Agent.place(b), place) && Bool.pick(Bool, live, Bool.not(gone), gone)

def mates(xs: List<&2, String>, +s: M.St, +name: String, +place: String, +live: Bool) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+n, +t}:
      +rest = mates(t, s, name, place, live)
      Bool.pick(List<&2, String>, mate.hit(M.get_agent(s, n), name, place, live), n <> rest, rest)

# the other agents of a's worktree (none for the shared folder)
def mates_of(+s: M.St, +a: M.Agent, +live: Bool) -> List<&2, String>:
  mates(M.St.order(s), s, M.Agent.name(a), Agent.place(a), live)

def first_agent(+s: M.St, ns: List<&2, String>) -> Maybe<&2, M.Agent>:
  match ns:
    case Nil{}:
      None{}
    case Con{+n, _}:
      M.get_agent(s, n)

def drop.stays(ms: List<&2, String>) -> String:
  match ms:
    case Nil{}:
      ""
    case Con{+h, +t}:
      String.append(" — its worktree stays with @", String.join({h <> t : List<&2, String>}, ", @"))

def drop.left.ws(m: Maybe<&2, M.Agent>) -> J.Json:
  match m:
    case None{}:
      J.JNull{}
    case Some{+b}:
      J.set(M.Agent.ws(b), "dropped", J.JBool{True{}})
