# hub/photo.bend: the hub's photo (issue 36). Its durable state as one
# JSON value (gen/state-codec.bend's St.photo_json, lossless: the law
# St.photo_round), and the hub rebuilt from one with a fresh runtime, so a
# boot starts from the photo and replays only the events after it.
# main.bend answers `photo` and `restore_photo` with these; their laws are
# in bend/laws/photo.bend.
import Base

import ../vendor/json.bend as J

import ./gen/state.bend as S
import ./gen/state-codec.bend as SC

import ./model.bend as M
import ./cold.bend as CO
import ./cx.bend as X
import ./core.bend as H

# the photo of the durable state; none while an env query is pending (a
# step halted on its need: the hub sends the same input again)
def photo.go(need: Maybe<&2, J.Json>, +d: S.St) -> Maybe<&2, J.Json>:
  match need:
    case Some{_}:
      None{}
    case None{}:
      Some{SC.St.photo_json(d)}

def photo(+h: H.Hub) -> Maybe<&2, J.Json>:
  photo.go(X.R.need(H.Hub.r(h)), H.Hub.d(h))

# the runtime of a new hub in that workspace (R is never journaled)
def fresh(+workspace: String) -> X.R:
  H.Hub.r(H.hub_new(workspace))

# whether the hub applied nothing yet (no step, no replay since init)
def is_fresh(+h: H.Hub) -> Bool:
  match h:
    case H.Hub{_, _, +f}:
      f

# the hub from a photo: its durable state, the runtime fresh in the same
# workspace, nothing applied since (a second restore is refused too).
# None, the hub as it is, when it applied something already (a restore
# never replaces a live state: architect m_34907) or when the photo is
# not an object
def restore.go(f: Bool, +h: H.Hub, +j: J.Json) -> Maybe<&2, H.Hub>:
  match f j:
    case True{} J.JObj{+kvs}:
      Some{H.Hub{SC.St.photo_of(J.JObj{kvs}), fresh(X.R.workspace(H.Hub.r(h))), False{}}}
    case _ _:
      None{}

def restore(+h: H.Hub, +j: J.Json) -> Maybe<&2, H.Hub>:
  restore.go(is_fresh(h), h, j)

# the durable state a batch of journal events leaves (the boot's fold,
# CO.replay_batch, without its skipped indexes)
def st_of(p: S.St & List<&2, Nat>) -> S.St:
  match p:
    case (d, _):
      d

def replayed(ms: List<&2, Maybe<&2, M.Ev>>, +st: S.St) -> S.St:
  st_of(CO.replay_batch(ms, st, 0n, Nil{}))
