# bend/laws/photo.bend: the hub's photo (hub/photo.bend, issue 36 chunk
# 3). A boot may start from a photo and replay only the events after it:
# these laws say it gives the state a full replay gives. Closed by
# bend/proofs/photo.bend; the gate checks every bend/proofs/*.bend.
import Base
import ../vendor/json.bend as J
import ../hub/photo.bend as P
import ../hub/model.bend as HM
import ../hub/gen/state.bend as HS
import ../hub/gen/state-codec.bend as HSC
import ../hub/cx.bend as HX
import ../hub/core.bend as HC

# LAW: with no env query pending, the photo is the durable state's photo
# shape (and only the durable state: the runtime is not in it).
law photo_is_the_state:
  for +d: HS.St
  for +r: HX.R
  for +f: Bool
  for q: {HX.R.need(r) == None{} : Maybe<&2, J.Json>}
  {P.photo(HC.Hub{d, r, f}) == Some{HSC.St.photo_json(d)} : Maybe<&2, J.Json>}

# LAW: a hub that applied nothing yet, restored from the photo of a
# state, holds that state, its runtime fresh in the same workspace
# (restore_photo(photo(h)) keeps Hub.d), and takes no second restore.
law restore_keeps_the_state:
  for +d: HS.St
  for +x: HS.St
  for +r: HX.R
  {P.restore(HC.Hub{x, r, True{}}, HSC.St.photo_json(d)) == Some{HC.Hub{d, P.fresh(HX.R.workspace(r)), False{}}} : Maybe<&2, HC.Hub>}

# LAW: a hub that applied something (a step, a replay, a restore) is never
# restored: a photo never replaces a live state (architect m_34907).
law restore_only_fresh:
  for +x: HS.St
  for +r: HX.R
  for +j: J.Json
  {P.restore(HC.Hub{x, r, False{}}, j) == None{} : Maybe<&2, HC.Hub>}

# LAW: replaying a journal whole gives the state of replaying its tail
# from the photo of its prefix's state: a boot from a photo taken after
# `p` and a full replay agree, wherever the photo was taken.
law replay_from_photo:
  for +p: List<&2, Maybe<&2, HM.Ev>>
  for +t: List<&2, Maybe<&2, HM.Ev>>
  for +st: HS.St
  {P.replayed(List.append(&2, Maybe<&2, HM.Ev>, p, t), st) == P.replayed(t, HSC.St.photo_of(HSC.St.photo_json(P.replayed(p, st)))) : HS.St}
