# bend/proofs/lib/hub-cold-5.bend: msgs_moved on the split (name-free,
# architect m_31497). `moved` rewrites a hot record's `to` and keeps its id
# and state, and every old record is cold: so the split holds and every
# message is the one-list `moved` (law cold_is_inert, hc_apply's case).
import Base
import ../../hub/model.bend as HM
import ../../hub/gen/state.bend as HS
import ../../hub/gen/state-laws.bend as HSL
import ../../hub/cx.bend as HX
import ../../hub/inv.bend as HI
import ./hub-cold.bend as PC1

# one record as `moved` takes it
def hm_one(+r: HS.MRec, +f: String, +t: String) -> HS.MRec:
  HM.moved.if(HM.MRec.is_hot(r) && String.eq(HS.Msg.to(HS.MRec.msg(r)), f), r, t)

# MRec.to's record, field by field (the generated laws: no record written by position)
def hm_msg_to(+r: HS.MRec, +t: String) -> {HS.MRec.msg(HM.MRec.to(r, t)) == HS.Msg.with_to(HS.MRec.msg(r), t) : HS.Msg}:
  HSL.MRec.msg.get_with(r, HS.Msg.with_to(HS.MRec.msg(r), t))

def hm_st_wm(+r: HS.MRec, +v: HS.Msg) -> {HS.MRec.st(HS.MRec.with_msg(r, v)) == HS.MRec.st(r) : HS.MSt}:
  %HSL.MRec.msg.eta(r, v) : {HS.MRec.st(_) == HS.MRec.st(r) : HS.MSt}
  {==}

def hm_se_wm(+r: HS.MRec, +v: HS.Msg) -> {HS.MRec.settled(HS.MRec.with_msg(r, v)) == HS.MRec.settled(r) : Bool}:
  %HSL.MRec.msg.eta(r, v) : {HS.MRec.settled(_) == HS.MRec.settled(r) : Bool}
  {==}

def hm_id_wt(+m: HS.Msg, +t: String) -> {HS.Msg.id(HS.Msg.with_to(m, t)) == HS.Msg.id(m) : Nat}:
  %HSL.Msg.to.eta(m, t) : {HS.Msg.id(_) == HS.Msg.id(m) : Nat}
  {==}

def hm_ex_wt(+m: HS.Msg, +t: String) -> {HS.Msg.expect(HS.Msg.with_to(m, t)) == HS.Msg.expect(m) : Bool}:
  %HSL.Msg.to.eta(m, t) : {HS.Msg.expect(_) == HS.Msg.expect(m) : Bool}
  {==}

def hm_to_id(+r: HS.MRec, +t: String) -> {HM.MRec.id(HM.MRec.to(r, t)) == HM.MRec.id(r) : Nat}:
  %Equal.sym(HS.Msg, HS.MRec.msg(HM.MRec.to(r, t)), HS.Msg.with_to(HS.MRec.msg(r), t), hm_msg_to(r, t)) : {HS.Msg.id(_) == HS.Msg.id(HS.MRec.msg(r)) : Nat}
  hm_id_wt(HS.MRec.msg(r), t)

def hm_id_if(c: Bool, +r: HS.MRec, +t: String) -> {HM.MRec.id(HM.moved.if(c, r, t)) == HM.MRec.id(r) : Nat}:
  match c:
    case True{}:
      hm_to_id(r, t)
    case False{}:
      {==}

# a moved record keeps its id
def hm_id(+r: HS.MRec, +f: String, +t: String) -> {HM.MRec.id(hm_one(r, f, t)) == HM.MRec.id(r) : Nat}:
  hm_id_if(HM.MRec.is_hot(r) && String.eq(HS.Msg.to(HS.MRec.msg(r)), f), r, t)

# the ids, in order, are the same
def hm_ids(+xs: List<&2, HS.MRec>, +f: String, +t: String) -> {HI.ids(HM.moved(xs, f, t)) == HI.ids(xs) : List<&2, Nat>}:
  match xs:
    case Nil{}:
      {==}
    case Con{r, u}:
      Equal.trans(List<&2, Nat>, HM.MRec.id(hm_one(r, f, t)) <> HI.ids(HM.moved(u, f, t)), HM.MRec.id(r) <> HI.ids(HM.moved(u, f, t)), HM.MRec.id(r) <> HI.ids(u),
        Equal.cong(Nat, List<&2, Nat>, x => x <> HI.ids(HM.moved(u, f, t)), HM.MRec.id(hm_one(r, f, t)), HM.MRec.id(r), hm_id(r, f, t)),
        Equal.cong(List<&2, Nat>, List<&2, Nat>, y => HM.MRec.id(r) <> y, HI.ids(HM.moved(u, f, t)), HI.ids(u), hm_ids(u, f, t)))

def hm_above(+xs: List<&2, HS.MRec>, +n: Nat, +f: String, +t: String, a: HI.Above(xs, n)) -> HI.Above(HM.moved(xs, f, t), n):
  match xs:
    case Nil{}:
      Unit{}
    case Con{r, u}:
      match a:
        case HX.Both{g, au}:
          HX.Both{Equal.trans(Bool, Nat.is_gt(HM.MRec.id(hm_one(r, f, t)), n), Nat.is_gt(HM.MRec.id(r), n), True{},
              Equal.cong(Nat, Bool, x => Nat.is_gt(x, n), HM.MRec.id(hm_one(r, f, t)), HM.MRec.id(r), hm_id(r, f, t)), g),
            hm_above(u, n, f, t, au)}

def hm_asc(+xs: List<&2, HS.MRec>, +f: String, +t: String, a: HI.Asc(xs)) -> HI.Asc(HM.moved(xs, f, t)):
  match xs:
    case Nil{}:
      Unit{}
    case Con{r, u}:
      match a:
        case HX.Both{ab, au}:
          %Equal.sym(Nat, HM.MRec.id(hm_one(r, f, t)), HM.MRec.id(r), hm_id(r, f, t)) : HX.Both<HI.Above(HM.moved(u, f, t), _), HI.Asc(HM.moved(u, f, t))>
          HX.Both{hm_above(u, HM.MRec.id(r), f, t, ab), hm_asc(u, f, t, au)}

def hm_disj(+hs: List<&2, HS.MRec>, +os: List<&2, HS.MRec>, +f: String, +t: String, d: HI.Disjoint(hs, os)) -> HI.Disjoint(HM.moved(hs, f, t), os):
  match hs:
    case Nil{}:
      Unit{}
    case Con{r, u}:
      match d:
        case HX.Both{g, du}:
          HX.Both{Equal.trans(Bool, HM.nat_in(HI.ids(os), HM.MRec.id(hm_one(r, f, t))), HM.nat_in(HI.ids(os), HM.MRec.id(r)), False{},
              Equal.cong(Nat, Bool, x => HM.nat_in(HI.ids(os), x), HM.MRec.id(hm_one(r, f, t)), HM.MRec.id(r), hm_id(r, f, t)), g),
            hm_disj(u, os, f, t, du)}

def hm_below(+xs: List<&2, HS.MRec>, +n: Nat, +f: String, +t: String, b: HI.Below(HI.ids(xs), n)) -> HI.Below(HI.ids(HM.moved(xs, f, t)), n):
  %Equal.sym(List<&2, Nat>, HI.ids(HM.moved(xs, f, t)), HI.ids(xs), hm_ids(xs, f, t)) : HI.Below(_, n)
  b

# a cold record is never moved
def hm_cold(+os: List<&2, HS.MRec>, +f: String, +t: String, c: HI.AllCold(os)) -> {HM.moved(os, f, t) == os : List<&2, HS.MRec>}:
  match os:
    case Nil{}:
      {==}
    case Con{r, u}:
      match c:
        case HX.Both{k, cu}:
          %hm_cold(u, f, t, cu) : {HM.moved(r <> u, f, t) == r <> _ : List<&2, HS.MRec>}
          %Equal.sym(Bool, HM.MRec.is_hot(r), False{}, k) : {HM.moved.if(_ && String.eq(HS.Msg.to(HS.MRec.msg(r)), f), r, t) <> HM.moved(u, f, t) == r <> HM.moved(u, f, t) : List<&2, HS.MRec>}
          {==}

def hm_id_above(+xs: List<&2, HS.MRec>, +n: Nat, +f: String, +t: String) -> {HM.id_above(HM.moved(xs, f, t), n) == HM.id_above(xs, n) : Bool}:
  match xs:
    case Nil{}:
      {==}
    case Con{h, u}:
      Equal.cong(Nat, Bool, x => Nat.is_gt(x, n), HM.MRec.id(hm_one(h, f, t)), HM.MRec.id(h), hm_id(h, f, t))

def hm_id_above2(+xs: List<&2, HS.MRec>, +r: HS.MRec, +f: String, +t: String)
    -> {HM.id_above(HM.moved(xs, f, t), HM.MRec.id(hm_one(r, f, t))) == HM.id_above(xs, HM.MRec.id(r)) : Bool}:
  Equal.trans(Bool, HM.id_above(HM.moved(xs, f, t), HM.MRec.id(hm_one(r, f, t))), HM.id_above(HM.moved(xs, f, t), HM.MRec.id(r)), HM.id_above(xs, HM.MRec.id(r)),
    Equal.cong(Nat, Bool, x => HM.id_above(HM.moved(xs, f, t), x), HM.MRec.id(hm_one(r, f, t)), HM.MRec.id(r), hm_id(r, f, t)),
    hm_id_above(xs, HM.MRec.id(r), f, t))

# a record put among descending ones, then moved: moved, then put
def hm_ins(+xs: List<&2, HS.MRec>, gt: Bool, +r: HS.MRec, +f: String, +t: String)
    -> {HM.moved(HM.ins_desc.go(xs, gt, r), f, t) == HM.ins_desc.go(HM.moved(xs, f, t), gt, hm_one(r, f, t)) : List<&2, HS.MRec>}:
  match xs gt:
    case Nil{} _:
      {==}
    case Con{h, u} True{}:
      +g = HM.id_above(u, HM.MRec.id(r))
      +m = hm_one(r, f, t)
      Equal.trans(List<&2, HS.MRec>, hm_one(h, f, t) <> HM.moved(HM.ins_desc.go(u, g, r), f, t), hm_one(h, f, t) <> HM.ins_desc.go(HM.moved(u, f, t), g, m),
        hm_one(h, f, t) <> HM.ins_desc.go(HM.moved(u, f, t), HM.id_above(HM.moved(u, f, t), HM.MRec.id(m)), m),
        Equal.cong(List<&2, HS.MRec>, List<&2, HS.MRec>, y => hm_one(h, f, t) <> y, HM.moved(HM.ins_desc.go(u, g, r), f, t), HM.ins_desc.go(HM.moved(u, f, t), g, m), hm_ins(u, g, r, f, t)),
        Equal.cong(Bool, List<&2, HS.MRec>, b => hm_one(h, f, t) <> HM.ins_desc.go(HM.moved(u, f, t), b, m), g, HM.id_above(HM.moved(u, f, t), HM.MRec.id(m)),
          Equal.sym(Bool, HM.id_above(HM.moved(u, f, t), HM.MRec.id(m)), g, hm_id_above2(u, r, f, t))))
    case Con{h, u} False{}:
      {==}

# every hot one put among the old (cold) ones, then moved: moved, then put
def hm_ins_all(+hs: List<&2, HS.MRec>, +os: List<&2, HS.MRec>, +f: String, +t: String, e: {HM.moved(os, f, t) == os : List<&2, HS.MRec>})
    -> {HM.ins_all(HM.moved(hs, f, t), os) == HM.moved(HM.ins_all(hs, os), f, t) : List<&2, HS.MRec>}:
  match hs:
    case Nil{}:
      Equal.sym(List<&2, HS.MRec>, HM.moved(os, f, t), os, e)
    case Con{r, u}:
      +a = HM.ins_all(u, os)
      +m = hm_one(r, f, t)
      Equal.trans(List<&2, HS.MRec>, HM.ins_desc(HM.ins_all(HM.moved(u, f, t), os), m), HM.ins_desc(HM.moved(a, f, t), m), HM.moved(HM.ins_desc(a, r), f, t),
        Equal.cong(List<&2, HS.MRec>, List<&2, HS.MRec>, y => HM.ins_desc(y, m), HM.ins_all(HM.moved(u, f, t), os), HM.moved(a, f, t), hm_ins_all(u, os, f, t, e)),
        Equal.trans(List<&2, HS.MRec>, HM.ins_desc.go(HM.moved(a, f, t), HM.id_above(HM.moved(a, f, t), HM.MRec.id(m)), m),
          HM.ins_desc.go(HM.moved(a, f, t), HM.id_above(a, HM.MRec.id(r)), m), HM.moved(HM.ins_desc(a, r), f, t),
          Equal.cong(Bool, List<&2, HS.MRec>, b => HM.ins_desc.go(HM.moved(a, f, t), b, m), HM.id_above(HM.moved(a, f, t), HM.MRec.id(m)), HM.id_above(a, HM.MRec.id(r)), hm_id_above2(a, r, f, t)),
          Equal.sym(List<&2, HS.MRec>, HM.moved(HM.ins_desc.go(a, HM.id_above(a, HM.MRec.id(r)), r), f, t), HM.ins_desc.go(HM.moved(a, f, t), HM.id_above(a, HM.MRec.id(r)), m),
            hm_ins(a, HM.id_above(a, HM.MRec.id(r)), r, f, t))))

def hm_snoc(+xs: List<&2, HS.MRec>, +x: HS.MRec, +f: String, +t: String)
    -> {HM.moved(HM.snoc(HS.MRec, xs, x), f, t) == HM.snoc(HS.MRec, HM.moved(xs, f, t), hm_one(x, f, t)) : List<&2, HS.MRec>}:
  match xs:
    case Nil{}:
      {==}
    case Con{h, u}:
      Equal.cong(List<&2, HS.MRec>, List<&2, HS.MRec>, y => hm_one(h, f, t) <> y, HM.moved(HM.snoc(HS.MRec, u, x), f, t), HM.snoc(HS.MRec, HM.moved(u, f, t), hm_one(x, f, t)), hm_snoc(u, x, f, t))

# turned around, then moved: moved, then turned around
def hm_rev(+xs: List<&2, HS.MRec>, +f: String, +t: String)
    -> {HM.moved(List.reverse(&2, HS.MRec, xs), f, t) == List.reverse(&2, HS.MRec, HM.moved(xs, f, t)) : List<&2, HS.MRec>}:
  match xs:
    case Nil{}:
      {==}
    case Con{x, u}:
      +ru = List.reverse(&2, HS.MRec, u)
      +mu = HM.moved(u, f, t)
      +m = hm_one(x, f, t)
      Equal.trans(List<&2, HS.MRec>, HM.moved(List.reverse(&2, HS.MRec, x <> u), f, t), HM.moved(HM.snoc(HS.MRec, ru, x), f, t), List.reverse(&2, HS.MRec, m <> mu),
        Equal.cong(List<&2, HS.MRec>, List<&2, HS.MRec>, y => HM.moved(y, f, t), List.reverse(&2, HS.MRec, x <> u), HM.snoc(HS.MRec, ru, x), PC1.hc_rev_cons(u, x)),
        Equal.trans(List<&2, HS.MRec>, HM.moved(HM.snoc(HS.MRec, ru, x), f, t), HM.snoc(HS.MRec, HM.moved(ru, f, t), m), List.reverse(&2, HS.MRec, m <> mu),
          hm_snoc(ru, x, f, t),
          Equal.trans(List<&2, HS.MRec>, HM.snoc(HS.MRec, HM.moved(ru, f, t), m), HM.snoc(HS.MRec, List.reverse(&2, HS.MRec, mu), m), List.reverse(&2, HS.MRec, m <> mu),
            Equal.cong(List<&2, HS.MRec>, List<&2, HS.MRec>, y => HM.snoc(HS.MRec, y, m), HM.moved(ru, f, t), List.reverse(&2, HS.MRec, mu), hm_rev(u, f, t)),
            Equal.sym(List<&2, HS.MRec>, List.reverse(&2, HS.MRec, m <> mu), HM.snoc(HS.MRec, List.reverse(&2, HS.MRec, mu), m), PC1.hc_rev_cons(mu, m)))))

# msgs_moved on the split: every message is the one-list `moved`, the split holds
def hm_split(+ho: List<&2, HS.MRec>, +ol: List<&2, HS.MRec>, +nm: Nat, +f: String, +t: String, +p: HI.Parts(ho, ol, nm))
    -> HX.Both<{List.reverse(&2, HS.MRec, HM.ins_all(HM.moved(ho, f, t), ol)) == HM.moved(List.reverse(&2, HS.MRec, HM.ins_all(ho, ol)), f, t) : List<&2, HS.MRec>},
      HI.Parts(HM.moved(ho, f, t), ol, nm)>:
  match p:
    case HX.Both{asc, HX.Both{desc, HX.Both{cold, HX.Both{disj, HX.Both{bh, bo}}}}}:
      +a = HM.ins_all(ho, ol)
      HX.Both{Equal.trans(List<&2, HS.MRec>, List.reverse(&2, HS.MRec, HM.ins_all(HM.moved(ho, f, t), ol)), List.reverse(&2, HS.MRec, HM.moved(a, f, t)), HM.moved(List.reverse(&2, HS.MRec, a), f, t),
          Equal.cong(List<&2, HS.MRec>, List<&2, HS.MRec>, y => List.reverse(&2, HS.MRec, y), HM.ins_all(HM.moved(ho, f, t), ol), HM.moved(a, f, t), hm_ins_all(ho, ol, f, t, hm_cold(ol, f, t, cold))),
          Equal.sym(List<&2, HS.MRec>, HM.moved(List.reverse(&2, HS.MRec, a), f, t), List.reverse(&2, HS.MRec, HM.moved(a, f, t)), hm_rev(a, f, t))),
        HX.Both{hm_asc(ho, f, t, asc), HX.Both{desc, HX.Both{cold, HX.Both{hm_disj(ho, ol, f, t, disj), HX.Both{hm_below(ho, nm, f, t, bh), bo}}}}}}

# ---- one record moved (laws take_moves_live_queued, take_moves_live_owed) ----

def hm_or_l(a: Bool, +b: Bool, e: {a == True{} : Bool}) -> {Bool.or(a, b) == True{} : Bool}:
  %Equal.sym(Bool, a, True{}, e) : {Bool.or(_, b) == True{} : Bool}
  {==}

def hm_or_r(a: Bool, +b: Bool, e: {b == True{} : Bool}) -> {Bool.or(a, b) == True{} : Bool}:
  match a:
    case True{}:
      {==}
    case False{}:
      e

def hm_and(a: Bool, +b: Bool, ea: {a == True{} : Bool}, eb: {b == True{} : Bool}) -> {Bool.and(a, b) == True{} : Bool}:
  %Equal.sym(Bool, a, True{}, ea) : {Bool.and(_, b) == True{} : Bool}
  eb

def hm_hit(c: Bool, +r: HS.MRec, +t: String, e: {c == True{} : Bool}) -> {[HM.moved.if(c, r, t)] == [HM.MRec.to(r, t)] : List<&2, HS.MRec>}:
  %Equal.sym(Bool, c, True{}, e) : {[HM.moved.if(_, r, t)] == [HM.MRec.to(r, t)] : List<&2, HS.MRec>}
  {==}

def hm_to_owes(+r: HS.MRec, +t: String) -> {HM.MRec.owes(HM.MRec.to(r, t)) == HM.MRec.owes(r) : Bool}:
  %Equal.sym(HS.Msg, HS.MRec.msg(HM.MRec.to(r, t)), HS.Msg.with_to(HS.MRec.msg(r), t), hm_msg_to(r, t)) : {HS.Msg.expect(_) && Bool.not(HS.MRec.settled(HM.MRec.to(r, t))) && HM.is_delivered(HS.MRec.st(HM.MRec.to(r, t))) == HM.MRec.owes(r) : Bool}
  %Equal.sym(Bool, HS.Msg.expect(HS.Msg.with_to(HS.MRec.msg(r), t)), HS.Msg.expect(HS.MRec.msg(r)), hm_ex_wt(HS.MRec.msg(r), t)) : {_ && Bool.not(HS.MRec.settled(HM.MRec.to(r, t))) && HM.is_delivered(HS.MRec.st(HM.MRec.to(r, t))) == HM.MRec.owes(r) : Bool}
  %Equal.sym(Bool, HS.MRec.settled(HM.MRec.to(r, t)), HS.MRec.settled(r), hm_se_wm(r, HS.Msg.with_to(HS.MRec.msg(r), t))) : {HS.Msg.expect(HS.MRec.msg(r)) && Bool.not(_) && HM.is_delivered(HS.MRec.st(HM.MRec.to(r, t))) == HM.MRec.owes(r) : Bool}
  %Equal.sym(HS.MSt, HS.MRec.st(HM.MRec.to(r, t)), HS.MRec.st(r), hm_st_wm(r, HS.Msg.with_to(HS.MRec.msg(r), t))) : {HS.Msg.expect(HS.MRec.msg(r)) && Bool.not(HS.MRec.settled(r)) && HM.is_delivered(_) == HM.MRec.owes(r) : Bool}
  {==}

def hm_to_to(+r: HS.MRec, +t: String) -> {HS.Msg.to(HS.MRec.msg(HM.MRec.to(r, t))) == t : String}:
  %Equal.sym(HS.Msg, HS.MRec.msg(HM.MRec.to(r, t)), HS.Msg.with_to(HS.MRec.msg(r), t), hm_msg_to(r, t)) : {HS.Msg.to(_) == t : String}
  HSL.Msg.to.get_with(HS.MRec.msg(r), t)

# MRec.to keeps the id, the state and what it owes, and says `t`
def hm_to(+r: HS.MRec, +t: String)
    -> HX.Both<{HM.MRec.id(HM.MRec.to(r, t)) == HM.MRec.id(r) : Nat}, HX.Both<{HS.MRec.st(HM.MRec.to(r, t)) == HS.MRec.st(r) : HS.MSt},
      HX.Both<{HM.MRec.owes(HM.MRec.to(r, t)) == HM.MRec.owes(r) : Bool}, {HS.Msg.to(HS.MRec.msg(HM.MRec.to(r, t))) == t : String}>>>:
  HX.Both{hm_to_id(r, t), HX.Both{hm_st_wm(r, HS.Msg.with_to(HS.MRec.msg(r), t)), HX.Both{hm_to_owes(r, t), hm_to_to(r, t)}}}

# a hot record to `f` is moved: the one record MRec.to(r, t)
def hm_moved_one(+r: HS.MRec, +f: String, +t: String, hot: {HM.MRec.is_hot(r) == True{} : Bool}, e: {String.eq(HS.Msg.to(HS.MRec.msg(r)), f) == True{} : Bool})
    -> {HM.moved([r], f, t) == [HM.MRec.to(r, t)] : List<&2, HS.MRec>}:
  hm_hit(HM.MRec.is_hot(r) && String.eq(HS.Msg.to(HS.MRec.msg(r)), f), r, t, hm_and(HM.MRec.is_hot(r), String.eq(HS.Msg.to(HS.MRec.msg(r)), f), hot, e))

def hm_live_queued.go(+r: HS.MRec, +n: String, +h: String, +q: {HM.is_queued(HS.MRec.st(r)) == True{} : Bool}, e: {String.eq(HS.Msg.to(HS.MRec.msg(r)), n) == True{} : Bool},
    w: HX.Both<{HM.MRec.id(HM.MRec.to(r, h)) == HM.MRec.id(r) : Nat}, HX.Both<{HS.MRec.st(HM.MRec.to(r, h)) == HS.MRec.st(r) : HS.MSt},
      HX.Both<{HM.MRec.owes(HM.MRec.to(r, h)) == HM.MRec.owes(r) : Bool}, {HS.Msg.to(HS.MRec.msg(HM.MRec.to(r, h))) == h : String}>>>)
    -> HX.Both<{HM.moved([r], n, h) == [HM.MRec.to(r, h)] : List<&2, HS.MRec>}, HX.Both<{HM.MRec.id(HM.MRec.to(r, h)) == HM.MRec.id(r) : Nat},
      HX.Both<{HM.is_queued(HS.MRec.st(HM.MRec.to(r, h))) == True{} : Bool}, {HS.Msg.to(HS.MRec.msg(HM.MRec.to(r, h))) == h : String}>>>:
  match w:
    case HX.Both{wi, HX.Both{ws, HX.Both{wo, wt}}}:
      HX.Both{hm_moved_one(r, n, h, hm_or_l(HM.is_queued(HS.MRec.st(r)), HM.MRec.owes(r), q), e),
        HX.Both{wi, HX.Both{Equal.trans(Bool, HM.is_queued(HS.MRec.st(HM.MRec.to(r, h))), HM.is_queued(HS.MRec.st(r)), True{},
          Equal.cong(HS.MSt, Bool, x => HM.is_queued(x), HS.MRec.st(HM.MRec.to(r, h)), HS.MRec.st(r), ws), q), wt}}}

def hm_live_queued(+r: HS.MRec, +n: String, +h: String, q: {HM.is_queued(HS.MRec.st(r)) == True{} : Bool}, e: {String.eq(HS.Msg.to(HS.MRec.msg(r)), n) == True{} : Bool})
    -> HX.Both<{HM.moved([r], n, h) == [HM.MRec.to(r, h)] : List<&2, HS.MRec>}, HX.Both<{HM.MRec.id(HM.MRec.to(r, h)) == HM.MRec.id(r) : Nat},
      HX.Both<{HM.is_queued(HS.MRec.st(HM.MRec.to(r, h))) == True{} : Bool}, {HS.Msg.to(HS.MRec.msg(HM.MRec.to(r, h))) == h : String}>>>:
  hm_live_queued.go(r, n, h, q, e, hm_to(r, h))

def hm_live_owed.go(+r: HS.MRec, +n: String, +h: String, +o: {HM.MRec.owes(r) == True{} : Bool}, e: {String.eq(HS.Msg.to(HS.MRec.msg(r)), n) == True{} : Bool},
    w: HX.Both<{HM.MRec.id(HM.MRec.to(r, h)) == HM.MRec.id(r) : Nat}, HX.Both<{HS.MRec.st(HM.MRec.to(r, h)) == HS.MRec.st(r) : HS.MSt},
      HX.Both<{HM.MRec.owes(HM.MRec.to(r, h)) == HM.MRec.owes(r) : Bool}, {HS.Msg.to(HS.MRec.msg(HM.MRec.to(r, h))) == h : String}>>>)
    -> HX.Both<{HM.moved([r], n, h) == [HM.MRec.to(r, h)] : List<&2, HS.MRec>}, HX.Both<{HM.MRec.id(HM.MRec.to(r, h)) == HM.MRec.id(r) : Nat},
      HX.Both<{HM.MRec.owes(HM.MRec.to(r, h)) == True{} : Bool}, {HS.Msg.to(HS.MRec.msg(HM.MRec.to(r, h))) == h : String}>>>:
  match w:
    case HX.Both{wi, HX.Both{ws, HX.Both{wo, wt}}}:
      HX.Both{hm_moved_one(r, n, h, hm_or_r(HM.is_queued(HS.MRec.st(r)), HM.MRec.owes(r), o), e),
        HX.Both{wi, HX.Both{Equal.trans(Bool, HM.MRec.owes(HM.MRec.to(r, h)), HM.MRec.owes(r), True{}, wo, o), wt}}}

def hm_live_owed(+r: HS.MRec, +n: String, +h: String, o: {HM.MRec.owes(r) == True{} : Bool}, e: {String.eq(HS.Msg.to(HS.MRec.msg(r)), n) == True{} : Bool})
    -> HX.Both<{HM.moved([r], n, h) == [HM.MRec.to(r, h)] : List<&2, HS.MRec>}, HX.Both<{HM.MRec.id(HM.MRec.to(r, h)) == HM.MRec.id(r) : Nat},
      HX.Both<{HM.MRec.owes(HM.MRec.to(r, h)) == True{} : Bool}, {HS.Msg.to(HS.MRec.msg(HM.MRec.to(r, h))) == h : String}>>>:
  hm_live_owed.go(r, n, h, o, e, hm_to(r, h))
