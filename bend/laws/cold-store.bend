# bend/laws/cold-store.bend: the cold records out of St (issue 36 chunk 5,
# plan v2 signed m_35902). A cold record may leave St for the cold store;
# what a step or a replay batch needs is asked for BEFORE anything applies
# (hub/needs.bend), so M.apply never asks. These laws say the needs are
# complete: a record they do not name may be out of St, apply gives the
# same state without it. Closed by bend/proofs/cold-store.bend.
import Base
import ../hub/needs.bend as N
import ../hub/model.bend as HM
import ../hub/inv.bend as HI
import ../hub/cx.bend as HX
import ../hub/gen/state.bend as HS

# LAW (apply_is_local, messages): a cold message `x` the event does not
# name may be out of St: apply without it is apply with it, then without
# it (x is not read, and stays as it was).
law apply_is_local_msg:
  for +s: HS.St
  for +e: HM.Ev
  for +x: Nat
  for +r: HS.MRec
  for u: HI.Split(s)
  for k: HX.FreshEv(s, e)
  for o: {HM.rec_of(HS.St.old(s), x) == Some{r} : Maybe<&2, HS.MRec>}
  for n: {HM.nat_in(N.Needs.msgs(N.needs(e)), x) == False{} : Bool}
  {HM.apply(N.drop_old(s, x), e) == N.drop_old(HM.apply(s, e), x) : HS.St}

# LAW (fetch_then_apply_list): a replay batch asks once, before it applies:
# a cold message `x` its needs (through its renames) do not name may be out
# of St for the whole batch, and the batch gives the same state without it.
law fetch_then_apply_list:
  for +s: HS.St
  for +es: List<&2, HM.Ev>
  for +x: Nat
  for +r: HS.MRec
  for u: HI.Split(s)
  for f: HX.Fresh(es, s)
  for o: {HM.rec_of(HS.St.old(s), x) == Some{r} : Maybe<&2, HS.MRec>}
  for n: {HM.nat_in(N.Needs.msgs(N.needs_batch(es)), x) == False{} : Bool}
  {HM.apply_all(es, N.drop_old(s, x)) == N.drop_old(HM.apply_all(es, s), x) : HS.St}
