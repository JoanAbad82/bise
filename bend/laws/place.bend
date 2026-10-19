# bend/laws/place.bend: a worktree task is placed off the hub's loop
# (hub-loop, docs/issues/32; hub/place.bend, core.bend's spawn, placed,
# place.ask). Closed by bend/proofs/place.bend; the gate checks every
# bend/proofs/*.bend: a law here with no proof there fails it.
#
# A new input (`placed`), two new effects (`worktree_create`,
# `worktree_drop`) and one new journal kind (`worktree_placed`, its
# replay below; hub_step_replays covers the step as it is). The laws are
# LOCAL, stated on place.bend's decision and core.bend's glue, the only
# path a `placed` takes (dispatch: placed(o, PL.placed_of(st, ..), cx)).
import Base
import ../vendor/json.bend as J
import ../hub/model.bend as HM
import ../hub/gen/state.bend as HS
import ../hub/cx.bend as HX
import ../hub/core.bend as HC
import ../hub/place.bend as HPL
import ../hub/gen/fx.bend as HF

# LAW: no REPL starts for a task whose worktree is still being made:
# spawn (every path: the create, a message to a down task, a restore)
# changes nothing while its workspace is placing.
law no_repl_before_placed:
  for -o: HS.St
  for +cx: HX.Cx<o>
  for +n: String
  for +r: Bool
  for e: {HPL.waits(HM.get_agent(HC.st(o, cx), n)) == True{} : Bool}
  {HC.spawn(o, cx, n, r) == cx : HX.Cx<o>}

# LAW: a task is placed once: a `placed` for a task no longer placing
# (placed already, or never) never starts it again, whatever it says.
law placed_create_once:
  for +a: HS.Agent
  for +n: String
  for +ws: J.Json
  for +err: String
  for e: {HM.ws_placing(HS.Agent.ws(a)) == False{} : Bool}
  {HPL.is_ok(HPL.placed_of.agent(Some{a}, n, ws, err)) == False{} : Bool}

# LAW: a worktree that could not be made fails its live placing task,
# with git's words, and names its spawner.
law placed_err_fails:
  for +a: HS.Agent
  for +n: String
  for +ws: J.Json
  for +err: String
  for e: {String.is_empty(err) == False{} : Bool}
  {HPL.placed_of.live(True{}, a, n, ws, err) == HPL.PErr{n, err, HPL.parent_of(HS.Agent.parent(a))} : HPL.Do}

# LAW: that failure is one stop (as failed, with git's words) and one
# word to the spawner (placed.tell: a message, or main's feed for his
# own /new), after the journal's line; nothing else.
law placed_err_tells_once:
  for -o: HS.St
  for +cx: HX.Cx<o>
  for +n: String
  for +err: String
  for +parent: String
  {HC.placed(o, HPL.PErr{n, err, parent}, cx)
    == HC.placed.tell(o, String.eq(parent, HM.USER()),
      HC.stop_noted(o, HC.emit(o, cx, HM.EPlaced{n, J.JNull{}, err}, Unit{}, Unit{}, Unit{}), n, HS.LFailed{}, err),
      parent, HPL.err_text(n, err)) : HX.Cx<o>}

# LAW: a worktree made for a task gone meanwhile (dropped while placing)
# goes again, and that is all the step does.
law placed_orphan_drops_only:
  for -o: HS.St
  for +cx: HX.Cx<o>
  for +n: String
  for +ws: J.Json
  {HC.placed(o, HPL.POrphan{n, ws}, cx) == HC.out(o, cx, HF.worktree_drop(n, ws, 0n, 0n)) : HX.Cx<o>}

# LAW: the journal's `worktree_placed` replays as the workspace it carries
# (a restart rebuilds the placed task as it was).
law placed_replays_as_ws:
  for +st: HS.St
  for +n: String
  for +ws: J.Json
  {HM.apply(st, HM.EPlaced{n, ws, ""}) == HM.apply(st, HM.EWorkspace{n, ws}) : HS.St}

# ---- a join while placing (`sb spawn B --place A`, A placing; rows233B) ----

# LAW: a join on a placing agent never makes a worktree of its own: its
# ws carries A's place, and place.ask emits no worktree_create for it.
law place_join_no_create:
  for -o: HS.St
  for +cx: HX.Cx<o>
  for +n: String
  for +ws: J.Json
  for +p: String
  for e: {J.get_str(ws, "place") == Some{p} : Maybe<&2, String>}
  {HC.place.ask(o, HPL.makes(ws), cx, n, ws) == cx : HX.Cx<o>}

# LAW: no REPL for the joiner before its place is made: its ws is placing,
# so spawn changes nothing (no_repl_before_placed, on the joiner).
law place_join_waits:
  for -o: HS.St
  for +cx: HX.Cx<o>
  for +b: String
  for +r: Bool
  for e: {HPL.waits(HM.get_agent(HC.st(o, cx), b)) == True{} : Bool}
  {HC.spawn(o, cx, b, r) == cx : HX.Cx<o>}

# LAW: A's worktree made, a live placing joiner gets that same ws (path,
# branch, place), then its REPL (POk).
law place_join_shares:
  for +a: HS.Agent
  for +b: String
  for +n: String
  for +ws: J.Json
  for +err: String
  {HPL.placed_of.live(True{}, a, b, HPL.join.ws(HPL.POk{n, ws}), HPL.join.err(HPL.POk{n, ws}, err)) == HPL.POk{b, ws} : HPL.Do}

# LAW: A's worktree not made, a live placing joiner fails too, with the
# same words, and its spawner is told (PErr, then placed_err_tells_once).
law place_join_err_fails_both:
  for +a: HS.Agent
  for +b: String
  for +n: String
  for +e: String
  for +p: String
  for +err: String
  for h: {String.is_empty(e) == False{} : Bool}
  {HPL.placed_of.live(True{}, a, b, HPL.join.ws(HPL.PErr{n, e, p}), HPL.join.err(HPL.PErr{n, e, p}, err))
    == HPL.PErr{b, e, HPL.parent_of(HS.Agent.parent(a))} : HPL.Do}
