# hub/status.bend - an agent's status words and a sender's relation: the
# pure part, out of core.bend (its line ratchet). The status every view
# shows (model.rs Agent::status) and the relation a recipient reads
# (prompts.rs relation); sb-core's core.bend calls them, nothing else
# here decides.
import Base

import ./model.bend as M

import ./cx.bend as X

def status_of_decl(d: Maybe<&2, M.Decl>) -> String:
  match d:
    case Some{M.DDone{}}:
      "done"
    case Some{M.DBlocked{}}:
      "blocked"
    case _:
      "idle"

def status_of_run(+a: M.Agent, x: X.Rt) -> String:
  match x:
    case X.Rt{_, run, +w, _, _}:
      match run:
        case M.RDown{}:
          "starting"
        case M.RStarting{}:
          "starting"
        case M.RBusy{}:
          Bool.pick(String, w, "waiting", "working")
        case M.RIdle{}:
          status_of_decl(M.Agent.declared(a))

# the status every view shows (model.rs Agent::status)
def status_str(a: M.Agent, +x: X.Rt) -> String:
  match a:
    case M.Agent{+n, +im, +pa, life, +de, +al, +fi, +ws, +di, +br, +cr, +fa, +no, +rp, +sn, +fo}:
      match life:
        case M.LArchived{}:
          "archived"
        case M.LStopped{}:
          "stopped"
        case M.LFailed{}:
          "failed"
        case M.LActive{}:
          status_of_run(M.Agent{n, im, pa, M.LActive{}, de, al, fi, ws, di, br, cr, fa, no, rp, sn, fo}, x)

# the relation of the sender to the recipient, as the recipient reads it
# (prompts.rs relation)
def relation(+from: String, +to: String, +fp: Maybe<&2, String>, +tp: Maybe<&2, String>) -> String:
  Bool.pick(String, String.eq(from, M.USER()), "user",
    Bool.pick(String, String.eq(from, M.HUB()), "hub",
      Bool.pick(String, String.eq(from, M.GITHUB()), "peer",
      Bool.pick(String, M.maybe_str_is(tp, from) || (String.eq(from, M.MAIN()) && Bool.not(String.eq(to, M.MAIN()))), "parent",
        Bool.pick(String, M.maybe_str_is(fp, to) || String.eq(to, M.MAIN()), "child", "peer")))))

def parent_of(m: Maybe<&2, M.Agent>) -> Maybe<&2, String>:
  match m:
    case None{}:
      None{}
    case Some{+a}:
      M.Agent.parent(a)
