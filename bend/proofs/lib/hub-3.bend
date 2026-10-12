# bend/proofs/lib/hub-3.bend: helpers the hub proofs share (moved from
# PROOF.bend), layered: a lib calls only the ones before it.
import Base
import ../../hub/model.bend as HM
import ../../hub/cx.bend as HX
import ../../hub/core.bend as HC
import ../../hub/inv.bend as HI
import ../../hub/timers.bend as HTM
import ../../hub/wakes.bend as HWK
import ../../hub/xhub-model.bend as HXH
import ../../hub/xhub.bend as HXB
import ./hub-1.bend as PL1
import ./hub-2.bend as PL2

# entries listed before a renamed one stay apart from the renamed list
def hub_aa_map_ren(+x: List<&2, String>, +t: List<&2, HM.Agent>, +old: String, +new: String, a: HI.ApartAll(x, HI.profile(t)), +fx: {HM.str_in(x, new) == False{} : Bool})
    -> HI.ApartAll(x, HI.profile(HM.map_agent(t, old, HM.ORename{new}))):
  match t:
    case Nil{}:
      Unit{}
    case Con{h, r}:
      match a:
        case HX.Both{+a1, +a2}:
          PL2.hub_aa_map_ren.pick(String.eq(HM.Agent.name(h), old), x, h, r, old, new, {==}, a1, fx, a2, hub_aa_map_ren(x, r, old, new, a2, fx))

def hub_nok_ren.top(h: HM.Agent, +t: List<&2, HM.Agent>, +new: String, a1: HI.ApartAll(HI.names(h), HI.profile(t)), ft: PL2.hub_free(HI.profile(t), new),
    nt: HI.NamesOK(HI.profile(t))) -> HI.NamesOK(HI.profile(HM.agent_op(h, HM.ORename{new}) <> t)):
  match h:
    case HM.Agent{name, im, pa, life, de, al, fi, ws, di, br, cr, fa, no, rp, sn, fo}:
      HX.Both{PL2.hub_aa_ren(name, al, new, HI.profile(t), a1, ft), nt}

def hub_nok_ren.pick(c: Bool, +h: HM.Agent, +t: List<&2, HM.Agent>, +old: String, +new: String, +e: {String.eq(HM.Agent.name(h), old) == c : Bool},
    a1: HI.ApartAll(HI.names(h), HI.profile(t)), nt: HI.NamesOK(HI.profile(t)), +fh: {HM.str_in(HI.names(h), new) == False{} : Bool},
    ft: PL2.hub_free(HI.profile(t), new), ih: HI.NamesOK(HI.profile(HM.map_agent(t, old, HM.ORename{new}))))
    -> HI.NamesOK(HI.profile(HM.map_agent.go(h <> t, String.eq(HM.Agent.name(h), old), old, HM.ORename{new}))):
  match c:
    case True{}:
      %Equal.sym(Bool, String.eq(HM.Agent.name(h), old), True{}, e) : HI.NamesOK(HI.profile(HM.map_agent.go(h <> t, _, old, HM.ORename{new})))
      hub_nok_ren.top(h, t, new, a1, ft, nt)
    case False{}:
      %Equal.sym(Bool, String.eq(HM.Agent.name(h), old), False{}, e) : HI.NamesOK(HI.profile(HM.map_agent.go(h <> t, _, old, HM.ORename{new})))
      HX.Both{hub_aa_map_ren(HI.names(h), t, old, new, a1, fh), ih}

# a rename to a free name keeps every agent's names apart
def hub_nok_ren(+xs: List<&2, HM.Agent>, +old: String, +new: String, nok: HI.NamesOK(HI.profile(xs)), f: PL2.hub_free(HI.profile(xs), new))
    -> HI.NamesOK(HI.profile(HM.map_agent(xs, old, HM.ORename{new}))):
  match xs:
    case Nil{}:
      Unit{}
    case Con{h, t}:
      match nok f:
        case HX.Both{+a1, +nt} HX.Both{+fh, +ft}:
          hub_nok_ren.pick(String.eq(HM.Agent.name(h), old), h, t, old, new, {==}, a1, nt, fh, ft, hub_nok_ren(t, old, new, nt, ft))

def hub_nok_tr(-x: List<&2, List<&2, String>>, -y: List<&2, List<&2, String>>, e: {x == y : List<&2, List<&2, String>>}, d: HI.NamesOK(y)) -> HI.NamesOK(x):
  %Equal.sym(List<&2, List<&2, String>>, x, y, e) : HI.NamesOK(_)
  d

# every event with its journal invariant (a free name for a new task or a
# new name) keeps the names of the agents apart
def hub_apply_names(s: HM.St, e: HM.Ev, u: HI.NamesApart(s), +k: HX.FreshEv(s, e)) -> HI.NamesApart(HM.apply(s, e)):
  match s:
    case HM.St{+ag, +od, +ms, +ca, +no, +nm, +nc, +tm, +xs, +pz, +ho}:
      match e:
        case HM.ETaskCreated{+n, pa, br, ws, at}:
          hub_nok_tr(HI.profile(HM.put_agent(ag, n, HM.new_agent(n, False{}, Some{pa}, ws, br, at))), HM.snoc(List<&2, String>, HI.profile(ag), [n]),
            PL2.hub_put_absent(ag, n, HM.new_agent(n, False{}, Some{pa}, ws, br, at), PL2.hub_nt(HM.St{ag, od, ms, ca, no, nm, nc, tm, xs, pz, ho}, n, k)),
            PL2.hub_nok_snoc(HI.profile(ag), [n], u, PL2.hub_allapart_new(HI.profile(ag), n, PL2.hub_nt(HM.St{ag, od, ms, ca, no, nm, nc, tm, xs, pz, ho}, n, k))))
        case HM.ERenamed{old, +new}:
          hub_nok_ren(ag, old, new, u, PL2.hub_nt(HM.St{ag, od, ms, ca, no, nm, nc, tm, xs, pz, ho}, new, k))
        case HM.ELifecycle{+x, +l, +r}:
          hub_nok_tr(HI.profile(HM.map_agent(ag, x, HM.OLife{l, r})), HI.profile(ag), PL2.hub_prof_map(ag, x, HM.OLife{l, r}, {==}), u)
        case HM.EWorkspace{+x, +w}:
          hub_nok_tr(HI.profile(HM.map_agent(ag, x, HM.OWs{w})), HI.profile(ag), PL2.hub_prof_map(ag, x, HM.OWs{w}, {==}), u)
        case HM.EDeclared{+x, +d, +nt}:
          hub_nok_tr(HI.profile(HM.map_agent(ag, x, HM.ODeclared{d, nt})), HI.profile(ag), PL2.hub_prof_map(ag, x, HM.ODeclared{d, nt}, {==}), u)
        case HM.EFileTouched{+x, +p}:
          hub_nok_tr(HI.profile(HM.map_agent(ag, x, HM.OFile{p})), HI.profile(ag), PL2.hub_prof_map(ag, x, HM.OFile{p}, {==}), u)
        case HM.ESnapshot{+x, +sn}:
          hub_nok_tr(HI.profile(HM.map_agent(ag, x, HM.OSnap{sn})), HI.profile(ag), PL2.hub_prof_map(ag, x, HM.OSnap{sn}, {==}), u)
        case HM.EReported{+x, +rp}:
          hub_nok_tr(HI.profile(HM.map_agent(ag, x, HM.OReport{rp})), HI.profile(ag), PL2.hub_prof_map(ag, x, HM.OReport{rp}, {==}), u)
        case HM.EMsgSent{m}:
          u
        case HM.EMsgState{a, b}:
          u
        case HM.ESettled{a}:
          u
        case HM.ECardOpened{c}:
          u
        case HM.ECardClosed{a, b}:
          u
        case HM.EMainNote{a, b}:
          u
        case HM.ENotesFlushed{}:
          u
        case HM.ETimerSet{a, b}:
          u
        case HM.ETimerFired{a, b, c, d, f}:
          u
        case HM.ETimerRun{a, b}:
          u
        case HM.ETimerStop{a, b, c}:
          u
        case HM.ETimerName{a, b, c, d}:
          u
        case HM.EX{a}:
          u
        case HM.EAct{a}:
          u
        case HM.EFollow{+x, +f, +h}:
          hub_nok_tr(HI.profile(HM.map_agent(ag, x, HM.OFollow{Bool.pick(Maybe<&2, String>, f, Some{h}, None{})})), HI.profile(ag), PL2.hub_prof_map(ag, x, HM.OFollow{Bool.pick(Maybe<&2, String>, f, Some{h}, None{})}, {==}), u)
        case HM.EJobEnd{+x, b}:
          hub_nok_tr(HI.profile(HM.map_agent(ag, x, HM.OFollow{None{}})), HI.profile(ag), PL2.hub_prof_map(ag, x, HM.OFollow{None{}}, {==}), u)
        case HM.EWake{a}:
          u
        case HM.EPaused{a}:
          u
        case HM.EResumed{a}:
          u

def hub_apply_all_names(+evs: List<&2, HM.Ev>, +s: HM.St, u: HI.NamesApart(s), f: HX.Fresh(evs, s)) -> HI.NamesApart(HM.apply_all(evs, s)):
  match evs:
    case Nil{}:
      u
    case Con{e, t}:
      match f:
        case HX.Both{k, ft}:
          hub_apply_all_names(t, HM.apply(s, e), hub_apply_names(s, e, u, k), ft)

def hub_napart_tr(-x: HM.St, -y: HM.St, e: {x == y : HM.St}, u: HI.NamesApart(y)) -> HI.NamesApart(x):
  %Equal.sym(HM.St, x, y, e) : HI.NamesApart(_)
  u

# ---- the timers of `sb every` (hub/timers.bend, core.bend `timer_fire`) ----

# an emit adds its event at the end of the step's journal
def hub_fx_emit(-o: HM.St, cx: HX.Cx<o>, -e: HM.Ev, -k: HX.FreshEv(HX.d(o, cx), e), -kq: HX.QuietEv(e), -kv: HX.DelivEv(HX.d(o, cx), e))
    -> {HX.journal(HX.Core.fx(o, HX.Cx.c(o, HX.emit(o, cx, e, k, kq, kv)))) == HM.snoc(HM.Ev, HX.journal(HX.Core.fx(o, HX.Cx.c(o, cx))), e) : List<&2, HM.Ev>}:
  match cx:
    case HX.Cx{c, r}:
      match c:
        case HX.Core{d, fx, p, f, q, v}:
          Equal.sym(List<&2, HM.Ev>, HM.snoc(HM.Ev, HX.journal(fx), e), HX.journal(HM.snoc(HX.Fx, fx, HX.FJ{e})), HX.journal_snoc_ev(fx, e))

def hub_spent_journal(-o: HM.St, +sp: Bool, +cx: HX.Cx<o>, +id: Nat, +at: Nat)
    -> {HX.journal(HX.Core.fx(o, HX.Cx.c(o, HC.timer_spent(o, sp, cx, id, at)))) == HI.fire_spent(sp, HX.journal(HX.Core.fx(o, HX.Cx.c(o, cx))), id, at) : List<&2, HM.Ev>}:
  match sp:
    case True{}:
      hub_fx_emit(o, cx, HM.ETimerStop{id, "it ran its times", at}, Unit{}, Unit{}, Unit{})
    case False{}:
      {==}

def hub_count_journal(-o: HM.St, +due: Bool, +cx: HX.Cx<o>, +t: HTM.Timer, +next: Nat)
    -> {HX.journal(HX.Core.fx(o, HX.Cx.c(o, HC.timer_count(o, due, cx, t, next)))) == HI.fire_count(due, HX.journal(HX.Core.fx(o, HX.Cx.c(o, cx))), t, next, HC.now(o, cx)) : List<&2, HM.Ev>}:
  match due:
    case False{}:
      hub_fx_emit(o, cx, HM.ETimerRun{HTM.Timer.id(t), HC.now(o, cx)}, Unit{}, Unit{}, Unit{})
    case True{}:
      +ev = {HM.ETimerFired{HTM.Timer.id(t), 1n+HTM.Timer.fired(t), next, HC.now(o, cx), False{}} : HM.Ev}
      +cx2 = HC.emit(o, cx, ev, Unit{}, Unit{}, Unit{})
      Equal.trans(List<&2, HM.Ev>,
        HX.journal(HX.Core.fx(o, HX.Cx.c(o, HC.timer_spent(o, HTM.spent(t), cx2, HTM.Timer.id(t), HC.now(o, cx))))),
        HI.fire_spent(HTM.spent(t), HX.journal(HX.Core.fx(o, HX.Cx.c(o, cx2))), HTM.Timer.id(t), HC.now(o, cx)),
        HI.fire_spent(HTM.spent(t), HM.snoc(HM.Ev, HX.journal(HX.Core.fx(o, HX.Cx.c(o, cx))), ev), HTM.Timer.id(t), HC.now(o, cx)),
        hub_spent_journal(o, HTM.spent(t), cx2, HTM.Timer.id(t), HC.now(o, cx)),
        Equal.cong(List<&2, HM.Ev>, List<&2, HM.Ev>, xs => HI.fire_spent(HTM.spent(t), xs, HTM.Timer.id(t), HC.now(o, cx)),
          HX.journal(HX.Core.fx(o, HX.Cx.c(o, cx2))), HM.snoc(HM.Ev, HX.journal(HX.Core.fx(o, HX.Cx.c(o, cx))), ev),
          hub_fx_emit(o, cx, ev, Unit{}, Unit{}, Unit{})))

def hub_retry_journal(-o: HM.St, +due: Bool, +cx: HX.Cx<o>, +t: HTM.Timer)
    -> {HX.journal(HX.Core.fx(o, HX.Cx.c(o, HC.timer_retry(o, due, cx, t)))) == HI.fire_retry(due, HX.journal(HX.Core.fx(o, HX.Cx.c(o, cx))), t, HC.now(o, cx)) : List<&2, HM.Ev>}:
  match due:
    case False{}:
      {==}
    case True{}:
      hub_fx_emit(o, cx, HM.ETimerFired{HTM.Timer.id(t), HTM.Timer.fired(t), Nat.add(HC.now(o, cx), HTM.MIN_MS()), HTM.Timer.last(t), True{}},
        Unit{}, Unit{}, Unit{})

# a < b is not b <= a
def hub_lt_not_le(+a: Nat, +b: Nat) -> {Nat.is_lt(a, b) == Bool.not(Nat.is_le(b, a)) : Bool}:
  match a b:
    case 0n 0n:
      {==}
    case 0n 1n+bp:
      {==}
    case 1n+ap 0n:
      {==}
    case 1n+ap 1n+bp:
      hub_lt_not_le(ap, bp)

# ---- stop_leaves_no_timer: a drop's stops leave no timer of the agent ----

def hub_keep_nil(+xs: List<&2, HTM.Timer>) -> {HTM.keep_out(xs, Nil{}) == xs : List<&2, HTM.Timer>}:
  match xs:
    case Nil{}:
      {==}
    case Con{h, t}:
      Equal.cong(List<&2, HTM.Timer>, List<&2, HTM.Timer>, ys => h <> ys, HTM.keep_out(t, Nil{}), t, hub_keep_nil(t))

def hub_keep_drop.pick(c: Bool, +h: HTM.Timer, +t: List<&2, HTM.Timer>, +id: Nat, +rest: List<&2, Nat>,
    +e: {Nat.is_eq(HTM.Timer.id(h), id) == c : Bool},
    ih: {HTM.keep_out(HTM.drop(t, id), rest) == HTM.keep_out(t, id <> rest) : List<&2, HTM.Timer>})
    -> {HTM.keep_out(Bool.pick(List<&2, HTM.Timer>, Nat.is_eq(HTM.Timer.id(h), id), HTM.drop(t, id), h <> HTM.drop(t, id)), rest)
        == Bool.pick(List<&2, HTM.Timer>, Nat.is_eq(HTM.Timer.id(h), id) || HTM.nat_in(rest, HTM.Timer.id(h)), HTM.keep_out(t, id <> rest), h <> HTM.keep_out(t, id <> rest)) : List<&2, HTM.Timer>}:
  match c:
    case True{}:
      %Equal.sym(Bool, Nat.is_eq(HTM.Timer.id(h), id), True{}, e) : {HTM.keep_out(Bool.pick(List<&2, HTM.Timer>, _, HTM.drop(t, id), h <> HTM.drop(t, id)), rest)
        == Bool.pick(List<&2, HTM.Timer>, _ || HTM.nat_in(rest, HTM.Timer.id(h)), HTM.keep_out(t, id <> rest), h <> HTM.keep_out(t, id <> rest)) : List<&2, HTM.Timer>}
      ih
    case False{}:
      %Equal.sym(Bool, Nat.is_eq(HTM.Timer.id(h), id), False{}, e) : {HTM.keep_out(Bool.pick(List<&2, HTM.Timer>, _, HTM.drop(t, id), h <> HTM.drop(t, id)), rest)
        == Bool.pick(List<&2, HTM.Timer>, _ || HTM.nat_in(rest, HTM.Timer.id(h)), HTM.keep_out(t, id <> rest), h <> HTM.keep_out(t, id <> rest)) : List<&2, HTM.Timer>}
      Equal.cong(List<&2, HTM.Timer>, List<&2, HTM.Timer>, ys => Bool.pick(List<&2, HTM.Timer>, HTM.nat_in(rest, HTM.Timer.id(h)), ys, h <> ys),
        HTM.keep_out(HTM.drop(t, id), rest), HTM.keep_out(t, id <> rest), ih)

# dropping one id, then the others: the timers of none of them
def hub_keep_drop(+xs: List<&2, HTM.Timer>, +id: Nat, +rest: List<&2, Nat>)
    -> {HTM.keep_out(HTM.drop(xs, id), rest) == HTM.keep_out(xs, id <> rest) : List<&2, HTM.Timer>}:
  match xs:
    case Nil{}:
      {==}
    case Con{h, t}:
      hub_keep_drop.pick(Nat.is_eq(HTM.Timer.id(h), id), h, t, id, rest, {==}, hub_keep_drop(t, id, rest))

def hub_live_tstop(s: HM.St, +id: Nat, +why: String, +at: Nat)
    -> {HTM.Tms.live(HM.St.tm(HM.apply(s, HM.ETimerStop{id, why, at}))) == HTM.drop(HTM.Tms.live(HM.St.tm(s)), id) : List<&2, HTM.Timer>}:
  match s:
    case HM.St{ag, od, ms, ca, no, nm, nc, tm, xs, pz, ho}:
      match tm:
        case HTM.Tms{l, e, li, ac, na, wk}:
          {==}

# the live timers after a drop's stops: those of no stopped id
def hub_live_gone_each(-o: HM.St, +ids: List<&2, Nat>, +cx: HX.Cx<o>, +why: String)
    -> {HTM.Tms.live(HM.St.tm(HX.d(o, HC.timers_gone.each(o, ids, cx, why)))) == HTM.keep_out(HTM.Tms.live(HM.St.tm(HX.d(o, cx))), ids) : List<&2, HTM.Timer>}:
  match ids:
    case Nil{}:
      Equal.sym(List<&2, HTM.Timer>, HTM.keep_out(HTM.Tms.live(HM.St.tm(HX.d(o, cx))), Nil{}), HTM.Tms.live(HM.St.tm(HX.d(o, cx))),
        hub_keep_nil(HTM.Tms.live(HM.St.tm(HX.d(o, cx)))))
    case Con{id, rest}:
      +ev = {HM.ETimerStop{id, why, HC.now(o, cx)} : HM.Ev}
      +cx2 = HC.emit(o, cx, ev, Unit{}, Unit{}, Unit{})
      +l = HTM.Tms.live(HM.St.tm(HX.d(o, cx)))
      +l2 = HTM.Tms.live(HM.St.tm(HX.d(o, cx2)))
      +e2 = Equal.trans(List<&2, HTM.Timer>, l2, HTM.Tms.live(HM.St.tm(HM.apply(HX.d(o, cx), ev))), HTM.drop(l, id),
        Equal.cong(HM.St, List<&2, HTM.Timer>, s => HTM.Tms.live(HM.St.tm(s)), HX.d(o, cx2), HM.apply(HX.d(o, cx), ev), PL1.hub_d_emit(o, cx, ev, Unit{}, Unit{}, Unit{})),
        hub_live_tstop(HX.d(o, cx), id, why, HC.now(o, cx)))
      Equal.trans(List<&2, HTM.Timer>, HTM.Tms.live(HM.St.tm(HX.d(o, HC.timers_gone.each(o, rest, cx2, why)))), HTM.keep_out(l2, rest), HTM.keep_out(l, id <> rest),
        hub_live_gone_each(o, rest, cx2, why),
        Equal.trans(List<&2, HTM.Timer>, HTM.keep_out(l2, rest), HTM.keep_out(HTM.drop(l, id), rest), HTM.keep_out(l, id <> rest),
          Equal.cong(List<&2, HTM.Timer>, List<&2, HTM.Timer>, ys => HTM.keep_out(ys, rest), l2, HTM.drop(l, id), e2),
          hub_keep_drop(l, id, rest)))

def hub_and_true_l(+x: Bool, -y: Bool, e: {Bool.and(x, y) == True{} : Bool}) -> {x == True{} : Bool}:
  match x:
    case True{}:
      {==}
    case False{}:
      PL1.hub_absurd_eq(PL1.hub_ft_absurd(e), Bool, False{}, True{})

def hub_and_true_r(+x: Bool, -y: Bool, e: {Bool.and(x, y) == True{} : Bool}) -> {y == True{} : Bool}:
  match x:
    case True{}:
      e
    case False{}:
      PL1.hub_absurd_eq(PL1.hub_ft_absurd(e), Bool, y, True{})

def hub_or_true_and(+c: Bool) -> {Bool.and(Bool.or(c, True{}), True{}) == True{} : Bool}:
  match c:
    case True{}:
      {==}
    case False{}:
      {==}

# an id list stays inside a longer one
def hub_all_weak(+xs: List<&2, Nat>, +h: Nat, +l: List<&2, Nat>, +e: {HTM.all_in(xs, l) == True{} : Bool}) -> {HTM.all_in(xs, h <> l) == True{} : Bool}:
  match xs:
    case Nil{}:
      {==}
    case Con{x, r}:
      +e1 = hub_and_true_l(HTM.nat_in(l, x), HTM.all_in(r, l), e)
      +ih = hub_all_weak(r, h, l, hub_and_true_r(HTM.nat_in(l, x), HTM.all_in(r, l), e))
      %Equal.sym(Bool, HTM.nat_in(l, x), True{}, e1) : {Bool.and(Bool.or(Nat.is_eq(x, h), _), HTM.all_in(r, h <> l)) == True{} : Bool}
      %Equal.sym(Bool, HTM.all_in(r, h <> l), True{}, ih) : {Bool.and(Bool.or(Nat.is_eq(x, h), True{}), _) == True{} : Bool}
      hub_or_true_and(Nat.is_eq(x, h))

def hub_all_self(+xs: List<&2, Nat>) -> {HTM.all_in(xs, xs) == True{} : Bool}:
  match xs:
    case Nil{}:
      {==}
    case Con{h, t}:
      %Equal.sym(Bool, Nat.is_eq(h, h), True{}, PL1.hub_eq_refl(h)) : {Bool.and(Bool.or(_, HTM.nat_in(t, h)), HTM.all_in(t, h <> t)) == True{} : Bool}
      hub_all_weak(t, h, t, hub_all_self(t))

# the ids of the agent's timers in the list's tail are in `l` too
def hub_all_tail(a: Bool, +h: HTM.Timer, +t: List<&2, HTM.Timer>, +ns: List<&2, String>, +l: List<&2, Nat>,
    +ea: {HTM.str_in(ns, HTM.Timer.agent(h)) == a : Bool}, +hall: {HTM.all_in(HTM.ids_in(h <> t, ns), l) == True{} : Bool})
    -> {HTM.all_in(HTM.ids_in(t, ns), l) == True{} : Bool}:
  match a:
    case True{}:
      +e2 = Equal.cong(Bool, Bool, c => HTM.all_in(Bool.pick(List<&2, Nat>, c, HTM.Timer.id(h) <> HTM.ids_in(t, ns), HTM.ids_in(t, ns)), l),
        HTM.str_in(ns, HTM.Timer.agent(h)), True{}, ea)
      hub_and_true_r(HTM.nat_in(l, HTM.Timer.id(h)), HTM.all_in(HTM.ids_in(t, ns), l),
        Equal.trans(Bool, HTM.all_in(HTM.Timer.id(h) <> HTM.ids_in(t, ns), l), HTM.all_in(HTM.ids_in(h <> t, ns), l), True{},
          Equal.sym(Bool, HTM.all_in(HTM.ids_in(h <> t, ns), l), HTM.all_in(HTM.Timer.id(h) <> HTM.ids_in(t, ns), l), e2), hall))
    case False{}:
      +e2 = Equal.cong(Bool, Bool, c => HTM.all_in(Bool.pick(List<&2, Nat>, c, HTM.Timer.id(h) <> HTM.ids_in(t, ns), HTM.ids_in(t, ns)), l),
        HTM.str_in(ns, HTM.Timer.agent(h)), False{}, ea)
      Equal.trans(Bool, HTM.all_in(HTM.ids_in(t, ns), l), HTM.all_in(HTM.ids_in(h <> t, ns), l), True{},
        Equal.sym(Bool, HTM.all_in(HTM.ids_in(h <> t, ns), l), HTM.all_in(HTM.ids_in(t, ns), l), e2), hall)

# a timer kept out of nothing (its id is in no stop) is not the agent's
def hub_str_out(a: Bool, +h: HTM.Timer, +t: List<&2, HTM.Timer>, +ns: List<&2, String>, +l: List<&2, Nat>,
    +ea: {HTM.str_in(ns, HTM.Timer.agent(h)) == a : Bool}, +eb: {HTM.nat_in(l, HTM.Timer.id(h)) == False{} : Bool},
    +hall: {HTM.all_in(HTM.ids_in(h <> t, ns), l) == True{} : Bool})
    -> {HTM.str_in(ns, HTM.Timer.agent(h)) == False{} : Bool}:
  match a:
    case False{}:
      ea
    case True{}:
      +e2 = Equal.cong(Bool, Bool, c => HTM.all_in(Bool.pick(List<&2, Nat>, c, HTM.Timer.id(h) <> HTM.ids_in(t, ns), HTM.ids_in(t, ns)), l),
        HTM.str_in(ns, HTM.Timer.agent(h)), True{}, ea)
      +hin = hub_and_true_l(HTM.nat_in(l, HTM.Timer.id(h)), HTM.all_in(HTM.ids_in(t, ns), l),
        Equal.trans(Bool, HTM.all_in(HTM.Timer.id(h) <> HTM.ids_in(t, ns), l), HTM.all_in(HTM.ids_in(h <> t, ns), l), True{},
          Equal.sym(Bool, HTM.all_in(HTM.ids_in(h <> t, ns), l), HTM.all_in(HTM.Timer.id(h) <> HTM.ids_in(t, ns), l), e2), hall))
      PL1.hub_absurd_eq(PL1.hub_ft_absurd(Equal.trans(Bool, False{}, HTM.nat_in(l, HTM.Timer.id(h)), True{},
        Equal.sym(Bool, HTM.nat_in(l, HTM.Timer.id(h)), False{}, eb), hin)), Bool, HTM.str_in(ns, HTM.Timer.agent(h)), False{})

def hub_neq_of(c: Bool, +a: String, +n: String, +ns: List<&2, String>, +ec: {String.eq(a, n) == c : Bool},
    ha: {HTM.str_in(ns, a) == False{} : Bool}, hn: {HTM.str_in(ns, n) == True{} : Bool}) -> {String.eq(a, n) == False{} : Bool}:
  match c:
    case False{}:
      ec
    case True{}:
      +s = PL2.hub_str_eq_sound(a, n, ec)
      +e3 = Equal.cong(String, Bool, x => HTM.str_in(ns, x), a, n, s)
      PL1.hub_absurd_eq(PL1.hub_ft_absurd(Equal.trans(Bool, False{}, HTM.str_in(ns, a), True{},
        Equal.sym(Bool, HTM.str_in(ns, a), False{}, ha), Equal.trans(Bool, HTM.str_in(ns, a), HTM.str_in(ns, n), True{}, e3, hn))), Bool, String.eq(a, n), False{})

def hub_none_keep.pick(b: Bool, +h: HTM.Timer, +t: List<&2, HTM.Timer>, +l: List<&2, Nat>, +ns: List<&2, String>, +n: String,
    +eb: {HTM.nat_in(l, HTM.Timer.id(h)) == b : Bool}, +hall: {HTM.all_in(HTM.ids_in(h <> t, ns), l) == True{} : Bool},
    +hn: {HTM.str_in(ns, n) == True{} : Bool}, ih: HI.TimerNoneOf(HTM.keep_out(t, l), n))
    -> HI.TimerNoneOf(Bool.pick(List<&2, HTM.Timer>, HTM.nat_in(l, HTM.Timer.id(h)), HTM.keep_out(t, l), h <> HTM.keep_out(t, l)), n):
  match b:
    case True{}:
      %Equal.sym(Bool, HTM.nat_in(l, HTM.Timer.id(h)), True{}, eb) : HI.TimerNoneOf(Bool.pick(List<&2, HTM.Timer>, _, HTM.keep_out(t, l), h <> HTM.keep_out(t, l)), n)
      ih
    case False{}:
      +ha = hub_str_out(HTM.str_in(ns, HTM.Timer.agent(h)), h, t, ns, l, {==}, eb, hall)
      %Equal.sym(Bool, HTM.nat_in(l, HTM.Timer.id(h)), False{}, eb) : HI.TimerNoneOf(Bool.pick(List<&2, HTM.Timer>, _, HTM.keep_out(t, l), h <> HTM.keep_out(t, l)), n)
      HX.Both{hub_neq_of(String.eq(HTM.Timer.agent(h), n), HTM.Timer.agent(h), n, ns, {==}, ha, hn), ih}

# keeping out every id of the agent's timers (and maybe more) leaves none
def hub_none_keep(+xs: List<&2, HTM.Timer>, +l: List<&2, Nat>, +ns: List<&2, String>, +n: String,
    +hall: {HTM.all_in(HTM.ids_in(xs, ns), l) == True{} : Bool}, +hn: {HTM.str_in(ns, n) == True{} : Bool})
    -> HI.TimerNoneOf(HTM.keep_out(xs, l), n):
  match xs:
    case Nil{}:
      Unit{}
    case Con{h, t}:
      +ht = hub_all_tail(HTM.str_in(ns, HTM.Timer.agent(h)), h, t, ns, l, {==}, hall)
      hub_none_keep.pick(HTM.nat_in(l, HTM.Timer.id(h)), h, t, l, ns, n, {==}, hall, hn, hub_none_keep(t, l, ns, n, ht, hn))

def hub_str_in_head(+n: String, +r: List<&2, String>) -> {HTM.str_in(n <> r, n) == True{} : Bool}:
  %Equal.sym(Bool, String.eq(n, n), True{}, PL2.hub_str_eq_refl(n)) : {Bool.or(_, HTM.str_in(r, n)) == True{} : Bool}
  {==}

def hub_tnone_tr(-x: List<&2, HTM.Timer>, -y: List<&2, HTM.Timer>, -n: String, e: {x == y : List<&2, HTM.Timer>},
    l: HI.TimerNoneOf(y, n)) -> HI.TimerNoneOf(x, n):
  %Equal.sym(List<&2, HTM.Timer>, x, y, e) : HI.TimerNoneOf(_, n)
  l

# a watch's line leaves the timers as they were
def hub_live_wake(s: HM.St, +e: HWK.WkEv)
    -> {HTM.Tms.live(HM.St.tm(HM.apply(s, HM.EWake{e}))) == HTM.Tms.live(HM.St.tm(s)) : List<&2, HTM.Timer>}:
  match s:
    case HM.St{ag, od, ms, ca, no, nm, nc, tm, xs, pz, ho}:
      match tm:
        case HTM.Tms{l, en, li, ac, na, wk}:
          {==}

# a drop's watch ends leave the timers as they were
def hub_live_wakes_each(-o: HM.St, +ids: List<&2, Nat>, +cx: HX.Cx<o>)
    -> {HTM.Tms.live(HM.St.tm(HX.d(o, HC.wakes_gone.each(o, ids, cx)))) == HTM.Tms.live(HM.St.tm(HX.d(o, cx))) : List<&2, HTM.Timer>}:
  match ids:
    case Nil{}:
      {==}
    case Con{id, rest}:
      +ev = {HM.EWake{HWK.WEnd{id, "gone", HC.now(o, cx)}} : HM.Ev}
      +cx2 = HC.emit(o, cx, ev, Unit{}, Unit{}, Unit{})
      +e2 = Equal.trans(List<&2, HTM.Timer>, HTM.Tms.live(HM.St.tm(HX.d(o, cx2))), HTM.Tms.live(HM.St.tm(HM.apply(HX.d(o, cx), ev))), HTM.Tms.live(HM.St.tm(HX.d(o, cx))),
        Equal.cong(HM.St, List<&2, HTM.Timer>, s => HTM.Tms.live(HM.St.tm(s)), HX.d(o, cx2), HM.apply(HX.d(o, cx), ev), PL1.hub_d_emit(o, cx, ev, Unit{}, Unit{}, Unit{})),
        hub_live_wake(HX.d(o, cx), HWK.WEnd{id, "gone", HC.now(o, cx)}))
      Equal.trans(List<&2, HTM.Timer>, HTM.Tms.live(HM.St.tm(HX.d(o, HC.wakes_gone.each(o, rest, cx2)))), HTM.Tms.live(HM.St.tm(HX.d(o, cx2))), HTM.Tms.live(HM.St.tm(HX.d(o, cx))),
        hub_live_wakes_each(o, rest, cx2), e2)

# ---- the watches of `sb wake` (event-wake, hub/wakes.bend) ----

def hub_wk_gone.go(c: Bool, +h: HWK.Watch, +t: List<&2, HWK.Watch>, +id: Nat, +e: {Nat.is_eq(HWK.Watch.id(h), id) == c : Bool},
    ih: {HWK.find(HWK.drop(t, id), id) == None{} : Maybe<&2, HWK.Watch>})
    -> {HWK.find(HWK.drop(h <> t, id), id) == None{} : Maybe<&2, HWK.Watch>}:
  match c:
    case True{}:
      %Equal.sym(Bool, Nat.is_eq(HWK.Watch.id(h), id), True{}, e) : {HWK.find(Bool.pick(List<&2, HWK.Watch>, _, HWK.drop(t, id), h <> HWK.drop(t, id)), id) == None{} : Maybe<&2, HWK.Watch>}
      ih
    case False{}:
      %Equal.sym(Bool, Nat.is_eq(HWK.Watch.id(h), id), False{}, e) : {HWK.find(Bool.pick(List<&2, HWK.Watch>, _, HWK.drop(t, id), h <> HWK.drop(t, id)), id) == None{} : Maybe<&2, HWK.Watch>}
      %Equal.sym(Bool, Nat.is_eq(HWK.Watch.id(h), id), False{}, e) : {Bool.pick(Maybe<&2, HWK.Watch>, _, Some{h}, HWK.find(HWK.drop(t, id), id)) == None{} : Maybe<&2, HWK.Watch>}
      ih

# dropping an id leaves no watch of it
def hub_wk_gone(+xs: List<&2, HWK.Watch>, +id: Nat) -> {HWK.find(HWK.drop(xs, id), id) == None{} : Maybe<&2, HWK.Watch>}:
  match xs:
    case Nil{}:
      {==}
    case Con{h, t}:
      hub_wk_gone.go(Nat.is_eq(HWK.Watch.id(h), id), h, t, id, {==}, hub_wk_gone(t, id))

# a watch kept in the due list is not the dropped id (its id differs)
def hub_wk_due.keep(d: Bool, +h: HWK.Watch, +r: List<&2, HWK.Watch>, +id: Nat, +now: Nat,
    +ed: {HWK.is_due(h, now) == d : Bool}, +ei: {Nat.is_eq(HWK.Watch.id(h), id) == False{} : Bool},
    ih: {HWK.find(HWK.due(r, now), id) == None{} : Maybe<&2, HWK.Watch>})
    -> {HWK.find(HWK.due(h <> r, now), id) == None{} : Maybe<&2, HWK.Watch>}:
  match d:
    case True{}:
      %Equal.sym(Bool, HWK.is_due(h, now), True{}, ed) : {HWK.find(Bool.pick(List<&2, HWK.Watch>, _, h <> HWK.due(r, now), HWK.due(r, now)), id) == None{} : Maybe<&2, HWK.Watch>}
      %Equal.sym(Bool, Nat.is_eq(HWK.Watch.id(h), id), False{}, ei) : {Bool.pick(Maybe<&2, HWK.Watch>, _, Some{h}, HWK.find(HWK.due(r, now), id)) == None{} : Maybe<&2, HWK.Watch>}
      ih
    case False{}:
      %Equal.sym(Bool, HWK.is_due(h, now), False{}, ed) : {HWK.find(Bool.pick(List<&2, HWK.Watch>, _, h <> HWK.due(r, now), HWK.due(r, now)), id) == None{} : Maybe<&2, HWK.Watch>}
      ih

def hub_wk_due.go(c: Bool, +h: HWK.Watch, +t: List<&2, HWK.Watch>, +id: Nat, +now: Nat,
    +e: {Nat.is_eq(HWK.Watch.id(h), id) == c : Bool},
    ih: {HWK.find(HWK.due(HWK.drop(t, id), now), id) == None{} : Maybe<&2, HWK.Watch>})
    -> {HWK.find(HWK.due(HWK.drop(h <> t, id), now), id) == None{} : Maybe<&2, HWK.Watch>}:
  match c:
    case True{}:
      %Equal.sym(Bool, Nat.is_eq(HWK.Watch.id(h), id), True{}, e) : {HWK.find(HWK.due(Bool.pick(List<&2, HWK.Watch>, _, HWK.drop(t, id), h <> HWK.drop(t, id)), now), id) == None{} : Maybe<&2, HWK.Watch>}
      ih
    case False{}:
      %Equal.sym(Bool, Nat.is_eq(HWK.Watch.id(h), id), False{}, e) : {HWK.find(HWK.due(Bool.pick(List<&2, HWK.Watch>, _, HWK.drop(t, id), h <> HWK.drop(t, id)), now), id) == None{} : Maybe<&2, HWK.Watch>}
      hub_wk_due.keep(HWK.is_due(h, now), h, HWK.drop(t, id), id, now, {==}, e, ih)

def hub_wk_keep_nil(+xs: List<&2, HWK.Watch>) -> {HWK.keep_out(xs, Nil{}) == xs : List<&2, HWK.Watch>}:
  match xs:
    case Nil{}:
      {==}
    case Con{h, t}:
      Equal.cong(List<&2, HWK.Watch>, List<&2, HWK.Watch>, ys => h <> ys, HWK.keep_out(t, Nil{}), t, hub_wk_keep_nil(t))

def hub_wk_keep_drop.pick(c: Bool, +h: HWK.Watch, +t: List<&2, HWK.Watch>, +id: Nat, +rest: List<&2, Nat>,
    +e: {Nat.is_eq(HWK.Watch.id(h), id) == c : Bool},
    ih: {HWK.keep_out(HWK.drop(t, id), rest) == HWK.keep_out(t, id <> rest) : List<&2, HWK.Watch>})
    -> {HWK.keep_out(Bool.pick(List<&2, HWK.Watch>, Nat.is_eq(HWK.Watch.id(h), id), HWK.drop(t, id), h <> HWK.drop(t, id)), rest)
        == Bool.pick(List<&2, HWK.Watch>, Nat.is_eq(HWK.Watch.id(h), id) || HWK.nat_in(rest, HWK.Watch.id(h)), HWK.keep_out(t, id <> rest), h <> HWK.keep_out(t, id <> rest)) : List<&2, HWK.Watch>}:
  match c:
    case True{}:
      %Equal.sym(Bool, Nat.is_eq(HWK.Watch.id(h), id), True{}, e) : {HWK.keep_out(Bool.pick(List<&2, HWK.Watch>, _, HWK.drop(t, id), h <> HWK.drop(t, id)), rest)
        == Bool.pick(List<&2, HWK.Watch>, _ || HWK.nat_in(rest, HWK.Watch.id(h)), HWK.keep_out(t, id <> rest), h <> HWK.keep_out(t, id <> rest)) : List<&2, HWK.Watch>}
      ih
    case False{}:
      %Equal.sym(Bool, Nat.is_eq(HWK.Watch.id(h), id), False{}, e) : {HWK.keep_out(Bool.pick(List<&2, HWK.Watch>, _, HWK.drop(t, id), h <> HWK.drop(t, id)), rest)
        == Bool.pick(List<&2, HWK.Watch>, _ || HWK.nat_in(rest, HWK.Watch.id(h)), HWK.keep_out(t, id <> rest), h <> HWK.keep_out(t, id <> rest)) : List<&2, HWK.Watch>}
      Equal.cong(List<&2, HWK.Watch>, List<&2, HWK.Watch>, ys => Bool.pick(List<&2, HWK.Watch>, HWK.nat_in(rest, HWK.Watch.id(h)), ys, h <> ys),
        HWK.keep_out(HWK.drop(t, id), rest), HWK.keep_out(t, id <> rest), ih)

def hub_wk_keep_drop(+xs: List<&2, HWK.Watch>, +id: Nat, +rest: List<&2, Nat>)
    -> {HWK.keep_out(HWK.drop(xs, id), rest) == HWK.keep_out(xs, id <> rest) : List<&2, HWK.Watch>}:
  match xs:
    case Nil{}:
      {==}
    case Con{h, t}:
      hub_wk_keep_drop.pick(Nat.is_eq(HWK.Watch.id(h), id), h, t, id, rest, {==}, hub_wk_keep_drop(t, id, rest))

def hub_wk_live_end(s: HM.St, +id: Nat, +why: String, +at: Nat)
    -> {HWK.Wakes.live(HTM.Tms.wk(HM.St.tm(HM.apply(s, HM.EWake{HWK.WEnd{id, why, at}})))) == HWK.drop(HWK.Wakes.live(HTM.Tms.wk(HM.St.tm(s))), id) : List<&2, HWK.Watch>}:
  match s:
    case HM.St{ag, od, ms, ca, no, nm, nc, tm, xs, pz, ho}:
      match tm:
        case HTM.Tms{l, en, li, ac, na, wk}:
          match wk:
            case HWK.Wakes{wl, we, wi}:
              {==}

# the live watches after a drop's ends: those of no ended id
def hub_wk_live_each(-o: HM.St, +ids: List<&2, Nat>, +cx: HX.Cx<o>)
    -> {HWK.Wakes.live(HC.wks(o, HC.wakes_gone.each(o, ids, cx))) == HWK.keep_out(HWK.Wakes.live(HC.wks(o, cx)), ids) : List<&2, HWK.Watch>}:
  match ids:
    case Nil{}:
      Equal.sym(List<&2, HWK.Watch>, HWK.keep_out(HWK.Wakes.live(HC.wks(o, cx)), Nil{}), HWK.Wakes.live(HC.wks(o, cx)),
        hub_wk_keep_nil(HWK.Wakes.live(HC.wks(o, cx))))
    case Con{id, rest}:
      +ev = {HM.EWake{HWK.WEnd{id, "gone", HC.now(o, cx)}} : HM.Ev}
      +cx2 = HC.emit(o, cx, ev, Unit{}, Unit{}, Unit{})
      +l = HWK.Wakes.live(HC.wks(o, cx))
      +l2 = HWK.Wakes.live(HC.wks(o, cx2))
      +e2 = Equal.trans(List<&2, HWK.Watch>, l2, HWK.Wakes.live(HTM.Tms.wk(HM.St.tm(HM.apply(HX.d(o, cx), ev)))), HWK.drop(l, id),
        Equal.cong(HM.St, List<&2, HWK.Watch>, s => HWK.Wakes.live(HTM.Tms.wk(HM.St.tm(s))), HX.d(o, cx2), HM.apply(HX.d(o, cx), ev), PL1.hub_d_emit(o, cx, ev, Unit{}, Unit{}, Unit{})),
        hub_wk_live_end(HX.d(o, cx), id, "gone", HC.now(o, cx)))
      Equal.trans(List<&2, HWK.Watch>, HWK.Wakes.live(HC.wks(o, HC.wakes_gone.each(o, rest, cx2))), HWK.keep_out(l2, rest), HWK.keep_out(l, id <> rest),
        hub_wk_live_each(o, rest, cx2),
        Equal.trans(List<&2, HWK.Watch>, HWK.keep_out(l2, rest), HWK.keep_out(HWK.drop(l, id), rest), HWK.keep_out(l, id <> rest),
          Equal.cong(List<&2, HWK.Watch>, List<&2, HWK.Watch>, ys => HWK.keep_out(ys, rest), l2, HWK.drop(l, id), e2),
          hub_wk_keep_drop(l, id, rest)))

def hub_wk_all_weak(+xs: List<&2, Nat>, +h: Nat, +l: List<&2, Nat>, +e: {HWK.all_in(xs, l) == True{} : Bool}) -> {HWK.all_in(xs, h <> l) == True{} : Bool}:
  match xs:
    case Nil{}:
      {==}
    case Con{x, r}:
      +e1 = hub_and_true_l(HWK.nat_in(l, x), HWK.all_in(r, l), e)
      +ih = hub_wk_all_weak(r, h, l, hub_and_true_r(HWK.nat_in(l, x), HWK.all_in(r, l), e))
      %Equal.sym(Bool, HWK.nat_in(l, x), True{}, e1) : {Bool.and(Bool.or(Nat.is_eq(x, h), _), HWK.all_in(r, h <> l)) == True{} : Bool}
      %Equal.sym(Bool, HWK.all_in(r, h <> l), True{}, ih) : {Bool.and(Bool.or(Nat.is_eq(x, h), True{}), _) == True{} : Bool}
      hub_or_true_and(Nat.is_eq(x, h))

def hub_wk_all_self(+xs: List<&2, Nat>) -> {HWK.all_in(xs, xs) == True{} : Bool}:
  match xs:
    case Nil{}:
      {==}
    case Con{h, t}:
      %Equal.sym(Bool, Nat.is_eq(h, h), True{}, PL1.hub_eq_refl(h)) : {Bool.and(Bool.or(_, HWK.nat_in(t, h)), HWK.all_in(t, h <> t)) == True{} : Bool}
      hub_wk_all_weak(t, h, t, hub_wk_all_self(t))

def hub_wk_all_tail(a: Bool, +h: HWK.Watch, +t: List<&2, HWK.Watch>, +ns: List<&2, String>, +l: List<&2, Nat>,
    +ea: {HWK.str_in(ns, HWK.Watch.agent(h)) == a : Bool}, +hall: {HWK.all_in(HWK.ids_of(h <> t, ns), l) == True{} : Bool})
    -> {HWK.all_in(HWK.ids_of(t, ns), l) == True{} : Bool}:
  match a:
    case True{}:
      +e2 = Equal.cong(Bool, Bool, c => HWK.all_in(Bool.pick(List<&2, Nat>, c, HWK.Watch.id(h) <> HWK.ids_of(t, ns), HWK.ids_of(t, ns)), l),
        HWK.str_in(ns, HWK.Watch.agent(h)), True{}, ea)
      hub_and_true_r(HWK.nat_in(l, HWK.Watch.id(h)), HWK.all_in(HWK.ids_of(t, ns), l),
        Equal.trans(Bool, HWK.all_in(HWK.Watch.id(h) <> HWK.ids_of(t, ns), l), HWK.all_in(HWK.ids_of(h <> t, ns), l), True{},
          Equal.sym(Bool, HWK.all_in(HWK.ids_of(h <> t, ns), l), HWK.all_in(HWK.Watch.id(h) <> HWK.ids_of(t, ns), l), e2), hall))
    case False{}:
      +e2 = Equal.cong(Bool, Bool, c => HWK.all_in(Bool.pick(List<&2, Nat>, c, HWK.Watch.id(h) <> HWK.ids_of(t, ns), HWK.ids_of(t, ns)), l),
        HWK.str_in(ns, HWK.Watch.agent(h)), False{}, ea)
      Equal.trans(Bool, HWK.all_in(HWK.ids_of(t, ns), l), HWK.all_in(HWK.ids_of(h <> t, ns), l), True{},
        Equal.sym(Bool, HWK.all_in(HWK.ids_of(h <> t, ns), l), HWK.all_in(HWK.ids_of(t, ns), l), e2), hall)

def hub_wk_str_out(a: Bool, +h: HWK.Watch, +t: List<&2, HWK.Watch>, +ns: List<&2, String>, +l: List<&2, Nat>,
    +ea: {HWK.str_in(ns, HWK.Watch.agent(h)) == a : Bool}, +eb: {HWK.nat_in(l, HWK.Watch.id(h)) == False{} : Bool},
    +hall: {HWK.all_in(HWK.ids_of(h <> t, ns), l) == True{} : Bool})
    -> {HWK.str_in(ns, HWK.Watch.agent(h)) == False{} : Bool}:
  match a:
    case False{}:
      ea
    case True{}:
      +e2 = Equal.cong(Bool, Bool, c => HWK.all_in(Bool.pick(List<&2, Nat>, c, HWK.Watch.id(h) <> HWK.ids_of(t, ns), HWK.ids_of(t, ns)), l),
        HWK.str_in(ns, HWK.Watch.agent(h)), True{}, ea)
      +hin = hub_and_true_l(HWK.nat_in(l, HWK.Watch.id(h)), HWK.all_in(HWK.ids_of(t, ns), l),
        Equal.trans(Bool, HWK.all_in(HWK.Watch.id(h) <> HWK.ids_of(t, ns), l), HWK.all_in(HWK.ids_of(h <> t, ns), l), True{},
          Equal.sym(Bool, HWK.all_in(HWK.ids_of(h <> t, ns), l), HWK.all_in(HWK.Watch.id(h) <> HWK.ids_of(t, ns), l), e2), hall))
      PL1.hub_absurd_eq(PL1.hub_ft_absurd(Equal.trans(Bool, False{}, HWK.nat_in(l, HWK.Watch.id(h)), True{},
        Equal.sym(Bool, HWK.nat_in(l, HWK.Watch.id(h)), False{}, eb), hin)), Bool, HWK.str_in(ns, HWK.Watch.agent(h)), False{})

def hub_wk_neq_of(c: Bool, +a: String, +n: String, +ns: List<&2, String>, +ec: {String.eq(a, n) == c : Bool},
    ha: {HWK.str_in(ns, a) == False{} : Bool}, hn: {HWK.str_in(ns, n) == True{} : Bool}) -> {String.eq(a, n) == False{} : Bool}:
  match c:
    case False{}:
      ec
    case True{}:
      +s = PL2.hub_str_eq_sound(a, n, ec)
      +e3 = Equal.cong(String, Bool, x => HWK.str_in(ns, x), a, n, s)
      PL1.hub_absurd_eq(PL1.hub_ft_absurd(Equal.trans(Bool, False{}, HWK.str_in(ns, a), True{},
        Equal.sym(Bool, HWK.str_in(ns, a), False{}, ha), Equal.trans(Bool, HWK.str_in(ns, a), HWK.str_in(ns, n), True{}, e3, hn))), Bool, String.eq(a, n), False{})

def hub_wk_none_keep.pick(b: Bool, +h: HWK.Watch, +t: List<&2, HWK.Watch>, +l: List<&2, Nat>, +ns: List<&2, String>, +n: String,
    +eb: {HWK.nat_in(l, HWK.Watch.id(h)) == b : Bool}, +hall: {HWK.all_in(HWK.ids_of(h <> t, ns), l) == True{} : Bool},
    +hn: {HWK.str_in(ns, n) == True{} : Bool}, ih: HI.WatchNoneOf(HWK.keep_out(t, l), n))
    -> HI.WatchNoneOf(Bool.pick(List<&2, HWK.Watch>, HWK.nat_in(l, HWK.Watch.id(h)), HWK.keep_out(t, l), h <> HWK.keep_out(t, l)), n):
  match b:
    case True{}:
      %Equal.sym(Bool, HWK.nat_in(l, HWK.Watch.id(h)), True{}, eb) : HI.WatchNoneOf(Bool.pick(List<&2, HWK.Watch>, _, HWK.keep_out(t, l), h <> HWK.keep_out(t, l)), n)
      ih
    case False{}:
      +ha = hub_wk_str_out(HWK.str_in(ns, HWK.Watch.agent(h)), h, t, ns, l, {==}, eb, hall)
      %Equal.sym(Bool, HWK.nat_in(l, HWK.Watch.id(h)), False{}, eb) : HI.WatchNoneOf(Bool.pick(List<&2, HWK.Watch>, _, HWK.keep_out(t, l), h <> HWK.keep_out(t, l)), n)
      HX.Both{hub_wk_neq_of(String.eq(HWK.Watch.agent(h), n), HWK.Watch.agent(h), n, ns, {==}, ha, hn), ih}

# keeping out every id of the agent's watches leaves none
def hub_wk_none_keep(+xs: List<&2, HWK.Watch>, +l: List<&2, Nat>, +ns: List<&2, String>, +n: String,
    +hall: {HWK.all_in(HWK.ids_of(xs, ns), l) == True{} : Bool}, +hn: {HWK.str_in(ns, n) == True{} : Bool})
    -> HI.WatchNoneOf(HWK.keep_out(xs, l), n):
  match xs:
    case Nil{}:
      Unit{}
    case Con{h, t}:
      +ht = hub_wk_all_tail(HWK.str_in(ns, HWK.Watch.agent(h)), h, t, ns, l, {==}, hall)
      hub_wk_none_keep.pick(HWK.nat_in(l, HWK.Watch.id(h)), h, t, l, ns, n, {==}, hall, hn, hub_wk_none_keep(t, l, ns, n, ht, hn))

def hub_wk_str_in_head(+n: String, +r: List<&2, String>) -> {HWK.str_in(n <> r, n) == True{} : Bool}:
  %Equal.sym(Bool, String.eq(n, n), True{}, PL2.hub_str_eq_refl(n)) : {Bool.or(_, HWK.str_in(r, n)) == True{} : Bool}
  {==}

def hub_wnone_tr(-x: List<&2, HWK.Watch>, -y: List<&2, HWK.Watch>, -n: String, e: {x == y : List<&2, HWK.Watch>},
    l: HI.WatchNoneOf(y, n)) -> HI.WatchNoneOf(x, n):
  %Equal.sym(List<&2, HWK.Watch>, x, y, e) : HI.WatchNoneOf(_, n)
  l

# the settled head is not open
def hub_x_settled.head(+h: HXH.Out, +t: List<&2, HXH.Out>, +xid: Nat, +e: {Nat.is_eq(HXH.Out.xid(h), xid) == True{} : Bool})
    -> {HXB.open.of(HXH.out_of(HXH.out_op(HXH.OpSettled{}, h) <> t, xid)) == None{} : Maybe<&2, HXH.Out>}:
  match h:
    case HXH.Out{xi, p, k, m, tx, s, n, cx, ps}:
      %Equal.sym(Bool, Nat.is_eq(xi, xid), True{}, e) : {HXB.open.of(Bool.pick(Maybe<&2, HXH.Out>, _, Some{HXH.Out{xi, p, k, m, tx, HXH.OSettled{}, n, cx, ps}}, HXH.out_of(t, xid))) == None{} : Maybe<&2, HXH.Out>}
      {==}

def hub_x_settled.go(c: Bool, +h: HXH.Out, +t: List<&2, HXH.Out>, +xid: Nat, +e: {Nat.is_eq(HXH.Out.xid(h), xid) == c : Bool},
    ih: {HXB.open.of(HXH.out_of(HXH.out_set(t, xid, HXH.OpSettled{}), xid)) == None{} : Maybe<&2, HXH.Out>})
    -> {HXB.open.of(HXH.out_of(HXH.out_set(h <> t, xid, HXH.OpSettled{}), xid)) == None{} : Maybe<&2, HXH.Out>}:
  match c:
    case True{}:
      %Equal.sym(Bool, Nat.is_eq(HXH.Out.xid(h), xid), True{}, e) : {HXB.open.of(HXH.out_of(Bool.pick(List<&2, HXH.Out>, _, HXH.out_op(HXH.OpSettled{}, h) <> t, h <> HXH.out_set(t, xid, HXH.OpSettled{})), xid)) == None{} : Maybe<&2, HXH.Out>}
      hub_x_settled.head(h, t, xid, e)
    case False{}:
      %Equal.sym(Bool, Nat.is_eq(HXH.Out.xid(h), xid), False{}, e) : {HXB.open.of(HXH.out_of(Bool.pick(List<&2, HXH.Out>, _, HXH.out_op(HXH.OpSettled{}, h) <> t, h <> HXH.out_set(t, xid, HXH.OpSettled{})), xid)) == None{} : Maybe<&2, HXH.Out>}
      %Equal.sym(Bool, Nat.is_eq(HXH.Out.xid(h), xid), False{}, e) : {HXB.open.of(Bool.pick(Maybe<&2, HXH.Out>, _, Some{h}, HXH.out_of(HXH.out_set(t, xid, HXH.OpSettled{}), xid))) == None{} : Maybe<&2, HXH.Out>}
      ih

# after a settle of `xid`, no entry of it is open
def hub_x_settled(+xs: List<&2, HXH.Out>, +xid: Nat) -> {HXB.open.of(HXH.out_of(HXH.out_set(xs, xid, HXH.OpSettled{}), xid)) == None{} : Maybe<&2, HXH.Out>}:
  match xs:
    case Nil{}:
      {==}
    case Con{h, t}:
      hub_x_settled.go(Nat.is_eq(HXH.Out.xid(h), xid), h, t, xid, {==}, hub_x_settled(t, xid))

def hub_x_seen.go(c: Bool, +h: HXH.XIn, +t: List<&2, HXH.XIn>, +i: HXH.XIn,
    +e: {Bool.and(String.eq(HXH.XIn.hub(h), HXH.XIn.hub(i)), Nat.is_eq(HXH.XIn.xid(h), HXH.XIn.xid(i))) == c : Bool},
    ih: {HXB.seen.of(HXH.xin_of(List.append(&2, HXH.XIn, t, [i]), HXH.XIn.hub(i), HXH.XIn.xid(i))) == True{} : Bool})
    -> {HXB.seen.of(HXH.xin_of(List.append(&2, HXH.XIn, h <> t, [i]), HXH.XIn.hub(i), HXH.XIn.xid(i))) == True{} : Bool}:
  match c:
    case True{}:
      %Equal.sym(Bool, Bool.and(String.eq(HXH.XIn.hub(h), HXH.XIn.hub(i)), Nat.is_eq(HXH.XIn.xid(h), HXH.XIn.xid(i))), True{}, e) : {HXB.seen.of(Bool.pick(Maybe<&2, HXH.XIn>, _, Some{h}, HXH.xin_of(List.append(&2, HXH.XIn, t, [i]), HXH.XIn.hub(i), HXH.XIn.xid(i)))) == True{} : Bool}
      {==}
    case False{}:
      %Equal.sym(Bool, Bool.and(String.eq(HXH.XIn.hub(h), HXH.XIn.hub(i)), Nat.is_eq(HXH.XIn.xid(h), HXH.XIn.xid(i))), False{}, e) : {HXB.seen.of(Bool.pick(Maybe<&2, HXH.XIn>, _, Some{h}, HXH.xin_of(List.append(&2, HXH.XIn, t, [i]), HXH.XIn.hub(i), HXH.XIn.xid(i)))) == True{} : Bool}
      ih

# a record added last is found by its origin
def hub_x_seen(+xs: List<&2, HXH.XIn>, +i: HXH.XIn) -> {HXB.seen.of(HXH.xin_of(List.append(&2, HXH.XIn, xs, [i]), HXH.XIn.hub(i), HXH.XIn.xid(i))) == True{} : Bool}:
  match xs:
    case Nil{}:
      %Equal.sym(Bool, String.eq(HXH.XIn.hub(i), HXH.XIn.hub(i)), True{}, PL2.hub_str_eq_refl(HXH.XIn.hub(i))) : {HXB.seen.of(Bool.pick(Maybe<&2, HXH.XIn>, Bool.and(_, Nat.is_eq(HXH.XIn.xid(i), HXH.XIn.xid(i))), Some{i}, None{})) == True{} : Bool}
      %Equal.sym(Bool, Nat.is_eq(HXH.XIn.xid(i), HXH.XIn.xid(i)), True{}, PL1.hub_eq_refl(HXH.XIn.xid(i))) : {HXB.seen.of(Bool.pick(Maybe<&2, HXH.XIn>, _, Some{i}, None{})) == True{} : Bool}
      {==}
    case Con{h, t}:
      hub_x_seen.go(Bool.and(String.eq(HXH.XIn.hub(h), HXH.XIn.hub(i)), Nat.is_eq(HXH.XIn.xid(h), HXH.XIn.xid(i))), h, t, i, {==}, hub_x_seen(t, i))

# the latest unclear due with `d` folded in is no earlier than `d`
def hub_unclear_max_ge(+d: Nat, m: Maybe<&2, Nat>) -> {Nat.is_ge(Maybe.default(&2, Nat, HXB.unclear_due.max(d, m), 0n), d) == True{} : Bool}:
  match m:
    case None{}:
      Nat.ge_refl(d)
    case Some{e}:
      Nat.max_ge_l(d, e)

def hub_act_gone.go(c: Bool, +h: HTM.Act, +t: List<&2, HTM.Act>, +id: Nat, +e: {Nat.is_eq(HTM.Act.id(h), id) == c : Bool},
    ih: {HTM.act_find(HTM.act_drop(t, id), id) == None{} : Maybe<&2, HTM.Act>})
    -> {HTM.act_find(HTM.act_drop(h <> t, id), id) == None{} : Maybe<&2, HTM.Act>}:
  match c:
    case True{}:
      %Equal.sym(Bool, Nat.is_eq(HTM.Act.id(h), id), True{}, e) : {HTM.act_find(Bool.pick(List<&2, HTM.Act>, _, HTM.act_drop(t, id), h <> HTM.act_drop(t, id)), id) == None{} : Maybe<&2, HTM.Act>}
      ih
    case False{}:
      %Equal.sym(Bool, Nat.is_eq(HTM.Act.id(h), id), False{}, e) : {HTM.act_find(Bool.pick(List<&2, HTM.Act>, _, HTM.act_drop(t, id), h <> HTM.act_drop(t, id)), id) == None{} : Maybe<&2, HTM.Act>}
      %Equal.sym(Bool, Nat.is_eq(HTM.Act.id(h), id), False{}, e) : {Bool.pick(Maybe<&2, HTM.Act>, _, Some{h}, HTM.act_find(HTM.act_drop(t, id), id)) == None{} : Maybe<&2, HTM.Act>}
      ih

# dropping an id leaves no act of it
def hub_act_gone(+xs: List<&2, HTM.Act>, +id: Nat) -> {HTM.act_find(HTM.act_drop(xs, id), id) == None{} : Maybe<&2, HTM.Act>}:
  match xs:
    case Nil{}:
      {==}
    case Con{h, t}:
      hub_act_gone.go(Nat.is_eq(HTM.Act.id(h), id), h, t, id, {==}, hub_act_gone(t, id))

# ---- the hot messages (issue 21): St.hot, the walks' index ----

# a cold message is not queued
def hub_or_false_l(+x: Bool, -y: Bool, e: {Bool.or(x, y) == False{} : Bool}) -> {x == False{} : Bool}:
  match x:
    case False{}:
      {==}
    case True{}:
      PL1.hub_absurd_eq(PL1.hub_ft_absurd(Equal.sym(Bool, True{}, False{}, e)), Bool, True{}, False{})

def hub_and_false(+x: Bool) -> {Bool.and(x, False{}) == False{} : Bool}:
  match x:
    case False{}:
      {==}
    case True{}:
      {==}

# queued_in over every message == over the hot ones
def hub_qi_hot.pick(c: Bool, +r: HM.MRec, +t: List<&2, HM.MRec>, +ns: List<&2, String>, +e: {HM.MRec.is_hot(r) == c : Bool},
    ih: {HM.queued_in(t, ns) == HM.queued_in(HM.hot_of(t), ns) : List<&2, HM.Msg>})
    -> {HM.queued_in(r <> t, ns) == HM.queued_in(Bool.pick(List<&2, HM.MRec>, HM.MRec.is_hot(r), r <> HM.hot_of(t), HM.hot_of(t)), ns) : List<&2, HM.Msg>}:
  match c:
    case True{}:
      %Equal.sym(Bool, HM.MRec.is_hot(r), True{}, e) : {HM.queued_in(r <> t, ns) == HM.queued_in(Bool.pick(List<&2, HM.MRec>, _, r <> HM.hot_of(t), HM.hot_of(t)), ns) : List<&2, HM.Msg>}
      Equal.cong(List<&2, HM.Msg>, List<&2, HM.Msg>,
        x => Bool.pick(List<&2, HM.Msg>, Bool.and(HM.str_in(ns, HM.Msg.to(HM.MRec.msg(r))), HM.is_queued(HM.MRec.st(r))), HM.MRec.msg(r) <> x, x),
        HM.queued_in(t, ns), HM.queued_in(HM.hot_of(t), ns), ih)
    case False{}:
      %Equal.sym(Bool, HM.MRec.is_hot(r), False{}, e) : {HM.queued_in(r <> t, ns) == HM.queued_in(Bool.pick(List<&2, HM.MRec>, _, r <> HM.hot_of(t), HM.hot_of(t)), ns) : List<&2, HM.Msg>}
      %Equal.sym(Bool, HM.is_queued(HM.MRec.st(r)), False{}, hub_or_false_l(HM.is_queued(HM.MRec.st(r)), HM.MRec.owes(r), e)) : {Bool.pick(List<&2, HM.Msg>, Bool.and(HM.str_in(ns, HM.Msg.to(HM.MRec.msg(r))), _), HM.MRec.msg(r) <> HM.queued_in(t, ns), HM.queued_in(t, ns)) == HM.queued_in(HM.hot_of(t), ns) : List<&2, HM.Msg>}
      %Equal.sym(Bool, Bool.and(HM.str_in(ns, HM.Msg.to(HM.MRec.msg(r))), False{}), False{}, hub_and_false(HM.str_in(ns, HM.Msg.to(HM.MRec.msg(r))))) : {Bool.pick(List<&2, HM.Msg>, _, HM.MRec.msg(r) <> HM.queued_in(t, ns), HM.queued_in(t, ns)) == HM.queued_in(HM.hot_of(t), ns) : List<&2, HM.Msg>}
      ih

def hub_qi_hot(+xs: List<&2, HM.MRec>, +ns: List<&2, String>) -> {HM.queued_in(xs, ns) == HM.queued_in(HM.hot_of(xs), ns) : List<&2, HM.Msg>}:
  match xs:
    case Nil{}:
      {==}
    case Con{r, t}:
      hub_qi_hot.pick(HM.MRec.is_hot(r), r, t, ns, {==}, hub_qi_hot(t, ns))

# the hot part of the hot part is the hot part
def hub_hot_idem.pick(c: Bool, +r: HM.MRec, +t: List<&2, HM.MRec>, +e: {HM.MRec.is_hot(r) == c : Bool},
    ih: {HM.hot_of(HM.hot_of(t)) == HM.hot_of(t) : List<&2, HM.MRec>})
    -> {HM.hot_of(Bool.pick(List<&2, HM.MRec>, HM.MRec.is_hot(r), r <> HM.hot_of(t), HM.hot_of(t))) == Bool.pick(List<&2, HM.MRec>, HM.MRec.is_hot(r), r <> HM.hot_of(t), HM.hot_of(t)) : List<&2, HM.MRec>}:
  match c:
    case True{}:
      %Equal.sym(Bool, HM.MRec.is_hot(r), True{}, e) : {HM.hot_of(Bool.pick(List<&2, HM.MRec>, _, r <> HM.hot_of(t), HM.hot_of(t))) == Bool.pick(List<&2, HM.MRec>, _, r <> HM.hot_of(t), HM.hot_of(t)) : List<&2, HM.MRec>}
      %Equal.sym(Bool, HM.MRec.is_hot(r), True{}, e) : {Bool.pick(List<&2, HM.MRec>, _, r <> HM.hot_of(HM.hot_of(t)), HM.hot_of(HM.hot_of(t))) == r <> HM.hot_of(t) : List<&2, HM.MRec>}
      Equal.cong(List<&2, HM.MRec>, List<&2, HM.MRec>, x => r <> x, HM.hot_of(HM.hot_of(t)), HM.hot_of(t), ih)
    case False{}:
      %Equal.sym(Bool, HM.MRec.is_hot(r), False{}, e) : {HM.hot_of(Bool.pick(List<&2, HM.MRec>, _, r <> HM.hot_of(t), HM.hot_of(t))) == Bool.pick(List<&2, HM.MRec>, _, r <> HM.hot_of(t), HM.hot_of(t)) : List<&2, HM.MRec>}
      ih

def hub_hot_idem(+xs: List<&2, HM.MRec>) -> {HM.hot_of(HM.hot_of(xs)) == HM.hot_of(xs) : List<&2, HM.MRec>}:
  match xs:
    case Nil{}:
      {==}
    case Con{r, t}:
      hub_hot_idem.pick(HM.MRec.is_hot(r), r, t, {==}, hub_hot_idem(t))

# a walk that reads the same over a list and its hot part reads the same
# over two lists with one hot part
def hub_via_hot(-A: Type, -f: List<&2, HM.MRec> -> A, -a: List<&2, HM.MRec>, -b: List<&2, HM.MRec>,
    wa: {f(a) == f(HM.hot_of(a)) : A}, wb: {f(b) == f(HM.hot_of(b)) : A}, h: {HM.hot_of(a) == HM.hot_of(b) : List<&2, HM.MRec>})
    -> {f(a) == f(b) : A}:
  Equal.trans(A, f(a), f(HM.hot_of(a)), f(b), wa,
    Equal.trans(A, f(HM.hot_of(a)), f(HM.hot_of(b)), f(b), Equal.cong(List<&2, HM.MRec>, A, f, HM.hot_of(a), HM.hot_of(b), h),
      Equal.sym(A, f(b), f(HM.hot_of(b)), wb)))

# a right index moves along an equality of states
def hub_hot_tr(-a: HM.St, -b: HM.St, e: {a == b : HM.St}, k: {HM.hot_of(HM.St.hot(b)) == HM.hot_of(HM.St.msgs(b)) : List<&2, HM.MRec>})
    -> {HM.hot_of(HM.St.hot(a)) == HM.hot_of(HM.St.msgs(a)) : List<&2, HM.MRec>}:
  %Equal.sym(HM.St, a, b, e) : {HM.hot_of(HM.St.hot(_)) == HM.hot_of(HM.St.msgs(_)) : List<&2, HM.MRec>}
  k

# a lifecycle event keeps a right index right (it touches no message)
def hub_hot_life(s: HM.St, +n: String, +l: HM.Life, +r: Maybe<&2, String>, k: {HM.hot_of(HM.St.hot(s)) == HM.hot_of(HM.St.msgs(s)) : List<&2, HM.MRec>})
    -> {HM.hot_of(HM.St.hot(HM.apply(s, HM.ELifecycle{n, l, r}))) == HM.hot_of(HM.St.msgs(HM.apply(s, HM.ELifecycle{n, l, r}))) : List<&2, HM.MRec>}:
  match s:
    case HM.St{ag, od, ms, ca, no, nm, nc, tm, xs, pz, ho}:
      k

# with a right index, queued_for reads every message
def hub_hot_qf(+s: HM.St, +n: String, h: {HM.hot_of(HM.St.hot(s)) == HM.hot_of(HM.St.msgs(s)) : List<&2, HM.MRec>})
    -> {HM.queued_for(s, n) == HM.queued_in(HM.St.msgs(s), HM.names_of(s, n)) : List<&2, HM.Msg>}:
  hub_via_hot(List<&2, HM.Msg>, x => HM.queued_in(x, HM.names_of(s, n)), HM.St.hot(s), HM.St.msgs(s),
    hub_qi_hot(HM.St.hot(s), HM.names_of(s, n)), hub_qi_hot(HM.St.msgs(s), HM.names_of(s, n)), h)
